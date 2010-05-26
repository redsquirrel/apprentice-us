require('../lib/relationships').define({

  apprentice: { belongsTo: "shop" },
  shop: { hasMany: "apprentices" }

})
