var fs = require('fs')

var renderData = {
  ico: {encoding: "binary", mime: 'image/vnd.microsoft.icon'},
  css: {encoding: "utf8",   mime: 'text/css'}
}

exports.found = function(request, there, notThere) {
  fileExists(publicPathFor(request), function(exists) {
    if (exists) {
      there()
    } else {
      notThere()
    }
  })
}

exports.render = function(request, response) {
  var path = publicPathFor(request)
  var parts = path.split('.')
  var extension = parts[parts.length-1]
  var config = renderData[extension]
  fs.readFile(path, config.encoding, function(error, file) {
    response.writeHead(200, {'Content-Type': config.mime})
    response.end(file, config.encoding)
  })
}

function fileExists(path, check) {
  fs.stat(path, function(errors, stat) {
    check(!errors && stat.isFile())
  })  
}

function publicPathFor(request) {
  return "public" + request.url
}