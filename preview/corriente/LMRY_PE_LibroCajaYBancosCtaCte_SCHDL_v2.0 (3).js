/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                       ||
||                                                                ||
||  File Name: LMRY_PE_LibroCajaYBancosCtaCte_SCHDL_v2.0.js       ||
||                                                                ||
||  Version       Date            Author              Remarks     ||
||    2.0    03 Octubre 2022  Giussepe Delgado    Use Script 2.0  ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
define(["N/record", "N/runtime", "N/file", "N/search",
  "N/format", "N/log", "./PE_Library_Mensual/LMRY_PE_Reportes_LBRY_V2.0.js"
],

  function (recordModulo, runtime, fileModulo, search, format, log, libreria) {
    var NAME_REPORT = "Libro de Caja y Bancos Cuenta Corriente 2.0";
    var LMRY_SCRIPT = 'LMRY_PE_LibroCajaYBancosCtaCte_SCHDL_v2.0.js';
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

    var libraryRPT = null;

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
    var ArrPlanCta = new Array(); 
    var ArrCtaCte = new Array();
    var ArrSaldoInic = new Array();
    var ArrSaldoFinal = new Array();
    var arrTransactions = new Array();
    var strSaldoInicial = '';
    var strMovimiento = '';
    var strSaldoFinal = '';
    var strName = '';
    var fileNumber = 0;
    var file_size = 7340032
    function execute(context) {
      try {
        getLibraryRPT();
        getParametersAndFeatures();
        getTransactions();
        ObtieneCajaBancoPC();
        GeneraMovimientos();
        GeneraSaldoInicial();
        GeneraSaldoFinal();

        if (strSaldoInicial != '' || strSaldoFinal != '') {
          GeneraLibroCajaBanco();
          //log.error('peso del archivo: ', lengthInUtf8Bytes(strName));
          if (fileNumber != 0) {
            fileNumber = Number(fileNumber) + 1;
          }

          savefile();
        } else {
          noData();
        }
        
      } catch (error) {

        libreria.sendMail(LMRY_SCRIPT, ' [ execute] ' + error);
        updateLogGenerator('error');
        log.error("[ execute]", error);
      }
    }

    function getLibraryRPT() {
      try {

          require(["/SuiteBundles/Bundle 37714/Latam_Library/LMRY_LibraryReport_LBRY_V2.js"], function(library) {
              libraryRPT = library;
          });
          log.debug('libraryRPT', 'Bundle 37714');

      } catch (err) {

          try {
              require(["/SuiteBundles/Bundle 35754/Latam_Library/LMRY_LibraryReport_LBRY_V2.js"], function(library) {
                  libraryRPT = library;
              });

              log.debug('libraryRPT', 'Bundle 35754');
          } catch (err) {

              log.error('libraryRPT', 'No se encuentra libreria');
          }
      }

  }

    function getParametersAndFeatures() {
      var INFO = objContext.getParameter({
        name: 'custscript_lmry_pe_cte_para_global'
      });
      INFO = JSON.parse(INFO);
      log.error("Share Data", INFO);
      PARAMETERS = INFO.parameters;
      FEATURES = INFO.features;
      COMPANY = INFO.company;
      PERIOD_SPECIAL = INFO.period_Special;
      multibookName = INFO.multibookName;
      periodEndDate = INFO.periodEndDate;
      periodStartDate = INFO.periodStartDate;
      periodName = INFO.periodName;
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
      sortTransactions();
    }

    function sortTransactions() {
      arrTransactions.forEach(function (transaction) {
        if (transaction[24] == 'SI') {
          ArrSaldoInic.push(transaction);
        } else if (transaction[24] == 'SF') {
          ArrSaldoFinal.push(transaction);
        } else if (transaction[24] == 'MOV') {
          ArrCtaCte.push(transaction);
        }
      });
    }

    function ObtieneCajaBancoPC() {
    
      var arrTemp = new Array();
      var savedsearch = search.load({
        //LatamReady PE 1.2Book cash and banks Current account Plan de Cuentas
        id: 'customsearch_lmry_pe_cajaybancos_plancta'
      })
      // Valida si es OneWorld

      if (FEATURES.SUBSID) {
        var subsidiaryFilter = search.createFilter({
          name: 'subsidiary',
          operator: search.Operator.IS,
          values: [PARAMETERS.SUBSID]
        });
        savedsearch.filters.push(subsidiaryFilter);
      }
      //log.error('Este parametro toma para paramsubsidi', PARAMETERS.SUBSID);


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

          //0. NUMCTA
          if (result.getValue(columns[0]) != null)
            arrTemp[0] = result.getValue(columns[0]);
          else
            arrTemp[0] = '';
          //1. DESC
          if (result.getValue(columns[1]) != null) {
            var _tipo = result.getValue(columns[1]);
            arrTemp[1] = _tipo;
          } else
            arrTemp[1] = '';
          //2. CODPLAN
          if (result.getValue(columns[2]) != null)
            arrTemp[2] = result.getValue(columns[2]);
          else
            arrTemp[2] = '';
          //3. CODPLANDESC
          if (result.getValue(columns[3]) != null) {
            var _tipo = result.getValue(columns[3]);
            arrTemp[3] = _tipo;
          } else
            arrTemp[3] = '';
          //4. RESUMEN
          if (result.getValue(columns[4]) != null) {
            var _tipo = result.getValue(columns[4]);
            arrTemp[4] = _tipo;
          } else
            arrTemp[4] = '';
          //5. COD_EF
          if (result.getValue(columns[5]) != null)
            arrTemp[5] = result.getValue(columns[5]);
          else
            arrTemp[5] = '';
          //6. NUMCTA_BANCO
          if (result.getValue(columns[6]) != null)
            arrTemp[6] = result.getValue(columns[6]);
          else
            arrTemp[6] = '';

          ArrPlanCta.push(arrTemp);
          
        });
      });
        
    }

    function GeneraMovimientos() {
      strMovimiento = '';
      //strSaldoFinal = '';
      auxdia = '00';
      //  var _periodo = auxanio + auxmess + auxdia;
      // var _period = auxanio + auxmess;
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

      if (PERIOD_SPECIAL.arrPeriodSpecial.length > 0) {
        AAAA = PERIOD_SPECIAL.YYYY_inicial;
        MM = PERIOD_SPECIAL.MM_inicial;
      }

      if (('' + MM).length == 1) {
        MM = '0' + MM;
      }
      AAAA = AAAA + '';
      MM = MM + '';
      var _periodo = AAAA + MM + '00';
      var _period = AAAA + MM;


      var movimiento1 = '';
      var num2 = 0;
      for (var i = 0; i <= ArrPlanCta.length - 1; i++) {
        var _CtaCont = ArrPlanCta[i][0];
        if (ArrCtaCte.length > 0) {
          var contNcorreltivo=0;
          var idTemporal='';
          for (var ii = 0; ii <= ArrCtaCte.length - 1; ii++) {
            if (_CtaCont == ArrCtaCte[ii][4]) {

              //- CTACONT
              strMovimiento += ArrCtaCte[ii][4] + '|';
              //0. PERIODO
              if (ArrCtaCte[ii][23] != null && ArrCtaCte[ii][23] != '' && ArrCtaCte[ii][23] != ' ') {

                strMovimiento += ArrCtaCte[ii][23] + '|';

              } else {
                strMovimiento += _periodo + '|';
              }

              //1. CUO
              strMovimiento += RellenaTexto(ArrCtaCte[ii][1], 40, 'C') + '|';
              //2. NUMERO CORRELATIVO DE ASIENTO
              var valorCorrelativo='';

              if(idTemporal==ArrCtaCte[ii][1]){
                contNcorreltivo++;
                valorCorrelativo = "M" + completar_cero(3,contNcorreltivo);
                strMovimiento += RellenaTexto(valorCorrelativo, 10, 'C') + '|';
                log.debug('strComprasNoDomi',strMovimiento);
              }else{
                contNcorreltivo=1;
                valorCorrelativo = "M" + completar_cero(3,contNcorreltivo);
                strMovimiento += RellenaTexto(valorCorrelativo, 10, 'C') + '|';
                log.debug('strComprasNoDomi',strMovimiento);
              }
              idTemporal=ArrCtaCte[ii][1];
              
              //3. CODIGO DE LA ENTIDAD FINANCIERA DONDE SE ENCUENTRA SU CUENTA BANCARIA
              strMovimiento += RellenaTexto(ArrCtaCte[ii][3], 2, 'N') + '|';
              //4. CODIGO DE LA CUENTA BANCARIA DEL CONTRIBUYENTE
              strMovimiento += RellenaTexto(ArrCtaCte[ii][5], 30, 'C') + '|';
              //5. FECHA DE OPERACION
              strMovimiento += ArrCtaCte[ii][6] + '|';
              //6. MEDIO DE PAGO UTILIZADO EN LA OPERACION BANCARIA
              strMovimiento += RellenaTexto(ArrCtaCte[ii][7], 3, 'N') + '|';
              //7. DESCRIPCION DE LA OPERACION BANCARIA
              strMovimiento += RellenaTexto(ArrCtaCte[ii][8], 100, 'C') + '|';
              //8. TIPO DE DOCUMENTO DE IDENTIDAD DEL GIRADOR O DEL BENEFICIARIO
              //log.error('ArrCtaCte[ii][9]', ArrCtaCte[ii][9]);
              strMovimiento += ArrCtaCte[ii][9] + '|';
              //9. NUMERO DE DOCUMENTO DE IDENTIDAD DEL GIRADOR O DEL BENEFICIARIO
              //log.error('ArrCtaCte[ii][10]', ArrCtaCte[ii][10]);
              strMovimiento += RellenaTexto(ArrCtaCte[ii][10], 15, 'C') + '|';
              //10. APELLIDOS Y NOMBRES DENOMINACION O RAZON SOCIAL DEL GIRADOR O BENEFICIARIO
              strMovimiento += RellenaTexto(ArrCtaCte[ii][11], 100, 'C') + '|';
              //11. NUMERO DE TRANSACCION BANCARIA
              strMovimiento += RellenaTexto(ArrCtaCte[ii][12], 20, 'C') + '|';
              //12. PARTE DEUDORA DE SALDOS Y MOVIMIENTOS
              if (ArrCtaCte[ii][13] == '') {
                strMovimiento += '0.00|';
              } else {
                strMovimiento += parseFloat(ArrCtaCte[ii][13]).toFixed(2) + '|';
              }

              //13. PARTE ACREEDORA DE SALDOS Y MOVIMIENTOS
              if (ArrCtaCte[ii][14] == '') {
                strMovimiento += '0.00|';
              } else {
                strMovimiento += parseFloat(ArrCtaCte[ii][14]).toFixed(2) + '|';
              }
              //14. INDICA EL ESTADO DE LA OPERACION
              /*
       var dFecTra = ArrCtaCte[ii][17]; // Fecha
       var dFecIni = ArrCtaCte[ii][15]; // Periodo Inicial
       var dFecFin = ArrCtaCte[ii][16]; // Periodo Final

       var comparacion1 = compararFechas(dFecTra, dFecIni);
       var comparacion2 = compararFechas(dFecTra, dFecFin);

       if (comparacion1 != "menor") {
         if (comparacion2 != "mayor") {
           strMovimiento += "1";
         }else{
           strMovimiento += "8";
         }
       }else{
         strMovimiento += "8";
       }
       */

              if (ArrCtaCte[ii][23] != null && ArrCtaCte[ii][23] != '' && ArrCtaCte[ii][23] != ' ') {

                var mes1 = _periodo.substr(4, 2);
                var año1 = _periodo.substr(0, 4);
                var UpdateMonth = ArrCtaCte[ii][23].substring(4, 6);
                var UpdateYear = ArrCtaCte[ii][23].substring(0, 4);
                if (Number(UpdateYear) == Number(año1) && Number(UpdateMonth) == Number(mes1)) {
                  strMovimiento += "1";
                } else {
                  strMovimiento += "8";
                }
              } else {
                strMovimiento += "1";
              }

              strMovimiento += "|";

              strMovimiento += '\r\n';
            }

          }
        } else {
          strMovimiento = '';
        }
      }

    }
       
    function GeneraSaldoInicial() {
      //strSaldoInicial = '';
      auxdia = '00';
      // var _period = auxanio + auxmess;
      //var _periodo = auxanio + auxmess + auxdia;
      // var _period = auxanio + auxmess;
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

      if (PERIOD_SPECIAL.arrPeriodSpecial.length > 0) {
        AAAA = PERIOD_SPECIAL.YYYY_inicial + '';
        MM = PERIOD_SPECIAL.MM_inicial + '';
      }

      if (('' + MM).length == 1) {
        MM = '0' + MM;
      }
      AAAA = AAAA + '';
      MM = MM + '';
      var _periodo = AAAA + MM + '00';
      var _period = AAAA + MM + '';
      var bFlag = false;
      //var si=ArrSaldoInic.length;
      var xa = 0;
      var x = 0;
      w = new Array()



      for (var i = 0; i <= ArrPlanCta.length - 1; i++) {
        var _CtaCont = ArrPlanCta[i][0];

        if (ArrSaldoInic.length > 0) {
          bFlag = false;
          for (var ii = 0; ii <= ArrSaldoInic.length - 1; ii++) {

            if (_CtaCont == ArrSaldoInic[ii][4]) {
              /*---CARGA LA INFORMACION DE SALDOS INICIALES---*/
              bFlag = true;
              //- CTACONT
              strSaldoInicial += ArrSaldoInic[ii][4] + '|';
              //0. PERIODO
              strSaldoInicial += _periodo + '|';
              //1. CUO
              var _CUOSI = 'SI' + ArrSaldoInic[ii][5] + _period;
              strSaldoInicial += RellenaTexto(_CUOSI, 40, 'C') + '|';
              //2. NUMERO CORRELATIVO DE ASIENTO
              strSaldoInicial += RellenaTexto('A' + _CUOSI, 10, 'C') + '|';
              //3. CODIGO DE LA ENTIDAD FINANCIERA DONDE SE ENCUENTRA SU CUENTA BANCARIA
              strSaldoInicial += RellenaTexto(ArrSaldoInic[ii][3], 2, 'N') + '|';
              //4. CODIGO DE LA CUENTA BANCARIA DEL CONTRIBUYENTE
              strSaldoInicial += RellenaTexto(ArrSaldoInic[ii][5], 30, 'C') + '|';
              //5. FECHA DE LA OPERACION
              strSaldoInicial += transformarFecha(periodstartdate) + '|'; //periodstartdate
              //6. MEDIO DE PAGO UTILIZADO EN LA OPERACION BANCARIA
              strSaldoInicial += '999|';
              //7. DESCRIPCION DE LA OPERACION BANCARIA
              strSaldoInicial += RellenaTexto('SALDO INICIAL', 100, 'C') + '|';
              //8. TIPO DE DOCUMENTO DE IDENTIDAD DEL GIRADOR O BENEFICIARIO
              strSaldoInicial += '6|';
              //9. NUMERO DE DOCUMENTO DE IDENTIDAD DEL GIRADOR O BENEFICIARIO
              strSaldoInicial += RellenaTexto(COMPANY.RUC, 15, 'C') + '|';
              //10. APELLIDOS Y NOMBRES DENOMINACION O RAZON SOCIAL DEL GIRADOR O BENEFICIARIO
              strSaldoInicial += RellenaTexto(COMPANY.NAME, 100, 'C') + '|';
              //11. NUMERO DE TRANSACCION BANCARIA
              strSaldoInicial += RellenaTexto(ArrSaldoInic[ii][11], 20, 'C') + '|';
              //12. PARTE DEUDORA DE SALDOS Y MOVIMIENTOS
              if (parseFloat(ArrSaldoInic[ii][12]) >= 0) {
                strSaldoInicial += parseFloat(ArrSaldoInic[ii][12]).toFixed(2) + '|';
              } else {
                strSaldoInicial += '0.00|';
              }
              //13. PARTE ACREEDORA DE SALDOS Y MOVIMIENTOS
              if (parseFloat(ArrSaldoInic[ii][12]) < 0) {
                strSaldoInicial += Math.abs(parseFloat(ArrSaldoInic[ii][12])).toFixed(2) + '|';
              } else {
                strSaldoInicial += '0.00|';
              }

              //14. INDICA EL ESTADO DE LA OPERACION
              strSaldoInicial += '1|';

              strSaldoInicial += '\r\n';
              for (var k = 0; k <= ArrCtaCte.length - 1; k++) {
                if (ArrCtaCte[k][5] == ArrSaldoInic[ii][5]) {
                  x++;
                }
              }
              w[xa] = _CtaCont;
              xa++;

            }
          } 
        } else if (ArrSaldoInic.length == 0 && ArrCtaCte.length != 0) //En caso no tenga saldos iniciales
        {
          var dd = true;

          for (var ii = 0; ii <= ArrCtaCte.length - 1; ii++) {

            for (var j = 0; j <= w.length - 1; j++) {
              if (w[j] == _CtaCont) {
                dd = false;
              }
            }

            if (_CtaCont == ArrCtaCte[ii][4] && dd == true) {
              //- CTACONT
              strSaldoInicial += ArrCtaCte[ii][4] + '|';
              //0. PERIODO
              strSaldoInicial += _periodo + '|';
              //1. CUO
              var _CUOSI = 'SI' + ArrPlanCta[i][6] + _period;
              strSaldoInicial += RellenaTexto(_CUOSI, 40, 'C') + '|';
              //2. NUMERO CORRELATIVO DE ASIENTO
              strSaldoInicial += RellenaTexto('A' + _CUOSI, 10, 'C') + '|';
              //3. CODIGO DE LA ENTIDAD FINANCIERA DONDE SE ENCUENTRA SU CUENTA BANCARIA
              strSaldoInicial += RellenaTexto(ArrPlanCta[i][5], 2, 'N') + '|';
              //4. CODIGO DE LA CUENTA BANCARIA DEL CONTRIBUYENTE
              strSaldoInicial += RellenaTexto(ArrPlanCta[i][6], 30, 'C') + '|';
              //5. FECHA DE LA OPERACION
              strSaldoInicial += transformarFecha(periodstartdate) + '|';
              //6. MEDIO DE PAGO UTILIZADO EN LA OPERACION BANCARIA
              strSaldoInicial += '999|';
              //7. DESCRIPCION DE LA OPERACION BANCARIA
              strSaldoInicial += RellenaTexto('SALDO INICIAL', 100, 'C') + '|';
              //8. TIPO DE DOCUMENTO DE IDENTIDAD DEL GIRADOR O BENEFICIARIO
              strSaldoInicial += '6|';
              //9. NUMERO DE DOCUMENTO DE IDENTIDAD DEL GIRADOR O BENEFICIARIO
              strSaldoInicial += RellenaTexto(COMPANY.RUC, 15, 'C') + '|';
              //10. APELLIDOS Y NOMBRES DENOMINACION O RAZON SOCIAL DEL GIRADOR O BENEFICIARIO
              strSaldoInicial += RellenaTexto(COMPANY.NAME, 100, 'C') + '|';
              //11. NUMERO DE TRANSACCION BANCARIA
              strSaldoInicial += RellenaTexto('SALDO INICIAL', 20, 'C') + '|';
              //12. PARTE DEUDORA DE SALDOS Y MOVIMIENTOS
              strSaldoInicial += '0.00|';
              //13. PARTE ACREEDORA DE SALDOS Y MOVIMIENTOS
              strSaldoInicial += '0.00|';
              //14. INDICA EL ESTADO DE LA OPERACION
              strSaldoInicial += '1|';

              strSaldoInicial += '\r\n';

              /*for (var k = 0; k <= ArrCtaCte.length - 1; k++){
                if(ArrCtaCte[k][5] == ArrSaldoInic[ii][5]){
                  x++;
                }
              }*/

              w[xa] = _CtaCont;
              xa++;
            }
          }
        } else {
          strSaldoInicial = '';
        }
      }
      if (x < ArrCtaCte.length && ArrSaldoInic.length > 0) {


        for (var i = 0; i <= ArrPlanCta.length - 1; i++) {
          var _CtaCont = ArrPlanCta[i][0];
          var aa;
          var bb = true;
          var cc = true;
          //
          for (var j = 0; j <= w.length - 1; j++) {
            if (w[j] == _CtaCont) {
              cc = false;
            }
          }

          for (var ii = 0; ii <= ArrCtaCte.length - 1; ii++) {
            aa = ArrCtaCte[ii][5];

            if (_CtaCont == ArrCtaCte[ii][4] && bb == true && cc == true) {
              //- CTACONT
              strSaldoInicial += ArrCtaCte[ii][4] + '|';
              //0. PERIODO
              strSaldoInicial += _periodo + '|';
              //1. CUO
              var _CUOSI = 'SI' + ArrPlanCta[i][6] + _period;
              strSaldoInicial += RellenaTexto(_CUOSI, 40, 'C') + '|';
              //2. NUMERO CORRELATIVO DE ASIENTO
              strSaldoInicial += RellenaTexto('A' + _CUOSI, 10, 'C') + '|';
              //3. CODIGO DE LA ENTIDAD FINANCIERA DONDE SE ENCUENTRA SU CUENTA BANCARIA
              strSaldoInicial += RellenaTexto(ArrPlanCta[i][5], 2, 'N') + '|';
              //4. CODIGO DE LA CUENTA BANCARIA DEL CONTRIBUYENTE
              strSaldoInicial += RellenaTexto(ArrPlanCta[i][6], 30, 'C') + '|';
              //5. FECHA DE LA OPERACION
              strSaldoInicial += transformarFecha(periodstartdate) + '|';
              //6. MEDIO DE PAGO UTILIZADO EN LA OPERACION BANCARIA
              strSaldoInicial += '999|';
              //7. DESCRIPCION DE LA OPERACION BANCARIA
              strSaldoInicial += RellenaTexto('SALDO INICIAL', 100, 'C') + '|';
              //8. TIPO DE DOCUMENTO DE IDENTIDAD DEL GIRADOR O BENEFICIARIO
              strSaldoInicial += '6|';
              //9. NUMERO DE DOCUMENTO DE IDENTIDAD DEL GIRADOR O BENEFICIARIO
              strSaldoInicial += RellenaTexto(COMPANY.RUC, 15, 'C') + '|';
              //10. APELLIDOS Y NOMBRES DENOMINACION O RAZON SOCIAL DEL GIRADOR O BENEFICIARIO
              strSaldoInicial += RellenaTexto(COMPANY.NAME, 100, 'C') + '|';
              //11. NUMERO DE TRANSACCION BANCARIA
              strSaldoInicial += RellenaTexto('SALDO INICIAL', 20, 'C') + '|';
              //12. PARTE DEUDORA DE SALDOS Y MOVIMIENTOS
              strSaldoInicial += '0.00|';
              //13. PARTE ACREEDORA DE SALDOS Y MOVIMIENTOS
              strSaldoInicial += '0.00|';
              //14. INDICA EL ESTADO DE LA OPERACION
              strSaldoInicial += '1|';

              strSaldoInicial += '\r\n';
              xa++;
              break;
            }
            if ((ii + 1) >= ArrCtaCte.length) {
              break;
            } else {
              if (aa != ArrCtaCte[ii + 1][5]) {
                bb = true;
              } else {
                bb = false;
              }
            }

            if ((ii + 1) < ArrCtaCte.length) {
              if (aa != ArrCtaCte[ii + 1][5]) {
                bb = true;
              } else {
                bb = false;
              }
            }
          }
        }
      }

    }

    function GeneraSaldoFinal() {
      //strSaldoFinal = '';
      auxdia = '00';

      // var _period = auxanio + auxmess;
      var periodenddate_temp = search.lookupFields({
        type: search.Type.ACCOUNTING_PERIOD,
        id: PARAMETERS.PERIOD,
        columns: ['startdate', 'enddate', 'periodname']
      });

      var periodstartdate = periodenddate_temp.startdate;
      //log.error('periodstartdate1', periodstartdate);
      periodstartdate = format.parse({
        value: periodstartdate,
        type: format.Type.DATE
      });
      var AAAA = periodstartdate.getFullYear();
      AAAA = Number(AAAA).toFixed(0);
      var MM = Number(periodstartdate.getMonth()) + 1;

      if (PERIOD_SPECIAL.arrPeriodSpecial.length > 0) {
        AAAA = PERIOD_SPECIAL.YYYY_inicial + '';
        MM = PERIOD_SPECIAL.MM_inicial + '';
      }

      if (('' + MM).length == 1) {
        MM = '0' + MM;
      }

      AAAA = AAAA + '';
      MM = MM + '';
      var _periodo = AAAA + MM + '00';
      var _period = AAAA + MM + '';
      //var _periodo = auxanio + auxmess + auxdia;
      var bFlag = false;

      for (var i = 0; i <= ArrPlanCta.length - 1; i++) {
        var _CtaCont = ArrPlanCta[i][0];
        if (ArrSaldoFinal.length > 0) {
          bFlag = false;
          for (var ii = 0; ii <= ArrSaldoFinal.length - 1; ii++) {
            if (_CtaCont == ArrSaldoFinal[ii][4]) {
              /*---CARGA LA INFORMACION DE SALDOS FINALES---*/
              bFlag = true;
              //- CTACONT
              strSaldoFinal += ArrSaldoFinal[ii][4] + '|';
              //0. PERIODO
              strSaldoFinal += _periodo + '|';
              //1. CUO
              var _CUOSF = 'SF' + ArrSaldoFinal[ii][5] + _period;
              strSaldoFinal += RellenaTexto(_CUOSF, 40, 'C') + '|';
              //2. NUMERO CORRELATIVO DE ASIENTO
              strSaldoFinal += RellenaTexto('C' + _CUOSF, 10, 'C') + '|';
              //3. CODIGO DE LA ENTIDAD FINANCIERA DONDE SE ENCUENTRA SU CUENTA BANCARIA
              strSaldoFinal += RellenaTexto(ArrSaldoFinal[ii][3], 2, 'N') + '|';
              //4. CODIGO DE LA CUENTA BANCARIA DEL CONTRIBUYENTE
              strSaldoFinal += RellenaTexto(ArrSaldoFinal[ii][5], 30, 'C') + '|';
              //5. FECHA DE LA OPERACION
              strSaldoFinal += transformarFecha(periodEndDate) + '|'; //periodenddate
              //6. MEDIO DE PAGO UTILIZADO EN LA OPERACION BANCARIA
              strSaldoFinal += '999|';
              //7. DESCRIPCION DE LA OPERACION BANCARIA
              strSaldoFinal += RellenaTexto('SALDO FINAL', 100, 'C') + '|';
              //8. TIPO DE DOCUMENTO DE IDENTIDAD DEL GIRADOR O BENEFICIARIO
              strSaldoFinal += '6|';
              //9. NUMERO DE DOCUMENTO DE IDENTIDAD DEL GIRADOR O BENEFICIARIO
              strSaldoFinal += RellenaTexto(COMPANY.RUC, 15, 'C') + '|';
              //10. APELLIDOS Y NOMBRES DENOMINACION O RAZON SOCIAL DEL GIRADOR O BENEFICIARIO
              strSaldoFinal += RellenaTexto(COMPANY.NAME, 100, 'C') + '|';
              //11. NUMERO DE TRANSACCION BANCARIA
              strSaldoFinal += RellenaTexto('SALDO FINAL', 20, 'C') + '|';
              //12. PARTE DEUDORA DE SALDOS Y MOVIMIENTOS
              if (parseFloat(ArrSaldoFinal[ii][12]) >= 0) {
                strSaldoFinal += parseFloat(ArrSaldoFinal[ii][12]).toFixed(2) + '|';
              } else {
                strSaldoFinal += '0.00|';
              }
              //13. PARTE ACREEDORA DE SALDOS Y MOVIMIENTOS
              if (parseFloat(ArrSaldoFinal[ii][12]) < 0) {
                strSaldoFinal += Math.abs(parseFloat(ArrSaldoFinal[ii][12])).toFixed(2) + '|';
              } else {
                strSaldoFinal += '0.00|';
              }

              //14. INDICA EL ESTADO DE LA OPERACION
              strSaldoFinal += '1|';

              strSaldoFinal += '\r\n';
            }
          }
        }
      }
    }

    function GeneraLibroCajaBanco() {
      var arrSaldoInicial = strSaldoInicial.split('\r\n');
      var arrMovimiento = strMovimiento.split('\r\n');
      var arrSaldoFinal = strSaldoFinal.split('\r\n');

      //strName = '';
      strCabecera = '';

      //Pinta Cabecera
      strCabecera = 'PERIODO | CODIGO UNICO DE LA OPE. | NUMERO CORRELATIVO DE ASIENTO | ';
      strCabecera += 'COD. ENTIDAD FINANCIERA | COD. CUENTA BANCARIA DEL CONTRIBUYENTE | ';
      strCabecera += 'FECHA OPERACION | MEDIO DE PAGO UTILIZADO | ';
      strCabecera += 'DESC. DE OPERACION BANCARIA | TIPO DOC. BENEFICIARIO | ';
      strCabecera += 'NRO DOC. BENEFICIARIO | BENEFICIARIO | NRO TRANSACCION BANCARIA | ';
      strCabecera += 'PARTE DEUDORA DE SALDO Y MOVIMIENTO | PARTE ACREEDORA DE SALDO Y MOVIMIENTO | ';
      strCabecera += 'IND. ESTADO DE OPERACION | CAMPOS DE LIBRE UTILIZACION ';

      // nlapiLogExecution('error', 'Valor1 : ',  arrSaldoInicial.length );

      for (var x = 0; x <= arrSaldoInicial.length - 2; x++) {
        var arrLineaSI = arrSaldoInicial[x].split('|');
        var _CtaCont = arrLineaSI[0];

        var _ini = _CtaCont.length + 1;
        var _len = arrSaldoInicial[x].length;

        strName += (arrSaldoInicial[x]).substring(_ini, _len);
        strName += "\r\n";

        for (var xi = 0; xi <= arrMovimiento.length - 2; xi++) {
          var arrLineaMov = arrMovimiento[xi].split('|');

          /*  if (arrMovimiento[xi][13]=='NaN'){
              arrMovimiento[xi][13]='0.00|';
            }*/

          if (_CtaCont == arrLineaMov[0]) {
            //log.error( 'Valor1A : ', _CtaCont);

            var _ini = arrLineaMov[0].length + 1;
            var _len = arrMovimiento[xi].length;
            strName += (arrMovimiento[xi]).substring(_ini, _len);
            strName += "\r\n";
          }
        } //FIN DE LINEAS DE MOVIMIENTO

        for (var xii = 0; xii <= arrSaldoFinal.length - 2; xii++) {
          var arrLineaSF = arrSaldoFinal[xii].split('|');
          if (_CtaCont == arrLineaSF[0]) {
            var _ini = arrLineaSF[0].length + 1;
            var _len = arrSaldoFinal[xii].length;

            strName += (arrSaldoFinal[xii]).substring(_ini, _len);
            strName += "\r\n";
          }
        } //FIN DE LINEAS DE SALDO FINAL

      } //FIN DE LINEAS DE SALDO INICIAL
      var a = lengthInUtf8Bytes(strName);


      //Parambucle inicio
      var strReturn = '';
      var i=0;
      var inicio=0;
      //paramBucleFinTemp = paramBucleFin;
      var ArrTemp = strName.split('\r\n');
      while(i<ArrTemp.length-1){
        var t = lengthInUtf8Bytes(strReturn);
        if (t <= file_size) {
          //strReturn += GenerarLinea(ArrTemp[i], periodYear, periodMonth, separador);
          strReturn += ArrTemp[i] + '\r\n';
          i++;
        } else {

          fileNumber = Number(fileNumber) + 1;

          var arreglo = ArrTemp[i].split('|');
          /*for (var j = 0; i < ArrTemp.length; i++) {
            ArrTemp[j]=ArrTemp[i].split('|');
          }*/
          var isSaldoFinal = (arreglo[1].substring(0, 2) == 'SF');
          //  var isSaldoFinal = (ArrTemp[i][1].substring(0,2) == 'SF');

          if (isSaldoFinal) {
            strReturn += ArrTemp[i] + '\r\n';
          } else {
            var cont = 0;

            for (var x = i; x >= 0; x--) {
              var arreglo = ArrTemp[x].split('|');
              cont++;
              if (arreglo[1].substring(0, 2) == 'SI') {
                break;
              }
            }

            strReturn = '';

            for (var y = inicio; y < i - cont; y++) {
              strReturn += ArrTemp[y] + '\r\n';
            }

            inicio = i - cont;
            i=inicio;
          }

          strName = strReturn;
          //var yyyy = lengthInUtf8Bytes(strName);

          savefile();

        }
      }
    
      strName = strReturn;
      //Parambucle Fin

      //log.error('LibroCajaBanco1 : ', strName );
    }

    function lengthInUtf8Bytes(str) {
      var m = encodeURIComponent(str).match(/%[89ABab]/g);
      return str.length + (m ? m.length : 0);
    }
    function RellenaTexto(aux, TotalDigitos, TipoCaracter) {
      var Numero = aux.toString();
      var mon_len = parseInt(TotalDigitos) - Numero.length;

      if (mon_len < 0 && Numero.length != 4) {
        mon_len = mon_len * -1;
      }
      // Solo para el tipo caracter
      if (TipoCaracter == 'C') {
        mon_len = parseInt(mon_len) + 1;
      }

      if (Numero == null || Numero == '') {
        Numero = '';
      }

      var pd = '';
      if (TipoCaracter == 'N') {
        pd = repitechar(TotalDigitos, '0');
      } else {
        pd = repitechar(TotalDigitos, ' ');
      }
      if (TipoCaracter == 'N') {
        Numero = pd.substring(0, mon_len) + Numero;
        return Numero;
      } else {
        Numero = Numero + pd;
        return Numero.substring(0, parseInt(TotalDigitos));
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

    function transformarFecha(date) {
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

    function savefile() {
      // Ruta de la carpeta contenedora
      var IdLibroDiario = '010200';
      var FolderId = objContext.getParameter({
        name: 'custscript_lmry_pe_2016_rg_file_cabinet'
      });
      //var FolderId = nlapiGetContext().getSetting('SCRIPT', 'custscript_lmry_pe_2016_rg_file_cabinet');
      var TituloInforme = NAME_REPORT;

      if (PERIOD_SPECIAL.arrPeriodSpecial.length > 0) {
        periodName = PERIOD_SPECIAL.specialName;
      }

      // Almacena en la carpeta de Archivos Generados
      if (FolderId != '' && FolderId != null) {
        // Extension del archivo
        var fileext = '.txt';

        // Genera el nombre del archivo
        var NameFile = Name_File(IdLibroDiario) + fileext;

        // Crea el archivo
        var File;

        File = fileModulo.create({
          name: NameFile,
          fileType: fileModulo.Type.PLAINTEXT,
          contents: strName,
          encoding: fileModulo.Encoding.UTF8,
          folder: FolderId
        });

        //File.setFolder(FolderId);

        // Termina de grabar el archivo
        var idfile = File.save();

        //var idfile = nlapiSubmitFile(File);

        // Trae URL de archivo generado
        var idfile2 = fileModulo.load({
          id: idfile
        });
        //var idfile2 = nlapiLoadFile(idfile);

        // Obtenemo de las prefencias generales el URL de Netsuite (Produccion o Sandbox)

        var getURL = objContext.getParameter({
          name: 'custscript_lmry_netsuite_location'
        });
        var urlfile = '';

        if (getURL != '' && getURL != '') {
          urlfile += 'https://' + getURL;
        }

        urlfile += idfile2.url;

        //============

        /*var getURL = objContext.getSetting('SCRIPT', 'custscript_lmry_netsuite_location');
        var urlfile = '';
        if (getURL != '' && getURL != '') {
            urlfile += 'https://' + getURL;
        }
        urlfile += idfile2.getURL();*/

        //Genera registro personalizado como log

        if (idfile) {
          //var usuario = runtime.getCurrentUser();
          var usuarioTemp = runtime.getCurrentUser();
          var usuario = usuarioTemp.name;
          /*var tmdate = new Date();
          var myDate = nlapiDateToString(tmdate);
          var myTime = nlapiDateToString(tmdate, 'timeofday');
          var current_date = myDate + ' ' + myTime;*/
          var myfile = NameFile;

          //nlapiLogExecution('DEBUG', 'valor-> ',paramIdLog);
          //==========================
          if (PARAMETERS.RECORDID != '' && PARAMETERS.RECORDID != null) { //paramIdLog
            var record = recordModulo.load({
              type: 'customrecord_lmry_pe_2016_rpt_genera_log',
              id: PARAMETERS.RECORDID
            });
          } else {
            var record = recordModulo.create({
              type: 'customrecord_lmry_pe_2016_rpt_genera_log'
            });
          }
          //==========================
          /*
            var record = recordModulo.load({
                type: 'customrecord_lmry_pe_2016_rpt_genera_log',
                id: paramIdLog
            });*/
          //var record = nlapiLoadRecord('customrecord_lmry_pe_2016_rpt_genera_log', paramIdLog);


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

          //Creado Por
          record.setValue({
            fieldId: 'custrecord_lmry_pe_2016_rg_employee',
            value: usuario
          });
          /*
          record.setFieldValue('custrecord_lmry_pe_2016_rg_name', NameFile);
          record.setFieldValue('custrecord_lmry_pe_2016_rg_subsidiary', companyname);
          record.setFieldValue('custrecord_lmry_pe_2016_rg_url_file', urlfile);
          record.setFieldValue('custrecord_lmry_pe_2016_rg_transaction', namereport);
          */

          if (FEATURES.MULTIBOOK|| FEATURES.MULTIBOOK == 'T') {
            record.setValue({
              fieldId: 'custrecord_lmry_pe_rg_multibook',
              value: multibookName
            });
            //record.setFieldValue('custrecord_lmry_pe_rg_multibook', multibook);
          }

          var recordId = record.save();
          //nlapiSubmitRecord(record, true);


          // Envia mail de conformidad al usuario
          //libreria.sendrptuser(namereport, 3, NameFile);
          libraryRPT.sendConfirmUserEmail('RPT - Libro de Caja y Bancos Cuenta Corriente', 3, NameFile, LANGUAGE);
          
        }
      } else {
        // Debug
        log.error({
          title: 'Creacion de File:',
          details: 'No existe el folder'
        });
      }
    }

    function Name_File(IdLibroDiario) {

      //var FederalIdNumber = ObtainFederalIdSubsidiaria(objContext.getSetting('SCRIPT', 'custscript_lmry_subsidi_librodiarioaux'));
      // //AÔøΩo del periodo consultado
      // var DateYY = auxanio;
      // //Mes del periodo consultado
      // var DateMM = auxmess;

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

      if (PERIOD_SPECIAL.arrPeriodSpecial.length > 0) {
        AAAA = PERIOD_SPECIAL.YYYY_inicial;
        MM = PERIOD_SPECIAL.MM_inicial;
      }

      if (('' + MM).length == 1) {
        MM = '0' + MM;
      }
      //DÔøΩa, aplica al Libro de Inventarios y Balances, para los demÔøΩs consigne '00'
      var DateDD = '00';
      //CÔøΩdigo de oportunidad de presentaciÔøΩn del EEFF, aplica al Libro de Inventarios y Balances, para los demÔøΩs consigne '00'
      var CodOportunidad = '00';
      //Indicador de operaciones
      var IdOperacion = PARAMETERS.INDIC_OPERAC;
      //Indicador del contenido del libro o registro
      var IdContenido = '1';
      //Indicador de la moneda utilizada
      var IdMoneda = '1';
      //Indicador de libro electrÔøΩnico generado por el PLE
      var IdLibroElectronico = '1';

      //nlapiLogExecution('error', 'paramIdImpresion:', paramIdImpresion++);
      if (fileNumber != 0) {
        if (FEATURES.MULTIBOOK) {
          var NameFile = 'LE' + COMPANY.RUC + AAAA + MM + DateDD + IdLibroDiario + CodOportunidad + IdOperacion + IdContenido + IdMoneda + IdLibroElectronico + '_' + PARAMETERS.MULTIBOOK + '_' + fileNumber;
        } else {
          var NameFile = 'LE' + COMPANY.RUC + AAAA + MM + DateDD + IdLibroDiario + CodOportunidad + IdOperacion + IdContenido + IdMoneda + IdLibroElectronico + '_' + fileNumber;
        }
      } else {
        if (FEATURES.MULTIBOOK) {
          var NameFile = 'LE' + COMPANY.RUC + AAAA + MM + DateDD + IdLibroDiario + CodOportunidad + IdOperacion + IdContenido + IdMoneda + IdLibroElectronico + '_' + PARAMETERS.MULTIBOOK;
        } else {
          var NameFile = 'LE' + COMPANY.RUC + AAAA + MM + DateDD + IdLibroDiario + CodOportunidad + IdOperacion + IdContenido + IdMoneda + IdLibroElectronico;
        }
      }


      // Return File Name as a string
      return NameFile;
    }

    function noData() {
      log.error("no data", "no data")
      if (PERIOD_SPECIAL.arrPeriodSpecial.length > 0) {
        periodName = PERIOD_SPECIAL.specialName;
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

    function repitechar(cantidad, carac) {
      var caracter = carac;
      var numero = parseInt(cantidad);
      var cadena = '';
      for (var r = 0; r < numero; r++) {
        cadena += caracter;
      }
      return cadena;
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
    return {
      execute: execute
    };

  });