/*
 * Trello burndown chart generator
 *
 * Author: Norbert Eder <wpfnerd+nodejs@gmail.com>
 */

var CardStatistics = function() { }

CardStatistics.prototype.generate = function(cards, callback) {

	var data = {
		"estimate": 0,
		"effort": 0
	};

	var reg = /^\[(\d+)\|(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)\]\s*(.*)$/;

	for (var i = 0; i < cards.length; i++) {
		var card = cards[i];
		var title = card.name;

		var matches = reg.exec(title);
		if (matches.length > 1) {
			var prio = matches[1];		
			var estimate = matches[2];
			var effort = matches[3];

			data.estimate += estimate;
			data.effort += effort;
		}
	}
	callback(null, data);
}

module.exports = CardStatistics;