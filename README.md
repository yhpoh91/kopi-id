# Kopi ID
A simple callback based OpenID Provider framework.

## Installation
Using `npm`:
```npm install --save kopi-id```

## Usage
```
const KopiId = require('kopi-id');

const config = { ... } // See example/config.js
const kopiId = KopiId(config);

expressApp.use('/kopiId', kopiId.express);
```

- Authentication Endpoint GET/POST `/auth`, e.g. `http://localhost:8080/kopiId/auth`
- Token Endpont: POST `/token`, e.g. `http://localhost:8080/kopiId/token`
- User Info Endpoint GET/POST `/userinfo`, e.g. `http://localhost:8080/kopiId/userinfo`

_Note: all endpoints follows the specification of Open ID Connect Core 1.0_

## Pending Features
- JWT Assymetrical Signature (Section 10.2)
- ID Token Asymmetrical Signature (Section 15.1)
- Request Object support (Section 6)
- Offline Access / Refresh Token support (Section 12)
- Pairwise Subject Identifier support (Section 8.1)
- Login Hint parameter usage support (LOW PRIORITY)
- Display parameter usage support (LOW PRIORITY)
- UI Locale parameter usage support (LOW PRIORITY)
- Claims Locale parameter usage support (LOW PRIORITY)
- ACR Values parameter usage support (LOW PRIORITY)
- Signed User Info support (Section 5.3.2)
- Encrypted User Info support (Section 5.3.2)
- Private Key JWT support (LOW PRIORITY)
- Aggregated Claims support (Section 5.6) (LOW PRIORITY)
- Distributed Claims support (Section 5.6) (LOW PRIORITY)
- Self-Issued Openid Provider support (Section 7) (LOW PRIORITY)
- Third Party Login support (Section 4)



Reference: https://openid.net/specs/openid-connect-core-1_0.html
