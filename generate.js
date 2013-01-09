/*
 * Trello burndown chart generator
 *
 * Author: Norbert Eder <wpfnerd+nodejs@gmail.com>
*/

var options = require('optimist')
			  .usage('Generate burndown charts from Trello cards.\n\nUsage: $0 -l [lists] -d [days] -r [resources] -f [finishlist]')
			  .demand(['l','d','r','f'])
			  .alias('l', 'lists')
			  .describe('l', 'Included lists separated by comma')
			  .alias('d', 'days')
			  .describe('d', 'Days in sprint')
			  .alias('r', 'resources')
			  .describe('r', 'Count matching day')
			  .alias('f', 'finishlist')
			  .describe('f', 'Name of the list all finished tasks are moved to')
			  .alias('t', 'standuptime')
			  .describe('t', 'Standup meeting time; if not defined, split time is midnight');

var optionArgs = options.argv;

var CardReceiver = require('./lib/cardreceiver');
var CardStatistics = require('./lib/cardstatistics');

global.settings = require('./settings');

var lists = optionArgs.l;
var days = optionArgs.d;
var resources = optionArgs.r;
var finishedList = optionArgs.f;
var standuptime = optionArgs.t;

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

start();

function start() {
	var receiver = new CardReceiver(settings.applicationKey, settings.userToken, settings.boardId);
	receiver.receive(lists.split(','), function(err, cards) {
		if (err) {
			console.log(err instanceof Error ? err.message : err);
			return;
		}

		if (cards.length > 0) {
			var statistics = new CardStatistics();
			statistics.generate(cards, finishedList, standuptime, function(err, data) {

				if (err) {
					console.log(err);
					return;
				}

				printStatistics(data);

				statistics.export(data, resources, days, function(err) {
					if (err) {
						console.log(err);
						return;
					}

					console.log("Exported successfully");
				})				

			});
		} else {
			console.log("No cards found.");
		}
	});
}

function printStatistics(data) {
	console.log("");
	console.log("Statistics");
	console.log("----------");
	console.log("Cards (total):    " + (data.cardsopen + data.cardsfinished));
	console.log("Cards (open):     " + data.cardsopen);
	console.log("Cards (finished): " + data.cardsfinished);
	console.log("");
	console.log("Estimate (total): " + data.estimate);
	console.log("Estimate (open):  " + (data.estimate - data.estimatedone));
	console.log("Estimate (done):  " + data.estimatedone);
	console.log("Effort (total):   " + data.efforttotal);
	console.log("Diff estimate:    " + (data.estimatedone - data.efforttotal));
	console.log("----------");
	console.log("");
}


