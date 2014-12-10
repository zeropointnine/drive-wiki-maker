/**
 *
 */
define(['project/lee-util', 'project/shared', 'project/eventbus', 'jquery'], function (Util, Shared, EventBus, $) {

	var f = function() {};

	f.editDocumentHtml = function(html) {

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

	return f;
});
