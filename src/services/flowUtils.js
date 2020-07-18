import Constants from '../constants';

const hasResponseType = (responseTypes, target) => {
  for (let i = 0; i < responseTypes.length; i += 1) {
    if (responseTypes[i] === target) {
      return true;
    }
  }

  return false;
}

const getFlowType = (responseTypes) => {
  const hasCode = hasResponseType(responseTypes, Constants.authenticationRequest.responseTypes.CODE);
  const hasIdToken = hasResponseType(responseTypes, Constants.authenticationRequest.responseTypes.ID_TOKEN);
  const hasToken = hasResponseType(responseTypes, Constants.authenticationRequest.responseTypes.TOKEN);

  if (hasCode && (hasIdToken || hasToken)) {
    return Constants.flowType.HYBRID;
  }

  if (hasCode) {
    return Constants.flowType.AUTHORIZATION_CODE;
  }

  if (hasIdToken) {
    return Constants.flowType.IMPLICIT;
  }

  if (hasToken) {
    return Constants.flowType.HYBRID;
  }

  return null;
};

export default {
  getFlowType,
};

