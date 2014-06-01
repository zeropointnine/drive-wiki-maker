// configure require 'shim' to load non-module code

require.config(
	{
	    paths: {
	        'jquery'				: 'libs/jquery-2.1.0',
	        'underscore'			: 'libs/underscore-v1.6.0',
	        'app-bootstrap-modal'	: 'components/app-bootstrap-modal'
	    },
	    shim: {
	        'jquery'				: { exports: '$' },
	        'underscore'			: { exports: '_' },
	        'app-bootstrap-modal'	: { exports: 'AppBootstrapModal', deps: ['jquery'] }
	    }
	}
);

require(['main'], 
	function (Main) { 
		new Main().start();
});
