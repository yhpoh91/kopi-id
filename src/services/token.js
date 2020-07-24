export default (oidcConfig, jwtService) => {
  const generateIdToken = async (client, sub, authTime, nonce, cHash, atHash) => {
    try {
      const tokenPayload = { sub };
      if (authTime) {
        tokenPayload.auth_time = authTime;
      }
      if (nonce && nonce !== '') {
        tokenPayload.nonce = nonce;
      }
      if (cHash && cHash !== '') {
        tokenPayload.c_hash = cHash;
      }
      if (atHash && atHash !== '') {
        tokenPayload.at_hash = atHash;
      }
      
      const idToken = await jwtService.signIdToken(tokenPayload, client);
      return Promise.resolve(idToken);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const generateToken = async (client, sub, scope, authTime, nonce, cHash) => {
    try {
      const { accessTokenSecret } = oidcConfig;
      const tokenPayload = { sub, scope };
      if (authTime) {
        tokenPayload.auth_time = authTime;
      }
      if (nonce && nonce !== '') {
        tokenPayload.nonce = nonce;
      }
      if (cHash && cHash !== '') {
        tokenPayload.c_hash = cHash;
      }
      
      const token = await jwtService.signToken(tokenPayload, client, accessTokenSecret);
      return Promise.resolve(token);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  return {
    generateIdToken,
    generateToken,
  };
};
