//Caso o endpoint que esteja sendo chamado seja um endpoint customizado, retorna um identificador do endpoint,
//caso contrário (endpoint sem customizações) retorna null
export const getCustomRouteName = function(ctx) {
    if (ctx.path.startsWith("/clients/") && ctx.request.method === 'GET')
        return 'getClient';
    else if (ctx.path.startsWith("/sessions/") && ctx.request.method === 'GET')
        return 'getSession';
    else if (ctx.path.startsWith("/approveConsent") && ctx.request.method === 'POST')
        return 'approveConsent';
    else if (ctx.path.startsWith("/rejectConsent") && ctx.request.method === 'POST')
        return 'rejectConsent';
    else if (ctx.path.startsWith("/reg") && ["POST", "PUT"].includes(ctx.request.method))
        return 'createOrUpdateClient'

    return null;
}

export const processCustomRouteCall = async function(ctx, provider, routeName) {
    switch(routeName) {
		case 'getClient':
			await getClient(ctx, provider);
			break;
        case 'getSession':
            await getSession(ctx, provider);
            break;
        case 'approveConsent':
            await approveConsent(ctx, provider);
            break;
        case 'rejectConsent':
            await rejectConsent(ctx, provider);
            break;
    }
}

//Retorna os dados do cliente
export const getClient = async function (ctx, provider) {
    try {
        const clientId = ctx.path.split('/')[2];
        const client = await provider.Client.find(clientId);
        if (client) {
            ctx.body = client;
        } else {
            ctx.status = 404;
            ctx.body = { error: 'Client not found' };
        }
    } catch (e) {
      ctx.status = 500;
      ctx.body = e;
    }
}

//Retorna os dados da sessão
export const getSession = async function(ctx, provider) {
    setSessionIdOnCookieHeader(ctx);
    
    const details = await provider.interactionDetails(ctx.req, ctx.res);
    ctx.status = 200;
    ctx.body = details;
}

//Aprova o consentimento, configurando os parametros que serão colocados no access_token e id_token
export const approveConsent = async function (ctx, provider) {
    setSessionIdOnCookieHeader(ctx);
    const requestBody = ctx.request.body;
    const session = await provider.interactionDetails(ctx.req, ctx.res);

    let grant = new provider.Grant({
        accountId: requestBody.accountId,
        clientId: session.params.client_id,
    });
    grant.addOIDCScope(session.params.scope);
    const grantId = await grant.save();

    const result = {
        login: requestBody,
        consent: {
            grantId
        }
    }

    const redirectTo = await provider.interactionResult(ctx.req, ctx.res, result, { mergeWithLastSubmission: true }) ;
    ctx.body = { redirectTo };
    ctx.status = 200;
}

//Rejeita o consentimento
export const rejectConsent = async function(ctx, provider) {
    const result = ctx.request.body;
    setSessionIdOnCookieHeader(ctx);
    const redirectTo = await provider.interactionResult(ctx.req, ctx.res, result, { mergeWithLastSubmission: true });
    ctx.body = { redirectTo };
    ctx.status = 200;
}

//As chamadas do node-oidc-provider utilizam como parâmetro o conteúdo
//do cookie. A função abaixo transforma o atributo recebido no path
//no cookie utilizado pelo node-oidc-provider
const setSessionIdOnCookieHeader = function(ctx) {
    const sessionId = ctx.req.url.split('/').reverse()[0]
    ctx.req.headers.cookie = `_interaction=${sessionId}`;
}