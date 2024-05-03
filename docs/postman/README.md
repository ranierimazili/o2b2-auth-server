# Testando o o2b2-auth-server com Postman

## Artefatos necessários

Para realizar os testes você precisa criar um software statement do Diretório de Participantes do Open Finance Brasil.

Para realização dos testes você precisa estar em posse das seguintes informações e arquivos:

- organization id
- software statement id
- chave privada do certificado de aplicação (brcac)
- chave pública do certificado de aplicação (brcac)
- url's de redirect cadastradas no software statement

## Configurando variáveis do postman

Importe o arquivo de variáveis de ambiente (*o2b2-auth-server - localhost.postman_environment.json*) no Postman. As 3 primeiras variáveis já possuem valores padrões para execução em ambiente de sandbox do diretório de participantes e o endpoint de well-known apontando para o localhost. Só altere estas variáveis caso tenha levantado o o2b2-auth-server em um servidor remoto ou caso esteja realizando testes com ambiente de produção.

Preencha as variáveis **org_id** com o seu *organization id* e **software_statement_id** com seu *software statement id*.

A variável **redirect_uris** são as url's de callback que foram cadastradas no software statement e por ser do tipo array, deve ser preenchido da seguinte forma.
Caso você tenha cadastrado apenas uma url de callback no software statement, preencha a variável com essa url entre aspas.
<br>Por exemplo: "https://enderecodoseubancoaqui.com.br/openfinance/callback"

Caso você tenha cadastrado múltiplas url's de callback no sofware statement, preencha a variável com as urls entre aspas separadas por vírgula.
<br>Por exemplo: "https://enderecodoseubancoaqui.com.br/openfinance/callback","https://enderecodoseubancoaqui.com.br/openfinance/outro-callback"

![postman_env](https://github.com/ranierimazili/o2b2-auth-server/assets/15436207/daa10549-d999-4e6e-9984-85c3951a6d8a)

## Configurando os certificados para realização do mTLS

Para que as chamadas ocorram com sucesso é necessário configurar o postman para que ele utilize o certificado de aplicação (brcac) nas chamadas aos hosts do diretório e do o2b2-auth-server.

Caso você esteja utilizando o o2b2-auth-server em seu localhost e utilizando o ambiente de sandbox do diretório de participantes, os hosts que precisam ser configurados são:
- mtls-as.localhost (porta 3000)
- matls-auth.sandbox.directory.openbankingbrasil.org.br (porta 443)

Para realizar essa configuração no postman, faça: 

1. Vá em Settings -> Certificates
2. Clique em *Add Certificate...*
3. Preencha o host e porta para o primeiro host
4. Em CRT file selecione a chave pública do seu certificado de aplicação (brcac)
4. Em Key file selecione a chave privada do seu certificado de aplicação (brcac)
5. Clique em *Add*

Repita os passos acima para os dois hosts.

## Importando o projeto do postman e executando os testes

Importe o arquivo *o2b2-auth-server-dcr-tests.postman_collection.json*, verifique se a configuração de ambiente *o2b2-auth-server - localhost*¹ está selecionada no postman e então basta executar os métodos na sequência em que estão apresentados².

![postman_call](https://github.com/ranierimazili/o2b2-auth-server/assets/15436207/c6387106-b487-4092-9603-5e17f83eba04)



