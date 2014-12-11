/**
 * Represents the tree structure of the user's Drive files, starting from a base directory
 *
 * This converts the (flat) Drive file items list into a tree-like data structure,
 * while retaining only the properties needed by the app.
 *
 * This data structure is "items", which uses only arrays and generic objects:
 *
 * A folder is represented by an array. The first element of the folder is always an
 * object of the folder's properties. Any subsequent elements are its children, which
 * will be either an object representing a document file, or an array representing a folder.
 *
 * Saves its structured data as static json, to be consumed by front-end.
 *
 * TODO: Account for items with multiple parents. Make sure doesn't infinite loop.
 */

var fs = require('fs');
var util = require('util');
var l = require('./logger');
var leeUtil = require('./util/lee-util');
var driveUtil = require('./util/gapi-util');
var config = require('./config');
var changes = require('./changes');
var treeUtil = require('./tree-util');


var Tree = function () {

	var items; 				// the app's 'data tree', derived from driveData
	var fileList; 			// the tree's file objects only, in a flat array, derived from items
	var simpleFileList;		// simple version of file list, used by admin client

	var exportMimeTypes; 	// this gets added as a property to each file item

	var defaultDocumentId; 	// 'metadata'
	var title;


	/**
	 * For use by Tree.make() only
	 */
	this.populateUsingDriveData = function (baseDriveFolderItem, pExportMimeTypes, driveData) {

		exportMimeTypes = pExportMimeTypes;

		// main routine
		items = [];
		populateArray(items, baseDriveFolderItem, driveData);

		// filter out empty folders
		var shouldRemoveEmptyFolders = true; // TODO: possibly make configurable
		if (shouldRemoveEmptyFolders) removeEmptyFoldersFrom(items);

		makeFileList(items);

		makeSimpleFileList();

		l.v('populateUsingDriveData() -', fileList.length, 'file items');

		// l.v("items:\r\n\r\n" + JSON.stringify(items, null, 4) + "\r\n\r\n");
		// l.v("fileList:\r\n\r\n" + JSON.stringify(fileList, null, 4) + "\r\n\r\n");
		// l.v("simpleFileList:\r\n\r\n" + JSON.stringify(simpleFileList, null, 4) + "\r\n\r\n");
	};

	/**
	 * For use by Tree.makeFromFile() only
	 * Returns false if failed
	 */
	this.populateUsingLoadedJson = function (json) {

		if (! json.items) return false;

		items = json.items;

		makeFileList(items);
		makeSimpleFileList();

		exportMimeTypes = json.exportedMimeTypes;
		defaultDocumentId = json.defaultDocumentId;
		title = json.title;

		return true;
	}

	this.fileList = function () {
		return fileList;
	};

	this.simpleFileList = function () {
		return simpleFileList;
	};

	this.exportMimeTypes = function () {
		return exportMimeTypes;
	};

	var getFileItemWithId = this.getFileItemWithId = function (id) {

		if (! fileList) return null;
		for (var i = 0; i < fileList.length; i++) {
			if (fileList[i].id == id) return fileList[i];
		}
		return null;
	};

	this.hasFileItemWithId = function (id) {
		return  (getFileItemWithId(id) ? true : false);
	};

	/**
	 * Synchronous. Returns error if any.
	 *
	 * Note how we only set certain metadata properties at this point
	 */
	this.saveJson = function (path, pDefaultDocumentId, pTitle) {

		// validate defaultDocumentId:
		var b = pDefaultDocumentId && this.hasFileItemWithId(pDefaultDocumentId);
		defaultDocumentId = b ? pDefaultDocumentId : null;

		title = pTitle;
		utcTime = leeUtil.utcDateNow().getTime();

		// prepare for serialization
		var o = {};
		o.items = items;
		o.exportedMimeTypes = exportMimeTypes;
		o.defaultDocumentId = defaultDocumentId;
		o.title = title;
		o.utcTime = utcTime;
		o.recentChanges = changes.changes();  // ha

		// save
		var s = config.isProd() ? JSON.stringify(o) : JSON.stringify(o,null,4);
		try {
			fs.writeFileSync(path, s );
			l.v("Tree.saveJson() - ok");
		}
		catch (error) {
			return error;
		}
		return null;
	};


	/* recursive */
	var populateArray = function (array, driveFolderItem, driveData) {

		var fo = makeFolderItem(driveFolderItem);
		array.push(fo);

		// note how on each pass, it iterates entire list :(  // TODO: optimize
		for (var i = 0; i < driveData.items.length; i++)
		{
			var item = driveData.items[i];
			for (var j = 0; j < item.parents.length; j++)
			{
				var parent = item.parents[j];
				if (parent.id == driveFolderItem.id)
				{
					switch (item.mimeType)
					{
						case driveUtil.MIMETYPE_GOOGLEFOLDER:
							var a2 = [];
							array.push( a2 );
							populateArray(a2, item, driveData);  // recurse
							break;

						case driveUtil.MIMETYPE_GOOGLEDOCUMENT:
							var o = makeFileItem(item);
							array.push(o);
							break;

						default:
							// is a file which we don't support, so ignore
							break;
					}
					break;
				}
			}
		}
	};

	var makeFolderItem = function (driveItem) {
		var o = {};
		o.type = "folder";
		o.title = driveItem.title;
		o.id = driveItem.id;
		return o;
	};

	var makeFileItem = function (driveItem) {

		var o = {};
		o.type = "document";
		o.title = driveItem.title;
		o.id = driveItem.id;
		o.modifiedDate = driveItem.modifiedDate;
		o.editLink = driveItem.alternateLink;
		o.embedLink = driveItem.embedLink;

		o.exportLinks = {};
		if (! driveItem.exportLinks) {
			l.w('makeFileItem - missing exportLinks object');
		}
		else {
			exportMimeTypes.forEach(function(mimeType) {
				if (driveItem.exportLinks[mimeType])
					o.exportLinks[mimeType] = driveItem.exportLinks[mimeType];
				else
					l.w('makeFileItem - missing exportLinks property', mimeType, 'for', driveItem.title);
			});
		}
		return o;
	};

	var makeFileList = function (items) {

		/* recursive */
		var makeFileListFromArray = function (a) {

			for (var i = 1; i < a.length; i++) {  // skip 1st element, which is not a file item
				var thing = a[i];
				if (util.isArray(thing)) {
					makeFileListFromArray(thing);
				}
				else {  // is a file item
					fileList.push(thing);
				}
			}
		};

		fileList = [];
		makeFileListFromArray(items);
	};

	var makeSimpleFileList = function () {

		simpleFileList = [];

		for (var i = 0; i < fileList.length; i++)
		{
			var item = fileList[i];
			var title = treeUtil.makeCrumbStringOfItem(item, items, true);
			var o = { id: item.id, title: title };
			simpleFileList.push(o);
		}
	};

	var removeEmptyFoldersFrom = function (a)
	{
		//	TODO: needs logic for empty-folders-with-empty-folders

		var isArrayAnEmptyFolder = function (a) {
			// Rem, we're representing a 'folder' as an array with its first element being a generic object.
			// So if it contains nothing, then it will only have that one element.
			return (a.length <= 1)
		};

		for (var i = a.length-1; i > -1; i--) {
			var thing = a[i];
			if (util.isArray(thing)) {
				if (isArrayAnEmptyFolder(thing)) {
					a.splice(i, 1);
				}
				else {
					removeEmptyFoldersFrom(thing); // recurse
				}
			}
			else {
				// is a file; ignore
			}
		}
	};
};

