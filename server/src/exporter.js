/**
 * Exporter > ExportUtil > LeeUtil.download...
 */

var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var leeUtil = require('./util/lee-util');
var l = require('./logger');
var status = require('./status');
var driveUtil = require('./drive-util');
var exportTimer = require('./export-timer');
var config = require('./config');
var Tree = require('./Tree');
var shared = require('./shared');
var exportUtil = require('./export-util');
var prefs = require('./prefs');

var oldTree;

/**
 * Rem, there is no callback for this process;
 * its results are stored in the global status properties
 */
exports.exportWiki = function () {

	l.v('exportWiki()');

	status.resetExportStatus();
	status.isExporting = true;
	status.exportingMessage = 'Getting Google Drive data...';
	exportTimer.stop();

	// Get the latest google drive data
	driveUtil.getDriveDataAndMakeTree(onDriveData);
};

var onDriveData = function (error) {

	if (error) return finish(error.message);
	if (! shared.tree()) return finish('no base folder');  // shouldn't happen

	// load the last-exported tree, to do a compare against
	oldTree = Tree.makeFromLoadedJson(config.publicWebsiteTreePath());

	// now save out the new tree
	var err = shared.tree().saveJson( config.publicWebsiteTreePath(), prefs.driveDefaultDocumentId(), prefs.wikiTitle() );
	if (err) {
		return finish(error.message);
	}

	// TODO: Make a dont-export option, in which case the public site will just rely on the tree's export-links
	var skipExport = false;
	if (skipExport) {
		return finish('complete');
	}

	//

	var useDif = true;
	var itemsToExport = useDif ? getChangedFileItems(oldTree, shared.tree()) : shared.tree().fileList();

	status.exportingMessage = "Exporting Google Drive documents...";
	status.exportingFilesTotal = shared.tree().fileList().length;
	if (useDif) {
		status.exportingFilesUnchanged = shared.tree().fileList().length - itemsToExport.length;
		status.exportingFilesUnchanged *= shared.tree().exportMimeTypes().length; // meh
	}
	else {
		status.exportingFilesUnchanged = 0;
	}
	status.exportingFilesSaved = 0;
	status.exportingFilesFailed = 0;

	exportUtil.exportFiles(itemsToExport, onExported);  // start
};

var onExported = function (error) {

	if (error)
		finish(error.message);
	else
		finish('complete');
};

var finish = function (resultMessage) {

	status.isExporting = false;
	status.lastExportUtcTime = leeUtil.utcDateNow().getTime();
	status.lastExportResult = resultMessage;
	status.lastExportFilesUnchanged = status.exportingFilesUnchanged;
	status.lastExportFilesSaved = status.exportingFilesSaved;
	status.lastExportFilesFailed = status.exportingFilesFailed;
	status.lastExportFilesTotal = status.exportingFilesTotal;

	// exportLogger.appendStatusResults()
	l.i('export result -', resultMessage);
	if (resultMessage == 'complete') {
		l.i(status.lastExportFilesSaved, 'saved', status.lastExportFilesFailed, 'failed', status.lastExportFilesTotal, 'total');
	}

	if (oldTree) deleteOrphanFiles(oldTree.fileList(), shared.tree().fileList());

	oldTree = null;

	// restart timer
	exportTimer.setWithCode( prefs.refreshIntervalCode() );
};

//

/**
 * @param old 		tree instances to compare
 * @param current	tree instances to compare
 * returns  		array of fileList with same date-modified
 */
var getUnchangedFileItemIds = function (old, current) {

	if (old == null) return [];

	var ids = [];
	for (var i = 0; i < current.fileList().length; i++) {

		var item_c = current.fileList()[i];
		var id = item_c.id;

		// same id must exist in both sets
		var item_o = old.getFileItemWithId(id);
		if (! item_o) continue;

		// items must have same modifiedDate
		if (item_o.modifiedDate != item_c.modifiedDate) continue;

		// * files must also exist with that id
		var hit = true;
		for (var j = 0; j < current.exportMimeTypes().length; j++)
		{
			var mt = current.exportMimeTypes()[j];
			var p = exportUtil.getExportPath(id, mt)
			if (! fs.existsSync(p)) {
				hit = false;
				break;
			}
		}
		if (! hit) continue;

		ids.push(id);
	}

	l.v('getUnchangedFileItemIds() -', ids.length, 'out of', current.fileList().length);
	return ids;
}

var getChangedFileItems = function (old, current) {

	var unchangedIds = getUnchangedFileItemIds(old, current);

	var changedItems = [];

	_.each(current.fileList(), function(item) {
		var i = unchangedIds.indexOf(item.id);
		if (i == -1) {
			changedItems.push(item);
		}
	});

	l.v('getChangedItems() -', changedItems.length, 'out of', current.fileList().length);
	return changedItems;
}

/**
 * Deletes any files that have ids in their filename that are in the old file list but not the new one.
 *
 * Seems safer this way than doing a
 * 'delete everything in the directory that doesn't match an id in the new file list'
 *
 * Doesn't bother to callback or return anything
 */
var deleteOrphanFiles = function (oldFileList, currentFileList) {

	// convert filelists into 'sets' using hashes that have keys but no values
	var old = {};
	_.each(oldFileList, function(item) { old[item.id] = null; });
	var current = {};
	_.each(currentFileList, function(item) { current[item.id] = null; });

	var idsToDelete = {};
	for (id in old) {
		if (current[id] === undefined) idsToDelete[id] = null; // add it
	}

	var onUnlink = function (err) {
		if (err) {
			l.e("deleteOrphanFiles() - error deleting", err.message);
		}
	};

	var onReadDir = function (err, files) {

		if (err) {
			return l.e("deleteOrphanFiles() - couldn't read directory", config.publicWebsiteOutputDir())
		}

		var rmCount = 0;

		// iterate on filenames
		_.each(files, function(file) {

			var firstDot = file.indexOf('.');

			// google file id's seem to be always 45 long. this is just to be safe.
			if (firstDot < 25) return;

			var extractedId = file.substr(0, firstDot);
			var b = (idsToDelete[extractedId] !== undefined);
			if (b) {
				rmCount++;
				fs.unlink(config.publicWebsiteOutputDir() + path.sep + file, onUnlink);
			}
		});

		if (rmCount) {
			l.i('deleteOrphanFiles() - deleting', rmCount, 'files');
		}
	};

	fs.readdir(config.publicWebsiteOutputDir(), onReadDir);
};
