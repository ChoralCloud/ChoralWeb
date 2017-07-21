(

// grab from here to the other comment not including the comment

function (_, done){
  var request = require('request')
  var options = {
    method: 'GET',
    uri: "http://api.openweathermap.org/data/2.5/weather?q=Victoria,CA&appid=35570de8864c1d214a64c5112293b740",
    json: true
  }

  request(options, function (err, res, body) {
    if (err) {
      console.log('error : ', err, body)
      return
    }
    // reset the output on every request
    output = {
      lat: null,
      lon: null,
      temp: null,
      pressure: null,
      humidity: null,
      error: null,
      city: null
    }

    if(body.cod != 200){
      output.error = body.message
      return done(output)
    }

    output.lat = body.coord.lat
    output.lon = body.coord.lon
    output.city = body.name;
    if(body.weather[-1]){
      output.forecast = body.weather[-1].description
    }
    if(body.main){
      output.temp = body.main.temp
      output.pressure = body.main.pressure
      output.humidity = body.main.humidity
    }
    done(output)
  });
}

)(null, (result) => console.log("done", result)) 


