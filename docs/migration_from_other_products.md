# Migrando de outros produtos

Você estava desesperado pra atender o regulatório, ouviu uma dezena de empresas e, sem muito conhecimento sobre o tema, escolheu uma que lhe pareceu ótima, e então, com o passar dos meses viu que não era bem assim e começou a cogitar uma mudança de provedor de serviço.

Então o Open Finance definiu que no caso de migração de servidores de autorização, os receptores/iniciadores e os clientes não podem ser impactados, portanto você tem que migrar os DCR's e refresh_tokens criados, a fim de manter a operação e os consentimentos ativos.

[E agora, José?](https://www.culturagenial.com/poema-e-agora-jose-carlos-drummond-de-andrade/)

Pois bem, segue um passo a passo que, se não vai salvar sua vida, pelo menos vai lhe dar um pouco de esperança.

## Coletando as informações necessárias
Aqui começa sua batalha... se você não tem acesso direto a infraestrutura do provedor de serviço atualmente instalado ou não tem conhecimento técnico pra fazer a extração sozinho, você precisará pedir ao seu fornecedor os dados de clientes e refresh_tokens cadastrados, para que os mesmos possam ser cadastrados em outra ferramenta (neste caso, no o2b2-auth-server, claro!!!)

Você precisará também da base de dados de consentimentos que foram criados, a fim de manter a possibilidade de consulta a estes consentimentos, tanto para os clientes (outras instituições), quanto para sua infraestrutura interna, que precisará consultar os detalhes do consentimento montagem de frontend e tomada de decisões baseado nos parâmetros do consentimento.

### Clientes registrados através de DCR
Para realizar a migração você precisará pedir ao seu provedor atual as informações sobre os clients já cadastrados através de DCR.<br>
Para cada cliente, você precisará das informações abaixo:

- client_id
- jwks_uri
- redirect_uris
- scope
- registration_access_token
- software_statement (opcional)

### Refresh tokens pertencentes a cada cliente
Uma vez cadastrado o cliente, você precisará migrar todos os refresh_tokens de cada cliente, a fim de manter o acesso do cliente aos consentimentos que o mesmo já possui acesso.<br>
Para cada refresh_token, você precisará das informações abaixo:

- client_id
- account_id (se não informado, usar consentid???)
- scope
- refresh_token

### Importando os clientes e refresh tokens
Com as informações em mãos, você deve utilizar os endpoints /import/client e /import/refreshTokens, que estão documentados [aqui](./endpoints.md#endpoints-internos), importando primeiro os clientes e depois os refresh_tokens.

## Declarando o novo servidor de autorização e depreciando o atual

### Declarando o novo servidor de autorização
O primeiro passo é declarar o novo servidor de autorização no [Diretório de Participantes](https://web.directory.openbankingbrasil.org.br/), utilizando o mesmo nome de marca (Customer Friendly Name) do anterior e logo, porém apontando a varíavel Open Discovery Document URI para o endpoint well-known do novo servidor de autorização. Uma vez preenchida todas a informações e concluído o cadastro, você poderá ir na opção *Detalhes do Servidor* e anotar o *ID do servidor de autorização*, pois esta informações será necessária para a próxima etapa.

> **Atenção:** Você também precisará cadastrar os endpoints das API's disponibilizadas pela sua instituição neste novo servidor de autorização. Faça isso usando a opção *Recursos da API* do servidor de autorização que foi cadastrado.

### Depreciando o servidor de autorização atual
Com a declaração do novo servidor de autorização já realizada, é necessário editar as configurações do servidor de autorização anterior, editando 3 campos:

- **Data de descontinuação (Deprecation Date)**: Data a partir de quando o novo servidor de autorização deve ser utilizado para todas as operações. O servidor antigo ainda estará ativo permitindo a obtenção de access_tokens para consentimentos anteriormente criados, porém não permitirá criação de novos consentimentos.

- **Data de suspensão (Retirement Date)**: Data a partir de quando o servidor antigo não está mais online.

- **Substituído por Servidor de Autorização Id (Superseded by Autorization Server Id)**: ID do novo servidor de autorização que irá substituir o servidor de autorização antigo.

## Coexistência de endpoints
Antes de falarmos de um modo de coexistência entre as soluções (antigo e nova), vamos criar um cenário de exemplo para então trabalharmos em uma possível solução de coexistência.

Supondo que você contratou anteriomente a empresa fictícia *Easy OB* e ela faz a gestão do seu Open Finance utilizando o domínio easyob.com.br, então alguns de seus endpoints estão parecidos com:
| Função                                | mTLS  | Endpoint      |
| -------------                         | ----- | ------------- |
| well-known                            | Não   | https://api.meubanco.easyob.com.br/.well-known/openid-configuration |
| authorization_endpoint                | Não   | https://api.meubanco.easyob.com.br/auth |
| jwks_uri                              | Não   | https://api.meubanco.easyob.com.br/jwks |
| token_endpoint                        | Sim   | https://mtls-api.meubanco.easyob.com.br/token |
| registration_endpoint                 | Sim   | https://mtls-api.meubanco.easyob.com.br/register |
| pushed_authorization_request_endpoint | Sim   | https://mtls-api.meubanco.easyob.com.br/par |
| userinfo_endpoint                     | Sim   | https://mtls-api.meubanco.easyob.com.br/userinfo.openid |

*Obs: Os endpoints de recursos (ex: pagamentos, contas, etc...) não foram listados acima mas podem precisar também de migração dependendo de como foram configurados no seu provedor anterior de serviço.*

Agora que você configurou seu novo servidor de autorização, no seu próprio domínio, você tem os seguintes endpoints disponíveis:
| Função                                | mTLS  | Endpoint      |
| -------------                         | ----- | ------------- |
| well-known                            | Não   | https://openbanking.meubanco.com.br/.well-known/openid-configuration |
| authorization_endpoint                | Não   | https://openbanking.meubanco.com.br/auth |
| jwks_uri                              | Não   | https://openbanking.meubanco.com.br/jwks |
| token_endpoint                        | Sim   | https://openbanking-mtls.meubanco.com.br/token |
| registration_endpoint                 | Sim   | https://openbanking-mtls.meubanco.com.br/reg |
| pushed_authorization_request_endpoint | Sim   | https://openbanking-mtls.meubanco.com.br/par |
| userinfo_endpoint                     | Sim   | https://openbanking-mtls.meubanco.com.br/me |

Agora que seus servidores estão declarados e aptos trabalharem na migração, você precisa estar ciente de dois problemas.

**Problema 1**<br>
Não existe um procedimento formal de mudança de servidor de autorização, então você precisará "criar" o seu plano e monitorar se ele está dando certo

**Problema 2**<br>
Não existe uma deliberação definindo a periodicidade com a qual as instituições precisem atualizar os servidores de autorização no diretório de participantes, ou seja, você declarou seu novo AS mas nada garante quando este novo servidor será utilizado. Portanto, esteja ciente que você precisará definir seus próprios prazos e precisará notificar via service desk as instituições que não estejam utilizando o seu novo servidor.

### Proposta de plano
Vou trabalhar com um prazo de 1 mês para realização da migração, começando em 01/07/2024 (primeiro dia do novo AS funcionando) e terminando em 31/07/2024 (dia em que o AS anterior parou de funcionar).

#### Dia 01/07/2024
Novo servidor declarado, com os clientes e refresh_tokens migrados e endpoints de API's declarados e funcionais.<br>
No servidor antigo, as variáveis abaixo foram preenchidas:

- **Data de descontinuação**: 08/07/2024 - Declarei o servidor novo 1 semana antes na esperança que os participantes façam ao menos uma varredura semanal e saibam que um novo servidor entrará no ar para substituir este.

- **Data de suspensão**: 31/07/2024 - Neste dia, este servidor não atenderá mais nenhuma requisição.

#### Dia 08/07/2024
Desativo os endpoints *authorization_endpoint* e *registration_endpoint* do servidor anterior, a fim de não permitir a criação de novos consentimentos através do Hybrid Flow nem novos DCR's/DCM's no servidor anterior.

> **Atenção**: Importante os clientes (criados ou alterados) e refresh_tokens criados entre 01/07 e 08/07 precisam ser migrados para o novo AS a fim não existirem artefatos não migrados.

#### Dia 15/07/2024
Já se passou uma semana, e com a monitoria é possível verificar quais instituições não fizeram a atualização do servidor de autorização e/ou não estão utilizando os novos endpoints de API's de recursos. Neste caso, é necessário abrir ticket bilateriais via Service Desk, requisitando que estas instituições modifiquem seus apontamentos para chamar o novo servidor.

#### Dia 31/07/2024
Servidor anterior e seus endpoints são completamente desativados.