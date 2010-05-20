var mongo = require('../vendor/node-mongodb-native/lib/mongodb')

exports.loadResource = function(resource, onLoad) {
  loadFromQuery(buildResourceQuery(resource), onLoad)
}

function buildResourceQuery(resource) {
  var queryInput = {
    resourceName: resource.name,
    viewName:     resource.name,
    cursorFunc:  "toArray"
  }

  if (resource.id) {
    queryInput.viewName   = resource.name.replace(/s$/, "")
    queryInput.filter     = {slug: resource.id}
    queryInput.cursorFunc = "nextObject"

    if (queryInput.viewName === "apprentice") {
      queryInput.loadAssociations = apprenticeBelongsToShop
    } else if (queryInput.viewName === "shop") {
      queryInput.loadAssociations = shopHasManyApprentices
    }
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

function apprenticeBelongsToShop(apprentice, ready) {
  var query = buildQuery({
    resourceName: "shops",
    filter: {slug: apprentice.apprenticeship_shop},
    cursorFunc: "nextObject"
  })
  loadFromQuery(query, function(shopData) {
    apprentice.shop = shopData.results
    ready()
  })
}

function shopHasManyApprentices(shop, ready) {
  var query = buildQuery({
    resourceName: "apprentices",
    filter: {apprenticeship_shop: shop.slug},
    cursorFunc: "toArray"
  })
  loadFromQuery(query, function(apprenticesData) {
    shop.apprentices = apprenticesData.results
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

function connect(callback) {
  var db = new mongo.Db('apprentice-us', new mongo.Server("flame.mongohq.com", 27052, {}))
  db.open(function(error, db) {
    if (error) return
    db.authenticate("squirrel", "password", function(error, replies) {
      if (!error) callback(db)
    })
  })
}
