/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for Inventory Balance Library                  ||
||                                                              ||
||  File Name: LMRY_BR_ECD_MPRD_V.2.0.js                   		||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Dec 11 2019                Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(["N/record", "N/runtime", "N/file", "N/email", "N/search", "N/format", "N/log", "N/task", "N/config", "./BR_LIBRERIA_MENSUAL/LMRY_BR_Reportes_LBRY_V2.0.js", "/SuiteBundles/Bundle 37714/Latam_Library/LMRY_LibraryReport_LBRY_V2.js"],
    function(record, runtime, file, email, search, format, log, task, config, libreria, libFeature) {

        var LMRY_script = "LMRY_BR_ECD_MPRD_V.2.0.js";
        var objContext = runtime.getCurrentScript();

        var paramSubsidiary = objContext.getParameter("custscript_lmry_br_ecd_mprd_m_subsi");
        var paramPeriod = objContext.getParameter("custscript_lmry_br_ecd_mprd_m_period");
        var paramMultibook = objContext.getParameter("custscript_lmry_br_ecd_mprd_m_multi");
        var paramLogId = objContext.getParameter("custscript_lmry_br_ecd_mprd_m_idlog");
        var paramReportId = objContext.getParameter("custscript_lmry_br_ecd_mprd_m_idrep");
        var paramDeclarationType = objContext.getParameter("custscript_lmry_br_ecd_mprd_m_dectype");
        var paramBookType = objContext.getParameter("custscript_lmry_br_ecd_mprd_m_booktype");
        var paramNumOrder = objContext.getParameter("custscript_lmry_br_ecd_mprd_m_num_orden");
        var paramIdsFile = objContext.getParameter("custscript_lmry_br_ecd_mprd_m_idsfile");
        //var paramAdjust = objContext.getParameter("custscript_lmry_br_ecd_mprd_adjustm");
        var paramdateConstitution = objContext.getParameter("custscript_lmry_br_ecd_mprd_dateconstitu");

        var hasSubsidiariesFeature = runtime.isFeatureInEffect({
            feature: "SUBSIDIARIES"
        });
        var hasMultibookFeature = runtime.isFeatureInEffect({
            feature: "MULTIBOOK"
        });
        var hasMultipleCalendars = runtime.isFeatureInEffect({
            feature: "MULTIPLECALENDARS"
        });
        var hasJobsFeature = runtime.isFeatureInEffect({
            feature: "JOBS"
        });
        var hasAdvancedJobsFeature = runtime.isFeatureInEffect({
            feature: "ADVANCEDJOBS"
        });

        var language = runtime.getCurrentScript().getParameter("LANGUAGE").substring(0, 2);

        var featurePeriodEnd = runtime.isFeatureInEffect({
            feature: "PERIODENDJOURNALENTRIES"
        });

        var brSetupJson;

        function getInputData() {

            try {
                log.debug({
                    title: "Parametros",
                    details: paramSubsidiary + "|" + paramPeriod + "|" + paramMultibook + "|" + paramLogId + "|" + paramReportId + "|" + paramDeclarationType + "|" + paramBookType
                });

                //* Obtenemos los ids de los archivos transacciones de detalles x periodo
                log.debug("paramidsFile id ARCHIVO INICIAL", paramIdsFile);


                var archivoIdFiles = file.load({
                    id: paramIdsFile
                });
                paramIdsFile = archivoIdFiles.getContents();


                var filesIdArray = [];
                var filesIdArrayTotal = [];
                filesIdArray = paramIdsFile.split('|');

                log.debug('filesIdArray', filesIdArray);
                log.debug('filesIdArray len', filesIdArray.length);

                if (filesIdArray.length > 0) {

                    for (var i = 0; i < filesIdArray.length; i++) {
                        if (filesIdArray[i]) {
                            archivo = file.load({
                                id: filesIdArray[i]
                            });
                            var arrayIdByFile = archivo.getContents();
                            var arrayDetail = arrayIdByFile.split('\r\n');
                            //log.debug('arrayIdByFile', arrayIdByFile);
                            //log.debug('--- detail ---', arrayDetail);
                            filesIdArrayTotal = filesIdArrayTotal.concat(arrayDetail);
                        }
                    }

                    log.debug('filesIdArrayTotal', filesIdArrayTotal.length);
                    var arrayLineDetailTotal = dividirArray(filesIdArrayTotal, 2);
                    log.debug('saldosTotalesArray ', arrayLineDetailTotal.length);

                } else {
                    log.debug('keyObtenido', 'nada');
                }

                return arrayLineDetailTotal;

            } catch (error) {
                log.debug("ERROR", error);

                if (error.name == "FORMULA_ERROR" && feature_special_account) {
                    NoData(true, 2);
                } else {
                    NoData(true, 1);
                }
                //libreria.sendemailTranslate(error, LMRY_script, language);

                return [{ isError: "T", error: error }];
            }
        }

        function map(context) {

            try {

            } catch (error) {
                log.error("objResult", objResultArray);
                log.error("error map", error);
                context.write({
                    key: context.key,
                    value: {
                        isError: "T",
                        error: error
                    }
                });
            }
        }

        function reduce(context) {

            try {
                var resultArray = context.values;
                var objResultArray = [];

                for (var i = 0; i < resultArray.length; i++) {
                    objResultArray = JSON.parse(resultArray[i]);
                    //log.debug('REDUCE objResult ', objResultArray);

                    for (var i = 0; i < objResultArray.length; i++) {

                        if (objResultArray[i] != "") {

                            var objResult = objResultArray[i].split('#*#');
                            //log.debug('objResult ' + i, objResult);


                            if (objResult[10] == 'VendPymt' || objResult[10] == 'CustPymt') {

                                var paymentLinesArray = getPaymentLines(objResult);
                                //log.debug('paymentLinesArray ', paymentLinesArray);

                                for (var j = 0; j < paymentLinesArray.length; j++) {

                                    context.write({
                                        key: paymentLinesArray[j][10],
                                        value: paymentLinesArray[j]
                                    });
                                }

                            } else {
                                if (objResult[10] == 'FxReval') {
                                    var register_date_bill = obtenerFechaRegisterDateBill(objResult);
                                    if (register_date_bill) {
                                        objResult[1] = register_date_bill;
                                    }
                                }

                                var mapResult = objResult.slice(0, 10);

                                var transactionDate = format.parse({
                                    type: format.Type.DATE,
                                    value: objResult[1]
                                });

                                mapResult[1] = getDateFormat(transactionDate);
                                var brCoaArray = getAccountBrCoa(objResult[18]);

                                if (brCoaArray.length) {

                                    //5. Br coa Id
                                    mapResult[5] = brCoaArray[0];
                                    objResult[5] = brCoaArray[0];

                                    //6. Codigo de cuenta Analitica Debitada / Creditada I250
                                    mapResult[6] = brCoaArray[1];
                                    objResult[6] = brCoaArray[1];

                                }

                                mapResult[9] = getHistorical(objResult);
                                mapResult[10] = transactionDate.getMonth();

                                context.write({
                                    key: mapResult[10],
                                    value: mapResult
                                });
                            }
                        }
                    }
                }

            } catch (error) {

                log.error("error REDUCE", error);
                log.error("error resultArray", resultArray);
                context.write({
                    key: context.key,
                    value: {
                        isError: "T",
                        error: error
                    }
                });
            }

        }

        function summarize(context) {

            try {
                log.debug("LLEGO AL SUMMARIZE", '');

                brSetupJson = getBrSetup(paramSubsidiary);
                log.debug("brSetupJson", brSetupJson);
                var resultJson = getBrCoaObjects();
                var brCoaJson = resultJson.brCoaJson;
                var resultCoaArray = resultJson.resultCoaArray;
                var brCoaNatureJson = resultJson.brCoaNatureJson;
                var accountBrCoaJson = resultJson.accountBrCoaJson;
                log.debug("resultCoaArray", resultCoaArray);
                log.debug("brCoaNatureJson", brCoaNatureJson);

                // Saldo Inicial de cuentas al Inicio del Año.
                var initialBalanceJson = getAccountsInitialBalance(accountBrCoaJson);

                var remainingAccountForPeriodJson = JSON.parse(JSON.stringify(initialBalanceJson));

                var finalBalanceJson = JSON.parse(JSON.stringify(initialBalanceJson));

                log.debug("Saldo Inicial JSON", initialBalanceJson);

                var totalKeysSaved = 0,
                    errores = [];

                var initialBalance, accountNumber, debit, credit, internalid;

                var periodsJson = {};

                context.output.iterator().each(function(key, value) {
                    var objResult = JSON.parse(value);

                    if (objResult["isError"] == "T") {
                        log.error("Entro a error en summarize", '');
                        errores.push(JSON.stringify(objResult["error"]));
                    } else {

                        if (periodsJson[key] == undefined) {
                            periodsJson[key] = {
                                "transactions": [objResult],
                                "brCoa": {}
                            };
                        } else {
                            periodsJson[key]["transactions"].push(objResult)
                        }

                        if (objResult[5]) {
                            if (periodsJson[key]["brCoa"][objResult[5]] === undefined) {
                                periodsJson[key]["brCoa"][objResult[5]] = {};
                            }
                            if (periodsJson[key]["brCoa"][objResult[5]][objResult[7]] === undefined) {
                                periodsJson[key]["brCoa"][objResult[5]][objResult[7]] = [objResult[6], 0, 0, objResult[5]];
                            }

                            periodsJson[key]["brCoa"][objResult[5]][objResult[7]][1] = round(periodsJson[key]["brCoa"][objResult[5]][objResult[7]][1] + Number(objResult[2]));
                            periodsJson[key]["brCoa"][objResult[5]][objResult[7]][2] = round(periodsJson[key]["brCoa"][objResult[5]][objResult[7]][2] + Number(objResult[3]));
                        }

                    }
                    return true;
                });

                log.debug("ERRORES EN SUMMARIZE", errores.length);
                log.debug("PASO AGRUPAMIENTO", "");
                log.debug("periodsJson", periodsJson);

                /*if (errores.length > 0) {
                    var objResult_error = JSON.parse(errores[0]);
                    if (objResult_error.name != "FORMULA_ERROR") {
                        libFeature.sendErrorEmail(errores[0], LMRY_script, language);
                    }
                } else {*/

                var rowString;
                var paramTransactionFileId = "",
                    transactionString = "",
                    transactionFileNumber = 0,
                    transactionFileSize = 0;

                var paramAccountsForPeriodsFileId = "",
                    accountForPeriodsString = "",
                    accountForPeriodsFileNumber = 0,
                    accountFileSize = 0;
                // Recorrido de los meses
                for (var i = 0; i < 12; i++) {
                    // Si existe el mes dentro del JSON de periodos
                    if (periodsJson[i] !== undefined) {

                        // Recorrido de transacciones para el mes i
                        for (var j = 0; j < periodsJson[i]["transactions"].length; j++) {

                            rowString = getRowString(periodsJson[i]["transactions"][j]);
                            transactionString += rowString;
                            transactionFileSize += lengthInUtf8Bytes(rowString);

                            if (transactionFileSize > 9000000) {
                                if (transactionFileNumber == 0) {
                                    paramTransactionFileId = saveAuxiliaryFile(transactionString, transactionFileNumber, 1);
                                } else {
                                    paramTransactionFileId = paramTransactionFileId + "|" + saveAuxiliaryFile(transactionString, transactionFileNumber, 1);
                                }
                                transactionString = "";
                                transactionFileSize = 0;
                                transactionFileNumber++;
                            }
                        }

                        //log.error("Antes Period Balance " + i, finalBalanceJson);
                        //log.error("Antes Period " + i, remainingAccountForPeriodJson);

                        // Recorrido de cuentas usadas en las transacciones del mes i
                        for (var brCoaId in periodsJson[i]["brCoa"]) {

                            for (var department in periodsJson[i]["brCoa"][brCoaId]) {

                                // Elimina las cuentas que ya aparecieron en las transacciones del mes i para que no haya repetidos cuando recorra la variable remainingAccountForPeriodJson
                                if (remainingAccountForPeriodJson[brCoaId] !== undefined && remainingAccountForPeriodJson[brCoaId]["departments"][department] !== undefined) {
                                    delete remainingAccountForPeriodJson[brCoaId]["departments"][department];
                                }

                                // Crea las cuentas que no tienen saldo inicial para el mes i
                                // finalBalanceJson se usa para calcular el saldo inicial de las cuentas en el mes i
                                if (finalBalanceJson[brCoaId] === undefined) {
                                    finalBalanceJson[brCoaId] = {
                                        "saldo": 0,
                                        "departments": {}
                                    };
                                    finalBalanceJson[brCoaId]["departments"][department] = [periodsJson[i]["brCoa"][brCoaId][department][0], 0];
                                } else {
                                    if (finalBalanceJson[brCoaId]["departments"][department] === undefined) {
                                        finalBalanceJson[brCoaId]["departments"][department] = [periodsJson[i]["brCoa"][brCoaId][department][0], 0];
                                    }
                                }

                                initialBalance = Number(finalBalanceJson[brCoaId]["departments"][department][1]);

                                accountNumber = periodsJson[i]["brCoa"][brCoaId][department][0];
                                costCenter = department;
                                debit = Number(periodsJson[i]["brCoa"][brCoaId][department][1]);
                                credit = Number(periodsJson[i]["brCoa"][brCoaId][department][2]);
                                internalid = periodsJson[i]["brCoa"][brCoaId][department][3];

                                rowString = i + "|" + accountNumber + "|" + costCenter + "|" + initialBalance + "|" + debit + "|" + credit + "|" + internalid + "\r\n";

                                accountForPeriodsString += rowString;
                                accountFileSize += lengthInUtf8Bytes(rowString);

                                // Calcula el saldo inicial del siguiente mes para cada cuenta y departamento
                                finalBalanceJson[brCoaId]["departments"][department][1] = round(initialBalance + debit - credit);

                                // Calcula el saldo inicial del siguiente mes para cada cuenta
                                finalBalanceJson[brCoaId]["saldo"] = round(finalBalanceJson[brCoaId]["saldo"] + debit - credit);

                                if (accountFileSize > 9000000) {
                                    if (accountForPeriodsFileNumber == 0) {
                                        paramAccountsForPeriodsFileId = saveAuxiliaryFile(accountForPeriodsString, accountForPeriodsFileNumber, 2);
                                    } else {
                                        paramAccountsForPeriodsFileId = paramAccountsForPeriodsFileId + "|" + saveAuxiliaryFile(accountForPeriodsString, accountForPeriodsFileNumber, 2);
                                    }
                                    accountForPeriodsString = "";
                                    accountFileSize = 0;
                                    accountForPeriodsFileNumber++;
                                }
                            }
                        }

                        //log.error("Despues Period Balance " + i, finalBalanceJson);
                        //log.error("Despues Period " + i, remainingAccountForPeriodJson);
                        totalKeysSaved++;
                    }

                    //log.error("remainingAccountForPeriodJson " + i, remainingAccountForPeriodJson);

                    // Logica para recorrer las cuentas que tienen saldo Inicial pero que no tienen transacciones en el mes i
                    if (Object.keys(remainingAccountForPeriodJson).length != 0) {
                        for (var brCoaId in remainingAccountForPeriodJson) {

                            for (var department in remainingAccountForPeriodJson[brCoaId]["departments"]) {
                                if (Number(remainingAccountForPeriodJson[brCoaId]["departments"][department][1]) != 0) {
                                    var internalid_remaining;
                                    accountNumber = remainingAccountForPeriodJson[brCoaId]["departments"][department][0];
                                    costCenter = department;
                                    internalid_remaining = remainingAccountForPeriodJson[brCoaId]["departments"][department][2];
                                    if (internalid_remaining == undefined) {
                                        log.debug("Este es el valor del internalid Undefined", accountNumber);
                                        internalid_remaining = getBrCoaId(accountNumber);
                                    }
                                    rowString = i + "|" + accountNumber + "|" + costCenter + "|" + (remainingAccountForPeriodJson[brCoaId]["departments"][department][1] || 0) + "|0|0|" + internalid_remaining + "\r\n";
                                    accountForPeriodsString += rowString;
                                    accountFileSize += lengthInUtf8Bytes(rowString);

                                    if (accountFileSize > 9000000) {
                                        if (accountForPeriodsFileNumber == 0) {
                                            paramAccountsForPeriodsFileId = saveAuxiliaryFile(accountForPeriodsString, accountForPeriodsFileNumber, 2);
                                        } else {
                                            paramAccountsForPeriodsFileId = paramAccountsForPeriodsFileId + "|" + saveAuxiliaryFile(accountForPeriodsString, accountForPeriodsFileNumber, 2);
                                        }
                                        accountForPeriodsString = "";
                                        accountFileSize = 0;
                                        accountForPeriodsFileNumber++;
                                    }
                                }
                            }
                        }
                    }

                    remainingAccountForPeriodJson = JSON.parse(JSON.stringify(finalBalanceJson));
                }

                if (transactionString != "") {
                    if (transactionFileNumber == 0) {
                        paramTransactionFileId = saveAuxiliaryFile(transactionString, transactionFileNumber, 1);
                    } else {
                        paramTransactionFileId = paramTransactionFileId + "|" + saveAuxiliaryFile(transactionString, transactionFileNumber, 1);
                    }
                }


                var balanceBeforeClosingJson = {};
                var resultAccountsBeforeClosing = getAccountsBalanceBeforeClosing(resultCoaArray, balanceBeforeClosingJson, accountBrCoaJson);
                accountForPeriodsString += resultAccountsBeforeClosing;
                log.debug("CUENTAS BEFORE CLOSING ", resultAccountsBeforeClosing);

                if (accountForPeriodsString != "") {
                    if (accountForPeriodsFileNumber == 0) {
                        paramAccountsForPeriodsFileId = saveAuxiliaryFile(accountForPeriodsString, accountForPeriodsFileNumber, 2);
                    } else {
                        paramAccountsForPeriodsFileId = paramAccountsForPeriodsFileId + "|" + saveAuxiliaryFile(accountForPeriodsString, accountForPeriodsFileNumber, 2);
                    }
                }

                var accountXAglutinationCodeJson = {}
                paramLocalAccountAndAccountingGroupFileId = getLocalAccountAndAccountingGroupFileId(brCoaNatureJson, initialBalanceJson, finalBalanceJson, balanceBeforeClosingJson, accountXAglutinationCodeJson);
                log.debug("LOCAL ACCOUNT AND ACC GROUP", paramLocalAccountAndAccountingGroupFileId);

                log.debug("SALDO INICIAL", initialBalanceJson);
                log.debug("SALDOF FINAL", finalBalanceJson);

                var paramAccountsPlanFileId = getAccountsPlanFileId(brCoaJson, accountXAglutinationCodeJson);
                log.debug("PLAN DE CUENTAS ID", paramAccountsPlanFileId);

                callScheduleScript(paramTransactionFileId, paramAccountsForPeriodsFileId, paramAccountsPlanFileId, paramLocalAccountAndAccountingGroupFileId);

                //}
                log.debug("Numero de Meses", totalKeysSaved);
                log.debug("TRANSACTION ID", paramTransactionFileId);
                log.debug("ACCOUNT FOR PERIOD", paramAccountsForPeriodsFileId);

            } catch (error) {
                log.error("error", error);
                libFeature.sendErrorEmail(error, LMRY_script, language);
            }
        }

        function dividirArray(arrayData, divisor) {

            var arrayResult = new Array();
            var tam = arrayData.length;
            var ini = 0;
            var fin = divisor

            while (fin <= tam) {
                var partArray = arrayData.slice(ini, fin);
                arrayResult.push(partArray);

                ini = fin;
                fin += divisor;
            }

            if (ini < tam) {
                var partArray = arrayData.slice(ini, fin);
                arrayResult.push(partArray);
            }

            log.debug('divisor arrayResult', arrayResult);
            return arrayResult;
        }

        function getPaymentLines(objResult) {

            //log.error("getPaymentLines");
            var resultArray = [];
            var valorLinea = 0.0;
            var valorTotal = 0.0;
            var diff;
            var valorFaltantePago = 0.0;

            if (hasMultibookFeature) {
                var newSearch = search.create({
                    type: 'transaction',
                    filters: [
                        ['internalid', 'is', objResult[0]],
                        'AND', ['accountingtransaction.accountingbook', 'is', paramMultibook]
                    ],
                    columns: [
                        search.createColumn({
                            name: "formulatext",
                            formula: "{appliedtotransaction.tranid}"
                        }),
                        search.createColumn({
                            name: "formulanumeric",
                            formula: "{accountingtransaction.account.id}"
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            formula: "NVL({accountingtransaction.debitamount},0)"
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            formula: "NVL({accountingtransaction.creditamount},0)"
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            formula: "NVL({appliedtoforeignamount},0) * {accountingtransaction.exchangerate}"
                        }),
                        search.createColumn({
                            name: 'formulatext',
                            formula: '{customgl}'
                        }),
                        search.createColumn({
                            name: 'formulatext',
                            formula: '{memo}'
                        }),
                        search.createColumn({
                            name: 'formulatext',
                            formula: '{mainline}'
                        }),
                        search.createColumn({
                            name: 'formulatext',
                            formula: '{type.id}'
                        }),
                        search.createColumn({
                            name: 'formulatext',
                            formula: '{appliedtotransaction.id}'
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            formula: "NVL({amountremaining},0)"
                        })
                    ],
                    settings: [
                        search.createSetting({
                            name: 'consolidationtype',
                            value: 'NONE'
                        })
                    ]
                });
                var amountNotCeroFilter = search.createFilter({
                    name: 'formulanumeric',
                    formula: 'NVL({accountingtransaction.debitamount},0)-NVL({accountingtransaction.creditamount},0)',
                    operator: search.Operator.NOTEQUALTO,
                    values: '0'
                });
                newSearch.filters.push(amountNotCeroFilter);

            } else {
                var newSearch = search.create({
                    type: 'transaction',
                    filters: [
                        ['internalid', 'is', objResult[0]]
                    ],
                    columns: [
                        search.createColumn({
                            name: "formulatext",
                            formula: "{appliedtotransaction.tranid}"
                        }),
                        search.createColumn({
                            name: "formulanumeric",
                            formula: "{account.internalid}"
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            formula: "NVL({debitamount},0)"
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            formula: "NVL({creditamount},0)"
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            formula: "NVL({appliedtolinkamount},0)"
                        }),
                        search.createColumn({
                            name: 'formulatext',
                            formula: '{customgl}'
                        }),
                        search.createColumn({
                            name: 'formulatext',
                            formula: '{memo}'
                        }),
                        search.createColumn({
                            name: 'formulatext',
                            formula: '{mainline}'
                        }),
                        search.createColumn({
                            name: 'formulatext',
                            formula: '{type.id}'
                        }),
                        search.createColumn({
                            name: 'formulatext',
                            formula: '{appliedtotransaction.id}'
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            formula: "NVL({amountremaining},0)"
                        })
                    ],
                    settings: [
                        search.createSetting({
                            name: 'consolidationtype',
                            value: 'NONE'
                        })
                    ]
                });

                var amountNotCeroFilter = search.createFilter({
                    name: 'formulanumeric',
                    formula: 'NVL({debitamount},0)-NVL({creditamount},0)',
                    operator: search.Operator.NOTEQUALTO,
                    values: '0'
                });
                newSearch.filters.push(amountNotCeroFilter);

            }
            var customGlFilter = search.createFilter({
                name: 'formulatext',
                formula: '{customgl}',
                operator: search.Operator.IS,
                values: "F"
            });

            newSearch.filters.push(customGlFilter);

            var objResult_1 = newSearch.run().getRange(0, 1000);


            if (objResult_1.length) {
                //log.error("objResult_1 length", objResult_1.length);
                //if (!((auxArray[10] == 'VendPymt' || auxArray[10] == 'CustPymt') && result.getValue(columns[14]) != '*') || (auxArray[10] == 'VendPymt' && result.getValue(columns[14]) != '*' && result.getValue(columns[20])=="T" && result.getValue(columns[2]) > 0) || (auxArray[10] == 'CustPymt' && result.getValue(columns[14]) != '*' && result.getValue(columns[20])=="T" && result.getValue(columns[3]) > 0) ) 
                var mapResult = [],
                    columns;
                columns = objResult_1[0].columns;
                /*
        if(objResult_1[1].getValue(columns[5])=="T"){
            for (var i = 0; i < objResult_1.length; i++) {
                if(objResult_1[i].getValue(columns[7])=="*" || (objResult_1[i].getValue(columns[5])=="T" && objResult_1[i].getValue(columns[8]) == "VendPymt" && objResult_1[i].getValue(columns[2]) > 0) || (objResult_1[i].getValue(columns[5])=="T" && objResult_1[i].getValue(columns[8]) == "CustPymt" && objResult_1[i].getValue(columns[3]) > 0) ){
                    //cuspayment es payment        ----> debit
                    //vendpayment es bill payment   ----> credit
                    

                    if (objResult_1[i].getValue(columns[0])) {
                        objResult[9] = objResult_1[i].getValue(columns[0]);
                    } else {
                        objResult[9] = "";
                    }
                    objResult[2] = objResult_1[i].getValue(columns[2]);
                    objResult[3] = objResult_1[i].getValue(columns[3]);

                    mapResult = objResult.slice(0,10);

                    var transactionDate = format.parse({
                        type  : format.Type.DATE,
                        value : objResult[1]
                    });

                    mapResult[1] = getDateFormat(transactionDate);

                    var brCoaArray = getAccountBrCoa(objResult_1[i].getValue(columns[1]));
                    if (brCoaArray.length) {

                        //5. Br coa Id
                        mapResult[5] = brCoaArray[0];

                        //6. Codigo de cuenta Analitica Debitada / Creditada I250
                        mapResult[6] = brCoaArray[1];
                        //11. Internalid, se usa en el EFD.
                        //mapResult[11] = brCoaArray[2];
                    }
                    if(objResult_1[i].getValue(columns[7])=="*"){
                        mapResult[9] = getHistorical(objResult);
                    }else{
                        mapResult[9] = objResult_1[i].getValue(columns[6]);
                    }
                    
                    mapResult[10] = transactionDate.getMonth();
                    
                    //log.error("mapResultxdxd", mapResult);
                    resultArray.push(mapResult);
                }
            }
        }else{*/
                for (var i = 0; i < objResult_1.length; i++) {
                    //if(objResult_1[i].getValue(columns[5])=="F"){

                    if (objResult_1[i].getValue(columns[0])) {
                        objResult[9] = objResult_1[i].getValue(columns[0]);
                    } else {
                        objResult[9] = "";
                    }

                    if ((objResult_1[i].getValue(columns[3]) != 0 && objResult[10] == 'VendPymt')) {
                        valorTotal = round2(valorTotal) + round2(objResult_1[i].getValue(columns[3]));
                    } else if ((objResult_1[i].getValue(columns[2]) != 0 && objResult[10] == 'CustPymt')) {
                        valorTotal = round2(valorTotal) + round2(objResult_1[i].getValue(columns[2]));
                    }

                    objResult[2] = round2(objResult_1[i].getValue(columns[2]));
                    objResult[3] = round2(objResult_1[i].getValue(columns[3]));


                    if (objResult[10] == 'VendPymt' && objResult_1[i].getValue(columns[4]) != 0 && objResult_1[i].getValue(columns[10]) == 0) {
                        valorLinea = round2(valorLinea) + round2(objResult_1[i].getValue(columns[4]));

                        objResult[2] = round2(objResult_1[i].getValue(columns[4]));
                        objResult[3] = round2(objResult_1[i].getValue(columns[3]));

                    } else if (objResult[10] == 'CustPymt' && objResult_1[i].getValue(columns[4]) != 0 && objResult_1[i].getValue(columns[10]) == 0) {
                        valorLinea = round2(valorLinea) + round2(objResult_1[i].getValue(columns[4]));

                        objResult[3] = round2(objResult_1[i].getValue(columns[4]));
                        objResult[2] = round2(objResult_1[i].getValue(columns[2]));
                    } else if (objResult[10] == 'VendPymt') {
                        valorLinea = round2(valorLinea) + round2(objResult_1[i].getValue(columns[2]));

                    } else if (objResult[10] == 'CustPymt') {

                        // valorLinea = round2(valorLinea) + round2(objResult_1[i].getValue(columns[3]));
                        //modificacion PROD SOFTLINE - pago sin aplicar
                        if (objResult_1[i].getValue(columns[4]) != 0) {
                            valorLinea = round2(valorLinea) + round2(objResult_1[i].getValue(columns[4]));
                            objResult[3] = round2(objResult_1[i].getValue(columns[4]));
                        } else {
                            valorLinea = round2(valorLinea) + round2(objResult_1[i].getValue(columns[3]));
                            objResult[3] = round2(objResult_1[i].getValue(columns[3]));
                        }
                        valorFaltantePago = round2(objResult_1[i].getValue(columns[10]));
                    }

                    mapResult = objResult.slice(0, 10);

                    var transactionDate = format.parse({
                        type: format.Type.DATE,
                        value: objResult[1]
                    });

                    mapResult[1] = getDateFormat(transactionDate);

                    var brCoaArray = getAccountBrCoa(objResult_1[i].getValue(columns[1]));
                    if (brCoaArray.length) {

                        //5. Br coa Id
                        mapResult[5] = brCoaArray[0];

                        //6. Codigo de cuenta Analitica Debitada / Creditada I250
                        mapResult[6] = brCoaArray[1];

                        //11. Internalid, se usa en el EFD.
                        //mapResult[11] = brCoaArray[2];
                    }

                    mapResult[9] = getHistorical(objResult);

                    mapResult[10] = transactionDate.getMonth();

                    //log.error("mapResultxdxd", mapResult);
                    resultArray.push(mapResult);
                }
            }
            diff = valorTotal - valorLinea;

            if (diff) {
                //   log.debug("INTERNALID",objResult[0]);
                //   log.debug("valor total linea",valorLinea);
                //   log.debug("valor total",valorTotal);
                //   log.debug("La diferencia es de",diff);
                //log.debug("valor de la ultima linea cabecera debito",resultArray[0][2]);
                //log.debug("valor de la ultima linea cabecera credito",resultArray[0][3]);
                //log.debug("valor de la ultima linea debito",resultArray[resultArray.length-1][2]);
                //log.debug("valor de la ultima linea credito",resultArray[resultArray.length-1][3]);

                if (objResult[10] == 'CustPymt') {
                    //se comenta y modifica por pogo faltante
                    // resultArray[resultArray.length - 1][3] = resultArray[resultArray.length - 1][3] + diff;
                    var NewArray = new Array();
                    NewArray[0] = resultArray[0][0];
                    NewArray[1] = resultArray[0][1];
                    NewArray[2] = 0;
                    NewArray[3] = round2(diff);
                    NewArray[4] = resultArray[0][4];
                    NewArray[5] = resultArray[1][5];
                    NewArray[6] = resultArray[1][6];
                    NewArray[7] = resultArray[1][7];
                    NewArray[8] = resultArray[1][8];
                    NewArray[9] = 'Ingreso sin aplicar';
                    NewArray[10] = resultArray[1][10];

                    resultArray.push(NewArray);
                } else {
                    resultArray[resultArray.length - 1][2] = resultArray[resultArray.length - 1][2] + diff;
                }
            }

            return resultArray;
        }

        function obtenerFechaRegisterDateBill(objResult) {
            var newSearch = search.create({
                type: 'transaction',
                filters: [
                    ['internalid', 'is', objResult[0]]
                ],
                columns: [
                    search.createColumn({
                        name: "formuladate",
                        formula: "{accountingperiod.enddate}"
                    })
                ],
                settings: [
                    search.createSetting({
                        name: 'consolidationtype',
                        value: 'NONE'
                    })
                ]
            });

            var fechabill = null;
            var objResult_1 = newSearch.run().getRange(0, 1);
            if (objResult_1.length) {
                columns = objResult_1[0].columns;
                fechabill = objResult_1[0].getValue(columns[0]);
                //log.error("valor de bill",bill);
            }
            //log.error("valor de fechabill",fechabill);
            return fechabill;
        }


        function getAccountBrCoa(accountId) {
            var brCoaArray = [];

            if (accountId) {
                var accountRecord = search.lookupFields({
                    type: 'account',
                    id: accountId,
                    columns: ['custrecord_lmry_br_coa']
                });

                var AccountCoaRecord = accountRecord.custrecord_lmry_br_coa;

                if (AccountCoaRecord != undefined && AccountCoaRecord != null) {
                    if (AccountCoaRecord.length) {
                        brCoaArray[0] = accountRecord.custrecord_lmry_br_coa[0].value;
                        brCoaArray[1] = accountRecord.custrecord_lmry_br_coa[0].text;
                        brCoaArray[2] = accountId;
                    }
                }

            }

            return brCoaArray;
        }

        function getHistorical(objResult) {
            var historical = '';

            var tranid = objResult[9];
            var entity = getEntityName(objResult);
            var organization = getOrganization(objResult);
            //log.error("tranid-entity-organization", tranid + '|' + entity + '|' + organization);
            //log.error("valor del objResult",objResult);
            var notfound = true;
            // Factura de venta
            if (objResult[10] == 'CustInvc') {
                //Cancelamiento de retenciones (VOID-BR)
                if (objResult[11] == 'Voided Latam - WHT') {
                    historical = 'Cancelamento Retencao nota fiscal numero ' + tranid +
                        ' - Cliente: ' + entity + ' - Filial: ' + organization;
                    notfound = false;
                } else if (objResult[15] != '') {
                    //                 log.error('objResult[9]',objResult[9]);
                    // log.error('objResult[18]',objResult[18]);
                    if (objResult[18] != null && objResult[18] != '' && objResult[18] != undefined) {
                        var brCoaId = search.lookupFields({
                            type: 'account',
                            id: objResult[18],
                            columns: ['custrecord_lmry_br_coa']
                        });
                        if (brCoaId.custrecord_lmry_br_coa[0] != undefined) {
                            var idCoa = brCoaId.custrecord_lmry_br_coa[0].value;

                            var nameBrCoa = search.lookupFields({
                                type: 'customrecord_lmry_br_coa',
                                id: idCoa,
                                columns: ['custrecord_lmry_br_coa_name']
                            });

                            historical = nameBrCoa.custrecord_lmry_br_coa_name + 'Venda conforme nota fiscal numero ' + tranid +
                                ' - Cliente: ' + entity + ' - Filial: ' + organization;
                            notfound = false;
                        }
                    }


                }
            } else if (objResult[10] == 'VendBill') {
                if (objResult[14] == 'T') {
                    historical = 'Retencao nota fiscal numero ' + tranid +
                        ' - Fornecedor: ' + entity + ' - Filial: ' + organization;
                    notfound = false;
                } else if (objResult[15] != '') {
                    historical = 'Compra nessa data conforme Nota fiscal ' + tranid +
                        ' - Fornecedor: ' + entity + ' - Filial: ' + organization;
                    notfound = false;
                }
            } else if (objResult[10] == 'CustCred') {
                if (objResult[11] == '(LatamTax -  WHT)') {
                    historical = 'Retencao nota fiscal numero ' + tranid +
                        ' - Cliente: ' + entity + ' - Filial: ' + organization;
                    notfound = false;
                } else if (objResult[11].substring(0, 14) == 'Reference VOID') {
                    historical = 'Venda Cancelada conforme nota fiscal numero ' + tranid +
                        ' - Cliente: ' + entity + ' - Filial: ' + organization;
                    notfound = false;
                } else if (objResult[15] != '') {
                    var emision = getEmisionDate(objResult);
                    historical = 'Devolucao nota fiscal numero ' + tranid +
                        ' - Cliente: ' + entity + ' - emissao ' + emision + ' - Filial: ' + organization;
                    notfound = false;
                } else {
                    historical = "" + objResult[11];
                    notfound = false;
                }
            } else if (objResult[10] == 'Journal') {
                if (objResult[11] == 'Reclassification - WHT') {
                    historical = 'Retenção sobre recebimento venta ' + tranid +
                        ' - Cliente: ' + entity + ' - Filial: ' + organization;
                    notfound = false;
                } else if (objResult[11] == 'LatamReady - BR WHT Purchase') {
                    historical = 'Retenção sobre pagamento compra ' + tranid +
                        ' - Fornecedor: ' + entity + ' - Filial: ' + organization;
                    notfound = false;
                } else {
                    if (objResult[19]) {
                        historical = objResult[19];
                        notfound = false;
                    } else {
                        var brCoaId = search.lookupFields({
                            type: 'account',
                            id: objResult[18],
                            columns: ['custrecord_lmry_br_coa']
                        });
                        if (brCoaId.custrecord_lmry_br_coa[0] != undefined) {
                            var idCoa = brCoaId.custrecord_lmry_br_coa[0].value;

                            var nameBrCoa = search.lookupFields({
                                type: 'customrecord_lmry_br_coa',
                                id: idCoa,
                                columns: ['custrecord_lmry_br_coa_name']
                            });

                            var transaction_memo = objResult[11];
                            historical = nameBrCoa.custrecord_lmry_br_coa_name + " " + transaction_memo;
                            notfound = false;
                        }
                    }
                }
            } else if (objResult[10] == 'CustPymt') {
                if (objResult[2] > 0) {
                    historical = 'Recebimento duplicata  ' +
                        ' - Cliente: ' + entity + ' - através do banco: ' + organization;
                    notfound = false;
                } else if (objResult[3] > 0) {
                    historical = 'Recebimento duplicata numero ' + tranid +
                        ' - Cliente: ' + entity + ' - através do banco: ' + organization;
                    notfound = false;
                }
            } else if (objResult[10] == 'VendPymt') {
                if (objResult[3] > 0) {
                    historical = 'Pagamento - Fornecedor: ' + entity + ' - Banco: ' + organization;
                    notfound = false;
                } else if (objResult[2] > 0) {
                    historical = 'Pagamento fornecedor ' + tranid +
                        ' - Fornecedor: ' + entity + ' - Banco: ' + organization;
                    notfound = false;
                }
            } else if (objResult[10] == 'VendCred') {
                if (objResult[15] != '') {
                    var emision = getEmisionDate(objResult);
                    historical = 'Devolucao nota fiscal numero ' + tranid +
                        ' - Fornecedor: ' + entity + ' - emissao ' + emision + ' - Filial: ' + organization;
                    notfound = false;
                } else {
                    historical = "" + objResult[11];
                    notfound = false;
                }
            } else if (objResult[10] == 'Transfer') {
                if (objResult[19]) {
                    historical = objResult[19];
                    notfound = false;
                } else {
                    historical = obtenerTransferAccounts(objResult[0]);
                    notfound = false;
                }
            } else if (objResult[10] == 'ItemRcpt') {

                historical = "Entrada Orden de Compra #" + tranid + " Fornecedor " + entity;
                notfound = false;

            } else if (objResult[10] == 'FxReval') {
                var tipo_revaluation = saberSiEsRealizedRounding(objResult[0]);
                if (tipo_revaluation == "rounding") {
                    historical = "Ajuste baixa financiera sobre " + tranid + " - " + entity;
                    notfound = false;
                } else if (tipo_revaluation == "realized") {
                    historical = "Variacao Cambial sobre " + tranid + " - " + entity;
                    notfound = false;
                } else {
                    historical = "" + objResult[11] + "";
                    notfound = true;
                }

            } else if (objResult[10] == 'ItemShip') {
                if (objResult[11] != '') {
                    historical = "" + objResult[11] + "";
                    notfound = false;
                } else {
                    historical = "" + 'Saída Orden de Venda #' + tranid + " Cliente " + entity;
                    notfound = false;
                }
            } else if (objResult[10] == 'VPrep') {
                historical = "" + objResult[11] + "";
                notfound = false;
            } else if (objResult[10] == 'VPrepApp') {
                historical = "" + objResult[11] + "";
                notfound = false;
            } else if (objResult[10] == 'PEJrnl') {

                if (objResult[11] == 'Reclassification - WHT') {
                    historical = 'Retenção sobre recebimento venta ' + tranid +
                        ' - Cliente: ' + entity + ' - Filial: ' + organization;
                    notfound = false;
                } else if (objResult[11] == 'LatamReady - BR WHT Purchase') {
                    historical = 'Retenção sobre pagamento compra ' + tranid +
                        ' - Fornecedor: ' + entity + ' - Filial: ' + organization;
                    notfound = false;
                } else {
                    if (objResult[19]) {
                        historical = objResult[19];
                        notfound = false;
                    } else {
                        var brCoaId = search.lookupFields({
                            type: 'account',
                            id: objResult[18],
                            columns: ['custrecord_lmry_br_coa']
                        });
                        if (brCoaId.custrecord_lmry_br_coa[0] != undefined) {
                            var idCoa = brCoaId.custrecord_lmry_br_coa[0].value;

                            var nameBrCoa = search.lookupFields({
                                type: 'customrecord_lmry_br_coa',
                                id: idCoa,
                                columns: ['custrecord_lmry_br_coa_name']
                            });

                            var transaction_memo = objResult[11];
                            historical = nameBrCoa.custrecord_lmry_br_coa_name + " " + transaction_memo;
                            notfound = false;
                        }
                    }
                }
            }

            if (notfound) {
                if (objResult[19]) {
                    historical = "" + objResult[19] + "";
                } else {
                    historical = "" + objResult[11] + "";
                }
            }

            return historical;
        }

        function saberSiEsRealizedRounding(internalid) {
            var newSearch = search.create({
                type: 'transaction',
                filters: [
                    ['internalid', 'is', internalid]
                ],
                columns: [],
                settings: [
                    search.createSetting({
                        name: 'consolidationtype',
                        value: 'NONE'
                    })
                ]
            });

            var appliedtotransaction = search.createColumn({
                name: "type",
                join: "appliedToTransaction",
                label: "Type"
            });
            var tipoRevaluation = "";
            newSearch.columns.push(appliedtotransaction);
            var objResult_1 = newSearch.run().getRange(0, 3);
            if (objResult_1.length) {
                columns = objResult_1[0].columns;
                if (objResult_1.length > 2) {
                    var tipoTransaccion_1 = objResult_1[1].getValue(columns[0]);
                    var tipoTransaccion_2 = objResult_1[2].getValue(columns[0]);
                    if (tipoTransaccion_1 == "FxReval" || tipoTransaccion_1 == "") {
                        tipoRevaluation = "";
                    } else if (tipoTransaccion_1 != tipoTransaccion_2) {
                        tipoRevaluation = "realized";
                    } else {
                        tipoRevaluation = "rounding";
                    }
                } else if (objResult_1.length == 2) {
                    var tipoTransaccion_1 = objResult_1[1].getValue(columns[0]);
                    if (tipoTransaccion_1 == "FxReval" || tipoTransaccion_1 == "") {
                        tipoRevaluation = "";
                    } else {
                        tipoRevaluation = "rounding";
                    }
                }
            } else {
                tipoRevaluation = "";
            }
            // log.error("tipoRevaluation",tipoRevaluation);
            return tipoRevaluation;
        }

        function obtenerTransferAccounts(internalid) {

            var newSearch = search.create({
                type: 'transaction',
                filters: [
                    ['internalid', 'is', internalid]
                ],
                columns: [],
                settings: [
                    search.createSetting({
                        name: 'consolidationtype',
                        value: 'NONE'
                    })
                ]
            });
            if (hasMultibookFeature) {
                var fromaccount = search.createColumn({
                    name: 'formulatext',
                    formula: '{accountingtransaction.account}',
                    summary: "GROUP"
                });
            } else {
                var fromaccount = search.createColumn({
                    name: 'formulatext',
                    formula: '{account}',
                    summary: "GROUP"
                });
            }
            newSearch.columns.push(fromaccount);

            var objResult_1 = newSearch.run().getRange(0, 2);
            if (objResult_1.length) {
                columns = objResult_1[0].columns;
                account_transaction_1 = objResult_1[0].getValue(columns[0]);
                account_transaction_2 = objResult_1[1].getValue(columns[0]);
            }
            account_combinacion = "Transferencia de conta " + account_transaction_2 + " para conta " + account_transaction_1 + "";
            log.debug("account_combinacion", account_combinacion);
            return account_combinacion;
        }

        function getEntityName(objResult) {
            var entityName = '';
            if (objResult[10] == 'FxReval') {
                var columns;
                var newSearch = search.create({
                    type: 'transaction',
                    filters: [
                        ['internalid', 'is', objResult[0]]
                    ],
                    columns: [
                        search.createColumn({
                            name: "formulatext",
                            formula: "{createdfrom.internalid}"
                        })
                    ],
                    settings: [
                        search.createSetting({
                            name: 'consolidationtype',
                            value: 'NONE'
                        })
                    ]
                });

                var objResult_1 = newSearch.run().getRange(0, 2);
                var typeObjResult = '',
                    vendorId = '',
                    customerId = '',
                    internalidCreatedFrom = '';
                if (objResult_1.length) {
                    columns = objResult_1[0].columns;
                    internalidCreatedFrom = objResult_1[1].getValue(columns[0]);
                    if (internalidCreatedFrom != '' && internalidCreatedFrom != null && internalidCreatedFrom != undefined) {
                        var newSearch2 = search.create({
                            type: 'transaction',
                            filters: [
                                ['internalid', 'is', internalidCreatedFrom]
                            ],
                            columns: [],
                            settings: [
                                search.createSetting({
                                    name: 'consolidationtype',
                                    value: 'NONE'
                                })
                            ]
                        });
                        var typeColumn = search.createColumn({
                            name: 'formulanumeric',
                            formula: '{type.id}'
                        });
                        var vendorColumn = search.createColumn({
                            name: 'formulanumeric',
                            formula: '{vendor.internalid}'
                        });

                        var customerColumn;

                        if (hasJobsFeature && !hasAdvancedJobsFeature) {
                            customerColumn = search.createColumn({
                                name: 'formulanumeric',
                                formula: '{customermain.internalid}'
                            });
                        } else if ((!hasJobsFeature && !hasAdvancedJobsFeature) || (!hasJobsFeature && hasAdvancedJobsFeature) || (hasJobsFeature && hasAdvancedJobsFeature)) {
                            customerColumn = search.createColumn({
                                name: "formulanumeric",
                                formula: "CASE WHEN NVL({job.internalid},-1) = -1 THEN NVL({customer.internalid},{customermain.internalid}) ELSE {job.customer.id} end"
                            });
                        }
                        newSearch2.columns.push(typeColumn);
                        newSearch2.columns.push(vendorColumn);
                        newSearch2.columns.push(customerColumn);

                        var objResult_2 = newSearch2.run().getRange(0, 1);
                        if (objResult_2.length) {
                            columns = objResult_2[0].columns;
                            typeObjResult = objResult_2[0].getValue(columns[0]);
                            vendorId = objResult_2[0].getValue(columns[1]);
                            customerId = objResult_2[0].getValue(columns[2]);
                        }
                    }
                    //}
                }
                //   log.error("typeObjResult",typeObjResult);
                //   log.error("vendorId",vendorId);
                //   log.error("customerId",customerId);

                var type = '',
                    internalid = '';
                if (typeObjResult == 'CustInvc' || typeObjResult == 'CustCred' || typeObjResult == 'CustPymt' || objResult[10] == 'ItemShip') {
                    type = 'customer';
                    internalid = customerId;
                } else if (typeObjResult == 'VendBill' || typeObjResult == 'VendCred' || typeObjResult == 'VendPymt' || objResult[10] == 'ItemRcpt') {
                    type = 'vendor';
                    internalid = vendorId;
                }

                if (type && internalid) {
                    var newSearch3 = search.create({
                        type: type,
                        filters: [
                            ['internalid', 'is', internalid]
                        ],
                        columns: [
                            search.createColumn({
                                name: "formulatext",
                                formula: "CASE WHEN {isperson} = 'T' THEN CONCAT(CONCAT({firstname},' '), {lastname}) ELSE {companyname} END"
                            })
                        ]
                    });

                    var objResult_3 = newSearch3.run().getRange(0, 1000);

                    if (objResult_3.length) {
                        var columns = objResult_3[0].columns;
                        entityName = objResult_3[0].getValue(columns[0]);
                    }
                }
            } else if (objResult[10] != 'Journal') {
                var type = '',
                    internalid = '';
                if (objResult[10] == 'CustInvc' || objResult[10] == 'CustCred' || objResult[10] == 'CustPymt' || objResult[10] == 'ItemShip') {
                    type = 'customer';
                    internalid = objResult[17];
                } else if (objResult[10] == 'VendBill' || objResult[10] == 'VendCred' || objResult[10] == 'VendPymt' || objResult[10] == 'ItemRcpt') {
                    type = 'vendor';
                    internalid = objResult[16];
                }

                if (type && internalid) {
                    var newSearch = search.create({
                        type: type,
                        filters: [
                            ['internalid', 'is', internalid]
                        ],
                        columns: [
                            search.createColumn({
                                name: "formulatext",
                                formula: "CASE WHEN {isperson} = 'T' THEN CONCAT(CONCAT({firstname},' '), {lastname}) ELSE {companyname} END"
                            })
                        ]
                    });

                    var objResult_1 = newSearch.run().getRange(0, 1000);

                    if (objResult_1.length) {
                        columns = objResult_1[0].columns;
                        entityName = objResult_1[0].getValue(columns[0]);
                    }
                }
            } else {
                //log.error("objResult[12]", objResult[12]);
                if (objResult[12]) {
                    var newSearch = search.create({
                        type: 'transaction',
                        filters: [
                            ['internalid', 'is', objResult[12]]
                        ],
                        columns: [
                            search.createColumn({
                                name: "formulatext",
                                formula: "{type.id}"
                            })
                        ]
                    });

                    var vendorColumn = search.createColumn({
                        name: 'formulanumeric',
                        formula: '{vendor.internalid}'
                    });
                    newSearch.columns.push(vendorColumn);

                    if (hasJobsFeature && !hasAdvancedJobsFeature) {
                        var customerColumn = search.createColumn({
                            name: 'formulanumeric',
                            formula: '{customermain.internalid}'
                        });
                        newSearch.columns.push(customerColumn);
                    } else if ((!hasJobsFeature && !hasAdvancedJobsFeature) || (!hasJobsFeature && hasAdvancedJobsFeature) || (hasJobsFeature && hasAdvancedJobsFeature)) {
                        var customerColumn = search.createColumn({
                            name: "formulanumeric",
                            formula: "CASE WHEN NVL({job.internalid},-1) = -1 THEN NVL({customer.internalid},{customermain.internalid}) ELSE {job.customer.id} end"
                        });
                        newSearch.columns.push(customerColumn);
                    }

                    objResult_1 = newSearch.run().getRange(0, 1000);
                    var type = '',
                        internalid = '';

                    if (objResult_1.length) {
                        columns = objResult_1[0].columns;

                        transactionType = objResult_1[0].getValue(columns[0]);
                        //log.error("transactionType", transactionType);
                        if (transactionType == 'CustInvc' || transactionType == 'CustCred' || transactionType == 'CustPymt') {
                            type = 'customer';
                            internalid = objResult_1[0].getValue(columns[2]);
                        } else if (transactionType == 'VendBill' || transactionType == 'VendCred' || transactionType == 'VendPymt') {
                            type = 'vendor';
                            internalid = objResult_1[0].getValue(columns[1]);
                        }

                        //log.error("type", type);
                        //log.debug("internalid", internalid);
                        if (type) {
                            var newSearch_1 = search.create({
                                type: type,
                                filters: [
                                    ['internalid', 'is', internalid]
                                ],
                                columns: [
                                    search.createColumn({
                                        name: "formulatext",
                                        formula: "CASE WHEN {isperson} = 'T' THEN CONCAT(CONCAT({firstname},' '), {lastname}) ELSE {companyname} END"
                                    })
                                ]
                            });

                            var objResult_2 = newSearch_1.run().getRange(0, 1000);

                            if (objResult_2.length) {
                                //log.debug("encontro", objResult_2[0].getValue(columns[0]));
                                columns = objResult_2[0].columns;
                                entityName = objResult_2[0].getValue(columns[0]);
                            }
                        }
                    }
                }
            }

            return entityName;
        }

        function getOrganization(objResult) {
            var organizationName = '';

            if (objResult[10] == 'CustPymt') {
                var accountRecord = search.lookupFields({
                    type: 'account',
                    id: objResult[18],
                    columns: ['custrecord_lmry_br_coa_description']
                });
                organizationName = accountRecord['custrecord_lmry_br_coa_description'];
            } else if (objResult[10] == 'VendPymt') {
                var accountRecord = search.lookupFields({
                    type: 'account',
                    id: objResult[18],
                    columns: ['name']
                });
                organizationName = accountRecord['name'];
            } else {
                organizationName = objResult[13];
            }

            return organizationName;
        }

        function getEmisionDate(objResult) {
            var transactionRecord = search.lookupFields({
                type: search.Type.TRANSACTION,
                id: objResult[0],
                columns: ['createdfrom.trandate']
            });

            if (transactionRecord['createdfrom.trandate']) {
                var transactionDate = format.parse({
                    type: format.Type.DATE,
                    value: transactionRecord['createdfrom.trandate']
                });

                return completeZero(2, transactionDate.getDate()) + '/' + completeZero(2, transactionDate.getMonth() + 1) + '/' + transactionDate.getFullYear();

            }
            return '';
        }

        function getLocalAccountAndAccountingGroupFileId(brCoaNatureJson, initialBalanceJson, finalBalanceJson, balanceBeforeClosingJson, accountXAglutinationCodeJson) {
            var newSearch = search.create({
                type: "customrecord_lmry_br_local_account",
                filters: [
                    [
                        ["formulatext: {custrecord_lmry_br_account}", "isnotempty", ""],
                        "OR", ["formulatext: {custrecord_lmry_br_coa_account}", "isnotempty", ""]
                    ],
                    "AND", ["custrecord_lmry_br_acc_type", "anyof", "2"]
                ],
                columns: [
                    search.createColumn({
                        name: "custrecord_lmry_br_coa",
                        join: "custrecord_lmry_br_account",
                        summary: "GROUP"
                    }),
                    search.createColumn({
                        name: "name",
                        summary: "GROUP"
                    }),
                    search.createColumn({
                        name: "custrecord_lmry_br_coa_account",
                        summary: "GROUP"
                    })
                ]
            });
            //["custrecord_lmry_br_account.custrecord_lmry_br_coa", "name","custrecord_lmry_br_coa_account"]
            if (hasSubsidiariesFeature) {
                var subsidiaryFilter = search.createFilter({
                    name: "custrecord_lmry_br_subsidiarie",
                    operator: search.Operator.IS,
                    values: [paramSubsidiary]
                });
                newSearch.filters.push(subsidiaryFilter);
            }

            var pagedData = newSearch.runPaged({
                pageSize: 1000
            });

            var page, auxArray, columns, localAccountString = "",
                fileSize = 0,
                rowString;
            pagedData.pageRanges.forEach(function(pageRange) {
                page = pagedData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function(result) {
                    columns = result.columns;

                    auxArray = [];

                    auxArray[0] = "LA";

                    // ACCOUNT -> LATAM - BR COA
                    if (result.getValue(columns[0]) == "- None -" || result.getValue(columns[0]) == null || result.getValue(columns[0]) == '') {
                        auxArray[1] = result.getValue(columns[2]);
                    } else {
                        auxArray[1] = result.getValue(columns[0]);
                    }
                    // NAME
                    auxArray[2] = result.getValue(columns[1]);

                    rowString = getRowString(auxArray);
                    localAccountString += rowString;
                    fileSize += lengthInUtf8Bytes(rowString);
                });
            });

            var newSearch = search.create({
                type: "customrecord_lmry_br_accounting_group",
                filters: [
                    ["isinactive", "is", "F"]
                ],
                columns: [
                    search.createColumn({
                        name: 'name',
                        sort: search.Sort.ASC,
                        summary: 'GROUP'
                    }),
                    search.createColumn({
                        name: 'custrecord_lmry_br_group_type',
                        summary: 'GROUP'
                    }),
                    search.createColumn({
                        name: 'custrecord_lmry_br_group_level',
                        summary: 'GROUP'
                    }),
                    search.createColumn({
                        name: 'custrecord_lmry_br_group_parent',
                        summary: 'GROUP'
                    }),
                    search.createColumn({
                        name: 'custrecord_lmry_br_group_name',
                        summary: 'GROUP'
                    }),
                    search.createColumn({
                        name: 'formulanumeric',
                        formula: '{custrecord_lmry_br_group_acc.custrecord_lmry_br_coa.id}',
                        sort: search.Sort.ASC,
                        summary: 'GROUP'
                    }),
                    search.createColumn({
                        name: 'custrecord_lmry_br_group_demo_type_indi',
                        summary: 'GROUP'
                    }),
                    search.createColumn({
                        name: 'formulanumeric',
                        formula: '{custrecord_lmry_br_group_coa_acc.internalid}',
                        summary: 'GROUP'
                    })
                ]
            });

            if (hasSubsidiariesFeature) {
                var subsidiaryFilter = search.createFilter({
                    name: "custrecord_lmry_br_group_subsidiarie",
                    operator: search.Operator.IS,
                    values: [paramSubsidiary]
                });
                newSearch.filters.push(subsidiaryFilter);
            }
            //    numero_cod, tipo, nivel, cod_padre, tipo cuenta, nombre, si,

            var resultSearch = newSearch.run();
            var DbolStop = false,
                objResult, intDMinReg = 0,
                intDMaxReg = 1000,
                aglutinationCodeJson = {};

            while (!DbolStop) {
                objResult = resultSearch.getRange(intDMinReg, intDMaxReg);

                if (objResult.length != 1000) {
                    DbolStop = true;
                }

                for (var i = 0; i < objResult.length; i++) {
                    columns = objResult[i].columns;
                    auxArray = [];

                    auxArray[0] = "AG";

                    // Numero Cod Aglutinamiento
                    if (objResult[i].getValue(columns[0]) == '- None -') {
                        auxArray[1] = '';
                    } else {
                        auxArray[1] = objResult[i].getValue(columns[0]);
                    }

                    // Tipo de Cod Aglutinamiento
                    if (objResult[i].getValue(columns[1]) == "1") {
                        auxArray[2] = "T";
                    } else if (objResult[i].getValue(columns[1]) == "2") {
                        auxArray[2] = "D";
                    }

                    // Nivel de Cod Aglutinamiento
                    if (objResult[i].getValue(columns[2]) == '- None -') {
                        auxArray[3] = '';
                    } else {
                        auxArray[3] = objResult[i].getValue(columns[2]);
                    }

                    // Nro Cod Aglutinamiento Padre
                    if (objResult[i].getValue(columns[3]) == '- None -') {
                        auxArray[4] = '';
                    } else {
                        auxArray[4] = objResult[i].getValue(columns[3]);
                    }


                    //variable auxiliar para el br coa
                    var auxCoa;
                    if (objResult[i].getValue(columns[5]) == '' || objResult[i].getValue(columns[5]) == '- None -') {
                        auxCoa = objResult[i].getValue(columns[7]);
                    } else {
                        auxCoa = objResult[i].getValue(columns[5]);
                    }

                    // Tipo de Cuenta (Activo, Pasivo, Resultado);
                    auxArray[5] = brCoaNatureJson[auxCoa] || "";

                    // Nombre Cod Aglutinamiento
                    auxArray[6] = objResult[i].getValue(columns[4]);

                    // Saldo Inicial
                    auxArray[7] = (initialBalanceJson[auxCoa] !== undefined && Number(initialBalanceJson[auxCoa]["saldo"])) || 0;

                    // Saldo Final
                    auxArray[8] = (finalBalanceJson[auxCoa] !== undefined && Number(finalBalanceJson[auxCoa]["saldo"])) || 0;

                    // Saldo Antes de Cierre
                    auxArray[9] = Number(balanceBeforeClosingJson[auxCoa]) || 0;

                    // Indicador de Tipo de Demostración
                    if (objResult[i].getValue(columns[6]) == '- None -') {
                        auxArray[10] = '';
                    } else {
                        auxArray[10] = objResult[i].getValue(columns[6]);
                    }
                    // Id BR COA
                    auxArray[11] = auxCoa;

                    if (auxArray[3] == "1") {
                        if (aglutinationCodeJson[auxArray[3]] === undefined) {
                            aglutinationCodeJson[auxArray[3]] = [];
                        }
                        aglutinationCodeJson[auxArray[3]].push(auxArray);
                    } else {
                        if (aglutinationCodeJson[auxArray[3]] === undefined) {
                            aglutinationCodeJson[auxArray[3]] = {};
                        }
                        if (aglutinationCodeJson[auxArray[3]][auxArray[4]] === undefined) {
                            aglutinationCodeJson[auxArray[3]][auxArray[4]] = {};
                        }
                        if (aglutinationCodeJson[auxArray[3]][auxArray[4]][auxArray[1]] === undefined) {
                            aglutinationCodeJson[auxArray[3]][auxArray[4]][auxArray[1]] = auxArray;
                        } else {
                            if (!aglutinationCodeJson[auxArray[3]][auxArray[4]][auxArray[1]][5]) {
                                aglutinationCodeJson[auxArray[3]][auxArray[4]][auxArray[1]][5] = auxArray[5];
                            }

                            aglutinationCodeJson[auxArray[3]][auxArray[4]][auxArray[1]][7] = round(Number(aglutinationCodeJson[auxArray[3]][auxArray[4]][auxArray[1]][7]) + Number(auxArray[7]));
                            aglutinationCodeJson[auxArray[3]][auxArray[4]][auxArray[1]][8] = round(Number(aglutinationCodeJson[auxArray[3]][auxArray[4]][auxArray[1]][8]) + Number(auxArray[8]));
                            aglutinationCodeJson[auxArray[3]][auxArray[4]][auxArray[1]][9] = round(Number(aglutinationCodeJson[auxArray[3]][auxArray[4]][auxArray[1]][9]) + Number(auxArray[9]));

                            aglutinationCodeJson[auxArray[3]][auxArray[4]][auxArray[1]][11] += "," + auxArray[11];
                        }
                    }

                    if (auxCoa) {
                        accountXAglutinationCodeJson[auxCoa] = objResult[i].getValue(columns[0]);
                    }

                }
                intDMinReg = intDMaxReg;
                intDMaxReg = intDMaxReg + 1000;
            }

            log.debug("aglutinationCodeJsonGroup", aglutinationCodeJson);

            if (aglutinationCodeJson["1"] !== undefined) {
                var number_1, number_2, number_3, number_4, number_5, number_6;
                var string_1 = "",
                    string_2 = "",
                    string_3 = "",
                    string_4 = "",
                    string_5 = "",
                    string_6 = "";
                var count = 0;

                //aglutinationCodeJson["1"] = aglutinationCodeJson["1"].sort(function (a,b) { return Number(a[5]) - Number(b[5])});

                for (var i = 0; i < aglutinationCodeJson["1"].length; i++) {
                    number_1 = aglutinationCodeJson["1"][i][1];

                    if (aglutinationCodeJson["2"] !== undefined && aglutinationCodeJson["2"][number_1] !== undefined) {

                        for (var j in aglutinationCodeJson["2"][number_1]) {
                            number_2 = aglutinationCodeJson["2"][number_1][j][1];

                            if (aglutinationCodeJson["3"] !== undefined && aglutinationCodeJson["3"][number_2] !== undefined) {
                                for (var k in aglutinationCodeJson["3"][number_2]) {
                                    number_3 = aglutinationCodeJson["3"][number_2][k][1];

                                    if (aglutinationCodeJson["4"] !== undefined && aglutinationCodeJson["4"][number_3] !== undefined) {
                                        for (var l in aglutinationCodeJson["4"][number_3]) {
                                            number_4 = aglutinationCodeJson["4"][number_3][l][1];

                                            if (aglutinationCodeJson["5"] !== undefined && aglutinationCodeJson["5"][number_4] !== undefined) {
                                                for (var m in aglutinationCodeJson["5"][number_4]) {
                                                    number_5 = aglutinationCodeJson["5"][number_4][m][1];

                                                    if (aglutinationCodeJson["6"] !== undefined && aglutinationCodeJson["6"][number_5] !== undefined) {
                                                        for (var n in aglutinationCodeJson["6"][number_5]) {

                                                            aglutinationCodeJson["5"][number_4][m][7] = round(aglutinationCodeJson["5"][number_4][m][7] + aglutinationCodeJson["6"][number_5][n][7]);
                                                            aglutinationCodeJson["5"][number_4][m][8] = round(aglutinationCodeJson["5"][number_4][m][8] + aglutinationCodeJson["6"][number_5][n][8]);
                                                            aglutinationCodeJson["5"][number_4][m][9] = round(aglutinationCodeJson["5"][number_4][m][9] + aglutinationCodeJson["6"][number_5][n][9]);
                                                            aglutinationCodeJson["5"][number_4][m][5] = aglutinationCodeJson["6"][number_5][n][5];


                                                            string_6 += getRowString(aglutinationCodeJson["6"][number_5][n]);
                                                        }
                                                    }

                                                    aglutinationCodeJson["4"][number_3][l][7] = round(aglutinationCodeJson["4"][number_3][l][7] + aglutinationCodeJson["5"][number_4][m][7]);
                                                    aglutinationCodeJson["4"][number_3][l][8] = round(aglutinationCodeJson["4"][number_3][l][8] + aglutinationCodeJson["5"][number_4][m][8]);
                                                    aglutinationCodeJson["4"][number_3][l][9] = round(aglutinationCodeJson["4"][number_3][l][9] + aglutinationCodeJson["5"][number_4][m][9]);
                                                    aglutinationCodeJson["4"][number_3][l][5] = aglutinationCodeJson["5"][number_4][m][5];

                                                    string_5 += getRowString(aglutinationCodeJson["5"][number_4][m]);
                                                    string_5 += string_6;
                                                    string_6 = "";

                                                }
                                            }

                                            aglutinationCodeJson["3"][number_2][k][7] = round(aglutinationCodeJson["3"][number_2][k][7] + aglutinationCodeJson["4"][number_3][l][7]);
                                            aglutinationCodeJson["3"][number_2][k][8] = round(aglutinationCodeJson["3"][number_2][k][8] + aglutinationCodeJson["4"][number_3][l][8]);
                                            aglutinationCodeJson["3"][number_2][k][9] = round(aglutinationCodeJson["3"][number_2][k][9] + aglutinationCodeJson["4"][number_3][l][9]);
                                            aglutinationCodeJson["3"][number_2][k][5] = aglutinationCodeJson["4"][number_3][l][5];

                                            string_4 += getRowString(aglutinationCodeJson["4"][number_3][l]);
                                            string_4 += string_5;
                                            string_5 = "";

                                        }
                                    }

                                    aglutinationCodeJson["2"][number_1][j][7] = round(aglutinationCodeJson["2"][number_1][j][7] + aglutinationCodeJson["3"][number_2][k][7]);
                                    aglutinationCodeJson["2"][number_1][j][8] = round(aglutinationCodeJson["2"][number_1][j][8] + aglutinationCodeJson["3"][number_2][k][8]);
                                    aglutinationCodeJson["2"][number_1][j][9] = round(aglutinationCodeJson["2"][number_1][j][9] + aglutinationCodeJson["3"][number_2][k][9]);
                                    aglutinationCodeJson["2"][number_1][j][5] = aglutinationCodeJson["3"][number_2][k][5];

                                    string_3 += getRowString(aglutinationCodeJson["3"][number_2][k]);
                                    string_3 += string_4;
                                    string_4 = "";

                                }
                            }

                            aglutinationCodeJson["1"][i][7] = round(aglutinationCodeJson["1"][i][7] + aglutinationCodeJson["2"][number_1][j][7]);
                            aglutinationCodeJson["1"][i][8] = round(aglutinationCodeJson["1"][i][8] + aglutinationCodeJson["2"][number_1][j][8]);
                            aglutinationCodeJson["1"][i][9] = round(aglutinationCodeJson["1"][i][9] + aglutinationCodeJson["2"][number_1][j][9]);
                            aglutinationCodeJson["1"][i][5] = aglutinationCodeJson["2"][number_1][j][5];

                            string_2 += getRowString(aglutinationCodeJson["2"][number_1][j]);
                            string_2 += string_3;
                            string_3 = "";

                        }
                    }
                    string_1 += getRowString(aglutinationCodeJson["1"][i]);
                    string_1 += string_2;
                    string_2 = "";
                }

                localAccountString += string_1;

            }
            var fileNumber = 0;
            var fileId = "";

            if (localAccountString != "") {
                if (fileNumber == 0) {
                    fileId = saveAuxiliaryFile(localAccountString, fileNumber, 4);
                } else {
                    fileId = fileId + "|" + saveAuxiliaryFile(localAccountString, fileNumber, 4);
                }
            }
            return fileId;
        }

        function getBrCoaId(accountNumber) {
            var savedSearch = search.create({
                type: "customrecord_lmry_br_coa",
                filters: [
                    ["name", "is", accountNumber]
                ],
                columns: [
                    "internalid"
                ]
            });
            var pagedData = savedSearch.runPaged({
                pageSize: 1
            });

            var page, internalid_brcoa, columns, nivel;
            var brCoaNatureJson = {};
            pagedData.pageRanges.forEach(function(pageRange) {
                page = pagedData.fetch({
                    index: pageRange.index
                });
                //log.debug("count account",page.data.length);
                page.data.forEach(function(result) {
                    columns = result.columns;

                    auxArray = [];

                    //0. Internalid
                    internalid_brcoa = result.getValue(columns[0]);
                })
            });
            return internalid_brcoa;
        }

        function getBrCoaObjects() {
            var accountBrCoaJson = {};
            var savedSearch = search.load({
                id: "customsearch_lmry_br_account_plan"
            });

            if (hasSubsidiariesFeature) {
                var subsidiaryFilter = search.createFilter({
                    name: "subsidiary",
                    operator: search.Operator.IS,
                    values: brSetupJson['subsidiaries']
                });
                savedSearch.filters.push(subsidiaryFilter);
            }

            var brCoaFilter = search.createFilter({
                name: "formulatext",
                operator: search.Operator.ISNOTEMPTY,
                formula: "{custrecord_lmry_br_coa}"
            });
            savedSearch.filters.push(brCoaFilter);

            /*
            var brCoaDate = search.createColumn({
                name     : 'custrecord_lmry_br_coa_date_created'
            });
            savedSearch.columns.push(brCoaDate);
            */
            var pagedData = savedSearch.runPaged({
                pageSize: 1000
            });

            var page, auxArray, columns;
            var accountJson = {};
            var resultCoaArray = {};

            pagedData.pageRanges.forEach(function(pageRange) {
                page = pagedData.fetch({
                    index: pageRange.index
                });

                page.data.forEach(function(result) {
                    columns = result.columns;

                    auxArray = [];

                    //0. Br coa Id
                    auxArray[0] = result.getValue(columns[0]);

                    //1. BR Coa Name
                    auxArray[1] = result.getValue(columns[1]);

                    //2. Fecha de inclusion / alteracion
                    auxArray[2] = result.getValue(columns[2]);

                    //3. Naturaleza
                    if (result.getValue(columns[3])) {
                        if (result.getValue(columns[3]).length > 1) {
                            auxArray[3] = result.getValue(columns[3]).substring(0, 2);
                        } else {
                            auxArray[3] = '0' + result.getValue(columns[3]);
                        }
                    } else {
                        auxArray[3] = "";
                    }

                    if (auxArray[3] == '04') {
                        resultCoaArray[result.id] = auxArray[3];
                    }

                    if (accountJson[auxArray[0]] === undefined) {
                        accountJson[auxArray[0]] = auxArray;
                    }

                    accountBrCoaJson[result.id] = [auxArray[0], auxArray[1]];
                });
            });

            log.debug("accountJson", accountJson);

            var brCoaJson = {};
            var savedSearch = search.create({
                type: "customrecord_lmry_br_coa",
                filters: [
                    ["isinactive", "is", "F"]
                ],
                columns: [
                    "internalid",
                    "custrecord_lmry_br_coa_subaccount1.name",
                    "custrecord_lmry_br_coa_subaccount2.name",
                    "custrecord_lmry_br_coa_subaccount3.name",
                    "custrecord_lmry_br_coa_subaccount4.name",
                    "custrecord_lmry_br_coa_subaccount5.name",
                    "custrecord_lmry_br_coa_subaccount6.name",
                    "custrecord_lmry_br_coa_subaccount7.name",
                    "custrecord_lmry_br_coa_acc_type",
                    "name",
                    "custrecord_lmry_br_coa_name",
                    "custrecord_lmry_br_coa_accounts_nature",
                    "custrecord_lmry_br_accounting_fact",
                    search.createColumn({
                        name: "formulatext",
                        formula: "TO_CHAR({custrecord_lmry_br_coa_date_created},'DDMMYYYY')",
                        label: "Formula (Text)"
                    })
                ]
            });

            var pagedData = savedSearch.runPaged({
                pageSize: 1000
            });

            var page, auxArray, columns, nivel;
            var brCoaNatureJson = {};
            pagedData.pageRanges.forEach(function(pageRange) {
                page = pagedData.fetch({
                    index: pageRange.index
                });
                //log.debug("count account",page.data.length);
                page.data.forEach(function(result) {
                    columns = result.columns;

                    auxArray = [];

                    //0. Internalid
                    auxArray[0] = result.getValue(columns[0]);
                    //Se esta cambiando la logica, ahora el campo fecha se obtiene unicamente del br coa y este campo debera ser obligatorio.
                    /*if (accountJson[result.getValue(columns[0])] != null) {
                        //1. Fecha de inclusion / alteracion
                        auxArray[1] = accountJson[result.getValue(columns[0])][2];
                    } else{
                        */
                    //1. Fecha de inclusion / alteracion
                    //log.debug("|"+result.getValue(columns[0])+"|"+ result.getValue(columns[9]) + "|" + result.getValue(columns[13]) + "|" + result.getValue(columns[8]) + "|");
                    //log.debug("name",result.getValue(columns[9]));
                    //log.debug("valor de date2",result.getValue(columns[13]));
                    auxArray[1] = result.getValue(columns[13]);
                    //}


                    //2. Codigo de naturaleza
                    if (result.getValue(columns[11])) {
                        if (result.getValue(columns[11]).length > 1) {
                            auxArray[2] = result.getValue(columns[11]).substring(0, 2);
                        } else {
                            auxArray[2] = '0' + result.getValue(columns[11]);
                        }
                    } else {
                        auxArray[2] = "";
                    }


                    //3. Tipo de Cuenta (S: Sintetica, A: Analitica)
                    auxArray[3] = result.getText(columns[8]).substring(0, 1);

                    //4. Nivel
                    nivel = "";
                    for (var i = 7; i > 0; i--) {
                        if (result.getValue(columns[i])) {
                            nivel = i;
                            i = 0;
                        }
                    }
                    auxArray[4] = nivel;

                    //5. Numero Cuenta
                    auxArray[5] = result.getValue(columns[9]);

                    //6. Numero Cuenta Padre
                    if (nivel != "" && nivel > 1) {
                        auxArray[6] = result.getValue(columns[nivel - 1]);
                    } else {
                        auxArray[6] = "";

                    }

                    //7. Nombre Cuenta
                    auxArray[7] = result.getValue(columns[10]);

                    //8. Cod Aglutinamiento
                    auxArray[8] = "";

                    //9. Hecho Contable
                    auxArray[9] = result.getText(columns[12]);

                    if (auxArray[4] == "1") {
                        if (brCoaJson[auxArray[4]] === undefined) {
                            brCoaJson[auxArray[4]] = [];
                        }
                        brCoaJson[auxArray[4]].push(auxArray);
                    } else {
                        if (brCoaJson[auxArray[4]] === undefined) {
                            brCoaJson[auxArray[4]] = {};
                        }
                        if (brCoaJson[auxArray[4]][auxArray[6]] === undefined) {
                            brCoaJson[auxArray[4]][auxArray[6]] = [];
                        }
                        brCoaJson[auxArray[4]][auxArray[6]].push(auxArray);
                    }

                    brCoaNatureJson[auxArray[0]] = auxArray[2];
                });
            });

            return {
                brCoaJson: brCoaJson,
                resultCoaArray: resultCoaArray,
                brCoaNatureJson: brCoaNatureJson,
                accountBrCoaJson: accountBrCoaJson
            }
        }

        function getAccountsPlanFileId(brCoaJson, accountXAglutinationCodeJson) {

            log.debug("brCoaJson", brCoaJson);

            if (brCoaJson["1"] !== undefined) {

                brCoaJson["1"] = brCoaJson["1"].sort(function(a, b) {
                    return Number(a[2]) - Number(b[2])
                });
                // el metodo de arriba ordena de forma ascendente segun el codigo de naturaleza
                //El primer nivel del brCoaJson es un array
                //Los siguientes niveles son Json los padres y Array los hijos.
                //Ejemplo
                //Padre-BrCoaJson: key: nivel y el numero cuenta padre ,value: Array de la busqueda
                //Hijo-BrCoaJson: se agrega el key de numero cuenta padre y value array

                var accountNumber_1, accountNumber_2, accountNumber_3, accountNumber_4, accountNumber_5, accountNumber_6;
                var accountString_1 = "",
                    accountString_2 = "",
                    accountString_3 = "",
                    accountString_4 = "",
                    accountString_5 = "",
                    accountString_6 = "",
                    accountString_7 = "";
                var count = 0;
                for (var i = 0; i < brCoaJson["1"].length; i++) {
                    accountNumber_1 = brCoaJson["1"][i][5]; // Numero de cuenta
                    brCoaJson["1"][i][8] = accountXAglutinationCodeJson[brCoaJson["1"][i][0]] || ''; //asignar los codigos de aglutinacion a cada br coa
                    count++;
                    if (brCoaJson["2"] !== undefined && brCoaJson["2"][accountNumber_1] !== undefined) {
                        for (var j = 0; j < brCoaJson["2"][accountNumber_1].length; j++) {
                            count++;
                            accountNumber_2 = brCoaJson["2"][accountNumber_1][j][5];
                            brCoaJson["2"][accountNumber_1][j][8] = accountXAglutinationCodeJson[brCoaJson["2"][accountNumber_1][j][0]] || '';

                            if (brCoaJson["3"] !== undefined && brCoaJson["3"][accountNumber_2] !== undefined) {
                                for (var k = 0; k < brCoaJson["3"][accountNumber_2].length; k++) {
                                    count++;
                                    accountNumber_3 = brCoaJson["3"][accountNumber_2][k][5];
                                    brCoaJson["3"][accountNumber_2][k][8] = accountXAglutinationCodeJson[brCoaJson["3"][accountNumber_2][k][0]] || '';

                                    if (brCoaJson["4"] !== undefined && brCoaJson["4"][accountNumber_3] !== undefined) {
                                        for (var l = 0; l < brCoaJson["4"][accountNumber_3].length; l++) {
                                            count++;
                                            accountNumber_4 = brCoaJson["4"][accountNumber_3][l][5];
                                            brCoaJson["4"][accountNumber_3][l][8] = accountXAglutinationCodeJson[brCoaJson["4"][accountNumber_3][l][0]] || '';

                                            if (brCoaJson["5"] !== undefined && brCoaJson["5"][accountNumber_4] !== undefined) {
                                                for (var m = 0; m < brCoaJson["5"][accountNumber_4].length; m++) {
                                                    count++;
                                                    accountNumber_5 = brCoaJson["5"][accountNumber_4][m][5];
                                                    brCoaJson["5"][accountNumber_4][m][8] = accountXAglutinationCodeJson[brCoaJson["5"][accountNumber_4][m][0]] || '';

                                                    if (brCoaJson["6"] !== undefined && brCoaJson["6"][accountNumber_5] !== undefined) {
                                                        for (var n = 0; n < brCoaJson["6"][accountNumber_5].length; n++) {
                                                            count++;
                                                            accountNumber_6 = brCoaJson["6"][accountNumber_5][n][5];
                                                            brCoaJson["6"][accountNumber_5][n][8] = accountXAglutinationCodeJson[brCoaJson["6"][accountNumber_5][n][0]] || '';

                                                            if (brCoaJson["7"] !== undefined && brCoaJson["7"][accountNumber_6] !== undefined) {
                                                                for (var o = 0; o < brCoaJson["7"][accountNumber_6].length; o++) {
                                                                    count++;
                                                                    //Se esta comentando el campo de fecha para que no se obtenga del hijo en las cuentas sinteticas.
                                                                    //brCoaJson["6"][accountNumber_5][n][1] = brCoaJson["7"][accountNumber_6][0][1];
                                                                    //brCoaJson["6"][accountNumber_5][n][2] = brCoaJson["7"][accountNumber_6][0][2];
                                                                    brCoaJson["7"][accountNumber_6][o][8] = accountXAglutinationCodeJson[brCoaJson["7"][accountNumber_6][o][0]] || '';
                                                                    accountString_7 += getRowString(brCoaJson["7"][accountNumber_6][o]);

                                                                }
                                                            }
                                                            //Se esta comentando el campo de fecha para que no se obtenga del hijo en las cuentas sinteticas.
                                                            //brCoaJson["5"][accountNumber_4][m][1] = brCoaJson["6"][accountNumber_5][0][1];
                                                            //brCoaJson["5"][accountNumber_4][m][2] = brCoaJson["6"][accountNumber_5][0][2];
                                                            accountString_6 += getRowString(brCoaJson["6"][accountNumber_5][n]);
                                                            accountString_6 += accountString_7;
                                                            accountString_7 = "";

                                                        }
                                                    }

                                                    //brCoaJson["4"][accountNumber_3][l][1] = brCoaJson["5"][accountNumber_4][0][1];
                                                    //brCoaJson["4"][accountNumber_3][l][2] = brCoaJson["5"][accountNumber_4][0][2];

                                                    accountString_5 += getRowString(brCoaJson["5"][accountNumber_4][m]);
                                                    accountString_5 += accountString_6;
                                                    accountString_6 = "";

                                                }
                                            }

                                            //brCoaJson["3"][accountNumber_2][k][1] = brCoaJson["4"][accountNumber_3][0][1];
                                            //brCoaJson["3"][accountNumber_2][k][2] = brCoaJson["4"][accountNumber_3][0][2];

                                            accountString_4 += getRowString(brCoaJson["4"][accountNumber_3][l]);
                                            accountString_4 += accountString_5;
                                            accountString_5 = "";
                                        }
                                    }

                                    //brCoaJson["2"][accountNumber_1][j][1] = brCoaJson["3"][accountNumber_2][0][1];
                                    //brCoaJson["2"][accountNumber_1][j][2] = brCoaJson["3"][accountNumber_2][0][2];

                                    accountString_3 += getRowString(brCoaJson["3"][accountNumber_2][k]);
                                    accountString_3 += accountString_4;
                                    accountString_4 = "";
                                }
                            }

                            //brCoaJson["1"][i][1] = brCoaJson["2"][accountNumber_1][0][1];
                            //brCoaJson["1"][i][2] = brCoaJson["2"][accountNumber_1][0][2];

                            accountString_2 += getRowString(brCoaJson["2"][accountNumber_1][j]);
                            accountString_2 += accountString_3;
                            accountString_3 = "";

                        }
                    }

                    accountString_1 += getRowString(brCoaJson["1"][i]);
                    accountString_1 += accountString_2;
                    accountString_2 = "";
                }

            }

            log.debug("String", accountString_1);
            log.debug("CONTO", count);

            var accountsFileId = "",
                accountFileNumber = 0;
            if (accountString_1 != "") {
                accountsFileId = saveAuxiliaryFile(accountString_1, accountFileNumber, 3);
            }

            return accountsFileId;
        }

        function getRowString(array) {
            var rowString = "";
            for (var i = 0; i < array.length; i++) {
                rowString += array[i];
                if (i != array.length - 1) {
                    rowString += "|";
                } else {
                    rowString += "\r\n";
                }
            }
            return rowString;
        }

        function getPeriodsFromCalendarFiscal(type) {
            //1.-saldo inicial
            //2.-periodos año
            //3.-special period
            var fiscalCalendar = search.lookupFields({
                type: search.Type.SUBSIDIARY,
                id: paramSubsidiary,
                columns: ['fiscalcalendar']
            }).fiscalcalendar[0].value;
            //log.debug("calendario Fiscal, type " + type, fiscalCalendar);

            var periodsArray = [];
            var periodStartDate = search.lookupFields({
                type: search.Type.ACCOUNTING_PERIOD,
                id: paramPeriod,
                columns: ["startdate"]
            }).startdate;

            log.debug("periodStartDate", periodStartDate);

            if (type == 1) {
                var savedSearch = search.create({
                    type: "accountingperiod",
                    filters: [
                        ['startdate', 'before', periodStartDate],
                        "AND", ["isquarter", "is", "F"],
                        "AND", ["isyear", "is", "F"],
                        "AND", ["fiscalcalendar", "anyof", fiscalCalendar]
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
                });
            } else if (type == 2) {
                var savedSearch = search.create({
                    type: "accountingperiod",
                    filters: [
                        ["parent", "anyof", paramPeriod],
                        "AND", ["fiscalcalendar", "anyof", fiscalCalendar],
                        "AND", ["isquarter", "is", "F"],
                        "AND", ["isyear", "is", "F"]
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
                });
            } else if (type == 3) {
                log.debug("CAMPO DE 3", "LLEGO AQUI");
                var endDateObject = format.parse({
                    type: format.Type.DATE,
                    value: periodStartDate
                });
                var fullYear = endDateObject.getFullYear();
                log.debug("valor del anio", fullYear);

                var savedSearch = search.create({
                    type: "customrecord_lmry_special_accountperiod",
                    filters: [
                        search.createFilter({
                            name: 'custrecord_lmry_anio_fisco',
                            operator: search.Operator.IS,
                            values: fullYear
                        })
                    ],
                    columns: [
                        search.createColumn({
                            name: 'custrecord_lmry_accounting_period',
                            sort: search.Sort.ASC
                        })
                    ]
                });
            }
            //else if(type == 4){
            //     var savedSearch = search.create({
            //         type    : "accountingperiod",
            //         filters :
            //         [
            //             ['startdate', 'before', periodStartDate],
            //             "AND",
            //             ["fiscalcalendar","anyof",fiscalCalendar],
            //             "AND",
            //             ["isquarter","is","F"],
            //             "AND",
            //             ["isyear","is","F"]
            //         ],
            //         columns : [
            //             search.createColumn({
            //                 name : 'internalid',
            //                 sort : search.Sort.ASC
            //             }),
            //             search.createColumn({
            //                 name : 'startdate'
            //             })
            //         ]
            //     });

            //   }
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
                    //log.debug("valor de result",result);
                    periodsArray.push(result.getValue(columns[0]));
                });
            });

            return periodsArray;
        }

        function getAccountsInitialBalance(accountBrCoaJson) {
            var initialBalanceJson = {};
            var periodsArray = [];
            var savedSearch = search.load({
                id: "customsearch_lmry_br_ini_account_balance"
            });
            // Se esta agregando period end a la busqueda para saldo inicial
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
                    values: brSetupJson['subsidiaries']
                });
                savedSearch.filters.push(subsidiaryFilter);
            }

            if (hasMultipleCalendars) {
                periodsArray = getPeriodsFromCalendarFiscal(1);
                log.debug("periodsArray en initial balance", periodsArray);

                if (periodsArray.length) {
                    var formula = getPeriodsFormulaText(periodsArray, 2);
                    //log.debug("Formula getAccountsInitialBalance", formula);
                    var periodsFilter = search.createFilter({
                        name: "formulatext",
                        formula: formula,
                        operator: search.Operator.IS,
                        values: "1"
                    });
                    savedSearch.filters.push(periodsFilter);
                    log.debug("Valor de formula con periods ids", formula);
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

            if (hasMultibookFeature) {
                var accountTypeFilter = search.createFilter({
                    name: 'accounttype',
                    join: 'accountingtransaction',
                    operator: search.Operator.NONEOF,
                    values: ["@NONE@", "Stat"]
                });
                savedSearch.filters.push(accountTypeFilter);

                var amountNotCeroFilter = search.createFilter({
                    name: 'formulanumeric',
                    formula: 'NVL({accountingtransaction.debitamount},0)-NVL({accountingtransaction.creditamount},0)',
                    operator: search.Operator.NOTEQUALTO,
                    values: '0'
                });
                savedSearch.filters.push(amountNotCeroFilter);

                var multibookAccountColumn = search.createColumn({
                    name: 'formulanumeric',
                    formula: '{accountingtransaction.account.id}',
                    summary: 'GROUP'
                });
                savedSearch.columns.push(multibookAccountColumn);

                var multibookFilter = search.createFilter({
                    name: 'accountingbook',
                    join: 'accountingtransaction',
                    operator: search.Operator.IS,
                    values: [paramMultibook]
                });
                savedSearch.filters.push(multibookFilter);

                var multibookAmount = search.createColumn({
                    name: 'formulacurrency',
                    formula: 'NVL({accountingtransaction.debitamount},0) - NVL({accountingtransaction.creditamount},0)',
                    summary: 'SUM',
                });
                savedSearch.columns.push(multibookAmount);
            } else {
                var accountColumn = search.createColumn({
                    name: 'formulanumeric',
                    formula: '{account.internalid}',
                    summary: 'GROUP'
                });
                savedSearch.columns.push(accountColumn);

                var accountTypeFilter = search.createFilter({
                    name: 'accounttype',
                    operator: search.Operator.NONEOF,
                    values: ["@NONE@", "Stat"]
                });
                savedSearch.filters.push(accountTypeFilter);

                var amountNotCeroFilter = search.createFilter({
                    name: 'formulanumeric',
                    formula: 'NVL({debitamount},0)-NVL({creditamount},0)',
                    operator: search.Operator.NOTEQUALTO,
                    values: '0'
                });
                savedSearch.filters.push(amountNotCeroFilter);
            }
            //0.- Saldo inicial <-----------------Si se usa esto no se usa el 3
            //1.- Centro de costos
            //2.- Valor de internal id de la cuenta
            //3.- saldo inicial para el multibook <--------si se usa esto no se usa el 0
            var pagedData = savedSearch.runPaged({
                pageSize: 1000
            });

            if (!(hasMultipleCalendars && !periodsArray.length)) {
                var page, auxArray, columns;
                pagedData.pageRanges.forEach(function(pageRange) {
                    page = pagedData.fetch({
                        index: pageRange.index
                    });

                    page.data.forEach(function(result) {
                        columns = result.columns;

                        auxArray = [];

                        /*

                        // 0. Br coa Id
                        auxArray[0] = result.getValue(columns[0]);

                        // 1. Codigo de cuenta analitica
                        auxArray[1] = result.getValue(columns[1]);
                        */

                        // 0. Saldo Inicial
                        if (hasMultibookFeature) {
                            auxArray[0] = Number(result.getValue(columns[3]));
                        } else {
                            auxArray[0] = Number(result.getValue(columns[0]));
                        }

                        // 1. Centro de Costo
                        if (!brSetupJson["genCostCenter"]) {
                            auxArray[1] = '0';
                        } else {
                            auxArray[1] = result.getValue(columns[1]) || '0';
                        }

                        if (accountBrCoaJson[result.getValue(columns[2])] !== undefined) {
                            // 2. Br coa Id
                            auxArray[2] = accountBrCoaJson[result.getValue(columns[2])][0];
                            //log.debug("ESTE ES EL VALOR DEL BR COA ID", auxArray[2]);
                            // 3. Codigo de cuenta analitica
                            auxArray[3] = accountBrCoaJson[result.getValue(columns[2])][1];

                            if (initialBalanceJson[auxArray[2]] === undefined) {
                                initialBalanceJson[auxArray[2]] = {
                                    "saldo": 0,
                                    "departments": {}
                                };
                            }
                            if (initialBalanceJson[auxArray[2]]["departments"][auxArray[1]] === undefined) {
                                initialBalanceJson[auxArray[2]]["departments"][auxArray[1]] = [auxArray[3], auxArray[0], auxArray[2]];
                            } else {
                                initialBalanceJson[auxArray[2]]["departments"][auxArray[1]][1] = round(initialBalanceJson[auxArray[2]]["departments"][auxArray[1]][1] + auxArray[0]);
                            }
                            initialBalanceJson[auxArray[2]]["saldo"] = round(initialBalanceJson[auxArray[2]]["saldo"] + auxArray[0]);
                        }


                        /*
                                              if (auxArray[0] != "" && auxArray[0] != "- None -" && Number(auxArray[2]) != 0) {
                                                  if (initialBalanceJson[auxArray[0]] === undefined) {
                                                      initialBalanceJson[auxArray[0]] = {
                                                          "saldo"       : 0,
                                                          "departments" : {}
                                                      };
                                                  }

                                                  initialBalanceJson[auxArray[0]]["departments"][auxArray[3]] = [auxArray[1], auxArray[2]];
                                                  initialBalanceJson[auxArray[0]]["saldo"] = round(initialBalanceJson[auxArray[0]]["saldo"] + auxArray[2]);
                                              }*/

                        //initialBalanceJson[result.getValue(columns[0])] = 0;
                    });
                });
            }

            return initialBalanceJson;
        }

        function getAccountsBalanceBeforeClosing(resultCoaArray, balanceBeforeClosingJson, accountBrCoaJson) {
            log.debug("resultCoaArray", resultCoaArray);
            licenses = libFeature.getLicenses(paramSubsidiary);
            feature_special_account = libFeature.getAuthorization(599, licenses);

            if (hasMultipleCalendars) {
                var dateBeforeClosing = "";
                var dateInitialClosing = "";
                var internalIdAjuste;
                var fiscalCalendar = search.lookupFields({
                    type: search.Type.SUBSIDIARY,
                    id: paramSubsidiary,
                    columns: ['fiscalcalendar']
                }).fiscalcalendar[0].value;
                log.debug("calendario Fiscal", fiscalCalendar);

                var savedSearch = search.create({
                    type: "accountingperiod",
                    filters: [
                        ["isadjust", "is", "T"],
                        "AND", ["parent", "anyof", paramPeriod],
                        "AND", ["fiscalcalendar", "anyof", fiscalCalendar]
                    ],
                    columns: ["internalid", "startdate"]
                });
            } else {
                var savedSearch = search.create({
                    type: "accountingperiod",
                    filters: [
                        ["isadjust", "is", "T"],
                        "AND", ["parent", "anyof", paramPeriod]
                    ],
                    columns: ["internalid", "startdate"]
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
                    internalIdAjuste = result.getValue(columns[0]);
                    dateBeforeClosing = result.getValue(columns[1]);
                });
            });

            if (feature_special_account && internalIdAjuste) {
                var savedSearch = search.create({
                    type: "customrecord_lmry_special_accountperiod",
                    filters: [
                        ["custrecord_lmry_accounting_period", "anyof", internalIdAjuste],
                    ],
                    columns: ["custrecord_lmry_date_ini"]
                });
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
                        dateBeforeClosing = result.getValue(columns[0]);
                    });
                });
            }

            log.debug("valor del datebeforeclosing ", dateBeforeClosing);

            var savedSearch = search.load({
                id: "customsearch_lmry_br_ini_account_balance"
            });

            if (hasSubsidiariesFeature) {
                var subsidiaryFilter = search.createFilter({
                    name: "subsidiary",
                    operator: search.Operator.IS,
                    values: brSetupJson['subsidiaries']
                });
                savedSearch.filters.push(subsidiaryFilter);
            }
            if (dateBeforeClosing) {
                var startdate = search.lookupFields({
                    type: search.Type.ACCOUNTING_PERIOD,
                    id: paramPeriod,
                    columns: ['startdate']
                }).startdate;
                /*
                var startDateObject = format.parse({
                type : format.Type.DATE,
                value : startdate
                });*/
                log.debug("lastDate 1", dateBeforeClosing);
                log.debug("firstDate 1", startdate);

                var beforeDateFilter = search.createFilter({
                    name: "formuladate",
                    formula: "NVL({custbody_lmry_register_date}, {trandate})",
                    operator: search.Operator.ONORBEFORE,
                    values: [dateBeforeClosing]
                });
                savedSearch.filters.push(beforeDateFilter);
                var afterDateFilter = search.createFilter({
                    name: "formuladate",
                    formula: "NVL({custbody_lmry_register_date}, {trandate})",
                    operator: search.Operator.ONORAFTER,
                    values: [startdate]
                });
                savedSearch.filters.push(afterDateFilter);

            } else {
                var startdate = search.lookupFields({
                    type: search.Type.ACCOUNTING_PERIOD,
                    id: paramPeriod,
                    columns: ['startdate']
                }).startdate;

                var startDateObject = format.parse({
                    type: format.Type.DATE,
                    value: startdate
                });

                var lastDate = format.format({
                    type: format.Type.DATE,
                    value: new Date(startDateObject.getFullYear(), 11, 31)
                });
                var firstDate = format.format({
                    type: format.Type.DATE,
                    value: new Date(startDateObject.getFullYear(), 0, 1)
                });

                dateBeforeClosing = lastDate;
                log.debug("lastDate", lastDate);
                log.debug("firstDate", firstDate);

                /*
                var beforeDateFilter = search.createFilter({
                    name     : "trandate",
                    operator : search.Operator.ONORBEFORE,
                    values   : [lastDate]
                });
                savedSearch.filters.push(beforeDateFilter);
                */
                var beforeDateFilter = search.createFilter({
                    name: "formuladate",
                    formula: "NVL({custbody_lmry_register_date}, {trandate})",
                    operator: search.Operator.ONORBEFORE,
                    values: [lastDate]
                });
                savedSearch.filters.push(beforeDateFilter);
                var afterDateFilter = search.createFilter({
                    name: "formuladate",
                    formula: "NVL({custbody_lmry_register_date}, {trandate})",
                    operator: search.Operator.ONORAFTER,
                    values: [firstDate]
                });
                savedSearch.filters.push(afterDateFilter);
            }
            //    }


            var journalEdnDateFilter = search.createFilter({
                name: "type",
                operator: search.Operator.NONEOF,
                values: "PEJrnl"
            });
            savedSearch.filters.push(journalEdnDateFilter);


            var isAdjustPeriodFilter = search.createFilter({
                name: "isadjust",
                join: "accountingperiod",
                operator: search.Operator.IS,
                values: "F"
            });
            savedSearch.filters.push(isAdjustPeriodFilter);
            /*
            var cargaInicialFilter = search.createFilter({
                name     : "custbody_lmry_carga_inicial",
                operator : search.Operator.IS,
                values   : "F"
            });
            savedSearch.filters.push(cargaInicialFilter);
            */

            //var formula = "CASE WHEN {custbody_lmry_carga_inicial} = 'T' AND {trandate} = '" +  dateBeforeClosing + "' THEN 1 ELSE 0 END";
            //var formula = "CASE WHEN {custbody_lmry_carga_inicial} = 'T' AND to_char({trandate}, 'DD-MM-YYYY') = '31-12-2020' THEN 1 ELSE 0 END";
            //log.debug("formula corregida", formula);

            /*var noAsientoCierreFilter = search.createFilter({
                name     : 'formulatext',
                operator : search.Operator.IS,
                formula  : formula,
                values   : '0'
            });
            savedSearch.filters.push(noAsientoCierreFilter);
            */


            /*
            log.debug("resultCoaArray", resultCoaArray);
            if (resultCoaArray.length) {
                var formula = getFormulaText(resultCoaArray);
                log.debug("formula", formula);
                var accountTypeFilter = search.createFilter({
                    name     : "formulatext",
                    formula  : formula,
                    operator : search.Operator.IS,
                    values   : "1"
                });
                savedSearch.filters.push(accountTypeFilter);
            }
            */

            if (hasMultibookFeature) {
                var multibookAccountColumn = search.createColumn({
                    name: 'formulanumeric',
                    formula: '{accountingtransaction.account.id}',
                    summary: 'GROUP'
                });
                savedSearch.columns.push(multibookAccountColumn);

                var accountTypeFilter = search.createFilter({
                    name: 'accounttype',
                    join: 'accountingtransaction',
                    operator: search.Operator.NONEOF,
                    values: ["@NONE@", "Stat"]
                });
                savedSearch.filters.push(accountTypeFilter);

                var amountNotCeroFilter = search.createFilter({
                    name: 'formulanumeric',
                    formula: 'NVL({accountingtransaction.debitamount},0)-NVL({accountingtransaction.creditamount},0)',
                    operator: search.Operator.NOTEQUALTO,
                    values: '0'
                });
                savedSearch.filters.push(amountNotCeroFilter);

                var multibookFilter = search.createFilter({
                    name: 'accountingbook',
                    join: 'accountingtransaction',
                    operator: search.Operator.IS,
                    values: [paramMultibook]
                });
                savedSearch.filters.push(multibookFilter);

                var multibookAmount = search.createColumn({
                    name: 'formulacurrency',
                    formula: 'NVL({accountingtransaction.debitamount},0) - NVL({accountingtransaction.creditamount},0)',
                    summary: 'SUM',
                });
                savedSearch.columns.push(multibookAmount);
            } else {
                var accountColumn = search.createColumn({
                    name: 'formulanumeric',
                    formula: '{account.internalid}',
                    summary: 'GROUP'
                });
                savedSearch.columns.push(accountColumn);

                var accountTypeFilter = search.createFilter({
                    name: 'accounttype',
                    operator: search.Operator.NONEOF,
                    values: ["@NONE@", "Stat"]
                });
                savedSearch.filters.push(accountTypeFilter);

                var amountNotCeroFilter = search.createFilter({
                    name: 'formulanumeric',
                    formula: 'NVL({debitamount},0)-NVL({creditamount},0)',
                    operator: search.Operator.NOTEQUALTO,
                    values: '0'
                });
                savedSearch.filters.push(amountNotCeroFilter);
            }
            /*
            var postingPeriodColumn = search.createColumn({
                name    : 'postingperiod',
                summary : 'GROUP'
            });
            savedSearch.columns.push(postingPeriodColumn);

            var jsonAjuste = obtenerPeriodosMensuales();
            */
            var pagedData = savedSearch.runPaged({
                pageSize: 1000
            });

            var page, auxArray, columns, rowString = "",
                resultJson = {};
            pagedData.pageRanges.forEach(function(pageRange) {
                page = pagedData.fetch({
                    index: pageRange.index
                });

                page.data.forEach(function(result) {
                    //var columnaPostingPeriod;
                    columns = result.columns;
                    /*if(hasMultibookFeature){
                        columnaPostingPeriod = jsonAjuste[result.getValue(columns[4])];
                    }else{
                        columnaPostingPeriod = jsonAjuste[result.getValue(columns[3])];
                    }
                    log.debug("valor de columnaPostingPeriod",columnaPostingPeriod);
                    */
                    //if( columnaPostingPeriod == true ){

                    auxArray = [];
                    if (resultCoaArray[result.getValue(columns[2])] !== undefined) {
                        /*
            // 0. Br coa Id
            auxArray[0] = result.getValue(columns[0]);

            // 1. Codigo de cuenta analitica
            auxArray[1] = result.getValue(columns[1]);
            */

                        // 0. Saldo Inicial
                        if (hasMultibookFeature) {
                            auxArray[0] = Number(result.getValue(columns[3]));
                        } else {
                            auxArray[0] = Number(result.getValue(columns[0]));
                        }

                        // 1. Centro de Costo
                        if (!brSetupJson["genCostCenter"]) {
                            auxArray[1] = '0';
                        } else {
                            auxArray[1] = result.getValue(columns[1]) || '0';
                        }

                        if (accountBrCoaJson[result.getValue(columns[2])] !== undefined) {
                            // 2. Br coa Id
                            auxArray[2] = accountBrCoaJson[result.getValue(columns[2])][0];

                            // 3. Codigo de cuenta analitica
                            auxArray[3] = accountBrCoaJson[result.getValue(columns[2])][1];

                            // 4. Variable del internalId cuenta, se usara en el EFD

                            auxArray[4] = auxArray[2];

                            if (balanceBeforeClosingJson[auxArray[2]] === undefined) {
                                balanceBeforeClosingJson[auxArray[2]] = 0
                            }
                            balanceBeforeClosingJson[auxArray[2]] = round(balanceBeforeClosingJson[auxArray[2]] + auxArray[0]);

                            if (resultJson[auxArray[2]] === undefined) {
                                resultJson[auxArray[2]] = {};
                            }
                            if (resultJson[auxArray[2]][auxArray[1]] === undefined) {
                                resultJson[auxArray[2]][auxArray[1]] = auxArray;
                            } else {
                                resultJson[auxArray[2]][auxArray[1]][0] = round(resultJson[auxArray[2]][auxArray[1]][0] + auxArray[0]);
                            }
                        }
                        //log.debug("Valor de aux Array", auxArray);
                    }
                    //}
                });

            });

            for (var brCoaId in resultJson) {
                for (var departmentId in resultJson[brCoaId]) {
                    rowString += "12|" + resultJson[brCoaId][departmentId][3] + "|" + resultJson[brCoaId][departmentId][1] + "|" + resultJson[brCoaId][departmentId][0] + "|" + resultJson[brCoaId][departmentId][4] + "\r\n";
                }
            }

            log.debug("balanceBeforeClosingJson", balanceBeforeClosingJson);

            return rowString;
        }

        function getPeriodsFormulaText(periodsArray, tipo) {
            var formula;
            var periodEndDate = search.lookupFields({
                type: search.Type.ACCOUNTING_PERIOD,
                id: paramPeriod,
                columns: ["enddate"]
            }).enddate;

            if (tipo == 1) {
                formula = "CASE WHEN {postingperiod.id} IN (";
                for (var i = 0; i < periodsArray.length; i++) {
                    if (i == periodsArray.length - 1) {
                        formula += periodsArray[i] + " ) ";
                    } else {
                        formula += periodsArray[i] + ",";
                    }
                }
                formula += " THEN 1 ELSE 0 END";
            } else if (tipo == 2) {
                formula = "CASE WHEN {postingperiod.id} IN (";
                for (var i = 0; i < periodsArray.length; i++) {
                    if (i == periodsArray.length - 1) {
                        formula += periodsArray[i] + " ) ";
                    } else {
                        formula += periodsArray[i] + ",";
                    }
                }
                formula += "OR ({custbody_lmry_carga_inicial} = 'T' and NVL({custbody_lmry_register_date},{trandate}) <='" + periodEndDate + "')";
                //formula += "OR {custbody_lmry_carga_inicial} = 'T'";
                formula += " THEN 1 ELSE 0 END";
            }
            return formula;
        }

        function getFormulaText(resultAccount) {
            log.debug("getFormulaText", resultAccount + "|" + resultAccount.length);

            var formula = "CASE WHEN ";
            if (hasMultibookFeature) {
                formula += "{accountingtransaction.account.id} IN (" + resultAccount.join(",") + ")";
            } else {
                formula += "{account.internalid} IN (" + resultAccount.join(",") + ")";
            }

            formula += " THEN 1 ELSE 0 END";
            return formula;
        }

        function getFileName(fileNumber, fileType) {
            var userRecord = runtime.getCurrentUser();

            if (fileType == 1) {
                var fileName = "Transactions_I250_ECD_" + fileNumber + ".txt";
            } else if (fileType == 2) {
                var fileName = "AccountsForPeriods_I150_ECD_" + fileNumber + ".txt";
            } else if (fileType == 3) {
                var fileName = "Accounts_Plan_ECD_" + fileNumber + ".txt";
            } else if (fileType == 4) {
                var fileName = "Local_Account_Accounting_Group_ECD_" + fileNumber + ".txt";
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
                    encoding: file.Encoding.ISO_8859_1,
                    folder: folderId
                });
                return auxiliaryFile.save();
            }
        }

        function lengthInUtf8Bytes(str) {
            var m = encodeURIComponent(str).match(/%[89ABab]/g);
            return str.length + (m ? m.length : 0);
        }

        function callScheduleScript(transactionFileId, accountsForPeriodFileId, accountsFileId, localAccountAndAccountingGroupFileId) {
            var params = {};
            var scriptId = "";
            var deploymentId = "";
            log.debug("paramBookType", paramBookType);

            if (paramBookType == "1") {
                log.debug("ENTRO A SCHDL", "");

                params["custscript_lmry_br_ecd_period"] = paramPeriod;

                params["custscript_lmry_br_ecd_subsi"] = paramSubsidiary;

                params["custscript_lmry_br_ecd_multi"] = paramMultibook;

                params["custscript_lmry_br_ecd_tipo_declaracion"] = paramDeclarationType;

                params["custscript_lmry_br_ecd_idrpt"] = paramReportId;

                params["custscript_lmry_br_ecd_recordid"] = paramLogId;

                params["custscript_lmry_br_ecd_tipo_libro"] = paramBookType;

                params["custscript_lmry_br_ecd_tranidfile"] = transactionFileId;

                params["custscript_lmry_br_ecd_accper_idfile"] = accountsForPeriodFileId;

                params["custscript_lmry_br_ecd_accidfile"] = accountsFileId;

                params["custscript_lmry_br_ecd_la_ag_idfile"] = localAccountAndAccountingGroupFileId;

                params["custscript_lmry_br_ecd_num_orden"] = paramNumOrder;
                params["custscript_lmry_br_ecd_date_constitution"] = paramdateConstitution;

                scriptId = "customscript_lmry_br_ecd_schdl";
                deploymentId = "customdeploy_lmry_br_ecd_schdl";

            } else {
                params["custscript_lmry_br_ecd_r_period"] = paramPeriod;

                params["custscript_lmry_br_ecd_r_sub"] = paramSubsidiary;

                params["custscript_lmry_br_ecd_r_mlb"] = paramMultibook;

                params["custscript_lmry_br_ecd_r_tipo_decla"] = paramDeclarationType;

                params["custscript_lmry_br_ecd_r_idrpt"] = paramReportId;

                params["custscript_lmry_br_ecd_r_recordid"] = paramLogId;

                params["custscript_lmry_br_ecd_r_tipo_libro"] = paramBookType;

                params["custscript_lmry_br_ecd_r_tranidfile"] = transactionFileId;

                params["custscript_lmry_br_ecd_r_accper_idfile"] = accountsForPeriodFileId;

                params["custscript_lmry_br_ecd_r_accidfile"] = accountsFileId;

                params["custscript_lmry_br_ecd_r_la_ag_idfile"] = localAccountAndAccountingGroupFileId;

                params["custscript_lmry_br_ecd_r_num_orden"] = paramNumOrder;


                scriptId = "customscript_lmry_br_ecd_r_schdl";
                deploymentId = "customdeploy_lmry_br_ecd_r_schdl";
            }

            log.debug("parametros enviados", params);
            var taskScript = task.create({
                taskType: task.TaskType.SCHEDULED_SCRIPT,
                scriptId: scriptId,
                deploymentId: deploymentId,
                params: params
            });
            taskScript.submit();
        }

        function getBrSetup(subsidiary) {
            var brSetupJson = {};
            if (subsidiary != "") {
                var savedSearch = search.create({
                    type: 'customrecord_lmry_br_setup_rpt_dctf',
                    filters: [
                        ['custrecord_lmry_br_rpt_subsidiary', 'anyof', subsidiary]
                    ],
                    columns: ['custrecord_lmry_br_filiales', 'custrecord_lmry_br_gen_cost_center']
                });

                var result = savedSearch.run().getRange(0, 1);

                if (result && result.length != 0) {
                    brSetupJson["subsidiaries"] = [];

                    var subsidiaries = result[0].getValue("custrecord_lmry_br_filiales").split(',');
                    for (var i = 0; i < subsidiaries.length; i++) {
                        brSetupJson["subsidiaries"].push(subsidiaries[i]);
                    }
                    brSetupJson["subsidiaries"].push(subsidiary);

                    brSetupJson["genCostCenter"] = result[0].getValue("custrecord_lmry_br_gen_cost_center");
                }
            }
            return brSetupJson;
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
            log.debug("error", subsidiariesArray);
            return subsidiariesArray;
        }

        function completeZero(tamano, valor) {
            var strValor = valor + '';
            var lengthStrValor = strValor.length;
            var nuevoValor = valor + '';

            if (lengthStrValor <= tamano) {
                if (tamano != lengthStrValor) {
                    for (var i = lengthStrValor; i < tamano; i++) {
                        nuevoValor = '0' + nuevoValor;
                    }
                }
                return nuevoValor;
            } else {
                return nuevoValor.substring(0, tamano);
            }
        }

        function getDateFormat(date) {
            return "" + completeZero(2, date.getDate()) + completeZero(2, date.getMonth() + 1) + date.getFullYear();
        }

        function round(number) {
            return Math.round(Number(number) * 100) / 100;
        }

        function NoData(hayError, tipo) {

            if (hayError && tipo == 1) {
                var message = "Ocurrio un error inesperado en la ejecucion del reporte.";
            } else if (hayError && tipo == 2) {
                var message = "No se ha configurado correctamente.";
            } else {
                var message = "No existe informacion para los criterios seleccionados.";
            }

            var logRecord = record.load({
                type: 'customrecord_lmry_br_rpt_generator_log',
                id: paramLogId
            });

            //Nombre de Archivo
            logRecord.setValue({
                fieldId: 'custrecord_lmry_br_rg_name_field',
                value: message
            });

            logRecord.setValue({
                fieldId: 'custrecord_lmry_br_rg_report_record',
                value: paramReportId
            });

            var logRecordId = logRecord.save();
        }

        function round2(num) {
            return parseFloat(Math.round(parseFloat(num) * 1e2 + 1e-14) / 1e2);
        }

        return {
            getInputData: getInputData,
            //map: map,
            reduce: reduce,
            summarize: summarize
        };
    });