# Endpoints expostos
Após executar o projeto, os endpoints abaixo estarão disponíveis. Caso o servidor esteja sendo executado no modo desenvolvedor, todos os endpoints podem estar disponíveis em https://localhost:3000/<endpoint>. Do contrário, alguns poderão estar em subdomínios diferentes ou disponíveis apenas internamente.

### Endpoints sem mTLS
- /.well-known/openid-configuration (well-known)
- /auth (authorization)
- /jwks (jwks)

### Endpoints com mTLS
- /reg (registration)
- /token (token)
- /request (par)
- /me (userinfo)

### Endpoints internos
- /token/introspection (introspection)
- /clients/{client_id} (obter detalhes do client)
- /sessions/{session_id} (obter detalhes da sessão)
- /approveConsent/{session_id} (aprovar consentimento)
- /rejectConsent/{session_id} (rejeitar consentimento)
- /healthcheck
- /import/client
- /import/refreshTokens

A documentação dos endpoints internos pode ser consultada [aqui (swagger editor)](https://editor.swagger.io/?url=https://raw.githubusercontent.com/ranierimazili/o2b2-auth-server/main/apis_internas.yaml).

TODO documentar o /healthcheck e endpoints de migração no swagger