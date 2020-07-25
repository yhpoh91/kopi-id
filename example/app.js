import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import helmet from 'helmet';

import Oidc from '../src/oidc';
import oidcConfig from './config';

const environment = process.env.NODE_ENV || 'development';
const listenIp = '0.0.0.0';
const listenPort = process.env.PORT || 8080;

// OpenID Connect
const oidc = Oidc(oidcConfig);

// Application
const app = express();

app.set('trust proxy', true);
app.set('view engine', 'jade');

app.use(helmet());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/', express.static('example/public'));
app.get('/sinkhole', (req, res) => res.json(req.query));

// OpenID Routes
app.use('/oidc', oidc.express);

// Login API Route
app.post('/login', (req, res) => {
  const { username, password, authenticationRequestId } = req.body;
  const isUserAuthenticated = (username === 'user' && password === 'pass');
  oidc.handleAuthenticated(res, authenticationRequestId, 'uid', isUserAuthenticated, false);
});

// Consent API Route
app.post('/consent', (req, res) => {
  const { authorizationRequestId, isConsentGivenAllow } = req.body;
  oidc.handleAuthorized(res, authorizationRequestId, isConsentGivenAllow, false);
});

// Server
const httpServer = http.createServer(app);
httpServer.listen(listenPort, listenIp, () => console.log(`Server (${environment}) listening on ${listenIp}:${listenPort}`));
