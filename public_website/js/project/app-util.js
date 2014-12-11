/**
 *
 */
define(['project/lee-util', 'project/shared', 'project/eventbus', 'jquery'], function (Util, Shared, EventBus, $) {

	var AppUtil = function() {};

	AppUtil.editDocumentHtml = function(html) {

		// Do any customization of the google document's exported html here
		// It should be assumed though that the way the document is structured as well as its specific content could change

		// TODO: manipulate dom rather than raw string ugly regex (oh well) (at least for any non-css stuff)

		// console.log('html before', html);

		(function forceDefaultBodyPadding() {

			var myDefaultPadding = '36pt 36pt 36pt 36pt';

			// get the classname of the body tag ( eg, `c6` in `<body class="c6">` )
			var re = /<body\s+class=[\"\']([^\"\']*)/;
			var a = re.exec(html);
			if (a && a[1])
			{
				var bodyClassName = a[1];
				// console.log('bodyClassName1', bodyClassName)
				// find the css definition for that classname ( eg, .c6{ everything inside the curly-brackets} )
				re = new RegExp(bodyClassName + '\\s*{([^}]*)');
				a = re.exec(html);

				var classDef = a[1];
				// console.log('classDef', classDef)
				if (classDef)
				{
					// replace whatever is set for 'padding' with my prefs
					re = /padding\s*:\s*([^;}]*)/;
					a = re.exec(classDef);
					if (a && a[1]) {
						var paddingValue = a[1];
						// console.log('paddingValue', paddingValue);
						html = html.replace(paddingValue, myDefaultPadding);
					}
				}
			}
		})();

		(function replaceGoogleConsolas() {
			// google font requests are resulting in 403. seems like a bug ('sameorigin').
			// this is very much hardcoded and needs to be monitored...
			html = html.replace('https://themes.googleusercontent.com/fonts/css?kit=lhDjYqiy3mZ0x6ROQEUoUw', '/styles/consolas-local.css');
		})();


		(function undoctorLinks() {

			// External links look like this:
			//
			// 		http or https://www.google.com/url?q=some_url_encoded_value",
			//
			// where the q param value ends with &amp;sa=...&amp;sn=...&amp;tz=...
			// also, the '&ampsa=;' can sometimes show up as just '&sa='

			var re = /href=\"(?:http|https):\/\/www\.google\.com\/url\?q=(.*?)(?:\&amp\;|\&)sa=.*?\"/g;

			var m;
			while ((m = re.exec(html)) != null) {
				if (m.index === re.lastIndex) re.lastIndex++;

				var origHrefAndValue = m[0];
				var qValWithoutExtraParams = m[1];
				var newTargetHrefAndValue = 'target="_blank" href=' + '"' + decodeURIComponent(qValWithoutExtraParams) + '"';
				html = html.replace(origHrefAndValue, newTargetHrefAndValue);

				// 'invalidate' the search b/c string has changed
				re.lastIndex = 0;
			}
		})();

		// console.log('html after', html);

		return html;
	};

	AppUtil.appendRecentChangesToHtml = function(html, model) {

		var agoString = function(epochMs) {

			var minutesPerHour = 60;
			var minutesPerDay = 60 * 24;
			var minutesPerMonth = 60 * 24 * 31;  // goodenough

			var minutesAgo = (Date.now() - epochMs) / 1000 / 60;

			console.log('xxx', Date.now(), epochMs, (Date.now() - epochMs));


			var val;
			if (minutesAgo < minutesPerHour) {
				val = Math.round(minutesAgo);
				return val + ((val == 1) ? " minute ago" : " minutes ago");
			}
			else if (minutesAgo < minutesPerDay) {
				val = Math.round(minutesAgo / minutesPerHour);
				return val + ((val == 1) ? " hour ago" : " hours ago");
			}
			else if (minutesAgo < minutesPerMonth) {
				val = Math.round(minutesAgo / minutesPerDay);
				return val + ((val == 1) ? " day ago" : " days ago");
			}
			else {
				val = Math.round(minutesAgo / minutesPerMonth);
				return val + ((val == 1) ? " month ago" : " months ago");
			}
		};

		if (! model || ! model.recentChanges()) return html;


		// TODO: use stylesheet which would need to be 'injected' into teh html

		var s = "<br><br>";
		s += "<h2><em>Recent updates:</em></h2>";
		s += "<ul>";

		var a = model.recentChanges();
		for (var i = 0; i < a.length; i++)
		{
			var changeItem = a[i];
			if (! changeItem.id) continue;
			var modelItem = model.itemById(changeItem.id);
			var anchorText = model.makeCrumbStringOfItem(modelItem)  +  (modelItem.title || 'Untitled');
			var anchorTag = "<a href='javascript:window.parent.main.doDocument(\"" + changeItem.id + "\");'>" + anchorText + "</a>";

			s += "<p>";
			s += anchorTag;
			if (changeItem.epochMs) {
				s += " (" + agoString(changeItem.epochMs) + ")";
			}
			s += "</p>";
		}
		s += "</ul><br>";

		html = html.replace("</body>", s + "</body>");
		return html;
	};

	return AppUtil;
});
