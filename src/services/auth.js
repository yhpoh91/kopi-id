import Constants from '../constants';
import JwtService from './jwt';
import TokenService from './token';

import flowUtils from './flowUtils';
import hashService from './hash';
import loggerService from './logger';
import redirectService from './redirect';

export default (oidcConfig) => {
  const { L } = loggerService('Auth Service', oidcConfig.logLevel);
  const jwtService = JwtService(oidcConfig);
  const tokenService = TokenService(oidcConfig, jwtService);

  const handleAuthenticated = async (res, authenticationRequestId, sub, isUserAuthenticated, isSilentAuthenticated) => {
    try {
      const authenticationRequest = await oidcConfig.onLoadAuthenticationRequest(authenticationRequestId);
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
      const client = await oidcConfig.onGetClient(clientId);
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
      const authorizationRequestId = await oidcConfig.onSaveAuthorizationRequest(authenticationRequestId, sub);

      // Generate Consent Url
      const consentUrl = `${oidcConfig.host}/${oidcConfig.consentPage}?authorizationRequestId=${authorizationRequestId}`;

      // Check CONSENT prompt
      if (prompt && prompt.includes(Constants.authenticationRequest.prompt.CONSENT)) {
        // Must show consent page, redirect to consent page
        res.redirect(consentUrl);
        return;
      }

      // Check previously given consent (optional)
      const isConsentGiven = await oidcConfig.onIsConsentGiven(sub, scope, clientId);
      if (isConsentGiven) {
        return handleAuthorized(res, authorizationRequestId, true, true);
      }
  
      // Redirect to consent page
      res.redirect(consentUrl);
    } catch (error) {
      L.error(error.message);
      L.debug(error);
      res.status(500).send();
    }
  };

  const handleAuthorized = async (res, authorizationRequestId, isConsentGiven, isSilentConsent) => {
    try {
      const authorizationRequest = await oidcConfig.onLoadAuthorizationRequest(authorizationRequestId);
      const { authenticationRequestId, sub } = authorizationRequest;

      const authenticationRequest = await oidcConfig.onLoadAuthenticationRequest(authenticationRequestId);
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

      const client = await oidcConfig.onGetClient(clientId);
  
      if (!isConsentGiven) {
        // Send Redirect with Error (consent_required)
        return redirectService.redirectConsentRequired(res, redirectUri, state);
      }

      if (isSilentConsent && prompt && prompt.includes(Constants.authenticationRequest.prompt.CONSENT)) {
        // Send Redirect with Error (consent_required)
        return redirectService.redirectConsentRequired(res, redirectUri, state);
      }

      // Set Consent Given
      await oidcConfig.onSetConsentGiven(sub, scope, clientId);
  
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
        const authorizationCode = await oidcConfig.onSaveAuthorization(authorizationRequestId, sub);

        // Hash Authorization Code
        const buffer = hashService.hash(authorizationCode, oidcConfig.hashAlgorithm);
        cHash = buffer.slice(0, buffer.length / 2)
          .toString('base64');

        query += `&code=${encodeURIComponent(authorizationCode)}`;
      }
      if (hasAccessToken) {
        // Generate Access Token
        const accessToken = await tokenService.generateToken(client, sub, scope, authTime, nonce, cHash);

        // Hash Access Token
        const buffer = hashService.hash(accessToken, oidcConfig.hashAlgorithm);
        atHash = buffer.slice(0, buffer.length / 2)
          .toString('base64');

        query += `&access_token=${encodeURIComponent(accessToken)}`;
        query += `&expires_in=${encodeURIComponent(oidcConfig.accessTokenExpiresIn)}`;
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
      L.error(error.message);
      L.debug(error);
      res.status(500).send();
    }
  };

  return {
    handleAuthenticated,
    handleAuthorized,
  };
};
