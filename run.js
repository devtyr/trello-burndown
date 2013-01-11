/*
 * Trello burndown chart generator
 *
 * Author: Norbert Eder <wpfnerd+nodejs@gmail.com>
 */

var fs = require('fs');
var path = require('path');

global.settings = require('./settings');
settings.root   = __dirname.replace(/\/+$/, "");

var server = require('./lib/server');
require('http').createServer(server).listen(8008);