var assets = require('./lib/assets')
var db = require('./lib/db')
var http = require('./lib/http')
var renderer = require('./lib/renderer')
var resourceful = require('./lib/resourceful')
var sys = require('sys')

var connection = db.create(db.connect)

http.serve(function (request, response) {
  sys.puts(sys.inspect(request))
  assets.handle(request, response, orRenderResource)
})

function orRenderResource(request, response) {
  resourceful.render(connection, renderer, request, response)
}