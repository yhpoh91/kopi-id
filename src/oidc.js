import { v4 as uuid } from 'uuid';

import Constants from './constants';
import ExpressRouter from './router';

import AuthService from './services/auth';
import JwtService from './services/jwt';
import TokenService from './services/token';

import authorizationCodeService from './services/authorizationCode';
import loggerService from './services/logger';
import redirectService from './services/redirect';
import flowUtils from './services/flowUtils';
import hashService from './services/hash';

export default (configuration = {}) => {
  const { L } = loggerService('OIDC');

  let config = {};
  const authenticationRequests = {};
  const authorizationRequests = {};
  const authorizationCodes = {};
  const consents = {};

  const onGetClient = async (clientId) => {
    if (clientId === 'cid') {
      return Promise.resolve({
        name: 'Example Client',
        id: 'cid',
        secret: 'cs',
        redirectUri: ['http://localhost:8080/callback.html'],
      });
    }
    return Promise.resolve(null);
  };

  const onGetUserInfo = async (sub, scope) => {
    if (sub === 'uid') {
      const user = { sub };

      // Profile
      if (scope.includes('profile')) {
        user.name = 'Pika Chu';
        user.family_name = 'Chu';
        user.given_name = 'Pika';
        user.middle_name = 'Pichu';
        user.nickname = 'ChuChu';
        user.preferred_username = 'user';
        user.profile = 'http://www.pikachu.com/me';
        user.picture = 'https://assets.faceit-cdn.net/avatars/8c8c0ff9-57c6-419a-92f9-d033a01db75d_1550913370563.png';
        user.website = 'http://www.pikachu.com';
        user.gender = 'female';
        user.birthdate = '2002-02-18';
        user.zoneinfo = 'Asia/Singapore';
        user.locale = 'en-SG';
        user.updated_at = 1595151627;
      }

      // Email
      if (scope.includes('email')) {
        user.email = 'pika.chu@pikachu.com';
        user.email_verified = true;
      }

      // Phone
      if (scope.includes('phone')) {
        user.phone_number = '+65 1234 5678';
        user.phone_number_verified = true;
      }

      // Address
      if (scope.includes('address')) {
        user.address = {
          formatted: '12 Pikachu St 3, #01-25 Kanto 325976',
          street_address: '12 Pikachu St 3, #01-25',
          locality: 'Kanto',
          region: 'Kanto',
          postal_code: 325976,
          country: 'Pokemon World'
        };
      }

      return Promise.resolve(user);
    }
    return Promise.resolve(null);
  };

  const onIsConsentGiven = async (sub, scope, clientId) => {
    // Check if client belongs in given consents
    const clientConsents = consents[clientId];
    if (clientConsents == null) {
      return Promise.resolve(false);
    }

    // Check Each of the Scopes
    for (let i = 0; i < scope.length; i += 1) {
      const scopeItem = scope[i];

      // Check if scope belongs in client
      const scopeConsents = clientConsents[scopeItem];
      if (scopeConsents == null) {
        return Promise.resolve(false);
      }

      // Check if user exists within scope consent
      const subConsent = scopeConsents[sub];
      if (subConsent == null) {
        return Promise.resolve(false);
      }
    }

    // No red flags, consent exists
    return Promise.resolve(true);
  };

  const onSetConsentGiven = async (sub, scope, clientId) => {
    if (consents[clientId] == null) {
      consents[clientId] = {};
    }
    const clientConsents = consents[clientId];

    for (let i = 0; i < scope.length; i += 1) {
      const scopeItem = scope[i];

      if (clientConsents[scopeItem] == null) {
        clientConsents[scopeItem] = {};
      }
      const scopeConsents = clientConsents[scopeItem];
      scopeConsents[sub] = true;
    }

    return Promise.resolve();
  };

  const onSaveAuthenticationRequest = async (authenticationRequest) => {
    const authenticationRequestId = uuid();
    authenticationRequests[authenticationRequestId] = authenticationRequest;
    return Promise.resolve(authenticationRequestId);
  };

  const onLoadAuthenticationRequest = async (authenticationRequestId) => {
    return Promise.resolve(authenticationRequests[authenticationRequestId]);
  };

  const onSaveAuthorizationRequest = async (authenticationRequestId, sub) => {
    const authorizationRequestId = uuid();
    authorizationRequests[authorizationRequestId] = {
      authenticationRequestId,
      sub,
    };
    return Promise.resolve(authorizationRequestId);
  };

  const onLoadAuthorizationRequest = async (authorizationRequestId) => {
    console.log(authorizationRequests);
    return Promise.resolve(authorizationRequests[authorizationRequestId]);
  };

  const onSaveAuthorization = async (authorizationRequestId) => {
    // Clash avoiding
    let code = authorizationCodeService.generateCode(config.authorizationCodeLength);
    while (authorizationCodes[code] != null) {
      code = authorizationCodeService.generateCode(config.authorizationCodeLength);
    }

    // Save to Map
    authorizationCodes[code] = authorizationRequestId;
    return code;
  };

  const onLoadAuthorization = async (code) => {
    const authorizationRequest = authorizationCodes[code];
    if (authorizationRequest == null) {
      return Promise.resolve(null);
    }

    // Return saved data if exists
    return Promise.resolve(authorizationRequest);
  };

  const onRevokeAuthorization = async (code) => {
    // Check if exists before delete
    let existed = true;
    const data = authorizationCodes[code];
    if (data == null) {
      existed = false;
    }

    // Delete saved data
    delete authorizationCodes[code];

    // Return whether deleted (if previously doesn't exist, return false as no deletion happened)
    return Promise.resolve(existed);
  };

  const defaultConfig = {
    host: 'http://localhost:8080',

    loginPage: 'login',
    consentPage: 'consent',

    jwtAlgorithm: 'HS512',
    hashAlgorithm: 'sha512',

    idTokenExpiresIn: 3600,
    accessTokenSecret: 'this_should_be_a_long_secret_that_nobody_should_know_including_the_developer',
    accessTokenExpiresIn: 3600,
    authorizationCodeLength: 256,

    // Client
    onGetClient,

    // User
    onGetUserInfo,

    // Managed Consent
    onIsConsentGiven,
    onSetConsentGiven,

    // Authentication Request
    onSaveAuthenticationRequest,
    onLoadAuthenticationRequest,

    // Authorization Request
    onSaveAuthorizationRequest,
    onLoadAuthorizationRequest,

    // Authorization
    onSaveAuthorization,
    onLoadAuthorization,
    onRevokeAuthorization,
  };

  config = Object.assign({}, defaultConfig, configuration);

  const expressRouter = ExpressRouter(config);

  const authService = AuthService(config);
  const jwtService = JwtService(config);
  const tokenService = TokenService(config, jwtService);
  return {
    express: expressRouter,

    handleAuthenticated: authService.handleAuthenticated,
    handleAuthorized: authService.handleAuthorized,
  };
};
