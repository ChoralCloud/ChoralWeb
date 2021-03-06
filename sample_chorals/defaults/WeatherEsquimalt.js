function (_, done){
  /*
   * This function polls open weather api to get the latest
   * weather information from Esquimalt
   */
  var request = require('request')
  var options = {
    method: 'GET',
    uri: "http://api.openweathermap.org/data/2.5/weather?q=Esquimalt,CA&appid=02c3ca6284dbda7b3a03ad60653162c2&units=metric",
    json: true
  }

  request(options, function (err, res, body) {
    if (err) {
      console.log('error : ', err, body)
      return
    }
    // reset the output on every request
    output = {
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

