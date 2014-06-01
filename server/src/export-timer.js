/**
 *
 */

var assert = require('assert');

var leeUtil = require('./util/lee-util');
var l = require('./logger');
var status = require('./status');
var prefs = require('./prefs');
var exporter = require('./exporter');

var timeoutId = null;
var scheduledTime = 0;


exports.setWithCode = function(code) {

	assert(code >= -1 && code < prefs.REFRESH_INTERVAL_HOURS.length, 'bad value: ' + code);

	if (code == -1) {
		l.i('exportTimer.setWithCode() - timer disabled');
		exports.stop();
		return;
	}

	var ms = prefs.REFRESH_INTERVAL_HOURS[code] * 1000*60*60;
	scheduledTime = leeUtil.utcDateNow().getTime() + ms;

	clearTimeout(timeoutId);
	timeoutId = setTimeout(onTimer, ms);

	l.i('exportTimer.setWithCode() -', code, '- timer started for', ms, 'ms from now');
};

exports.scheduledTime = function () {
	if (status.isExporting) return 0;
	return scheduledTime;
}

exports.msLeft = function () {

	if (status.isExporting) return 0;
	if (! scheduledTime) return 0;

	var ms = scheduledTime - leeUtil.utcDateNow().getTime();
	return ms;
}

exports.stop = function() {

	scheduledTime = 0;
	clearTimeout(timeoutId);
	timeoutId = null;
}

var onTimer = function() {

	if (! prefs.refreshToken()) return l.e('exportTimer.onTimer() - logic error, no refresh token');
	if (exports.isExporting) return l.e('exportTimer.onTimer() - logic error, is currently exporting');

	l.i('exportTimer.onTimer() - will exportWiki');

	timeoutId = null;
	scheduledTime = 0;

	// TODO untested
	exporter.exportWiki();
};
