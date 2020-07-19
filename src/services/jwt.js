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

  const signToken = async (payload, client) => {
    try {
      const options = {
        algorithm: jwtAlgorithm,
        expiresIn: accessTokenExpiresIn,
        audience: client.id,
        issuer: host,
      };
      const token = jsonwebtoken.sign(payload, client.secret, options);
      return Promise.resolve(token);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const verifyToken = async (token, client) => {
    try {
      const options = {
        algorithm: jwtAlgorithm,
        expiresIn: accessTokenExpiresIn,
        audience: client.id,
        issuer: host,
      };

      const payload = jsonwebtoken.verify(token, client.secret, options);
      return Promise.resolve(payload);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  return {
    signIdToken,
    verifyIdToken,

    signToken,
    verifyToken,
  };
};
