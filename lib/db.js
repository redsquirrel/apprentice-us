var mongo = require('../vendor/node-mongodb-native/lib/mongodb')

exports.loadResource = function(resource, onLoad) {
  var query = buildResourceQuery(resource)
  loadFromQuery(query, function(resourceData) {
    resourceData.loadAssociations(resourceData.results, function() {
      onLoad(resourceData)
    })
  })
}

function buildResourceQuery(resource) {
  var query = {
    resourceName: resource.name,
    loadAssociations: function(ignored, ready) { ready() }
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
      query.loadAssociations = apprenticeBelongsToShop
    } else if (query.viewName === "shop") {
      query.loadAssociations = shopHasManyApprentices
    }
  }

  return query
}

function apprenticeBelongsToShop(apprentice, ready) {
  var query = {
    resourceName: "shops",
    filter: {slug: apprentice.apprenticeship_shop},
    cursorFunc: "nextObject"
  }
  loadFromQuery(query, function(shopData) {
    apprentice.shop = shopData.results
    ready()
  })
}

function shopHasManyApprentices(shop, ready) {
  var query = {
    resourceName: "apprentices",
    filter: {apprenticeship_shop: shop.slug},
    cursorFunc: "toArray"
  }
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
          query.results = results
          onLoad(query)
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
