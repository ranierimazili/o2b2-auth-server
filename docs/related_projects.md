# Projetos relacionados

Para rodar este projeto de forma completa, você precisará de no mímino mais dois componentes.
Uma ferramenta para realizar o proxy e validação do mTLS e
API's implementadas de Open Finance (ex: [payments](https://openfinancebrasil.atlassian.net/wiki/spaces/OF/pages/17375943/API+-+Pagamentos) ou [accounts](https://openfinancebrasil.atlassian.net/wiki/spaces/OF/pages/17371726/API+-+Contas)).

Para fins de demonstração, dois projetos auxiliares foram criados para atender as duas necessidades acima:
- [o2b2-proxy](https://github.com/ranierimazili/o2b2-proxy) - Exemplo de configuração de um servidor Nginx para atender aos padrões do Open Finance Brasil
- [o2b2-payment-apis](https://github.com/ranierimazili/o2b2-payment-apis) - Exemplo de implementação básica da API de Iniciação de Pagamentos do Open Finance Brasil

Com o deploy dos componentes acima é possível realizar as certificações da OpenID Foundation para os perfis de Authorization Server e DCR.