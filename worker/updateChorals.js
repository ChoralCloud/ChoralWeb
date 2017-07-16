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
          // this should all be abstracted into a amazon lambda function
          // Amazon lambda functions would make this a viable solution to
          // our problem because they do not have access to our environment
          if(err) return console.log(err.message)

          param[child.name] = data;
          // this is just so I dont have to import a promise library

          if(Object.keys(param).length == choral.children.length){
            var computed_data = "";
            try{
              // horiffic use of eval
              // this also means that the function cannot be asynchronous for now
              // This can be added if we call the function with a callback as
              // the second parameter
              eval("var func = " + choral.func)
              console.log(func.length)
              // func.length returns the number of parameters
              // if there is only one parameter then assume that the person is just going to
              // return a value
              if(func.length == 1){
                computed_data = func(param)
                sendChoralData(choral, computed_data)
              // if there are two parameters then you should assume that the function
              // is asynchronous and that a callback will be called
              } else if (func.length == 2) {
                computed_data = func(param, get_callBack(choral))
              }
            } catch (e) {
              //console.log(e.message)
              computed_data = { error: e.message }
              sendChoralData(choral, computed_data)
            }
          }
        })
      })
    })
  })
}, 0 | process.env.UPDATE_NEW_CHORALS)

// copied from device mock If this design is approved this should be moved
// into a new utility function and shared between device mock and choral web
function cb(choral){
  return (computed_data) => sendChoralData(choral, computed_data)
}

// copied from device mock If this design is approved this should be moved
// into a new utility function and shared between device mock and choral web
function sendChoralData(choral, computed_data){
  if(!computed_data) computed_data = {};

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
