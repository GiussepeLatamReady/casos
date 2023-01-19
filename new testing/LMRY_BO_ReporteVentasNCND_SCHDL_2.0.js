/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||  This script for Report - Bolivia                                ||
||                                                                  ||
||  File Name: LMRY_BO_ReporteVentasNCND_SCHDL_2.0.js               ||
||                                                                  ||
||  Version Date         Author        Remarks                      ||
||  2.0     Ago 31 2022  Pablo Quispe   Use Script 2.0              ||
\= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */

define([
        "N/record",
        "N/runtime",
        "N/file",
        "N/email",
        "N/encode",
        "N/search",
        "N/format",
        "N/log",
        "N/config",
        "N/xml",
        "/SuiteBundles/Bundle 35754/Latam_Library/LMRY_LibraryReport_LBRY_V2.js",
    ],

    function(recordModulo, runtime, fileModulo, email, encode, search, format, log, config, xml, libreriaReport) {

        var calendarSubsi = null;

        var objContext = runtime.getCurrentScript();
        var param_Json = {};
        var legal_template_extension = null;
        var legal_template_transaction = null;
        var param_Globales;
        var param_fields;
        var language = "";

        //Control de Reporte
        var periodstartdate = null;
        var periodenddate = null;
        var periodname = null;
        var configpage = null;
        var companyruc = null;
        var companyname = null;
        var xlsString = null;
        var auxmess = null;
        var auxanio = null;
        var strName = null;
        var multibookname = '';
        var _cont = 1;
        //*Features
        var FeatureMultiBook = runtime.isFeatureInEffect({ feature: 'MULTIBOOK' });

        //Particionar el Reporte
        var isMultipleDoc = true;
        var maxFileSize = 7340032;
        var bookArray = [];
        var indexSize = 0;

        var language = runtime.getCurrentUser().getPreference('language').substring(0, 2);
        var GLOBAL_LABELS = getGlobalLabels();
        var LMRY_script = "LMRY - BO Reporte Ventas NC ND SCHDL";

        /* ***********************************************
         * Arreglo con la structura de la tabla log
         * ******************************************** */
        var RecordName = 'customrecord_lmry_bo_rpt_generator_log';
        var RecordTable = ['custrecord_lmry_bo_rg_name',
            'custrecord_lmry_bo_rg_postingperiod',
            'custrecord_lmry_bo_rg_subsidiary',
            'custrecord_lmry_bo_rg_url_file',
            'custrecord_lmry_bo_rg_employee',
            'custrecord_lmry_bo_rg_multibook'
        ];

        /* ***********************************************
         * Inicia el proceso Schedule
         * ******************************************** */
        function execute(scriptContext) {
            try {
                // Seteo de Porcentaje completo
                objContext.percentComplete = 0.0;

                // Parametros
                ObtenerParametrosYFeatures();

                // Datos de la empresa
                configpage = config.load('companyinformation');
                companyruc = configpage.getValue('vatregnumber');
                companyname = configpage.getValue('companyname');

                var subsidiary = param_Json.id_subsidiary;


                if (subsidiary != '' && subsidiary != null) {
                    companyname = ObtainNameSubsidiaria(param_Globales.id_subsidiary);
                    companyruc = ObtainFederalIdSubsidiaria(param_Globales.id_subsidiary);
                }

                var multibook = param_Json.id_multibook;

                if (multibook != '' && multibook != null) {
                    multibookname = search.lookupFields({
                        type: search.Type.ACCOUNTING_BOOK,
                        id: multibook,
                        columns: ['name'],
                    });
                    multibookname = multibookname.name;
                }

                var periodo = param_Json.id_period;

                var featCalendar = runtime.isFeatureInEffect({ feature: "MULTIPLECALENDARS" });
                obtenerDatosSubsidiaria(subsidiary, featCalendar);

                var featAccountingSpecial = '';
                featAccountingSpecial = ObtenerConfigFeature(subsidiary, 993)

                if (periodo != null && periodo != '') {
                    if (featAccountingSpecial || featAccountingSpecial == 'T') {
                        var columnFrom = getPeriod(periodo, featCalendar);
                        periodstartdate = columnFrom[0][0];
                        periodenddate = columnFrom[0][1];
                        var endate_aux = columnFrom[0][1];
                        periodname = columnFrom[0][2];
                        periodstartdate = formato_fecha(periodstartdate);
                        periodenddate = formato_fecha(periodenddate);
                    } else {
                        var columnFrom = search.lookupFields({
                            type: search.Type.ACCOUNTING_PERIOD,
                            id: periodo,
                            columns: ['enddate', 'periodname', 'startdate']
                        });
                        periodstartdate = columnFrom.startdate;
                        periodenddate = columnFrom.enddate;
                        var endate_aux = columnFrom.enddate;
                        periodname = columnFrom.periodname;
                        periodstartdate = formato_fecha(periodstartdate);
                        periodenddate = formato_fecha(periodenddate);
                    }
                }

                log.debug('periodos', {
                    periodname: periodname,
                    periodstartdate: periodstartdate,
                    periodenddate: periodenddate
                });
                //Obteniendo datos

                for (var i = 0; i < param_fields.length; i++) {

                    if (i == 0) {
                        var files = fileModulo.load({
                            id: param_fields[i]
                        }).getContents();
                    } else {
                        var aux = fileModulo.load({
                            id: param_fields[i]
                        }).getContents();
                        files.push(aux);
                    }
                }


                files = JSON.parse(files);

                var value = files.transaction;


                if (Object.keys(value).length === 0) {
                    NoData();
                } else {
                    while (isMultipleDoc) {
                        isMultipleDoc = GenerateReport(companyruc, companyname, multibook, multibookname,
                            periodstartdate, periodenddate, periodname, value);
                    }
                    for (var i = 0; i < bookArray.length; i++) {

                        //Se arma el archivo EXCEL
                        strName = encode.convert({
                            string: xlsString,
                            inputEncoding: encode.Encoding.UTF_8,
                            outputEncoding: encode.Encoding.BASE_64
                        });

                        var parsedDateStringAsRawDateObject = format.parse({
                            value: endate_aux,
                            type: format.Type.DATE
                        });
                        var MM = (parsedDateStringAsRawDateObject.getMonth() + 1).toString();
                        DateMM = CompletarCero(MM);
                        DateYY = parsedDateStringAsRawDateObject.getFullYear();

                        if (FeatureMultiBook == true || FeatureMultiBook == 'T') {
                            var NameFile = "BOLibroVentasNC_ND_" + companyname + "_" + DateMM + "_" + DateYY + "_" + multibook + ".xls";
                        } else {
                            var NameFile = "BOLibroVentasNC_ND_" + companyname + "_" + DateMM + "_" + DateYY + ".xls";
                        }

                        savefile(NameFile, 'EXCEL');
                    }
                }

            } catch (error) {
                var varMsgError = 'Importante: Error al procesar Schedule.';
                log.error('Error al procesar Schedule.', error);
                libreriaReport.sendErrorEmail(error, LMRY_script, language);
            }
        }

        //-------------------------------------------------------------------------------------------------------	
        //En caso que no se tenga data que imprimir
        //-------------------------------------------------------------------------------------------------------
        function NoData() {
            // Datos del Usuario
            log.debug('ERROR', 'Entró no Data');
            var userid = parseInt(runtime.getCurrentUser().id);
            var userfn = ['firstname', 'lastname'];
            var employ = search.lookupFields({
                type: 'employee',
                id: userid,
                columns: userfn
            });
            var empfir = employ.firstname;
            var emplas = employ.lastname;
            var usuarioName = empfir + ' ' + emplas;

            var subsidi = param_Json.id_subsidiary;
            if (subsidi != null && subsidi != '') {
                subsidi = search.lookupFields({
                    type: 'subsidiary',
                    id: subsidi,
                    columns: ['legalname']
                });
            }

            var record = recordModulo.load({
                type: RecordName,
                id: param_Json.id_rpt_generator_log
            });

            record.setValue({
                fieldId: RecordTable[0],
                value: GLOBAL_LABELS['Alert18'][language],
            });
            record.setValue({
                fieldId: RecordTable[1],
                value: periodname,
            }); // postingperiod
            record.setValue({
                fieldId: RecordTable[2],
                value: subsidi.legalname,
            }); // subsidiary
            record.setValue({
                fieldId: RecordTable[4],
                value: usuarioName,
            }); // employee

            record.save({
                enableSourcing: true,
            })
        }

        //-------------------------------------------------------------------------------------------------------	
        //Graba el archivo en el Gabinete de Archivos
        //-------------------------------------------------------------------------------------------------------
        function GenerateReport(companyruc, companyname, multibook, multibookname, periodstartdate, periodenddate, periodname, value) {

            //cabecera de excel
            xlsString = '<?xml version="1.0" encoding="ISO-8859-1" ?><?mso-application progid="Excel.Sheet"?>';
            xlsString += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
            xlsString += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
            xlsString += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
            xlsString += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
            xlsString += 'xmlns:html="http://www.w3.org/TR/REC-html40">';
            xlsString += '<Styles>';
            xlsString += '<Style ss:ID="s20"><Font ss:Bold="1" ss:Size="9" /><Alignment ss:Horizontal="Center" ss:Vertical="Bottom"/></Style>';
            xlsString += '<Style ss:ID="s21"><Font ss:Bold="1" ss:Size="12" /><Alignment ss:Horizontal="Center" ss:Vertical="Bottom"/></Style>';
            xlsString += '<Style ss:ID="s22"><Font ss:Bold="1"/><Alignment ss:Vertical="Bottom"/></Style>';
            xlsString += '<Style ss:ID="s23"><Font ss:Bold="1"/><Alignment ss:Vertical="Bottom"/><NumberFormat ss:Format="_(* #,##0.00_);_(* \(#,##0.00\);_(* &quot;-&quot;??_);_(@_)"/></Style>';
            xlsString += '<Style ss:ID="s24"><NumberFormat ss:Format="_(* #,##0.00_);_(* \(#,##0.00\);_(* &quot;-&quot;??_);_(@_)"/></Style>';
            xlsString += '</Styles><Worksheet ss:Name="Sheet1">';


            xlsString += '<Table>';
            xlsString += '<Column ss:AutoFitWidth="0" ss:Width="100"/>';
            xlsString += '<Column ss:AutoFitWidth="0" ss:Width="100"/>';
            xlsString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
            xlsString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
            xlsString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
            xlsString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
            xlsString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
            xlsString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
            xlsString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
            xlsString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
            xlsString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
            xlsString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
            xlsString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
            xlsString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
            xlsString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
            xlsString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
            xlsString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';


            //Cabecera
            xlsString += '<Row>';
            xlsString += '<Cell></Cell>';
            xlsString += '<Cell></Cell>';
            xlsString += '<Cell></Cell>';
            xlsString += '<Cell ss:StyleID="s21"><Data ss:Type="String">' + GLOBAL_LABELS['Alert1'][language] + '</Data></Cell>';
            xlsString += '</Row>';
            xlsString += '<Row></Row>';
            xlsString += '<Row>';
            xlsString += '<Cell></Cell>';
            xlsString += '<Cell></Cell>';
            xlsString += '<Cell><Data ss:Type="String">' + GLOBAL_LABELS['Alert2'][language] + companyname + '</Data></Cell>';
            xlsString += '</Row>';
            xlsString += '<Row>';
            xlsString += '<Cell></Cell>';
            xlsString += '<Cell></Cell>';
            xlsString += '<Cell><Data ss:Type="String">' + GLOBAL_LABELS['Alert5'][language] + companyruc + '</Data></Cell>';
            xlsString += '</Row>';
            xlsString += '<Row>';
            xlsString += '<Cell></Cell>';
            xlsString += '<Cell></Cell>';
            xlsString += '<Cell><Data ss:Type="String">' + GLOBAL_LABELS['Alert3'][language] + periodstartdate + ' al ' + periodenddate + '</Data></Cell>';
            xlsString += '</Row>';
            if (multibook != '' && multibook != null) {
                xlsString += '<Row>';
                xlsString += '<Cell></Cell>';
                xlsString += '<Cell></Cell>';
                xlsString += '<Cell><Data ss:Type="String">' + GLOBAL_LABELS['Alert4'][language] + multibookname + '</Data></Cell>';
                xlsString += '</Row>';
            }
            xlsString += '<Row></Row>';
            xlsString += '<Row></Row>';
            xlsString += '<Row>' +
                // '<Cell ss:StyleID="s20"><Data ss:Type="String"> Especificacion </Data></Cell>' +
                '<Cell ss:StyleID="s20"><Data ss:Type="String"> Nro </Data></Cell>' +
                '<Cell ss:StyleID="s20"><Data ss:Type="String">' + GLOBAL_LABELS['Alert6'][language] + '</Data></Cell>' +
                '<Cell ss:StyleID="s20"><Data ss:Type="String">' + GLOBAL_LABELS['Alert7'][language] + '</Data></Cell>' +
                '<Cell ss:StyleID="s20"><Data ss:Type="String">' + GLOBAL_LABELS['Alert8'][language] + '</Data></Cell>' +
                '<Cell ss:StyleID="s20"><Data ss:Type="String">' + GLOBAL_LABELS['Alert9'][language] + '</Data></Cell>' +
                '<Cell ss:StyleID="s20"><Data ss:Type="String">' + GLOBAL_LABELS['Alert10'][language] + '</Data></Cell>' +
                '<Cell ss:StyleID="s20"><Data ss:Type="String">' + GLOBAL_LABELS['Alert11'][language] + '</Data></Cell>' +
                '<Cell ss:StyleID="s20"><Data ss:Type="String">' + GLOBAL_LABELS['Alert12'][language] + '</Data></Cell>' +
                '<Cell ss:StyleID="s20"><Data ss:Type="String">' + GLOBAL_LABELS['Alert13'][language] + '</Data></Cell>' +
                '<Cell ss:StyleID="s20"><Data ss:Type="String">' + GLOBAL_LABELS['Alert14'][language] + '</Data></Cell>' +
                '<Cell ss:StyleID="s20"><Data ss:Type="String">' + GLOBAL_LABELS['Alert15'][language] + '</Data></Cell>' +
                '<Cell ss:StyleID="s20"><Data ss:Type="String">' + GLOBAL_LABELS['Alert16'][language] + '</Data></Cell>' +
                '<Cell ss:StyleID="s20"><Data ss:Type="String">' + GLOBAL_LABELS['Alert17'][language] + '</Data></Cell>' +
                '</Row>';

            //creacion de reporte xls
            var valuearray = Object.keys(value);

            for (var y = indexSize; y < valuearray.length; y++) {
                var auxArray = new Array();
                var x = valuearray[y];
                xlsString += '<Row>';

                //0. ESPECIFICACION
                /* auxArray[0] = value[x].account_especificacion_ncnd; 
                if (auxArray[0]!='' || auxArray[0]!=null)
                { xlsString += '<Cell><Data ss:Type="String">'+ auxArray[0] +'</Data></Cell>' ;}
                else
                { xlsString += '<Cell><Data ss:Type="String"></Data></Cell>' ;  } */

                //1. Nro
                auxArray[1] = _cont;
                if (auxArray[1] != '' || auxArray[1] != null) { xlsString += '<Cell><Data ss:Type="String">' + auxArray[1] + '</Data></Cell>'; } else { xlsString += '<Cell><Data ss:Type="String"></Data></Cell>'; }

                //2. FECHA NOTA DE CREDITO-DEBITO
                auxArray[2] = value[x].account_fecha;
                if (auxArray[2] != '' || auxArray[2] != null) { xlsString += '<Cell><Data ss:Type="String">' + auxArray[2] + '</Data></Cell>'; } else { xlsString += '<Cell><Data ss:Type="String"></Data></Cell>'; }

                //3. No. DE NOTA DE CREDITO-DEBITO
                auxArray[3] = value[x].account_nfactura;
                if (auxArray[3] != '' || auxArray[3] != null) {
                    if (auxArray[3] != '- None -') { xlsString += '<Cell><Data ss:Type="String">' + auxArray[3] + '</Data></Cell>'; } else { xlsString += '<Cell><Data ss:Type="String"></Data></Cell>'; }
                } else { xlsString += '<Cell><Data ss:Type="String"></Data></Cell>'; }

                //4. No. DE AUTORIZACION
                auxArray[4] = value[x].account_nautorizacion;
                if (auxArray[4] != '' || auxArray[4] != null) {
                    if (auxArray[4] != '- None -') { xlsString += '<Cell><Data ss:Type="String">' + auxArray[4] + '</Data></Cell>'; } else { xlsString += '<Cell><Data ss:Type="String"></Data></Cell>'; }
                } else { xlsString += '<Cell><Data ss:Type="String"></Data></Cell>'; }

                //5. No. DE NIT DEL PROVEEDOR
                auxArray[5] = value[x].account_cliente;
                if (auxArray[5] != '' || auxArray[5] != null) {
                    if (auxArray[5] != '- None -') { xlsString += '<Cell><Data ss:Type="String">' + auxArray[5] + '</Data></Cell>'; } else { xlsString += '<Cell><Data ss:Type="String"></Data></Cell>'; }
                } else { xlsString += '<Cell><Data ss:Type="String"></Data></Cell>'; }

                //6. NOMBRE O RAZON SOCIAL DEL PROVEEDOR
                auxArray[6] = value[x].account_razon_social;
                auxArray[6] = ValidarCaracteres_Especiales(ReemplazarCaracterEspecial(auxArray[6]));
                if (auxArray[6] != '' || auxArray[6] != null) {
                    if (auxArray[6] != '- None -') { xlsString += '<Cell><Data ss:Type="String">' + auxArray[6] + '</Data></Cell>'; } else { xlsString += '<Cell><Data ss:Type="String"></Data></Cell>'; }
                } else { xlsString += '<Cell><Data ss:Type="String"></Data></Cell>'; }

                //7. IMPORTE TOTAL DE LA DEVOLUCION O RESCISION RECIBIDA
                auxArray[7] = value[x].account_importe_total;
                if (auxArray[7] != '' || auxArray[7] != null) { xlsString += '<Cell><Data ss:Type="Number">' + parseFloat(auxArray[7]).toFixed(2) + '</Data></Cell>'; } else { xlsString += '<Cell><Data ss:Type="Number">0.00</Data></Cell>'; }

                //8. DEBITO FISCAL
                auxArray[8] = value[x].account_debitofiscal_ncnd;
                if (auxArray[8] != '' || auxArray[8] != null) { xlsString += '<Cell><Data ss:Type="Number">' + parseFloat(auxArray[8]).toFixed(2) + '</Data></Cell>'; } else { xlsString += '<Cell><Data ss:Type="Number">0.00</Data></Cell>'; }

                //9. C�DIGO DE CONTROL
                auxArray[9] = value[x].account_cod_control;
                if (auxArray[9] != '' || auxArray[9] != null) {
                    if (auxArray[9] != '- None -') { xlsString += '<Cell><Data ss:Type="String">' + auxArray[9] + '</Data></Cell>'; } else { xlsString += '<Cell><Data ss:Type="String"></Data></Cell>'; }
                } else { xlsString += '<Cell><Data ss:Type="String"></Data></Cell>'; }

                //10. FECHA DE FACTURA ORIGINAL
                auxArray[10] = value[x].account_fecha_factura;
                if (auxArray[10] != '' || auxArray[10] != null) {
                    if (auxArray[10] != '- None -') { xlsString += '<Cell><Data ss:Type="String">' + auxArray[10] + '</Data></Cell>'; } else { xlsString += '<Cell><Data ss:Type="String"></Data></Cell>'; }
                } else { xlsString += '<Cell><Data ss:Type="String"></Data></Cell>'; }

                //11. No. DE FACTURA ORIGINAL
                auxArray[11] = value[x].account_nfactura_original;
                if (auxArray[11] != '' || auxArray[11] != null) {
                    if (auxArray[11] != '- None -') { xlsString += '<Cell><Data ss:Type="String">' + auxArray[11] + '</Data></Cell>'; } else { xlsString += '<Cell><Data ss:Type="String"></Data></Cell>'; }
                } else { xlsString += '<Cell><Data ss:Type="String"></Data></Cell>'; }

                //12. No. DE AUTORIZACI�N FACTURA ORIGINAL
                auxArray[12] = value[x].account_nautorizacion_factura;
                if (auxArray[12] != '' || auxArray[12] != null) {
                    if (auxArray[12] != '- None -') { xlsString += '<Cell><Data ss:Type="String">' + auxArray[12] + '</Data></Cell>'; } else { xlsString += '<Cell><Data ss:Type="String"></Data></Cell>'; }
                } else { xlsString += '<Cell><Data ss:Type="String"></Data></Cell>'; }

                //13. IMPORTE TOTAL FACTURA ORIGINAL
                auxArray[13] = value[x].account_importe_total_fac;

                if (auxArray[13] != '' || auxArray[13] != null) {
                    if (auxArray[13] != '- None -') { xlsString += '<Cell><Data ss:Type="String">' + auxArray[13] + '</Data></Cell>'; } else { xlsString += '<Cell><Data ss:Type="String"></Data></Cell>'; }
                } else { xlsString += '<Cell><Data ss:Type="String"></Data></Cell>'; }

                xlsString += '</Row>';
                _cont++;
                // Devuelve tamaño actual en Bytes
                sizeData = _lengthInUtf8Bytes(xlsString);
                // Si el tamaño es menor se continua con la generación de Líneas
                if (sizeData < maxFileSize) continue;
                indexSize = x + 1;
                xlsString += "</Table></Worksheet></Workbook>";
                bookArray.push(xlsString);
                // Reset Strings
                xlsString = "";
                return true;
            }
            xlsString += "</Table></Worksheet></Workbook>";
            bookArray.push(xlsString);
            return false;
        }



        function savefile(pNombreFile, pTipoArchivo) {
            // Ruta de la carpeta contenedora
            var FolderId = objContext.getParameter({
                name: 'custscript_lmry_file_cabinet_rg_bo_stx'
            });

            // Almacena en la carpeta de Archivos Generados
            if (FolderId != '' && FolderId != null) {
                // Genera el nombre del archivo
                var NameFile = pNombreFile;

                // Crea el archivo
                var File = fileModulo.create({
                    name: NameFile,
                    fileType: pTipoArchivo,
                    contents: strName,
                    folder: FolderId
                });

                // Termina de grabar el archivo
                var idfile = File.save();

                // Trae URL de archivo generado
                var idfile2 = fileModulo.load({
                    id: idfile
                });

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
                    var userObj = runtime.getCurrentUser();
                    var usuario = userObj.name;
                    var subsidi = param_Json.id_subsidiary;

                    if (subsidi != null && subsidi != '') {
                        subsidi = search.lookupFields({
                            type: search.Type.SUBSIDIARY,
                            id: subsidi,
                            columns: ['legalname']
                        });
                    }
                    var tmdate = new Date();
                    var myDate = format.parse({
                        value: tmdate,
                        type: format.Type.TEXT
                    });
                    var myTime = format.parse({
                        value: tmdate,
                        type: format.Type.TIMEOFDAY
                    });

                    var current_date = myDate + ' ' + myTime;

                    // Se graba el en log de archivos generados del reporteador
                    var record = recordModulo.load({
                        type: RecordName,
                        id: param_Json.id_rpt_generator_log
                    });
                    record.setValue({
                        fieldId: RecordTable[0],
                        value: NameFile,
                    }); // name
                    record.setValue({
                        fieldId: RecordTable[1],
                        value: periodname,
                    }); // postingperiod
                    record.setValue({
                        fieldId: RecordTable[2],
                        value: subsidi.legalname,
                    }); // subsidiary
                    record.setValue({
                        fieldId: RecordTable[3],
                        value: urlfile,
                    }); // url_file
                    record.setValue({
                        fieldId: RecordTable[4],
                        value: usuario,
                    }); // employee

                    var multibook = param_Json.id_multibook;
                    if (multibook || multibook == 'T') {

                        record.setValue({
                            fieldId: RecordTable[5],
                            value: multibookname,
                        }); // multibook 
                    }
                    record.save({
                        enableSourcing: true,
                    })

                    //-------------------------------------------------------------------------------------------------------	
                    //Envio de Correo
                    //-------------------------------------------------------------------------------------------------------
                    // Datos del Usuario
                    var userid = parseInt(runtime.getCurrentUser().id);
                    var userfn = ['email', 'firstname'];
                    var employ = search.lookupFields({
                        type: 'employee',
                        id: userid,
                        columns: userfn
                    });
                    var empema = employ.email;
                    var empfir = employ.firstname;

                    // Generacion txt y envio de email
                    if (language == 'es') {
                        var subject = 'Reporte de Ventas NCND';
                        var body = '<p>Estimado(a) ' + empfir + ':</p>';
                        body += '<p>Se ha generado el archivo Reporte Libro Ventas NCND satisfactoriamente.</p>';
                        body += '<p>Atentamente,</p>';
                        body += '<p><strong>***NO RESPONDA A ESTE MENSAJE***</strong></p>';
                    } else if (language == 'en') {
                        var subject = 'NCND Purchase Report';
                        var body = '<p>Dear ' + empfir + ':</p>';
                        body += '<p>The NCND Sales Ledger Report file has been generated successfully.</p>';
                        body += '<p>Yours sincerely,</p>';
                        body += '<p><strong>***PLEASE DO NOT REPLY TO THIS MESSAGE***.</strong></p>';
                    } else if (language == 'pt') {
                        var subject = 'Relatório de venta do NCND';
                        var body = '<p>Caro ' + empfir + ':</p>';
                        body += '<p>O arquivo do Relatório do Ledger de Venta do NCND foi gerado com sucesso.</p>';
                        body += '<p>Atenciosamente, </p>';
                        body += '<p><strong>***POR FAVOR, NÃO RESPONDA A ESTA MENSAGEM****</strong></p>';
                    }
                    var bcc = new Array();
                    var cco = new Array();
                    cco[0] = 'customer.voice@latamready.com';
                    // Api de Netsuite para enviar correo electronico
                    email.send({
                        author: userid,
                        recipients: empema,
                        subject: subject,
                        body: body,
                        bcc: bcc,
                        cco: cco
                    });

                }
            } else {
                // Debug
                log.debug({
                    tittle: 'Creacion de Excel',
                    details: 'No existe el folder'
                });
            }
        }

        //-------------------------------------------------------------------------------------------------------	
        //Obtiene nombre de Subsidiaria
        //-------------------------------------------------------------------------------------------------------
        function ObtainNameSubsidiaria(subsidiari) {
            try {
                if (subsidiari != '' && subsidiari != null) {
                    var Name = search.lookupFields({
                        type: 'subsidiary',
                        id: subsidiari,
                        columns: ['legalname']
                    });
                    return Name.legalname;
                }
            } catch (err) {
                var varMsgError = 'Importante: Error al obtener el nombre de la subsidiaria.';
                log.error('error', varMsgError);
                libreriaReport.sendErrorEmail(err, LMRY_script, language);
            }
            return '';
        }

        //-------------------------------------------------------------------------------------------------------	
        //Obtiene el número de identificación fiscal de la subsidiaria
        //-------------------------------------------------------------------------------------------------------
        function ObtainFederalIdSubsidiaria(subsidiari) {
            try {
                if (subsidiari != '' && subsidiari != null) {
                    var FederalIdNumber = search.lookupFields({
                        type: search.Type.SUBSIDIARY,
                        id: subsidiari,
                        columns: ['taxidnum']
                    });
                    return FederalIdNumber.taxidnum;
                }
            } catch (err) {
                var varMsgError = 'Importante: Error al obtener el FederalId de la subsidiaria.';
                log.error('error', varMsgError);
                libreriaReport.sendErrorEmail(err, LMRY_script, language);
            }
            return '';
        }
        //-------------------------------------------------------------------------------------------------------	
        //Obtiene a�o y mes del periodo
        //-------------------------------------------------------------------------------------------------------
        function Periodo(periodo) {
            var auxfech = '';

            auxanio = periodo.substring(4);
            switch (periodo.substring(0, 3).toLowerCase()) {
                case 'ene', 'jan':
                    auxmess = '01';
                    break;
                case 'feb':
                    auxmess = '02';
                    break;
                case 'mar':
                    auxmess = '03';
                    break;
                case 'abr', 'apr':
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
                case 'ago', 'aug':
                    auxmess = '08';
                    break;
                case 'set', 'sep':
                    auxmess = '09';
                    break;
                case 'oct':
                    auxmess = '10';
                    break;
                case 'nov':
                    auxmess = '11';
                    break;
                case 'dic', 'dec':
                    auxmess = '12';
                    break;
                default:
                    auxmess = '00';
                    break;
            }
            auxfech = auxanio + auxmess + '00';
            return auxfech;
        }

        //-------------------------------------------------------------------------------------------------------	
        //Obtenemos parametros del MapReduce
        //-------------------------------------------------------------------------------------------------------
        function ObtenerParametrosYFeatures() {
            param_Globales = objContext.getParameter({
                name: "custscript_lmry_bo_ventas_ncnd_globales",
            });

            param_fields = objContext.getParameter({
                name: "custscript_lmry_bo_ventas_ncnd_files_id",
            });

            log.error("Parametros", param_Globales);
            log.error("ID's Fields", JSON.stringify(param_fields));

            param_Globales = JSON.parse(param_Globales);
            param_fields = JSON.parse(param_fields);

            param_Json = libreriaReport.mergeObject(param_Json, param_Globales);

            var fecha = new Date();
            var mes = fecha.getMonth() + 1;
            if ((mes + "").length == 1) {
                mes = "0" + mes;
            }
            var param_Other = {
                period_anio: fecha.getFullYear(),
                period_mes: mes,
            };
            param_Json = libreriaReport.mergeObject(param_Json, param_Other);

            log.debug('idtemplate', param_Globales.id_legaltemplate);

            //LatamReady - Legal Template
            var legal_template_temp = search.lookupFields({
                type: "customrecord_lmry_legaltemplate",
                id: param_Json.id_legaltemplate,
                columns: [
                    "custrecord_lmry_templates",
                    "custrecord_lmry_templateextension",
                ],
            });

            legal_template_transaction = legal_template_temp.custrecord_lmry_templates;
            legal_template_extension = legal_template_temp.custrecord_lmry_templateextension;

            // Valida si es OneWorld
            isSubsidiariaFeature = runtime.isFeatureInEffect({
                feature: "SUBSIDIARIES",
            });
        }

        function ValidarCaracteres_Especiales(s) {
            var AccChars = "“ŠŽšžŸÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðñòóôõöùúûüýÿ°–—ªº·";
            var RegChars = " SZszYAAAAAACEEEEIIIIDNOOOOOUUUUYaaaaaaceeeeiiiidnooooouuuuyyo--ao.";
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

        function ReemplazarCaracterEspecial(s) {

            if (s != undefined) {

                s.replace(/'/i, '&#39;');
                s = s.replace(/</gi, '&lt;');
                s = s.replace(/>/gi, '&gt;');
                s = s.replace(/&/gi, '&amp;');
                s = s.replace(/"/g, '&quot;');
            } else {
                s = '';
            }

            return s;
        }

        //Da formato de de DD/MM/YYYY
        function formato_fecha(fecha) {

            var date = format.parse({ value: fecha, type: format.Type.DATE });

            var anio = date.getFullYear();
            var mes = date.getMonth() + 1;

            if (('' + mes).length == 1) {
                mes = '0' + mes;
            }

            var dia = date.getDate();

            if (('' + dia).length == 1) {
                dia = '0' + dia;
            }

            return dia + '/' + mes + '/' + anio;
        }

        function getGlobalLabels() {
            var labels = {
                "Alert1": {
                    "es": "LIBRO VENTAS IVA NC/ND",
                    "en": "SALES BOOK - IVA NC/ND",
                    "pt": "LIBRO VENTAS IVA NC/ND"
                },
                "Alert2": {
                    "es": "Razon Social: ",
                    "en": "Company Name: ",
                    "pt": "Razão Social: "
                },
                "Alert3": {
                    "es": "Periodo: ",
                    "en": "Period: ",
                    "pt": "Período: "
                },
                "Alert4": {
                    "es": "Libro Contable: ",
                    "en": "Accounting Book: ",
                    "pt": "Livro de Contabilidade: "
                },
                "Alert5": {
                    "es": "NIT: ",
                    "en": "NIT: ",
                    "pt": "Número de Identificação Fiscal: "
                },
                "Alert6": {
                    "es": "Fecha nota de credito - debito",
                    "en": "Credit - Debit Note Date",
                    "pt": "Encontro"
                },
                "Alert7": {
                    "es": "Nro de nota de credito - debito",
                    "en": "No. Credit - Debit Note",
                    "pt": "Nro. Fatura"
                },
                "Alert8": {
                    "es": "Nro de autorizacion",
                    "en": "No. Authorization",
                    "pt": "Nro. Autorização"
                },
                "Alert9": {
                    "es": "NIT proveedor",
                    "en": "NIT Provider",
                    "pt": "NIT Provador"
                },
                "Alert10": {
                    "es": "Nombre o Razon Social proveedor",
                    "en": "Name or Company Name of the Provider",
                    "pt": "Nome ou Razão Social do Provador"
                },
                "Alert11": {
                    "es": "Importe total de la devolucion o rescision efectuada",
                    "en": "Total Amount of the Return or Rescission effect",
                    "pt": "Importe Total da Devolução ou Rescisão recebida"
                },
                "Alert12": {
                    "es": "Debito Fiscal",
                    "en": "Fiscal Debit",
                    "pt": "Débito Fiscal"
                },
                "Alert13": {
                    "es": "Codigo de control de la nota de credito - Debito",
                    "en": "Control Code of the Credit - Debit Note",
                    "pt": "Código de Control"
                },
                "Alert14": {
                    "es": "Fecha factura original",
                    "en": "Original Transaction Date",
                    "pt": "Data da transação original"
                },
                "Alert15": {
                    "es": "Nro de factura original",
                    "en": "Original Transaction Number",
                    "pt": "Número da transação original"
                },
                "Alert16": {
                    "es": "Nro de autorizacion factura original",
                    "en": "Original Transaction Authorization Number",
                    "pt": "Número de Autorização de Transação Original"
                },
                "Alert17": {
                    "es": "Importe total factura original",
                    "en": "Original Transaction Total Amount",
                    "pt": "Importe Total da Transação Original"
                },
                "Alert18": {
                    "es": "No existe informacion para los criterios seleccionados",
                    "en": "There is no information for the selected criteria",
                    "pt": "Não há informações para os critérios selecionados"
                },
            }

            return labels;
        }

        function _lengthInUtf8Bytes(str) {
            var m = encodeURIComponent(str).match(/%[89ABab]/g);
            return str.length + (m ? m.length : 0);
        }

        function getPeriod(periodo, featMultipleCalendars) {
            var intDMinReg = 0;
            var intDMaxReg = 1000;

            var DbolStop = false;
            var accountsIds = new Array();
            var _cont = 0;

            var periodSearch = search.create({
                type: "customrecord_lmry_special_accountperiod",
                filters: [
                    ["custrecord_lmry_accounting_period", "anyof", periodo]
                ],
                columns: [
                    search.createColumn({
                        name: "custrecord_lmry_date_ini",
                    }),
                    search.createColumn({
                        name: "custrecord_lmry_date_fin",
                    }),
                    search.createColumn({
                        name: "periodname",
                        join: "CUSTRECORD_LMRY_ACCOUNTING_PERIOD",
                    })
                ]
            });

            if (featMultipleCalendars || featMultipleCalendars == 'T') {
                var fiscalCalendarFilter = search.createFilter({
                    name: 'custrecord_lmry_calendar',
                    operator: search.Operator.IS,
                    values: calendarSubsi
                });
                periodSearch.filters.push(fiscalCalendarFilter);
            }

            var searchresult = periodSearch.run();

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

                        for (var col = 0; col < columns.length; col++) {

                            if (objResult[i].getValue(columns[col]) != null && objResult[i].getValue(columns[col]) != '- None -') {
                                arrAuxiliar[col] = objResult[i].getValue(columns[col]);
                            } else {
                                arrAuxiliar[col] = '';
                            }

                        }

                        accountsIds[_cont] = arrAuxiliar;
                        _cont++;

                    }
                    intDMinReg = intDMaxReg;
                    intDMaxReg += 1000;
                } else {
                    DbolStop = true;
                }
            }

            return accountsIds;

        }

        function CompletarCero(date) {
            if (date.length == 1) {
                return '0' + date;
            } else {
                return date;
            }
        }

        function ObtenerConfigFeature(paramsubsidi, idFeature) {
            var activ_feature = false;
            var licenses = new Array();
            licenses = libreriaReport.getLicenses(paramsubsidi);

            for (var index = 0; index < licenses.length; index++) {
                if (licenses[index] == idFeature) {
                    activ_feature = true;
                    break;
                }

            }

            return activ_feature;
        }


        function obtenerDatosSubsidiaria(subsidiaryId, featMultipleCalendars) {
            if (featMultipleCalendars || featMultipleCalendars == 'T') {
                var subsidiary = search.lookupFields({
                    type: search.Type.SUBSIDIARY,
                    id: subsidiaryId,
                    columns: ['fiscalcalendar']
                });

                calendarSubsi = {
                    id: subsidiary.fiscalcalendar[0].value,
                    nombre: subsidiary.fiscalcalendar[0].text
                }
                calendarSubsi = JSON.stringify(calendarSubsi);
            }
        }

        return {
            execute: execute
        };

    });