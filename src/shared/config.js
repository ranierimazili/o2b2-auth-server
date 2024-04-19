import 'dotenv/config'

const getOrganisationScopes = function() {
    let scopes = ['openid','offline_access'];

    if (process.env?.SCOPES_PAYMENTS) {
        scopes = scopes.concat(process.env.SCOPES_PAYMENTS.split(","));
    }
    if (process.env?.SCOPES_MANDATORY_PHASE2) {
        scopes = scopes.concat(process.env.SCOPES_MANDATORY_PHASE2.split(","));
    }
    if (process.env?.SCOPES_OPTIONAL_PHASE2_ACCOUNTS) {
        scopes = scopes.concat(process.env.SCOPES_OPTIONAL_PHASE2_ACCOUNTS.split(","));
    }
    if (process.env?.SCOPES_OPTIONAL_PHASE2_CREDIT_CARDS) {
        scopes = scopes.concat(process.env.SCOPES_OPTIONAL_PHASE2_CREDIT_CARDS.split(","));
    }
    
    return scopes;
}

export const config = {
    port: process.env.PORT,
    env: process.env.NODE_ENV,
    issuer: process.env.ISSUER,
    directorySigningKeyUrl: process.env.NODE_ENV === "production" ? "https://keystore.directory.openbankingbrasil.org.br/openbanking.jwks" : "https://keystore.sandbox.directory.openbankingbrasil.org.br/openbanking.jwks",
    acr: process.env.ACR.split(","),
    scopes: getOrganisationScopes(),
    instrospection: {
        user: process.env.INTROSPECTION_USER,
        password: process.env.INTROSPECTION_PASS
    },
    frontend: {
        devModeEnabled: process.env.DEV_MOCK_FRONTEND === 'true',
        redirectUrl: process.env.FRONTEND_REDIRECT_URL
    },
    fqdn: {
        noMtlsPrefix: process.env.NO_MTLS_FQDN_PREFIX,
        mtlsPrefix: process.env.MTLS_FQDN_PREFIX
    },
    db: {
        type: process.env.DATABASE_TYPE,
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
                ,"payments"
        ],
        DADOS: ["openid"
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
        CONTA: [ "openid" ],
        CCORR: [ "openid" ]
    },
    protocol: process.env.PROTOCOL
}

