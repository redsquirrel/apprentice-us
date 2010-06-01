var defaultResources = require("../config/resources").resources

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

exports.render = function(db, renderer, request, response) {
  var template, resources
  var viewStuff = parseResource(request, resourceData, indexData)

  extractViewData(db, viewStuff.resources, function(viewData) {renderer.render(viewStuff.template, viewData, response)})
}

function parseResource(request, ifResource, ifNoResource) {
  if (request.url === "/"){
    return ifNoResource();
  }else{
    var pathPieces = request.url.split('/')
    return ifResource({name: pathPieces[1], id: pathPieces[2]})
  }
}

function makeLoadResource(db, resources, renderView) {
  var resourcesToExtract = resources.map(function(item) { return item.name })
  return function(resource) {
    db.loadResource(resource, makeCombineResourceForView(resourcesToExtract, renderView))
  }
}

function extractViewData(db, resources, renderView) {  
  resources.forEach(makeLoadResource(db, resources, renderView))
}


// This is the "magic" method! It jams data into the resourcesReceived
// array, and once it has everything, we trigger the data prep for display.
function combineResourcesForView(resourceData, resourcesToExtract, resourcesReceived, renderView) {
  resourcesReceived.push(resourceData)  
  
  if (resourcesToExtract.length === resourcesReceived.length) {
    var viewData = collectionsToHash(resourcesReceived)
    renderView(viewData)
  }
}

function makeCombineResourceForView(resourcesToExtract, renderView){
  var resourcesReceived  = []
  return function(resourceData) {
    combineResourcesForView(resourceData, resourcesToExtract, resourcesReceived, renderView)
  }
}


function collectionsToHash(resourcesReceived) {
  return resourcesReceived.reduce(function(viewData, resource) {
    viewData[resource.viewName] = resource.results
    return viewData
  }, {})
}
