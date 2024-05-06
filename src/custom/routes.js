import instance from "oidc-provider/lib/helpers/weak_cache.js";

//Caso o endpoint que esteja sendo chamado seja um endpoint customizado, retorna um identificador do endpoint,
//caso contrário (endpoint sem customizações) retorna null
export const getCustomRouteName = function(ctx) {
    if (ctx.path.startsWith("/clients/") && ctx.request.method === 'GET')
        return 'getClient';
    else if (ctx.path.startsWith("/sessions/") && ctx.request.method === 'GET')
        return 'getSession';
    else if (ctx.path.startsWith("/approveConsent") && ctx.request.method === 'POST')
        return 'approveConsent';
    else if (ctx.path.startsWith("/rejectConsent") && ctx.request.method === 'POST')
        return 'rejectConsent';
    else if (ctx.path.startsWith("/reg") && ["POST", "PUT"].includes(ctx.request.method))
        return 'createOrUpdateClient'
    else if (ctx.path.startsWith("/import/client") && ["POST"].includes(ctx.request.method))
        return 'importClient'
    else if (ctx.path.startsWith("/import/refreshTokens") && ["POST"].includes(ctx.request.method))
        return 'importRefreshTokens'
    else if (ctx.path.startsWith("/healthcheck") && ["GET"].includes(ctx.request.method))
        return 'healthcheck'

    return null;
}

export const processCustomRouteCall = async function(ctx, provider, routeName) {
    switch(routeName) {
		case 'getClient':
			await getClient(ctx, provider);
			break;
        case 'getSession':
            await getSession(ctx, provider);
            break;
        case 'approveConsent':
            await approveConsent(ctx, provider);
            break;
        case 'rejectConsent':
            await rejectConsent(ctx, provider);
            break;
        case 'importClient':
            await importClient(ctx, provider);
            break;
        case 'importRefreshTokens':
            await importRefreshTokens(ctx, provider);
            break;
        case 'healthcheck':
            await healthcheck(ctx, provider);
            break;
    }
}

//Endpoint de healthcheck
export const healthcheck = async function (ctx, provider) {
      ctx.status = 200;
      ctx.body = "I am alive";
}

//Retorna os dados do cliente
export const getClient = async function (ctx, provider) {
    try {
        const clientId = ctx.path.split('/')[2];
        const client = await provider.Client.find(clientId);
        if (client) {
            ctx.body = client;
        } else {
            ctx.status = 404;
            ctx.body = { error: 'Client not found' };
        }
    } catch (e) {
      ctx.status = 500;
      ctx.body = e;
    }
}

//Retorna os dados da sessão
export const getSession = async function(ctx, provider) {
    setSessionIdOnCookieHeader(ctx);
    
    const details = await provider.interactionDetails(ctx.req, ctx.res);
    ctx.status = 200;
    ctx.body = details;
}

//Aprova o consentimento, configurando os parametros que serão colocados no access_token e id_token
export const approveConsent = async function (ctx, provider) {
    setSessionIdOnCookieHeader(ctx);
    const requestBody = ctx.request.body;
    const session = await provider.interactionDetails(ctx.req, ctx.res);

    let grant = new provider.Grant({
        accountId: requestBody.accountId,
        clientId: session.params.client_id,
    });
    grant.addOIDCScope(session.params.scope);
    const grantId = await grant.save();

    const result = {
        login: requestBody,
        consent: {
            grantId
        }
    }

    const redirectTo = await provider.interactionResult(ctx.req, ctx.res, result, { mergeWithLastSubmission: true }) ;
    ctx.body = { redirectTo };
    ctx.status = 200;
}

//Rejeita o consentimento
export const rejectConsent = async function(ctx, provider) {
    const result = ctx.request.body;
    setSessionIdOnCookieHeader(ctx);
    const redirectTo = await provider.interactionResult(ctx.req, ctx.res, result, { mergeWithLastSubmission: true });
    ctx.body = { redirectTo };
    ctx.status = 200;
}

