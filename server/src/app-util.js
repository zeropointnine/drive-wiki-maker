var l = require('./logger');

/**
 * All normal service responses should be sent thru here.
 * Responses are JSON objects with this structure: { data: object, error: string-description }
 *
 * @param response 		The response-object to use to send the response back with
 * @param dataObject 	The response data
 * @param error 		Can be an Error or an error string; if set, the http response code will be set to 400
 */
exports.sendResponse = function(response, dataObject, error) {

	var o = {};

	if (error) {
		var errorString = (error.message ? error.message : error);
		o.error = errorString;
		response.writeHead(400, "{'Content-Type': 'application/json'}");
		response.end(JSON.stringify(o));
		l.w('AppUtil.sendResponse() - sent error message:', error);
	}
	else {
		o.data = dataObject;
		response.json(o);
		// l.v('AppUtil.sendResponse() - sent');
		// l.v(JSON.stringify(o,null,4));
	}
};
