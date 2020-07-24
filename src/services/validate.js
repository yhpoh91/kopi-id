import JwtService from './jwt';

import loggerService from './logger';
import hashService from './hash';

export default (oidcConfig) => {
  const { L } = loggerService('Validation Service');
  const jwtService = JwtService(oidcConfig);

  const validateAuthorizationCode = async (authorizationCode) => {
    try {
      const authorizationRequest = await oidcConfig.onLoadAuthorization(authorizationCode);
      if (authorizationRequest == null) {
        return Promise.resolve(null);
      }

      // Revoke, only allow one time validation
      await oidcConfig.onRevokeAuthorization(authorizationCode);
      return Promise.resolve(authorizationRequest);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const validateIdToken = async (idToken, client) => {
    try {
      const payload = jwtService.verifyIdToken(idToken, client);
      return Promise.resolve(payload);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const validateToken = async (token, accessTokenSecret) => {
    try {
      const payload = await jwtService.verifyToken(token, accessTokenSecret);
      return Promise.resolve(payload);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  return {
    validateAuthorizationCode,
    validateIdToken,
    validateToken,
  };
};
