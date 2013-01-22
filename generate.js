/*
 * Trello burndown chart generator
 *
 * Author: Norbert Eder <wpfnerd+nodejs@gmail.com>
*/

var options = require('optimist')
			  .usage('Generate burndown charts from Trello cards.\n\nUsage: $0 -l [lists] -d [days] -r [resources] -f [finishlist]')
			  .demand(['l','d','r','f','n'])
			  .alias('l', 'lists')
			  .describe('l', 'Included lists separated by comma')
			  .alias('d', 'days')
			  .describe('d', 'Days in sprint')
			  .alias('r', 'resources')
			  .describe('r', 'Count matching day')
			  .alias('f', 'finishlist')
			  .describe('f', 'Name of the list all finished tasks are moved to')
			  .alias('t', 'standuptime')
			  .describe('t', 'Standup meeting time; if not defined, split time is midnight')
			  .alias('n', 'name')
			  .describe('n', 'Name of the sprint')
			  .alias('s', 'save')
			  .describe('s', 'Save configuration')
			  .boolean('s');

var optionArgs = options.argv;
var path = require('path');

global.settings = require('./settings');
settings.root   = __dirname.replace(/\/+$/, "");
settings.exportPath = path.join(settings.root, 'export');
settings.configPath = path.join(settings.root, 'config');

var Helper = require('./lib/helper');

var lists = optionArgs.l;
var days = optionArgs.d;
var resources = optionArgs.r;
var finishedList = optionArgs.f;
var standupTime = optionArgs.t;
var name = optionArgs.n;
var save = optionArgs.s;

if (!lists || !lists.length) 
{
	options.showHelp();
	console.error('No Trello list names given');
	console.info('Example: -l "Planned,In progress,Testing,Finished"');
	return;
}

if (!days || !days.length) {
	options.showHelp();
	console.error('No days for sprint given');
	console.info('Example: -d "2013-12-13,2013-12-14,2013-12-15"');
	return;
}

if (!resources || !resources.length) {
	options.showHelp();
	console.error('No day/resource match given');
	console.info('Example: -r "0,1,0"');
	return;
}

if (!finishedList) {
	options.showHelp();
	console.error('No finished list name defined');
	console.info('Example: -f "Finished"');
	return;
}

days = days.split(',');
resources = resources.split(',');

var helper = new Helper();
if (save) {
	console.log("Generating configuration ...");
	helper.saveConfiguration(lists, days, resources, finishedList, standupTime, name);
} else {
	console.log("Starting export ...");
	helper.generateAndExport(lists, days, resources, finishedList, standupTime, name);
}
