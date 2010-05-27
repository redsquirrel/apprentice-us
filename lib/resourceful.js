// Would make sense to pull this into a config file
var defaultResources = ['apprentices', 'shops']

exports.render = function(db, renderer, request, response) {
  var template, resources
  var resourceRequest = parseResource(request)

  if (resourceRequest) {
    template = resourceRequest.name + "/show.html.haml"
    resources = [resourceRequest]

  } else {
    template = 'index.html.haml'
    resources = defaultResources.map(function(name) { return {name: name} })
  }
  
  extractViewData(db, resources, function(viewData) {
    renderer.render(template, viewData, response)
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

function extractViewData(db, resources, renderView) {  
  var resourcesToExtract = resources.map(function(item) { return item.name })
  var resourcesReceived = []

  resources.forEach(function(resource) {
    db.loadResource(resource, function(resourceData) {
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
