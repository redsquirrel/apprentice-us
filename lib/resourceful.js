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

function parseResource(request, ifResource, ifCollection) {
  var urlParts = request.url.split('/')
  if (urlParts.length <= 2){
    return ifCollection();
  }else{
    return ifResource({name: urlParts[1], id: urlParts[2]})
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
  var viewData = {}
  
  return function(resourceData) {
    resourcesReceived.push(resourceData)
    viewData[resourceData.viewName] = resourceData.results

    if (resourcesToExtract.length === resourcesReceived.length)
      renderView(viewData)
  }
}