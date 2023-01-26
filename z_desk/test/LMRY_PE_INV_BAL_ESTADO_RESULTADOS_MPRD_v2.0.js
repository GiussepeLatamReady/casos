/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                                ||
||                                                                         ||
||  File Name: LMRY_PE_INV_BAL_ESTADO_RESULTADOS_MPRD_v2.0.js              ||
||                                                                         ||
||  Version Date         Author        Remarks                             ||
||  2.0     Jan 25 2021  LatamReady    Use Script 2.0                      ||
\= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */

 define(['N/record', 'N/runtime', 'N/file', 'N/encode', 'N/search', 'N/format', 'N/log', 'N/config', "/SuiteBundles/Bundle 35754/Latam_Library/LMRY_LibraryReport_LBRY_V2.js"],
    function(record, runtime, file, encode, search, format, log, config, libreria) {

        var objContext = runtime.getCurrentScript();
        var LMRY_script = 'LMRY_PE_INV_BAL_ESTADO_RESULTADOS_MPRD_v2.0.js';

        var paramPeriod = objContext.getParameter('custscript_lmry_pe_invbalres_per_mprd');

        var paramSubsidiary = objContext.getParameter('custscript_lmry_pe_invbalres_subsi_mprd');

        var paramMultibook = objContext.getParameter('custscript_lmry_pe_invbalres_multi_mprd');

        var paramLogId = objContext.getParameter('custscript_lmry_pe_invbalres_idlog_mprd');

        var paramReportId = objContext.getParameter('custscript_lmry_pe_invbalres_idrep_mprd');

        var paramStartDate = objContext.getParameter('custscript_lmry_pe_invbalres_fecin_mprd');

        var paramEndDate = objContext.getParameter('custscript_lmry_pe_invbalres_fecfi_mprd');

        var hasSubsidiariesFeature =  runtime.isFeatureInEffect({feature : "SUBSIDIARIES"});

        var hasMultibookFeature = runtime.isFeatureInEffect({feature : "MULTIBOOK"});

        var hasMultipleCalendars = runtime.isFeatureInEffect({feature: "MULTIPLECALENDARS"});

        var language = runtime.getCurrentScript().getParameter("LANGUAGE").substring(0,2);

        var currency = '';
        var featAccountingSpecial = null;
        var formulPeriodFilters = null;
        //ACCOUNTING COONTEXT
        var testIdsTrans = new Array();
        //ADJUSMENT
        var paramAdjustment = objContext.getParameter('custscript_lmry_pe_invbalres_adjust_mprd');
        var paramAdjustmentBookCheck = objContext.getParameter('custscript_lmry_pe_invbalres_adbc_mprd');
        var paramAdjustmentBook = objContext.getParameter('custscript_lmry_pe_invbalres_adjb_mprd');
        var isFeaturePeriodEnd = runtime.isFeatureInEffect({feature: "PERIODENDJOURNALENTRIES"});

        function getInputData() {
            try {
                getPeriodDesvinculacion();
                

                 getTransactionsTest(false);

                if ((paramAdjustmentBookCheck == true || paramAdjustmentBookCheck == 'T') &&
                (paramAdjustmentBook != '' || paramAdjustmentBook != null || paramAdjustmentBook != 0)) {
                    getTransactionsTest(true);
                    
                }

                var transactionsArray = getTransactions(false);

                if ((paramAdjustmentBookCheck == true || paramAdjustmentBookCheck == 'T') &&
                (paramAdjustmentBook != '' || paramAdjustmentBook != null || paramAdjustmentBook != 0)) {
                    var transactionsArrayAdjBook = getTransactions(true);
                    transactionsArray = transactionsArray.concat(transactionsArrayAdjBook);
                }

                log.debug("Transacciones Implicadas",testIdsTrans);
                
                log.debug("Agrupar por Cuenta","Agrupando...");
                log.debug("Saldos Agrupados cuentas",transactionsArray);
                log.debug("Agrupar por LATAM - PE FINANCIAL STATE CATALOG y LATAM - PE ITEM FINANCIAL STATE","Agrupando...");

                if (transactionsArray.length) {
                    return transactionsArray;
                } else {
                    setLogGenerator(false);
                }

            } catch (error) {
                log.error("error", error);

                return [{
                    isError : 'T',
                    error: error
                }];
            }

        }

        function map(context) {
            try {
                var key = context.key;
                var objResult = JSON.parse(context.value);
                log.debug("transactions map",objResult)
                if (objResult["isError"] == "T") {
                    context.write({
                        key   : context.key,
                        value : objResult
                    });
                } else {
                    
                    context.write({
                        key: objResult[0] + '|' + objResult[1],
                        value: objResult
                    });
                }

            } catch (error) {
                log.error("error map", error);
                context.write({
                    key   : context.key,
                    value : {
                        isError : 'T',
                        error   : error
                    }
                });
            }
        }

        function reduce(context) {
            try {
                var resultArray = context.values;
                var objResult, amount = 0;
                for (var i = 0; i < resultArray.length; i++) {
                    objResult = JSON.parse(resultArray[i]);

                    if (objResult["isError"] == "T") {
                        context.write({
                            key   : context.key,
                            value : objResult
                        });
                        return;
                    }
                    amount = round(amount + Number(objResult[2]));
                }

                context.write({
                    key   : context.key,
                    value : amount
                });

            } catch (error) {
                context.write({
                    key   : context.key,
                    value : {
                        isError : "T",
                        error   : error
                    }
                });
            }
        }

        function summarize(context) {
            try {
                getPeriodDesvinculacion();
                currency = getCurrency();

                var contador = 0;
                var errores = [];

                var transactionJson = {};
               
                context.output.iterator().each(function(key, value) {
                    var objResult = JSON.parse(value);

                    if (objResult["isError"] == "T") {
                        errores.push(JSON.stringify(objResult["error"]));
                    } else {
                        contador++;

                        transactionJson[key] = objResult;
                        
                    }
                    return true;
                });

                if (errores.length > 0) {
                    log.error("error", errores[0]);
                    libreria.sendErrorEmail(' [ Summarize ] ' + errores[0], LMRY_script, language);
                    setLogGenerator(true);
                } else {
                    log.debug("Saldos Agrupados por catalogo",transactionJson)
                    getFinancialStatementCodes( transactionJson);
                    
                }

            } catch (error) {
                log.error("error", error);
                libreria.sendErrorEmail(' [ Summarize ] ' + errores[0], LMRY_script, language);
            }
        }

        function getFinancialStatementCodes(transactionJson) {

            var newSearch = search.create({
                type: "customrecord_lmry_pe_cod_rubro_estad_fin",
                filters:
                [
                    ["isinactive", 'is', 'F'],
                    "AND",
                    ["custrecord_lmry_pe_rubro_esta_finan_repo","is", paramReportId]
                ],
                columns:
                [
                    search.createColumn({name: "internalid", label: "Internalid"}),
                    search.createColumn({
                        name: "custrecordlmry_pe_rubro_estado_finan_cod",
                        sort: search.Sort.ASC,
                        label: "PE  Rubro Estado Finan. Codigo"
                    }),
                    search.createColumn({name: "custrecord_lmry_pe_rubro_esta_finan_tota", label: "PE Rubro Estado Finan. Totalizador"}),
                    search.createColumn({name: "custrecord_lmry_pe_rubro_esta_finan_scod", label: "PE Rubro Estado Finan. Sub Codigos"}),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custrecord_lmry_pe_rubro_esta_finan_cat.custrecord_lmry_pe_cata_esta_fina_codigo}",
                        label: "12. Codigo de catalogo"
                    })
                ]
            });
            var resultJson = {};
            var objResult = newSearch.run().getRange(0, 1000);
            var auxArray, codesJson = {};
            for (var i = 0; i < objResult.length; i++) {
                auxArray = [];
                var columns=objResult[i].columns;
                // 0. internalId
                auxArray[0] = objResult[i].getValue('internalid');

                // 1. Codigo de Rubro de Estado Financiero
                auxArray[1] = objResult[i].getValue('custrecordlmry_pe_rubro_estado_finan_cod');

                // 2. Es Totalizador
                auxArray[2] = objResult[i].getValue('custrecord_lmry_pe_rubro_esta_finan_tota');

                // 3. Sub Codigos Relacionados
                auxArray[3] = objResult[i].getValue('custrecord_lmry_pe_rubro_esta_finan_scod');

                // 4. Monto
                auxArray[4] = Number(transactionJson[objResult[i].getValue(columns[4]) + '|' + auxArray[0]] ) || 0;

                // 5. Codigo de catalogo
                auxArray[5] = objResult[i].getValue(columns[4]);
                codesJson[auxArray[0]] = auxArray;
            }
            if (featAccountingSpecial || featAccountingSpecial == 'T') {
                var anio = paramPeriod;
            } else {  
                var endDate = search.lookupFields({
                    type: search.Type.ACCOUNTING_PERIOD,
                    id: paramPeriod,
                    columns: ['enddate']
                }).enddate;
                var anio = format.parse({
                    value: endDate,
                    type: format.Type.DATE
                }).getFullYear();
            }
            var fileContent = '';
            for (var codeId in codesJson) {
                if (codesJson[codeId][2]) {
                    codesJson[codeId][4] = getTotalAmount(codesJson, codeId, codesJson[codeId][3]);
                }

                // 0. Periodo
                // 1. Codigo de Catalogo
                // 2. Codigo del Rubro del Estado Financiero
                // 3. Saldo del Rubro Contable
                // 4. Estado de la Operacion
                if(codesJson[codeId][4] != 0){
                    fileContent += anio + '1231' + '|' + codesJson[codeId][5] + '|' + codesJson[codeId][1] + '|' + codesJson[codeId][4] + '|1|\r\n';
                    log.debug("fileContent",anio + '1231' + '|' + codesJson[codeId][5] + '|' + codesJson[codeId][1] + '|' + codesJson[codeId][4]+ '|1|')
                }
               
            }
            if (fileContent.length) {
                saveFile(fileContent, 0);
            } else {
                setLogGenerator(false);
            }
        }

        function getTotalAmount(codeJson, codeId, subCodigosId) {
            var amount = codeJson[codeId][4];
            if (subCodigosId) {
                var codigosArray = subCodigosId.split(',');

                for (var i = 0; i < codigosArray.length; i++) {
                    if (codeId != codigosArray[i]) {
                        if (codeJson[codigosArray[i]] && codeJson[codigosArray[i]][2]) {
                            amount = amount + getTotalAmount(codeJson, codigosArray[i][2], codeJson[codigosArray[i]][3])
                        } else {
                            amount = round(amount + codeJson[codigosArray[i]][4]);
                        }
                    }
                }
            }
            return amount
        }

        function getProfitAndLossAccounts() {
            var resultJson = {};

            var accountSearch = search.create({
                type: search.Type.ACCOUNT,
                filters: [
                    ['isinactive', 'is', 'F'],
                    "AND",
                    [
                        ["formulatext: case when {custrecord_lmry_pe_sunat_cta_habilitado} = 'T' then {custrecord_lmry_pe_sunat_cta_codigo} else {number} END","startswith","6"],
                        'OR',
                        ["formulatext: case when {custrecord_lmry_pe_sunat_cta_habilitado} = 'T' then {custrecord_lmry_pe_sunat_cta_codigo} else {number} END","startswith","7"]
                    ],
                    "AND",
                    ["formulatext: {custrecord_lmry_pe_catalog_esta_finan}", 'isnotempty',''],
                    "AND",
                    ["formulatext: {custrecord_lmry_rubro_estado_financiero}", 'isnotempty',''],
                    "AND",
                    ["formulatext: {custrecord_lmry_rubro_estado_financiero.custrecord_lmry_pe_rubro_esta_finan_repo}", 'is',paramReportId],
                ],
                columns: [
                    'internalid',
                    'custrecord_lmry_pe_catalog_esta_finan.custrecord_lmry_pe_cata_esta_fina_codigo',
                    'custrecord_lmry_rubro_estado_financiero',
                    'name'
                ]
            });

            if (hasSubsidiariesFeature) {
                var subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: [paramSubsidiary]
                });
                accountSearch.filters.push(subsidiaryFilter);
            }

            var pagedData = accountSearch.runPaged({
                pageSize : 1000
            });

            var page, columns;
            pagedData.pageRanges.forEach(function(pageRange) {
                page = pagedData.fetch({
                    index : pageRange.index
                });
                page.data.forEach(function(result) {
                    columns = result.columns;
                    resultJson[result.getValue(columns[0])] = {
                        'CodigoCatalogo' : result.getValue(columns[1]),
                        'CodigoRubroEstadoFinanciero' : result.getValue(columns[2]),
                        'name':result.getValue(columns[3])
                    } ;
                });
            });

            return resultJson;
        }

        function getTransactions(Adjustment) {
            
            var accountsJson = getProfitAndLossAccounts();
            var accountsIdArray = Object.keys(accountsJson);

            var savedSearch = search.load({
                id: 'customsearch_lmry_pe_inv_bal_est_result'
            });

            if (hasSubsidiariesFeature) {
                var subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: [paramSubsidiary]
                });
                savedSearch.filters.push(subsidiaryFilter);
            }

            
            var periodFilter = search.createFilter({
                name: "formulatext",
                formula: formulPeriodFilters,
                operator: search.Operator.IS,
                values: "1"
            });
            savedSearch.filters.push(periodFilter);

            if (isFeaturePeriodEnd) {
                if (paramAdjustment == 'T') {
                    var confiPeriodEnd = search.createSetting({
                        name: 'includeperiodendtransactions',
                        value: 'TRUE'
                    });
                    savedSearch.settings.push(confiPeriodEnd);
                }
            }

            if (hasMultibookFeature) {
                
                if (Adjustment) {
                    var multiFilter = search.createFilter({
                        name: 'accountingbook',
                        join: 'accountingtransaction',
                        operator: search.Operator.IS,
                        values: [paramAdjustmentBook]
                    });
                    savedSearch.filters.push(multiFilter);

                    var bookSpecificFilter = search.createFilter({
                        name: 'bookspecifictransaction',
                        operator: search.Operator.IS,
                        values: true
                    });
                    savedSearch.filters.push(bookSpecificFilter);

                    var typeFilter = search.createFilter({
                        name: 'type',
                        operator: search.Operator.IS,
                        values: 'Journal'
                    });
                    savedSearch.filters.push(typeFilter);

                    var approvalStatusFilter = search.createFilter({
                        name: 'approvalstatus',
                        operator: search.Operator.IS,
                        values: '2'
                    });
                    savedSearch.filters.push(approvalStatusFilter);

                } else {
                    var multibookFilter = search.createFilter({
                        name: 'accountingbook',
                        join: 'accountingtransaction',
                        operator: search.Operator.ANYOF,
                        values: [paramMultibook]
                    })
                    savedSearch.filters.push(multibookFilter);
                } 

                if (accountsIdArray.length != 0) {
                    var accountsFilter = search.createFilter({
                        name: 'account',
                        join: 'accountingtransaction',
                        operator: search.Operator.ANYOF,
                        values: accountsIdArray
                    });
                    savedSearch.filters.push(accountsFilter);
                }

                var multibookAccountColumn = search.createColumn({
                    name   : 'account',
                    join   : 'accountingtransaction',
                    summary: 'GROUP'
                });
                savedSearch.columns[0] = multibookAccountColumn;

                var multibookAmountColumn = search.createColumn({
                    name: 'formulacurrency',
                    formula: 'NVL({accountingtransaction.debitamount},0) - NVL({accountingtransaction.creditamount},0)',
                    summary: 'SUM'

                });
                savedSearch.columns[1] = multibookAmountColumn;
            } else {

                if (accountsIdArray.length != 0) {
                    var accountsFilter = search.createFilter({
                        name: 'account',
                        operator: search.Operator.ANYOF,
                        values: accountsIdArray
                    });
                    savedSearch.filters.push(accountsFilter);
                }
            }
            var pagedData = savedSearch.runPaged({
                pageSize : 1000
            });

            var page, auxArray, columns, resultArray = [];
            pagedData.pageRanges.forEach(function(pageRange) {
                page = pagedData.fetch({
                    index : pageRange.index
                });
                page.data.forEach(function(result) {
                    columns = result.columns;
                    auxArray = [];

                    // 0. Código de Catalogo
                    account = accountsJson[result.getValue(columns[0])] || {};
                    
                    
                    auxArray[0] = account['CodigoCatalogo'] || '';

                    // 1. Código de Rubro del Estado Financiero
                    auxArray[1] = account['CodigoRubroEstadoFinanciero'] || '';

                    // 2. Saldo del Rubro Contable                   
                    auxArray[2] = result.getValue(columns[1]);
                    
                    

                    resultArray.push(auxArray);
                });
            });
            return resultArray;
        }

        function getTransactionsTest(Adjustment) {
            
            var accountsJson = getProfitAndLossAccounts();
            log.debug("Cuentas relacionadas",accountsJson);
            var accountsIdArray = Object.keys(accountsJson);
            

            var savedSearch = search.create({
                type: "transaction",
                filters:
                [
                   ["voided","is","F"], 
                   "AND", 
                   ["posting","is","T"], 
                   "AND", 
                   ["memorized","is","F"], 
                   "AND", 
                   ["formulatext: CASE WHEN {taxitem} = 'UNDEF_PE' OR {taxitem} = 'UNDEF-PE' THEN 0 ELSE 1 END","is","1"]
                ],
                columns:
                [
                   search.createColumn({
                      name: "account",
                      label: "0. Codigo de Catalogo / 1. Codigo del Rubro del Estado Financiero"
                   }),
                   search.createColumn({
                      name: "formulacurrency",
                      formula: "NVL({debitamount},0) - NVL({creditamount},0)",
                      label: "Formula (Currency)"
                   }),
                   search.createColumn({name: "internalid", label: "Internal ID"}),
                   search.createColumn({name: "type", label: "type"})
                ],
                settings:
                []
             });

            if (hasSubsidiariesFeature) {
                var subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: [paramSubsidiary]
                });
                savedSearch.filters.push(subsidiaryFilter);
            }

            
            var periodFilter = search.createFilter({
                name: "formulatext",
                formula: formulPeriodFilters,
                operator: search.Operator.IS,
                values: "1"
            });
            savedSearch.filters.push(periodFilter);

            if (isFeaturePeriodEnd) {
                if (paramAdjustment == 'T') {
                    var confiPeriodEnd = search.createSetting({
                        name: 'includeperiodendtransactions',
                        value: 'TRUE'
                    });
                    savedSearch.settings.push(confiPeriodEnd);
                }
            }

            if (hasMultibookFeature) {
                
                if (Adjustment) {
                    var multiFilter = search.createFilter({
                        name: 'accountingbook',
                        join: 'accountingtransaction',
                        operator: search.Operator.IS,
                        values: [paramAdjustmentBook]
                    });
                    savedSearch.filters.push(multiFilter);

                    var bookSpecificFilter = search.createFilter({
                        name: 'bookspecifictransaction',
                        operator: search.Operator.IS,
                        values: true
                    });
                    savedSearch.filters.push(bookSpecificFilter);

                    var typeFilter = search.createFilter({
                        name: 'type',
                        operator: search.Operator.IS,
                        values: 'Journal'
                    });
                    savedSearch.filters.push(typeFilter);

                    var approvalStatusFilter = search.createFilter({
                        name: 'approvalstatus',
                        operator: search.Operator.IS,
                        values: '2'
                    });
                    savedSearch.filters.push(approvalStatusFilter);

                } else {
                    var multibookFilter = search.createFilter({
                        name: 'accountingbook',
                        join: 'accountingtransaction',
                        operator: search.Operator.ANYOF,
                        values: [paramMultibook]
                    })
                    savedSearch.filters.push(multibookFilter);
                } 

                if (accountsIdArray.length != 0) {
                    var accountsFilter = search.createFilter({
                        name: 'account',
                        join: 'accountingtransaction',
                        operator: search.Operator.ANYOF,
                        values: accountsIdArray
                    });
                    savedSearch.filters.push(accountsFilter);
                }

                // var multibookAccountColumn = search.createColumn({
                //     name   : 'account',
                //     join   : 'accountingtransaction',
                //     summary: 'GROUP'
                // });
                // savedSearch.columns[0] = multibookAccountColumn;

                // var multibookAmountColumn = search.createColumn({
                //     name: 'formulacurrency',
                //     formula: 'NVL({accountingtransaction.debitamount},0) - NVL({accountingtransaction.creditamount},0)',
                //     summary: 'SUM'

                // });
                // savedSearch.columns[1] = multibookAmountColumn;
            } else {

                if (accountsIdArray.length != 0) {
                    var accountsFilter = search.createFilter({
                        name: 'account',
                        operator: search.Operator.ANYOF,
                        values: accountsIdArray
                    });
                    savedSearch.filters.push(accountsFilter);
                }
            }
            var pagedData = savedSearch.runPaged({
                pageSize : 1000
            });

            var page, auxArray, columns, resultArray = [];
            pagedData.pageRanges.forEach(function(pageRange) {
                page = pagedData.fetch({
                    index : pageRange.index
                });
                page.data.forEach(function(result) {
                    columns = result.columns;
                    auxArray = [];
                    account = accountsJson[result.getValue(columns[0])] || {};
                    var jsonIds = {
                        "Id":result.getValue(columns[2]),
                        "Tipo":result.getValue(columns[3]),
                        "Saldo":result.getValue(columns[1]),
                        "IdCuenta":result.getValue(columns[0]),
                        "Catalogo":account['CodigoCatalogo'],
                        "Codigo Rubro":account['CodigoRubroEstadoFinanciero']
                    }
                    testIdsTrans.push(jsonIds);
                });
            });
        }
        function getPeriodDesvinculacion(){
            if (hasSubsidiariesFeature) {
                var licenses = libreria.getLicenses(paramSubsidiary);
                featAccountingSpecial = libreria.getAuthorization(664, licenses);
               
            }

            if (featAccountingSpecial || featAccountingSpecial == 'T') {
                var arrPeriodoSpecial = validarSpecialPeriod(paramPeriod);
                formulPeriodFilters = generarStringFilterPostingPeriodAnual(arrPeriodoSpecial);

               
            } else {
                //Period enddate
                var periodenddate_temp = search.lookupFields({
                    type: search.Type.ACCOUNTING_PERIOD,
                    id: paramPeriod,
                    columns: ['enddate', 'periodname', 'startdate']
                });

                periodenddate = periodenddate_temp.enddate;
                periodstartdate = periodenddate_temp.startdate;
                //Period Name
                periodname = periodenddate_temp.periodname;

                // Obtener Filtro de fecha
                var arregloidPeriod = getPeriods(periodstartdate, periodenddate);
                formulPeriodFilters = generarStringFilterPostingPeriodAnual(arregloidPeriod);
            }
        }

        function validarSpecialPeriod(paramPeriod) {
            var specialPeriods_ID = new Array();
            var searchPeriodSpecial = search.create({
                type: "customrecord_lmry_special_accountperiod",
                filters: [
                    ["isinactive", "is", "F"], 'AND',
                    ["custrecord_lmry_anio_fisco", "is", paramPeriod]
                ],
                columns: [
                    search.createColumn({
                        name: "custrecord_lmry_accounting_period",
                        label: "Latam - Accounting Period"
                    })
                ]
            });

            if (paramAdjustment == false || paramAdjustment == 'F') {
                var adjustmentFilter = search.createFilter({
                    name: 'custrecord_lmry_adjustment',
                    operator: search.Operator.IS,
                    values: false
                });
                searchPeriodSpecial.filters.push(adjustmentFilter);
            }

            if (hasMultipleCalendars == true || hasMultipleCalendars == 'T') {
                var subsiCalendar = search.lookupFields({
                    type: search.Type.SUBSIDIARY,
                    id: paramSubsidiary,
                    columns: ['fiscalcalendar']
                });

                var calendarSub = {
                    id: subsiCalendar.fiscalcalendar[0].value,
                    nombre: subsiCalendar.fiscalcalendar[0].text
                }

                calendarSub = JSON.stringify(calendarSub);
                var fiscalCalendarFilter = search.createFilter({
                    name: 'custrecord_lmry_calendar',
                    operator: search.Operator.IS,
                    values: calendarSub
                });
                searchPeriodSpecial.filters.push(fiscalCalendarFilter);
            }

            var searchResult = searchPeriodSpecial.run().getRange(0, 100);
            for (i = 0; i < searchResult.length; i++) {
                var columns = searchResult[i].columns;
                specialPeriods_ID.push(searchResult[i].getValue(columns[0]));
            }

            return specialPeriods_ID;
        }

        function saveFile(fileContent, fileNumber) {
            folderId = objContext.getParameter({
                name: 'custscript_lmry_pe_inv_bal_file_cabinet'
            });

            var reportName = search.lookupFields({
                type: 'customrecord_lmry_pe_inv_bal_feature_rpt',
                id: paramReportId,
                columns: ['name']
            }).name;

            if (hasSubsidiariesFeature) {
                var subsidiaryRecord = search.lookupFields({
                    type: search.Type.SUBSIDIARY,
                    id: paramSubsidiary,
                    columns: ['legalname', 'taxidnum']
                });
                var companyName = subsidiaryRecord.legalname;
                var companyRuc = subsidiaryRecord.taxidnum;
            } else {
                var configpage = config.load({
                    type: config.Type.COMPANY_INFORMATION
                });
                var companyRuc = configpage.getValue('employerid');
                var companyName = configpage.getValue('legalname');
            }

/*             var periodName = search.lookupFields({
                type: search.Type.ACCOUNTING_PERIOD,
                id: paramPeriod,
                columns: ['periodname']
            }).periodname; */

            if (hasMultibookFeature) {
                var multibookName = search.lookupFields({
                    type: search.Type.ACCOUNTING_BOOK,
                    id: paramMultibook,
                    columns: ['name']
                }).name;
            }
            var fileName = getFileName(fileNumber) + '.txt';

            if (folderId) {
                var resultFile = file.create({
                    name: fileName,
                    fileType: file.Type.PLAINTEXT,
                    contents: fileContent,
                    encoding: file.Encoding.UTF8,
                    folder: folderId
                });
                var fileId = resultFile.save();

                var fileRecord = file.load({
                    id: fileId
                });

                var getURL = objContext.getParameter({
                    name: 'custscript_lmry_netsuite_location'
                });

                var fileUrl = '';

                if (getURL) {
                    fileUrl = 'https://' + getURL + fileRecord.url;
                }

                if (fileId) {
                    var usuarioTemp = runtime.getCurrentUser();
                    var id = usuarioTemp.id;

                    var employeeRecord = search.lookupFields({
                        type: search.Type.EMPLOYEE,
                        id: id,
                        columns: ['firstname', 'lastname']
                    });

                    var usuario = employeeRecord.firstname + ' ' + employeeRecord.lastname;

                    if (fileNumber > 0) {
                        var logRecord = record.create({
                            type: 'customrecord_lmry_pe_inv_bal_gener_log',
                        });
                    } else {
                        var logRecord = record.load({
                            type: 'customrecord_lmry_pe_inv_bal_gener_log',
                            id: paramLogId
                        });
                    }

                    //Nombre de Archivo
                    logRecord.setValue({
                        fieldId: 'custrecord_lmry_pe_inv_bal_name',
                        value: fileName
                    });
                    //Periodo
/*                     logRecord.setValue({
                        fieldId: 'custrecord_lmry_pe_inv_bal_postingperi',
                        value: periodName
                    }); */

                    //Nombre de Reporte
                    logRecord.setValue({
                        fieldId: 'custrecord_lmry_pe_inv_bal_transaction',
                        value: paramReportId
                    });

                    //Nombre de Subsidiaria
                    logRecord.setValue({
                        fieldId: 'custrecord_lmry_pe_inv_bal_subsidiary',
                        value: companyName
                    });

                    //Url de Archivo
                    logRecord.setValue({
                        fieldId: 'custrecord_lmry_pe_inv_bal_url_file',
                        value: fileUrl
                    });

                    //Multibook
                    if (hasMultibookFeature) {
                        logRecord.setValue({
                            fieldId: 'custrecord_lmry_pe_inv_bal_multibook',
                            value: multibookName
                        });
                    }

                    //Creado Por
                    logRecord.setValue({
                        fieldId: 'custrecord_lmry_pe_inv_bal_employee',
                        value: usuario
                    });

                    var recordId = logRecord.save();
                    libreria.sendConfirmUserEmail(reportName, 3, fileName, language);
                }
            }
        }

        function getFileName(fileNumber) {
            var name = '';
            if (featAccountingSpecial || featAccountingSpecial == 'T') {
                var dia = '31';
                var mes = '12';
                var anio = paramPeriod;
            } else {  
                var endDate = search.lookupFields({
                    type: search.Type.ACCOUNTING_PERIOD,
                    id: paramPeriod,
                    columns: ['enddate']
                }).enddate;
                endDate = format.parse({
                    value: endDate,
                    type: format.Type.DATE
                });

                var dia = endDate.getDate();
                var mes = endDate.getMonth() + 1;
                if (('' + dia).length == 1) dia = '0' + dia;
                if (('' + mes).length == 1) mes = '0' + mes;
                var anio = endDate.getFullYear();
            } 
            if (hasSubsidiariesFeature) {
                var companyRuc = search.lookupFields({
                    type: search.Type.SUBSIDIARY,
                    id: paramSubsidiary,
                    columns: ['taxidnum']
                }).taxidnum.replace(/-/g, '');
            } else {
                var configpage = config.load({
                    type: config.Type.COMPANY_INFORMATION
                });
                var companyRuc = configpage.getValue('employerid');
            }

           
            if (fileNumber > 1) {
                name = 'LE' + companyRuc + anio + mes + dia + '032000' + '07' + '2' + '1' + currency + '1' + '_' + count;
            } else {
                name = 'LE' + companyRuc + anio + mes + dia + '032000' + '07' + '2' + '1' + currency + '1';
            }
           

            return name;
        }

        function getCurrencies() {
            var currenciesJson = {};
            var savedSearch = search.create({
                type    : "currency",
                filters : [],
                columns : [
                    "internalid",
                    "symbol"
                ]
            });

            var objResult = savedSearch.run().getRange(0,1000);

            if (objResult != null && objResult.length != 0) {
                for (var i = 0; i < objResult.length; i++) {
                    currenciesJson[objResult[i].getValue('internalid')] = objResult[i].getValue('symbol');
                }
            }
            return currenciesJson;
        }

        function getCurrency() {
            var currenciesJson = getCurrencies();
            var result = '1';

            if (hasMultibookFeature) {
                var savedSearch = search.create({
                    type : 'accountingbook',
                    filters : [
                        ['internalid', 'is', paramMultibook]
                    ],
                    columns : [
                        search.createColumn({
                            name: "currency",
                        })
                    ]
                });

                if (hasSubsidiariesFeature) {
                    var subsidiaryFilter = search.createFilter({
                        name: 'subsidiary',
                        operator: search.Operator.ANYOF,
                        values: [paramSubsidiary]
                    });
                    savedSearch.filters.push(subsidiaryFilter);
                }

                var objResult = savedSearch.run().getRange(0, 1000);
                if (objResult != null && objResult.length) {
                    if (currenciesJson[objResult[0].getValue('currency')] == 'PEN') {
                        result = 1;
                    } else if (currenciesJson[objResult[0].getValue('currency')] == 'USD') {
                        result = 2;
                    }
                }
            }
            return result;
        }

        function setLogGenerator(isError) {
            var usuarioTemp = runtime.getCurrentUser();
            var id = usuarioTemp.id;
            var message = '';
            if (isError) {
                if (language == 'es') {
                    message = "Ocurrio un error inesperado en la ejecucion del reporte.";
                }else if(language == 'pt'){
                    message = "Ocorreu um erro inesperado na execução do relatório.";
                }else{
                    message = "An unexpected error occurred in the execution of the report.";
                }
            } else {
                if (language == 'es') {
                    message = "No existe informacion para los criterios seleccionados.";
                }else if(language == 'pt'){
                    message = "Nenhuma informação está disponível para os critérios selecionados.";
                }else{
                    message = "There is no information for the selected criteria.";
                }
            }
            var employeeRecord = search.lookupFields({
                type: search.Type.EMPLOYEE,
                id: id,
                columns: ['firstname', 'lastname']
            });

            var usuario = employeeRecord.firstname + ' ' + employeeRecord.lastname;

            var logRecord = record.load({
                type: 'customrecord_lmry_pe_inv_bal_gener_log',
                id: paramLogId
            });

            //Nombre de Archivo
            logRecord.setValue({
                fieldId: 'custrecord_lmry_pe_inv_bal_name',
                value: message
            });

            //Creado Por
            logRecord.setValue({
                fieldId: 'custrecord_lmry_pe_inv_bal_employee',
                value: usuario
            });

            var recordId = logRecord.save();
        }

        function getPeriods(startDateAux,endDateAux){
            var period=new Array();            
            var varFilter = new Array();  

            if (hasMultipleCalendars) {
                var varSubsidiary = search.lookupFields({
                    type: 'subsidiary',
                    id: paramSubsidiary,
                    columns: ['fiscalcalendar']
                });
                var fiscalCalendar = varSubsidiary.fiscalcalendar[0].value;
                
                var accountingperiodObj = search.create({
                    type: 'accountingperiod',
                    filters: [
                        ['isyear', 'is', 'F'],
                        'AND',
                        ['isquarter', 'is', 'F'],
                        'AND',
                        ['fiscalcalendar', 'anyof', fiscalCalendar],
                        'AND',
                        ['startdate', 'onorafter', startDateAux],
                        'AND',
                        ['startdate', 'onorbefore', endDateAux]
                    ],
                    columns: [
                        search.createColumn({
                            name: "periodname",
                            summary: "GROUP",
                            label: "Name"
                        }),
                        search.createColumn({
                            name: "startdate",
                            summary: "GROUP",
                            sort: search.Sort.ASC,
                            label: "Start Date"
                        }),
                        search.createColumn({
                            name: "enddate",
                            summary: "GROUP",
                            label: "End Date"
                        }),
                        search.createColumn({
                            name: "internalid",
                            summary: "GROUP",
                            label: "Internal ID"
                        })
                    ]
                });
            }else{

                var accountingperiodObj = search.create({
                    type: 'accountingperiod',
                    filters: [
                        ['isyear', 'is', 'F'],
                        'AND',
                        ['isquarter', 'is', 'F'],
                        'AND',
                        ['startdate', 'onorafter', startDateAux],
                        'AND',
                        ['startdate', 'onorbefore', endDateAux]
                    ],
                    columns: [
                        search.createColumn({
                            name: "periodname",
                            summary: "GROUP",
                            label: "Name"
                        }),
                        search.createColumn({
                            name: "startdate",
                            summary: "GROUP",
                            sort: search.Sort.ASC,
                            label: "Start Date"
                        }),
                        search.createColumn({
                            name: "enddate",
                            summary: "GROUP",
                            label: "End Date"
                        }),
                        search.createColumn({
                            name: "internalid",
                            summary: "GROUP",
                            label: "Internal ID"
                        })
                    ]
                });
            }

                if(paramAdjustment=='F'){
                    var periodAdjustFilter = search.createFilter({
                        name: "isadjust",
                        operator: search.Operator.IS,
                        values: 'F'
                    });
                    accountingperiodObj.filters.push(periodAdjustFilter); 
                }     

            // Ejecutando la busqueda
            var varResult = accountingperiodObj.run();
            var AccountingPeriodRpt = varResult.getRange({
                start: 0,
                end: 1000
            });

            if(AccountingPeriodRpt==null||AccountingPeriodRpt.length==0){
                return false;
            }else{
                    var columns;

                for(var i=0;i<AccountingPeriodRpt.length;i++){
                    columns = AccountingPeriodRpt[i].columns;
                    period[i]=new Array();
                    period[i] = AccountingPeriodRpt[i].getValue(columns[3]);
                }
            }
            return period;
        }


        function generarStringFilterPostingPeriodAnual(idsPeriod){
            var cant = idsPeriod.length;
            var comSimpl = "'";
            var strinic = "CASE WHEN ({postingperiod.id}="+comSimpl+idsPeriod[0]+comSimpl;
            var strAdicionales = "";
            var strfinal = ") THEN 1 ELSE 0 END";    
            for(var i=1; i<cant; i++){
                strAdicionales += " or {postingperiod.id}="+comSimpl+idsPeriod[i]+comSimpl;
            }
            var str = strinic + strAdicionales + strfinal;    
            return str;
        }

        function lengthInUtf8Bytes(str) {
            var m = encodeURIComponent(str).match(/%[89ABab]/g);
            return str.length + (m ? m.length : 0);
        }

        function round(number){
            return Math.round(Number(number) * 100) / 100;
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
    }
)