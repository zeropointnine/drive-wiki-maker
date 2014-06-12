Drive Wikimaker - Admin website subproject
==========================================

This is the front-end admin interface for the Wikimaker server. It is a static, single-page site.

It uses AMD modules using require.js. The CSS is generated using SCSS/Compass.


### Todo's

- "Refresh Drive data" button
- "Erase wiki data" functionality
- An association should be made between the access token and the name or username of the authorized Google account 
- Possibly use skinned modal for error feedback rather than a simple alert()
- Bug: Changing root folder or home document should immediately update tree.json
- Bug: when changing hosts (eg, when moving prefs from one computer to another), redirect url prompt is wrong until some kind of update is done
