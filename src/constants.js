export default {
  flowType: {
    AUTHORIZATION_CODE: 'authorization_code',
    IMPLICIT: 'implicit',
    HYBRID: 'hybrid',
  },
  authenticationRequest: {
    scope: {
      OPENID: 'openid'
    },
    responseTypes: {
      CODE: 'code',
      ID_TOKEN: 'id_token',
      TOKEN: 'token',
    },
    display: {
      PAGE: 'page',
      POPUP: 'popup',
      TOUCH: 'touch',
      WAP: 'wap'
    },
    prompt: {
      NONE: 'none',
      LOGIN: 'login',
      CONSENT: 'consent',
      SELECT_ACCOUNT: 'select_account',
    },
  },
};
