/*
 * Trello burndown chart generator
 *
 * Author: Norbert Eder <wpfnerd+nodejs@gmail.com>
 */

var connect = require('connect');

var url = require('url');
var serveStatic = require('serve-static');
var qs = require('qs');
var path = require('path');
var fs = require('fs');
var main = connect();
var utils = require('./utils');
var mu = require('mu2');
var Helper = require('./helper');

mu.root = settings.templatePath;

main.use('/node_modules/xcharts/build/xcharts.min.js', utils.serveFile(path.join(settings.root, '/node_modules/xcharts/build/xcharts.min.js'), {'Cache-Control':  'public, max-age=' + (84600 * 365), 'Content-Length' : '0', 'Content-Type' : ''}));
main.use('/node_modules/xcharts/build/xcharts.min.css', utils.serveFile(path.join(settings.root, '/node_modules/xcharts/build/xcharts.min.css'), {'Cache-Control':  'public, max-age=' + (84600 * 365), 'Content-Length' : '0', 'Content-Type' : ''}));
main.use('/static', serveStatic(path.join(settings.root, 'static'), {maxAge: 86400000 * 365 }));

main.use('/', function(req, res, next) {

	req.origUrl = req.url
  	var parsed  = url.parse( req.url );

	if(req.method === 'GET' && (/.+\/+$/).test(parsed.pathname)) {
	  parsed.pathname = parsed.pathname.replace(/\/+$/,'');
	  res.writeHead(301, { 
	    'Location': url.format( parsed ) 
	  });
	  return res.end();
	}

	req.query = qs.parse(parsed.query);

	return next();
});

main.use('/refresh', function(req, res, next) {
	if (req.query.sprint) {
		var helper = new Helper();
		helper.generateAndExportFromConfig(req.query.sprint, function(error) {
			if (error) {
				console.log("Error: " + error);
				res.writeHead(404);
				return res.end();	
			}
			res.writeHead(302, { 'Location': '/?sprint=' + req.query.sprint });
			return res.end();
		});
	} else {
		res.writeHead(404);
		return res.end();
	}
});

main.use('/all', function(req, res, next) {
  var templateData = generateSprintInformation();
  generateTemplate(templateData, settings.templatePath + path.sep + 'allsprints.template', function(err, data) {
  	if (err) {
  		res.writeHead(500);
  		return res.end();
  	}
  	var headers = {
		'Content-Type':   'text/html; charset=UTF-8',
        'Content-Length':  Buffer.byteLength(data)
	};

	res.writeHead(200, headers);
	return res.end(data);
  })
});

main.use('/manage/add', function(req, res, next) {
	if (req.method === "GET") {
		var templateData = generateSprintInformation();
		generateTemplate(templateData, settings.templatePath + path.sep + 'addsprint.template', function(err, data) {
			if (err) {
		  		console.log(err);
		  		res.writeHead(500);
		  		return res.end();
		  	}
		  	var headers = {
				'Content-Type':   'text/html; charset=UTF-8',
		        'Content-Length':  Buffer.byteLength(data)
			};

			res.writeHead(200, headers);
			return res.end(data);
		});
	}
	next();
});

main.use('/manage/edit', function(req, res, next) {
	if (req.method === "GET" && !req.query.sprint) {
		var templateData = generateSprintInformation();
	    generateTemplate(templateData, settings.templatePath + path.sep + 'editallsprints.template', function(err, data) {
		  	if (err) {
		  		res.writeHead(500);
		  		return res.end();
		  	}
		  	var headers = {
				'Content-Type':   'text/html; charset=UTF-8',
		        'Content-Length':  Buffer.byteLength(data)
			};

			res.writeHead(200, headers);
			return res.end(data);
		});
	}

	next();
});

main.use('/manage/edit', function(req, res, next) {
	if (req.method === "GET" && req.query.sprint) {
		var templateData = generateSprintInformation();
		generateTemplate(templateData, settings.templatePath + path.sep + 'editsprint.template', function(err, data) {
			if (err) {
				res.writeHead(500);
				return res.end();
			}

			var headers = {
				'Content-Type':   'text/html; charset=UTF-8',
		        'Content-Length':  Buffer.byteLength(data)
			};

			res.writeHead(200, headers);
			return res.end(data);			
		})
	}

	next();
});

main.use('/api/sprint', function(req, res, next) {
	if (req.method === "GET" && req.query.sprint) {
		var helper = new Helper();
		helper.getConfiguration(req.query.sprint, function(err, data) {
			if (err) {
				res.writeHead(500);
				return res.end();
			}

			var result = {
				finishedList: data.finishedList,
				standupMeeting: data.standupTime,
				boardId: data.boardId,
				name: data.name,
				dates: [],
				lists: []
			};

			var listsSplitted = data.lists.split(',');
			for (var i = 0; i < listsSplitted.length; i++) {
				result.lists.push({ name: listsSplitted[i] });
			}

			for (var i = 0; i < data.days.length; i++) {
				result.dates.push({ day: data.days[i], isWorkDay: data.resources[i] === '1' ? true : false, include: true });
			}

			res.writeHead(200);
			return res.end(JSON.stringify(result, null, 4));
		});
	} else {
		res.writeHead(404);
		return res.end();
	}
})

