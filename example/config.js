import callbacks from './callback';

const config = {
  host: 'http://localhost:8080',
  logLevel: 'debug',
  showResponseStack: true,

  //loginPage: 'login.html',
  //consentPage: 'consent.html',

  loginUrl: 'http://localhost:8080/login.html',
  consentUrl: 'http://localhost:8080/consent.html',

  jwtAlgorithm: 'HS512',
  hashAlgorithm: 'sha512',

  idTokenExpiresIn: 3600,
  accessTokenSecret: 'this_should_be_a_long_secret_that_nobody_should_know_including_the_developer',
  accessTokenExpiresIn: 3600,
  authorizationCodeLength: 256,

  idTokenExpiresIn: 3600,
  accessTokenExpiresIn: 3600,
  authorizationCodeLength: 256,
  
  // Client
  onGetClient: callbacks.onGetClient,

  // User
  onGetUserInfo: callbacks.onGetUserInfo,

  // Managed Consent
  onIsConsentGiven: callbacks.onIsConsentGiven,
  onSetConsentGiven: callbacks.onSetConsentGiven,

  // Authentication Request
  onSaveAuthenticationRequest: callbacks.onSaveAuthenticationRequest,
  onLoadAuthenticationRequest: callbacks.onLoadAuthenticationRequest,

  // Authorization Request
  onSaveAuthorizationRequest: callbacks.onSaveAuthorizationRequest,
  onLoadAuthorizationRequest: callbacks.onLoadAuthorizationRequest,

  // Authorization
  onSaveAuthorization: callbacks.onSaveAuthorization,
  onLoadAuthorization: callbacks.onLoadAuthorization,
  onRevokeAuthorization: callbacks.onRevokeAuthorization,
};

export default config;