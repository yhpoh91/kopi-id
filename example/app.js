import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import helmet from 'helmet';

import Oidc from '../src/oidc';

const environment = process.env.NODE_ENV || 'development';
const listenIp = '0.0.0.0';
const listenPort = process.env.PORT || 8080;

// Application
const app = express();
const oidc = Oidc({
  host: 'http://localhost:8080',
  loginPage: 'login.html',
  consentPage: 'consent.html',

  idTokenExpiresIn: 3600,
  accessTokenExpiresIn: 3600,
  authorizationCodeLength: 256,
});

app.set('trust proxy', true);
app.set('view engine', 'jade');

app.use(helmet());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Api Router
app.use('/', express.static('example/public'));
app.get('/sinkhole', (req, res) => {
  console.log(req.query);
  res.send();
});
app.use('/oidc', oidc.express);

app.post('/login', (req, res) => {
  console.log('Login Requested');
  console.log(req.body);
  const { username, password, authenticationRequestId } = req.body;
  const isUserAuthenticated = (username === 'user' && password === 'pass');
  oidc.handleAuthenticated(res, authenticationRequestId, 'uid', isUserAuthenticated, false);
});

app.post('/consent', (req, res) => {
  console.log('Consent Requested');
  console.log(req.body);
  const { authorizationRequestId, isConsentGivenAllow } = req.body;
  oidc.handleAuthorized(res, authorizationRequestId, isConsentGivenAllow, false);
});

// Server
const httpServer = http.createServer(app);
httpServer.listen(listenPort, listenIp, () => {
  console.log(`Server (${environment}) listening on ${listenIp}:${listenPort}`);
});