main.use('/manage/edit', function(req, res, next) {
	if (req.method == "PUT") {
		var body = '';
		req.on('data', function(data) {
			body += data;
		});
		req.on('end', function() {
			var POST = JSON.parse(body);
			var config = getConfigFromJson(POST);

			var fileName = settings.configPath + path.sep + config.name;
            
        	var helper = new Helper();
        	helper.saveJSON(settings.configPath, config, config.name, function(err) {
        		if (err) {
        			console.log(err);
        			res.writeHead(500, "Internal Server Error");
        			return res.end();
        		}
        	})

        	res.writeHead(200);
        	return res.end();
		})
	}
});

main.use('/manage/add', function(req, res, next) {
	if (req.method === "POST") {
		var body = '';
        req.on('data', function (data) {
            body += data;
        });
        req.on('end', function () {

        	var POST = JSON.parse(body);
            var config = getConfigFromJson(POST);

            var fileName = settings.configPath + path.sep + config.name;
            if (!fs.existsSync(fileName)) {
            	var helper = new Helper();
            	helper.saveJSON(settings.configPath, config, config.name, function(err) {
            		if (err) {
            			console.log(err);
            			res.writeHead(500, "Internal Server Error");
            			return res.end();
            		}
            	})
            } else {
            	res.writeHead(500, "Already existing");
            	return res.end();
            }
        });
		res.writeHead(200, "Done");
		return res.end();
	}
});

function getConfigFromJson(POST) {
	var config = {
    	lists: '',
    	days: [],
    	resources: [],
    	finishedList: POST.finishedList,
    	standupTime: POST.standupMeeting,
    	boardId: POST.boardId,
    	name: POST.name
    };

    var dayIndex = 0;
    for (var i = 0; i < POST.dates.length; i++) {
    	if (POST.dates[i].include) {
        	config.days[dayIndex] = POST.dates[i].day;
        	config.resources[dayIndex] = POST.dates[i].isWorkDay ? '1' : '0';
        	dayIndex++;
    	}
    }

    for (var i = 0; i < POST.lists.length; i++) {
    	config.lists += POST.lists[i].name;
    	if (i < (POST.lists.length - 1))
    		config.lists += ',';
    }

    return config;
}

main.use('/', function(req, res, next) {
	if (req.query && req.query.sprint) {
		var sprint = req.query.sprint;

		// read data
		var sprintDataPath = path.join(settings.exportPath, sprint + '.json');
		var sprintDataExPath = path.join(settings.exportPath, sprint + 'Ext.json');
		if (!fs.existsSync(sprintDataPath)) {
			res.writeHead(404);
			return res.end();
		}

		var sprintData = {};
		sprintData.basic = JSON.parse(fs.readFileSync(sprintDataPath, 'utf-8'));

		if(fs.existsSync(sprintDataExPath)) {
			sprintData.extended = JSON.parse(fs.readFileSync(sprintDataExPath, 'utf-8'));
		} else {
			sprintData.extended = {};
		}
			
		generateOutput(sprint, sprintData, sprintDataPath, function(err, data) {
			if (err) {
				console.log(err);
				return;
			}

			var headers = {
				'Content-Type':   'text/html; charset=UTF-8',
		        'Content-Length':  Buffer.byteLength(data)
			};

			res.writeHead(200, headers);
			return res.end(data);
		});	
	}
	next();
});

main.use('/', function(req, res, next) {
	if (!req.query.sprint) {
		var dataForTemplate = generateSprintInformation();

		generateTemplate(dataForTemplate, settings.homeTemplatePath, function(err, data) {
			if (err) {
				console.log(err);
				return;
			}

			var headers = {
				'Content-Type':   'text/html; charset=UTF-8',
		        'Content-Length':  Buffer.byteLength(data)
			};

			res.writeHead(200, headers);
			return res.end(data);

			next();	
		});
	}
});

function generateTemplate(dataForTemplate, templatePath, callback) {
	var templatedData = '';
	var stream = mu.compileAndRender(templatePath, dataForTemplate)
		.on('data', function(data) { templatedData += data.toString(); })
		.on('error', function(error) { callback(error); })
		.on('end', function() { callback(null, templatedData); })
}

