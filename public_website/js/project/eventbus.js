/**
 * This module is used to send and listen to events via jQuery.
 * It has no purpose other than to be a shared object thru which
 * different components can send and receive events.
 * 
 * Usage, where module is named 'EventBus':
 *
 * - Sender:  	$(EventBus).trigger('my event');
 * - Receiver: 	$(EventBus).on('my event', doSomething);
 */

define([], function() {
	var f = function() {};
	return f;
});
