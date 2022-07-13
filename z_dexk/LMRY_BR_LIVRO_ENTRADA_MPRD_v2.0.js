/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_BR_LIVRO_ENTRADA_MPRD_V2.0.js               ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0   Jan 10 2020   Alexander      Use Script 2.0           ||
\= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
 define(['N/search', 'N/log', 'N/file', "N/config", 'N/runtime', "N/format", "N/record", "N/task", "/SuiteBundles/Bundle 37714/Latam_Library/LMRY_LibraryReport_LBRY_V2.js", 'N/xml'],

 function(search, log, fileModulo, config, runtime, format, recordModulo, task, libreria, xml) {
     /**
      * Input Data for processing
      *
      * @return Array,Object,Search,File
      *
      * @since 2016.1
      */
     var objContext = runtime.getCurrentScript();
     // Nombre del Reporte
     var namereport = "BR - REGISTRO DE ENTRADA";
     var LMRY_script = 'LMRY_BR_LIVRO_ENTRADA_MPRD_V2.0.js';

     var language = runtime.getCurrentScript().getParameter("LANGUAGE").substring(0,2);

     //Parametros
     var paramSubsidiaria = null;
     var paramPeriodo     = null;
     var paramMultibook   = null;
     var paramIDReport    = null;
     var paramIDRecord    = null;
     var paramTipoFormato = null;
     var paramFile        = '';
     var paramCont        = 0;

     var file_size = 7340032;

     //Features
     var featureSubsidiaria = null;
     var featureMultibook = null;

     //Datos de Subsidiaria
     var companyname = null;
     var companyruc = null;

     //Period enddate falta implemnatr
     var periodMonth = null;
     var periodStart   = null;
     var periodName    = null;

     //Nombre de libro contable
     var multibookName = '';

     /**
      * Input Data for processing
      *
      * @return Array,Object,Search,File
      *
      * @since 2016.1
      */

     function getInputData() {
         try {
             log.error('Entro al get');
             ObtenerParametrosYFeatures();
             ObtenerDatosSubsidiaria();
             var arrTransacciones = ObtenerTransacciones();
             // var arrTransacciones = [];
             log.error('transacciones',arrTransacciones);

             var arrTransaccionesItemReceipt = ObtenerTransferencias();
             log.error('ARREGLO item receipt',arrTransaccionesItemReceipt);

             arrTransacciones=arrTransacciones.concat(arrTransaccionesItemReceipt);
             log.error('transacciones + item receipt',arrTransacciones);

             var remesas = ObtenerRemesas();
             log.error('remesas', remesas);
             return arrTransacciones.concat(remesas);

         } catch (error) {
             log.error('Error de getInputData', error);
             libreria.sendErrorEmail(error, 'LMRY_script', language);

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
             log.error('Entro al map');
             ObtenerParametrosYFeatures();
             var arrTemp = JSON.parse(context.value);

             var posicion=arrTemp[18].lastIndexOf('/');
             var cadenaCTS=arrTemp[18].substr(posicion+1,2);

             if(cadenaCTS=='' || cadenaCTS==null){
                var cstItemLine=ObtenerCSTItem(arrTemp[12],arrTemp[19],arrTemp[13]);
                arrTemp[18]=arrTemp[18]+cstItemLine;
             }

             if (arrTemp[20] == 'P') {
                 if (arrTemp[19] != '') {
                     var CFOPAMOUNT = ObtenerCFOPAmount(arrTemp[12],arrTemp[19]);
                     
                     var aux = CFOPAMOUNT.split('|');
                     arrTemp[12] = aux[0];
                 } else {
                     arrTemp[12] = '';
                     
                 }
             } else if (arrTemp[20] == 'R') {
                 arrTemp[10] = ObtenerUFRemesas(arrTemp[10]);
             }

             var column0 = arrTemp[0];
             // 1. Espécie = Latam - Legal Document Type
             var column1 = arrTemp[2] + '%' + arrTemp[3];
             // 2. Série Sub - Série = Latam - CxP Serie
             var column2 = arrTemp[4].substr(0,3);
             // 3. Número = Latam - Preprinted Number
             var column3 = arrTemp[5].substr(0,6);
             // 4. Data Do Documento = Date (DD/MM/AAAA)
             var column4 = arrTemp[6];
             // 5. Código Emitente = Latam - Nro de Registro Contribuyente + ‘ ‘ + Latam State Tax Subscription +  ‘ ‘ + Name
             var column5 = arrTemp[9] + ' ' +arrTemp[8] + ' ' + arrTemp[7];
             var column5 = column5.trim();
             // 6. UF Origen = LATAM - PROVINCE ACRONYM (UF del Vendor)
             var column6 = arrTemp[10];
             // 7. Valor Contábil = AMOUNT (GROSS) (99.999.999,99)
             var column7 = arrTemp[11];
             // 8. Contábil = No Es Obligatorio
             var column8 = '';
             // 9. Fiscal = LATAM COL - CFOP (CFOP)
             var column9 = arrTemp[12];
             // 10. Observación = memo
             var column10 = arrTemp[17];
             // 11. Tributo ICMS o IPI
             var column11 = arrTemp[13];
             // 12. Base de Calculo Valor da Operacão = LATAM - BASE AMOUNT
             var column12 = arrTemp[14];
             // 13. Alíq. = LATAM - PERCENTAGE
             var column13 = arrTemp[15];
             // 14. Imposto Creditado = LATAM - TOTAL
             var column14 = arrTemp[16];
             // 15. Internal ID
             var column15 = arrTemp[18];

             var stringTransacciones = column0 + '|' + column1 + '|' + column2 + '|' + column3 + '|' + column4 + '|'
                                     + column5 + '|' + column6 + '|' + column7 + '|' + column8 + '|' + column9 + '|'
                                     + column10 + '|' + column11 + '|' + column12 + '|' + column13 + '|' + column14
                                     + '|' + column15 + '|';

             log.debug('stringTransacciones',stringTransacciones);   
            
             var cal = column15.split('/');

             // Separo en este formato
             // [
             //    Internal ID BILL: "3234770", ...................0
             //    ID Vendor: "8807", ...................1
             //    Latam - Line Unique Key: "10638741",  ...................2
             //    Latam - Tax Type: "Calculo de Impuestos", ...................3
             //    Latam BR - Tax Situation Code(Ultimos 2 digitos):  "00" ...................4
             // ]   

             
             
             if(Number(column13).toFixed(2) > 0){
                 if(cal[3] == 'Calculo de Impuestos'){
                     if (arrTemp[20] != 'R') {
                         // Si el LATAM COL - CFOP es diferente a vacio o nulo y la Base Amount es diferente de 0
                         if (column9 != '' && column9 != null && column12!= 0){
                             log.error(context.key,stringTransacciones);
                             context.write(context.key, stringTransacciones);
                         }
                     } else {
                         //  Si el LATAM COL - CFOP es diferente a 0 o nulo
                         if (column9 != '' && column9 != null){
                             context.write(context.key, stringTransacciones);
                             log.error(context.key,stringTransacciones);
                         }
                     }
                 }
             } else {
                 if(column11 == 'ICMS'){
                     if(cal[4] == '40' || cal[4] == '41' || cal[4] == '90' || cal[4] == '60' || cal[4] == 'Remesa'){
                         if (arrTemp[20] != 'R') {
                             // Si el LATAM COL - CFOP es diferente a vacio o nulo y la Base Amount es diferente de 0
                             if (column9 != '' && column9 != null && column12!= 0){
                                 log.error(context.key,stringTransacciones);
                                 context.write(context.key, stringTransacciones);
                             }
                         } else {
                              // Si el LATAM COL - CFOP es diferente a vacio o nulo
                             if (column9 != '' && column9 != null){
                                 context.write(context.key, stringTransacciones);
                                 log.error(context.key,stringTransacciones);
                             }
                         }
                     }
                 }
                 if(column11 == 'IPI'){
                     if(cal[4] == '03' || cal[4] == '02' || cal[4] == '49' || cal[4] == 'Remesa'){
                         if (arrTemp[20] != 'R') {
                             // Si el LATAM COL - CFOP es diferente a vacio o nulo y la Base Amount es diferente de 0
                             if (column9 != '' && column9 != null && column12!= 0){
                                 log.error(context.key,stringTransacciones);
                                 context.write(context.key, stringTransacciones);
                             }
                         } else {
                             // Si el LATAM COL - CFOP es diferente a vacio o nulo
                             if (column9 != '' && column9 != null){
                                 context.write(context.key, stringTransacciones);
                                 log.error(context.key,stringTransacciones);
                             }
                         }
                     }
                 }
             }
             
             

         } catch (err) {
             log.error('Error de MAP', error);
         }
     }

     /**
      * If this entry point is used, the reduce function is invoked one time for
      * each key and list of values provided..
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

     /**
      * If this entry point is used, the reduce function is invoked one time for
      * each key and list of values provided..
      *
      * @param {Object} context
      * @param {boolean} context.isRestarted - Indicates whether the current invocation of the represents a restart.
      * @param {number} context.concurrency - The maximum concurrency number when running the map/reduce script.
      * @param {Date} context.datecreated - The time and day when the script began running.
      * @param {number} context.seconds - The total number of seconds that elapsed during the processing of the script.
      * @param {number} context.usage - TThe total number of usage units consumed during the processing of the script.
      * @param {number} context.yields - The total number of yields that occurred during the processing of the script.
      * @param {Object} context.inputSummary - Object that contains data about the input stage.
      * @param {Object} context.mapSummary - Object that contains data about the map stage.
      * @param {Object} context.reduceSummary - Object that contains data about the reduce stage.
      * @param {Iterator} context.ouput - This param contains a "iterator().each(parameters)" function
      *
      * @since 2016.1
      */
     function summarize(context) {
         try {
             log.error('Entro al summarize');
             ObtenerParametrosYFeatures();
             ObtenerDatosSubsidiaria();

             var FILE_SIZE_MAX = 9000000;
             var numero_registros = 0;
             var tamanoArchivo = 0;
             var primerArchivo = true;
             var text = '';
             var vectorColum = [];
             var vector_percepciones = [];

             context.output.iterator().each(function(key, value) {
                 //log.debug("key", key);
                 
                
                 vectorColum = value.split('|');
                 vector_percepciones.push(vectorColum);
                 return true;
             });
             if (vector_percepciones.length != 0) {
                 for (var i=0; i<vector_percepciones.length;i++){
                     var cadenaEnvio = vector_percepciones[i][0] + '|' + vector_percepciones[i][1] + '|' + vector_percepciones[i][2] + '|' + vector_percepciones[i][3] + '|' +
                                       vector_percepciones[i][4] + '|' + vector_percepciones[i][5] + '|' + vector_percepciones[i][6] + '|' + vector_percepciones[i][7] + '|' +
                                       vector_percepciones[i][8] + '|' + vector_percepciones[i][9] + '|' + vector_percepciones[i][10] + '|' + vector_percepciones[i][11] + '|' +
                                       vector_percepciones[i][12] + '|' + vector_percepciones[i][13] + '|' + vector_percepciones[i][14]+ '|' + vector_percepciones[i][15]+ '|' + '\r\n';

                     // log.debug('cadenaEnvio summary',cadenaEnvio);
                     tamanoArchivo += lengthInUtf8Bytes(cadenaEnvio);
                     text += cadenaEnvio;
                     numero_registros++;

                     if (tamanoArchivo > FILE_SIZE_MAX) {
                         log.debug('Se ha superado el tamaño de archivo', text);
                         if (primerArchivo) {
                             paramCont = 1;
                         }
                         var fileid = SaveFile(text);
                         paramFile = paramFile + fileid + '|';
                         text = '';
                         tamanoArchivo = 0;
                         numero_registros = 0;
                         paramCont = Number(paramCont) + 1;
                         primerArchivo = false;
                     }
                 }
             }else {
                 log.debug('No hay data',vector_percepciones );
                 NoData();
             }
             if (numero_registros != 0) {
                 var fileid = SaveFile(text);
                 paramFile = paramFile + fileid + '|';
             }
             LanzarScheduled();
         } catch (error) {
             log.error('Error de SUMMARIZE', error);
             LanzarScheduled();
             libreria.sendErrorEmail(error,'LMRY_script',language);
         }
     }

    function NoData() {
         var record = recordModulo.load({
             type: 'customrecord_lmry_br_rpt_generator_log',
             id: paramIDRecord
         });

         record.setValue({
             fieldId: 'custrecord_lmry_br_rg_name_field',
             value: 'No existe informacion para los criterios seleccionados.'
         });
         record.setValue({
             fieldId: 'custrecord_lmry_br_rg_period',
             value: periodName
         });

         var recordId = record.save();
     }

     function lengthInUtf8Bytes(str) {
         var m = encodeURIComponent(str).match(/%[89ABab]/g);
         return str.length + (m ? m.length : 0);
     }


     function LanzarScheduled() {
         ObtenerParametrosYFeatures();
         var params = {};
         params['custscript_lmry_br_livro_e_periodo'] = paramPeriodo;
         if (featureSubsidiaria) {
             params['custscript_lmry_br_livro_e_subsidiary'] = paramSubsidiaria;
         }
         if (featureMultibook) {
             params['custscript_lmry_br_livro_e_multibook'] = paramMultibook;
         }
         params['custscript_lmry_br_livro_e_idreport'] = paramIDReport;
         params['custscript_lmry_br_livro_e_idrecord'] = paramIDRecord;
         //params['custscript_lmry_br_livro_e_file'] = 971387;
         params['custscript_lmry_br_livro_e_file'] = paramFile;
         params['custscript_lmry_br_livro_e_formato'] = paramTipoFormato;

         // REPORTE EN EXCEL
         params['custscript_lmry_br_livro_e_form_excel'] = paramFormatoExcel;
         

         var RedirecSchdl = task.create({
             taskType: task.TaskType.SCHEDULED_SCRIPT,
             scriptId: 'customscript_lmry_br_livro_entrada_schdl',
             deploymentId: 'customdeploy_lmry_br_livro_entrada_schdl',
             params: params
         });

         RedirecSchdl.submit();
     }

     function ValidarAcentos(s) {
         var AccChars = "ŠŽšžŸÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðñòóôõöùúûüýÿ°–—ªº·";
         var RegChars = "SZszYAAAAAACEEEEIIIIDNOOOOOUUUUYaaaaaaceeeeiiiidnooooouuuuyyo--ao.";

         s = s.toString();
         for (var c = 0; c < s.length; c++) {
             for (var special = 0; special < AccChars.length; special++) {
                 if (s.charAt(c) == AccChars.charAt(special)) {
                     s = s.substring(0, c) + RegChars.charAt(special) + s.substring(c + 1, s.length);
                 }
             }
         }
         return s;
     }
     function ValidarAcentos2(s) {
         var AccChars = "ŠŽšžŸÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðñòóôõöùúûüýÿ°–—ªº·-,_.";
         var RegChars = "SZszYAAAAAACEEEEIIIIDNOOOOOUUUUYaaaaaaceeeeiiiidnooooouuuuyyo--ao.    ";

         s = s.toString();
         for (var c = 0; c < s.length; c++) {
             for (var special = 0; special < AccChars.length; special++) {
                 if (s.charAt(c) == AccChars.charAt(special)) {
                     s = s.substring(0, c) + RegChars.charAt(special) + s.substring(c + 1, s.length);
                 }
             }
         }
         return s;
     }

     function SaveFile(contenido) {
         var FolderId = objContext.getParameter({
             name: 'custscript_lmry_file_cabinet_rg_br'
         });

         // Almacena en la carpeta de Archivos Generados
         if (FolderId != '' && FolderId != null) {
             // Extension del archivo
             var NameFile = 'LivroDiarioEntrada' + '.txt';
             // Crea el archivo
             var file = fileModulo.create({
                 name: NameFile,
                 fileType: fileModulo.Type.PLAINTEXT,
                 contents: contenido,
                 encoding: fileModulo.Encoding.UTF8,
                 folder: FolderId
             });
             var idfile = file.save(); // Termina de grabar el archivo
             log.error('ID ARCHIVO', idfile);
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
             log.error('URL',urlfile);

             return idfile;
         } else {
             // Debug
             log.debug({
                 title: 'Creacion de File:',
                 details: 'No existe el folder'
             });
         }
         return idfile;
     }

     function ObtenerParametrosYFeatures() {
         //Parametro
         paramSubsidiaria = objContext.getParameter({name: 'custscript_lmry_br_livro_entrada_sub'});
         paramPeriodo     = objContext.getParameter({name: 'custscript_lmry_br_livro_entrada_per'});
         paramMultibook   = objContext.getParameter({name: 'custscript_lmry_br_livro_entrada_mlb'});
         paramIDReport    = objContext.getParameter({name: 'custscript_lmry_br_livro_entrada_id_rp'});
         paramIDRecord    = objContext.getParameter({name: 'custscript_lmry_br_livro_entrada_id_rc'});
         paramTipoFormato = objContext.getParameter({name: 'custscript_lmry_br_livro_entrada_fmt'});
         paramFormatoExcel= objContext.getParameter({name: 'custscript_lmry_br_livro_format_excel'});


         log.debug({
             title: 'Parametros:',
             details: paramSubsidiaria + ' , ' + paramPeriodo + ' , ' + paramMultibook + ' , '
                     + paramIDReport + ' , ' + paramIDRecord + ' , ' + paramTipoFormato
         });
         //Features
         featureSubsidiaria = runtime.isFeatureInEffect({
             feature: "SUBSIDIARIES"
         });
         featureMultibook = runtime.isFeatureInEffect({
             feature: "MULTIBOOK"
         });

         //Period
         var periodenddate_temp = search.lookupFields({
             type: search.Type.ACCOUNTING_PERIOD,
             id: paramPeriodo,
             columns: ['enddate', 'periodname','startdate']
         });
         periodName = periodenddate_temp.periodname;
         var period_aux_moment = periodenddate_temp.enddate;
         periodStart = periodenddate_temp.startdate;
         var fecha_format = format.parse({
             value: period_aux_moment,
             type: format.Type.DATE
         });
         var MM = fecha_format.getMonth() + 1;
         var YYYY = fecha_format.getFullYear();
         var DD = fecha_format.getDate();

         periodo_aux = DD + '/' + MM + '/' + YYYY;
         
         var auxiliar = periodo_aux.split('/');

         if (auxiliar[0].length == 1) {
             auxiliar[0] = '0' + auxiliar[0];
         }
         if (auxiliar[1].length == 1) {
             auxiliar[1] = '0' + auxiliar[1];
         }

         periodMonth = auxiliar[1];
         periodAnio = auxiliar[2];
         periodStart = '01/' + auxiliar[1] + '/' + auxiliar[2];

         if (featureMultibook) {
             //Multibook Name
             var multibookName_temp = search.lookupFields({
                 type: search.Type.ACCOUNTING_BOOK,
                 id: paramMultibook,
                 columns: ['name']
             });
             multibookName = multibookName_temp.name;
         }
     }

     function ObtenerDatosSubsidiaria() {
         var configpage = config.load({
             type: config.Type.COMPANY_INFORMATION
         });

         if (featureSubsidiaria) {
             companyname = ObtainNameSubsidiaria(paramSubsidiaria);
             companyruc = ObtainFederalIdSubsidiaria(paramSubsidiaria);
         } else {
             companyruc = configpage.getFieldValue('employerid');
             companyname = configpage.getFieldValue('legalname');
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

                 return subsidyName.legalname
             }
         } catch (err) {
             libreria.sendErrorEmail(err, LMRY_script, language);

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

                 return federalId.taxidnum
             }
         } catch (err) {
             libreria.sendErrorEmail(err, LMRY_script, language);
         }
         return '';
     }

     function ObtenerTaxCredit(bill){
         var intDMinReg = 0;
         var intDMaxReg = 1000;
         var DbolStop = false;
         var searchTaxCredit = search.create({
             type: "customrecord_lmry_br_transaction_fields",
             filters:
             [
                ["custrecord_lmry_br_related_transaction","anyof",bill]
             ],
             columns:
             [
                search.createColumn({
                    name: "custrecord_lmry_br_taxs_credits",
                    label: "Latam - BR Taxs Credits?"})
             ]
          });
          var searchresult = searchTaxCredit.run();

          var Data = '';
          while (!DbolStop) {
              var objResult = searchresult.getRange(intDMinReg, intDMaxReg);
              if (objResult != null) {
                  var intLength = objResult.length;
                  if (intLength != 1000) {
                      DbolStop = true;
                  }
                  var arrTax = [];
                  for (var i = 0; i < intLength; i++) {
                      var Arrtemporal = [];
                      var columns = objResult[i].columns;
                      var columna0 = objResult[i].getValue(columns[0]);
                  }
                if (!DbolStop) {
                      intDMinReg = intDMaxReg;
                      intDMaxReg += 1000;
                  }
              } else {
                  DbolStop = true;
              }
          }
          if(columna0 == true){
             var banderita=1;
          }else{
             var banderita=0;
          }
          return banderita;
     }

     function ObtenerBook(booking){
            
             var auxiliar = ('' + booking).split('&');
             var final='';

             if(featureMultibook){
                
               var id_libro =  auxiliar[0].split('|');
               
               var exchange_rate =  auxiliar[1].split('|');

               for(var i=0; i<id_libro.length; i++){
                 if(Number(id_libro[i])==Number(paramMultibook)){
                   final = exchange_rate[i];
                   break;
                 }else{
                   final = exchange_rate[0];
                 }
               }
             }else{
               final = auxiliar[1];
             }
             return final;
     }

     function ObtenerCFOPAmount(idtransaction,unique){

         var intDMinReg = 0;
         var intDMaxReg = 1000;
         var DbolStop = false;
         var transactionSearchObj = search.create({
             type: "transaction",
             filters:
             [
                ["type","anyof","ItemRcpt","VendBill"],
                "AND",
                ["mainline","is","F"],
                "AND",
                ["posting","is","T"],
                "AND",
                ["memorized","is","F"],
                "AND",
                ["voided","is","F"],
                "AND",
                ["internalid","anyof",idtransaction],
                "AND",
                ["lineuniquekey","equalto",unique]
             ],
             columns:
             [
                search.createColumn({name: "item", label: "Item"}),
                search.createColumn({
                   name: "formulatext",
                   formula: "{custcol_lmry_br_tran_outgoing_cfop}",
                   label: "Formula (Text)"
                }),
                search.createColumn({name: "grossamount", label: "Amount (Gross)"})
             ],
             settings: [{
               name: 'consolidationtype',
               value: 'NONE'
             }]
          });
          var searchresult = transactionSearchObj.run();

          var Data = '';
          while (!DbolStop) {
              var objResult = searchresult.getRange(intDMinReg, intDMaxReg);

              if (objResult != null || objResult.length!=0) {
                  var intLength = objResult.length;

                  if (intLength != 1000) {
                      DbolStop = true;
                  }
                  var arrPrueba = [];
                  for (var i = 0; i < intLength; i++) {
                      var Arrtemporal = [];
                      var columns = objResult[i].columns;
                      var columna0 = objResult[i].getValue(columns[0]);
                      var columna1 = objResult[i].getValue(columns[1]);
                      var columna2 = objResult[i].getValue(columns[2]);
                      arrPrueba = [columna0,columna1,columna2];

                     //  Ejemplo
                     // [
                     //  ITEM:               "2428",
                     //  Latam Col – CFOP:  "2152",
                     //  AMOUNT:             "-1050.00"
                     //  ]
                      
                  }
                if (!DbolStop) {
                      intDMinReg = intDMaxReg;
                      intDMaxReg += 1000;
                  }
              } else {
                  DbolStop = true;
              }
          }

          var banderita = columna1 +'|'+ columna2;
         //  log.debug('arrPrueba',arrPrueba);
         //  log.debug('banderita',banderita);
          return banderita;
     }

     function ObtenerCSTItem(idtransaction,unique,tributo){

        var cstItemLine='';
         var intDMinReg = 0;
         var intDMaxReg = 1000;
         var DbolStop = false;
         var transactionSearchObj = search.create({
             type: "transaction",
             filters:
             [
                ["type","anyof","ItemRcpt","VendBill"],
                "AND",
                ["mainline","is","F"],
                "AND",
                ["posting","is","T"],
                "AND",
                ["memorized","is","F"],
                "AND",
                ["voided","is","F"],
                "AND",
                ["internalid","anyof",idtransaction],
                "AND",
                ["lineuniquekey","equalto",unique]
             ],
             columns:
             [
                search.createColumn({name: "item", label: "Item"}),
                search.createColumn({
                   name: "formulatext",
                   formula: "{custcol_lmry_br_tran_outgoing_cfop}",
                   label: "Formula (Text)"
                }),
                search.createColumn({name: "grossamount", label: "Amount (Gross)"})
             ],
             settings: [{
               name: 'consolidationtype',
               value: 'NONE'
             }]
          });

          // 3. Situation Code ICMS
         var icmsCst =search.createColumn({
            name: "formulatext",
            formula: "{custcol_lmry_br_cst_icms.custrecord_lmry_br_tax_situacion_code}",
         });
         transactionSearchObj.columns.push(icmsCst);

         // 4. Situation Code IPI
         var ipiCst = search.createColumn({
            name: "formulatext",
            formula: "{custcol_lmry_br_cst_ipi.custrecord_lmry_br_tax_situacion_code}",
         });
         transactionSearchObj.columns.push(ipiCst);

          var searchresult = transactionSearchObj.run();

          while (!DbolStop) {
              var objResult = searchresult.getRange(intDMinReg, intDMaxReg);

              if (objResult != null || objResult.length!=0) {
                  var intLength = objResult.length;

                  if (intLength != 1000) {
                      DbolStop = true;
                  }
                  for (var i = 0; i < intLength; i++) {

                    var columns = objResult[i].columns;
                    log.debug('tributo',tributo);
                      
                    if(tributo.toUpperCase()=='ICMS'){
                        cstItemLine = objResult[i].getValue(columns[3]);
                    }else if(tributo.toUpperCase()=='IPI'){
                        cstItemLine = objResult[i].getValue(columns[4]);
                    }else{
                        cstItemLine = '';    
                    }
                    
                    if(cstItemLine!=null && cstItemLine!= '- None -' && cstItemLine != '-none-' && cstItemLine != ''){
                        cstItemLine = cstItemLine.substr(-2);
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
          return cstItemLine;
     }



     function ObtenerRemesas() {
         var searchload = search.load({
             //LatamReady - BR Entry Book Remittances
             id: 'customsearch_lmry_br_lbr_entrada_remesas'
         });
         if (featureSubsidiaria) {
             var subsidiaryFilter = search.createFilter({
                 name: 'subsidiary',
                 operator: search.Operator.IS,
                 values: [paramSubsidiaria]
             });
             searchload.filters.push(subsidiaryFilter);
         }
         var periodFilter = search.createFilter({
             name: 'postingperiod',
             operator: search.Operator.IS,
             values: [paramPeriodo]
         });
         searchload.filters.push(periodFilter);
         if (featureMultibook) {
             var multibookFilter = search.createFilter({
                 name: 'accountingbook',
                 join: 'accountingtransaction',
                 operator: search.Operator.IS,
                 values: [paramMultibook]
             });
             searchload.filters.push(multibookFilter);
         }

         var taxTypeFilter = search.createFilter({
             name: 'formulatext',
             formula: "CASE WHEN {custcol_lmry_br_cst_ipi} IS NOT NULL THEN '1' ELSE CASE WHEN {custcol_lmry_br_cst_icms} IS NOT NULL THEN '1' ELSE '0' END END",
             operator: search.Operator.IS,
             values: '1'
         });
         searchload.filters.push(taxTypeFilter);

         var internalIdColumn = search.createColumn({
             name: 'internalid'
         });
         searchload.columns.push(internalIdColumn);

         var vendorColumn = search.createColumn({
             name: 'internalid',
             join: 'vendor'
         });
         searchload.columns.push(vendorColumn);

         var lineUniqueKeyColumn = search.createColumn({
             name: 'lineuniquekey'
         });
         searchload.columns.push(lineUniqueKeyColumn);

         var pagedData = searchload.runPaged({
             pageSize : 1000
         });

         var page, auxArray, columns, resultArray = [], tributos;
         pagedData.pageRanges.forEach(function(pageRange) {
             page = pagedData.fetch({
                 index : pageRange.index
             });
             page.data.forEach(function(result) {
                 columns = result.columns;
                 tributos = [];
                 if (result.getValue(columns[13])) {
                     tributos.push('ICMS');
                 }
                 if (result.getValue(columns[14])) {
                     tributos.push('IPI');
                 }

                 for (var i = 0; i < tributos.length; i++) {
                     auxArray = [];
                     // 0. Data de Entrada
                     auxArray[0] = result.getValue(columns[0]);

                     // 1. Period
                     auxArray[1] = result.getValue(columns[1]);

                     // 2. Especie
                     auxArray[2] = result.getValue(columns[2]);

                     // 3. Especie 1 Document Type
                     auxArray[3] = result.getValue(columns[3]);

                     // 4. Serie
                     auxArray[4] = result.getValue(columns[4]);

                     // 5. Numero
                     auxArray[5] = result.getValue(columns[5]);

                     // 6. Data de Documento
                     auxArray[6] = result.getValue(columns[6]);

                     // 7. Emitente
                     auxArray[7] = result.getValue(columns[7]);

                     // 8. State Tax Subscription
                     auxArray[8] = result.getValue(columns[8]);

                     // 9. VatRegNumber
                     auxArray[9] = result.getValue(columns[9]);

                     // 10. UF PURCHARSE ORDER
                     auxArray[10] = result.getValue(columns[10]);

                     // 11. Valor Contable                       
                     auxArray[11] = round(result.getValue(columns[11]));
                     
                     // 12. CFOP
                     auxArray[12] = result.getValue(columns[12]);

                     // 13. Tributo
                     auxArray[13] = tributos[i];

                     // 14. Base de Cálculo
                     auxArray[14] = round(result.getValue(columns[11]));

                     // 15. Alicuota
                     auxArray[15] = result.getValue(columns[15]);

                     // 16. Impuesto
                     auxArray[16] = result.getValue(columns[16]);

                     // 17. Obs
                     auxArray[17] = result.getValue(columns[18]);
                     auxArray[17] = validarCaracteres(auxArray[17]);

                     // 18. internalId - Vendor Internalid - LineUniqueKey - TAX TYPE VACIO EN REMESAS - Tax Situation Code
                     auxArray[18] = result.getValue(columns[19]) + '/' + result.getValue(columns[20]) + '/' +  result.getValue(columns[21]) + '//Remesa';

                     // 19. LineUniqueKey
                     auxArray[19] = result.getValue(columns[21]);

                     // 20. Remesa
                     auxArray[20] = 'R';

                     resultArray.push(auxArray);
                 }
             });
         })
         return resultArray;
     }

     function ObtenerTransacciones() {
         var cont = 0;
         var intDMinReg = 0;
         var intDMaxReg = 1000;
         var DbolStop = false;
         var infoTxt = '';
         var searchload = search.load({
             //LatamReady - BR Purchase Book
             id: 'customsearch_lmry_br_purchases_reg_entry'
         });
         if (featureSubsidiaria) {
             var subsidiaryFilter = search.createFilter({
                 name: 'subsidiary',
                 operator: search.Operator.IS,
                 values: [paramSubsidiaria]
             });
             searchload.filters.push(subsidiaryFilter);
         }
         var periodFilter = search.createFilter({
             name: 'postingperiod',
             operator: search.Operator.IS,
             values: [paramPeriodo]
         });
         searchload.filters.push(periodFilter);

         var posting = search.createFilter({
             name: 'posting',
             operator: search.Operator.IS,
             values: 'T'
         });
         searchload.filters.push(posting);            

         if (featureMultibook) {
             var multibookFilter = search.createFilter({
                 name: 'accountingbook',
                 join: 'accountingtransaction',
                 operator: search.Operator.IS,
                 values: [paramMultibook]
             });
             searchload.filters.push(multibookFilter);
         }
         var documentFilter = search.createFilter({
             name: 'formulatext',
             // Nota Fiscal de Serviço Eletrônica
             formula: "CASE WHEN {custbody_lmry_document_type.custrecord_lmry_codigo_doc} = '99' THEN 1 ELSE 0 END",
             operator: search.Operator.IS,
             values: '0'
         });
         searchload.filters.push(documentFilter);

         var icmsFilter = search.createFilter({
             name: 'formulatext',
             formula: "CASE WHEN ({custrecord_lmry_br_transaction.custrecord_lmry_br_type} = 'ICMS' OR {custrecord_lmry_br_transaction.custrecord_lmry_br_type} = 'IPI') THEN 1 ELSE 0 END",
             operator: search.Operator.IS,
             values: '1'
         });
         //18
         searchload.filters.push(icmsFilter);

         var internalIDColum = search.createColumn({
             name: 'internalid'
         });
         searchload.columns.push(internalIDColum);
         var lineUniqueColum = search.createColumn({
             name: "formulanumeric",
             formula: "{custrecord_lmry_br_transaction.custrecord_lmry_lineuniquekey}",
         });
         searchload.columns.push(lineUniqueColum);

         var idVendorColum = search.createColumn({
             name: "internalid",
             join: "vendor",
             label: "Internal ID"
         });
         searchload.columns.push(idVendorColum);
         var calculoImpuestoColum = search.createColumn({
             name: "formulatext",
             formula: "{custrecord_lmry_br_transaction.custrecord_lmry_tax_type}",
             label: "Formula (Text)"
         });
         searchload.columns.push(calculoImpuestoColum);
         var taxSituationColum = search.createColumn({
             name: "formulatext",
             formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_tax_taxsituation_cod}",
             label: "Formula (Text)"
         });
         searchload.columns.push(taxSituationColum);

         var taxSituationColum = search.createColumn({
             name: "formulatext",
             formula: "{custrecord_lmry_br_transaction.custrecord_lmry_accounting_books}",
             label: "Formula (Text)"
         });
         searchload.columns.push(taxSituationColum);
         //24
         var BALocalCurrency= search.createColumn({
             name: "formulanumeric",
             formula: "{custrecord_lmry_br_transaction.custrecord_lmry_base_amount_local_currc}"
         });
         searchload.columns.push(BALocalCurrency);
         //25
         var AmountLocalCurrency= search.createColumn({
             name: "formulanumeric",
             formula: "{custrecord_lmry_br_transaction.custrecord_lmry_amount_local_currency}"
         });
         searchload.columns.push(AmountLocalCurrency);
         //26
         var GrossLocalCurrency= search.createColumn({
             name: "formulanumeric",
             formula: "{custrecord_lmry_br_transaction.custrecord_lmry_gross_amt_local_curr}"
         });
         searchload.columns.push(GrossLocalCurrency);
         //27 Cancelado
         var Cancel= search.createColumn({
             name: "formulatext",
             formula: "{custrecord_lmry_ei_ds_doc.custrecord_lmry_ei_ds_doc_status}"
         });
         searchload.columns.push(Cancel);
        //28 entityid
        var entityId= search.createColumn({
            name: "formulatext",
            formula: "{vendor.entityid}"
        });
        searchload.columns.push(entityId);

         var searchresult = searchload.run();
         var Data = '';
         while (!DbolStop) {
             var objResult = searchresult.getRange(intDMinReg, intDMaxReg);
             if (objResult != null) {
                 var intLength = objResult.length;
                 
                 if (intLength != 1000) {
                     DbolStop = true;
                 }
                 var info2Arr = [];
                 for (var i = 0; i < intLength; i++) {
                     var Arrtemporal = [];
                     var columns = objResult[i].columns;
                     
                     // 0. Data de Entrada
                     if (objResult[i].getValue(columns[0]) != null && objResult[i].getValue(columns[0]) != '- None -' && objResult[i].getValue(columns[0]) != '-none-') {
                         var columna0 = objResult[i].getValue(columns[0]);
                     } else {
                         var columna0 = '';
                     }
                     // 1. Period
                     if (objResult[i].getValue(columns[1]) != null && objResult[i].getValue(columns[1]) != '- None -' && objResult[i].getValue(columns[1]) != '-none-') {
                         var columna1 = objResult[i].getValue(columns[1]);
                     } else {
                         var columna1 = '';
                     }
                     // 2. Especie
                     if (objResult[i].getValue(columns[2]) != null && objResult[i].getValue(columns[2]) != '- None -' && objResult[i].getValue(columns[2]) != '-none-') {
                         var columna2 = objResult[i].getValue(columns[2]);
                     } else {
                         var columna2 = '';
                     }
                     // 3. Especie 1 Document Type
                     if (objResult[i].getValue(columns[3]) != null && objResult[i].getValue(columns[3]) != '- None -' && objResult[i].getValue(columns[3]) != '-none-') {
                         var columna3 = objResult[i].getValue(columns[3]);
                     } else {
                         var columna3 = '';
                     }
                     // 4. Serie
                     if (objResult[i].getValue(columns[4]) != null && objResult[i].getValue(columns[4]) != '- None -' && objResult[i].getValue(columns[4]) != '-none-') {
                         var columna4 = objResult[i].getValue(columns[4]);
                     } else {
                         var columna4 = '';
                     }
                     // 5. Numero
                     if (objResult[i].getValue(columns[5]) != null && objResult[i].getValue(columns[5]) != '- None -' && objResult[i].getValue(columns[5]) != '-none-') {
                         var columna5 = objResult[i].getValue(columns[5]);
                     } else {
                         var columna5 = '';
                     }
                     // 6. Data de Documento
                     if (objResult[i].getValue(columns[6]) != null && objResult[i].getValue(columns[6]) != '- None -' && objResult[i].getValue(columns[6]) != '-none-') {
                         var columna6 = objResult[i].getValue(columns[6]);
                     } else {
                         var columna6 = '';
                     }
                     // 7. Emitente
                     if (objResult[i].getValue(columns[7]) != 'ERROR: Field Not Found' && objResult[i].getValue(columns[7]) != null && objResult[i].getValue(columns[7]) != '- None -' && objResult[i].getValue(columns[7]) != '-none-') {
                         var columna7 = objResult[i].getValue(columns[7]);
                     } else {
                         var columna7 = objResult[i].getValue(columns[28]);
                     }
                     // 8. State Tax Subscription
                     if (objResult[i].getValue(columns[8]) != null && objResult[i].getValue(columns[8]) != '- None -' && objResult[i].getValue(columns[8]) != '-none-') {
                         var columna8 = objResult[i].getValue(columns[8]);
                     } else {
                         var columna8 = '';
                     }
                     // 9. VatRegNumber
                     if (objResult[i].getValue(columns[9]) != null && objResult[i].getValue(columns[9]) != '- None -' && objResult[i].getValue(columns[9]) != '-none-') {
                         var columna9 = objResult[i].getValue(columns[9]);
                     } else {
                         var columna9 = '';
                     }
                     // 10. UF
                      if (objResult[i].getValue(columns[10]) != null && objResult[i].getValue(columns[10]) != '- None -' && objResult[i].getValue(columns[10]) != '-none-') {
                         var columna10 = objResult[i].getValue(columns[10]);
                     } else {
                         var columna10 = '';
                     }
                     // 11. Valor contable
                      if (objResult[i].getValue(columns[11]) != null && objResult[i].getValue(columns[11]) != '- None -' && objResult[i].getValue(columns[11]) != '-none-') {
                         var auxColumna11 = objResult[i].getValue(columns[11]);
                     } else {
                         var auxColumna11 = '';
                     }
                     // 12. CFOP
                      if (objResult[i].getValue(columns[12]) != null && objResult[i].getValue(columns[12]) != '- None -' && objResult[i].getValue(columns[12]) != '-none-') {
                         var auxColumna12 = objResult[i].getValue(columns[12]);
                     } else {
                         var auxColumna12 = '';
                     }
                     // 13. Tributo
                     if (objResult[i].getValue(columns[13]) != null && objResult[i].getValue(columns[13]) != '- None -' && objResult[i].getValue(columns[13]) != '-none-') {
                         var columna13 = objResult[i].getValue(columns[13]);
                     } else {
                         var columna13 = '';
                     }
                     // 14. Base de Calculo
                     if (objResult[i].getValue(columns[14]) != null && objResult[i].getValue(columns[14]) != '- None -' && objResult[i].getValue(columns[14]) != '-none-') {
                         var auxColumna14 = objResult[i].getValue(columns[14]);
                     } else {
                         var auxColumna14 = '';
                     }
                     // 15. Alicuota
                      if (objResult[i].getValue(columns[15]) != null && objResult[i].getValue(columns[15]) != '- None -' && objResult[i].getValue(columns[15]) != '-none-') {
                         var columna15 = objResult[i].getValue(columns[15]);
                     } else {
                         var columna15 = '';
                     }
                     // 16. Impuesto
                      if (objResult[i].getValue(columns[16]) != null && objResult[i].getValue(columns[16]) != '- None -' && objResult[i].getValue(columns[16]) != '-none-') {
                         var auxColumna16 = objResult[i].getValue(columns[16]);
                     } else {
                         var auxColumna16 = '';
                     }
                     // 17. OBS
                     if (objResult[i].getValue(columns[17]) != null && objResult[i].getValue(columns[17]) != '- None -' && objResult[i].getValue(columns[17]) != '-none-') {                        
                         var columna17 = objResult[i].getValue(columns[17]);
                         columna17 = validarCaracteres(columna17);
                     } else {
                         var columna17 = '';
                     }
                     // 18. Internal ID
                     if (objResult[i].getValue(columns[18]) != null && objResult[i].getValue(columns[18]) != '- None -' && objResult[i].getValue(columns[18]) != '-none-') {
                         var auxColumna18 = objResult[i].getValue(columns[18]);
                     } else {
                         var auxColumna18 = '';
                     }
                     // 19. Line Unique Key
                     if (objResult[i].getValue(columns[19]) != null && objResult[i].getValue(columns[19]) != '- None -' && objResult[i].getValue(columns[19]) != '-none-') {
                         var columna19 = objResult[i].getValue(columns[19]);
                     } else {
                         var columna19 = '';
                     }
                     // 20. ID Vendor
                     if (objResult[i].getValue(columns[20]) != null && objResult[i].getValue(columns[20]) != '- None -' && objResult[i].getValue(columns[20]) != '-none-') {
                         var columna20 = objResult[i].getValue(columns[20]);
                     } else {
                         var columna20 = '';
                     }
                     // 21. Calculo de Impuesto
                     if (objResult[i].getValue(columns[21]) != null && objResult[i].getValue(columns[21]) != '- None -' && objResult[i].getValue(columns[21]) != '-none-') {
                         var columna21 = objResult[i].getValue(columns[21]);
                     } else {
                         var columna21 = '';
                     }
                     // 22. Tax Situation Code
                     if (objResult[i].getValue(columns[22]) != null && objResult[i].getValue(columns[22]) != '- None -' && objResult[i].getValue(columns[22]) != '-none-') {
                         var columna22 = objResult[i].getValue(columns[22]);
                         columna22 = columna22.substr(-2);
                     } else {
                         var columna22 = '';
                     }
                     // 23. Accounting Book
                     if (objResult[i].getValue(columns[23]) != null && objResult[i].getValue(columns[23]) != '- None -' && objResult[i].getValue(columns[23]) != '-none-') {
                         var auxColumna23 = objResult[i].getValue(columns[23]);
                     } else {
                         var auxColumna23 = '';
                     }
                     
                     var columna23
                     if(auxColumna23 != ''){
                        columna23 = ObtenerBook(auxColumna23);
                     }
                     

                     var columna18 = auxColumna18 + '/' + columna20 + '/' + columna19 + '/' + columna21 + '/' + columna22 ;

                     columna11 = objResult[i].getValue(columns[26]);

                     columna12 = auxColumna18;

                     // 24. LATAM - BASE AMOUNT LOCAL CURRENCY
                     if (objResult[i].getValue(columns[24]) != null && objResult[i].getValue(columns[24]) != '- None -' && objResult[i].getValue(columns[24]) != '-none-' && objResult[i].getValue(columns[24]) != '' && objResult[i].getValue(columns[24]) != 'NaN' && objResult[i].getValue(columns[24]) != 'undefined') {
                         var columna14 = objResult[i].getValue(columns[24]);
                     }else{
                         var columna14 = Number(auxColumna14)*Number(columna23);
                     }

                     // 25. LATAM - AMOUNT LOCAL CURRENCY
                     if (objResult[i].getValue(columns[25]) != null && objResult[i].getValue(columns[25]) != '- None -' && objResult[i].getValue(columns[25]) != '-none-' && objResult[i].getValue(columns[25]) != '' && objResult[i].getValue(columns[25]) != 'NaN' && objResult[i].getValue(columns[25]) != 'undefined') {
                         var columna16 = objResult[i].getValue(columns[25]);
                     }else{
                         var columna16 = Number(auxColumna16)*Number(columna23);
                     }

                     // 26. Cancel
                     if (objResult[i].getValue(columns[27]) != null && objResult[i].getValue(columns[27]) != '- None -' && objResult[i].getValue(columns[27]) != '-none-' && objResult[i].getValue(columns[27]) != '' && objResult[i].getValue(columns[27]) != 'NaN' && objResult[i].getValue(columns[27]) != 'undefined') {
                         var columna27 = objResult[i].getValue(columns[27]);
                     }else{
                         var columna27 = '';
                     }

                     columna11 = columna14;
                     
                     
                     // Ejemplo
                     // [
                     //     "", ------------ DATA DE ENTRADA..........................0
                     //     "725",   ------------ POSTING PERIOD..........................1
                     //     "55", ------------  LATAM - LEGAL DOCUMENT TYPE.CODIGO ..........................2
                     //     "Nota Fiscal Eletrônica (Operações de aquisição / devolução)", ------------  LATAM - LEGAL DOCUMENT TYPE..........................3
                     //     "333", ------------ LATAM - CXP SERIES..........................4
                     //     "2595", ------------ LATAM - PREPRINTED NUMBER..........................5
                     //     "28/01/2022", ------------ DATE ..........................6
                     //     "Vendor BR test cc", ------------ VENDOR NAME ..........................7
                     //     "", ------------..........................8
                     //     "", ------------..........................9
                     //     "SP", ------------ ADDREESS, ACRONIMO..........................10
                     //     "7200", ------------ LATAM - BASE AMOUNT..........................11
                     //     "3234768", ------------ INTERNAL ID BILL..........................12
                     //     "ICMS", ------------ LATAM - SUB TYPE..........................13
                     //     "7200", ------------ LATAM - BASE AMOUNT..........................14
                     //     ".07", ------------ LATAM - PERCENTAGE..........................15
                     //     "504", ------------ LATAM - TOTAL..........................16
                     //     "", ------------..........................17
                     //     "3234768/8807/10638611/Calculo de Impuestos/00", ------------ INTERNAL ID BILL / ID VENDEDOR /LATAM - LINE UNIQUE KEY / LATAM - TAX TYPE /  LATAM BR - TAX SITUATION CODE(ULTIMOS 2 DIGITOS)..........................18
                     //     "10638611", ------------ LATAM - LINE UNIQUE KEY..........................19
                     //     "P" ------------..........................20
                     //  ]

                     Arrtemporal = [columna0, columna1, columna2, columna3, columna4, columna5, columna6, columna7, columna8, columna9,
                                    columna10, columna11, columna12, columna13, columna14, columna15, columna16, columna17, columna18, columna19, 'P'];

                     // log.debug('Arrtemporal',Arrtemporal);
                     
                     if(columna27 == 'Cancelada' || columna27 == 'Cancelado'){

                     } else{
                         info2Arr.push(Arrtemporal);
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
         return info2Arr;
     }

     function ObtenerTransferencias(){

         var intDMinReg = 0;
         var intDMaxReg = 1000;
         var DbolStop = false;

          var itemreceiptSearchObj = search.create({
             type: "itemreceipt",
             filters:
             [
                ["type","anyof","ItemRcpt"],
                "AND", 
                ["formulatext: {transferlocation}","isnotempty",""], 
                "AND", 
                ["mainline","is","T"], 
                "AND", 
                ["memorized","is","F"], 
                "AND", 
                ["taxline","is","F"], 
                "AND", 
                ["voided","is","F"]
             ],
             columns:
             [
                search.createColumn({
                   name: "formulatext",
                   formula: "TO_CHAR({custbody_lmry_register_date},'DD/MM/YYYY')",
                   label: "0. Data de Entrada"
                }),
                search.createColumn({name: "postingperiod", label: "Period"}),
                search.createColumn({
                   name: "formulatext",
                   formula: "{custbody_lmry_document_type.custrecord_lmry_codigo_doc}",
                   label: "2. Especie"
                }),
                search.createColumn({
                   name: "formulatext",
                   formula: "{custbody_lmry_document_type}",
                   label: "3. Especie1"
                }),
                search.createColumn({
                   name: "formulatext",
                   formula: "{custbody_lmry_serie_doc_cxp}",
                   label: "4. Serie"
                }),
                search.createColumn({
                   name: "formulatext",
                   formula: "{custbody_lmry_num_preimpreso}",
                   label: "5. Numero"
                }),
                search.createColumn({
                   name: "formulatext",
                   formula: "TO_CHAR({trandate},'DD/MM/YYYY')",
                   label: "6. Data do Documento"
                }),                   
                search.createColumn({
                   name: "formulatext",
                   formula: "{transferlocation}",
                   label: "7. FROM LOCATION"
                }),
                search.createColumn({
                 name: "formulatext",
                 formula: "{createdfrom.subsidiary.id}",
                 label: "8. UF"
                 }),
                search.createColumn({name: "grossamount", label: "Valor contable"}),
                search.createColumn({
                   name: "formulatext",
                   formula: "{custcol_lmry_br_tran_outgoing_cfop}",
                   label: "10. CFOP"
                }),
                search.createColumn({
                   name: "formulatext",
                   formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_type}",
                   label: "11. Tributo"
                }),
                search.createColumn({
                   name: "formulanumeric",
                   formula: "{custrecord_lmry_br_transaction.custrecord_lmry_base_amount}",
                   label: "12. Base Calculo"
                }),
                search.createColumn({
                   name: "formulanumeric",
                   formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_percent} *100",
                   label: "13. Alicuta"
                }),
                search.createColumn({
                   name: "formulanumeric",
                   formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_total}",
                   label: "14. Impuesto"
                }),
                search.createColumn({name: "memomain", label: "Memo (Main)"})
             ]
          });

          var posting = search.createFilter({
             name: 'posting',
             operator: search.Operator.IS,
             values: 'T'
         });
         itemreceiptSearchObj.filters.push(posting);   


          if (featureSubsidiaria) {
             var subsidiaryFilter = search.createFilter({
                 name: 'subsidiary',
                 operator: search.Operator.IS,
                 values: [paramSubsidiaria]
             });
             itemreceiptSearchObj.filters.push(subsidiaryFilter);
         }

         var periodFilter = search.createFilter({
             name: 'postingperiod',
             operator: search.Operator.IS,
             values: [paramPeriodo]
         });
         itemreceiptSearchObj.filters.push(periodFilter);

         if (featureMultibook) {
             var multibookFilter = search.createFilter({
                 name: 'accountingbook',
                 join: 'accountingtransaction',
                 operator: search.Operator.IS,
                 values: [paramMultibook]
             });
             itemreceiptSearchObj.filters.push(multibookFilter);
         }

         var documentFilter = search.createFilter({
             name: 'formulatext',
             // Nota Fiscal de Serviço Eletrônica
             formula: "CASE WHEN {custbody_lmry_document_type.custrecord_lmry_codigo_doc} = '99' THEN 1 ELSE 0 END",
             operator: search.Operator.IS,
             values: '0'
         });
         itemreceiptSearchObj.filters.push(documentFilter);

         var icmsFilter = search.createFilter({
             name: 'formulatext',
             formula: "CASE WHEN ({custrecord_lmry_br_transaction.custrecord_lmry_br_type} = 'ICMS' OR {custrecord_lmry_br_transaction.custrecord_lmry_br_type} = 'IPI') THEN 1 ELSE 0 END",
             operator: search.Operator.IS,
             values: '1'
         });            
         itemreceiptSearchObj.filters.push(icmsFilter);

         // 16 COLUMNA
         var internalIDColum = search.createColumn({
             name: 'internalid',
             label: "Internal ID"
         });
         itemreceiptSearchObj.columns.push(internalIDColum);

         // 17
         var lineUniqueColum = search.createColumn({
             name: "formulanumeric",
             formula: "{custrecord_lmry_br_transaction.custrecord_lmry_lineuniquekey}",
         });
         itemreceiptSearchObj.columns.push(lineUniqueColum);
         
         //18
         var calculoImpuestoColum = search.createColumn({
             name: "formulatext",
             formula: "{custrecord_lmry_br_transaction.custrecord_lmry_tax_type}",
             label: "Formula (Text)"
         });
         itemreceiptSearchObj.columns.push(calculoImpuestoColum);
         
         //19
         var taxSituationColum = search.createColumn({
             name: "formulatext",
             formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_tax_taxsituation_cod}",
             label: "Formula (Text)"
         });
         itemreceiptSearchObj.columns.push(taxSituationColum);
         
         //20
         var accountingBook = search.createColumn({
             name: "formulatext",
             formula: "{custrecord_lmry_br_transaction.custrecord_lmry_accounting_books}",
             label: "Formula (Text)"
         });
         itemreceiptSearchObj.columns.push(accountingBook);
         
         //21
         var BALocalCurrency= search.createColumn({
             name: "formulanumeric",
             formula: "{custrecord_lmry_br_transaction.custrecord_lmry_base_amount_local_currc}"
         });
         itemreceiptSearchObj.columns.push(BALocalCurrency);
         
         //22
         var AmountLocalCurrency= search.createColumn({
             name: "formulanumeric",
             formula: "{custrecord_lmry_br_transaction.custrecord_lmry_amount_local_currency}"
         });
         itemreceiptSearchObj.columns.push(AmountLocalCurrency);
         
         //23
         var GrossLocalCurrency= search.createColumn({
             name: "formulanumeric",
             formula: "{custrecord_lmry_br_transaction.custrecord_lmry_gross_amt_local_curr}"
         });
         itemreceiptSearchObj.columns.push(GrossLocalCurrency);
         //24 Cancelado
         var Cancel= search.createColumn({
             name: "formulatext",
             formula: "{custrecord_lmry_ei_ds_doc.custrecord_lmry_ei_ds_doc_status}"
         });
         itemreceiptSearchObj.columns.push(Cancel);
         
         //25 XML sacar el CST
         var xmlTaxResult = search.createColumn({
             name: 'formulatext',
             formula: '{custrecord_lmry_br_transaction.custrecord_lmry_br_taxcalc_rsp}'
         });
         itemreceiptSearchObj.columns.push(xmlTaxResult);

         // 26 Situation Code ICMS
         var icmsCst =search.createColumn({
             name: "formulatext",
             formula: "{custcol_lmry_br_cst_icms.custrecord_lmry_br_tax_situacion_code}",
          });
          itemreceiptSearchObj.columns.push(icmsCst);

          // 27 Situation Code IPI
          var ipiCst = search.createColumn({
             name: "formulatext",
             formula: "{custcol_lmry_br_cst_ipi.custrecord_lmry_br_tax_situacion_code}",
          });
          itemreceiptSearchObj.columns.push(ipiCst);

         var searchresult = itemreceiptSearchObj.run();

         while (!DbolStop) {
             var objResult = searchresult.getRange(intDMinReg, intDMaxReg);

             if (objResult != null) {
                 var intLength = objResult.length;
                 if (intLength != 1000) {
                     DbolStop = true;
                 }
                 var info3Arr = [];
                 for (var i = 0; i < intLength; i++) {
                     var Arrtemporal = [];
                     var columns = objResult[i].columns;

                     // 0. Data de Entrada
                     if (objResult[i].getValue(columns[0]) != null && objResult[i].getValue(columns[0]) != '- None -' && objResult[i].getValue(columns[0]) != '-none-') {
                         var columna0 = objResult[i].getValue(columns[0]);
                     } else {
                         var columna0 = '';
                     }
                     // 1. Period
                     if (objResult[i].getValue(columns[1]) != null && objResult[i].getValue(columns[1]) != '- None -' && objResult[i].getValue(columns[1]) != '-none-') {
                         var columna1 = objResult[i].getValue(columns[1]);
                     } else {
                         var columna1 = '';
                     }
                     // 2. Especie
                     if (objResult[i].getValue(columns[2]) != null && objResult[i].getValue(columns[2]) != '- None -' && objResult[i].getValue(columns[2]) != '-none-') {
                         var columna2 = objResult[i].getValue(columns[2]);
                     } else {
                         var columna2 = '';
                     }
                     // 3. Especie 1 Document Type
                     if (objResult[i].getValue(columns[3]) != null && objResult[i].getValue(columns[3]) != '- None -' && objResult[i].getValue(columns[3]) != '-none-') {
                         var columna3 = objResult[i].getValue(columns[3]);
                     } else {
                         var columna3 = '';
                     }
                     // 4. Serie
                     if (objResult[i].getValue(columns[4]) != null && objResult[i].getValue(columns[4]) != '- None -' && objResult[i].getValue(columns[4]) != '-none-') {
                         var columna4 = objResult[i].getValue(columns[4]);
                     } else {
                         var columna4 = '';
                     }

                     // 5. Numero
                     if (objResult[i].getValue(columns[5]) != null && objResult[i].getValue(columns[5]) != '- None -' && objResult[i].getValue(columns[5]) != '-none-') {
                         var columna5 = objResult[i].getValue(columns[5]);
                     } else {
                         var columna5 = '';
                     }
                     // 6. Data de Documento
                     if (objResult[i].getValue(columns[6]) != null && objResult[i].getValue(columns[6]) != '- None -' && objResult[i].getValue(columns[6]) != '-none-') {
                         var columna6 = objResult[i].getValue(columns[6]);
                     } else {
                         var columna6 = '';
                     }
                     // 7. FROM LOCATION
                     if (objResult[i].getValue(columns[7]) != null && objResult[i].getValue(columns[7]) != '- None -' && objResult[i].getValue(columns[7]) != '-none-') {
                         var columna7 = objResult[i].getValue(columns[7]);
                     } else {
                         var columna7 = '';
                     }

                     var columna8 = '';
                     var columna9 = '';
                     
                     // 10. UF
                      if (objResult[i].getValue(columns[8]) != null && objResult[i].getValue(columns[8]) != '- None -' && objResult[i].getValue(columns[8]) != '-none-') {
                         var idSubsidiaria = objResult[i].getValue(columns[8]);

                         // Obtener los elementos de 
                         var entity = search.lookupFields({
                             type: search.Type.SUBSIDIARY,
                             id: idSubsidiaria,
                             columns: ['address.custrecord_lmry_addr_city', 'address.custrecord_lmry_addr_prov', , 'address.custrecord_lmry_addr_prov_acronym']
                           });         

                         var columna10 = entity['address.custrecord_lmry_addr_prov_acronym'];
                         if (columna10 != null && columna10 != '' && columna10 != '- None -') {
                             columna10 = entity['address.custrecord_lmry_addr_prov_acronym'];
                         } else {
                             columna10 = '';
                         }

                     } else {
                         var columna10 = '';
                     }
                     
                     // 11. Valor contable
                      if (objResult[i].getValue(columns[9]) != null && objResult[i].getValue(columns[9]) != '- None -' && objResult[i].getValue(columns[9]) != '-none-') {
                         var auxColumna11 = objResult[i].getValue(columns[9]);
                     } else {
                         var auxColumna11 = '';
                     }
                     // 12. CFOP
                      if (objResult[i].getValue(columns[10]) != null && objResult[i].getValue(columns[10]) != '- None -' && objResult[i].getValue(columns[10]) != '-none-') {
                         var auxColumna12 = objResult[i].getValue(columns[10]);
                     } else {
                         var auxColumna12 = '';
                     }
                     // 13. Tributo
                     if (objResult[i].getValue(columns[11]) != null && objResult[i].getValue(columns[11]) != '- None -' && objResult[i].getValue(columns[11]) != '-none-') {
                         var columna13 = objResult[i].getValue(columns[11]);
                     } else {
                         var columna13 = '';
                     }
                     // 14. Base de Calculo
                     if (objResult[i].getValue(columns[12]) != null && objResult[i].getValue(columns[12]) != '- None -' && objResult[i].getValue(columns[12]) != '-none-') {
                         var auxColumna14 = objResult[i].getValue(columns[12]);
                     } else {
                         var auxColumna14 = '';
                     }
                     // 15. Alicuota
                      if (objResult[i].getValue(columns[13]) != null && objResult[i].getValue(columns[13]) != '- None -' && objResult[i].getValue(columns[13]) != '-none-') {
                         var columna15 = objResult[i].getValue(columns[13]);
                     } else {
                         var columna15 = '';
                     }

                     // 16. Impuesto
                      if (objResult[i].getValue(columns[14]) != null && objResult[i].getValue(columns[14]) != '- None -' && objResult[i].getValue(columns[14]) != '-none-') {
                         var auxColumna16 = objResult[i].getValue(columns[14]);
                     } else {
                         var auxColumna16 = '';
                     }
                     // 17. OBS
                     if (objResult[i].getValue(columns[15]) != null && objResult[i].getValue(columns[15]) != '- None -' && objResult[i].getValue(columns[15]) != '-none-') {
                         var columna17 = objResult[i].getValue(columns[15]);
                         columna17 = validarCaracteres(columna17);
                     } else {
                         var columna17 = '';
                     }
                     // 18. Internal ID
                     if (objResult[i].getValue(columns[16]) != null && objResult[i].getValue(columns[16]) != '- None -' && objResult[i].getValue(columns[16]) != '-none-') {
                         var auxColumna18 = objResult[i].getValue(columns[16]);
                     } else {
                         var auxColumna18 = '';
                     }
                     
                     // 19. Line Unique Key
                     if (objResult[i].getValue(columns[17]) != null && objResult[i].getValue(columns[17]) != '- None -' && objResult[i].getValue(columns[17]) != '-none-') {
                         var columna19 = objResult[i].getValue(columns[17]);
                     } else {
                         var columna19 = '';
                     }
                     // 20. ID Vendor
                     var columna20 = '';
                     
                     // 21. Calculo de Impuesto
                     if (objResult[i].getValue(columns[18]) != null && objResult[i].getValue(columns[18]) != '- None -' && objResult[i].getValue(columns[18]) != '-none-') {
                         var columna21 = objResult[i].getValue(columns[18]);
                     } else {
                         var columna21 = '';
                     }
                     
                     // 22. Tax Situation Code        
                     var columna22='';
                     var xmlStringAux = objResult[i].getValue(columns[25]);
                     var cstTaxResult = objResult[i].getValue(columns[19]);
                     var tributo = objResult[i].getValue(columns[11]);

                     if(tributo.toUpperCase()=='ICMS'){
                         var cstItemLine = objResult[i].getValue(columns[26]);
                     }else if(tributo.toUpperCase()=='IPI'){
                         var cstItemLine = objResult[i].getValue(columns[27]);
                     }else{
                         var cstItemLine = '';    
                     }

                     if(xmlStringAux!=null && xmlStringAux!= '- None -' && xmlStringAux != '-none-' && xmlStringAux != '' && (tributo.toUpperCase()=='ICMS'||tributo.toUpperCase()=='IPI') && ((tributo.toUpperCase()=='ICMS' && xmlStringAux.indexOf('<a:ICMS>')!=-1) ||(tributo.toUpperCase()=='IPI' && xmlStringAux.indexOf('<a:IPI>')!=-1)  )){
                         //log.debug('Valor de tributo',tributo);
                         if(tributo=='ICMS'){
                             xmlStringAux=xmlStringAux.slice(xmlStringAux.indexOf('<a:ICMS>'),xmlStringAux.indexOf('</a:ICMS>'));
                             xmlStringAux+="</a:ICMS>";
                         }else if(tributo=='IPI'){
                             xmlStringAux=xmlStringAux.slice(xmlStringAux.indexOf('<a:IPI>'),xmlStringAux.indexOf('</a:IPI>'));
                             xmlStringAux+="</a:IPI>";
                         }
                         log.debug("valor de xmlStringAux",xmlStringAux);
                         
                         var xmlString ='<taxResult xmlns:a="http://www.example.com">';
                         xmlString += xmlStringAux;
                         xmlString += '</taxResult>';

                         var xmlDocument = xml.Parser.fromString({
                             text: xmlString
                         });                     
                         
                         if(tributo.toUpperCase()=='ICMS'){
                             var icmsNode = xml.XPath.select({
                                 node: xmlDocument,
                                 xpath: '//a:CST'
                             });
                             columna22 = icmsNode[0].textContent;
                             columna22 = columna22.substr(-2);

                         }else if(tributo.toUpperCase()=='IPI'){
                             var ipiNode = xml.XPath.select({
                                 node: xmlDocument,
                                 xpath: '//a:CST'
                             });
                             columna22 = ipiNode[0].textContent;
                             columna22 = columna22.substr(-2);
                         }

                     }else if(cstTaxResult!=null && cstTaxResult!= '- None -' && cstTaxResult != '-none-' && cstTaxResult != ''){
                         columna22 = cstTaxResult;
                         columna22 = columna22.substr(-2);

                     }else if(cstItemLine!=null && cstItemLine!= '- None -' && cstItemLine != '-none-' && cstItemLine != ''){
                         columna22 = cstItemLine;
                         columna22 = columna22.substr(-2);
                     }else{
                         columna22 = '';
                     }                     
                     
                     // 23. Accounting Book
                     var columna23='';
                     if (objResult[i].getValue(columns[20]) != null && objResult[i].getValue(columns[20]) != '- None -' && objResult[i].getValue(columns[20]) != '-none-' && objResult[i].getValue(columns[20]) != '') {
                         var auxColumna23 = objResult[i].getValue(columns[20]);
                         columna23 = ObtenerBook(auxColumna23);
                     } else {
                         var auxColumna23 = '';
                         columna23 = auxColumna23;
                     }

                     var columna18 = auxColumna18 + '/' + columna20 + '/' + columna19 + '/' + columna21 + '/' + columna22 ;


                     columna11 = objResult[i].getValue(columns[21]);

                     columna12 = auxColumna18;

                     // 24. LATAM - BASE AMOUNT LOCAL CURRENCY
                     if (objResult[i].getValue(columns[21]) != null && objResult[i].getValue(columns[21]) != '- None -' && objResult[i].getValue(columns[21]) != '-none-' && objResult[i].getValue(columns[21]) != '' && objResult[i].getValue(columns[21]) != 'NaN' && objResult[i].getValue(columns[21]) != 'undefined') {
                         var columna14 = objResult[i].getValue(columns[21]);
                     }else{
                         var columna14 = Number(auxColumna14)*Number(columna23);
                     }

                     // 25. LATAM - AMOUNT LOCAL CURRENCY
                     if (objResult[i].getValue(columns[22]) != null && objResult[i].getValue(columns[22]) != '- None -' && objResult[i].getValue(columns[22]) != '-none-' && objResult[i].getValue(columns[22]) != '' && objResult[i].getValue(columns[22]) != 'NaN' && objResult[i].getValue(columns[22]) != 'undefined') {
                         var columna16 = objResult[i].getValue(columns[22]);
                     }else{
                         var columna16 = Number(auxColumna16)*Number(columna23);
                     }

                     // 26. Cancel
                     if (objResult[i].getValue(columns[24]) != null && objResult[i].getValue(columns[24]) != '- None -' && objResult[i].getValue(columns[24]) != '-none-' && objResult[i].getValue(columns[24]) != '' && objResult[i].getValue(columns[24]) != 'NaN' && objResult[i].getValue(columns[24]) != 'undefined') {
                         var columna27 = objResult[i].getValue(columns[24]);
                     }else{
                         var columna27 = '';
                     }

                     columna11 = columna14;

                     var columna16 = auxColumna16;
                     
                     
                     // Estructura de la columna
                     // 1. DATA DE ENTRADA
                     // 2. POSTING PERIOD
                     // 3. ESPECIE {custbody_lmry_document_type.custrecord_lmry_codigo_doc}
                     // 4. ESPECIE 1 {custbody_lmry_document_type}
                     // 5. SERIE
                     // 6. NUMERO
                     // 7. DATA DE DOCUMENTO  (TO_CHAR({trandate},'DD/MM/YYYY'))
                     // 8. FROM LOCATION  {transferlocation}
                     // 9. BILL ADDRESS/ SIGLAS   {billingaddress.custrecord_lmry_addr_prov_acronym}                      
                     // 10. VALOR CONTABLE    (GROSSAMOUNT)
                     // 11. CFOP           {custcol_lmry_br_tran_outgoing_cfop}
                     // 12. TRIBUTO   {custrecord_lmry_br_transaction.custrecord_lmry_br_type} (ICMS, IPI)
                     // 13. Base Calculo   {custrecord_lmry_br_transaction.custrecord_lmry_base_amount}
                     // 14. Alicuta       "{custrecord_lmry_br_transaction.custrecord_lmry_br_percent} *100"
                     // 15. Impuesto          {custrecord_lmry_br_transaction.custrecord_lmry_br_total}
                     // 16. Memo (Main)


                     // Ejemplo
                     // [
                     //     "", ------------ DATA DE ENTRADA..........................0
                     //     "725",   ------------ POSTING PERIOD..........................1
                     //     "55", ------------  LATAM - LEGAL DOCUMENT TYPE.CODIGO ..........................2
                     //     "Nota Fiscal Eletrônica (Operações de aquisição / devolução)", ------------  LATAM - LEGAL DOCUMENT TYPE..........................3
                     //     "333", ------------ LATAM - CXP SERIES..........................4
                     //     "2595", ------------ LATAM - PREPRINTED NUMBER..........................5
                     //     "28/01/2022", ------------ DATE ..........................6
                     //     "Bela Vista", ------------ FROM LOCATION ..........................7
                     //     "", ------------..........................8
                     //     "", ------------..........................9
                     //     "SP", ------------ ADDREESS, ACRONIMO..........................10
                     //     "7200", ------------ LATAM - BASE AMOUNT..........................11
                     //     "3234768", ------------ INTERNAL ID BILL..........................12
                     //     "ICMS", ------------ LATAM - SUB TYPE..........................13
                     //     "7200", ------------ LATAM - BASE AMOUNT..........................14
                     //     ".07", ------------ LATAM - PERCENTAGE..........................15
                     //     "504", ------------ LATAM - TOTAL..........................16
                     //     "", ------------..........................17
                     //     "3234768/8807/10638611/Calculo de Impuestos/00", ------------ INTERNAL ID BILL / ID VENDEDOR /LATAM - LINE UNIQUE KEY / LATAM - TAX TYPE /  LATAM BR - TAX SITUATION CODE(ULTIMOS 2 DIGITOS)..........................18
                     //     "10638611", ------------ LATAM - LINE UNIQUE KEY..........................19
                     //     "P" ------------..........................20
                     //  ]
                      
                     Arrtemporal = [columna0, columna1, columna2, columna3, columna4, columna5, columna6, columna7, columna8, columna9,
                                    columna10, columna11, columna12, columna13, columna14, columna15, columna16, columna17, columna18, columna19, 'P'];

                    //  log.debug('Arrtemporal de Transactiones Item Receipt',Arrtemporal);
                     
                     if(columna27 == 'Cancelada' || columna27 == 'Cancelado'){

                     } else{
                         info3Arr.push(Arrtemporal);
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
         return info3Arr;
     }

     function ObtenerUFRemesas(internalid) {
         var uf = '';
         if (internalid) {
             var purchaseOrderRecord = search.lookupFields({
                 type: search.Type.PURCHASE_ORDER,
                 id: internalid,
                 columns: ['billingaddress.custrecord_lmry_addr_prov_acronym']
             });
             uf = purchaseOrderRecord['billingaddress.custrecord_lmry_addr_prov_acronym'];
         }
         return  uf;
     }

     function validarCaracteres(cadena){
        var textResult='';
        var expReg=/\|/gi;       
        textResult=cadena.replace(expReg, ' ');        
        return textResult;        
     }

     function round(number){
         return Math.round(Number(number) * 100) / 100;
     }

     return {
         getInputData: getInputData,
         map: map,
         summarize: summarize
     };
 });