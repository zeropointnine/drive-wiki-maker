/**
 * TODO: need logic to interrupt?
 */

var path = require('path');
var leeutil = require('./util/lee-util');
var async = require('async');
var l = require('./logger');
var config = require('./config');
var status = require('./status');
var gapiUtil = require('./util/gapi-util');

var DEBUG_THROTTLE = false;  // to slow it down a lot for debugging purposes

// These are the current export mimeTypes of a Google Drive document returned from Google API
var MIMETYPE_TO_SUFFIX = {
	"text/plain"																: "txt",
	"text/html"																	:"html",
	"application/pdf" 															: "pdf",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document" 	: "docx",
	"application/vnd.oasis.opendocument.text"									: "odt",	// who knew?
	"application/rtf"															: "rtf"
};

/**
 * @param callback - arg1: error, if any
 */
exports.exportFiles = function (pFileObjects, callback) {

	var ok = leeutil.makeDirIfNeeded( config.publicWebsiteOutputDir() );
	if (! ok) {
		var s = 'Couldn\'t create output dir ' + config.publicWebsiteOutputDir();
		return callback(new Error(s));
	}

	var items = makeItems(pFileObjects);

	var limit = DEBUG_THROTTLE ? 1 : 5;
	async.eachLimit(items, limit, downloadToFile, function (err) {
		l.v('export complete')
		callback();
	});
};

exports.mimeTypeToSuffix = function (mimeType) {
	return MIMETYPE_TO_SUFFIX[mimeType];
};

exports.suffixToMimeType = function (pSuffix) {

	for (var mimeType in MIMETYPE_TO_SUFFIX) {
		var suffix = MIMETYPE_TO_SUFFIX[mimeType];
		if (suffix == pSuffix) return mimeType;
	}
	return null;
};

// untested
exports.allLegalSuffixes = function () {
	var a = [];
	for (var m in MIMETYPE_TO_SUFFIX) {
		a.push( MIMETYPE_TO_SUFFIX[m] );
	}
	return a;
}

exports.getExportPath = function (id, mimeType) {

	var suffix = MIMETYPE_TO_SUFFIX[mimeType];
	var p = config.publicWebsiteOutputDir() + path.sep + id + "." + suffix;
	return p;
};

// ---

/**
 * Makes array of objects with 'url' and 'dest' properties
 */
var makeItems = function(pFileObjects) {

	// TODO
	// FILTER OUT FILES THAT HAVE NOT CHANGED BY TESTING AGAINST DATE-MODIFIED
	// WAY TO DO THIS IS TO COMPARE STORED MODEL VERSUS CURRENT MODEL;
	// IF THE ITEM'S DATE-MODIFIED MATCHES, THEN CHECK FOR EXISTENCE OF FILE
	// IF THE FILE EXISTS, GOOD ENOUGH, SKIP!

	var items = [];
	for (var i = 0; i < pFileObjects.length; i++) 
	{
		var fileObject = pFileObjects[i];

		// iterate fileObject.exportLinks and save each element
		for (var mimeType in fileObject.exportLinks)
		{
			var dest = exports.getExportPath(fileObject.id, mimeType);
			var url = fileObject.exportLinks[mimeType];
			items.push( { url:url, dest:dest } );
		}
	}

	// l.v('items:\r\n\r\n', JSON.stringify(items, null, 4) + '\r\n\r\n');
	return items;
}


var downloadToFile = function (o, callback) {

	// l.v('download wrapper start');

	// leeutil.downloadToFile(o.url, o.dest, function (error) {
	gapiUtil.downloadToFile(o.url, o.dest, function (error) {

		if (error) {
			// we eat the error
			status.exportingFilesFailed++;
		}
		else {
			status.exportingFilesSaved++;
		}

		// l.v('download wrapper end');

		DEBUG_THROTTLE ? setTimeout(callback, 2000) : callback();
	});
};
