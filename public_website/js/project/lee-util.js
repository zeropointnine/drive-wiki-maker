/**
 * General utility class
 */

define([], function () {

	var LeeUtil = function() {
		// no 'instance methods' atm
	};

	// ---
	// 'static methods':

	// http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
	LeeUtil.getUrlParam = function (name) {
	    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
	        results = regex.exec(location.search);
	    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	};

	LeeUtil.assert = function(condition, message) {
	    if (! this.assertEnabled) return;
	    if (! condition) {
	        throw new Error(message || "Assertion failed");
	    }
	};

	// Set this to false to disable throwing errors on-assert-failed
	LeeUtil.assertEnabled = true;

	// polyfill
	//
	LeeUtil.windowScrollY = function (win) {

		return (win.pageYOffset !== undefined) ? 
			win.pageYOffset 
			: 
			(win.document.documentElement || win.document.body.parentNode || win.document.body).scrollTop;
	}

	return LeeUtil;
});
