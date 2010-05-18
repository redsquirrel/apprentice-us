var sys = require('sys')
var fs = require('fs')
var http = require('http')

var mongo = require('./vendor/node-mongodb-native/lib/mongodb')
var haml = require('./vendor/haml/0.4.0/lib/haml')

function p(toShow){
  sys.puts(sys.inspect(toShow))
}

function httpServer(handleRequest) {
  http.createServer(function (request, response) {
    handleRequest(request, response)
  }).listen(parseInt(process.env.PORT) || 8001)
}

function renderResource(request, response) {
  var template, resources

  var resourceRequest = parseResource(request)
  if (resourceRequest) {
    template = resourceRequest.name + "/show.html.haml"
    resources = [resourceRequest]
  } else {
    template = 'index.html.haml'
    resources = [{name: 'apprentices'}, {name: 'shops'}]
  }
  
  dbConnection(function(db) {
    extractViewData(db, resources, function(viewData){
      render(template, viewData, response)
    })
  })
}

function parseResource(request) {
  if (request.url === "/") return

  var pathPieces = request.url.split('/')
  return {
    name: pathPieces[1],
    id: pathPieces[2]
  }
}

function dbConnection(callback) {
  var db = new mongo.Db('apprentice-us', new mongo.Server("flame.mongohq.com", 27052, {}))
  db.open(function(error, db) {
    if (error) return
    db.authenticate("squirrel", "password", function(error, replies) {
      if (!error) callback(db)
    })
  })
}

function extractViewData(db, resources, renderView) {
  var resourcesToExtract = resources.map(function(item) { return item.name })
  var resourcesReceived = []

  for (r in resources) {
    loadFromQuery(db, buildResourceQuery(resources[r]), function(resourceName, loadedResource) {
      combineCollectionsForView(resourceName, loadedResource, resourcesToExtract, resourcesReceived, renderView)
    })
  }
}

function buildResourceQuery(resource) {
  var query = {
    resourceName: resource.name
  }

  if (resource.id) {
    query.filter = {slug: resource.id}
    query.cursorFunc = "nextObject"
  } else {
    query.filter = {}
    query.cursorFunc = "toArray"
  }
  
  return query
}

function loadFromQuery(db, query, onLoad) {
  db.collection(query.resourceName, function(error, collection) {
    collection.find(query.filter, {sort:[['name', 1]]}, function(error, cursor) {
      cursor[query.cursorFunc](function(error, results) {
        onLoad(query.resourceName, results)
      })
    })
  })
}

// This is the "magic" method! It jams data into the resourcesReceived
// array, and once it has everything, we trigger the data prep for display.
function combineCollectionsForView(name, data, resourcesToExtract, resourcesReceived, renderView) {
  resourcesReceived.push({name: name, data: data})
  
  if (resourcesToExtract.length === resourcesReceived.length) {
    var viewData = collectionsToHash(resourcesToExtract, resourcesReceived)
    renderView(viewData)
  }
}

function collectionsToHash(resourcesToExtract, resourcesReceived) {
  var viewData = {}
  for (r in resourcesReceived) {
    for (e in resourcesToExtract) {
      if (resourcesReceived[r].name === resourcesToExtract[e]) {
        viewData[resourcesReceived[r].name] = resourcesReceived[r].data
      }
    }
  }
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

function isFavicon(request) {
  return request.url === "/favicon.ico"
}

function renderFavicon(response) {
  fs.readFile("public/favicon.ico", "binary", function(error, image) {
    response.writeHead(200, {'Content-Type': 'image/vnd.microsoft.icon'})
    response.end(image, "binary")
  })
}

httpServer(function (request, response) {
  sys.puts(request.url)

  if (isFavicon(request)) {
    renderFavicon(response)
    return
  }

  renderResource(request, response)
})
