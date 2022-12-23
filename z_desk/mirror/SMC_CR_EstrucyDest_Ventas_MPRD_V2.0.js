/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                    ||
||                                                             ||
||  File Name: LMRY_CR_EstrucyDest_Ventas_MPRD_V2.0.js         ||
||                                                             ||
||  Version Date         Author        Remarks                 ||
||  2.0     Jul 23 2022   Eduardo M.        Use Script 2.0     ||
\= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/search', 'N/log', 'N/file', 'N/runtime', 'N/record', 'N/config', 'N/encode', 'N/format', 'N/query'],

    function (search, log, fileModulo, runtime, recordModulo, config, encode, format, query) {

        //Variables Globales

        var LMRY_Script = 'LMRY_CR_EstrucyDest_Ventas_MPRD_V2.0.js';
        var objContext = runtime.getCurrentScript();

        //Language
        var language = runtime.getCurrentScript().getParameter({
            name: 'LANGUAGE'
        }).substring(0, 2);

        if (language != "en" && language != "es") {
            language = "es";
        }

        //Parametros

        var paramSubsi = '';
        var paramPeri = '';
        var paramMulti = '';
        var paramLog = '';

        //Features

        var featSubsi = '';
        var featMulti = '';

        //Variables
        var companyName = '';
        var companyRuc = '';
        var periodCont = '';
        var periodstartdate = '';
        var periodenddate = '';
        var multibookName = '';
        var libraryRPT = '';

        //Arrays
        var arrayDatosT3 = [];
        var arrayMontLS = ['0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00'];
        var arrayBaseUnits = { get: function (key) { return this.data[key] }, set: function (key, value) { this.data[key] = value }, data: {} };


        function getInputData() {
            try {
                getLibraryRPT();
                ObtenerParametrosYFeatures();
                getBaseUnits();
                log.debug('el array base units es: ', arrayBaseUnits);

                var estrucDestVentas = obtenerVentasxEstrucDest();
                log.debug('El array datosTable1 es: ', estrucDestVentas);
                log.debug('El tamaño del array datosTable1 es: ', estrucDestVentas.length);

                if (estrucDestVentas.length != 0) {
                    return estrucDestVentas;
                } else {
                    log.debug("message","no data");
                    //noData('1');
                    return null;
                }
            } catch (error) {
                log.error('Error de getInputData', error);
                //noData('2');
                //libraryRPT.sendErrorEmail(error, LMRY_Script, language);
                return [{
                    "isError": "T",
                    "error": error
                }];
            }
        }

        function map(context) {
            try {
                var arrayTemp = JSON.parse(context.value);
                log.debug('El arrayTempMap es: ', arrayTemp);
                var columna0 = arrayTemp[0];
                var columna1 = arrayTemp[1];
                var columna2 = arrayTemp[2];
                var columna3 = 0;
                var columna4 = 0;
                var columna5 = 0;
                var columna6 = 0;
                var columna7 = 0;
                var columna8 = 0;

                if (arrayTemp[5] == 1) {
                    columna3 = Number(arrayTemp[3]);
                    columna4 = Number(arrayTemp[4]);
                } else if (arrayTemp[5] == 2) {
                    columna5 = Number(arrayTemp[3]);
                    columna6 = Number(arrayTemp[4]);
                } else if (arrayTemp[5] == 3) {
                    columna7 = Number(arrayTemp[3]);
                    columna8 = Number(arrayTemp[4]);
                }

                var keymap = columna0 + '|' + columna1 + '|' + columna2;

                log.debug('keymap', keymap);

                var vector_transaction = '';

                vector_transaction = columna0 + '|' + columna1 + '|' + columna2 + '|' + columna3 + '|' + columna4 + '|' + columna5 + '|' + columna6 + '|'
                    + columna7 + '|' + columna8;

                log.debug('vector_transaction', vector_transaction);

                if (arrayTemp[5] == 1 || arrayTemp[5] == 2 || arrayTemp[5] == 3) {
                    context.write({
                        key: keymap,
                        value: {
                            stringTransaction: vector_transaction
                        }
                    });
                }

            } catch (error) {
                //getLibraryRPT();
                log.error('Error de Map', error);
                //noData('2');
                //libraryRPT.sendErrorEmail(error, LMRY_Script, language);
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
                var vectorMap = [];
                var columns3 = 0;
                var columns4 = 0;
                var columns5 = 0;
                var columns6 = 0;
                var columns7 = 0;
                var columns8 = 0;
                var columns9 = 0;
                var columns10 = 0;

                var arrayReduce = [];
                vectorMap = context.values;

                for (var j = 0; j < vectorMap.length; j++) {
                    var obj = JSON.parse(vectorMap[j]);
                    if (obj["isError"] == "T") {
                        context.write({
                            key: context.key,
                            value: obj
                        });
                        return;
                    }
                    arrayReduce = obj["stringTransaction"].split('|');
                    columns3 = columns3 + Number(arrayReduce[3]);
                    columns4 = columns4 + Number(arrayReduce[4]);
                    columns5 = columns5 + Number(arrayReduce[5]);
                    columns6 = columns6 + Number(arrayReduce[6]);
                    columns7 = columns7 + Number(arrayReduce[7]);
                    columns8 = columns8 + Number(arrayReduce[8]);
                }

                columns9 = Number(columns3) + Number(columns5) + Number(columns7);
                columns10 = Number(columns4) + Number(columns6) + Number(columns8);

                var vector_reduce = [];
                vector_reduce = [arrayReduce[0], arrayReduce[1], arrayReduce[2], columns3, columns4, columns5, columns6, columns7, columns8, columns9, columns10];
                var vector_str = vector_reduce.join('|');
                log.debug('vector_str', vector_str);
                log.debug('vector_reduce', vector_reduce);

                if (vector_reduce.length != 0) {
                    context.write({
                        key: 1,
                        value: {
                            stringTransaction: vector_str
                        }
                    });
                }

            } catch (error) {
                //getLibraryRPT();
                log.error('Error de Reduce', error);
                //noData('2');
                //libraryRPT.sendErrorEmail(error, LMRY_Script, language);
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
                var errores = [];
                getLibraryRPT();
                ObtenerParametrosYFeatures();
                obtenerDatosCabecera();
                obtenerVentasLocalesM();
                log.debug('El array DT3 es:', arrayDatosT3);
                log.debug('El array MonthLS es:', arrayMontLS);
                log.debug('El tamaño del array MonthLS es:', arrayMontLS.length);
                var arrayFinal = [];
                context.output.iterator().each(function (key, value) {
                    var obj = JSON.parse(value);
                    if (obj["isError"] == "T") {
                        errores.push(JSON.stringify(obj["error"]));
                    } else {
                        var contenido = obj.stringTransaction;

                        arrayFinal.push(contenido);
                    }
                    return true;
                });

                log.debug('El arrayFinal es: ', arrayFinal);

                if (arrayFinal.length != 0) {
                    generateExcel(arrayFinal);
                }

            } catch (error) {
                log.error('Error de Summarize', error);
                //noData('2');
                //libraryRPT.sendErrorEmail(error, LMRY_Script, language);
            }
        }

        function ObtenerParametrosYFeatures() {
            //Parametros
            var objContext = runtime.getCurrentScript();

            paramSubsi = '127';

            paramPeri = '2022';

            paramMulti = '11';

            paramLog = '37';

            log.debug('Parametros', paramSubsi + ', ' + paramPeri + ', ' + paramMulti + ', ' + paramLog);

            //Features
            featSubsi = runtime.isFeatureInEffect({
                feature: "SUBSIDIARIES"
            });
            featMulti = runtime.isFeatureInEffect({
                feature: "MULTIBOOK"
            });

            if (paramPeri) {
                periodstartdate = new Date(paramPeri, 0, 01);
                periodenddate = new Date(paramPeri, 11, 31);
                //Obtener Period Start Date
                periodstartdate = format.format({
                    value: periodstartdate,
                    type: format.Type.DATE
                });
                //Obtener Period End Date
                periodenddate = format.format({
                    value: periodenddate,
                    type: format.Type.DATE
                });
            }

            //Obtener MultiBook Name
            if (featMulti) {
                var multibookName_temp = search.lookupFields({
                    type: search.Type.ACCOUNTING_BOOK,
                    id: paramMulti,
                    columns: ['name']
                });
                multibookName = multibookName_temp.name;
            }
        }

        function generarTable1(arrayDatosT1) {
            var globalLabels = getGlobalLabels();
            var table1_lbls = globalLabels.table1[language].split('|');
            //Posiciones de los montos a sumar
            var arrayPos = [4, 6, 8, 10];
            //Obtener los montos totales verticales
            var totalAmountsV = obtenerSumasTotalesT1(arrayDatosT1, arrayPos);

            var strXLS = '';
            strXLS += '<Row ss:Index="8">';
            strXLS += '<Cell/>';
            strXLS += '<Cell ss:MergeAcross="0" ss:MergeDown="1" ss:StyleID="s20" ><Data ss:Type="String">' + table1_lbls[1] + '</Data></Cell>';
            strXLS += '<Cell ss:MergeAcross="0" ss:MergeDown="1" ss:StyleID="s20" ><Data ss:Type="String">' + table1_lbls[2] + '</Data></Cell>';
            strXLS += '<Cell ss:MergeAcross="0" ss:MergeDown="1" ss:StyleID="s20" ><Data ss:Type="String">' + table1_lbls[3] + '</Data></Cell>';
            strXLS += '<Cell ss:MergeAcross="1" ss:MergeDown="0" ss:StyleID="s20" ><Data ss:Type="String">' + table1_lbls[4] + '</Data></Cell>';
            strXLS += '<Cell ss:MergeAcross="1" ss:MergeDown="0" ss:StyleID="s20" ><Data ss:Type="String">' + table1_lbls[5] + '</Data></Cell>';
            strXLS += '<Cell ss:MergeAcross="1" ss:MergeDown="0" ss:StyleID="s20" ><Data ss:Type="String">' + table1_lbls[6] + '</Data></Cell>';
            strXLS += '<Cell ss:MergeAcross="1" ss:MergeDown="0" ss:StyleID="s20" ><Data ss:Type="String">' + table1_lbls[7] + '</Data></Cell>';
            strXLS += '</Row>';
            strXLS += '<Row>';
            strXLS += '<Cell ss:Index="5" ss:StyleID="s20" ><Data ss:Type="String">' + table1_lbls[8] + '</Data></Cell>';
            strXLS += '<Cell ss:StyleID="s20" ><Data ss:Type="String">' + table1_lbls[9] + '</Data></Cell>';
            strXLS += '<Cell ss:StyleID="s20" ><Data ss:Type="String">' + table1_lbls[8] + '</Data></Cell>';
            strXLS += '<Cell ss:StyleID="s20" ><Data ss:Type="String">' + table1_lbls[9] + '</Data></Cell>';
            strXLS += '<Cell ss:StyleID="s20" ><Data ss:Type="String">' + table1_lbls[8] + '</Data></Cell>';
            strXLS += '<Cell ss:StyleID="s20" ><Data ss:Type="String">' + table1_lbls[9] + '</Data></Cell>';
            strXLS += '<Cell ss:StyleID="s20" ><Data ss:Type="String">' + table1_lbls[8] + '</Data></Cell>';
            strXLS += '<Cell ss:StyleID="s20" ><Data ss:Type="String">' + table1_lbls[9] + '</Data></Cell>';
            strXLS += '</Row>';

            for (i = 0; i < arrayDatosT1.length; i++) {
                var arrayTemp = arrayDatosT1[i].split('|');
                strXLS += '<Row>';
                strXLS += '<Cell/>';
                strXLS += '<Cell ss:StyleID="s25" ><Data ss:Type="String">' + arrayTemp[0] + '</Data></Cell>';
                strXLS += '<Cell ss:StyleID="s25" ><Data ss:Type="String">' + arrayTemp[1] + '</Data></Cell>';
                strXLS += '<Cell ss:StyleID="s25" ><Data ss:Type="String">' + arrayTemp[2] + '</Data></Cell>';
                strXLS += '<Cell ss:StyleID="s21" ><Data ss:Type="Number">' + arrayTemp[3] + '</Data></Cell>';
                strXLS += '<Cell ss:StyleID="s21" ><Data ss:Type="Number">' + arrayTemp[4] + '</Data></Cell>';
                strXLS += '<Cell ss:StyleID="s21" ><Data ss:Type="Number">' + arrayTemp[5] + '</Data></Cell>';
                strXLS += '<Cell ss:StyleID="s21" ><Data ss:Type="Number">' + arrayTemp[6] + '</Data></Cell>';
                strXLS += '<Cell ss:StyleID="s21" ><Data ss:Type="Number">' + arrayTemp[7] + '</Data></Cell>';
                strXLS += '<Cell ss:StyleID="s21" ><Data ss:Type="Number">' + arrayTemp[8] + '</Data></Cell>';
                strXLS += '<Cell ss:StyleID="s21" ><Data ss:Type="Number">' + arrayTemp[9] + '</Data></Cell>';
                strXLS += '<Cell ss:StyleID="s21" ><Data ss:Type="Number">' + arrayTemp[10] + '</Data></Cell>';
                strXLS += '</Row>';
            }

            strXLS += '<Row>';
            strXLS += '<Cell/>';
            strXLS += '<Cell ss:StyleID="s20" ><Data ss:Type="String">' + table1_lbls[10] + '</Data></Cell>';
            strXLS += '<Cell ss:StyleID="s25" ><Data ss:Type="String"></Data></Cell>';
            strXLS += '<Cell ss:StyleID="s25" ><Data ss:Type="String"></Data></Cell>';
            strXLS += '<Cell ss:StyleID="s25" ><Data ss:Type="String"></Data></Cell>';
            strXLS += '<Cell ss:StyleID="s24" ><Data ss:Type="Number">' + totalAmountsV[0] + '</Data></Cell>';
            strXLS += '<Cell ss:StyleID="s25" ><Data ss:Type="String"></Data></Cell>';
            strXLS += '<Cell ss:StyleID="s24" ><Data ss:Type="Number">' + totalAmountsV[1] + '</Data></Cell>';
            strXLS += '<Cell ss:StyleID="s25" ><Data ss:Type="String"></Data></Cell>';
            strXLS += '<Cell ss:StyleID="s24" ><Data ss:Type="Number">' + totalAmountsV[2] + '</Data></Cell>';
            strXLS += '<Cell ss:StyleID="s25" ><Data ss:Type="String"></Data></Cell>';
            strXLS += '<Cell ss:StyleID="s24" ><Data ss:Type="Number">' + totalAmountsV[3] + '</Data></Cell>';
            strXLS += '</Row>';

            return strXLS;
        }

        function generarTable3() {
            var globalLabels = getGlobalLabels();
            var table3_lbls = globalLabels.table3[language].split('|');
            var strXLS = '';
            strXLS += '<Row/>';
            strXLS += '<Row/>';
            strXLS += '<Row>';
            strXLS += '<Cell/>';
            strXLS += '<Cell>';
            strXLS += '</Cell>';
            strXLS += '<Cell ss:MergeAcross="1" ss:MergeDown="1" ss:StyleID="s20" ><Data ss:Type="String">' + table3_lbls[1] + '</Data></Cell>';
            strXLS += '<Cell ss:MergeAcross="0" ss:MergeDown="1" ss:StyleID="s20" ><Data ss:Type="String">' + table3_lbls[2] + '</Data></Cell>';
            strXLS += '</Row>';
            strXLS += '<Row/>';
            for (i = 0; i < 12; i++) {
                strXLS += '<Row>';
                strXLS += '<Cell>';
                strXLS += '</Cell>';
                strXLS += '<Cell/>';
                strXLS += '<Cell ss:MergeAcross="1" ss:StyleID="s25" ><Data ss:Type="String">' + table3_lbls[i + 3] + '</Data></Cell>';
                strXLS += '<Cell ss:MergeAcross="0" ss:StyleID="s21" ><Data ss:Type="Number">' + arrayMontLS[i] + '</Data></Cell>';
                strXLS += '</Row>';
            }
            strXLS += '<Row>';
            strXLS += '<Cell>';
            strXLS += '</Cell>';
            strXLS += '<Cell/>';
            strXLS += '<Cell ss:MergeAcross="1" ss:MergeDown="1" ss:StyleID="s20" ><Data ss:Type="String">' + table3_lbls[15] + '</Data></Cell>';
            strXLS += '<Cell ss:MergeAcross="0" ss:MergeDown="1" ss:StyleID="s24" ><Data ss:Type="Number">' + SumarElementosArray(arrayMontLS) + '</Data></Cell>';
            strXLS += '</Row>';

            return strXLS;
        }

        function generarTable2() {
            var globalLabels = getGlobalLabels();
            var table2_lbls = globalLabels.table2[language].split('|');
            var datosT2 = obtenerVentasEmpresasZF();
            var TotalZF = 0.00;
            var TotalTM = getTotalThirdMarketsSales();

            var strXLS = '';
            strXLS += '<Row/>';
            strXLS += '<Row/>';
            strXLS += '<Row>';
            strXLS += '<Cell/>';
            strXLS += '<Cell>';
            strXLS += '</Cell>';
            strXLS += '<Cell ss:MergeAcross="1" ss:MergeDown="1" ss:StyleID="s20" ><Data ss:Type="String">' + table2_lbls[1] + '</Data></Cell>';
            strXLS += '<Cell ss:MergeAcross="0" ss:MergeDown="1" ss:StyleID="s20" ><Data ss:Type="String">' + table2_lbls[2] + '</Data></Cell>';
            strXLS += '</Row>';
            strXLS += '<Row/>';

            if (datosT2.length != 0) {
                for (i = 0; i < datosT2.length; i++) {
                    TotalZF += Number(datosT2[i][1]);

                    strXLS += '<Row>';
                    strXLS += '<Cell>';
                    strXLS += '</Cell>';
                    strXLS += '<Cell/>';
                    strXLS += '<Cell ss:MergeAcross="1" ss:StyleID="s25" ><Data ss:Type="String">' + datosT2[i][0] + '</Data></Cell>';
                    strXLS += '<Cell ss:MergeAcross="0" ss:StyleID="s21" ><Data ss:Type="Number">' + datosT2[i][1] + '</Data></Cell>';
                    strXLS += '</Row>';
                }
            }

            var TotalOM = Number(TotalZF) + Number(TotalTM);
            var PercentageZF = ((Number(TotalZF) / Number(TotalOM)) * 100).toFixed(2) + '%';

            strXLS += '<Row>';
            strXLS += '<Cell>';
            strXLS += '</Cell>';
            strXLS += '<Cell/>';
            strXLS += '<Cell ss:MergeAcross="1" ss:StyleID="s26" ><Data ss:Type="String">' + table2_lbls[3] + '</Data></Cell>';
            strXLS += '<Cell ss:MergeAcross="0" ss:StyleID="s24" ><Data ss:Type="Number">' + TotalZF.toFixed(2) + '</Data></Cell>';
            strXLS += '</Row>';

            strXLS += '<Row>';
            strXLS += '<Cell>';
            strXLS += '</Cell>';
            strXLS += '<Cell/>';
            strXLS += '<Cell ss:MergeAcross="1" ss:StyleID="s26" ><Data ss:Type="String">' + table2_lbls[4] + '</Data></Cell>';
            strXLS += '<Cell ss:MergeAcross="0" ss:StyleID="s24" ><Data ss:Type="Number">' + TotalTM + '</Data></Cell>';
            strXLS += '</Row>';

            strXLS += '<Row>';
            strXLS += '<Cell>';
            strXLS += '</Cell>';
            strXLS += '<Cell/>';
            strXLS += '<Cell ss:MergeAcross="1" ss:StyleID="s26" ><Data ss:Type="String">' + table2_lbls[5] + '</Data></Cell>';
            strXLS += '<Cell ss:MergeAcross="0" ss:StyleID="s24" ><Data ss:Type="Number">' + TotalOM.toFixed(2) + '</Data></Cell>';
            strXLS += '</Row>';

            strXLS += '<Row>';
            strXLS += '<Cell>';
            strXLS += '</Cell>';
            strXLS += '<Cell/>';
            strXLS += '<Cell ss:MergeAcross="1" ss:StyleID="s26" ><Data ss:Type="String">' + table2_lbls[6] + '</Data></Cell>';
            strXLS += '<Cell ss:MergeAcross="0" ss:StyleID="s24" ><Data ss:Type="String">' + PercentageZF + '</Data></Cell>';
            strXLS += '</Row>';

            return strXLS;
        }

        function SaveFile(strFile) {
            var folderId = objContext.getParameter({
                name: 'custscript_lmry_file_cabinet_rg_cr'
            });

            if (folderId != '' && folderId != null) {
                var fileName = 'SMC_'+getNameFile();
                var fileRPT;
                var fileXLS;

                fileRPT = fileModulo.create({
                    name: fileName,
                    fileType: fileModulo.Type.EXCEL,
                    contents: strFile,
                    folder: folderId
                });

                var fileId = fileRPT.save();

                fileXLS = fileModulo.load({
                    id: fileId
                });

                var getURL = objContext.getParameter({ name: 'custscript_lmry_netsuite_location' });
                var fileUrl = '';

                if (getURL != '') {
                    fileUrl += 'https://' + getURL;
                }
                fileUrl += fileXLS.url;

                log.debug('URL Excel Descargar', fileUrl);

                // var record = recordModulo.load({
                //     type: 'customrecord_lmry_cr_rpt_generator_log',
                //     id: paramLog
                // });

                // //Nombre de Archivo
                // record.setValue({
                //     fieldId: 'custrecord_lmry_cr_file_name',
                //     value: fileName
                // });

                // //Url de Archivo
                // record.setValue({
                //     fieldId: 'custrecord_lmry_cr_url_file',
                //     value: fileUrl
                // });

                // //Nombre de Subsidiaria
                // record.setValue({
                //     fieldId: 'custrecord_lmry_cr_subsidiary',
                //     value: companyName
                // });

                // //Periodo
                // record.setValue({
                //     fieldId: 'custrecord_lmry_cr_period',
                //     value: periodCont
                // });

                // //Multibook
                // if (featMulti || featMulti == 'T') {
                //     record.setValue({
                //         fieldId: 'custrecord_lmry_cr_multibooking',
                //         value: multibookName
                //     });
                // }

                // var recordId = record.save();

                log.debug('los datos del save file son: ', fileName + '---' + companyName + '---' + periodCont + '---' + multibookName);

            } else {
                log.error({
                    title: 'Creacion de File:',
                    details: 'No existe el folder'
                });
            }
        }

        function obtenerDatosCabecera() {
            var configpage = config.load({
                type: config.Type.COMPANY_INFORMATION
            });
            if (featSubsi) {
                var datosSubsidiary = ObtainDatosSubsidiaria(paramSubsi);
                companyName = datosSubsidiary[0];
                companyRuc = datosSubsidiary[1].replace(' ', '');

            } else {
                companyName = configpage.getValue('legalname');
                companyRuc = configpage.getValue('employerid');
            }
            //periodCont = periodstartdate.substr(6, 10);
            periodCont = paramPeri;
        }

        function ObtainDatosSubsidiaria(subsidiary) {
            try {
                var datosSubsi = [];
                if (subsidiary != '' && subsidiary != null) {
                    var subsiDatos = search.lookupFields({
                        type: search.Type.SUBSIDIARY,
                        id: subsidiary,
                        columns: ['legalname', 'taxidnum']
                    });

                    datosSubsi[0] = subsiDatos.legalname;
                    datosSubsi[1] = subsiDatos.taxidnum;

                    return datosSubsi;
                }
            } catch (error) {
                log.error('Error al obtener info de la Subsidiaria');
            }
            return '';
        }

        function obtenerVentasLocalesM() {
            var ventasLocalesM = search.create({
                type: "transaction",
                filters:
                    [
                        ["voided", "is", "F"],
                        "AND",
                        ["cogs", "is", "F"],
                        "AND",
                        ["taxline", "is", "F"],
                        "AND",
                        ["shipping", "is", "F"],
                        "AND",
                        ["type", "anyof", "CustCred", "CustInvc"],
                        "AND",
                        ["mainline", "is", "F"],
                        "AND",
                        ["formulatext: CASE WHEN {customer.custentity_lmry_country}='Costa Rica' THEN 1 ELSE 0 END", "is", "1"],
                        "AND",
                        ["formulatext: CASE WHEN {customer.custentity_lmry_emp_reg_zonas_francas}='F' THEN 1 ELSE 0 END", "is", "1"]
                    ],
                settings: [],
                columns:
                    [
                        search.createColumn({
                            name: "formuladate",
                            summary: "GROUP",
                            function: "month",
                            formula: "{trandate}",
                            sort: search.Sort.ASC,
                            label: "Formula (Date)"
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            summary: "SUM",
                            formula: "CASE WHEN NVL({taxitem.rate},0)=0 THEN {amount} ELSE ((1+({taxitem.rate}/100))*{amount}) END",
                            label: "Formula (Currency)"
                        })
                    ]
            });

            //Filtro Subsidiaria y Configuracion Consolidation Type
            if (featSubsi) {
                var subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: [paramSubsi]
                });
                ventasLocalesM.filters.push(subsidiaryFilter);

                var confiConsolidationType = search.createSetting({
                    name: 'consolidationtype',
                    value: 'NONE'
                });
                ventasLocalesM.settings.push(confiConsolidationType);
            }
            //Filtro Periodo
            var periodFilterStart = search.createFilter({
                name: 'startdate',
                join: 'accountingperiod',
                operator: search.Operator.ONORAFTER,
                values: [periodstartdate]
            });
            ventasLocalesM.filters.push(periodFilterStart);

            var periodFilterEnd = search.createFilter({
                name: 'enddate',
                join: 'accountingperiod',
                operator: search.Operator.ONORBEFORE,
                values: [periodenddate]
            });
            ventasLocalesM.filters.push(periodFilterEnd);

            // Filtro de Multibook
            if (featMulti) {
                var multibookFilter = search.createFilter({
                    name: 'accountingbook',
                    join: 'accountingtransaction',
                    operator: search.Operator.IS,
                    values: [paramMulti]
                });
                ventasLocalesM.filters.push(multibookFilter);

                var bookExchangeRateColumn = search.createColumn({
                    name: 'formulacurrency',
                    summary: 'SUM',
                    formula: 'CASE WHEN NVL({taxitem.rate},0)=0 THEN {accountingtransaction.amount} ELSE ((1+({taxitem.rate}/100))*{accountingtransaction.amount}) END'
                });
                ventasLocalesM.columns.push(bookExchangeRateColumn);
            }

            var pagedData = ventasLocalesM.runPaged({
                pageSize: 20
            });

            var page, columns;

            pagedData.pageRanges.forEach(function (pageRange) {
                page = pagedData.fetch({
                    index: pageRange.index
                });

                page.data.forEach(function (result) {
                    columns = result.columns;
                    if (featMulti) {
                        var auxAmount = Number(result.getValue(columns[2])).toFixed(2);
                    } else {
                        var auxAmount = Number(result.getValue(columns[1])).toFixed(2);
                    }
                    var arrayTemp = [];


                    // 00. Mes
                    var columna0 = result.getValue(columns[0]);
                    var monthTemp = Number(columna0.substr(5, 7));
                    if (monthTemp == 10 || monthTemp == 11 || monthTemp == 12) {
                        var monthPos = Number(columna0.substr(5, 7));
                    } else {
                        var monthPos = Number(columna0.substr(6, 7));
                    }
                    // 01. Amount Total Ventas Locales por Mes
                    var columna1 = auxAmount;

                    arrayMontLS[monthPos - 1] = auxAmount;

                    arrayTemp = [columna0, columna1];

                    arrayDatosT3.push(arrayTemp);

                });
            });
        }

        function obtenerVentasEmpresasZF() {
            var ventasEmpresasZF = search.create({
                type: "transaction",
                filters:
                [
                   ["voided","is","F"], 
                   "AND", 
                   ["memorized","is","F"], 
                   "AND", 
                   ["posting","is","T"], 
                   "AND", 
                   ["cogs","is","F"], 
                   "AND", 
                   ["taxline","is","F"], 
                   "AND", 
                   ["shipping","is","F"], 
                   "AND", 
                   ["type","anyof","CustCred","CustInvc"], 
                   "AND", 
                   ["mainline","is","F"], 
                   "AND", 
                   ["formulatext: CASE WHEN {customer.custentity_lmry_emp_reg_zonas_francas}='T' THEN 1 ELSE 0 END","is","1"]
                ],
                columns:
                [
                   search.createColumn({
                      name: "formulatext",
                      summary: "GROUP",
                      formula: "CASE WHEN {customer.isperson}='T' THEN {customer.altname} ELSE {customer.companyname} END",
                      sort: search.Sort.ASC,
                      label: "Formula (Text)"
                   }),
                   search.createColumn({
                      name: "formulacurrency",
                      summary: "SUM",
                      formula: "CASE WHEN NVL({taxitem.rate},0)=0 THEN {amount} ELSE ((1+({taxitem.rate}/100))*{amount}) END",
                      label: "Formula (Currency)"
                   })
                ]
             });

            //Filtro Subsidiaria
            if (featSubsi) {
                var subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: [paramSubsi]
                });
                ventasEmpresasZF.filters.push(subsidiaryFilter);
            }
            //Filtro Periodo
            var periodFilterStart = search.createFilter({
                name: 'startdate',
                join: 'accountingperiod',
                operator: search.Operator.ONORAFTER,
                values: [periodstartdate]
            });
            ventasEmpresasZF.filters.push(periodFilterStart);

            var periodFilterEnd = search.createFilter({
                name: 'enddate',
                join: 'accountingperiod',
                operator: search.Operator.ONORBEFORE,
                values: [periodenddate]
            });
            ventasEmpresasZF.filters.push(periodFilterEnd);

            // Filtro de Multibook
            if (featMulti) {
                var multibookFilter = search.createFilter({
                    name: 'accountingbook',
                    join: 'accountingtransaction',
                    operator: search.Operator.IS,
                    values: [paramMulti]
                });
                ventasEmpresasZF.filters.push(multibookFilter);

                var bookExchangeRateColumn = search.createColumn({
                    name: 'formulacurrency',
                    summary: 'SUM',
                    formula: 'CASE WHEN NVL({taxitem.rate},0)=0 THEN {accountingtransaction.amount} ELSE ((1+({taxitem.rate}/100))*{accountingtransaction.amount}) END'
                });
                ventasEmpresasZF.columns.push(bookExchangeRateColumn);
            }

            var arrayDatosT2 = []

            var pagedData = ventasEmpresasZF.runPaged({
                pageSize: 1000
            });

            var page, columns;

            pagedData.pageRanges.forEach(function (pageRange) {
                page = pagedData.fetch({
                    index: pageRange.index
                });

                page.data.forEach(function (result) {
                    columns = result.columns;
                    if (featMulti) {
                        var auxAmount = Number(result.getValue(columns[2])).toFixed(2);
                    } else {
                        var auxAmount = Number(result.getValue(columns[1])).toFixed(2);
                    }
                    var arrayTemp = [];


                    // 00. Company Name
                    var columna0 = ValidarAcentos(result.getValue(columns[0]));
                    // 01. Amount Total ZF Companies
                    var columna1 = auxAmount;

                    arrayTemp = [columna0, columna1];

                    arrayDatosT2.push(arrayTemp);

                });
            });

            log.debug('El arrayDatosT2 es: ', arrayDatosT2);
            return arrayDatosT2;
        }

        function obtenerVentasxEstrucDest() {
            var estrucDestVentas = search.load({
                id: 'customsearch_lmry_cr_esdest_s1'
            });

            //Filtro Subsidiaria
            if (featSubsi) {
                var subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: [paramSubsi]
                });
                estrucDestVentas.filters.push(subsidiaryFilter);
            }
            //Filtro Periodo
            var periodFilterStart = search.createFilter({
                name: 'startdate',
                join: 'accountingperiod',
                operator: search.Operator.ONORAFTER,
                values: [periodstartdate]
            });
            estrucDestVentas.filters.push(periodFilterStart);

            var periodFilterEnd = search.createFilter({
                name: 'enddate',
                join: 'accountingperiod',
                operator: search.Operator.ONORBEFORE,
                values: [periodenddate]
            });
            estrucDestVentas.filters.push(periodFilterEnd);

            // Filtro de Multibook
            if (featMulti) {
                var multibookFilter = search.createFilter({
                    name: 'accountingbook',
                    join: 'accountingtransaction',
                    operator: search.Operator.IS,
                    values: [paramMulti]
                });
                estrucDestVentas.filters.push(multibookFilter);

                var bookExchangeRateColumn = search.createColumn({
                    name: 'formulacurrency',
                    summary: 'SUM',
                    formula: 'NVL({accountingtransaction.amount},0)'
                });
                estrucDestVentas.columns.push(bookExchangeRateColumn);
            }

            var taxRateItem = search.createColumn({
                name: 'formulanumeric',
                summary: 'GROUP',
                formula: 'CASE WHEN NVL({taxitem.rate},0)=0 THEN 0 ELSE ({taxitem.rate}/100) END'
            });
            estrucDestVentas.columns.push(taxRateItem);

            var arrayDatosT1 = [];

            var pagedData = estrucDestVentas.runPaged({
                pageSize: 1000
            });

            var page, columns;

            pagedData.pageRanges.forEach(function (pageRange) {
                page = pagedData.fetch({
                    index: pageRange.index
                });

                page.data.forEach(function (result) {
                    columns = result.columns;
                    if (featMulti) {
                        var auxAmount = result.getValue(columns[6]);
                        //Multiplicador para obtener el Gross Amount
                        var rateItem = 1 + Number(result.getValue(columns[7]));
                    } else {
                        var auxAmount = result.getValue(columns[4]);
                        //Multiplicador para obtener el Gross Amount
                        var rateItem = 1 + Number(result.getValue(columns[6]));
                    }

                    var arrayTemp = [];

                    //0. Nombre del Item
                    var columna0 = result.getValue(columns[0]);
                    //1. Unidad de Medida
                    if (result.getValue(columns[1]) != 0) {
                        var columna1 = arrayBaseUnits.get(result.getValue(columns[1]));
                    } else {
                        var columna1 = '';
                    }
                    //2. Partida SAC
                    if (result.getValue(columns[2]) == '- None -') {
                        var columna2 = '';
                    } else {
                        var columna2 = result.getValue(columns[2]);
                    }
                    //3. Cantidad
                    var columna3 = result.getValue(columns[3]);
                    //4. Monto
                    var columna4 = (Number(auxAmount) * Number(rateItem)).toFixed(2);
                    //5. Estado
                    var columna5 = result.getValue(columns[5]);

                    if (columna5 == 1) {
                        log.debug('es 1');
                    } else if (columna5 == 2) {
                        log.debug('es 2');
                    } else if (columna5 == 3) {
                        log.debug('es 3');
                    }

                    arrayTemp = [columna0, columna1, columna2, columna3, columna4, columna5];

                    if (columna5 == 1 || columna5 == 2 || columna5 == 3) {
                        arrayDatosT1.push(arrayTemp);
                    }
                });
            });

            log.debug('El arrayDatosT1 es: ', arrayDatosT1);
            return arrayDatosT1;
        }

        function getGlobalLabels() {
            var labels = {
                title: {
                    en: 'STRUCTURE AND DESTINATION OF SALES (IN QUANTITY AND VALUE)' + '|' + 'BREAKDOWN OF SALES TO FREE ZONE COMPANIES' + '|' + 'MONTHLY BREAKDOWN OF LOCAL SALES (COLONS)',
                    es: 'ESTRUCTURA Y DESTINO DE LAS VENTAS (EN CANTIDAD Y VALOR)' + '|' + 'DESGLOSE DE VENTAS A EMPRESAS DE ZONA FRANCA' + '|' + 'DESGLOSE MENSUAL DE VENTAS LOCALES (COLONES)'
                },
                subsidiary: {
                    en: 'Subsidiary: ',
                    es: 'Subsidiaria: '
                },
                period: {
                    en: 'Period: ',
                    es: 'Periodo: '
                },
                table1: {
                    en: 'STRUCTURE AND DESTINATION OF SALES (IN QUANTITY AND VALUE)' + '|' + 'Product' + '|' + 'Unit of Measure' + '|' + 'Departure SAC' + '|' + 'Local Sales' + '|' + 'Sales to Central America' + '|' + 'Sales to other Markets' + '|' + 'Total Sales' + '|' + 'Quantity' + '|' + 'Colones' + '|' + 'TOTALS',
                    es: 'ESTRUCTURA Y DESTINO DE LAS VENTAS (EN CANTIDAD Y VALOR)' + '|' + 'Producto' + '|' + 'Unidad de Medida' + '|' + 'Partida SAC' + '|' + 'Ventas Locales' + '|' + 'Ventas a Centroamérica' + '|' + 'Ventas a Otros Mercados' + '|' + 'Total de Ventas' + '|' + 'Cantidad' + '|' + 'Colones' + '|' + 'TOTALES'
                },
                table2: {
                    en: 'BREAKDOWN OF SALES TO FREE ZONE COMPANIES' + '|' + 'COMPANY NAME ZF' + '|' + 'AMOUNT' + '|' + 'TOTAL ZF SALES' + '|' + 'TOTAL THIRD MARKETS' + '|' + 'TOTAL OTHER MARKETS' + '|' + 'PERCENTAGE OF SALES TO ZF',
                    es: 'DESGLOSE DE VENTAS A EMPRESAS DE ZONA FRANCA' + '|' + 'NOMBRE DE EMPRESA ZF' + '|' + 'MONTO' + '|' + 'TOTAL VENTA ZF' + '|' + 'TOTAL TERCEROS MERCADOS' + '|' + 'TOTAL OTROS MERCADOS' + '|' + 'PORCENTAJE VENTAS A ZF'
                },
                table3: {
                    en: 'MONTHLY BREAKDOWN OF LOCAL SALES (COLONS)' + '|' + 'MONTH' + '|' + 'TOTAL' + '|' + 'January' + '|' + 'February' + '|' + 'March' + '|' + 'April' + '|' + 'May' + '|' + 'June' + '|' + 'July' + '|' + 'August' + '|' + 'September' + '|' + 'October' + '|' + 'November' + '|' + 'December' + '|' + 'TOTAL LOCAL SALES',
                    es: 'DESGLOSE MENSUAL DE VENTAS LOCALES (COLONES)' + '|' + 'MES' + '|' + 'TOTAL' + '|' + 'Enero' + '|' + 'Febrero' + '|' + 'Marzo' + '|' + 'Abril' + '|' + 'Mayo' + '|' + 'Junio' + '|' + 'Julio' + '|' + 'Agosto' + '|' + 'Setiembre' + '|' + 'Octubre' + '|' + 'Noviembre' + '|' + 'Diciembre' + '|' + 'TOTAL VENTA LOCAL'
                },
                message: {
                    en: 'Optional Message.',
                    es: 'Mensaje Opcional.'
                },
                worksheets: {
                    en: 'STRUCTURE AND DESTINATION' + '|' + 'BREAKDOWN OF SALES ZF' + '|' + 'MONTHLY BREAKDOWN LS',
                    es: 'ESTRUCTURA Y DESTINO' + '|' + 'DESGLOSE DE VENTAS ZF' + '|' + 'DESGLOSE MENSUAL LS'
                }
            }

            return labels;
        }

        function SumarElementosArray(array) {
            var SumaTotal = 0;
            for (i = 0; i < array.length; i++) {
                SumaTotal = Number(array[i]) + SumaTotal;
            }

            log.debug('La Suma Total es:', SumaTotal.toFixed(2));

            return SumaTotal.toFixed(2);
        }

        function obtenerSumasTotalesT1(array, array_pos) {
            var arraySumasT = [];
            var sumaTotalVL = 0;
            var sumaTotalCA = 0;
            var sumaTotalOM = 0;
            var sumaTotalTV = 0;
            for (i = 0; i < array.length; i++) {
                var arrayTemp = array[i].split('|');
                sumaTotalVL = Number(arrayTemp[array_pos[0]]) + sumaTotalVL;
                sumaTotalCA = Number(arrayTemp[array_pos[1]]) + sumaTotalCA;
                sumaTotalOM = Number(arrayTemp[array_pos[2]]) + sumaTotalOM;
                sumaTotalTV = Number(arrayTemp[array_pos[3]]) + sumaTotalTV;
            }

            arraySumasT[0] = sumaTotalVL.toFixed(2);
            arraySumasT[1] = sumaTotalCA.toFixed(2);
            arraySumasT[2] = sumaTotalOM.toFixed(2);
            arraySumasT[3] = sumaTotalTV.toFixed(2);

            return arraySumasT;
        }

        function ValidarAcentos(s) {
            //se agregan |/\ para este reporte
            var AccChars = "ŠŽšžŸÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðñòóôõöùúûüýÿ°–—ªº·,|/\\";
            var RegChars = "SZszYAAAAAACEEEEIIIIDNOOOOOUUUUYaaaaaaceeeeiiiidnooooouuuuyyo--ao.     ";

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

        function buildStylesXls() {
            var strResult = '';
            //Crear Excel
            strResult += '<?xml version="1.0" encoding="UTF-8" ?><?mso-application progid="Excel.Sheet"?' +
                '>';
            strResult += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
            strResult += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
            strResult += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
            strResult += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
            strResult += 'xmlns:html="http://www.w3.org/TR/REC-html40">';

            //Estilos de Celdas
            strResult += '<Styles>';

            strResult += '<Style ss:ID="s20">'; // estilo cabecera de tabla
            strResult += '<Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>';
            strResult += '<Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>';
            strResult += '<Font ss:Bold="1"/>';
            strResult += '<Borders>';
            strResult += '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>';
            strResult += '<Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>';
            strResult += '<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>';
            strResult += '<Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>';
            strResult += '</Borders>';
            strResult += '</Style>';

            strResult += '<Style ss:ID="s25">'; // estilo para datos tipo texto
            strResult += '<Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>';
            strResult += '<Alignment ss:Vertical="Center"/>';
            strResult += '<Borders>';
            strResult += '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>';
            strResult += '<Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>';
            strResult += '<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>';
            strResult += '<Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>';
            strResult += '</Borders>';
            strResult += '</Style>';

            strResult += '<Style ss:ID="s26">'; // estilo para datos tipo texto totales
            strResult += '<Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>';
            strResult += '<Font ss:Bold="1"/>';
            strResult += '<Alignment ss:Vertical="Center"/>';
            strResult += '<Borders>';
            strResult += '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>';
            strResult += '<Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>';
            strResult += '<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>';
            strResult += '<Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>';
            strResult += '</Borders>';
            strResult += '</Style>';

            strResult += '<Style ss:ID="s21">'; // estilo para datos tipo numerico
            strResult += '<Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>';
            strResult += '<Alignment ss:Vertical="Center" ss:Horizontal="Right"/>';
            strResult += '<Borders>';
            strResult += '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>';
            strResult += '<Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>';
            strResult += '<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>';
            strResult += '<Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>';
            strResult += '</Borders>';
            strResult += '</Style>';

            strResult += '<Style ss:ID="s24">'; // estilo para datos tipo numerico totales
            strResult += '<Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>';
            strResult += '<Font ss:Bold="1"/>';
            strResult += '<Alignment ss:Vertical="Center" ss:Horizontal="Right"/>';
            strResult += '<Borders>';
            strResult += '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>';
            strResult += '<Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>';
            strResult += '<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>';
            strResult += '<Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>';
            strResult += '</Borders>';
            strResult += '</Style>';

            strResult += '<Style ss:ID="s22">'; //estilo celdas vacias y titulo
            strResult += '<Alignment ss:Horizontal="Center" ss:Vertical="Center"/>';
            strResult += '<Font x:Family="Swiss" ss:Size="12" ss:Bold="1"/>';
            strResult += '</Style>';

            strResult += '<Style ss:ID="s23">'; // estilo para datos fijos
            strResult += '<Alignment ss:Vertical="Center"/>';
            strResult += '</Style>';

            strResult += '</Styles>';

            return strResult
        }

        function buildHeader(type) {
            var strXLS = '';
            var globalLabels = getGlobalLabels();
            var titles = globalLabels.title[language].split('|');

            if (type == 1) {
                for (var i = 0; i < 14; i++) {
                    if (i == 1 || i == 2 || i == 3) {
                        if (i == 1) {
                            strXLS += '<Column ss:AutoFitWidth="0" ss:Width="160"/>';
                        } else if (i == 2) {
                            strXLS += '<Column ss:AutoFitWidth="0" ss:Width="80"/>';
                        } else {
                            strXLS += '<Column ss:AutoFitWidth="0" ss:Width="120"/>';
                        }
                    } else {
                        strXLS += '<Column ss:AutoFitWidth="0" ss:Width="90"/>';
                    }
                }
            } else if (type == 2) {
                for (var i = 0; i < 14; i++) {
                    if (i == 2 || i == 3) {
                        strXLS += '<Column ss:AutoFitWidth="0" ss:Width="125"/>';
                    } else if (i == 4) {
                        strXLS += '<Column ss:AutoFitWidth="0" ss:Width="120"/>';
                    } else {
                        strXLS += '<Column ss:AutoFitWidth="0" ss:Width="85"/>';
                    }
                }
            } else if (type == 3) {
                for (var i = 0; i < 14; i++) {
                    if (i == 2 || i == 3) {
                        strXLS += '<Column ss:AutoFitWidth="0" ss:Width="60"/>';
                    } else if (i == 4) {
                        strXLS += '<Column ss:AutoFitWidth="0" ss:Width="120"/>';
                    } else {
                        strXLS += '<Column ss:AutoFitWidth="0" ss:Width="85"/>';
                    }
                }
            }

            strXLS += '<Row/>';
            strXLS += '<Row>';
            strXLS += '<Cell/>';

            if (type == 1) {
                strXLS += '<Cell ss:MergeAcross="10" ss:StyleID="s22" ><Data ss:Type="String">' + titles[0] + '</Data></Cell>';
            } else
                if (type == 2) {
                    strXLS += '<Cell ss:MergeAcross="4" ss:StyleID="s22" ><Data ss:Type="String">' + titles[1] + '</Data></Cell>';
                } else
                    if (type == 3) {
                        strXLS += '<Cell ss:MergeAcross="4" ss:StyleID="s22" ><Data ss:Type="String">' + titles[2] + '</Data></Cell>';
                    }

            strXLS += '</Row>';
            strXLS += '<Row/>';
            strXLS += '<Row>';
            strXLS += '<Cell/>';
            strXLS += '<Cell ss:MergeAcross="0" ss:StyleID="s23" ><Data ss:Type="String">' + globalLabels.subsidiary[language] + '</Data></Cell>';
            strXLS += '<Cell ss:MergeAcross="2" ss:StyleID="s23" ><Data ss:Type="String">' + companyName + '</Data></Cell>';
            strXLS += '</Row>';
            strXLS += '<Row>';
            strXLS += '<Cell/>';
            strXLS += '<Cell ss:MergeAcross="0" ss:StyleID="s23" ><Data ss:Type="String">' + globalLabels.period[language] + '</Data></Cell>';
            strXLS += '<Cell ss:MergeAcross="2" ss:StyleID="s23" ><Data ss:Type="String">' + periodCont + '</Data></Cell>';
            strXLS += '</Row>';
            return strXLS;
        }

        function generateExcel(arrayFinal) {

            var strXLS = buildStylesXls();
            var globalLabels = getGlobalLabels();
            var worksheets = globalLabels.worksheets[language].split('|');
            strXLS += ' <Worksheet ss:Name=' + '"' + worksheets[0] + '"' + '>';

            strXLS += '<Table>';
            strXLS += buildHeader(1);
            strXLS += generarTable1(arrayFinal);
            strXLS += '<Row/>';
            strXLS += '<Row/>';
            strXLS += '<Row/>';
            strXLS += '<Row>';
            strXLS += '<Cell/>';
            //strXLS += '<Cell ss:MergeDown="1" ss:MergeAcross="6" ss:StyleID="s25" ><Data ss:Type="String">' + globalLabels.message[language] + '</Data></Cell>';
            strXLS += '</Row>';
            strXLS += '</Table>';
            strXLS += '</Worksheet>';

            strXLS += ' <Worksheet ss:Name=' + '"' + worksheets[1] + '"' + '>';

            strXLS += '<Table>';
            strXLS += buildHeader(2);
            strXLS += generarTable2();
            strXLS += '<Row/>';
            strXLS += '<Row/>';
            strXLS += '<Row/>';
            strXLS += '<Row>';
            strXLS += '<Cell/>';
            //strXLS += '<Cell ss:MergeDown="1" ss:MergeAcross="6" ss:StyleID="s25" ><Data ss:Type="String">' + globalLabels.message[language] + '</Data></Cell>';
            strXLS += '</Row>';
            strXLS += '</Table>';
            strXLS += '</Worksheet>';

            strXLS += ' <Worksheet ss:Name=' + '"' + worksheets[2] + '"' + '>';

            strXLS += '<Table>';
            strXLS += buildHeader(3);
            strXLS += generarTable3();
            strXLS += '<Row/>';
            strXLS += '<Row/>';
            strXLS += '<Row/>';
            strXLS += '<Row>';
            strXLS += '<Cell/>';
            //strXLS += '<Cell ss:MergeDown="1" ss:MergeAcross="6" ss:StyleID="s25" ><Data ss:Type="String">' + globalLabels.message[language] + '</Data></Cell>';
            strXLS += '</Row>';
            strXLS += '</Table>';
            strXLS += '</Worksheet>';

            strXLS += '</Workbook>';
            var strXLSEncode = encode.convert({
                string: strXLS,
                inputEncoding: encode.Encoding.UTF_8,
                outputEncoding: encode.Encoding.BASE_64
            });

            SaveFile(strXLSEncode);
        }

        function noData(exerror) {
            obtenerDatosCabecera();
            var mensaje_nodata = '';
            var mensaje_error = '';

            if (paramLog != null) {
                var record = recordModulo.load({
                    type: 'customrecord_lmry_cr_rpt_generator_log',
                    id: paramLog
                });
            } else {
                var record = recordModulo.create({
                    type: 'customrecord_lmry_cr_rpt_generator_log'
                });
            }

            if (language == 'es') {
                mensaje_nodata = "No existe informacion para los criterios seleccionados.";
                mensaje_error = "Ocurrio un error inesperado en la ejecucion del reporte.";

            } else {
                mensaje_nodata = "There is no information for the selected criteria.";
                mensaje_error = "An unexpected error occurred while executing the report.";
            }

            switch (exerror) {
                case '1':
                    var mensaje = mensaje_nodata;
                    break;
                case '2':
                    var mensaje = mensaje_error;
                    break;
            }

            //Nombre de Archivo
            record.setValue({
                fieldId: 'custrecord_lmry_cr_file_name',
                value: mensaje
            });

            //Nombre de Subsidiaria
            record.setValue({
                fieldId: 'custrecord_lmry_cr_subsidiary',
                value: companyName
            });

            //Periodo
            record.setValue({
                fieldId: 'custrecord_lmry_cr_period',
                value: periodCont
            });

            //Multibook
            if (featMulti || featMulti == 'T') {
                record.setValue({
                    fieldId: 'custrecord_lmry_cr_multibooking',
                    value: multibookName
                });
            }

            var recordId = record.save();

            log.debug('los datos del no data son: ', mensaje + '---' + companyName + '---' + periodCont + '---' + multibookName);
        }

        function getNameFile() {
            return 'EDVTA_' + companyRuc + '_' + periodCont + '_' + paramSubsi + '.xls';
        }

        function getBaseUnits() {
            //Query para cargar el Name o Abbreviation de las Unidades Base en el JSON
            try {
                var BUQuery = query.create({
                    type: 'unitstype'
                });
                var firstCondition = BUQuery.createCondition({
                    fieldId: 'uom.baseunit',
                    operator: query.Operator.IS,
                    values: true
                });

                BUQuery.condition = BUQuery.and(firstCondition);
                BUQuery.columns = [BUQuery.createColumn({ fieldId: 'id' }), BUQuery.createColumn({ fieldId: 'uom.abbreviation' })];
                var mysqlbuquery = BUQuery.toSuiteQL();
                var resultset = mysqlbuquery.run();
                var results = resultset.results;

                for (i = 0; i < results.length; i++) {
                    arrayBaseUnits.set(results[i].values[0], results[i].values[1]);
                }

            } catch (error) {
                log.debug('no se encontro unidad de medida');
            }
        }

        function getTotalThirdMarketsSales() {
            var totalThirdMarketsSales = 0;
            var searchThirdMarketsSales = search.create({
                type: "transaction",
                filters:
                    [
                        ["voided", "is", "F"],
                        "AND",
                        ["cogs", "is", "F"],
                        "AND",
                        ["taxline", "is", "F"],
                        "AND",
                        ["shipping", "is", "F"],
                        "AND",
                        ["type", "anyof", "CustCred", "CustInvc"],
                        "AND",
                        ["mainline", "is", "F"],
                        "AND",
                        ["formulatext: CASE WHEN {customer.custentity_lmry_emp_reg_zonas_francas}='F' THEN 1 ELSE 0 END", "is", "1"]
                    ],
                settings: [],
                columns:
                    [
                        search.createColumn({
                            name: "formulacurrency",
                            summary: "SUM",
                            formula: "CASE WHEN NVL({taxitem.rate},0)=0 THEN {amount} ELSE ((1+({taxitem.rate}/100))*{amount}) END",
                            label: "Formula (Currency)"
                        })
                    ]
            });
            //Filtro Subsidiaria
            if (featSubsi) {
                var subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: [paramSubsi]
                });
                searchThirdMarketsSales.filters.push(subsidiaryFilter);

                var confiConsolidationType = search.createSetting({
                    name: 'consolidationtype',
                    value: 'NONE'
                });
                searchThirdMarketsSales.settings.push(confiConsolidationType);
            }
            //Filtro Periodo
            var periodFilterStart = search.createFilter({
                name: 'startdate',
                join: 'accountingperiod',
                operator: search.Operator.ONORAFTER,
                values: [periodstartdate]
            });
            searchThirdMarketsSales.filters.push(periodFilterStart);

            var periodFilterEnd = search.createFilter({
                name: 'enddate',
                join: 'accountingperiod',
                operator: search.Operator.ONORBEFORE,
                values: [periodenddate]
            });
            searchThirdMarketsSales.filters.push(periodFilterEnd);

            // Filtro de Multibook
            if (featMulti) {
                var multibookFilter = search.createFilter({
                    name: 'accountingbook',
                    join: 'accountingtransaction',
                    operator: search.Operator.IS,
                    values: [paramMulti]
                });
                searchThirdMarketsSales.filters.push(multibookFilter);

                var bookExchangeRateColumn = search.createColumn({
                    name: 'formulacurrency',
                    summary: 'SUM',
                    formula: 'CASE WHEN NVL({taxitem.rate},0)=0 THEN {accountingtransaction.amount} ELSE ((1+({taxitem.rate}/100))*{accountingtransaction.amount}) END'
                });
                searchThirdMarketsSales.columns.push(bookExchangeRateColumn);
            }

            var totalThirdMarketsS = searchThirdMarketsSales.run().getRange(0, 10);

            if (totalThirdMarketsS.length != 0) {
                var columns = totalThirdMarketsS[0].columns;

                if (featMulti) {
                    totalThirdMarketsSales = Number(totalThirdMarketsS[0].getValue(columns[1])).toFixed(2);
                } else {
                    totalThirdMarketsSales = Number(totalThirdMarketsS[0].getValue(columns[0])).toFixed(2);
                }
            }

            log.debug('El Total Terceros Mercados es: ', totalThirdMarketsSales);
            return totalThirdMarketsSales;
        }

        function getLibraryRPT() {
            try {

                require(["/SuiteBundles/Bundle 37714/Latam_Library/LMRY_LibraryReport_LBRY_V2.js"], function (library) {
                    libraryRPT = library;
                });
                log.debug('libraryRPT', 'Bundle 37714');

            } catch (err) {

                try {
                    require(["/SuiteBundles/Bundle 35754/Latam_Library/LMRY_LibraryReport_LBRY_V2.js"], function (library) {
                        libraryRPT = library;
                    });

                    log.debug('libraryRPT', 'Bundle 35754');
                } catch (err) {

                    log.error('libraryRPT', 'No se encuentra libreria');
                }
            }

        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });