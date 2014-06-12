var http = require('http');
var https = require('https');
var fs = require('fs');
var url = require('url');
var l = require('./../logger');

var gapiUtil = require('./gapi-util');


// TODO - use path module instead, which I didn't know about...
//
exports.getPathElementsFromUrlString = function (u) {

	if (! u) return [];

	// strip string after ? or #
	if (u.indexOf("?") > -1) u = u.substr(0, u.indexOf("?"));
	if (u.indexOf("#") > -1) u = u.substr(0, u.indexOf("#"));

	var a = u.split("/");

	// remove empty elements 
	for (var i = a.length - 1; i > -1; i--) {
		if (a[i] == "") {
			a.splice(i, 1);
		}
	}

	return a;
}

exports.printObject = function (o) {

	for (var key in o) l.v(">>>", key + " = " + o[key]);
}


/**
 * From 	http://stackoverflow.com/questions/979256/sorting-an-array-of-javascript-objects
 *
 * Usage: 	
 *			// Sort by price high to low
 *			homes.sort(sort_by('price', true, parseInt));
 *
 *			// Sort by city, case-insensitive, A-Z
 * 			homes.sort(sort_by('city', false, function(a){return a.toUpperCase()})); 
 */
exports.sortBy = function(field, reverse, primer) {

	var key = function (x) {return primer ? primer(x[field]) : x[field]};

	return function (a,b) {
		var A = key(a), B = key(b);
		return ( (A < B) ? -1 : ((A > B) ? 1 : 0) ) * [-1,1][+!!reverse];                  
	}
}


/**
 * Download and save a file using http.get()
 * From http://stackoverflow.com/questions/11944932/how-to-download-a-file-with-node-js
 *
 * Does not necessarily respond properly to all response codes, fyi
 *
 * @param callback - arg1: error, if any
 */
exports.downloadToFile = function(u, dest, callback) {

	// l.v('download', 'start', dest);

	var file = fs.createWriteStream(dest);

	var protocol = (u.indexOf('https') == 0) ? https : http;

	var o = url.parse(u);
	var port = o.port || (u.indexOf('https') == 0 ? 443 : 80);
	var options = {
		hostname: o.hostname,
		path: o.path,
		port: port,
		method: 'GET'
	};

	var onResponse = function (response) {

		var ok = (response.statusCode == 200);
		if (!ok) {
			fs.unlink(dest); // delete file asynchronously (w/o bothering to check result)
			l.w('download', 'bad status code', response.statusCode);
			return callback(new Error('Bad status code: ' + response.statusCode));
		}

		response.pipe(file);

		// note use of callback here because close() is actually async
		file.on('finish', function () {
			// l.v('download', 'closing file');
			file.close(function () {
				// l.v('download', 'closed file');
				callback();
			});
		});
	};

	var request = protocol.request(options, onResponse);

	request.on('error', function(error) {
		l.w('download', 'error', error.message);
		fs.unlink(dest);
		callback(error);
    });

	request.end();
};

/**
 * Returns true if exists or was created, false if couldn't create directory
 */
exports.makeDirIfNeeded = function (path) {

	if (fs.existsSync(path)) return true;

	try {
		fs.mkdirSync(path);
	}
	catch (err) {}

	return fs.existsSync(path);
};


// verified
exports.utcDateNow = function() {
	var now = new Date();
	var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
		now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
	return now_utc;
}



// var http = require('http');
// function checkSite(url)  {    
//     var request = http.request(url);
//     request.on('error', function(err) {
//         sys.debug('error on ' + url + ' ' + err.message);
//     });
//     request.end();
    
//     request.on('response', function(res) {
//         sys.debug('status code: ' + res.statusCode);
//     });
// }
// checkSite("http://www.google.com/junk_lkjsf234");
