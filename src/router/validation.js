import Joi from 'joi';

import Constants from '../constants';

const validResponseTypes = [
  Constants.authenticationRequest.responseTypes.CODE,
  Constants.authenticationRequest.responseTypes.ID_TOKEN,
  Constants.authenticationRequest.responseTypes.TOKEN,
];

const validDisplay = [
  Constants.authenticationRequest.display.PAGE,
  Constants.authenticationRequest.display.POPUP,
  Constants.authenticationRequest.display.TOUCH,
  Constants.authenticationRequest.display.WAP,
];

const validPrompts = [
  Constants.authenticationRequest.prompt.NONE,
  Constants.authenticationRequest.prompt.LOGIN,
  Constants.authenticationRequest.prompt.CONSENT,
  Constants.authenticationRequest.prompt.SELECT_ACCOUNT,
];


const CustomJoi = Joi.extend((joi) => ({
  base: joi.array(),
  name: 'spaceArray',
  coerce: (value, state, options) => {
    if(typeof value !== 'string') {
      return value;
    }

    return value.trim().split(' ');
  },
}));

export default {
  authenticationRequestGet: {
    query: {
      scope: CustomJoi.spaceArray().has(Constants.authenticationRequest.scope.OPENID).required(),
      response_type: CustomJoi.spaceArray().items(Joi.string().valid(validResponseTypes)).required(),
      client_id: Joi.string().min(1).required(),
      redirect_uri: Joi.string().min(1).required(),
      state: Joi.string().optional(),

      response_mode: Joi.string().optional(),
      nonce: Joi.when('response_type', {
        is: Joi.array().has(Constants.authenticationRequest.responseTypes.ID_TOKEN),
        then: Joi.when('response_type', {
          is: Joi.array().has(Constants.authenticationRequest.responseTypes.CODE),
          then: Joi.string().optional(),
          otherwise: Joi.string().required(),
        }),
        otherwise: Joi.string().optional(),
      }),
      display: Joi.string().valid(validDisplay).optional(),
      prompt: CustomJoi.spaceArray().items(Joi.string().valid(validPrompts)).optional(),
      max_age: Joi.number().integer().min(0).optional(),
      ui_locales: CustomJoi.spaceArray().items(Joi.string()).optional(),
      id_token_hint: Joi.string().optional(),
      login_hint: Joi.string().optional(),
      acr_values: CustomJoi.spaceArray().items(Joi.string()).optional(),
    },
    params: {},
    body: {},
  },
  authenticationRequestPost: {
    query: {},
    params: {},
    body: {
      scope: CustomJoi.spaceArray().has(Constants.authenticationRequest.scope.OPENID).required(),
      response_type: Joi.alternatives([
        CustomJoi.spaceArray().items(Joi.string().valid(validResponseTypes)),
        Joi.array().items(Joi.string().valid(validResponseTypes)),
      ]).required(),
      client_id: Joi.string().min(1).required(),
      redirect_uri: Joi.string().min(1).required(),
      state: Joi.string().optional(),

      response_mode: Joi.string().optional(),
      nonce: Joi.when('response_type', {
        is: Joi.alternatives([
          CustomJoi.spaceArray().items().has(Constants.authenticationRequest.responseTypes.ID_TOKEN),
          Joi.array().has(Constants.authenticationRequest.responseTypes.ID_TOKEN),
        ]),
        then: Joi.when('response_type', {
          is: Joi.alternatives([
            CustomJoi.spaceArray().items().has(Constants.authenticationRequest.responseTypes.CODE),
            Joi.array().has(Constants.authenticationRequest.responseTypes.CODE),
          ]),
          then: Joi.string().optional(),
          otherwise: Joi.string().required(),
        }),
        otherwise: Joi.string().optional(),
      }),
      display: Joi.string().valid(validDisplay).optional(),
      prompt: Joi.alternatives([
        CustomJoi.spaceArray().items(Joi.string().valid(validPrompts)),
        Joi.array().items(Joi.string().valid(validPrompts)),
      ]).optional(),
      max_age: Joi.number().integer().min(0).optional(),
      ui_locales: Joi.alternatives([
        CustomJoi.spaceArray().items(Joi.string()),
        Joi.array().items(Joi.string())
      ]).optional(),
      id_token_hint: Joi.string().optional(),
      login_hint: Joi.string().optional(),
      acr_values: Joi.alternatives([
        CustomJoi.spaceArray().items(Joi.string()),
        Joi.array().items(Joi.string()),
      ]).optional(),
    },
  },

  tokenRequestPost: {
    query: {},
    params: {},
    body: {
      grant_type: Joi.string().required(),
      code: Joi.string().required(),
      redirect_uri: Joi.string().required(),
      client_id: Joi.string().required(),
      client_secret: Joi.string().required(),
    },
  },
};
