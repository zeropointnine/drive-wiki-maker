/*
 * App 'status' or 'state'
 * Just a simple hash for now
 * Fields do not persist
 */

var l = require('./logger');
var exportTimer = require('./export-timer');
var drive = require('./drive');
var about= require('./about');
var config = require('./config');

exports.isExporting = false;
exports.exportingMessage = "";
exports.exportingFilesUnchanged = 0;
exports.exportingFilesSaved = 0;
exports.exportingFilesFailed = 0;
exports.exportingFilesTotal = 0;

exports.lastExportUtcTime = 0;
exports.lastExportResult = "";
exports.lastExportFilesUnchanged = 0;
exports.lastExportFilesSaved = 0;
exports.lastExportFilesFailed = 0;
exports.lastExportFilesTotal = 0;


exports.resetExportStatus = function() {

	exports.isExporting = false;
	exports.exportingMessage = "";
	exports.exportingFilesUnchanged = 0;
	exports.exportingFilesSaved = 0;
	exports.exportingFilesFailed = 0;
	exports.exportingFilesTotal = 0;

	exports.lastExportUtcTime = 0;
	exports.lastExportResult = "";
	exports.lastExportFilesUnchanged = 0;
	exports.lastExportFilesSaved = 0;
	exports.lastExportFilesFailed = 0;
	exports.lastExportFilesTotal = 0;
};

exports.objectForService = function() {

	var o = {};

	o.isExporting = exports.isExporting;
	o.exportingMessage = exports.exportingMessage;
	o.exportingFilesUnchanged = exports.exportingFilesUnchanged;
	o.exportingFilesSaved = exports.exportingFilesSaved;
	o.exportingFilesFailed = exports.exportingFilesFailed;
	o.exportingFilesTotal = exports.exportingFilesTotal;

	o.lastExportUtcTime = exports.lastExportUtcTime;
	o.lastExportResult = exports.lastExportResult;
	o.lastExportFilesUnchanged = exports.lastExportFilesUnchanged;
	o.lastExportFilesSaved = exports.lastExportFilesSaved;
	o.lastExportFilesFailed = exports.lastExportFilesFailed;
	o.lastExportFilesTotal = exports.lastExportFilesTotal;

	o.nextExportMs = exportTimer.msLeft();

	o.hasDriveData = (drive.data() != null);

	if (config.shouldServePublicWebsite()) {
		o.servesPublicWebsiteOnPort = config.publicWebsitePort();
	}
	else {
		o.servesPublicWebsiteOnPort = null;
	}

	return o;
};
