var assert = require('assert')
var db = require('../lib/db')
var sys = require('sys')

var it = function(description, test) {
  try {
    test()
  } catch (e) {
    sys.puts("FAILURE: " + description)
    throw e
  }
}

var dbStub = function(collection) {
  return {
    collection: function(collectionName, collectionCallback) {
      collectionCallback(undefined, collection)
    }
  }
}
var connect = function(dbStub) {
  return function(callback) { callback(dbStub) }
}

it("uses the name attribute to figure out which collection to look up", function() {
  var assertion = function(collectionName) {
    assert.equal(collectionName, "apprentices")
  }

  var connection = db.create(connect({ collection: assertion }))
  connection.loadResource({name: "apprentices", id: "ethan_gunderson"})
})

it("uses the name id to figure out which document to look up", function() {
  var assertion = function(filter) {
    assert.deepEqual(filter, {slug: "ethan_gunderson"})
  }

  var connection = db.create(connect(dbStub({find: assertion})))
  connection.loadResource({name: "apprentices", id: "ethan_gunderson"})
})

it("provides apprentice data to the onLoad callback", function() {
  var assertion = function(resourceData) {
    assert.deepEqual(resourceData.results, { foo: 'bar', shop: { foo: 'bar' } })
  }
  
  var cursorStub = {
    nextObject: function(cursorCallback) {
      cursorCallback(undefined, {foo: "bar"})
    }
  }
  
  var collectionStub = {
    find: function(ignored, ignored, findCallback) {
      findCallback(undefined, cursorStub)
    }    
  }
  
  var connection = db.create(connect(dbStub(collectionStub)))
  connection.loadResource({name: "apprentices", id: "ethan_gunderson"}, assertion)
})

it("provides shop data to the onLoad callback", function() {
  var expectedShopName = "obtiva"
  var expectedApprentices = [{name: "colin"}, {name: "ethan"}]
  
  var assertion = function(resourceData) {
    assert.equal(resourceData.results.name, expectedShopName)
    assert.deepEqual(resourceData.results.apprentices, expectedApprentices)
  }
  
  var cursorStub = {
    nextObject: function(cursorCallback) {
      cursorCallback(undefined, {name: expectedShopName})
    },
    
    toArray: function(cursorCallback) {
      cursorCallback(undefined, expectedApprentices)
    }
  }
  
  var collectionStub = {
    find: function(ignored, ignored, findCallback) {
      findCallback(undefined, cursorStub)
    }    
  }

  var connection = db.create(connect(dbStub(collectionStub)))
  connection.loadResource({name: "shops", id: "obtiva"}, assertion)
})