/**
 * The actual tree-structure of file items in the left-hand nav area
 */
define(['project/compiled-templates', 'project/lee-util', 'project/eventbus', 'jquery'],
		function(Handlebars, Util, EventBus, $) {

	var NavTree = function($holder) {

		Util.assert($holder && $holder.length == 1, "Needs holder");

		var model;

		this.init = function (pModel) {

			model = pModel;

			// build nav
			addUnorderedList( $holder, model.items() );  
			collapseToRoot();
		};

		var selectItem = this.selectItem = function(id) {

			// for any items with selectedItem style applied, remove it
			$('#nav .selectedItem').removeClass('selectedItem');  // TODO change #nav to $holder

			var selector = '#nav [data-itemId=' + id + '] a';  // TODO refactor out '#nav'
			var anchor = $(selector);
			if (anchor) anchor.addClass('selectedItem');
		};

		var findListItemWithId = this.findListItemWithId = function (id) {

			// find list item whose attribute data-itemId == id
			var selector = '[data-itemId=' + id + ']';
			var li = $(selector)[0];
			return li;
		};

		this.expandAll = function() {
			expandFoldersUsingModelArray();
		};

		this.expandParentFolders = function (modelObject) {

			var a  = model.getHolderArraysOfItemWithId(modelObject.id);
			for (var i = 0; i < a.length; i++) {
				var modelFolderObject = a[i][0];
				var  li = findListItemWithId( modelFolderObject.id );
				expandFolderUsingFolderListItem(li);
			}
		};

		var collapseToRoot = this.collapseToRoot = function () {
			
			// collapse all
			collapseFoldersUsingModelArray();

			// expand top-level folder
			var id = model.items()[0].id;
			var li = findListItemWithId(id);
			expandFolderUsingFolderListItem(li);
		}

		// ----

		var addUnorderedList = function(target, modelArray) {

			var ul = document.createElement("ul");
			$(target).append(ul);
			addListItem(ul, modelArray[0], true);

			// TODO validate

			for (var i = 1; i < modelArray.length; i++) { 
				var item = modelArray[i];
				if ($.isArray(item)) {
					addUnorderedList(ul, item);  // recurse
				}
				else {
					addListItem(ul, item);
				}
			}
		};

		/**
		 * Rem, a list item can be a folder (the first li in the ul) or a document 
		 */
		var addListItem = function(target, modelObject, isFolder) {

			// make html string

			if (isFolder) {
				var o = {id: modelObject.id, title: modelObject.title};
				var html = Handlebars["folder-item"](o);
			}
			else {
				o = {id: modelObject.id, title: modelObject.title};
				html = Handlebars["file-item"](o);
			}

			// convert to a listitem, and add it to 'target'

			var jo = $.parseHTML(html);
			var li = jo[0];

			$(li).click(isFolder ? onNavFolderItemClick : onNavFileItemClick);

			$(target).append(li);
		};

		var toggleFolderUsingFolderListItem = function(folderLi) {

			var ul = folderLi.parentNode;

			// using boolean values here not working; not sure what i'm not understanding
			if ($(ul).attr('data-isClosed') == 'yes') {
				expandFolderUsingFolderListItem(folderLi);
			}
			else {
				collapseFolderUsingFolderListItem(folderLi);	
			}
		};

		var expandFolderUsingFolderListItem = function(folderLi) {

			var folderUl = folderLi.parentNode;

			$(folderLi).find('.arrowDown').css('display', 'inline');
			$(folderLi).find('.arrowRight').css('display', 'none');

			var afterFirst = $(folderUl).children(":gt(0)");
			afterFirst.css('display', 'block');

			$(folderUl).attr('data-isClosed', 'no');
		};

		var expandFoldersUsingModelArray = function(a) {

			if (! a) a = model.items();

			var li = findListItemWithId(a[0].id);
			expandFolderUsingFolderListItem(li);

			for (var i = 0; i < a.length; i++) {
		 		if ($.isArray( a[i])) {
		 			expandFoldersUsingModelArray(a[i]);
		 		} 
			}
		};

		var collapseFolderUsingFolderListItem = function(folderLi) {

			var folderUl = folderLi.parentNode;

			$(folderLi).find('.arrowDown').css('display', 'none');
			$(folderLi).find('.arrowRight').css('display', 'inline');

			var afterFirst = $(folderUl).children(':gt(0)');
			afterFirst.css('display', 'none');

			// TODO - some day
			// $(ul).animate( { height:30 }, 333) , or smt

			$(folderUl).attr('data-isClosed', 'yes');
		};

		// close folders using data items-array
		var collapseFoldersUsingModelArray = function(a) {

			if (! a) a = model.items();
			// console.log('collapseFoldersUsingModelArray', a);

			var li = findListItemWithId(a[0].id);
			collapseFolderUsingFolderListItem(li);

			for (var i = 0; i < a.length; i++) {
		 		if ($.isArray( a[i])) {
		 			collapseFoldersUsingModelArray(a[i]);
		 		} 
			}
		};

		var onNavFileItemClick = function(event) {

			// prevent addressbar from showing hash
			event.preventDefault();  

			var isSelected = $(event.currentTarget).find('a').hasClass('selectedItem');
			if (isSelected) return;

			var id = $(event.currentTarget).attr('data-itemId');
			$(EventBus).trigger('nav-item-selected', id);
		};

		var onNavFolderItemClick = function(event) {

			// prevent addressbar from showing hash
			event.preventDefault();

			var folderLi = event.currentTarget;
			toggleFolderUsingFolderListItem(folderLi);
		};
	};

	return NavTree;
});
