/**
 * Server configuration settings, and some constants
 * Stores its values in a file, config.json.
 */

var path = require('path');
var fs = require('fs');
var l = require('./logger');

var DEFAULT_PASSWORD = 'hi';

var CONFIG_FILENAME = 'config.json';
var TREE_FILENAME = 'tree.json';
var DRIVE_SCOPE_URL = 'https://www.googleapis.com/auth/drive';


// -----------------------------------------------------------------------
// To change these values, edit the config.json file directly,
// which gets generated the first time the app is run
// -----------------------------------------------------------------------
var prodHostName;
var password;
var webservicePort;
var webserviceUseHttps;
var webserviceSslKeyPath;
var webserviceSslCertPath;
var webserviceSslCaPath;
var webserviceWebsiteDir;
var webserviceWhitelistedHost;
var shouldServePublicWebsite;
var publicWebsitePort;
var publicWebsiteDir;
var publicWebsiteOutputDir;
var publicWebsiteTreePath;

var prefsPath;
var projectDir = path.resolve(__dirname, './..');  // assumes this-file is one level in


exports.isProd 					= function () { return require('os').hostname() == prodHostName };
exports.prodHostName 			= function () { return prodHostName; };
exports.password 				= function () { return password; };
exports.webservicePort 			= function () { return webservicePort; };
exports.webserviceUseHttps 		= function () { return webserviceUseHttps; };
exports.webserviceSslKeyPath 	= function () { return webserviceSslKeyPath; };
exports.webserviceSslCertPath 	= function () { return webserviceSslCertPath; };
exports.webserviceSslCaPath 	= function () { return webserviceSslCaPath };
exports.webserviceWebsiteDir 		= function () { return webserviceWebsiteDir; };
exports.webserviceWhitelistedHost = function () { return webserviceWhitelistedHost; };
exports.shouldServePublicWebsite = function () { return shouldServePublicWebsite; };
exports.publicWebsitePort 		= function () { return publicWebsitePort; };
exports.publicWebsiteDir 		= function () { return publicWebsiteDir; };
exports.publicWebsiteOutputDir	= function () { return publicWebsiteOutputDir; };
exports.publicWebsiteTreePath 	= function () { return publicWebsiteTreePath; };
exports.prefsPath				= function () { return prefsPath; };
exports.driveScopeUrl 			= function () { return DRIVE_SCOPE_URL; };


/**
 * Gets called on startup
 */
exports.init = function (callback) {

	var s;
	try {
		s = fs.readFileSync(CONFIG_FILENAME, {encoding:'utf8'});
	}
	catch (err) {
		l.e("Config - error: " + err.message);
	}

	var object;
	if (s) {
		try {
			object = JSON.parse(s);
		}
		catch (err) {
			l.e("Config - error: " + err.message);
		}
	}

	if (! object) {
		l.i('Config - couldn\'t load config at ' + CONFIG_FILENAME + ', will create new file with defaults');
		object = makeDefaults();
		fs.writeFileSync(CONFIG_FILENAME, JSON.stringify(object, null,4) );  // don't catch any error
	}

	prodHostName = object.prodHostName;

	var o = exports.isProd() ? object.prod : object.dev;
	if (! o) {
		throw new Error('Config - config object missing');  // halts app
	}

	// valid / populate

	password = o.password;
	if (! isString(password) || password.length == 0) {
		throw new Error('Config - bad or missing password value');
	}

	webservicePort = o.webservicePort;
	if (! isNumber(webservicePort)) {
		throw new Error('Config - webservicePort bad value');
	}
	webserviceUseHttps = o.webserviceUseHttps;
	if (webserviceUseHttps) {
		webserviceSslKeyPath  = resolveFromProjectDir(o.webserviceSslKeyPath);
		webserviceSslCertPath = resolveFromProjectDir(o.webserviceSslCertPath);
		webserviceSslCaPath   = resolveFromProjectDir(o.webserviceSslCaPath);
	}

	webserviceWebsiteDir = resolveFromProjectDir(o.webserviceWebsiteDir);

	webserviceWhitelistedHost = o.webserviceWhitelistedHost || '';

	shouldServePublicWebsite = o.shouldServePublicWebsite;
	if (shouldServePublicWebsite) {
		publicWebsitePort = o.publicWebsitePort;
		if (! isNumber(publicWebsitePort)) {
			throw new Error('Config - webservicePort bad value');
		}
		publicWebsiteDir = resolveFromProjectDir(o.publicWebsiteDir);
	}

	publicWebsiteOutputDir = resolveFromProjectDir(o.publicWebsiteOutputDir);
	publicWebsiteTreePath = resolveFromProjectDir(o.publicWebsiteTreePath);

	prefsPath = resolveFromProjectDir(o.prefsPath);

	printValues();

	callback();
};

