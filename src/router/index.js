import express from 'express';
import validate from 'express-validation';

import controller from './controller';
import validator from './validation';

const router = express.Router({ mergeParams: true });

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

export default router;
