# o2b2-auth-server
Este projeto tem como intuito ser um servidor de autorização que siga os padrões do perfil de segurança do Open Finance Brasil.

Esta aplicação é uma implementação do [node-oidc-provider](https://github.com/panva/node-oidc-provider) com as customizações necessárias para atender aos critérios definidos no [Perfil de Segurança do Open Finance Brasil](https://openfinancebrasil.atlassian.net/wiki/spaces/OF/pages/245694465/PT+Open+Finance+Brasil+Financial-grade+API+Security+Profile+1.0+Implementers+Draft+3)

# Requisitos mínimos
Node >= 16

# Índice

- [Configurando em modo desenvolvimento](docs/setup/dev_mode.md)
- [Configurando em modo produção](docs/setup/prd_mode.md)
- [Parâmetros de configuração](docs/parameters.md)
- [Endpoints](docs/endpoints.md)
- [Testando via Postman](docs/postman/README.md)
- [Projetos Relacionados](docs/related_projects.md)
- [Migrando de outros servidores](docs/migration_from_other_products.md)
- [Tutoriais](docs/tutorials.md)

# Testes da OpenID
Evidência de execução dos testes de Authorization Server e DCR
![testes_open_id](https://github.com/ranierimazili/o2b2-auth-server/assets/15436207/c0957b8b-9c42-444b-9c47-c25a563739ab)
