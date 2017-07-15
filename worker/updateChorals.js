var client = require('redis').createClient(process.env.REDIS_STORE_URI)
var Choral = require('../models/choral')

setInterval(() => {
  console.log("Updating New Chorals")
  Choral.getAllChorals((err, chorals) => {
    chorals.forEach((choral) => {
      // if the choral isnt running run it here
    })
  })
}, 0 | process.env.UPDATE_NEW_CHORALS)
