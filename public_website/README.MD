Drive Wikimaker - Public wiki website subproject
================================================

This is the public-facing wiki website. It is a static, single-page site 
which loads Drive documents exported in html format into an iframe.

The page uses AMD modules using require.js. The CSS is generated using SCSS/Compass.

The server saves exported Drive documents to html files in the subdirectory `exported_documents`.

The server exports a data model file to `exported_documents/tree.json`, 
which is used by the webpage to populate the file list nav.


Compiling
---------

In `index.html`, a test for `localhost` determines whether or not the page will load 
the combined, minified version of the Javascript codebase.

To recompile:

1. Install requirejs globally first if not already installed: `npm install -g requirejs`
2. `r.js -o build.js`


Todo's
------

- Add disabled states for expand and collapse buttons;  if no subfolders, disable both always
- Add a a visual state to the iframe/document area forwhen when there's no default document assigned
- Potentially find workaround to the use of iframes for SEO purposes
