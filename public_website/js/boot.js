require.config({
	paths: {
		'jquery'				: 'libs/jquery-2.1.0',
		'underscore'			: 'libs/underscore-v1.6.0',
		'handlebars.runtime'	: 'libs/handlebars.runtime.amd-v2.0.0-a4'
	},
	shim: {
		'jquery'				: { exports: '$' },
		'underscore'			: { exports: '_' }
	}
});

require( ['project/main'], function (Main) {
	window.main = new Main();
} );