//Importa o cliente
export const importClient = async function (ctx, provider) {
    try {
        const missingAttributesMessage = checkRegistrationImportMandatoryAttributes(ctx.request.body);
        if (missingAttributesMessage) {
            ctx.status = 400;
            ctx.body = { message: missingAttributesMessage };
        } else {
            //Salva o cliente no BD
            const clientPayload = buildClientPayload(ctx.request.body);
            const client = await instance(provider).clientAdd(clientPayload, { store: true, ctx });

            //Salva o registration_access_token associado ao cliente no BD
            let rat = new provider.RegistrationAccessToken({ clientId: clientPayload.client_id });
            rat.jti = clientPayload.registration_access_token;
            await rat.save();
            
            ctx.status = 201;
            ctx.body = client.metadata();
        }
    } catch (e) {
        console.log(e)
        ctx.status = 500;
        ctx.body = e;
    }
}

const checkRegistrationImportMandatoryAttributes = function(payload) {
    const mandatoryAttributes = [
        'client_id',
        'jwks_uri',
        'redirect_uris',
        'scope',
        'registration_access_token'
    ];

    const missingAttributes = mandatoryAttributes.filter(attribute => !(attribute in payload));

    if (missingAttributes.length > 0) {
        return `Missing mandatory attributes: ${missingAttributes.join(', ')}`;
    } else {
        return null;
    }
}

const buildClientPayload = function(payload) {
    let finalPayload = {
        application_type: payload?.application_type || "web",
        grant_types: [
            "authorization_code",
            "implicit",
            "refresh_token",
            "client_credentials"
        ],
        id_token_signed_response_alg: "PS256",
        require_auth_time: false,
        response_types: [
            "code id_token"
        ],
        subject_type: "public",
        token_endpoint_auth_method: "private_key_jwt",
        require_signed_request_object: true,
        require_pushed_authorization_requests: true,
        id_token_encrypted_response_alg: "RSA-OAEP",
        id_token_encrypted_response_enc: "A256GCM",
        tls_client_certificate_bound_access_tokens: true,
        client_id_issued_at: payload?.client_id_issued_at || Math.floor((Date.now()) / 1000),
        client_id: payload.client_id,
        jwks_uri: payload.jwks_uri,
        redirect_uris: payload.redirect_uris,
        scope: payload.scope,
        registration_access_token: payload.registration_access_token
    }

    if (payload.software_statement) {
        finalPayload.software_statement = payload.software_statement;
    }

    if (payload?.webhook_uris) {
        finalPayload.webhook_uris = payload.webhook_uris;
    }

    return finalPayload;
}

//Importa os refresh_tokens de um client
export const importRefreshTokens = async function (ctx, provider) {
    try {
        const client = await provider.Client.find(ctx.request.body.client_id);
        if (!client) {
            ctx.status = 400;
            ctx.body = {error: `Client ${ctx.request.body.client_id} not found`};
        } else {
            for (let i=0;i<ctx.request.body.refresh_tokens.length;i++) {
                const grant = new provider.Grant({
                    accountId: ctx.request.body.refresh_tokens[i].account_id,
                    clientId: client.clientId,
                    openid: {
                        scope: ctx.request.body.refresh_tokens[i].scope
                    }
                })
                const grantId = await grant.save();

                const refreshToken = new provider.RefreshToken({
                    accountId: ctx.request.body.refresh_tokens[i].account_id,
                    grantId,
                    client,
                    gty: 'authorization_code',
                    scope: ctx.request.body.refresh_tokens[i].scope,
                    jti: ctx.request.body.refresh_tokens[i].refresh_token
                });
                await refreshToken.save();
            }
            ctx.status = 200;
            ctx.body = {"success":`${ctx.request.body.refresh_tokens.length} token(s) imported`};
        }
    } catch (e) {
        console.log(e)
        ctx.status = 500;
        ctx.body = e;
    }
}

//As chamadas do node-oidc-provider utilizam como parâmetro o conteúdo
//do cookie. A função abaixo transforma o atributo recebido no path
//no cookie utilizado pelo node-oidc-provider
const setSessionIdOnCookieHeader = function(ctx) {
    const sessionId = ctx.req.url.split('/').reverse()[0]
    ctx.req.headers.cookie = `_interaction=${sessionId}`;
}