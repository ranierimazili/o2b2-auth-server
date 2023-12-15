# Chaves privadas de assinatura

Adicione neste diretório as chaves privadas de assinatura.

Esta chave não precisa ser emitida por uma CA pública, podendo ser uma chave auto-assinada. Para gerar uma chave auto-assinada, execute o comando abaixo neste diretório.

```
openssl genrsa -out sigkey_1.pem 2048
```
