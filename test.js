


var auxiliar = 'NUM TRANS:INV10097239\t\t\n\n,PERIOD:Dec 2022,SUBSI:Honeycomb Holdings : Honey\n\tComb BR,IMP RET DESC:wh tax desc,TERMINOS:Net 30, ITEM [1]: 72562897-DESC:400 Watt Power Supply-QTY:1-MONTO: 200.00'
console.log("aux 1:",auxiliar)
// auxiliar = auxiliar.replace(/\r\n/g,'');
// auxiliar = auxiliar.replace(/\t/g,'');
auxiliar = auxiliar.replace(/\n/g,"");
auxiliar = auxiliar.replace(/\r/g,"");
auxiliar = auxiliar.replace(/\t/g,"");
console.log("aux 2:",auxiliar)