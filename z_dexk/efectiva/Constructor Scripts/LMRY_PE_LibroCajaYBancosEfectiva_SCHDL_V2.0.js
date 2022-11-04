/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_PE_LibroCajaYBancosEfectiva_SCHDL_V2.0.js   ||
||                                                              ||
||  Version    Date         Author              Remarks         ||
||  2.0    Octubre 31 2022  Giussepe Delgado    Use Script 2.0  ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
define(["N/record", "N/runtime", "N/file", "N/search",
    "N/format", "N/log", "N/config", "./PE_Library_Mensual/LMRY_PE_Reportes_LBRY_V2.0.js"
],

    function (recordModulo, runtime, fileModulo, search, format, log,
        config, libreria) {

        var objContext = runtime.getCurrentScript();
        // Nombre del Reporte
        var NAME_REPORT = "Libro de Caja y Bancos Efectiva";
        var LMRY_SCRIPT = 'LMRY_PE_LibroCajaYBancosEfectiva_SCHDL_V2.0.js';

        var LANGUAGE = runtime.getCurrentScript().getParameter({
            name: "LANGUAGE"
        }).substring(0, 2);

        if (LANGUAGE != "es" && LANGUAGE != "en" && LANGUAGE != "pt") {
            LANGUAGE = "en";
        }

        var PARAMETERS = {};
        var FEATURES = {};
        var COMPANY = {};
        var periodEndDate = null;
        var periodStartDate = null;
        var periodName = null;
        var multibookName = null;
        var arrPeriodSpecial = new Array();
        var arrTransactions = new Array();
        var arrPreviousBalance = new Array();
        var arrMovements = new Array();
        var jsonMovementsPay ={};
        var arrAccountingContextVerif = new Array();
        var file_size = 7340032;
        var fileNumber = 0;
        var strTransactions = '';
        var MM_inicial;
        var YYYY_inicial;
        var DD_inicial;
        var specialName;
        
        var idTemporal='';
        var contNcorreltivo=1;
        
        function execute(context) {
            try {
                getParametersAndFeatures();
                getTransactions();
                
                if (arrTransactions.length != 0) {
                    processTransaction();
                    strTransactions = generatedFile(arrTransactions);

                    if (fileNumber != 0) {
                        fileNumber = Number(fileNumber) + 1;
                    }

                    SaveFile();
                } else {
                    NoData();
                    
                }
            } catch (error) {

                libreria.sendMail(LMRY_SCRIPT, ' [ execute] ' + error);
                updateLogGenerator('error');
                log.error("[ execute]", error);
            }

        }

        function getParametersAndFeatures() {
            var INFO = objContext.getParameter({
                name: 'custscript_lmry_pe_param_globales'
            });
                    
            INFO = JSON.parse(INFO);
            log.debug("Share data", INFO)
            PARAMETERS = INFO.parameters;
            FEATURES = INFO.features;
            COMPANY = INFO.company;
            periodEndDate = INFO.dataAditional.periodEndDate;
            periodStartDate = INFO.dataAditional.periodStartDate;
            periodName = INFO.dataAditional.periodName;
            multibookName = INFO.dataAditional.multibookName;
            arrPeriodSpecial = INFO.dataAditional.arrPeriodSpecial;
            specialName = INFO.dataAditional.specialName;
            YYYY_inicial=INFO.dataAditional.dateEspecial.year;
            MM_inicial=INFO.dataAditional.dateEspecial.month;
            DD_inicial=INFO.dataAditional.dateEspecial.day;
        }

        function getTransactions() {
            var arrfiles = PARAMETERS.FILES;
            for (var i = 0; i < arrfiles.length; i++) {
                var files = fileModulo.load({
                    id: arrfiles[i]
                }).getContents();
                var arrAux = JSON.parse(files);
                arrTransactions = arrTransactions.concat(arrAux);
                
            }

            //arrTransactions = JSON.parse(files);
            log.error("arrTransactions",arrTransactions.length)

            arrTransactions.forEach(function(transaction){
                if (transaction[11] == 'SALDO INICIAL') {
                    arrPreviousBalance.push(transaction);
                } else if (transaction[11] == 'MOVPAY') {
                    if (jsonMovementsPay[transaction[0]]==null) {
                        jsonMovementsPay[transaction[0]] = new Array();
                    }
                    jsonMovementsPay[transaction[0]].push(transaction);
                    //arrMovementsPayments.push(transaction);
                } else {            
                    arrMovements.push(transaction);
                }
            });

        }
        function processTransaction(){
           
            if (FEATURES.MULTIBOOK || FEATURES.MULTIBOOK == 'T') {
                getVerifiedAccounts();
            }          
            if (arrAccountingContextVerif.length != 0) {
                arrPreviousBalance = joinRepeat(arrPreviousBalance);
            }
            
            arrMovements = joinMovements(arrMovements, jsonMovementsPay);
            
            arrMovements.sort(function (a, b) {
                return a[7] - b[7];
            });
            arrMovements.sort(function (a, b) {
                return a[15] - b[15];
            });
            
            arrTransactions = joinTransactions(arrPreviousBalance, arrMovements);
            
        }
        function generatedFile(ArrTemp) {
            var strReturn = '';
            var separador = '|';

            if (PARAMETERS.TYPE_EXT_PERIOD == '1') { //Por nombre periodo
                var fechaString = getPeriod(periodName, 1);
                var periodenddate_temp = search.lookupFields({
                    type: search.Type.ACCOUNTING_PERIOD,
                    id: PARAMETERS.PERIOD,
                    columns: ['startdate', 'enddate', 'periodname']
                });

                var periodstartdate = periodenddate_temp.startdate;
                periodstartdate = format.parse({
                    value: periodstartdate,
                    type: format.Type.DATE
                });
                var AAAA = periodstartdate.getFullYear();
                AAAA = Number(AAAA).toFixed(0);
                var MM = Number(periodstartdate.getMonth()) + 1;
                var DD = Number(periodstartdate.getDate()) + 1;

                if (arrPeriodSpecial.length > 0) {
                    AAAA = Number(YYYY_inicial).toFixed(0);
                    MM = Number(MM_inicial);
                }

                if (('' + MM).length == 1) {
                    MM = '0' + MM;
                }

                if (('' + DD).length == 1) {
                    DD = '0' + DD;
                }
                var periodMonth = MM;
                var periodYear = AAAA;


            } else { //por enddate
                var fechaString = getPeriod(periodEndDate, 2);
                fechaString = fechaString.split('/');

                var periodMonth = fechaString[1];
                var periodYear = fechaString[2];
            }

            var paramBucleFin = 0;
            var paramBucleFinTemp = paramBucleFin;
            var i=0;
            var inicio=0;
            while(i<ArrTemp.length){
                if (lengthInUtf8Bytes(strReturn) <= file_size) {
                    strReturn += generatedLine(ArrTemp[i], periodYear, periodMonth, separador);
                    i++;
                }else {
                    var isSaldoFinal = (ArrTemp[i][1].substring(0, 2) == 'SF');

                    fileNumber = Number(fileNumber) + 1;

                    if (isSaldoFinal) {
                        strReturn += generatedLine(ArrTemp[i], periodYear, periodMonth, separador);
                    } else {
                        var cont = 0;

                        for (var x = i; x >= 0; x--) {
                            cont++;
                            if (ArrTemp[x][1].substring(0, 2) == 'SI') {
                                break;
                            }
                        }

                        strReturn = '';

                        for (var y = inicio; y < i - cont; y++) {
                            strReturn += generatedLine(ArrTemp[y], periodYear, periodMonth, separador);
                        }

                        inicio = i - cont;
                        i=inicio;

                    }
                    strTransactions = strReturn;

                    SaveFile();

                }
            }

            return strReturn;
        }

        function generatedLine(arrTransactions, periodYear, periodMonth, separador) {
            var strReturn = '';
            if (arrTransactions[17] != null && arrTransactions[17] != '' && arrTransactions[17] != ' ') {
                //1. Periodo
                
                var peri=arrTransactions[17];
                strReturn += peri;
                strReturn += separador;
            } else {
                //1. Periodo
                var peri = '' + periodYear + periodMonth + '00';
                strReturn += peri;
                strReturn += separador;
            }

            //2. CUO
            if (arrTransactions[16] == 'A' || arrTransactions[16] == 'C') {
                strReturn += arrTransactions[0] + peri;
                strReturn += separador;
            } else {
                strReturn += arrTransactions[15];
                strReturn += separador;
            }


            //3. NUMERO CORRELATIVO DE ASIENTO(MAXIMO 10 CARACT)
            if (arrTransactions[16] == 'A' || arrTransactions[16] == 'C') {
                //strReturn += arrTransactions[16] + arrTransactions[0];
                strReturn += (arrTransactions[16] + arrTransactions[0]).substring(0, 10)
                strReturn += separador;
            } else {
                if(idTemporal==arrTransactions[15]){
                    contNcorreltivo++;
                    strReturn += "M" + completar_cero(9,contNcorreltivo);
                }else{
                    contNcorreltivo=1;
                    strReturn += "M" + completar_cero(9,contNcorreltivo);
                }
                idTemporal=arrTransactions[15];
                strReturn += separador;
            }

            //4. Codigod de la Cuenta Contable
            if (arrTransactions[16] == 'A' || arrTransactions[16] == 'C') {
                strReturn += arrTransactions[0].substring(2, arrTransactions[0].length);
                strReturn += separador;
            } else {
                strReturn += arrTransactions[0];
                strReturn += separador;
            }

            //5. Codigo de la Unidad de Operacio
            strReturn += arrTransactions[2];
            strReturn += separador;

            //6. Codigo de Centro de Costos
            strReturn += arrTransactions[3];
            strReturn += separador;

            //7. Tipo de Moneda de Origen
            strReturn += arrTransactions[4];
            strReturn += separador;

            //8. Tipo de Comprobante de Pago
            strReturn += arrTransactions[5];
            strReturn += separador;

            //9. Número serie del comprobante de pago
            if (arrTransactions[5] == '05' || arrTransactions[5] == '5') {
                strReturn += '3';
                strReturn += separador;
            } else if (arrTransactions[5] == '55') {
                strReturn += '2';
                strReturn += separador;
            } else if (arrTransactions[5] >= '51' && arrTransactions[5] <= '54') {
                //strCompras += RellenaTexto(numeseri, 3, 'N');
                if (arrTransactions[6].substr(0, 3).length < 4) {
                    strReturn += completar_cero(3, arrTransactions[18].substr(0, 3));
                    
                } else {
                    strReturn += arrTransactions[18].substr(0, 3);
                   
                }
                strReturn += separador;
            } else if (arrTransactions[5] == '50') {
                if (arrTransactions[6].substr(0, 3).length < 4) {
                   
                    strReturn += completar_cero(3, arrTransactions[18].substr(0, 3));
                } else {
                    strReturn += arrTransactions[18].substr(0, 3);
                    
                }
                strReturn += separador;
            } else {
                strReturn += arrTransactions[6];
                strReturn += separador;
            } 

            //10. Número del comprobante de pago
            strReturn += arrTransactions[7];
            strReturn += separador;

            //11. Fecha Contable
            if (arrTransactions[8] != '- None - ' && arrTransactions[8] != null && arrTransactions[8] != '') {
                var arr_date = arrTransactions[8].split('/');

                var day_temp = arr_date[0];
                var month_temp = arr_date[1];
                var year_temp = arr_date[2];

                if (('' + day_temp).length == 1) {
                    day_temp = '0' + day_temp;
                }

                if (('' + month_temp).length == 1) {
                    month_temp = '0' + month_temp;
                }

                var date = day_temp + '/' + month_temp + '/' + year_temp;

                strReturn += date;
                strReturn += separador;
            } else {
                strReturn += '';
                strReturn += separador;
            }

            //12. Fecha de Vencimiento
            if (arrTransactions[9] != '- None - ' && arrTransactions[9] != null && arrTransactions[9] != '') {
                var arr_date = arrTransactions[9].split('/');

                var day_temp = arr_date[0];
                var month_temp = arr_date[1];
                var year_temp = arr_date[2];

                if (('' + day_temp).length == 1) {
                    day_temp = '0' + day_temp;
                }

                if (('' + month_temp).length == 1) {
                    month_temp = '0' + month_temp;
                }

                var date = day_temp + '/' + month_temp + '/' + year_temp;

                strReturn += date;
                strReturn += separador;
            } else {
                strReturn += '';
                strReturn += separador;
            }

            //13. Fecha de la Operacion
            if (arrTransactions[10] != '- None - ' && arrTransactions[10] != null && arrTransactions[10] != '') {
                var arr_date = arrTransactions[10].split('/');

                var day_temp = arr_date[0];
                var month_temp = arr_date[1];
                var year_temp = arr_date[2];

                if (('' + day_temp).length == 1) {
                    day_temp = '0' + day_temp;
                }

                if (('' + month_temp).length == 1) {
                    month_temp = '0' + month_temp;
                }

                var date = day_temp + '/' + month_temp + '/' + year_temp;

                strReturn += date;
                strReturn += separador;
            } else {
                strReturn += '';
                strReturn += separador;
            }

            //14. Glosa
            strReturn += validateAccents('' + arrTransactions[11]);
            strReturn += separador;

            //15. Glosa Referencial
            strReturn += validateAccents('' + arrTransactions[12]);
            strReturn += separador;

            //16. Movimientos del Debe
            if (arrTransactions[13] != 0 && arrTransactions[13] != '') {
                strReturn += arrTransactions[13];
                strReturn += separador;
            } else {
                strReturn += '0.00';
                strReturn += separador;
            }

            //17. Movimientos del Haber
            if (arrTransactions[14] != 0 && arrTransactions[14] != '') {
                strReturn += arrTransactions[14];
                strReturn += separador;
            } else {
                strReturn += '0.00';
                strReturn += separador;
            }

            //18. Dato Estructurado
            strReturn += '';
            strReturn += separador;

            //19. Indica el estado de la operacion
            //si periodo == fecha -> 1, else 8
            /*
            log.debug('strReturn',strReturn);
            log.debug('arrTransactions[8]',arrTransactions[8]);
            */
            if (arrTransactions[16] == 'M') {
                if (arrTransactions[17] != null && arrTransactions[17] != '' && arrTransactions[17] != ' ') {
                    var UpdateMonth = arrTransactions[17].substring(4,6);
                    var UpdateYear = arrTransactions[17].substring(0,4);
                    if (periodYear == UpdateYear && periodMonth == UpdateMonth) {
                        strReturn += '1';
                    } else {
                        strReturn += '8';
                    }
                } else {
                    if (arrTransactions[8] != '- None - ' && arrTransactions[8] != null && arrTransactions[8] != '') {
                        var arr_date = arrTransactions[8].split('/');

                        var month_temp = arr_date[1];

                        if (('' + month_temp).length == 1) {
                            month_temp = '0' + month_temp;
                        }

                        var year_temp = arr_date[2];

                        if (periodYear == year_temp && periodMonth == month_temp) {
                            strReturn += '1';
                        } else {
                            strReturn += '8';
                        }
                    } else {
                        strReturn += '1';
                    }
                }
            } else {
                strReturn += '1';
            }

            strReturn += separador;
            strReturn += '\r\n';

            return strReturn;
        }


        function formatDate(date) {
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

            } else {
                fechaString = formatDate(period)
            }
            return fechaString;
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
        
        function joinMovements(arrMovements, jsonMovementsPay) {
            var arrReturn = new Array();
            var jsonTemp = {};
            var isEmptyObject = JSON.stringify(jsonMovementsPay) === '{}';

            if (arrMovements.length != 0 && !isEmptyObject) {
                arrMovements.forEach(function(movements){
                    var key = movements[15];
                    if (jsonMovementsPay[key]!=null) {
                        jsonMovementsPay[key].forEach(function(movementsPayments){
                            var arrAux = new Array();
                            arrAux[0] = movements[0];
                            arrAux[1] = movements[1];
                            arrAux[2] = movements[2];
                            arrAux[3] = movements[3];
                            arrAux[4] = movements[4];
                            arrAux[5] = movementsPayments[2];
                            arrAux[6] = movementsPayments[3];
                            arrAux[7] = movementsPayments[4];
                            arrAux[8] = movements[8];
                            arrAux[9] = movementsPayments[5];
                            arrAux[10] = movements[10];
                            arrAux[11] = movements[11];
                            arrAux[12] = movements[12];
                            arrAux[13] = movementsPayments[6];
                            arrAux[14] = movementsPayments[7];
                            arrAux[15] = movements[15];
                            arrAux[21] = movements[21];
                            arrAux[22] = movementsPayments[10];
                            arrAux[23] = movements[23];
                            if (jsonTemp[arrAux[15]]==null) {
                                jsonTemp[arrAux[15]] = new Array();
                            }
                            jsonTemp[arrAux[15]].push(arrAux);
                        });                      
                    }
                });
                arrMovements.forEach(function(movements){                
                    var key = movements[15];
                    if (jsonTemp[key]!=null) {
                        jsonTemp[key].forEach(function(temp){
                            arrReturn.push(temp);
                        });
                    }else{
                        arrReturn.push(movements);
                    }
                });
                
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
        function validateAccents(s) {
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

        function lengthInUtf8Bytes(str) {
            var m = encodeURIComponent(str).match(/%[89ABab]/g);
            return str.length + (m ? m.length : 0);
        }

        function SaveFile() {
            var FolderId = objContext.getParameter({
                name: 'custscript_lmry_pe_2016_rg_file_cabinet'
            });

            // Almacena en la carpeta de Archivos Generados
            if (FolderId != '' && FolderId != null) {
                // Extension del archivo
                var fileext;
                var NameFile;

                fileext = '.txt';
                NameFile = Name_File()+fileext;
                // Crea el archivo
                var file = fileModulo.create({
                    name: NameFile,
                    fileType: fileModulo.Type.PLAINTEXT,
                    contents: strTransactions,
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
                log.debug("urlfile",urlfile)
                log.debug("NameFile",NameFile)
                //Genera registro personalizado como log
                if (idfile) {
                    var usuarioTemp = runtime.getCurrentUser();
                    var usuario = usuarioTemp.name;

                    if (arrPeriodSpecial.length > 0) {
                        periodName = specialName;
                    }

                    if (PARAMETERS.RECORDID != null) {
                        var record = recordModulo.load({
                            type: 'customrecord_lmry_pe_2016_rpt_genera_log',
                            id: PARAMETERS.RECORDID
                        });
                    } else {
                        var record = recordModulo.create({
                            type: 'customrecord_lmry_pe_2016_rpt_genera_log'
                        });
                    }

                    //Nombre de Archivo
                    record.setValue({
                        fieldId: 'custrecord_lmry_pe_2016_rg_name',
                        value: NameFile
                    });

                    //Url de Archivo
                    record.setValue({
                        fieldId: 'custrecord_lmry_pe_2016_rg_url_file',
                        value: urlfile
                    });

                    //Nombre de Reporte
                    record.setValue({
                        fieldId: 'custrecord_lmry_pe_2016_rg_transaction',
                        value: NAME_REPORT
                    });

                    //Nombre de Subsidiaria
                    record.setValue({
                        fieldId: 'custrecord_lmry_pe_2016_rg_subsidiary',
                        value: COMPANY.NAME
                    });

                    //Periodo
                    record.setValue({
                        fieldId: 'custrecord_lmry_pe_2016_rg_postingperiod',
                        value: periodName
                    });

                    //Multibook
                    if (FEATURES.MULTIBOOK || FEATURES.MULTIBOOK == 'T') {
                        record.setValue({
                            fieldId: 'custrecord_lmry_pe_rg_multibook',
                            value: multibookName
                        });
                    }

                    //Creado Por
                    record.setValue({
                        fieldId: 'custrecord_lmry_pe_2016_rg_employee',
                        value: usuario
                    });

                    var recordId = record.save();


                    // Envia mail de conformidad al usuario
                    libreria.sendrptuser(NAME_REPORT, 3, NameFile);
                }
            } else {
                // Debug
                log.error({
                    title: 'Creacion de File:',
                    details: 'No existe el folder'
                });
            }
        }


        function Name_File() {
            var name = '';
            //LERRRRRRRRRRRAAAAMM0001010000OIM1.TXT

            if (PARAMETERS.TYPE_EXT_PERIOD == '1') { //Por nombre periodo
                var fechaString = getPeriod(periodName, 1);
                var periodenddate_temp = search.lookupFields({
                    type: search.Type.ACCOUNTING_PERIOD,
                    id: PARAMETERS.PERIOD,
                    columns: ['startdate', 'enddate', 'periodname']
                });

                var periodstartdate = periodenddate_temp.startdate;
                log.error('periodstartdate1', periodstartdate);
                periodstartdate = format.parse({
                    value: periodstartdate,
                    type: format.Type.DATE
                });
                var AAAA = periodstartdate.getFullYear();
                AAAA = Number(AAAA).toFixed(0);
                var MM = Number(periodstartdate.getMonth()) + 1;

                if (arrPeriodSpecial.length > 0) {
                    AAAA = Number(YYYY_inicial).toFixed(0);
                    MM = Number(MM_inicial);
                }

                if (('' + MM).length == 1) {
                    MM = '0' + MM;
                }

            } else { //por enddate
                var fechaString = getPeriod(periodEndDate, 2);
                fechaString = fechaString.split('/');
                var MM = fechaString[1];
                var AAAA = fechaString[2];
            }


            //M: Get Moneda
            if (FEATURES.MULTIBOOK) {
                var M = getCurrencyFromLedger();
            } else {
                var M = 1;
                var currency_id;

                if (FEATURES.SUBSID) {
                    var currency_subsidiary = search.lookupFields({
                        type: search.Type.SUBSIDIARY,
                        id: PARAMETERS.SUBSID,
                        columns: ['currency']
                    });

                    currency_id = currency_subsidiary.currency[0].value;
                } else {
                    var configpage = config.load({
                        type: config.Type.COMPANY_INFORMATION
                    });

                    currency_id = configpage.getValue('basecurrency');
                }

                var currency_symbol = search.lookupFields({
                    type: search.Type.CURRENCY,
                    id: currency_id,
                    columns: ['symbol']
                });

                if (currency_symbol.symbol != 'PEN') {
                    M = 2;
                }
            }

            //LERRRRRRRRRRRAAAAMM0001010000OIM1.TXT

            name = 'LE' + COMPANY.RUC + AAAA + MM + '0001010000';

            if (FEATURES.MULTIBOOK) {
                if (fileNumber != 0) {
                    //name += '2' + '1' + M + '1' + '_' + paramMultibook + '_' + paramCont;
                    name += PARAMETERS.OPERATIONS_INDICATOR + '1' + M + '1' + '_' + PARAMETERS.MULTIBOOK + '_' + fileNumber;
                } else {
                    //name += '2' + '1' + M + '1' + '_' + paramMultibook;
                    name += PARAMETERS.OPERATIONS_INDICATOR + '1' + M + '1' + '_' + PARAMETERS.MULTIBOOK;
                }
            } else {
                if (fileNumber != 0) {
                    name += PARAMETERS.OPERATIONS_INDICATOR + '1' + M + '1' + '_' + fileNumber;
                } else {
                    name += PARAMETERS.OPERATIONS_INDICATOR + '1' + M + '1';
                }
            }

            return name;
        }

        function updateLogGenerator(name_carpeta) {

            var records = recordModulo.load({
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

        function getCurrencyFromLedger() {
            if (FEATURES.SUBSID) {
                var accountingbookSearch = search.create({
                    type: search.Type.ACCOUNTING_BOOK,
                    columns: [{
                        name: 'currency'
                    }],
                    filters: [{
                        name: 'subsidiary',
                        operator: 'anyof',
                        values: [PARAMETERS.SUBSID]
                    }, {
                        name: 'internalid',
                        operator: 'anyof',
                        values: [PARAMETERS.MULTIBOOK]
                    }]
                });
            } else {
                var accountingbookSearch = search.create({
                    type: search.Type.ACCOUNTING_BOOK,
                    columns: [{
                        name: 'currency'
                    }],
                    filters: [{
                        name: 'internalid',
                        operator: 'anyof',
                        values: [PARAMETERS.MULTIBOOK]
                    }]
                });
            }

            var searchresult = accountingbookSearch.run();
            var objResult = searchresult.getRange(0, 1000);

            var array_cu = new Array();
            var cont = 0;

            for (var fil = 0; fil < objResult.length; fil++) {
                columns = objResult[fil].columns;
                var arr = new Array();
                for (var col = 0; col < columns.length; col++) {
                    arr[col] = objResult[fil].getValue(columns[col]);
                }
                array_cu[cont] = arr;
                cont++;
            }

            var currency_book = array_cu[0];

            var currency_symbol_obj = search.lookupFields({
                type: search.Type.CURRENCY,
                id: currency_book,
                columns: ['symbol']
            });

            var currency_symbol = currency_symbol_obj.symbol;

            if (currency_symbol == 'PEN') {
                //Sol
                return '1';
            } else {
                //Dolares Americanos
                return '2';
            }
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

        function NoData() {
            if (arrPeriodSpecial.length > 0) {
                periodName = specialName;
            }

            if (PARAMETERS.RECORDID != null) {
                var recordLog = recordModulo.load({
                    type: 'customrecord_lmry_pe_2016_rpt_genera_log',
                    id: PARAMETERS.RECORDID
                });
            } else {
                var recordLog = recordModulo.create({
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

        return {
            execute: execute
        };

    });