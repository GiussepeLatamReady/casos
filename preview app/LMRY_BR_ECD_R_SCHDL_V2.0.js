/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for Inventory Balance Library                  ||
||                                                              ||
||  File Name: LMRY_BR_ECD_R_SCHDL_V2.0.js                      ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Dec 11 2019  Alexander     Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
    * @NApiVersion 2.x
    * @NScriptType ScheduledScript
    * @NModuleScope Public
**/

define (['N/record', 'N/runtime', 'N/file', 'N/email', 'N/search', 'N/format', 'N/log', 'N/config',
    './BR_LIBRERIA_MENSUAL/LMRY_BR_Reportes_LBRY_V2.0.js'],
    function (record, runtime, file, email, search, format, log, config, libreria) {

        var objContext = runtime.getCurrentScript();

        var reportName = "BR - ECD";
        var LMRY_script = 'LMRY_BR_ECD_G_SCHDL_V2.0.js';

        var paramPeriod = "";
        var paramSubsidiary = "";
        var paramMultibook = "";
        var paramBookType = "";
        var paramReportId = "";
        var paramLogId = "";
        var paramDeclarationType = "";
        var paramTransactionFileId = "";
        var paramAccountsForPeriodFileId = "";
        var paramAccountsFileId = "";
        var paramLocalAccountAndAccountingGroupFileId = "";
        var paramNumOrder = "";

        var hasSubsidiaryFeature = '';
        var hasMultibookFeature = '';

        var subsidiaryJson = {};
        var setupJson = {};
        var registrosMostrados = [];
        var departmentJson = {};

        var startDate  = "",
            endDate    = "",
            periodYear = "";

        var numeroLineasReporte = 0,
            numeroLineasBloque0 = 0,
            numeroLineasBloqueI = 0,
            numeroLineasBloqueJ = 0,
            numeroLineasBloque9 = 0;

        var transactionsJson = {};
        var localAccountJson = {};
        var planCuentasArray = [];
        var accountingGroupJson = {};

        var saldoPeriodosJson = {0:[],1:[],2:[],3:[],4:[],5:[],6:[],7:[],8:[],9:[],10:[],11:[],12:[]};
        var codPlanCuentasReferencial = "";

        var language = runtime.getCurrentScript().getParameter({
            name : 'LANGUAGE'
        }).substring(0,2);

        function execute(context) {

            try {
                obtenerParametrosYFeatures();

                obtenerDatosSubsidiaria();

                obtenerSetup();

                obtenerDepartamentos();

                codPlanCuentasReferencial = obtenerCodPlanCuentasReferencial();

                if (paramTransactionFileId) {
                    obtenerArchivo(paramTransactionFileId, 1);
                }

                if (paramAccountsForPeriodFileId) {
                    obtenerArchivo(paramAccountsForPeriodFileId, 2);
                }

                if (paramAccountsFileId) {
                    obtenerArchivo(paramAccountsFileId, 3);
                }

                if (paramLocalAccountAndAccountingGroupFileId) {
                    obtenerArchivo(paramLocalAccountAndAccountingGroupFileId, 4);
                }

                log.error("localAccountJson", localAccountJson);

                log.error("PLAN DE CUENTAS", planCuentasArray);

                log.error("Transacciones", transactionsJson);
                log.error("Period Json", saldoPeriodosJson);

                generarReporte();
            } catch (error) {
                log.error("ERROR", error);
                libreria.sendemailTranslate(error, LMRY_script, language);
                NoData(true);
            }
        }

        function obtenerParametrosYFeatures() {

            paramPeriod = objContext.getParameter('custscript_lmry_br_ecd_r_period');
            paramSubsidiary = objContext.getParameter('custscript_lmry_br_ecd_r_sub');
            paramMultibook = objContext.getParameter('custscript_lmry_br_ecd_r_mlb');
            paramDeclarationType = objContext.getParameter('custscript_lmry_br_ecd_r_tipo_decla');
            paramReportId = objContext.getParameter('custscript_lmry_br_ecd_r_idrpt');
            paramTransactionFileId = objContext.getParameter('custscript_lmry_br_ecd_r_tranidfile');
            paramAccountsForPeriodFileId = objContext.getParameter('custscript_lmry_br_ecd_r_accper_idfile');
            paramAccountsFileId = objContext.getParameter('custscript_lmry_br_ecd_r_accidfile');
            paramLocalAccountAndAccountingGroupFileId = objContext.getParameter('custscript_lmry_br_ecd_r_la_ag_idfile');
            paramLogId = objContext.getParameter('custscript_lmry_br_ecd_r_recordid');
            paramBookType = objContext.getParameter('custscript_lmry_br_ecd_r_tipo_libro');
            paramNumOrder = objContext.getParameter('custscript_lmry_br_ecd_r_num_orden');

            log.error({
                title : "Parametros",
                details : paramPeriod + '-' + paramSubsidiary + '-' + paramMultibook + '-' +paramDeclarationType + '-' + paramReportId + '-' + paramLogId + '-' + paramBookType + '-' + paramAccountsFileId + '-' + paramTransactionFileId + '-' + paramAccountsForPeriodFileId + '-' + paramLocalAccountAndAccountingGroupFileId + '-' + paramNumOrder
            });

            hasSubsidiaryFeature = runtime.isFeatureInEffect({
                feature : 'SUBSIDIARIES'
            });

            hasMultibookFeature = runtime.isFeatureInEffect({
                feature : 'MULTIBOOK'
            });

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

            periodYear = startDateObject.getFullYear() + "";
            var endDateObject = format.parse({
                type  : format.Type.DATE,
                value : periodRecord.enddate
            });
            endDate = obtenerFormatoFecha(endDateObject);

            if (hasMultibookFeature) {
                var multibookRecord = search.lookupFields({
                    type    : search.Type.ACCOUNTING_BOOK,
                    id      : paramMultibook,
                    columns : ['name']
                });

                multibookName = multibookRecord.name;
            }

            if (paramReportId) {
                var rptFeatureRecord = search.lookupFields({
                    type    : 'customrecord_lmry_br_features',
                    id      : paramReportId,
                    columns : ['name']
                });
                reportName = rptFeatureRecord.name;
            }
        }

        function obtenerPeriodoAjuste() {
            var startDatePeriodoAjuste = "";
            var savedSearch = search.create({
               type    : "accountingperiod",
               filters :
               [
                  ["isadjust","is","T"],
                  "AND",
                  ["parent","anyof",paramPeriod]
               ],
               columns : ["internalid", "startdate"]
            });

            var pagedData = savedSearch.runPaged({
                pageSize : 1000
            });

            var page, auxArray, columns;
            pagedData.pageRanges.forEach(function(pageRange) {
                page = pagedData.fetch({
                    index : pageRange.index
                });

                page.data.forEach(function(result) {
                    columns = result.columns;
                    startDatePeriodoAjuste = result.getValue(columns[1]);
                    log.error("startDatePeriodoAjuste",startDatePeriodoAjuste);
                    var date = format.parse({
                        type  : format.Type.DATE,
                        value : startDatePeriodoAjuste
                    });

                    log.error("date",date);

                    startDatePeriodoAjuste = obtenerFormatoFecha(date);
                    log.error("new Adjust",date);


                });
            });

            return startDatePeriodoAjuste || "3112" + periodYear;
        }

        function obtenerDatosSubsidiaria() {
            if (hasSubsidiaryFeature && paramSubsidiary) {
                var subsidiaryRecord = search.lookupFields({
                    type    : search.Type.SUBSIDIARY,
                    id      : paramSubsidiary,
                    columns : [
                        'legalname', // Nombre Empresa
                        'taxidnum', // CNPJ
                        'address.custrecord_lmry_addr_prov_acronym',
                        'custrecord_lmry_br_uf', //
                        'custrecord_lmry_br_state_tax_sub', //
                        'custrecord_lmry_br_obligated_ecd', //
                        'address.custrecord_lmry_addr_city', //
                        'address.custrecord_lmry_addr_city_id',
                        'custrecord_lmry_br_municipal_sub',
                        'custrecord_lmry_br_nire',
                        'custrecord_lmry_br_cnpj_scp',
                        'custrecord_lmry_br_regimen_pis_confis'
                    ] //
                });
                subsidiaryJson['legalname'] = subsidiaryRecord.legalname;
                subsidiaryJson['cnpj'] = subsidiaryRecord.taxidnum;
                subsidiaryJson['uf'] = subsidiaryRecord['address.custrecord_lmry_addr_prov_acronym'];
                subsidiaryJson['ie'] = subsidiaryRecord.custrecord_lmry_br_state_tax_sub;
                subsidiaryJson['codMunicipio'] = subsidiaryRecord['address.custrecord_lmry_addr_city_id'];
                subsidiaryJson['regMunicipio'] = subsidiaryRecord.custrecord_lmry_br_municipal_sub;
                subsidiaryJson['descMunicipio'] = subsidiaryRecord['address.custrecord_lmry_addr_city'][0].text;
                subsidiaryJson['nire'] = subsidiaryRecord.custrecord_lmry_br_nire;
                subsidiaryJson['cnpjScp'] = subsidiaryRecord.custrecord_lmry_br_cnpj_scp;
                subsidiaryJson['regimen'] = subsidiaryRecord['custrecord_lmry_br_regimen_pis_confis'][0].value;

            } else {
                var configPage = config.load({
                    type : config.Type.COMPANY_INFORMATION
                });
                subsidiaryJson['cnpj'] = configPage.getValue('employerid');
                subsidiaryJson['legalname'] = configPage.getValue('legalname');
            }
        }

        function obtenerSetup() {
            var savedSearch = search.create({
                type    : 'customrecord_lmry_br_setup_rpt_dctf',
                filters : [['custrecord_lmry_br_rpt_subsidiary', 'anyof', paramSubsidiary]],
                columns : [
                    'custrecord_lmry_br_ind_period_start',
                    'custrecord_lmry_br_ind_grande_porte',
                    'custrecord_lmry_br_ecf_type',
                    'custrecord_lmry_br_reg0007_ecd',
                    'custrecord_lmry_br_calificacion_pj',
                    'custrecord_lmry_br_legalrepresentative',
                    'custrecord_lmry_br_responsable_ecd'
                ]
            });

            var objResult = savedSearch.run().getRange(0,1);

            if (objResult != null && objResult.length != 0){
                var columns = objResult[0].columns;

                setupJson["situaIniPeriod"] = objResult[0].getText(columns[0]).substring(0,1);
                setupJson["auditInde"] = objResult[0].getValue(columns[1]);
                setupJson["tipoEcd"] = objResult[0].getText(columns[2]).substring(0,1);
                setupJson["reg0007"] = objResult[0].getValue(columns[3]);
                setupJson["califPj"] = objResult[0].getValue(columns[4]);
                setupJson["legRepes"] = objResult[0].getValue(columns[5]);
                setupJson["respEcd"] = objResult[0].getValue(columns[6]);
            }
        }

        function obtenerDepartamentos() {

            var newSearch = search.create({
                type    : 'department',
                filters : ['isinactive', 'is', 'F'],
                columns : ['internalid', 'name', 'custrecord_lmry_department_code']
            });

            if (hasSubsidiaryFeature) {
                var subsidiaryFilter = search.createFilter({
                    name     : 'subsidiary',
                    operator : search.Operator.IS,
                    values   : paramSubsidiary
                });
                newSearch.filters.push(subsidiaryFilter);
            }

            var pagedData = newSearch.runPaged({
                pageSize : 1000
            });


            var page, auxArray, columns;
            pagedData.pageRanges.forEach(function(pageRange) {
                page = pagedData.fetch({
                    index : pageRange.index
                });

                page.data.forEach(function(result) {
                    columns = result.columns;
                    auxArray = [];

                    //0. Internalid
                    auxArray[0] = result.getValue(columns[0]);

                    //1. Fecha Creacion
                    auxArray[1] = '01012005';

                    //2. Codigo
                    auxArray[2] = result.getValue(columns[2]);

                    //3. Name
                    auxArray[3] = result.getValue(columns[1]);

                    departmentJson[auxArray[0]] = auxArray;
                });
            });
        }

        function obtenerArchivo(stringIdFile, tipoArchivo) {
            var filesIdArray = stringIdFile.split('|');
            var auxArray = [];
            var archivo;

            for (var i = 0; i < filesIdArray.length; i++) {
                if (filesIdArray[i]) {
                    archivo = file.load({
                        id : filesIdArray[i]
                    });
                    auxArray.push(archivo.getContents());
                }
            }

            var contenidoArray = [];
            for (var i = 0; i < auxArray.length; i++) {
                contenidoArray = auxArray[i].split('\r\n');
                for (var j = 0; j < contenidoArray.length; j++) {
                    if (contenidoArray[j].length != 0) {
                        cargarVariables(contenidoArray[j].split('|'), tipoArchivo);
                    }
                }
            }
        }

        function cargarVariables(arreglo, tipo) {
            if (tipo == 1) {
                if (transactionsJson[arreglo[0]] === undefined) {
                    transactionsJson[arreglo[0]] = [];
                }
                transactionsJson[arreglo[0]].push(arreglo);
            } else if (tipo == 2) {
                saldoPeriodosJson[arreglo[0]].push(arreglo);
            } else if (tipo == 3) {
                planCuentasArray.push(arreglo);
            } else if (tipo == 4) {
                if (arreglo[0] == "LA" && codPlanCuentasReferencial != "") {
                    localAccountJson[arreglo[1]] = arreglo[2];
                } else if (arreglo[0] == "AG") {
                    accountingGroupJson[arreglo[1]] = arreglo;
                }
            }
        }

        function generarReporte() {
            var strTxt = '';

            strTxt += generarBloque0();
            strTxt += generarBloqueI();
            strTxt += generarBloqueJ();
            strTxt += generarBloque9();

            strTxt = strTxt.replace(/TotalLineasReporte/gi,numeroLineasReporte);

            saveFile(strTxt);
        }

        function generarBloque0() {
            var strBloque0 = '';

            // Registro0000
            // Falta completar campos cuando es sustituo.
            numeroLineasBloque0++;
            strBloque0 += obtenerRegistro0000();
            registrosMostrados.push(['0000','1']);

            // Registro0001
            numeroLineasBloque0++;
            strBloque0 += '|0001|0|\r\n';
            registrosMostrados.push(['0001','1']);

            // Registro 0007
            var reg0007Array = setupJson["reg0007"].split(',');
            for (var i = 0; i < reg0007Array.length; i = i + 2) {
                strBloque0 += '|0007|'+ reg0007Array[i] + '|'+ reg0007Array[i+1] + '|\r\n'
                numeroLineasBloque0++;
            }
            registrosMostrados.push(['0007',reg0007Array.length/2]);

            // Registro 0990
            numeroLineasBloque0++;
            strBloque0 += '|0990|' + numeroLineasBloque0 + '|\r\n';
            registrosMostrados.push(['0990','1']);

            numeroLineasReporte += numeroLineasBloque0;

            return strBloque0;
        }

        function generarBloqueI() {
            var strBloqueI = '';

            // Registro I001 1:1
            numeroLineasBloqueI++;
            strBloqueI += '|I001|0|\r\n';
            registrosMostrados.push(['I001','1']);

            // Registro I010 1:1
            numeroLineasBloqueI++;
            strBloqueI += '|I010|R|8.00|\r\n';
            registrosMostrados.push(['I010','1']);

            //Registro I012 1:N
            numeroLineasBloqueI++;
            strBloqueI += '|I012|1|DIARIO AUXILIAR DA CONTA BANCOS|0|33AE96E3D1A5EE6969D78BDC56551F91AE9558F8|\r\n' ; // 5 CAMPOS OBLIGATORIOS CUANDO ES 'R' Y EL CAMPO 4 ES 0.
            registrosMostrados.push(['I012','1']);

            //Registro I015
            strBloqueI += obtenerRegistroI015();

            // Registro I030
            numeroLineasBloqueI++;
            strBloqueI += obtenerRegistroI030();
            registrosMostrados.push(['I030','1']);

            // Registro I050
            strBloqueI += obtenerCuentas();

            // Registro I075
            strBloqueI += obtenerRegistrosI075();

            // Registro I100
            strBloqueI += obtenerRegistroI100();

            // Registro I150 y I155
            strBloqueI += obtenerSaldosPeriodicos();

            // Registro I200 Y I250
            strBloqueI += obtenerAsientoContable();

            // Registro I350 y I355
            strBloqueI += obtenerRegistroI300I350();
            numeroLineasBloqueI++;
            numeroLineasBloqueI += saldoPeriodosJson[12].length;
            registrosMostrados.push(['I350','1']);
            registrosMostrados.push(['I355',saldoPeriodosJson[12].length]);

            // Registro I990
            numeroLineasBloqueI++;
            strBloqueI += '|I990|' + numeroLineasBloqueI + '|\r\n';
            registrosMostrados.push(['I990','1']);

            numeroLineasReporte += numeroLineasBloqueI;

            return strBloqueI;
        }

        function generarBloqueJ() {
            var strBloqueJ = '';

            // Registro J001
            numeroLineasBloqueJ++;
            strBloqueJ += '|J001|0|\r\n';
            registrosMostrados.push(['J001','1']);

            // Registro J005
            numeroLineasBloqueJ++;
            strBloqueJ += '|J005|' + startDate + '|' + endDate + '|1||\r\n';
            registrosMostrados.push(['J005','1']);

            //Registros J100 y 150
            strBloqueJ += obtenerRegistroJ100J150();

            // Registro J900
            numeroLineasBloqueJ++;
            strBloqueJ += '|J900|TERMO DE ENCERRAMENTO|' + paramNumOrder + '|Libro Diario|' + subsidiaryJson['legalname'] + '|TotalLineasReporte|' + startDate + '|' + endDate + '|\r\n';
            registrosMostrados.push(['J900','1']);

            // Registro J930
            strBloqueJ += obtenerRegistroJ930();

            // Registro J990
            numeroLineasBloqueJ++;
            strBloqueJ += '|J990|' + numeroLineasBloqueJ + '|\r\n';
            registrosMostrados.push(['J990','1']);

            numeroLineasReporte += numeroLineasBloqueJ;

            return strBloqueJ;
        }

        function generarBloque9() {
            var strBloque9 = '';

            // Registro 9001
            numeroLineasBloque9++;
            strBloque9 += '|9001|0|\r\n';

            // Registro 9900
            var numeroRegistrosMostrados = registrosMostrados.length;
            numeroLineasBloque9 += numeroRegistrosMostrados + 4;
            for (var i = 0; i < numeroRegistrosMostrados; i++) {
                strBloque9 += '|9900|' + registrosMostrados[i][0] + '|' + registrosMostrados[i][1] + '|\r\n';
            }
            strBloque9 += '|9900|9001|1|\r\n';
            strBloque9 += '|9900|9900|' + (numeroRegistrosMostrados + 4) + '|\r\n';
            strBloque9 += '|9900|9990|1|\r\n';
            strBloque9 += '|9900|9999|1|\r\n';

            numeroLineasBloque9++;
            numeroLineasBloque9++;
            // Registro 9990x
            strBloque9 += '|9990|' + numeroLineasBloque9 + '|\r\n';

            numeroLineasReporte += numeroLineasBloque9;
            // Registro 9999
            strBloque9 += '|9999|' + numeroLineasReporte + '|\r\n';

            return strBloque9;
        }

        function saveFile(strTransactions) {
            var folderId = objContext.getParameter({
                name : 'custscript_lmry_file_cabinet_rg_br'
            });

            if (folderId != '' && folderId != null) {

                var fileName = obtenerNombreArchivo() +'.txt';

                var ecdFile = file.create({
                    name     : fileName,
                    fileType : file.Type.PLAINTEXT,
                    contents : strTransactions,
                    encoding : file.Encoding.ISO_8859_1,
                    folder   : folderId
                });

                var fileId = ecdFile.save(); // Termina de grabar el archivo
                var ecdFile = file.load({
                    id : fileId
                }); // Trae URL de archivo generado

                // Obtenemo de las prefencias generales el URL de Netsuite (Produccion o Sandbox)
                var getURL = objContext.getParameter({
                    name: 'custscript_lmry_netsuite_location'
                });
                var fileUrl = '';

                if (getURL != '' && getURL != '') {
                    fileUrl += 'https://' + getURL;
                }

                fileUrl += ecdFile.url;

                if (fileId) {
                    var usuario = runtime.getCurrentUser();
                    var employee = search.lookupFields({
                        type    : search.Type.EMPLOYEE,
                        id      : usuario.id,
                        columns : ['firstname', 'lastname']
                    });
                    var usuarioName = employee.firstname + ' ' + employee.lastname;

                    if (false) {
                        var logRecord = record.create({
                            type : 'customrecord_lmry_br_rpt_generator_log'
                        });
                    } else {
                        var logRecord = record.load({
                            type : 'customrecord_lmry_br_rpt_generator_log',
                            id   : paramLogId
                        });
                    }

                    logRecord.setValue({
                        fieldId : 'custrecord_lmry_br_rg_report',
                        value   : reportName
                    });

                    logRecord.setValue({
                        fieldId : 'custrecord_lmry_br_rg_period',
                        value   : periodYear
                    });

                    logRecord.setValue({
                        fieldId : 'custrecord_lmry_br_rg_subsidiary',
                        value   : subsidiaryJson['legalname']
                    });

                    if (hasMultibookFeature) {
                        logRecord.setValue({
                            fieldId : 'custrecord_lmry_br_rg_multibook',
                            value   : multibookName
                        });
                    }

                    logRecord.setValue({
                        fieldId : 'custrecord_lmry_br_rg_employee',
                        value   : usuarioName
                    });

                    logRecord.setValue({
                        fieldId : 'custrecord_lmry_br_rg_name_field',
                        value   : fileName
                    });

                    logRecord.setValue({
                        fieldId : 'custrecord_lmry_br_rg_url_file',
                        value   : fileUrl
                    });

                    var recordId = logRecord.save();

                    libreria.sendrptuserTranslate(reportName, 3, fileName, language);
                }

            } else {
                // Debug
                log.error({
                    title   : 'Creacion de File:',
                    details : 'No existe el folder'
                });
            }
        }


        function obtenerNombreArchivo() {
            return 'SpedECD-' + retornaNumero(subsidiaryJson['cnpj'],2) + '_' + startDate +'_'+ endDate+ '_R';
        }

        function completarCero(tamano, valor) {
            var strValor = valor + '';
            var lengthStrValor = strValor.length;
            var nuevoValor = valor + '';

            if (lengthStrValor <= tamano) {
                if (tamano != lengthStrValor) {
                    for (var i = lengthStrValor; i < tamano; i++){
                        nuevoValor = '0' + nuevoValor;
                    }
                }
                return nuevoValor;
            } else {
                return nuevoValor.substring(0,tamano);
            }
        }

        function retornaNumero(numeroIdentificacion, tipo){
            if (tipo == 1) {
                var cnpj = numeroIdentificacion.split('/');
                return cnpj[0].replace(/\./g, '');
            } else if (tipo == 2) {
                return numeroIdentificacion.replace(/(\.|-|\/)/g,'');
            }
            return '';
        }

        function obtenerRegistro0000() {
            var arregloCampos = [];
            arregloCampos[1] = '0000';
            arregloCampos[2] = 'LECD';
            arregloCampos[3] = startDate;
            arregloCampos[4] = endDate;
            arregloCampos[5] = subsidiaryJson['legalname'];
            arregloCampos[6] = retornaNumero(subsidiaryJson['cnpj'],2);
            arregloCampos[7] = subsidiaryJson['uf'];

            // Inscrição Estadual da pessoa jurídica. - No Obligatorio
            arregloCampos[8] = retornaNumero(subsidiaryJson['ie'],2);

            //
            arregloCampos[9] = subsidiaryJson['codMunicipio'];

            // Inscrição Municipal da pessoa jurídica. - No Obligatorio
            arregloCampos[10] = retornaNumero(subsidiaryJson['regMunicipio'],2);

            // Indicador de situação especial - No Obligatorio
            arregloCampos[11] = '';

            // Indicador de situação no início do período - Obligatorio
            arregloCampos[12] = setupJson["situaIniPeriod"];

            // Indicador de existência de NIRE - Obligatorio
            var nire = subsidiaryJson['nire'];

            if(nire != null && nire != ''){
                arregloCampos[13] = '1';
            }else{
                arregloCampos[13] = '0';
            }

            // Indicador de finalidade da escrituração: - Obligatorio
            arregloCampos[14] = paramDeclarationType;

            // Hash da escrituração substituída. - No Obligatorio
            arregloCampos[15] = '';

            // Indicador de entidade sujeita a auditoria independente - Obligatorio
            if(setupJson["auditInde"] == true){
                arregloCampos[16] = '1';
            }else{
                arregloCampos[16] = '0';
            }

            // Indicador do tipo de ECD: - Obligatorio
            arregloCampos[17] = setupJson["tipoEcd"];

            // CNPJ da SCP - no Obligatorio - falta validar se llena si es scp
            if (setupJson["tipoEcd"] != "0") {
                arregloCampos[18] = retornaNumero(subsidiaryJson['cnpjScp'],2);
            } else {
                arregloCampos[18] = "";
            }

            // Identificação de moneda funcional - Obligatorio
            arregloCampos[19] = 'N';

            // Escriturações Contábeis Consolidadas - Obligatorio
            arregloCampos[20] = 'N';

            // Indicador da modalidade de escrituração centralizada ou descentralizada: - Obligatorio
            arregloCampos[21] = '0';

            // Indicador de mudança de plano de contas: - Obligatorio
            arregloCampos[22] = '0';

            // Código do Plano de Contas Referencial
            arregloCampos[23] = codPlanCuentasReferencial;


            return recorrerCampos(arregloCampos);
        }

        function obtenerCodPlanCuentasReferencial() {
            var codigoPlanCuentasReferencial = "";

            log.error("regimen",subsidiaryJson['regimen'])

            log.error("tipo",setupJson["califPj"]);

            if (setupJson["califPj"] == "7") {
                if (subsidiaryJson["regimen"] == "2" || subsidiaryJson["regimen"] == "4") {
                    codigoPlanCuentasReferencial = "1";
                } else if (subsidiaryJson["regimen"] == "3") {
                    codigoPlanCuentasReferencial = "2";
                }
            } else if (setupJson["califPj"] == "2" && (subsidiaryJson["regimen"] == "2" || subsidiaryJson["regimen"] == "4") ) {
                codigoPlanCuentasReferencial = "3";
            } else if (setupJson["califPj"] == "39" && (subsidiaryJson["regimen"] == "2" || subsidiaryJson["regimen"] == "4")) {
                codigoPlanCuentasReferencial = "4";
            }
            log.error("codigoPlanCuentasReferencial", codigoPlanCuentasReferencial);
            return codigoPlanCuentasReferencial;
        }

        function obtenerRegistroI030() {
            var arregloCampos = [];

            arregloCampos[1] = 'I030';
            arregloCampos[2] = 'TERMO DE ABERTURA';

            // Número de ordem do instrumento de escrituração. - Obligatorio
            arregloCampos[3] = paramNumOrder;

            arregloCampos[4] = 'Libro Diario';

            // Quantidade total de linhas do arquivo digital. - Obligatorio
            arregloCampos[5] = 'TotalLineasReporte';

            arregloCampos[6] = subsidiaryJson['legalname'];

            // Número de Identificação do Registro de Empresas da Junta Comercial - No Obligatorio
            arregloCampos[7] = subsidiaryJson['nire'];

            arregloCampos[8] = retornaNumero(subsidiaryJson['cnpj'],2);

            // Data do arquivamento dos atos constitutivos. - No Obligatorio
            // A data do arquivamento dos dados constitutivos é a data do primeiro registro da empresa na Jucesp, ou seja, do primeiro NIRE.
            // Utiliza-se sempre a data do primeiro NIRE, mesmo que tenha novos NIRE's posteriores, decorrentes de processo de transformação?
            arregloCampos[9] = '';

            // Data de arquivamento do ato de conversão de sociedade simples em sociedade empresária. - No Obligatorio
            arregloCampos[10] = '';

            arregloCampos[11] = subsidiaryJson['descMunicipio'];

            arregloCampos[12] = endDate;

            return recorrerCampos(arregloCampos);
        }

        function obtenerCuentas() {
            var totalString = "", numeroLineasI051 = 0, numeroLineasI052 = 0;
            var planCuentasLength = planCuentasArray.length;
            for (var i = 0; i < planCuentasLength; i++) {
                totalString += "|I050|" + planCuentasArray[i][1] + '|' + planCuentasArray[i][2] + '|' + planCuentasArray[i][3] + '|' + planCuentasArray[i][4] + '|' + planCuentasArray[i][5] + '|' + planCuentasArray[i][6] + '|' + planCuentasArray[i][7] + '|' + '\r\n';

                if (localAccountJson[planCuentasArray[i][0]] !== undefined) {
                    totalString += "|I051||" + localAccountJson[planCuentasArray[i][0]] + "|\r\n";
                    numeroLineasI051++;
                }

                if (planCuentasArray[i][8]) {
                    totalString += "|I052||" + planCuentasArray[i][8] + "|\r\n";
                    numeroLineasI052++;
                }
            }

            numeroLineasBloqueI += planCuentasLength;
            numeroLineasBloqueI += numeroLineasI052;
            numeroLineasBloqueI += numeroLineasI051;

            registrosMostrados.push(['I050', planCuentasLength]);
            registrosMostrados.push(['I051', numeroLineasI051]);
            registrosMostrados.push(["I052", numeroLineasI052]);

            return totalString;
        }

        function obtenerRegistrosI075() {
            var registroI075 = "";
/*
            registroI075 += "|I075|1|TERCEIRIZAÇÃO SALÁRIOS|\r\n";
            registroI075 += "|I075|2|TERCEIR. DE PESSOAL - VT|\r\n";
            registroI075 += "|I075|3|TERCEIR. DE PESSOAL - VR|\r\n";
            registroI075 += "|I075|4|TERCEIR. DE PESSOAL - AM|\r\n";
            registroI075 += "|I075|5|SERV CONTÁBEIS VERTICORE|\r\n";
            registroI075 += "|I075|6|ALUGUEL|\r\n";
            registroI075 += "|I075|7|CARTÃO CORPORATIVO VIAGEM|\r\n";
            registroI075 += "|I075|8|CARTÃO CORPORATIVO - INFO|\r\n";
            registroI075 += "|I075|9|PROVISÃO DE SALÁRIOS|\r\n";
            registroI075 += "|I075|10|IR SOBRE FOPAG|\r\n";
            registroI075 += "|I075|11|PROVISÃO DE FGTS|\r\n";
            registroI075 += "|I075|12|FGTS SOBRE 13º SALÁRIO|\r\n";
            registroI075 += "|I075|13|INSS SOBRE 13º SALÁRIO|\r\n";
            registroI075 += "|I075|14|FGTS SOBRE FÉRIAS|\r\n";
            registroI075 += "|I075|15|ESCREVER|\r\n";
            registroI075 += "|I075|16|INSS SOBRE FÉRIAS|\r\n";
            registroI075 += "|I075|17|ADT LUCRO V PARTICIPACÕES|\r\n";
            registroI075 += "|I075|18|ADT LUCRO - ELABORAÇÃO|\r\n";
            registroI075 += "|I075|19|RESGATE APLICAÇÃO|\r\n";
            registroI075 += "|I075|20|APLICAÇÃO FINANCEIRA|\r\n";
            registroI075 += "|I075|21|DESPESA BANCÁRIA|\r\n";
            registroI075 += "|I075|99999|Histórico Padrão|\r\n";
*/
            return registroI075;
        }

        function obtenerRegistroI100() {
            var numeroLineasI100 = 0, totalString = '';

            for( var departament in departmentJson) {
                totalString += '|I100|' + departmentJson[departament][1] + '|' + departmentJson[departament][2] + '|' + departmentJson[departament][3] + '|\r\n';
                numeroLineasI100++;
            }
            departmentJson['0'] = ['','','',''];

            registrosMostrados.push(["I100", numeroLineasI100]);
            numeroLineasBloqueI += numeroLineasI100;

            return totalString;
        }

        function obtenerSaldosPeriodicos() {
            var numeroLineasI150 = 0, numeroLineasI155 = 0;

            var totalString = "", debito, credito, saldoInicial, saldoFinal, monthStartDate, monthEndDate;
            for (var i = 0; i < 12; i++) {
                monthStartDate = new Date(periodYear, i, 1);
                monthEndDate = new Date(periodYear, i+1, 0);
                if (saldoPeriodosJson[i] !== undefined) {
                    totalString += "|I150|" + obtenerFormatoFecha(monthStartDate) + "|" + obtenerFormatoFecha(monthEndDate) + "|\r\n";
                    numeroLineasI150++;
                    for (var j = 0; j < saldoPeriodosJson[i].length; j++) {
                        log.error("saldoPeriodosJson[i][j][2]", saldoPeriodosJson[i][j][2]);
                        centroCosto = departmentJson[saldoPeriodosJson[i][j][2]][2];
                        saldoInicial = saldoPeriodosJson[i][j][3];
                        debito = saldoPeriodosJson[i][j][4];
                        credito = saldoPeriodosJson[i][j][5];

                        saldoFinal = Number((Number(saldoInicial) + Number(debito) - Number(credito)).toFixed(2));

                        totalString += "|I155|" + saldoPeriodosJson[i][j][1] + "|" + centroCosto + "|" + obtenerFormatoNumero(saldoInicial) + "|";

                        if (Number(saldoInicial) >= 0) {
                            totalString += "D|";
                        } else {
                            totalString += "C|";
                        }

                        totalString += obtenerFormatoNumero(debito) + "|" + obtenerFormatoNumero(credito) + "|" + obtenerFormatoNumero(saldoFinal) + "|";

                        if (saldoFinal >= 0) {
                            totalString += "D|\r\n";
                        } else {
                            totalString += "C|\r\n";
                        }
                        numeroLineasI155++;
                    }
                }
            }

            registrosMostrados.push(["I150", numeroLineasI150]);
            registrosMostrados.push(["I155", numeroLineasI155]);
            numeroLineasBloqueI += numeroLineasI150;
            numeroLineasBloqueI += numeroLineasI155;

            return totalString;
        }

        function obtenerRegistroI300I350() {
            var totalString = "|I350|" + obtenerPeriodoAjuste() + "|\r\n", amount;

            for (var i = 0; i < saldoPeriodosJson[12].length; i++) {
                amount = Number(saldoPeriodosJson[12][i][3]);

                totalString += "|I355|" + saldoPeriodosJson[12][i][1] + "|" + departmentJson[saldoPeriodosJson[12][i][2]][2] + "|" + obtenerFormatoNumero(amount) + "|";

                if (amount >= 0) {
                    totalString += "D|\r\n";
                } else {
                    totalString += "C|\r\n";
                }
            }
            return totalString;
        }

        function obtenerAsientoContable() {
            var numeroLineasI200 = 0, numeroLineasI250 = 0;
            var totalString = "", debito, credito, saldoInicial, saldoFinal;
            var transactionDetailString = "", valorTotal;


            for (var transactionId in transactionsJson) {
                transactionDetailString = "";
                valorTotal = 0;

                for (var i = 0; i < transactionsJson[transactionId].length; i++) {
                    debito = Number(transactionsJson[transactionId][i][2]);
                    credito = Number(transactionsJson[transactionId][i][3]);
                    valorTotal += debito;
                    transactionDetailString += "|I250|" + transactionsJson[transactionId][i][6] + "|" + departmentJson[transactionsJson[transactionId][i][7]][2] + "|" + obtenerFormatoNumero(debito - credito);

                    if (debito - credito >= 0) {
                        transactionDetailString += "|D|";
                    } else {
                        transactionDetailString += "|C|";
                    }
                    transactionDetailString += transactionsJson[transactionId][i][8] + "||" + (transactionId + " " + transactionsJson[transactionId][i][9]) + "||\r\n";
                    numeroLineasI250++;
                }

                totalString += "|I200|" + transactionId + "|" + transactionsJson[transactionId][0][1] + "|" + obtenerFormatoNumero(redondear(valorTotal)) + "|" + transactionsJson[transactionId][0][4] + "||\r\n";
                totalString += transactionDetailString;
                numeroLineasI200++;
            }

            numeroLineasBloqueI += numeroLineasI200;
            numeroLineasBloqueI += numeroLineasI250;
            registrosMostrados.push(['I200',numeroLineasI200]);
            registrosMostrados.push(['I250',numeroLineasI250]);

            return totalString;
        }

        function obtenerFormatoFecha(date) {
            return "" + completarCero(2,date.getDate()) + completarCero(2,date.getMonth() + 1) + date.getFullYear();
        }


        function obtenerRegistroI015(){
            var stringI015 = '', numeroLineasI015 = 0;

            for (var i = 0; i < planCuentasArray.length; i++) {
                if (planCuentasArray[i][3] == "A") {
                    stringI015 = '|I015|' + planCuentasArray[i][5] + '|\r\n';
                    numeroLineasI015++;
                }
            }

            numeroLineasBloqueI += numeroLineasI015;
            registrosMostrados.push(['I015',numeroLineasI015]);

            return stringI015;

        }

        function obtenerRegistroJ100J150(){
            var numeroLineasJ100 = 0, numeroLineasJ150 = 0;
            var arregloTemporalJ100;
            var arregloTemporalJ150;
            var totalString = "";

            for (var i in accountingGroupJson) {
                if (accountingGroupJson[i][5] == "01" || accountingGroupJson[i][5] == "02" || accountingGroupJson[i][5] == "03") {
                    arregloTemporalJ100 = [];

                    // 1. J100
                    arregloTemporalJ100[1] = "J100";

                    //2. Codigo de Aglutinamiento
                    arregloTemporalJ100[2] = accountingGroupJson[i][1];

                    //3. T = Totalizador ; D = Detalle
                    arregloTemporalJ100[3] = accountingGroupJson[i][2];

                    //4. Nivel de Codigo
                    arregloTemporalJ100[4] = accountingGroupJson[i][3];

                    //5. Codigo de Aglutinamiento superior
                    arregloTemporalJ100[5] = accountingGroupJson[i][4];

                    //6. A = Activo o P = Pasivo y Patrimonio
                    if (accountingGroupJson[i][5] == '01') {
                        arregloTemporalJ100[6] = 'A';
                    } else {
                        arregloTemporalJ100[6] = 'P';
                    }

                    // 7. Descripcion del codigo de Aglutinamiento
                    arregloTemporalJ100[7] = accountingGroupJson[i][6];

                    // 8. Valor Inicial
                    arregloTemporalJ100[8]= obtenerFormatoNumero(accountingGroupJson[i][7]);

                    // 9. D = Devedor o C = Credor
                    if (Number(accountingGroupJson[i][7]) < 0) {
                        arregloTemporalJ100[9] = 'C';
                    } else {
                        arregloTemporalJ100[9] = 'D';
                    }

                    // 10. Valor Final
                    arregloTemporalJ100[10]= obtenerFormatoNumero(accountingGroupJson[i][8]);

                    // 11. D = Devedor / C = Credor
                    if (Number(accountingGroupJson[i][8]) < 0) {
                        arregloTemporalJ100[11] = 'C';
                    } else {
                        arregloTemporalJ100[11] = 'D';
                    }

                    // 12. Vacio por el momento
                    arregloTemporalJ100[12] = '';

                    totalString += recorrerCampos(arregloTemporalJ100);
                    //arregloCampos.push(arregloTemporalJ100);
                    numeroLineasJ100++;
                } else {
                    arregloTemporalJ150 = [];

                    //1. J150
                    arregloTemporalJ150[1] = "J150";

                    //2. Numero de orden
                    arregloTemporalJ150[2] = completarCero(3,numeroLineasJ150);

                    //3. Codigo de Aglutinamiento
                    arregloTemporalJ150[3] = accountingGroupJson[i][1];

                    //4. T = Totalizador o D = Detalle
                    arregloTemporalJ150[4] = accountingGroupJson[i][2];

                    //5. Nivel de codigo
                    arregloTemporalJ150[5] = accountingGroupJson[i][3];

                    //6. Codigo de Aglutinamiento del superior
                    arregloTemporalJ150[6] = accountingGroupJson[i][4];

                    //7. Descripcion del codigo de Aglutinamiento
                    arregloTemporalJ150[7] = accountingGroupJson[i][6];

                    // 8. Valor del saldo final de la línea en el período inmediatamente anterior.(no va por ahora)
                    arregloTemporalJ150[8] = '';

                    // 9. D = Devedor o C = Credor ( no va por ahora)
                    arregloTemporalJ150[9] = '';

                    // 10. Valor Final antes de cierre de ejercicio
                    arregloTemporalJ150[10] = obtenerFormatoNumero(accountingGroupJson[i][9]);

                    // 11. D = Devedor o C = Credor
                    // 12. Indicador de Grupo DRE D = Reduccion o R = Ganancia, si es D= D o C = R
                    if (Number(accountingGroupJson[i][9]) < 0) {
                        arregloTemporalJ150[11] = 'C';
                        arregloTemporalJ150[12] = 'R';
                    } else {
                        arregloTemporalJ150[11] = 'D';
                        arregloTemporalJ150[12] = 'D';
                    }

                    // 13. Vacio por el momento
                    arregloTemporalJ150[13] = '';

                    totalString += recorrerCampos(arregloTemporalJ150);

                    numeroLineasJ150++;

                }
            }
            numeroLineasBloqueJ += numeroLineasJ100;
            numeroLineasBloqueJ += numeroLineasJ150;

            registrosMostrados.push(['J100',numeroLineasJ100]);
            registrosMostrados.push(['J150',numeroLineasJ150]);

            return totalString;

        }

        function obtenerRegistroJ930() {
            var searchEmployee = [], numeroLineasJ930 = 0, totalString = "";

            var employeesId = setupJson["legRepes"] + "," + setupJson["respEcd"];
            var employeesIdArray = employeesId.split(",");

            var savedSearch = search.create({
                type    : "employee",
                filters : [
                    ["internalid","anyof",employeesIdArray]
                ],
                columns : [
                    "firstname",
                    "lastname",
                    "custentity_lmry_sv_taxpayer_number",
                    "custentity_lmry_br_category",
                    "custentity_lmry_br_category.custrecord_lmry_br_code_category",
                    "custentity_lmry_br_crc",
                    "email",
                    "phone",
                    "custentity_lmry_br_certificate_number",
                    "custentity_lmry_br_validate_date",
                    "internalid"
                ]
            })

            var objResult = savedSearch.run().getRange(0,1000);
            var columns, auxArray;
            if (objResult != null && objResult.length != 0) {
                numeroLineasJ930 = objResult.length;
                for (var i = 0 ; i < numeroLineasJ930; i++) {
                    columns = objResult[i].columns;
                    auxArray = [];

                    // 1. J930
                    auxArray[1] = "J930";

                    // 2. Nombre
                    auxArray[2] = objResult[i].getValue(columns[0]) + ' ' + objResult[i].getValue(columns[1]);

                    // 3. CNPJ(14) o CPF(11)
                    auxArray[3] = retornaNumero(objResult[i].getValue(columns[2]),2);

                    // 4. Categoria (contador) (6 al 9 / 10 y 11 obligatorios si es contador 900)
                    auxArray[4] = objResult[i].getText(columns[3]);

                    // 5. Id categoria (900) (6, 9, 10 y 11 no se completan si es Persona Juridica 001)
                    auxArray[5] = objResult[i].getValue(columns[4]);

                    // 6. Concejo Regional de Contabilidad (CRC)
                    if (objResult[i].getValue(columns[5]) != null && objResult[i].getValue(columns[5]) != 'None' && objResult[i].getValue(columns[5]) != '' && objResult[i].getValue(columns[4]) != '001') {
                        auxArray[6] = objResult[i].getValue(columns[5]);
                    } else {
                        auxArray[6] = '';
                    }

                    // 7. EMAIL
                    if (objResult[i].getValue(columns[6]) != null && objResult[i].getValue(columns[6]) != 'None' && objResult[i].getValue(columns[6]) != '' ) {
                        auxArray[7] = objResult[i].getValue(columns[6]);
                    } else {
                        auxArray[7] = '';
                    }

                    // 8. Telefono
                    if (objResult[i].getValue(columns[7]) != null && objResult[i].getValue(columns[7]) != 'None' && objResult[i].getValue(columns[7]) != '' ) {
                        auxArray[8] = objResult[i].getValue(columns[7]).replace(/( |\)|\(|-)/g,"").substr(0,12);
                    } else {
                        auxArray[8] = '';
                    }

                    if (objResult[i].getValue(columns[8]) != null && objResult[i].getValue(columns[8]) != 'None' && objResult[i].getValue(columns[8]) != '' && objResult[i].getValue(columns[4]) !='001') {
                        // 9. UF del CRC (existe en Tabela de Unidades da Federação: AM, RJ)
                        auxArray[9] = objResult[i].getValue(columns[8]).substring(0,2);

                        // 10. (UF/YEAR/NUMERO) -- Habra un nuevo campo para el numero, de donde saca la fecha
                        auxArray[10] = objResult[i].getValue(columns[8]);
                    } else {
                        auxArray[9] = '';
                        auxArray[10] = '';
                    }

                    // 11. (DDMMAAAA) -- Habra un nuevo campo para el numero, de donde saca la fecha .... validar los null en ese campo
                    if (objResult[i].getValue(columns[9])!= null && objResult[i].getValue(columns[9]) != 'None' && objResult[i].getValue(columns[9])!= '' && objResult[i].getValue(columns[4])!='001') {
                        var auxFecha = format.parse({
                            type  : format.Type.DATE,
                            value : objResult[i].getValue(columns[9])
                        });
                        auxArray[11] = obtenerFormatoFecha(auxFecha);
                    } else {
                        auxArray[11] = '';
                    }

                    //12 S si es diferente a a 900 Legal escogido por el declarante
                    if (objResult[i].getValue(columns[10]) == setupJson["legRepes"]) {
                        auxArray[12] = 'S';
                    } else {
                        auxArray[12] = 'N';
                    }

                    totalString += recorrerCampos(auxArray);
                }
            }

            numeroLineasBloqueJ += numeroLineasJ930;
            registrosMostrados.push(['J930',numeroLineasJ930]);

            return totalString;
        }

        function recorrerCampos(arreglo) {
            if (arreglo != null && arreglo.length != 0) {
                var string = '|';
                for (var i = 1; i < arreglo.length; i++) {
                    string += arreglo[i] + '|';
                }
                string += '\r\n';
                return string;
            }
            return '';
        }

        function obtenerFormatoNumero(numero) {
            return ("" + numero).replace("-","").replace(".",",");
        }

        function NoData(hayError) {

            if (hayError) {
                var message = "Ocurrio un error inesperado en la ejecucion del reporte.";
            } else {
                var message = "No existe informacion para los criterios seleccionados.";
            }

            var logRecord = record.load({
                type : 'customrecord_lmry_br_rpt_generator_log',
                id   : paramLogId
            });

            //Nombre de Archivo
            logRecord.setValue({
                fieldId : 'custrecord_lmry_br_rg_name_field',
                value   : message
            });

            var logRecordId = logRecord.save();
        }

        function redondear(number){
            return Math.round(Number(number) * 100) / 100;
        }

        return {
            execute : execute
        };
    }
)