/**
 * Factory function, returns Tree instance
 */
Tree.makeFromDriveData = function (baseDriveFolderItem, pExportMimeTypes, driveData) {

	var tree = new Tree();
	tree.populateUsingDriveData(baseDriveFolderItem, pExportMimeTypes, driveData);
	return tree;
};

/**
 * Also a factory function, returning a Tree instance
 */
Tree.makeFromLoadedJson = function (path) {

	var s;
	try {
		s = fs.readFileSync(path, {encoding:'utf8'});
	}
	catch (err) {
		return l.e("Tree.makeFromLoadedJson - load error: " + err.message);
	}

	var o;
	try {
		o = JSON.parse(s);
	}
	catch (err) {
		return l.e("Tree.makeFromLoadedJson - parse error: " + err.message);
	}

	var tree = new Tree();
	var ok = tree.populateUsingLoadedJson(o);
	if (! ok) {
		return l.e("Tree.makeFromLoadedJson - couldn't populate tree");
	}

	l.v("Tree.makeFromLoadedJson - ok");
	return tree;
};

module.exports = Tree;

// ---------------------------------------------------------------------------------------------------------------------

/*
	SAMPLE MODEL (has more properties now, but general structure still holds)

	[
	    [
	        {
	            "title": "folder_with_folder",
	            "id": "0BylYGwmg8bTXdXFUbGRwVGlXVEE",
	            "type": "folder"
	        },
	        [
	            {
	                "title": "the_subfolder",
	                "id": "0BylYGwmg8bTXTWJNamIwRFBSbTg",
	                "type": "folder"
	            },
	            {
	                "title": "item_in_nested_folder",
	                "id": "1bOkkOhqPW-ZALpewjdaVZ0jygpfmk9i7iLqU_aw9Bbc",
	                "type": "document"
	            }
	        ]
	    ],
	    {
	        "title": "test2",
	        "id": "1LUxPSsHsj2s8FxsjGNqRRAl8cDdSRZ_3BWirS-sUzCs",
	        "type": "document"
	    },
	    [
	        {
	            "title": "web",
	            "id": "0BylYGwmg8bTXc1JzUUR3QXVrWk0",
	            "type": "folder"
	        },
	        {
	            "title": "node.js",
	            "id": "1oCWoYt9QzwJEz2c7Zq0kXC2eDpYgKKaYk6OzVHicigk",
	            "type": "document"
	        }
	    ]
	]
*/
