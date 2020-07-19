const redirect = (res, redirectUri, state, errorType, errorDescription) => {
  // Send Redirect with Error (login_required)
  let query = `error=${encodeURIComponent(errorType)}`;
  query += errorDescription != null && errorDescription !== '' ? `&error_description=${encodeURIComponent(errorDescription)}` : '';
  query += state != null && state !== '' ? `&state=${encodeURIComponent(state)}` : '';
  res.redirect(`${redirectUri}?${query}`);
}

const redirectInternalServiceError = (res, redirectUri, state, description) => redirect(
  res, redirectUri, state,
  'internal_server_error',
  description || 'an error occurred within the server',
);

const redirectInteractionRequired = (res, redirectUri, state, description) => redirect(
  res, redirectUri, state,
  'interaction_required',
  description || 'unable to authenticate without user interaction',
);

const redirectLoginRequired = (res, redirectUri, state, description) => redirect(
  res, redirectUri, state,
  'login_required',
  description || 'user is not authenticated',
);

const redirectConsentRequired = (res, redirectUri, state, description) => redirect(
  res, redirectUri, state,
  'consent_required',
  description || 'user did not allow permission for scope requested',
);

const redirectAccountSelectionRequired = (res, redirectUri, state, description) => redirect(
  res, redirectUri, state,
  'account_selection_required',
  description || 'user did not select any authenticated account',
);

const redirectInvalidRequest = (res, redirectUri, state, description) => redirect(
  res, redirectUri, state,
  'invalid_request',
  description || 'invalid request',
);

const redirectInvalidRequestUri = (res, redirectUri, state, description) => redirect(
  res, redirectUri, state,
  'invalid_request_uri',
  description || 'request uri invalid or does not belong to client',
);

export default {
  redirectInternalServiceError,
  redirectInteractionRequired,
  redirectLoginRequired,
  redirectConsentRequired,
  redirectAccountSelectionRequired,
  redirectInvalidRequest,
  redirectInvalidRequestUri,
};
