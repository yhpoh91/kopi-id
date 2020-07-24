import jsonwebtoken from 'jsonwebtoken';

export default (oidcConfig) => {
  const {
    host,
    jwtAlgorithm,
    idTokenExpiresIn,
    accessTokenExpiresIn,
  } = oidcConfig;

  const signIdToken = async (payload, client) => {
    try {
      const options = {
        algorithm: jwtAlgorithm,
        expiresIn: idTokenExpiresIn,
        audience: client.id,
        issuer: host,
      };
      const token = jsonwebtoken.sign(payload, client.secret, options);
      return Promise.resolve(token);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const verifyIdToken = async (token, client) => {
    try {
      const options = {
        algorithm: jwtAlgorithm,
        expiresIn: idTokenExpiresIn,
        audience: client.id,
        issuer: host,
      };

      const payload = jsonwebtoken.verify(token, client.secret, options);
      return Promise.resolve(payload);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const signToken = async (payload, client, accessTokenSecret) => {
    try {
      const options = {
        algorithm: jwtAlgorithm,
        expiresIn: accessTokenExpiresIn,
        audience: client.id,
        issuer: host,
      };
      const token = jsonwebtoken.sign(payload, accessTokenSecret, options);
      return Promise.resolve(token);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const verifyToken = async (token, accessTokenSecret) => {
    try {
      const options = {
        algorithm: jwtAlgorithm,
        expiresIn: accessTokenExpiresIn,
        issuer: host,
      };

      const payload = jsonwebtoken.verify(token, accessTokenSecret, options);
      return Promise.resolve(payload);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const validateClientSecretJwt = async (token) => {
    try {
      // Decode without Verify
      const payload = jsonwebtoken.decode(token);

      // Get Client ID
      const { sub: clientId } = payload;

      // Get Client Secret
      const client = await oidcConfig.onGetClient(clientId);

      if (client == null) {
        throw new Error('Client Not Found');
      }

      // Verify
      const { secret: clientSecret } = client;
      const options = {
        issuer: clientId,
        subject: clientId,
        audience: host,
      };
      const verifiedPayload = jsonwebtoken.verify(token, clientSecret, options);
      return Promise.resolve(verifiedPayload);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  return {
    signIdToken,
    verifyIdToken,

    signToken,
    verifyToken,

    validateClientSecretJwt,
  };
};
