# Configurando o o2b2-auth-server no modo produção

> **Modo produção**: Para uso em ambientes em sandbox e produção, geralmente com um proxy (ex: Nginx) aplicando políticas distintas por tipo de endpoint e realização de mTLS quando necessário.

Para se ter um ambiente produtivo, ou com característica similares (sandbox/homologação), é necessário realizar algumas configurações específicas para que o ambiente atenda a todos os critérios de segurança do Open Finance Brasil. As instruções abaixo detalham as configurações típicas de um servidor produtivo e como realizar estas configurações no o2b2-auth-server.

## Índice

- [Configurando os hosts](#configurando-os-hosts)
- [Configurando os certificados de criptografia e assinatura](#configurando-os-certificados-de-criptografia-e-assinatura)
- [Configurando as varíaveis de ambiente](#configurando-as-varíaveis-de-ambiente)
- [Executando o projeto](#executando-o-projeto)
- [Testando o Authorization Server](#testando-o-authorization-server)

## Configurando os hosts
Em um ambiente Open Finance, são necessários no mínimo dois subdomínios, um para atendimento as chamadas **sem mTLS** e outro para atendimento as chamadas **com mTLS**.

### Subdomínio sem mTLS
Neste subdomínio são expostos os [endpoints públicos](../endpoints.md#endpoints-sem-mtls), ou seja, qualquer pessoa pode acessar estes endpoints diretamente pelo seu browser.<br>
Considerando que o domínio da sua instituição seja enderecodoseubanco.com.br, seguem algumas sugestões do que você poderia usar como subdomínio sem mTLS.
 - as.enderecodoseubanco.com.br (onde 'as' significa Authorization Server)
 - openbanking-api.enderecodoseubanco.com.br
 - openbanking.enderecodoseubanco.com.br

### Subdomínio com mTLS
Neste subdomínio são expostos os [endpoints privados](../endpoints.md#endpoints-com-mtls), ou seja, endpoints que só permitem comunicação quando provenientes de outra instituição financeira, que irá apresentar seu certificado emitido por uma Autoridade Certificadora homologada pelo Open Finance para estabelecimento da conexão.
Considerando que o domínio da sua instituição seja enderecodoseubanco.com.br, seguem algumas sugestões do que você poderia usar como subdomínio com mTLS.
 - mtls-as.enderecodoseubanco.com.br (onde 'mtls-as' significa mTLS Authorization Server)
 - openbanking-mtls-api.enderecodoseubanco.com.br
 - openbanking-mtls.enderecodoseubanco.com.br

### Configurando os subdomínios
Os subdomínios geralmente são configurados diretamente no proxy que atende as requisições e, uma vez atendendo as políticas do subdomínio, repassam a chamada para o servidor de autorização.<br>
Um exemplo de configuração de proxy com Nginx pode ser encontrado no projeto [o2b2-proxy](https://github.com/ranierimazili/o2b2-proxy).

### Configurando subdomínios localmente
Se você estiver tentando rodar o projeto localmente, porém com uma arquitetura mais completa (ex: um proxy como o Nginx protegendo o Authorization Server), você pode simular os subdomínios diretamente no localhost editando o arquito hosts do seu sistema operacional, conforme exemplo abaixo.

**Edite o arquivo hosts deixando a linha do ip local (127.0.0.1) conforme exemplo abaixo**

*Windows: C:/Windows/System32/drivers/etc/hosts*
<br>
*Linux: /etc/hosts*
```
127.0.0.1       localhost as.localhost mtls-as.localhost
```

## Configurando os certificados de criptografia e assinatura
Para que o servidor seja iniciado, é necessário configurar as chaves que serão utilizadas para criptografia e assinatura dos tokens gerados pelo servidor de autorização.

**Estas chaves não precisam ser emitidas por autoridades certificadoras, podem ser certificados auto-assinados.**

Caso você possua certificados e deseja utiliza-los para este propósito, basta copiar a chave privada para os diretórios **certs/enc**(criptografia) e **certs/sig**(assinatura).
<br>*Obs: Copie apenas a chave privada para os diretórios*

Para fins de desenvolvimento, caso os diretórios **certs/enc** e **certs/sig** não contenham as chaves privadas, chaves auto-assinadas serão geradas em tempo de execução para levantar o servidor.
<br>**ATENÇÃO:** Nessa situação as chaves irão mudar a cada restart do servidor, portanto access_tokens e afins não irão funcionar após o restart e este tipo de solução não funciona em cenários de cluster ou kubernetes pois não haverá compartilhamento de chaves entre os servidores do cluster. 

Caso você não possua certificados, você pode entrar nos diretórios **certs/sig** e **certs/enc** e criar o certificado com o comando abaixo:
```
$ openssl genrsa -out private.pem 2048
```

### Configurando os certificados do host
Caso você tenha optado por utilizar o [protocolo https](../parameters.md#protocol) para levantar o servidor, é necessário informar as chaves (pública/privada) que serão utilizadas para TLS do host para iniciar o servidor.

**Estas chaves não precisam ser emitidas por autoridades certificadoras, podem ser certificados auto-assinados.**

Para fins de desenvolvimento, caso o diretório **certs/host** não contenha a chave privada (private.pem) e o certificado (cert.pem), chaves auto-assinadas serão geradas em tempo de execução para o host *.localhost para atender requisições em https://as.localhost e https://mtls-as.localhost.

Caso queira gerar certificados auto-assinados para outro hostname, siga os passos apresentados [aqui](../../certs/host/README.md).

## Configurando as varíaveis de ambiente
Além dos certificados, é necessário configurar as [varíaveis de ambiente](../parameters.md) que irão definir o comportamento do servidor.

Você pode fazer isso através da edição do arquivo **.env** ou através de qualquer outro mecanismo de edição de varíaveis de ambiente da sua plataforma.

## Executando o projeto
Instale as dependências
```
npm install
```

Execute o projeto
```
npm run start
```

Após subir o serviço, o well-known estará disponível para acesso em https://localhost:3000/.well-known/openid-configuration ou no endereço do subdomínio sem mTLS caso você tenha realizado essa configuração.<br>
_Ex: https://as.enderecodoseubanco.com.br/.well-known/openid-configuration_

## Testando o Authorization Server
Você pode testar o AS utilizando o Postman conforme as instruções apresentadas [aqui](../postman/README.md)