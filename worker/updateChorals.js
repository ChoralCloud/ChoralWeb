var client = require('redis').createClient(process.env.REDIS_STORE_URI)
var Choral = require('../models/choral')
var request = require('request')

setInterval(() => {
  // this doesnt run the chorals according to their timeouts it just runs 
  // all of the chorals every UPDATE_NEW_CHORALS seconds
  Choral.getAllChoralsWithChildren((err, chorals) => {
    if(err) return console.log(err.message)

    chorals.forEach((choral) => {
      var param = {}

      choral.children.forEach((child) => {
        client.hgetall(child.choralId, (err, data) => {
          if(err) return console.log(err.message)

          param[child.name] = data;
          console.log(data)

          // this is just so I dont have to import a promise library
          if(Object.keys(param).length == choral.children.length){
            // In a real project this would kick off in a sandbox. If we find
            // the server is crashing a bunch then we can look into doing that
            // Amazon lambda functions would make this a viable solution to
            // our problem because they do not have access to our environment
            try{
              // horiffic use of eval
              eval("var func = " + choral.func)

              func(param, get_callBack(choral))
            } catch (e) {
              sendChoralData(choral, { error: e.message })
            }
          }
        })
      })
    })
  })
}, 0 | process.env.UPDATE_NEW_CHORALS)

// uses a closure to run sendChoralData with the choral in question
function get_callBack(choral){
  return (computed_data) => sendChoralData(choral, computed_data)
}

// Sends updated choral data to the device endpoint
function sendChoralData(choral, computed_data){
  console.log(computed_data)
  if(!computed_data) computed_data = {}

  var data = {
    "device_id": choral.choralId,
    "user_secret":  "currentlyunused",
    "device_data": computed_data,
    "device_timestamp": (new Date()).getTime()
  }

  var options = {
    method: 'POST',
    uri: process.env.ALLEGRO_URL,
    json: true,
    body: data
  }

  request(options, function (err, res, body) {
    if (err) {
      console.log('error posting json: ', err, body)
      return
    }

    if(body.error){
      console.log(body.error)
    }
  });

}
