var sys = require('sys')
var fs = require('fs')

var http = require('./lib/http')
var mongo = require('./lib/db')

var haml = require('./vendor/haml/0.4.0/lib/haml')

function p(toShow){
  sys.puts(sys.inspect(toShow))
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
  
  extractViewData(resources, function(viewData) {
    render(template, viewData, response)
  })
}

function parseResource(request) {
  if (request.url === "/") return

  var pathPieces = request.url.split('/')
  var resourceRequest = {
    name: pathPieces[1],
    id: pathPieces[2]
  }
    
  return resourceRequest
}

function extractViewData(resources, renderView) {
  var resourcesToExtract = resources.map(function(item) { return item.name })
  var resourcesReceived = []

  for (r in resources) {
    loadFromQuery(buildResourceQuery(resources[r]), function(resourceData) {
      resourceData.include(resourceData.results, function() {
        combineResourcesForView(resourceData, resourcesToExtract, resourcesReceived, renderView)
      })
    })
  }
}

function buildResourceQuery(resource) {
  var query = {
    resourceName: resource.name,
    include: defaultInclude
  }

  if (resource.id) {
    query.viewName   = resource.name.replace(/s$/, "")
    query.filter     = {slug: resource.id}
    query.cursorFunc = "nextObject"
  } else {
    query.viewName   = resource.name
    query.filter     = {}
    query.cursorFunc = "toArray"
  }

  // This should go in some sort of declative config/model
  if (resource.id) {
    if (query.viewName === "apprentice") {
      query.include = apprenticeBelongsToShop
    } else if (query.viewName === "shop") {
      query.include = shopHasManyApprentices
    }
  }

  return query
}

function defaultInclude(ignored, release) {
  release()
}

function apprenticeBelongsToShop(apprentice, release) {
  var query = {
    resourceName: "shops",
    filter: {slug: apprentice.apprenticeship_shop},
    cursorFunc: "nextObject"
  }
  loadFromQuery(query, function(shopData) {
    apprentice.shop = shopData.results
    release()
  })
}

function shopHasManyApprentices(shop, release) {
  var query = {
    resourceName: "apprentices",
    filter: {apprenticeship_shop: shop.slug},
    cursorFunc: "toArray"
  }
  loadFromQuery(query, function(apprenticesData) {
    shop.apprentices = apprenticesData.results
    release()
  })
}

function loadFromQuery(query, onLoad) {
  mongo.connect(function(db) {
    db.collection(query.resourceName, function(error, collection) {
      collection.find(query.filter, {sort:[['name', 1]]}, function(error, cursor) {
        cursor[query.cursorFunc](function(error, results) {
          query.results = results
          onLoad(query)
        })
      })
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
  for (r in resourcesReceived) {
    for (e in resourcesToExtract) {
      if (resourcesReceived[r].resourceName === resourcesToExtract[e]) {
        viewData[resourcesReceived[r].viewName] = resourcesReceived[r].results
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

http.serve(function (request, response) {
  sys.puts(request.url)

  if (isFavicon(request)) {
    renderFavicon(response)
    return
  }

  renderResource(request, response)
})
