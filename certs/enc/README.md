# Chaves privadas de criptografia

Adicione neste diretório as chaves privadas de criptografia.

Esta chave não precisa ser emitida por uma CA pública, podendo ser uma chave auto-assinada. Para gerar uma chave auto-assinada, execute o comando abaixo neste diretório.

```
openssl genrsa -out enckey_1.pem 2048
```
