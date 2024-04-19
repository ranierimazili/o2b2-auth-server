import Provider from 'oidc-provider';
import bodyParser from 'koa-bodyparser';
import { configuration } from './configuration/configuration.js';
import { validateDCRInfo } from './custom/dcrDcm.js';
import { adjustWellKnownResponse } from './custom/wellKnown.js';
import { config } from './shared/config.js';
import { getCustomRouteName, processCustomRouteCall } from './custom/routes.js';
import { getDBAdapter } from './persistence/db.js';
import { addDynamicScopesSupport } from './custom/dynamicScopes.js';
import { startServer } from './server/server.js';

//Inicialização do banco de dados escolhido
let dbAdapter = await getDBAdapter();

const provider = new Provider(config.issuer, { adapter: dbAdapter, ...configuration });

//Adiciona o suporte aos escopos dinâmicos no padrão do Open Finance Brasil
addDynamicScopesSupport(provider);

provider.use(bodyParser());
provider.proxy = true;
provider.use(async (ctx, next) => {
  try  {
	const routeName = getCustomRouteName(ctx);
	
	if (routeName === 'createOrUpdateClient') {
		await validateDCRInfo(ctx, dbAdapter);
		await next();
	} else if (routeName) {
		await processCustomRouteCall(ctx, provider, routeName);
	} else {
		await next();
	}

	//Realiza as mudanças no well-known antes do retorno
	if (ctx.oidc?.route === 'discovery') {
		adjustWellKnownResponse(ctx);
	}
  } catch (e) {
		console.log(e);
  }
});

startServer(provider);