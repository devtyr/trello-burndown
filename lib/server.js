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

main.use('/node_modules/xcharts/build/xcharts.min.js', utils.serveFile(path.join(settings.root, '/node_modules/xcharts/build/xcharts.min.js'), {'Cache-Control':  'public, max-age=' + (84600 * 365), 'Content-Length' : '0', 'Content-Type' : ''}));
main.use('/node_modules/d3/d3.min.js', utils.serveFile(path.join(settings.root, '/node_modules/d3/d3.min.js'), {'Cache-Control':  'public, max-age=' + (84600 * 365), 'Content-Length' : '0', 'Content-Type' : ''}));
main.use('/node_modules/xcharts/build/xcharts.min.css', utils.serveFile(path.join(settings.root, '/node_modules/xcharts/build/xcharts.min.css'), {'Cache-Control':  'public, max-age=' + (84600 * 365), 'Content-Length' : '0', 'Content-Type' : ''}));

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

	if (!req.query || !req.query.sprint) {
		res.writeHead(404, "Not found");
		res.end();
		return;
	}

	var sprint = req.query.sprint;

	// read data
	var sprintDataPath = path.join(settings.exportPath, sprint + '.json');
	var sprintData = JSON.parse(fs.readFileSync(sprintDataPath, 'utf-8'));

	var dataScript = generateDataScript(sprintData);
	var effortScript = generateEffortScript(sprintData);
	var totalEffortScript = generateTotalEffortScript(sprintData);

	var html = getTemplate().replace('{{title}}','trello burndown chart generator').replace('{{header}}', '<h1>Burndown for sprint "' + sprint + '"</h1>').replace('{{script}}', dataScript).replace('{{effortScript}}', effortScript).replace('{{totalEffortScript}}', totalEffortScript);

	var headers = {
		'Content-Type':   'text/html; charset=UTF-8',
        'Content-Length':  Buffer.byteLength(html)
	};

	res.writeHead(200, headers);
	return res.end(html);

	next();
});

function getTemplate() {
	return  '<html>' +
			'<head>' +
			'<meta charset="utf-8">' +
			'<title>{{title}}</title>' +
			'<link rel="stylesheet" href="../node_modules/xcharts/build/xcharts.min.css">' +
			'<script src="../node_modules/d3/d3.min.js"></script>' +
			'<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>' +
			'<script src="../node_modules/xcharts/build/xcharts.min.js"></script>' +
			'</head>' +
			'<body>' +
			'{{header}}' +
			'<h2>Burndown chart</h2>' +
			'<figure style="width: 900px; height: 250px;" id="burndownChart"></figure>' +
			'<p>' +
			'<span>dotted: ideal estimate</span></br>' +
			'<span>line: done estimate</span>' +
			'</p>' +
			'<h2>Done estimate vs. effort (daily)</h2>' +
			'<figure style="width: 900px; height: 250px;" id="effortChart"></figure>' +
			'<p>' +
			'<span>dotted: done effort</span><br/>' +
			'<span>line: done estimate</span>' +
			'</p>' +
			'<h2>Done estimate vs. effort (total)</h2>' +
			'<figure style="width: 900px; height: 250px;" id="totalEffortChart"></figure>' +
			'<p>' +
			'<span>dotted: done effort (total)</span><br/>' +
			'<span>line: done estimate </span>' +
			'</p>' +
			'{{script}}' +
			'{{effortScript}}' +
			'{{totalEffortScript}}' +
			'</body>' +
		    '</html>';
}

