# AWS Dynamo DB
Cria uma tabela no AWS Dynamo DB seguindo as diretrizes abaixo.

## Tabela
Dê qualquer nome de sua preferência a tabela e defina a **Partition key** com o valor **modelId** (String).

Após a criação da tabela, faça as configurações abaixo. 

## Índices
Abra os detalhes da tabela, vá na aba *Indexes* e crie os quatro índices conforme detalhes abaixo:

| Partition key | Data type | Index name    | Attribute projections |
|---------------|-----------|---------------|-----------------------|
| grantId       | String    | grantIdIndex  | All                   |
| jwksUri       | String    | jwksUriIndex  | Keys only             |
| uid           | String    | uidIndex      | All                   |
| userCode      | String    | userCodeIndex | All                   |

## TTL
Abra os detalhes da tabela, vá na aba *Additional settings* e na sesão *Time to live (TTL)* clique no botão *Turn on* e preencha o campo **TTL attribute name** com o valor **expiresAt** e finalize clicando no botão *Turn on TTL*.