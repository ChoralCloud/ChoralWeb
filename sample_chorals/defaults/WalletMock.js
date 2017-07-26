//(

function (_, done){
  /*
   * This function returns a number between 1 and 2
   * that is meant to represent the number of bitcoin that you currently own
   */
  var ammoutOwned = 1 + (Math.random() < 0.5 ? -1 : 1) * (Math.random()* 1) ;
  done({ owned: Number(ammoutOwned.toFixed(5)) })
}

//)({}, (output) => console.log(output))

