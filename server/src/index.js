var https = require('https');
var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require("url");
var util = require('util');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var leeUtil = require('./util/lee-util');
var driveUtil = require('./util/gapi-util');
var l = require('./logger');
var config = require('./config');
var prefs = require('./prefs');
var service = require('./service');

var serviceServer; 		// webservice; type can be either http or https; also serves the static admin console webpage
var serviceApp;

var wikiServer; 		// static server for the the public wiki website (if enabled)
var wikiApp;


var init = function() {

	if (config.isProd()) {
		process.on('uncaughtException', onUnhandledError);  // global exception handler
	}

	config.init(init2);
};

var init2 = function () {

	prefs.init();

	var ok = leeUtil.makeDirIfNeeded( config.publicWebsiteOutputDir() );
	if (! ok) throw new Error('Couldn\'t create output dir ' + config.publicWebsiteOutputDir());

	driveUtil.initGapiClient('drive', 'v2', function(error) {
		if (error) {
			l.e("Couldn't get Google API client drive object, exiting: " + error.message);
			return process.exit(1);
		}
		init3();
	});

};

var init3 = function() {

	// Init oauth client
	if (prefs.googleApiClientId() && prefs.googleApiClientSecret() && prefs.googleApiRedirectUrl()) {
		driveUtil.initOauthClient( prefs.googleApiClientId(), prefs.googleApiClientSecret(), prefs.googleApiRedirectUrl());

		if (prefs.refreshToken()) driveUtil.setRefreshToken(prefs.refreshToken());
	}

	// Init webservice server

	serviceApp = express();

	if (config.webserviceUseHttps())
	{
		var options = {
			key: fs.readFileSync(config.webserviceSslKeyPath()),
			cert: fs.readFileSync(config.webserviceSslCertPath()),
			ca: fs.readFileSync(config.webserviceSslCaPath()),
			requestCert: true,
			rejectUnauthorized: false
		};
		serviceServer = https.createServer(options, serviceApp);
		serviceServer.listen(config.webservicePort());
		l.i("webservice https server started on port", config.webservicePort());
	}
	else 
	{
		serviceServer = http.createServer(app);
		serviceServer.listen(config.webservicePort());
		l.i("webservice http server started on port", config.webservicePort());
	}

	if (config.webserviceWhitelistedHost())
	{
		// filter out requests whose host does not match webserviceWhitelistedHost

		serviceApp.use(function(req, res, next) {

			if (req.host && req.host !== config.webserviceWhitelistedHost()) {
				res.writeHead(404, { 'Content-Type': 'text/html' });
				res.end('<h2>Not found</h2>');
			}
			else {
				next();
			}
		});
	}

	serviceApp.use(bodyParser());
	serviceApp.use(cookieParser());

	serviceApp.post('/service', service.handlePost);
	serviceApp.set('json spaces', 4);

	serviceApp.use(express.static(config.webserviceWebsiteDir()));

	if (config.shouldServePublicWebsite())
	{
		wikiApp = express();

		wikiServer = http.createServer(wikiApp);
		wikiServer.listen(config.publicWebsitePort());
		l.i("wiki server started on port", config.publicWebsitePort());

		wikiApp.use(express.static(config.publicWebsiteDir()));
	}
};

// ?
var onUnhandledError = function(error) {
	
	l.e('UNHANDLED ERROR, WILL EXIT');

	l.e( util.inspect(error) );
	l.e( util.inspect(error.stack) );

	try { prefs.closeDb(); } catch (err) {}
	setTimeout(function() { process.exit(1); }, 250); // allow time to write to log
};

// ---
init();

