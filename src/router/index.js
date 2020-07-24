import express from 'express';
import validate from 'express-validation';

import Controller from './controller';
import validator from './validation';

import ValidationService from '../services/validate';

export default (oidcConfig) => {
  const router = express.Router({ mergeParams: true });
  const controller = Controller(oidcConfig);

  const validationService = ValidationService(oidcConfig);

  const checkAccessToken = async (req, res, next) => {
    try {
      const authorizationHeader = req.headers['authorization'];
      const bearerPrefix = 'Bearer ';
  
      if (authorizationHeader.indexOf(bearerPrefix) !== 0) {
        res.status(401).send();
        return;
      }
  
      const accessToken = authorizationHeader.slice(bearerPrefix.length);
      if (accessToken === '') {
        res.status(401).send();
        return;
      }
  
      // Validate Access Token
      req.tokenPayload = await validationService.validateToken(accessToken, oidcConfig.accessTokenSecret);
      next();
    } catch (error) {
      next(error);
    }
  };

  router.route('/authorize')
    .get(
      validate(validator.authenticationRequestGet),
      controller.authenticationRequestGet,
    )
    .post(
      validate(validator.authenticationRequestPost),
      controller.authenticationRequestPost,
    );
  
  router.route('/token')
    .post(
      validate(validator.tokenRequestPost),
      controller.tokenRequestPost,
    );

  router.route('/userinfo')
    .get(
      checkAccessToken,
      controller.userInfoGet,
    )
    .post(
      checkAccessToken,
      controller.userInfoPost,
    );

  return router;
};
