import { config } from '../shared/config.js';
import * as http from 'node:http';

export const startHttpServer = function(provider) {

    const server = http.createServer(null, provider.callback());
    
    server.listen(config.port, () => {
        console.log(`oidc-provider listening on port ${config.port}, check ${config.protocol}://${config.fqdn.noMtlsPrefix}.localhost:${config.port}/.well-known/openid-configuration`);
        process.on('SIGINT', () => {
          process.exit(0);
        });
    });
}