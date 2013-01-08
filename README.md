# trello-burndown

Generate a burndown chart from trello cards.

## How it works

If you use [Trello](http://trello.com "Trello") to manage your sprint cards, you might want to generate your burndown chart automatically instead of doing it manually.

### Preconditions

As a precondition you have to encode some information into the card's title. This looks like that:

	[p|est-e] title

**Huh?**

* **p**: the priority/order of the task (to be "visible" if a task is moved to another list)
* **est**: the estimate of the task, defined within the sprint planning
* **e**: the real effort (to reflect this against the estimate)

### Generate it!

To generate it, you have to execute `generate.js` as described below:

	node generate.js -l "lists" -d "included dates" -r "count days" -f "finish list"

* **-l**: A comma separated list of Trello lists (by name) that are set up for the sprint, e.g. _Planned_, _In progress_, _Testing_, _Finished_
* **-d**: A comma separated list of dates in the format YYYY-MM-DD describing the days are part of the sprint
* **-r**: A comma separated list of 0 or 1 (maching the days list) describing if a day is a working day or not (special days are the first - sprint planning - and the last one - deployment/recap)
* **-f**: The name of the list where finished tasks have to be moved to

An example call:

	node generate.js -l "Planned, In progress, Testing, Finished" -d "2013-02-01, 2013-02-02" -r "1,1" -f "Finished"

Based on the given information total estimates, efforts etc. are calculated and exported to `export.csv`. That can be the data base for generating a chart (works fine as an external data source for Microsoft Excel).

## Installation

You can install this via `npm`:

	npm install trello-burndown

### Obtain a Trello token

First, log in to Trello and open [Generate API Keys](https://trello.com/1/appKey/generate "Generate API Keys"). You'll receive an key to use in the next step.

Second, call https://trello.com/1/authorize?key=YOUR_KEY&name=trello-releasenotes&expiration=never&response_type=token to grant access for this application. Be sure to replace `YOUR_KEY` with the key received in the first step.

> For further information visit: [Getting a Token from a User](https://trello.com/docs/gettingstarted/index.html#getting-a-token-from-a-user "Getting a Token from a User")

Store the key from the first action in setting `applicationKey` of `settings.json` and the token received from the second step in `userToken`. To connect to the board of your choice, copy the board id from your web browser.

There are some settings you can set up in `settings.json`:

	applicationKey		Insert your obtained application key from Trello to get access to it
	userToken			Define your user token you'll receive when obtaining an application ey
	boardId				Define the id of the board you want to search for release notes

## Planned features

* Generate charts on the fly and serve it via HTTP server
* Configure via web page