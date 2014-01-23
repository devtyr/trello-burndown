var fs = require('fs');
var path = require('path');
var CardReceiver = require('./cardreceiver');
var CardStatistics = require('./cardstatistics');
var Helper = require('./helper');

var Helper = function() { }

Helper.prototype.saveConfiguration = function(lists, days, resources, finishedList, standupTime, boardId, name) {
	var configuration = {
		lists: lists,
		days: days,
		resources: resources,
		finishedList: finishedList,
		standupTime: standupTime,
		boardId: boardId,
		name: name
	};

	saveJSON(settings.configPath, configuration, name, function(error) {
		if (error) {
			console.log(error);
		}
		else {
			console.log("Exported configuration successfully");
		}
	});
};

Helper.prototype.getConfiguration = function(name, callback) {
	var configPath = path.join(settings.configPath, name + '.json');
	if (fs.existsSync(configPath)) {
		var contents = fs.readFileSync(configPath);
		var json = JSON.parse(contents);
		callback(null, json);
	} else {
		callback("No configuration found");
	}
};

Helper.prototype.saveJSON = function(dir, data, name, callback) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
	var dir = path.join(dir, name + '.json');

	var jsonData = JSON.stringify(data, null, 4);
	fs.writeFile(dir, jsonData, function(err) {
		callback(err);
	})
};

Helper.prototype.generateAndExportFromConfig = function(name, generateAndExportFromConfig_callback) {
	var configPath = path.join(settings.configPath, name + '.json');
	if (fs.existsSync(configPath)) {
		var configuration = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
		if (!this.isSprintActive(name)) {
			generateAndExportFromConfig_callback();
		} else {
            boardId = configuration.boardId ? configuration.boardId : settings.boardId;
			this.generateAndExport(
                configuration.lists,
                configuration.days,
                configuration.resources,
                configuration.finishedList,
                configuration.standupTime,
                boardId,
                configuration.name,
                generateAndExportFromConfig_callback
            );
		}
	} else {
		generateAndExportFromConfig_callback("No configuration found");
	}
};

Helper.prototype.isSprintActive = function(sprintConfiguration) {
	var configPath = path.join(settings.configPath, sprintConfiguration + '.json');
	if (fs.existsSync(configPath)) {
		var configuration = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
		if (configuration.days.length) {
			var parsedDate = new Date(Date.parse(configuration.days[configuration.days.length - 1]));
			var lastDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
			var today = new Date();
			return new Date(today.getFullYear(), today.getMonth(), today.getDate()) <= lastDate;
		}
	}
	return false;
};

Helper.prototype.generateAndExport = function(lists, days, resources, finishedLists, standuptime, boardId, name, callback) {
	var receiver = new CardReceiver(settings.applicationKey, settings.userToken, boardId);
	var splittedLists = lists.split(',');
	splittedLists.concat(finishedLists);
	receiver.receive(splittedLists, function(err, cards) {
		if (err) {
			console.log(err instanceof Error ? "Error: " + err.message : err);
			if (callback)
				callback(err instanceof Error ? "Error: " + err.message : err);
		} else if (cards.length > 0) {
			var statistics = new CardStatistics();
			statistics.generate(cards, finishedLists, standuptime, function(err, data) {
				if (err) {
					console.log(err);
				} else {
					printStatistics(data);

					statistics.export(data, resources, days, name, function(error) {
						if (error) {
							if (callback) {
								callback(error);
							} else {
								console.log("Error: " + error);
							}
						} else 	if (callback) {
							console.log("Exported successfully");
							callback();
						} else {
							console.log("Exported successfully");
						}
					});
				}				
			});
			statistics = null;
		} else {
			if (callback) {
				callback();
			} else {
				console.log("No cards found.");
			}
		}
	});
	receiver = null;
};

function printStatistics(data) {
	console.log("");
	console.log("Statistics");
	console.log("----------");
	console.log("Cards (total):    " + (data.cardsopen+data.cardsfinished));
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

module.exports = Helper;
