var assert = require('assert')
var db = require('../lib/db')
var sys = require('sys')

var it = function(description, test) {
  test()
}

it("uses the name attribute to figure out which collection to look up", function() {

  var dbStub = {
    collection: function(collectionName) {
      assert.equal(collectionName, "apprentices")
    }
  }

  var connection = db.create(function(callback) { callback(dbStub) })
  connection.loadResource({name: "apprentices", id: "ethan_gunderson"})
})
