import expressRouter from './router';

export default (configuration = {}) => {
  const getClient = async (clientId) => {
    if (clientId === 'ExampleClientId') {
      return Promise.resolve({
        clientId: 'ExampleClientId',
        clientSecret: 'ExampleClientSecret',
        redirectUri: ['/'],
      });
    }
    return Promise.resolve(null);
  }

  const defaultConfig = {
    loginPage: '/auth/login',
    consentPage: '/auth/consent',

    getClient,
  };

  const config = Object.assign({}, defaultConfig, configuration);
  return {
    express: expressRouter,
  };
};
