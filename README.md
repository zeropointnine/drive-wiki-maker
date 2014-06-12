Drive Wikimaker
===============

Drive Wikimaker generates a static wiki website from documents in a user's Google Drive account. 

It consists of three subprojects:

- A node.js web service which scrapes documents from a Google Drive directory
- An admin console front-end for the web service
- A public-facing webpage for browsing the exported documents

See the subprojects' respective README's for more details on setup and configuration.

IntelliJ .iml module files are supplied for each sub-project, but can be ignored if not using IntelliJ.  

This project may not get regularly updated. Please fork.

You can see it in action here:  [http://wiki.zeropointnine.com](http://wiki.zeropointnine.com)


Running the app on localhost for the first time
-----------------------------------------------

Make sure node.js and npm are installed.

CD to `[wiki-maker base directory]/server`

Install the node server dependencies:  
`npm install`

Run the node server:  
`node src/index.js`

Browse to the admin webpage:  
`https://localhost:3001/console.html` 

Ignore the browser security warning and continue.

At the login view, leave username blank, and enter `hi` for the password.

At this point, you will to have set up a [Google API project](https://code.google.com/apis/console). Make sure "Drive API" is enabled.

Back at the admin page, enter your Google API project's client ID and client secret.

As directed, use the value given for "redirect url" to update your Google API project's redirect url.
 
Click "Link to Google Drive". 

When the Google authorization page comes up, click "Accept" to be redirected back to the admin page.
 
In the "Wiki Content" section, set the root folder for your wiki.

Click "Export now". 

A modal dialog appears while the export is in progress. Close it when it completes.

The wiki should be ready. Browse to:  
`http://localhost:3001`

For deployment and deployment-related configuration settings, see the server subproject's README.
