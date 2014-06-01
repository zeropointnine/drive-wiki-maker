#Wiki Maker Admin Client (webpage)

This is the front-end client for the Wiki Maker backend. It can be
used to configure its settings.

The backend service can also be configured thru just editing its
config file, but this front-end admin client was created partly for learning purposes.

It is a purely static site. By default, the Node backend service
is set up to serve its files to the browser.


##Project setup

Single-page site (just one html page)
Uses AMD modules with require.js
Uses SASS/Compass to generate the CSS.

Is set up for IDEA, but: compass 'plugin' is NOT enabled,
because it locks up the application bad.

##Production build:

Double-click "build.command" in the base project directory (OSX).
This will create the single, minified js source file "boot-prod.js".
Requires node as well as require.js as a global npm install.

Might as well keep the un-minified js files there as-is, no harm in it
The html file for the production version is "console-prod.html


##Deployment:

The entire '3-project' 'project' directory can be uploaded in one go,
so no further configuration needs to be done.

The site could be set up to run using any file server since it has no
backend dependencies (aside from the Node service itself). This would
probably require some minor pathing logic changes, related to the callback url, etc.
