/**
 * General utility class s
 */

define([], function () {

	var f = function() {
		// no 'instance methods'
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


	// Set this to false to disable throwing errors on-assert-failed
	f.assertEnabled = true;

	f.assert = function(condition, message) {
	    if (! this.assertEnabled) return;
	    if (! condition) {
			throw new Error(message || "Assertion failed");
	    }
	}

	f.utcToLocalTime = function(utcTime) {

		var offsetMinutes = new Date().getTimezoneOffset();
		var offsetMs =  offsetMinutes * 1000 * 60;

		var date = new Date(utcTime - offsetMs);
		return date.getTime();
	}

	// polyfill
	//
	f.windowScrollY = function (win) {

		return (win.pageYOffset !== undefined) ? 
			win.pageYOffset 
			: 
			(win.document.documentElement || win.document.body.parentNode || win.document.body).scrollTop;
	}

	// http://stackoverflow.com/a/1460174
	//
	f.createCookie = function (name, value, days) {
		var expires;

		if (days) {
			var date = new Date();
			date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
			expires = "; expires=" + date.toGMTString();
		} else {
			expires = "";
		}
		document.cookie = escape(name) + "=" + escape(value) + expires + "; path=/";
	};

	f.readCookie = function (name) {
		var nameEQ = escape(name) + "=";
		var ca = document.cookie.split(';');
		for (var i = 0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) === ' ') c = c.substring(1, c.length);
			if (c.indexOf(nameEQ) === 0) return unescape(c.substring(nameEQ.length, c.length));
		}
		return null;
	};

	f.eraseCookie = function (name) {
		f.createCookie(name, "", -1);
	}

	// ---

	return f;
});
