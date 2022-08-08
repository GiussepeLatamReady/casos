/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_CO_ReporteMayorBalance_Anual_SCHDL_v2.0.js  ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jun 18 2018  LatamReady    Use Script 2.0           ||
\= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
 define(["N/record", "N/runtime", "N/file",  "N/search",
 "N/log", "N/config", "N/encode", "N/format", "/SuiteBundles/Bundle 37714/Latam_Library/LMRY_LibraryReport_LBRY_V2.js"
],

function(recordModulo, runtime, fileModulo, search, log,
 config, encode, format, libreria, libFeature) {

 var objContext = runtime.getCurrentScript();

 var namereport = 'CO - Libro Mayor y Balance Anual';
 var LMRY_script = 'LMRY_CO_ReporteMayorBalance_Anual_SCHDL_v2.0.js';

 var ArrAccounts = [];

 var ArrSaldoAnterior = [];
 var ArrMovimientos = [];
 var ArrSaldoAnteriorSpecific = [];
 var ArrMovimientosSpecific = [];
 var ArrFinal = [];

 var periodstartdate;
 var periodenddate;
 var multibookName;
 var periodname;

 //Cambio de Idioma
 var language = runtime.getCurrentScript().getParameter("LANGUAGE").substring(0, 2);
 var GLOBAL_LABELS = getGlobalLabels();

 //Features
 var featureMultibook = false;
 var featureSubsidiary = false;
 var featureMultipCalendars = false;
 var featureJobs = false;
 var featurePeriodEnd = false;

 //Parametros
 var paramPeriod = null;
 var paramSubsidiary = null;
 var paramMultibook = null;
 var paramRecordId = null;
 var paramAdjustment = null;

 var calendarSubsi = null;
 var taxCalendarSubsi = null;
 var configpage = null;

 var DateFile;
 var DateYY;

 var periodoAdjust = null;
 var featAccountingSpecial = false;
 var periodstartdate1 = null;
 var periodstartdateSpecial = null;
 var periodenddateSpecial = null;
 var companyruc;
 var companyname;
 var yearStartD;
 var xlsString = "";

 function execute(context) {
   ObtenerParametrosYFeatures();

   ArrAccounts = ObtenerCuentas(); 
   //SALDO ANTERIOR
   ArrSaldoAnterior = ObtenerData(false, false, false);
   
   if (featureMultibook || featureMultibook == 'T') {
     ArrSaldoAnteriorSpecific = ObtenerData(false, true, false);
   }

   if (ArrSaldoAnteriorSpecific.length != 0) {
     for (var i = 0; i < ArrSaldoAnteriorSpecific.length; i++) {
       ArrSaldoAnterior.push(ArrSaldoAnteriorSpecific[i]);
     }
   }
   
   //MOVIMIENTOS

   periodoAdjust = obtenerPeriodoAdjustment();

   ArrMovimientos = ObtenerData(true, false, false);

   if (paramAdjustment == 'T' && periodoAdjust != null) {
    var ArrayAdjustment = ObtenerData(true, false, true);
    if (ArrayAdjustment.length != 0) {
      for (var i = 0; i < ArrayAdjustment.length; i++) {
        ArrMovimientos.push(ArrayAdjustment[i]);
      }
    }
   }

   if (featureMultibook || featureMultibook == 'T') {
     ArrMovimientosSpecific = ObtenerData(true, true);
   }

   if (ArrMovimientosSpecific.length != 0) {
     for (var i = 0; i < ArrMovimientosSpecific.length; i++) {
       ArrMovimientos.push(ArrMovimientosSpecific[i]);
     }
   }
   
   //AGREGAR PUCS
   ArrSaldoAnterior = CambiarDataCuentasSaldoAnterior(ArrSaldoAnterior);

   ArrMovimientos = CambiarDataCuentasMovimientos(ArrMovimientos);
   
   ArrFinal = ArrSaldoAnterior.concat(ArrMovimientos);

   ArrFinal = OrdenarPorPucs(ArrFinal);

   if (ArrFinal.length != 0) {
     ArrFinal = agregarArregloCuatroDigitos(ArrFinal);
   }

   GenerarReporte(ArrFinal);
 }

 function ObtenerParametrosYFeatures() {
   paramPeriod = 157;

   paramSubsidiary = 7;

   paramRecordId = objContext.getParameter({
     name: 'custscript_lmry_co_may_bal_anu_record'
   });

   paramMultibook = 4;

   paramAdjustment = objContext.getParameter({
     name: 'custscript_lmry_co_may_bal_anu_adjust'
   });

   //Features
   featureSubsidiary = runtime.isFeatureInEffect({
     feature: "SUBSIDIARIES"
   });

   featureMultibook = runtime.isFeatureInEffect({
     feature: "MULTIBOOK"
   });

   featureMultipCalendars = runtime.isFeatureInEffect({
     feature: 'MULTIPLECALENDARS'
   });

   featurePeriodEnd = runtime.isFeatureInEffect({
     feature: "PERIODENDJOURNALENTRIES"
   });

   ObtenerDatosSubsidiaria();

   //Validacion de feature Special Accounting Period
  //  var licenses = libFeature.getLicenses(paramSubsidiary);
  //        for (var index = 0; index < licenses.length; index++) {
  //            if(licenses[index] == 677){
  //             featAccountingSpecial=true;
  //            }
  //        }  //true o false
  featAccountingSpecial=true;
   if (featAccountingSpecial || featAccountingSpecial == true) {
     var periodos = ObtenerPeriodosEspeciales(paramPeriod);
     var arrayPeriods = periodos.split("|");

    periodstartdate1 = arrayPeriods[0];
    //  periodenddate = arrayPeriods[1];
     periodstartdateSpecial = arrayPeriods[0];
     periodenddateSpecial = arrayPeriods[1];
    } 
      if (paramPeriod) {
        var period_temp = search.lookupFields({
          type: search.Type.ACCOUNTING_PERIOD,
          id: paramPeriod,
          columns: ['periodname', 'startdate', 'enddate']
        });
        periodname = period_temp.periodname;
        periodstartdate = period_temp.startdate;
        periodenddate = period_temp.enddate;
      }
    var tempdate = format.parse({
      value: periodstartdate,
      type: format.Type.DATE
    });

    var monthStartD = tempdate.getMonth() + 1;

    if (('' + monthStartD).length == 1) {
      monthStartD = '0' + monthStartD;
    } else {
      monthStartD = monthStartD + '';
    }

    yearStartD = tempdate.getFullYear();

   if (featureMultibook || featureMultibook == 'T') {
     var multibookName_temp = search.lookupFields({
       type: search.Type.ACCOUNTING_BOOK,
       id: paramMultibook,
       columns: ['name']
     });

     multibookName = multibookName_temp.name;
   }
 }

 
 function GenerarReporte(ArrMontosFinal) {

   var contador = 0;

   if (featAccountingSpecial || featAccountingSpecial == true) {
     periodstartdate = periodstartdateSpecial;
     periodenddate = periodenddateSpecial;
   }

   for (var i = 0; i < ArrMontosFinal.length; i++) {
     if (Math.abs(ArrMontosFinal[i][2]) != 0 || Math.abs(ArrMontosFinal[i][3]) != 0 ||
     Math.abs(ArrMontosFinal[i][4]) != 0 || Math.abs(ArrMontosFinal[i][5]) != 0 ||
     Math.abs(ArrMontosFinal[i][6]) != 0 || Math.abs(ArrMontosFinal[i][7]) != 0) {
       contador += 1;
     }
   }

   if (contador != 0) {
    
     periodstartdate = ordenarFormatoFechas(periodstartdate);
     periodenddate = ordenarFormatoFechas(periodenddate);

     var xlsArchivo = '';
     xlsArchivo = '<?xml version="1.0" encoding="UTF-8" ?><?mso-application progid="Excel.Sheet"?>';
     xlsArchivo += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
     xlsArchivo += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
     xlsArchivo += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
     xlsArchivo += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
     xlsArchivo += 'xmlns:html="http://www.w3.org/TR/REC-html40">';
     xlsArchivo += '<Styles>';
     xlsArchivo += '<Style ss:ID="s21"><Font ss:Bold="1" ss:Size="12" /><Alignment ss:Horizontal="Center" ss:Vertical="Bottom"/></Style>';
     xlsArchivo += '<Style ss:ID="s22"><Font ss:Bold="1"/><Alignment ss:Vertical="Bottom"/></Style>';
     xlsArchivo += '<Style ss:ID="s23"><Font ss:Bold="1"/><Alignment ss:Vertical="Bottom"/><NumberFormat ss:Format="_(* #,##0.00_);_(* \(#,##0.00\);_(* &quot;-&quot;??_);_(@_)"/></Style>';
     xlsArchivo += '<Style ss:ID="s24"><NumberFormat ss:Format="_(* #,##0.00_);_(* \(#,##0.00\);_(* &quot;-&quot;??_);_(@_)"/></Style>';
     xlsArchivo += '</Styles><Worksheet ss:Name="Sheet1">';


     xlsArchivo += '<Table>';
     xlsArchivo += '<Column ss:AutoFitWidth="0" ss:Width="100"/>';
     xlsArchivo += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
     xlsArchivo += '<Column ss:AutoFitWidth="0" ss:Width="100"/>';
     xlsArchivo += '<Column ss:AutoFitWidth="0" ss:Width="100"/>';
     xlsArchivo += '<Column ss:AutoFitWidth="0" ss:Width="100"/>';
     xlsArchivo += '<Column ss:AutoFitWidth="0" ss:Width="100"/>';
     xlsArchivo += '<Column ss:AutoFitWidth="0" ss:Width="100"/>';
     xlsArchivo += '<Column ss:AutoFitWidth="0" ss:Width="100"/>';

     //Cabecera
     var xlsCabecera = '';
     xlsCabecera = '<Row>';
     xlsCabecera += '<Cell></Cell>';
     xlsCabecera += '<Cell></Cell>';
     xlsCabecera += '<Cell></Cell>';
     xlsCabecera += '<Cell ss:StyleID="s21"><Data ss:Type="String">' + GLOBAL_LABELS["Alert1"][language] + '</Data></Cell>';
     xlsCabecera += '</Row>';
     xlsCabecera += '<Row></Row>';
     xlsCabecera += '<Row>';
     xlsCabecera += '<Cell></Cell>';
     xlsCabecera += '<Cell></Cell>';
     xlsCabecera += '<Cell  ss:StyleID="s22"><Data ss:Type="String">' + GLOBAL_LABELS["Alert2"][language] + companyname + '</Data></Cell>';
     xlsCabecera += '</Row>';
     xlsCabecera += '<Row>';
     xlsCabecera += '<Cell></Cell>';
     xlsCabecera += '<Cell></Cell>';
     xlsCabecera += '<Cell  ss:StyleID="s22"><Data ss:Type="String">NIT: ' + companyruc + '</Data></Cell>';
     xlsCabecera += '</Row>';
     xlsCabecera += '<Row>';
     xlsCabecera += '<Cell></Cell>';
     xlsCabecera += '<Cell></Cell>';
     xlsCabecera += '<Cell  ss:StyleID="s22"><Data ss:Type="String">' + GLOBAL_LABELS["Alert3"][language] + periodstartdate + ' al ' + periodenddate + '</Data></Cell>';
     xlsCabecera += '</Row>';


     if ((featureMultibook || featureMultibook == 'T') && (paramMultibook != '' && paramMultibook != null)) {
       xlsCabecera += '<Row>';
       xlsCabecera += '<Cell></Cell>';
       xlsCabecera += '<Cell></Cell>';
       xlsCabecera += '<Cell ss:StyleID="s22"><Data ss:Type="String">' + GLOBAL_LABELS["Alert4"][language] + multibookName + '</Data></Cell>';
       xlsCabecera += '</Row>';
     }

     xlsCabecera += '<Row></Row>';
     xlsCabecera += '<Row></Row>';
     xlsCabecera += '<Row>' +
       '<Cell></Cell>' +
       '<Cell></Cell>' +
       '<Cell></Cell>' +
       '<Cell ss:StyleID="s21"><Data ss:Type="String">' + GLOBAL_LABELS["Alert7"][language] + '</Data></Cell>' +
       '<Cell></Cell>' +
       '<Cell ss:StyleID="s21"><Data ss:Type="String">' + GLOBAL_LABELS["Alert8"][language] + '</Data></Cell>' +
       '<Cell></Cell>' +
       '<Cell ss:StyleID="s21"><Data ss:Type="String">' + GLOBAL_LABELS["Alert9"][language] + '</Data></Cell>' +
       '</Row>';

     xlsCabecera += '<Row>' +
       '<Cell ss:StyleID="s21"><Data ss:Type="String">' + GLOBAL_LABELS["Alert5"][language] + '</Data></Cell>' +
       '<Cell ss:StyleID="s21"><Data ss:Type="String">' + GLOBAL_LABELS["Alert6"][language] + '</Data></Cell>' +
       '<Cell ss:StyleID="s21"><Data ss:Type="String">' + GLOBAL_LABELS["Alert14"][language] + '</Data></Cell>' +
       '<Cell ss:StyleID="s21"><Data ss:Type="String">' + GLOBAL_LABELS["Alert10"][language] + '</Data></Cell>' +
       '<Cell ss:StyleID="s21"><Data ss:Type="String">' + GLOBAL_LABELS["Alert11"][language] + '</Data></Cell>' +
       '<Cell ss:StyleID="s21"><Data ss:Type="String">' + GLOBAL_LABELS["Alert10"][language] + '</Data></Cell>' +
       '<Cell ss:StyleID="s21"><Data ss:Type="String">' + GLOBAL_LABELS["Alert11"][language] + '</Data></Cell>' +
       '<Cell ss:StyleID="s21"><Data ss:Type="String">' + GLOBAL_LABELS["Alert10"][language] + '</Data></Cell>' +
       '<Cell ss:StyleID="s21"><Data ss:Type="String">' + GLOBAL_LABELS["Alert11"][language] + '</Data></Cell>' +
       '</Row>';

     xlsString = xlsArchivo + xlsCabecera;

     var _TotalSIDebe = 0.0;
     var _TotalSIHaber = 0.0;
     var _TotalMovDebe = 0.0;
     var _TotalMovHaber = 0.0;
     var _TotalSFDebe = 0.0;
     var _TotalSFHaber = 0.0;

     // Formato de la celda
     var _StyleTxt = ' ss:StyleID="s22" ';
     var _StyleNum = ' ss:StyleID="s23" ';

     var sal_anterior = 0;
     var mov = 0;
     var nuevo_saldo = 0;

     for (var i = 0; i < ArrMontosFinal.length; i++) {
       if ((Math.abs(ArrMontosFinal[i][2]) != 0 || Math.abs(ArrMontosFinal[i][3]) != 0 ||
           Math.abs(ArrMontosFinal[i][4]) != 0 || Math.abs(ArrMontosFinal[i][5]) != 0 ||
           Math.abs(ArrMontosFinal[i][6]) != 0 || Math.abs(ArrMontosFinal[i][7]) != 0)) {
         xlsString += '<Row>';
         var testObj={
          Num_cuenta:"",
          Denomninacion:"",
          Documento:"",
          Haber_antes:0,
          Debe_antes:0,
          Haber_mov:0,
          Debe_mov:0,
          Haber_balance:0,
          Debe_balance:0
         }
         // && Number(ArrMontosFinal[i][0].charAt(0)) <= 6

         //////////////////////////////////
         //numero de cuenta
         if (ArrMontosFinal[i][0] != '' || ArrMontosFinal[i][0] != null) {

           xlsString += '<Cell ss:StyleID="s22"><Data ss:Type="String">' + ArrMontosFinal[i][0] + '</Data></Cell>';
         } else {
           xlsString += '<Cell ss:StyleID="s22"><Data ss:Type="String"></Data></Cell>';
         }
         testObj[Num_cuenta]=ArrMontosFinal[i][0]
         //Denominacion

         if (ArrMontosFinal[i][1].length > 0) {
           var s = ValidarAcentos(ArrMontosFinal[i][1]);
           xlsString += '<Cell ss:StyleID="s22"><Data ss:Type="String">' + s + '</Data></Cell>';
         } else {
           xlsString += '<Cell ss:StyleID="s22"><Data ss:Type="String"></Data></Cell>';
         }
         testObj[Denomninacion]=ValidarAcentos(ArrMontosFinal[i][1])
         //Documento
         
         if(ArrMontosFinal[i][0]<100000){
          xlsString += '<Cell></Cell>';
         }else{
          xlsString += '<Cell><Data ss:Type="String">' + ArrMontosFinal[i][14] + '</Data></Cell>';
          testObj[Documento]=ArrMontosFinal[i][14]
         }
         
         /////////////////////////////////
         if (ArrMontosFinal[i][0].length == 1 || ArrMontosFinal[i][0].length == 2 || ArrMontosFinal[i][0].length == 4 || ArrMontosFinal[i][0].length == 6) {
           var saldo_antes = redondear(Math.abs(ArrMontosFinal[i][2]) - Math.abs(ArrMontosFinal[i][3]));
           var saldo_actual = redondear(Math.abs(ArrMontosFinal[i][2]) + Math.abs(ArrMontosFinal[i][4]) - Math.abs(ArrMontosFinal[i][3]) - Math.abs(ArrMontosFinal[i][5]));
           if (saldo_antes < 0) {
             //Haber Antes
             xlsString += '<Cell ' + _StyleNum + '><Data ss:Type="Number">' + 0.0 + '</Data></Cell>';
             testObj[Haber_antes]=0.0
             //Debe Antes
             xlsString += '<Cell ' + _StyleNum + '><Data ss:Type="Number">' + Math.abs(saldo_antes) + '</Data></Cell>';
             testObj[Debe_antes]=Math.abs(saldo_antes)
           } else {
             if (saldo_antes > 0) {
               //Haber Antes
               xlsString += '<Cell ' + _StyleNum + '><Data ss:Type="Number">' + Math.abs(saldo_antes) + '</Data></Cell>';
               testObj[Haber_antes]=Math.abs(saldo_antes)
               //Debe Antes
               xlsString += '<Cell ' + _StyleNum + '><Data ss:Type="Number">' + 0.0 + '</Data></Cell>';
               testObj[Debe_antes]=0.0
             } else {
               xlsString += '<Cell ' + _StyleNum + '><Data ss:Type="Number">' + 0.0 + '</Data></Cell>';
               testObj[Haber_antes]=0.0
               xlsString += '<Cell ' + _StyleNum + '><Data ss:Type="Number">' + 0.0 + '</Data></Cell>';
               testObj[Debe_antes]=0.0

             }
           }

           //Haber Movimientos
           xlsString += '<Cell ' + _StyleNum + '><Data ss:Type="Number">' + Math.abs(ArrMontosFinal[i][4]) + '</Data></Cell>';
           testObj[Haber_mov]=Math.abs(ArrMontosFinal[i][4])
           //Debe Movimientos
           xlsString += '<Cell ' + _StyleNum + '><Data ss:Type="Number">' + Math.abs(ArrMontosFinal[i][5]) + '</Data></Cell>';
           testObj[Debe_mov]=Math.abs(ArrMontosFinal[i][5])
           if (saldo_actual < 0) {
             //Haber Saldo
             xlsString += '<Cell ' + _StyleNum + '><Data ss:Type="Number">' + 0.0 + '</Data></Cell>';
              testObj[Haber_balance]=0.0
             //Debe Saldo
             xlsString += '<Cell ' + _StyleNum + '><Data ss:Type="Number">' + Math.abs(saldo_actual) + '</Data></Cell>';
              testObj[Debe_balance]=Math.abs(saldo_actual)
           } else if (saldo_actual > 0) {
             //Haber Saldo
             xlsString += '<Cell ' + _StyleNum + '><Data ss:Type="Number">' + Math.abs(saldo_actual) + '</Data></Cell>';
             testObj[Haber_balance]=Math.abs(saldo_actual)
             //Debe Saldo
             xlsString += '<Cell ' + _StyleNum + '><Data ss:Type="Number">' + 0.0 + '</Data></Cell>';
             testObj[Debe_balance]=0.0
           }

           if (ArrMontosFinal[i][0].length == 1) {
             sal_anterior = Math.abs(ArrMontosFinal[i][2]) - Math.abs(ArrMontosFinal[i][3]);
             mov = Math.abs(ArrMontosFinal[i][4]) - Math.abs(ArrMontosFinal[i][5]);
             nuevo_saldo = Math.abs(ArrMontosFinal[i][6]) - Math.abs(ArrMontosFinal[i][7]);

             if (sal_anterior > 0) {
               _TotalSIDebe += sal_anterior;
             } else {
               _TotalSIHaber += sal_anterior;
             }

             _TotalMovDebe += Math.abs(ArrMontosFinal[i][4]);

             _TotalMovHaber += Math.abs(ArrMontosFinal[i][5]);

             if (nuevo_saldo > 0) {
               _TotalSFDebe += nuevo_saldo;
             } else {
               _TotalSFHaber += nuevo_saldo;
             }

           }
         } else {
           //Haber Antes
           xlsString += '<Cell ' + _StyleNum + '><Data ss:Type="Number">' + Math.abs(ArrMontosFinal[i][2]) + '</Data></Cell>';
           testObj[Haber_antes]=Math.abs(ArrMontosFinal[i][2])
           //Debe Antes
           xlsString += '<Cell ' + _StyleNum + '><Data ss:Type="Number">' + Math.abs(ArrMontosFinal[i][3]) + '</Data></Cell>';
           testObj[Debe_antes]=Math.abs(ArrMontosFinal[i][3])
           //Haber Movimientos
           xlsString += '<Cell ' + _StyleNum + '><Data ss:Type="Number">' + Math.abs(ArrMontosFinal[i][4]) + '</Data></Cell>';
           testObj[Haber_mov]=Math.abs(ArrMontosFinal[i][4])
           //Debe Movimientos
           xlsString += '<Cell ' + _StyleNum + '><Data ss:Type="Number">' + Math.abs(ArrMontosFinal[i][5]) + '</Data></Cell>';
           testObj[Debe_mov]=Math.abs(ArrMontosFinal[i][5])
           //Haber Saldo
           xlsString += '<Cell ' + _StyleNum + '><Data ss:Type="Number">' + Math.abs(ArrMontosFinal[i][6]) + '</Data></Cell>';
           testObj[Haber_balance]=Math.abs(ArrMontosFinal[i][6])
           //Debe Saldo
           xlsString += '<Cell ' + _StyleNum + '><Data ss:Type="Number">' + Math.abs(ArrMontosFinal[i][7]) + '</Data></Cell>';
           testObj[Debe_balance]=Math.abs(ArrMontosFinal[i][7])
         }
         xlsString += '</Row>';
         log.debug("Line transactions "+(i+1),testObj)
       }
       
     }

     // CAMBIO 2016/04/14 - TOTALES
     xlsString += '<Row>';
     xlsString += '<Cell></Cell>';
     xlsString += '<Cell ' + _StyleTxt + '><Data ss:Type="String">' + GLOBAL_LABELS["Alert13"][language] + '</Data></Cell>';
     xlsString += '<Cell></Cell>';
     xlsString += '<Cell ' + _StyleNum + '><Data ss:Type="Number">' + Math.abs(_TotalSIDebe) + '</Data></Cell>';
     xlsString += '<Cell ' + _StyleNum + '><Data ss:Type="Number">' + Math.abs(_TotalSIHaber) + '</Data></Cell>';
     xlsString += '<Cell ' + _StyleNum + '><Data ss:Type="Number">' + Math.abs(_TotalMovDebe) + '</Data></Cell>';
     xlsString += '<Cell ' + _StyleNum + '><Data ss:Type="Number">' + Math.abs(_TotalMovHaber) + '</Data></Cell>';
     xlsString += '<Cell ' + _StyleNum + '><Data ss:Type="Number">' + Math.abs(_TotalSFDebe) + '</Data></Cell>';
     xlsString += '<Cell ' + _StyleNum + '><Data ss:Type="Number">' + Math.abs(_TotalSFHaber) + '</Data></Cell>';
     xlsString += '</Row>';

     xlsString += '</Table></Worksheet></Workbook>';
     /*var auxperiod = Periodo(periodname);

     DateMM = auxmess;
     DateYY = auxanio;

     // Se arma el archivo EXCEL
     strName = nlapiEncrypt(xlsString, 'base64');
     if (paramMultibook != '' && paramMultibook != null) {
         var NameFile = "COLibroMayorBalance_" + companyname + "_" + DateMM + "_" + DateYY + "_" + paramMultibook + ".xls";
     } else {
         var NameFile = "COLibroMayorBalance_" + companyname + "_" + DateMM + "_" + DateYY + ".xls";
     }*/

    //  var Final_string = encode.convert({
    //    string: xlsString,
    //    inputEncoding: encode.Encoding.UTF_8,
    //    outputEncoding: encode.Encoding.BASE_64
    //  });

    //  var file_id = savefile(Final_string);

    log.debug("console","Guarda el archivo");
   } else {
     //NoData();
     log.debug("No data","No data");
   }
 }

 function NoData() {
   var usuarioTemp = runtime.getCurrentUser();
   var usuario = usuarioTemp.name;
   var record;

   if (paramRecordId != null && paramRecordId != '') {
    record = recordModulo.load({
       type: 'customrecord_lmry_co_rpt_generator_log',
       id: paramRecordId
     });
   } else {
    record = recordModulo.create({
       type: 'customrecord_lmry_co_rpt_generator_log'
     });
   }

   //Nombre de Archivo
   record.setValue({
     fieldId: 'custrecord_lmry_co_rg_name',
     value: GLOBAL_LABELS["Alert12"][language]
   });

   //Nombre de Reporte
   record.setValue({
     fieldId: 'custrecord_lmry_co_rg_transaction',
     value: namereport
   });

   //Nombre de Subsidiaria
   record.setValue({
     fieldId: 'custrecord_lmry_co_rg_subsidiary',
     value: companyname
   });

   //Periodo
   // record.setValue({
   //   fieldId: 'custrecord_lmry_co_rg_postingperiod',
   //   value: periodname
   // });

   //Multibook
   // if (featureMultibook || featureMultibook == 'T') {
   //   record.setValue({
   //     fieldId: 'custrecord_lmry_co_rg_multibook',
   //     value: multibookName
   //   });
   // }

   //Creado Por
   // record.setValue({
   //   fieldId: 'custrecord_lmry_co_rg_employee',
   //   value: usuario
   // });

   record.save();
 }

 function ObtenerPeriodosEspeciales(paramperiod) {
   var startDate;
   var periodName;
   var endDate;

   if (featAccountingSpecial || featAccountingSpecial == 'T') {

     var searchSpecialPeriod = search.create({
       type: "customrecord_lmry_special_accountperiod",
       filters: [
           ["isinactive", "is", "F"], 'AND',
            ["custrecord_lmry_accounting_period", "is", paramperiod]
       ],
       columns: [
           search.createColumn({
               name: "custrecord_lmry_date_ini",
               label: "1. Latam - Date Start",
           }),
           search.createColumn({
               name: "custrecord_lmry_date_fin",
               label: "2. Latam - Date Fin",
           }),
           search.createColumn({
               name: "name",
               label: "3. Latam - Period Name",
           })
       ]
     });

     if (featureMultipCalendars || featureMultipCalendars == 'T') {
       var fiscalCalendarFilter = search.createFilter({
           name: 'custrecord_lmry_calendar',
           operator: search.Operator.IS,
           values: calendarSubsi
       });
     searchSpecialPeriod.filters.push(fiscalCalendarFilter);
     }

     var pagedData = searchSpecialPeriod.runPaged({
       pageSize: 1000
     });
     var page;
     pagedData.pageRanges.forEach(function(pageRange) {
       page = pagedData.fetch({
         index: pageRange.index
       });

       page.data.forEach(function(result) {
         var columns = result.columns;
         startDate = result.getValue(columns[0]);
         endDate = result.getValue(columns[1]);
         periodName = result.getValue(columns[2]);

       })
     });

   } else {
     if (paramperiod != null && paramperiodo != '') {
       var columnFrom = search.lookupFields({
         type: 'accountingperiod',
         id: paramperiod,
         columns: ['enddate', 'periodname', 'startdate']
       });
       startDate = columnFrom.startdate;
       endDate = columnFrom.enddate;
       periodName = columnFrom.periodname;
     }
   }


//Este caracter | no esta en ningun formato de fechas
   return startDate + '|' + endDate + '|' + periodName;
 }

 function savefile(Final_string) {
   var FolderId = objContext.getParameter({
     name: 'custscript_lmry_file_cabinet_rg_co'
   });

   if (featAccountingSpecial || featAccountingSpecial == true) {
     DateFile = periodstartdateSpecial.split('/');

   } else {
     DateFile = periodstartdate.split('/');
   }

   DateYY = DateFile[2];
   //DateDD = DateFile[0];
   var Final_NameFile;
   // Almacena en la carpeta de Archivos Generados
   if (FolderId != '' && FolderId != null) {
     if (paramMultibook != '' && paramMultibook != null) {
      Final_NameFile = "COLibroMayorBalanceAnual_" + companyname + "_" + yearStartD + "_" + paramMultibook + ".xls";
     } else {
      Final_NameFile = "COLibroMayorBalanceAnual_" + companyname + "_" + yearStartD + ".xls";
     }
     //var Final_NameFile = 'MAYOR_BALANCE_ANUAL_' + paramPeriod + '_' + paramMultibook + '.xls';
     // Crea el archivo.xls
     var file = fileModulo.create({
       name: Final_NameFile,
       fileType: fileModulo.Type.EXCEL,
       contents: Final_string,
       folder: FolderId
     });

     var idfile = file.save();

     var idfile2 = fileModulo.load({
       id: idfile
     }); // Trae URL de archivo generado

     // Obtenemo de las prefencias generales el URL de Netsuite (Produccion o Sandbox)
     var getURL = objContext.getParameter({
       name: 'custscript_lmry_netsuite_location'
     });
     var urlfile = '';

     if (getURL != null && getURL != '') {
       urlfile += 'https://' + getURL;
     }

     urlfile += idfile2.url;

     var usuarioTemp = runtime.getCurrentUser();
     var usuario = usuarioTemp.name;
     var record;

     if (paramRecordId != null && paramRecordId != '') {
      record = recordModulo.load({
         type: 'customrecord_lmry_co_rpt_generator_log',
         id: paramRecordId
       });
     } else {
      record = recordModulo.create({
         type: 'customrecord_lmry_co_rpt_generator_log'
       });
     }

     //Nombre de Archivo
     record.setValue({
       fieldId: 'custrecord_lmry_co_rg_name',
       value: Final_NameFile
     });

     //Url de Archivo
     record.setValue({
       fieldId: 'custrecord_lmry_co_rg_url_file',
       value: urlfile
     });

     //Nombre de Reporte
     // record.setValue({
     //   fieldId: 'custrecord_lmry_co_rg_transaction',
     //   value: namereport
     // });

     //Nombre de Subsidiaria
     // record.setValue({
     //   fieldId: 'custrecord_lmry_co_rg_subsidiary',
     //   value: companyname
     // });

     //Periodo
     // record.setValue({
     //   fieldId: 'custrecord_lmry_co_rg_postingperiod',
     //   value: periodname
     // });

     //Multibook
     // if (featureMultibook || featureMultibook == 'T') {
     //   record.setValue({
     //     fieldId: 'custrecord_lmry_co_rg_multibook',
     //     value: multibookName
     //   });
     // }

     //Creado Por
     // record.setValue({
     //   fieldId: 'custrecord_lmry_co_rg_employee',
     //   value: usuario
     // });

     record.save();
     libreria.sendrptuser(namereport, 3, Final_NameFile);

     return idfile;
   }
 }

 function agregarArregloCuatroDigitos(ArrMontosFinal) {
   /*
    * ARRAY FINAL
    * 0. cuenta
    * 1. denominacion
    * 2. debitos antes
    * 3. creditos antes
    * 4. debitos actual
    * 5. creditos actual
    * 6. nuevo saldo debitos
    * 7. nuevo saldo creditos
    * 8. cuenta 4 digitos
    * 9. denominacion 4 digitos
    * 10. cuenta 2 digitos
    * 11. denominacion 2 digitos
    * 12. cuenta 1 digito
    * 13. denominacion 1 digito
    */

   var cuenta_aux = ArrMontosFinal[0][8];

   var array_4_digitos = new Array();

   array_4_digitos[0] = cuenta_aux;
   array_4_digitos[1] = ArrMontosFinal[0][9];
   array_4_digitos[2] = 0.0;
   array_4_digitos[3] = 0.0;
   array_4_digitos[4] = 0.0;
   array_4_digitos[5] = 0.0;
   array_4_digitos[6] = 0.0;
   array_4_digitos[7] = 0.0;
   array_4_digitos[8] = ArrMontosFinal[0][8];
   array_4_digitos[9] = ArrMontosFinal[0][9];
   array_4_digitos[10] = ArrMontosFinal[0][10];
   array_4_digitos[11] = ArrMontosFinal[0][11];
   array_4_digitos[12] = ArrMontosFinal[0][12];
   array_4_digitos[13] = ArrMontosFinal[0][13];
   array_4_digitos[14] = ArrMontosFinal[0][14];


   //Agregar al inicio del array
   ArrMontosFinal.splice(0, 0, array_4_digitos);

   var array_cuentas = new Array();

   array_cuentas[0] = array_4_digitos;

   var cont = 1;
   for (var i = 0; i < ArrMontosFinal.length; i++) {
     if (ArrMontosFinal[i][8] != cuenta_aux) {
       cuenta_aux = ArrMontosFinal[i][8];
       var array_aux = new Array();

       array_aux[0] = cuenta_aux;
       array_aux[1] = ArrMontosFinal[i][9];
       array_aux[2] = 0.0;
       array_aux[3] = 0.0;
       array_aux[4] = 0.0;
       array_aux[5] = 0.0;
       array_aux[6] = 0.0;
       array_aux[7] = 0.0;
       array_aux[8] = ArrMontosFinal[i][8];
       array_aux[9] = ArrMontosFinal[i][9];
       array_aux[10] = ArrMontosFinal[i][10];
       array_aux[11] = ArrMontosFinal[i][11];
       array_aux[12] = ArrMontosFinal[i][12];
       array_aux[13] = ArrMontosFinal[i][13];
       array_aux[14] = ArrMontosFinal[i][14];
       array_cuentas[cont] = array_aux;
       cont++;
       ArrMontosFinal.splice(i, 0, array_aux);
     }
   }

   //calcular montos de cuentas
   for (var i = 0; i < array_cuentas.length; i++) {
     for (var j = 0; j < ArrMontosFinal.length; j++) {
       if (array_cuentas[i][0] == ArrMontosFinal[j][8]) {
         array_cuentas[i][2] += Number(ArrMontosFinal[j][2]);
         array_cuentas[i][3] += Number(ArrMontosFinal[j][3]);
         array_cuentas[i][4] += Number(ArrMontosFinal[j][4]);
         array_cuentas[i][5] += Number(ArrMontosFinal[j][5]);
         array_cuentas[i][6] += Number(ArrMontosFinal[j][6]);
         array_cuentas[i][7] += Number(ArrMontosFinal[j][7]);
       }
     }
   }

   //reemplazar array vacio en el ArrMontosFinal
   for (var i = 0; i < array_cuentas.length; i++) {
     for (var j = 0; j < ArrMontosFinal.length; j++) {
       if (array_cuentas[i][0] == ArrMontosFinal[j][0]) {
         ArrMontosFinal[j] = array_cuentas[i];
       }
     }
   }

   ArrMontosFinal = agregarArregloDosDigitos(ArrMontosFinal);

   return ArrMontosFinal;
 }

 function agregarArregloDosDigitos(ArrMontosFinal) {

   /*
    * ARRAY SEARCH
    * 0. cuenta 6 digitos
    * 1. denominacion 6 digitos
    * 2. documento
    * 3. sum debitos
    * 4. sum credito
    * 5. cuenta 4 digitos
    * 6. denominacion 4 digitos
    * 7. cuenta 2 digitos
    * 8. denominacion 2 digitos
    * 9. cuenta 1 digito
    * 10. denominacion 1 digito
    * 11. period id
    * 12. period name
    * 13. saldo
    */

   var grupo_aux = ArrMontosFinal[0][10];

   var array_aux_uno = new Array();

   array_aux_uno[0] = grupo_aux;
   array_aux_uno[1] = ArrMontosFinal[0][11];
   array_aux_uno[2] = 0.0;
   array_aux_uno[3] = 0.0;
   array_aux_uno[4] = 0.0;
   array_aux_uno[5] = 0.0;
   array_aux_uno[6] = 0.0;
   array_aux_uno[7] = 0.0;
   array_aux_uno[8] = ArrMontosFinal[0][8];
   array_aux_uno[9] = ArrMontosFinal[0][9];
   array_aux_uno[10] = ArrMontosFinal[0][10];
   array_aux_uno[11] = ArrMontosFinal[0][11];
   array_aux_uno[12] = ArrMontosFinal[0][12];
   array_aux_uno[13] = ArrMontosFinal[0][13];
   array_aux_uno[14] = ArrMontosFinal[0][14];

   ArrMontosFinal.splice(0, 0, array_aux_uno);

   var array_cuentas = new Array();

   array_cuentas[0] = array_aux_uno;

   var cont = 1;

   //quiebre de grupo
   for (var i = 0; i < ArrMontosFinal.length; i++) {
     if (grupo_aux != ArrMontosFinal[i][10]) {
       grupo_aux = ArrMontosFinal[i][10];
       var array_aux = new Array();
       /* 0 -> cuenta
        * 1 -> denominacion
        * 2 -> debe antes
        * 3 -> haber antes
        * 4 -> debe actual
        * 5 -> haber actual
        * 6 -> debe nuevo saldo
        * 7 -> haber nuevo saldo
        */
       array_aux[0] = grupo_aux;
       array_aux[1] = ArrMontosFinal[i][11];
       array_aux[2] = 0.0;
       array_aux[3] = 0.0;
       array_aux[4] = 0.0;
       array_aux[5] = 0.0;
       array_aux[6] = 0.0;
       array_aux[7] = 0.0;
       array_aux[8] = ArrMontosFinal[i][8];
       array_aux[9] = ArrMontosFinal[i][9];
       array_aux[10] = ArrMontosFinal[i][10];
       array_aux[11] = ArrMontosFinal[i][11];
       array_aux[12] = ArrMontosFinal[i][12];
       array_aux[13] = ArrMontosFinal[i][13];
       array_aux[14] = ArrMontosFinal[i][14];

       array_cuentas[cont] = array_aux;
       cont++;
       ArrMontosFinal.splice(i, 0, array_aux);
     }
   }
   //calcular montos de cuentas
   for (var i = 0; i < array_cuentas.length; i++) {
     for (var j = 0; j < ArrMontosFinal.length; j++) {
       if (array_cuentas[i][0] == ArrMontosFinal[j][10] && ArrMontosFinal[j][0].length == 6) {
         array_cuentas[i][2] += Number(ArrMontosFinal[j][2]);
         array_cuentas[i][3] += Number(ArrMontosFinal[j][3]);
         array_cuentas[i][4] += Number(ArrMontosFinal[j][4]);
         array_cuentas[i][5] += Number(ArrMontosFinal[j][5]);
         array_cuentas[i][6] += Number(ArrMontosFinal[j][6]);
         array_cuentas[i][7] += Number(ArrMontosFinal[j][7]);
       }
     }
   }
   //reemplazar array vacio del ArrMontosFinal
   for (var i = 0; i < array_cuentas.length; i++) {
     for (var j = 0; j < ArrMontosFinal.length; j++) {
       if (array_cuentas[i][0] == ArrMontosFinal[j][0]) {
         ArrMontosFinal[j] = array_cuentas[i];
       }
     }
   }
   ArrMontosFinal = agregarArregloUnDigito(ArrMontosFinal);

   return ArrMontosFinal;
 }

 function agregarArregloUnDigito(ArrMontosFinal) {

   var clase_aux = ArrMontosFinal[0][12];

   var array_aux_uno = new Array();
   array_aux_uno[0] = clase_aux;
   array_aux_uno[1] = ArrMontosFinal[0][13];
   array_aux_uno[2] = 0.0;
   array_aux_uno[3] = 0.0;
   array_aux_uno[4] = 0.0;
   array_aux_uno[5] = 0.0;
   array_aux_uno[6] = 0.0;
   array_aux_uno[7] = 0.0;
   array_aux_uno[8] = ArrMontosFinal[0][8];
   array_aux_uno[9] = ArrMontosFinal[0][9];
   array_aux_uno[10] = ArrMontosFinal[0][10];
   array_aux_uno[11] = ArrMontosFinal[0][11];
   array_aux_uno[12] = ArrMontosFinal[0][12];
   array_aux_uno[13] = ArrMontosFinal[0][13];
   array_aux_uno[14] = ArrMontosFinal[0][14];

   ArrMontosFinal.splice(0, 0, array_aux_uno);

   var array_cuentas = new Array();

   array_cuentas[0] = array_aux_uno;

   var cont = 1;

   //quiebre de grupo
   for (var i = 0; i < ArrMontosFinal.length; i++) {
     if (ArrMontosFinal[i][12] != clase_aux) {
       clase_aux = ArrMontosFinal[i][12];
       var array_aux = new Array();
       /* 0 -> cuenta
        * 1 -> denominacion
        * 2 -> debe antes
        * 3 -> haber antes
        * 4 -> debe actual
        * 5 -> haber actual
        * 6 -> debe nuevo saldo
        * 7 -> haber nuevo saldo
        */
       array_aux[0] = clase_aux;
       array_aux[1] = ArrMontosFinal[i][13];
       array_aux[2] = 0.0;
       array_aux[3] = 0.0;
       array_aux[4] = 0.0;
       array_aux[5] = 0.0;
       array_aux[6] = 0.0;
       array_aux[7] = 0.0;
       array_aux[8] = ArrMontosFinal[i][8];
       array_aux[9] = ArrMontosFinal[i][9];
       array_aux[10] = ArrMontosFinal[i][10];
       array_aux[11] = ArrMontosFinal[i][11];
       array_aux[12] = ArrMontosFinal[i][12];
       array_aux[13] = ArrMontosFinal[i][13];
       array_aux[14] = ArrMontosFinal[i][14]; 

       array_cuentas[cont] = array_aux;
       cont++;
       ArrMontosFinal.splice(i, 0, array_aux);
     }
   }
   //calcular montos de cuentas
   for (var i = 0; i < array_cuentas.length; i++) {
     for (var j = 0; j < ArrMontosFinal.length; j++) {
       if (array_cuentas[i][0] == ArrMontosFinal[j][12] && ArrMontosFinal[j][0].length == 6) {
         array_cuentas[i][2] += Number(ArrMontosFinal[j][2]);
         array_cuentas[i][3] += Number(ArrMontosFinal[j][3]);
         array_cuentas[i][4] += Number(ArrMontosFinal[j][4]);
         array_cuentas[i][5] += Number(ArrMontosFinal[j][5]);
         array_cuentas[i][6] += Number(ArrMontosFinal[j][6]);
         array_cuentas[i][7] += Number(ArrMontosFinal[j][7]);
       }
     }
   }
   //reemplazar array vacio del ArrMontosFinal
   for (var i = 0; i < array_cuentas.length; i++) {
     for (var j = 0; j < ArrMontosFinal.length; j++) {
       if (array_cuentas[i][0] == ArrMontosFinal[j][0]) {
         ArrMontosFinal[j] = array_cuentas[i];
       }
     }
   }

   return ArrMontosFinal;
 }

 function OrdenarPorPucs(ArrTemp) {
   ArrTemp.sort(sortFunction);

   function sortFunction(a, b) {
     if (a[0] === b[0]) {
       return 0;
     } else {
       return (a[0] < b[0]) ? -1 : 1;
     }
   }

   return ArrTemp;
 }

 function redondear(number) {
   return Math.round(Number(number) * 100) / 100;
 }

 function CambiarDataCuentasSaldoAnterior(ArrTemp) {
   var ArrReturn = [];
   var cont = 0;

   for (var i = 0; i < ArrTemp.length; i++) {
     for (var j = 0; j < ArrAccounts.length; j++) {
       if (ArrTemp[i][0] == ArrAccounts[j][0]) {
         var arr = [];

         arr[0] = ArrAccounts[j][8];
         arr[1] = ArrAccounts[j][9];
         arr[2] = ArrTemp[i][1];
         arr[3] = ArrTemp[i][2];
         arr[4] = 0.0;
         arr[5] = 0.0;
         arr[6] = ArrTemp[i][1];
         arr[7] = ArrTemp[i][2];
         arr[8] = ArrAccounts[j][6];
         arr[9] = ArrAccounts[j][7];
         arr[10] = ArrAccounts[j][4];
         arr[11] = ArrAccounts[j][5];
         arr[12] = ArrAccounts[j][2];
         arr[13] = ArrAccounts[j][3];
         arr[14] = ArrTemp[i][3];

         ArrReturn[cont] = arr;
         cont++;
       }
     }
   }

   return ArrReturn;
 }
 function CambiarDataCuentasMovimientos(ArrTemp) {
  var ArrReturn = [];
  var cont = 0;

  for (var i = 0; i < ArrTemp.length; i++) {
    for (var j = 0; j < ArrAccounts.length; j++) {
      if (ArrTemp[i][0] == ArrAccounts[j][0]) {
        var arr = [];

        arr[0] = ArrAccounts[j][8];
        arr[1] = ArrAccounts[j][9];
        arr[2] = 0.0;
        arr[3] = 0.0;
        arr[4] = ArrTemp[i][1];
        arr[5] = ArrTemp[i][2];
        arr[6] = ArrTemp[i][1];
        arr[7] = ArrTemp[i][2];
        arr[8] = ArrAccounts[j][6];
        arr[9] = ArrAccounts[j][7];
        arr[10] = ArrAccounts[j][4];
        arr[11] = ArrAccounts[j][5];
        arr[12] = ArrAccounts[j][2];
        arr[13] = ArrAccounts[j][3];
        arr[14] = ArrTemp[i][3];

        ArrReturn[cont] = arr;
        cont++;
      }
    }
  }

  return ArrReturn;
}

 function ObtenerData(isMov, isSpecific, condAdjust) {

    var ArrReturn = new Array();
    var cont = 0;
    
    var savedsearch = search.load({
      id: 'customsearch_lmry_co_mayor_balance_anual'
    });
   
    
    if (featureMultibook || featureMultibook == 'T') {
      log.debug("FEATURE MULTIBOOK",featureMultibook)
      
       
      if (isSpecific) {
        var specificFilter = search.createFilter({
          name: 'bookspecifictransaction',
          operator: search.Operator.IS,
          values: ['T']
        });
 
        savedsearch.filters.push(specificFilter);
      } else {
        
        var specificFilter = search.createFilter({
          name: 'bookspecifictransaction',
          operator: search.Operator.IS,
          values: ['F']
        });
 
        savedsearch.filters.push(specificFilter);
        
      }
      
      var multibookFilter = search.createFilter({
        name: 'accountingbook',
        join: 'accountingtransaction',
        operator: search.Operator.ANYOF,
        values: paramMultibook
      });
      savedsearch.filters.push(multibookFilter);

      //columna 3 reemplaza columna 0
      
      var columnaMultiAccount = search.createColumn({
        name: 'account',
        join: 'accountingtransaction',
        summary: 'GROUP'
      });
      savedsearch.columns.push(columnaMultiAccount);
 
      //columna 4 reemplaza columna 1
      var columnaDebit = search.createColumn({
        name: 'formulacurrency',
        formula: "{accountingtransaction.debitamount}",
        summary: 'SUM'
      });
      savedsearch.columns.push(columnaDebit);
 
      //columna 5 reemplaza columna 2
      var columnaCredit = search.createColumn({
        name: 'formulacurrency',
        formula: "{accountingtransaction.creditamount}",
        summary: 'SUM'
      });
      savedsearch.columns.push(columnaCredit);
     
    }
    
    
    //Movimiento
    if (isMov) {
     if (!condAdjust) {
      var periodFilter = search.createFilter({
        name: 'postingperiod',
        operator: search.Operator.IS,
        values: [paramPeriod]
      });
      savedsearch.filters.push(periodFilter);
      var adjustFilter = search.createFilter({
        name: 'isadjust',
        join: 'accountingperiod',
        operator: search.Operator.IS,
        values: false
      });
      savedsearch.filters.push(adjustFilter);
      if (paramAdjustment == 'T' && periodoAdjust == null && featurePeriodEnd) {
        var confiPeriodEnd = search.createSetting({
              name: 'includeperiodendtransactions',
              value: 'TRUE'
        })
        savedsearch.settings.push(confiPeriodEnd);
      };
      //Adjust marcado
      //VOLVER
     } else {
        var filtroPosting = search.createFilter({
          name: 'postingperiod',
          operator: search.Operator.IS,
          values: [periodoAdjust] 
        });
        savedsearch.filters.push(filtroPosting);
        if (featurePeriodEnd) {
          var confiPeriodEnd = search.createSetting({
            name: 'includeperiodendtransactions',
            value: 'TRUE'
          })
          savedsearch.settings.push(confiPeriodEnd);
        
      }
     }
     
   //Saldo Anterior
   } else {
     var period_year_init = format.parse({
       value: periodstartdate,
       type: format.Type.DATE
     }).getFullYear();
 
     var januaryFisrt = new Date(period_year_init, 0, 1);
 
     var format_january_first = format.format({
       value: januaryFisrt,
       type: format.Type.DATE
     });
 
 
     //Obtiene los periodos incluidos los periodos de ajuste
     var arrPeriods = getRangeDate(format_january_first,periodstartdate)
     //Si no hay periodos anteiores se regresa un [] como saldos anteriores
     if(arrPeriods.length == 0){
       return ArrReturn;
     }

     var formula = ObtenerFormulaFiltroPeriodo(arrPeriods)
     var periodFilter = search.createFilter({
         name: 'formulatext',
         operator: search.Operator.IS,
         values: '1',
         formula: formula
     });
   
     savedsearch.filters.push(periodFilter);
     //Cambio de filtros de fechas a id de periodos
 
     if (featurePeriodEnd) {
       var confiPeriodEnd = search.createSetting({
         name: 'includeperiodendtransactions',
         value: 'TRUE'
       })
       savedsearch.settings.push(confiPeriodEnd);
     }
   }
 
   
   if (featureSubsidiary || featureSubsidiary == 'T') {
    var subsidiaryFilter = search.createFilter({
      name: 'subsidiary',
      operator: search.Operator.IS,
      values: [paramSubsidiary]
    });
    savedsearch.filters.push(subsidiaryFilter);
  }
 
       var pagedData = savedsearch.runPaged({
         pageSize : 1000
       });
       var page, columns;
       
       pagedData.pageRanges.forEach(function(pageRange) { 
           page = pagedData.fetch({
               index : pageRange.index
           });
           page.data.forEach(function(result) {
               columns = result.columns;
       var arr = new Array();  
       var tranIdCamp = result.getValue(columns[4]);  
       if (featureMultibook || featureMultibook == 'T') {
         // 0. Account
         arr[0] = result.getValue(columns[5]);
         // 1. Debit
         arr[1] = result.getValue(columns[6]);
         // 2. Credit
         arr[2] = result.getValue(columns[7]);
         // 3.
         
            arr[3] = result.getText(columns[3]) + ' - ' + tranIdCamp;
          
        } else {
         // 0. Account
         arr[0] = result.getValue(columns[0]);
         // 1. Debit
         arr[1] = result.getValue(columns[1]);
         // 2. Credit
         arr[2] = result.getValue(columns[2]);
         // 3.
         
            arr[3] = result.getText(columns[3]) + ' - ' + tranIdCamp;
          
       }
       
       ArrReturn[cont] = arr;
       cont++;
               
           });
       });
 
    return ArrReturn;
  }

 function ObtenerCuentas() {
   var intDMinReg = 0;
   var intDMaxReg = 1000;

   var infoTxt = '';
   var DbolStop = false;

   var ArrReturn = new Array();
   var cont = 0;

   var busqueda = search.create({
     type: search.Type.ACCOUNT,
     filters: [
       ['custrecord_lmry_co_puc_d6_id', 'isnotempty', '']
     ],
     columns: ['internalid', 'number', 'custrecord_lmry_co_puc_d1_id', 'custrecord_lmry_co_puc_d1_description', 'custrecord_lmry_co_puc_d2_id', 'custrecord_lmry_co_puc_d2_description', 'custrecord_lmry_co_puc_d4_id', 'custrecord_lmry_co_puc_d4_description', 'custrecord_lmry_co_puc_d6_id', 'custrecord_lmry_co_puc_d6_description']
   });

   /*
    * 0. Internal ID
    * 1. Number
    * 2. puc 1 digit id
    * 3. puc 1 digit desc
    * 4. puc 2 digit id
    * 5. puc 2 digit desc
    * 6. puc 4 digit id
    * 7. puc 4 digit desc
    * 8. puc 6 digit id
    * 9. puc 6 digit desc
    */
   if (featureSubsidiary || featureSubsidiary == 'T') {
     var subsidiaryFilter = search.createFilter({
       name: 'subsidiary',
       operator: search.Operator.IS,
       values: [paramSubsidiary]
     });
     busqueda.filters.push(subsidiaryFilter);
   }

   var savedsearch = busqueda.run();

   while (!DbolStop) {
     var objResult = savedsearch.getRange(intDMinReg, intDMaxReg);

     if (objResult != null) {
       if (objResult.length != 1000) {
         DbolStop = true;
       }

       for (var i = 0; i < objResult.length; i++) {
         var columns = objResult[i].columns;

         var arrAuxiliar = new Array();

         //0. Internal Id
         if (objResult[i].getValue(columns[0]) != null && objResult[i].getValue(columns[0]) != '- None -' && objResult[i].getValue(columns[0]) != 'NaN' && objResult[i].getValue(columns[0]) != 'undefined')
           arrAuxiliar[0] = objResult[i].getValue(columns[0]);
         else
           arrAuxiliar[0] = '';
         //1. number
         if (objResult[i].getValue(columns[1]) != null && objResult[i].getValue(columns[1]) != '- None -' && objResult[i].getValue(columns[1]) != 'NaN' && objResult[i].getValue(columns[1]) != 'undefined')
           arrAuxiliar[1] = objResult[i].getValue(columns[1]);
         else
           arrAuxiliar[1] = '';
         //2. puc 1 id
         if (objResult[i].getText(columns[2]) != null && objResult[i].getText(columns[2]) != '- None -' && objResult[i].getText(columns[2]) != 'NaN' && objResult[i].getText(columns[2]) != 'undefined')
           arrAuxiliar[2] = objResult[i].getText(columns[2]);
         else
           arrAuxiliar[2] = '';
         //3. puc 1 des
         if (objResult[i].getValue(columns[3]) != null && objResult[i].getValue(columns[3]) != '- None -' && objResult[i].getValue(columns[3]) != 'NaN' && objResult[i].getValue(columns[3]) != 'undefined')
           arrAuxiliar[3] = objResult[i].getValue(columns[3]);
         else
           arrAuxiliar[3] = '';
         //4. puc 2 id
         if (objResult[i].getText(columns[4]) != null && objResult[i].getText(columns[4]) != '- None -' && objResult[i].getText(columns[4]) != 'NaN' && objResult[i].getText(columns[4]) != 'undefined')
           arrAuxiliar[4] = objResult[i].getText(columns[4]);
         else
           arrAuxiliar[4] = '';
         //5. puc 2 des
         if (objResult[i].getValue(columns[5]) != null && objResult[i].getValue(columns[5]) != '- None -' && objResult[i].getValue(columns[5]) != 'NaN' && objResult[i].getValue(columns[5]) != 'undefined')
           arrAuxiliar[5] = objResult[i].getValue(columns[5]);
         else
           arrAuxiliar[5] = '';
         //6. puc 4 id
         if (objResult[i].getText(columns[6]) != null && objResult[i].getText(columns[6]) != '- None -' && objResult[i].getText(columns[6]) != 'NaN' && objResult[i].getText(columns[6]) != 'undefined')
           arrAuxiliar[6] = objResult[i].getText(columns[6]);
         else
           arrAuxiliar[6] = '';
         //7. puc 4 des
         if (objResult[i].getValue(columns[7]) != null && objResult[i].getValue(columns[7]) != '- None -' && objResult[i].getValue(columns[7]) != 'NaN' && objResult[i].getValue(columns[7]) != 'undefined')
           arrAuxiliar[7] = objResult[i].getValue(columns[7]);
         else
           arrAuxiliar[7] = '';
         //8. puc 6 id
         if (objResult[i].getText(columns[8]) != null && objResult[i].getText(columns[8]) != '- None -' && objResult[i].getText(columns[8]) != 'NaN' && objResult[i].getText(columns[8]) != 'undefined')
           arrAuxiliar[8] = objResult[i].getText(columns[8]);
         else
           arrAuxiliar[8] = '';
         //9. puc 6 id
         if (objResult[i].getValue(columns[9]) != null && objResult[i].getValue(columns[9]) != '- None -' && objResult[i].getValue(columns[9]) != 'NaN' && objResult[i].getValue(columns[9]) != 'undefined')
           arrAuxiliar[9] = objResult[i].getValue(columns[9]);
         else
           arrAuxiliar[9] = '';

         if (arrAuxiliar[9] != null && arrAuxiliar[9] != '') {
           ArrReturn[cont] = arrAuxiliar;
           cont++;
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

   return ArrReturn;
 }

 function ObtenerDatosSubsidiaria() {
   configpage = config.load({
     type: config.Type.COMPANY_INFORMATION
   });

   companyruc = configpage.getValue('employerid');
   companyname = configpage.getValue('legalname');

   if (featureSubsidiary) {
     if (featureMultipCalendars || featureMultipCalendars == 'T') {
       var subsidyName = search.lookupFields({
         type: search.Type.SUBSIDIARY,
         id: paramSubsidiary,
         columns: ['legalname', 'taxidnum', 'fiscalcalendar', 'taxfiscalcalendar']
       });
       //NO SE VALIDA EL CAMPO FISCAL/TAX CALENDAR PORQUE ES OBLIGATORIO EN LA SUBSIDIARIA
       calendarSubsi = {
           id: subsidyName.fiscalcalendar[0].value,
           nombre: subsidyName.fiscalcalendar[0].text
       }
       calendarSubsi = JSON.stringify(calendarSubsi);

       taxCalendarSubsi = {
           id: subsidyName.taxfiscalcalendar[0].value,
           nombre: subsidyName.taxfiscalcalendar[0].text
       }
       taxCalendarSubsi = JSON.stringify(taxCalendarSubsi);
     }
     companyruc = ObtainFederalIdSubsidiaria(paramSubsidiary);
     companyname = ObtainNameSubsidiaria(paramSubsidiary);
   } else {
     companyruc = configpage.getValue('employerid');
     companyname = configpage.getValue('alegalname');
   }
   log.debug('subsidiary',{name:companyname,ruc:companyruc})
   companyruc = companyruc.replace(' ', '');
 }

 function ObtainNameSubsidiaria(subsidiary) {
   try {
     if (subsidiary != '' && subsidiary != null) {
       var subsidyName = search.lookupFields({
         type: search.Type.SUBSIDIARY,
         id: subsidiary,
         columns: ['legalname']
       });

       return subsidyName.legalname
     }
   } catch (err) {
     //libreria.sendMail(LMRY_script, ' [ ObtainNameSubsidiaria ] ' + err);
   }
 }

 function ObtainFederalIdSubsidiaria(subsidiary) {
   try {
     if (subsidiary != '' && subsidiary != null) {
       var federalId = search.lookupFields({
         type: search.Type.SUBSIDIARY,
         id: subsidiary,
         columns: ['taxidnum']
       });

       return federalId.taxidnum
     }
   } catch (err) {
     //libreria.sendMail(LMRY_script, ' [ ObtainFederalIdSubsidiaria ] ' + err);
   }
 }

 function ValidarAcentos(s) {
    var AccChars = "ŠŽšžŸÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðñòóôõöùúûüýÿ&°–—ªº·";
    var RegChars = "SZszYAAAAAACEEEEIIIIDNOOOOOUUUUYaaaaaaceeeeiiiidnooooouuuuyyyo--ao.";
 
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

 function ordenarFormatoFechas(periodoDate) {
   var tempdateReporte = format.parse({
     value: periodoDate,
     type: format.Type.DATE
   });

   var dayReport = tempdateReporte.getDate();

   if (('' + dayReport).length == 1) {
     dayReport = '0' + dayReport;
   } else {
     dayReport = dayReport + '';
   }

   var monthReport = tempdateReporte.getMonth() + 1;

   if (('' + monthReport).length == 1) {
     monthReport = '0' + monthReport;
   } else {
     monthReport = monthReport + '';
   }

   var yearReport = tempdateReporte.getFullYear();

   periodoDate = dayReport + '/' + monthReport + '/' + yearReport;

   return periodoDate;
 }

 function obtenerPeriodoAdjustment() {
  var paramPeriodAdjust;
  var firstDay;
  var lastDay;

  var columnFrom = search.lookupFields({
      type: 'accountingperiod',
      id: paramPeriod,
      columns: ['enddate','startdate']
  });
  firstDay = columnFrom.startdate;
  lastDay = columnFrom.enddate;

  var savedsearch = search.create({
      type: "accountingperiod",
      filters:
      [
         ["isinactive","is","F"], 
         "AND", 
         ["isadjust","is","T"], 
         "AND", 
         ["startdate","onorafter",firstDay], 
         "AND", 
         ["enddate","onorbefore",lastDay]
      ],
      columns:
      [
         search.createColumn({
            name: "periodname",
            summary: "GROUP",
            sort: search.Sort.ASC,
            label: "Name"
         }),
         search.createColumn({
            name: "internalid",
            summary: "GROUP",
            label: "Internal ID"
         })
      ]
  });
  var pagedData = savedsearch.runPaged({
      pageSize: 1000
    });

    pagedData.pageRanges.forEach(function(pageRange) {
      var page = pagedData.fetch({
        index: pageRange.index
      });

      page.data.forEach(function(result) {
        var columns = result.columns;
        paramPeriodAdjust = result.getValue(columns[1]);
      })
    });

  return paramPeriodAdjust;
}



function getGlobalLabels() {
    var labels = {
        "Alert1": {
            "es": "LIBRO MAYOR Y BALANCE ANUAL",
            "en": "ANNUAL LEDGER AND BALANCE",
            "pt": "LEDGER ANUAL E EQUILÍBRIO"
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
            "es": "Cuenta",
            "en": "Account",
            "pt": "Conta"
        },
        "Alert6": {
            "es": "Denominación",
            "en": "Denomination",
            "pt": "Denominação"
        },
        "Alert7": {
            "es": "Saldo Anterior",
            "en": "Previous Balance",
            "pt": "Saldo Anterior"
        },
        "Alert8": {
            "es": "Movimiento",
            "en": "Movement",
            "pt": "Movimento"
        },
        "Alert9": {
            "es": "Nuevo Saldo",
            "en": "New Balance",
            "pt": "Novo balanço"
        },
        "Alert10": {
            "es": "Debe",
            "en": "Debit",
            "pt": "Débito"
        },
        "Alert11": {
            "es": "Haber",
            "en": "Credit",
            "pt": "Crédito"
        },
        "Alert12": {
            "es": "No existe informacion para los criterios seleccionados",
            "en": "There is no information for the selected criteria",
            "pt": "Não há informações para os critérios selecionados"
        },
        "Alert13": {
            "es": "TOTALES",
            "en": "TOTALS",
            "pt": "TOTAIS"
        },
        "Alert14": {
          "es": "Documento",
          "en": "Document",
          "pt": "Documento"
        }
    };
 
    return labels;
 }

function getRangeDate(inicio,fin){
    var arr = [];
  
            var savedSearch = search.create({
                type: search.Type.ACCOUNTING_PERIOD,
                filters:
                [
                   ["isinactive","is","F"],  
                   "AND", 
                   ["isquarter","is","F"],
                   "AND", 
                   ["isyear","is","F"],
                   "AND", 
                    ["startdate","onorafter",inicio], 
                    "AND", 
                    ["startdate","before",fin]
                ],
                columns:
                [
                   search.createColumn({
                      name: "periodname",
                      sort: search.Sort.ASC,
                      label: "Name"
                   }),
                   search.createColumn({
                      name: "internalid",
                      label: "Internal ID"
                   }),
                ]
             });
  
             var searchResult = savedSearch.run().getRange(0, 100);
             for (var index = 0; index < searchResult.length; index++) {
                 var columns = searchResult[index].columns;
                 arr.push(searchResult[index].getValue(columns[1]))
             }
        
    return arr;
  } 
  
  function ObtenerFormulaFiltroPeriodo(arr) {
  
    var formula = 'CASE WHEN ';
  
            for (var i = 0; i < arr.length; i++) {
                formula += "{postingperiod.id} = '" + arr[i] + "'";
                if (i != arr.length - 1) {
                    formula += ' OR ';
                }
            }
        
  
    formula += ' THEN 1 ELSE 0 END';
    return formula
  }


 return {
   execute: execute
 };

});