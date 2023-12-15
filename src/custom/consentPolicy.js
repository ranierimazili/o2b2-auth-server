import { interactionPolicy } from 'oidc-provider';
import { config } from '../shared/config.js';

/* Considerando que a autenticação é de responsabilidade do frontend da instituição que está recebendo a chamada,
*  foram removidas as validações de login e consentimento originais e foi implementado uma validação para apenas
*  garantir que os escopos foram aprovados pelo cliente
*/
const { Prompt, Check, base } = interactionPolicy;
const customPrompt = new Prompt(
	{ name: 'consent', requestable: true },
  
	new Check('check_consent', 'consent approval/rejection require end-user interaction', 'interaction_required', (ctx) => {
		const { oidc } = ctx;
		if (oidc?.grant) {
			const grantedScopes = oidc.grant.openid.scope.split(" ");
			for (const scope of oidc.requestParamOIDCScopes) {
				if (!grantedScopes.includes(scope)) {
					return Check.REQUEST_PROMPT;
				}
			}
			return Check.NO_NEED_TO_PROMPT;
		} else {
	  		return Check.REQUEST_PROMPT;
		}
	})
)

export const customPolicy = base();
//Apenas aplica as customizações caso o modo desenvolvedor não esteja ativado
if (!config.frontend.devModeEnabled) {
    customPolicy.remove("consent");
    customPolicy.remove("login");
    customPolicy.add(customPrompt, 0);
}