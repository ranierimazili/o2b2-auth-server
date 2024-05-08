import 'dotenv/config'

const getOrganisationScopes = function() {
    return ['openid','offline_access'].concat(process.env.SCOPES.split(","));
}

export const config = {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'local',
    issuer: process.env.ISSUER || `${process.env.PROTOCOL}://localhost`,
    directorySigningKeyUrl: process.env.NODE_ENV === "production" ? "https://keystore.directory.openbankingbrasil.org.br/openbanking.jwks" : "https://keystore.sandbox.directory.openbankingbrasil.org.br/openbanking.jwks",
    acr: process.env.ACR.split(","),
    scopes: getOrganisationScopes(),
    instrospection: {
        user: process.env.INTROSPECTION_USER || 'admin',
        password: process.env.INTROSPECTION_PASS || 'admin'
    },
    frontend: {
        devModeEnabled: process.env.DEV_MOCK_FRONTEND ? process.env.DEV_MOCK_FRONTEND === 'true' : 'true',
        redirectUrl: process.env.FRONTEND_REDIRECT_URL
    },
    fqdn: {
        noMtlsPrefix: process.env.NO_MTLS_FQDN_PREFIX,
        mtlsPrefix: process.env.MTLS_FQDN_PREFIX
    },
    db: {
        type: process.env.DATABASE_TYPE || 'memorydb',
        mongodb: {
            uri: process.env?.MONGODB_URI
        },
        dynamodb: {
            region: process.env?.AWS_DEFAULT_REGION,
            tableName: process.env?.DYNAMODB_TABLE_NAME
        }
    },
    rolesAndScopes: {
        PAGTO: ["openid"
                ,"offline_access"        
                ,"payments"
                ,"recurring-payments"
        ],
        DADOS: ["openid"
                ,"offline_access"
                ,"accounts"
                ,"credit-cards-accounts"
                ,"consents"
                ,"customers"
                ,"invoice-financings"
                ,"financings"
                ,"loans"
                ,"unarranged-accounts-overdraft"
                ,"resources"
                ,"credit-fixed-incomes"
                ,"exchanges"
                ,"bank-fixed-incomes"
                ,"variable-incomes"
                ,"treasure-titles"
                ,"funds"
        ],
        CONTA: [ "openid", "offline_access" ],
        CCORR: [ "openid", "offline_access" ]
    },
    protocol: process.env.PROTOCOL || 'https'
}

