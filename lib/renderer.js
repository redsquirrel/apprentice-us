var fs = require('fs')
var haml = require('../vendor/haml/0.4.0/lib/haml')
var sys = require('sys')

exports.render = function(path, viewData, response) {
  response.writeHead(200, {'Content-Type': 'text/html'})
  fs.readFile("views/" + path, "utf8", function(error, template) {
    if (error) {
      template = "<h1>ERROR!</h1><pre>" + sys.inspect(error) + "</pre>"
    }
    response.end(haml.render(template, {locals: viewData}))
  })
}