function generateSprintInformation() {
	var sprintInformation = {};
	var sprintNames = readSprintFiles();
	sprintInformation.sprints = [];
	var sprintsIndex = 0;
	sprintInformation.all_sprints = [];
	for (var i = 0; i < sprintNames.length; i++) {
		if (sprintNames[i].isActive) {
			sprintInformation.sprints[sprintsIndex] = { name: sprintNames[i].name };
			sprintsIndex++;
		}
		sprintInformation.all_sprints[i] = { name: sprintNames[i].name };
	}
	var sprintConfigs = readSprintConfigs();
	sprintInformation.sprintConfigs = [];
	for (var i = 0; i < sprintConfigs.length; i++) {
		sprintInformation.sprintConfigs[i] = { name: sprintConfigs[i] };
	}

	sprintInformation.title = settings.html_title;
	sprintInformation.has_sprints = sprintNames.length > 0;
	return sprintInformation;
}

function readSprintFiles() {
	var helper = new Helper();
	var files = fs.readdirSync(settings.exportPath);
	var sprintNames = [];
	var idx = 0;
	for (var i = 0; i < files.length; i++) {
		if (files[i].indexOf("Ext") < 1) {
			var sprint = files[i].replace('.json','');
			var isActive = helper.isSprintActive(sprint);
			sprintNames[idx] = { name: sprint, isActive: helper.isSprintActive(sprint) };
			idx += 1;
		}
	}
	return sprintNames;
}

function readSprintConfigs() {
	var helper = new Helper();
	var files = fs.readdirSync(settings.configPath);
	var sprintNames = [];
	var index = 0;
	for (var i = 0; i < files.length; i++) {
		if (files[i].indexOf("Ext") < 1) {
			var sprintConfig = files[i].replace('.json',''); 
			if (helper.isSprintActive(sprintConfig)) {
				sprintNames[index] = sprintConfig;
				index++;
			}
		}
	}
	return sprintNames;	
}

function generateOutput(sprint, sprintData, sprintDataPath, callback) {
	var dataForTemplate = {
		title: settings.html_title,
		header: settings.html_header,
		sprint: sprint,
		burndown: generateBurndown(sprintData.basic),
		effortDaily: generateEffortDaily(sprintData.basic),
		effortTotal: generateEffortTotal(sprintData.basic),
		generationTime: getGenerationTime(sprintDataPath),
		unfinishedItems: sprintData.extended.unfinishedItems,
		statisticsSummary: sprintData.extended.statisticsSummary
	};

	var sprintInformation = generateSprintInformation();
	dataForTemplate.sprints = sprintInformation.sprints;
	dataForTemplate.sprintConfigs = sprintInformation.sprintConfigs;
	dataForTemplate.has_sprints = sprintInformation.has_sprints;

	var templatedData = '';
	var stream = mu.compileAndRender(settings.sprintTemplatePath, dataForTemplate)
		.on('data', function(data) { templatedData += data.toString(); })
		.on('error', function(error) { callback(error); })
		.on('end', function() {
			callback(null, templatedData);
		});
}

function getGenerationTime(sprintDataPath) {
	var stats = fs.statSync(sprintDataPath);
	if (stats) {
		return stats.mtime;
	}
	return '[unknown]';
}

function generateBurndown(sprintData) {
	var data = 
	{
		data1: [],
		data2: []
	};
    for (var line = 0; line < sprintData.length; line++)
    {	
    	var lineData = sprintData[line];
    	var newData1 = {
    		x: parseInt(lineData.day),
    		y: parseFloat(lineData.idealEstimate)
    	};
    	var newData2 = {
    		x: parseInt(lineData.day),
    		y: parseFloat(lineData.openEstimate)
    	}
    	data.data1[line] = newData1;
        var today = new Date();
        if(new Date(lineData.date) <= today) {
    	    data.data2[line] = newData2;
        }
    }
    return data;
}

function generateEffortDaily(sprintData) {
	var data = {
		data1: [],
		data2: []
	};
    for (var line = 0; line < sprintData.length; line++)
    {
    	var lineData = sprintData[line];
    	var newData1 = {
    		x: parseInt(lineData.day),
    		y: parseFloat(lineData.doneEstimate)
    	};
    	var newData2 = {
			x: parseInt(lineData.day),
			y: parseFloat(lineData.effort)
		};
    	data.data1[line] = newData1;
    	data.data2[line] = newData2;
    }
    return data;
}

function generateEffortTotal(sprintData) {
	var data = {
		data1: [],
		data2: []
	};
	for (var line = 0; line < sprintData.length; line++) {
		var lineData = sprintData[line];
		var newData1 = {
			x: parseInt(lineData.day),
			y: parseFloat((lineData.totalEstimate - lineData.openEstimate))
		};
		var newData2 = {
			x: parseInt(lineData.day),
			y: parseFloat(lineData.totalEffort)
		};
		data.data1[line] = newData1;
		data.data2[line] = newData2;
	}
	return data;
}

module.exports = main;
