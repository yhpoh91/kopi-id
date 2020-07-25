import ExpressRouter from './router';

import AuthService from './services/auth';
import loggerService from './services/logger';

export default (configuration = {}) => {
  const { L } = loggerService('OIDC');

  const defaultConfig = {
    host: 'http://localhost:8080',
    logLevel: 'info',
    showResponseStack: false,

    loginPage: 'login',
    consentPage: 'consent',

    jwtAlgorithm: 'HS512',
    hashAlgorithm: 'sha512',

    idTokenExpiresIn: 3600,
    accessTokenSecret: 'this_should_be_a_long_secret_that_nobody_should_know_including_the_developer',
    accessTokenExpiresIn: 3600,

    // Client
    onGetClient: () => Promise.resolve(null),

    // User
    onGetUserInfo: () => Promise.resolve(null),

    // Managed Consent
    onIsConsentGiven: () => Promise.resolve(false),
    onSetConsentGiven: () => Promise.resolve(),

    // Authentication Request
    onSaveAuthenticationRequest: () => Promise.resolve('authNReqId'),
    onLoadAuthenticationRequest: () => Promise.resolve(null),

    // Authorization Request
    onSaveAuthorizationRequest: () => Promise.resolve('authZReqId'),
    onLoadAuthorizationRequest: () => Promise.resolve(null),

    // Authorization
    onSaveAuthorization: () => Promise.resolve('authZCode'),
    onLoadAuthorization: () => Promise.resolve(null),
    onRevokeAuthorization: () => Promise.resolve(false),
  };

  const config = Object.assign({}, defaultConfig, configuration);
  const expressRouter = ExpressRouter(config);
  const authService = AuthService(config);

  return {
    express: expressRouter,

    handleAuthenticated: authService.handleAuthenticated,
    handleAuthorized: authService.handleAuthorized,
  };
};
