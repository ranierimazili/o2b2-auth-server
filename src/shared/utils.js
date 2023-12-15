import { Agent } from 'undici';
import { config } from './config.js';
import { X509Certificate } from 'node:crypto';
import * as selfsigned from 'selfsigned';
import * as fs from 'fs'

//Carrega os certificados para ser utilizando como certificado https do host
//Caso não encontre os certificados, gera certificados auto-assinados para
//*.localhost para atender as.localhost e mtls-as.localhost
export const getHostCerts = function() {
    const hostDir = "./certs/host";
    
    let hostCerts = {};
    try {
        hostCerts.private = fs.readFileSync(`${hostDir}/private.pem`);
        hostCerts.cert = fs.readFileSync(`${hostDir}/cert.pem`);
    } catch (e) {
        console.warn("Não foram encontrados os certificados para o host em certs/host. Gerando certificado auto-assinado");
        const attrs = [{ name: 'commonName', value: '*.localhost' }];
        hostCerts = selfsigned.generate(attrs, { days: 365, keySize: 2048 });
    }

    return hostCerts;
}

//Carrega a lista de CA's autorizadas a emitir certificados para o Open Finance
export const getIssuers = function() {
    const issuersDir = "./certs/issuers";
    const issuersFileName = fs.readdirSync(issuersDir).filter(file => file !== 'README.md').sort();

    if (issuersFileName.length !== 1) {
        console.error("O diretório certs/issuers devem conter exclusivamente um arquivo com as cadeias das entidades certificadores permitidas");
        process.exit(1);
    } else {
        if (issuersFileName[0] === 'sandbox_issuers.pem') {
            console.warn("o2b2-auth-server WARNING: a lista de autoridades certificadoras presente em certs/issuers parece ser de sandbox. Altere caso seja ambiente produtivo");
        }
    }

    let issuers = {};
    issuers.ca = fs.readFileSync(`${issuersDir}/${issuersFileName[0]}`);

    return issuers;
}

export const throwErrorRespose = function(ctx, errorStatusCode, errorCode, errorDescription) {
    ctx.status = errorStatusCode;
    ctx.body = {
        error: errorCode,
        error_description: errorDescription
    }
    throw new Error(ctx.body.error_description);
}

export const getDirectorySigningKey = async function(ctx) {
    try {
        const res = await fetchWithoutSSLCheck(config.directorySigningKeyUrl);
        const json = await res.json();
        return json;
    } catch (e) {
        throwErrorRespose(ctx, 400, "unapproved_software_statement", "The SSA could not be verified because Open Finance Brasil directory is unavailable");
    }
}

export const getClientCertificate = function (ctx) {
    const pemCert = ctx.get('ssl-client-cert');
    let x509Cert;
    if (pemCert) {
        x509Cert = new X509Certificate(unescape(ctx.get('ssl-client-cert')), 'base64');
    } else {
        x509Cert = new X509Certificate(ctx.req.connection.getPeerCertificate(false).raw);	
    }
    return x509Cert;
}

const fetchWithoutSSLCheck = async function(url) {
    const res = await fetch(url, {
        dispatcher: new Agent({
            connect: {
            rejectUnauthorized: false,
            },
        }),
    });

    return res;
}
