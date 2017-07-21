(

// grab from here to the other comment not including the comment


function (children, done){
  // reset the output on every request
  var output = {
    temp: null,
    pressure: null,
    humidity: null,
    error: null
  }

  Object.keys(children).every((name, index) => {
    return ["temp", "pressure", "humidity"].every((data_val) => {
      if(children[name].data[data_val]) {
        output[data_val] += children[name].data[data_val]
        if(index == Object.keys(children).length - 1){
          output[data_val] /= Object.keys(children).length
          output[data_val] = output[data_val].toFixed(2)
        }
        return true;
      }else {
        done({
          temp: null,
          pressure: null,
          humidity: null,
          error: "missing " + data_val + " from " + name + " possible error: " + children[name].error,
        })
        return false;
      }
    })
  }) && done(output)

}


)(
{ Nanaimo:
 { data:
    { lat: 49.17,
      lon: -123.94,
      temp: 295.69,
      pressure: 1018,
      humidity: 36,
      error: null,
      city: 'Nanaimo' },
   device_timestamp: 1646430170 },
'North Saanich':
 { data:
    { lat: 48.67,
      lon: -123.42,
      temp: 293.51,
      pressure: 1021,
      humidity: 56,
      error: null,
      city: 'North Saanich' },
   device_timestamp: 1646430180 },
Victoria:
 { data:
    { lat: 48.43,
      lon: -123.37,
      temp: 292.32,
      pressure: 1021,
      humidity: 56,
      error: null,
      city: 'Victoria' },
   device_timestamp: 1646430177 } }
  , (result) => console.log("done", result)) 



