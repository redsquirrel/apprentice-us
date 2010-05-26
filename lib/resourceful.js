var db = require('./db')
var fs = require('fs')
var haml = require('../vendor/haml/0.4.0/lib/haml')
var mongo = require('./mongo')
var sys = require('sys')

exports.render = function(request, response) {
  var template, resources
  var resourceRequest = parseResource(request)

  if (resourceRequest) {
    template = resourceRequest.name + "/show.html.haml"
    resources = [resourceRequest]

  } else {
    template = 'index.html.haml'
    resources = [{name: 'apprentices'}, {name: 'shops'}]
  }
  
  extractViewData(resources, function(viewData) {
    render(template, viewData, response)
  })
}

function parseResource(request) {
  if (request.url === "/") return

  var pathPieces = request.url.split('/')
  return {
    name: pathPieces[1],
    id: pathPieces[2],
  }
}

function extractViewData(resources, renderView) {
  var resourcesToExtract = resources.map(function(item) { return item.name })
  var resourcesReceived = []
  var connection = db.create(mongo.connect)

  resources.forEach(function(resource) {
    connection.loadResource(resource, function(resourceData) {
      combineResourcesForView(resourceData, resourcesToExtract, resourcesReceived, renderView)
    })
  })
}

// This is the "magic" method! It jams data into the resourcesReceived
// array, and once it has everything, we trigger the data prep for display.
function combineResourcesForView(resourceData, resourcesToExtract, resourcesReceived, renderView) {
  resourcesReceived.push(resourceData)
  
  if (resourcesToExtract.length === resourcesReceived.length) {
    var viewData = collectionsToHash(resourcesToExtract, resourcesReceived)
    renderView(viewData)
  }
}

function collectionsToHash(resourcesToExtract, resourcesReceived) {
  var viewData = {}
  resourcesReceived.forEach(function(received) {
    resourcesToExtract.forEach(function(extracted) {
      if (received.resourceName === extracted) {
        viewData[received.viewName] = received.results
      }
    })
  })
  return viewData
}

function render(path, viewData, response) {
  response.writeHead(200, {'Content-Type': 'text/html'})
  fs.readFile("views/" + path, function(error, template) {
    if (error) {
      template = "<h1>ERROR!</h1><pre>" + sys.inspect(error) + "</pre>"
    }
    response.end(haml.render(template, {locals: viewData}))
  })
}
