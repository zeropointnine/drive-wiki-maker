define(['project/lee-util', 'project/shared', 'project/eventbus', 'jquery'],
		function(Util, Shared, EventBus, $) {


	var Header = function($holder, $spacer)
	{
		Util.assert($holder && $holder.length == 1 && $spacer && $spacer.length == 1, "Bad arg");

		var $title = $('#headerTitle');
		var $crumb = $('#headerCrumb');
		var $dateView = $('#headerDate');
		var $preview = $('#preview');

		var defaultHeight;
		var iframeScrollY = 0;
		var scrapedTimeString;


		this.setScrapedTimeUtc = function(i) {
			var d = new Date(i);
			scrapedTimeString = stringFromDate(d);
		};

		this.update = function(modelItem, crumbString) {

			if (modelItem) 
			{
				$title.html(modelItem.title);
				$crumb.html(crumbString);

				var s = '';
				if (scrapedTimeString) s += 'Scraped: ' + scrapedTimeString + '<br>';
				var modifiedTimeString = stringFromIso8601String(modelItem.modifiedDate);
				if (modifiedTimeString) s += 'Modified: ' + modifiedTimeString;
				$dateView.html(s);

				$preview.css('display', 'block');
				$preview.attr('href', modelItem.embedLink);
			}
			else 
			{
				$title.html('&nbsp;');
				$crumb.html('&nbsp;');
				$dateView.html('&nbsp;<br/>&nbsp;');

				$preview.css('display', 'none');
				$preview.attr('href', '#');
			}

			size();
		};

		// ---

		var size = this.size = function() {

			defaultHeight = headerHeight = $('#header').height();

		    var h = Math.max(defaultHeight - Math.abs(iframeScrollY),  0);
			$('#headerSpacer').css('height', h + 'px');
			var off = (defaultHeight - h) * -1;
			$('#header').css('top', off + 'px');

			// rem, #content automatically expands to fill area under headerSpacer, 
			// and its iframe always expands to fill #content
		};

		var stringFromIso8601String = function (stringIso8601) {
			
			var i = Date.parse(stringIso8601);
			var d = new Date(i);
			return stringFromDate(d);
		};

		var stringFromDate = function (d) {

			if (! d) return null;

			var month = (d.getMonth()+1) + '';
			if (month.length == 1) month = '0' + month;
			var day = d.getDate() + '';
			if (day.length == 1) day = '0' + day;

			var s = d.getFullYear() + '/' + month + '/' + day;
			return s;
		};

		// ---

		$(EventBus).on('iframe-scroll', function(e, y) {
			iframeScrollY = y;
			size();
		})
	};

	return Header;
});