function generateDataScript(sprintData) {
	var retVal = '<script>' +
	      'var data = {' +
		  '"xScale": "ordinal",'+
		  '"yScale": "linear",'+
		  '"type": "line",'+
		  '"main": ['+
		  '  {'+
		  '    "className": ".main.l1",'+
		  '    "data": [';

    var template = '{ "x": "{{x}}", "y": {{y}} }';
    for (var line = 0; line < sprintData.length; line++)
    {
    	var lineData = sprintData[line];
    	retVal += template.replace("{{x}}", lineData.day).replace("{{y}}", parseFloat(lineData.openEstimate));
    	if (line + 1 < sprintData.length)
    		retVal += ",";
    }

    retVal += '    ]'+
		  '  }';
    retVal += '],';

	retVal += '"comp": ['+
			  ' {'+
	          ' "className": ".main.l2",'+
	          ' "type": "line-dotted",'+
	          ' "data": [';

	for (var line = 0; line < sprintData.length; line++) {
		var lineData = sprintData[line];
		retVal += template.replace("{{x}}", parseInt(lineData.day)).replace("{{y}}", parseFloat(lineData.idealEstimate));
    	if (line + 1 < sprintData.length)
    		retVal += ",";	
	}

	retVal += '    ]'+
		  '  },' +
		  ']';

	retVal += '};'+
      'var myChart = new xChart("bar", data, "#burndownChart");'+
      '</script>';

    return retVal;
}

function generateEffortScript(sprintData) {
	var retVal = '<script>' +
	      'var data = {' +
		  '"xScale": "ordinal",'+
		  '"yScale": "linear",'+
		  '"type": "line",'+
		  '"main": ['+
		  '  {'+
		  '    "className": ".pizza",'+
		  '    "data": [';

    var template = '{ "x": "{{x}}", "y": {{y}} }';
    for (var line = 0; line < sprintData.length; line++)
    {
    	var lineData = sprintData[line];
    	retVal += template.replace("{{x}}", lineData.day).replace("{{y}}", parseFloat(lineData.doneEstimate));
    	if (line + 1 < sprintData.length)
    		retVal += ",";
    }

    retVal += '    ]'+
		  '  }';
    retVal += '],';

	retVal += '"comp": ['+
			  ' {'+
	          ' "className": ".pizza",'+
	          ' "type": "line-dotted",'+
	          ' "data": [';

	for (var line = 0; line < sprintData.length; line++) {
		var lineData = sprintData[line];
		retVal += template.replace("{{x}}", parseInt(lineData.day)).replace("{{y}}", parseFloat(lineData.effort));
    	if (line + 1 < sprintData.length)
    		retVal += ",";	
	}

	retVal += '    ]'+
		  '  },' +
		  ']';

	retVal += '};'+
      'var myChart = new xChart("bar", data, "#effortChart");'+
      '</script>';

    return retVal;
}

function generateTotalEffortScript(sprintData) {
	var retVal = '<script>' +
	      'var data = {' +
		  '"xScale": "ordinal",'+
		  '"yScale": "linear",'+
		  '"type": "line",'+
		  '"main": ['+
		  '  {'+
		  '    "className": ".pizza",'+
		  '    "data": [';

    var template = '{ "x": "{{x}}", "y": {{y}} }';
    for (var line = 0; line < sprintData.length; line++)
    {
    	var lineData = sprintData[line];
    	retVal += template.replace("{{x}}", lineData.day).replace("{{y}}", parseFloat((lineData.totalEstimate - lineData.openEstimate)));
    	if (line + 1 < sprintData.length)
    		retVal += ",";
    }

    retVal += '    ]'+
		  '  }';
    retVal += '],';

	retVal += '"comp": ['+
			  ' {'+
	          ' "className": ".pizza",'+
	          ' "type": "line-dotted",'+
	          ' "data": [';

	for (var line = 0; line < sprintData.length; line++) {
		var lineData = sprintData[line];
		retVal += template.replace("{{x}}", parseInt(lineData.day)).replace("{{y}}", parseFloat(lineData.totalEffort));
    	if (line + 1 < sprintData.length)
    		retVal += ",";	
	}

	retVal += '    ]'+
		  '  },' +
		  ']';

	retVal += '};'+
      'var myChart = new xChart("bar", data, "#totalEffortChart");'+
      '</script>';

    return retVal;
}

module.exports = main;