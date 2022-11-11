/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for Inventory Balance Library                  ||
||                                                              ||
||  File Name: LMRY_BR_ECD_MPRD_SEARCH_V.2.0.js          		||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Dec 11 2019  Alexandra     Use Script 2.0           ||
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

        var paramSubsidiary = objContext.getParameter("custscript_lmry_br_ecd_mprd_subsi");
        var paramPeriod = objContext.getParameter("custscript_lmry_br_ecd_mprd_period");
        var paramMultibook = objContext.getParameter("custscript_lmry_br_ecd_mprd_multi");
        var paramLogId = objContext.getParameter("custscript_lmry_br_ecd_mprd_idlog");
        var paramReportId = objContext.getParameter("custscript_lmry_br_ecd_mprd_idrep");
        var paramDeclarationType = objContext.getParameter("custscript_lmry_br_ecd_mprd_dectype");
        var paramBookType = objContext.getParameter("custscript_lmry_br_ecd_mprd_booktype");
        var paramNumOrder = objContext.getParameter("custscript_lmry_br_ecd_mprd_num_orden");
        var paramIdsFile = objContext.getParameter("custscript_lmry_br_ecd_mprd_idfile");
        var paramBucle = objContext.getParameter("custscript_lmry_br_ecd_mprd_bucle");
        var paramDateC = objContext.getParameter("custscript_lmry_br_ecd_mprd_constitution");

        var hasSubsidiariesFeature = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
        var hasMultibookFeature = runtime.isFeatureInEffect({ feature: "MULTIBOOK" });
        var hasMultipleCalendars = runtime.isFeatureInEffect({ feature: "MULTIPLECALENDARS" });
        var hasJobsFeature = runtime.isFeatureInEffect({ feature: "JOBS" });
        var hasAdvancedJobsFeature = runtime.isFeatureInEffect({ feature: "ADVANCEDJOBS" });
        var hasCustomGlines = runtime.isFeatureInEffect({ feature: "CUSTOMGLLINES" })

        var language = runtime.getCurrentScript().getParameter("LANGUAGE").substring(0, 2);

        var featurePeriodEnd = runtime.isFeatureInEffect({
            feature: "PERIODENDJOURNALENTRIES"
        });

        var brSetupJson;


        function getInputData() {

            try {
                paramBucle = paramBucle || 0;
                paramIdsFile = paramIdsFile || 0;

                log.error({
                    title: "Parametros",
                    details: paramBucle + "|" + paramSubsidiary + "|" + paramPeriod + "|" + paramMultibook + "|" + paramLogId + "|" + paramReportId + "|" + paramDeclarationType + "|" + paramBookType + "|" + paramIdsFile + "|" + paramDateC
                });

                licenses = libFeature.getLicenses(paramSubsidiary);
                feature_special_account = libFeature.getAuthorization(599, licenses);

                if (hasMultipleCalendars) {
                    if (feature_special_account == true || feature_special_account == 'T') {
                        arrPeriodos = getPeriodsFromCalendarFiscal(3);
                    } else {
                        arrPeriodos = getPeriodsFromCalendarFiscal(2);
                    }
                } else {
                    arrPeriodos = obtenerPeriodos(paramPeriod);
                }

                var newParamPeriod = arrPeriodos[paramBucle];
                log.debug('------- PARA EL PERIODO --------', newParamPeriod);

                var arrIds = getTransactions('obtenerIds', '', newParamPeriod) || [];
                //log.debug('arrIds', arrIds);
                log.debug('tamaño arrIds', arrIds.length);
                log.debug('------- COMIENZA MAP --------');

                return arrIds;

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
                var objResult = JSON.parse(context.value);

                if (objResult["isError"] == "T") {
                    context.write({
                        key: context.key,
                        value: objResult
                    });
                } else {
                    //log.error("objResult", objResult);

                    var arrTransactionsDetail = getTransactions('obtenerDetalle', objResult, '') || [];
                    //log.debug('arrTransactionsDetail', arrTransactionsDetail);
                    //log.debug('tamaño arrTransactionsDetail', arrTransactionsDetail.length);

                    if (arrTransactionsDetail.length != 0) {
                        for (var i = 0; i < arrTransactionsDetail.length; i++) {
                            context.write({
                                key: objResult,
                                value: arrTransactionsDetail[i]
                            });

                        }
                    }
                }

            } catch (error) {
                log.error("objResult", objResult);
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

            } catch (error) {
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
                log.debug('------- COMIENZA SUMMARIZE --------');

                var errores = new Array;
                var rowString = '';
                var transactionString = '';
                var transactionFileSize = 0;
                var paramTransactionFileId = "";
                var transactionFileNumber = 0;
                paramBucle = paramBucle || 0;
                var cont = 0;

                licenses = libFeature.getLicenses(paramSubsidiary);
                feature_special_account = libFeature.getAuthorization(599, licenses);



                //* SE REPITE PARA OBTENER LA CANTIDAD TOTAL DE BUCLES (NUM PERIODOS) 
                if (hasMultipleCalendars) {
                    if (feature_special_account == true || feature_special_account == 'T') {
                        arrPeriodos = getPeriodsFromCalendarFiscal(3);
                    } else {
                        arrPeriodos = getPeriodsFromCalendarFiscal(2);
                    }
                } else {
                    arrPeriodos = obtenerPeriodos(paramPeriod);
                }
                log.debug("arrPeriodos SUMMARIZE", arrPeriodos.length);

                context.output.iterator().each(function(key, value) {
                    cont++;
                    var objResult = JSON.parse(value);
                    //log.debug("objResult summarize", objResult);

                    if (objResult["isError"] == "T") {
                        errores.push(JSON.stringify(objResult["error"]));
                    } else {

                        rowString = getRowString(objResult);
                        transactionString += rowString;
                        transactionFileSize += lengthInUtf8Bytes(rowString);

                        if (transactionFileSize > 9000000) {
                            if (transactionString != "") {
                                var fileName = 'Transaction_EDC_period_' + arrPeriodos[paramBucle] + '_' + transactionFileNumber;
                                log.debug("SUPERO EL LIMITE - tamaño :" + transactionFileSize, transactionFileNumber);
                                if (transactionFileNumber == 0) {
                                    paramTransactionFileId = saveAuxiliaryFile(transactionString, fileName);
                                } else {
                                    paramTransactionFileId = paramTransactionFileId + "|" + saveAuxiliaryFile(transactionString, fileName);
                                }
                                transactionString = "";
                                transactionFileSize = 0;
                                transactionFileNumber++;
                            }
                        }
                    }
                    return true;
                });

                log.debug("NUM TOTAL de lineas de detalle ", cont);

                if (transactionString != '') {
                    var fileName = 'Transaction_EDC_period_' + arrPeriodos[paramBucle] + '_' + transactionFileNumber;
                    if (transactionFileNumber == 0) {
                        log.debug("BUCLE UNICO - tamaño :" + transactionFileSize, transactionFileNumber);
                        paramTransactionFileId = saveAuxiliaryFile(transactionString, fileName);
                    } else {
                        log.debug("BUCLE FINAL - tamaño :" + transactionFileSize, transactionFileNumber);
                        paramTransactionFileId = paramTransactionFileId + "|" + saveAuxiliaryFile(transactionString, fileName);
                    }

                    //log.debug('que paso aqui paramTransactionFileId', paramTransactionFileId);
                    //log.debug('que paso aqui paramBucle', paramBucle);

                    if (paramBucle == 0) {

                        paramIdsFile = saveAuxiliaryFile('' + paramTransactionFileId, 'Ids_File_Transactions_ECD');
                    } else {

                        if (paramIdsFile == 0) {
                            paramIdsFile = saveAuxiliaryFile('' + paramTransactionFileId, 'Ids_File_Transactions_ECD');
                        } else {
                            var archivo = file.load({
                                id: paramIdsFile
                            });
                            paramIdsFile = archivo.getContents();
                            paramIdsFile = paramIdsFile + '|' + paramTransactionFileId;
                            paramIdsFile = saveAuxiliaryFile('' + paramIdsFile, 'Ids_File_Transactions_ECD');;
                        }
                    }


                } else {
                    log.debug('Para este periodo no se esta creando files', arrPeriodos[paramBucle]);
                }

                paramBucle = Number(paramBucle) + 1;
                log.debug("-----------paramBucle", paramBucle);
                log.debug("-----------arrPeriodos.lengt", arrPeriodos.length);

                if (paramBucle == arrPeriodos.length) {
                    log.debug('SE ACABO paramidsFile total', paramIdsFile);
                    log.debug('Juntar y mandar a map', '');
                    callScheduleScript('llamarMap');
                } else {
                    log.debug('ENTRA EN RELLAMADO', '');
                    callScheduleScript('rellamado');
                }

            } catch (error) {
                log.error("error", error);
                //libFeature.sendErrorEmail(error, LMRY_script, language);
                //libreria.sendemailTranslate(error, LMRY_script, language);
            }
        }


        function obtenerPeriodos(paramPeriod) {

            var savedSearch = search.create({
                type: "accountingperiod",
                filters: [
                    ["parent", "anyof", paramPeriod],
                    "AND", ["isquarter", "is", "F"],
                    "AND", ["isyear", "is", "F"]
                ],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        sort: search.Sort.ASC,
                        label: "Internal ID"
                    })
                ]
            });

            var pagedData = savedSearch.runPaged({
                pageSize: 1000
            });

            var page, columns;
            var arrayIds = new Array;

            pagedData.pageRanges.forEach(function(pageRange) {
                page = pagedData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function(result) {

                    columns = result.columns;
                    //0. Internal ID
                    var id = result.getValue(columns[0]);
                    arrayIds.push(id);
                });
            });

            //log.error("ARRAY Ids PERIOD", arrayIds);

            return arrayIds;
        }

        function getPeriodsFromCalendarFiscal(type) {

            //2.-periodos año
            //3.-special period
            var fiscalCalendar = search.lookupFields({
                type: search.Type.SUBSIDIARY,
                id: paramSubsidiary,
                columns: ['fiscalcalendar']
            }).fiscalcalendar[0].value;

            var periodStartDate = search.lookupFields({
                type: search.Type.ACCOUNTING_PERIOD,
                id: paramPeriod,
                columns: ["startdate"]
            }).startdate;

            log.error("periodStartDate", periodStartDate);

            if (type == 2) {
                log.error("CAMPO DE 2", "LLEGO AQUI");

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
                log.error("CAMPO DE 3", "LLEGO AQUI");
                var endDateObject = format.parse({
                    type: format.Type.DATE,
                    value: periodStartDate
                });
                var fullYear = endDateObject.getFullYear();
                log.error("valor del anio", fullYear);

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
            var pagedData = savedSearch.runPaged({
                pageSize: 1000
            });

            var page, columns, periodsArray = [];
            pagedData.pageRanges.forEach(function(pageRange) {
                page = pagedData.fetch({
                    index: pageRange.index
                });

                page.data.forEach(function(result) {
                    columns = result.columns;
                    //log.error("valor de result", result);
                    periodsArray.push(result.getValue(columns[0]));
                });
            });

            return periodsArray;
        }

        function getTransactions(type, internaid, periodId) {

            brSetupJson = getBrSetup(paramSubsidiary);

            var savedSearch = search.load({
                id: "customsearch_lmry_br_acc_entry"
            });

            //* LOS FILTROS SE MANTIENEN
            //CASE WHEN {customscript}='LatamReady - LatamTAX Plug-in' THEN 1 ELSE 0 END
            //ESTO SE DEBE AGREGAR NUEVO PARA ITEM SHIPMENT E ITEM RECEIPT


            if (hasSubsidiariesFeature) {
                var subsidiaryFilter = search.createFilter({
                    name: "subsidiary",
                    operator: search.Operator.IS,
                    values: brSetupJson['subsidiaries']
                });
                savedSearch.filters.push(subsidiaryFilter);
            }

            //nuevo filtro de Initial Load
            var cargaInicialFilter = search.createFilter({
                name: 'custbody_lmry_carga_inicial',
                operator: search.Operator.IS,
                values: "F"
            });
            savedSearch.filters.push(cargaInicialFilter);

            if (featurePeriodEnd == true || featurePeriodEnd == 'T') {

                // if(paramAdjust = true || paramAdjust == 'T'){

                var confiPeriodEnd = search.createSetting({
                    name: 'includeperiodendtransactions',
                    value: 'TRUE'
                });
                savedSearch.settings.push(confiPeriodEnd);
            } else {
                var confiPeriodEnd = search.createSetting({
                    name: 'includeperiodendtransactions',
                    value: 'FALSE'
                });
                savedSearch.settings.push(confiPeriodEnd);
            }

            if (hasMultibookFeature) {

                var accountTypeFilter = search.createFilter({
                    name: 'accounttype',
                    join: 'accountingtransaction',
                    operator: search.Operator.NONEOF,
                    values: ["@NONE@", "Stat"]
                });
                savedSearch.filters.push(accountTypeFilter);

                var accountNotEmptyFilter = search.createFilter({
                    name: 'formulatext',
                    formula: '{accountingtransaction.account}',
                    operator: search.Operator.ISNOTEMPTY,
                });
                savedSearch.filters.push(accountNotEmptyFilter);

                var multibookFilter = search.createFilter({
                    name: 'accountingbook',
                    join: 'accountingtransaction',
                    operator: search.Operator.IS,
                    values: [paramMultibook]
                });
                savedSearch.filters.push(multibookFilter);


            } else {

                var accountTypeFilter = search.createFilter({
                    name: 'accounttype',
                    operator: search.Operator.NONEOF,
                    values: ["@NONE@", "Stat"]
                });
                savedSearch.filters.push(accountTypeFilter);

                var accountNotEmptyFilter = search.createFilter({
                    name: 'formulatext',
                    formula: '{account}',
                    operator: search.Operator.ISNOTEMPTY,
                });
                savedSearch.filters.push(accountNotEmptyFilter);

            }

            if (type == 'obtenerIds') {
                var arrayIds = new Array;
                if (periodId != "") {
                    var periodFilter = search.createFilter({
                        name: "postingperiod",
                        operator: search.Operator.IS,
                        values: [periodId]
                    });
                    savedSearch.filters.push(periodFilter);

                    //!ESTA PARTE ERA SOLO PARA TESTEAR
                    /*
                    var internalidFilter = search.createFilter({
                        name: 'internalid',
                        operator: search.Operator.ANYOF,
                        values: ["25320542", "21615211", "21854508", "21873660", "24637305", "24638560", "24896047", "29213963", "55849785"]
                    });
                    savedSearch.filters.push(internalidFilter);
                    */

                    //* Se vacian las Columnas de la Busqueda y solo se agrega la de internalID Agrupado
                    var numArrayColumns = savedSearch.columns;

                    for (var i = numArrayColumns.length; i > 0; i--) {
                        savedSearch.columns.pop();
                    }

                    var accountColumn = search.createColumn({
                        name: 'formulanumeric',
                        formula: '{internalid}',
                        summary: 'GROUP'
                    });
                    savedSearch.columns.push(accountColumn);

                    var pagedData = savedSearch.runPaged({
                        pageSize: 1000
                    });

                    var page, columns;
                    var jsonData = {};

                    pagedData.pageRanges.forEach(function(pageRange) {
                        page = pagedData.fetch({
                            index: pageRange.index
                        });
                        page.data.forEach(function(result) {

                            columns = result.columns;
                            //0. Internal ID
                            var id = result.getValue(columns[0]);
                            arrayIds.push(id);

                            if (jsonData[id] == undefined) {
                                jsonData[id] = 1;
                            } else {
                                log.error("OH NO", "SE ESTAN DUPLICANDO");
                                jsonData[id]++;
                            }
                            return true;
                        });
                    });
                }
                log.error("Numero de Ids by periodId: " + periodId, arrayIds.length);
                /*
                                file.create({
                                    name: "testReportData.json",
                                    fileType: file.Type.PLAINTEXT,
                                    encoding: file.Encoding.UTF8,
                                    contents: JSON.stringify(jsonData),
                                    folder: -15
                                }).save()
                */
                return arrayIds;
            }

            if (type == 'obtenerDetalle') {

                var resultadoArray = [];
                //log.error("busqueda Map", internaid);

                //15.vendor
                var vendorColumn = search.createColumn({
                    name: 'formulanumeric',
                    formula: '{vendor.internalid}'
                });
                savedSearch.columns.push(vendorColumn);

                if ((hasJobsFeature && !hasAdvancedJobsFeature) || (hasJobsFeature && hasAdvancedJobsFeature)) {
                    //16.customermain
                    var customerColumn = search.createColumn({
                        name: 'formulanumeric',
                        formula: 'CASE WHEN NVL({job.internalid},-1) = -1 THEN {customer.internalid} ELSE {job.customer.id} end'
                    });
                    savedSearch.columns.push(customerColumn);
                } else {
                    //16.customermain
                    var customerColumn = search.createColumn({
                        name: "formulanumeric",
                        formula: "{customer.internalid}"
                    });
                    savedSearch.columns.push(customerColumn);
                }

                if (hasMultibookFeature) {
                    //17.account
                    var multibookAccountColumn = search.createColumn({
                        name: 'formulanumeric',
                        formula: '{accountingtransaction.account.id}',
                    });
                    savedSearch.columns.push(multibookAccountColumn);

                    //2.debitamount
                    var multibookDebitAmount = search.createColumn({
                        name: 'formulacurrency',
                        formula: "NVL({accountingtransaction.debitamount},0)",
                    });
                    savedSearch.columns[2] = multibookDebitAmount;
                    //3.creditamount
                    var multibookCreditAmount = search.createColumn({
                        name: 'formulacurrency',
                        formula: "NVL({accountingtransaction.creditamount},0)",
                    });
                    savedSearch.columns[3] = multibookCreditAmount;

                } else {
                    //17.account
                    var accountColumn = search.createColumn({
                        name: 'formulanumeric',
                        formula: '{account.internalid}',
                    });
                    savedSearch.columns.push(accountColumn);
                }

                //18 memo
                var memoColumn = search.createColumn({
                    name: 'formulatext',
                    formula: '{memo}'
                });
                savedSearch.columns.push(memoColumn);

                //#19 register_date
                var registerDateColumn = search.createColumn({
                    name: 'custbody_lmry_register_date'
                });
                savedSearch.columns.push(registerDateColumn);

                //#20 columna gl impact para el item receipt y item shipment creado por plugin
                var glColumn = search.createColumn({
                    name: 'formulatext',
                    formula: "CASE WHEN {customscript}='LatamReady - LatamTAX Plug-in' or {customscript}='LatamReady - Anulacion Invoice PLGN' or {customscript} = 'Test - LatamTAX Plug-in' THEN 1 ELSE 0 END"
                        //CASE WHEN {customscript}='LatamReady - LatamTAX Plug-in'  or {customscript}='LatamReady - Anulacion Invoice PLGN' THEN 1 ELSE 0 END
                });
                savedSearch.columns.push(glColumn);
                //#21 customgl, trae verdadero o falso si la linea del glimpact fue creado con un pluggin
                var glColumn = search.createColumn({
                    name: 'formulatext',
                    formula: "{customgl}"
                });
                savedSearch.columns.push(glColumn);

                var internalidFilter = search.createFilter({
                    name: 'formulanumeric',
                    formula: '{internalid}',
                    operator: search.Operator.EQUALTO,
                    values: internaid
                });
                savedSearch.filters.push(internalidFilter);


                var jsonPeriodosCal = obtenerPeriodosMensuales();

                var pagedData = savedSearch.runPaged({
                    pageSize: 1000
                });

                var cont = 0;
                var page, auxArray, columns;


                pagedData.pageRanges.forEach(function(pageRange) {
                    page = pagedData.fetch({
                        index: pageRange.index
                    });
                    page.data.forEach(function(result) {
                        cont++;
                        columns = result.columns;

                        auxArray = [];
                        //Se agrega esta validacion para obtener las cabeceras con debito y credito 0 de los payment y bill payment. Luego se filtrara si es 0 en el getPaymentLines
                        if ((result.getValue(columns[2]) - result.getValue(columns[3])) != 0 || (result.getValue(columns[8]) == 'VendPymt' || result.getValue(columns[8]) == 'CustPymt')) {

                            //0. Codigo unico de asiento contable I200
                            //1068024, tiene fecha defecto 07/01/2020
                            //Se agregara otra fecha 20/10/2020
                            auxArray[0] = result.getValue(columns[0]);

                            //1. Fecha de asiento contable I200
                            //utilizara custbody_lmry_register_date en caso este vacio utilizar date

                            if (result.getValue(columns[19]) == null || result.getValue(columns[19]) == '') {
                                auxArray[1] = result.getValue(columns[1]);
                            } else {
                                auxArray[1] = result.getValue(columns[19]);
                            }

                            //2. Valor de asiento contable / Valor de salida Debito I200/I250
                            auxArray[2] = result.getValue(columns[2]);

                            //3. Valor de asiento contable / Valor de salida Credito I200/I250
                            auxArray[3] = result.getValue(columns[3]);

                            //4. Tipo de Lanzamiento I200
                            //Se compara si existe PEJrnl, o es una transaccion en un periodo de ajuste

                            if (result.getValue(columns[8]) == 'PEJrnl' || jsonPeriodosCal[result.getValue(columns[4])] == true) {
                                auxArray[4] = "E";
                            } else {
                                auxArray[4] = "N";
                            }

                            //5. Br coa Id
                            auxArray[5] = "";

                            //6. Codigo de cuenta Analitica Debitada / Creditada I250
                            auxArray[6] = "";

                            if (!brSetupJson["genCostCenter"]) {
                                auxArray[7] = '0';
                            } else {
                                //7. Codigo de centro de costos I250
                                auxArray[7] = result.getValue(columns[5]) || '0';
                            }

                            //8. Número, Código ou caminho de localização dos documentos arquivados I250
                            auxArray[8] = result.getValue(columns[6]);

                            //9. Tran Id Historico I250
                            auxArray[9] = result.getValue(columns[7]);

                            //10. Tipo Transaccion Historico I250
                            auxArray[10] = result.getValue(columns[8]);

                            //11. Memo Historico I250
                            auxArray[11] = result.getValue(columns[9]).replace(/(\n|\r|\t)/g, ' ');

                            //12. Transaccion Referencia Vendor Id
                            auxArray[12] = result.getValue(columns[10]);

                            //13. Nombre Subsidiaria Customer Id
                            auxArray[13] = result.getValue(columns[11]);

                            //14. Retención Factura Compras
                            auxArray[14] = result.getValue(columns[12]);

                            //15. Document Type
                            auxArray[15] = result.getValue(columns[13]);

                            //17 Vendor Id
                            auxArray[16] = result.getValue(columns[15]);

                            //18 Customer Id
                            auxArray[17] = result.getValue(columns[16]);

                            //19. Account
                            auxArray[18] = result.getValue(columns[17]);

                            //20. Memo
                            auxArray[19] = result.getValue(columns[18]).replace(/(\n|\r|\t)/g, ' ');
                            //21. Glimpact
                            var esLineaPluggin = result.getValue(columns[21]); //V o F
                            var esPlugginItemShpItemRec = result.getValue(columns[20]); // 1 o 0

                            // Eliminar lineas de los pagos, estos se harán en el map
                            if (hasCustomGlines == true || hasCustomGlines == 'T') {
                                //log.debug("esLineaPluggin, esPlugginItemShpItemRec", esLineaPluggin + "" + esPlugginItemShpItemRec);
                                //log.debug("Entro Aqui", "llego");
                                if ((!((auxArray[10] == 'VendPymt' || auxArray[10] == 'CustPymt') && result.getValue(columns[14]) != '*')) && ((esLineaPluggin == 'F' || esLineaPluggin == false) || ((esLineaPluggin == 'T' || esLineaPluggin == true) && esPlugginItemShpItemRec == 1))) {
                                    resultadoArray.push(auxArray);
                                }
                            } else {
                                if ((esLineaPluggin == 'F' || esLineaPluggin == false) && (!((auxArray[10] == 'VendPymt' || auxArray[10] == 'CustPymt') && result.getValue(columns[14]) != '*'))) {
                                    resultadoArray.push(auxArray);
                                }
                            }
                        }
                    });
                });
                //log.error("numero de transacciones", cont);
                // log.error("resultadoArray", resultadoArray.length);
                return resultadoArray;
            }
        }

        function obtenerPeriodosMensuales() {
            var resultJson = {};
            var savedSearch = search.create({
                type: "accountingperiod",
                filters: [
                    ["parent", "anyof", paramPeriod],
                    "AND", ["isquarter", "is", "F"],
                    "AND", ["isyear", "is", "F"]
                ],
                columns: [
                    search.createColumn({
                        name: 'internalid',
                        sort: search.Sort.ASC
                    }),
                    search.createColumn({
                        name: 'isadjust'
                    })
                ]
            });
            var pagedData = savedSearch.runPaged({
                pageSize: 1000
            });

            var page, columns;
            pagedData.pageRanges.forEach(function(pageRange) {
                page = pagedData.fetch({
                    index: pageRange.index
                });

                page.data.forEach(function(result) {
                    columns = result.columns;
                    resultJson[result.getValue(columns[0])] = result.getValue(columns[1]);
                });
            });

            return resultJson;
        }

        function getRowString(array) {
            var rowString = "";
            for (var i = 0; i < array.length; i++) {
                rowString += array[i];
                if (i != array.length - 1) {
                    rowString += "#*#";
                } else {
                    rowString += "\r\n";
                }
            }
            return rowString;
        }

        function saveAuxiliaryFile(fileContent, fileName) {
            var folderId = objContext.getParameter({
                name: "custscript_lmry_file_cabinet_rg_br"
            });

            if (folderId) {

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

        function callScheduleScript(type) {
            var params = {};
            var scriptId = "";
            var deploymentId = "";

            if (type == 'rellamado') {
                paramIdsFile = paramIdsFile || 0;
                log.error("paramDateC", paramDateC);

                params["custscript_lmry_br_ecd_mprd_constitution"] = paramDateC;
                params["custscript_lmry_br_ecd_mprd_period"] = paramPeriod;
                params["custscript_lmry_br_ecd_mprd_subsi"] = paramSubsidiary;
                params["custscript_lmry_br_ecd_mprd_multi"] = paramMultibook;
                params["custscript_lmry_br_ecd_mprd_idlog"] = paramLogId;
                params["custscript_lmry_br_ecd_mprd_idrep"] = paramReportId;
                params["custscript_lmry_br_ecd_mprd_dectype"] = paramDeclarationType;
                params["custscript_lmry_br_ecd_mprd_booktype"] = paramBookType;
                params["custscript_lmry_br_ecd_mprd_num_orden"] = paramNumOrder;
                params["custscript_lmry_br_ecd_mprd_idfile"] = paramIdsFile;
                params["custscript_lmry_br_ecd_mprd_bucle"] = paramBucle;

                scriptId = "customscript_lmry_br_ecd_mprd";
                deploymentId = "customdeploy_lmry_br_ecd_mprd";

                log.error("parametros enviados", params);
                var taskScript = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: scriptId,
                    deploymentId: deploymentId,
                    params: params
                });
                taskScript.submit();
            } else {
                paramIdsFile = paramIdsFile || 0;
                log.error({
                    title: "Parametros Enviados al Map Principal",
                    details: paramSubsidiary + "|" + paramPeriod + "|" + paramMultibook + "|" + paramLogId + "|" + paramReportId + "|" + paramDeclarationType + "|" + paramBookType + "|" + paramNumOrder
                });
                log.error("paramidsFile", paramIdsFile);
                log.error("paramDateC", paramDateC);

                params["custscript_lmry_br_ecd_mprd_m_subsi"] = paramSubsidiary;
                params["custscript_lmry_br_ecd_mprd_m_period"] = paramPeriod;
                params["custscript_lmry_br_ecd_mprd_m_multi"] = paramMultibook;
                params["custscript_lmry_br_ecd_mprd_m_idlog"] = paramLogId;
                params["custscript_lmry_br_ecd_mprd_m_idrep"] = paramReportId;
                params["custscript_lmry_br_ecd_mprd_m_dectype"] = paramDeclarationType;
                params["custscript_lmry_br_ecd_mprd_m_booktype"] = paramBookType;
                params["custscript_lmry_br_ecd_mprd_m_num_orden"] = paramNumOrder;
                params["custscript_lmry_br_ecd_mprd_m_idsfile"] = paramIdsFile;
                params["custscript_lmry_br_ecd_mprd_dateconstitu"] = paramDateC;

                scriptId = "customscript_lmry_br_ecd_mprd_map";
                deploymentId = "customdeploy_lmry_br_ecd_mprd_map";

                var taskScript = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: scriptId,
                    deploymentId: deploymentId,
                    params: params
                });
                taskScript.submit();
            }
        }

        return {
            getInputData: getInputData,
            map: map,
            //reduce: reduce,
            summarize: summarize
        };
    });