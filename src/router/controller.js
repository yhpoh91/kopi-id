import Constants from '../constants';

import AuthService from '../services/auth';
import JwtService from '../services/jwt';

import loggerService from '../services/logger';
import flowUtils from '../services/flowUtils';
import redirectService from '../services/redirect';

export default (oidcConfig) => {
  const { L } = loggerService('Controller');
  const authService = AuthService(oidcConfig);
  const jwtService = JwtService(oidcConfig);

  const handleAuthenticationRequest = async (authenticationRequest, req, res, next) => {
    try {
      const {
        response_type: responseTypes,
        client_id: clientId,
        redirect_uri: redirectUri,
        id_token_hint: idTokenHint,
        prompt,
        state,
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
            const { sub } = idToken;
            return authService.handleAuthenticated(res, authenticationRequestId, sub, true, true);
          } catch (error) {
            L.warn(`Error caught when verifying ID Token: ${error.message}`);

            // Send Redirect with Error (login_required)
            return redirectService.redirectLoginRequired(res, redirectUri, state);
          }
        }
      }

      // Redirect to Login Page
      const loginUrl = `${oidcConfig.host}/${oidcConfig.loginPage}?authenticationRequestId=${authenticationRequestId}`;
      res.redirect(loginUrl);
    } catch (error) {
      next(error);
    }
  };
  
  const handleTokenRequest = async (tokenRequest, req, res, next) => {
    try {
      // TODO: Validate Client ID against Client Secret
      // TODO: Validate Code is valid (not null)
      // TODO: Validate Code against Client ID
      // TODO: Validate Code unused
      // TODO: Validate Redirect URI against Authentication Request (if present)
      // TODO: Validate Code against scope (must have openid)

      // TODO: ID Token should have at_hash

      // Generate Access Token
      // const accessToken = await tokenService.generateToken(client, sub, scope, authTime, nonce, cHash);

      // // Hash Access Token
      // const buffer = hashService.hash(accessToken, oidcConfig.hashAlgorithm);
      // atHash = buffer.slice(0, buffer.length / 2)
      //   .toString('base64');

      // query += `&access_token=${encodeURIComponent(accessToken)}`;
      // query += `&expires_in=${encodeURIComponent(oidcConfig.accessTokenExpiresIn)}`;
      // query += `&token_type=Bearer`;
      res.send(req.clientId);
      return ;

      const response = {
        access_token: '',
        token_type: 'Bearer',
        expires_in: 3600,
        id_token: ''
      }
      res.headers['Cache-Control'] = 'no-store';
      res.headers['Pragma'] = 'no-cache';
      res.status(200).json(response);
    } catch (error) {
      res.headers['Cache-Control'] = 'no-store';
      res.headers['Pragma'] = 'no-cache';
      res.status(400).json({ error: error.message || 'invalid_request' });
    }
  };

  const handleUserInfo = async (req, res, next) => {
    try {
      res.send();
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
