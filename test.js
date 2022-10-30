var arrTransactions=[0,1,2,3,4,5];6
var PARAMETERS ={
  LIMIT:0
}
var range = 3;
console.log(" 1:",arr.slice(0,3));
console.log(" 2:",arr.slice(3,6));
console.log(" 3:",arr.slice(6,8));

function recallControl(arrTransactions){
  //Controla la cantidad de transacciones a procesar, si excede al valor de "range" realiza un rellamado
  var newLimit = PARAMETERS.LIMIT + range;
  var lengthTransactions=arrTransactions.length;
  if (newLimit > lengthTransactions) {
    arrTransactions = arrTransactions.slice(PARAMETERS.LIMIT, lengthTransactions);
    console.log("newLimit > lengthTransactions :",arrTransactions)
  }else{
    arrTransactions = arrTransactions.slice(PARAMETERS.LIMIT, newLimit);
    console.log("sino :",arrTransactions)
  }
  
}