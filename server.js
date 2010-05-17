var sys = require('sys')
var fs = require('fs')
var http = require('http')

var mongo = require('./vendor/node-mongodb-native/lib/mongodb')
var haml = require('./vendor/haml/0.4.0/lib/haml')
var collectionsToExtract = ["apprentices", "shops"]

function startServer(callback) {
  http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'})
    callback(req, res)
  }).listen(parseInt(process.env.PORT) || 8001)
}


function dbConnection(callback) {
  var db = new mongo.Db('apprentice-us', new mongo.Server("flame.mongohq.com", 27052, {}))
  db.open(function(err, db) {
    db.authenticate("squirrel", "password", function(err, replies) {
      callback(db)
    })
  })
}

function extractData(db, callback) {
  var receivedCollections = []
  for (e in collectionsToExtract) {
    loadCollection(db, collectionsToExtract[e], function(name, data) {
      callback(name, data, receivedCollections)
    })
  }
}

function loadCollection(db, name, callback) {
  db.collection(name, function(err, collection) {
    collection.find({}, {'sort':[['name', 1]]}, function(err, cursor) {
      cursor.toArray(function(err, array) {
        callback(name, array)
      })
    })
  })
}


function combineCollectionsForView(name, data, receivedCollections, callback) {
  receivedCollections.push({name: name, data: data})
  
  if (collectionsToExtract.length === receivedCollections.length) {
    var viewData = {}
    for (r in receivedCollections) {
      for (e in collectionsToExtract) {
        if (receivedCollections[r].name === collectionsToExtract[e]) {
          viewData[receivedCollections[r].name] = receivedCollections[r].data
        }
      }
    }
    prepareForView(viewData)
    callback(viewData)
  }
}

function prepareForView(viewData) {
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

function render(template, viewData, callback) {
  fs.readFile(template, function(error, template) {
    callback(haml.render(template, {locals: viewData}))
  })  
}


startServer(function (req, res) {
  dbConnection(function(db) {
    extractData(db, function(collectionName, data, receivedCollections) {
      combineCollectionsForView(collectionName, data, receivedCollections, function(viewData) {
        render('index.html.haml', viewData, function(output) {
          res.end(output)
        })        
      })
    })
  })
})
