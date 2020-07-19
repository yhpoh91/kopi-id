import { v4 as uuid } from 'uuid';

import ExpressRouter from './router';
import JwtService from './services/jwt';
import TokenService from './services/token';

import Constants from './constants';
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
        redirectUri: ['http://localhost:8080/sinkhole'],
      });
    }
    return Promise.resolve(null);
  };

  const onGetUser = async (sub, scope) => {
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

  const onRevokeConsentGiven = async (sub, scope, clientId) => {
    const clientConsents = consents[clientId];
    if (clientConsents == null) {
      // client does not belong in given consent, nothing to revoke
      return Promise.resolve();
    }

    for (let i = 0; i < scope.length; i += 1) {
      const scopeItem = scope[i];

      const scopeConsents = clientConsents[scopeItem];
      if (scopeConsents == null) {
        // scope does not belong in client, nothing to revoke
        continue;
      }

      // delete sub from scope consent
      delete scopeConsents[sub];
    }

    return Promise.resolve();
  };

  const onSaveAuthenticationRequest = async (authenticationRequest) => {
    const authenticationRequestId = uuid();
    authenticationRequests[authenticationRequestId] = authenticationRequest;
    console.log(authenticationRequests);
    return Promise.resolve(authenticationRequestId);
  };

  const onLoadAuthenticationRequest = async (authenticationRequestId) => {
    console.log(authenticationRequests);
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
    if (data == null) {
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

  const handleAuthenticated = async (res, authenticationRequestId, sub, isUserAuthenticated, isSilentAuthenticated) => {
    try {
      const authenticationRequest = await onLoadAuthenticationRequest(authenticationRequestId);
      console.log(authenticationRequest)
      const {
        scope,
        client_id: clientId,
        id_token_hint: idTokenHint,
        redirect_uri: redirectUri,
        prompt,
        state,
      } = authenticationRequest;

      // Validate authenticated status
      if (!isUserAuthenticated) {
        // Send Redirect with Error (login_required)
        return redirectService.redirectLoginRequired(res, redirectUri, state);
      }

      // Validate Re-login when LOGIN is present
      if (isSilentAuthenticated && prompt && prompt.includes(Constants.authenticationRequest.prompt.LOGIN)) {
        // Send Redirect with Error (login_required)
        return redirectService.redirectLoginRequired(res, redirectUri, state);
      }

      // Validate ID Token (must not allow login with a different user)
      const client = await onGetClient(clientId);
      if (idTokenHint != null) {
        // Check if different user (sub)
        try {
          const idToken = await jwtService.verifyIdToken(idTokenHint, client);
          const { sub: tokenSub } = idToken;
          if (sub !== tokenSub) {
            // Send Redirect with Error (login_required)
            return redirectService.redirectLoginRequired(res, redirectUri, state, 'user logged in as different id from the id_token');
          }
        } catch (error) {
          L.warn(`Error caught when verifying ID Token: ${error.message}`);

          // Send Redirect with Error (invalid_request)
          return redirectService.redirectInvalidRequest(res, redirectUri, state, 'invalid id_token');
        }
      }

      // Create new Authorization Request
      const authorizationRequestId = await onSaveAuthorizationRequest(authenticationRequestId, sub);

      // Generate Consent Url
      const consentUrl = `${config.host}/${config.consentPage}?authorizationRequestId=${authorizationRequestId}`;

      // Check CONSENT prompt
      if (prompt && prompt.includes(Constants.authenticationRequest.prompt.CONSENT)) {
        // Must show consent page, redirect to consent page
        res.redirect(consentUrl);
        return;
      }

      // Check previously given consent (optional)
      const isConsentGiven = await onIsConsentGiven(sub, scope, clientId);
      if (isConsentGiven) {
        return handleAuthorized(res, authorizationRequestId, true, true);
      }
  
      // Redirect to consent page
      res.redirect(consentUrl);
    } catch (error) {
      L.error(error.message, error);
      res.status(500).send();
    }
  };

  const handleAuthorized = async (res, authorizationRequestId, isConsentGiven, isSilentConsent) => {
    try {
      const authorizationRequest = await onLoadAuthorizationRequest(authorizationRequestId);
      const { authenticationRequestId, sub } = authorizationRequest;

      const authenticationRequest = await onLoadAuthenticationRequest(authenticationRequestId);
      const {
        auth_time: authTime,
        response_type: responseTypes,
        scope,
        client_id: clientId,
        redirect_uri: redirectUri,
        prompt,
        state,
        nonce,
      } = authenticationRequest;

      const client = await onGetClient(clientId);
  
      if (!isConsentGiven) {
        // Send Redirect with Error (consent_required)
        return redirectService.redirectConsentRequired(res, redirectUri, state);
      }

      if (isSilentConsent && prompt && prompt.includes(Constants.authenticationRequest.prompt.CONSENT)) {
        // Send Redirect with Error (consent_required)
        return redirectService.redirectConsentRequired(res, redirectUri, state);
      }
  
      // Flow
      const flowType = flowUtils.getFlowType(responseTypes);

      const hasCode = responseTypes && responseTypes.includes(Constants.authenticationRequest.responseTypes.CODE);
      const hasIdToken = responseTypes && responseTypes.includes(Constants.authenticationRequest.responseTypes.ID_TOKEN);
      const hasAccessToken = responseTypes && responseTypes.includes(Constants.authenticationRequest.responseTypes.TOKEN);

      let cHash = null;
      let atHash = null;

      let query = (state && state !== '') ? `&state=${encodeURIComponent(state)}` : '';
      if (hasCode) {
        // Generate Authorization Code
        const authorizationCode = await onSaveAuthorization(authenticationRequestId, sub);

        // Hash Authorization Code
        const buffer = hashService.hash(authorizationCode, config.hashAlgorithm);
        cHash = buffer.slice(0, buffer.length / 2)
          .toString('base64');

        query += `&code=${encodeURIComponent(authorizationCode)}`;
      }
      if (hasAccessToken) {
        // Generate Access Token
        const accessToken = await tokenService.generateToken(client, sub, scope, authTime, nonce, cHash);

        // Hash Access Token
        const buffer = hashService.hash(accessToken, config.hashAlgorithm);
        atHash = buffer.slice(0, buffer.length / 2)
          .toString('base64');

        query += `&access_token=${encodeURIComponent(accessToken)}`;
        query += `&expires_in=${encodeURIComponent(config.accessTokenExpiresIn)}`;
        query += `&token_type=Bearer`;
      }
      if (hasIdToken) {
        // Generate ID Token
        const idToken = await tokenService.generateIdToken(client, sub, authTime, nonce, cHash, atHash);
        query += `&id_token=${encodeURIComponent(idToken)}`;
      }
  
      // Redirect to client redirect page
      query = query.charAt(0) === '&' ? query.slice(1) : query;
      const clientUrl = `${redirectUri}#${query}`
      res.redirect(clientUrl);
    } catch (error) {
      L.error(error.message, error);
      res.status(500).send();
    }
  };

  const defaultConfig = {
    host: 'http://localhost:8080',

    loginPage: 'login',
    consentPage: 'consent',

    jwtAlgorithm: 'HS512',
    hashAlgorithm: 'sha512',

    idTokenExpiresIn: 3600,
    accessTokenExpiresIn: 3600,
    authorizationCodeLength: 256,

    // Client
    onGetClient,

    // User
    onGetUser,

    // Managed Consent
    onIsConsentGiven,
    onSetConsentGiven,
    onRevokeConsentGiven,

    // Authentication Request
    onSaveAuthenticationRequest,
    onLoadAuthenticationRequest,

    // Authorization
    onSaveAuthorization,
    onLoadAuthorization,
    onRevokeAuthorization,
  };

  config = Object.assign({}, defaultConfig, configuration);
  const jwtService = JwtService(config);
  const tokenService = TokenService(config, jwtService);
  return {
    express: ExpressRouter(config),
    handleAuthenticated,
    handleAuthorized,
  };
};
