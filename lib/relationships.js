exports.define = function(configuration) {
  this.configuration = configuration
} 

exports.find = function(modelName) {
  return this.configuration[modelName]
}
