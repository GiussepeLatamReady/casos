# 1532 : RPT - CR Estructura y Destino de las Ventas no sale informacion
  [https://docs.google.com/document/d/11IfwECQySa2RxRgYSZXHu32V1-zCZ9SUSuNhqTZJx20/edit]


 
## change Script
Name: LatamReady - CR Estruc Ventas MPRD V2.0
id: customscript_lmry_cr_esdest_vent_mprd
File: LMRY_CR_EstrucyDest_Ventas_MPRD_V2.0.js 
## change search
Name: LatamReady - CR Sales to Free Zone Companies
id: customsearch_lmry_cr_esdest_s2

De customermain. a customer.



## change id
solo obs:
LatamReady - CR Structure and Destination of Sales
customsearch_lmry_cr_esdest_s1

Latam col - Tariff Code
{custcol_lmry_tariff_code}

LATAM COL - TARIFF CODE

invoice:
[https://tstdrv1774174.app.netsuite.com/app/accounting/transactions/custinvc.nl?id=3512676&whence=]
## Script mirror

Name: SMC - CR Estruc Ventas MPRD V2.0
id: customscript_smc_cr_esdest_vent_mprd
File: SMC_CR_EstrucyDest_Ventas_MPRD_V2.0.js 

## Smartready

Detalle técnico del error:

No se observa el campo de cabacera LATAM - FREE ZONE REGIME COMPANY? en entidad Customer debido a que no esta confgurada su visualizacion.
No se observa el campo de linea LATAM COL - TARIFF CODE en transaciones de tipo invoice y credit memo debido a no se ha instalado el bundle (EI CR by LatamReady) que contiene dicho campo.

Pasos para la ejecución del error:

El error se da al generar el reporte con la version del sin las modificaciones realizadas y sin el bundle EI CR by LatamReady instalado.

Bundle Implicados:
SuiteApp
  EI CR by LatamReady
  Declaración Mensual CR by LatamReady
Desarrollo
  LatamReady Developer CR - 1
  Latam DM CR

Búsqueda modificada: 

Name: LatamReady - CR Sales to Free Zone Companies
id: customsearch_lmry_cr_esdest_s2

Script modificado:

Name: LatamReady - CR Estruc Ventas MPRD V2.0
id: customscript_lmry_cr_esdest_vent_mprd
File: LMRY_CR_EstrucyDest_Ventas_MPRD_V2.0.js 

Especificación de la modificación:
Se cambio el identificador de la entidad CUSTOMER  de customermain a customer en el script y la busqueda.

