/**
 * Uses 'app-bootstrap-modal', which is a duplicate of the bootstrap-modal with any needed functionality changes
 * Is more of a 'controller' than anything else.
 */

define(['app-bootstrap-modal', 'eventbus', 'jquery'], function(AppBootstrapModal, EventBus, $) {

	var f = function() {

		var $modal = $('#generating-modal');
		var $status = $('#generate-modal-status');
		var $progress = $('#progress');
		var $progressBar = $('#progress-bar');
		var $progressLabel = $('#progress-label');
		var $headerCloseButton = $('#modal-header-close');
		var $footerCloseButton = $('#modal-footer-close');


		this.show = function () {
			$modal.modal({ dismissable: false });
			$headerCloseButton.css('visibility', 'hidden');
			$footerCloseButton.css('visibility', 'hidden'); // yes really
		};

		this.update = function (statusObject) {

			var s = statusObject.exportingMessage;
			$status.html(s);

			if (statusObject.exportingFilesTotal) {

				$progress.css('display', 'block');

				var numDone = statusObject.exportingFilesUnchanged + statusObject.exportingFilesSaved + statusObject.exportingFilesFailed;
				var pct = Math.round((numDone / statusObject.exportingFilesTotal) * 100);
				$progressBar.attr('aria-valuenow', pct);
				$progressBar.css('width', pct + '%');
				var lbl = numDone + ' of ' + statusObject.exportingFilesTotal;
				$progressLabel.html(lbl);
			}
			else {
				$progress.css('display', 'none');
			}
		};

		this.showEndState = function (statusObject) {

			$progress.css('display', 'none');

			var s;
			if (statusObject.lastExportResult == 'complete')
			{
				s = 'Finished.<br/>';
				if (statusObject.exportingFilesUnchanged == statusObject.exportingFilesTotal)
				{
					s += 'No document files changed since last export.';
				}
				else
				{
					s += statusObject.exportingFilesSaved + ' saved';
					if (statusObject.exportingFilesUnchanged > 0) {
						s += ', ' + statusObject.exportingFilesUnchanged + ' unchanged';
					}
					if (statusObject.exportingFilesFailed) s += ', ' + statusObject.exportingFilesFailed + ' failed ';
				}
			}
			else
			{
				s = 'Error! ' + statusObject.lastExportResult;
			}
			$status.html(s);

			$headerCloseButton.css('visibility', 'visible');
			$footerCloseButton.css('visibility', 'visible');
		};

		this.hide = function () {
			$modal.modal('hide');
		};
	};

	return f;
});

