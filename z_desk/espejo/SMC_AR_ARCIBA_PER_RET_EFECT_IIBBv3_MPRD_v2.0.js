/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_AR_ARCIBA_PER_RET_EFECT_IIBBv3_MPRD_v2.0.js ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Oct 17 2019  LatamReady    Use Script 2.0           ||
\= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
 define(['N/search', 'N/log', 'N/file', "N/config", 'N/runtime', "N/format", "N/record"],

 function(search, log, fileModulo, config, runtime, format, recordModulo) {

     /**
      * Input Data for processing
      *
      * @return Array,Object,Search,File
      *
      * @since 2016.1
      */

     var objContext = runtime.getCurrentScript();

     var nameReport = "AR - ARCIBA Retenciones y Percepciones Efectuadas IIBB CABA"; //AR - ARCIBA Retenciones y Percepciones Efectuadas IIBB CABA
     var LMRY_script = "LMRY_AR_ARCIBA_PER_RET_EFECT_IIBBv3_MPRD_v2.0.js";

     var paramPeriod = null;
     var paramperiodinicio = null;
     var paramperiodfinal = null;
     var paramSubsidy = null;
     var paramRecordID = null;
     var paramMultibook = null;
     var paramLanguage = null;

     var paramFeatureTax = null;
     // paramidrpt var paramRecordID = null;
     var ArrayBills = new Array();


     // Features
     var featuresubs = null;
     var feamultibook = null;
     var featJobs = null;
     var featJobsAdvance = null;

     var fiscalDocTypeArray = new Array();
     var arrEfectuadas = new Array();
     var arrGravado = new Array();

     var strEfectuadas = '';
     var strVouchers = '';
     var strPercepciones = '';
     var strRetenciones = '';

     //variables para obtener los datos de la Subsidiaria
     var companyname = '';
     var companyruc = '';

     //Period
     var periodenddate = null;
     var periodname = '';
     var strRetencionesArciba = '';

     var filter_Feature_tax = '';
     var DataBusquedaPER = new Array();
     var DataBusquedaRET = new Array();

     //Nombre de libro contable
     var multibookName = '';
     var FolderId = '';

     function getInputData() {
         try {
             ParametrosYFeatures();
             log.debug("Parametros :",{
                paramMultibook:paramMultibook,
                paramRecordID:paramRecordID,
                paramSubsidy:paramSubsidy,
                paramPeriod:paramPeriod,
                paramperiodinicio:paramperiodinicio,
                paramperiodfinal:paramperiodfinal,
                paramFeatureTax:paramFeatureTax,
                paramLanguage:paramLanguage,
             });
             log.debug("features :",{
                featuresubs:featuresubs,
                feamultibook:feamultibook,
                featJobs:featJobs,
                featJobsAdvance:featJobsAdvance,
             });
             ObtenerDatosSubsidiaria();
             ObtenerFiscalDocumentType();
             traerCamposDeBills();
             ObtenerRetencionesEfectARCIBA();
             ObtenerPercepcionesEfectARCIBA();
             var ArrData = JuntarArreglos(DataBusquedaRET, DataBusquedaPER);

             if (ArrData.length != 0) {
                 return ArrData;
             } else {
                 //NoData();
                 log.error("No data")
             }
         } catch (error) {
             log.error('getInputData error', error);
             //libreria.sendemailTranslate(LMRY_script, ' [ getInputData ] ' + error, paramLanguage);
         }
     }


     /**
      * If this entry point is used, the map function is invoked one time for each key/value.
      *
      * @param {Object} context
      * @param {boolean} context.isRestarted - Indicates whether the current invocation represents a restart
      * @param {number} context.executionNo - Version of the bundle being installed
      * @param {Iterator} context.errors - This param contains a "iterator().each(parameters)" function
      * @param {string} context.key - The key to be processed during the current invocation
      * @param {string} context.value - The value to be processed during the current invocation
      * @param {function} context.write - This data is passed to the reduce stage
      *
      * @since 2016.1
      */
     function map(context) {
         try {
             ParametrosYFeatures();

             var key = context.key;

             var arrTemp = JSON.parse(context.value);

             log.error('arrTemp', arrTemp);

             arrTemp = arrTemp.split('|');

             var customerID;

             if(arrTemp[23] == 'PER'){
                 if (featJobs || featJobsAdvance) {
                     customerID = arrTemp[25];
                 }
             }

             if (customerID != null) {
                 var arrDataCustomer = ObtenerDataCustomer(customerID);
             }

             //0. TIPO DE OPERACION
             var columna0 = '';
             if (arrTemp[0] != null && arrTemp[0] != '- None -') {
                 columna0 = arrTemp[0];
             } else {
                 columna0 = '';
             }
             columna0 = completar_espacioDerecha(1, columna0);

             //1. CODIGO DE NORMA
             var columna1 = '';
             if (arrTemp[1] != null && arrTemp[1] != '- None -') {
                 columna1 = arrTemp[1];
             } else {
                 columna1 = '';
             }
             columna1 = completar_cero(3, columna1);

             //2. FECHA DE RETENCION/PERCEPCION
             var columna2 = '';
             if (arrTemp[2] != null && arrTemp[2] != '- None -') {
                 columna2 = arrTemp[2];
             } else {
                 columna2 = '';
             }
             columna2 = completar_espacioDerecha(10, columna2);

             //3. TIPO DE COMPROBANTE ORIGEN DE LA RETENCION
             var columna3 = '';
             if (arrTemp[3] != null && arrTemp[3] != '- None -') {
                 columna3 = arrTemp[3];
             } else {
                 columna3 = '';
             }
             columna3 = completar_espacio(2, columna3);

             //4. LETRA DEL COMPROBANTE
             var columna4 = '';
             if (arrTemp[4] != null && arrTemp[4] != '- None -') {
                 columna4 = arrTemp[4];
             } else {
                 columna4 = '';
             }
             columna4 = completar_espacioDerecha(1, columna4);

             //5. NUMERO DE COMPROBANTE
             var columna5 = '';
             if (arrTemp[5] != null && arrTemp[5] != '- None -') {
                 columna5 = arrTemp[5];
             } else {
                 columna5 = '';
             }
             columna5 = completar_cero(16, columna5);

             //6. FECHA DEL COMPROBANTE
             var columna6 = '';
             if (arrTemp[6] != null && arrTemp[6] != '- None -') {
                 columna6 = arrTemp[6];
             } else {
                 columna6 = '';
             }
             columna6 = completar_espacio(10, columna6);

             //7. MONTO DEL COMPROBANTE
             var columna7 = '';

             if (arrTemp[7] != null && arrTemp[7] != '- None -') {
                 columna7 = arrTemp[7];
             } else {
                 columna7 = '';
             }

             var paymentTC;
             if(arrTemp[23] == 'RET'){
                 paymentTC = ObtenerTCdePayment(arrTemp[26]);
                 columna7 = Number(columna7) * Number(paymentTC);
             }

             
             columna7 = completar_cero(16, (Number(columna7)).toFixed(2)).replace('.', ',');

             //8. NUMERO DE CERTIFICADO PROPIO
             var columna8 = '';
             if (arrTemp[8] != null && arrTemp[8] != '- None -') {
                 columna8 = arrTemp[8];
             } else {
                 columna8 = '';
             }
             columna8 = completar_espacio(16, columna8);

             //9. TIPO DE DOCUMENTO DEL RETENIDO
             var columna9 = '';
             if(arrTemp[23] == 'PER'){
                 if(featJobs || featJobsAdvance){
                     columna9 = arrDataCustomer[0];
                 }else{
                     if (arrTemp[9] != null && arrTemp[9] != '- None -') {
                         columna9 = arrTemp[9];
                     }else{
                         columna9 = '';
                     }
                 }
             }else{
                 if (arrTemp[9] != null && arrTemp[9] != '- None -') {
                     columna9 = arrTemp[9];
                 } else {
                     columna9 = '';
                 }
             }
             columna9 = completar_espacioDerecha(1, columna9);

             //10. NUMERO DE DOCUMENTO DEL RETENIDO
             var columna10 = '';
             if(arrTemp[23] == 'PER'){
                 if(featJobs || featJobsAdvance){
                     columna10 = arrDataCustomer[1];
                 }else{
                     if (arrTemp[10] != null && arrTemp[10] != '- None -') {
                         columna10 = arrTemp[10];
                     }else{
                         columna10 = '';
                     }
                 }
             }else{
                 if (arrTemp[10] != null && arrTemp[10] != '- None -') {
                     columna10 = arrTemp[10];
                 } else {
                     columna10 = '';
                 }
             }
             columna10 = completar_cero(11, columna10);

             //11. SITUACION IB DEL RETENIDO
             var columna11 = '';
             if(arrTemp[23] == 'PER'){
                 if(featJobs || featJobsAdvance){
                     columna11 = arrDataCustomer[2];
                 }else{
                     if (arrTemp[11] != null && arrTemp[11] != '- None -') {
                         columna11 = arrTemp[11];
                     }else{
                         columna11 = '';
                     }
                 }
             }else{
                 if (arrTemp[11] != null && arrTemp[11] != '- None -') {
                     columna11 = arrTemp[11];
                 } else {
                     columna11 = '';
                 }
             }

             columna11 = completar_espacioDerecha(1, columna11);

             //12. NUMERO INSCRIPCION IB DEL RETENIDO
             var columna12 = '';
             if(arrTemp[23] == 'PER'){
                 if(featJobs || featJobsAdvance){
                     columna12 = arrDataCustomer[3];
                 }else{
                     if (arrTemp[12] != null && arrTemp[12] != '- None -') {
                         columna12 = arrTemp[12];
                     }else{
                         columna12 = '';
                     }
                 }
             }else{
                 if (arrTemp[12] != null && arrTemp[12] != '- None -') {
                     columna12 = arrTemp[12];
                 } else {
                     columna12 = '';
                 }
             }
             columna12 = completar_cero(11, columna12);

             //13. SITUACION FRENTE AL IVA DEL RETENIDO
             var columna13 = '';
             if(arrTemp[23] == 'PER'){
                 if(featJobs || featJobsAdvance){
                     columna13 = arrDataCustomer[4];
                 }else{
                     if (arrTemp[13] != null && arrTemp[13] != '- None -') {
                         columna13 = arrTemp[13];
                     }else{
                         columna13 = '';
                     }
                 }
             }else{
                 if (arrTemp[13] != null && arrTemp[13] != '- None -') {
                     columna13 = arrTemp[13];
                 } else {
                     columna13 = '';
                 }
             }
             columna13 = completar_espacioDerecha(1, columna13);

             //14.RAZON SOCIAL DEL RETENIDO
             var columna14 = '';
             if(arrTemp[23] == 'PER'){
                 if(featJobs || featJobsAdvance){
                     columna14 = arrDataCustomer[5];
                 }else{
                     if (arrTemp[14] != null && arrTemp[14] != '- None -') {
                         columna14 = arrTemp[14];
                     }else{
                         columna14 = '';
                     }
                 }
             }else{
                 if (arrTemp[14] != null && arrTemp[14] != '- None -') {
                     columna14 = arrTemp[14];
                 } else {
                     columna14 = '';
                 }
             }

             columna14 = completar_espacio(30, columna14);

             //15. IMPORTE OTROS CONCEPTOS
             if (arrTemp[23] == 'RET') {
                 var columna15 = '';
                 if (arrTemp[15] != null && arrTemp[15] != '- None -') {
                     var montoOtrosConceptos = ObtenerOtrosConceptos(arrTemp[15], arrTemp[25]);
                     //columna15 = montoOtrosConceptos * arrTemp[24];
                     columna15 = Number(montoOtrosConceptos) * Number(paymentTC);
                 } else {
                     columna15 = 0.00;
                 }
                 columna15 = completar_cero(16, (Number(columna15)).toFixed(2)).replace('.', ',');
             } else {
                 var columna15 = '';
                 if (arrTemp[15] != null && arrTemp[15] != '- None -') {
                     columna15 = arrTemp[15];
                 } else {
                     columna15 = 0.00;
                 }
                 columna15 = completar_cero(16, (Number(columna15)).toFixed(2)).replace('.', ',');
             }

             //16. IMPORTE IVA
             if(monedaSubsiNOEsPesosArgentinos()){
                 var columna16 = '';
                 if(arrTemp[23] == 'RET'){
                     if (arrTemp[15] != null && arrTemp[15] != '- None -') {
                         if(columna4 == 'A' || columna4 == 'M'){
                             columna16 = ObtenerTaxAmountDeBill(arrTemp[15]) * Number(paymentTC);
                         }else{
                             columna16 = '';
                         }
                     }else{
                         columna16 = 0.00;
                     }
                 }else{
                     if (arrTemp[16] != null && arrTemp[16] != '- None -') {
                         if(columna4 == 'A' || columna4 == 'M'){
                             columna16 = arrTemp[16];
                         }else{
                             columna16 = '';
                         }
                     } else {
                         columna16 = '';
                     }
                 }

                 if (feamultibook || feamultibook == 'T') {
                     columna16 = completar_cero(16, Number(columna16).toFixed(2)).replace('.', ',');
                 } else {
                     columna16 = completar_cero(16, (Number(columna16)).toFixed(2)).replace('.', ',');
                 }
             }else{
                 var columna16 = '';
                 if (arrTemp[16] != null && arrTemp[16] != '- None -') {
                     if(columna4 == 'A' || columna4 == 'M'){
                         columna16 = arrTemp[16];
                     }else{
                         columna16 = '';
                     }
                 } else {
                     columna16 = '';
                 }

                 if (feamultibook || feamultibook == 'T') {
                     if(arrTemp[23] == 'RET'){
                         columna16 = completar_cero(16, (Number(columna16) * Number(paymentTC)).toFixed(2));
                     }

                     columna16 = completar_cero(16, Number(columna16).toFixed(2)).replace('.', ',');
                 } else {
                     if(arrTemp[23] == 'PER'){
                         columna16 = completar_cero(16, (Number(columna16)).toFixed(2)).replace('.', ',');
                     }else{
                         var TCBill = ObtenerTCDeBill(arrTemp[15]);
                         if(arrTemp[15] == 1450){
                             log.error('columna16', columna16);
                             log.error('TCBill', TCBill);
                             log.error('arrTemp[24]', arrTemp[24]);
                         }
                         columna16 = completar_cero(16, (Number(columna16) / TCBill * Number(arrTemp[24])).toFixed(2)).replace('.', ',');
                     }
                 }
             }

             //17. MONTO SUJETO A RETENCION/PERCEPCION
             var columna17 = '';
             if (arrTemp[17] != null && arrTemp[17] != '- None -') {
                 columna17 = arrTemp[17];
             } else {
                 columna17 = '';
             }
             
             if (feamultibook || feamultibook == 'T') {
                 if(arrTemp[23] == 'RET'){
                     columna17 = completar_cero(16, (Math.round(parseFloat(Number(columna17) * Number(paymentTC)) * 100) / 100).toFixed(2)).replace('.', ',');
                 }else{
                    columna17 = completar_cero(16, (Number(columna17)).toFixed(2)).replace('.', ',');
                 }
             } else {
                 if(arrTemp[23] == 'PER'){
                     columna17 = completar_cero(16, (Number(columna17)).toFixed(2)).replace('.', ',');
                 }else{
                     columna17 = completar_cero(16, (Math.round(parseFloat(Number(columna17) * Number(arrTemp[24])) * 100) / 100).toFixed(2)).replace('.', ',');
                 }
             }
             //18. ALICUOTA
             var columna18 = '';
             if (arrTemp[18] != null && arrTemp[18] != '- None -') {
                 columna18 = arrTemp[18];
             } else {
                 columna18 = '';
             }
             columna18 = completar_cero(5, (Number(columna18)).toFixed(2)).replace('.', ',');;

             //19. RETENCION/PERCEPCION PRACTICADA
             var columna19 = '';

             if (arrTemp[19] != null && arrTemp[19] != '- None -') {
                 columna19 = arrTemp[19];
             } else {
                 columna19 = '';
             }

             //sumar ajuste en percepciones
             if(arrTemp[23] == 'PER'){
                 columna19 = Number(columna19) + Number(arrTemp[26]);

                 columna19 = parseFloat(Math.round(parseFloat(Number(columna19)) * 100) / 100);
             }

             if (feamultibook || feamultibook == 'T') {
                 columna19 = completar_cero(16, (Number(columna19)).toFixed(2)).replace('.', ',');;
             } else {
                 if(arrTemp[23] == 'PER'){
                     columna19 = completar_cero(16, (Number(columna19)).toFixed(2)).replace('.', ',');;
                 }else{
                     columna19 = completar_cero(16, (Number(columna19) * Number(arrTemp[24])).toFixed(2)).replace('.', ',');;
                 }

             }

             //20. MONTO TOTAL RETENIDO/PERCIBIDO
             var columna20 = '';
             if (arrTemp[20] != null && arrTemp[20] != '- None -') {
                 columna20 = arrTemp[20];
             } else {
                 columna20 = '';
             }

             //sumar ajuste en percepciones
             if(arrTemp[23] == 'PER'){
                 columna20 = Number(columna20) + Number(arrTemp[26]);

                 columna20 = parseFloat(Math.round(parseFloat(Number(columna20)) * 100) / 100);
             }

             if (feamultibook || feamultibook == 'T') {
                 columna20 = completar_cero(16, (Number(columna20)).toFixed(2)).replace('.', ',');;
             } else {
                 if(arrTemp[23] == 'PER'){
                     columna20 = completar_cero(16, (Number(columna20)).toFixed(2)).replace('.', ',');;
                 }else{
                     columna20 = completar_cero(16, (Number(columna20) * Number(arrTemp[24])).toFixed(2)).replace('.', ',');;
                 }
             }

             //21. ACEPTACION
             var columna21 = '';
             if (arrTemp[21] != null && arrTemp[21] != '- None -') {
                 columna21 = arrTemp[21];
             } else {
                 columna21 = '';
             }
             columna21 = completar_espacioDerecha(1, columna21);

             //22. FECHA ACEPTACION "EXPRESA"
             var columna22 = '';
             if (arrTemp[22] != null && arrTemp[22] != '- None -') {
                 columna22 = arrTemp[22];
             } else {
                 columna22 = '';
             }
             columna22 = completar_espacio(10, columna22);


             var strARCIBAFINAL = columna0 + columna1 + columna2 + columna3 + columna4 + columna5 + columna6 + columna7 + columna8 + columna9 + columna10 + columna11 + columna12 + columna13 + columna14 + columna15 + columna16 + columna17 + columna18 + columna19 + columna20 + columna21 + columna22 + '\r\n';

             context.write({
                 key: key,
                 value: {
                     strARCIBAFINAL: strARCIBAFINAL
                 }
             });
         } catch (error) {
             log.error('map error', error);
             //libreria.sendemailTranslate(LMRY_script, ' [ map ] ' + error, paramLanguage);
         }
     }

     function monedaSubsiNOEsPesosArgentinos() {
         var subsidyLookUp = search.lookupFields({
             type: search.Type.SUBSIDIARY,
             id: paramSubsidy,
             columns: ['currency']
         });

         var currencyLookUp = search.lookupFields({
             type: search.Type.CURRENCY,
             id: (subsidyLookUp.currency)[0].value,
             columns: ['symbol']
         });

         return currencyLookUp.symbol != 'ARS';
     }

     function ObtenerTCDeBill(BillID) {
         var transactionSearchObj = search.create({
             type: "transaction",
             filters: [
                 ["internalidnumber", "equalto", BillID], "AND",
                 ["mainline", "is", 'T']
             ],
             columns: [
                 search.createColumn({
                     name: "exchangerate",
                     summary: 'GROUP',
                     label: "Exchange Rate"
                 })
             ],
             settings: [{
                 name: 'consolidationtype',
                 value: 'NONE'
             }]
         });

         var searchresult = transactionSearchObj.run();

         var objResult = searchresult.getRange(0, 1000);

         var intLength = objResult.length;

         var TC_Bill = 0;

         for (var i = 0; i < intLength; i++) {
             var columns = objResult[i].columns;

             TC_Bill = objResult[i].getValue(columns[0]);
         }

         return TC_Bill;
     }

     function ObtenerTaxAmountDeBill(BillID) {
         if (feamultibook) {
             var transactionSearchObj = search.create({
                 type: "transaction",
                 filters: [
                     ["internalidnumber", "equalto", BillID], "AND",
                     ["taxline", "is", 'T'], "AND",
                     ["accountingtransaction.accountingbook", "anyof", paramMultibook]
                 ],
                 columns: [
                     search.createColumn({
                         name: "formulacurrency",
                         formula: "{accountingtransaction.amount}",
                         summary: 'SUM',
                         label: "Tax Amount"
                     }),
                     search.createColumn({
                         name: "exchangerate",
                         join: 'accountingtransaction',
                         summary: 'GROUP',
                         label: "Exchange Rate"
                     })
                 ],
                 settings: [{
                     name: 'consolidationtype',
                     value: 'NONE'
                 }]
             });
         } else {
             var transactionSearchObj = search.create({
                 type: "transaction",
                 filters: [
                     ["internalidnumber", "equalto", BillID], "AND",
                     ["taxline", "is", 'T']
                 ],
                 columns: [
                     search.createColumn({
                         name: "formulacurrency",
                         formula: "{accountingtransaction.amount}",
                         summary: 'SUM',
                         label: "Tax Amount"
                     }),
                     search.createColumn({
                         name: "exchangerate",
                         summary: 'GROUP',
                         label: "Exchange Rate"
                     })
                 ],
                 settings: [{
                     name: 'consolidationtype',
                     value: 'NONE'
                 }]
             });
         }

         var searchresult = transactionSearchObj.run();

         var objResult = searchresult.getRange(0, 1000);

         var intLength = objResult.length;

         var monto_15 = 0;

         var TC_Bill = 0;

         for (var i = 0; i < intLength; i++) {
             var columns = objResult[i].columns;
             TC_Bill = objResult[i].getValue(columns[1]);
             monto_15 = Number(monto_15) + Number(objResult[i].getValue(columns[0]));
         }

         monto_15 = monto_15 / TC_Bill;

         return monto_15;
     }

     /**
      * If this entry point is used, the reduce function is invoked one time for
      * each key and list of values provided..
      *
      * @param {Object} context
      * @param {boolean} context.isRestarted - Indicates whether the current invocation of the represents a restart.
      * @param {number} context.concurrency - The maximum concurrency number when running the map/reduce script.
      * @param {Date} 0context.datecreated - The time and day when the script began running.
      * @param {number} context.seconds - The total number of seconds that elapsed during the processing of the script.
      * @param {number} context.usage - TThe total number of usage units consumed during the processing of the script.
      * @param {number} context.yields - The total number of yields that occurred during the processing of the script.
      * @param {Object} context.inputSummary - Object that contains data about the input stage.
      * @param {Object} context.mapSummary - Object that contains data about the map stage.
      * @param {Object} context.reduceSummary - Object that contains data about the reduce stage.
      * @param {Iterator} context.output - This param contains a "iterator().each(parameters)" function
      *
      * @since 2016.1
      */
     function summarize(context) {
         try {
             ParametrosYFeatures();

             ObtenerDatosSubsidiaria();

             var text = '';

             var arrArciba = new Array();

             var contador_lineas = 0;
             var contador_archivo = 0;

             context.output.iterator().each(function(key, value) {

                 var obj = JSON.parse(value);

                 arrArciba.push(obj.strARCIBAFINAL);

                 contador_lineas++;

                 if(contador_lineas % 10000 == 0){
                     contador_archivo++;

                     OrdenarArray(arrArciba);

                     for (var i = 0; i < arrArciba.length; i++) {
                         text += arrArciba[i];
                     }

                     savefile(text, contador_archivo);

                     arrArciba = [];
                 }

                 return true;
             });

             OrdenarArray(arrArciba);

             for (var i = 0; i < arrArciba.length; i++) {
                 text += arrArciba[i];
             }

             if (arrArciba.length != 0) {
                 savefile(text, contador_archivo);
             } else {
                log.error ("no data")
                 //NoData();
             }
         } catch (error) {
             log.error('summarize error', error);
             //libreria.sendemailTranslate(LMRY_script, ' [ summarize ] ' + error, paramLanguage);
         }
     }

     function ObtenerDataCustomer(customerID) {
         var customerSearch = search.create({
            type: "customer",
            filters:
            [
               ["internalidnumber","equalto",customerID]
            ],
            columns:
            [
               search.createColumn({
                  name: "formulatext",
                  formula: "case when {custentity_lmry_sunat_tipo_doc_cod} = '80' then '3' WHEN {custentity_lmry_sunat_tipo_doc_cod} = '86' THEN '2' WHEN {custentity_lmry_sunat_tipo_doc_cod} = '87' THEN '1' ELSE '' END",
                  label: "0. Tipo de documento del Retenido"
               }),
               search.createColumn({
                  name: "formulatext",
                  formula: "CONCAT({vatregnumber},{custentity_lmry_digito_verificator})",
                  label: "1. Nro de documento del Retenido"
               }),
               search.createColumn({
                  name: "formulatext",
                  formula: "{custentity_lmry_ar_cod_situaci_ib_arciba}",
                  label: "2.Situación IB del Retenido"
               }),
               search.createColumn({
                  name: "formulatext",
                  formula: " case when {custentity_lmry_ar_cod_situaci_ib_arciba} = '4' then '00000000000' WHEN ({custentity_lmry_ar_cod_situaci_ib_arciba} = '1' or {custentity_lmry_ar_cod_situaci_ib_arciba} = '5') THEN NVL({custentity_lmry_ar_num_inscripcion_sf},'') WHEN {custentity_lmry_ar_cod_situaci_ib_arciba} = '2' THEN NVL({custentity_lmry_ar_num_inscripcion_cm},'')  ELSE '' END",
                  label: "3. Nro Inscripción IB del Retenido"
               }),
               search.createColumn({
                  name: "formulatext",
                  formula: "{custentity_lmry_ar_cod_situac_iva_arciba}",
                  label: "4. Situación frente al IVA del Retenido"
               }),
               search.createColumn({
                  name: "formulatext",
                  formula: "CASE WHEN {isperson} = 'T' THEN CONCAT({firstname}, CONCAT(' ', {lastname})) ELSE {companyname} END",
                  label: "5. Razón Social del Retenido"
               })
            ]
         });

         var searchResult = customerSearch.run();

         var arrReturn = [];

         var objResult;

         var intDMinReg = 0;

         var intDMaxReg = 1000;

         var DbolStop = false;

         while (!DbolStop) {
             var objResult = searchResult.getRange(intDMinReg, intDMaxReg);
             if (objResult != null) {
                 if (objResult.length != 1000) {
                     DbolStop = true;
                 }

                 for (var i = 0; i < objResult.length; i++) {
                     var columns = objResult[i].columns;

                     var rowArray = [];

                     // 0. Tipo de documento del Retenido
                     if (objResult[i].getValue(columns[0]) != null && objResult[i].getValue(columns[0]) != '- None -')
                         rowArray[0] = objResult[i].getValue(columns[0]);
                     else
                         rowArray[0] = '';

                     // 0. Tipo de documento del Retenido
                     if (objResult[i].getValue(columns[1]) != null && objResult[i].getValue(columns[1]) != '- None -')
                         rowArray[1] = objResult[i].getValue(columns[1]);
                     else
                         rowArray[1] = '';

                     // 0. Tipo de documento del Retenido
                     if (objResult[i].getValue(columns[2]) != null && objResult[i].getValue(columns[2]) != '- None -')
                         rowArray[2] = objResult[i].getValue(columns[2]);
                     else
                         rowArray[2] = '';

                     // 0. Tipo de documento del Retenido
                     if (objResult[i].getValue(columns[3]) != null && objResult[i].getValue(columns[3]) != '- None -')
                         rowArray[3] = objResult[i].getValue(columns[3]);
                     else
                         rowArray[3] = '';

                     // 0. Tipo de documento del Retenido
                     if (objResult[i].getValue(columns[4]) != null && objResult[i].getValue(columns[4]) != '- None -')
                         rowArray[4] = objResult[i].getValue(columns[4]);
                     else
                         rowArray[4] = '';

                     // 0. Tipo de documento del Retenido
                     if (objResult[i].getValue(columns[5]) != null && objResult[i].getValue(columns[5]) != '- None -')
                         rowArray[5] = objResult[i].getValue(columns[5]);
                     else
                         rowArray[5] = '';

                     arrReturn.push(rowArray);
                 }

             } else {
                 DbolStop = true;
             }
         }

         return arrReturn[0];
     }

     function ObtenerTCdePayment(paymentID) {
         // var paymentRecord = search.lookupFields({
         //     type: 'vendorpayment',
         //     id: paymentID,
         //     columns: ['accountingtransaction.exchangerate']
         // });

         // log.error('tipo de cambio de payment: ' + paymentID, paymentRecord['accountingtransaction.exchangerate'][0]);

         if(feamultibook){
             var vendorPaymentSearchObj = search.create({
                 type: "vendorpayment",
                 filters: [
                     ["internalidnumber", "equalto", paymentID],
                     "AND",
                     ["mainline", "is", 'T'],
                     "AND",
                     ["accountingtransaction.accountingbook", "is", paramMultibook]
                 ],
                 columns: [
                     search.createColumn({
                         name: "formulanumeric",
                         formula: "{accountingtransaction.exchangerate}",
                         label: "Multibook Exchange Rate"
                     })
                 ]
             });
         }else{
             var vendorPaymentSearchObj = search.create({
                 type: "vendorpayment",
                 filters: [
                     ["internalidnumber", "equalto", paymentID],
                     "AND",
                     ["mainline", "is", 'T']
                 ],
                 columns: [
                     search.createColumn({
                         name: "formulanumeric",
                         formula: "{exchangerate}",
                         label: "Exchange Rate"
                     })
                 ]
             });
         }

         var searchResult = vendorPaymentSearchObj.run();

         var arrReturn = [];

         var objResult;

         var intDMinReg = 0;

         var intDMaxReg = 1000;

         var DbolStop = false;

         while (!DbolStop) {
             var objResult = searchResult.getRange(intDMinReg, intDMaxReg);
             if (objResult != null) {
                 if (objResult.length != 1000) {
                     DbolStop = true;
                 }

                 for (var i = 0; i < objResult.length; i++) {
                     var columns = objResult[i].columns;

                     var rowArray = [];

                     //0. Internal id
                     if (objResult[i].getValue(columns[0]) != null && objResult[i].getValue(columns[0]) != '- None -')
                         rowArray[0] = objResult[i].getValue(columns[0]);
                     else
                         rowArray[0] = '';

                     arrReturn.push(rowArray);
                 }

             } else {
                 DbolStop = true;
             }
         }

         return arrReturn[0][0];
     }

     function OrdenarArray(arrEfectuadas) {
         for (var i = 0; i < arrEfectuadas.length; i++) {
             for (var j = 0; j < arrEfectuadas.length - 1; j++) {
                 if (compare_dates(arrEfectuadas[j].substring(4, 14), arrEfectuadas[j + 1].substring(4, 14))) {
                     aux = arrEfectuadas[j + 1];
                     arrEfectuadas[j + 1] = arrEfectuadas[j];
                     arrEfectuadas[j] = aux;
                 }
             }
         }
     }

     function compare_dates(fecha, fecha2) {
         var xMonth = fecha.substring(3, 5);
         var xDay = fecha.substring(0, 2);
         var xYear = fecha.substring(6, 10);

         var yMonth = fecha2.substring(3, 5);
         var yDay = fecha2.substring(0, 2);
         var yYear = fecha2.substring(6, 10);

         if (xYear > yYear) {
             return true;
         } else {
             if (xYear == yYear) {
                 if (xMonth > yMonth) {
                     return true;
                 } else {
                     if (xMonth == yMonth) {
                         if (xDay > yDay)
                             return true;
                         else
                             return false;
                     } else
                         return false;
                 }
             } else
                 return false;
         }
     }

     function ObtenerOtrosConceptos(billID, whtDetailID) {
         //Obtener Clase Contributiva del WHT Detail
         var whtdetail = search.lookupFields({
             type: 'customrecord_lmry_wht_details',
             id: whtDetailID,
             columns: ['custrecord_lmry_whtdet_contribclass', 'custrecord_lmry_wht_nationaltax']
         });

         if ((whtdetail.custrecord_lmry_whtdet_contribclass).length != 0) {
             var contributoryClassID = (whtdetail.custrecord_lmry_whtdet_contribclass)[0].value;

             //Obtener Tax Code de la Clase Contributiva
             var contributoryClass = search.lookupFields({
                 type: 'customrecord_lmry_ar_contrib_class',
                 id: contributoryClassID,
                 columns: ['custrecord_lmry_ccl_taxcode_group']
             });
             log.debug("customrecord_lmry_ar_contrib_class", contributoryClass)
             var CC_NombreTax = (contributoryClass.custrecord_lmry_ccl_taxcode_group)[0].text;
         } else {
             var nationalTaxID = (whtdetail.custrecord_lmry_wht_nationaltax)[0].value;

             //Obtener Tax Code de National Tax
             var nationalTax = search.lookupFields({
                 type: 'customrecord_lmry_national_taxes',
                 id: nationalTaxID,
                 columns: ['custrecord_lmry_ntax_taxcode_group']
             });
             log.debug("customrecord_lmry_national_taxes", nationalTax)
             var CC_NombreTax = (nationalTax.custrecord_lmry_ntax_taxcode_group)[0].text;
         }

         var CC_nombresTaxes = CC_NombreTax.split(' y ');

         //arrGravado
         var arrAfecto = new Array();

         for (var i = 0; i < arrGravado.length; i++) {
             for (var j = 0; j < CC_nombresTaxes.length; j++) {
                 if (arrGravado[i][0] == CC_nombresTaxes[j]) {
                     arrAfecto.push(arrGravado[i]);
                     break;
                 }
             }
         }

         var monto = 0.00;

         //Obtener Detalle del Vendor Bill
         var objRecord = recordModulo.load({
             type: recordModulo.Type.VENDOR_BILL,
             id: billID,
             isDynamic: true
         });

         var numLines = objRecord.getLineCount({
             sublistId: 'item'
         });

         for (var i = 0; i < numLines; i++) {
             var amount_temp = objRecord.getSublistValue({
                 sublistId: 'item',
                 fieldId: 'amount',
                 line: i
             });

             var taxcode_temp = objRecord.getSublistValue({
                 sublistId: 'item',
                 fieldId: 'taxcode',
                 line: i
             });

             if (arrAfecto.length != 0) {
                 for (var j = 0; j < arrAfecto.length; j++) {
                     if (arrAfecto[j][1] == taxcode_temp) {
                         break;
                     }

                     if (j == arrAfecto.length - 1) {
                         monto += amount_temp;
                     }
                 }
             } else {
                 monto += amount_temp;
             }
         }

         return monto;
     }

     function lengthInUtf8Bytes(str) {
         var m = encodeURIComponent(str).match(/%[89ABab]/g);
         return str.length + (m ? m.length : 0);
     }

     function compare_dates(fecha, fecha2) {
         var xMonth = fecha.substring(3, 5);
         var xDay = fecha.substring(0, 2);
         var xYear = fecha.substring(6, 10);

         var yMonth = fecha2.substring(3, 5);
         var yDay = fecha2.substring(0, 2);
         var yYear = fecha2.substring(6, 10);

         if (xYear > yYear) {
             return true;
         } else {
             if (xYear == yYear) {
                 if (xMonth > yMonth) {
                     return true;
                 } else {
                     if (xMonth == yMonth) {
                         if (xDay > yDay)
                             return true;
                         else
                             return false;
                     } else
                         return false;
                 }
             } else
                 return false;
         }
     }

     function ConvertirArrToStr(arrTemp) {
         var strReturn = '';

         for (var i = 0; i < arrTemp.length; i++) {
             strReturn += arrTemp[i];
             strReturn += '\r\n';
         }

         return strReturn;
     }

     function traerCamposDeBills() {
         var intDMinReg = 0;
         var intDMaxReg = intDMinReg + 1000;
         var DbolStop = false;
         var vendorbillSearchObj = search.create({
             type: "vendorbill",
             filters: [
                 ["applyingtransaction.internalidnumber", "isnotempty", ""],
                 "AND",
                 ["type", "anyof", "VendBill"],
                 "AND",
                 ["applyingtransaction.type", "anyof", "VendCred"],
                 "AND",
                 ["applyingtransaction.postingperiod", "abs", paramPeriod],
                 "AND",
                 ["applyingtransaction.subsidiary", "anyof", paramSubsidy],
                 "AND",
                 ["applyingtransaction.mainline", "is", "T"],
                 "AND",
                 ["applyingtransaction.memorized", "is", "F"],
                 "AND",
                 ["applyingtransaction.voided", "is", "F"],
                 "AND",
                 ["applyingtransaction.posting", "is", "T"],
                 "AND",
                 ["applyingtransaction.accounttype", "noneof", "Bank"]
             ],
             columns: [
                 search.createColumn({
                     name: "internalid",
                     label: "Internal ID"
                 }),
                 search.createColumn({
                     name: "appliedtotransaction",
                     label: "Applied To Transaction"
                 }),
                 search.createColumn({
                     name: "internalid",
                     join: "applyingTransaction",
                     label: "Internal ID"
                 }),
                 search.createColumn({
                     name: "formulatext",
                     formula: "{custrecord_lmry_ar_transaction_related.custrecord_lmry_ar_acceptation.id}",
                     label: "Formula (Text)"
                 }),
                 search.createColumn({
                     name: "formulatext",
                     formula: "TO_CHAR({custrecord_lmry_ar_transaction_related.custrecord_lmry_ar_acceptation_date},'DD/MM/YYYY')",
                     label: "Formula (Text)"
                 })
             ]
         });

         var searchResult = vendorbillSearchObj.run();
         var rowArray = [];
         var objResult;

         while (!DbolStop) {
             var objResult = searchResult.getRange(intDMinReg, intDMaxReg);
             if (objResult != null) {
                 if (objResult.length != 1000) {
                     DbolStop = true;
                 }

                 for (var i = 0; i < objResult.length; i++) {
                     var columns = objResult[i].columns;
                     rowArray = [];

                     //0. Internal id
                     if (objResult[i].getValue(columns[0]) != null && objResult[i].getValue(columns[0]) != '- None -')
                         rowArray[0] = objResult[i].getValue(columns[0]);
                     else
                         rowArray[0] = '';

                     //1. Internal id del payment
                     if (objResult[i].getValue(columns[2]) != null && objResult[i].getValue(columns[2]) != '- None -')
                         rowArray[1] = objResult[i].getValue(columns[2]);
                     else
                         rowArray[1] = '';

                     //2. Campo de Aceptacion
                     if (objResult[i].getValue(columns[3]) != null && objResult[i].getValue(columns[3]) != '- None -')
                         rowArray[2] = objResult[i].getValue(columns[3]);
                     else
                         rowArray[2] = '';

                     //2. Fecha de Aceptacion
                     if (objResult[i].getValue(columns[4]) != null && objResult[i].getValue(columns[4]) != '- None -')
                         rowArray[3] = objResult[i].getValue(columns[4]);
                     else
                         rowArray[3] = '';

                     ArrayBills.push(rowArray);
                 }

             } else {
                 DbolStop = true;
             }
         }

     }

     function ObtenerRetencionesEfectARCIBA() {
         var intDMinReg = 0;
         var intDMaxReg = 1000;

         var DbolStop = false;
         var ArrReturn = new Array();
         var cont = 0;
         var infoTxt = '';

         var savedSearch = search.load({
             id: 'customsearch_lmry_ar_wht_done_iibb_caba'
         });

         if (featuresubs) {
             var subsidiaryFilter = search.createFilter({
                 name: 'subsidiary',
                 operator: search.Operator.IS,
                 values: [paramSubsidy]
             });
             savedSearch.filters.push(subsidiaryFilter);
         }

         if (paramperiodinicio != null && paramperiodinicio != '') {
             var fechInicioFilter = search.createFilter({
                 name: 'trandate',
                 operator: search.Operator.ONORAFTER,
                 values: [paramperiodinicio]
             });
             savedSearch.filters.push(fechInicioFilter);
         }

         if (paramperiodfinal != null && paramperiodfinal != '') {
             var fechFinFilter = search.createFilter({
                 name: 'trandate',
                 operator: search.Operator.ONORBEFORE,
                 values: [paramperiodfinal]
             });
             savedSearch.filters.push(fechFinFilter);
         }

         if ((paramperiodinicio == null || paramperiodinicio == '') && (paramperiodfinal == null || paramperiodfinal == '')) {
             var periodFilter = search.createFilter({
                 name: 'postingperiod',
                 operator: search.Operator.IS,
                 values: [paramPeriod]
             });
             savedSearch.filters.push(periodFilter);
         }

         var invoiceAppMainLineFilter = search.createFilter({
             name: 'mainline',
             join: 'custbody_lmry_invoice_applied',
             operator: search.Operator.IS,
             values: [true]
         });

         savedSearch.filters.push(invoiceAppMainLineFilter);

         var referenceAppMainLineFilter = search.createFilter({
             name: 'mainline',
             join: 'custbody_lmry_reference_transaction',
             operator: search.Operator.IS,
             values: [true]
         });

         savedSearch.filters.push(referenceAppMainLineFilter);

         //columna22
         var internalid = search.createColumn({
             name: 'internalid'
         });
         savedSearch.columns.push(internalid);

         //COLUMNA 23
         //CERTIFICADO DE RETENCION VOUCHER {custbody_lmry_wht_details.custrecord_lmry_wht_voucher}
         var columna23 = search.createColumn({
             name: 'formulatext',
             formula: '{custbody_lmry_wht_details.custrecord_lmry_wht_voucher}'
         });
         savedSearch.columns.push(columna23);

         if (feamultibook) {
             var multibookFilter = search.createFilter({
                 name: 'accountingbook',
                 join: 'accountingtransaction',
                 operator: search.Operator.IS,
                 values: [paramMultibook]
             });
             savedSearch.filters.push(multibookFilter);

             //columna  24
             var exchangeRateMultibookColumn = search.createColumn({
                 name: 'formulanumeric',
                 formula: '{accountingtransaction.exchangerate}'
             });
             savedSearch.columns.push(exchangeRateMultibookColumn);

             //columna  25
             var exchangeRate2MultibookColumn = search.createColumn({
                 name: 'formulanumeric',
                 formula: '{custbody_lmry_invoice_applied.exchangerate}'
             });
             savedSearch.columns.push(exchangeRate2MultibookColumn);

             //columna  26
             var amountBill = search.createColumn({
                 name: 'formulacurrency',
                 formula: 'ABS({accountingtransaction.amount})'
             });
             savedSearch.columns.push(amountBill);

         }

         //columna  27
         var whtDetail = search.createColumn({
             name: 'formulanumeric',
             formula: '{custbody_lmry_wht_details.internalid}'
         });
         savedSearch.columns.push(whtDetail);

         //columna 28
         var paymentID = search.createColumn({
             name: 'formulanumeric',
             formula: '{custbody_lmry_reference_transaction.internalid}'
         });
         savedSearch.columns.push(paymentID);

         var searchresult = savedSearch.run();
         var Data = '';
         while (!DbolStop) {
             var objResult = searchresult.getRange(intDMinReg, intDMaxReg);

             if (objResult != null) {

                 if (objResult.length != 1000) {
                     DbolStop = true;
                 }

                 var intLength = objResult.length;

                 for (var i = 0; i < intLength; i++) {

                     var columns = objResult[i].columns;

                     var arr = new Array();


                     //0. TIPO DE OPERACION
                     var Data0 = objResult[i].getValue(columns[1]);

                     //1. CODIGO DE NORMA
                     var Data1 = objResult[i].getValue(columns[2]);

                     //2. FECHA DE RETENCION/PERCEPCION
                     var Data2 = objResult[i].getValue(columns[3]);

                     //3. TIPO DE COMPROBANTE ORIGEN DE LA RETENCION

                     posFiscalDocType = BuscarFiscalDocumentType(objResult[i].getValue(columns[4]));

                     var flag_letra_empty = false;

                     if (fiscalDocTypeArray[posFiscalDocType][1] != null && fiscalDocTypeArray[posFiscalDocType][1] != '- None -' && fiscalDocTypeArray[posFiscalDocType][1] != '') {
                         var tipoDocumentoar = fiscalDocTypeArray[posFiscalDocType][1];
                         var tipoDocumento = fiscalDocTypeArray[posFiscalDocType][3];

                         if(tipoDocumento == '002' || tipoDocumento == '007' || tipoDocumento == '012' ||
                             tipoDocumento == '202' || tipoDocumento == '207' || tipoDocumento == '212'){
                             flag_letra_empty = true;
                         }
                         if (tipoDocumentoar == '04') {
                             tipoDocumentoar = '02';
                         } else if (tipoDocumentoar == '02') {
                             tipoDocumentoar = '07';
                         } else if (tipoDocumentoar == '01') {
                             if (tipoDocumento == '083') {
                                 tipoDocumentoar = '09';
                             } else if (tipoDocumento == '115') {
                                 tipoDocumentoar = '02';
                             } else if (tipoDocumento == '116') {
                                 tipoDocumentoar = '02';
                             } else if (tipoDocumento == '117') {
                                 tipoDocumentoar = '02';
                             } else if (tipoDocumento == '120') {
                                 tipoDocumentoar = '02';
                             } else {
                                 tipoDocumentoar = '01';
                             }
                         } else if (tipoDocumentoar == '17') {
                             tipoDocumentoar = '05';
                         } else if (tipoDocumentoar == '18') {
                             tipoDocumentoar = '05';
                         } else if (tipoDocumentoar == '05') {
                             if (tipoDocumento == '332') {
                                 tipoDocumentoar = '06';
                             } else if (tipoDocumento == '033') {
                                 tipoDocumentoar = '05';
                             } else if (tipoDocumento == '022') {
                                 tipoDocumentoar = '01';
                             } else if (tipoDocumento == '331') {
                                 tipoDocumentoar = '05';
                             } else if (tipoDocumento == '027') {
                                 tipoDocumentoar = '05';
                             } else if (tipoDocumento == '028') {
                                 tipoDocumentoar = '05';
                             } else if (tipoDocumento == '029') {
                                 tipoDocumentoar = '05';
                             } else if (tipoDocumento == '063') {
                                 tipoDocumentoar = '05';
                             } else if (tipoDocumento == '064') {
                                 tipoDocumentoar = '05';
                             } else if (tipoDocumento == '059') {
                                 tipoDocumentoar = '05';
                             } else if (tipoDocumento == '050') {
                                 tipoDocumentoar = '01';
                             } else if (tipoDocumento == '070') {
                                 tipoDocumentoar = '01';
                             } else {
                                 tipoDocumentoar = '09';
                             }
                         }

                         if (tipoDocumentoar != '01' && tipoDocumentoar != '02' && tipoDocumentoar != '03' && tipoDocumentoar != '04' && tipoDocumentoar != '05' &&
                             tipoDocumentoar != '06' && tipoDocumentoar != '07' && tipoDocumentoar != '08' && tipoDocumentoar != '09' && tipoDocumentoar != '10' &&
                             tipoDocumentoar != '11' && tipoDocumentoar != '12' && tipoDocumentoar != '13') {
                             tipoDocumentoar = '09';
                         }
                         var Data3 = completar_espacio(2, tipoDocumentoar);
                     } else {
                         var Data3 = completar_espacio(2, '');
                     }

                     //4. LETRA DEL COMPROBANTE
                     if(flag_letra_empty){
                         var Data4 = completar_espacio(1, '');
                     }else{
                         if (fiscalDocTypeArray[posFiscalDocType][2] != null && fiscalDocTypeArray[posFiscalDocType][2] != '- None -') {
                             var Data4 = completar_espacio(1, fiscalDocTypeArray[posFiscalDocType][2]);
                         } else {
                             var Data4 = completar_espacio(1, '');
                         }
                     }


                     //5. NUMERO DE COMPROBANTE
                     var Data5 = objResult[i].getValue(columns[5]);

                     //6. FECHA DEL COMPROBANTE
                     var Data6 = objResult[i].getValue(columns[6]);

                     //7. MONTO DEL COMPROBANTE
                     var Data7 = Number(objResult[i].getValue(columns[7])).toFixed(2);

                     //8. NUMERO DE CERTIFICADO PROPIO(COLUMNA POR SCRIPT)
                     if (objResult[i].getValue(columns[23]) != null && objResult[i].getValue(columns[23]) != '- None -') {
                         var n = Number(objResult[i].getValue(columns[23]));

                         var comprobante = search.lookupFields({
                             type: 'customrecord_lmry_ar_comproban_retencion',
                             id: n,
                             columns: ['custrecord_lmry_ar_serie_retencion', 'custrecord_lmry_ar_comp_retencion']
                         });


                         var SerieComprobante = comprobante.custrecord_lmry_ar_serie_retencion;

                         var NumeroComprobante = comprobante.custrecord_lmry_ar_comp_retencion;

                         var Data8 = SerieComprobante + NumeroComprobante;
                     } else {
                         var Data8 = completar_cero(12, '');
                     }


                     var Data8 = objResult[i].getValue(columns[23]);

                     //9. TIPO DE DOCUMENTO DEL RETENIDO
                     var Data9 = objResult[i].getValue(columns[8]);

                     //10. NUMERO DE DOCUMENTO DEL RETENIDO
                     var Data10 = objResult[i].getValue(columns[9]);

                     //11. SITUACION IB DEL RETENIDO
                     var Data11 = objResult[i].getValue(columns[10]);

                     //12. NUMERO INSCRIPCION IB DEL RETENIDO
                     var Data12 = objResult[i].getValue(columns[11]);

                     //13. SITUACION FRENTE AL IVA DEL RETENIDO
                     var Data13 = objResult[i].getValue(columns[12]);

                     //14. RAZON SOCIAL DEL RETENIDO
                     var Data14 = objResult[i].getValue(columns[13]);

                     //15. IMPORTE OTROS CONCEPTOS (INTERNAL ID BILL ASOCIADO)
                     var Data15 = objResult[i].getValue(columns[14]);

                     if (feamultibook || feamultibook == 'T') {
                         //16. IMPORTE IVA
                         if (objResult[i].getValue(columns[15]) != '' && objResult[i].getValue(columns[15]) != null) {
                             var calculo = ((Number(objResult[i].getValue(columns[15])) / Number(objResult[i].getValue(columns[25])))).toFixed(2);
                             var Data16 = calculo //.replace('.', ',');
                         } else {
                             var Data16 = '0.00'
                         }

                         //17. MONTO SUJETO A RETENCION/PERCEPCION
                         if (objResult[i].getValue(columns[16]) != '' && objResult[i].getValue(columns[16]) != null) {
                             var calculo = (Number(objResult[i].getValue(columns[16]))).toFixed(2);
                             var Data17 = calculo;
                         } else {
                             var Data17 = '0.00'
                         }
                     } else {
                         //16. IMPORTE IVA
                         if (objResult[i].getValue(columns[15]) != '' && objResult[i].getValue(columns[15]) != null) {
                             var Data16 = Number(objResult[i].getValue(columns[15]));
                         } else {
                             var Data16 = '0.00'
                         }

                         //17. MONTO SUJETO A RETENCION/PERCEPCION
                         if (objResult[i].getValue(columns[16]) != '' && objResult[i].getValue(columns[16]) != null) {
                             //var Data17 = (Number(objResult[i].getValue(columns[16]))).toFixed(2);
                             var Data17 = (Number(objResult[i].getValue(columns[16]))).toFixed(2);
                         } else {
                             var Data17 = '0.00'
                         }
                     }

                     //18. ALICUOTA
                     var Data18 = (Number(objResult[i].getValue(columns[17]).replace('%', '')).toFixed(2)) //.replace('.', ',');

                     if (feamultibook || feamultibook == 'T') {
                         //19. RETENCION/PERCEPCION PRACTICADA
                         if (objResult[i].getValue(columns[18]) != '' && objResult[i].getValue(columns[18]) != null) {
                             //var calculo = ((Number(objResult[i].getValue(columns[26]))) * Number(objResult[i].getValue(columns[24]))).toFixed(2);
                             var calculo = (Number(objResult[i].getValue(columns[26]))).toFixed(2);
                             var Data19 = calculo //.replace('.', ',');
                         } else {
                             var Data19 = '0.00'
                         }

                         //20. MONTO TOTAL RETENIDO/PERCIBIDO
                         if (objResult[i].getValue(columns[19]) != '' && objResult[i].getValue(columns[19]) != null) {
                             //var calculo = (Number(objResult[i].getValue(columns[26])) * Number(objResult[i].getValue(columns[24]))).toFixed(2);
                             var calculo = (Number(objResult[i].getValue(columns[26]))).toFixed(2);
                             var Data20 = calculo //.replace('.', ',');
                         } else {
                             var Data20 = '0.00'
                         }
                     } else {
                         //19. RETENCION/PERCEPCION PRACTICADA
                         if (objResult[i].getValue(columns[18]) != '' && objResult[i].getValue(columns[18]) != null) {
                             //var Data19 = (completar_cero(16, ((Number(objResult[i].getValue(columns[18])) * objResult[i].getValue(columns[20]))).toFixed(2)))//.replace('.', ',');
                             var Data19 = Number(objResult[i].getValue(columns[18])) / Number(objResult[i].getValue(columns[21]))
                         } else {
                             var Data19 = '0.00'
                         }

                         //20. MONTO TOTAL RETENIDO/PERCIBIDO
                         if (objResult[i].getValue(columns[19]) != '' && objResult[i].getValue(columns[19]) != null) {
                             var Data20 = Number(objResult[i].getValue(columns[19])) / Number(objResult[i].getValue(columns[21]))
                         } else {
                             var Data20 = '0.00'
                         }
                     }

                     var Data21 = '';
                     var Data22 = '';

                     // 21. ACEPTACION
                     if (Data3 == '10' || Data3 == '11' || Data3 == '12' || Data3 == '13') {
                         for (var a = 0; a < ArrayBills.length; a++) {

                             if (objResult[i].getValue(columns[22]) == ArrayBills[a][1]) {
                                 Data21 = '' + ArrayBills[a][2];
                                 if (Data21 == '1') {
                                     Data21 = completar_espacio(1, 'E');
                                 } else if (Data21 == '2') {
                                     Data21 = completar_espacio(1, 'T');
                                 } else {
                                     Data21 = completar_espacio(1, '');
                                 }
                             }

                             // 22. FECHA ACEPTACION EXPRESA
                             if (Data21 == 'E') {
                                 Data22 = completar_espacio(10, '' + ArrayBills[a][3]);

                             } else {
                                 Data22 = completar_espacio(10, '');
                             }
                             if (Data21 != '') {
                                 break;
                             }
                         }
                     } else {
                         Data21 = completar_espacio(1, '');
                         Data22 = completar_espacio(10, '');
                     }

                     var Data23 = 'RET';

                     var Data24 = objResult[i].getValue(columns[21]);

                     if (feamultibook || feamultibook == 'T') {
                         var Data25 = objResult[i].getValue(columns[27]);
                         var Data26 = objResult[i].getValue(columns[28]);
                     } else {
                         var Data25 = objResult[i].getValue(columns[24]);
                         var Data26 = objResult[i].getValue(columns[25]);
                     }

                     Data = Data0 + '|' + Data1 + '|' + Data2 + '|' + Data3 + '|' + Data4 + '|' + Data5 + '|' + Data6 + '|' + Data7 + '|' + Data8 + '|' + Data9 + '|' + Data10 + '|' + Data11 + '|' + Data12 + '|' + Data13 + '|' + Data14 + '|' + Data15 + '|' + Data16 + '|' + Data17 + '|' + Data18 + '|' + Data19 + '|' + Data20 + '|' + Data21 + '|' + Data22 + '|' + Data23 + '|' + Data24 + '|' + Data25 + '|' + Data26;
                     DataBusquedaRET.push(Data);
                     Data = '';

                 }

                 if (!DbolStop) {
                     intDMinReg = intDMaxReg;
                     intDMaxReg += 1000;
                 }
             } else {
                 DbolStop = true;
             }
         }

         return DataBusquedaRET;
     }

     function BuscarFiscalDocumentType(fiscalDocTypeId) {
         for (var i = 0; i < fiscalDocTypeArray.length; i++) {
             if (Number(fiscalDocTypeId) == Number(fiscalDocTypeArray[i][0])) {
                 return i;
             }
         }
         return 0;
     }


     function ObtenerPercepcionesEfectARCIBA() {
         var intDMinReg = 0;
         var intDMaxReg = 1000;

         var DbolStop = false;
         var ArrReturn = new Array();
         var cont = 0;
         var infoTxt = '';

         var savedSearch = search.create({
            type: "transaction",
            filters:
            [
               ["type","anyof","CustInvc"], 
               "AND", 
               ["memorized","is","F"], 
               "AND", 
               ["formulanumeric: CASE WHEN {custbody_lmry_subsidiary_country} = 'Argentina' THEN 1 ELSE 0 END","equalto","1"], 
               "AND", 
               ["voided","is","F"], 
               "AND", 
               ["posting","is","T"], 
               "AND", 
               [[["formulanumeric: CASE WHEN {custcol_lmry_ar_item_tributo} = 'T' OR {custcol_lmry_ar_item_tributo} = 'Yes' THEN 1 ELSE 0 END","equalto","1"],"AND",["formulatext: {custcol_lmry_ar_col_jurisd_iibb.custrecord_lmry_ar_jurisdiccion_iibb_cod}","is","901"],"AND",["formulatext: {custcol_lmry_ar_perception_percentage}","isnotempty",""]],"OR",[["formulanumeric: CASE WHEN NVL({custcol_lmry_ar_item_tributo},'F') <>'T' AND NVL({custcol_lmry_ar_item_tributo},'F') <>'Yes' AND {taxline} <> 'T' AND {taxline} <> 'Yes' AND SUBSTR({taxitem},0,4)<>'PERC' AND SUBSTR({taxitem},0,4)<>'Perc' THEN 1 ELSE 0 END","equalto","1"]]]
            ],
            columns:
            [
               search.createColumn({
                  name: "formulatext",
                  summary: "GROUP",
                  formula: "'2'",
                  label: "0. Tipo Operacion"
               }),
               search.createColumn({
                  name: "formulatext",
                  summary: "MAX",
                  formula: "{custcol_lmry_ar_norma_iibb_arciba.custrecord_lmry_ar_norma_code}",
                  label: "Formula (Text)"
               }),
               search.createColumn({
                  name: "formulatext",
                  summary: "GROUP",
                  formula: "TO_CHAR({trandate} , 'DD/MM/YYYY')",
                  label: "2. Fecha Percepcion"
               }),
               search.createColumn({
                  name: "formulatext",
                  summary: "GROUP",
                  formula: "{custbody_lmry_document_type.custrecord_lmry_codigo_doc_ar}  ",
                  label: "3. Tipo de comprobante origen de la percepcion"
               }),
               search.createColumn({
                  name: "formulatext",
                  summary: "GROUP",
                  formula: "{custbody_lmry_document_type.custrecord_lmry_letra_comprobante} ",
                  label: "4. Letra del Comprobante"
               }),
               search.createColumn({
                  name: "formulatext",
                  summary: "GROUP",
                  formula: "CONCAT(NVL({custbody_lmry_serie_doc_cxc},''),NVL({custbody_lmry_num_preimpreso},''))",
                  label: "5. Nro de comprobante"
               }),
               search.createColumn({
                  name: "formulatext",
                  summary: "GROUP",
                  formula: "TO_CHAR({trandate},'dd/mm/yyyy')",
                  label: "6. Fecha del comprobante "
               }),
               search.createColumn({
                  name: "formulacurrency",
                  summary: "SUM",
                  formula: "ABS(CASE WHEN {taxitem}<>'E-AR' AND NVL({custcol_lmry_ar_item_tributo},'F')<>'T' AND NVL({custcol_lmry_ar_item_tributo},'F')<>'Yes' AND {taxitem}<>'UNDEF_AR' AND {taxitem}<>'undef_ar' AND {taxitem}<>'UNDEF-AR' AND {taxitem}<>'undef-ar' AND {taxitem}<>'ENop-AR' AND {taxitem}<>'IZ-AR' AND SUBSTR({taxitem},0,4)<>'PERC' AND SUBSTR({taxitem},0,4)<>'Perc' THEN ABS(NVL({debitamount},0) - NVL({creditamount},0)) + ABS({taxamount}) ELSE 0 END)",
                  label: "Formula (Currency)"
               }),
               search.createColumn({
                  name: "formulatext",
                  summary: "GROUP",
                  formula: "case when {customer.custentity_lmry_sunat_tipo_doc_cod} = '80' then '3' WHEN {customer.custentity_lmry_sunat_tipo_doc_cod} = '86' THEN '2' WHEN {customer.custentity_lmry_sunat_tipo_doc_cod} = '87' THEN '1' ELSE '' END",
                  label: "9. Tipo de documento del Retenido"
               }),
               search.createColumn({
                  name: "formulatext",
                  summary: "GROUP",
                  formula: "CONCAT({customer.vatregnumber},{customer.custentity_lmry_digito_verificator})",
                  label: "10. Nro de documento del Retenido"
               }),
               search.createColumn({
                  name: "formulatext",
                  summary: "GROUP",
                  formula: "{customer.custentity_lmry_ar_cod_situaci_ib_arciba}",
                  label: "11.Situación IB del Retenido"
               }),
               search.createColumn({
                  name: "formulatext",
                  summary: "GROUP",
                  formula: " case when {customer.custentity_lmry_ar_cod_situaci_ib_arciba} = '4' then '00000000000' WHEN ({customer.custentity_lmry_ar_cod_situaci_ib_arciba} = '1' or {customer.custentity_lmry_ar_cod_situaci_ib_arciba} = '5') THEN NVL({customer.custentity_lmry_ar_num_inscripcion_sf},'') WHEN {customer.custentity_lmry_ar_cod_situaci_ib_arciba} = '2' THEN NVL({customer.custentity_lmry_ar_num_inscripcion_cm},'')  ELSE '' END",
                  label: "12. Nro Inscripción IB del Retenido"
               }),
               search.createColumn({
                  name: "formulatext",
                  summary: "GROUP",
                  formula: "{customer.custentity_lmry_ar_cod_situac_iva_arciba}",
                  label: "13. Situación frente al IVA del Retenido"
               }),
               search.createColumn({
                  name: "formulatext",
                  summary: "GROUP",
                  formula: "case when {customer.isperson} = 'T' THEN CONCAT({customer.firstname}, CONCAT(' ', {customer.lastname})) else {customer.companyname} end",
                  label: "14. Razón Social del Retenido"
               }),
               search.createColumn({
                  name: "formulacurrency",
                  summary: "GROUP",
                  formula: "0",
                  label: "15.Importe otros conceptos"
               }),
               search.createColumn({
                  name: "formulacurrency",
                  summary: "SUM",
                  formula: "ABS(CASE WHEN {taxitem}<>'E-AR' AND NVL({custcol_lmry_ar_item_tributo},'F') <>'T' AND NVL({custcol_lmry_ar_item_tributo},'F') <>'Yes' AND {taxitem}<>'UNDEF_AR' AND {taxitem}<>'undef_ar' AND {taxitem}<>'UNDEF-AR' AND {taxitem}<>'undef-ar' AND {taxitem}<>'ENop-AR' AND {taxitem}<>'IZ-AR' AND SUBSTR({taxitem},0,4)<>'PERC' AND SUBSTR({taxitem},0,4)<>'Perc' THEN ABS({taxamount}) ELSE 0 END)",
                  label: "Formula (Currency)"
               }),
               search.createColumn({
                  name: "formulacurrency",
                  summary: "SUM",
                  formula: "CASE WHEN {custcol_lmry_ar_perception_type} = 'Ingresos Brutos' AND (NVL({custcol_lmry_ar_item_tributo},'F') = 'T' OR NVL({custcol_lmry_ar_item_tributo},'F') = 'Yes') AND {custcol_lmry_ar_col_jurisd_iibb}='Capital Federal' AND ({taxitem} = 'UNDEF_AR' OR {taxitem} = 'undef_ar' OR {taxitem} = 'UNDEF-AR' OR  {taxitem} = 'undef-ar') THEN ABS({custcol_lmry_base_amount}) END",
                  label: "Formula (Currency)"
               }),
               search.createColumn({
                  name: "formulanumeric",
                  summary: "SUM",
                  formula: "{custcol_lmry_ar_perception_percentage} * 10000",
                  label: "Formula (Numeric)"
               }),
               search.createColumn({
                  name: "formulacurrency",
                  summary: "SUM",
                  formula: "CASE WHEN {custcol_lmry_ar_perception_type}='Ingresos Brutos' AND {custcol_lmry_ar_col_jurisd_iibb}='Capital Federal' AND ({taxitem} = 'UNDEF_AR' OR {taxitem} = 'undef_ar' OR {taxitem} = 'UNDEF-AR' OR  {taxitem} = 'undef-ar') THEN ABS({amount}) END",
                  label: "Formula (Currency)"
               }),
               search.createColumn({
                  name: "formulacurrency",
                  summary: "SUM",
                  formula: "CASE WHEN {custcol_lmry_ar_perception_type}='Ingresos Brutos' AND {custcol_lmry_ar_col_jurisd_iibb}='Capital Federal' AND ({taxitem} = 'UNDEF_AR' OR {taxitem} = 'undef_ar' OR {taxitem} = 'UNDEF-AR' OR  {taxitem} = 'undef-ar') THEN ABS({amount}) END",
                  label: "Formula (Currency)"
               }),
               search.createColumn({
                  name: "exchangerate",
                  summary: "GROUP",
                  label: "Exchange Rate"
               })
            ]
         });

         if (featuresubs) {
             var subsidiaryFilter = search.createFilter({
                 name: 'subsidiary',
                 operator: search.Operator.IS,
                 values: [paramSubsidy]
             });
             savedSearch.filters.push(subsidiaryFilter);
         }

         if (paramperiodinicio != null && paramperiodinicio != '') {
             var fechInicioFilter = search.createFilter({
                 name: 'trandate',
                 operator: search.Operator.ONORAFTER,
                 values: [paramperiodinicio]
             });
             savedSearch.filters.push(fechInicioFilter);
         }

         if (paramperiodfinal != null && paramperiodfinal != '') {
             var fechFinFilter = search.createFilter({
                 name: 'trandate',
                 operator: search.Operator.ONORBEFORE,
                 values: [paramperiodfinal]
             });
             savedSearch.filters.push(fechFinFilter);
         }

         if ((paramperiodinicio == null || paramperiodinicio == '') && (paramperiodfinal == null || paramperiodfinal == '')) {
             var periodFilter = search.createFilter({
                 name: 'postingperiod',
                 operator: search.Operator.IS,
                 values: [paramPeriod]
             });
             savedSearch.filters.push(periodFilter);
         }

         //COLUMNA 21
         //CERTIFICADO DE RETENCION VOUCHER xlas cambiar
         var col21 = search.createColumn({
             name: "formulatext",
             summary: "GROUP",
             formula: "{custbody_lmry_document_type.custrecord_lmry_codigo_doc}",
             label: "Formula (TEXT)"
         });
         savedSearch.columns.push(col21);

         //columna22 - tipofiscaldocument
         var col22 = search.createColumn({
             name: "formulatext",
             summary: "GROUP",
             formula: "{custbody_lmry_document_type.custrecord_lmry_codigo_doc}",
             label: "Formula (TEXT)"
         });
         savedSearch.columns.push(col22);

         if (feamultibook) {

             var multibookFilter = search.createFilter({
                 name: 'accountingbook',
                 join: 'accountingtransaction',
                 operator: search.Operator.IS,
                 values: [paramMultibook]
             });
             savedSearch.filters.push(multibookFilter);

             //columna23
             var exchangerateColum = search.createColumn({
                 name: "exchangerate",
                 join: "accountingTransaction",
                 summary: "GROUP",
                 label: "Exchange Rate"
             });
             savedSearch.columns.push(exchangerateColum);

             //reemplaza columna 17 - COLUMNA 24
             var column24multi = search.createColumn({
                 name: "formulacurrency",
                 formula: "ABS(CASE WHEN {taxitem}<>'E-AR' AND NVL({custcol_lmry_ar_item_tributo},'F') <>'T' AND NVL({custcol_lmry_ar_item_tributo},'F')<>'Yes' AND {taxitem}<>'UNDEF_AR' AND {taxitem}<>'undef_ar' AND {taxitem}<>'UNDEF-AR' AND {taxitem}<>'undef-ar' AND {taxitem}<>'ENop-AR' AND {taxitem}<>'IZ-AR' AND SUBSTR({taxitem},0,4)<>'PERC' AND SUBSTR({taxitem},0,4)<>'Perc' THEN ABS(NVL({accountingtransaction.debitamount},0) - NVL({accountingtransaction.creditamount},0)) ELSE 0 END)",
                 summary: "SUM"
             });
             savedSearch.columns.push(column24multi);
         }

         if ((featJobs || featJobsAdvance)){
             // id customer o job columna 23 o 25
             var column25 = search.createColumn({
                 name: "formulanumeric",
                 formula: "CASE WHEN NVL({job.internalid},-1) = -1 THEN {customer.internalid} ELSE {job.customer.id} end",
                 summary: "GROUP"
             });
             savedSearch.columns.push(column25);
         }

         //columna 26
         var column26 = search.createColumn({
             name: "formulanumeric",
             formula: "{custcol_lmry_ar_perception_adjustment}",
             summary: "SUM"
         });
         savedSearch.columns.push(column26);

         // Columna 19 y 20 ------ 23 0 26
         // CASE WHEN {custcol_lmry_ar_perception_type}='Ingresos Brutos'

         var taxes = filter_Feature_tax.split(',');

         // Columna 1
         var formula_columna_1 = "CASE WHEN (";

         for (var i = 0; i < taxes.length; i++) {
             formula_columna_1 += "{custcol_lmry_ar_perception_type.id} = '" + taxes[i] + "'";

             if (i != taxes.length - 1) {
                 formula_columna_1 += " OR ";
             }
         }

         if(feamultibook){
             formula_columna_1 += ") AND (NVL({custcol_lmry_ar_item_tributo},'F') = 'T' OR NVL({custcol_lmry_ar_item_tributo},'F') = 'Yes') AND {custcol_lmry_ar_col_jurisd_iibb}='Capital Federal' AND ({taxitem} = 'UNDEF_AR' OR {taxitem} = 'undef_ar' OR {taxitem} = 'UNDEF-AR' OR  {taxitem} = 'undef-ar') THEN ABS({accountingtransaction.amount}) END";
         }else{
             formula_columna_1 += ") AND (NVL({custcol_lmry_ar_item_tributo},'F') = 'T' OR NVL({custcol_lmry_ar_item_tributo},'F') = 'Yes') AND {custcol_lmry_ar_col_jurisd_iibb}='Capital Federal' AND ({taxitem} = 'UNDEF_AR' OR {taxitem} = 'undef_ar' OR {taxitem} = 'UNDEF-AR' OR  {taxitem} = 'undef-ar') THEN ABS({amount}) END";
         }

         var columna27 = search.createColumn({
             name: "formulacurrency",
             formula: formula_columna_1,
             summary: "SUM",
         });
         savedSearch.columns.push(columna27);

         // Columna 2
         var formula_columna_2 = "CASE WHEN (";

         for (var i = 0; i < taxes.length; i++) {
             formula_columna_2 += "{custcol_lmry_ar_perception_type.id} = '" + taxes[i] + "'";

             if (i != taxes.length - 1) {
                 formula_columna_2 += " OR ";
             }
         }

         formula_columna_2 += ") AND (NVL({custcol_lmry_ar_item_tributo},'F') = 'T' OR NVL({custcol_lmry_ar_item_tributo},'F') = 'Yes') AND {custcol_lmry_ar_col_jurisd_iibb}='Capital Federal' AND ({taxitem} = 'UNDEF_AR' OR {taxitem} = 'undef_ar' OR {taxitem} = 'UNDEF-AR' OR  {taxitem} = 'undef-ar') THEN ABS({custcol_lmry_base_amount}) END";

         var columna28 = search.createColumn({
             name: "formulacurrency",
             formula: formula_columna_2,
             summary: "SUM",
         });
         savedSearch.columns.push(columna28);

        //  var pruebaTest = search.createColumn({name: "internalid",summary: "GROUP", label: "0. Internal ID"});

        //  savedSearch.columns.push(pruebaTest);

         var searchresult = savedSearch.run();
         var Data = '';
         while (!DbolStop) {
             var objResult = searchresult.getRange(intDMinReg, intDMaxReg);

             if (objResult != null) {

                 if (objResult.length != 1000) {
                     DbolStop = true;
                 }

                 var intLength = objResult.length;

                 for (var i = 0; i < intLength; i++) {
                     var columns = objResult[i].columns;

                     var arr = new Array();

                     if (objResult[i].getValue(columns[7]) != 0 && objResult[i].getValue(columns[16]) != 0) {
                         log.debug("Result Percepcion",objResult[i]);
                         //0. TIPO DE OPERACION
                         var Data0 = objResult[i].getValue(columns[0]);

                         // 1. CODIGO DE NORMA
                         var Data1 = objResult[i].getValue(columns[1]);

                         // 2. FECHA DE RETENCION/PERCEPCION
                         var Data2 = objResult[i].getValue(columns[2]);

                         // 3. Tipo de comprobante origen de la retención

                         var columna3 = '';
                         var columnaTipofiscalDocument = '';

                         if (objResult[i].getValue(columns[3]) != null && objResult[i].getValue(columns[3]) != '- None -') {
                             columna3 = objResult[i].getValue(columns[3]);

                             var columnaTipofiscalDocument = objResult[i].getValue(columns[22]);

                             if (columna3 == '04') {
                                 columna3 = '09';
                             } else if (columna3 == '02') {
                                 columna3 = '09';
                             } else if (columna3 == '03') {
                                 columna3 = '09';
                             } else if (columna3 == '11') {
                                 columna3 = '13';
                             } else if (columna3 == '01') {
                                 if (columnaTipofiscalDocument == '083') {
                                     columna3 = '09';
                                 } else if (columnaTipofiscalDocument == '115') {
                                     columna3 = '09';
                                 } else if (columnaTipofiscalDocument == '116') {
                                     columna3 = '09';
                                 } else if (columnaTipofiscalDocument == '117') {
                                     columna3 = '09';
                                 } else if (columnaTipofiscalDocument == '120') {
                                     columna3 = '09';
                                 } else if (columnaTipofiscalDocument == '019') {
                                     columna3 = '09';
                                 } else {
                                     columna3 = '01';
                                 }
                             } else if (columna3 == '17') {
                                 columna3 = '09';
                             } else if (columna3 == '18') {
                                 columna3 = '09';

                             } else if (columna3 == '05') {
                                 if (columnaTipofiscalDocument == '332') {
                                     columna3 = '09';
                                 } else if (columnaTipofiscalDocument == '033') {
                                     columna3 = '09';
                                 } else if (columnaTipofiscalDocument == '022') {
                                     columna3 = '09';
                                 } else if (columnaTipofiscalDocument == '331') {
                                     columna3 = '09';
                                 } else if (columnaTipofiscalDocument == '027') {
                                     columna3 = '09';
                                 } else if (columnaTipofiscalDocument == '028') {
                                     columna3 = '09';
                                 } else if (columnaTipofiscalDocument == '029') {
                                     columna3 = '09';
                                 } else if (columnaTipofiscalDocument == '063') {
                                     columna3 = '09';
                                 } else if (columnaTipofiscalDocument == '064') {
                                     columna3 = '09';
                                 } else if (columnaTipofiscalDocument == '059') {
                                     columna3 = '09';
                                 } else if (columnaTipofiscalDocument == '050') {
                                     columna3 = '01';
                                 } else if (columnaTipofiscalDocument == '070') {
                                     columna3 = '01';
                                 } else {
                                     columna3 = '09';
                                 }
                             }

                             if (columna3 != '01' && columna3 != '09' && columna3 != '10' && columna3 != '13') {
                                 CodeComprobante = '09';
                             }

                             var Data3 = completar_cero(2, columna3);
                         } else {
                             var Data3 = completar_espacio(2, columna3);
                         }

                         // 4. Letra del Comprobante
                         var Data4 = objResult[i].getValue(columns[4]);

                         // 5. Nro del Comprobante
                         var Data5 = objResult[i].getValue(columns[5]);


                         // 6. Fecha del Comprobante
                         var Data6 = objResult[i].getValue(columns[6]);

                         // 7. Monto del Comprobante
                         if (feamultibook || feamultibook == 'T') {
                             if (objResult[i].getValue(columns[7]) != '' && objResult[i].getValue(columns[7]) != null) {
                                 var Data7 = objResult[i].getValue(columns[7]) / objResult[i].getValue(columns[20]);
                                 Data7 = Data7 * Number(objResult[i].getValue(columns[23]));
                                 Data7 = Data7.toFixed(2);
                             } else {
                                 Data7 = '0.00'
                             }

                         } else {
                             if (objResult[i].getValue(columns[7]) != '' && objResult[i].getValue(columns[7]) != null) {
                                 var Data7 = Number(objResult[i].getValue(columns[7]));
                             } else {
                                 var Data7 = '0.00'
                             }
                         }

                         // 8. Nro certificaod propio
                         var Data8 = '';

                         // 9. Tipo de Documento del Retenido
                         var Data9 = objResult[i].getValue(columns[8]);

                         //10. Nro. Docuemnto del retenido
                         var Data10 = objResult[i].getValue(columns[9]);

                         //11. Situacion IB del Retenido
                         var Data11 = objResult[i].getValue(columns[10]);

                         //12. Nro Inscripción IB del Retenido
                         var Data12 = objResult[i].getValue(columns[11]);

                         //13. Situación frente al IVA del Retenido
                         var Data13 = objResult[i].getValue(columns[12]);

                         //14. Razón Social del Retenido
                         var Data14 = objResult[i].getValue(columns[13]);

                         //15. Importe otros conceptos
                         if (feamultibook || feamultibook == 'T') {
                             if (objResult[i].getValue(columns[14]) != '' && objResult[i].getValue(columns[14]) != null) {
                                 var Data15 = objResult[i].getValue(columns[14]) / objResult[i].getValue(columns[20]);
                                 Data15 = Data15 * Number(objResult[i].getValue(columns[23])).toFixed(2);
                             } else {
                                 Data15 = '0.00'
                             }
                         } else {
                             if (objResult[i].getValue(columns[7]) != '' && objResult[i].getValue(columns[7]) != null) {
                                 var Data15 = objResult[i].getValue(columns[14]);
                             } else {
                                 var Data15 = '0.00'
                             }
                         }

                         //16. Importe IVA
                         if (feamultibook || feamultibook == 'T') {
                             if (objResult[i].getValue(columns[15]) != '' && objResult[i].getValue(columns[15]) != null) {
                                 var Data16 = objResult[i].getValue(columns[15]) / objResult[i].getValue(columns[20]);
                                 Data16 = Data16 * Number(objResult[i].getValue(columns[23]));
                                 Data16 = Data16.toFixed(2);
                             } else {
                                 Data16 = '0.00'
                             }
                         } else {
                             if (objResult[i].getValue(columns[15]) != '' && objResult[i].getValue(columns[15]) != null) {
                                 var Data16 = objResult[i].getValue(columns[15]);
                             } else {
                                 var Data16 = '0.00'
                             }
                         }

                         //17. Monto Sujeto a Retención/ Percepción
                         if (feamultibook || feamultibook == 'T') {
                             if (featJobs || featJobsAdvance){
                                 if (objResult[i].getValue(columns[28]) != '' && objResult[i].getValue(columns[28]) != null) {
                                     var Data17 = Number(objResult[i].getValue(columns[28])) * Number(objResult[i].getValue(columns[23]));
                                 } else {
                                     Data17 = '0.00'
                                 }
                             }else{
                                 if (objResult[i].getValue(columns[27]) != '' && objResult[i].getValue(columns[27]) != null) {
                                     var Data17 = Number(objResult[i].getValue(columns[27])) * Number(objResult[i].getValue(columns[23]));
                                 } else {
                                     Data17 = '0.00'
                                 }
                             }
                         } else {
                             if (featJobs || featJobsAdvance){
                                 if (objResult[i].getValue(columns[26]) != '' && objResult[i].getValue(columns[26]) != null) {
                                     var Data17 = Number(objResult[i].getValue(columns[26])) * Number(objResult[i].getValue(columns[20]));
                                 } else {
                                     Data17 = '0.00'
                                 }
                             }else{
                                 if (objResult[i].getValue(columns[25]) != '' && objResult[i].getValue(columns[25]) != null) {
                                     var Data17 = Number(objResult[i].getValue(columns[25])) * Number(objResult[i].getValue(columns[20]));
                                 } else {
                                     Data17 = '0.00'
                                 }
                             }
                         }

                         //18. Alícuota
                         var Data18 = objResult[i].getValue(columns[17]);

                         //19. Retención/Percepción Practicada
                         //MULTIBOOK 23 Y SIN MULTIBOOK 20

                         if (feamultibook || feamultibook == 'T') {
                             if (featJobs || featJobsAdvance){
                                 if (objResult[i].getValue(columns[27]) != '' && objResult[i].getValue(columns[27]) != null) {
                                     var Data19 = Number(objResult[i].getValue(columns[27])).toFixed(2);
                                 } else {
                                     Data19 = '0.00'
                                 }
                             }else{
                                 if (objResult[i].getValue(columns[26]) != '' && objResult[i].getValue(columns[26]) != null) {
                                     var Data19 = Number(objResult[i].getValue(columns[26])).toFixed(2);
                                 } else {
                                     Data19 = '0.00'
                                 }
                             }
                         } else {
                             if (featJobs || featJobsAdvance){
                                 if (objResult[i].getValue(columns[25]) != '' && objResult[i].getValue(columns[25]) != null) {
                                     var Data19 = Number(objResult[i].getValue(columns[25])).toFixed(2);
                                 } else {
                                     var Data19 = '0.00'
                                 }
                             }else{
                                 if (objResult[i].getValue(columns[24]) != '' && objResult[i].getValue(columns[24]) != null) {
                                     var Data19 = Number(objResult[i].getValue(columns[24])).toFixed(2);
                                 } else {
                                     var Data19 = '0.00'
                                 }
                             }
                         }

                         var Data20 = Data19;

                         var Data21 = '';
                         var Data22 = '';

                         var Data23 = 'PER';

                         var Data24 = objResult[i].getValue(columns[21]);

                         var Data25 = '';

                         if (feamultibook || feamultibook == 'T') {
                             if ((featJobs || featJobsAdvance)){
                                 if(objResult[i].getValue(columns[25]) != '- None -' && objResult[i].getValue(columns[25]) != null && objResult[i].getValue(columns[25]) != ''){
                                     Data25 = objResult[i].getValue(columns[25]);
                                 }
                             }
                         }else{
                             if ((featJobs || featJobsAdvance)){
                                 if(objResult[i].getValue(columns[23]) != '- None -' && objResult[i].getValue(columns[23]) != null && objResult[i].getValue(columns[23]) != ''){
                                     Data25 = objResult[i].getValue(columns[23]);
                                 }
                             }
                         }

                         // Ajuste
                         var Data26 = '';

                         if(feamultibook){
                             if(featJobs || featJobsAdvance){
                                 Data26 = objResult[i].getValue(columns[26]);
                             }else{
                                 Data26 = objResult[i].getValue(columns[25]);
                             }
                         }else{
                             if(featJobs || featJobsAdvance){
                                 Data26 = objResult[i].getValue(columns[24]);
                             }else{
                                 Data26 = objResult[i].getValue(columns[23]);
                             }
                         }

                         if (Data18 != 0 && Data18 != '' && Data18 != '- None -' && Data19 != 0 && Data19 != '' && Data19 != '- None -') {
                             Data18 = (Number(Data18)).toFixed(2);
                             Data18 = (completar_cero(5, Data18)) //.replace('.', ',');

                             Data = Data0 + '|' + Data1 + '|' + Data2 + '|' + Data3 + '|' + Data4 + '|' + Data5 + '|' + Data6 + '|' + Data7 + '|' +
                                     Data8 + '|' + Data9 + '|' + Data10 + '|' + Data11 + '|' + Data12 + '|' + Data13 + '|' + Data14 + '|' + Data15 + '|' +
                                     Data16 + '|' + Data17 + '|' + Data18 + '|' + Data19 + '|' + Data20 + '|' + Data21 + '|' + Data22 + '|' + Data23 + '|' +
                                     Data24 + '|' + Data25 + '|' + Data26;
                             DataBusquedaPER.push(Data);
                             Data = '';
                         }
                         //  }
                     }

                 }

                 if (!DbolStop) {
                     intDMinReg = intDMaxReg;
                     intDMaxReg += 1000;
                 }
             } else {
                 DbolStop = true;
             }
         }

         return DataBusquedaPER;
     }

     function JuntarArreglos(arrPer, arrRet) {
         Array.prototype.push.apply(arrPer, arrRet);
         return arrPer;

     }

     function savefile(strAuxiliar, contador_archivo) {
         var FolderId = objContext.getParameter({
             name: 'custscript_lmry_file_cabinet_rg_ar'
         });

         // Almacena en la carpeta de Archivos Generados
         if (FolderId != '' && FolderId != null) {

             //Extension del Archivo
             var filetext;
             var NameFile;

             filetext = '.txt';

             NameFile = 'SMC_'+Name_File(contador_archivo) + filetext;
             // Crea el archivo.xls
             var file = fileModulo.create({
                 name: NameFile,
                 fileType: fileModulo.Type.PLAINTEXT,
                 contents: strAuxiliar,
                 encoding: fileModulo.Encoding.UTF8,
                 folder: FolderId

             });

             var idfile = file.save(); // Termina de grabar el archivo
             var idfile2 = fileModulo.load({
                 id: idfile
             }); // Trae URL de archivo generado

             // Obtenemo de las prefencias generales el URL de Netsuite (Produccion o Sandbox)
             var getURL = objContext.getParameter({
                 name: 'custscript_lmry_netsuite_location'
             });
             var urlfile = '';

             if (getURL != '' && getURL != '') {
                 urlfile += 'https://' + getURL;
             }

             urlfile += idfile2.url;
             log.debug("URL:",urlfile)
            //  if (idfile) {
            //      var usuarioTemp = runtime.getCurrentUser();
            //      var id = usuarioTemp.id;
            //      var employeename = search.lookupFields({
            //          type: search.Type.EMPLOYEE,
            //          id: id,
            //          columns: ['firstname', 'lastname']
            //      });
            //      var usuario = employeename.firstname + ' ' + employeename.lastname;
            //      if(contador_archivo != 0){
            //          var record = recordModulo.create({
            //              type: 'customrecord_lmry_ar_rpt_generator_log'
            //          });
            //      }else{
            //          var record = recordModulo.load({
            //              type: 'customrecord_lmry_ar_rpt_generator_log',
            //              id: paramRecordID
            //          });
            //      }

            //      //Nombre del Archivos
            //      record.setValue({
            //          fieldId: 'custrecord_lmry_ar_rg_name',
            //          value: NameFile
            //      });

            //      //URL del archivo
            //      record.setValue({
            //          fieldId: 'custrecord_lmry_ar_rg_url_file',
            //          value: urlfile
            //      });

            //      //Nombre del Reporte
            //      record.setValue({
            //          fieldId: 'custrecord_lmry_ar_rg_transaction',
            //          value: nameReport
            //      });

            //      //Subsidiaria
            //      record.setValue({
            //          fieldId: 'custrecord_lmry_ar_rg_subsidiary',
            //          value: companyname
            //      });

            //      //Periodo
            //      record.setValue({
            //          fieldId: 'custrecord_lmry_ar_rg_postingperiod',
            //          value: periodname
            //      });

            //      //Multibook
            //      if (feamultibook || feamultibook == 'T') {
            //          record.setValue({
            //              fieldId: 'custrecord_lmry_ar_rg_multibook',
            //              value: multibookName
            //          });
            //      }

            //      //Creado por
            //      record.setValue({
            //          fieldId: 'custrecord_lmry_ar_rg_employee',
            //          value: usuario
            //      });
            //      var recordId = record.save();

            //      //Envia mail de conformidad al usuario
            //      log.error('NameFile', NameFile);
            //      libreria.sendrptuser(nameReport, 3, NameFile);
            //  }
             log.error('NameFile', NameFile);
         }
     }

     function Name_File(contadorArchivos) {
         if (contadorArchivos == 0) {
             contadorArchivos = '';
         } else {
             contadorArchivos = '_' + contadorArchivos;
         }

         var name = '';

         var parsedDateStringAsRawDateObject = format.parse({
             value: periodenddate,
             type: format.Type.DATE
         });

         var MM = parsedDateStringAsRawDateObject.getMonth() + 1;
         var YYYY = parsedDateStringAsRawDateObject.getFullYear();
         var DD = parsedDateStringAsRawDateObject.getDate();


         if (('' + MM).length == 1) {
             MM = '0' + MM;
         }

         var cuit = companyruc.replace(/-/g, '');

         if (featuresubs || featuresubs == 'T') {
             if (feamultibook || feamultibook == 'T') {
                 name = 'AR_RETEN_PERC_EFEC_IIBB_CABA' + '_' + cuit + '_' + MM + YYYY + '_' + paramMultibook + '_' + paramSubsidy + contadorArchivos + '_';
             } else {
                 name = 'AR_RETEN_PERC_EFEC_IIBB_CABA' + '_' + cuit + '_' + MM + YYYY + '_' + paramSubsidy + contadorArchivos + '_';
             }
         } else {
             if (feamultibook || feamultibook == 'T') {
                 name = 'AR_RETEN_PERC_EFEC_IIBB_CABA' + '_' + cuit + '_' + MM + YYYY + '_' + paramMultibook + contadorArchivos + '_';
             } else {
                 name = 'AR_RETEN_PERC_EFEC_IIBB_CABA' + '_' + cuit + '_' + MM + YYYY + contadorArchivos + '_';
             }
         }

         return name;
     }

     function NoData() {
         var usuario = runtime.getCurrentUser();

         var employee = search.lookupFields({
             type: search.Type.EMPLOYEE,
             id: usuario.id,
             columns: ['firstname', 'lastname']
         });
         var usuarioName = employee.firstname + ' ' + employee.lastname;

         var generatorLog = recordModulo.load({
             type: 'customrecord_lmry_ar_rpt_generator_log',
             id: paramRecordID
         });

         //Nombre de Archivo
         generatorLog.setValue({
             fieldId: 'custrecord_lmry_ar_rg_name',
             value: 'No existe informacion para los criterios seleccionados.'
         });
         //Periodo
         generatorLog.setValue({
             fieldId: 'custrecord_lmry_ar_rg_postingperiod',
             value: periodname
         });
         //Creado Por
         generatorLog.setValue({
             fieldId: 'custrecord_lmry_ar_rg_employee',
             value: usuarioName
         });

         var recordId = generatorLog.save();
     }

     function completar_cero(long, valor) {
         var length = ('' + valor).length;
         if (length <= long) {
             if (long != length) {
                 for (var i = length; i < long; i++) {
                     valor = '0' + valor;
                 }
             } else {
                 return valor;
             }
             return valor;
         } else {
             valor = ('' + valor).substring(0, long);
             return valor;
         }
     }

     function completar_espacio(long, valor) {
         if ((('' + valor).length) <= long) {
             if (long != ('' + valor).length) {
                 for (var i = (('' + valor).length); i < long; i++) {
                     valor = valor + ' ';
                 }
             } else {
                 return valor;
             }
             return valor;
         } else {
             valor = valor.substring(0, long);
             return valor;
         }
     }

     function completar_espacioIzquierda(long, valor) {
         var length = ('' + valor).length;
         if (length <= long) {
             if (long != length) {
                 for (var i = length; i < long; i++) {
                     valor = ' ' + valor;
                 }
             } else {
                 return valor;
             }
             return valor;
         } else {
             valor = ('' + valor).substring(0, long);
             return valor;
         }
     }

     function completar_espacioDerecha(long, valor) {
         var length = ('' + valor).length;
         if (length <= long) {
             if (long != length) {
                 for (var i = length; i < long; i++) {
                     valor = valor + ' ';
                 }
             } else {
                 return valor;
             }
             return valor;
         } else {
             valor = ('' + valor).substring(0, long);
             return valor;
         }
     }

     function CUITFormat(s) {
         var s1 = s.substring(s.length - 12, s.length - 10);
         //  var s2 = s.substring(s.length - 9, s.length - 1);
         var s2 = s.substring(s.length - 10, s.length);
         //var s3 = s.substring(s.length - 1, s.length);

         //   return s1 + '-' + s2 + '-' + s3;
         return s1 + '-' + s2;
     }


     function ObtenerDatosSubsidiaria() {
         var configpage = config.load({
             type: config.Type.COMPANY_INFORMATION
         });

         if (featuresubs) {
             companyname = ObtainNameSubsidiaria(paramSubsidy);
             companyruc = ObtainFederalIdSubsidiaria(paramSubsidy);
         } else {
             companyname = configpage.getValue('legalname');
             companyruc = configpage.getValue('employerid');
         }
         companyruc = companyruc.replace(' ', '');
     }

     function ObtainNameSubsidiaria(subsidiary) {
         try {
             if (subsidiary != '' && subsidiary != null) {
                 var subsidyName = search.lookupFields({
                     type: search.Type.SUBSIDIARY,
                     id: subsidiary,
                     columns: ['legalname']
                 });
                 return subsidyName.legalname;
             }

         } catch (error) {
            log.error("[ObtainNameSubsidiaria]",error);
             //libreria.sendemailTranslate(LMRY_script, '[ObtainNameSubsidiaria]' + error, paramLanguage);
         }
         return '';
     }

     function ObtainFederalIdSubsidiaria(subsidiary) {
         try {
             if (subsidiary != '' && subsidiary != null) {
                 var federalId = search.lookupFields({
                     type: search.Type.SUBSIDIARY,
                     id: subsidiary,
                     columns: ['taxidnum']
                 });
                 return federalId.taxidnum;
             }
         } catch (error) {
            log.error("[ObtainFederalIdSubsidiaria]",error);
            //libreria.sendemailTranslate(LMRY_script, '[ObtainFederalIdSubsidiaria]' + error, paramLanguage);
         }
         return '';
     }

     function ParametrosYFeatures() {

         paramMultibook = ' ';

         paramRecordID = ' ';

         paramSubsidy = '9';

         paramPeriod = '134';

         paramperiodinicio = null

         paramperiodfinal = null

         paramFeatureTax = '29';

         paramLanguage = 'en';

         if (paramFeatureTax != '' || paramFeatureTax != null) {
             ObtenerTaxes();
         }

         arrGravado = obtenerTaxCodeGroup();

         var period_temp = search.lookupFields({
             type: search.Type.ACCOUNTING_PERIOD,
             id: paramPeriod,
             columns: ['periodname', 'startdate', 'enddate']
         });

         periodenddate = period_temp.enddate;
         periodstartdate = period_temp.startdate;
         periodname = period_temp.periodname;

         periodYear = format.parse({
             value: periodstartdate,
             type: format.Type.DATE
         }).getFullYear();

         periodMonth = format.parse({
             value: periodstartdate,
             type: format.Type.DATE
         }).getMonth();

         featuresubs = runtime.isFeatureInEffect({
             feature: "SUBSIDIARIES"
         });

         feamultibook = runtime.isFeatureInEffect({
             feature: "MULTIBOOK"
         });

         featJobs = runtime.isFeatureInEffect({
             feature: "JOBS"
         });

         featJobsAdvance = runtime.isFeatureInEffect({
             feature: "ADVANCEDJOBS"
         });

         
         //obtener el nombre del MULTIBOOK
         if (feamultibook) {
             var multibookName_temp = search.lookupFields({
                 type: search.Type.ACCOUNTING_BOOK,
                 id: paramMultibook,
                 columns: ['name']
             });
             multibookName = multibookName_temp.name;
         }

     }

     function ObtenerFiscalDocumentType() {
         var intDMinReg = 0;
         var intDMaxReg = intDMinReg + 1000;
         var DbolStop = false;

         var savedSearch = search.create({
             type: 'customrecord_lmry_tipo_doc',
             filters: [
                 ["isinactive", "is", "F"],
                 "AND",
                 ["formulatext: {custrecord_lmry_country_applied}", "is", "Argentina"]
             ],
             columns: [
                 search.createColumn({
                     name: 'internalid'
                 }),
                 search.createColumn({
                     name: 'custrecord_lmry_codigo_doc_ar'
                 }),
                 search.createColumn({
                     name: 'custrecord_lmry_letra_comprobante'
                 }),
                 search.createColumn({
                     name: 'custrecord_lmry_codigo_doc'
                 })
             ]
         });

         var searchResult = savedSearch.run();
         var rowArray = [];
         var objResult;
         while (!DbolStop) {
             var objResult = searchResult.getRange(intDMinReg, intDMaxReg);
             if (objResult != null) {
                 if (objResult.length != 1000) {
                     DbolStop = true;
                 }

                 for (var i = 0; i < objResult.length; i++) {
                     var columns = objResult[i].columns;
                     rowArray = [];

                     //0. Internal id
                     if (objResult[i].getValue(columns[0]) != null && objResult[i].getValue(columns[0]) != '- None -')
                         rowArray[0] = objResult[i].getValue(columns[0]);
                     else
                         rowArray[0] = '';

                     //1. Tipo de Comprobante ar sicore
                     if (objResult[i].getValue(columns[1]) != null && objResult[i].getValue(columns[1]) != '- None -')
                         rowArray[1] = objResult[i].getValue(columns[1]);
                     else
                         rowArray[1] = '';

                     //2. Letra de Comprobante
                     if (objResult[i].getValue(columns[2]) != null && objResult[i].getValue(columns[2]) != '- None -')
                         rowArray[2] = objResult[i].getValue(columns[2]);
                     else
                         rowArray[2] = '';

                     //1. Tipo de Comprobante
                     if (objResult[i].getValue(columns[3]) != null && objResult[i].getValue(columns[3]) != '- None -')
                         rowArray[3] = objResult[i].getValue(columns[3]);
                     else
                         rowArray[3] = '';

                     fiscalDocTypeArray.push(rowArray);
                 }

             } else {
                 DbolStop = true;
             }
         }
     }

     function ObtenerTaxes() {
         var taxTypeSearch = search.create({
             type: 'customrecord_lmry_ar_rpt_taxtype',
             columns: [{
                 name: 'custrecord_lmry_ar_rpt_tax_type'
             }],
             filters: [{
                 name: 'custrecord_lmry_ar_rpt_feature',
                 operator: 'anyof',
                 values: [paramFeatureTax]
             }]
         });

         var searchResult = taxTypeSearch.run();
         var objectResult = searchResult.getRange(0, 1000);
         var columns = objectResult[0].columns;

         filter_Feature_tax = objectResult[0].getValue(columns[0]);
     }

     function obtenerTaxCodeGroup() {
         var arrReturn = new Array();

         var DbolStop = false;
         var intDMinReg = 0;
         var intDMaxReg = 1000;

         var taxTypeSearch = search.create({
             type: 'customrecord_lmry_setup_taxcode_group',
             columns: [{
                     name: 'custrecord_lmry_setup_taxcode_group'
                 },
                 {
                     name: 'custrecord_lmry_setup_taxcode'
                 }
             ],
             filters: [{
                 name: 'formulatext',
                 formula: '{custrecord_lmry_setup_taxcode_country}',
                 operator: 'is',
                 values: ['Argentina']
             }]
         });

         var searchResult = taxTypeSearch.run();

         while (!DbolStop) {
             var objResult = searchResult.getRange(intDMinReg, intDMaxReg);
             if (objResult != null) {
                 if (objResult.length != 1000) {
                     DbolStop = true;
                 }

                 for (var i = 0; i < objResult.length; i++) {
                     var columns = objResult[i].columns;

                     var rowArray = new Array();

                     // 0. Tax Code Group
                     rowArray[0] = objResult[i].getText(columns[0]);

                     // 1. Tax Code
                     rowArray[1] = objResult[i].getValue(columns[1]);

                     //if(rowArray[0] == 'Neto Gravado'){
                     arrReturn.push(rowArray);
                     //}
                 }

                 if (!DbolStop) {
                     intDMinReg = intDMaxReg;
                     intDMaxReg += 1000;
                 }
             } else {
                 DbolStop = true;
             }
         }

         return arrReturn;
     }

     return {
         getInputData: getInputData,
         map: map,
         summarize: summarize
     };

 });
