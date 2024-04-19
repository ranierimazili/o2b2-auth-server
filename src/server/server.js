import { config } from '../shared/config.js';
import { startHttpServer } from './serverHttp.js'
import { startHttpsServer } from './serverHttps.js'

export const startServer = function(provider) {
    if (config.protocol == 'http') {
        startHttpServer(provider);
    } else {
        startHttpsServer(provider);
    }
}