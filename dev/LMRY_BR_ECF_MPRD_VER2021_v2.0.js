/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for Inventory Balance Library                  ||
||                                                              ||
||  File Name: LMRY_BR_Reporte_ECF_MPRD_v2.0.js           		||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Dec 11 2019      Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
 define(["N/record", "N/runtime", "N/file", "N/email", "N/search", "N/format", "N/log", "N/task", "N/config", "./BR_LIBRERIA_MENSUAL/LMRY_BR_Reportes_LBRY_V2.0.js","/SuiteBundles/Bundle 37714/Latam_Library/LMRY_LibraryReport_LBRY_V2.js"],
 function(record, runtime, file, email, search, format, log, task, config, libreria,libFeature) {

     var LMRY_script = "LMRY_BR_ECD_MPRD_V.2.0.js";
     var objContext = runtime.getCurrentScript();

     var paramSubsidiary = objContext.getParameter("custscript_br_ecf_mprd_subsi_v7");

     var paramPeriod = objContext.getParameter("custscript_br_ecf_mprd_periodo_v7");

     var paramMultibook = objContext.getParameter("custscript_br_ecf_mprd_multi_v7");

     var paramLogId = objContext.getParameter("custscript_br_ecf_mprd_idlog_v7");

     var paramReportId = objContext.getParameter("custscript_br_ecf_mprd_recordid_v7");

     var paramDeclarationType = objContext.getParameter("custscript_br_ecf_mprd_tipodecla_v7");

     var paramNumRecti = objContext.getParameter("custscript_br_ecf_mprd_num_rectific_v7");

     var paramNumOrden = objContext.getParameter("custscript_br_ecf_mprd_num_orden_v7");

     var hasSubsidiariesFeature = runtime.isFeatureInEffect({
         feature: "SUBSIDIARIES"
     });

     var hasMultibookFeature = runtime.isFeatureInEffect({
         feature: "MULTIBOOK"
     });

     var hasMultipleCalendars = runtime.isFeatureInEffect({
         feature: "MULTIPLECALENDARS"
     });
     var featurePeriodEnd = runtime.isFeatureInEffect({
        feature: "PERIODENDJOURNALENTRIES"
     });

     var language = runtime.getCurrentScript().getParameter("LANGUAGE").substring(0, 2);
     var arrbloquecuentas = new Array();
     var arrSaldoInicialaccount = new Array();
     var arrM300cuentasLanza = new Array();
     var arrL210account = new Array();
     var accountFinal = '';

     function getInputData() {
        
        var resultadoArray = [];
         // try {
         log.debug({
             title: "Parametros",
             details: paramSubsidiary + "|" + paramPeriod + "|" + paramMultibook + "|" + paramLogId + "|" + paramReportId + "|" + paramDeclarationType+ "|" + paramNumOrden
         });
         if (hasMultibookFeature) {
             log.debug("entro aca", 'resultadoArray');
             resultadoArray = ObtenerMovimientosAccountGlobalMapping();
         } else {
             resultadoArray = ObtenerMovimientos();
         }


         log.debug("getInputData", resultadoArray);
         log.debug("resultadoArray.length", resultadoArray.length);

         return resultadoArray;
         //  } catch (error) {
         //      return [{isError : "T", error: error}];
         //  }
     }

     function map(context) {

         // try {
         var objResult = JSON.parse(context.value);

         if (objResult["isError"] == "T") {
             context.write({
                 key: context.key,
                 value: objResult
             });
         } else {
            // log.error('objResultgetinput7234', objResult);

             if (hasMultibookFeature) {
                 var IDcoa = search.lookupFields({
                     type: search.Type.ACCOUNT,
                     id: objResult[5],
                     columns: ['custrecord_lmry_br_coa']
                 })
                 var COA_NOT_empty = IDcoa.custrecord_lmry_br_coa;
                 var IDCOA = COA_NOT_empty[0].value;
                 if (COA_NOT_empty != null && COA_NOT_empty != '') {
                     //log.error('COA_NOT_empty',COA_NOT_empty[0].value);


                     objResult = objResult.concat(ObtenerCamposCuentas2(objResult[5]));

                     objResult = objResult.concat(obtenerCamposAdicionales(objResult[14]));

                     // El campo 18 del obtenerCamposAdicionales es el periodo que se llena aqui
                     // var periodStartDate = search.lookupFields({
                     //     type: search.Type.ACCOUNTING_PERIOD,
                     //     id: objResult[8],
                     //     columns: ['startdate']
                     // }).startdate;

                     var periodStartDate = objResult[1];
                     var startDate = format.parse({
                         type: format.Type.DATE,
                         value: periodStartDate
                     });

                     objResult[33] = startDate.getMonth();

                     //log.error('objResultgetinput7234',objResult);
                     context.write({
                         key: objResult[33],
                         value: objResult
                     });
                 }


             } else {
                 objResult = objResult.concat(obtenerCamposAdicionales(objResult[14]));

                 // El campo 18 del obtenerCamposAdicionales es el periodo que se llena aqui
                 // var periodStartDate = search.lookupFields({
                 //     type: search.Type.ACCOUNTING_PERIOD,
                 //     id: objResult[8],
                 //     columns: ['startdate']
                 // }).startdate;
                 var periodStartDate = objResult[1];
                 var startDate = format.parse({
                     type: format.Type.DATE,
                     value: periodStartDate
                 });

                 objResult[33] = startDate.getMonth();

                 context.write({
                     key: objResult[33],
                     value: objResult
                 });
             }

         }

         // } catch (error) {
             // log.error("error", error);
             // log.error("i", context.key);
         //     context.write({
         //         key   : context.key,
         //         value : {
         //             isError : "T",
         //             error   : error
         //         }
         //     });
         // }
     }

     function reduce(context) {
         // try {
         var resultArray = context.values;
         var accountJson = {};
         var accountlanzamientoM300Json = {};
         var accountlanzamientoM350Json = {};
         var accountL210Json = {};
         var accountM010Json = {};
         //esto es para los key por meses con letras para el orden
         var numberToLetterJson = {0: "A",1: "B", 2: "C", 3: "D",4: "E",5: "F",6: "G",7: "H",8: "I", 9: "J",10: "K",11: "L"};

         var transactionsArray = [];
         var objResult;

         for (var i = 0; i < resultArray.length; i++) {
             objResult = JSON.parse(resultArray[i]);

             if (objResult["isError"] == "T") {
                 context.write({
                     key: context.key,
                     value: objResult
                 });
                 return;
             }

            // transactionsArray.push(objResult);

             if (objResult[5] != '' && objResult[5] != null) {
                 if (accountJson[objResult[5]] === undefined) {
                     accountJson[objResult[5]] = [objResult[9], objResult[11], objResult[12], 0, 0, objResult[14], objResult[5], objResult[34], objResult[35]];
                 }

                 accountJson[objResult[5]][3] = (accountJson[objResult[5]][3] + Number(objResult[2]));
                 accountJson[objResult[5]][4] = (accountJson[objResult[5]][4] + Number(objResult[3]));
             }

             

             //l210
             if (objResult[17] != '' && objResult[17] != null) {
                 if (accountL210Json[objResult[17]] === undefined) {
                     accountL210Json[objResult[17]] = [objResult[5], 0, 0, objResult[17], objResult[23], objResult[24], objResult[14]];
                 }

                 accountL210Json[objResult[17]][1] = (accountL210Json[objResult[17]][1] + Number(objResult[2]));

                 accountL210Json[objResult[17]][2] = (accountL210Json[objResult[17]][2] + Number(objResult[3])); //Number(objResult[3]);
             }


             //m010
             if (objResult[18] != '' && objResult[18] != null) {
                 if (accountM010Json[objResult[18]] === undefined) {
                     accountM010Json[objResult[18]] = [objResult[5], 0, 0, objResult[19], objResult[20], objResult[26], objResult[27], objResult[18],objResult[10],objResult[45]];
                 }

                 accountM010Json[objResult[18]][1] = (accountM010Json[objResult[18]][1] + Number(objResult[2]));

                 accountM010Json[objResult[18]][2] = (accountM010Json[objResult[18]][2] + Number(objResult[3]));
             }

             //m300 IRPJ
             if (objResult[22] != '' && objResult[22] != null) {
                 if (accountlanzamientoM300Json[objResult[22]] === undefined) {
                     accountlanzamientoM300Json[objResult[22]] = [objResult[5], 0, 0, objResult[40], objResult[41], objResult[42], objResult[43], objResult[44],objResult[22]];
                 }

                 accountlanzamientoM300Json[objResult[22]][1] = (accountlanzamientoM300Json[objResult[22]][1] + Number(objResult[2]));

                 accountlanzamientoM300Json[objResult[22]][2] = (accountlanzamientoM300Json[objResult[22]][2] + Number(objResult[3]));
             }
             //m350 CSLL
             if (objResult[21] != '' && objResult[21] != null) {
                 if (accountlanzamientoM350Json[objResult[21]] === undefined) {
                     accountlanzamientoM350Json[objResult[21]] = [objResult[5], 0, 0, objResult[28], objResult[29], objResult[30], objResult[31], objResult[32], objResult[21]];
                 }

                 accountlanzamientoM350Json[objResult[21]][1] = (accountlanzamientoM350Json[objResult[21]][1] + Number(objResult[2]));

                 accountlanzamientoM350Json[objResult[21]][2] = (accountlanzamientoM350Json[objResult[21]][2] + Number(objResult[3]));
             }

         }

         log.debug('accountJson bloque l', accountJson);

         log.debug('accountsl210 bloque l', accountL210Json);
         log.debug('accountsm010 bloque M', accountM010Json);
         log.debug('accountlanzamientoM300Json bloque M300', accountlanzamientoM300Json);
         log.debug('accountlanzamientoM350Json bloque M350', accountlanzamientoM350Json);

         context.write({
             key: numberToLetterJson[context.key], //context.key,
             value: {
                 //transactions: transactionsArray,
                 accounts: accountJson,
                 accountsL210: accountL210Json,
                 accountsM010: accountM010Json,
                 accountsLanzamientoM300: accountlanzamientoM300Json,
                 accountsLanzamientoM350: accountlanzamientoM350Json
             }
         });


         //  } catch (error) {
         //      context.write({
         //          key   : context.key,
         //          value : {
         //              isError : "T",
         //              error   : error
         //          }
         //      });
         //  }

     }

     function summarize(context) {

        try {
            if (hasMultibookFeature) {
            
             var initialBalanceJson = ObtenerSIMultibook();
             log.error('entro si multi L100', initialBalanceJson);
             //copia en otra variable el saldo inicial para cada mes
             var remainingAccountForPeriodJson = JSON.parse(JSON.stringify(initialBalanceJson));
             //es el saldo inicial del periodo siguiente
             var finalBalanceJson = JSON.parse(JSON.stringify(initialBalanceJson));

             //este esel saldo inicial pero para los registros l210 al m350
             var initialBalanceLanzaJson = ObtenerSIMultiL210ºM();
             log.error('initialBalanceLanzaJson L210M con multi', initialBalanceLanzaJson);

             var initialBalanceL210Json = initialBalanceLanzaJson[0];
             //copia en otra variable el saldo inicial para cada mes
             var L210remainingAccountForPeriodJson = JSON.parse(JSON.stringify(initialBalanceL210Json));
             //es el saldo inicial del periodo siguiente
             var L210finalBalanceJson = JSON.parse(JSON.stringify(initialBalanceL210Json));

             var initialBalanceM010Json = initialBalanceLanzaJson[1];
             //copia en otra variable el saldo inicial para cada mes
             var M010remainingAccountForPeriodJson = JSON.parse(JSON.stringify(initialBalanceM010Json));
             //es el saldo inicial del periodo siguiente
             var M010finalBalanceJson = JSON.parse(JSON.stringify(initialBalanceM010Json));

             var initialBalanceM300Json = initialBalanceLanzaJson[2];
             //copia en otra variable el saldo inicial para cada mes
             var M300remainingAccountForPeriodJson = JSON.parse(JSON.stringify(initialBalanceM300Json));
             //es el saldo inicial del periodo siguiente
             var M300finalBalanceJson = JSON.parse(JSON.stringify(initialBalanceM300Json));

             var initialBalanceM350Json = initialBalanceLanzaJson[3];
             //copia en otra variable el saldo inicial para cada mes
             var M350remainingAccountForPeriodJson = JSON.parse(JSON.stringify(initialBalanceM350Json));
             //es el saldo inicial del periodo siguiente
             var M350finalBalanceJson = JSON.parse(JSON.stringify(initialBalanceM350Json));

         } else {
             var initialBalanceJson = getAccountsInitialBalance();
             log.error('entro si sin multi', initialBalanceJson);
             //copia en otra variable el saldo inicial para cada mes
             var remainingAccountForPeriodJson = JSON.parse(JSON.stringify(initialBalanceJson));
             //es el saldo inicial del periodo siguiente
             var finalBalanceJson = JSON.parse(JSON.stringify(initialBalanceJson));

             //este esel saldo inicial pero para los registros l210 al m350
             var initialBalanceLanzaJson = getAccountsLanzamInitialBalance();
             log.error('initialBalanceLanzaJson sin multi', initialBalanceLanzaJson);

             var initialBalanceL210Json = initialBalanceLanzaJson[0];
             //copia en otra variable el saldo inicial para cada mes
             var L210remainingAccountForPeriodJson = JSON.parse(JSON.stringify(initialBalanceL210Json));
             //es el saldo inicial del periodo siguiente
             var L210finalBalanceJson = JSON.parse(JSON.stringify(initialBalanceL210Json));

             var initialBalanceM010Json = initialBalanceLanzaJson[1];
             //copia en otra variable el saldo inicial para cada mes
             var M010remainingAccountForPeriodJson = JSON.parse(JSON.stringify(initialBalanceM010Json));
             //es el saldo inicial del periodo siguiente
             var M010finalBalanceJson = JSON.parse(JSON.stringify(initialBalanceM010Json));

             var initialBalanceM300Json = initialBalanceLanzaJson[2];
             //copia en otra variable el saldo inicial para cada mes
             var M300remainingAccountForPeriodJson = JSON.parse(JSON.stringify(initialBalanceM300Json));
             //es el saldo inicial del periodo siguiente
             var M300finalBalanceJson = JSON.parse(JSON.stringify(initialBalanceM300Json));

             var initialBalanceM350Json = initialBalanceLanzaJson[3];
             //copia en otra variable el saldo inicial para cada mes
             var M350remainingAccountForPeriodJson = JSON.parse(JSON.stringify(initialBalanceM350Json));
             //es el saldo inicial del periodo siguiente
             var M350finalBalanceJson = JSON.parse(JSON.stringify(initialBalanceM350Json));

         }

         
         //    var  paramhola = SepararCuentasReferenciales();
         //         log.error("Accounts sepaar cuentasreferenciales sin data ID", paramhola);

         log.error("Saldo Inicial JSON summarize", initialBalanceJson);

         var totalKeysSaved = 0;
         var totalKeysSavedM300 = 0;

         var errores = [];
         var rowString = '';
         var periodsJson = {};
         var letterToNumberJson = {"A": "0","B": "1","C": "2","D": "3","E": "4","F": "5","G": "6","H": "7","I": "8","J": "9","K": "10","L": "11"};

         var paramAccountsCOAPlanFileId = "";
         var paramAccountsPadronBPlanFileId = "";
         var paramhola = "";
         var paramAccountsReferencialFileId = "";

         var initialBalance, initialBalanceM300, accountNumber, accountName, accountTipo, accountNature, debit, credit, accountSuperior, Nivel;
         var codLanzamM300, TypeLanzamM300, nameLanzamM300, debitLanzamM300, creditLanzamM300, taxLanzamM300, indiLanzamM300, tributo, IDCuenta;
         var codLanzamM350, TypeLanzamM350, nameLanzamM350, debitLanzamM350, creditLanzamM350, taxLanzamM350, indiLanzamM350, tributo, IDCuenta;

         var initialBalanceL210, codL210, nameL210, debitLanzamL210, creditLanzamL210, saldoFinalL210;
         var accountL210ForPeriodsString = '', accountL210FileSize = 0,accountL210ForPeriodsFileNumber = 0,paramAccountsL210ForPeriodsFileId = '';

         var initialBalanceM010, codM010NetS, nameM010Nets, debitM010, creditM010, FechaAccountM010, codSpedM010, codTrbutoM010,IndM410;
         var accountM010ForPeriodsString = '',accountM010FileSize = 0,accountM010ForPeriodsFileNumber = 0,paramAccountsM010ForPeriodsFileId = '';

         context.output.iterator().each(function(key, value) {
             //log.error("key summarize", key);
             var objResult = JSON.parse(value);

             if (objResult["isError"] == "T") {
                 errores.push(JSON.stringify(objResult["error"]));
                 log.error('entro al error summarize', 'entro al error');
             } else {

                 // JSON de Periodos para generar un orden de acuerdo al Mes
                 periodsJson[letterToNumberJson[key]] = {
                     
                     "accounts": objResult["accounts"],
                     "accountsL210": objResult["accountsL210"],
                     "accountsM010": objResult["accountsM010"],
                     "accountsLanzamientoM300": objResult["accountsLanzamientoM300"],
                     "accountsLanzamientoM350": objResult["accountsLanzamientoM350"]



                 }
             }
             totalKeysSaved++;
             return true;
         });

         //var flag = false;
         log.error("periodsJson", periodsJson);

         if (errores.length > 0) {
             libFeature.sendErrorEmail(errores[0], LMRY_script, language);
         } else {
             var rowString;
             var paramAccountsForPeriodsFileId = "",accountForPeriodsString = "",accountForPeriodsFileNumber = 0,accountFileSize = 0;
             var paramAccountsM300ForPeriodsFileId = "",accountM300ForPeriodsString = "",accountM300ForPeriodsFileNumber = 0, accountM300FileSize = 0;
             var paramAccountsM350ForPeriodsFileId = "",accountM350ForPeriodsString = "",accountM350ForPeriodsFileNumber = 0, accountM350FileSize = 0;

             // Recorrido de los meses para registro L100 y L300
             for (var i = 0; i < 12; i++) {
                 // Si existe el mes dentro del JSON de periodos
                 if (periodsJson[i] !== undefined) {
                     log.error("Antes Period Balance " + i, finalBalanceJson);
                     log.error("Antes Period " + i, remainingAccountForPeriodJson);

                     // Recorrido de cuentas usadas en las transacciones del mes i
                     for (var brCoaId in periodsJson[i]["accounts"]) {

                         //for (var department in periodsJson[i]["accounts"][brCoaId]) {
                         // Elimina las cuentas que ya aparecieron en las transacciones del mes i para que no haya repetidos cuando recorra la variable remainingAccountForPeriodJson
                         if (remainingAccountForPeriodJson[brCoaId] !== undefined) {
                             delete remainingAccountForPeriodJson[brCoaId];
                         }

                         // Crea las cuentas que no tienen saldo inicial para el mes i
                         // finalBalanceJson se usa para calcular el saldo inicial de las cuentas en el mes i
                         if (finalBalanceJson[brCoaId] === undefined) {
                             // finalBalanceJson[brCoaId] = {
                             //     "saldo": 0
                             //     //"departments" : {}
                             // };
                             // finalBalanceJson[brCoaId]["saldo"] = [0, periodsJson[i]["accounts"][brCoaId][6], periodsJson[i]["accounts"][brCoaId][1]];
                             finalBalanceJson[brCoaId] = [0, brCoaId, periodsJson[i]["accounts"][brCoaId][1]];

                         }

                        // initialBalance = Number(finalBalanceJson[brCoaId]["saldo"][0]);
                         initialBalance = Number(finalBalanceJson[brCoaId][0]);

                         accountNumber = periodsJson[i]["accounts"][brCoaId][0];
                         //log.error('accountNumber',accountNumber);
                         //accountName = periodsJson[i]["accounts"][brCoaId][1];
                         //accountTipo = periodsJson[i]["accounts"][brCoaId][2];
                         accountNature = periodsJson[i]["accounts"][brCoaId][1];
                         accountSuperior = periodsJson[i]["accounts"][brCoaId][2];
                         debit = Number(periodsJson[i]["accounts"][brCoaId][3]);
                         //log.error('debito de junio' +i, debit);
                         credit = Number(periodsJson[i]["accounts"][brCoaId][4]);

                         //Nivel = periodsJson[i]["accounts"][brCoaId][7];
                         IDCuenta = periodsJson[i]["accounts"][brCoaId][6];
                         codigoP200 = periodsJson[i]["accounts"][brCoaId][7];
                         codigoP400 = periodsJson[i]["accounts"][brCoaId][8];
                         
                         rowString = i + "|" + accountNumber + "|" + '' + "|" + '' + "|" + accountNature + "|" + initialBalance + "|" + debit + "|" + credit + "|" + accountSuperior + "|" + '' + "|" + IDCuenta + "|" + codigoP200 + "|" + codigoP400 + "\r\n";

                         accountForPeriodsString += rowString;
                         accountFileSize += lengthInUtf8Bytes(rowString);

                         // Calcula el saldo inicial del siguiente mes para cada cuenta y departamento
                         // finalBalanceJson[brCoaId][1] = (initialBalance + debit - credit);

                         // Calcula el saldo inicial del siguiente mes para cada cuenta
                         //finalBalanceJson[brCoaId]["saldo"] = Number(initialBalance + debit - credit);
                        // finalBalanceJson[brCoaId]["saldo"][0] = Number(initialBalance + debit - credit);
                         finalBalanceJson[brCoaId][0] = Number(initialBalance + debit - credit);

                         if (accountFileSize > 9000000) {
                             if (accountForPeriodsFileNumber == 0) {
                                 paramAccountsForPeriodsFileId = saveAuxiliaryFile(accountForPeriodsString, accountForPeriodsFileNumber, 1);
                             } else {
                                 paramAccountsForPeriodsFileId = paramAccountsForPeriodsFileId + "|" + saveAuxiliaryFile(accountForPeriodsString, accountForPeriodsFileNumber, 1);
                             }
                             accountForPeriodsString = "";
                             accountFileSize = 0;
                             accountForPeriodsFileNumber++;
                         }
                         // }segundo for
                     }
//|L100|1.01.02.02.52|(-) Perdas Estimadas em Créditos de Liquidação Duvidosa - Duplicatas a Receber |A|5|1|1.01.02.02|521298.64|D|147984.00|44960.27|624322.37|D|

                     // log.error("Despues Period Balance " + i, finalBalanceJson);
                     // log.error("Despues Period " + i, remainingAccountForPeriodJson);

                 }

                 log.error("remainingAccountForPeriodJson " + i, remainingAccountForPeriodJson);

                 // Logica para recorrer las cuentas que tienen saldo Inicial pero que no tienen transacciones en el mes i
                 if (Object.keys(remainingAccountForPeriodJson).length != 0) {
                     for (var brCoaId in remainingAccountForPeriodJson) {

                         // for (var saldo in remainingAccountForPeriodJson[brCoaId]["saldo"]) {
                         if (Number(remainingAccountForPeriodJson[brCoaId][0]) != 0) {
 
                             accountNature = remainingAccountForPeriodJson[brCoaId][2];
                             IDCuenta = remainingAccountForPeriodJson[brCoaId][1];
                             // codigoP200 = remainingAccountForPeriodJson[brCoaId][11];
                             // codigoP400 = remainingAccountForPeriodJson[brCoaId][12];

                             rowString = i + "|" + '' + "|" + '' + "|" + '' + "|" + accountNature + "|" + (remainingAccountForPeriodJson[brCoaId][0] || 0) + "|" + '0.00' + "|" + '0.00' + "|" + '' + "|" + '' + "|" + IDCuenta + "|" + '' + "|" + '' + "\r\n";
                             //rowString = i + "|" + accountNumber +  "|" + accountNature + "|" + initialBalance + "|" + debit + "|" + credit + "|" + accountSuperior  + "|" + IDCuenta + "|" + codigoP200 + "|" + codigoP400+ "\r\n";

                             accountForPeriodsString += rowString;
                             accountFileSize += lengthInUtf8Bytes(rowString);

                             if (accountFileSize > 9000000) {
                                 if (accountForPeriodsFileNumber == 0) {
                                     paramAccountsForPeriodsFileId = saveAuxiliaryFile(accountForPeriodsString, accountForPeriodsFileNumber, 1);
                                 } else {
                                     paramAccountsForPeriodsFileId = paramAccountsForPeriodsFileId + "|" + saveAuxiliaryFile(accountForPeriodsString, accountForPeriodsFileNumber, 1);
                                 }
                                 accountForPeriodsString = "";
                                 accountFileSize = 0;
                                 accountForPeriodsFileNumber++;
                             }
                         }
                         //}
                     }
                 }

                 remainingAccountForPeriodJson = JSON.parse(JSON.stringify(finalBalanceJson));
             }
             //fin del registro L100 y L300

             // var balanceBeforeClosingJson = {};
             // var resultAccountsBeforeClosing = getAccountsBalanceBeforeClosing(resultCoaArray, balanceBeforeClosingJson);
             // accountForPeriodsString += resultAccountsBeforeClosing;
             // log.error("CUENTAS BEFORE CLOSING ", resultAccountsBeforeClosing);
         
             // inicio del Recorrido de los meses para registro L210
             for (var i = 0; i < 12; i++) {
                 // Si existe el mes dentro del JSON de periodos
                 if (periodsJson[i] !== undefined) {
                     log.error("Antes Period BalanceL210 " + i, L210finalBalanceJson);
                     log.error("Antes Period L210" + i, L210remainingAccountForPeriodJson);

                     // Recorrido de cuentas usadas en las transacciones del mes i
                     for (var brL210Id in periodsJson[i]["accountsL210"]) {

                         // Elimina las cuentas que ya aparecieron en las transacciones del mes i para que no haya repetidos cuando recorra la variable remainingAccountForPeriodJson
                         if (L210remainingAccountForPeriodJson[brL210Id] !== undefined) {
                             delete L210remainingAccountForPeriodJson[brL210Id];
                         }
                         // Crea las cuentas que no tienen saldo inicial para el mes i
                         // finalBalanceJson se usa para calcular el saldo inicial de las cuentas en el mes i
                         if (L210finalBalanceJson[brL210Id] === undefined) {
                             L210finalBalanceJson[brL210Id] = {
                                 "saldoL210": 0
                             };
                             L210finalBalanceJson[brL210Id]["saldoL210"] = [0, periodsJson[i]["accountsL210"][brL210Id][4],periodsJson[i]["accountsL210"][brL210Id][5]];
                         }

                         initialBalanceL210 = Number(L210finalBalanceJson[brL210Id]["saldoL210"][0]);
                        
                         debitLanzamL210 = Number(periodsJson[i]["accountsL210"][brL210Id][1]);
                         creditLanzamL210 = Number(periodsJson[i]["accountsL210"][brL210Id][2]);
                         //IDCuentaL210 = periodsJson[i]["accountsL210"][brL210Id][3];
                         codL210 = periodsJson[i]["accountsL210"][brL210Id][4];
                         nameL210 = periodsJson[i]["accountsL210"][brL210Id][5];
                         

                         rowString = i + "|" + codL210 + "|" + nameL210 + "|" + initialBalanceL210 + "|" + debitLanzamL210 + "|" + creditLanzamL210 +"\r\n";

                         accountL210ForPeriodsString += rowString;
                         accountL210FileSize += lengthInUtf8Bytes(rowString);
                         
                         // Calcula el saldo inicial del siguiente mes para cada cuenta
                         L210finalBalanceJson[brL210Id]["saldoL210"][0] = Number(initialBalanceL210 + debitLanzamL210 - creditLanzamL210);
                         
                         if (accountL210FileSize > 9000000) {
                             if (accountL210ForPeriodsFileNumber == 0) {
                                 paramAccountsL210ForPeriodsFileId = saveAuxiliaryFile(accountL210ForPeriodsString, accountL210ForPeriodsFileNumber, 2);
                             } else {
                                 paramAccountsL210ForPeriodsFileId = paramAccountsL210ForPeriodsFileId + "|" + saveAuxiliaryFile(accountL210ForPeriodsString, accountL210ForPeriodsFileNumber, 2);
                             }
                             accountL210ForPeriodsString = "";
                             accountL210FileSize = 0;
                             accountL210ForPeriodsFileNumber++;
                         }
                       
                     }
                     log.error("Despues Period BalanceL210 " + i, L210finalBalanceJson);
                     log.error("Despues Period L210" + i, L210remainingAccountForPeriodJson);
                 }

                 log.error("L210remainingAccountForPeriodJson " + i, L210remainingAccountForPeriodJson);

                 // Logica para recorrer las cuentas que tienen saldo Inicial pero que no tienen transacciones en el mes i
                 if (Object.keys(L210remainingAccountForPeriodJson).length != 0) {
                     for (var brL210Id in L210remainingAccountForPeriodJson) {

                         if (Number(L210remainingAccountForPeriodJson[brL210Id]["saldoL210"][0]) != 0) {

                             codL210 = L210remainingAccountForPeriodJson[brL210Id]["saldoL210"][1];
                             nameL210 = L210remainingAccountForPeriodJson[brL210Id]["saldoL210"][2];  
                             
                             rowString = i + "|" + codL210 + "|" + nameL210 + "|" +  (L210remainingAccountForPeriodJson[brL210Id]["saldoL210"][0] || 0) + "|" + '0.00' + "|" + '0.00' + "\r\n";
                             accountL210ForPeriodsString += rowString;
                             accountL210FileSize += lengthInUtf8Bytes(rowString);

                             if (accountL210FileSize > 9000000) {
                                 if (accountL210ForPeriodsFileNumber == 0) {
                                     paramAccountsL210ForPeriodsFileId = saveAuxiliaryFile(accountL210ForPeriodsString, accountL210ForPeriodsFileNumber, 2);
                                 } else {
                                     paramAccountsL210ForPeriodsFileId = paramAccountsL210ForPeriodsFileId + "|" + saveAuxiliaryFile(accountL210ForPeriodsString, accountL210ForPeriodsFileNumber, 2);
                                 }
                                 accountL210ForPeriodsString = "";
                                 accountL210FileSize = 0;
                                 accountL210ForPeriodsFileNumber++;
                             }
                         }
                     }
                 }

                 L210remainingAccountForPeriodJson = JSON.parse(JSON.stringify(L210finalBalanceJson));
             }

         // inicio del Recorrido de los meses para registro M010
         for (var i = 0; i < 12; i++) {
             // Si existe el mes dentro del JSON de periodos
             if (periodsJson[i] !== undefined) {
                 log.error("Antes Period BalanceM010 " + i, M010finalBalanceJson);
                 log.error("Antes Period M010" + i, M010remainingAccountForPeriodJson);

                 // Recorrido de cuentas usadas en las transacciones del mes i
                 for (var brM010Id in periodsJson[i]["accountsM010"]) {

                     // Elimina las cuentas que ya aparecieron en las transacciones del mes i para que no haya repetidos cuando recorra la variable remainingAccountForPeriodJson
                     if (M010remainingAccountForPeriodJson[brM010Id] !== undefined) {
                         delete M010remainingAccountForPeriodJson[brM010Id];
                     }
                     // Crea las cuentas que no tienen saldo inicial para el mes i
                     // finalBalanceJson se usa para calcular el saldo inicial de las cuentas en el mes i
                     if (M010finalBalanceJson[brM010Id] === undefined) {
                         M010finalBalanceJson[brM010Id] = {
                             "saldoM010": 0
                         };
                         M010finalBalanceJson[brM010Id]["saldoM010"] = [0, periodsJson[i]["accountsM010"][brM010Id][3], periodsJson[i]["accountsM010"][brM010Id][4],0, periodsJson[i]["accountsM010"][brM010Id][5], periodsJson[i]["accountsM010"][brM010Id][6],periodsJson[i]["accountsM010"][brM010Id][8],periodsJson[i]["accountsM010"][brM010Id][9]];
                     }

                     initialBalanceM010 = Number(M010finalBalanceJson[brM010Id]["saldoM010"][0]);
                 
                     debitM010 = Number(periodsJson[i]["accountsM010"][brM010Id][1]);
                     creditM010 = Number(periodsJson[i]["accountsM010"][brM010Id][2]);
                     codM010NetS = periodsJson[i]["accountsM010"][brM010Id][3];
                     nameM010Nets = periodsJson[i]["accountsM010"][brM010Id][4];
                     codSpedM010 = periodsJson[i]["accountsM010"][brM010Id][5];
                     codTrbutoM010 = periodsJson[i]["accountsM010"][brM010Id][6];
                     FechaAccountM010 = periodsJson[i]["accountsM010"][brM010Id][8];
                     IndM410 = periodsJson[i]["accountsM010"][brM010Id][9];

                     rowString = i + "|" + codM010NetS + "|" + nameM010Nets + "|" + FechaAccountM010 + "|" + codSpedM010 + "|" + codTrbutoM010 + "|" + initialBalanceM010+ "|" + debitM010 + "|" + creditM010+"|" +IndM410+ "\r\n";

                     accountM010ForPeriodsString += rowString;
                     accountM010FileSize += lengthInUtf8Bytes(rowString);
                     
                     // Calcula el saldo inicial del siguiente mes para cada cuenta
                     M010finalBalanceJson[brM010Id]["saldoM010"][0] = Number(initialBalanceM010 + debitM010 - creditM010);
                     
                     if (accountM010FileSize > 9000000) {
                         if (accountM010ForPeriodsFileNumber == 0) {
                             paramAccountsM010ForPeriodsFileId = saveAuxiliaryFile(accountM010ForPeriodsString, accountM010ForPeriodsFileNumber, 3);
                         } else {
                             paramAccountsM010ForPeriodsFileId = paramAccountsM010ForPeriodsFileId + "|" + saveAuxiliaryFile(accountM010ForPeriodsString, accountM010ForPeriodsFileNumber, 3);
                         }
                         accountM010ForPeriodsString = "";
                         accountM010FileSize = 0;
                         accountM010ForPeriodsFileNumber++;
                     }
                 
                 }
                 log.error("Despues Period BalanceM010 " + i, M010finalBalanceJson);
                 log.error("Despues Period M010" + i, M010remainingAccountForPeriodJson);
             }

             log.error("M010remainingAccountForPeriodJson " + i, M010remainingAccountForPeriodJson);

             // Logica para recorrer las cuentas que tienen saldo Inicial pero que no tienen transacciones en el mes i
             if (Object.keys(M010remainingAccountForPeriodJson).length != 0) {
                 for (var brM010Id in M010remainingAccountForPeriodJson) {

                     if (Number(M010remainingAccountForPeriodJson[brM010Id]["saldoM010"][0]) != 0) {

                         codM010NetS = M010remainingAccountForPeriodJson[brM010Id]["saldoM010"][1];
                         nameM010Nets = M010remainingAccountForPeriodJson[brM010Id]["saldoM010"][2];
                         codSpedM010 = M010remainingAccountForPeriodJson[brM010Id]["saldoM010"][4];
                         codTrbutoM010 = M010remainingAccountForPeriodJson[brM010Id]["saldoM010"][5];
                         FechaAccountM010 = M010remainingAccountForPeriodJson[brM010Id]["saldoM010"][6];
                         IndM410= M010remainingAccountForPeriodJson[brM010Id]["saldoM010"][7];

                         rowString = i + "|" + codM010NetS + "|" + nameM010Nets + "|" + FechaAccountM010 + "|" + codSpedM010 + "|" + codTrbutoM010 + "|" + (M010remainingAccountForPeriodJson[brM010Id]["saldoM010"][0] || 0)+ "|" + '0.00' + "|" + '0.00' +"|" +IndM410+ "\r\n";

                         accountM010ForPeriodsString += rowString;
                         accountM010FileSize += lengthInUtf8Bytes(rowString);

                         if (accountM010FileSize > 9000000) {
                             if (accountM010ForPeriodsFileNumber == 0) {
                                 paramAccountsM010ForPeriodsFileId = saveAuxiliaryFile(accountM010ForPeriodsString, accountM010ForPeriodsFileNumber, 3);
                             } else {
                                 paramAccountsM010ForPeriodsFileId = paramAccountsM010ForPeriodsFileId + "|" + saveAuxiliaryFile(accountM010ForPeriodsString, accountM010ForPeriodsFileNumber, 3);
                             }
                             accountM010ForPeriodsString = "";
                             accountM010FileSize = 0;
                             accountM010ForPeriodsFileNumber++;
                         }
                     }
                 }
             }

             M010remainingAccountForPeriodJson = JSON.parse(JSON.stringify(M010finalBalanceJson));
         }

         // inicio del Recorrido de los meses para registro M300
         for (var i = 0; i < 12; i++) {
             // Si existe el mes dentro del JSON de periodos
 
             if (periodsJson[i] !== undefined) {
                 log.error("Antes Period BalanceM300 " + i, M300finalBalanceJson);
                 log.error("Antes Period M300" + i, M300remainingAccountForPeriodJson);

                 // Recorrido de cuentas usadas en las transacciones del mes i
                 for (var brM300Id in periodsJson[i]["accountsLanzamientoM300"]) {

                     // Elimina las cuentas que ya aparecieron en las transacciones del mes i para que no haya repetidos cuando recorra la variable remainingAccountForPeriodJson
                     if (M300remainingAccountForPeriodJson[brM300Id] !== undefined) {
                         delete M300remainingAccountForPeriodJson[brM300Id];
                     }
                     // Crea las cuentas que no tienen saldo inicial para el mes i
                     // finalBalanceJson se usa para calcular el saldo inicial de las cuentas en el mes i
                     if (M300finalBalanceJson[brM300Id] === undefined) {
                         M300finalBalanceJson[brM300Id] = {
                             "saldoM300": 0
                         };
                         M300finalBalanceJson[brM300Id]["saldoM300"] = [0, periodsJson[i]["accountsLanzamientoM300"][brM300Id][3],periodsJson[i]["accountsLanzamientoM300"][brM300Id][4],periodsJson[i]["accountsLanzamientoM300"][brM300Id][5],periodsJson[i]["accountsLanzamientoM300"][brM300Id][6],periodsJson[i]["accountsLanzamientoM300"][brM300Id][7]];
                     }

                     initialBalanceM300 = Number(M300finalBalanceJson[brM300Id]["saldoM300"][0]);
                    
                     debitLanzamM300 = Number(periodsJson[i]["accountsLanzamientoM300"][brM300Id][1]);
                     creditLanzamM300 = Number(periodsJson[i]["accountsLanzamientoM300"][brM300Id][2]);
                     codLanzamM300 = periodsJson[i]["accountsLanzamientoM300"][brM300Id][3];
                     nameLanzamM300 = periodsJson[i]["accountsLanzamientoM300"][brM300Id][4];
                     TypeLanzamM300 = periodsJson[i]["accountsLanzamientoM300"][brM300Id][5];
                     taxLanzamM300 = periodsJson[i]["accountsLanzamientoM300"][brM300Id][6];
                     indiLanzamM300 = periodsJson[i]["accountsLanzamientoM300"][brM300Id][7];
                     

                     rowString = i + "|" + codLanzamM300 + "|" + nameLanzamM300 + "|" + TypeLanzamM300 + "|" +  initialBalanceM300 + "|" + debitLanzamM300 + "|" + creditLanzamM300 +"|" + taxLanzamM300 + "|" + indiLanzamM300  + "|" + ''+ "\r\n";

                     accountM300ForPeriodsString += rowString;
                     accountM300FileSize += lengthInUtf8Bytes(rowString);


                     // Calcula el saldo inicial del siguiente mes para cada cuenta
                     M300finalBalanceJson[brM300Id]["saldoM300"][0] = Number(initialBalanceM300 + debitLanzamM300 - creditLanzamM300);
                     
                     if (accountM300FileSize > 9000000) {
                         if (accountM300ForPeriodsFileNumber == 0) {
                             paramAccountsM300ForPeriodsFileId = saveAuxiliaryFile(accountM300ForPeriodsString, accountM300ForPeriodsFileNumber, 4);
                         } else {
                             paramAccountsM300ForPeriodsFileId = paramAccountsM300ForPeriodsFileId + "|" + saveAuxiliaryFile(accountM300ForPeriodsString, accountM300ForPeriodsFileNumber, 4);
                         }
                         accountM300ForPeriodsString = "";
                         accountM300FileSize = 0;
                         accountM300ForPeriodsFileNumber++;
                     }
                   
                 }
                 log.error("Despues Period BalanceM300 " + i, M300finalBalanceJson);
                 log.error("Despues Period M300" + i, M300remainingAccountForPeriodJson);
             }

             log.error("M300remainingAccountForPeriodJson " + i, M300remainingAccountForPeriodJson);

             // Logica para recorrer las cuentas que tienen saldo Inicial pero que no tienen transacciones en el mes i
             if (Object.keys(M300remainingAccountForPeriodJson).length != 0) {
                 for (var brM300Id in M300remainingAccountForPeriodJson) {

                     if (Number(M300remainingAccountForPeriodJson[brM300Id]["saldoM300"][0]) != 0) {

                         codLanzamM300 = M300remainingAccountForPeriodJson[brM300Id]["saldoM300"][1];
                         nameLanzamM300 = M300remainingAccountForPeriodJson[brM300Id]["saldoM300"][2];
                         TypeLanzamM300 = M300remainingAccountForPeriodJson[brM300Id]["saldoM300"][3];
                         taxLanzamM300 = M300remainingAccountForPeriodJson[brM300Id]["saldoM300"][4];
                         indiLanzamM300 = M300remainingAccountForPeriodJson[brM300Id]["saldoM300"][5];

                         rowString = i + "|" + codLanzamM300 + "|" + nameLanzamM300 + "|" +TypeLanzamM300 + "|" +(M300remainingAccountForPeriodJson[brM300Id]["saldoM300"][0] || 0) + "|" + '0.00' + "|" +'0.00' + "|" + taxLanzamM300 + "|" + indiLanzamM300 + "|" +  ''+ "\r\n";
                         accountM300ForPeriodsString += rowString;
                         accountM300FileSize += lengthInUtf8Bytes(rowString);

                         if (accountM300FileSize > 9000000) {
                             if (accountM300ForPeriodsFileNumber == 0) {
                                 paramAccountsM300ForPeriodsFileId = saveAuxiliaryFile(accountM300ForPeriodsString, accountM300ForPeriodsFileNumber, 4);
                             } else {
                                 paramAccountsM300ForPeriodsFileId = paramAccountsM300ForPeriodsFileId + "|" + saveAuxiliaryFile(accountM300ForPeriodsString, accountM300ForPeriodsFileNumber, 4);
                             }
                             accountM300ForPeriodsString = "";
                             accountM300FileSize = 0;
                             accountM300ForPeriodsFileNumber++;
                         }
                     }
                 }
             }

             M300remainingAccountForPeriodJson = JSON.parse(JSON.stringify(M300finalBalanceJson));
         }

         // inicio del Recorrido de los meses para registro M350
         for (var i = 0; i < 12; i++) {
             // Si existe el mes dentro del JSON de periodos
 
             if (periodsJson[i] !== undefined) {
                 log.error("Antes Period BalanceM350 " + i, M350finalBalanceJson);
                 log.error("Antes Period M350" + i, M350remainingAccountForPeriodJson);

                 // Recorrido de cuentas usadas en las transacciones del mes i
                 for (var brM350Id in periodsJson[i]["accountsLanzamientoM350"]) {

                     // Elimina las cuentas que ya aparecieron en las transacciones del mes i para que no haya repetidos cuando recorra la variable remainingAccountForPeriodJson
                     if (M350remainingAccountForPeriodJson[brM350Id] !== undefined) {
                         delete M350remainingAccountForPeriodJson[brM350Id];
                     }
                     // Crea las cuentas que no tienen saldo inicial para el mes i
                     // finalBalanceJson se usa para calcular el saldo inicial de las cuentas en el mes i
                     if (M350finalBalanceJson[brM350Id] === undefined) {
                         M350finalBalanceJson[brM350Id] = {
                             "saldoM350": 0
                         };
                         M350finalBalanceJson[brM350Id]["saldoM350"] = [0, periodsJson[i]["accountsLanzamientoM350"][brM350Id][3],periodsJson[i]["accountsLanzamientoM350"][brM350Id][4],periodsJson[i]["accountsLanzamientoM350"][brM350Id][5],periodsJson[i]["accountsLanzamientoM350"][brM350Id][6],periodsJson[i]["accountsLanzamientoM350"][brM350Id][7]];
                     }

                     initialBalanceM350 = Number(M350finalBalanceJson[brM350Id]["saldoM350"][0]);
                    
                     debitLanzamM350 = Number(periodsJson[i]["accountsLanzamientoM350"][brM350Id][1]);
                     creditLanzamM350 = Number(periodsJson[i]["accountsLanzamientoM350"][brM350Id][2]);
                     codLanzamM350 = periodsJson[i]["accountsLanzamientoM350"][brM350Id][3];
                     nameLanzamM350 = periodsJson[i]["accountsLanzamientoM350"][brM350Id][4];
                     TypeLanzamM350 = periodsJson[i]["accountsLanzamientoM350"][brM350Id][5];
                     taxLanzamM350 = periodsJson[i]["accountsLanzamientoM350"][brM350Id][6];
                     indiLanzamM350 = periodsJson[i]["accountsLanzamientoM350"][brM350Id][7];
                     

                     rowString = i + "|" + codLanzamM350 + "|" + nameLanzamM350 + "|" + TypeLanzamM350 + "|" +  initialBalanceM350 + "|" + debitLanzamM350 + "|" + creditLanzamM350 +"|" + taxLanzamM350 + "|" + indiLanzamM350  + "|" + ''+ "\r\n";

                     accountM350ForPeriodsString += rowString;
                     accountM350FileSize += lengthInUtf8Bytes(rowString);


                     // Calcula el saldo inicial del siguiente mes para cada cuenta
                     M350finalBalanceJson[brM350Id]["saldoM350"][0] = Number(initialBalanceM350 + debitLanzamM350 - creditLanzamM350);
                     
                     if (accountM350FileSize > 9000000) {
                         if (accountM350ForPeriodsFileNumber == 0) {
                             paramAccountsM350ForPeriodsFileId = saveAuxiliaryFile(accountM350ForPeriodsString, accountM350ForPeriodsFileNumber, 5);
                         } else {
                             paramAccountsM350ForPeriodsFileId = paramAccountsM350ForPeriodsFileId + "|" + saveAuxiliaryFile(accountM350ForPeriodsString, accountM350ForPeriodsFileNumber, 5);
                         }
                         accountM350ForPeriodsString = "";
                         accountM350FileSize = 0;
                         accountM350ForPeriodsFileNumber++;
                     }
                   
                 }
                 log.error("Despues Period BalanceM350 " + i, M350finalBalanceJson);
                 log.error("Despues Period M350" + i, M350remainingAccountForPeriodJson);
             }

             log.error("M350remainingAccountForPeriodJson " + i, M350remainingAccountForPeriodJson);

             // Logica para recorrer las cuentas que tienen saldo Inicial pero que no tienen transacciones en el mes i
             if (Object.keys(M350remainingAccountForPeriodJson).length != 0) {
                 for (var brM350Id in M350remainingAccountForPeriodJson) {

                     if (Number(M350remainingAccountForPeriodJson[brM350Id]["saldoM350"][0]) != 0) {

                         codLanzamM350 = M350remainingAccountForPeriodJson[brM350Id]["saldoM350"][1];
                         nameLanzamM350 = M350remainingAccountForPeriodJson[brM350Id]["saldoM350"][2];
                         TypeLanzamM350 = M350remainingAccountForPeriodJson[brM350Id]["saldoM350"][3];
                         taxLanzamM350 = M350remainingAccountForPeriodJson[brM350Id]["saldoM350"][4];
                         indiLanzamM350 = M350remainingAccountForPeriodJson[brM350Id]["saldoM350"][5];

                         rowString = i + "|" + codLanzamM350 + "|" + nameLanzamM350 + "|" +TypeLanzamM350 + "|" +(M350remainingAccountForPeriodJson[brM350Id]["saldoM350"][0] || 0) + "|" + '0.00' + "|" +'0.00' + "|" + taxLanzamM350 + "|" + indiLanzamM350 + "|" +  ''+ "\r\n";
                         accountM350ForPeriodsString += rowString;
                         accountM350FileSize += lengthInUtf8Bytes(rowString);

                         if (accountM350FileSize > 9000000) {
                             if (accountM350ForPeriodsFileNumber == 0) {
                                 paramAccountsM350ForPeriodsFileId = saveAuxiliaryFile(accountM350ForPeriodsString, accountM350ForPeriodsFileNumber, 5);
                             } else {
                                 paramAccountsM350ForPeriodsFileId = paramAccountsM350ForPeriodsFileId + "|" + saveAuxiliaryFile(accountM350ForPeriodsString, accountM350ForPeriodsFileNumber, 5);
                             }
                             accountM350ForPeriodsString = "";
                             accountM350FileSize = 0;
                             accountM350ForPeriodsFileNumber++;
                         }
                     }
                 }
             }

             M350remainingAccountForPeriodJson = JSON.parse(JSON.stringify(M350finalBalanceJson));
         }

             //transacciones l100 y l300
             if (accountForPeriodsString != "") {
                 if (accountForPeriodsFileNumber == 0) {
                     paramAccountsForPeriodsFileId = saveAuxiliaryFile(accountForPeriodsString, accountForPeriodsFileNumber, 1);
                 } else {
                     paramAccountsForPeriodsFileId = paramAccountsForPeriodsFileId + "|" + saveAuxiliaryFile(accountForPeriodsString, accountForPeriodsFileNumber, 1);
                 }
             }
             //transacciones l210
             if (accountL210ForPeriodsString != "") {
                 if (accountL210ForPeriodsFileNumber == 0) {
                     paramAccountsL210ForPeriodsFileId = saveAuxiliaryFile(accountL210ForPeriodsString, accountL210ForPeriodsFileNumber, 2);
                 } else {
                     paramAccountsL210ForPeriodsFileId = paramAccountsL210ForPeriodsFileId + "|" + saveAuxiliaryFile(accountL210ForPeriodsString, accountL210ForPeriodsFileNumber, 2);
                 }
             }
             //transacciones m010

             if (accountM010ForPeriodsString != "") {
                 if (accountM010ForPeriodsFileNumber == 0) {
                     paramAccountsM010ForPeriodsFileId = saveAuxiliaryFile(accountM010ForPeriodsString, accountM010ForPeriodsFileNumber, 3);
                 } else {
                     paramAccountsM010ForPeriodsFileId = paramAccountsM010ForPeriodsFileId + "|" + saveAuxiliaryFile(accountM010ForPeriodsString, accountM010ForPeriodsFileNumber, 3);
                 }
             }
             //transaciones m300 
             if (accountM300ForPeriodsString != "") {
                 if (accountM300ForPeriodsFileNumber == 0) {
                     paramAccountsM300ForPeriodsFileId = saveAuxiliaryFile(accountM300ForPeriodsString, accountM300ForPeriodsFileNumber, 4);
                 } else {
                     paramAccountsM300ForPeriodsFileId = paramAccountsM300ForPeriodsFileId + "|" + saveAuxiliaryFile(accountM300ForPeriodsString, accountM300ForPeriodsFileNumber, 4);
                 }
             }
             //transaciones m350 
             if (accountM350ForPeriodsString != "") {
                 if (accountM350ForPeriodsFileNumber == 0) {
                     paramAccountsM350ForPeriodsFileId = saveAuxiliaryFile(accountM350ForPeriodsString, accountM350ForPeriodsFileNumber, 5);
                 } else {
                     paramAccountsM350ForPeriodsFileId = paramAccountsM350ForPeriodsFileId + "|" + saveAuxiliaryFile(accountM350ForPeriodsString, accountM350ForPeriodsFileNumber, 5);
                 }
             }

             

             // //envia id de archivo de padron B para M010
             // paramAccountsPadronBPlanFileId = getAccountsPadronBFileId();
             // log.error("Accounts pdron B M010 ID", paramAccountsPadronBPlanFileId);

             paramAccountsReferencialFileId = getAccountsReferencialFileId(initialBalanceJson);
             log.error("Accounts Total sin data ID", paramAccountsReferencialFileId);

             callScheduleScript(paramAccountsForPeriodsFileId, paramAccountsL210ForPeriodsFileId, paramAccountsM010ForPeriodsFileId, paramAccountsM300ForPeriodsFileId, paramAccountsM350ForPeriodsFileId, paramAccountsReferencialFileId);
         }

         log.debug("Cantidad", totalKeysSaved);
         log.debug("ACCOUNT FOR PERIOD", paramAccountsForPeriodsFileId);
         log.debug("ACCOUNT de lanzamientos FOR PERIOD", paramAccountsM300ForPeriodsFileId);


          } catch (error) {
              log.error("error", error);
              libFeature.sendErrorEmail(error, LMRY_script, language);

          }
     }

     function round(number) {
         return Math.round(Number(number) * 100) / 100;
     }

     function ObtenerCuentasReferenciales() {

         var intDMinReg = 0;
         var intDMaxReg = 1000;

         var DbolStop = false;
         var arrAuxiliar = new Array();
         var ArrCuentaReferencial = new Array();

         var _cont = 0;

         var savedsearch = search.create({
             type: 'customrecord_lmry_br_local_account',

             filters: [
                 ["formulatext: {custrecord_lmry_br_account}", "isnotempty", ""],
                 "AND",
                 ["custrecord_lmry_br_subsidiarie", "anyof", paramSubsidiary]
             ],

             // settings: [
             //     search.createSetting({
             //         name: 'consolidationtype',
             //         value: 'NONE'
             //     })
             // ],
             columns: [

                 //0. codigo de cuenta referencial
                 search.createColumn({
                     name: "name",
                     sort: search.Sort.ASC,
                     label: "Name"
                 }),
                 //1. subsidiaria a la que pertenece
                 search.createColumn({
                     name: "custrecord_lmry_br_subsidiarie",
                     label: "Latam - BR Subsidiarie"
                 }),
                 //2. listado de cuentas corporativas asociadas a la cuenta referencial
                 search.createColumn({
                     name: "custrecord_lmry_br_account",
                     label: "Latam - BR Account"
                 }),
                 //3. cuenta superior
                 search.createColumn({
                     name: "custrecord_lmry_br_acc_parent",
                     label: "Latam - BR Account's Parent"
                 }),
                 //4. Nivel de la cuenta
                 search.createColumn({
                     name: "custrecord_lmry_br_level",
                     label: "Latam - BR Level"
                 }),
                 //5. Naturaleza de la cuenta
                 search.createColumn({
                     name: "custrecord_lmry_id_acc_group",
                     label: "Latam - BR Account's Nature"
                 }),
                 //6. ID de la ceunta referencial
                 search.createColumn({
                     name: "internalid",
                     label: "Internal ID"
                 }),
                 //7. nombre de la cuenta referencial
                 search.createColumn({
                     name: "custrecord_lmry_br_name",
                     label: "Latam - BR Name"
                 }),
                 //8. tipo de cuenta referencial
                 search.createColumn({
                     name: "custrecord_lmry_br_acc_type",
                     label: "Latam - BR Account's Type"
                 })

             ]
         });


         var searchresult = savedsearch.run();

         while (!DbolStop) {
             var objResult = searchresult.getRange(intDMinReg, intDMaxReg);
             if (objResult != null) {
                 var intLength = objResult.length;

                 if (intLength != 1000) {
                     DbolStop = true;
                 }

                 for (var i = 0; i < intLength; i++) {
                     var columns = objResult[i].columns;
                     arrAuxiliar = new Array();

                     //0. codigo de cuenta referencial name
                     arrAuxiliar[0] = objResult[i].getValue(columns[0]);
                     //1. subsidiaria asociada
                     arrAuxiliar[1] = objResult[i].getValue(columns[1]);
                     //2. Latam - BR Account - cuenta corporativa asociada
                     arrAuxiliar[2] = objResult[i].getValue(columns[2]);
                     // log.error('arrAuxiliar[2].1', arrAuxiliar[2]);
                     //3. Latam - BR Account's Parent
                     arrAuxiliar[3] = objResult[i].getValue(columns[3]);
                     //4. Latam - BR Level
                     arrAuxiliar[4] = objResult[i].getValue(columns[4]);
                     //5. Latam - BR Account's Nature
                     arrAuxiliar[5] = objResult[i].getValue(columns[5]);
                     //6. ID de la cuenta referncial
                     arrAuxiliar[6] = objResult[i].getValue(columns[6]);
                     //7. nombre de la cuenta referncial
                     arrAuxiliar[7] = objResult[i].getValue(columns[7]);
                     //8. tipo de la cuenta referncial
                     arrAuxiliar[8] = objResult[i].getValue(columns[8]);


                     ArrCuentaReferencial[_cont] = arrAuxiliar;
                     _cont++;

                 }
                 log.error('ArrCuentaReferencial', ArrCuentaReferencial);
                 intDMinReg = intDMaxReg;
                 intDMaxReg += 1000;
             } else {
                 DbolStop = true;
             }
         }

         return ArrCuentaReferencial;
     }

     function ObtenerMovimientos() {
         log.debug('entro', 'entro');
         var natureCodeJson = getNatureCode();

         var resultadoArray = [];
         // búsqueda para movimientos
         var savedSearch = search.load({
             id: "customsearch_lmry_br_account_balance_ecf"
         });
         
         //Se esta agregando esta columna nueva en caso se trabaje con periods end journal
         var tipoTransaccion = search.createColumn({
            name     : 'formulatext',
            formula  : '{type.id}',
            label    : '16. Tipo transaccion'
        });
        savedSearch.columns.push(tipoTransaccion);
        //----------------------------------------------------------
        
         if (hasSubsidiariesFeature) {
             var subsidiariesArray = getMatrixAndSubsidiaries(paramSubsidiary);
             var subsidiaryFilter = search.createFilter({
                 name: "subsidiary",
                 operator: search.Operator.IS,
                 values: subsidiariesArray
             });
             savedSearch.filters.push(subsidiaryFilter);
         }

         if (hasMultipleCalendars) {
                var periodsArray = getPeriodsFromCalendarFiscal(2);
                var formula = getPeriodsFormulaText(periodsArray);
                var periodsFilter = search.createFilter({
                    name: "formulatext",
                    formula: formula,
                    operator: search.Operator.IS,
                    values: "1"
                });
                savedSearch.filters.push(periodsFilter);
                log.error('calendar', 'entro busqueda calendar');
            
         } else {
                var periodFilter = search.createFilter({
                    name: "postingperiod",
                    operator: search.Operator.IS,
                    values: [paramPeriod]
                });
            
             savedSearch.filters.push(periodFilter);
             log.error('no calendar', 'no entro busqueda calendar');
         }
         
         //Agregando period end journals y validaciones
         //var jsonPeriodosCal = obtenerPeriodosMensuales();
         if (featurePeriodEnd == true || featurePeriodEnd == 'T') {
            var confiPeriodEnd = search.createSetting({
                name: 'includeperiodendtransactions',
                value: 'TRUE'
            });
            savedSearch.settings.push(confiPeriodEnd);
         }

         var searchResult = savedSearch.run();

         var objResult, length, intDMinReg = 0;

         var intDMaxReg = 1000;

         var DbolStop = false;

         var auxArray, columns;

         while (!DbolStop) {
             objResult = searchResult.getRange(intDMinReg, intDMaxReg);

             if (objResult != null) {
                 length = objResult.length;
                 if (length != 1000) {
                     DbolStop = true;
                 }

                 for (var i = 0; i < length; i++) {
                     columns = objResult[i].columns
                     auxArray = [];

                     // 0. Internal ID
                     auxArray[0] = objResult[i].getValue(columns[0]);

                     // 1. Fecha de asiento contable
                     auxArray[1] = objResult[i].getValue(columns[1]);

                     // 2. Valor de asiento contable / Valor de salida Debito
                     auxArray[2] = objResult[i].getValue(columns[2]);

                     // 3. Valor de asiento contable / Valor de salida Credito
                     auxArray[3] = objResult[i].getValue(columns[3]);

                     // 4. Tipo de Lanzamiento(Ajuste de periodo)
                     if(objResult[i].getValue(columns[16]) == 'PEJrnl'){
                        auxArray[4] = "E";
                     }else{
                        auxArray[4] = objResult[i].getValue(columns[4]);
                     }
                     //auxArray[4] = objResult[i].getValue(columns[4]);

                     // 5. Account ID
                     auxArray[5] = objResult[i].getValue(columns[5]);

                     // 6. Codigo de cuenta analitica
                     auxArray[6] = objResult[i].getValue(columns[6]);

                     // 7. fecha de creacion de la cuenta asociada a la transaccion
                     auxArray[7] = objResult[i].getValue(columns[7]);

                     // 8. Periodo
                     auxArray[8] = objResult[i].getValue(columns[8]);

                     // 9. Nombre de la cuenta
                     auxArray[9] = objResult[i].getValue(columns[9]);

                     // 10. tipo de cuenta
                     auxArray[10] = objResult[i].getValue(columns[10]);

                     // 11. Naturaleza de la cuenta

                     auxArray[11] = natureCodeJson[objResult[i].getValue(columns[11])] || "";

                     //12.cuenta superior
                     auxArray[12] = objResult[i].getValue(columns[12]);
                     //13. nivel de la cuenta
                     auxArray[13] = objResult[i].getValue(columns[13]);
                     //14. id de la cuenta COA
                     auxArray[14] = objResult[i].getValue(columns[14]);
                     // //15. id de la cuenta de lanzamiento parte A para registro M300
                     // idLanzamiento = objResult[i].getValue(columns[15]);
                     // if (idLanzamiento != '' && idLanzamiento != null) {
                     //     auxArray[15] = idLanzamiento;
                     // } else {
                     //     auxArray[15] = ''
                     // }
                     // auxArray[16] = ''
                     // auxArray[17] = ''
                     // auxArray[18] = ''
                     // auxArray[19] = ''


                     resultadoArray.push(auxArray);
                 }


                 intDMinReg = intDMaxReg;
                 intDMaxReg = intDMaxReg + 1000;
             } else {
                 DbolStop = true;
             }
         }
         log.error('resultadoArray', resultadoArray);
         return resultadoArray;
     }

     function SepararCuentasReferenciales(initialBalanceJson) {
         //se hace esto ya que el campo Local br account puede traer mas de un id

         var intDMinReg = 0;
         var intDMaxReg = 1000;

         var DbolStop = false;
         var arrAuxiliar = new Array();
         var ArrCuentaReferencial = new Array();

         var _cont = 0;

         var savedsearch = search.create({
             type: 'customrecord_lmry_br_local_account',

             filters: [
                 ["formulatext: {custrecord_lmry_br_account}", "isnotempty", ""],
                 "AND",
                 ["custrecord_lmry_br_subsidiarie", "anyof", paramSubsidiary]
             ],
             columns: [

                 //0. codigo de cuenta referencial
                 search.createColumn({
                     name: "name",
                     sort: search.Sort.ASC,
                     label: "Name"
                 }),
                 //1. subsidiaria a la que pertenece
                 search.createColumn({
                     name: "custrecord_lmry_br_subsidiarie",
                     label: "Latam - BR Subsidiarie"
                 }),
                 //2. listado de cuentas corporativas asociadas a la cuenta referencial
                 search.createColumn({
                     name: "custrecord_lmry_br_account",
                     label: "Latam - BR Account"
                 }),
                 //3. cuenta superior
                 search.createColumn({
                     name: "custrecord_lmry_br_acc_parent",
                     label: "Latam - BR Account's Parent"
                 }),
                 //4. Nivel de la cuenta
                 search.createColumn({
                     name: "custrecord_lmry_br_level",
                     label: "Latam - BR Level"
                 }),
                 //5. Naturaleza de la cuenta
                 search.createColumn({
                     name: "custrecord_lmry_id_acc_group",
                     label: "Latam - BR Account's Nature"
                 }),
                 //6. ID de la ceunta referencial
                 search.createColumn({
                     name: "internalid",
                     label: "Internal ID"
                 }),
                 //7. nombre de la cuenta referencial
                 search.createColumn({
                     name: "custrecord_lmry_br_name",
                     label: "Latam - BR Name"
                 }),
                 //8. tipo de cuenta referencial
                 search.createColumn({
                     name: "custrecord_lmry_br_acc_type",
                     label: "Latam - BR Account's Type"
                 })

             ]
         });

         var searchresult = savedsearch.run();

         while (!DbolStop) {
             var objResult = searchresult.getRange(intDMinReg, intDMaxReg);
             if (objResult != null) {
                 var intLength = objResult.length;

                 if (intLength != 1000) {
                     DbolStop = true;
                 }

                 for (var i = 0; i < intLength; i++) {
                     var columns = objResult[i].columns;
                     arrAuxiliar = new Array();
                     log.error('IDCuentaReferencial  antes del coma', objResult[i].getValue(columns[2]));
                     var IDCuentaReferencial = objResult[i].getValue(columns[2]).split(',');
                     // log.error('IDCuentaReferencialdespues del coma',IDCuentaReferencial);
                     for (var j = 0; j < IDCuentaReferencial.length; j++) {
                         //  log.error('IDCuentaReferencial',IDCuentaReferencial);
                         //log.error('IDCuentaReferencial[j]',IDCuentaReferencial[j]);
                         arrAuxiliar = new Array();
                         // if (IDCuentaCorporativa == IDCuentaReferencial[j]) {
                         // log.error('entro IDCuentaCorporativa',IDCuentaCorporativa);

                         //0. codigo de cuenta referencial name
                         arrAuxiliar[0] = objResult[i].getValue(columns[0]);
                         //1. subsidiaria asociada
                         arrAuxiliar[1] = objResult[i].getValue(columns[1]);
                         //2. Latam - BR Account - cuenta corporativa asociada
                         arrAuxiliar[2] = IDCuentaReferencial[j];
                         //  log.error('arrAuxiliar[2].1', arrAuxiliar[2]);
                         //3. Latam - BR Account's Parent
                         arrAuxiliar[3] = objResult[i].getValue(columns[3]);
                         //4. Latam - BR Level
                         arrAuxiliar[4] = objResult[i].getValue(columns[4]);
                         //5. Latam - BR Account's Nature
                         arrAuxiliar[5] = objResult[i].getValue(columns[5]);
                         //6. ID de la cuenta referncial
                         arrAuxiliar[6] = objResult[i].getValue(columns[6]);
                         //7. nombre de la cuenta referncial
                         arrAuxiliar[7] = objResult[i].getValue(columns[7]);
                         //8. tipo de la cuenta referncial
                         arrAuxiliar[8] = objResult[i].getValue(columns[8]);
                         //9. saldo inicial de la cuenta
                         arrAuxiliar[9] = initialBalanceJson[IDCuentaReferencial[j]] || 0;
                         // }


                         ArrCuentaReferencial[_cont] = arrAuxiliar;
                         _cont++;

                     }
                 }
                 log.error('ArrCuentaReferencial lo que viene de la busqueda local account', ArrCuentaReferencial);
                 intDMinReg = intDMaxReg;
                 intDMaxReg += 1000;
             } else {
                 DbolStop = true;
             }
         }



         return ArrCuentaReferencial;
     }



     //entra en esta funcion cuando no hay data en la bsuqueda de movimientos
     function getAccountsReferencialFileId(initialBalanceJson) {
         // var natureCodeJson = getNatureCode();
         var savedSearch = search.create({
             type: 'customrecord_lmry_br_local_account',

             filters: [
                 ["formulatext: {custrecord_lmry_br_account}", "isnotempty", ""],
                 "AND",
                 ["custrecord_lmry_br_subsidiarie", "anyof", paramSubsidiary]
             ],
             columns: [

                 //0. codigo de cuenta referencial
                 search.createColumn({
                     name: "name",
                     sort: search.Sort.ASC,
                     label: "Name"
                 }),
                 //1. subsidiaria a la que pertenece
                 search.createColumn({
                     name: "custrecord_lmry_br_subsidiarie",
                     label: "Latam - BR Subsidiarie"
                 }),
                 //2. listado de cuentas corporativas asociadas a la cuenta referencial
                 search.createColumn({
                     name: "custrecord_lmry_br_account",
                     label: "Latam - BR Account"
                 }),
                 //3. cuenta superior
                 search.createColumn({
                     name: "custrecord_lmry_br_acc_parent",
                     label: "Latam - BR Account's Parent"
                 }),
                 //4. Nivel de la cuenta
                 search.createColumn({
                     name: "custrecord_lmry_br_level",
                     label: "Latam - BR Level"
                 }),
                 //5. Naturaleza de la cuenta
                 search.createColumn({
                     name: "custrecord_lmry_id_acc_group",
                     label: "Latam - BR Account's Nature"
                 }),
                 //6. ID de la ceunta referencial
                 search.createColumn({
                     name: "internalid",
                     label: "Internal ID"
                 }),
                 //7. nombre de la cuenta referencial
                 search.createColumn({
                     name: "custrecord_lmry_br_name",
                     label: "Latam - BR Name"
                 }),
                 //8. tipo de cuenta referencial
                 search.createColumn({
                     name: "custrecord_lmry_br_acc_type",
                     label: "Latam - BR Account's Type"
                 })

             ]
         });

         var pagedData = savedSearch.runPaged({
             pageSize: 1000
         });

         var page, auxArray, columns, accountsReferencialString = "",
             auxArray, accountsReferencialFileId, accountReferencialFileSize, accountReferencialFileNumber = 0;
         pagedData.pageRanges.forEach(function(pageRange) {
             page = pagedData.fetch({
                 index: pageRange.index
             });

             page.data.forEach(function(result) {
                 columns = result.columns;
                 auxArray = [];

                 //9. saldo inicial de la cuenat referencial
                 var IDCuentaReferencial = (result.getValue(columns[2])).split(',');
                 // log.error('no hay data SI match', IDCuentaReferencial);
                 for (var j = 0; j < IDCuentaReferencial.length; j++) {
                     columns = result.columns;
                     auxArray = [];
                     //6. ID de la cuenta referncial
                     auxArray[0] = result.getValue(columns[6]);
                     //2. Latam - BR Account - cuenta corporativa asociada
                     auxArray[1] = IDCuentaReferencial[j];

                     //5. Latam - BR Account's Nature
                     auxArray[2] = result.getValue(columns[5]);
                     //8. tipo de la cuenta referncial
                     auxArray[3] = result.getValue(columns[8]);
                     //4. Latam - BR Level
                     auxArray[4] = result.getValue(columns[4]);

                     //0. codigo de cuenta referencial name
                     auxArray[5] = result.getValue(columns[0]);
                     //3. Latam - BR Account's Parent
                     auxArray[6] = result.getValue(columns[3]);
                     //7. nombre de la cuenta referncial
                     auxArray[7] = result.getValue(columns[7]);
                     //saldo inicial
                     auxArray[8] = initialBalanceJson[IDCuentaReferencial[j]] || 0;
                     accountsReferencialString += getRowString(auxArray) + "\r\n";

                 }

             });


             accountReferencialFileSize = lengthInUtf8Bytes(accountsReferencialString);

             if (accountReferencialFileSize > 8000000) {
                 if (accountReferencialFileNumber == 0) {
                     accountsReferencialFileId = saveAuxiliaryFile(accountsReferencialString, accountReferencialFileNumber, 6);
                 } else {
                     accountsReferencialFileId = accountsReferencialFileId + "|" + saveAuxiliaryFile(accountsReferencialString, accountReferencialFileNumber, 6);
                 }
                 accountsReferencialString = "";
                 accountReferencialFileSize = 0;
                 accountReferencialFileNumber++;
             }
         });

         if (accountsReferencialString != "") {
             if (accountReferencialFileNumber == 0) {
                 accountsReferencialFileId = saveAuxiliaryFile(accountsReferencialString, accountReferencialFileNumber, 6);
             } else {
                 accountsReferencialFileId = accountsReferencialFileId + "|" + saveAuxiliaryFile(accountsReferencialString, accountReferencialFileNumber, 6);
             }
         }
         //log.error('accountsReferencialFileId', accountsReferencialFileId);
         return accountsReferencialFileId;

     }

   

     function getRowString(array) {
         var rowString = "";
         for (var i = 0; i < array.length; i++) {
             rowString += array[i];
             if (i != array.length - 1) {
                 rowString += "|";
             }
         }
         return rowString;
     }

     function getNatureCode() {
         var natureCodeJson = {};

         var savedSearch = search.create({
             type: "customrecord_lmry_account_type",
             filters: [
                 ["custrecord_countries", "anyof", "30"]
             ],
             columns: ["custrecord_account_type", "custrecord_nature_code"]
         });

         var resultArray = savedSearch.run().getRange(0, 1000);

         if (resultArray != null && resultArray.length > 0) {
             for (var i = 0; i < resultArray.length; i++) {
                 natureCodeJson[resultArray[i].getText("custrecord_account_type")] = resultArray[i].getValue("custrecord_nature_code");
             }
         }
         return natureCodeJson;
     }


     function getPeriodsFormulaText(periodsArray) {
         var formula = "CASE WHEN ";
        // log.error(':C', periodsArray);
        for (var i = 0; i < periodsArray.length; i++) {
                formula += "{postingperiod.id} = '" + periodsArray[i] + "'";
               if (i < periodsArray.length - 1) {
                   formula += " OR ";
               }
        }
        formula += " THEN 1 ELSE 0 END";
        // log.error('getPeriodsFormulaText', formula);
         return formula;
     }

     function getPeriodsFromCalendarFiscal(type) {
         var fiscalCalendar = search.lookupFields({
             type: search.Type.SUBSIDIARY,
             id: paramSubsidiary,
             columns: ['fiscalcalendar']
         }).fiscalcalendar[0].value;
        // log.error("calendario Fiscal, type " + type, fiscalCalendar);

         var periodsArray = [];
         var periodStartDate = search.lookupFields({
             type: search.Type.ACCOUNTING_PERIOD,
             id: paramPeriod,
             columns: ["startdate"]
         }).startdate;

        // log.error('periodStartDate', periodStartDate);
         if (type == 1) {
             var savedSearch = search.create({
                 type: "accountingperiod",
                 filters: [
                     ['startdate', 'before', periodStartDate],
                     "AND",
                     ["isquarter", "is", "F"],
                     "AND",
                     ["isyear", "is", "F"],
                     "AND",
                     ["fiscalcalendar", "anyof", fiscalCalendar]
                 ],
                 columns: [
                     search.createColumn({
                         name: 'internalid',
                         sort: search.Sort.ASC
                     }),
                     search.createColumn({
                         name: 'startdate'
                     })
                 ]

                 // columns: ["internalid", "startdate"]
             });
         } else if (type == 2) {
             var savedSearch = search.create({
                 type: "accountingperiod",
                 filters: [
                     ["parent", "anyof", paramPeriod],
                     "AND",
                     ["fiscalcalendar", "anyof", fiscalCalendar],
                     "AND",
                     ["isquarter", "is", "F"],
                     "AND",
                     ["isyear", "is", "F"]
                 ],
                 columns: [
                     search.createColumn({
                         name: 'internalid',
                         sort: search.Sort.ASC
                     }),
                     search.createColumn({
                         name: 'startdate'
                     })
                 ]

                 //columns: ["internalid", "startdate"]
             });

         }
         else if (type == 3) {
             var periodRecord = search.lookupFields({
                 type    : search.Type.ACCOUNTING_PERIOD,
                 id      : paramPeriod,
                 columns : ['enddate', 'startdate']
             });
 
             var startDateObject = format.parse({
                 type  : format.Type.DATE,
                 value : periodRecord.startdate
             });
             startDate = obtenerFormatoFecha(startDateObject);
 
            var  anioFisco = startDateObject.getFullYear() + "";
log.debug('anioFisco',anioFisco);
             var savedSearch = search.create({
                 type: "customrecord_lmry_special_accountperiod",
                 filters: [
                     
                     ["custrecord_lmry_anio_fisco", "is", anioFisco]
                     
                 ],
                 columns: [

                     search.createColumn({
                         name: 'internalid',
                         join: "custrecord_lmry_accounting_period",
                         sort: search.Sort.ASC
                     })  //,
                     // search.createColumn({
                     //     name: 'custrecord_lmry_accounting_period'
                     // }),
                     // search.createColumn({
                     //     name: 'custrecord_lmry_anio_fisco'
                     // })
                 ]

                 //columns: ["internalid", "startdate"]
             });

         }

         var pagedData = savedSearch.runPaged({
             pageSize: 1000
         });

         var page, auxArray, columns, periodsArray = [];
         pagedData.pageRanges.forEach(function(pageRange) {
             page = pagedData.fetch({
                 index: pageRange.index
             });

             page.data.forEach(function(result) {
                 columns = result.columns;
                 periodsArray.push(result.getValue(columns[0]));
             });
         });
         log.debug(':c periodsArray del fiscal calendar', periodsArray);
         return periodsArray;
     }

     function obtenerFormatoFecha(date) {
         return "" + completar_cero(2, date.getDate()) + completar_cero(2, date.getMonth() + 1) + date.getFullYear();
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

     function ObtenerSIMultibook() {
         var natureCodeJson = getNatureCode();
         var initialBalanceJson = {};

        // var ids = ['898498','273603','161136','171368'];
        //var ids = ['273603','658935','693637','795003','894869','909812','911008','911030','912037','961287','963972','965020','969320']
         
         var savedsearch = search.create({
             type: 'transaction',

             filters: [
                 ["posting", "is", "T"],
                 "AND",
                 ["accountingtransaction.accounttype", "noneof", "@NONE@", "Stat", "NonPosting"],
                 "AND",
                 ["voided", "is", "F"],
                 "AND",
                 ["memorized", "is", "F"],
                 "AND",
                 ["formulatext: {accountingtransaction.account}", "isnotempty", ""],
                 //"AND", 
                 //["formulatext: {account.custrecord_lmry_br_coa}","isnotempty",""],
                 "AND",
                 ["formulanumeric: NVL({accountingtransaction.debitamount},0) - NVL({accountingtransaction.creditamount},0)", "notequalto", "0"]/*,
                 "AND",
                 ["internalid", "anyof", ids]*/
             ],

             settings: [
                 search.createSetting({
                     name: 'consolidationtype',
                     value: 'NONE'
                 })
             ],
             columns: [
                 search.createColumn({
                     name: "formulanumeric",
                     summary: "GROUP",
                     formula: "{accountingtransaction.account.id}",
                     label: "0. ID de la cuenta"
                 }),
                 search.createColumn({
                     name: "formulacurrency",
                     summary: "SUM",
                     formula: "NVL({accountingtransaction.debitamount},0) - NVL({accountingtransaction.creditamount},0)",
                     label: "Formula (Currency)"
                 })

             ]

         });
         if (featurePeriodEnd == true || featurePeriodEnd == 'T') {
            var confiPeriodEnd = search.createSetting({
                name: 'includeperiodendtransactions',
                value: 'TRUE'
            });
            savedsearch.settings.push(confiPeriodEnd);
         }

         if (hasSubsidiariesFeature) {
             var subsidiariesArray = getMatrixAndSubsidiaries(paramSubsidiary);
             log.error("Formula subsidiariesArraygetAccountsInitialBalance", subsidiariesArray);
             var subsidiaryFilter = search.createFilter({
                 name: "subsidiary",
                 operator: search.Operator.IS,
                 values: subsidiariesArray
             });
             savedsearch.filters.push(subsidiaryFilter);
         }

         if (hasMultibookFeature) {
             var multibookFilter = search.createFilter({
                 name: 'accountingbook',
                 join: 'accountingtransaction',
                 operator: search.Operator.IS,
                 values: [paramMultibook]
             });
             savedsearch.filters.push(multibookFilter);
         }


         if (hasMultipleCalendars) {
                var periodsArray = getPeriodsFromCalendarFiscal(1);
             //log.error("periodsArray saldo inicial getAccountsInitialBalance", periodsArray);
                if (periodsArray != null && periodsArray != '') {
                    var formula = getPeriodsFormulaText(periodsArray);
                    log.error("Formula multibbookgetAccountsInitialBalance", formula);
                    var periodsFilter = search.createFilter({
                        name: "formulatext",
                        formula: formula,
                        operator: search.Operator.IS,
                        values: "1"
                    });
                    savedsearch.filters.push(periodsFilter);
                }
         } else {
             var periodStartDate = search.lookupFields({
                    type: search.Type.ACCOUNTING_PERIOD,
                    id: paramPeriod,
                    columns: ["startdate"]
             }).startdate;
             
             var beforeDateFilter = search.createFilter({
                 name: "trandate",
                 operator: search.Operator.BEFORE,
                 values: [periodStartDate]
             });
             savedsearch.filters.push(beforeDateFilter);
         }

         //log.error('busuqeda multibook saldo inicial',savedsearch);
         var pagedData = savedsearch.runPaged({
             pageSize: 1000
         });

         var page, auxArray, columns;

         pagedData.pageRanges.forEach(function(pageRange) {
             page = pagedData.fetch({
                 index: pageRange.index
             });

             page.data.forEach(function(result) {
                 columns = result.columns;
                 auxArray = [];
                 // 0. Br account Id
                 auxArray[0] = result.getValue(columns[0]);

                 // 1. saldo incial
                 auxArray[1] = Number(result.getValue(columns[1]));

                 // 2. naturaleza de la cuenta

                 var brCoaRecord = search.lookupFields({
                     type: search.Type.ACCOUNT,
                     id: auxArray[0],
                     columns: ['type']
                 });

                 var naturaleza = brCoaRecord.type[0].text;
                 //log.error('naturaleza',naturaleza);
                 auxArray[2] = natureCodeJson[naturaleza] || "";

                 if (auxArray[0] != "" && auxArray[0] != "- None -" && Number(auxArray[1]) != 0) {
                     if (initialBalanceJson[auxArray[0]] === undefined) {
                         // initialBalanceJson[auxArray[0]] = {
                         //     "saldo": 0
                         //     // "departments" : {}
                         // };
                         initialBalanceJson[auxArray[0]] = [auxArray[1], auxArray[0], auxArray[2]];

                     }

                     //initialBalanceJson[auxArray[0]]["departments"][auxArray[3]] = [auxArray[1], auxArray[2]]; 
                     //initialBalanceJson[auxArray[0]]["saldo"] = [Number(initialBalanceJson[auxArray[0]]["saldo"] + auxArray[1]), auxArray[0], auxArray[2]];

                 }
                 //initialBalanceJson[result.getValue(columns[0])] = Number(result.getValue(columns[1]));
                 //  log.error('Multibook1 cuenta',result.getValue(columns[0]));
                 //  log.error('Multibook1 saldo ',result.getValue(columns[1]));
             });
         });
         //log.error('Multibook2 initialBalanceJson',initialBalanceJson);
         return initialBalanceJson;


     }

     //esta funcion se utiliza para las transacciones que no tengan multibook
     function getAccountsInitialBalance() {
         var initialBalanceJson = {};

         var savedSearch = search.load({
             id: "customsearch_lmry_br_acc_ini_balance_ecf"
         });

         if (featurePeriodEnd == true || featurePeriodEnd == 'T') {
            var confiPeriodEnd = search.createSetting({
                name: 'includeperiodendtransactions',
                value: 'TRUE'
            });
            savedSearch.settings.push(confiPeriodEnd);
         }

         if (hasSubsidiariesFeature) {
             var subsidiaryFilter = search.createFilter({
                 name: "subsidiary",
                 operator: search.Operator.IS,
                 values: [paramSubsidiary]
             });
             savedSearch.filters.push(subsidiaryFilter);
         }

         if (hasMultipleCalendars) {
                var periodsArray = getPeriodsFromCalendarFiscal(1);
             
                //log.error("periodsArray saldo inicial getAccountsInitialBalance", periodsArray);
                if (periodsArray != null && periodsArray != '') {
                    var formula = getPeriodsFormulaText(periodsArray);
                    // log.error("Formula getAccountsInitialBalance", formula);
                    var periodsFilter = search.createFilter({
                        name: "formulatext",
                        formula: formula,
                        operator: search.Operator.IS,
                        values: "1"
                    });
                    savedSearch.filters.push(periodsFilter);
                }
            
         } else {
                var periodStartDate = search.lookupFields({
                    type: search.Type.ACCOUNTING_PERIOD,
                    id: paramPeriod,
                    columns: ["startdate"]
                }).startdate;   
             
             
             var beforeDateFilter = search.createFilter({
                 name: "trandate",
                 operator: search.Operator.BEFORE,
                 values: [periodStartDate]
             });
             savedSearch.filters.push(beforeDateFilter);
         }

         var pagedData = savedSearch.runPaged({
             pageSize: 1000
         });

         var page, auxArray, columns;

         pagedData.pageRanges.forEach(function(pageRange) {
             page = pagedData.fetch({
                 index: pageRange.index
             });

             page.data.forEach(function(result) {
                 columns = result.columns;

                 initialBalanceJson[result.getValue(columns[0])] = Number(result.getValue(columns[1]));


             });
         });

         return initialBalanceJson;
     }

     function ObtenerSIMultiL210ºM() {
        
         var initialBalanceLanzaJsonIRPJ = {};
         var initialBalanceLanzaJsonCSLL = {};
         var initialBalanceM010Json = {};
         var initialBalanceL210Json = {};

         //var ids = ['193941', '193942', '194950', '194957', '201325', '201429', '201430', '201431', '201432'];
         //var ids = ['273603','658935','693637','795003','894869','909812','911008','911030','912037','961287','963972','965020','969320']
         
         var savedsearch = search.create({
             type: 'transaction',

             filters: [
                 ["posting", "is", "T"],
                 "AND",
                 ["accountingtransaction.accounttype", "noneof", "@NONE@", "Stat", "NonPosting"],
                 "AND",
                 ["voided", "is", "F"],
                 "AND",
                 ["memorized", "is", "F"],
                 "AND",
                 ["formulatext: {accountingtransaction.account}", "isnotempty", ""],
                 "AND",
                 ["formulanumeric: NVL({accountingtransaction.debitamount},0) - NVL({accountingtransaction.creditamount},0)", "notequalto", "0"]/*,
                 "AND",
                 ["internalid", "anyof", ids]*/
                 // "AND", 
                 // ["internalid","anyof","1805497","1805616","1807713","1807982","1808095","1836454","2029464"]
             ],

             settings: [
                 search.createSetting({
                     name: 'consolidationtype',
                     value: 'NONE'
                 })
             ],
             columns: [
                 search.createColumn({
                     name: "formulanumeric",
                     summary: "GROUP",
                     formula: "{accountingtransaction.account.id}",
                     label: "0. ID de la cuenta"
                 }),
                 search.createColumn({
                     name: "formulacurrency",
                     summary: "SUM",
                     formula: "NVL({accountingtransaction.debitamount},0) - NVL({accountingtransaction.creditamount},0)",
                     label: "Formula (Currency)"
                 })

             ]

         });

         if (hasSubsidiariesFeature) {
             var subsidiariesArray = getMatrixAndSubsidiaries(paramSubsidiary);
             log.error("Formula subsidiariesArraygetAccountsInitialBalance", subsidiariesArray);
             var subsidiaryFilter = search.createFilter({
                 name: "subsidiary",
                 operator: search.Operator.IS,
                 values: subsidiariesArray
             });
             savedsearch.filters.push(subsidiaryFilter);
         }

         if (hasMultibookFeature) {
             var multibookFilter = search.createFilter({
                 name: 'accountingbook',
                 join: 'accountingtransaction',
                 operator: search.Operator.IS,
                 values: [paramMultibook]
             });
             savedsearch.filters.push(multibookFilter);
         }


         if (hasMultipleCalendars) {
            var periodsArray = getPeriodsFromCalendarFiscal(1);               
             //log.error("periodsArray saldo inicial getAccountsInitialBalance", periodsArray);
             if (periodsArray != null && periodsArray != '') {
                 var formula = getPeriodsFormulaText(periodsArray);
                 log.error("Formula multibbookgetAccountsInitialBalance", formula);
                 var periodsFilter = search.createFilter({
                     name: "formulatext",
                     formula: formula,
                     operator: search.Operator.IS,
                     values: "1"
                 });
                 savedsearch.filters.push(periodsFilter);
             }
         } else {
            var periodStartDate = search.lookupFields({
                    type: search.Type.ACCOUNTING_PERIOD,
                    id: paramPeriod,
                    columns: ["startdate"]
            }).startdate;
            
             var beforeDateFilter = search.createFilter({
                 name: "trandate",
                 operator: search.Operator.BEFORE,
                 values: [periodStartDate]
             });
             savedsearch.filters.push(beforeDateFilter);
         }

         if (featurePeriodEnd == true || featurePeriodEnd == 'T') {
            var confiPeriodEnd = search.createSetting({
                name: 'includeperiodendtransactions',
                value: 'TRUE'
            });
            savedsearch.settings.push(confiPeriodEnd);
         }

         //log.error('busuqeda multibook saldo inicial',savedsearch);
         var pagedData = savedsearch.runPaged({
             pageSize: 1000
         });

         var page, auxArray, columns;

         pagedData.pageRanges.forEach(function(pageRange) {
             page = pagedData.fetch({
                 index: pageRange.index
             });

             page.data.forEach(function(result) {
                 columns = result.columns;
                 auxArray = [];
                 // 0. Br account Id
                 auxArray[0] = result.getValue(columns[0]);

                 // 1. saldo incial
                 auxArray[1] = Number(result.getValue(columns[1]));

                 // 2. id de la cuenta COA de la cuenta
                 var IDcoa = search.lookupFields({
                     type: search.Type.ACCOUNT,
                     id: auxArray[0],
                     columns: ['custrecord_lmry_br_coa','custrecord_lmry_br_date_created']
                 })
                 var COA_NOT_empty = IDcoa.custrecord_lmry_br_coa;
                 
                 var fechacreaM010 = IDcoa.custrecord_lmry_br_date_created;
                 
                 
              if(fechacreaM010!= null && fechacreaM010!=''){
                 //Nuevo Formato Fecha
                 var FECHA_FORMAT = format.parse({
                     value: fechacreaM010,
                     type: format.Type.DATE
                 });

                 var MM = FECHA_FORMAT.getMonth() + 1;
                 var AAAA = FECHA_FORMAT.getFullYear();
                 var DD = FECHA_FORMAT.getDate();

                 var periodenddate = DD + '/' + MM + '/' + AAAA;

                 var auxiliar = periodenddate.split('/');

                 if (auxiliar[0].length == 1) {
                     auxiliar[0] = '0' + auxiliar[0];
                 }
                 if (auxiliar[1].length == 1) {
                     auxiliar[1] = '0' + auxiliar[1];
                 }
                 periodenddate = auxiliar[0] + auxiliar[1] + auxiliar[2];
     
                 var  fechaCreacion = periodenddate;
     
                
              }else{
                 var fechaCreacion = '';
              }


                 if (COA_NOT_empty != null && COA_NOT_empty != '') {
                     auxArray[2] = COA_NOT_empty[0].value;


                     var brCoaRecord = search.lookupFields({
                         type: 'customrecord_lmry_br_coa',
                         id: auxArray[2],
                         columns: [
                             'name', 'custrecord_lmry_br_coa_name', 'custrecord_lmry_br_coa_costing_account', 'custrecord_lmry_br_coa_padron_rfb', 'custrecord_lmry_br_coa_acc_codeb', 'custrecord_lmry_br_coa_acc_nameb', 'custrecord_lmry_br_coa_tipolanz_csll', 'custrecord_lmry_br_coa_tipolanz_irpj','custrecord_lmry_br_coa_padronb_release'
                         ]
                     });
                     //3.codigo de cuenta coa
                     auxArray[3] = brCoaRecord.name;
                     
                     //4. nombre de cuenta coa
                     auxArray[4] = brCoaRecord.custrecord_lmry_br_coa_name;
                     //5. id de cuenta L210
                     if (brCoaRecord.custrecord_lmry_br_coa_costing_account != '' && brCoaRecord.custrecord_lmry_br_coa_costing_account != null) {
                         auxArray[5] = brCoaRecord.custrecord_lmry_br_coa_costing_account[0].value;
                     } else {
                         auxArray[5] = '';
                     }
                     
                     //6. id de cuenta M010
                     if (brCoaRecord.custrecord_lmry_br_coa_padron_rfb != '' && brCoaRecord.custrecord_lmry_br_coa_padron_rfb != null) {
                         auxArray[6] = brCoaRecord.custrecord_lmry_br_coa_padron_rfb[0].value;
                     } else {
                         auxArray[6] = '';
                     }
                     //7. id de cuenta M300
                     if (brCoaRecord.custrecord_lmry_br_coa_tipolanz_irpj != '' && brCoaRecord.custrecord_lmry_br_coa_tipolanz_irpj != null) {
                         auxArray[7] = brCoaRecord.custrecord_lmry_br_coa_tipolanz_irpj[0].value;
                     } else {
                         auxArray[7] = '';
                     }
                     //7. id de cuenta M350
                     if (brCoaRecord.custrecord_lmry_br_coa_tipolanz_csll != '' && brCoaRecord.custrecord_lmry_br_coa_tipolanz_csll != null) {
                         auxArray[8] = brCoaRecord.custrecord_lmry_br_coa_tipolanz_csll[0].value;
                     } else {
                         auxArray[8] = '';
                     }
                     if (auxArray[6] != '' && auxArray[6] != null) {
                         auxArray[9] = brCoaRecord.custrecord_lmry_br_coa_acc_codeb;
                         auxArray[10] =brCoaRecord.custrecord_lmry_br_coa_acc_nameb;
                     }
                 } else {

                     auxArray[3] = '';
                     auxArray[4] = '';
                     auxArray[5] = '';
                     auxArray[6] = '';
                     auxArray[7] = '';
                     auxArray[8] = '';
                     auxArray[9] = '';
                     auxArray[10] = '';
                 }

                 if (auxArray[5] != '' && auxArray[5] != null) {
                     var campos_L210 = search.lookupFields({
                         type: 'customrecord_lmry_br_costing_account',
                         id: auxArray[5],
                         columns: ['custrecord_lmry_br_costing_code', 'name']
                     });
                     //codigo de la cuenta l210
                     auxArray[11] = campos_L210.custrecord_lmry_br_costing_code;
                     //descripcion de la cuenta l210
                     auxArray[12] = campos_L210.name;
                 }else{
                     auxArray[11] = '';
                     auxArray[12] = '';
                 }

                 if (auxArray[6] != '' && auxArray[6] != null) {
                     var campos_M010 = search.lookupFields({
                         type: 'customrecord_lmry_br_rfb_padron',
                         id: auxArray[6],
                         columns: ['name', 'custrecord_lmry_br_code_rfb', 'custrecord_lmry_br_tax_rfb']
                     });
 
                     //descripcion de la cuenta del m010
                     auxArray[13] = campos_M010.name;
                     //codigo de la cuenta m010 segun tabla dinamica
                     auxArray[14] = campos_M010.custrecord_lmry_br_code_rfb;
 
                     var taxIrpj_Csll = '';
                     taxIrpj_Csll = campos_M010.custrecord_lmry_br_tax_rfb;
                     if (taxIrpj_Csll != '' && taxIrpj_Csll != null) {
                         var Padronjson = JSON.parse(taxIrpj_Csll);
                         var irpj = Padronjson.IRPJ;
                         var csll = Padronjson.CSLL;
                         if (irpj == 1 && csll == 0) {
                             auxArray[15] = 'I';
                         } else if (irpj == 0 && csll == 1) {
                             auxArray[15] = 'C';
                         } else {
                             auxArray[15] = 'A';
                         }
                     }
                     auxArray[16] = fechaCreacion;
                 }else{
                     auxArray[13] = '';
                     auxArray[14] = '';
                     auxArray[15] = '';
                     auxArray[16] = '';
                    
                 }

                 if (auxArray[7] != '' && auxArray[7] != null) {
                     var campos_M300 = search.lookupFields({
                         type: 'customrecord_lmry_br_lanzpartea_ecf',
                         id: auxArray[7],
                         columns: ['name', 'custrecord_lmry_br_code_lanzamiento', 'custrecord_lmry_br_type_release', 'custrecord_lmry_br_tax_release', 'custrecord_lmry_br_ind_release_parta']
                     });
 
                     //CODIGO de la cuenta del m300
                     auxArray[17] = campos_M300.custrecord_lmry_br_code_lanzamiento;
                     //NAME de la cuenta M300 segun tabla dinamica
                     auxArray[18] = campos_M300.name;
 
                     //tipode lanzamiento
                     var campo19 = campos_M300.custrecord_lmry_br_type_release;
                     //log.error('typeLanzam1.2',(campo18[0].text));
                     auxArray[19] = (campo19[0].text).substring(0, 1);
                     //tipo de impuesto del lanzamiento
                  
                      var campo20 = campos_M300.custrecord_lmry_br_tax_release;
                      log.error('campo20hola',campo20);
                     //[{"value":"12","text":"CSLL"},{"value":"14","text":"IRPJ"}]
                     //{"IRPJ":1,"CSLL":1}
                     
                     //var IDTaxLanza = campo20.split(',');
                    // var aux=JSON.parse(campo20);
                     //log.error('aux',aux);
                     if (campo20 == '{"value":"12","text":"CSLL"}') {
                         auxArray[20] = 'C';
                     } else if (campo20 == '{"value":"14","text":"IRPJ"}') {
                         auxArray[20] = 'I';
                     } else {
                         auxArray[20] = 'A';
                     }


                     // log.error('IDTaxLanza',IDTaxLanza);
                     // for (var j = 0; j < IDTaxLanza.length; j++) {
                     //     if (campo20[j] == 'CSLL') {
                     //         auxArray[20] = 'C';
                     //     } else if (campo20[j] == 'IRPJ') {
                     //         auxArray[20] = 'I';
                     //     } else {
                     //         auxArray[20] = 'A';
                     //     }
                     // }
                     //indicador del lanzamiento
                     log.error('indicador saldo inicial ',campos_M300.custrecord_lmry_br_ind_release_parta );
                     if (campos_M300.custrecord_lmry_br_ind_release_parta != '' && campos_M300.custrecord_lmry_br_ind_release_parta != null) {
                         log.error('indicador saldo inicial entro ',campos_M300.custrecord_lmry_br_ind_release_parta[0].value);
                         auxArray[21] = campos_M300.custrecord_lmry_br_ind_release_parta[0].value;
                     }else{
                         auxArray[21] ='';
                     }
                     
                 }else{
                     auxArray[17] = '';
                     auxArray[18] = '';
                     auxArray[19] = '';
                     auxArray[20] = '';
                     auxArray[21] = '';
                    
                 }
                 if (auxArray[8] != '' && auxArray[8] != null) {
                     var campos_M300 = search.lookupFields({
                         type: 'customrecord_lmry_br_lanzpartea_ecf',
                         id: auxArray[8],
                         columns: ['name', 'custrecord_lmry_br_code_lanzamiento', 'custrecord_lmry_br_type_release', 'custrecord_lmry_br_tax_release', 'custrecord_lmry_br_ind_release_parta']
                     });
 
                     //CODIGO de la cuenta del m300
                     auxArray[22] = campos_M300.custrecord_lmry_br_code_lanzamiento;
                     //NAME de la cuenta M300 segun tabla dinamica
                     auxArray[23] = campos_M300.name;
 
                     //tipode lanzamiento
                     var campo24 = campos_M300.custrecord_lmry_br_type_release;
                     //log.error('typeLanzam1.2',(campo18[0].text));
                     auxArray[24] = (campo24[0].text).substring(0, 1);
                     //tipo de impuesto del lanzamiento
                     var campo25 = campos_M300.custrecord_lmry_br_tax_release;

                     if (campo25 == '{"value":"12","text":"CSLL"}') {
                         auxArray[25] = 'C';
                     } else if (campo25 == '{"value":"14","text":"IRPJ"}') {
                         auxArray[25] = 'I';
                     } else {
                         auxArray[25] = 'A';
                     }

                     //indicador del lanzamiento
                    
                     if (campos_M300.custrecord_lmry_br_ind_release_parta != '' && campos_M300.custrecord_lmry_br_ind_release_parta != null) {
                         auxArray[26] = campos_M300.custrecord_lmry_br_ind_release_parta[0].value;
                     }else{
                         auxArray[26] ='';
                     }

                 }else{
                     auxArray[22] = '';
                     auxArray[23] = '';
                     auxArray[24] = '';
                     auxArray[25] = '';
                     auxArray[26] = '';
                    
                 }
                 //campo m410
                 
                 if(COA_NOT_empty != null && COA_NOT_empty != ''){
                     var M410 = search.lookupFields({
                         type: 'customrecord_lmry_br_coa',
                         id: auxArray[2],
                         columns: [
                             'custrecord_lmry_br_coa_padronb_release'
                         ]
                     });
                     if(M410.custrecord_lmry_br_coa_padronb_release!= null && M410.custrecord_lmry_br_coa_padronb_release != ''){
                         auxArray[27] = (M410.custrecord_lmry_br_coa_padronb_release[0].text).substring(0, 2);
                     }else{
                         auxArray[27] = '';
                     }
                     
                 }else{
                     auxArray[27] = ''
                 }
                 

                 //formando los saldos iniciales
                 // 9. saldo inicial del l210
                 if (auxArray[5] != "" && auxArray[5] != "- None -" && auxArray[5] != null && Number(auxArray[1]) != 0) {

                     if (initialBalanceL210Json[auxArray[5]] === undefined) {
                         initialBalanceL210Json[auxArray[5]] = {
                             "saldoL210": 0
                         };
                     }
                     initialBalanceL210Json[auxArray[5]]["saldoL210"] = [Number(initialBalanceL210Json[auxArray[5]]["saldoL210"] + auxArray[1]), auxArray[11],auxArray[12]];
                 }
                 // 10. saldo inicial del M010
                 if (auxArray[6] != "" && auxArray[6] != "- None -" && auxArray[6] != null && Number(auxArray[1]) != 0) {

                     if (initialBalanceM010Json[auxArray[6]] === undefined) {
                         initialBalanceM010Json[auxArray[6]] = {
                             "saldoM010": 0
                         };
                     }

                     initialBalanceM010Json[auxArray[6]]["saldoM010"] = [Number(initialBalanceM010Json[auxArray[6]]["saldoM010"] + auxArray[1]), auxArray[9], auxArray[10],auxArray[13], auxArray[14], auxArray[15], auxArray[16],auxArray[27]];

                 }
                 // 11. saldo inicial del lanzamiento irpj
                 if (auxArray[7] != "" && auxArray[7] != "- None -" && auxArray[7] != null && Number(auxArray[1]) != 0) {

                     if (initialBalanceLanzaJsonIRPJ[auxArray[7]] === undefined) {
                         initialBalanceLanzaJsonIRPJ[auxArray[7]] = {
                             "saldoM300": 0
                         };
                     }
                     initialBalanceLanzaJsonIRPJ[auxArray[7]]["saldoM300"] = [Number(initialBalanceLanzaJsonIRPJ[auxArray[7]]["saldoM300"] + auxArray[1]), auxArray[17], auxArray[18], auxArray[19], auxArray[20], auxArray[21]];

                 }

                 // 12. saldo inicial del lanzamiento csll
                 if (auxArray[8] != "" && auxArray[8] != "- None -" && auxArray[8] != null && Number(auxArray[1]) != 0) {

                     if (initialBalanceLanzaJsonCSLL[auxArray[8]] === undefined) {
                         initialBalanceLanzaJsonCSLL[auxArray[8]] = {
                             "saldoM350": 0
                         };
                     }
                     initialBalanceLanzaJsonCSLL[auxArray[8]]["saldoM350"] = [Number(initialBalanceLanzaJsonCSLL[auxArray[8]]["saldoM350"] + auxArray[1]), auxArray[22], auxArray[23], auxArray[24], auxArray[25], auxArray[26]];

                 }
             });
         });
         //log.error('Multibook2 initialBalanceJson',initialBalanceJson);
         return [initialBalanceL210Json, initialBalanceM010Json, initialBalanceLanzaJsonIRPJ, initialBalanceLanzaJsonCSLL];


     }

     function getAccountsLanzamInitialBalance() {
         var initialBalanceLanzaJsonIRPJ = {};
         var initialBalanceLanzaJsonCSLL = {};
         var initialBalanceM010Json = {};
         var initialBalanceL210Json = {};

         var savedSearch = search.load({
             id: "customsearch_lmry_br_acc_ini_balance_ecf"
         });

         if (hasSubsidiariesFeature) {
             var subsidiaryFilter = search.createFilter({
                 name: "subsidiary",
                 operator: search.Operator.IS,
                 values: [paramSubsidiary]
             });
             savedSearch.filters.push(subsidiaryFilter);
         }

         if (hasMultipleCalendars) {
                var periodsArray = getPeriodsFromCalendarFiscal(1);
             
                if (periodsArray != null && periodsArray != '') {
                    var formula = getPeriodsFormulaText(periodsArray);

                    var periodsFilter = search.createFilter({
                        name: "formulatext",
                        formula: formula,
                        operator: search.Operator.IS,
                        values: "1"
                    });
                    savedSearch.filters.push(periodsFilter);
                }
         } else {
                var periodStartDate = search.lookupFields({
                    type: search.Type.ACCOUNTING_PERIOD,
                    id: paramPeriod,
                    columns: ["startdate"]
                }).startdate;
             

             var beforeDateFilter = search.createFilter({
                 name: "trandate",
                 operator: search.Operator.BEFORE,
                 values: [periodStartDate]
             });
             savedSearch.filters.push(beforeDateFilter);
         }

        if (featurePeriodEnd == true || featurePeriodEnd == 'T') {
            var confiPeriodEnd = search.createSetting({
                name: 'includeperiodendtransactions',
                value: 'TRUE'
            });
            savedSearch.settings.push(confiPeriodEnd);
         }

         var pagedData = savedSearch.runPaged({
             pageSize: 1000
         });

         var page, auxArray, columns;

         pagedData.pageRanges.forEach(function(pageRange) {
             page = pagedData.fetch({
                 index: pageRange.index
             });

             page.data.forEach(function(result) {
                 columns = result.columns;
                 auxArray = [];
                 arrSaldoInicialaccount = [];
                 // 0. Internal ID de a cuenta de la transaccion
                 auxArray[0] = result.getValue(columns[0]);
                 // 1. saldo inicial
                 auxArray[1] = result.getValue(columns[1]);
                 // 2. id de la cuenta coa
                 auxArray[2] = result.getValue(columns[2]);
                 //
                 if (auxArray[2] != '' && auxArray[2] != null) {
                     var campos_ID = search.lookupFields({
                         type: 'customrecord_lmry_br_coa',
                         id: auxArray[2],
                         columns: ['name', 'custrecord_lmry_br_coa_name', 'custrecord_lmry_br_coa_costing_account', 'custrecord_lmry_br_coa_padron_rfb', 'custrecord_lmry_br_coa_acc_codeb', 'custrecord_lmry_br_coa_acc_nameb', 'custrecord_lmry_br_coa_tipolanz_csll', 'custrecord_lmry_br_coa_tipolanz_irpj']
                     });
                     auxArray[3] = campos_ID.name;
                     auxArray[4] = campos_ID.custrecord_lmry_br_coa_name;
                     if (campos_ID.custrecord_lmry_br_coa_costing_account != '' && campos_ID.custrecord_lmry_br_coa_costing_account != null) {
                         auxArray[5] = campos_ID.custrecord_lmry_br_coa_costing_account[0].value;
                     } else {
                         auxArray[5] = '';
                     }

                     if (campos_ID.custrecord_lmry_br_coa_padron_rfb != '' && campos_ID.custrecord_lmry_br_coa_padron_rfb != null) {
                         auxArray[6] = campos_ID.custrecord_lmry_br_coa_padron_rfb[0].value;
                     } else {
                         auxArray[6] = '';
                     }

                     if (campos_ID.custrecord_lmry_br_coa_tipolanz_irpj != '' && campos_ID.custrecord_lmry_br_coa_tipolanz_irpj != null) {
                         auxArray[7] = campos_ID.custrecord_lmry_br_coa_tipolanz_irpj[0].value;
                     } else {
                         auxArray[7] = '';
                     }
                     if (campos_ID.custrecord_lmry_br_coa_tipolanz_csll != '' && campos_ID.custrecord_lmry_br_coa_tipolanz_csll != null) {
                         auxArray[8] = campos_ID.custrecord_lmry_br_coa_tipolanz_csll[0].value;
                     } else {
                         auxArray[8] = '';
                     }

                 } else {

                     auxArray[3] = '';
                     auxArray[4] = '';
                     auxArray[5] = '';
                     auxArray[6] = '';
                     auxArray[7] = '';
                     auxArray[8] = '';
                 }

                 // 9. saldo inicial del l210
                 if (auxArray[5] != '' && auxArray[5] != null) {
                     if (initialBalanceL210Json[auxArray[5]] === undefined) {
                         initialBalanceL210Json[auxArray[5]] = 0;
                     }
                     initialBalanceL210Json[auxArray[5]] += Number(result.getValue(columns[1]));
                     //auxArray[9] = initialBalanceL210Json;

                 }
                 // 10. saldo inicial del M010
                 if (auxArray[6] != '' && auxArray[6] != null) {
                     if (initialBalanceM010Json[auxArray[6]] === undefined) {
                         initialBalanceM010Json[auxArray[6]] = 0;
                     }
                     initialBalanceM010Json[auxArray[6]] += Number(result.getValue(columns[1]));
                     // auxArray[10] = initialBalanceM010Json;
                 }
                 // 11. saldo inicial del lanzamiento irpj
                 if (auxArray[7] != '' && auxArray[7] != null) {
                     if (initialBalanceLanzaJsonIRPJ[auxArray[7]] === undefined) {
                         initialBalanceLanzaJsonIRPJ[auxArray[7]] = 0;
                     }
                     initialBalanceLanzaJsonIRPJ[auxArray[7]] += Number(result.getValue(columns[1]));
                     // auxArray[11] = initialBalanceLanzaJsonIRPJ;
                 }

                 // 12. saldo inicial del lanzamiento csll
                 if (auxArray[8] != '' && auxArray[8] != null) {
                     if (initialBalanceLanzaJsonCSLL[auxArray[8]] === undefined) {
                         initialBalanceLanzaJsonCSLL[auxArray[8]] = 0;
                     }
                     initialBalanceLanzaJsonCSLL[auxArray[8]] += Number(result.getValue(columns[1]));
                     // auxArray[11] = initialBalanceLanzaJsonCSLL;
                 }

             });

         });
         //log.error('arrSaldoInicialaccount',arrSaldoInicialaccount);
         return [initialBalanceL210Json, initialBalanceM010Json, initialBalanceLanzaJsonIRPJ, initialBalanceLanzaJsonCSLL];
     }

     function ObtenerMovimientosAccountGlobalMapping() {

         var intDMinReg = 0;
         var intDMaxReg = 1000;

         var DbolStop = false;
         var arrAuxiliar = new Array();
         var ArrMovimientosAccounting = new Array();
         var _cont = 0;
         //var ids = ['273603','326882','898498'];
         //var ids = ['273603','658935','693637','795003','894869','909812','911008','911030','912037','961287','963972','965020','969320']
         var savedsearch = search.create({
             type: 'transaction',

             filters: [
                 ["memorized", "is", "F"],
                 "AND",
                 ["accountingtransaction.accounttype", "noneof", "@NONE@", "Stat", "NonPosting"],
                 "AND",
                 ["posting", "is", "T"],
                 "AND",
                 ["formulatext: {accountingtransaction.account} ", "isnotempty", ""],
                 "AND",
                 ["voided", "is", "F"],
                 "AND",
                 ["formulanumeric: NVL({accountingtransaction.debitamount},0) - NVL({accountingtransaction.creditamount},0)", "notequalto", "0"]/*,
                 "AND",
                 ["internalid", "anyof", ids]*/
                 // "AND", 
                 // ["internalid","anyof","1805497","1805616","1807713","1807982","1808095","1836454","2029464"]

             ],

             settings: [
                 search.createSetting({
                     name: 'consolidationtype',
                     value: 'NONE'
                 })
             ],
             columns: [
                 search.createColumn({
                     name: "internalid",
                     label: "0. ID de la transaccion"
                 }),

                 search.createColumn({
                     name: "trandate",
                     label: "1. Fecha de asiento contable",
                     sort: search.Sort.ASC
                 }),
                 search.createColumn({
                     name: "formulacurrency",
                     formula: "NVL({accountingtransaction.debitamount},0)",
                     label: "2. Valor de asiento contable / Valor de salida Debito"
                 }),
                 search.createColumn({
                     name: "formulacurrency",
                     formula: "NVL({accountingtransaction.creditamount},0)",
                     label: "3. Valor de asiento contable / Valor de salida Credito"
                 }),
                 search.createColumn({
                     name: "formulatext",
                     formula: "CASE WHEN {accountingperiod.isadjust} = 'T' THEN 'E' ELSE 'N' END",
                     label: "4. Tipo de Lanzamiento"
                 }),
                 search.createColumn({
                     name: "formulanumeric",
                     formula: "{accountingtransaction.account.id}",
                     label: "5. Account ID"
                 }),

                 search.createColumn({
                     name: "formulanumeric",
                     formula: "{postingperiod.id}",
                     label: "6. Periodo"
                 })
             ]

         });
         //Se esta agregando esta columna nueva en caso se trabaje con periods end journal
         var tipoTransaccion = search.createColumn({
            name     : 'formulatext',
            formula  : '{type.id}',
            label    : '7. Tipo transaccion'
        });
        savedsearch.columns.push(tipoTransaccion);
        //----------------------------------------------------------
        //se activa el feature de special accounting period
        var licenses = libFeature.getLicenses(paramSubsidiary);
        var feature_special_account = libFeature.getAuthorization(599, licenses);
        
        log.debug('feature_special_account',feature_special_account);
        if (hasSubsidiariesFeature) {
             var subsidiariesArray = getMatrixAndSubsidiaries(paramSubsidiary);
            // log.error('globalmapping subsidiariesArray', subsidiariesArray);
             var subsidiaryFilter = search.createFilter({
                 name: "subsidiary",
                 operator: search.Operator.IS,
                 values: subsidiariesArray
             });
             savedsearch.filters.push(subsidiaryFilter);
         }

         if (hasMultibookFeature) {
             var multibookFilter = search.createFilter({
                 name: 'accountingbook',
                 join: 'accountingtransaction',
                 operator: search.Operator.IS,
                 values: [paramMultibook]
             });
             savedsearch.filters.push(multibookFilter);
         }

         if (hasMultipleCalendars) {
                if(feature_special_account){
                    log.debug('feature_special_account','entro al special');
                    var periodsArray = getPeriodsFromCalendarFiscal(3);
                    var formula = getPeriodsFormulaText(periodsArray);
                }else{
                    //formula = getPeriodsFormulaText(periodsArray,1);
                    var periodsArray = getPeriodsFromCalendarFiscal(2);
                    var formula = getPeriodsFormulaText(periodsArray);
                }
                var periodsFilter = search.createFilter({
                    name: "formulatext",
                    formula: formula,
                    operator: search.Operator.IS,
                    values: "1"
                });
                savedsearch.filters.push(periodsFilter);
                log.debug('calendar', 'entro busqueda calendar');
            
         } else {
                var periodFilter = search.createFilter({
                    name: "postingperiod",
                    operator: search.Operator.IS,
                    values: [paramPeriod]
                });
             
             savedsearch.filters.push(periodFilter);
             log.debug('no calendar', 'no entro busqueda calendar');
         }
         
         

         //Agregando period end journals y validaciones
         //var jsonPeriodosCal = obtenerPeriodosMensuales();
         if (featurePeriodEnd == true || featurePeriodEnd == 'T') {
            var confiPeriodEnd = search.createSetting({
                name: 'includeperiodendtransactions',
                value: 'TRUE'
            });
            savedsearch.settings.push(confiPeriodEnd);
         }
         var searchresult = savedsearch.run();
         while (!DbolStop) {
             var objResult = searchresult.getRange(intDMinReg, intDMaxReg);
             if (objResult != null) {
                 var intLength = objResult.length;

                 if (intLength != 1000) {
                     DbolStop = true;
                 }

                 for (var i = 0; i < intLength; i++) {
                     var columns = objResult[i].columns;
                     arrAuxiliar = new Array();

                     //0. ID DE LA TRANSACCION
                     arrAuxiliar[0] = objResult[i].getValue(columns[0]);
                     //1. FECHA DE LA TRANSACCION
                     arrAuxiliar[1] = objResult[i].getValue(columns[1]);
                     //2. DEBIT AMOUNT ACCOUNTING
                     arrAuxiliar[2] = objResult[i].getValue(columns[2]);
                     //3. CREDIT AMOUNT ACCOUNTING
                     arrAuxiliar[3] = objResult[i].getValue(columns[3]);
                     //4. AJUSTE DE PERIODO
                     //Se hacia solamente x periodo de ajuste pero se esta agregando para PeJrnl
                     //arrAuxiliar[4] = objResult[i].getValue(columns[4]);
                     if(objResult[i].getValue(columns[7]) == 'PEJrnl'){
                        arrAuxiliar[4] = "E";
                     }else{
                        arrAuxiliar[4] = objResult[i].getValue(columns[4]);
                     }
                     //5. ACCOUNTINTRANSACCION.ACCOUNT.ID
                     arrAuxiliar[5] = objResult[i].getValue(columns[5]);
                     //6. vacio
                     arrAuxiliar[6] = '';
                     //7. vacio
                     arrAuxiliar[7] = '';
                     //8. POSTINGPERIOD
                     arrAuxiliar[8] = objResult[i].getValue(columns[6]);
                     
                     ArrMovimientosAccounting[_cont] = arrAuxiliar;
                     _cont++;
                 }
                 //log.error('ArrMovimientosAccounting', ArrMovimientosAccounting);
                 
                 intDMinReg = intDMaxReg;
                 intDMaxReg += 1000;
             } else {
                 DbolStop = true;
             }
         }

         return ArrMovimientosAccounting;
     }

     function ObtenerCamposCuentas2(IDaccount) {
         var natureCodeJson = getNatureCode();
         //log.error('natureCodeJson',natureCodeJson);
         var camposArray2 = ['', '', '', '', '', '', ];

         if (IDaccount) {

             // Campos Br acoount
             var brCoaRecord = search.lookupFields({
                 type: search.Type.ACCOUNT,
                 id: IDaccount,
                 columns: [
                     'number',
                     'custrecord_lmry_br_date_created',
                     'name',
                     'issummary',
                     'type',
                     'custrecord_lmry_parent_field',
                     'custrecord_lmry_level',
                     'custrecord_lmry_br_coa'
                 ]
             });

             camposArray2[0] = brCoaRecord.number;
              var fechacreaM010= brCoaRecord.custrecord_lmry_br_date_created;
              if(fechacreaM010!= null && fechacreaM010!=''){
                 //Nuevo Formato Fecha
                 var FECHA_FORMAT = format.parse({
                     value: fechacreaM010,
                     type: format.Type.DATE
                 });

                 var MM = FECHA_FORMAT.getMonth() + 1;
                 var AAAA = FECHA_FORMAT.getFullYear();
                 var DD = FECHA_FORMAT.getDate();

                 var periodenddate = DD + '/' + MM + '/' + AAAA;

                 var auxiliar = periodenddate.split('/');

                 if (auxiliar[0].length == 1) {
                     auxiliar[0] = '0' + auxiliar[0];
                 }
                 if (auxiliar[1].length == 1) {
                     auxiliar[1] = '0' + auxiliar[1];
                 }
                 periodenddate = auxiliar[0] + auxiliar[1] + auxiliar[2];
     
                 var fechaFinlaM010 = periodenddate;
                 camposArray2[1] = fechaFinlaM010;
              }else{
                 camposArray2[1] = '';
              }
             

             
             //codigo registrado por el cliente
             var naturaleza = brCoaRecord.type[0].text;
             //log.error('naturaleza',naturaleza);
             camposArray2[2] = natureCodeJson[naturaleza] || "";

             //descripcion registrado por el cliente
             // camposArray2[3] = brCoaRecord.issummary;
             // camposArray2[4] = brCoaRecord.type;
             camposArray2[3] = brCoaRecord.custrecord_lmry_parent_field;

             camposArray2[4] = brCoaRecord.custrecord_lmry_level;


             //id de la cuenta coa
             if (brCoaRecord.custrecord_lmry_br_coa.length != 0) {
                 camposArray2[5] = brCoaRecord.custrecord_lmry_br_coa[0].value;
             }

         }
         //log.error('camposArray2 campo para el 14 id coa', camposArray2);
         return camposArray2;
     }

     function getFileName(fileNumber, fileType) {
         var userRecord = runtime.getCurrentUser();

         if (fileType == 1) {
             var fileName = "AccountsForPeriods_ecf_" + userRecord.id + "_" + fileNumber + ".txt";
         } else if (fileType == 2) {
             var fileName = "Accounts_L210_ecf_" + userRecord.id + "_" + fileNumber + ".txt";
         } else if (fileType == 3) {
             var fileName = "Accounts_padronb_M010_ecf_" + userRecord.id + "_" + fileNumber + ".txt";
         } else if (fileType == 4) {
             var fileName = "Accounts_lanzamientos_M300_ecf_" + userRecord.id + "_" + fileNumber + ".txt";
         } else if (fileType == 5) {
             var fileName = "Accounts_lanzamientos_M350_ecf_" + userRecord.id + "_" + fileNumber + ".txt";
         }else if (fileType == 6) {
             var fileName = "Accounts_PlanCuentasSinData_ecf_" + userRecord.id + "_" + fileNumber + ".txt";
         }
         return fileName;
     }

     function saveAuxiliaryFile(fileContent, fileNumber, fileType) {
         var folderId = objContext.getParameter({
             name: "custscript_lmry_file_cabinet_rg_br"
         });

         if (folderId) {
             var fileName = getFileName(fileNumber, fileType);

             var auxiliaryFile = file.create({
                 name: fileName,
                 fileType: file.Type.PLAINTEXT,
                 contents: fileContent,
                 encoding: file.Encoding.UTF8,
                 folder: folderId
             });
             return auxiliaryFile.save();
         }
     }

     function lengthInUtf8Bytes(str) {
         var m = encodeURIComponent(str).match(/%[89ABab]/g);
         return str.length + (m ? m.length : 0);
     }

     function callScheduleScript(accountsForPeriodFileId, accountsL210FileId, accountsPadronBFileId, accountsLanzamientoM300FileId, accountsLanzamientoM350FileId,paramAccountsReferencialFileId) {
         var params = {};

         params["custscript_lmry_br_ecf_anio_v7"] = paramPeriod;

         params["custscript_lmry_br_ecf_subsidiaria_v7"] = paramSubsidiary;

         params["custscript_lmry_br_ecf_multibook_v7"] = paramMultibook;

         params["custscript_lmry_br_ecf_tipo_decl_v7"] = paramDeclarationType;

         params["custscript_lmry_br_ecf_record_id_v7"] = paramReportId;

         params["custscript_lmry_br_ecf_feature_id_v7"] = paramLogId;

         params["custscript_lmry_br_ecf_num_rec_v7"] = paramNumRecti;

         params["custscript_lmry_br_ecf_num_orden_v7"] = paramNumOrden;

         //L100y L300
         params["custscript_lmry_br_ecf_accper_idfile_v7"] = accountsForPeriodFileId;
         //L210
         params["custscript_lmry_br_ecf_accidfile_v7"] = accountsL210FileId;
         //M010
         params["custscript_lmry_br_ecf_acc_padronb_v7"] = accountsPadronBFileId;
         //M300
         params["custscript_lmry_br_ecf_lanza_m300_idf_v7"] = accountsLanzamientoM300FileId;
         // M350
         params["custscript_lmry_br_ecf_lanza_m350_idf_v7"] = accountsLanzamientoM350FileId;
         //cuentas para las transacciones del bloque L
         params["custscript_lmry_br_ecf_plan_accou_v7"] = paramAccountsReferencialFileId;

         log.error("parametros enviados", params);
         var taskScript = task.create({
             taskType: task.TaskType.SCHEDULED_SCRIPT,
             scriptId: 'customscript_lmry_br_rpt_ecf_schd_versi7',
             deploymentId: 'customdeploy_lmry_br_rpt_ecf_schd_versi7',
             params: params
         });
         taskScript.submit();
     }

     function getMatrixAndSubsidiaries(subsidiary) {
         var subsidiariesArray = [];

         if (subsidiary != "") {
             var savedSearch = search.create({
                 type: 'customrecord_lmry_br_setup_rpt_dctf',
                 filters: [
                     ['custrecord_lmry_br_rpt_subsidiary', 'anyof', subsidiary]
                 ],
                 columns: ['custrecord_lmry_br_filiales']
             });

             var result = savedSearch.run().getRange(0, 1);

             if (result && result.length != 0) {
                 var subsidiaries = result[0].getValue("custrecord_lmry_br_filiales").split(',');
                 for (var i = 0; i < subsidiaries.length; i++) {
                     subsidiariesArray.push(subsidiaries[i]);
                 }
             }

             subsidiariesArray.push(subsidiary);
         }
         log.error("error", subsidiariesArray);
         return subsidiariesArray;
     }

     function obtenerCamposAdicionales(idBrCoa) {
         var camposArray = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '','', ];
         //log.error('entro para campos de coa padron posicion 3 ','pos entro')
         if (idBrCoa) {

             // Campos Br COA
             var brCoaRecord = search.lookupFields({
                 type: 'customrecord_lmry_br_coa',
                 id: idBrCoa,
                 columns: [
                     'name',
                     'custrecord_lmry_br_coa_name',
                     'custrecord_lmry_br_coa_costing_account',
                     'custrecord_lmry_br_coa_padron_rfb',
                     'custrecord_lmry_br_coa_acc_codeb',
                     'custrecord_lmry_br_coa_acc_nameb',
                     'custrecord_lmry_br_coa_tipolanz_csll',
                     'custrecord_lmry_br_coa_tipolanz_irpj',
                     'custrecord_lmry_br_coa_disc_gross_rev.custrecord_lmry_br_code_calc_bc_irpj',
                     'custrecord_lmry_br_coa_calc_bc_csll_pres.custrecord_lmry_br_code_calc_bc_csll',
                     //N620
                     'custrecord_lmry_br_coa_calc_irpj_mensual',
                     //N630
                     'custrecord_lmry_br_coa_calc_bc_irpj_real',
                     //N660
                     'custrecord_lmry_br_coa_calc_csll_mens',
                     //N670
                     'custrecord_lmry_br_coa_calc_bc_csll_real',
                     //M410
                     'custrecord_lmry_br_coa_padronb_release'
                 ]
             });

             camposArray[0] = brCoaRecord.name;
             camposArray[1] = brCoaRecord.custrecord_lmry_br_coa_name;
             if (brCoaRecord.custrecord_lmry_br_coa_costing_account.length != 0) {
                 camposArray[2] = brCoaRecord.custrecord_lmry_br_coa_costing_account[0].value;
             }

             //id de la cuenta padron
             if (brCoaRecord.custrecord_lmry_br_coa_padron_rfb.length != 0) {
                 var campo3 = brCoaRecord.custrecord_lmry_br_coa_padron_rfb;
                 camposArray[3] = campo3[0].value;
                 // log.error('camposArray[3]',camposArray[3]);
             }

             //codigo registrado por el cliente
             camposArray[4] = brCoaRecord.custrecord_lmry_br_coa_acc_codeb;
             // log.error('camposArray[4]',camposArray[4]);

             //descripcion registrado por el cliente
             camposArray[5] = brCoaRecord.custrecord_lmry_br_coa_acc_nameb;
             // log.error('camposArray[5]',camposArray[5]);
             //bloque M
             if (brCoaRecord.custrecord_lmry_br_coa_tipolanz_csll.length != 0) {
                 //  log.error('brCoaRecord.custrecord_lmry_br_coa_tipolanz_csll',brCoaRecord.custrecord_lmry_br_coa_tipolanz_csll);
                 //  log.error('brCoaRecord.custrecord_lmry_br_coa_tipolanz_csll[0].value',brCoaRecord.custrecord_lmry_br_coa_tipolanz_csll[0].value);
                 camposArray[6] = brCoaRecord.custrecord_lmry_br_coa_tipolanz_csll[0].value;
             }
             if (brCoaRecord.custrecord_lmry_br_coa_tipolanz_irpj.length != 0) {
                 camposArray[7] = brCoaRecord.custrecord_lmry_br_coa_tipolanz_irpj[0].value;
             }

             // regimen Presumido

             camposArray[19] = brCoaRecord['custrecord_lmry_br_coa_disc_gross_rev.custrecord_lmry_br_code_calc_bc_irpj'];

             camposArray[20] = brCoaRecord['custrecord_lmry_br_coa_calc_bc_csll_pres.custrecord_lmry_br_code_calc_bc_csll'];
             // bloque N
             //ID N620
             if (brCoaRecord.custrecord_lmry_br_coa_calc_irpj_mensual.length != 0) {
                 camposArray[21] = brCoaRecord.custrecord_lmry_br_coa_calc_irpj_mensual[0].value;
             }
             //ID N630
             if (brCoaRecord.custrecord_lmry_br_coa_calc_bc_irpj_real.length != 0) {
                 camposArray[22] = brCoaRecord.custrecord_lmry_br_coa_calc_bc_irpj_real[0].value;
             }

             //ID N660
             if (brCoaRecord.custrecord_lmry_br_coa_calc_csll_mens.length != 0) {
                 camposArray[23] = brCoaRecord.custrecord_lmry_br_coa_calc_csll_mens[0].value;
             }

             //ID N670
             if (brCoaRecord.custrecord_lmry_br_coa_calc_bc_csll_real.length != 0) {
                 camposArray[24] = brCoaRecord.custrecord_lmry_br_coa_calc_bc_csll_real[0].value;
             }

             //ID M410
             //log.error('brCoaRecord.custrecord_lmry_br_coa_padronb_release',brCoaRecord.custrecord_lmry_br_coa_padronb_release);
             if (brCoaRecord.custrecord_lmry_br_coa_padronb_release.length != 0) {
                 camposArray[30] = (brCoaRecord.custrecord_lmry_br_coa_padronb_release[0].text).substring(0, 2);
                 //log.error('camposArray[30]',camposArray[30]);
             }else{
                 camposArray[30] ='';
             }


             //campos traidos desde la transaccion que se necesitan para el l210
             if (camposArray[2] != '' && camposArray[2] != null) {
                 var campos_L210 = search.lookupFields({
                     type: 'customrecord_lmry_br_costing_account',
                     id: camposArray[2],
                     columns: ['custrecord_lmry_br_costing_code', 'name']
                 });
                 //codigo de la cuenta l210
                 camposArray[8] = campos_L210.custrecord_lmry_br_costing_code;
                 //descripcion de la cuenta l210
                 camposArray[9] = campos_L210.name;
             }

             //campos traidos desde la transaccion que se necesitan para el m010
             if (camposArray[3] != '' && camposArray[3] != null) {
                 var campos_M010 = search.lookupFields({
                     type: 'customrecord_lmry_br_rfb_padron',
                     id: camposArray[3],
                     columns: ['name', 'custrecord_lmry_br_code_rfb', 'custrecord_lmry_br_tax_rfb']
                 });

                 //descripcion de la cuenta del m010
                 camposArray[10] = campos_M010.name;
                 //codigo de la cuenta m010 segun tabla dinamica
                 camposArray[11] = campos_M010.custrecord_lmry_br_code_rfb;

                 var taxIrpj_Csll = '';
                 taxIrpj_Csll = campos_M010.custrecord_lmry_br_tax_rfb;
                 if (taxIrpj_Csll != '' && taxIrpj_Csll != null) {
                     var Padronjson = JSON.parse(taxIrpj_Csll);
                     var irpj = Padronjson.IRPJ;
                     var csll = Padronjson.CSLL;
                     if (irpj == 1 && csll == 0) {
                         camposArray[12] = 'I';
                     } else if (irpj == 0 && csll == 1) {
                         camposArray[12] = 'C';
                     } else {
                         camposArray[12] = 'A';
                     }
                 }
             }
             //campos para el csll
             if (camposArray[6] != '' && camposArray[6] != null) {
                 var campos_Lanzamiento = search.lookupFields({
                     type: 'customrecord_lmry_br_lanzpartea_ecf',
                     id: camposArray[6],
                     columns: ['name', 'custrecord_lmry_br_code_lanzamiento', 'custrecord_lmry_br_type_release', 'custrecord_lmry_br_tax_release', 'custrecord_lmry_br_ind_release_parta']
                 });

                 //codigo de lanzamiento
                 camposArray[13] = campos_Lanzamiento.custrecord_lmry_br_code_lanzamiento;
                 //descripcion de lanzamiento
                 camposArray[14] = campos_Lanzamiento.name;
                 //tipode lanzamiento
                 var campo18 = campos_Lanzamiento.custrecord_lmry_br_type_release;
                 //log.error('typeLanzam1.2',(campo18[0].text));
                 camposArray[15] = (campo18[0].text).substring(0, 1);
                 //tipo de impuesto del lanzamiento
                 var campo16 = campos_Lanzamiento.custrecord_lmry_br_tax_release;

                 if (campo16 == '{"value":"12","text":"CSLL"}') {
                     camposArray[16] = 'C';
                 } else if (campo16 == '{"value":"14","text":"IRPJ"}') {
                     camposArray[16] = 'I';
                 } else {
                     camposArray[16] = 'A';
                 }

                 //indicador del lanzamiento
                 if (campos_Lanzamiento.custrecord_lmry_br_ind_release_parta != '' && campos_Lanzamiento.custrecord_lmry_br_ind_release_parta != null) {
                 camposArray[17] = campos_Lanzamiento.custrecord_lmry_br_ind_release_parta[0].value;
                 //log.error('camposArray[17] indicador irpj',camposArray[17]);
                 }
             }

             //campos para el irpj
             if (camposArray[7] != '' && camposArray[7] != null) {
                 var campos_Lanzamiento = search.lookupFields({
                     type: 'customrecord_lmry_br_lanzpartea_ecf',
                     id: camposArray[7],
                     columns: ['name', 'custrecord_lmry_br_code_lanzamiento', 'custrecord_lmry_br_type_release', 'custrecord_lmry_br_tax_release', 'custrecord_lmry_br_ind_release_parta']
                 });

                 //codigo de lanzamiento
                 camposArray[25] = campos_Lanzamiento.custrecord_lmry_br_code_lanzamiento;
                 //descripcion de lanzamiento
                 camposArray[26] = campos_Lanzamiento.name;
                 //tipode lanzamiento
                 var campo27 = campos_Lanzamiento.custrecord_lmry_br_type_release;
                 //log.error('typeLanzam1.2',(campo27[0].text));
                 camposArray[27] = (campo27[0].text).substring(0, 1);
                 //tipo de impuesto del lanzamiento
                 var campo28 = campos_Lanzamiento.custrecord_lmry_br_tax_release;

                 if (campo28 == '{"value":"12","text":"CSLL"}') {
                     camposArray[28] = 'C';
                 } else if (campo28 == '{"value":"14","text":"IRPJ"}') {
                     camposArray[28] = 'I';
                 } else {
                     camposArray[28] = 'A';
                 }

                 //indicador del lanzamiento
                 if (campos_Lanzamiento.custrecord_lmry_br_ind_release_parta != '' && campos_Lanzamiento.custrecord_lmry_br_ind_release_parta != null) {
                     camposArray[29] = campos_Lanzamiento.custrecord_lmry_br_ind_release_parta[0].value;
                     //log.error('camposArray[29] indicador irpj',camposArray[29]);
                     }
             }
         }
         //log.error('campos adicionales id cuenta padron posicion 3', camposArray);
         return camposArray;
     }

     return {
         getInputData: getInputData,
         map: map,
         reduce: reduce,
         summarize: summarize
     };
 });