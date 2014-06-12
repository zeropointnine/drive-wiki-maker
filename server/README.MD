Drive Wikimaker - Server subproject
====================================

This is a node.js app, responsible for monitoring and exporting Google Drive documents for the public-facing wiki website. 

It consists of three server processes:

- A REST service, which is responsible for exporting Drive documents on an interval, and for interacting with the admin webpage thru a single user login
- A static file server for the admin webpage front-end
- A second static file server for the public wiki website (optional)


Installation
------------

	cd [wikimaker_project]/server
	npm install


Running
-------

#### Dev

	cd [wikimaker_project]/server
	node src/index.js

#### Production

For production, the app should be launch as a long-running app to allow it to poll for changes to Google Drive on an interval.

What I do in Linux is run the node app as a daemon via chrontab on reboot, using [forever](https://github.com/nodejitsu/forever) with the following settings:

	@reboot forever start --minUptime 3000 --spinSleepTime 30000 --sourceDir /[wikimaker_project]/server src/index.js


config.json
-----------

This file is generated with various default or empty values the first time the service is run. 

Note the use of separate hashes for "dev" versus "prod".

#### prodHostName
This value dictates whether values will be used from the "dev" hash or the "prod" hash

#### password
Used for login thru the admin webpage

#### webservicePort
Port used to serve the admin webpage

#### webserviceUseHttps
If true, the admin website is served over https rather than http  

#### webserviceSslKeyPath, webserviceSslCertPath, webserviceSslCaPath
Paths to SSL credential files for use when webserviceUseHttps is set to true.
Note how the project includes sample credentials for development purposes.
These should of course be replaced for deployment.

#### webserviceWebsiteDir
Points to the static files used for the admin website. Can be left at the default value.

#### webserviceWhitelistedHost
If set with a value, the admin webpage will only be served to the specified hostname

#### shouldServePublicWebsite
If true, the app will also serve the public wiki website. The wiki website has no server-side dependencies so can otherwise be served via any webserver.

#### publicWebsitePort
Port used to serve the public wiki website when shouldServePublicWebsite is true  

#### publicWebsiteDir
Can be left at the default value

#### publicWebsiteOutputDir
Can be left at the default value

#### publicWebsiteTreePath
Can be left at the default value

#### prefsPath
Can be left at the default value


preferences.json
----------------
 
These values get updated through the admin webpage + REST server.
 
Like the config.json file, it uses separate hashes for "dev" versus "prod".


Todo's
------

- Use secure cookie
- Encrypt user password in config.json
- Add ability to filter out private Drive documents. May require one API per file (possibly not worth bothering with)
- Operationalize "mimeTypesToExport" (PDF, Word, etc). Add checkbox list for this in control panel, and extra interface elements to public front-end.
- Add a setting like `maxSizeMb` to avoid exporting overly-large files
- Possibly implement a real user management system
- Possibly consider a re-architected solution for SEO (express + handlebars?; would need a clever workaround to not rely on iframes on the front-end) 
