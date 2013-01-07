/*
 * Trello burndown chart generator
 *
 * Author: Norbert Eder <wpfnerd+nodejs@gmail.com>
*/

var options = require('optimist')
			  .usage('Generate burndown charts from Trello cards.\n\nUsage: $0')
			  .alias('l', 'lists')
			  .describe('l', 'Included lists separated by comma')
			  .alias('d', 'days')
			  .describe('d', 'Days in sprint')
			  .alias('r', 'resources')
			  .describe('r', 'Count matching day')
			  .alias('f', 'finishlist')
			  .describe('f', 'Name of the list all finished tasks are moved to');

var optionArgs = options.argv;

var CardReceiver = require('./lib/cardreceiver');
var CardStatistics = require('./lib/cardstatistics');

global.settings = require('./settings');

var lists = optionArgs.l;
var days = optionArgs.d;
var resources = optionArgs.r;
var finishedList = optionArgs.f;

if (!lists && !lists.length) 
{
	console.log('No lists given');
	return;
}

if (!days && !days.length) {
	console.log('No day count for sprint given');
	return;
}

if (!resources && !resources.length) {
	console.log('No day/resource match given');
	return;
}

if (!finishedList) {
	console.log('No finished list defined');
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
			statistics.generate(cards, finishedList, function(err, data) {

				if (err) {
					console.log(err);
					return;
				}

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


