var sys = require('sys')
var http = require('./lib/http')
var public = require('./lib/public')
var resourceful = require('./lib/resourceful')

http.serve(function (request, response) {
  sys.puts(sys.inspect(request))

  if (public.found(request)) {
    public.render(response)
    return
  }

  resourceful.render(request, response)
})
