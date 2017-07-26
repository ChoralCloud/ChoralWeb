function (children, done){
  /*
   * This function aggregates any number of temperature sensors
   * to get a average of the temperature for the temperature,
   * the pressure and the humidity
   */

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
