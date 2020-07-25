import ValidationService from '../services/validate';

import loggerService from '../services/logger';

export default (oidcConfig, validationService) => {
  const { L } = loggerService('Client Auth Service', oidcConfig.logLevel);

  const authenticateClientSecretBasic = async (token) => {
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const components = decoded.split(':');

      if (components.length !== 2) {
        throw new Error('Invalid number of components in Basic token');
      }

      const [clientId, clientSecret] = components;
      // Validate client secret
      const client = await oidcConfig.onGetClient(clientId);
      if (client.secret !== clientSecret) {
        throw new Error('Authentication Failed');
      }
      return Promise.resolve(clientId);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const authenticateClientSecretPost = async (body) => {
    try {
      const { client_id: clientId, client_secret: clientSecret } = body;

      // Validate client secret
      const client = await oidcConfig.onGetClient(clientId);
      if (client.secret !== clientSecret) {
        throw new Error('Authentication Failed');
      }
      return Promise.resolve(clientId);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const authenticateClientSecretJwt = async (body) => {
    try {
      const { client_assertion: clientAssertion } = body;

      // Validate client secret jwt
      const clientId = await validationService.validateClientSecretJwt(clientAssertion);
      return Promise.resolve(clientId);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const hasClientSecretPost = body => body.client_id != null && body.client_id !== '' && body.client_secret != null && body.client_secret !== '';
  const hasClientSecretJwt = body => body.client_assertion_type === 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';

  const checkClientAuthentication = async (req, res, next) => {
    try {
      const authorizationHeader = req.headers['authorization'];
      const basicPrefix = 'Basic ';
      
      let clientId = null;
      if (authorizationHeader && authorizationHeader.indexOf(basicPrefix) === 0) {
        const token = authorizationHeader.slice(basicPrefix.length);
        clientId = await authenticateClientSecretBasic(token);
      } else if (hasClientSecretPost(req.body)) {
        clientId = await authenticateClientSecretPost(req.body);
      } else if (hasClientSecretJwt(req.body)) {
        clientId = await authenticateClientSecretJwt(req.body);
      }

      if (clientId == null || clientId === '') {
        L.error('null or empty client ID');
        res.status(401).send();
        return;
      }

      req.clientId = clientId;
      next();
    } catch (error) {
      L.error(error.message);
      L.debug(error);
      res.status(401).send();
    }
  };

  return {
    checkClientAuthentication,
  };
};
