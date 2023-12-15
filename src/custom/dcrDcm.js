import { createLocalJWKSet, decodeJwt, jwtVerify } from "jose";
import { getClientCertificate, getDirectorySigningKey, throwErrorRespose } from "../shared/utils.js";
import { config } from "../shared/config.js";

export const validateDCRInfo = async function (ctx, dbAdapter) {
    //validações de atributos do body
    isJwksAttributesCorrectlyDeclared(ctx);
    isSoftwareStatementAttributesDeclared(ctx);
    isUsingCorrectIdTokenEncAlg(ctx);
    isUsingCorrectAuthMethod(ctx);
    
    //validações do software statement
    isJwksAttributesMatching(ctx);
    isRedirectUrisMatching(ctx);
    isSoftwareStatementIdMatching(ctx);

    //validações que dependem de recursos externos (diretório, bd)
    await isSoftwareStatementSigned(ctx);
    await isEncKeyDeclared(ctx);
    if (ctx.request.method === 'POST') {
        await isClientAlreadyRegistered(ctx, dbAdapter);
    }

    //configura os escopos de acesso do cliente
    setScopes(ctx);
}

//Validação necessária porque na configuração foram liberados dois alg's ('RSA-OAEP' e 'dir'), porém DCR/DCM
//só pode acontecer com 'RSA-OAEP', pois o 'dir' foi liberado apenas para o usuário de introspection
const isUsingCorrectIdTokenEncAlg = function(ctx) {
    if (ctx.request.body?.id_token_encrypted_response_alg) {
        if (ctx.request.body?.id_token_encrypted_response_alg !== 'RSA-OAEP') {
            throwErrorRespose(ctx, 400, "invalid_client_metadata", "id_token_encrypted_response_alg must be 'RSA-OAEP'");
        }
    }
}

//Validação necessária porque na configuração foram liberados dois auth_methods ('private_key_jwt' e 'client_secret_basic'), porém DCR/DCM
//só pode acontecer com 'private_key_jwt', pois o 'client_secret_basic' foi liberado apenas para o usuário de introspection
const isUsingCorrectAuthMethod = function(ctx) {
    if (ctx.request.body?.token_endpoint_auth_method) {
        if (ctx.request.body?.token_endpoint_auth_method !== 'private_key_jwt') {
            throwErrorRespose(ctx, 400, "invalid_client_metadata", "token_endpoint_auth_method must be 'private_key_jwt'");
        }
    }
}

//Como a criptografia do id_token é obrigatória, valida-se se o cliente declarou ao menos uma chave do tipo enc
//no diretório de participantes para realização da criptografia
const isEncKeyDeclared = async function(ctx) {
    try {
        const response = await fetch(ctx.request.body?.jwks_uri);
        const responseJson = await response.json();
        const encKeys = responseJson.keys.filter(key => (key.use === 'enc'))
        if (encKeys.length === 0) {
            throwErrorRespose(ctx, 400, "invalid_client_metadata", "There is no encryption key declared on jwks_uri");
        }
    } catch (e) {
        console.log(e);
        throwErrorRespose(ctx, 400, "invalid_client_metadata", `The jwks_uri(${ctx.request.body?.jwks_uri}) address is unavailable`);
    }
}

//Verifica se já existe um cliente cadastrado fazendo uma consulta no BD utilizando o valor do atributo
//jwks_uri como chave de busca
const isClientAlreadyRegistered = async function(ctx, dbAdapter) {
    const client = await new dbAdapter("client").findClientByJwksUri(ctx.request.body?.jwks_uri);
    if (client) {
        throwErrorRespose(ctx, 400, "invalid_client_metadata", "There is another client already registered with this software statement id");
    }
}

//Verifica se o atributo jwks não está declarado e se o atributo jwks_uri está declarado
const isJwksAttributesCorrectlyDeclared = function (ctx) {
    if (ctx.request.body?.jwks) {
        throwErrorRespose(ctx, 400, "invalid_client_metadata", "The request must not have the jwks attribute. Only jwks_uri is allowed");
    } else if (!ctx.request.body?.jwks_uri) {
        throwErrorRespose(ctx, 400, "invalid_client_metadata", "Missing mandatory field: jwks_uri");
    }
}

//Verifica se o atributo software_statement está declarado
const isSoftwareStatementAttributesDeclared = function (ctx) {
    if (!ctx.request.body?.software_statement) {
        throwErrorRespose(ctx, 400, "invalid_client_metadata", "Missing mandatory field: software_statement");
    }
}

//Valida se o software statement foi assinado pelo diretório de participantes
const isSoftwareStatementSigned = async function (ctx) {
    const directorySigningKey = await getDirectorySigningKey(ctx);
    try {
        const jwks = createLocalJWKSet(directorySigningKey);
        await jwtVerify(ctx.request.body.software_statement, jwks, {
            clockTolerance: 5,
            maxTokenAge: 300,
            algorithms: ['PS256']
        });
    } catch (e) {
        throwErrorRespose(ctx, 400, "invalid_software_statement", e.message);
    }
}

//Verifica se o valor do atributo jwks_uri corresponde ao valor do atributo software_jwks_uri declarado
//dentro do software statement
const isJwksAttributesMatching = function (ctx) {
    const softwareStatementPayload = decodeJwt(ctx.request.body.software_statement);
    if (softwareStatementPayload.software_jwks_uri != ctx.request.body.jwks_uri) {
        throwErrorRespose(ctx, 400, "invalid_client_metadata", "The jwks_uri attribute value doesn't match with SSA software_jwks_uri attribute value");
    }
}

//Verifica se os valores do atributo redirect_uris está contido no atributo software_redirect_uris declarado
//dentro do software statement
const isRedirectUrisMatching = function(ctx) {
    const softwareStatementPayload = decodeJwt(ctx.request.body.software_statement);
    const isContained = ctx.request.body?.redirect_uris?.every(redirectUri => softwareStatementPayload.software_redirect_uris.includes(redirectUri));
    if (!isContained) {
        throwErrorRespose(ctx, 400, "invalid_client_metadata", "The redirect_uris attribute contains values that is not within SSA software_redirect_uris attribute");
    }
}

//Verifica se o valor do atributo UID do subject do certificado corresponde ao valor do atributo software_id declarado
//dentro do software statement
const isSoftwareStatementIdMatching = function(ctx) {
    const softwareStatementPayload = decodeJwt(ctx.request.body.software_statement);
    const x509ClientCert = getClientCertificate(ctx);
    
    if (softwareStatementPayload.software_id != x509ClientCert.toLegacyObject().subject['UID']) {
        throwErrorRespose(ctx, 400, "invalid_client_metadata", "The certificate UID is different from SSA software_id")
    }
}

//Se o atributo scope foi enviado, valida se todos os escopos requisitados estão incluídos nas roles declaradas no software statement
//Se o atributo scopes não foi enviado, concede todos os escopos incluídos nas roles declaradas no software statement
const setScopes = function(ctx) {
    const softwareStatementPayload = decodeJwt(ctx.request.body.software_statement);
    const declaredRoles = softwareStatementPayload.software_statement_roles.map((role) => { return (role.status == 'Active' ? role.role : null)});
    let allowedScopes = [...new Set(declaredRoles.map((role) => { return config.rolesAndScopes[role]}).flat())];
    
    if (ctx.request.body?.scope) {
        const requestedScopes = ctx.request.body.scope.split(' ');
        const grantedScopes = requestedScopes.filter(scope => allowedScopes.includes(scope));
        ctx.request.body.scope = grantedScopes.join(' ');
    } else {
        ctx.request.body.scope = allowedScopes.join(' ');
    }
}