/**
 * Drive
 *
 * Holds the entire file list from Google Drive
 */

var _ = require("underscore");
var l = require("./logger");
var leeutil = require('./util/lee-util');
var driveUtil = require('./util/gapi-util');


var data;

var simpleFolderList;  	// derived from data; simple array of objects with name and id properties;
						// used for admin front-end only (not for public front-end)


exports.data = function() {
	return data;
};

exports.setData = function(responseObject) {
	data = responseObject;
	sortItems();
	makeSimpleFolderList();
};

exports.simpleFolderList = function() {
	return simpleFolderList;
};


exports.findItemById = function (id) {
	if (! data || ! data.items) return null;
	for (var i = 0; i < data.items.length; i++) {
		var item = data.items[i];
		if (item.id == id) return item;
	}
	return null;
};

exports.findFolderItem = function(fieldName, value) {

	if (! data) return null;

	for (var i = 0; i < data.items.length; i++) {
		var item = data.items[i];
		if (item.mimeType != driveUtil.MIMETYPE_GOOGLEFOLDER) continue;
		if (item[fieldName] == value) return item;
	}
	return null;
};

// Sorts drive.items by folders then files, alphabetical order
//
var sortItems = function() {

    //  separate folders from files
    var folders = [];
    var files = [];

    for (var i = data.items.length-1; i > -1; i--) {
        var item = data.items[i];
        if (item.mimeType == driveUtil.MIMETYPE_GOOGLEFOLDER) {
            folders.push(item);
        }
        else {
            files.push(item)
        }
    }

    // alpha sort each using title
    folders.sort( leeutil.sortBy('title', true, function(a){return a.toUpperCase()}) );
    files.sort( leeutil.sortBy('title', true, function(a){return a.toUpperCase()}) );
    var a = folders.concat(files);
    data.items = a;

    // l.v("\r\n" + JSON.stringify(drive.data(), null, 4));
};

var makeSimpleFolderList = function()
{
	if (! data) return;

	// temp array
	var a = [];
	_.each(data.items, function(item) {
		if (item.mimeType != driveUtil.MIMETYPE_GOOGLEFOLDER) return;
		a.push(item);
	});
	a.sort( leeutil.sortBy('title', true, function(a){return a.toUpperCase()}) );

	// make simpleFolderList array from it
	simpleFolderList = [];
	for (var i = 0; i < a.length; i++) {
		simpleFolderList.push( { title: a[i].title, id:a[i].id } );
	}
	// l.v('simpleFolderList:\r\n', JSON.stringify(simpleFolderList,null,4));
};
