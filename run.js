/*
 * Trello burndown chart generator
 *
 * Author: Norbert Eder <wpfnerd+nodejs@gmail.com>
 */

var fs = require('fs');
var path = require('path');

global.settings = require('./settings');
settings.root   = __dirname.replace(/\/+$/, "");
settings.exportPath = path.join(settings.root, 'export');
settings.configPath = path.join(settings.root, 'config');
settings.templatePath = path.join(settings.root, 'templates');
settings.sprintTemplatePath = path.join(settings.root, 'templates' + path.sep + settings.template);
settings.homeTemplatePath = path.join(settings.root, 'templates' + path.sep + settings.home_template);

// if export path does not exist, create it
if (!fs.existsSync(settings.exportPath)) {
	fs.mkdirSync(settings.exportPath);
}

// if config path does not exist, create it
if (!fs.existsSync(settings.configPath)) {
	fs.mkdirSync(settings.configPath);
}

var server = require('./lib/server');
require('http').createServer(server).listen(settings.port);