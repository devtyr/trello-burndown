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

	var sprint = req.query.sprint;
	
	if (!sprint) {
		res.writeHead(404, "Not found");
		res.end();
	}

	var html = getTemplate().replace('{{title}}','trello burndown chart generator').replace('{{header}}', '<h1>Burndown for sprint ' + sprint + '</h1>').replace('{{script}}', getScript());

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
			'<figure style="width: 400px; height: 300px;" id="burndownChart"></figure>' +
			'{{script}}' +
			'</body>' +
		    '</html>';
}

function getScript() {
	 return '<script>' +
	      'var data = {' +
		  '"xScale": "ordinal",'+
		  '"yScale": "linear",'+
		  '"type": "line",'+
		  '"main": ['+
		  '  {'+
		  '    "className": ".pizza",'+
		  '    "data": ['+
		  '      {'+
		  '        "x": "Pepperoni",'+
		  '        "y": 4'+
		  '      },'+
		  '      {'+
		  '        "x": "Cheese",'+
		  '        "y": 8'+
		  '      }'+
		  '    ]'+
		  '  }'+
		  ']'+
		'};'+
      'var myChart = new xChart("bar", data, "#burndownChart");'+
      '</script>';
}

module.exports = main;