# Parâmetros de configuração

- [Serviço](#serviço)
    - [NODE_ENV](#node_env)
    - [PORT](#port)
    - [PROTOCOL](#protocol)

- [Domínios](#domínios)
    - [NO_MTLS_FQDN_PREFIX](#no_mtls_fqdn_prefix)
    - [MTLS_FQDN_PREFIX](#mtls_fqdn_prefix)
    - [ISSUER](#issuer)

- [Segurança](#segurança)
    - [ACR](#acr)

- [Escopos](#escopos)
    - [SCOPES_PAYMENTS](#scopes_payments)
    - [SCOPES_MANDATORY_PHASE2](#scopes_mandatory_phase2)
    - [SCOPES_OPTIONAL_PHASE2_ACCOUNTS](#scopes_optional_phase2_accounts)
    - [SCOPES_OPTIONAL_PHASE2_CREDIT_CARDS](#scopes_optional_phase2_credit_cards)

- [Introspecção de tokens](#introspecção-de-tokens)
    - [INTROSPECTION_USER](#introspection_user)
    - [INTROSPECTION_PASS](#introspection_pass)

- [Frontend](#frontend)
    - [DEV_MOCK_FRONTEND](#dev_mock_frontend)
    - [FRONTEND_REDIRECT_URL](#frontend_redirect_url)

- [Banco de Dados](#banco-de-dados)
    - [DATABASE_TYPE](#database_type)

    - [Amazon DynamoDB](#amazon-dynamodb)
        - [DYNAMODB_TABLE_NAME](#dynamodb_table_name)
        - [AWS_ACCESS_KEY_ID](#aws_access_key_id)
        - [AWS_SECRET_ACCESS_KEY](#aws_secret_access_key)
        - [AWS_DEFAULT_REGION](#aws_default_region)

    - [MongoDB](#mongodb)
        - [MONGODB_URI](#mongodb_uri)


# Serviço
As variáveis abaixo controlam algumas características de rede de quando o serviço é iniciado

### NODE_ENV
Define o tipo de ambiente utilizado no serviço. O valor desta variável impacta no endpoint utilizado para validação de assinatura do software statement assertion.
* local - Utiliza os endpoints de sandbox para validação de assinatura do software statement assertion
* production - Utiliza os endpoints de produção para validação de assinatura do software statement assertion

**Valor padrão:**
```
local
```

### PORT
Porta de rede que será utilizada para iniciar o serviço

**Valor padrão:**
```
3000
```

### PROTOCOL
Protolo que será utilizado para iniciar o serviço
* 'http' 
* 'https'

**Valor padrão:**
```
https
```

# Domínios
As variáveis abaixo definem os subdomínios que serão declarados no endpoint well-known.

Para a configuração de um ambiente Open Finance Brasil, você irá precisar de 2 FQDN's:
* FQDN sem mTLS: é o endereço que atenderá alguns endpoints que não podem ser protegidos, pois são de acesso público.
<br>Ex: well-known e authorization_endpoint
* FQDN com mTLS: é o endereço que atenderá as requisições bilateriais entre os participantes do Open Finance:
<br>Ex: registration_endpoint, token_endpoint e API's


Considerando que seu FQDN raiz seja https://enderecodoseubancoaqui.com.br e você quer atender as requisições sem mTLS no endereço
https://as.enderecodoseubancoaqui.com.br e as requisições com mTLS no endereço https://mtls-as.enderecodoseubancoaqui.com.br, os valores
das variáveis NO_MTLS_HOST_PREFIX e MTLS_HOST_PREFIX deveriam ser 'as' e 'mtls-as' respectivamente.

### NO_MTLS_FQDN_PREFIX
Prefixo para endpoints não-mTLS

**Valor padrão:**
```
undefined
```

### MTLS_FQDN_PREFIX
Prefixo para endpoints mTLS

**Valor padrão:**
```
undefined
```

### ISSUER
O endereço do issuer deve ser o FQDN não-mTLS.
<br>_Ex: https://as.enderecodoseubancoaqui.com.br_

Esta variável deve ser preenchida obrigatóriamente caso as variáveis NO_MTLS_FQDN_PREFIX ou MTLS_FQDN_PREFIX tenham sido informadas.

**Valor padrão:**
```
<PROTOCOL>://localhost
```
Onde \<PROTOCOL> é protocolo escolhido através da variável [PROTOCOL](#protocol)

# Segurança
As variáveis abaixo indicam o nível de segurança utilizado na autenticação do cliente

### ACR
Indica as possibilidades de nível de autenticação da instituição financeira.
* urn:brasil:openbanking:loa2 - Autenticação realizada sem utilização de MFA
* urn:brasil:openbanking:loa3 - Autenticação realizada com uso de MFA

Em caso de utilização de mais de um valor, eles devem estar separados por vírgula

**Valor padrão:**
```
urn:brasil:openbanking:loa2,urn:brasil:openbanking:loa3
```

# Escopos
No Open Finance Brasil as API's atualmente estão divididas em duas grandes categorias (Pagamento e Dados de Cliente). Cada categoria possui os escopos para proteção de seus endpoints

### SCOPES_PAYMENTS
Escopos de pagamento
* payments - Escopo utilizado pela API de Pagamento para pagamentos imediatos e agendados (não recorrentes)
* recurring-payments - Escopo utilizado pela API de Pagamento para pagamentos recorrentes (Transferências Inteligentes, Pix Automático)

Em caso de utilização de mais de um valor, eles devem estar separados por vírgula

**Valor padrão:**
```
payments,recurring-payments
```

### SCOPES_MANDATORY_PHASE2
Escopos obrigatórios de Dados de Cliente

* consents - Escopo utilizado pela API de Consentimento
* resources - Escopo utilizado pela API de Recursos
* customers - Escopo utilizado pela API de Dados Cadastrais
* invoice-financings - Escopo utilizado pela API de Operações de Crédito - Direitos Creditórios Descontados
* financings - Escopo utilizado pela API de Operações de Crédito - Financiamento
* loans - Escopo utilizado pela API de Operações de Crédito - Empréstimos
* unarranged-accounts-overdraft - Escopo utilizado pela API de Operações de Crédito - Adiamento a Depositantes
* bank-fixed-incomes - Escopo utilizado pela API de Investimentos - Renda Fixa Bancária
* credit-fixed-incomes - Escopo utilizado pela API de Investimentos - Renda Fixa Crédito
* variable-incomes - Escopo utilizado pela API de Investimentos - Renda Variável
* treasure-titles - Escopo utilizado pela API de Investimentos - Títulos do Tesouro Direto
* funds - Escopo utilizado pela API de Investimentos - Fundos de Investimento
* exchanges - Escopo utilizado pela API de Câmbio

Em caso de utilização de mais de um valor, eles devem estar separados por vírgula

**Valor padrão:**
```
consents,resources,invoice-financings,financings,loans,unarranged-accounts-overdraft,bank-fixed-incomes,credit-fixed-incomes,variable-incomes,treasure-titles,funds,exchanges,customers
```

### SCOPES_OPTIONAL_PHASE2_ACCOUNTS
Escopo de contas

* accounts - Escopo utilizado pela API de Contas

**Valor padrão:**
```
accounts
```

### SCOPES_OPTIONAL_PHASE2_CREDIT_CARDS
Escopo de cartão de crédito

* accounts - Escopo utilizado pela API de Cartão de Crédito

**Valor padrão:**
```
credit-cards-accounts
```

# Introspecção de tokens
Usuário e senha utilizado para realizar a introspecção de tokens

### INTROSPECTION_USER
**Valor padrão:**
```
admin
```
### INTROSPECTION_PASS
**Valor padrão:**
```
admin
```

# Frontend
Quando o endpoint de autorização é chamado, o Authorization Server irá redirecionar o cliente para o canal (frontend) da instituição financeira para que o cliente faça a avaliação do consentimento e sua aprovação/rejeição.

### DEV_MOCK_FRONTEND
Indica se o frontend de exemplo (mock) deve ser utilização para avaliação (aprovação/rejeição) do consentimento

**Valor padrão:**
```
true
```
### FRONTEND_REDIRECT_URL
Indica a URL para qual o endpoint de autorização deve redirecionar o cliente.

Caso a variável _DEV_MOCK_FRONTEND_ seja configurado como _false_, a variável FRONTEND_REDIRECT_URL deve ser obrigatoriamente informada.

Na URL devem ser adicionados os atributos abaixo (entre chaves) para que o canal possa obter os detalhes do consentimento:

**sessionId** (obrigatório) - ID da sessão criada para gerenciar o consentimento do cliente. Os dados da sessão podem ser obtidos através do endpoint [/sessions/{session_id}](endpoints.md#endpoints-internos).

**consentId** (opcional) - ID de consentimento a qual o redirecionamento se refere. Esta informação está disponível quando se consulta os dados da sessão através do endpoint [/sessions/{session_id}](endpoints.md#endpoints-internos).

Exemplos de valores
- Sessão como path parameter e consentimento como query parameter
    - https://enderecodoseubancoaqui.com.br/{sessionId}?consent_id={consentId}
- Sessão e consentimento como query parameter
    - https://enderecodoseubancoaqui.com.br?session_id={sessionId}&consent_id={consentId}
- Apenas sessão como path
    - https://enderecodoseubancoaqui.com.br/{sessionId}

**Valor padrão:**
```
undefined
```

# Banco de Dados
### DATABASE_TYPE
Tipo de banco de dados utilizado
* memorydb - Para desenvolvimento. Os itens serão mantidos na memória.
* dynamodb - AWS DynamoDB. Preencha também as variáveis abaixo da sessão [Amazon DynamoDB](#amazon-dynamodb)
* mongodb - MongoDB. Preencha também as varíaveis abaixo da sessão [MongoDB](#mongodb)

**Valor padrão:**
```
memorydb
```

### Amazon DynamoDB
Variáveis para conexão com AWS DynamoDB

**As instruções de configuração da tabela no DynamoDB estão apresentadas [aqui](../src/persistence/README.md).**

- #### DYNAMODB_TABLE_NAME
    Nome da tabela na instância do AWS DynamoDB
    
    **Valor padrão:**
    ```
    undefined
    ```
- #### AWS_ACCESS_KEY_ID
    Access Key ID para acesso a instância do AWS DynamoDB
    
    **Valor padrão:**
    ```
    undefined
    ```
- #### AWS_SECRET_ACCESS_KEY
    Secret Access Key para acesso a instância do AWS DynamoDB
    
    **Valor padrão:**
    ```
    undefined
    ```
- #### AWS_DEFAULT_REGION
    Região onde a AWS DynamoDB foi provisionada
    
    **Valor padrão:**
    ```
    undefined
    ```

### MongoDB
Variáveis para conexão com MongoDB
- #### MONGODB_URI
    URL de conexão com o MongoDB no formato monbodb://\<user>:\<password>@\<hostname>:\<port>/\<database>

    **Valor padrão:**
    ```
    undefined
    ```