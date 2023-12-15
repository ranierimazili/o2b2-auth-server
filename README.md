# o2b2-auth-server
Este projeto tem como intuito ser um servidor de autorização que siga os padrões do Open Finance Brasil.

Esta aplicação é uma implementação do [node-oidc-provider](https://github.com/panva/node-oidc-provider) com as customizações necessárias para atender aos critérios definidos no [Perfil de Segurança do Open Finance Brasil](https://openfinancebrasil.atlassian.net/wiki/spaces/OF/pages/82051180/PT+Open+Finance+Brasil+Financial-grade+API+Security+Profile+1.0+Implementers+Draft+3)

## Como rodar o projeto

### Configurando os hosts
Para rodar este projeto, é preciso configurar dois FQDNs. Um para atender as chamadas sem mTLS e outro para atender as chamadas com mTLS. Para atender a este próposito localmente, a sugestão é a configuração destes hosts no arquivo hosts do seu sistema operacional. Neste exemplo utilizaremos o host https://as.localhost para atender as chamadas sem mTLS e o host https://mtls-as.localhost para atender as chamadas mTLS. 

**Edite o arquivo hosts deixando a linha do ip local (127.0.0.1) conforme exemplo abaixo**

*Windows: C:/Windows/System32/drivers/etc/hosts*
<br>
*Linux: /etc/hosts*
```
127.0.0.1       localhost as.localhost mtls-as.localhost
```

### Executando o projeto

```
npm install
npm run start
```

Para fins de desenvolvimento, a configuração dos hosts é o bastante e então os endpoints do servidor de autorização já estarão disponíveis para utilização. Os demais passos abaixo devem ser executados para servidores que precisem armazenar permanentemente as informações e que precisem compartilhar as chaves entre múltiplos nós em um cluster.

Caso queira realizar testes utilizando o Postman, você pode seguir as instruções apresentadas [aqui](postman/README.md).

Caso encontre alguma dificuldade, [fiz um video mostrando a execução em ambiente local](https://youtu.be/-LUmtya5Jg0).

Se você está fazendo um deploy completo, com proxy, api's, testes da OpenID, [essa lista de videos pode te ajudar](https://www.youtube.com/watch?v=-Xe28646EJI&list=PLD65W7Hux8xbtEIYVPRoNlkNSodXfZqbs)

### Configurando os certificados de criptografia e assinatura
Para que o servidor seja iniciado, é necessário configurar as chaves que serão utilizadas para criptografia e assinatura dos tokens gerados pelo servidor de autorização.

Estas chaves não precisam ser emitidas por autoridades certificadoras, podem ser certificados auto-assinados.

Caso você possua certificados e deseja utiliza-los para este propósito, basta copiar a chave privada para os diretórios **certs/enc**(criptografia) e **certs/sig**(assinatura).
<br>*Obs: Copie apenas a chave privada para os diretórios*

Para fins de desenvolvimento, caso os diretórios **certs/enc** e **certs/sig** não contenham as chaves privadas, chaves auto-assinadas serão geradas em tempo de execução para levantar o servidor.
<br>**ATENÇÃO:** Nessa situação as chaves irão mudar a cada restart do servidor, portanto access_tokens e afins não irão funcionar após o restart e este tipo de solução não funciona em cenários de cluster ou kubernetes pois não haverá compartilhamento de chaves entre os servidores do cluster. 

Caso você não possua certificados, você pode entrar nos diretórios **certs/sig** e **certs/enc** e criar o certificado com o comando abaixo:
```
$ openssl genrsa -out private.pem 2048
```

### Configurando os certificados do host
Para que o servidor seja iniciado, é necessário configurar as chaves que serão utilizadas para TLS do host.

Estas chaves não precisam ser emitidas por autoridades certificadoras, podem ser certificados auto-assinados.

Para fins de desenvolvimento, caso o diretório **certs/host** não contenha a chave privada (private.pem) e o certificado (cert.pem), chaves auto-assinadas serão geradas em tempo de execução para o host *.localhost para atender requisições em https://as.localhost e https://mtls-as.localhost.

Caso queira gerar certificados auto-assinados para outro hostname, siga os passos apresentados [aqui](certs/host/README.md).

### Configurando as varíaveis de ambiente
Edite o arquivo **.env** conforme instruções presentes no mesmo. Para fins de desenvolvimento local, não é necessário qualquer mudança no arquivo pois o mesmo está com valores padrões para rodar em localhost.
<br>**ATENÇÃO:** Por padrão o arquivo está configurado para utilizar um banco de dados em memória, portanto os dados são perdidos após cada reinicialização. Os bancos de dados AWS DynamoDB e MongoDB são suportados e os parâmetros de conexão devem ser informados no arquivo .env. 
<br>Caso queira utilizar AWS Dynamo DB, siga as instruções de configuração da tabela apresentadas [aqui](src/persistence/README.md).

## Endpoints expostos
Após executar o projeto, os endpoints abaixo estarão disponíveis

### Endpoints sem mTLS
- https://as.localhost:3000/.well-known/openid-configuration (well-known)
- https://as.localhost:3000/auth (authorization)
- https://as.localhost:3000/jwks (jwks)

### Endpoints com mTLS
- https://mtls-as.localhost:3000/reg (registration)
- https://mtls-as.localhost:3000/token (token)
- https://mtls-as.localhost:3000/request (par)
- https://mtls-as.localhost:3000/me (userinfo)

### Endpoints internos
- https://as.localhost:3000/token/introspection (introspection)
- https://as.localhost:3000/clients/{client_id} (obter detalhes do consentimento)
- https://as.localhost:3000/sessions/{session_id} (obter detalhes da sessão)
- https://as.localhost:3000/approveConsent/{session_id} (aprovar consentimento)
- https://as.localhost:3000/rejectConsent/{session_id} (rejeitar consentimento)

A documentação dos endpoints internos pode ser consultada [aqui (swagger editor)](https://editor.swagger.io/?url=https://raw.githubusercontent.com/ranierimazili/o2b2-auth-server/main/apis_internas.yaml).

## Projetos relacionados
Para rodar este projeto de forma completa, você precisará de no mímino mais dois componentes.
Uma ferramenta para realizar o proxy e validação do mTLS e
API's implementadas de Open Finance (ex: [payments](https://openfinancebrasil.atlassian.net/wiki/spaces/OF/pages/17375943/API+-+Pagamentos) ou [accounts](https://openfinancebrasil.atlassian.net/wiki/spaces/OF/pages/17371726/API+-+Contas)).

Para fins de demonstração, dois projetos auxiliares foram criados para atender as duas necessidades acima:
- [o2b2-proxy](https://github.com/ranierimazili/o2b2-proxy) - Exemplo de configuração de um servidor Nginx para atender aos padrões do Open Finance Brasil
- [o2b2-payment-apis](https://github.com/ranierimazili/o2b2-payment-apis) - Exemplo de implementação básica da API de Iniciação de Pagamentos do Open Finance Brasil

Com o deploy dos componentes acima é possível realizar as certificações da OpenID Foundation para os perfis de Authorization Server e DCR.

## Testes da OpenID
Evidência de execução dos testes de Authorization Server e DCR
![testes_open_id](https://github.com/ranierimazili/o2b2-auth-server/assets/15436207/c0957b8b-9c42-444b-9c47-c25a563739ab)
