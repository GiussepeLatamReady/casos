/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_PE_LibroCajaYBancosEfectiva_SCHDL_V2.0.js   ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0    NOVIEMBRE 14 2018  LatamReady    Use Script 2.0      ||
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

                if (i == 0) {
                    var files = fileModulo.load({
                        id: arrfiles[i]
                    }).getContents();
                } else {
                    var aux = fileModulo.load({
                        id: arrfiles[i]
                    }).getContents();
                    files.push(aux);
                }
            }

            arrTransactions = JSON.parse(files);


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
                    strReturn += "M" + completar_cero(3,contNcorreltivo);
                }else{
                    contNcorreltivo=1;
                    strReturn += "M" + completar_cero(3,contNcorreltivo);
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
                NameFile = Name_File() + fileext;
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