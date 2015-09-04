# trello-burndown

Generate a burndown chart from trello cards.

## Features

* Generate burndown charts from Trello cards
* Support of multiple sprints
* Sprint configuration can be saved for usage via website from command line
* Update sprint statistics based on a job
* Web server
* Add sprints via website
* Edit sprints via website
* Update sprint statistics using the website
* List of all sprints
* Templating

	Please see the [release notes](https://github.com/devtyr/trello-burndown/blob/master/releasenotes.md "trello-burndown release notes") for further information.

## How it works

If you use [Trello](http://trello.com "Trello") to manage your sprint cards, you might want to generate your burndown chart automatically instead of doing it manually.

### Preconditions

As a precondition you have to encode some information into the card's title. This looks like that:

	[p|est-e] title

If you are using the Chrome extension [Scrum for Trello](https://chrome.google.com/webstore/detail/scrum-for-trello/jdbcdblgjdpmfninkoogcfpnkjmndgje "Scrum for Trello") you can use the following notations:

	(est) title
	[e] (est) title

First notation can be created using the extension and is for estimates. They will be summarized. It is possible to leave the effort. The second case is with defined effictive efforts. They will also be sumamrized by Scrum for Trello.

It is up to you to include the priority (sorting) into the title, or not (if you are using the Scrum for Trello pattern). It is not needed by trello-burndown.

Here are some examples that are parsed exactly the same way and generating the same values:

    "   [1]   (2) title"
    "(2)[1]title"
    "   [ 1 ]   ( 2.0 ) title"

**Huh?**

* **p**: the priority/order of the task (to be "visible" if a task is moved to another list)
* **est**: the estimate of the task, defined within the sprint planning
* **e**: the real effort (to reflect this against the estimate)

### Generate it!

> **Please note**: All these things can also be done using the web site. To do that start the included webserver (`node run.js`).

To generate it, you have to execute `generate.js` as described below:

	node generate.js -l "lists" -d "included dates" -r "count days" -f "finish list"

* **-l**: [required] A comma separated list of Trello lists (by name) that are set up for the sprint, e.g. _Planned_, _In progress_, _Testing_, _Finished_
* **-d**: [required] A comma separated list of dates in the format YYYY-MM-DD describing the days are part of the sprint
* **-r**: [required] A comma separated list of 0 or 1 (maching the days list) describing if a day is a working day or not (special days are the first - sprint planning - and the last one - deployment/recap)
* **-f**: [required] The name of the list where finished tasks have to be moved to
* **-t**: [optional] Time of your daily standup meeting. If this is defined, values are calculated based on this time, instead of midnight. **Please note** that you have to define the time in [ISO 8601](http://en.wikipedia.org/wiki/ISO_8601 "ISO 8601") format.
* **-n**: [required] Name of the sprint; is used for file generation too
* **-s**: [optional] Export the given configuration to a configuration file that can be used to refresh the sprint from the website

An example call:

	node generate.js -l "Planned, In progress, Testing, Finished" -d "2013-02-01, 2013-02-02" -r "1,1" -f "Finished" -n "sprint1"

Example call with standup meeting:

	node generate.js -l "Planned, In progress, Testing, Finished" -d "2013-02-01, 2013-02-02" -r "1,1" -f "Finished" -t "10:00:00+01:00" -n "sprint1"

Based on the given information total estimates, efforts etc. are calculated and exported to subfolder `export` in JSON format. The exported data can be viewed using the included web server.

## Web server

To start the web server use the command

	node run.js

Per default you can connect to `http://localhost:8080`.

### Supported browsers

To view the charts you can use Chrome (Chromium), Firefox, Safari (WebKit), Opera and IE10 (IE9 may work, not tested yet).

### Sample

Here is a screenshot of a generated burndown chart (for a very bad sprint):

![Home Screen](http://i.imgur.com/kXLFm6Z.png "Home screen")

![Sample burndown chart](http://i.imgur.com/r0NPHaC.png "Sample burndown chart")

![Edit sprint](http://i.imgur.com/7Yi9jHG.png "Edit sprint")

### Customization

The generated output can be customized by overriding the `default.template` or (even better) by creating and configuring a new template. Use [mustache 5](http://mustache.github.com/mustache.5.html "mustache 5") syntax for your templates.

This is what you will have available in your templates:

	{
		title: 'Trello burndown chart generator',
		header: 'Burndown for sprint ',
		sprint: '47',
		burndown: {
			data1: [
				{ x: 0, y: 20 }
			],
			data2: [
				{ x: 0, y: 20 }
			]
		},
		effortDaily: {
			data1: [
				{ x: 0, y: 20 }
			],
			data2: [
				{ x: 0, y: 20 }
			]
		},
		effortTotal: {
			data1: [
				{ x: 0, y: 20 }
			],
			data2: [
				{ x: 0, y: 20 }
			]
		},
		generationTime: Change date of sprint data file
	}

## Installation

You can install this via `npm`:

	npm install trello-burndown

It's recommended to create a daily job that generates the necessary data to be served by the web server.

## Installation on OpenShift

1. Clone this repo:

        git clone git@github.com:kikofernandez/trello-burndown.git

2. Create a NodeJS app in OpenShift

3. Copy the address where you need to push changes

4. Go into the cloned repo in step 1 and type:

        git remote add openshift <address-from-step-3>

5. Obtain and update the `settings.js` following the guidelines from the section
below, **Obtain a Trello token**

6. Once you have filled out these details, type:

        git push --force openshift master

### Obtain a Trello token

First, log in to Trello and open [Generate API Keys](https://trello.com/1/appKey/generate "Generate API Keys"). You will receive an key to use in the next step.

Second, call https://trello.com/1/authorize?key=YOUR_KEY&name=trello-burndown&expiration=never&response_type=token to grant access for this application. Be sure to replace `YOUR_KEY` with the key received in the first step.

> For further information visit: [Getting a Token from a User](https://trello.com/docs/gettingstarted/index.html#getting-a-token-from-a-user "Getting a Token from a User")

Store the key from the first action in setting `applicationKey` of `settings.json` and the token received from the second step in `userToken`. To connect to the board of your choice, copy the board id from your web browser.

There are some settings you can set up in `settings.json`:

	applicationKey		Insert your obtained application key from Trello to get access to it
	userToken			Define your user token you will receive when obtaining an application ey
	boardId				Define the id of the board you want to search for release notes
	port 				The port the web server is listening, default is 8080
	template			Defines the name of the template to be used (will be searched in `templates` subfolder)
	html_title			Title of the generated page
	html_header			Header of the generated page (H1)

### Get board id

Call

	node info.js

to get a list of all boards by name and their id. This should help you to set the board id where necessary as Trello changed the board id visible within the browser.

## Contributors

* [Juri Strumpflohner](https://github.com/juristr "Juri Strumpflohner")
* [Alessio Basso](https://github.com/alexdown "Alessio Basso")
* [David Banham](https://github.com/davidbanham "David Banham")
* [Bart Kiers](https://github.com/bkiers "Bart Kiers")
* [Jeff Nuss](https://github.com/jeffnuss "Jeff Nuss")
* [Kiko Fernandez](https://github.com/kikofernandez "Kiko Fernandez")

## Planned features

* Add some KPI's
* Upload sprint tasks
* Create Trello sprint board and predefined lists
