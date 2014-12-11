/*
 * User configuration settings
 * Saves to json file
 *
 * Uses either a 'dev' hash or 'prod' hash based on Shared.isDev()
 */

var fs = require('fs');
var path = require('path');
var config = require('./config');
var exportTimer = require('./export-timer');
var l = require('./logger');


var REFRESH_INTERVAL_HOURS = exports.REFRESH_INTERVAL_HOURS = [24, 8, 4, 2, 1, 0.5];


var _topObj;  	// top-level JSON object, with a 'dev' hash-object and a 'prod' hash-object
var _obj; 		// is either the 'dev' hash or 'prod' hash


exports.init = function () {

	// load prefs file
	var s;
	try {
		s = fs.readFileSync(config.prefsPath(), {encoding:'utf8'});
	}
	catch (err) {
		l.e("Prefs - error: " + err.message);
	}

	if (s) {
		try {
			_topObj = JSON.parse(s);
		}
		catch (err) {
			l.e("Prefs - error: " + err.message);
		}
	}

	if (! _topObj) {
		l.i('Config - couldn\'t load prefs at ' + config.prefsPath() + ', will create new file with defaults');
		_topObj = makeDefaults();
		save();
	}

	_obj = config.isProd() ? _topObj['prod'] : _topObj['dev'];
	if (! _obj) {
		throw new Error('Prefs - prefs object missing');  // halts app
	}

	// validate some values:

	// mimeTypestoExport
	if (! _obj.mimeTypesToExport) {
		_obj.mimeTypesToExport = ['text/html'];
		l.w('no value for mimeTypesToExport, setting to default:', _obj.mimeTypesToExport);
		save();
	}

	// refresh interval
	var i = parseInt(_obj.refreshIntervalCode);
	if (! (i >= -1 && i < REFRESH_INTERVAL_HOURS.length)) {
		l.w('bad value for refreshIntervalCode, setting to -1');
		_obj.refreshIntervalCode = -1;
		save();
	}

	printValues();

	exportTimer.setWithCode(_obj.refreshIntervalCode);
};

// Should be called after making any property change
//
var save = exports.save = function() {

	var s = JSON.stringify(_topObj, null, 4);
	// l.v('Prefs.save()\r\n' + s);

	fs.writeFile(config.prefsPath(), s, 'utf8', function(error) {
		if (error) {
			exports.log().warn('Error saving prefs file:', error.message);
		}
	});
};

exports.objectForService = function() {

	// just copy the properties over
	var o = {};
	for (var key in _obj) {
		if (key == 'refreshToken') continue;  // but not this one, of course
		o[key] = _obj[key];
	}

	// and add this
	var b = (_obj.refreshToken && _obj.refreshToken.length > 0);
	o.hasRefreshToken = b ? true : false;

	return o;
};

exports.googleApiClientId  = function() {
	return _obj.googleApiClientId;
};
exports.setGoogleApiClientId = function(s) {
	_obj.googleApiClientId = s;
};

exports.googleApiClientSecret = function() {
	return _obj.googleApiClientSecret;
};
exports.setGoogleApiClientSecret = function(s) {
	_obj.googleApiClientSecret = s;
};

exports.googleApiRedirectUrl = function() {
	return _obj.googleApiRedirectUrl;
};
exports.setGoogleApiRedirectUrl = function(s) {
	_obj.googleApiRedirectUrl = s;
};

exports.userDisplayName = function() {
	return _obj.userDisplayName;
};
exports.setUserDisplayName = function(s) {
	_obj.userDisplayName = s;
};

exports.refreshToken = function () {
	return _obj.refreshToken;
};
exports.setRefreshToken = function (s) {
	_obj.refreshToken = s;
} ;

exports.driveBaseFolderId = function() {
	return _obj.driveBaseFolderId;
};
exports.setDriveBaseFolderId = function(s) {
	_obj.driveBaseFolderId = s;
};

exports.driveDefaultDocumentId = function() {
	return _obj.driveDefaultDocumentId;
};
exports.setDriveDefaultDocumentId = function(s) {
	_obj.driveDefaultDocumentId = s;
};

exports.wikiTitle = function() {
	return _obj.wikiTitle;
};
exports.setWikiTitle = function(s) {
	_obj.wikiTitle = s;
};

exports.refreshIntervalCode = function() {
	return _obj.refreshIntervalCode;
};
exports.setRefreshIntervalCode = function(o) {
	_obj.refreshIntervalCode = parseInt(o);
};

exports.mimeTypesToExport = function() {
	return _obj.mimeTypesToExport;
};
exports.setMimeTypesToExport = function(a) {
	_obj.mimeTypesToExport = a;
};


var makeDefaults = function () {

	var makeObj = function () {
		var o = {};
		// mostly just populating hash keys to make json text file be more easily editable
		o.googleApiClientId = null;
		o.googleApiClientSecret = null;
		o.googleApiRedirectUrl = null;
		o.userDisplayName = null;
		o.refreshToken  = null;
		o.driveBaseFolderId = null;
		o.driveDefaultDocumentId = null;
		o.wikiTitle = null;
		o.refreshIntervalCode = -1;
		o.mimeTypesToExport = ['text/html'];
		return o;
	};

	var o = {};
	o.dev = makeObj();
	o.prod = makeObj();
	return o;
};

var printValues = function () {

	l.i("");
	l.i('PREF VALUES (at start-time)')
	l.i("");
	l.i("googleApiClientId        :", _obj.googleApiClientId);
	l.i("googleApiClientSecret    :", _obj.googleApiClientSecret);
	l.i("googleApiRedirectUrl     :", _obj.googleApiRedirectUrl);
	l.i("userDisplayName          :", _obj.userDisplayName);
	l.i("refreshToken             :", _obj.refreshToken ? JSON.stringify(_obj.refreshToken).substr(0,8) + '...' : _obj.refreshToken);
	l.i("driveBaseFolderId        :", _obj.driveBaseFolderId);
	l.i("driveDefaultDocumentId   :", _obj.driveDefaultDocumentId);
	l.i("wikiTitle                :", _obj.wikiTitle);
	l.i("refreshIntervalCode      :", _obj.refreshIntervalCode);
	l.i("mimeTypesToExport        :", _obj.mimeTypesToExport ? JSON.stringify(_obj.mimeTypesToExport) : _obj.mimeTypesToExport);
	l.i("");
};
