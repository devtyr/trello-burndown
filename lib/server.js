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

main.use('/', function(req, res, next) {

	//if (!req.query || !req.query.sprint) {
	//	res.writeHead(404, "Not found");
	//	res.end();
	//	return;
	//}

	if (req.query && req.query.sprint) {
		var sprint = req.query.sprint;

		// read data
		var sprintDataPath = path.join(settings.exportPath, sprint + '.json');
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

		var dataForTemplate = {};

		var sprintNames = readSprintFiles();
		dataForTemplate.sprints = [];
		for (var i = 0; i < sprintNames.length; i++) {
			dataForTemplate.sprints[i] = { name: sprintNames[i] };
		}
		dataForTemplate.title = settings.html_title;

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

function generateHome(dataForTemplate, callback) {
	var templatedData = '';
	var stream = mu.compileAndRender(settings.homeTemplatePath, dataForTemplate)
		.on('data', function(data) { templatedData += data.toString(); })
		.on('error', function(error) { callback(error); })
		.on('end', function() { callback(null, templatedData); })
}

function readSprintFiles() {
	var files = fs.readdirSync(settings.exportPath);
	var sprintNames = [];
	for (var i = 0; i < files.length; i++) {
		sprintNames[i] = files[i].replace('.json','') ;
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