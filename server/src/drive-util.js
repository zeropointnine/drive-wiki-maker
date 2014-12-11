var gapi = require('./util/gapi-util');
var l = require('./logger');
var prefs = require('./prefs');
var about = require('./about');
var changes = require('./changes');
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

		l.v("got about data response");
		// l.v("\r\n\r\n" + JSON.stringify(response) + "\r\n\r\n");

		o_about = response;

		// [2] get files-list data

		gapi.request("files","list", { maxResults:999, q:'trashed=false' }, onFilesListResponse);
	};

	var onFilesListResponse = function (error, response) {

		if (error) return callback(error);

		l.v('got files list data response');
		// l.v("\r\n\r\n" + JSON.stringify(response,null,4) + "\r\n\r\n");
		o_drive = response;

		// commit about and drive data
		about.setData(o_about);
		drive.setData(o_drive);

		// also reset changes data here
		changes.setData(null);

		// update prefs info with user name from about data (not ideal)
		var s = (about.data() && about.data().user && about.data().user.displayName) ? about.data().user.displayName : null;
		prefs.setUserDisplayName(s);
		prefs.save();

		// [3] make tree if possible

		shared.setTree(null);

		if (! prefs.driveBaseFolderId())
		{
			l.i('no base folder');
		}
		else
		{
			var item = drive.findItemById(prefs.driveBaseFolderId());
			if (! item)
			{
				l.w('base folder not found');
			}
			else
			{
				l.v('making tree as well');
				var tree = Tree.makeFromDriveData(item, prefs.mimeTypesToExport(), drive.data());
				shared.setTree(tree);

				var shouldGetChanges = true;  // TODO: parameterize
				if (! shouldGetChanges)
				{
					callback();
				}
				else
				{
					if (! o_about || ! o_about.largestChangeId) {
						l.w("missing about.largestChangeId");
						callback();
					}

					// [4] get changes list

					// Rem, api is limited to getting changes in chronological order starting with a change id
					// So we're starting X from the largest id, and requesting a max of X entries.

					// Remember that within that range, only a fraction will be populated with actual change entries.

					// Also, the changes are sorted by changes on the _item_, which may or may not be identical to
					// changes to the actual _file contents_ of the item
					// (eg, moving a file but not changing its contents results in a change item)

					// Finally, those entries may or not be included in the wiki set.

					// Not ideal but not worth the extra request effort and logic

					var range = 200;
					var start = o_about.largestChangeId - (range + 1);
					if (start < 0) start = 0;
					gapi.request("changes","list", { maxResults:range, startChangeId: start, includeDeleted:false }, onChangesListResponse);
				}
			}
		}
	};

	var onChangesListResponse = function (error, response) {

		if (error) return callback(error);

		l.v("got changes data response");
		// l.v("\r\n\r\n" + JSON.stringify(response) + "\r\n\r\n");
		changes.setData(response);
		callback();
	};

	// [1] get 'about' data

	gapi.request("about","get", null, onAboutResponse);
};
