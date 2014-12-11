var uuid = require('node-uuid');
var gapiUtil = require('./util/gapi-util');
var l = require("./logger");
var status = require('./status');
var config = require('./config');
var prefs = require('./prefs');
var exportTimer = require('./export-timer');
var driveUtil = require('./drive-util');
var drive = require('./drive');
var about = require('./about');
var Tree = require('./Tree');
var shared = require('./shared');
var exporter = require('./exporter');
var appUtil = require('./app-util');

var SESSION_TIMEOUT_MS = 1000 * 60 * 60.0;
var postMethods = {};
var sessionId;
var lastActivity;


exports.handlePost = function(request, response) {

	// rem, if the browser cookie expires, it will be empty
	var browserSessionId = request.cookies.sessionId ? request.cookies.sessionId : '';

	var action = request.body.action;

	l.i('[SERVICE]', '[host]', request.headers.host, '[request url]', request.url, '[action]', action);

	// debugging info
	// var sb = browserSessionId.substr(0, 3);
	// var ss = sessionId ? sessionId.substr(0, 3) : '-';
	// var min = (new Date().getTime() - lastActivity) / 1000 / 60;
	// l.i('[SERVICE]', '[browser sid]', sb, '[server sid]', ss, '[minutes since last request]', min);

	var sessionsMatch = sessionId && sessionId == request.cookies.sessionId;
	var timedOut = new Date().getTime() - lastActivity > SESSION_TIMEOUT_MS;

	// separate treatment for login
	if (action == 'login')
	{
		if (!sessionId || timedOut || sessionsMatch) {
			return login(request, response);
		}
		else {
			var dontAllowSessionOverwrite = false;  // it's probably impractical to not allow this...
			if (dontAllowSessionOverwrite) {
				return appUtil.sendResponse(response, null, 'A session is already in progress');
			}
			else {
				return login(request, response);
			}
		}
	}

	if (timedOut) return appUtil.sendResponse(response, null, 'Session expired');
	if (! sessionsMatch) return appUtil.sendResponse(response, null, 'Session mismatch');

	// at this point, we know it's a legal logged-in user
	routePost(action, request, response);
};

var routePost = function (action, request, response) {

	for (var s in postMethods) {
		if (action == s) {
			lastActivity = new Date().getTime();
			var method = postMethods[s];
			return method(request, response);
		}
	}

	// no match
	appUtil.sendResponse(response, null, 'Bad request');
};

/**
 * Client expects most all responses to send as much 'state' as possible:
 * - prefs object
 * - status object
 * - simpleFolderList (must be authorized and have drive data)
 * - simpleFileList (must be authorized, have drive data, and have a selected base folder)
 */
makeStateObject = function() {

	var o = {};
	o.prefs = prefs.objectForService();
	o.status = status.objectForService();

	// rem, these two lists are just so the client make dropdowns
	// they are not needed internally for the export step
	if (drive.simpleFolderList()) {
		o.simpleFolderList = drive.simpleFolderList();
	}
	if (prefs.driveBaseFolderId() && shared.tree() && shared.tree().simpleFileList()) {
		o.simpleFileList = shared.tree().simpleFileList();
	}
	return o;
};

// ---------------------------------------------------------------------------------------------------------------------
// POST METHODS

var login = function (request, response) {

	var un = request.body.un;  // unused (just for show)
	var pw = request.body.pw;

	if (pw != config.password()) {
		return appUtil.sendResponse(response, null, 'No');
	}

	sessionId = uuid.v4();
	lastActivity = new Date().getTime();
	l.i("[SERVICE] USER LOGGED IN ", sessionId);

	response.cookie('sessionId', sessionId, { maxAge: SESSION_TIMEOUT_MS });
	appUtil.sendResponse(response, makeStateObject());
};

postMethods.logout = function (request, response) {

	sessionId = '';
	l.i("[SERVICE] USER LOGGED OUT ", sessionId);

	// erase cookie of session id
	response.cookie('sessionId', sessionId, { maxAge: -1 });
	appUtil.sendResponse(response, {} );
};

/**
 * Client sends id and secret, as well as the redirect url (which is the url of the page itself!)
 * Server inits the oauthclient, and sends back the encoded consent url
 */
postMethods.startAuth = function (request, response) {

	if (status.isExporting) {
		// shouldn't happen
		return appUtil.sendResponse(response, null, 'Server is currently exporting');
	}

	var clientId = request.body.id;
	var clientSecret = request.body.secret;
	var redirectUrl = request.body.redirectUrl

	if (! clientId || ! clientSecret || ! redirectUrl) {
		return appUtil.sendResponse(response, null, 'Missing value/s');
	}


	// save gapi settings
	var isDifferentClientId = (clientId != prefs.googleApiClientId());
	prefs.setGoogleApiClientId(clientId);
	prefs.setGoogleApiClientSecret(clientSecret);
	prefs.setGoogleApiRedirectUrl(redirectUrl);
	if (isDifferentClientId) {
		prefs.setDriveBaseFolderId(null);
		prefs.setDriveDefaultDocumentId(null);
	}
	prefs.save();

	// clear 'state'
	exportTimer.stop();
	status.resetExportStatus();
	shared.setTree(null);

	// init oauth client with new settings
	gapiUtil.initOauthClient(clientId, clientSecret, redirectUrl);

	var o = makeStateObject();
	o.consentUrl = gapiUtil.consentUrl( config.driveScopeUrl() );
	l.v('startAuth - consentUrl:', o.consentUrl);
	appUtil.sendResponse(response, o);
};