var resolveFromProjectDir = exports.resolveFromProjectDir = function (s) {

	if (! s) {
		throw new Error('Config path is missing');
	}

	if (s.indexOf('./') == 0) {
		return path.resolve(projectDir, s);
	}
	else if (s.indexOf(path.sep) == 0) {
		return s;
	}
	else {
		// make script fail
		throw new Error('Config path value must start with "./" for relative path or "/" for absolute path', s);
	}
};

var makeDefaults = function () {

	var o = {};
	o.prodHostName 					= 'my_server';

	var o2 = {};

	o2.password 					= DEFAULT_PASSWORD;
	o2.webservicePort 				= 3000;
	o2.webserviceUseHttps 			= true;
	o2.webserviceSslKeyPath 		= './sample_ssl_creds/server.key';
	o2.webserviceSslCertPath 		= './sample_ssl_creds/server.crt';
	o2.webserviceSslCaPath 			= './sample_ssl_creds/ca.crt';
	o2.webserviceWebsiteDir 				= './../admin_website';
	o2.webserviceWhitelistedHost 	= '';
	o2.shouldServePublicWebsite 	= true;
	o2.publicWebsitePort 			= 3001;
	o2.publicWebsiteDir 			= './../public_website';
	o2.publicWebsiteOutputDir		= o2.publicWebsiteDir + path.sep + 'exported_documents';
	o2.publicWebsiteTreePath		= o2.publicWebsiteOutputDir + path.sep + TREE_FILENAME;
	o2.prefsPath 					= './prefs.json';

	o.dev = o2;
	o.prod = o2;

	return o;
};

var printValues = function () {
	l.i('--------------------------------------------------------------');
	l.i('');
	l.i('ACTIVE CONFIG VALUES');
	l.i('');
	l.i('isProd                   :', exports.isProd());
	l.i('prodHostName             :', exports.prodHostName());
	l.i('password                 :', '###');
	l.i('webservicePort           :', exports.webservicePort());
	l.i('webserviceUseHttps       :', exports.webserviceUseHttps());
	l.i('webserviceSslKeyPath     :', exports.webserviceSslKeyPath());
	l.i('webserviceCertPath       :', exports.webserviceSslCertPath());
	l.i('webserviceSslCaPath      :', exports.webserviceSslCaPath());
	l.i('webserviceWebsiteDir     :', exports.webserviceWebsiteDir());
	l.i('webserviceWhitelistedHost: ', exports.webserviceWhitelistedHost());
	l.i('shouldServePublicWebsite :', exports.shouldServePublicWebsite());
	l.i('publicWebsitePort        :', exports.publicWebsitePort());
	l.i('publicWebsiteDir         :', exports.publicWebsiteDir());
	l.i('publicWebsiteOutputDir   :', exports.publicWebsiteOutputDir());
	l.i('publicWebsiteTreePath    :', exports.publicWebsiteTreePath());
	l.i('prefsPath           	  :', exports.prefsPath());
	l.i('');
};

function toS (obj) { return Object.prototype.toString.call(obj) }
function isNumber (obj) { return toS(obj) === '[object Number]' }
function isString (obj) { return toS(obj) === '[object String]' }
