/**
 * DriveUtil
 * All Google Drive API interactions are done thru there
 * Keep this free of project dependencies
 *
 * In the end, this doesn't do a whole lot
 */

var util = require('util');
var assert = require('assert');
var url = require('url');
var fs = require('fs');
var https = require('http');
var googleapis 	= require('googleapis');
var l = require("./../logger");

var gapiClient;
var consentUrl;

var oauth2Client;

exports.MIMETYPE_GOOGLEFOLDER = "application/vnd.google-apps.folder";
exports.MIMETYPE_GOOGLEDOCUMENT = "application/vnd.google-apps.document";

/**
 * Gets and stores the specified Google API client object.
 *
 * @param type 		eg, 'drive'
 * @param version 	eg, 'v2'
 * @param callback 	arg1 - error, if any
 */
exports.initGapiClient = function (type, version, callback) {

	googleapis.discover(type, version).execute(function (err, client) {
		if (err) return callback(err);
		gapiClient = client[type];
		callback();
	});
};

/**
 *
 */
exports.initOauthClient = function (clientId, clientSecret, redirectUrl) {
	oauth2Client = new googleapis.OAuth2Client(clientId, clientSecret, redirectUrl);
}

exports.clearOauthClient = function () {
	oauth2Client = null;
}

/**
 * Google API consent page which user gets redirected to during authorization process
 * Has permission-level (scope) encoded in it
 */
exports.consentUrl = function (scope) {

	// access_type = offline  +  approval_prompt = force
	// means we'll get a refresh token when we do getToken()

	assert(scope, 'scope argument required');

	var s = oauth2Client.generateAuthUrl({
		access_type: 'offline',
		approval_prompt: 'force',
		scope: scope
	});
	return s;
}

/**
 * Callback - arg1: error string; arg2: refresh token string
 */
exports.authorizeWithCallbackCode = function(code, callback) {

	var onResponse = function (err, tokens) {

		if (err) return callback(err);
		// l.v('got tokens \r\n' + JSON.stringify(tokens, null, 4));

		var refreshToken = tokens.refresh_token;
		if (! refreshToken) return callback('No refresh token');
		l.v("got refresh token");

		exports.setRefreshToken(refreshToken);

		callback(null, refreshToken);
	};

	oauth2Client.getToken(code, onResponse);
};

exports.setRefreshToken = function(s) {
	oauth2Client.setCredentials( { refresh_token: s } );
};

/**
 * Can take either access or refresh token. The result with be that it revokes both
 *
 * @param callback - arg1: error description
 */
exports.revokeToken = function(token, callback) {

	oauth2Client.revokeToken(token, callback);

//	var req = https.get(REVOKE_TOKEN_URL, function(response) {
//
//		if (response.statusCode == 200) return callback();  // success
//
//		l.v('revokeToken response status code != 200: ', response.toString());
//		callback(new Error('Bad status code: ' + response.statusCode));
//	});
//
//	req.on('error', function(err) {
//		l.v('revokeToken response error handler: ', err);
//		callback(true);
//	});

}

// ---------------------

/**
 * Makes a Google API call
 * Callback signature: error, response object
 */
exports.request = function (command1, command2, params, callback) {

	if (! oauth2Client) return callback(new Error('Oauth client not initalized'));
	if (! oauth2Client.credentials) return callback(new Error('Oauth client has no credentials'));

	if (! gapiClient[command1]) return callback(new Error("No such command1: " + command1));
	if (! gapiClient[command1][command2]) return callback(new Error("No such command2: " + command2));

	var onResponse = function (error, response) {
		if (error) return callback(error);
		callback(null, response);
	};

	var fn = gapiClient[command1][command2];
	fn(params).withAuthClient(oauth2Client).execute(onResponse);
};


exports.downloadToFile = function(u, dest, callback) {

	var onResponse = function (err, body, response) {

		if (response.statusCode != 200) {
			l.w("download error - bad statuscode", response.statusCode, u);
			return callback(new Error( 'bad statuscode', response.statusCode ));
		}
		if (err) {
			l.w('download error: ', util.inspect(err), u);
			return callback(new Error( util.inspect(err) ));
		}

		fs.writeFile(dest, body, 'utf8', function(err) {
			if (err) {
				l.w('save error: ', util.inspect(err), u, dest);
			}
			callback(err);
		});
	};

	// Automatically sets credentials; uses 'request' lib under the hood
	// (https://github.com/mikeal/request)
	// Probably not appropriate for large downloads

	oauth2Client.request( {uri:u }, onResponse);
}