// Client has gone to Google consent page, come back, and is sending server the auth code.
//
postMethods.setCode = function (request, response) {
	
	if (! request.body.value) return appUtil.sendResponse(response, null, 'No code received');

	var onResult = function (err, refreshToken) {

		if (err) return appUtil.sendResponse(response, null, err.toString());

		prefs.setRefreshToken(refreshToken);
		prefs.save();

		appUtil.sendResponse(response, makeStateObject());
	};

	gapiUtil.authorizeWithCallbackCode(request.body.value, onResult);
};

postMethods.deauth = function (request, response) {

	if (! prefs.refreshToken()) return appUtil.sendResponse(response, null, 'Nothing to revoke');

	var cb = function (errorDesc) {

		if (errorDesc) return appUtil.sendResponse(response, null, errorDesc);
		l.v('deauth success');

		prefs.setRefreshToken(null);
		prefs.setDriveBaseFolderId(null);
		prefs.setDriveDefaultDocumentId(null);
		prefs.save();

		gapiUtil.clearOauthClient();
		exportTimer.stop();

		appUtil.sendResponse(response, makeStateObject());
	};

	gapiUtil.revokeToken(prefs.refreshToken(), cb);
};

postMethods.getState = function (request, response) {

	appUtil.sendResponse(response, makeStateObject());
};

postMethods.getStatus = function (request, response) {

	// send only the status object (client is requesting status on a quick interval)
	var o = { status: status.objectForService() };
	appUtil.sendResponse(response, o);
};

// Gets the full files list for drive
//
postMethods.getDriveDataAndMakeTree = function (request, response) {

	var onResponse = function (error) {
		if (error) {
			if (error == 'invalid_grant') {
				// a more user-friendly error message
				error = "Bad refresh token. You will need to re-authorize your Google API account.";
			}
			return appUtil.sendResponse(response, null, error);
		}

		appUtil.sendResponse(response, makeStateObject() );
	};

	driveUtil.getDriveDataAndMakeTree(onResponse);
};


postMethods.setBaseFolderId = function (request, response) {

	// prereq check
	if (! drive.data()) return appUtil.sendResponse(response, null, 'Drive data required');
	
	var id = request.body.value;
	if (! id) return appUtil.sendResponse(response, null, 'id required');

	var o = drive.findItemById(id);
	if (! o) return appUtil.sendResponse(response, null, 'No such folder');

	//

	prefs.setDriveBaseFolderId(id);
	prefs.setDriveDefaultDocumentId('');
	prefs.save();

	// we can now make the file structure
	var tree = Tree.makeFromDriveData(o, prefs.mimeTypesToExport(), drive.data());
	shared.setTree(tree);

	appUtil.sendResponse(response, makeStateObject());
};

postMethods.setDefaultDocumentId = function (request, response) {

	// prereq check
	if (! drive.data()) {
		return appUtil.sendResponse(response, null, 'Drive data required');
	}
	if (! shared.tree() || ! shared.tree().simpleFileList()) {
		return appUtil.sendResponse(response, null, 'Tree not set');
	}

	var id = (! request.body.value || request.body.value == 'none') ? '' : request.body.value;
	if (id.length > 0 &&  ! shared.tree().hasFileItemWithId(id)) return appUtil.sendResponse(response, null, 'No such document');

	prefs.setDriveDefaultDocumentId(id);
	prefs.save();

	appUtil.sendResponse(response, makeStateObject());
};

postMethods.setWikiTitle = function (request, response) {

	prefs.setWikiTitle(request.body.value || '');
	prefs.save();

	appUtil.sendResponse(response, makeStateObject());
};

postMethods.setRefreshIntervalCode = function (request, response) {

	var value = request.body.value;
	var ok = (value >= -1 && value < prefs.REFRESH_INTERVAL_HOURS.length);
	if (! ok) return appUtil.sendResponse(response, null, 'Bad value');

	prefs.setRefreshIntervalCode(value);
	prefs.save();

	exportTimer.setWithCode(value);

	appUtil.sendResponse(response, makeStateObject());
};

postMethods.exportWiki = function (request, response) {

	if (status.isGenerating) {
		return appUtil.sendResponse(response, null, 'Service is already generating files');
	}

	// Immediately send a response; client will start polling for status
	appUtil.sendResponse(response, makeStateObject());

	// Start exporting
	exporter.exportWiki();
};

/**
 * Debugging
 */
postMethods.wait = function (request, response) {
	setTimeout(function() {
		appUtil.sendResponse(response, makeStateObject());
	}, 2500);
};
