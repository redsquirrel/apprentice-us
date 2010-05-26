var relationships = require('../lib/relationships')

relationships.define({

  apprentice: { belongsTo: "shop" },
  shop: { hasMany: "apprentices" }

})
