var assert = require('assert')
var it = require('./test_helper').it
var resourceful = require('../lib/resourceful')

it("renders index", function() {
  var renderer = {
    render: function(path, viewData, response) {
      assert.equal(path, "index.html.haml")
      assert.deepEqual(viewData.apprentices, [{name: "ethan"}])
      assert.deepEqual(viewData.shops, [{name: "obtiva"}])
    }
  }

  var database = {
    shops: {resourceName: "shops", viewName: "shops", results: [{name: "obtiva"}]},
    apprentices: {resourceName: "apprentices", viewName: "apprentices", results: [{name: "ethan"}]}
  }
  var connection = {loadResource: function(resource, callback) { callback(database[resource.name]) }}
  
  resourceful.render(connection, renderer, {url: "/"})
})
