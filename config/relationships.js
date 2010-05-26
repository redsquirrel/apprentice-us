require('../lib/db/relationships').define({

  apprentice: { belongsTo: "shop" },
  shop: { hasMany: "apprentices" }

})
