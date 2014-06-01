var gapi = require('./util/gapi-util');
var l = require('./logger')
var prefs = require('./prefs');
var about = require('./about');
var drive = require('./drive');
var shared = require('./shared');
var Tree = require('./Tree');


/**
 * Gets and saves the 'prerequisite' Google Drive user data (about info and files list)
 * If a valid basefolder exists, regenerates tree
 *
 * @param callback - arg1: error if any
 */
exports.getDriveDataAndMakeTree = function(callback) {

	var o_about;
	var o_drive;

	var onAboutResponse = function (error, response) {

		if (error) return callback(error);

		l.d("got 'about' data");
		// l.d("\r\n\r\n" + JSON.stringify(response) + "\r\n\r\n");
		o_about = response;

		// [2] get files-list data

		gapi.request("files","list", { maxResults:999, q:'trashed=false' }, onFilesListResponse);
	};

	var onFilesListResponse = function (error, response) {

		if (error) return callback(error);

		l.d('got files list data');
		// l.d("\r\n\r\n" + JSON.stringify(response,null,4) + "\r\n\r\n");
		o_drive = response;

		// commit
		about.setData(o_about);
		drive.setData(o_drive);

		// [3] make tree if possible

		if (prefs.driveBaseFolderId())
		{
			var item = drive.findItemById(prefs.driveBaseFolderId());
			if (item) {
				l.d('making tree as well');
				var tree = Tree.makeFromDriveData(item, prefs.mimeTypesToExport(), drive.data());
				shared.setTree(tree);
			}
		}
		else
		{
			shared.setTree(null);
		}

		callback();
	};

	// [1] get 'about' data

	gapi.request("about","get", null, onAboutResponse);
};
