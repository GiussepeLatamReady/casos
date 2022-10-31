/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_PE_LibroCajaYBancosEfectiva_MPRD_V2.0.js    ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0    mayo 16 2022  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 *@NApiVersion 2.0
 *@NScriptType MapReduceScript
 *@Name LMRY_PE_LibroCajaYBancosEfectiva_MPRD_V2.0.js
 */
define(["N/search", "N/task", "N/runtime", "N/file", "N/record", "N/format", "N/config"],
    function (search, task, runtime, file, record, format, config) {

        var NAME_REPORT = "Libro de Caja y Bancos Efectiva";
        var LMRY_SCRIPT = 'LMRY_PE_LibroCajaYBancosEfectiva_MPRD_V2.0.js';
        var objContext = runtime.getCurrentScript();
        var LANGUAGE = runtime.getCurrentScript().getParameter({
            name: "LANGUAGE"
        }).substring(0, 2);

        if (LANGUAGE != "es" && LANGUAGE != "en" && LANGUAGE != "pt") {
            LANGUAGE = "en";
        }

        var PARAMETERS = {};//*
        var FEATURES = {};//*
        //Datos de Subsidiaria
        var COMPANY = {};

        var periodEndDate;
        var periodStartDate;
        var periodName
        var multibookName;

        //Periodo Special
        var periodEspecial = false;
        var arrPeriodSpecial = [];//*
        var inicial;//*
        var final;//*
        var MM_inicial='MES';
        var YYYY_inicial='ANHO';
        var DD_inicial='DIA';
        var MM_final;
        var YYYY_final;
        var DD_final;
        var specialName;//*
        var arrAccountingContextVerif = new Array();
        var arrTransactions = new Array();
        var range = 30000;
        var arrAccounts = new Array();
        function getInputData() {
            try {
                
                getParametersAndFeatures();
                getSubisidiaryData();
                log.debug('Parametros [getInputData]:', PARAMETERS);

                getAccounts();
                //Saldo Anterior
                var arrPreviousBalance = getPreviousBalance();
                //Movimentos
                log.debug("arrPreviousBalance",arrPreviousBalance.length)
                var arrMovements = getMovements();
                log.debug("arrMovements",arrMovements.length)
                //Movimentos pagos de facturas
                var arrMovementsPayments = getMovementsPayments();
                log.debug("arrMovementsPayments",arrMovementsPayments.length)
                var arrMovementsPayExpRep = getMovementsPayExpRep();
                log.debug("arrMovementsPayExpRep",arrMovementsPayExpRep.length)
                arrTransactions = arrTransactions.concat(arrPreviousBalance, arrMovements, arrMovementsPayments,arrMovementsPayExpRep);
                log.debug("arrTransactions",arrTransactions.length)

                recallControl();
                log.debug("arrTransactions [parse]",arrTransactions.length)
                return arrTransactions;
                //return [];
            } catch (err) {

                //libreria.sendMail(LMRY_SCRIPT, ' [ ObtainNameSubsidiaria ] ' + err);
                log.error("[ getInputData ]", err);
                return [{
                    "isError": "T",
                    "error": err
                }];
            }
        }


        function map(context) {
            try {
                var dataInput = JSON.parse(context.value);
                
                if (dataInput["isError"] == "T") {
                    context.write({
                        key: context.key,
                        value: {
                            arrTransactions: dataInput
                        }
                    });
                } else {
                    
                    if (dataInput.length==1) {
                        log.debug("isRecall [map]",dataInput)
                        context.write({
                            key: context.key,
                            value: {
                                arrTransactions: dataInput
                            }
                        });
                    }else{
                        FEATURES.MULTIBOOK = runtime.isFeatureInEffect({
                            feature: "MULTIBOOK"
                        });
                        FEATURES.SUBSID = runtime.isFeatureInEffect({
                            feature: "SUBSIDIARIES"
                        });
                        PARAMETERS.SUBSID = '2';
                        var key;
                        if (dataInput[11] == 'SALDO INICIAL') {
                            key = 'previousBalance';
                        } else if (dataInput[11] == 'MOVPAY') {
                            key = 'movementsPayments';
                        } else {
                            key = 'movements';
                        }
                        
                        if (FEATURES.MULTIBOOK || FEATURES.MULTIBOOK == 'T') {
                            getVerifiedAccounts();
                        }

                        dataInput = cleanData(dataInput);

                        if (key == 'previousBalance') {

                            dataInput[4] = getCurrencyName(dataInput[4]);
                        }
                        if (key == 'movements') {

                            dataInput[23] = getCurrencyName(dataInput[4]);
                        }

                        if (key == 'movementsPayments') {
                            changeTaxDocuments(dataInput);
                            if (!(dataInput[2] == '' && dataInput[3] == '' && dataInput[4] == '')) {
                                context.write({
                                    key: key,
                                    value: {
                                        arrTransactions: dataInput
                                    }
                                });
                            }

                        } else {
                            var bankInfo = filterAccounts(dataInput);
                            //log.debug("bank",bankInfo);
                            //log.debug("bankcode",bankInfo.bankCode);
                            if ((bankInfo.bankCode == '' || bankInfo.bankAccount == '') && (bankInfo.type == 'Bank')) {
                                if (bankInfo.sunatHabil || bankInfo.sunatHabil == 'T') {
                                    if (bankInfo.onceSunat == '10') {
                                        //log.debug("flag","ingresado 1")
                                        if (key == 'movements') {
                                            updatePeriod(dataInput);
                                        }
                                        context.write({
                                            key: key,
                                            value: {
                                                arrTransactions: dataInput
                                            }
                                        });
                                    }
                                } else {
                                    if (bankInfo.onceNum == '10') {
                                        //log.debug("flag","ingresado 2")
                                        if (key == 'movements') {
                                            updatePeriod(dataInput);
                                        }
                                        context.write({
                                            key: key,
                                            value: {
                                                arrTransactions: dataInput
                                            }
                                        });
                                    }
                                }
                            }
                        }
                    }
                    



                }


            } catch (err) {
                log.error("[ map ]", err);
                context.write({
                    key: context.key,
                    value: {
                        isError: "T",
                        error: err
                    }
                });

            }
        }

        function summarize(context) {
            try {
                
                getParametersAndFeatures();
                log.debug('Parametros [summarize]:', PARAMETERS);
                getSubisidiaryData();
                if (FEATURES.MULTIBOOK || FEATURES.MULTIBOOK == 'T') {
                    getVerifiedAccounts();
                }

                // var arrPreviousBalance = new Array();
                // var arrMovements = new Array();
                // var arrMovementsPayments = new Array();
                var arrTransactions = new Array();
                var isRecall;
                context.output.iterator().each(function (key, value) {
                    if (JSON.parse(value).arrTransactions.length==1) {
                        isRecall=JSON.parse(value).arrTransactions[0];
                    }else{
                        arrTransactions.push(JSON.parse(value).arrTransactions);
                    }
                    
                    // var type = key;
                    // if (type == "previousBalance") {
                    //     var jsonSaldoAnterior = JSON.parse(value);
                    //     arrPreviousBalance.push(jsonSaldoAnterior.arrTransactions);


                    // } else if (type == "movements") {
                    //     var jsonMovimientos = JSON.parse(value);
                    //     arrMovements.push(jsonMovimientos.arrTransactions);


                    // } else if (type == "movementsPayments") {
                    //     var jsonMovimientosPayments = JSON.parse(value);
                    //     arrMovementsPayments.push(jsonMovimientosPayments.arrTransactions);


                    // }
                    return true;
                });
                log.error("arrTransactions [summarize]",arrTransactions.length)
                log.debug("isRcall [summarize]",isRecall);
                // log.debug("arrPreviousBalance",arrPreviousBalance.length);
                // log.debug("arrMovements",arrMovements.length);
                // log.debug("arrMovementsPayments",arrMovementsPayments.length);
                // log.debug("console","Agrupando saldo inicial...");

                // if (arrAccountingContextVerif.length!=0) {
                //     arrPreviousBalance = joinRepeat(arrPreviousBalance);
                // }
                // log.debug("console","agrupacion terminada...");     
                // log.debug("console","Ordenando pago de movimientos...");
                // arrMovementsPayments.sort(function(a,b){
                //     return a[4]-b[4];
                // });
                // log.debug("console","pago de movimientos ordenados.");
                // log.debug("console","Agrupando movimientos...");
                // arrMovements = joinMovements(arrMovements, arrMovementsPayments);
                // log.debug("console","Movimientos Agrupados.");
                
                // log.debug("console","Agrupando Total de transacciones...");     
                // var arrTransactions = joinTransactions(arrPreviousBalance, arrMovements);
                // log.debug("console","Total de transacciones agrupadas");
                
                
                
                if (arrTransactions.length != 0) {
                    // var file_size = 7340032
                    // var newTransactions = new Array();
                    var stringTemporal
                    var cont = 1;
                    stringTemporal = JSON.stringify(arrTransactions);
                    // arrTransactions.forEach(function (transaction) {
                    //     newTransactions.push(transaction);
                    //     stringTemporal = JSON.stringify(newTransactions);
                    //     var string_size_in_bytes = lengthInUtf8Bytes(stringTemporal);
                    //     if (string_size_in_bytes >= file_size) {
                    //         saveAuxiliarFile(stringTemporal, cont);
                    //         newTransactions = new Array();
                    //         cont++;
                    //     }
                    // })
                    if (isRecall) {
                        log.debug("console","rellamado")
                        saveAuxiliarFile(stringTemporal, isRecall);
                        recallMapReduce();
                    }else{
                        log.debug("console","Pintar")
                        saveAuxiliarFile(stringTemporal, isRecall);
                        callSchedule();
                    }
                                                         
                } else {
                    //NoData();
                    log.debug("No data","no data");
                }
                
            } catch (err) {

                log.error("[ summarize ]", err);
                //updateLogGenerator('error');
                //libreria.sendMail(LMRY_SCRIPT, ' [ Summarize ] ' + err);
            }
        }


        function getParametersAndFeatures() {
            // Parametros

            //paramperiodo
            PARAMETERS.PERIOD = '128';

            //paramClosedPeriod
            PARAMETERS.CLOSED_PERIOD ='F';
            //paramsubsidi
            PARAMETERS.SUBSID = '2';
            //paramMultibook
            PARAMETERS.MULTIBOOK = ' ';
            //paramrecoid
            PARAMETERS.RECORDID = '';

            //paramTipoExtPeriodo
            PARAMETERS.TYPE_EXT_PERIOD = '1';

            //paramIndicadorOp
            PARAMETERS.OPERATIONS_INDICATOR ='1';

            PARAMETERS.FILES = objContext.getParameter({
                name: 'custscript_smc_pe_caj_banc_efec_file_mp'
            });
            PARAMETERS.LIMIT = objContext.getParameter({
                name: 'custscript_smc_pe_caj_banc_efec_lmit_mp'
            });
            log.debug("PARAMETERS.FILES [NEW]",PARAMETERS.FILES)
            if (PARAMETERS.FILES==''||PARAMETERS.FILES==' '||PARAMETERS.FILES==null) {
                PARAMETERS.FILES = new Array();
            }else{
                PARAMETERS.FILES =JSON.parse(PARAMETERS.FILES);
            }
            if (PARAMETERS.LIMIT==''||PARAMETERS.LIMIT==' '||PARAMETERS.LIMIT==null) {
                PARAMETERS.LIMIT = 0;
            }else{
                PARAMETERS.LIMIT = parseInt(PARAMETERS.LIMIT);
            }

            //featuresubs 
            FEATURES.SUBSID = runtime.isFeatureInEffect({
                feature: "SUBSIDIARIES"
            });
            //feamultibook
            FEATURES.MULTIBOOK = runtime.isFeatureInEffect({
                feature: "MULTIBOOK"
            });

            FEATURES.CLASS = runtime.isFeatureInEffect({
                feature: "CLASSES"//classes
            });

            FEATURES.DEPARTMENT = runtime.isFeatureInEffect({
                feature: "DEPARTMENTS"//departments
            });
            //Period enddate para el nombre del libro
            var periodEndDateTemp = search.lookupFields({
                type: search.Type.ACCOUNTING_PERIOD,
                id: PARAMETERS.PERIOD,
                columns: ['startdate', 'enddate', 'periodname']
            });

            periodEndDate = periodEndDateTemp.enddate;
            periodStartDate = periodEndDateTemp.startdate;
            periodName = periodEndDateTemp.periodname;

            //Multibook Name
            if (FEATURES.MULTIBOOK || FEATURES.MULTIBOOK == 'T') {
                var multibookNameTemp = search.lookupFields({
                    type: search.Type.ACCOUNTING_BOOK,
                    id: PARAMETERS.MULTIBOOK,
                    columns: ['name']
                });

                multibookName = multibookNameTemp.name;
            }

            periodEspecial = getConfigSpecialPeriod();

            if (periodEspecial) {
                arrPeriodSpecial = getSpecialPeriodData();

                if (arrPeriodSpecial.length > 0) {
                    inicial = format.parse({
                        value: arrPeriodSpecial[1],
                        type: format.Type.DATE
                    });

                    MM_inicial = inicial.getMonth() + 1;
                    YYYY_inicial = inicial.getFullYear();
                    DD_inicial = inicial.getDate();

                    //Inicial = DD_inicial +';'+ MM_inicial +';'+ YYYY_inicial;

                    inicial = new Date(Number('' + YYYY_inicial), Number('' + MM_inicial - 1), Number('' + (DD_inicial)));

                    inicial = format.format({
                        value: inicial,
                        type: format.Type.DATE
                    });

                    final = format.parse({
                        value: arrPeriodSpecial[2],
                        type: format.Type.DATE
                    });

                    MM_final = final.getMonth() + 1;
                    YYYY_final = final.getFullYear();
                    DD_final = final.getDate();

                    //Final = DD_final +';'+ MM_final +';'+ YYYY_final;

                    final = new Date(Number('' + YYYY_final), Number('' + MM_final - 1), Number('' + (DD_final)));

                    final = format.format({
                        value: final,
                        type: format.Type.DATE
                    });
                }
                specialName = arrPeriodSpecial[0];

            }


        }

        function recallControl(){
            //Controla la cantidad de transacciones a procesar, si excede al valor de "range" realiza un rellamado
            var newLimit = PARAMETERS.LIMIT + range;
            var lengthTransactions=arrTransactions.length;
            var isRecall=false;
            log.debug("newLimit",newLimit)
            
            if (newLimit >= lengthTransactions) {
                arrTransactions = arrTransactions.slice(PARAMETERS.LIMIT, lengthTransactions);
            }else{
                arrTransactions = arrTransactions.slice(PARAMETERS.LIMIT, newLimit);
                isRecall=true;
            }
            

            arrTransactions.push([isRecall])
        }
        function updatePeriod(transactions){
            if (transactions[21] != null && transactions[21] != '' && transactions[21] != ' ') {
                transactions[21] = getPeriodUpdate(transactions[21]);
                var fechaUpdate = getPeriod(transactions[21], 1);
                fechaUpdate = fechaUpdate.split('/');
                var UpdateMonth = fechaUpdate[1];
                var UpdateYear = fechaUpdate[2];
                //1. Periodo
                var peri = '' + UpdateYear + UpdateMonth + '00';
                transactions[21]=peri;
            }
        }

        function getPeriodUpdate(update) {

            var columna0 = '';
            var docSearch = search.create({
                type: 'customrecord_lmry_cl_period_fact_actual',
                filters: [
                    ["internalidnumber", "equalto", update]
                ],
                columns: [{
                    name: 'custrecord_lmry_cl_period_fact_actual'
                }]

            });
            var pageData = docSearch.runPaged({
                pageSize: 1000
            });
            pageData.pageRanges.forEach(function (pageRange) {
                page = pageData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    var columns = result.columns;
                    columna0 = result.getText(columns[0]);
                });
            });
            return columna0;
        }

        function getPeriod(period, tipoExtraccion) {

            var fechaString = '';
            var auxanio;
            var auxmess;

            if (tipoExtraccion == 1) {
                auxanio = period.substring(4);
                switch (period.substring(0, 3).toLowerCase()) {
                    case 'jan':
                        auxmess = '01';
                        break;
                    case 'ene':
                        auxmess = '01';
                        break;
                    case 'feb':
                        auxmess = '02';
                        break;
                    case 'mar':
                        auxmess = '03';
                        break;
                    case 'abr':
                        auxmess = '04';
                        break;
                    case 'apr':
                        auxmess = '04';
                        break;
                    case 'may':
                        auxmess = '05';
                        break;
                    case 'jun':
                        auxmess = '06';
                        break;
                    case 'jul':
                        auxmess = '07';
                        break;
                    case 'ago':
                        auxmess = '08';
                        break;
                    case 'aug':
                        auxmess = '08';
                        break;
                    case 'set':
                        auxmess = '09';
                        break;
                    case 'sep':
                        auxmess = '09';
                        break;
                    case 'oct':
                        auxmess = '10';
                        break;
                    case 'nov':
                        auxmess = '11';
                        break;
                    case 'dic':
                        auxmess = '12';
                        break;
                    case 'dec':
                        auxmess = '12';
                        break;
                    default:
                        auxmess = '00';
                        break;
                }
                fechaString = '00/' + auxmess + '/' + auxanio;

            } 
            return fechaString;
        }

        function getConfigSpecialPeriod() {
            var activateSpecialPeriod = false;
            var licenses = new Array();
            if (FEATURES.SUBSID) {
                ///licenses = libreriaLicense.getLicenses(PARAMETERS.SUBSID);
                activateSpecialPeriod = false;
            }
            return activateSpecialPeriod;
        }

        function getSpecialPeriodData() {
            //ObtenerDatosPeriodo()
            var arrDate = new Array();
            var searchPeriodSpecial = search.create({
                type: "customrecord_lmry_special_accountperiod",
                filters: [
                    ["isinactive", "is", "F"],
                    "AND", ["custrecord_lmry_accounting_period", "anyof", PARAMETERS.PERIOD]
                ],
                columns: [
                    search.createColumn({
                        name: "name",
                        label: "Name"
                    }),
                    search.createColumn({
                        name: "formuladatetime",
                        formula: "{custrecord_lmry_date_ini}",
                        label: "Formula (Date/Time)"
                    }),
                    search.createColumn({
                        name: "formuladatetime",
                        formula: "{custrecord_lmry_date_fin}",
                        label: "Formula (Date/Time)"
                    })
                ]
            });

            var searchResult = searchPeriodSpecial.run().getRange(0, 100);

            if (searchResult.length != 0) {
                var columns = searchResult[0].columns;
                var periodName = searchResult[0].getValue(columns[0]);
                var periodFirstDate = searchResult[0].getValue(columns[1]);
                periodEndDate = searchResult[0].getValue(columns[2]);

                arrDate = [periodName, periodFirstDate, periodEndDate];
            }

            return arrDate;

        }

        function getSubisidiaryData() {
            var configpage = config.load({
                type: config.Type.COMPANY_INFORMATION
            });

            if (FEATURES.SUBSID) {
                if (PARAMETERS.SUBSID != '' && PARAMETERS.SUBSID != null) {
                    var subsidyName = search.lookupFields({
                        type: search.Type.SUBSIDIARY,
                        id: PARAMETERS.SUBSID,
                        columns: ['legalname', 'taxidnum']
                    });

                }
                COMPANY.NAME = subsidyName.legalname;
                COMPANY.RUC = subsidyName.taxidnum;
            } else {
                COMPANY.RUC = configpage.getValue('employerid');
                COMPANY.NAME = configpage.getValue('legalname');
                COMPANY.COUNTRY = configpage.getValue('country');
            }

            COMPANY.RUC = COMPANY.RUC.replace(' ', '');
        }

        function getAccounts() {
            var busqueda = search.create({
                type: search.Type.ACCOUNT,
                filters: [
                    [
                        ["formulatext: case when {custrecord_lmry_pe_sunat_cta_habilitado} ='T' then {custrecord_lmry_pe_sunat_cta_codigo} else {custrecord_lmry_desp_cta_cont_corporativ} END", "startswith", "10"]
                    ]
                ],
                columns: [
                    search.createColumn({
                        name: "internalid"
                    })
                ]
            });
            if (FEATURES.SUBSID) {
                var subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: [PARAMETERS.SUBSID]
                });
                busqueda.filters.push(subsidiaryFilter);
            }

            var pageData = busqueda.runPaged({
                pageSize: 1000
            });

            pageData.pageRanges.forEach(function (pageRange) {
                page = pageData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    var columns = result.columns;
                    //0. Internal Id
                    if (result.getValue(columns[0]) != null && result.getValue(columns[0]) != '- None -' && result.getValue(columns[0]) != '') {
                        arrAccounts.push(result.getValue(columns[0]));
                    }
                });
            });


        }

        function getPreviBalanPEJInternalids(){
            var internalIds = new Array();
            var savedsearch = search.create({
                type: "transaction",
                filters:
                    [
                        ["type", "anyof", "PEJrnl"],
                        "AND",
                        ["memorized", "is", "F"],
                        "AND",
                        ["voided", "is", "F"],
                        "AND",
                        ["posting", "is", "T"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ],
                settings:
                    [
                        {
                            name: 'includeperiodendtransactions',
                            value: 'TRUE'
                        }
                    ]
            });
            //Filtros
            if (FEATURES.SUBSID) {
                var subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: [PARAMETERS.SUBSID]
                });
                savedsearch.filters.push(subsidiaryFilter);

                var FilterCountry = search.createFilter({
                    name: 'formulanumeric',
                    formula: "CASE WHEN {custbody_lmry_subsidiary_country}='Peru' OR {custbody_lmry_subsidiary_country}='Perú' THEN 1 ELSE CASE WHEN {subsidiary.country}='Peru' OR {subsidiary.country}='Perú' THEN 1 ELSE 0 END END",
                    operator: search.Operator.EQUALTO,
                    values: [1]
                });
                savedsearch.filters.push(FilterCountry);
            }
            //PERIODO
            if (PARAMETERS.CLOSED_PERIOD == 'T' || PARAMETERS.CLOSED_PERIOD == true) {
                var periodaux = search.lookupFields({
                    type: search.Type.ACCOUNTING_PERIOD,
                    id: PARAMETERS.PERIOD,
                    columns: ['enddate', 'startdate']
                });

                var paramFechaIni = periodaux.startdate;

                var auxIni = format.parse({
                    type: format.Type.DATE,
                    value: paramFechaIni
                });

                var AAAA = auxIni.getFullYear();
                var MM = auxIni.getMonth() + 1;
                var DD = auxIni.getDate();
                var aux = DD + '/' + MM + '/' + AAAA;
                var auxiliar = aux.split('/');

                if (auxiliar[1].length == 1) {
                    auxiliar[1] = '0' + auxiliar[1];
                }

                if (auxiliar[1] == '12') {
                    var periodFilter = search.createFilter({
                        name: 'trandate',
                        // join: 'transaction',
                        operator: search.Operator.BEFORE,
                        values: [paramFechaIni]
                    });
                    savedsearch.filters.push(periodFilter);
                }


            } else {
                var periodFilter = search.createFilter({
                    name: 'startdate',
                    join: 'accountingperiod',
                    operator: search.Operator.BEFORE,
                    values: [periodStartDate]
                });
                savedsearch.filters.push(periodFilter);
            }

            if (FEATURES.MULTIBOOK) {
                var multibookFilter = search.createFilter({
                    name: 'accountingbook',
                    join: 'accountingtransaction',
                    operator: search.Operator.IS,
                    values: [PARAMETERS.MULTIBOOK]
                });
                savedsearch.filters.push(multibookFilter);

                var formula_act = "CASE WHEN ";

                for (var i = 0; i < arrAccounts.length; i++) {
                    formula_act += "{accountingtransaction.account.id} = " + arrAccounts[i];

                    if (i != arrAccounts.length - 1) {
                        formula_act += " OR ";
                    }
                }
                formula_act += " THEN 1 ELSE 0 END";

                var cuentaFilter = search.createFilter({
                    name: 'formulatext',
                    formula: formula_act,
                    operator: search.Operator.IS,
                    values: [1]
                });
                savedsearch.filters.push(cuentaFilter);

            } else {

                var formula_act = "CASE WHEN ";

                for (var i = 0; i < arrAccounts.length; i++) {
                    formula_act += "{account.id} = " + arrAccounts[i];

                    if (i != arrAccounts.length - 1) {
                        formula_act += " OR ";
                    }
                }

                formula_act += " THEN 1 ELSE 0 END";

                var cuentaFilter = search.createFilter({
                    name: 'formulatext',
                    formula: formula_act,
                    operator: search.Operator.IS,
                    values: [1]
                });
                savedsearch.filters.push(cuentaFilter);
               

            }

            var pageData = savedsearch.runPaged({
                pageSize: 1000
            });

            pageData.pageRanges.forEach(function (pageRange) {
                page = pageData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    var columns = result.columns;
                    // 0.Internal id
                    var internalId = result.getValue(columns[0]);
           
                    internalIds.push(internalId);
                });
            });
            return internalIds;
        }

        function getPreviBalanPEJ(internalIds){
            var arrReturn = new Array();
            var savedsearch = search.create({
                type: "transaction",
                filters:
                    [
                        ["posting", "is", "T"],
                        "AND",
                        ["internalid", "anyof", internalIds]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "CASE WHEN {account.custrecord_lmry_pe_sunat_cta_habilitado} = 'T' THEN {account.custrecord_lmry_pe_sunat_cta_codigo} ELSE {account.number} END",
                            sort: search.Sort.ASC,
                            label: "0. Código de la cuenta contable"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "''",
                            sort: search.Sort.ASC,
                            label: "1. CUO"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "''",
                            sort: search.Sort.ASC,
                            label: "2. Código de la unidad de operación"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "''",
                            sort: search.Sort.ASC,
                            label: "3. Código de centro de costos"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "''",
                            sort: search.Sort.ASC,
                            label: "4. Tipo de moneda de origen"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "''",
                            sort: search.Sort.ASC,
                            label: "5. Tipo de Comprobante de Pago o Documento asociada a la operación"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "''",
                            sort: search.Sort.ASC,
                            label: "6. Número serie del comprobante de pago o documento asociada a la operación"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "''",
                            sort: search.Sort.ASC,
                            label: "7.  Número del comprobante de pago o documento asociada a la operación"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "''",
                            sort: search.Sort.ASC,
                            label: "8.  Fecha contable"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "''",
                            sort: search.Sort.ASC,
                            label: "9. Fecha de Vencimiento"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "''",
                            sort: search.Sort.ASC,
                            label: "10. Fecha de la operación o emisión"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "'SALDO INICIAL'",
                            sort: search.Sort.ASC,
                            label: "11. Glosa o descripción de la naturaleza de la operación registrada"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "''",
                            sort: search.Sort.ASC,
                            label: "12. Glosa referencial, de ser el caso"
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            summary: "SUM",
                            formula: "NVL({debitamount},0)",
                            label: "Formula (Currency)"
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            summary: "SUM",
                            formula: "NVL({creditamount},0)",
                            label: "Formula (Currency)"
                        })
                    ],
                settings:
                    [
                        {
                            name: 'includeperiodendtransactions',
                            value: 'TRUE'
                        }
                    ]
            });
       
            //15
            var accountIdColumn = search.createColumn({
                name: 'internalid',
                join: 'account',
                summary: 'GROUP'
            })
            savedsearch.columns.push(accountIdColumn);

            if (FEATURES.MULTIBOOK) {            
                //16
                var debitColumn = search.createColumn({
                    name: "formulacurrency",
                    formula: 'NVL({accountingtransaction.debitamount},0)',
                    summary: 'sum'
                });
                savedsearch.columns.push(debitColumn);

                //17
                var creditColumn = search.createColumn({
                    name: "formulacurrency",
                    formula: 'NVL({accountingtransaction.creditamount},0)',
                    summary: 'sum'
                });
                savedsearch.columns.push(creditColumn);

                //18
                var accountID = search.createColumn({
                    name: 'formulanumeric',
                    summary: search.Summary.GROUP,
                    formula: '{accountingtransaction.account.id}'
                });
                savedsearch.columns.push(accountID);
                //19
                var dependecyColumn = search.createColumn({
                    name: "formulatext",
                    summary: "GROUP",
                    formula: "{appliedtotransaction.custbody_lmry_depen_aduanera}",
                    label: "19 Codigo Dependencia Aduanera"
                })
                savedsearch.columns.push(dependecyColumn);
            } else {
                //16
                var dependecyColumn = search.createColumn({
                    name: "formulatext",
                    summary: "GROUP",
                    formula: "{appliedtotransaction.custbody_lmry_depen_aduanera}",
                    label: "16 Codigo Dependencia Aduanera"
                })
                savedsearch.columns.push(dependecyColumn);

            }

            var pageData = savedsearch.runPaged({
                pageSize: 1000
            });

            pageData.pageRanges.forEach(function (pageRange) {
                page = pageData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    var columns = result.columns;
                    var arrTemp = new Array();
                    for (var col = 0; col < columns.length; col++) {
                        if (FEATURES.MULTIBOOK) {
                            if (col == 4) {
                                arrTemp[col] = result.getValue(columns[18]);
                            } else if (col == 13) {
                                arrTemp[col] = result.getValue(columns[16]);
                            } else if (col == 14) {
                                arrTemp[col] = result.getValue(columns[17]);
                            } else {
                                if (col == 19) {
                                    arrTemp[col] = result.getValue(columns[19]);

                                }
                                arrTemp[col] = result.getValue(columns[col]);
                            }
                        } else {
                            if (col == 4) {
                                arrTemp[col] = result.getValue(columns[15]);
                            } else {
                                arrTemp[col] = result.getValue(columns[col]);
                            }
                        }
                        if (FEATURES.MULTIBOOK) {
                            arrTemp[20] = result.getValue(columns[18]);
                            arrTemp[21] = result.getValue(columns[19]);
                        } else {
                            arrTemp[20] = result.getValue(columns[15]);
                            arrTemp[21] = result.getValue(columns[16]);
                        }
                    }

                    if (Number(arrTemp[13]) - Number(arrTemp[14]) != 0) {
                        if (FEATURES.SUBSID) {
                            arrReturn.push(arrTemp);
                        } else {
                            if (COMPANY.COUNTRY == 'PE') {
                                arrReturn.push(arrTemp);
                            }
                        }
                    }

                });
            });

            return arrReturn;

        }
        function getTransactionsPB() {
            var arrReturn = new Array();

            /** LatamReady - PE Efec C and B SI **/
            var savedsearch = search.load({

                id: 'customsearch_lmry_pe_caja_bacos_efec_si'
            });



            //Filtros
            if (FEATURES.SUBSID) {
                var subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: [PARAMETERS.SUBSID]
                });
                savedsearch.filters.push(subsidiaryFilter);

                var FilterCountry = search.createFilter({
                    name: 'formulanumeric',
                    formula: "CASE WHEN {custbody_lmry_subsidiary_country}='Peru' OR {custbody_lmry_subsidiary_country}='Perú' THEN 1 ELSE CASE WHEN {subsidiary.country}='Peru' OR {subsidiary.country}='Perú' THEN 1 ELSE 0 END END",
                    operator: search.Operator.EQUALTO,
                    values: [1]
                });
                savedsearch.filters.push(FilterCountry);
            }
            //PERIODO
            if (PARAMETERS.CLOSED_PERIOD == 'T' || PARAMETERS.CLOSED_PERIOD == true) {
                var periodaux = search.lookupFields({
                    type: search.Type.ACCOUNTING_PERIOD,
                    id: PARAMETERS.PERIOD,
                    columns: ['enddate', 'startdate']
                });

                var paramFechaIni = periodaux.startdate;

                var auxIni = format.parse({
                    type: format.Type.DATE,
                    value: paramFechaIni
                });

                var AAAA = auxIni.getFullYear();
                var MM = auxIni.getMonth() + 1;
                var DD = auxIni.getDate();
                var aux = DD + '/' + MM + '/' + AAAA;
                var auxiliar = aux.split('/');

                if (auxiliar[1].length == 1) {
                    auxiliar[1] = '0' + auxiliar[1];
                }

                if (auxiliar[1] == '12') {
                    var periodFilter = search.createFilter({
                        name: 'trandate',
                        // join: 'transaction',
                        operator: search.Operator.BEFORE,
                        values: [paramFechaIni]
                    });
                    savedsearch.filters.push(periodFilter);
                }


            } else {
                var periodFilter = search.createFilter({
                    name: 'startdate',
                    join: 'accountingperiod',
                    operator: search.Operator.BEFORE,
                    values: [periodStartDate]
                });
                savedsearch.filters.push(periodFilter);
            }


            //15
            var accountIdColumn = search.createColumn({
                name: 'internalid',
                join: 'account',
                summary: 'GROUP'
            })
            savedsearch.columns.push(accountIdColumn);

            if (FEATURES.MULTIBOOK) {
                var multibookFilter = search.createFilter({
                    name: 'accountingbook',
                    join: 'accountingtransaction',
                    operator: search.Operator.IS,
                    values: [PARAMETERS.MULTIBOOK]
                });
                savedsearch.filters.push(multibookFilter);

                var formula_act = "CASE WHEN ";

                for (var i = 0; i < arrAccounts.length; i++) {
                    formula_act += "{accountingtransaction.account.id} = " + arrAccounts[i];

                    if (i != arrAccounts.length - 1) {
                        formula_act += " OR ";
                    }
                }
                formula_act += " THEN 1 ELSE 0 END";

                var cuentaFilter = search.createFilter({
                    name: 'formulatext',
                    formula: formula_act,
                    operator: search.Operator.IS,
                    values: [1]
                });
                savedsearch.filters.push(cuentaFilter);

                //16
                var debitColumn = search.createColumn({
                    name: "formulacurrency",
                    formula: 'NVL({accountingtransaction.debitamount},0)',
                    summary: 'sum'
                });
                savedsearch.columns.push(debitColumn);

                //17
                var creditColumn = search.createColumn({
                    name: "formulacurrency",
                    formula: 'NVL({accountingtransaction.creditamount},0)',
                    summary: 'sum'
                });
                savedsearch.columns.push(creditColumn);

                //18
                var accountID = search.createColumn({
                    name: 'formulanumeric',
                    summary: search.Summary.GROUP,
                    formula: '{accountingtransaction.account.id}'
                });
                savedsearch.columns.push(accountID);
                //19
                var dependecyColumn = search.createColumn({
                    name: "formulatext",
                    summary: "GROUP",
                    formula: "{appliedtotransaction.custbody_lmry_depen_aduanera}",
                    label: "19 Codigo Dependencia Aduanera"
                })
                savedsearch.columns.push(dependecyColumn);
            } else {

                var formula_act = "CASE WHEN ";

                for (var i = 0; i < arrAccounts.length; i++) {
                    formula_act += "{account.id} = " + arrAccounts[i];

                    if (i != arrAccounts.length - 1) {
                        formula_act += " OR ";
                    }
                }

                formula_act += " THEN 1 ELSE 0 END";

                var cuentaFilter = search.createFilter({
                    name: 'formulatext',
                    formula: formula_act,
                    operator: search.Operator.IS,
                    values: [1]
                });
                savedsearch.filters.push(cuentaFilter);
                //16
                var dependecyColumn = search.createColumn({
                    name: "formulatext",
                    summary: "GROUP",
                    formula: "{appliedtotransaction.custbody_lmry_depen_aduanera}",
                    label: "16 Codigo Dependencia Aduanera"
                })
                savedsearch.columns.push(dependecyColumn);

            }

            var pageData = savedsearch.runPaged({
                pageSize: 1000
            });

            pageData.pageRanges.forEach(function (pageRange) {
                page = pageData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    var columns = result.columns;
                    var arrTemp = new Array();
                    for (var col = 0; col < columns.length; col++) {
                        if (FEATURES.MULTIBOOK) {
                            if (col == 4) {
                                arrTemp[col] = result.getValue(columns[18]);
                            } else if (col == 13) {
                                arrTemp[col] = result.getValue(columns[16]);
                            } else if (col == 14) {
                                arrTemp[col] = result.getValue(columns[17]);
                            } else {
                                if(col == 19){
                                    arrTemp[col] = result.getValue(columns[19]);
                                    
                                 }
                                arrTemp[col] = result.getValue(columns[col]);
                            }
                        } else {
                            if (col == 4) {
                                arrTemp[col] = result.getValue(columns[15]);
                            } else {
                                arrTemp[col] = result.getValue(columns[col]);
                            }
                        }
                        if (FEATURES.MULTIBOOK) {
                            arrTemp[20] = result.getValue(columns[18]);
                            arrTemp[21] = result.getValue(columns[19]);
                        } else {
                            arrTemp[20] = result.getValue(columns[15]);
                            arrTemp[21] = result.getValue(columns[16]);
                        }
                    }

                    if (Number(arrTemp[13]) - Number(arrTemp[14]) != 0) {
                        if (FEATURES.SUBSID) {
                            arrReturn.push(arrTemp);
                        } else {
                            if (COMPANY.COUNTRY == 'PE') {
                                arrReturn.push(arrTemp);
                            }
                        }
                    }

                });
            });

            return arrReturn;
        }


        function getPreviousBalance() {
            var arrPreviousBalance = new Array();
            if (arrAccounts.length != 0) {
                arrPreviousBalance = getTransactionsPB();

                if (FEATURES.MULTIBOOK) {
                    //Sea agrega transacciones Period End Journal al arreglo
                    var internalIds = getPreviBalanPEJInternalids();
                    
                    if (internalIds.length!=0) {
                        var arrPreviousBalancePEJ = getPreviBalanPEJ(internalIds);
                        arrPreviousBalance = arrPreviousBalance.concat(arrPreviousBalancePEJ);
                    }
                    
                }
            }
            return arrPreviousBalance;

        }

        function getMovPEJInternalids(){
            var internalIds = new Array();
            var savedsearch = search.create({
                type: "transaction",
                filters:
                    [
                        ["type", "anyof", "PEJrnl"],
                        "AND",
                        ["memorized", "is", "F"],
                        "AND",
                        ["voided", "is", "F"],
                        "AND",
                        ["posting", "is", "T"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ],
                settings:
                    [
                        {
                            name: 'includeperiodendtransactions',
                            value: 'TRUE'
                        }
                    ]
            });
            
            //Filtros
            if (FEATURES.SUBSID) {
                var subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: [PARAMETERS.SUBSID]
                });
                savedsearch.filters.push(subsidiaryFilter);

                var FilterCountry = search.createFilter({
                    name: 'formulanumeric',
                    formula: "CASE WHEN {custbody_lmry_subsidiary_country}='Peru' OR {custbody_lmry_subsidiary_country}='Perú' THEN 1 ELSE CASE WHEN {subsidiary.country}='Peru' OR {subsidiary.country}='Perú' THEN 1 ELSE 0 END END",
                    operator: search.Operator.EQUALTO,
                    values: [1]
                });
                savedsearch.filters.push(FilterCountry);
            }
            //PERIODO

            if (PARAMETERS.CLOSED_PERIOD == 'T' || PARAMETERS.CLOSED_PERIOD == true) {
                var periodaux = search.lookupFields({
                    type: search.Type.ACCOUNTING_PERIOD,
                    id: PARAMETERS.PERIOD,
                    columns: ['enddate', 'startdate']
                });

                var paramFechaIni = periodaux.startdate;

                var auxIni = format.parse({
                    type: format.Type.DATE,
                    value: paramFechaIni
                });

                var AAAA = auxIni.getFullYear();
                var MM = auxIni.getMonth() + 1;
                var DD = auxIni.getDate();
                var aux = DD + '/' + MM + '/' + AAAA;
                var auxiliar = aux.split('/');

                if (auxiliar[1].length == 1) {
                    auxiliar[1] = '0' + auxiliar[1];
                }

                var formatFechaIni = auxiliar[0] + auxiliar[1] + auxiliar[2];
                var paramFechaFin = periodaux.enddate;

                if (auxiliar[1] == '12') {
                    if (paramFechaIni != null && paramFechaIni != '') {
                        var fechInicioFilter = search.createFilter({
                            name: 'trandate',
                            // join: 'transaction',
                            operator: search.Operator.ONORAFTER,
                            values: [paramFechaIni]
                        });
                        savedsearch.filters.push(fechInicioFilter);
                    }

                    if (paramFechaFin != null && paramFechaFin != '') {
                        var fechFinFilter = search.createFilter({
                            name: 'trandate',
                            // join: 'transaction',
                            operator: search.Operator.ONORBEFORE,
                            values: [paramFechaFin]
                        });
                        savedsearch.filters.push(fechFinFilter);
                    }
                }


            } else {
                var periodFilter = search.createFilter({
                    name: 'postingperiod',
                    operator: search.Operator.ANYOF,
                    values: [PARAMETERS.PERIOD]
                });
                savedsearch.filters.push(periodFilter);
            }

            if (FEATURES.MULTIBOOK) {
                var multibookFilter = search.createFilter({
                    name: 'accountingbook',
                    join: 'accountingtransaction',
                    operator: search.Operator.IS,
                    values: [PARAMETERS.MULTIBOOK]
                });
                savedsearch.filters.push(multibookFilter);

                var formula_act = "CASE WHEN ";

                for (var i = 0; i < arrAccounts.length; i++) {
                    formula_act += "{accountingtransaction.account.id} = " + arrAccounts[i];

                    if (i != arrAccounts.length - 1) {
                        formula_act += " OR ";
                    }
                }
                formula_act += " THEN 1 ELSE 0 END";

                var cuentaFilter = search.createFilter({
                    name: 'formulatext',
                    formula: formula_act,
                    operator: search.Operator.IS,
                    values: [1]
                });
                savedsearch.filters.push(cuentaFilter);

            } else {
                var formula_act = "CASE WHEN ";

                for (var i = 0; i < arrAccounts.length; i++) {
                    formula_act += "{account.id} = " + arrAccounts[i];

                    if (i != arrAccounts.length - 1) {
                        formula_act += " OR ";
                    }
                }

                formula_act += " THEN 1 ELSE 0 END";

                var cuentaFilter = search.createFilter({
                    name: 'formulatext',
                    formula: formula_act,
                    operator: search.Operator.IS,
                    values: [1]
                });
                savedsearch.filters.push(cuentaFilter);

            }

            var pageData = savedsearch.runPaged({
                pageSize: 1000
            });

            pageData.pageRanges.forEach(function (pageRange) {
                page = pageData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    var columns = result.columns;
                    // 0.Internal id
                    var internalId = result.getValue(columns[0]);
           
                    internalIds.push(internalId);
                });
            });
            return internalIds;
        }

        function getMovPEJ(internalIds) {
            var isPeriodEndJournal = true;
            var arrReturn = new Array();
            var savedsearch = search.create({
                type: "transaction",
                filters:
                    [
                        ["posting", "is", "T"],
                        "AND",
                        ["internalid", "anyof", internalIds]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "formulatext",
                            formula: "CASE WHEN {account.custrecord_lmry_pe_sunat_cta_habilitado} = 'T' THEN  	{account.custrecord_lmry_pe_sunat_cta_codigo} ELSE  {account.number}  END ",
                            sort: search.Sort.ASC,
                            label: "0. Código de la cuenta contable"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "CONCAT({internalid}, {line})",
                            sort: search.Sort.ASC,
                            label: "1. CUO"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "{class.custrecord_lmry_class_code}",
                            sort: search.Sort.ASC,
                            label: "2. Código de la unidad de operación"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "{department.custrecord_lmry_department_code}",
                            sort: search.Sort.ASC,
                            label: "3. Código de centro de costos"
                        }),
                        search.createColumn({
                            name: "symbol",
                            join: "Currency",
                            label: "4. Tipo de moneda de origen"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "'00'",
                            sort: search.Sort.ASC,
                            label: "5. Tipo de Comprobante de Pago o Documento asociada a la operación"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "''",
                            sort: search.Sort.ASC,
                            label: "6. Número serie del comprobante de pago o documento asociada a la operación"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "'00000000000000000000'",
                            sort: search.Sort.ASC,
                            label: "7.  Número del comprobante de pago o documento asociada a la operación"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "TO_CHAR({trandate}, 'DD/MM/YYYY')",
                            sort: search.Sort.ASC,
                            label: "8.  Fecha contable"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "''",
                            sort: search.Sort.ASC,
                            label: "9. Fecha de Vencimiento"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "TO_CHAR({trandate}, 'DD/MM/YYYY')",
                            sort: search.Sort.ASC,
                            label: "10. Fecha de la operación o emisión"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "NVL({memomain},{type})",
                            sort: search.Sort.ASC,
                            label: "11. Glosa o descripción de la naturaleza de la operación registrada"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "''",
                            sort: search.Sort.ASC,
                            label: "12. Glosa referencial, de ser el caso"
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            formula: "NVL({debitamount},0)",
                            label: "13. Movimientos del Debe"
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            formula: "NVL({creditamount},0)",
                            label: "14. Movimientos del Haber"
                        }),
                        search.createColumn({ name: "internalid", label: "15. Internal ID" })
                    ],
                settings:
                    [
                        {
                            name: 'includeperiodendtransactions',
                            value: 'TRUE'
                        }
                    ]
            });
              
            //16
            var accountIdColumn = search.createColumn({
                name: 'internalid',
                join: 'account'
            })
            savedsearch.columns.push(accountIdColumn);

            if (FEATURES.MULTIBOOK) {
                
                //17
                var debitColumn = search.createColumn({
                    name: "formulacurrency",
                    formula: 'NVL({accountingtransaction.debitamount},0)'
                });
                savedsearch.columns.push(debitColumn);

                //18
                var creditColumn = search.createColumn({
                    name: "formulacurrency",
                    formula: 'NVL({accountingtransaction.creditamount},0)'
                });
                savedsearch.columns.push(creditColumn);

                //19
                var accountID = search.createColumn({
                    name: 'formulanumeric',
                    formula: '{accountingtransaction.account.id}'
                });
                savedsearch.columns.push(accountID);

                //20
                var cl_period = search.createColumn({
                    name: 'formulatext',
                    formula: '{custbody_lmry_cl_period.id}'
                });
                savedsearch.columns.push(cl_period);

                //21
                var dependecyColumn = search.createColumn({
                    name: "formulatext",
                    formula: "{appliedtotransaction.custbody_lmry_depen_aduanera}",
                    label: "21 Codigo Dependencia Aduanera"
                })
                savedsearch.columns.push(dependecyColumn);
            } else {
               
                //17
                var cl_period = search.createColumn({
                    name: 'formulatext',
                    formula: '{custbody_lmry_cl_period.id}'
                });
                savedsearch.columns.push(cl_period);

                //18
                var dependecyColumn = search.createColumn({
                    name: "formulatext",
                    formula: "{appliedtotransaction.custbody_lmry_depen_aduanera}",
                    label: "18 Codigo Dependencia Aduanera"
                })
                savedsearch.columns.push(dependecyColumn);

            }

            var pageData = savedsearch.runPaged({
                pageSize: 1000
            });

            pageData.pageRanges.forEach(function (pageRange) {
                page = pageData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    var columns = result.columns;
                    var arrTemp = new Array();
                    for (var col = 0; col < columns.length; col++) {
                        if (FEATURES.MULTIBOOK) {
                            if (col == 4) {
                                arrTemp[col] = result.getValue(columns[19]);
                            } else if (col == 13) {
                                arrTemp[col] = result.getValue(columns[17]);
                            } else if (col == 14) {
                                arrTemp[col] = result.getValue(columns[18]);
                            } else if (col == 2) {
                                if (!isPeriodEndJournal) {
                                    if (FEATURES.CLASS) {
                                        arrTemp[col] = result.getValue(columns[2]);
                                     }else{
                                        arrTemp[col] = '';
                                     }  
                                }
                                                               
                            } else if (col == 3) {
                                if (!isPeriodEndJournal) {
                                    if (FEATURES.DEPARTMENT) {
                                        arrTemp[col] = result.getValue(columns[3]);
                                    } else {
                                        arrTemp[col] = '';
                                    }
                                }
                                 
                            } else {
                                arrTemp[col] = result.getValue(columns[col]);
                            }
                        } else {
                            if (col == 4) {
                                arrTemp[col] = result.getValue(columns[16]);
                            } else if (col == 2) {
                                if (!isPeriodEndJournal) {
                                    if (FEATURES.CLASS) {
                                        arrTemp[col] = result.getValue(columns[2]);
                                    } else {
                                        arrTemp[col] = '';
                                    }
                                }
                                
                            } else if (col == 3) {
                                if (!isPeriodEndJournal) {
                                    if (FEATURES.DEPARTMENT) {
                                        arrTemp[col] = result.getValue(columns[3]);
                                    } else {
                                        arrTemp[col] = '';
                                    }
                                }
                                
                            } else {
                                arrTemp[col] = result.getValue(columns[col]);
                            }
                        }
                        if (FEATURES.MULTIBOOK) {
                            arrTemp[20] = result.getValue(columns[19]);
                            arrTemp[21] = result.getValue(columns[20]);
                            arrTemp[22] = result.getValue(columns[21]);
                        } else {
                            arrTemp[20] = result.getValue(columns[16]);
                            arrTemp[21] = result.getValue(columns[17]);
                            arrTemp[22] = result.getValue(columns[18]);
                        }
                    }

                    if (Number(arrTemp[13]) - Number(arrTemp[14]) != 0) {
                        if (FEATURES.SUBSID) {
                            arrReturn.push(arrTemp);
                        } else {
                            if (COMPANY.COUNTRY == 'PE') {
                                arrReturn.push(arrTemp);
                            }
                        }
                    }
                });
            });
            return arrReturn;
        }

        function getTransactionsMOV() {
            var isPeriodEndJournal = false;
            var arrReturn = new Array();        
            //LatamReady - PE Efec C and B Mov
            var savedsearch = search.load({

                id: 'customsearch_lmry_pe_caja_bacos_efec_mov'
            });

            //Filtros
            if (FEATURES.SUBSID) {
                var subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: [PARAMETERS.SUBSID]
                });
                savedsearch.filters.push(subsidiaryFilter);

                var FilterCountry = search.createFilter({
                    name: 'formulanumeric',
                    formula: "CASE WHEN {custbody_lmry_subsidiary_country}='Peru' OR {custbody_lmry_subsidiary_country}='Perú' THEN 1 ELSE CASE WHEN {subsidiary.country}='Peru' OR {subsidiary.country}='Perú' THEN 1 ELSE 0 END END",
                    operator: search.Operator.EQUALTO,
                    values: [1]
                });
                savedsearch.filters.push(FilterCountry);
            }
            //PERIODO

            if (PARAMETERS.CLOSED_PERIOD == 'T' || PARAMETERS.CLOSED_PERIOD == true) {
                var periodaux = search.lookupFields({
                    type: search.Type.ACCOUNTING_PERIOD,
                    id: PARAMETERS.PERIOD,
                    columns: ['enddate', 'startdate']
                });

                var paramFechaIni = periodaux.startdate;

                var auxIni = format.parse({
                    type: format.Type.DATE,
                    value: paramFechaIni
                });

                var AAAA = auxIni.getFullYear();
                var MM = auxIni.getMonth() + 1;
                var DD = auxIni.getDate();
                var aux = DD + '/' + MM + '/' + AAAA;
                var auxiliar = aux.split('/');

                if (auxiliar[1].length == 1) {
                    auxiliar[1] = '0' + auxiliar[1];
                }

                var formatFechaIni = auxiliar[0] + auxiliar[1] + auxiliar[2];
                var paramFechaFin = periodaux.enddate;

                if (auxiliar[1] == '12') {
                    if (paramFechaIni != null && paramFechaIni != '') {
                        var fechInicioFilter = search.createFilter({
                            name: 'trandate',
                            // join: 'transaction',
                            operator: search.Operator.ONORAFTER,
                            values: [paramFechaIni]
                        });
                        savedsearch.filters.push(fechInicioFilter);
                    }

                    if (paramFechaFin != null && paramFechaFin != '') {
                        var fechFinFilter = search.createFilter({
                            name: 'trandate',
                            // join: 'transaction',
                            operator: search.Operator.ONORBEFORE,
                            values: [paramFechaFin]
                        });
                        savedsearch.filters.push(fechFinFilter);
                    }
                }


            } else {
                var periodFilter = search.createFilter({
                    name: 'postingperiod',
                    operator: search.Operator.ANYOF,
                    values: [PARAMETERS.PERIOD]
                });
                savedsearch.filters.push(periodFilter);
            }


            //16
            var accountIdColumn = search.createColumn({
                name: 'internalid',
                join: 'account'
            })
            savedsearch.columns.push(accountIdColumn);

            if (FEATURES.MULTIBOOK) {
                var multibookFilter = search.createFilter({
                    name: 'accountingbook',
                    join: 'accountingtransaction',
                    operator: search.Operator.IS,
                    values: [PARAMETERS.MULTIBOOK]
                });
                savedsearch.filters.push(multibookFilter);

                var formula_act = "CASE WHEN ";

                for (var i = 0; i < arrAccounts.length; i++) {
                    formula_act += "{accountingtransaction.account.id} = " + arrAccounts[i];

                    if (i != arrAccounts.length - 1) {
                        formula_act += " OR ";
                    }
                }
                formula_act += " THEN 1 ELSE 0 END";

                var cuentaFilter = search.createFilter({
                    name: 'formulatext',
                    formula: formula_act,
                    operator: search.Operator.IS,
                    values: [1]
                });
                savedsearch.filters.push(cuentaFilter);

                //17
                var debitColumn = search.createColumn({
                    name: "formulacurrency",
                    formula: 'NVL({accountingtransaction.debitamount},0)'
                });
                savedsearch.columns.push(debitColumn);

                //18
                var creditColumn = search.createColumn({
                    name: "formulacurrency",
                    formula: 'NVL({accountingtransaction.creditamount},0)'
                });
                savedsearch.columns.push(creditColumn);

                //19
                var accountID = search.createColumn({
                    name: 'formulanumeric',
                    formula: '{accountingtransaction.account.id}'
                });
                savedsearch.columns.push(accountID);

                //20
                var cl_period = search.createColumn({
                    name: 'formulatext',
                    formula: '{custbody_lmry_cl_period.id}'
                });
                savedsearch.columns.push(cl_period);

                //21
                var dependecyColumn = search.createColumn({
                    name: "formulatext",
                    formula: "{appliedtotransaction.custbody_lmry_depen_aduanera}",
                    label: "21 Codigo Dependencia Aduanera"
                })
                savedsearch.columns.push(dependecyColumn);
            } else {
                var formula_act = "CASE WHEN ";

                for (var i = 0; i < arrAccounts.length; i++) {
                    formula_act += "{account.id} = " + arrAccounts[i];

                    if (i != arrAccounts.length - 1) {
                        formula_act += " OR ";
                    }
                }

                formula_act += " THEN 1 ELSE 0 END";

                var cuentaFilter = search.createFilter({
                    name: 'formulatext',
                    formula: formula_act,
                    operator: search.Operator.IS,
                    values: [1]
                });
                savedsearch.filters.push(cuentaFilter);

                //17
                var cl_period = search.createColumn({
                    name: 'formulatext',
                    formula: '{custbody_lmry_cl_period.id}'
                });
                savedsearch.columns.push(cl_period);

                //18
                var dependecyColumn = search.createColumn({
                    name: "formulatext",
                    formula: "{appliedtotransaction.custbody_lmry_depen_aduanera}",
                    label: "18 Codigo Dependencia Aduanera"
                })
                savedsearch.columns.push(dependecyColumn);

            }

            var pageData = savedsearch.runPaged({
                pageSize: 1000
            });

            pageData.pageRanges.forEach(function (pageRange) {
                page = pageData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    var columns = result.columns;
                    var arrTemp = new Array();
                    for (var col = 0; col < columns.length; col++) {
                        if (FEATURES.MULTIBOOK) {
                            if (col == 4) {
                                arrTemp[col] = result.getValue(columns[19]);
                            } else if (col == 13) {
                                arrTemp[col] = result.getValue(columns[17]);
                            } else if (col == 14) {
                                arrTemp[col] = result.getValue(columns[18]);
                            } else if (col == 2) {
                                if (!isPeriodEndJournal) {
                                    if (FEATURES.CLASS) {
                                        arrTemp[col] = result.getValue(columns[2]);
                                     }else{
                                        arrTemp[col] = '';
                                     }  
                                }
                                                               
                            } else if (col == 3) {
                                if (!isPeriodEndJournal) {
                                    if (FEATURES.DEPARTMENT) {
                                        arrTemp[col] = result.getValue(columns[3]);
                                    } else {
                                        arrTemp[col] = '';
                                    }
                                }
                                 
                            } else {
                                arrTemp[col] = result.getValue(columns[col]);
                            }
                        } else {
                            if (col == 4) {
                                arrTemp[col] = result.getValue(columns[16]);
                            } else if (col == 2) {
                                if (!isPeriodEndJournal) {
                                    if (FEATURES.CLASS) {
                                        arrTemp[col] = result.getValue(columns[2]);
                                    } else {
                                        arrTemp[col] = '';
                                    }
                                }
                                
                            } else if (col == 3) {
                                if (!isPeriodEndJournal) {
                                    if (FEATURES.DEPARTMENT) {
                                        arrTemp[col] = result.getValue(columns[3]);
                                    } else {
                                        arrTemp[col] = '';
                                    }
                                }
                                
                            } else {
                                arrTemp[col] = result.getValue(columns[col]);
                            }
                        }
                        if (FEATURES.MULTIBOOK) {
                            arrTemp[20] = result.getValue(columns[19]);
                            arrTemp[21] = result.getValue(columns[20]);
                            arrTemp[22] = result.getValue(columns[21]);
                        } else {
                            arrTemp[20] = result.getValue(columns[16]);
                            arrTemp[21] = result.getValue(columns[17]);
                            arrTemp[22] = result.getValue(columns[18]);
                        }
                    }

                    if (Number(arrTemp[13]) - Number(arrTemp[14]) != 0) {
                        if (FEATURES.SUBSID) {
                            arrReturn.push(arrTemp);
                        } else {
                            if (COMPANY.COUNTRY == 'PE') {
                                arrReturn.push(arrTemp);
                            }
                        }
                    }
                });
            });
            return arrReturn;
        }

        function getMovements() {
            var arrMovements = new Array();
            if (arrAccounts.length != 0) {
                arrMovements = getTransactionsMOV();

                if (FEATURES.MULTIBOOK) {
                    //Se agrega transacciones Period End Journal al arreglo
                    var internalIds = getMovPEJInternalids();
                    
                    if (internalIds.length!=0) {
                        var arrMovementsPEJ = getMovPEJ();
                        
                        arrMovements = arrMovements.concat(arrMovementsPEJ);
                    }
                    
                }
            }
            return arrMovements;
        }

        function getMovementsPayments() {
            var arrReturn = new Array();
            var savedsearch = search.load({
                //LatamReady - PE Efective Cash and bank Mov Payments
                id: 'customsearch_lmry_pe_cajabco_efc_mov_pay'
            });

            //Filtros
            if (FEATURES.SUBSID) {
                var subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: [PARAMETERS.SUBSID]
                });
                savedsearch.filters.push(subsidiaryFilter);

                var FilterCountry = search.createFilter({
                    name: 'formulanumeric',
                    formula: "CASE WHEN {custbody_lmry_subsidiary_country}='Peru' OR {custbody_lmry_subsidiary_country}='Perú' THEN 1 ELSE CASE WHEN {subsidiary.country}='Peru' OR {subsidiary.country}='Perú' THEN 1 ELSE 0 END END",
                    operator: search.Operator.EQUALTO,
                    values: [1]
                });
                savedsearch.filters.push(FilterCountry);
            }

            var periodFilter = search.createFilter({
                name: 'postingperiod',
                operator: search.Operator.ANYOF,
                values: [PARAMETERS.PERIOD]
            });
            savedsearch.filters.push(periodFilter);

            var exchangeRateCabecera = search.createColumn({
                name: 'formulatext',
                formula: '{exchangerate}',
                label: 'Exchangerate Cabecera'
            });
            savedsearch.columns.push(exchangeRateCabecera);

            if (FEATURES.MULTIBOOK) {
                var multibookFilter = search.createFilter({
                    name: 'accountingbook',
                    join: 'accountingtransaction',
                    operator: search.Operator.IS,
                    values: [PARAMETERS.MULTIBOOK]
                });
                savedsearch.filters.push(multibookFilter);

                var exchangeRateMultibook = search.createColumn({
                    name: 'formulatext',
                    formula: '{accountingtransaction.exchangerate}',
                    label: 'Exchangerate Multibook'
                });
                savedsearch.columns.push(exchangeRateMultibook);

                //10
                var dependecyColumn = search.createColumn({
                    name: "formulatext",
                    formula: "{appliedtotransaction.custbody_lmry_depen_aduanera}",
                    label: "10 Codigo Dependencia Aduanera"
                })
                savedsearch.columns.push(dependecyColumn);
            }else{
                //9
                var dependecyColumn = search.createColumn({
                    name: "formulatext",
                    formula: "{appliedtotransaction.custbody_lmry_depen_aduanera}",
                    label: "9 Codigo Dependencia Aduanera"
                })
                savedsearch.columns.push(dependecyColumn);
            }

            var pageData = savedsearch.runPaged({
                pageSize: 1000
            });

            pageData.pageRanges.forEach(function (pageRange) {
                page = pageData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    var columns = result.columns;
                    var arrTemp = new Array();
                    for (var col = 0; col < columns.length; col++) {
                        if (FEATURES.MULTIBOOK) {
                            if (col == 6) {
                                arrTemp[col] = (Number(result.getValue(columns[6])) * Number(result.getValue(columns[9]))).toFixed(2);
                            } else if (col == 7) {
                                arrTemp[col] = (Number(result.getValue(columns[7])) * Number(result.getValue(columns[9]))).toFixed(2);
                            } else {
                                arrTemp[col] = result.getValue(columns[col]);
                            }
                        } else {
                            if (col == 6) {
                                arrTemp[col] = (Number(result.getValue(columns[6])) * Number(result.getValue(columns[8]))).toFixed(2);
                            } else if (col == 7) {
                                arrTemp[col] = (Number(result.getValue(columns[7])) * Number(result.getValue(columns[8]))).toFixed(2);
                            } else if (col == 10){
                                arrTemp[col] = result.getValue(columns[9]);
                            }else {
                                arrTemp[col] = result.getValue(columns[col]);
                            }
                        }
                    }
                    arrTemp[11] = 'MOVPAY';
                    if (arrTemp[6] != 0 || arrTemp[7] != 0) {
                        if (FEATURES.SUBSID) {
                            arrReturn.push(arrTemp);
                        } else {
                            if (COMPANY.COUNTRY == 'PE') {
                                arrReturn.push(arrTemp);
                            }
                        }
                    }
                });
            });
            return arrReturn;
        }

        function getMovementsPayExpRep() {
            var cont = 0;
            var intDMinReg = 0;
            var intDMaxReg = 1000;
            var DbolStop = false;
            var arrReturn = new Array();
            //var infoExportadoTxt = '';

            var savedsearch = search.load({
                //LatamReady - PE Efective Cash and bank Mov Payments
                id: 'customsearch_lmry_pe_cajabco_efc_mov_pay'
            });

            //Filtros


            var ExpendReportFilter = search.createFilter({
                name: "formulanumeric",
                formula: "CASE WHEN CONCAT ({appliedtotransaction.type},'') = 'Expense Report' THEN '1' ELSE '0' END",
                operator: search.Operator.IS,
                values: "1"
            });
            savedsearch.filters.push(ExpendReportFilter);

            if (FEATURES.SUBSID) {
                var subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: [PARAMETERS.SUBSID]
                });
                savedsearch.filters.push(subsidiaryFilter);

                var FilterCountry = search.createFilter({
                    name: 'formulanumeric',
                    formula: "CASE WHEN {custbody_lmry_subsidiary_country}='Peru' OR {custbody_lmry_subsidiary_country}='Perú' THEN 1 ELSE CASE WHEN {subsidiary.country}='Peru' OR {subsidiary.country}='Perú' THEN 1 ELSE 0 END END",
                    operator: search.Operator.EQUALTO,
                    values: [1]
                });
                savedsearch.filters.push(FilterCountry);
            }


            var periodFilter = search.createFilter({
                name: 'postingperiod',
                operator: search.Operator.ANYOF,
                values: [PARAMETERS.PERIOD]
            });
            savedsearch.filters.push(periodFilter);
            //8
            var exchangeRateCabecera = search.createColumn({
                name: 'formulatext',
                formula: '{exchangerate}',
                label: 'Exchangerate Cabecera'
            });
            savedsearch.columns.push(exchangeRateCabecera);

            if (FEATURES.MULTIBOOK) {
                var multibookFilter = search.createFilter({
                    name: 'accountingbook',
                    join: 'accountingtransaction',
                    operator: search.Operator.IS,
                    values: [PARAMETERS.MULTIBOOK]
                });
                savedsearch.filters.push(multibookFilter);
                //9
                var exchangeRateMultibook = search.createColumn({
                    name: 'formulatext',
                    formula: '{accountingtransaction.exchangerate}',
                    label: 'Exchangerate Multibook'
                });
                savedsearch.columns.push(exchangeRateMultibook);
            }

            var jsonExpense = {};
            var jsonExpense_aux = {};
            var arrExpense = [];

            var pageData = savedsearch.runPaged({
                pageSize: 1000
            });

            pageData.pageRanges.forEach(function (pageRange) {
                page = pageData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    var columns = result.columns;
                    //var arr = new Array();
                    var expenExchRate;
                    var expendCredit;
                    var expendDebit;
                    var accountID;

                    var expenId = result.getValue(columns[1]);
                    var expenPayId = result.getValue(columns[0]);
                    if (FEATURES.MULTIBOOK) {
                        expenExchRate = Number(result.getValue(columns[9]));
                    } else {
                        expenExchRate = Number(result.getValue(columns[8]));
                    }
                    expendDebit = Number(result.getValue(columns[6]));
                    expendCredit = Number(result.getValue(columns[7]));

                    if (jsonExpense[expenId] != undefined) {
                        jsonExpense_aux = {
                            'expenPayId': expenPayId,
                            'expendDebit': expendDebit,
                            'expendCredit': expendCredit,
                            'expenExchRate': expenExchRate
                        }
                        jsonExpense[expenId].push(jsonExpense_aux);
                    } else {
                        jsonExpense[expenId] = [{
                            'expenPayId': expenPayId,
                            'expendDebit': expendDebit,
                            'expendCredit': expendCredit,
                            'expenExchRate': expenExchRate
                        }];
                    }
                });
            });

            var expenseKeys = [];
            var id = Object.keys(jsonExpense);
            var arrReturn = new Array();
            var expenseKeys = Object.keys(jsonExpense);
            if (JSON.stringify(jsonExpense) != '{}') {
                //*************BUSQUEDA DE LOS EXPENSES REPORT
                var intDMinReg = 0;
                var intDMaxReg = 1000;
                var DbolStop = false;
                var expendReptsearch = search.create({
                    type: "expensereport",
                    filters:
                        [
                            ["type", "anyof", "ExpRept"],
                            "AND",
                            ["internalid", "anyof", expenseKeys],
                            "AND",
                            ["mainline", "is", "F"],
                            "AND",
                            ["taxline", "is", "F"],
                            "AND",
                            ["formulatext: {custcol_lmry_exp_rep_type_doc}", "isnotempty", ""]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "0. Internal ID" }),
                            //search.createColumn({ name: "appliedtotransaction", label: "1. Transaction Internal ID" }),
                            search.createColumn({ name: "custcol_lmry_exp_rep_type_doc", label: "1. Tipo de Comprobante de Pago o Documento asociada a la operación" }),
                            search.createColumn({ name: "custcol_lmry_exp_rep_serie_doc", label: "2. Número serie del comprobante de pago o documento asociada a la operación" }),
                            search.createColumn({ name: "custcol_lmry_exp_rep_num_doc", label: "3.  Número del comprobante de pago o documento asociada a la operación" }),
                            search.createColumn({ name: "expensedate", label: "4. Fecha de Vencimiento" }),
                            search.createColumn({ name: "debitamount", label: "5. Debitos" }),
                            search.createColumn({ name: "taxamount", label: "6.Amount (Tax)" }),
                            search.createColumn({ name: "creditamount", label: "7. Creditos" }),
                            search.createColumn({ name: "debitfxamount", label: "8.Amount (Debit) (Foreign Currency)" }),
                            search.createColumn({ name: "total", label: "9.Amount (Transaction Total)" }),
                            search.createColumn({ name: "exchangerate", label: "10.Exchange Rate" }),
                            search.createColumn({ name: "creditfxamount", label: "11.Amount (Credit) (Foreign Currency)" }),
                            search.createColumn({
                                name: "rate",
                                join: "taxItem",
                                label: "12.Rate"
                            })

                        ],
                    settings: []
                });

                if (FEATURES.SUBSID) {
                    var expensSeting = search.createSetting({
                        name: 'consolidationtype',
                        value: 'NONE'
                    });
                    expendReptsearch.settings.push(expensSeting);

                }
                if (FEATURES.MULTIBOOK) {
                    var multibookFilter = search.createFilter({
                        name: 'accountingbook',
                        join: 'accountingtransaction',
                        operator: search.Operator.IS,
                        values: [PARAMETERS.MULTIBOOK]
                    });
                    expendReptsearch.filters.push(multibookFilter);
                    //13
                    var exchangeRateMultibook = search.createColumn({
                        name: 'formulatext',
                        formula: '{accountingtransaction.exchangerate}',
                        label: 'Exchangerate Multibook'
                    });
                    expendReptsearch.columns.push(exchangeRateMultibook);
                    //14
                    var debitColumn = search.createColumn({
                        name: "formulacurrency",
                        formula: 'NVL({accountingtransaction.debitamount},0)'
                    });
                    expendReptsearch.columns.push(debitColumn);

                    //15
                    var creditColumn = search.createColumn({
                        name: "formulacurrency",
                        formula: 'NVL({accountingtransaction.creditamount},0)'
                    });
                    expendReptsearch.columns.push(creditColumn);
                }
           
                var searchresult = expendReptsearch.run();
                //log.debug("bus2")
                while (!DbolStop) {
                    //log.debug("bus3")
                    var objResult = searchresult.getRange(intDMinReg, intDMaxReg);
                    //log.debug("bus4")
                    if (objResult != null) {
                        var intLength = objResult.length;

                        if (intLength != 1000) {
                            DbolStop = true;
                            //flag_termino_3 = true;
                        }

                        var sumExpDebit;
                        var cont = 0;
                        var div = 0;
                        var numline = 0;
                        var idBill = '';
                        var expDebitTotal = 0;
                        for (var i = 0; i < intLength; i++) {
                            var flagSum = true;
                            var columns = objResult[i].columns;
                            var arrdebit = new Array();
                            var arrcredit = new Array();
                            var expenReId = objResult[i].getValue(columns[0]);
                            var tipoComp = objResult[i].getValue(columns[1]);
                            var numSerie = objResult[i].getValue(columns[2]);
                            var numCompr = objResult[i].getValue(columns[3]);
                            var FechVenc = objResult[i].getValue(columns[4]);
                            if (FEATURES.MULTIBOOK) {
                                var expDebit = objResult[i].getValue(columns[14]);
                            } else {
                                var expDebit = objResult[i].getValue(columns[5]);
                            }
                            var taxAmount = objResult[i].getValue(columns[6]);
                            //var expCredit = objResult[i].getValue(columns[7]);
                            var expDebitCurrency = objResult[i].getValue(columns[8]);
                            var totalAmount = objResult[i].getValue(columns[9]);
                            //var exchangerate = objResult[i].getValue(columns[10]);
                            var taxRate = objResult[i].getValue(columns[12]);
                            var expCreditCurrency = objResult[i].getValue(columns[11]);
                            if (FEATURES.MULTIBOOK) {
                                var exchangerate = objResult[i].getValue(columns[13]);
                                var debit3 = objResult[i].getValue(columns[14]);
                                var credit3 = objResult[i].getValue(columns[15]);
                            } else {
                                var exchangerate = objResult[i].getValue(columns[10]);
                            }

                            var auxIni = format.parse({
                                type: format.Type.DATE,
                                value: FechVenc
                            });
                            var AAAA = auxIni.getFullYear();
                            var MM = auxIni.getMonth() + 1;
                            var DD = auxIni.getDate();
                            var fechaAux = DD + '/' + MM + '/' + AAAA;
                            var auxiliar = fechaAux.split('/');
                            if (auxiliar[1].length == 1) {
                                auxiliar[1] = '0' + auxiliar[1];
                            }

                            var formatFecha = auxiliar[0] + auxiliar[1] + auxiliar[2];
                            var arrExpenses = jsonExpense[expenReId];
                            for (var z = 0; z < arrExpenses.length; z++) {
                                var element = arrExpenses[z].expenPayId;
                                var idPay = arrExpenses[z].expenPayId;

                                //}//AQUI HAGO LA SUMA DE LOS MONTOS PARA COMPARARLO CON EL PAGO
                                if (idBill != idPay) {//()
                                    div = 0;
                                    expDebitTotal = 0;
                                    idBill = idPay;
                                    for (var x = 0; x < intLength; x++) {
                                        var expenReIdIte = objResult[x].getValue(columns[0]);
                                        var etaxRate = objResult[x].getValue(columns[12]);
                                        var rateArr = etaxRate.split("%");
                                        var taxRateNum = Number(rateArr[0]);
                                        var rate = (Number(taxRateNum) / 100).toFixed(2);
                                        var arrExpensesR = jsonExpense[expenReIdIte];

                                        if (arrExpenses.length == arrExpensesR.length) {
                                            if ((idPay == arrExpensesR[z].expenPayId) && (expenReId == expenReIdIte)) {//(expenReId = expenReIdIte)
                                                div++;
                                                var debitRate = Number(objResult[x].getValue(columns[8])) * rate;
                                                var debitTax = (Number(objResult[x].getValue(columns[8])) + debitRate).toFixed(2)
                                                var creditRate = Number(objResult[x].getValue(columns[11])) * rate;
                                                var creditTax = (Number(objResult[x].getValue(columns[11])) + creditRate).toFixed(2)
                                                expDebitTot = debitTax - creditTax;
                                                expDebitTotal += expDebitTot;

                                            }
                                        }
                                    }


                                }

                                var Pay = arrExpenses[z].expendCredit;

                                var expDebitTotalImp = Math.round(expDebitTotal);
                               
                                var crdit = arrExpenses[z].expendDebit;
                                var exchaRate = arrExpenses[z].expenExchRate;
                                var idPay = arrExpenses[z].expenPayId;
                                var expendCreditGLBand = arrExpenses[z].expendCredit;
                                var expenExchRate = arrExpenses[z].expenExchRate;

                                var expendCreditGL = arrExpenses[z].expendCredit;
                                var expendCreditGLban = Math.round(expendCreditGL);
                        
                                //COMPARO EL MONTO TOTAL CON EL PAGO Y VERIFICAR SI ES TOTAL O PARCIAL
                                if (expDebitTotalImp > expendCreditGLban) {
                                    //log.debug("Entro 1");
                                   
                                    var expendCreditGLParNum = 0;
                                    var expendCreditGLPar;
                                    var expendCreditGLm = expendCreditGLBand * expenExchRate;
                                   
                                    expendCreditGLParNum = (Number(expendCreditGLm) / div).toFixed(2);
                                    expendCreditGLPar = expendCreditGLParNum.toString();

                                   

                                    arrcredit = [idPay, expenReId, tipoComp, numSerie, numCompr, fechaAux, "0.00", expendCreditGLPar, exchaRate];
                                    arrcredit[11]='MOVPAY';
                                    arrReturn.push(arrcredit);
                                } else {
                                   
                                    var exchaRate = arrExpenses[z].expenExchRate;
                                    var expDebitBase = (Number(expDebit) / exchangerate).toFixed(2)
                                    var expDebitTotal = (Number(expDebitBase) * exchaRate).toFixed(2);//exchangerate
                                   
                                    var rateArr = taxRate.split("%");
                                    var taxRateNum = Number(rateArr[0]);
                                    var rate = (Number(taxRateNum) / 100).toFixed(2);//18.00%/100 = 0.18
                                    var tax = expDebitTotal * rate;
                                    var debitNum = (Number(expDebitTotal) + Number(tax)).toFixed(2);
                                    var expDebitS = debitNum.toString();

                                    arrcredit = [idPay, expenReId, tipoComp, numSerie, numCompr, fechaAux, "0.00", expDebitS, exchaRate];
                                    arrcredit[11]='MOVPAY';
                                    arrReturn.push(arrcredit);
                                }
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

            } else {
                var arrReturn = new Array();
            }
            //}

            return arrReturn;
             
         }

        function cleanData(data) {
            var newData = new Array();
            data.forEach(function (columnData) {
                if (columnData == null || columnData == undefined || columnData == '- None -') {
                    newData.push('');
                } else {
                    newData.push(columnData);
                }
            })
            return newData;
        }

        function getCurrencies() {
            var arrCurrency = new Array();
            var currencySearch = search.create({
                type: 'currency',
                columns: [{
                    name: 'internalid'
                }, {
                    name: 'symbol'
                }]
            });

            var objResult = currencySearch.run().getRange(0, 1000);

            for (var i = 0; i < objResult.length; i++) {
                var columns = objResult[i].columns;
                var rowArray = [];
                rowArray.push(objResult[i].getValue(columns[0]));
                rowArray.push(objResult[i].getValue(columns[1]));
                arrCurrency.push(rowArray);
            }
            return arrCurrency;

        }

        function getCurrencyName(accountInternalId) {
            
            var arrCurrency = getCurrencies();
            if (accountInternalId!='') {
                var account = record.load({
                    type: record.Type.ACCOUNT,
                    id: accountInternalId
                });
                
                for (var i = 0; i < arrCurrency.length; i++) {
                    if (account.getValue('currency') == arrCurrency[i][0]) {
                        return arrCurrency[i][1];
                    }
                }
            }
            

            return '';
        }

        function getAccountingContext() {
            // Control de Memoria
            var arrAccountingContext = new Array();
            var arrTemp = new Array();
            var savedsearch = search.load({
                //LatamReady - Accounting Context
                id: 'customsearch_lmry_account_context'
            });

            // Valida si es OneWorld
            if (FEATURES.SUBSID) {
                var subsidiFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: [PARAMETERS.SUBSID]
                });
                savedsearch.filters.push(subsidiFilter);
            }

            //0 Number
            //1 Localized Number
            //2 Localized Display Name
            //3 Accounting Context

            //4
            var cod_bank = search.createColumn({
                name: 'formulatext',
                summary: search.Summary.GROUP,
                formula: '{custrecord_lmry_bank_code_acc}'
            });
            savedsearch.columns.push(cod_bank);

            //5
            var Ncta_bank = search.createColumn({
                name: 'formulatext',
                summary: search.Summary.GROUP,
                formula: '{custrecord_lmry_bank_account}'
            });
            savedsearch.columns.push(Ncta_bank);

            //6
            var internalIdColumn = search.createColumn({
                name: 'internalid',
                summary: search.Summary.GROUP
            });
            savedsearch.columns.push(internalIdColumn);

            //7
            var sunatHailibtado = search.createColumn({
                name: 'formulatext',
                summary: search.Summary.GROUP,
                formula: "{custrecord_lmry_pe_sunat_cta_habilitado}"
            });
            savedsearch.columns.push(sunatHailibtado);

            //8
            var LatamNumCuenta = search.createColumn({
                name: 'formulatext',
                summary: search.Summary.GROUP,
                formula: "{custrecord_lmry_pe_sunat_cta_codigo}"
            });
            savedsearch.columns.push(LatamNumCuenta);
            //9
            var NumCuet = search.createColumn({
                name: 'formulatext',
                summary: search.Summary.GROUP,
                formula: "{localizedname}"
            });
            savedsearch.columns.push(NumCuet);

            var pageData = savedsearch.runPaged({
                pageSize: 1000
            });

            pageData.pageRanges.forEach(function (pageRange) {
                page = pageData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    var columns = result.columns;
                    arrTemp = new Array();
                    for (var col = 0; col < columns.length; col++) {
                        if (col == 3) {
                            arrTemp[col] = result.getText(columns[col]);
                        } else {
                            arrTemp[col] = result.getValue(columns[col]);
                        }
                    }

                    if (arrTemp[3] == multibookName) {
                        arrAccountingContext.push(arrTemp);
                    }
                });
            });

            return arrAccountingContext;
        }

        function getCheckAccountExistence() {
            // Control de Memoria
            var arrVeriAccount = new Array();
            var accounts_total = search.create({
                type: "account",
                filters: [
                    ["type", "anyof", "Bank", "AcctRec", "AcctPay", "CredCard"]
                ],
                columns: [
                    // COLUMNA 0
                    search.createColumn({
                        name: "internalid"
                    }),

                    search.createColumn({
                        name: "displayname",
                        label: "Display Name"
                    }),

                    search.createColumn({
                        name: "name",
                        label: "Name"
                    }),

                    search.createColumn({
                        name: "number",
                        label: "Number"
                    }),
                    search.createColumn({
                        name: 'formulatext',
                        formula: '{custrecord_lmry_desp_cta_cont_corporativ}'
                    })
                ]
            });
            if (FEATURES.SUBSID) {
                var subsidiFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: [PARAMETERS.SUBSID]
                });
                accounts_total.filters.push(subsidiFilter);
            }

            var pageData = accounts_total.runPaged({
                pageSize: 1000
            });

            pageData.pageRanges.forEach(function (pageRange) {
                page = pageData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    var columns = result.columns;
                    var arrVerifAccount = new Array();

                    //0. Internal id match
                    if (result.getValue(columns[0]) != null)
                        arrVerifAccount[0] = result.getValue(columns[0]);
                    else
                        arrVerifAccount[0] = '';

                    //1. FormulaText (display name)
                    if (result.getValue(columns[1]) != null)
                        arrVerifAccount[1] = result.getValue(columns[1]);
                    else
                        arrVerifAccount[1] = '';

                    //2. Name
                    if (result.getValue(columns[2]) != null)
                        arrVerifAccount[2] = result.getValue(columns[2]);
                    else
                        arrVerifAccount[2] = '';

                    //3. Number
                    if (result.getValue(columns[3]) != null)
                        arrVerifAccount[3] = result.getValue(columns[3]);
                    else
                        arrVerifAccount[3] = '';

                    // Number Fijooo
                    if (result.getValue(columns[4]) != null)
                        arrVerifAccount[4] = result.getValue(columns[4]);
                    else
                        arrVerifAccount[4] = '';

                    arrVeriAccount.push(arrVerifAccount);
                });
            });
            return arrVeriAccount;
        }

        function getVerifiedAccounts() {
            var arrAccountingContext = getAccountingContext();
            var arrVeriAccount = getCheckAccountExistence();

            for (var i = 0; i < arrAccountingContext.length; i++) {
                for (var j = 0; j < arrVeriAccount.length; j++) {
                    //compara localized number y localized name
                    if (arrAccountingContext[i][1] == arrVeriAccount[j][4]) {
                        arrAccountingContext[i][10] = arrVeriAccount[j][0];
                        arrAccountingContextVerif.push(arrAccountingContext[i]);
                        break;
                    }
                }
            }

        }

        function filterAccounts(transaction) {

            var accountID = transaction[20];
            var veriCuenta = search.lookupFields({
                type: search.Type.ACCOUNT,
                id: accountID,
                columns: ['type']
            });

            var typeCuenta = veriCuenta.type;
            if (typeCuenta[0].value == 'Bank') {
                accountID = Number(getAccount(accountID));
            }

            var accountLookUp = search.lookupFields({
                type: search.Type.ACCOUNT,
                id: accountID,
                columns: ['custrecord_lmry_bank_code_acc', 'custrecord_lmry_bank_account', 'number',
                    'custrecord_lmry_pe_sunat_cta_habilitado', 'custrecord_lmry_pe_sunat_cta_codigo',
                    'type', 'custrecord_lmry_desp_cta_cont_corporativ'
                ]
            });


            var bankCode = accountLookUp.custrecord_lmry_bank_code_acc;
            var bankAccount = accountLookUp.custrecord_lmry_bank_account;
            var sunatHabil = accountLookUp.custrecord_lmry_pe_sunat_cta_habilitado;
            var sunatCta = accountLookUp.custrecord_lmry_pe_sunat_cta_codigo;
            var onceSunat = sunatCta.substr(0, 2);
            var num = accountLookUp.custrecord_lmry_desp_cta_cont_corporativ;
            //var num = accountLookUp.number;
            var onceNum = num.substr(0, 2);
            var tipo = accountLookUp.type;
            if ((bankCode == '' || bankAccount == '') && (tipo[0].value == 'Bank')) {
                if (sunatHabil || sunatHabil == 'T') {
                    if (onceSunat == '10') {
                        transaction[0] = sunatCta;
                    }
                } else {
                    if (onceNum == '10') {
                        transaction[0] = num;
                    }
                }
            }
            return {
                bankCode:bankCode,
                bankAccount:bankAccount,
                sunatHabil:sunatHabil,
                onceSunat:onceSunat,
                onceNum:onceNum,
                type:tipo[0].value
            }
        }

        function getAccount(accountId) {
            for (var i = 0; i < arrAccountingContextVerif.length; i++) {
                if (accountId == arrAccountingContextVerif[i][6]) {
                    return arrAccountingContextVerif[i][10];
                }
            }
            return accountId;
        }
        function getTaxDocuments() {
            //Obtengo los documentos fiscales
            var arrReturn = new Array();

            var docSearch = search.create({
                type: 'customrecord_lmry_tipo_doc',
                columns: [{
                    name: 'name'
                }, {
                    name: 'custrecord_lmry_codigo_doc',
                    sort: search.Sort.ASC
                }, {
                    name: 'internalid'
                }],
                filters: [{
                    name: 'formulatext',
                    formula: "CASE WHEN {custrecord_lmry_country_applied} = 'Peru' OR {custrecord_lmry_country_applied} = 'Perú' THEN 1 ELSE 0 END",
                    operator: search.Operator.IS,
                    values: "1"
                }]
            });


            var pageData = docSearch.runPaged({
                pageSize: 1000
            });

            pageData.pageRanges.forEach(function (pageRange) {
                page = pageData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    var columns = result.columns;
                    var arr = new Array();
                    for (var col = 0; col < columns.length; col++) {
                        arr[col] = result.getValue(columns[col]);
                    }
                    arrReturn.push(arr);
                });
            });

            return arrReturn;
        }

        function changeTaxDocuments(movementsPayments) {
            var arrDocumentTypes = getTaxDocuments();

            for (var j = 0; j < arrDocumentTypes.length; j++) {
                if (movementsPayments[2] == arrDocumentTypes[j][2]) {
                    movementsPayments[2] = arrDocumentTypes[j][1];
                    break;
                }
            }

        }

        function joinRepeat(previousBalance) {
            var newPreviousBalance = [];
            var long = previousBalance.length;
            var i = 0;

            while (i < long) {
                var montoAcumulado = Number(previousBalance[i][13]);
                var montoAcumulado2 = Number(previousBalance[i][14]);
                var j = i + 1;
                while (j < long) {
                    if (previousBalance[i][0] == previousBalance[j][0]) {
                        montoAcumulado += Number(previousBalance[j][13]);
                        montoAcumulado2 += Number(previousBalance[j][14]);
                        previousBalance.splice(j, 1);
                        long--;
                    } else {
                        j++;
                    }
                }
                previousBalance[i][13] = (montoAcumulado).toFixed(2);
                previousBalance[i][14] = (montoAcumulado2).toFixed(2);
                newPreviousBalance.push(previousBalance[i]);
                i++;
            }
            return newPreviousBalance;
        }

        function joinMovements(arrMovements, arrMovementsPayments) {
            var arrTemp = new Array();
            var cont = 0;

            var arrReturn = new Array();
            var cont_return = 0;
            if (arrMovements.length != 0 && arrMovementsPayments.length != 0) {
                var movimiento1 = '';
                var num2 = 0;
                for (var i = 0; i < arrMovements.length; i++) {
                    for (var j = 0; j < arrMovementsPayments.length; j++) {
                        if (arrMovementsPayments[j][0] == arrMovements[i][15]) {
                            /** */

                            /** */
                            var arrAux = new Array();
                            arrAux[0] = arrMovements[i][0];
                            //Hubo un cambio para el CUO por cuestion de un CASO se modifico solo la linea sgt arrAux[1]
                            arrAux[1] = '' + arrMovements[i][1] + '-' + '0';
                            arrAux[2] = arrMovements[i][2];
                            arrAux[3] = arrMovements[i][3];
                            arrAux[4] = arrMovements[i][4];
                            arrAux[5] = arrMovementsPayments[j][2];
                            arrAux[6] = arrMovementsPayments[j][3];
                            arrAux[7] = arrMovementsPayments[j][4];
                            arrAux[8] = arrMovements[i][8];
                            arrAux[9] = arrMovementsPayments[j][5];
                            arrAux[10] = arrMovements[i][10];
                            arrAux[11] = arrMovements[i][11];
                            arrAux[12] = arrMovements[i][12];
                            arrAux[13] = arrMovementsPayments[j][6];
                            arrAux[14] = arrMovementsPayments[j][7];
                            arrAux[15] = arrMovements[i][15];
                            arrAux[21] = arrMovements[i][21];
                            arrAux[22] = arrMovementsPayments[j][10];
                            arrAux[23] = arrMovements[i][23];
                            arrTemp[cont] = arrAux;


                            cont++;
                        }
                    }
                }

                for (var z = 0; z < cont; z++) {
                    var axi = arrTemp[z][1];
                    var num = 0;
                    for (var y = z + 1; y < cont; y++) {
                        if (axi == arrTemp[y][1]) {
                            num++;
                            arrTempArr = arrTemp[y][1].split('-');
                            arrTemp[y][1] = arrTempArr[0];
                            arrTemp[y][1] = arrTemp[y][1] + '-' + num;//ANTES:Number(arrTemp[y][1]) + 1
                            arrTemp[y][1] = '' + arrTemp[y][1];
                        }
                    }
                }
                
                for (var i = 0; i < arrMovements.length; i++) {
                    var flag = false;
                    for (var j = 0; j < arrTemp.length; j++) {
                        if (arrMovements[i][15] == arrTemp[j][15]) {
                            flag = true;

                            var arrAux = new Array();
                            arrAux[0] = arrTemp[j][0];
                            arrAux[1] = arrTemp[j][1];
                            arrAux[2] = arrTemp[j][2];
                            arrAux[3] = arrTemp[j][3];
                            arrAux[4] = arrTemp[j][4];
                            arrAux[5] = arrTemp[j][5];
                            arrAux[6] = arrTemp[j][6];
                            arrAux[7] = arrTemp[j][7];
                            arrAux[8] = arrTemp[j][8];
                            arrAux[9] = arrTemp[j][9];
                            arrAux[10] = arrTemp[j][10];
                            arrAux[11] = arrTemp[j][11];
                            arrAux[12] = arrTemp[j][12];
                            arrAux[13] = arrTemp[j][13];
                            arrAux[14] = arrTemp[j][14];
                            arrAux[15] = arrTemp[j][15];
                            arrAux[21] = arrTemp[j][21];
                            arrAux[22] = arrTemp[j][22];//aqui
                            arrAux[23] = arrTemp[j][23];

                            arrReturn[cont_return] = arrAux;
                            cont_return++;
                        }
                    }
                    
                    if (!flag) {
                        var arrAux = new Array();
                        arrAux[0] = arrMovements[i][0];
                        if (movimiento1 != arrMovements[i][1]) {
                            arrAux[1] = arrMovements[i][1] + '-' + '0';
                            movimiento1 = arrMovements[i][1];
                            num2 = 0;
                        } else {
                            num2++
                            movimiento1 = arrMovements[i][1];
                            arrMovements[i][1] = arrMovements[i][1] + '-' + num2;
                            arrAux[1] = '' + arrMovements[i][1];
                        }
                        arrAux[2] = arrMovements[i][2];
                        arrAux[3] = arrMovements[i][3];
                        arrAux[4] = arrMovements[i][4];
                        arrAux[5] = arrMovements[i][5];
                        arrAux[6] = arrMovements[i][6];
                        arrAux[7] = arrMovements[i][7];
                        arrAux[8] = arrMovements[i][8];
                        arrAux[9] = arrMovements[i][9];
                        arrAux[10] = arrMovements[i][10];
                        arrAux[11] = arrMovements[i][11];
                        arrAux[12] = arrMovements[i][12];
                        arrAux[13] = arrMovements[i][13];
                        arrAux[14] = arrMovements[i][14];
                        arrAux[15] = arrMovements[i][15];
                        arrAux[21] = arrMovements[i][21];
                        arrAux[22] = arrMovements[i][22];
                        arrAux[23] = arrMovements[i][23];
                        arrReturn[cont_return] = arrAux;
                        cont_return++;
                    }
                }
            } else {
                arrReturn = arrMovements;
            }

            return arrReturn;
        }

        function joinTransactions(arrPreviousBalance, arrMovements) {
            var cont = 0;
            var arrTransactions = new Array();
            var periodStartDateTranform = transformDate(periodStartDate);
            var periodEndDateTranform = transformDate(periodEndDate)
            if (arrPreviousBalance.length != 0 && arrMovements.length != 0) {
                for (var i = 0; i < arrPreviousBalance.length; i++) {
                    var arrIni = new Array();

                    var saldoInicialNumber = Number(arrPreviousBalance[i][13]) - Number(arrPreviousBalance[i][14]);
                    if (saldoInicialNumber > 0) {
                        arrPreviousBalance[i][13] = saldoInicialNumber;
                        arrPreviousBalance[i][14] = 0;
                    } else {
                        arrPreviousBalance[i][13] = 0;
                        arrPreviousBalance[i][14] = Number(saldoInicialNumber) * (-1);
                    }

                    arrIni[0] = arrPreviousBalance[i][0];
                    arrIni[1] = arrPreviousBalance[i][1];
                    arrIni[2] = '';
                    arrIni[3] = arrPreviousBalance[i][3];
                    arrIni[4] = arrPreviousBalance[i][4];
                    arrIni[5] = '00';
                    arrIni[6] = '';
                    arrIni[7] = '0';
                    arrIni[8] = periodStartDateTranform;
                    arrIni[9] = '';
                    arrIni[10] = periodStartDateTranform;
                    arrIni[11] = arrPreviousBalance[i][11];
                    arrIni[12] = arrPreviousBalance[i][12];
                    arrIni[13] = Number(arrPreviousBalance[i][13]).toFixed(2);
                    arrIni[14] = Number(arrPreviousBalance[i][14]).toFixed(2);
                    arrIni[15] = arrPreviousBalance[i][15];
                    arrIni[16] = 'A';

                    arrTransactions[cont] = arrIni;

                    arrTransactions[cont][0] = 'SI' + arrTransactions[cont][0];
                    
                    var since = cont;
                    cont++;

                    for (var j = 0; j < arrMovements.length; j++) {

                        if (arrAccountingContextVerif.length != 0) {
                            if (arrPreviousBalance[i][0] == arrMovements[j][0]) {
                                var arrMov = new Array();

                                arrMov[0] = arrMovements[j][0];
                                arrMov[1] = arrMovements[j][1];
                                arrMov[2] = arrMovements[j][2];
                                arrMov[3] = arrMovements[j][3];
                                //arrMov[4] = arrMovimientos[j][4];
                                arrMov[4] = arrPreviousBalance[i][4];
                                arrMov[5] = arrMovements[j][5];
                                arrMov[6] = arrMovements[j][6];
                                arrMov[7] = arrMovements[j][7];
                                arrMov[8] = arrMovements[j][8];
                                arrMov[9] = arrMovements[j][9];
                                arrMov[10] = arrMovements[j][10];
                                arrMov[11] = arrMovements[j][11];
                                arrMov[12] = arrMovements[j][12];
                                arrMov[13] = arrMovements[j][13];
                                arrMov[14] = arrMovements[j][14];
                                arrMov[15] = arrMovements[j][15];
                                arrMov[16] = 'M';
                                arrMov[17] = arrMovements[j][21];
                                arrMov[18] = arrMovements[j][22];

                                arrTransactions[cont] = arrMov;
                                
                                cont++;
                                
                            }
                        } else if (arrPreviousBalance[i][15] == arrMovements[j][4]) {
                            var arrMov = new Array();

                            arrMov[0] = arrMovements[j][0];
                            arrMov[1] = arrMovements[j][1];
                            arrMov[2] = arrMovements[j][2];
                            arrMov[3] = arrMovements[j][3];
                            //arrMov[4] = arrMovimientos[j][4];
                            arrMov[4] = arrPreviousBalance[i][4];
                            arrMov[5] = arrMovements[j][5];
                            arrMov[6] = arrMovements[j][6];
                            arrMov[7] = arrMovements[j][7];
                            arrMov[8] = arrMovements[j][8];
                            arrMov[9] = arrMovements[j][9];
                            arrMov[10] = arrMovements[j][10];
                            arrMov[11] = arrMovements[j][11];
                            arrMov[12] = arrMovements[j][12];
                            arrMov[13] = arrMovements[j][13];
                            arrMov[14] = arrMovements[j][14];
                            arrMov[15] = arrMovements[j][15];
                            arrMov[16] = 'M';
                            arrMov[17] = arrMovements[j][21];
                            arrMov[18] = arrMovements[j][22];

                            arrTransactions[cont] = arrMov;
                            
                            cont++;
                            
                        }
                    }
                   
                    var sumColum13 = 0.00;
                    var sumColum14 = 0.00;

                    for (var k = since; k < arrTransactions.length; k++) {
                        sumColum13 += Number(arrTransactions[k][13]);
                        sumColum14 += Number(arrTransactions[k][14]);
                    }
                    var saldoFinalNumber = Number(sumColum13) - Number(sumColum14);

                    if (saldoFinalNumber > 0) {
                        sumColum13 = saldoFinalNumber;
                        sumColum14 = 0;
                    } else {
                        sumColum13 = 0;
                        sumColum14 = Number(saldoFinalNumber) * (-1);

                    }

                    var arrTemp = new Array();
                    arrTemp[0] = 'SF' + arrTransactions[since][0].substring(2, arrTransactions[since][0].length);
                    arrTemp[1] = arrTransactions[since][1];
                    arrTemp[2] = '';
                    arrTemp[3] = arrTransactions[since][3];
                    arrTemp[4] = arrTransactions[since][4];
                    arrTemp[5] = '00';
                    arrTemp[6] = '';
                    arrTemp[7] = '0';
                    arrTemp[8] = periodEndDateTranform;
                    arrTemp[9] = '';
                    arrTemp[10] = periodEndDateTranform;
                    arrTemp[11] = 'SALDO FINAL';
                    arrTemp[12] = arrTransactions[since][12];
                    arrTemp[13] = sumColum13.toFixed(2);
                    arrTemp[14] = sumColum14.toFixed(2);
                    arrTemp[15] = arrTransactions[since][15];
                    arrTemp[16] = 'C';

                    arrTransactions[cont] = arrTemp;
                    
                    cont++;
                    since = cont;
                }

                var flag = true;
                var arrLast = new Array();
                var currency = '';
                var currencyAnterior = '';
                var key = 0;
                for (var i = 0; i < arrMovements.length; i++) {
                    var sumColum13 = 0.00;
                    var sumColum14 = 0.00;

                    for (var j = 0; j < arrPreviousBalance.length; j++) {
                        if (arrMovements[i][0] == arrPreviousBalance[j][0]) {
                            break;
                        } else {
                            if (j == arrPreviousBalance.length - 1) {
                                currency = arrMovements[i][23];
                                if (arrTransactions[arrTransactions.length - 1][0] != arrMovements[i][0]) {
                                    //TODO: add SF
                                    if (!flag) {
                                        var arrTemp = new Array();
                                        arrTemp[0] = 'SF' + arrMovements[key][0];
                                        arrTemp[1] = arrMovements[key][1];
                                        arrTemp[2] = '';
                                        arrTemp[3] = arrMovements[key][3];
                                        //arrTemp[4] = arrMovimientos[i-1][4];
                                        arrTemp[4] = currencyAnterior;
                                        arrTemp[5] = '00';
                                        arrTemp[6] = '';
                                        arrTemp[7] = '0';
                                        arrTemp[8] = periodEndDateTranform;
                                        arrTemp[9] = '';
                                        arrTemp[10] = periodEndDateTranform;
                                        arrTemp[11] = 'SALDO FINAL';
                                        arrTemp[12] = arrMovements[key][12];
                                        arrTemp[13] = sumColum13.toFixed(2);
                                        arrTemp[14] = sumColum14.toFixed(2);
                                        arrTemp[15] = arrMovements[key][15];
                                        arrTemp[16] = 'C';

                                        arrTransactions[cont] = arrTemp;
                                       
                                        cont++;
                                        
                                        sumColum13 = 0.00;
                                        sumColum14 = 0.00;
                                    }
                                    //TODO: add SI
                                    var arrInicial = new Array();

                                    arrInicial[0] = arrMovements[i][0];
                                    arrInicial[1] = arrMovements[i][1];
                                    arrInicial[2] = '';
                                    arrInicial[3] = arrMovements[i][3];
                                    //arrInicial[4] = arrMovimientos[i][4];
                                    arrInicial[4] = currency;
                                    arrInicial[5] = '00';
                                    arrInicial[6] = '';
                                    arrInicial[7] = '0';
                                    arrInicial[8] = periodStartDateTranform;
                                    arrInicial[9] = '';
                                    arrInicial[10] = periodStartDateTranform;
                                    arrInicial[11] = 'SALDO INICIAL';
                                    arrInicial[12] = arrMovements[i][12];
                                    arrInicial[13] = 0.00;
                                    arrInicial[14] = 0.00;
                                    arrInicial[15] = arrMovements[i][15];
                                    arrInicial[16] = 'A';

                                    arrTransactions[cont] = arrInicial;
                                    
                                    arrTransactions[cont][0] = 'SI' + arrTransactions[cont][0];
                                    key = i;
                                    
                                    cont++;

                                    var arrMov = new Array();

                                    arrMov[0] = arrMovements[i][0];
                                    arrMov[1] = arrMovements[i][1];
                                    arrMov[2] = arrMovements[i][2];
                                    arrMov[3] = arrMovements[i][3];
                                    //arrMov[4] = arrMovimientos[i][4];
                                    arrMov[4] = currency;
                                    arrMov[5] = arrMovements[i][5];
                                    arrMov[6] = arrMovements[i][6];
                                    arrMov[7] = arrMovements[i][7];
                                    arrMov[8] = arrMovements[i][8];
                                    arrMov[9] = arrMovements[i][9];
                                    arrMov[10] = arrMovements[i][10];
                                    arrMov[11] = arrMovements[i][11];
                                    arrMov[12] = arrMovements[i][12];
                                    arrMov[13] = arrMovements[i][13];
                                    arrMov[14] = arrMovements[i][14];
                                    arrMov[15] = arrMovements[i][15];
                                    arrMov[16] = 'M';
                                    arrMov[17] = arrMovements[i][21];
                                    arrMov[18] = arrMovements[i][22];

                                    sumColum13 += arrMovements[i][13];
                                    sumColum14 += arrMovements[i][14];

                                    arrLast = arrMov;
                                    arrTransactions[cont] = arrMov;
                                    
                                    cont++;
                                    
                                } else {
                                    var arrMov = new Array();

                                    arrMov[0] = arrMovements[i][0];
                                    arrMov[1] = arrMovements[i][1];
                                    arrMov[2] = arrMovements[i][2];
                                    arrMov[3] = arrMovements[i][3];
                                    //arrMov[4] = arrMovimientos[i][4];
                                    arrMov[4] = currency;
                                    arrMov[5] = arrMovements[i][5];
                                    arrMov[6] = arrMovements[i][6];
                                    arrMov[7] = arrMovements[i][7];
                                    arrMov[8] = arrMovements[i][8];
                                    arrMov[9] = arrMovements[i][9];
                                    arrMov[10] = arrMovements[i][10];
                                    arrMov[11] = arrMovements[i][11];
                                    arrMov[12] = arrMovements[i][12];
                                    arrMov[13] = arrMovements[i][13];
                                    arrMov[14] = arrMovements[i][14];
                                    arrMov[15] = arrMovements[i][15];
                                    arrMov[16] = 'M';
                                    arrMov[17] = arrMovements[i][21];
                                    arrMov[18] = arrMovements[i][22];

                                    sumColum13 += arrMovements[i][13];
                                    sumColum14 += arrMovements[i][14];

                                    arrLast = arrMov;
                                    arrTransactions[cont] = arrMov;
                                    
                                    cont++;
                                    
                                }
                                currencyAnterior = currency;
                                flag = false;
                            }
                        }
                    }
                }

                if (arrLast.length != 0) {
                    var sumColum13Last = 0.00;
                    var sumColum14Last = 0.00;

                    for (var k = arrTransactions.length - 1; k >= 0; k--) {
                        if (arrTransactions[k][0].substring(0, 2) == 'SI') {
                            break;
                        } else {
                            sumColum13Last += Number(arrTransactions[k][13]);
                            sumColum14Last += Number(arrTransactions[k][14]);
                        }

                    }

                    var saldoFinalNumber = Number(sumColum13Last) - Number(sumColum14Last);

                    if (saldoFinalNumber > 0) {
                        sumColum13Last = saldoFinalNumber;
                        sumColum14Last = 0;
                    } else {
                        sumColum13Last = 0;
                        sumColum14Last = Number(saldoFinalNumber) * (-1);
                    }

                    var arrTemp = new Array();
                    arrTemp[0] = 'SF' + arrLast[0];
                    arrTemp[1] = arrLast[1];
                    arrTemp[2] = '';
                    arrTemp[3] = arrLast[3];
                    arrTemp[4] = arrLast[4];
                    arrTemp[5] = '00';
                    arrTemp[6] = '';
                    arrTemp[7] = '0';
                    arrTemp[8] = periodEndDateTranform;
                    arrTemp[9] = '';
                    arrTemp[10] = periodEndDateTranform;
                    arrTemp[11] = 'SALDO FINAL';
                    arrTemp[12] = arrLast[12];
                    arrTemp[13] = sumColum13Last.toFixed(2);
                    arrTemp[14] = sumColum14Last.toFixed(2);
                    arrTemp[15] = arrLast[15];
                    arrTemp[16] = 'C';

                    arrTransactions[cont] = arrTemp;
                    
                    cont++;
                }

            } else if (arrMovements.length != 0 && arrPreviousBalance.length == 0) {
                var pivote = arrMovements[0][0];
                var currency = arrMovements[0][23];
                var currencyAnterior = '';
                var arrInicial = new Array();

                arrInicial[0] = 'SI' + arrMovements[0][0];
                arrInicial[1] = arrMovements[0][1];
                arrInicial[2] = '';
                arrInicial[3] = arrMovements[0][3];
                arrInicial[4] = currency;
                arrInicial[5] = '00';
                arrInicial[6] = '';
                arrInicial[7] = '0';
                arrInicial[8] = periodStartDateTranform;
                arrInicial[9] = '';
                arrInicial[10] = periodStartDateTranform;
                arrInicial[11] = 'SALDO INICIAL';
                arrInicial[12] = arrMovements[0][12];
                arrInicial[13] = 0.00;
                arrInicial[14] = 0.00;
                arrInicial[15] = arrMovements[0][15];
                arrInicial[16] = 'A';

                arrTransactions[cont] = arrInicial;
                
                var since = cont;
                cont++;

                for (var i = 0; i < arrMovements.length; i++) {
                    if (pivote == arrMovements[i][0]) {
                        var arrMov = new Array();
                        arrMov[0] = arrMovements[i][0];
                        arrMov[1] = arrMovements[i][1];
                        arrMov[2] = arrMovements[i][2];
                        arrMov[3] = arrMovements[i][3];
                        arrMov[4] = currency;
                        arrMov[5] = arrMovements[i][5];
                        arrMov[6] = arrMovements[i][6];
                        arrMov[7] = arrMovements[i][7];
                        arrMov[8] = arrMovements[i][8];
                        arrMov[9] = arrMovements[i][9];
                        arrMov[10] = arrMovements[i][10];
                        arrMov[11] = arrMovements[i][11];
                        arrMov[12] = arrMovements[i][12];
                        arrMov[13] = arrMovements[i][13];
                        arrMov[14] = arrMovements[i][14];
                        arrMov[15] = arrMovements[i][15];
                        arrMov[16] = 'M';
                        arrMov[17] = arrMovements[i][21];
                        arrMov[18] = arrMovements[i][22];
                        arrTransactions[cont] = arrMov;
                        
                        cont++;
                        
                    } else {
                        //Linea Saldo Final
                        var arrTempSF = new Array();

                        var sumColum13 = 0.00;
                        var sumColum14 = 0.00;

                        currencyAnterior = currency;
                        currency = arrMovements[i][23];

                        for (var k = since; k < arrTransactions.length; k++) {
                            sumColum13 += Number(arrTransactions[k][13]);
                            sumColum14 += Number(arrTransactions[k][14]);
                        }

                        var saldoFinalNumber = Number(sumColum13) - Number(sumColum14);

                        if (saldoFinalNumber > 0) {
                            sumColum13 = saldoFinalNumber;
                            sumColum14 = 0;
                        } else {
                            sumColum13 = 0;
                            sumColum14 = Number(saldoFinalNumber) * (-1);
                        }

                        arrTempSF[0] = 'SF' + arrMovements[i - 1][0];
                        arrTempSF[1] = arrMovements[i - 1][1];
                        arrTempSF[2] = '';
                        arrTempSF[3] = arrMovements[i - 1][3];
                        arrTempSF[4] = currencyAnterior;
                        arrTempSF[5] = '00';
                        arrTempSF[6] = '';
                        arrTempSF[7] = '0';
                        arrTempSF[8] = periodEndDateTranform;
                        arrTempSF[9] = '';
                        arrTempSF[10] = periodEndDateTranform;
                        arrTempSF[11] = 'SALDO FINAL';
                        arrTempSF[12] = arrMovements[i - 1][12];
                        arrTempSF[13] = sumColum13.toFixed(2);
                        arrTempSF[14] = sumColum14.toFixed(2);
                        arrTempSF[15] = arrMovements[i - 1][15];
                        arrTempSF[16] = 'C';

                        arrTransactions[cont] = arrTempSF;
                        
                        cont++;
                        since = cont;

                        //Linea Saldo Inicial
                        var arrTempSI = new Array();
                        arrTempSI[0] = 'SI' + arrMovements[i][0];
                        arrTempSI[1] = arrMovements[i][1];
                        arrTempSI[2] = '';
                        arrTempSI[3] = arrMovements[i][3];
                        arrTempSI[4] = currency;
                        arrTempSI[5] = '00';
                        arrTempSI[6] = '';
                        arrTempSI[7] = '0';
                        arrTempSI[8] = periodStartDateTranform;
                        arrTempSI[9] = '';
                        arrTempSI[10] = periodStartDateTranform;
                        arrTempSI[11] = 'SALDO INICIAL';
                        arrTempSI[12] = arrMovements[i][12];
                        arrTempSI[13] = 0.00;
                        arrTempSI[14] = 0.00;
                        arrTempSI[15] = arrMovements[i][15];
                        arrTempSI[16] = 'A';

                        arrTransactions[cont] = arrTempSI;
                        
                        cont++;

                        arrTransactions[cont] = arrMovements[i];
                        arrTransactions[cont][4] = currency;
                        arrTransactions[cont][16] = 'M';
                        arrTransactions[cont][17] = arrMovements[i][21];

                        cont++;

                        pivote = arrMovements[i][0];
                    }

                    if (i == arrMovements.length - 1) {
                        var arrTempSF = new Array();

                        var sumColum13 = 0.00;
                        var sumColum14 = 0.00;

                        for (var k = since; k < arrTransactions.length; k++) {
                            sumColum13 += Number(arrTransactions[k][13]);
                            sumColum14 += Number(arrTransactions[k][14]);
                        }

                        var saldoFinalNumber = Number(sumColum13) - Number(sumColum14);

                        if (saldoFinalNumber > 0) {
                            sumColum13 = saldoFinalNumber;
                            sumColum14 = 0;
                        } else {
                            sumColum13 = 0;
                            sumColum14 = Number(saldoFinalNumber) * (-1);

                        }

                        arrTempSF[0] = 'SF' + arrMovements[i][0];
                        arrTempSF[1] = arrMovements[i][1];
                        arrTempSF[2] = '';
                        arrTempSF[3] = arrMovements[i][3];
                        arrTempSF[4] = currency;
                        arrTempSF[5] = '00';
                        arrTempSF[6] = '';
                        arrTempSF[7] = '0';
                        arrTempSF[8] = periodEndDateTranform;
                        arrTempSF[9] = '';
                        arrTempSF[10] = periodEndDateTranform;
                        arrTempSF[11] = 'SALDO FINAL';
                        arrTempSF[12] = arrMovements[i][12];
                        arrTempSF[13] = sumColum13.toFixed(2);
                        arrTempSF[14] = sumColum14.toFixed(2);
                        arrTempSF[15] = arrMovements[i][15];
                        arrTempSF[16] = 'C';

                        arrTransactions[cont] = arrTempSF;
                        
                    }
                }

            } else if (arrPreviousBalance.length != 0 && arrMovements.length == 0) {

                for (var i = 0; i < arrPreviousBalance.length; i++) {
                    var arrIni = new Array();

                    var saldoInicialNumber = Number(arrPreviousBalance[i][13]) - Number(arrPreviousBalance[i][14]);
                    if (saldoInicialNumber > 0) {
                        arrPreviousBalance[i][13] = saldoInicialNumber;
                        arrPreviousBalance[i][14] = 0;
                    } else {
                        arrPreviousBalance[i][13] = 0;
                        arrPreviousBalance[i][14] = Number(saldoInicialNumber) * (-1);
                    }

                    arrIni[0] = arrPreviousBalance[i][0];
                    arrIni[1] = arrPreviousBalance[i][1];
                    arrIni[2] = '';
                    arrIni[3] = arrPreviousBalance[i][3];
                    arrIni[4] = arrPreviousBalance[i][4];
                    arrIni[5] = '00';
                    arrIni[6] = '';
                    arrIni[7] = '0';
                    arrIni[8] = periodStartDateTranform;
                    arrIni[9] = '';
                    arrIni[10] = periodStartDateTranform;
                    arrIni[11] = 'SALDO INICIAL';
                    arrIni[12] = arrPreviousBalance[i][12];
                    arrIni[13] = Number(arrPreviousBalance[i][13]).toFixed(2);
                    arrIni[14] = Number(arrPreviousBalance[i][14]).toFixed(2);
                    arrIni[15] = arrPreviousBalance[i][15];
                    arrIni[16] = 'A';
                    arrTransactions[cont] = arrIni;
                    arrTransactions[cont][0] = 'SI' + arrTransactions[cont][0];
                    
                    var since = cont;

                    cont++;

                    var saldoFinalNumber = Number(arrPreviousBalance[i][13]) - Number(arrPreviousBalance[i][14]);
                    if (saldoFinalNumber > 0) {
                        sumColum13 = saldoFinalNumber;
                        sumColum14 = 0;
                    } else {
                        sumColum13 = 0;
                        sumColum14 = Number(saldoFinalNumber) * (-1);
                    }

                    var arrTemp = new Array();
                    arrTemp[0] = 'SF' + arrTransactions[since][0].substring(2, arrTransactions[since][0].length);
                    arrTemp[1] = arrTransactions[since][1];
                    arrTemp[2] = '';
                    arrTemp[3] = arrTransactions[since][3];
                    arrTemp[4] = arrTransactions[since][4];
                    arrTemp[5] = '00';
                    arrTemp[6] = '';
                    arrTemp[7] = '0';
                    arrTemp[8] = periodEndDateTranform;
                    arrTemp[9] = '';
                    arrTemp[10] = periodEndDateTranform;
                    arrTemp[11] = 'SALDO FINAL';
                    arrTemp[12] = arrTransactions[since][12];
                    arrTemp[13] = sumColum13.toFixed(2);
                    arrTemp[14] = sumColum14.toFixed(2);
                    arrTemp[15] = arrTransactions[since][15];
                    arrTemp[16] = 'C';

                    arrTransactions[cont] = arrTemp;
                    
                    cont++;
                }
            }
            
            return arrTransactions;

        }

        function transformDate(date) {
            var parsedDateStringAsRawDateObject = format.parse({
                value: date,
                type: format.Type.DATE
            });

            var MM = parsedDateStringAsRawDateObject.getMonth() + 1;
            var AAAA = parsedDateStringAsRawDateObject.getFullYear();
            var DD = parsedDateStringAsRawDateObject.getDate();

            if (('' + MM).length == 1) {
                MM = '0' + MM;
            }

            if (('' + DD).length == 1) {
                DD = '0' + DD;
            }

            return DD + '/' + MM + '/' + AAAA;
        }

        function NoData() {
            if (arrPeriodSpecial.length > 0) {
                periodName = specialName;
            }

            if (PARAMETERS.RECORDID != null) {
                var recordLog = record.load({
                    type: 'customrecord_lmry_pe_2016_rpt_genera_log',
                    id: PARAMETERS.RECORDID
                });
            } else {
                var recordLog = record.create({
                    type: 'customrecord_lmry_pe_2016_rpt_genera_log'
                });
            }

            MESSAGE = {
                es: 'No existe informacion para los criterios seleccionados.',
                en: 'There is no information for the selected criteria.',
                pt: 'Não há informações para os critérios selecionados.'
            }

            recordLog.setValue({
                fieldId: 'custrecord_lmry_pe_2016_rg_name',
                value: MESSAGE[LANGUAGE]
            });

            //Periodo
            recordLog.setValue({
                fieldId: 'custrecord_lmry_pe_2016_rg_postingperiod',
                value: periodName
            });

            var recordId = recordLog.save();
        }
        function callSchedule() {
            var dataAditional = {
                periodEndDate: periodEndDate,
                periodStartDate: periodStartDate,
                periodName: periodName,
                multibookName: multibookName,
                arrPeriodSpecial: arrPeriodSpecial,
                dateEspecial:{
                    year:YYYY_inicial,
                    month:MM_inicial,
                    day:DD_inicial
                },
                specialName:specialName,
            }

            var param = {
                parameters: PARAMETERS,
                features: FEATURES,
                company: COMPANY,
                dataAditional: dataAditional
            }
            var params = {};
            params['custscript_smc_pe_param_globales'] = param;
            var RedirecSchdl = task.create({
                taskType: task.TaskType.SCHEDULED_SCRIPT,
                scriptId: 'customscript_smc_pe_cajabanco_efectuada',
                deploymentId: 'customdeploy_smc_pe_cajabanco_efectuada',
                params: params
            });
            RedirecSchdl.submit();


        }

        function recallMapReduce(){
            var params = {};
            log.debug("PARAMETERS.FILES [recallMapReduce]",PARAMETERS.FILES)
            params['custscript_smc_pe_caj_banc_efec_file_mp']=PARAMETERS.FILES;
            params['custscript_smc_pe_caj_banc_efec_lmit_mp']=PARAMETERS.LIMIT+range;
            log.debug("params",params)
            var RedirecMprd = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_smc_pe_cajabanco_efec_mprd',
                deploymentId: 'customdeploy_smc_pe_cajabanco_efec_mprd',
                params: params
            });
            RedirecMprd.submit();
        }
        function saveAuxiliarFile(strAuxiliar, isRecall) {
            var folderId = objContext.getParameter({
                name: 'custscript_lmry_pe_2016_rg_file_cabinet'
            });

            // Almacena en la carpeta de Archivos Generados
            if (folderId != '' && folderId != null) {

                // Extension del archivo
                var seed = new Date().getTime();
                var fileName = 'Temp' + '_' + 'CajaYBancosEfectiva' + '_' + seed  +'_' + '.txt';

                
                // Crea el archivo
                var transactionsFile = file.create({
                    name: fileName,
                    fileType: file.Type.PLAINTEXT,
                    contents: strAuxiliar,
                    encoding: file.Encoding.UTF8,
                    folder: folderId
                });

                var idFile = transactionsFile.save(); // Termina de grabar el archivo
                log.debug("Name File - idFile:",fileName+" - "+idFile);
                log.debug("PARAMETERS.FILES [save Antes]",PARAMETERS.FILES)
                // if (isRecall) {
                //     if (PARAMETERS.FILES=='') {
                //         log.debug("console","files vacio")
                //         PARAMETERS.FILES=""+idFile;
                //     }else{
                //         log.debug("console","file lleno")
                //         PARAMETERS.FILES+=","+idFile;
                //     }                   
                // }else{
                //     PARAMETERS.FILES=PARAMETERS.FILES.split(",");
                //     PARAMETERS.FILES.push(idFile);
                // }
                PARAMETERS.FILES.push(idFile);
                log.debug("PARAMETERS.FILES [save despues]",PARAMETERS.FILES)

            } else {
                log.debug("WARNING MESSAGE", "No se encontró el folder del reporte.")
            }
        }
        function lengthInUtf8Bytes(str) {
            var m = encodeURIComponent(str).match(/%[89ABab]/g);
            return str.length + (m ? m.length : 0);
        }

        function updateLogGenerator(name_carpeta) {

            var records = record.load({
                type: 'customrecord_lmry_pe_2016_rpt_genera_log',
                id: PARAMETERS.RECORDID
            });

            var urlFile = '';
            var MESSAGE = {
                es: 'Ocurrio un error inesperado en la ejecucion del reporte.',
                en: 'An unexpected error occurred in the execution of the report.',
                pt: 'Ocorreu um erro inesperado na execução do relatório.'
            }
            if (name_carpeta == 'error') {
                name_carpeta = MESSAGE[LANGUAGE];
            }

            //Nombre de Archivo
            records.setValue({
                fieldId: 'custrecord_lmry_pe_2016_rg_name',
                value: name_carpeta
            });
            //Url de Archivo
            records.setValue({
                fieldId: 'custrecord_lmry_pe_2016_rg_url_file',
                value: urlFile
            });

            var recordId = records.save();

        }
        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        }

    });