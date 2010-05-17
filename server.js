var fs = require('fs')
var http = require('http')

var mongo = require('./vendor/node-mongodb-native/lib/mongodb')
var haml = require('./vendor/haml/0.4.0/lib/haml')

function renderIndex(viewData, callback) {
  fs.readFile('index.html.haml', function(error, template) {
    callback(haml.render(template, {locals: viewData}))
  })  
}

function grabShops(db, callback) {
  db.collection('shops', function(err, collection) {
    collection.find({}, {'sort':[['name', 1]]}, function(err, cursor) {
      cursor.toArray(function(err, array) {
        callback(array)
      })
    })
  })
}

function grabApprentices(db, callback) {
  db.collection('apprentices', function(err, collection) {
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

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'})
  dbConnection(function(db) {
    grabApprentices(db, function(apprentices) {
      grabShops(db, function(shops) {
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
}).listen(parseInt(process.env.PORT) || 8001)
