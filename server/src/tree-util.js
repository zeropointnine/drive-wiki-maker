/*
TreeUtil

	Used by both service (CJS) and public front-end (AMD) projects
	Make sure they are in sync.
	Don't add any dependencies to avoid extra hassle re: CJS vs. AMD, etc.
*/

/**
 * @returns  	eg, 'wiki/java-related/android/'
 */
exports.makeCrumbStringOfItem = function(item, rootFolderArray, includeSelf) {

	var a = getHolderArraysOfItemWithId(item.id, rootFolderArray);
	if (! a || a.length == 0) return null;

	var s = '';

	// _.each(a, function (folderArray) {
	for (var i = 0; i < a.length; i++)
	{
		var folderArray = a[i];
		var folderItem = folderArray[0];
		if (! folderItem) return null; // shouldn't happen
		s += folderItem.title + '/';
	}

	if (includeSelf) s += item.title;

	return s;
};


var getHolderArraysOfItemWithId = function(id, rootFolderArray) {

	if (id == rootFolderArray[0].id) {
		// id is of root folder itself so return nothing
		return [];
	}

	var arrays = [];

	// the first element is always the root folder; we'll recurse 'into' the tree
	arrays.push(rootFolderArray);

	var base = rootFolderArray;
	while (true)
	{
		var result = findNextHolderArrayOfItem(base, id);

		if (! result) {
			// can only happen if no such id, i think
			return arrays;
		}

		if (result[0].id == id) {
			// this happens at the end when the item of the id is itself a folder
			return arrays;
		}

		var lastResult = (arrays.length > 0) ? arrays[arrays.length-1] : null;
		if (result == lastResult) {
			// done
			return arrays;
		}

		// console.log('getHolderArraysOfItemWithId() lv.' + arrays.length + ": ", result[0].title);

		arrays.push(result);
		base = result;

		if (arrays.length > 50) { util.assert('TODO: infinite loop? check logic.'); return;}
	}
};

// Returns the immediate child array of 'a' that contains item with id
// (which could be extra levels deep).
//
var findNextHolderArrayOfItem = function (a, id) {

	for (var i = 0; i < a.length; i++)
	{
		var el = a[i];
		if (el.id == id) {
			return a;
		}
		if (isArray(el)) {
			var o2 = findNextHolderArrayOfItem(el, id);
			if (o2) return el;
		}
	}
};

// Dependency-less array test
var isArray = function (o) {
	return Object.prototype.toString.call(o) == '[object Array]';
};