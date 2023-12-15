export const addDynamicScopesSupport = function (provider) {
    const requestParamOIDCScopes = Object.getOwnPropertyDescriptor(provider.OIDCContext.prototype, 'requestParamOIDCScopes').get;
    Object.defineProperty(provider.OIDCContext.prototype, 'requestParamOIDCScopes', {
        get() {
            const scopes = this.requestParamScopes;
            const recognizedScopes = requestParamOIDCScopes.call(this);
            for (const scope of scopes) {
            if (/^consent:urn:[a-zA-Z0-9][a-zA-Z0-9\-]{0,31}:[a-zA-Z0-9()+,\-.:=@;$_!*'%\/?#]+$/.exec(scope)) {
                recognizedScopes.add(scope);
            }
            }
            return recognizedScopes;
        },
    });
}