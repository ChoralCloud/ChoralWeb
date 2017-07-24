var client = require('redis').createClient(process.env.REDIS_STORE_URI)
var Choral = require('../models/choral')
var request = require('request')
var mongoose = require('mongoose')

var TIMEOUTS = {}

// run the update right away
update()
// then set an interval for the update
setInterval(() => {
  update()
}, (0 | process.env.UPDATE_NEW_CHORALS) || 5 )


// the logic of the workers, it handles not running removed chorals
// and setting the timeouts of the running chorals
function update(){
  Choral.getAllChorals((err, chorals) => {
    if(err) return console.log(err.message)
    // run all the chorals that are new
    startNewChorals(chorals)
  })
}

// gets all the children in the choral and runs to completion
function getChildrenAndRunChoral(choral){
    if(choral.children.length == 0){
      runComputation({}, choral)
      return
    }

    var param = {}
    choral.children.forEach((child) => {
      client.hgetall(child.choralId, (err, data) => {
        if(err) return console.log(err.message)

        // json comes in as a string, parse it first
        var payload = {}
        if (data) {
          payload.data = JSON.parse(data.device_data)
          payload.device_timestamp = data.device_timestamp | 0
        } else {
          payload.data = {}
          payload.device_timestamp = (new Date()).getTime() | 0
        }

        param[child.name] = payload;

        // if this is the last child to be added, run the compuation with the children
        // this is just so I dont have to import a promise library
        if(Object.keys(param).length == choral.children.length){
          // Amazon lambda functions would make this a viable solution to
          // our problem because they do not have access to our environment
          // if this ends up being super slow we should do that
          runComputation(param, choral)
        }
      })
    })
}

function startNewChorals(chorals){
  chorals.forEach((choral) => {
    // dont rerun already running chorals
    if(TIMEOUTS[choral.choralId]){
      return
    }

    // make a new object for the chorals
    TIMEOUTS[choral.choralId] = { }

    console.log("new choral added " + choral.choralId)

    // get the current value of the choral
    client.hgetall(choral.choralId, (err, current_val) => {
      if(err) return console.log(err.message)

      var run_in = 0 
      // if current_val == null then this is a brand new choral
      // if current_val != null then there is alread some data for this choral
      // in choral storm
      if(current_val != null){
        run_in = (choral.sampleRate * 1000) - ((new Date()).getTime() - current_val.device_timestamp)
      }
      run_in = Math.max(run_in, 0)


      // this is admitidly a bit confusing, here is my thought
      // this setTimeout is used to run the next iteration of the choral
      // once that iteration is run, then the interval kicks in
      // a timeline would look like this for a interval of 6 (underscores are seconds)
      //
      //      crash
      // .. |_ _|_ _ |_ _|_ _ _ _ _ _|_ _ _ _ _ _|_ _ _ ...
      //   last     now next      interval1   interval2
      // so because we only have 2 seconds until the next time that
      // the function should have ran we should run the function in 2 seconds then
      // start the interval again on a regular interval
      // if you have missed a interval then just run it now and restart the interval
      //
      //      crash
      // .. |_ _|_ _ _ _|_ _ _|_ _ _ _ _ _|_ _ _ _ _ _|_ _ _  ...
      //   last      missed now/next   interval1   interval2
      //
      // also note that you have to set the timeout here so that the
      // the choral does not execute in the time between now and when the
      // first timeout is fired
      TIMEOUTS[choral.choralId].timeout_id = setTimeout(() => {
        getChildrenAndRunChoral(choral)
      }, run_in)
    })
  })
}

// anything that was not set to seen by now is unused
function clearChoral(choral){
  // clear all unseen timeouts's
  console.log("deleting choral with choral id " + choral.choralId)
  if(!TIMEOUTS[choral.choralId]) return
  clearTimeout(TIMEOUTS[choral.choralId].timeout_id)
  clearInterval(TIMEOUTS[choral.choralId].timeout_id)
  delete TIMEOUTS[choral.choralId]
}

// evals the choral function
function runComputation(children, choral){
  Choral.findOne({ _id: mongoose.Types.ObjectId(choral._id)}, (err, current_choral) => {
    if(err) return console.log(err)

    if(!current_choral){
      return clearChoral(choral)
    }

    const {NodeVM} = require('vm2')

    var config = {
      func: current_choral.func,
      children: children,
      callback: getCallBack(current_choral),
    }

    const vm = new NodeVM({
      require: {
        external:true
      },
      sandbox: config,
      // this gives us the option to use a timeout if we see fit
      timeout: (0 | process.env.CHORAL_FUNCTION_TIMEOUT) || 50
    })

    // this callback must be inside of the vm
    // Note: this is synchronous meaning that the call will block until
    // this is call is finished.
    try{
      vm.run(`
          eval("var f = " + func)
          f(children, callback) `, 'vm.js')
    } catch (e) {
      sendChoralData(current_choral, { error: e.message })
    }
    TIMEOUTS[choral.choralId].timeout_id = setTimeout(() => {
      getChildrenAndRunChoral(choral)
    }, current_choral.sampleRate * 1000)
  })
}

// uses a closure to run sendChoralData with the choral in question
function getCallBack(choral){
  return (computed_data) => sendChoralData(choral, computed_data)
}

// Sends updated choral data to the device endpoint
function sendChoralData(choral, computed_data){
  console.log(choral.name, computed_data)

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
  })

}
