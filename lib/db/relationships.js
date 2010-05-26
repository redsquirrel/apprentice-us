exports.define = function(configuration) {
  this.configuration = configuration
} 

exports.forEach = function(modelName, callback) {
  for (relationshipType in this.configuration[modelName]) {
    var relationName = this.configuration[modelName][relationshipType]
    callback(relationshipType, relationName)
  }  
}
