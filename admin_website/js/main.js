// TODO - enable/disable all method

define(['app-util', 'lee-util', 'eventbus', 'components/export-modal', 'jquery'],
		function(AppUtil, LeeUtil, EventBus, ExportModal, $) {

	var Main = function() {

		var SERVICE_URL = 'service';

		var isDev = (window.location.href.indexOf('localhost') > -1);

		var modal;
		var $busyOverlay = $('.busy-overlay');
		var $spinner = $('#spinner');

		// ----------------
		// startup sequence

		this.start = function () {

			init();

			// is user not logged in?
			if (! LeeUtil.readCookie("sessionId")) {
				return showLogin();
			}

			showForm();


			// has browser returned here from google account consent page?

			var code = LeeUtil.getUrlParam('code');
			var error = LeeUtil.getUrlParam('error');
			// console.log('code:', code, 'error:', error);

			if (code) return handleRedirectCode(code);
			if (error) return handleRedirectError(error);


			requestStateOnStartup();
		};

		var init = function () {

			modal = new ExportModal();

			// ui listeners
			$('#login-button').click(onLoginButton);
			$('#logout').click(postLogout);
			$('#authorize-button').click(onAuthButton);
			$('#deauthorize-button').click(onDeauthButton);
			$('#folder-list').on('change', onRootFolderChange);
			$('#default-document-list').on('change', onDefaultDocumentChange);
			$('#wiki-title').on('input', onWikiTitleInput);
			$('#wiki-title-button').click(onWikiTitleSubmitButton);
			$('#refresh-interval-list').on('change', onRefreshIntervalChange);
			$('#wiki-button').click(onWikiButton);
			$('#export-now-button').click(requestExport);
			$('#generating-modal').on('hidden.bs.modal', requestState);

			$(window).resize(sizeOverlay);
			sizeOverlay();

			if (isDev) {
				$('#test-buttons').css('display', 'block');
				$('#test1').click(test1);
				$('#test2').click(test2);
				$('#test3').click(test3);
			}
		};

		var handleRedirectCode = function (code) {
			clearFragment();
			postCode(code);
		};

		var postCode = function(code) {
			post({ action: 'setCode', value: code }, onInitResponse);
		};

		var handleRedirectError = function (errorMessage) {
			clearFragment();
			showFailFeedback(errorMessage);
			requestStateOnStartup();  // ... keep going
		};

		var clearFragment = function () {
			var uri = window.location.toString();
			var clean_uri = uri.substring(0, uri.indexOf("?"));
			window.history.replaceState({}, document.title, clean_uri);
		};

		var requestStateOnStartup = function () {
			post({ action: 'getState' }, onInitResponse);
		};

		var onInitResponse = function (o) {

			if (! onRegularServiceResponse(o)) return;
			if (o.data.status && o.data.status.isExporting) return startModalPollingState();

			if (o.data.prefs.hasRefreshToken && ! o.data.status.hasDriveData) {
				// service says it's authorized to make Drive requests,
				// but doesn't have drive-data yet, so get it
				requestDriveData();
			}
			else {
				// done
			}
		};

		// -----------
		// ui handlers

		var onLoginButton = function () {
			var un = $('#login-name').val();
			var pw = $('#login-password').val();
			postLogin(un, pw);
		}

		var onAuthButton = function () {
			// TODO - handler for empty inputs
			var id = $('#client-id').val();
			var secret = $('#client-secret').val();
			postStartAuth(id, secret);
		};

		var onDeauthButton = function () {
			var yes = window.confirm("Are you sure?");
			if (yes) postDeauth();
		};

		var onRootFolderChange = function () {
			var id = $('#folder-list').val();
			if (!id) return;
			postBaseFolderId(id);
		};

		var onDefaultDocumentChange = function () {
			var id = $('#default-document-list').val();
			if (!id) return;
			postDefaultDocumentId(id);
		};

		var onWikiTitleInput = function () {
			var title = $('#wiki-title').val();
			$('#wiki-title-button').attr('disabled', false);
		};

		var onWikiTitleSubmitButton = function () {
			var title = $('#wiki-title').val();
			postWikiTitle(title);
		};

		var onRefreshIntervalChange = function () {
			var value = $('#refresh-interval-list').val();
			postRefreshIntervalCode(value);
		};

		var onWikiButton = function () {
			var s = window.location.origin + window.location.pathname;
			window.location = wikiUrl;
		};

		// --------------------
		// core service methods

		/**
		 * Service posting wrapper. All posts should go thru here.
		 * Automatically shows waiting state until response
		 *
		 * @param object
		 * @param onSuccess    if null, calls back to onRegularServiceResponse, which automatically updates ui
		 * @param onFail        if null, calls back to onRegularServiceFail
		 */
		var post = function (object, onSuccess, onFail) {

			if (!onSuccess) onSuccess = onRegularServiceResponse;
			if (!onFail) onFail = onRegularServiceFail;

			var good = function (o) {
				setWaitingState(false);
				onSuccess(o);
			};

			var bad = function (o) {
				setWaitingState(false);
				onFail(o);
			};

			setWaitingState(true);
			$.post(SERVICE_URL, object, good).fail(bad);
		};

		/**
		 * All regular service responses are expected to have data, data.prefs, and data.status properties
		 * Returns false if not valid
		 */
		var onRegularServiceResponse = function (o) {

			if (!o || !o.data) {
				showFailFeedback('Missing data');
				return false;
			}
			if (!o.data.prefs) {
				showFailFeedback('Missing prefs');
				return false;
			}
			if (!o.data.status) {
				showFailFeedback('Missing status');
				return false;
			}

			populateForm(o.data);
			return true;
		};

		var onRegularServiceFail = function (xhr) {

			var errorMessage;
			try {
				errorMessage = JSON.parse(xhr.responseText).error;
			}
			catch (e) {
			}
			errorMessage = errorMessage || xhr.responseText || "";

			if (errorMessage.toLowerCase().indexOf('session mismatch') > -1 || errorMessage.toLowerCase().indexOf('session expired') > -1) {
				LeeUtil.eraseCookie('sessionId');
				showLogin();
			}

			showFailFeedback(errorMessage);
		};

		var showFailFeedback = function (errorMessage) {

			if ($('#login').css('display') != 'none') {
				$('#login-feedback').html(errorMessage);
			}
			else {
				var s = 'problem';
				modal.hide(); // just in case
				alert(errorMessage);  // TODO - make skinned modal dialog
			}
		};

		// ----------------------
		// service call functions

		var requestState = function () {
			post({ action: 'getState' });
		}

		var requestDriveData = function () {
			post({ action: 'getDriveDataAndMakeTree' });
		};

		var postLogin = function (un, pw) {

			var onResponse = function (o) {
				if (! onRegularServiceResponse(o)) return;
				showForm();
				requestStateOnStartup();
			}

			post({ action: 'login', un:un, pw:pw }, onResponse);
		};

		var postLogout = function () {
			post({ action: 'logout' }, function(o) {  // any response means success
				showLogin();
				setLoginFeedback('Logged out');
			} );
		};

		var postStartAuth = function (id, secret) {

			var onResponse = function (o) {

				console.log('startauth response')

				if (! onRegularServiceResponse(o)) {
					return;
				}
				// redirect to consent url; user will return here with code url fragment
				var consentUrl = o.data.consentUrl;
				if (! consentUrl) {
					return showFailFeedback('Missing auth url from service');
				}

				window.location.href = consentUrl;
			};

			console.log('startauth ')

			// Note how it's the _client_ that dictates the redirect url
			var redirectUrl = encodeURI(window.location.origin + window.location.pathname);
			var o = { action: 'startAuth', id:id, secret:secret, redirectUrl:redirectUrl };
			post(o, onResponse);
		};

		var postDeauth = function () {
			post({ action: 'deauth' });
		};

		var postBaseFolderId = function (id) {
			post({ action: 'setBaseFolderId', value: id });
		};

		var postDefaultDocumentId = function (id) {
			post({ action: 'setDefaultDocumentId', value: id });
		};

		var postWikiTitle = function (title) {
			post({ action: 'setWikiTitle', value: title });
		};

		var postRefreshIntervalCode = function (value) {
			post({ action: 'setRefreshIntervalCode', value: value });
		};

		var requestExport = function () {

			var onResponse = function (o) {
				if (! onRegularServiceResponse(o)) return;
				startModalPollingState();
			};

			post({ action: 'exportWiki' }, onResponse);
		};

		// -----------------------------------
		// view update functions

		var sizeOverlay = function () {
			$busyOverlay.css('width', $(window).width());
			$busyOverlay.css('height', $(window).height());
		}

		var setWaitingState = function (b) {

			if (b) {
				$busyOverlay.css('display', 'block');
				$busyOverlay.css('opacity', '0');
				$busyOverlay.stop(true);
				$busyOverlay.animate( { opacity: 0.5 }, 1000);

				$spinner.css('display', 'block');
				$spinner.css('opacity', '0');
				$spinner.stop(true);
				$spinner.animate( { opacity: 1.0 }, 1000);
			}
			else {
				var opa = $busyOverlay.css('opacity');
				var dur = opa * 1500;

				$busyOverlay.stop(true);
				$busyOverlay.animate( { opacity: 0.0 }, dur, null, function() { $busyOverlay.css('display', 'none'); } );

				$spinner.stop(true);
				$spinner.animate( { opacity: 0.0 }, dur, null, function() { $spinner.css('display', 'none'); } );
			}
		};

		var showForm = function () {
			$('#login').css('display', 'none');
			$('#form').css('display', 'block');
			$('#logout').css('display', 'inline');

			$('#login-name').val('');
			$('#login-password').val('');

			// update redirect url prompt
			var s = window.location.origin + window.location.pathname;
			$('#redirect-url').attr('value', s);
		};

		var showLogin = function() {
			$('#form').css('display', 'none');
			$('#logout').css('display', 'none');
			$('#login').css('display', 'block');

			$('#login-name').val('');
			$('#login-password').val('');
		};
		var setLoginFeedback = function (s) {
			$('#login-feedback').html(s);
		};

		var populateForm = function (data) {

			populatePrefsRelated(data.prefs);
			populateStatusRelated(data.status);

			if (data.simpleFolderList)
				populateFolderList(data.simpleFolderList, data.prefs.driveBaseFolderId);
			else
				emptyFolderList();

			if (data.simpleFileList)
				populateDefaultDocumentList(data.simpleFileList, data.prefs.driveDefaultDocumentId);
			else
				emptyDefaultDocumentList();
		};

		var populatePrefsRelated = function (prefs) {

			// form panels visibility
			var visIs = ( $('#form-group-wiki').css('display') == 'block' );
			var visSb = prefs.hasRefreshToken;

			if (visIs != visSb) {
				var vis = (visSb ? 'block' : 'none');
				$('#form-group-wiki').css('display', vis);
				$('#form-group-generate').css('display', vis);
			}

			// auth status
			var s;
			if (! prefs.hasRefreshToken) {
				s = '<em class="auth-status-isnt">Authorize Google Drive account to continue</em>';
			}
			else {
				s = '<span class="auth-status-is">Currently authorized';
				if (prefs.userDisplayName) s += ' as ' + prefs.userDisplayName;
				s += '</span>';
			}
			$('#auth-status').html(s);

			$('#deauthorize-button').attr('disabled', ! prefs.hasRefreshToken);

			// various inputs
			$('#client-id').attr('value', prefs.googleApiClientId);
			$('#client-secret').attr('value', prefs.googleApiClientSecret);
			$('#redirect-url').attr('value', prefs.googleApiRedirectUrl);
			$('#wiki-title').attr('value', prefs.wikiTitle);
			$('#wiki-title-button').attr('disabled', true);
			$('#refresh-interval-list').val(prefs.refreshIntervalCode);
		};

		var populateStatusRelated = function (status) {

			// next export in
			var s;
			if (! status.nextExportMs) {
				s = 'Next update: None scheduled';
			}
			else {
				s = 'Next update in ' + AppUtil.makeFriendlyNext(status.nextExportMs);
			}
			$('#status-next').html(s);

			// last result
			var s;

			if (status.lastExportUtcTime)
			{
				var i = LeeUtil.utcToLocalTime( status.lastExportUtcTime );
				var d = new Date(i);
				var s = AppUtil.makeFriendlyDate(d);
				s = 'Last result:<br/>' + s + '<br/>';
				if (status.lastExportResult == 'complete') {

					s += status.lastExportFilesSaved + ' saved, ';
					s += status.lastExportFilesUnchanged + ' unchanged';
					if (status.lastExportFilesFailed) {
						s += ', ' + status.lastExportFilesFailed + ' ' + 'failed';
					}
				}
				else {
					s += status.lastExportResult;
				}
			}
			else {
				s = '';
			}
			$('#status-last').html(s);

			// wiki link
			if (status.servesPublicWebsiteOnPort) {
				$('#wiki-link').css('display', 'inline');
				var url = "http://" + window.location.hostname + ":" + status.servesPublicWebsiteOnPort;
				$('#wiki-link').attr('href', url);
			}
			else {
				$('#wiki-link').css('display', 'none');
			}
		};

		var populateFolderList = function (folderList, selectedId) {

			var $fl = $('#folder-list');
			$fl.empty();
			var html = '<option>Select</option>';
			for (var i = 0; i < folderList.length; i++) {
				s = '<option value="' + folderList[i].id + '">' + folderList[i].title + '</option>';
				html += s;
			}
			$fl.html(html);  // ha

			if (selectedId) $fl.val(selectedId);
		};

		var emptyFolderList = function () {
			var $fl = $('#folder-list');
			$fl.empty();
		};

		var populateDefaultDocumentList = function (fileList, selectedId) {
			var $fl = $('#default-document-list');
			$fl.empty();
			var html = '<option value = "none">-</option>';
			for (var i = 0; i < fileList.length; i++) {
				s = '<option value="' + fileList[i].id + '">' + fileList[i].title + '</option>';
				html += s;
			}
			$fl.html(html);  // ha
			$fl.val(selectedId || 'none');
		};

		var emptyDefaultDocumentList = function () {
			var $fl = $('#default-document-list');
			$fl.empty();
		};

		// ----------------
		// modal state logic

		var startModalPollingState = function () {
			modal.show();
			pollStatus();
		};

		var pollStatus = function () {
			// not using regular post wrapper here:
			$.post(SERVICE_URL, { action: 'getStatus' }, onPollStatusResponse).fail(onRegularServiceFail);
		};

		var onPollStatusResponse = function (o) {

			// console.log('pollStatus response', o);

			if (! o || ! o.data || ! o.data.status) {
				showFailFeedback('Missing data or status property');
				return;
			}

			modal.update(o.data.status);

			if (! o.data.status.isExporting) {  // done
				modal.showEndState(o.data.status);
				return;
			}

			setTimeout(pollStatus, 666);
		};

		//

		var test1 = function () {
			// LeeUtil.createCookie('sessionId', '666', 1/24);
			// modal.show();
			// requestDriveData();
			post( { action:'wait' } );
		};

		var test2 = function () {
			// console.log( LeeUtil.readCookie('sessionId') );
		};

		var test3 = function () {
			// LeeUtil.eraseCookie('sessionId');
		};
	};

	return Main;
});
