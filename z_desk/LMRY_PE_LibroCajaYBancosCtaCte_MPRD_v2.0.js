/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                       ||
||                                                                ||
||  File Name: LMRY_PE_LibroCajaYBancosCtaCte_MPRD_v2.0.js        ||
||                                                                ||
||  Version       Date            Author              Remarks     ||
||    2.0    03 Octubre 2022  Giussepe Delgado    Use Script 2.0  ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 *@NApiVersion 2.0
 *@NScriptType MapReduceScript
 *@Name LMRY_PE_LibroCajaYBancosCtaCte_MPRD_v2.0.js
 */
define(["N/record", "N/runtime", "N/file", "N/search",
    "N/format", "N/log", "N/config", "N/task",
    "/SuiteBundles/Bundle 37714/Latam_Library/LMRY_libSendingEmailsLBRY_V2.0.js",
    "./PE_Library_Mensual/LMRY_PE_Reportes_LBRY_V2.0.js"
],
    function (record, runtime, file, search, format, log, config, task, libreriaLicense, library) {

        var NAME_REPORT = "Libro de Caja y Bancos Cuenta Corriente 2.0";
        var LMRY_SCRIPT = 'LMRY_PE_LibroCajaYBancosCtaCte_MPRD_v2.0.js';
        var objContext = runtime.getCurrentScript();
        var libraryRPT = '';
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

        var PERIOD_SPECIAL = {
            periodEspecial: false,
            arrPeriodSpecial: []
        };

        var periodEndDate = null;
        var periodStartDate = null;
        var periodName = null;
        var antPeriodEndDate = null;
        //Nombre de libro contable
        var multibookName = '';
        var multibookIsPrimary = true;
        var range = 65000;
        var arrAccounts = new Array();
        var arrAccountingContextVerif = new Array();
        function getInputData() {
            try {
                var arrTransactions= new Array();
                getParametersAndFeatures();
                log.debug('Parametros:', PARAMETERS);
                getSubisidiaryData();
                getInfoPeriod();
                getAccounts();
                //Movimientos
                var arrCtaCte = new Array();
                if (arrAccounts.length != 0) {
                    var arrCtaCte = getCajaBankCtaCte();
                    
                }
                //Saldo Inicial
                var arrInitialBalance = getInitialBalance();
                

                //Saldo Final
                var arrFinalBalance = getFinalBalance();
               

                arrTransactions=arrTransactions.concat(arrCtaCte,arrInitialBalance,arrFinalBalance);
                return arrTransactions;
            } catch (err) {

                library.sendMail(LMRY_SCRIPT, ' [ getInputData ] ' + err);
                updateLogGenerator('error');
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
                        value: dataInput
                    });
                } else {
                    getParametersAndFeatures();
                    if (FEATURES.MULTIBOOK || FEATURES.MULTIBOOK == 'T') {
                        getVerifiedAccounts();
                    }
                    
                    dataInput = cleanData(dataInput);
                    if (dataInput[24] == 'MOV') {
                        var accountID = dataInput[22];
                        enterEntity(dataInput);
                        updatePeriod(dataInput);
                        
                    }else{
                        var accountID = dataInput[13];
                    }
                    
                    
                    var bankInfo=filterAccounts(accountID);
                   
                    if ((bankInfo.bankCode != '' && bankInfo.bankAccount != '') && (bankInfo.type == 'Bank')) {
                        if (bankInfo.sunatHabil || bankInfo.sunatHabil == 'T') {
                            if (bankInfo.onceSunat == '10') {
                                dataInput[3] = bankInfo.bankCode;
                                dataInput[4] = bankInfo.sunatCta;
                                dataInput[5] = bankInfo.bankAccount;
                                
                                context.write({
                                    key: dataInput[24],
                                    value: {
                                        arrTransactions: dataInput
                                    }
                                });
                            }
                        } else {
                            if (bankInfo.onceNum == '10') {
                                dataInput[3] = bankInfo.bankCode;
                                dataInput[4] = bankInfo.num;
                                dataInput[5] = bankInfo.bankAccount;
                                context.write({
                                    key: dataInput[24],
                                    value: {
                                        arrTransactions: dataInput
                                    }
                                });
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
                getSubisidiaryData();
                getAccounts();

                var arrInitialBalance = new Array();
                var arrMovements = new Array();
                var arrFinalBalance = new Array();
                var arrTransactions = new Array();
                context.output.iterator().each(function (key, value) {

                    var type = key;
                    if (type == "SI") {
                        var jsonInitialBalance = JSON.parse(value);
                        arrInitialBalance.push(jsonInitialBalance.arrTransactions);


                    } else if (type == "MOV") {
                        var jsonMovimientos = JSON.parse(value);
                        arrMovements.push(jsonMovimientos.arrTransactions);


                    } else if (type == "SF") {
                        var jsonFinalBalance = JSON.parse(value);
                        arrFinalBalance.push(jsonFinalBalance.arrTransactions);


                    }
                    return true;
                });
                if (arrAccounts.length!==0) {
                    arrInitialBalance=joinRepeat(arrInitialBalance);
                    arrFinalBalance=joinRepeat(arrFinalBalance);
                }
               

                arrTransactions = arrTransactions.concat(arrInitialBalance,arrFinalBalance,arrMovements);

                if (arrTransactions.length != 0) {
                    var lengthTransactions = arrTransactions.length;
                    var isRepeat = true;
                    var base = 0;
                    while (isRepeat) {
                        
                        var newLimit = base + range;
                        
                        if (newLimit >= lengthTransactions) {
                            var newArrTransactions = arrTransactions.slice(base, lengthTransactions);
                            isRepeat = false;
                        } else {
                            var newArrTransactions = arrTransactions.slice(base, newLimit);
                            base += range;

                        }
                        var stringTemporal = JSON.stringify(newArrTransactions);
                        saveAuxiliarFile(stringTemporal); 
                    }             
                    callSchedule();
                } else {
                    noData();
                }
            } catch (err) {

                log.error("[ summarize ]", err);
                updateLogGenerator('error');
                library.sendMail(LMRY_SCRIPT, ' [ Summarize ] ' + err);
            }
        }

        function getParametersAndFeatures() {
            // Parametros

            //paramperiodo
            PARAMETERS.PERIOD = objContext.getParameter({
                name: 'custscript_lmry_pe_caja_banco_cte_per_mp'
            });

            //paramClosedPeriod
            PARAMETERS.CLOSED_PERIOD = objContext.getParameter({
                name: 'custscript_lmry_pe_caj_banc_cte_cierr_mp'
            });
            //paramsubsidi
            PARAMETERS.SUBSID = objContext.getParameter({
                name: 'custscript_lmry_pe_caja_banco_cte_sub_mp'
            });
            //paramMultibook
            PARAMETERS.MULTIBOOK = objContext.getParameter({
                name: 'custscript_lmry_pe_caja_banco_cte_mul_mp'
            });
            //paramrecoid
            PARAMETERS.RECORDID = objContext.getParameter({
                name: 'custscript_lmry_pe_caja_banco_cte_rec_mp'
            });

            //paramTipoExtPeriodo
            PARAMETERS.TYPE_EXT_PERIOD = objContext.getParameter({
                name: 'custscript_lmry_pe_caj_ban_cte_ex_per_mp'
            });

            //paramIndicadorOperaciones
            PARAMETERS.INDIC_OPERAC = objContext.getParameter({
                name: 'custscript_lmry_pe_caj_ban_cte_ind_op_mp'
            });

            //featuresubs 
            FEATURES.SUBSID = runtime.isFeatureInEffect({
                feature: "SUBSIDIARIES"
            });
            //feamultibook
            FEATURES.MULTIBOOK = runtime.isFeatureInEffect({
                feature: "MULTIBOOK"
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
                    columns: ['name', 'isprimary']
                });

                multibookName = multibookNameTemp.name;
                multibookIsPrimary = multibookNameTemp.isprimary;
            }

            PERIOD_SPECIAL.periodEspecial = getConfigSpecialPeriod();

            if (PERIOD_SPECIAL.periodEspecial) {
                PERIOD_SPECIAL.arrPeriodSpecial = getSpecialPeriodData();

                if (PERIOD_SPECIAL.arrPeriodSpecial.length > 0) {
                    inicial = format.parse({
                        value: PERIOD_SPECIAL.arrPeriodSpecial[1],
                        type: format.Type.DATE
                    });

                    PERIOD_SPECIAL.MM_inicial = inicial.getMonth() + 1;
                    PERIOD_SPECIAL.YYYY_inicial = inicial.getFullYear();
                    PERIOD_SPECIAL.DD_inicial = inicial.getDate();

                    //Inicial = DD_inicial +';'+ MM_inicial +';'+ YYYY_inicial;

                    inicial = new Date(Number('' + PERIOD_SPECIAL.YYYY_inicial), Number('' + PERIOD_SPECIAL.MM_inicial - 1), Number('' + (PERIOD_SPECIAL.DD_inicial)));

                    PERIOD_SPECIAL.inicial = format.format({
                        value: inicial,
                        type: format.Type.DATE
                    });

                    final = format.parse({
                        value: PERIOD_SPECIAL.arrPeriodSpecial[2],
                        type: format.Type.DATE
                    });

                    PERIOD_SPECIAL.MM_final = final.getMonth() + 1;
                    PERIOD_SPECIAL.YYYY_final = final.getFullYear();
                    PERIOD_SPECIAL.DD_final = final.getDate();

                    //Final = DD_final +';'+ MM_final +';'+ YYYY_final;

                    final = new Date(Number('' + PERIOD_SPECIAL.YYYY_final), Number('' + PERIOD_SPECIAL.MM_final - 1), Number('' + (PERIOD_SPECIAL.DD_final)));

                    PERIOD_SPECIAL.final = format.format({
                        value: final,
                        type: format.Type.DATE
                    });
                }
                PERIOD_SPECIAL.specialName = PERIOD_SPECIAL.arrPeriodSpecial[0];

            }


        }

        function getConfigSpecialPeriod() {
            var activateSpecialPeriod = false;
            var licenses = new Array();
            if (FEATURES.SUBSID) {
                licenses = libreriaLicense.getLicenses(PARAMETERS.SUBSID);
                activateSpecialPeriod = libreriaLicense.getAuthorization(664, licenses);
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
                try {
                    if (PARAMETERS.SUBSID != '' && PARAMETERS.SUBSID != null) {
                        var subsidyName = search.lookupFields({
                            type: search.Type.SUBSIDIARY,
                            id: PARAMETERS.SUBSID,
                            columns: ['legalname', 'taxidnum']
                        });

                    }
                    COMPANY.NAME = subsidyName.legalname;
                    COMPANY.RUC = subsidyName.taxidnum;
                } catch (error) {
                    log.error("[getSubisidiaryData]", error);
                    COMPANY.NAME = '';
                    COMPANY.RUC = '';
                }

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

        function getCajaBankCtaCte() {
            var arrCtaCte = new Array();
            //NOMBRE: LatamReady PE 1.2 Book Cash and bank Current account
            var savedsearch = search.load({
                id: 'customsearch_lmry_pe_cajaybancos_ctacte'
            })
            // Valida si es OneWorld
            if (FEATURES.SUBSID) {
                var subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: [PARAMETERS.SUBSID]
                });
                savedsearch.filters.push(subsidiaryFilter);
                //savedsearch.addFilter(new nlobjSearchFilter('subsidiary', null, 'is', paramsubsidi));
            }
            //log.error('paramClosedPeriod',paramClosedPeriod);
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

                var auxIni = format.parse({
                    type: format.Type.DATE,
                    value: paramFechaFin
                });

                var AAAA = auxIni.getFullYear();
                var MM = auxIni.getMonth() + 1;
                var DD = auxIni.getDate();
                var aux = DD + '/' + MM + '/' + AAAA;
                var auxiliarFin = aux.split('/');

                if (auxiliarFin[1].length == 1) {
                    auxiliarFin[1] = '0' + auxiliarFin[1];
                }

                var formatFechaFin = auxiliarFin[0] + auxiliarFin[1] + auxiliarFin[2];

                //["trandate","within","31/12/2020","31/12/2020"]

                if (auxiliar[1] == '12') {
                    if (paramFechaIni != null && paramFechaIni != '') {
                        var fechInicioFilter = search.createFilter({
                            name: 'trandate',
                            // join: 'accountingperiod',
                            operator: search.Operator.ONORAFTER,
                            values: [paramFechaIni]
                        });
                        savedsearch.filters.push(fechInicioFilter);
                    }

                    if (paramFechaFin != null && paramFechaFin != '') {
                        var fechFinFilter = search.createFilter({
                            name: 'trandate',
                            //  join: 'accountingperiod',
                            operator: search.Operator.ONORBEFORE,
                            values: [paramFechaFin]
                        });
                        savedsearch.filters.push(fechFinFilter);
                    }
                }


            } else {
                //log.error('entro aca', 'paramClosedPeriod');
                var subsidiaryFilter4 = search.createFilter({
                    name: 'postingperiod',
                    operator: search.Operator.ANYOF,
                    values: [PARAMETERS.PERIOD]
                });
                savedsearch.filters.push(subsidiaryFilter4);
                //savedsearch.addFilter(new nlobjSearchFilter('postingperiod', null, 'anyof', paramperiodo));
            }

            if (FEATURES.MULTIBOOK) { //estaba vacio
                var multibookFilter = search.createFilter({
                    name: 'accountingbook',
                    join: 'accountingtransaction',
                    operator: search.Operator.IS,
                    values: [PARAMETERS.MULTIBOOK]
                });
                savedsearch.filters.push(multibookFilter);

                var formula = getPeriodsFormulaText(arrAccounts);

                var cuentaFilter = search.createFilter({
                    name: "formulatext",
                    formula: formula,
                    operator: search.Operator.IS,
                    values: "1"
                });
                savedsearch.filters.push(cuentaFilter);

                var debitColum = search.createColumn({
                    name: 'debitamount',
                    join: 'accountingtransaction'
                });

                savedsearch.columns.push(debitColum);

                var creditColumn = search.createColumn({
                    name: 'creditamount',
                    join: 'accountingtransaction'
                });

                savedsearch.columns.push(creditColumn);
                //18 o 20. 
                var columna18 = search.createColumn({
                    name: 'formulanumeric',
                    formula: '{name.id}'
                });
                savedsearch.columns.push(columna18);

                //19 o 21.
                var columna19 = search.createColumn({
                    name: 'formulatext',
                    formula: '{custbody_lmry_es_detraccion}'
                });
                savedsearch.columns.push(columna19);

                //20 o 22. 
                var columna20 = search.createColumn({
                    name: 'formulanumeric',
                    formula: '{custcol_lmry_exp_rep_vendor_colum.id}'
                });
                savedsearch.columns.push(columna20);

                //21 o 23. 
                var Type = search.createColumn({
                    name: "formulatext",
                    formula: "{type}"
                });
                savedsearch.columns.push(Type);

                var accountID = search.createColumn({
                    name: 'formulanumeric',
                    formula: '{accountingtransaction.account.id}'
                });
                savedsearch.columns.push(accountID);

                var cl_period = search.createColumn({
                    name: 'formulatext',
                    formula: '{custbody_lmry_cl_period.id}'
                });
                savedsearch.columns.push(cl_period);
                

            } else {
                
                var formula_act = "CASE WHEN ";

                for (var i = 0; i < arrAccounts.length; i++) {
                    formula_act += "{account.id} = " + arrAccounts[i];

                    if (i != arrAccounts.length - 1) {
                        formula_act += " OR";
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

                //18 o 20. 
                var columna18 = search.createColumn({
                    name: 'formulanumeric',
                    formula: '{name.id}'
                });
                savedsearch.columns.push(columna18);

                //19 o 21.
                var columna19 = search.createColumn({
                    name: 'formulatext',
                    formula: '{custbody_lmry_es_detraccion}'
                });
                savedsearch.columns.push(columna19);

                //20 o 22. 
                var columna20 = search.createColumn({
                    name: 'formulanumeric',
                    formula: '{custcol_lmry_exp_rep_vendor_colum.id}'
                });
                savedsearch.columns.push(columna20);

                //21 o 23. 
                var Type = search.createColumn({
                    name: "formulatext",
                    formula: "{type}"
                });
                savedsearch.columns.push(Type);

                var accountIdColumn = search.createColumn({
                    name: 'formulanumeric',
                    formula: '{account.id}'
                })
                savedsearch.columns.push(accountIdColumn);

                var cl_period = search.createColumn({
                    name: 'formulatext',
                    formula: '{custbody_lmry_cl_period.id}'
                });
                savedsearch.columns.push(cl_period);

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

                    //0. PERIODO
                    if (result.getValue(columns[0]) != null)
                        arrTemp[0] = result.getValue(columns[0]);
                    else
                        arrTemp[0] = '';
                    //1. CUO
                    if (result.getValue(columns[1]) != null)
                        arrTemp[1] = result.getValue(columns[1]);
                    else
                        arrTemp[1] = '';
                    //2. NUM
                    if (result.getValue(columns[2]) != null)
                        arrTemp[2] = result.getValue(columns[2]);
                    else
                        arrTemp[2] = '';
                    //3. COD_EF
                    if (result.getValue(columns[3]) != null)
                        arrTemp[3] = result.getValue(columns[3]);
                    else
                        arrTemp[3] = '';
                    //4. CTA CONT
                    if (result.getValue(columns[4]) != null)
                        arrTemp[4] = result.getValue(columns[4]);
                    else
                        arrTemp[4] = '';
                    //5. NUM_CTA
                    if (result.getValue(columns[5]) != null)
                        arrTemp[5] = result.getValue(columns[5]);
                    else
                        arrTemp[5] = '';
                    //6. FECHA
                    if (result.getValue(columns[6]) != null)
                        arrTemp[6] = result.getValue(columns[6]);
                    else
                        arrTemp[6] = '';
                    //7. M_PAGO
                    if (result.getValue(columns[7]) != null) {
                        var _tipo = result.getValue(columns[7]);
                        arrTemp[7] = _tipo;
                    } else
                        arrTemp[7] = '';
                    //8. MEMO
                    if (result.getValue(columns[8]) != null) {
                        var _tipo = characterValidation(result.getValue(columns[8]));
                        arrTemp[8] = _tipo;
                    } else
                        arrTemp[8] = '';
                    //9. TDOC
                    if (result.getValue(columns[9]) != null) {
                        if (result.getValue(columns[9]) == 'Subsidiaria') {
                            arrTemp[9] = '6';
                        } else {
                            arrTemp[9] = result.getValue(columns[9]);
                        }
                    } else
                        arrTemp[9] = '6';
                    //10. NUM_DOI
                    if (result.getValue(columns[10]) != null) {
                        if (result.getValue(columns[10]) == 'Subsidiaria') {
                            arrTemp[10] = COMPANY.RUC;
                        } else {
                            arrTemp[10] = result.getValue(columns[10]);
                        }
                    } else
                        arrTemp[10] = COMPANY.RUC;
                    //11. GIR_BENEF
                    if (result.getValue(columns[11]) != null) {
                        var _GirBenef = '';
                        if (result.getValue(columns[11]) == 'Subsidiaria') {
                            _GirBenef = characterValidation(COMPANY.NAME);
                        } else {
                            _GirBenef = characterValidation(result.getValue(columns[11]));
                        }

                        arrTemp[11] = _GirBenef;

                    } else
                        arrTemp[11] = characterValidation(COMPANY.NAME);
                    //12. NUM_TRAN
                    if (result.getValue(columns[12]) != null)
                        arrTemp[12] = result.getValue(columns[12]);
                    else
                        arrTemp[12] = '';
                    //13. DEBE
                    if (FEATURES.MULTIBOOK) {
                        if (result.getValue(columns[18]) != null)
                            arrTemp[13] = result.getValue(columns[18]);
                        else
                            arrTemp[13] = 0;
                    } else {
                        if (result.getValue(columns[13]) != null)
                            arrTemp[13] = result.getValue(columns[13]);
                        else
                            arrTemp[13] = 0;
                    }
                    //14. HABER
                    if (FEATURES.MULTIBOOK) {
                        if (result.getValue(columns[19]) != null)
                            arrTemp[14] = result.getValue(columns[19]);
                        else
                            arrTemp[14] = 0;
                    } else {
                        if (result.getValue(columns[14]) != null)
                            arrTemp[14] = result.getValue(columns[14]);
                        else
                            arrTemp[14] = 0;
                    }
                    //15. PERIODO START
                    if (result.getValue(columns[15]) != null)
                        arrTemp[15] = result.getValue(columns[15]);
                    else
                        arrTemp[15] = '';
                    //16. PERIODO END
                    if (result.getValue(columns[16]) != null)
                        arrTemp[16] = result.getValue(columns[16]);
                    else
                        arrTemp[16] = '';
                    //17. FECHA
                    if (result.getValue(columns[17]) != null)
                        arrTemp[17] = result.getValue(columns[17]);
                    else
                        arrTemp[17] = '';

                    if (FEATURES.MULTIBOOK) {
                        if (result.getValue(columns[20]) != null) {
                            arrTemp[18] = result.getValue(columns[20]);
                        } else {
                            arrTemp[18] = 0;
                        }
                        if (result.getValue(columns[21]) != null) {
                            arrTemp[19] = result.getValue(columns[21]);
                        } else {
                            arrTemp[19] = '';
                        }
                        if (result.getValue(columns[22]) != null) {
                            arrTemp[20] = result.getValue(columns[22]);
                        } else {
                            arrTemp[20] = 0;
                        }
                        if (result.getValue(columns[23]) != null) {
                            arrTemp[21] = result.getValue(columns[23]);
                        } else {
                            arrTemp[21] = 0;
                        }
                        if (result.getValue(columns[24]) != null) {
                            arrTemp[22] = result.getValue(columns[24]);
                        } else {
                            arrTemp[22] = 0;
                        }
                        if (result.getValue(columns[25]) != null) {
                            arrTemp[23] = result.getValue(columns[25]);
                        } else {
                            arrTemp[23] = '';
                        }
                    } else {
                        if (result.getValue(columns[18]) != null) {
                            arrTemp[18] = result.getValue(columns[18]);
                        } else {
                            arrTemp[18] = 0;
                        }
                        if (result.getValue(columns[19]) != null) {
                            arrTemp[19] = result.getValue(columns[19]);
                        } else {
                            arrTemp[19] = '';
                        }
                        if (result.getValue(columns[20]) != null) {
                            arrTemp[20] = result.getValue(columns[20]);
                        } else {
                            arrTemp[20] = 0;
                        }
                        if (result.getValue(columns[21]) != null) {
                            arrTemp[21] = result.getValue(columns[21]);
                        } else {
                            arrTemp[21] = '';
                        }
                        if (result.getValue(columns[22]) != null) {
                            arrTemp[22] = result.getValue(columns[22]);
                        } else {
                            arrTemp[22] = 0;
                        }
                        if (result.getValue(columns[23]) != null) {
                            arrTemp[23] = result.getValue(columns[23]);
                        } else {
                            arrTemp[23] = '';
                        }
                    }
                    arrTemp[24] = 'MOV';
                    if (Number(arrTemp[13]) - Number(arrTemp[14]) != 0) {
                        arrCtaCte.push(arrTemp);
                        //log.debug("movimentos", arrTemp);
                    }
                });
            });

            // arrCtaCte = Filtro_Cuenta(arrCtaCte, 1);

            // GeneraMovimientos();
            return arrCtaCte;

        }

        function characterValidation(s) {
            var AccChars = "ŠŽšžŸÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðñòóôõöùúûüýÿ°–—ªº·@´%!¡.$&¿?Ñ|";
            var RegChars = "SZszYAAAAAACEEEEIIIIDNOOOOOUUUUYaaaaaaceeeeiiiidnooooouuuuyyo--ao.       Y  N ";

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

        function getPeriodsFormulaText(ArrCuentas) {
            var formula = "CASE WHEN ";
            
            for (var i = 0; i < ArrCuentas.length; i++) {
                formula += "{accountingtransaction.account.id} = '" + ArrCuentas[i] + "'";
                if (i != ArrCuentas.length - 1) {
                    formula += " OR ";
                }
            }
            formula += " THEN 1 ELSE 0 END";
           
            return formula;
        }

        function getAccountingPeriod() {


            var arrTemp = new Array();
            var arrPeriods = new Array();

            // Consulta de Cuentas
            var savedsearch = search.load({
                id: 'customsearch_lmry_idaccountingperiod'
            });

            var pageData = savedsearch.runPaged({
                pageSize: 1000
            });

            pageData.pageRanges.forEach(function (pageRange) {
                page = pageData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    var columns = result.columns;
                    //columns = objResult[i].getAllColumns();
                    arrTemp = new Array();

                    //0. Internal Id
                    if (result.getValue(columns[0]) != null)
                        arrTemp[0] = result.getValue(columns[0]);
                    else
                        arrTemp[0] = '';
                    //0. name
                    if (result.getValue(columns[1]) != null)
                        arrTemp[1] = result.getValue(columns[1]);
                    else
                        arrTemp[1] = '';
                    //1. fecha inicial
                    if (result.getValue(columns[2]) != null)
                        arrTemp[2] = result.getValue(columns[2]);
                    else
                        arrTemp[2] = '';
                    //2. fecha final
                    if (result.getValue(columns[3]) != null)
                        arrTemp[3] = result.getValue(columns[3]);
                    else
                        arrTemp[3] = '';


                    arrPeriods.push(arrTemp);
                });
            });
            //log.debug("Periodos contables", arrPeriods);
            return arrPeriods;
        }

        function getInfoPeriod() {
            var arrPeriods = getAccountingPeriod();
            //log.debug("PERIODOS",arrPeriods);
            for (var i = 0; i < arrPeriods.length; i++) {
                if (PARAMETERS.PERIOD == arrPeriods[i][0]) {
                    periodStartDate = arrPeriods[i][2];
                    periodEndDate = arrPeriods[i][3];
                    periodName = arrPeriods[i][1];
                    antPeriodEndDate = arrPeriods[i - 1][3];
                    return true;
                }
            }
        }

        function getTransactionsBalance(isPeriodEndJournal,isSaldoInicial) {
            var arrSaldo = new Array();
            //var _PeriodoInicio = '01/01/2000';
            var _PeriodoInicio = new Date(2000, 00, 01);
            _PeriodoInicio = format.format({
                value: _PeriodoInicio,
                type: format.Type.DATE
            });

            var idSearchLoad = null;

            if (isPeriodEndJournal) {
                /** LatamReady PE C and B CC Balan PEJ **/
                idSearchLoad = 'customsearch_lmry_pe_cajaybancos_ctact_2'
            } else {
                /** LatamReady PE C and B CC Balan **/
                idSearchLoad = 'customsearch_lmry_pe_cajaybancos_ctactes';
            }
            var savedsearch = search.load({
                id: idSearchLoad
            });

            // Valida si es OneWorld
            if (FEATURES.SUBSID) {
                var subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: [PARAMETERS.SUBSID]
                });
                savedsearch.filters.push(subsidiaryFilter);
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

                var auxIni = format.parse({
                    type: format.Type.DATE,
                    value: paramFechaFin
                });

                var AAAA = auxIni.getFullYear();
                var MM = auxIni.getMonth() + 1;
                var DD = auxIni.getDate();
                var aux = DD + '/' + MM + '/' + AAAA;
                var auxiliarFin = aux.split('/');

                if (auxiliarFin[1].length == 1) {
                    auxiliarFin[1] = '0' + auxiliarFin[1];
                }

                var formatFechaFin = auxiliarFin[0] + auxiliarFin[1] + auxiliarFin[2];

                //["trandate","within","31/12/2020","31/12/2020"]

                if (auxiliar[1] == '12') {
                    var periodFilter = search.createFilter({
                        name: 'trandate',
                        // join: 'accountingperiod',
                        operator: search.Operator.ONORAFTER, // duda
                        values: [_PeriodoInicio]

                    });
                    savedsearch.filters.push(periodFilter);

                    
                    if (isSaldoInicial) {
                        var periodFilter2 = search.createFilter({
                            name: 'trandate',
                            // join: 'accountingperiod',
                            operator: search.Operator.ONORBEFORE, // duda
                            values: [antPeriodEndDate]
                            //values: [periodenddate]
                        });
                        savedsearch.filters.push(periodFilter2);
                    }else{
                        var periodFilter2 = search.createFilter({
                            name: 'trandate',
                            // join: 'accountingperiod',
                            operator: search.Operator.ONORBEFORE, // duda
                            values: [paramFechaFin]
                                //values: [periodenddate]
                        });
                        savedsearch.filters.push(periodFilter2);
                    }
                }

            } else {
                var periodFilter = search.createFilter({
                    name: 'enddate',
                    join: 'accountingperiod',
                    operator: search.Operator.ONORAFTER, // duda
                    values: [_PeriodoInicio]
                    //values: [periodenddate]
                });
                savedsearch.filters.push(periodFilter);

                if (!isPeriodEndJournal&&!isSaldoInicial) {
                    var periodFilter2 = search.createFilter({
                        name: 'enddate',
                        join: 'accountingperiod',
                        operator: search.Operator.ONORBEFORE, // duda
                        values: [periodEndDate]
                        //values: [periodenddate]
                    });
                    savedsearch.filters.push(periodFilter2);
                }else{
                    var periodFilter2 = search.createFilter({
                        name: 'enddate',
                        join: 'accountingperiod',
                        operator: search.Operator.ONORBEFORE, // duda
                        values: [antPeriodEndDate]
                        //values: [periodenddate]
                    });
                    savedsearch.filters.push(periodFilter2);
                }
               
            }


            if (FEATURES.MULTIBOOK) {
                var periodFilter3 = search.createFilter({
                    name: 'accountingbook',
                    join: 'accountingtransaction',
                    operator: search.Operator.ANYOF,
                    values: [PARAMETERS.MULTIBOOK]
                });
                savedsearch.filters.push(periodFilter3);

                var formula_act = "CASE WHEN ";

                for (var i = 0; i < arrAccounts.length; i++) {
                    formula_act += "{accountingtransaction.account.id} = " + arrAccounts[i];

                    if (i != arrAccounts.length - 1) {
                        formula_act += " OR";
                    }
                }
                formula_act += " THEN 1 ELSE 0 END";
                //log.error('formula_act', formula_act);
                var cuentaFilter = search.createFilter({
                    name: 'formulatext',
                    formula: formula_act,
                    operator: search.Operator.IS,
                    values: [1]
                });
                savedsearch.filters.push(cuentaFilter);

                var searchColumn = search.createColumn({
                    name: 'formulacurrency',
                    formula: 'NVL({accountingtransaction.debitamount},0)-NVL({accountingtransaction.creditamount},0)',
                    summary: 'sum'
                });
                savedsearch.columns.push(searchColumn);

                var accountID = search.createColumn({
                    name: 'formulanumeric',
                    formula: '{accountingtransaction.account.id}',
                    summary: 'GROUP'
                });
                savedsearch.columns.push(accountID);
            } else {
                var formula_act = "CASE WHEN ";

                for (var i = 0; i < arrAccounts.length; i++) {
                    formula_act += "{account.id} = " + arrAccounts[i];

                    if (i != arrAccounts.length - 1) {
                        formula_act += " OR";
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

                var accountIdColumn = search.createColumn({
                    name: 'formulanumeric',
                    formula: '{account.id}',
                    summary: 'GROUP'
                })
                savedsearch.columns.push(accountIdColumn);
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
                    if ((result.getValue(columns[12]) != null) || (result.getValue(columns[12]) > 0)) {
                        arrTemp = new Array();

                        //0. PERIODO
                        if (result.getValue(columns[0]) != null) {
                            arrTemp[0] = result.getValue(columns[0]);
                            //log.error('arrAuxiliar[0] MIRAAAAAA', arrTemp[0])
                        } else
                            arrTemp[0] = '';
                        //1. CUO
                        if (result.getValue(columns[1]) != null)
                            arrTemp[1] = result.getValue(columns[1]);
                        else
                            arrTemp[1] = '';
                        //2. NUM
                        if (result.getValue(columns[2]) != null)
                            arrTemp[2] = result.getValue(columns[2]);
                        else
                            arrTemp[2] = '';
                        //3. COD_EF
                        if (result.getValue(columns[3]) != null)
                            arrTemp[3] = result.getValue(columns[3]);
                        else
                            arrTemp[3] = '';
                        //4. CTA CONT
                        if (result.getValue(columns[4]) != null)
                            arrTemp[4] = result.getValue(columns[4]);
                        else
                            arrTemp[4] = '';
                        //5. NUM_CTA
                        if (result.getValue(columns[5]) != null)
                            arrTemp[5] = result.getValue(columns[5]);
                        else
                            arrTemp[5] = '';
                        //6. M_PAGO
                        if (result.getValue(columns[6]) != null)
                            arrTemp[6] = result.getValue(columns[6]);
                        else
                            arrTemp[6] = '';
                        //7. MEMO
                        if (result.getValue(columns[7]) != null) {
                            var _tipo = result.getValue(columns[7]);
                            arrTemp[7] = _tipo;
                        } else
                            arrTemp[7] = '';
                        //8. TDOC
                        if (result.getValue(columns[8]) != null) {
                            var _tipo = result.getValue(columns[8]);
                            arrTemp[8] = _tipo;
                        } else
                            arrTemp[8] = '';
                        //9. NUM_DOI
                        if (result.getValue(columns[9]) != null)
                            arrTemp[9] = result.getValue(columns[9]);
                        else
                            arrTemp[9] = '';
                        //10. GIR_BENEF
                        if (result.getValue(columns[10]) != null) {
                            var _tipo = result.getValue(columns[10]);
                            arrTemp[10] = _tipo;
                        } else
                            arrTemp[10] = '';
                        //11. NUM_TRAN
                        if (result.getValue(columns[11]) != null)
                            arrTemp[11] = result.getValue(columns[11]);
                        else
                            arrTemp[11] = '';
                        //12. SUM OF SALDO
                        if (FEATURES.MULTIBOOK || FEATURES.MULTIBOOK == 'T') {
                            if (result.getValue(columns[13]) != null)
                                arrTemp[12] = result.getValue(columns[13]);
                            //log.error('M ',arrAuxiliar[12]);
                            else
                                arrTemp[12] = 0;

                            if (result.getValue(columns[14]) != null)
                                arrTemp[13] = result.getValue(columns[14]);
                            //log.error('M ',arrAuxiliar[12]);
                            else
                                arrTemp[13] = 0;
                        } else {
                            if (result.getValue(columns[12]) != null)
                                arrTemp[12] = result.getValue(columns[12]);
                            //log.error('SM ',arrAuxiliar[12]);
                            else
                                arrTemp[12] = 0;

                            if (result.getValue(columns[13]) != null)
                                arrTemp[13] = result.getValue(columns[13]);
                            //log.error('SM ',arrAuxiliar[12]);
                            else
                                arrTemp[13] = 0;
                        }

                        if (isSaldoInicial) {
                            arrTemp[24]='SI';
                        }else{
                            arrTemp[24]='SF';
                        }

                        if (Number(arrTemp[12]) != 0) {
                            arrSaldo.push(arrTemp);
                             
                        }

                    }
                });
            });
           
            return arrSaldo;
        }

        function getInitialBalance() {
            //Saldo Inicial
            var arrInitialBalance = new Array();
            if (arrAccounts.length != 0) {
                if (FEATURES.MULTIBOOK) {
                    //Sea agrega transacciones Period End Journal al arreglo
                    var arrInitialBalancePEJ = getTransactionsBalance(true,true);
                    arrInitialBalance = arrInitialBalance.concat(arrInitialBalancePEJ);   
                }
                var arrTemp = getTransactionsBalance(false,true);
                arrInitialBalance = arrInitialBalance.concat(arrTemp);
            }
            return arrInitialBalance;

        }

        function getFinalBalance() {
            //Saldo Final
            var arrFinalBalance = new Array();
            if (arrAccounts.length != 0) {
                if (FEATURES.MULTIBOOK) {
                    //Sea agrega transacciones Period End Journal al arreglo
                    var arrFinalBalancePEJ = getTransactionsBalance(true,false);
                    arrFinalBalance = arrFinalBalance.concat(arrFinalBalancePEJ);   
                }
                var arrTemp = getTransactionsBalance(false,false);
                arrFinalBalance = arrFinalBalance.concat(arrTemp);
            }
            return arrFinalBalance;
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

        function filterAccounts(accountID) { 

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
            return {
                bankCode: bankCode,
                bankAccount: bankAccount,
                sunatHabil: sunatHabil,
                onceSunat: onceSunat,
                onceNum: onceNum,
                type: tipo[0].value,
                sunatCta:sunatCta,
                num:num
            }
        }

        function enterEntity(transaction){
            if (transaction[21] == 'Journal' || transaction[21] == 'Diario' || transaction[21] == 'PEJrnl') {

                var idEmpl = '';
                if (transaction[19] == 'T') {
                    idEmpl = transaction[20];
                } else {
                    idEmpl = transaction[18];
                }

                if (idEmpl != '') {
                    var id_employee = search.lookupFields({
                        type: search.Type.EMPLOYEE,
                        id: idEmpl,
                        columns: ['custentity_lmry_sunat_tipo_doc_cod', 'custentity_lmry_sv_taxpayer_number', 'lastname', 'firstname', 'internalid', 'entityid']
                    });
                    if (id_employee.internalid != null) {
                        transaction[9] = id_employee.custentity_lmry_sunat_tipo_doc_cod;
                        transaction[10] = id_employee.custentity_lmry_sv_taxpayer_number;
                        transaction[11] = id_employee.entityid + ' ' + id_employee.firstname + ' ' + id_employee.lastname;
                    } else {
                        var id_vendor = search.lookupFields({
                            type: search.Type.VENDOR,
                            id: idEmpl,
                            columns: ['custentity_lmry_sunat_tipo_doc_cod', 'vatregnumber', 'lastname', 'firstname', 'isperson', 'companyname', 'internalid', 'entityid']
                        });

                        if (id_vendor.internalid != null) {
                            transaction[9] = id_vendor.custentity_lmry_sunat_tipo_doc_cod;
                            transaction[10] = id_vendor.vatregnumber;

                            if (!id_vendor.isperson) {
                                transaction[11] = id_vendor.entityid + ' ' + id_vendor.companyname;
                            } else {
                                transaction[11] = id_vendor.entityid + ' ' + id_vendor.firstname + ' ' + id_vendor.lastname;
                            }
                        } else {
                            var id_customer = search.lookupFields({
                                type: search.Type.CUSTOMER,
                                id: idEmpl,
                                columns: ['custentity_lmry_sunat_tipo_doc_cod', 'vatregnumber', 'lastname', 'firstname', 'isperson', 'companyname', 'internalid', 'entityid']
                            });

                            if (id_customer.internalid != null) {
                                transaction[9] = id_customer.custentity_lmry_sunat_tipo_doc_cod;
                                transaction[10] = id_customer.vatregnumber;

                                if (!id_customer.isperson) {
                                    transaction[11] = id_customer.entityid + ' ' + id_customer.companyname;
                                } else {
                                    transaction[11] = id_customer.entityid + ' ' + id_customer.firstname + ' ' + id_customer.lastname;
                                }
                            }
                        }
                    }
                }
            }
        }

        function updatePeriod(transaction){
            if (transaction[23] != null && transaction[23] != '' && transaction[23] != ' ') {
                transaction[23] = getPeriodUpdate(transaction[23]);

                var fechaUpdate = getDatePeriod(transaction[23], 1);
                fechaUpdate = fechaUpdate.split('/');

                var UpdateMonth = fechaUpdate[1];
                var UpdateYear = fechaUpdate[0];

                transaction[23]= UpdateYear + UpdateMonth + '00' ;
            }
        }

        function getPeriodUpdate(update) {
            var columna0 = null;
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

        function getDatePeriod(periodo, tipoExtraccion) {
          

            var auxiliarfechaString = '';
            var auxiliaranio;
            var auxiliarmess;

            if (tipoExtraccion == 1) {
                auxiliaranio = periodo.substring(4);
                switch (periodo.substring(0, 3).toLowerCase()) {
                    case 'jan':
                        auxiliarmess = '01';
                        break;
                    case 'ene':
                        auxiliarmess = '01';
                        break;
                    case 'feb':
                        auxiliarmess = '02';
                        break;
                    case 'mar':
                        auxiliarmess = '03';
                        break;
                    case 'abr':
                        auxiliarmess = '04';
                        break;
                    case 'apr':
                        auxiliarmess = '04';
                        break;
                    case 'may':
                        auxiliarmess = '05';
                        break;
                    case 'jun':
                        auxiliarmess = '06';
                        break;
                    case 'jul':
                        auxiliarmess = '07';
                        break;
                    case 'ago':
                        auxiliarmess = '08';
                        break;
                    case 'aug':
                        auxiliarmess = '08';
                        break;
                    case 'set':
                        auxiliarmess = '09';
                        break;
                    case 'sep':
                        auxiliarmess = '09';
                        break;
                    case 'oct':
                        auxiliarmess = '10';
                        break;
                    case 'nov':
                        auxiliarmess = '11';
                        break;
                    case 'dic':
                        auxiliarmess = '12';
                        break;
                    case 'dec':
                        auxiliarmess = '12';
                        break;
                    default:
                        auxiliarmess = '00';
                        break;
                }
                auxiliarfechaString = auxiliaranio + '/' + auxiliarmess + '/' + '00';
            }
            return auxiliarfechaString;
        }

        function getAccount(accountId) {
            for (var i = 0; i < arrAccountingContextVerif.length; i++) {
                if (accountId == arrAccountingContextVerif[i][6]) {
                    return arrAccountingContextVerif[i][10];
                }
            }
            return accountId;
        }

        function joinRepeat(balance) {
            var balanceUpdate = [];
            var long = balance.length;
            var i = 0;

            while (i < long) {
                var amountAttached = Number(balance[i][12]);
                var j = i + 1;
                while (j < long) { //acumulando por cod. Tributo - receita - periodicidad
                    //JUNTA LOS QUE TIENEN MISMO ID ---- SE JUNTARA LOS QUE TIENE MISMO NUMBER
                    //if (matrizGeneral[i][13] == matrizGeneral[j][13]) {
                    if (balance[i][4] == balance[j][4]) {
                        amountAttached += Number(balance[j][12]);
                        balance.splice(j, 1);
                        long--;
                    } else {
                        j++;
                    }
                }
                balance[i][12] = (amountAttached).toFixed(2);
                balanceUpdate.push(balance[i]);
                i++;
            }

            return balanceUpdate;
        }

        function noData() {
            log.debug("no data", "no data")
            if (PERIOD_SPECIAL.arrPeriodSpecial.length > 0) {
                periodName = PERIOD_SPECIAL.specialName;
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
        
            var param = {
                parameters: PARAMETERS,
                features: FEATURES,
                company: COMPANY,
                period_Special: PERIOD_SPECIAL,
                multibookName: multibookName,
                multibookIsPrimary: multibookIsPrimary,
                periodEndDate: periodEndDate,
                periodStartDate: periodStartDate,
                periodName: periodName
            }
            var params = {};
            params['custscript_lmry_pe_cte_para_global'] = param;
            var RedirecSchdl = task.create({
                taskType: task.TaskType.SCHEDULED_SCRIPT,
                scriptId: 'customscript_lmry_pe_cajabanco_cuentacte',
                deploymentId: 'customdeploy_lmry_pe_cajabanco_cuentacte',
                params: params
            });
            RedirecSchdl.submit();


        }

        function saveAuxiliarFile(strAuxiliar) {
            var folderId = objContext.getParameter({
                name: 'custscript_lmry_pe_2016_rg_file_cabinet'
            });

            // Almacena en la carpeta de Archivos Generados
            if (folderId != '' && folderId != null) {

                // Extension del archivo
                var seed = new Date().getTime();
                var fileName = 'Temp' + '_' + 'CajaYBancosCtaCte' + '_' + seed + '_' + '.txt';


                // Crea el archivo
                var transactionsFile = file.create({
                    name: fileName,
                    fileType: file.Type.PLAINTEXT,
                    contents: strAuxiliar,
                    encoding: file.Encoding.UTF8,
                    folder: folderId
                });

                var idFile = transactionsFile.save(); // Termina de grabar el archivo

                if (PARAMETERS.FILES == null) {
                    PARAMETERS.FILES = new Array();
                }
                PARAMETERS.FILES.push(idFile);

            } else {
                log.error("WARNING MESSAGE", "No se encontró el folder del reporte.")
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