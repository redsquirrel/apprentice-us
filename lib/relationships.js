exports.define = function(configuration) {
  this.configuration = configuration
} 

// This little episode of insanity was necessary to extract the
// relationships from the plumbing. I'm open to suggestions.
exports.find = function(db, modelName) {
  var that = this
  return function(model, ready) {
    var associations = that.configuration[modelName]
    for (associationType in associations) {
      var associationName = associations[associationType]
      db[associationType](model, modelName, associationName, ready)
    }
  }
}
