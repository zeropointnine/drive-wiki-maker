define(['project/model', 'project/nav', 'project/header', 'project/content',
		'project/lee-util', 'project/shared', 'project/eventbus', 'jquery'],
		function(Model, NavView, Header, ContentView, LeeUtil, Shared, EventBus, $) {


	var Main = function() {

		var CONTENT_DIRECTORY = 'exported_documents';
		var MODEL_URL = CONTENT_DIRECTORY + '/' + 'tree.json';

		var model;
		var navView;
		var header;
		var contentView;


		var init = function () {

			var isDev = (window.location.href.indexOf('localhost') > -1);
			if (isDev) {
				LeeUtil.assertEnabled = true;
			}
			else {
				LeeUtil.assertEnabled = false;
				// console.log = function() {};  // !
			}

			model = new Model();
			navView = new NavView( $('#navArea') );
			header = new Header( $('#header'), $('#headerSpacer') );
			contentView = new ContentView( $('#contentArea'), model );

			$(window).resize(size);
			size();


			// Add listeners

			window.onpopstate = onPopState;

			navView.enable();

			$(EventBus).on('nav-toggle-size', toggleViewSize );
			$(EventBus).on('nav-item-selected', function(e, id) { doDocument(id); });

			$(window).keyup( function(e) {

				if (e.keyCode == 192) {  // backtick
					$(EventBus).trigger('nav-toggle-size');
				}
			});


			model.load(MODEL_URL, onModelLoaded);
		};

		var onModelLoaded = function (error) {

			if (error) {
				console.log('Error loading model data: ' + error);
				showFail(true);
				return;  
			}

			navView.onModelLoaded(model);

			header.setScrapedTimeUtc(model.utcTime());

			// launch document:

			var id = LeeUtil.getUrlParam('id');
			if (id) {
				doDocument(id, true);
			}
			else {
				if (model.defaultDocumentId()) {
					doDocument(model.defaultDocumentId(), false);
				}
				else {
					doNoDocument();  // TODO: support 'appendRecentChanges' in this case too
				}
			}
		};

		/**
		 * Can get called from iframe from 'injected' content (recent updates...)
		 */
		var doDocument = this.doDocument = function (id, dontAddHistory) {

			var item = model.itemById(id);
			if (! item) {
				console.log('no such id:', id);
				showFail(true);
				return;
			}

			// TODO: need 'isAppendEnabled' setting
			var shouldAppend = id && model.defaultDocumentId() && id == model.defaultDocumentId();
			console.log('doDocument()', '\nid:', id, '\nnoHist:', dontAddHistory, '\nshouldappend:', shouldAppend, '\nitem:', item);

			if (! dontAddHistory)  addToHistory(item.id);

			selectItem(item);

			// TODO: filename should come from modelobject
			
			// var url = model.currentFileObject().exportLinks['text/html'];
			var url = CONTENT_DIRECTORY + '/' + item.id + '.html';
			contentView.doDocument(url, shouldAppend, onDocumentResult);
		};

		var onDocumentResult = function (error) {

			if (error)  {
				showFail();
			}
			else {
			}
		};

		var doNoDocument = function () {

			document.title = model.title();
			navView.selectItem(null);
			header.update(null);
			contentView.showEmpty();
			size();
		};

		var size = function() {

			// set height of nav column to window's height
		    navView.setHeight($(window).height() - 1);  // -1 = hack
			
			// set height of content column to window's height
			$('#contentArea').css('height', $(window).height() - 1);

			// header 
			header.size();
		};

		var selectItem = function (modelItem) {

			document.title = model.title()  +  (modelItem  ?  " - " + modelItem.title : "");

			navView.selectItem(modelItem);

			var crumb = model.makeCrumbStringOfItem(modelItem);
			header.update(modelItem, crumb);
		};

		var showFail = function (andClearSelected) {

			if (andClearSelected) {
				document.title = model.title();
				navView.selectItem(null);
				header.update(null);
			}

			contentView.showFail();
			size();
		};

		var toggleViewSize = function() {

			var dur = 333;
			navView.setMinimized( ! navView.isMinimized(), dur);

			var offset = navView.width() - 22;
			var ml = navView.isMinimized() ? navView.width() - offset : navView.width();
			contentView.setMarginLeftAnimated(ml, dur);  // not ideal
		};

		var addToHistory = function(id) {
			console.log('add to history', id);
			window.history.pushState( { id: id }, null, '?id=' + id );
		};

		var onPopState = function(e) {

			if (! e.state || ! e.state.id) {
				return;
			}
			console.log('onPopState: ', e.state.id);
			// TODO shouldappend logic here
			doDocument(e.state.id, true, e.state.id == model.defaultDocumentId());
		};

		init();
	};

	return Main;
});
