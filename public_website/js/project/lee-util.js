/**
 * General utility class
 */

define([], function () {

	var f = function() {
		// no 'instance methods' atm
	};

	// ---
	// 'static methods':

	// http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
	f.getUrlParam = function (name) {
	    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
	        results = regex.exec(location.search);
	    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	};

	f.assert = function(condition, message) {
	    if (! this.assertEnabled) return;
	    if (! condition) {
	        throw message || "Assertion failed";
	    }
	}

	// Set this to false to disable throwing errors on-assert-failed
	f.assertEnabled = true;

	// polyfill
	//
	f.windowScrollY = function (win) {

		return (win.pageYOffset !== undefined) ? 
			win.pageYOffset 
			: 
			(win.document.documentElement || win.document.body.parentNode || win.document.body).scrollTop;
	}

	return f;
});
