/**
 * Content area
 *
 * TODO: find workaround for iOS bug: iframe won't scroll
 */
define(['project/lee-util', 'project/app-util', 'project/shared', 'project/eventbus', 'project/model', 'jquery'],
		function (Util, AppUtil, Shared, EventBus, Model, $) {

	var Content = function($holder, pModel) {

		Util.assert($holder, "Needs holder");
		Util.assert(pModel, "Needs model instance");

		var model = pModel;

		var $notFound = $('#notfound');
		var iframe;
		var loadDocumentCallback;
		var shouldAppendRecentChanges;


		// not ideal
		this.setMarginLeftAnimated = function(ml, duration) {			
			$holder.animate( { marginLeft:ml }, duration);
		};

		this.showFail = function() {

			if (iframe) {
				$(iframe).remove();
				iframe = null;
			}
			$(EventBus).trigger('iframe-scroll', 0);  // ha

			$notFound.css('display', 'block');
		};

		this.showEmpty = function () {
			if (iframe) {
				$(iframe).remove();
				iframe = null;
			}
			$(EventBus).trigger('iframe-scroll', 0);
		};

		this.doDocument = function(url, pShouldAppendRecentChanges, callback) {

			shouldAppendRecentChanges = pShouldAppendRecentChanges;
			loadDocumentCallback = callback;

			$.get(url, onDocumentLoaded).fail(onDocumentFail);
		};

		// ---

		var onDocumentFail = function(o) {
	    	loadDocumentCallback("failed"); 
	    };

		var onDocumentLoaded = function(html) {

			if (iframe) $(iframe).remove();
			$notFound.css('display', 'none');

			html = AppUtil.editDocumentHtml(html);

			if (shouldAppendRecentChanges) {
				html = AppUtil.appendRecentChangesToHtml(html, model);
			}

			// TODO: try in IE<11
			iframe = document.createElement('iframe');
			iframe.id = 'contentIframe';
			$holder.append(iframe);

			$(iframe).addClass('contentIframe');
			
			// rem, an iframe has oldschool width + height attributes that need to be 100%' to fill its container
			// (ie, <iframe width='100%' height='100%'>)
			$(iframe).attr('width', '100%');  
			$(iframe).attr('height', '100%');

			iframe.contentWindow.document.open();
			iframe.contentWindow.document.write(html);
			iframe.contentWindow.document.close();

			$(iframe).css('display', 'none');

			$(iframe).ready(onIframeReady);
		};

		var onIframeReady = function() {

			$(iframe).css('display', 'block');

			$(iframe.contentWindow).scroll(function() {

				var y = Util.windowScrollY(iframe.contentWindow);
				$(EventBus).trigger('iframe-scroll', y);
			});

			$(iframe.contentWindow).keyup( function(e) { 
				if (e.keyCode == 27) $(EventBus).trigger('nav-toggle-size');  // escape key
			});

			$(EventBus).trigger('iframe-scroll', 0);

			loadDocumentCallback();
		}
	};

	return Content;
});
