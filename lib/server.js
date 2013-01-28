/*
 * Trello burndown chart generator
 *
 * Author: Norbert Eder <wpfnerd+nodejs@gmail.com>
 */

var connect = require('connect');
var url = require('url');
var qs = require('qs');
var path = require('path');
var fs = require('fs');
var main = connect();
var utils = require('./utils');
var mu = require('mu2');
var Helper = require('./helper');

main.use('/node_modules/xcharts/build/xcharts.min.js', utils.serveFile(path.join(settings.root, '/node_modules/xcharts/build/xcharts.min.js'), {'Cache-Control':  'public, max-age=' + (84600 * 365), 'Content-Length' : '0', 'Content-Type' : ''}));
main.use('/node_modules/d3/d3.min.js', utils.serveFile(path.join(settings.root, '/node_modules/d3/d3.min.js'), {'Cache-Control':  'public, max-age=' + (84600 * 365), 'Content-Length' : '0', 'Content-Type' : ''}));
main.use('/node_modules/xcharts/build/xcharts.min.css', utils.serveFile(path.join(settings.root, '/node_modules/xcharts/build/xcharts.min.css'), {'Cache-Control':  'public, max-age=' + (84600 * 365), 'Content-Length' : '0', 'Content-Type' : ''}));
main.use('/static', connect.static(path.join(settings.root, 'static'), {maxAge: 86400000 * 365 }));

main.use('/', function(req, res, next) {

	req.origUrl = req.url
  	var parsed  = url.parse( req.url );

	if(req.method === 'GET' && (/.+\/+$/).test(parsed.pathname)) {
	  parsed.pathname = parsed.pathname.replace(/\/+$/,'');
	  console.log(parsed.pathname);
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
				res.writeHead(404);
				return res.end();	
			}
			res.writeHead(302, { 'Location': '/?sprint=' + req.query.sprint });
			res.end();
		});
	}
});

main.use('/all', function(req, res, next) {
  var templateData = generateSprintInformation();
  generateSprintList(templateData, function(err, data) {
  	if (err) {
  		console.log(err);
  		res.writeHead(500);
  		res.end();
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
	  		res.end();
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

main.use('/manage/add', function(req, res, next) {
	if (req.method === "POST") {
		var body = '';
        req.on('data', function (data) {
            body += data;
        });
        req.on('end', function () {

        	var POST = JSON.parse(body);
            var config = {
            	lists: '',
            	days: [],
            	resources: [],
            	finishedList: POST.finishedList,
            	standupTime: POST.standupMeeting,
            	name: POST.name
            };

            for (var i = 0; i < POST.dates.length; i++) {
            	config.days[i] = POST.dates[i].day;
            	config.resources[i] = POST.dates[i].isWorkDay ? '1' : '0';
            }

            for (var i = 0; i < POST.lists.length; i++) {
            	config.lists += POST.lists[i].name;
            	if (i < (POST.lists.length - 1))
            		config.lists += ',';
            }

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

main.use('/', function(req, res, next) {
	if (req.query && req.query.sprint) {
		var sprint = req.query.sprint;

		// read data
		var sprintDataPath = path.join(settings.exportPath, sprint + '.json');
		if (!fs.existsSync(sprintDataPath)) {
			res.writeHead(404);
			return res.end();
		}

		var sprintData = JSON.parse(fs.readFileSync(sprintDataPath, 'utf-8'));
			
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

		generateHome(dataForTemplate, function(err, data) {
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

function generateHome(dataForTemplate, callback) {
	var templatedData = '';
	var stream = mu.compileAndRender(settings.homeTemplatePath, dataForTemplate)
		.on('data', function(data) { templatedData += data.toString(); })
		.on('error', function(error) { callback(error); })
		.on('end', function() { callback(null, templatedData); })
}

function generateSprintList(dataForTemplate, callback) {
	var templatedData = '';
	var stream = mu.compileAndRender(settings.templatePath + path.sep + 'allsprints.template', dataForTemplate)
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
	for (var i = 0; i < files.length; i++) {
		var sprint = files[i].replace('.json','');
		var isActive = helper.isSprintActive(sprint);
		console.log(sprint + ": " + isActive);
		sprintNames[i] = { name: sprint, isActive: helper.isSprintActive(sprint) };
	}
	return sprintNames;
}

function readSprintConfigs() {
	var helper = new Helper();
	var files = fs.readdirSync(settings.configPath);
	var sprintNames = [];
	var index = 0;
	for (var i = 0; i < files.length; i++) {
		var sprintConfig = files[i].replace('.json',''); 
		if (helper.isSprintActive(sprintConfig)) {
			sprintNames[index] = sprintConfig;
			index++;
		}
	}
	return sprintNames;	
}

function generateOutput(sprint, sprintData, sprintDataPath, callback) {
	var dataForTemplate = {
		title: settings.html_title,
		header: settings.html_header,
		sprint: sprint,
		burndown: generateBurndown(sprintData),
		effortDaily: generateEffortDaily(sprintData),
		effortTotal: generateEffortTotal(sprintData),
		generationTime: getGenerationTime(sprintDataPath)
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
    		y: parseFloat(lineData.openEstimate)
    	};
    	var newData2 = {
    		x: parseInt(lineData.day),
    		y: parseFloat(lineData.idealEstimate)
    	}
    	data.data1[line] = newData1;
    	data.data2[line] = newData2;
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