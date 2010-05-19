var fs = require('fs')

// For now, we're cheating, since we have only one public file.

exports.found = function(request) {
  return request.url === "/favicon.ico"
}

exports.render = function(response) {
  fs.readFile("public/favicon.ico", "binary", function(error, image) {
    response.writeHead(200, {'Content-Type': 'image/vnd.microsoft.icon'})
    response.end(image, "binary")
  })
}
