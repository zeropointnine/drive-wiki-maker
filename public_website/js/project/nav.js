/**
 * Nav UI buttons must already exist. 
 * (Ie, this doesn't so much 'own' them as control them)
 *
 * Has nav-tree, which does properly 'own' its views
 */

define(['project/nav-tree', 'project/lee-util', 'project/shared', 'project/eventbus', 'jquery'],
		function(NavTree, Util, Shared, EventBus, $) {

	var Nav = function($holder)
	{
		Util.assert($holder, "Needs holder");

		var tree = new NavTree( $('#nav') );

		var $minimizeButton = $('#navMinimize');
		var $expandButton = $('#navExpandTree');
		var $collapseButton = $('#navCollapseButton');
		var $buttonsHolder = $('#navButtonsHolder');

		var _isMinimized = false;

		this.onModelLoaded = function (model) {

			$buttonsHolder.css('display', 'block');

			tree.init(model);
		}

		this.isMinimized = function() { return _isMinimized; }

		this.setMinimized = function(b, duration) { 
		
			_isMinimized = b; 

			// scrollbar disabled when minimized
			$holder.css('overflow', _isMinimized ? 'hidden' : 'auto')
			size();

			var offset = this.width() - 22;
			var ml = _isMinimized ? -offset : 0;
			$holder.animate( { marginLeft:ml }, duration, null, function() {
				var filename = _isMinimized ? 'images/icon_restore.png' : 'images/icon_minimize.png';
				$minimizeButton.attr('src', filename);
			});

			var x = _isMinimized ? -offset : 0;
			$buttonsHolder.animate( { left: x }, duration);
		}

		this.width = function() { return $holder.width(); }

		this.height = function() { return $holder.height(); }  // $holder.css('height'); ?

		this.setHeight = function (h) {

			$holder.css('height', h + 'px');
			size();
		}

		var size = this.size = function() {

		    var lt = $holder[0].clientWidth - $minimizeButton.width() - 4;
		    $minimizeButton.css('left', lt);

		    var lt2 = lt - $expandButton.width() - 5;
		    $expandButton.css('left', lt2);

		    var lt3 = lt2 - $collapseButton.width() - 0;
		    $collapseButton.css('left', lt3);
		};

		this.enable = function() {

			$minimizeButton.click( function() { 
				$(EventBus).trigger('nav-toggle-size'); 
			});

			$expandButton.click(function() { 
				expandTree();
			});

			$collapseButton.click(function() { 
				collapseTree();
			});
		};

		this.disable = function() {

			$minimizeButton.off('click');
			$expandButton.off('');
			$collapseButton.off('');
		};

		this.selectItem = function(id) {
			tree.selectItem(id);
		};

		var expandTree = function () {
			tree.expandAll();
			size();
		};

		var collapseTree = function () {
			tree.collapseToRoot();
			size();
		};

		var selectItem = this.selectItem = function (modelItem) {
			
			if (modelItem) {
				tree.expandParentFolders(modelItem); // ensure selected item is showing
				size();			
				tree.selectItem(modelItem.id);
			}
			else {
				tree.selectItem(null);
			}
		};

		// ---
	}

	return Nav;
});
