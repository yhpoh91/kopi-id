import express from 'express';
import validate from 'express-validation';

import Controller from './controller';
import validator from './validation';


export default (oidcConfig) => {
  const router = express.Router({ mergeParams: true });
  const controller = Controller(oidcConfig);

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

  return router;
};
