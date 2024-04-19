import { config } from '../shared/config.js';
import * as utils from '../shared/utils.js';
import * as https from 'node:https';

export const startHttpsServer = function(provider) {
    //Carrega os certificados para https e CA's permitidas no Open Finance Brasil
    const httpsCerts = utils.getHostCerts();
    const issuers = utils.getIssuers();

    const server = https.createServer({
        key: httpsCerts.private,
        cert: httpsCerts.cert,
        ca: issuers.ca,
        requestCert: true,
        rejectUnauthorized: false
    }, provider.callback());
    
    server.listen(config.port, () => {
        console.log(`oidc-provider listening on port ${config.port}, check ${config.protocol}://${config.fqdn.noMtlsPrefix}.localhost:${config.port}/.well-known/openid-configuration`);
        process.on('SIGINT', () => {
          process.exit(0);
        });
    });
}