import { getJwksKeys } from "./jwks.js";
import { config } from "../shared/config.js";
import { customPolicy } from "../custom/consentPolicy.js"
import { getClientCertificate } from "../shared/utils.js";

const jwks = await getJwksKeys();

export const configuration = {
    //Cliente interno para realizar introspection de tokens no resource server/api gateway/etc...
	clients: [{
		client_id: config.instrospection.user,
		client_secret: config.instrospection.password,
		grant_types: [],
		redirect_uris: [],
		response_types: [],
		token_endpoint_auth_method: 'client_secret_basic',
		id_token_encrypted_response_alg: 'dir',
  		id_token_encrypted_response_enc: 'A256GCM'
    }],
	//Campos exclusivos do DCR/DCM do Open Finance Brasil
    extraClientMetadata: {
		properties: ['software_statement', 'webhook_uris']
    },
	//client_secret_basic foi mantido por causa do usuário de introspection, mas essa opção
	//é ocultada no well-known e negada o registro via DCR/DCM com esse método
    clientAuthMethods: ["private_key_jwt", "client_secret_basic"],
    enabledJWA: {
		clientAuthSigningAlgValues: ["PS256"]
		//Alg 'dir' foi mantido por causa do usuário de introspection, mas essa opção é
		//ocultada no well-known e negada o registro via DCR/DCM com esse alg
		,idTokenEncryptionAlgValues: ["RSA-OAEP", "dir"]
		,idTokenEncryptionEncValues: ["A256GCM"]
		,idTokenSigningAlgValues: ["PS256"]
		,requestObjectEncryptionAlgValues: ["RSA-OAEP"]
		,requestObjectEncryptionEncValues: ["A256GCM"]
		,requestObjectSigningAlgValues: ["PS256"]
    },
    responseTypes: ["code id_token"],
    features: {
		devInteractions: {
			enabled: config.frontend.devModeEnabled
		},
		fapi: {
			enabled: true,
			profile: "1.0 Final"
		},
		claimsParameter: {
			enabled: true
		},
		//mTLS habilitado para vínculo do access_token com o certificado do cliente
		mTLS: {
			enabled: true,
			certificateBoundAccessTokens: true,
			getCertificate(ctx) {
				try {
					const x509ClientCert = getClientCertificate(ctx);
					return x509ClientCert;
				} catch (e) {
					console.log("Não foi possível carregar o certificado do cliente para associa-lo ao token", e);
					return undefined;
				}
			}
		},
		pushedAuthorizationRequests: {
			enabled: true,
			requirePushedAuthorizationRequests: true
		},
		encryption: {
			enabled: true
		},
		registration: {
			enabled: true,
			initialAccessToken: false,
			issueRegistrationAccessToken: true,
		},
		registrationManagement: {
			enabled: true,
			rotateRegistrationAccessToken: false
		},
		clientCredentials: {
			enabled: true
		},
		requestObjects: {
			mode: 'strict',
			request: true,
			requireSignedRequestObject: true
		},
		introspection: {
			enabled: true,
			allowedPolicy: async function(ctx, client, token) {
				//Apenas o usuário configurado para introspection consegue realizar a chamada
				return client.clientId === config.instrospection.user;
			}
		},
		rpInitiatedLogout: {
			enabled: false
		}
    },
    scopes: config.scopes,
    acrValues: config.acr,
    jwks,
    clientDefaults: {
    	id_token_signed_response_alg: 'PS256',
		id_token_encrypted_response_alg: 'RSA-OAEP',
  		id_token_encrypted_response_enc: 'A256GCM',
  		tls_client_certificate_bound_access_tokens: true,
		token_endpoint_auth_method: 'private_key_jwt',
		response_types: ['code id_token'],
		grant_types: ['authorization_code','implicit','refresh_token','client_credentials'],
		application_type: 'web'
    },
    pkce: {
    	methods: ['S256']
    },
    interactions: {
    	url: async function(ctx, interaction) {
			const consentId = interaction.params.scope.split(" ").filter(scope => (scope.startsWith("consent:")))[0];
			const url = config.frontend.redirectUrl.replace("{sessionId}",interaction.uid).replace("{consentId}", consentId);
			return url;
      	},
		//Aplica uma politica customizada para facilitar a aprovação/rejeição de consentimento por API
		//quando não estiver em modo desenvolvedor (DEV_MOCK_FRONTEND === false)
		policy: customPolicy
    },
	ttl: {
		//5 minutos é o tempo limite para troca do authorization_code pelo refresh_token
		AuthorizationCode: 300,
		//access_token com validade de 15 minutos (máximo permitido pelo OFB)
		AccessToken: function AccessTokenTTL(ctx, token, client) {
			return 900;
		},
		//access_token com validade de 15 minutos (máximo permitido pelo OFB)
		ClientCredentials: function(ctx, token, client) {
			return 900;
		},
		//TODO: validar se todo refresh_token precisar ser colocado como undefined (sem prazo de validade)
		RefreshToken: function(ctx, token, client) {
			return undefined;
		}
	},
	issueRefreshToken: async function(ctx, client, code) {
		if (client.clientAuthMethod === 'private_key_jwt') {
			return true;
		}
		return false;
	},
	rotateRefreshToken: false
  };