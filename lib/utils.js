var fs = require('fs');
var mime = require('mime');

exports.serveFile = function(filepath, headers){
  
  return function(req, res, next){
    fs.readFile(filepath, function(err, buf){
      if (err) {
        return next(err.code === 'ENOENT' ? 404 : err);
      }
      console.log('request:' + filepath);
      headers['Content-Length'] = buf.length;
      headers['Content-Type'] = mime.lookup(filepath);
      res.writeHead(200, headers);
      res.end(buf);
    });
  }
}