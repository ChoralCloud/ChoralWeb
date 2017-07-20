var client = require('redis').createClient(process.env.REDIS_STORE_URI)
var Choral = require('../models/choral')
var request = require('request')

setInterval(() => {
  // this doesnt run the chorals according to their timeouts it just runs
  // all of the chorals every UPDATE_NEW_CHORALS seconds
  Choral.getAllChorals((err, chorals) => {
    if(err) return console.log(err.message)

    chorals.forEach((choral) => {
      if(choral.children.length == 0){
        runComputation({}, choral)
      }

      var param = {}

      choral.children.forEach((child) => {
        client.hgetall(child.choralId, (err, data) => {
          if(err) return console.log(err.message)

          // json comes in as a string, parse it first
          param[child.name] = {}
          param[child.name].data = JSON.parse(data.device_data);
          param[child.name].device_timestamp = data.device_timestamp | 0;
          // this is just so I dont have to import a promise library
          if(Object.keys(param).length == choral.children.length){
            // Amazon lambda functions would make this a viable solution to
            // our problem because they do not have access to our environment
            // if this ends up being super slow we should do that
            runComputation(param, choral)
          }
        })
      })
    })
  })
}, (0 | process.env.UPDATE_NEW_CHORALS) || 5 )

function runComputation(children, choral){
  const {NodeVM} = require('vm2');
  var config = {
    func: choral.func,
    children: children,
    callback: get_callBack(choral),
  }

  const vm = new NodeVM({
    require: {
      external:true
    },
    sandbox: config,
    // this gives us the option to use a timeout if we see fit
    timeout: (0 | process.env.CHORAL_FUNCTION_TIMEOUT) || 50
  });

  // this callback must be inside of the vm
  // Note: this is synchronous meaning that the call will block until
  // this is call is finished.
  try{
    vm.run(`
      eval("var f = " + func); f(children, callback) `, 'vm.js')
  } catch (e) {
    sendChoralData(choral, { error: e.message })
  }
}

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
