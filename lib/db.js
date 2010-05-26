var relationships = require('./relationships')
require('../config/relationships')

exports.create = function(connect) {

  var db = {
    loadResource: function(resource, onLoad) {
      loadFromQuery(buildResourceQuery(resource), onLoad)
    },
    
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
  
  return db
  
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
      queryInput.loadRelationships = relationships.find(db, queryInput.viewName)
    }

    return buildQuery(queryInput)
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