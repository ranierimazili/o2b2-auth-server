import { config } from '../shared/config.js';

export const adjustWellKnownResponse = function (ctx) {
    setMtlsEndpoints(ctx);
    restrictResponseModesToFragment(ctx);
    restrictClientAuthMethodsToPrivateKeyJWT(ctx);
    restrictIdTokenEncryptionAlgValues(ctx);
    removeInstrospectionEndpoint(ctx);
}

//Muda o host dos endpoints que são protegidos por mTLS
const setMtlsEndpoints = function(ctx) {
    ['token', 'revocation', 'userinfo', 'device_authorization', 'pushed_authorization_request', 'registration'].forEach((endpoint) => {
        if (!ctx.body[`${endpoint}_endpoint`]) {
            return;
        }

        ctx.body[`${endpoint}_endpoint`] = ctx.body[`${endpoint}_endpoint`].replace(`https://${config.fqdn.noMtlsPrefix}`, `https://${config.fqdn.mtlsPrefix}`);
    });
}

//Restringe os tipos de response_mode para apenas fragment
const restrictResponseModesToFragment = function(ctx) {
    ctx.body.response_modes_supported = ['fragment'];
}

//Restringe os tipos de auth methods para apenas private_key_jwt
const restrictClientAuthMethodsToPrivateKeyJWT = function(ctx) {
    ctx.body.token_endpoint_auth_methods_supported = ['private_key_jwt'];
}

//Restringe os tipos de algoritmos de criptografia do id_token
const restrictIdTokenEncryptionAlgValues = function(ctx) {
    ctx.body.id_token_encryption_alg_values_supported = ['RSA-OAEP'];
}

//Remove da lista o endpoint de introspection, pois ele não precisa ser público
const removeInstrospectionEndpoint = function(ctx) {
    delete(ctx.body.introspection_endpoint);
}