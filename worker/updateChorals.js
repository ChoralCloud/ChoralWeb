var client = require('redis').createClient(process.env.REDIS_STORE_URI)
var Choral = require('../models/choral')

client.keys('*', function (err, keys) {
  if (err) return console.log(err)

  // proof of concept that I can hit redis
  keys.forEach((key)=> {
    client.get('0', (err, val) => {
      if (err) return console.log(err)

      console.log(val)
    })
  })
});
