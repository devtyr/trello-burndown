var fs = require('fs');
var path = require('path');
var CardReceiver = require('./cardreceiver');
var CardStatistics = require('./cardstatistics');
var Helper = require('./helper');

var Helper = function() { }

Helper.prototype.saveConfiguration = function(lists, days, resources, finishedList, standupTime, name) {
	var configuration = {
		lists: lists,
		days: days,
		resources: resources,
		finishedList: finishedList,
		standupTime: standupTime,
		name: name
	};

	var helper = new Helper();
	helper.saveJSON(settings.configPath, configuration, name, function(error) {
		if (error) {
			console.log(error);
		}
		else {
			console.log("Exported configuration successfully");
		}
	});
}

Helper.prototype.saveJSON = function(dir, data, name, callback) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
	var dir = path.join(dir, name + '.json');

	var jsonData = JSON.stringify(data, null, 4);
	fs.writeFile(dir, jsonData, function(err) {
		callback(err);
	})
}

Helper.prototype.generateAndExportFromConfig = function(name, callback) {
	var configPath = path.join(settings.configPath, name + '.json');
	if (fs.existsSync(configPath)) {
		var configuration = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
		var helper = new Helper();
		if (!helper.isSprintActive(name)) {
			callback();
			return;
		}
		helper.generateAndExport(configuration.lists, configuration.days, configuration.resources, configuration.finishedList, configuration.standupTime, configuration.name, callback);
	} else {
		callback("No configuration found");
	}
}

Helper.prototype.isSprintActive = function(sprintConfiguration) {
	var configPath = path.join(settings.configPath, sprintConfiguration + '.json');
	if (fs.existsSync(configPath)) {
		var configuration = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
		if (configuration.days.length) {
			var lastDate = new Date(Date.parse(configuration.days[configuration.days.length - 1]));
			return lastDate >= new Date();
		}
	}
	return false;
}

Helper.prototype.generateAndExport = function(lists, days, resources, finishedList, standuptime, name, callback) {
	var receiver = new CardReceiver(settings.applicationKey, settings.userToken, settings.boardId);
	receiver.receive(lists.split(','), function(err, cards) {
		if (err) {
			console.log(err instanceof Error ? "Error: " + err.message : err);
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

				statistics.export(data, resources, days, name, function(error) {
					if (error) {
						if (callback) {
							callback(error);
							return;
						} else {
							console.log("Error: " + error);
						}
						return;
					}

					if (callback) {
						console.log("Exported successfully");
						callback();
					} else {
						console.log("Exported successfully");
					}
				})				

			});
		} else {
			if (callback) {
				callback();
			} else {
				console.log("No cards found.");
			}
		}
	});
}

function printStatistics(data) {
	console.log("");
	console.log("Statistics");
	console.log("----------");
	console.log("Cards (total):    " + data.cardsopen);
	console.log("Cards (open):     " + (data.cardsopen - data.cardsfinished));
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

module.exports = Helper;