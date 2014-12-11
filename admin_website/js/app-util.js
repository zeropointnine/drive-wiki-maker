define([], function () {

	var f = function() {
		// no 'instance methods'
	};

	// ---
	// 'static methods':

	f.makeFriendlyNext = function (ms) {

		var secs = ms / 1000;
		var mins = secs / 60;
		var hrs = mins / 60;
		var s;
		if (mins < 90) {
			mins = Math.round(mins);
			s = mins + ' ' + (mins == 1 ? 'minute' : 'minutes');
		}
		else {
			hrs = (Math.round(hrs*2) * 5) / 2 / 5;  // eg, "2.5"
			s = hrs + ' hours';
		}
		return s;
	};

	f.makeFriendlyDate = function (date) {

		var twoDigits = function (digit) {
			digit = digit + '';
			return (digit.length == 1) ? '0' + digit : digit;
		};

		var s = '';
		s += (date.getYear()+1900) + "/";
		s += twoDigits((date.getMonth() + 1)) + "/";
		s += twoDigits(date.getDate()) + " ";
		s += twoDigits(date.getHours()) + ":";
		s += twoDigits(date.getMinutes());

		return s;
	};

	// ---

	return f;
});
