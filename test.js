function QuitarCaracteres(str) {

  // var nit = '';
  // for (var i = 0; i < str.length; i++) {
  //     if (isInteger(Number(str[i])) && str[i] != ' ') {
  //         nit += str[i];
  //     }
  // }
  str=str.replace(/,/g,"");
  str=str.replace(/-/g,"");
  str=str.replace(/\s/g,"");
  
  return str;
}

function isInteger(numero) {
  if (numero % 1 == 0) {
      return true;
  } else {
      return false;
  }
}

var nid = 'EIT8  14,002-979';
console.log("result 1",nid);
console.log("result 2",QuitarCaracteres(nid));