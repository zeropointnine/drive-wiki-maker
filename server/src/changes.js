// Changes
//
// Holds the 'change:list' response data, and parsed structured data of those changes

var l = require('./logger');
var shared = require('./shared');

var data;
var changes;

exports.LIMIT = 25;

exports.data = function() {
	return data;
};

exports.setData = function (o) {
	data = o;
	parseData();
};

exports.changes = function () {
	return changes;
};

var parseData = function() {

	changes = [];

	if (! data) return;
	if (! data.items) { l.e('no items?'); return; }

	var a = [];
	var nowMs = Date.now();

	l.v("changes.parseData() - going thru " + data.items.length + " total");

	for (var i = 0; i < data.items.length; i++)
	{
		var item = data.items[i];

		if (item.kind != "drive#change") continue;
		if (item.deleted) continue;

		var file = item.file;
		if (! file) continue;
		if (file.kind != "drive#file") continue;
		if (file.mimeType == "application/vnd.google-apps.folder") continue;
		var id = file.id;
		if (! id) {
			l.w("file item has no id?");
			continue;
		}

		// see if that id is part of the wiki
		var fi = shared.tree().getFileItemWithId(id);
		if (! fi) continue;

		// rem: change list is sorted chronologically by item.modificationDate,
		// which can be a different thingfrom what we want, which is the file's modifiedDate

		var rfc3339 = file.modifiedDate;
		if (! rfc3339) {
			l.w("file item has no modifiedDate");
			continue;
		}
		var epochMs = Date.parse(rfc3339);
		if (! epochMs) {
			l.w("file item's modifiedDate didn't parse:", rfc3339);
			continue;
		}

		var o = {
			id: id,
			epochMs: epochMs
		};
		a.push(o);
	}

	// sort array by epochMs, rev-chron (file's modified date rather than the change item's modified date)
	a.sort(function (a,b) {
		return b.epochMs - a.epochMs;
	});

	// limit to items within a month from now, and up to 12 elements
	var thresh = Date.now() - 1000*60*60*24*31;
	for (var i = 0; i < a.length; i++) {
		if (a[i].epochMs > thresh && changes.length < 12) {
			changes.push(a[i]);
		}
	}

	l.v("changes.parseData() - final length: " + changes.length);

};
