# Configurando o o2b2-auth-server no modo desenvolvimento

> **Modo desenvolvimento**: Geralmente para uso local, sem necessidade de proxy (ex: Nginx) intermediando as requisições e sem a realização do mTLS nas chamadas.

Considerando que todos os endpoints responderão no mesmo host, sem a necessidade de distinção dos endpoints mTLS e não-mTLS, não é necessário definir dois subdomínios no mesmo host, pois todas as requisições atenderão no mesmo host (ex: https://localhost).

Para fins de desenvolvimento, você não precisa alterar qualquer configuração via variáveis de ambiente ou através do arquivo .env, bastando instalar as dependências e subir o serviço.

Instale as dependências
```
npm install
```

Execute o projeto
```
npm run start
```

Após subir o serviço, o well-known estará disponível para acesso em https://localhost:3000/.well-known/openid-configuration

## Testando o Authorization Server
Você pode testar o AS utilizando o Postman conforme as instruções apresentadas [aqui](../postman/README.md)