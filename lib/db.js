exports.create = function(connect) {
  var relationships = {
    apprentice: belongsTo("shop"),
    shop: hasMany("apprentices")
  }

  return {
    loadResource: function(resource, onLoad) {
      loadFromQuery(buildResourceQuery(resource), onLoad)
    }
  }
  
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
      queryInput.loadAssociations = relationships[queryInput.viewName]
    }

    return buildQuery(queryInput)
  }

  function buildQuery(queryInput) {
    var query = {
      filter: {},
      loadAssociations: function(ignored, ready) { ready() }
    }
    for (key in queryInput) {
      query[key] = queryInput[key]
    }
    return query
  }

  function belongsTo(resourceName, config) {
    return function(model, ready) {
      loadAssociation(model, resourceName, buildQuery({
        resourceName: resourceName + "s",
        filter: {slug: model[resourceName + "_slug"]},
        cursorFunc: "nextObject"
      }), ready)
    }
  }

  function hasMany(resourceName, config) {
    return function(model, ready) {
      var filter = {}
      filter[this.viewName + "_slug"] = model.slug

      loadAssociation(model, resourceName, buildQuery({
        resourceName: resourceName,
        filter: filter,
        cursorFunc: "toArray"
      }), ready)
    }
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
            query.loadAssociations(results, function() {
              query.results = results
              onLoad(query)
            })
          })
        })
      })
    })
  }
}