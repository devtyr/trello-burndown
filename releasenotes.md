# RELEASE NOTES

## 0.9.3

* List with empty name can't be inserted any more
* Use boardID given in settings.json if not passed as opt
* Add check for process.env.PORT

## 0.9.2

* Get list of available boards via `info.js`

## 0.9.1

* Support for Scrum for Trello Chrome extension
* Fix when a card in one of the columns doesn't have a correct match syntax and hence as a result caused the server to crash [Juri Strumpflohner](https://github.com/juristr "Juri Strumpflohner")
* Adding console.log to write out the card that failed the regex check [Juri Strumpflohner](https://github.com/juristr "Juri Strumpflohner")

## 0.9.0

* Removed dependencies to `trello` and `restler` due to incompatibility with node 0.10.x
* Added dependency to `trello_ex`
* Minor refactorings

## 0.8.0

### Bugs

* Sprint was disabled one day to early
* 'export' and 'config' folders are created on startup now if they don't exist
* Removed d3.js as a NPM module due to incompatibility with node 0.10.x; added as a static resource
* Work done on none work days won't be tracked
* Changed sprint burndown for uniformity

### Features

* Mouseover for data points
* Support of multiple finished lists
* Unfinished tasks are shown on current sprint (web)
* Statistical data on current sprint

## 0.7.0

### Features

* Renamed "Update sprints" to "Update active sprints"
* Added "Manage sprints"
* Sprints can be created via website
* Sprints can be edited via website
* Menu and footer are available as sub templates

### Improvements

* Only active sprints are shown in "View sprints"
* Added "All sprints" page

## 0.6.0

* Home page for sprint selection
* Store configuration using parameter "-s" (generate.js)
* Refresh sprint for specific configuration via web page (only active sprints can be refreshed)
* Included bootstrap

## 0.5.0

### Bugs

* Fixed total effort calculation bug (for chart "Done estimate vs. effort (total)")

### Features

* Templating support
* CSS support

## 0.4.0

### Bugs

* Archived Trello lists won't be considered any more
* Console output statistics fixed

### Features

* New chart "total estimate and effort"
* Estimates can be floats now

## 0.3.0

* HTTP server
* Included xCharts and D3 for generating charts
* Support for different sprints
* Removed CSV support
* Data exported in JSON format

## 0.2.0

* standup meeting time

## 0.1.0

* initial release
