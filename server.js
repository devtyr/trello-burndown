/*
 * Trello burndown chart generator
 *
 * Author: Norbert Eder <wpfnerd+nodejs@gmail.com>
*/

var options = require('optimist')
			  .usage('Generate burndown charts from Trello cards.\n\nUsage: $0')
			  .alias('l', 'lists')
			  .describe('l', 'Included lists separated by comma');
var optionArgs = options.argv;

var CardReceiver = require('./lib/cardreceiver');
var CardStatistics = require('./lib/cardstatistics');

global.settings = require('./settings');

var lists = optionArgs.l;

if (lists && !lists.length) {
	start();
} else {
	console.log('No lists given');
	options.showHelp();
}

function start() {
	var receiver = new CardReceiver(settings.applicationKey, settings.userToken, settings.boardId);
	receiver.receive(lists.split(','), function(err, cards) {
		if (err) {
			console.log(err instanceof Error ? err.message : err);
			return;
		}

		if (cards.length > 0) {
			var statistics = new CardStatistics();
			statistics.generate(cards, function(err, data) {
				console.log("Estimate: " + data.estimate);
				console.log("Effort:   " + data.effort);
			});
		} else {
			console.log("No cards found.");
		}
	});
}