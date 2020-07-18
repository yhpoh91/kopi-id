import loggerService from '../services/logger';


const { L } = loggerService('Controller');

const handleAuthenticationRequest = async (authenticationRequest, req, res, next) => {
  try {
    console.log(authenticationRequest);
    res.send();
  } catch (error) {
    next(error);
  }
};

const handleTokenRequest = async (tokenRequest, req, res, next) => {
  try {
    console.log(authenticationRequest);
    res.send();
  } catch (error) {
    next(error);
  }
};

const authenticationRequestGet = (req, res, next) => handleAuthenticationRequest(req.query, req, res, next);
const authenticationRequestPost = (req, res, next) => handleAuthenticationRequest(req.body, req, res, next);

const tokenRequestPost = (req, res, next) => handleTokenRequest(req.body, req, res, next);

export default {
  authenticationRequestGet,
  authenticationRequestPost,

  tokenRequestPost,
};
