const num=(12).toFixed(2);
console.log("🚀 ~ file: test.js ~ line 2 ~ num", num)

function FormatoNumero(pNumero, pSimbolo) {
  var separador = ',';
  var sepDecimal = '.';

  var splitStr = pNumero.split('.');
  var splitLeft = splitStr[0];
  var splitRight = splitStr.length > 1 ? sepDecimal + splitStr[1] : '';
  var regx = /(\d+)(\d{3})/;
  while (regx.test(splitLeft)) {
      splitLeft = splitLeft.replace(regx, '$1' + separador + '$2');
  }
  pSimbolo = pSimbolo || '';
  if (splitLeft.charAt(0)==='-') {
    splitLeft=splitLeft.slice(1)
    pSimbolo='-'+pSimbolo
  }
  var valor = pSimbolo + splitLeft + splitRight;
  return valor;
}
const number=parseFloat(-25663).toFixed(2)
const result = FormatoNumero(number,"$");
console.log(result);
//console.log(typeof result);


