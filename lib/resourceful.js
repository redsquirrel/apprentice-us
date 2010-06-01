var defaultResources = require("../config/resources").resources

exports.render = function(db, renderer, request, response) {
  var template, resources
  var viewStuff = parseResource(request, resourceData, indexData)

  extractViewData(db, viewStuff.resources, function(viewData) {renderer.render(viewStuff.template, viewData, response)})
}

function resourceData(resourceInfo){
  return {
    template: resourceInfo.name + "/show.html.haml",
    resources: [resourceInfo]
  }
}

function indexData() {
  return {
    template: 'index.html.haml',
    resources: defaultResources.map(function(name) { return {name: name} })
  }
}

function parseResource(request, ifResource, ifNoResource) {
  if (request.url === "/"){
    return ifNoResource();
  }else{
    var pathPieces = request.url.split('/')
    return ifResource({name: pathPieces[1], id: pathPieces[2]})
  }
}

function extractViewData(db, resources, renderView) {  
  resources.forEach(makeLoadResource(db, resources, renderView))
}

function makeLoadResource(db, resources, renderView) {
  var renderResources = combineResourcesForView(resources, renderView)
  return function(resource) { db.loadResource(resource, renderResources) }
}

function combineResourcesForView(resources, renderView){
  var resourcesToExtract = resources.map(function(item) { return item.name })
  var resourcesReceived  = []
  
  
  
  return function(resourceData) {
    resourcesReceived.push(resourceData)

    if (resourcesToExtract.length === resourcesReceived.length) {
      var viewData = collectionsToHash(resourcesReceived)
      renderView(viewData)
    }
  }
}

function collectionsToHash(resourcesReceived) {
  return resourcesReceived.reduce(function(viewData, resource) {
    viewData[resource.viewName] = resource.results
    return viewData
  }, {})
}
