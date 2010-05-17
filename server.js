var fs = require('fs')
var http = require('http')

var mongo = require('./vendor/node-mongodb-native/lib/mongodb')
var haml = require('./vendor/haml/0.4.0/lib/haml')

function renderIndex(viewData, callback) {
  fs.readFile('index.html.haml', function(error, template) {
    callback(haml.render(template, {locals: viewData}))
  })  
}

function grabAll(collectionName, db, callback) {
  db.collection(collectionName, function(err, collection) {
    collection.find({}, {'sort':[['name', 1]]}, function(err, cursor) {
      cursor.toArray(function(err, array) {
        callback(array)
      })
    })
  })
}

function dbConnection(callback) {
  var db = new mongo.Db('apprentice-us', new mongo.Server("flame.mongohq.com", 27052, {}))
  db.open(function(err, db) {
    db.authenticate("squirrel", "password", function(err, replies) {
      callback(db)
    })
  })
}

function startServer(callback) {
  http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'})
    callback(req, res)
  }).listen(parseInt(process.env.PORT) || 8001)
}

startServer(function (req, res) {
  dbConnection(function(db) {
    grabAll("apprentices", db, function(apprentices) {
      grabAll("shops", db, function(shops) {
        var viewData = {
          shops: shops,
          apprentices: apprentices
        }
        renderIndex(viewData, function(output) {
          res.end(output)
        })  
      })
    })    
  })
})
