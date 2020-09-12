import Constants from '../constants';

import AuthService from '../services/auth';
import JwtService from '../services/jwt';
import TokenService from '../services/token';

import hashService from '../services/hash';
import loggerService from '../services/logger';
import flowUtils from '../services/flowUtils';
import redirectService from '../services/redirect';

export default (oidcConfig) => {
  const { L } = loggerService('Controller');
  const authService = AuthService(oidcConfig);
  const jwtService = JwtService(oidcConfig);
  const tokenService = TokenService(oidcConfig, jwtService);

  const handleAuthenticationRequest = async (authenticationRequest, req, res, next) => {
    try {
      const {
        response_type: responseTypes,
        client_id: clientId,
        redirect_uri: redirectUri,
        id_token_hint: idTokenHint,
        prompt,
        state,
        max_age: maxAge,
      } = authenticationRequest;

      // Validate Client
      const client = await oidcConfig.onGetClient(clientId);
      if (client == null) {
        // Client does not exist
        return redirectService.redirectInvalidRequest(res, redirectUri, state);
      }

      // Validate Redirect URI
      const redirectUriValid = client.redirectUri.includes(redirectUri);
      if (!redirectUriValid) {
        // Redirect URI does not exist in Client
        return redirectService.redirectInvalidRequestUri(res, redirectUri, state);
      }

      // Create new Authentication Request
      authenticationRequest.auth_time = Math.floor(new Date().getTime() / 1000);
      const authenticationRequestId = await oidcConfig.onSaveAuthenticationRequest(authenticationRequest);

      // Validate Prompt
      if (prompt && prompt.includes(Constants.authenticationRequest.prompt.NONE)) {
        // Check for additional values
        if (prompt.length > 1) {
          // Not supposed to have other values when NONE is present
          return redirectService.redirectInvalidRequest(res, redirectUri, state);
        }

        // Silent Login
        if (idTokenHint == null) {
          // Send Redirect with Error (interaction_required)
          return redirectService.redirectInternalServiceError(res, redirectUri, state);
        } else {
          // Try to silently login with ID Token
          try {
            const idToken = await jwtService.verifyIdToken(idTokenHint, client);
            const { sub, auth_time: authTime } = idToken;

            // Check Max Age
            const currentTime = Math.floor(new Date().getTime() / 1000);
            if (maxAge && currentTime > (authTime + maxAge)) {
              throw new Error('Maximum Authentication Age has reached.');
            }

            return authService.handleAuthenticated(res, authenticationRequestId, sub, true, true);
          } catch (error) {
            L.warn(`Error caught when verifying ID Token: ${error.message}`);

            // Send Redirect with Error (login_required)
            return redirectService.redirectLoginRequired(res, redirectUri, state);
          }
        }
      }

      // Redirect to Login Page
      const loginPath = oidcConfig.loginUrl || `${oidcConfig.host}/${oidcConfig.loginPage}`;
      const loginUrl = `${loginPath}?authenticationRequestId=${authenticationRequestId}`;
      res.redirect(loginUrl);
    } catch (error) {
      next(error);
    }
  };
  
  const handleTokenRequest = async (tokenRequest, req, res, next) => {
    try {
      const { code, redirect_uri: redirectUri } = req.body;

      const { clientId } = req;
      const client = await oidcConfig.onGetClient(clientId);

      // Validate Code is valid (not null) and unused
      const authorizationRequestId = await oidcConfig.onLoadAuthorization(code);
      if (authorizationRequestId == null) {
        throw new Error('Invalid Code');
      }

      // Validate Code against Client ID
      const authorizationRequest = await oidcConfig.onLoadAuthorizationRequest(authorizationRequestId);
      const { sub, authenticationRequestId } = authorizationRequest;
      const authenticationRequest = await oidcConfig.onLoadAuthenticationRequest(authenticationRequestId);
      const {
        scope,
        client_id: requestClientId,
        redirect_uri: requestRedirectUri,
        auth_time: authTime,
        nonce,
      } = authenticationRequest;
      if (clientId !== requestClientId) {
        throw new Error('Client ID does not match requested authentication');
      }
      
      // Validate Redirect URI against Authentication Request (if present)
      if (redirectUri != null && redirectUri !== requestRedirectUri) {
        throw new Error('Redirect URI does not match requested authentication');
      }

      // Validate Code against scope (must have openid)
      if (!scope.includes('openid')) {
        throw new Error('Scope did not include openid')
      }


      // Revoke Authorization Code
      await oidcConfig.onRevokeAuthorization(code);

      // Generate Access Token (should have c_hash)
      const cHashBuffer = hashService.hash(code, oidcConfig.hashAlgorithm);
      const cHash = cHashBuffer.slice(0, cHashBuffer.length / 2).toString('base64');
      const accessToken = await tokenService.generateToken(client, sub, scope, authTime, nonce, cHash);

      // Generate ID Token (should have at_hash)
      const atHashBuffer = hashService.hash(accessToken, oidcConfig.hashAlgorithm);
      const atHash = atHashBuffer.slice(0, atHashBuffer.length / 2).toString('base64');
      const idToken = await tokenService.generateIdToken(client, sub, authTime, nonce, cHash, atHash);

      const { accessTokenExpiresIn } = oidcConfig;
      const response = {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: accessTokenExpiresIn,
        id_token: idToken
      }
      if (res.headers == null) {
        res.headers = {};
      }
      res.headers['Cache-Control'] = 'no-store';
      res.headers['Pragma'] = 'no-cache';
      res.status(200).json(response);
    } catch (error) {
      L.error(error.message);
      L.debug(error);

      if (res.headers == null) {
        res.headers = {};
      }
      res.headers['Cache-Control'] = 'no-store';
      res.headers['Pragma'] = 'no-cache';
      res.status(400).json({ error: 'invalid_request' });
    }
  };

  const handleUserInfo = async (req, res, next) => {
    try {
      const { tokenPayload } = req;
      const { sub, scope } = tokenPayload;

      const user = await oidcConfig.onGetUserInfo(sub, scope);
      user.sub = user.sub || user.id;
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  };
  
  const authenticationRequestGet = (req, res, next) => handleAuthenticationRequest(req.query, req, res, next);
  const authenticationRequestPost = (req, res, next) => handleAuthenticationRequest(req.body, req, res, next);
  
  const tokenRequestPost = (req, res, next) => handleTokenRequest(req.body, req, res, next);

  const userInfoGet = (req, res, next) => handleUserInfo(req, res, next);
  const userInfoPost = (req, res, next) => handleUserInfo(req, res, next);
  
  return {
    authenticationRequestGet,
    authenticationRequestPost,
  
    tokenRequestPost,

    userInfoGet,
    userInfoPost,
  };  
};
