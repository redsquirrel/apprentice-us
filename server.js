var sys = require('sys')
var fs = require('fs')
var http = require('http')

var mongo = require('./vendor/node-mongodb-native/lib/mongodb')
var haml = require('./vendor/haml/0.4.0/lib/haml')
var collectionsToExtract = ["apprentices", "shops"]

function httpServer(callback) {
  http.createServer(function (request, response) {
    response.writeHead(200, {'Content-Type': 'text/html'})
    callback(request, response)
  }).listen(parseInt(process.env.PORT) || 8001)
}


function dbConnection(callback) {
  var db = new mongo.Db('apprentice-us', new mongo.Server("flame.mongohq.com", 27052, {}))
  db.open(function(error, db) {
    if (error) return
    db.authenticate("squirrel", "password", function(error, replies) {
      if (!error) callback(db)
    })
  })
}

function extractViewData(db, callback) {
  var receivedCollections = []
  for (e in collectionsToExtract) {
    loadCollection(db, collectionsToExtract[e], function(name, data) {
      combineCollectionsForView(name, data, receivedCollections, callback)
    })
  }
}

function loadCollection(db, name, callback) {
  db.collection(name, function(error, collection) {
    collection.find({}, {'sort':[['name', 1]]}, function(error, cursor) {
      cursor.toArray(function(error, array) {
        callback(name, array)
      })
    })
  })
}

// This is the "magic" method! It jams data into the receivedCollections
// array, and once it has everything, we trigger the data prep for display.
function combineCollectionsForView(name, data, receivedCollections, callback) {
  receivedCollections.push({name: name, data: data})
  
  if (collectionsToExtract.length === receivedCollections.length) {
    var viewData = collectionsToHash(receivedCollections)
    apprenticeBelongsToShop(viewData)
    callback(viewData)
  }
}

function collectionsToHash(receivedCollections) {
  var viewData = {}
  for (r in receivedCollections) {
    for (e in collectionsToExtract) {
      if (receivedCollections[r].name === collectionsToExtract[e]) {
        viewData[receivedCollections[r].name] = receivedCollections[r].data
      }
    }
  }
  return viewData
}

function apprenticeBelongsToShop(viewData) {
  for (a in viewData.apprentices) {
    var apprentice = viewData.apprentices[a]
    for (s in viewData.shops) {
      var shop = viewData.shops[s]
      if (apprentice.apprenticeship_shop == shop.name) {
        apprentice.shop = shop
        break
      }
    }
  }
}

function render(template, viewData, response) {
  fs.readFile(template, function(error, template) {
    response.end(haml.render(template, {locals: viewData}))
  })  
}


httpServer(function (request, response) {
  dbConnection(function(db) {
    extractViewData(db, function(viewData) {
      render('index.html.haml', viewData, response)
    })
  })
})
