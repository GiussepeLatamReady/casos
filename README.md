# BR - EFD Fiscal (0450 - Informacion Complementario)
  Se requiere que dentro del 0450 solo se reconozca un solo salto de linea dentro del campo de informacion .


 
## change Script


## change id

## Script mirror
 

## Smartready
Detalle técnico del error:

En el campo 3 (TXT) del registro 0450 se detecto un salto de línea, esto ocasiona un error de formato por lo que no es posible validarlo en el sistema de gobierno.
Pasos para la ejecución del error:

Generar el reporte con la versión sin las modificaciones en los scripts correspondientes y agregar saltos de lineas o tabulaciones en algunos de los atributos del campo LATAM - ADDITIONAL INFORMATION del record LatamReady - BR Legal Additional inf.
Bundle Implicados:

Desarrollo:

Latam DM BR
SuiteApp:

Declaración Mensual BR by LatamReady
Scripts modificados:



Name: LatamReady - BR Rpt EFD Fiscal SCHDL v2
id: customscript_lmry_br_rpt_efd_fiscal_schd
File: LMRY_BR_Reporte_EFD_Fiscal_SCHDL_v2.0.js
Especificación de la modificación:

Se añadió la validación que permite remplazar tabulaciones o saltos de líneas en caso se detecte para el campo 3 (TXT) del registro 0450.

## Observation 

el campo 3 se obtiene del campo LATAM - ADDITIONAL INFORMATION del record LatamReady - BR Legal Additional inf.



