var relationships = require('./relationships')
require('../config/relationships')

exports.create = function(connect) {

  var publicInterface = {
    loadResource: function(resource, onLoad) {
      loadFromQuery(buildResourceQuery(resource), onLoad)
    }
  }

  var relationshipLoaders = {
    belongsTo: function(model, modelName, resourceName, ready) {
      loadAssociation(model, resourceName, buildQuery({
        resourceName: resourceName + "s",
        filter: {slug: model[resourceName + "_slug"]},
        cursorFunc: "nextObject"
      }), ready)
    },

    hasMany: function(model, modelName, resourceName, ready) {
      var filter = {}
      filter[modelName + "_slug"] = model.slug

      loadAssociation(model, resourceName, buildQuery({
        resourceName: resourceName,
        filter: filter,
        cursorFunc: "toArray"
      }), ready)
    }
  }

  return publicInterface
  
  function buildResourceQuery(resource) {
    var queryInput = {
      resourceName: resource.name,
      viewName:     resource.name,
      cursorFunc:   "toArray"
    }

    if (resource.id) {
      queryInput.viewName   = resource.name.replace(/s$/, "")
      queryInput.filter     = {slug: resource.id}
      queryInput.cursorFunc = "nextObject"
      queryInput.loadRelationships = setupRelationshipLoader(queryInput.viewName)
    }

    return buildQuery(queryInput)
  }
  
  function setupRelationshipLoader(modelName) {
    return function(model, ready) {
      var associations = relationships.find(modelName)
      for (associationType in associations) {
        var associationName = associations[associationType]
        relationshipLoaders[associationType](model, modelName, associationName, ready)
      }
    }    
  }

  function buildQuery(queryInput) {
    var query = {
      filter: {},
      loadRelationships: function(ignored, ready) { ready() }
    }
    for (key in queryInput) {
      query[key] = queryInput[key]
    }
    return query
  }

  function loadAssociation(model, resourceName, query, ready) {
    loadFromQuery(query, function(loaded) {
      model[resourceName] = loaded.results
      ready()
    })
  }

  function loadFromQuery(query, onLoad) {
    connect(function(db) {
      db.collection(query.resourceName, function(error, collection) {
        collection.find(query.filter, {sort:[['name', 1]]}, function(error, cursor) {
          cursor[query.cursorFunc](function(error, results) {
            query.loadRelationships(results, function() {
              query.results = results
              onLoad(query)
            })
          })
        })
      })
    })
  }
}