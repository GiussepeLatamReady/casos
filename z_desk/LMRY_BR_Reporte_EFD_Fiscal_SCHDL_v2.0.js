/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for Inventory Balance Library                  ||
||                                                              ||
||  File Name: LMRY_BR_Reporte_EFD_Fiscal_SCHDL_v2.0.js         ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Aug 16 2018  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
define(["N/record", "N/runtime", "N/file", "N/email", "N/search", "N/format",
  "N/log", "N/config", "N/task", "./BR_LIBRERIA_MENSUAL/LMRY_BR_Reportes_LBRY_V2.0.js",
  "/SuiteBundles/Bundle 37714/Latam_Library/LMRY_libSendingEmailsLBRY_V2.0.js"
],

  function (recordModulo, runtime, fileModulo, email, search, format, log,
    config, task, libreria, libFeature) {

    var objContext = runtime.getCurrentScript();
    // Nombre del Reporte
    var namereport = "BR - Reporte EFD FISCAL";
    var LMRY_script = 'LMRY_BR_Reporte_EFD_Fiscal_SCHDL_v2.0.js';

    //ParÃ¡metros
    var param_RecorID = null;
    var param_Periodo = null;
    var param_Subsi = null;
    var param_Num_Recti = null;
    var param_Multi = null;
    var param_Feature = null;
    var param_bloquek = null;
    var param_bloqueg = null;
    var param_Mot_Inv = null;
    var param_bloqueD = null;
    var param_archivo_ven = null;
    var param_archivo_ren = null;


    //AQUI ESTA LOS IDS DE LOS CAMPOS
    /*customrecord_lmry_br_obs_cod
    customrecord_lmry_br_nat_op_serv
    origen = stadual
    */


    var filter_Feature_tax = null;
    var filter_Feature_taxcode = null;

    var file_size = 7340032;

    //Features
    var feature_Subsi = null;
    var feature_Multi = null;
    var feature_Calendars = null;
    var featureTaxCalendars = null;

    //Datos de Subsidiaria
    var companyname = null;
    var companyruc = null;


    //Period enddate
    var periodenddate = null;
    var periodfirstdate = null;
    var mes_date = null;
    var dia_date = null;
    var anio_date = null;
    var periodname = null;
    var calendarSubsi = null;
    var calendarTaxSubsi = null;
    var periodSpecial = null;
    var confiSpecial = false;


    //Datos del Setup de la  subsidiaria
    //tab del EFD FISCAL
    var version_efd = null;
    var perfil = null;
    //tab del responsable
    var nombre_responsable = '';
    var cpf_responsable = '';
    var crc_responsable = '';
    var email_responsable = '';
    var telefono_responsable = '';
    var fax_responsable = '';
    var direccion_responsable = '';
    var numero_dire_responsable = '';
    var municipio_responsable = '';
    var barrio_responsable = '';
    var complmento_responsable = '';
    var cep_responsable = '';

    //montos globales que se utilizaran mas adelante equisde
    var campo6_E110 = 0;
    var campo2_E110 = 0;
    var campo3_E110 = 0;
    var campo7_E110 = 0;
    var campo4_E510 = 0;
    var campo3_E510 = 0;
    var campo15_E110 = 0;
    var suma_FCP = 0;
    var suma_ICMSUFDest = 0;

    //Datos de la Subsidiaria
    var subsiname = '';
    var cnpj = '';
    var provincia = '';
    var estado_entidad = '';
    var actividad_economica = '';
    var codigo_industrial = '';
    var codigo_postal = '';
    var direccion = '';
    var cef_subsi = '';
    var municipal = '';
    var num_subsi = '';
    var complemento = '';
    var barrio = '';

    //variables para las fechas
    var periodenddate = null;
    var periodfirstdate = null;
    //Nombre de libro contable
    var multibookName = '';

    //mi String para generar el Reporte
    var StrReporte = '';

    //Arreglos que se Usaran

    var ArrCustomer = new Array();
    var ArrVendor = new Array();
    var ArrItemsTrans = new Array();
    var ArrBloque9 = new Array();
    var ArrBloqueD = new Array();
    var ArrUnidad = new Array();
    var arrTransaction = new Array();
    var ArrItem = new Array();
    var arrBloqueEIPI = new Array();
    var arrFCPUF = new Array();
    var arrTransactionS = new Array();
    var ArrRetencion = new Array();
    var arrAnuladas = new Array();
    var arrItemBloqueK = new Array();
    var arrInutilizados = new Array();
    //recordatorio para ivan del futuro hoy 05/02/2020
    //anda agregando los otros tipos de documento
    var ArrDocumentos = ['01', '06', '66', '28', '29'];
    var ArrSituaciones = ["MC", "IM", "IA", "AT"];

    //arreglos para los ajustes
    var ArrAjusteDebito3C = ["3", "4", "5"];
    var ArrAjusteCredito3C = ["0", "1", "2"];
    var ArrAjuste4C = ["0", "3", "4", "5", "6", "7", "8"];

    //areglos para el E200
    ArrCamp4y6 = ["1410", "1411", "1414", "1415", "1660", "1661", "1662", "2410", "2411", "2414", "2415", "2660", "2661", "2662"];
    ArrCamp5 = ["1603", "2603"];
    //estos son valores que no t

    //arreglo exclusivo para e bloque G y algunos del 0
    var ArrBloqueG0 = new Array();
    //arreglos para los 0150 y 0200,0190 del bloque G
    var ArrVendorG = new Array();
    var ArrItemG = new Array();
    var ArrUnidadG = new Array();
    var ArrG140 = new Array();
    //mis contadores
    var contador_global = 0;
    var contador_bloque = 0;
    var JSONE210 = {};
    var JSONCambios = {};

    var language = runtime.getCurrentScript().getParameter({
      name: 'LANGUAGE'
    }).substring(0, 2);

    var feature_MultiCalendar = runtime.isFeatureInEffect({
      feature: "MULTIPLECALENDARS"
    });

    var featureTaxCalendars = null;
    var featureSpecialPeriods = null;
    var featureSpecialTaxPeriods = null;

    var periodStartDate = null;
    var periodEndDate = null;


    //flags para los registros opcionales
    c_0400 = null;
    c_0450 = null;
    r_1400 = null;
    var r_1601 = null;
    // IVAN ESTUBO AQUÍ xD
    //mira si revisas esto algun dia hice lo mejor que pude xDDD
    //si juan aun esta aqui saludalo de mi parte :v

    function execute(context) {
      try {

        ObtenerParametrosYFeatures();
        ObtenerDesvinculacion();
        /*
        if ((param_archivo_ven == null || param_archivo_ven == 'null') && (param_bloqueD == null || param_bloqueD == 'null') && (param_archivo_ren == null || param_archivo_ren == 'null')) {
          NoData(false);
          return true;
        }
        */
        ObtenerJSonCambios();
        ObtnerSetupRptDCTF();
        ObtenerDatosSubsidiaria();
        GenerarArreglos();
        GenerarBloque0();
        //GenerarBloqueD();
        //if (StrReporte.length != 0) {
        SaveFile();
        /*}else {
            NoData(false);
        }*/

      } catch (error) {
        libreria.sendemailTranslate(error, LMRY_script, language);

        NoData(true);
      }
    }

    function ObtenerJSonCambios() {
      var fileSearchObj = search.create({
        type: "file",
        filters:
          [
            ["name", "contains", "JsonCambiosEFDFiscal"]
          ],
        columns:
          [
            search.createColumn({ name: "internalid", label: "Internal ID" })
          ]
      });
      var result = fileSearchObj.run().getRange(0, 100);
      if (result.length != 0) {
        //leemos el archivo para ver los cambios
        var misarreglos = fileModulo.load({
          id: result[0].getValue("internalid")
        });
        JSONCambios = JSON.parse(misarreglos.getContents());

      }
    }


    function GenerarBloqueC() {
      var contador_bloque = 0;
      var arrAuxiliar = new Array();
      var existe = false;
      //***************** BLOQUEC *****************
      //Registro C001
      var salto = '\r\n';

      //Bloque C100
      C100 = GenerarC100();
      if (C100 != '') {
        existe = true;
        arrAuxiliar = new Array();
        //  return strC100 + '&' + contador_bloqueC100 + '&' + contadorC170 + '&' + contadorC190;
        var RC100 = C100.split('?');
        arrAuxiliar[0] = 'C100';
        arrAuxiliar[1] = Number(RC100[1]);
        ArrBloque9.push(arrAuxiliar);
        //BloqueC101
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'C101';
        arrAuxiliar[1] = Number(RC100[8]);
        ArrBloque9.push(arrAuxiliar);
        //BloqueC101
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'C110';
        arrAuxiliar[1] = Number(RC100[9]);
        ArrBloque9.push(arrAuxiliar);
        //BloqueC113
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'C113';
        arrAuxiliar[1] = Number(RC100[12]);
        ArrBloque9.push(arrAuxiliar);
        //BloqueC120
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'C120',
          arrAuxiliar[1] = Number(RC100[4]);
        ArrBloque9.push(arrAuxiliar);
        ////BloqueC170
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'C170';
        arrAuxiliar[1] = Number(RC100[2]);
        ArrBloque9.push(arrAuxiliar);
        //BloqueC171
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'C171';
        arrAuxiliar[1] = Number(RC100[5]);
        ArrBloque9.push(arrAuxiliar);
        //BloqueC173
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'C173';
        arrAuxiliar[1] = Number(RC100[6]);
        ArrBloque9.push(arrAuxiliar);
        //BloqueC175
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'C175';
        arrAuxiliar[1] = Number(RC100[7]);
        ArrBloque9.push(arrAuxiliar);
        //Bloque C190
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'C190';
        arrAuxiliar[1] = Number(RC100[3]);
        ArrBloque9.push(arrAuxiliar);
        //BloqueC195
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'C195';
        arrAuxiliar[1] = Number(RC100[10]);
        ArrBloque9.push(arrAuxiliar);
        //BloqueC197
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'C197';
        arrAuxiliar[1] = Number(RC100[11]);
        ArrBloque9.push(arrAuxiliar);
      }

      var C500 = GenerarC500();
      if (C500 != '') {

        existe = true;
        RC500 = C500.split('%');
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'C500';
        arrAuxiliar[1] = Number(RC500[1]);
        ArrBloque9.push(arrAuxiliar);

        //genera C590
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'C590';
        arrAuxiliar[1] = Number(RC500[2]);
        ArrBloque9.push(arrAuxiliar);
      }

      //Generar C990
      var C990 = '';
      C990 += '|C990|';
      contador_bloque++;

      // arrAuxiliar[0]= 'C001';
      StrReporte += '|C001|';
      if (existe) {
        StrReporte += '0|' + salto;
      } else {
        StrReporte += '1|' + salto;
      }
      arrAuxiliar = new Array();
      arrAuxiliar[0] = 'C001';
      arrAuxiliar[1] = 1;
      contador_bloque++;
      ArrBloque9.push(arrAuxiliar);

      if (C500 != '' && C100 != '') {
        C990 += contador_bloque + Number(RC100[1]) + Number(RC100[2]) + Number(RC100[3]) + Number(RC100[4]) + Number(RC100[5]) + Number(RC100[6]) + Number(RC100[7]) + Number(RC100[8]) + Number(RC100[9]) + Number(RC100[10]) + Number(RC100[11]) + Number(RC100[12]) + Number(RC500[1]) + Number(RC500[2]) + '|' + salto;
        var cadena_bloque = RC100[0] + RC500[0] + C990;
      } else {
        if (C100 != '') {
          C990 += contador_bloque + Number(RC100[1]) + Number(RC100[2]) + Number(RC100[3]) + Number(RC100[4]) + Number(RC100[5]) + Number(RC100[6]) + Number(RC100[7]) + Number(RC100[8]) + Number(RC100[9]) + Number(RC100[10]) + Number(RC100[11]) + Number(RC100[12]) + '|' + salto;
          var cadena_bloque = RC100[0] + C990;
        } else {
          if (C500 != '') {
            C990 += contador_bloque + Number(RC500[1]) + Number(RC500[2]) + '|' + salto;
            var cadena_bloque = RC500[0] + C990;
          } else {
            C990 += '2|' + salto;
            var cadena_bloque = C990;
          }
        }
      }
      cadena_bloque = cadena_bloque.replace(/\./g, ',');
      arrAuxiliar = new Array();
      arrAuxiliar[0] = 'C990';
      arrAuxiliar[1] = 1;
      ArrBloque9.push(arrAuxiliar);
      return cadena_bloque;
    }

    function GenerarC500() {
      var strC500 = '';
      var existe = false;
      //***************** BLOQUEC *****************

      //Registro C100
      var salto = '\r\n';
      var contador_bloqueC500 = 0;
      var contador_c590 = 0;
      for (var i = 0; i < arrTransaction.length; i++) {

        if (arrTransaction[i][1] != 'CustInvc' && (arrTransaction[i][2] == '06' || arrTransaction[i][2] == '66' || arrTransaction[i][2] == '28' || arrTransaction[i][2] == '29') && arrTransaction[i][22] != '0') {
          existe = true;
          var C590 = {};
          //1. TEXTO FIJO

          campo1 = '|C500|';
          //2. IND_OPE -- este campo sera de salida por ahora osea 0
          if (arrTransaction[i][1] == 'VendBill' || arrTransaction[i][1] == 'ItemRcpt' || arrTransaction[i][1] != 'VendCred') {
            campo2 = '0|';
          } else {
            campo2 = '1|';
          }
          //3. IND_EMIT --- lo mismo de arriba xD
          campo3 = '1|';
          //4. COD_PART
          campo4 = arrTransaction[i][3] + '|';
          //5. COD_MOD
          campo5 = arrTransaction[i][2] + '|';
          //6. COD_SIT --- por el momento lo dejare como 00
          if (arrTransaction[i][1] == 'VendBill' || arrTransaction[i][1] == 'CustInvc') {
            campo6 = arrTransaction[i][71] + '|'
          } else {
            campo6 = '00|'
          }
          //7.SERIE
          campo7 = arrTransaction[i][5].substring(0, 3) + '|';
          //8. SUB
          campo8 = '|';
          //9. COD_CONS
          if (arrTransaction[i][2] == '66') {
            campo9 = '|';
          } else {
            campo9 = arrTransaction[i][43] + '|';
          }
          //10. NUMERO DE DOCUMENTO
          campo10 = arrTransaction[i][4].substring(0, 9) + '|';
          //11. DIA DE EMISION DE DOCUMENTO
          campo11 = arrTransaction[i][6] + '|';
          //12. DATA DE ENTRADA O SALIDA
          if (arrTransaction[i][1] == 'VendBill') {
            campo12 = arrTransaction[i][52] + '|';
          } else if (arrTransaction[i][1] == 'CustInvc') {
            campo12 = arrTransaction[i][65] + '|';
          } else {
            campo12 = '|';
          }
          //13. VALOR TOTAL DEL DOCUMENTO
          campo13 = Number(arrTransaction[i][7]).toFixed(2) + '|';
          //14. VALOR DE DESCUENTO
          campo14 = '0|';
          //15. VALOR TOTAL FORNECIDO/CONSUMIDO ---
          campo15 = Number(arrTransaction[i][7]).toFixed(2) + '|';
          //16. VL_SERV_NT -- NPI de que quiere decir este campo (ya no quiero nada ya xD)
          campo16 = '0|';
          //17. VALOR COBRADO POR TERCEROS XD
          campo17 = '0|';
          //18. VL_DA --- NPI tambien
          campo18 = '0|';
          //19. VL BASE DE CACULO DE ICMS ACUMULADO
          campo19 = Number(arrTransaction[i][20]).toFixed(2) + '|';
          //20. VL_ICMS -- VALOR ACUMULADO DE ICMS
          campo20 = Number(arrTransaction[i][21]).toFixed(2) + '|';
          //21. VL_BC_ICMS_ST
          campo21 = round(Number(arrTransaction[i][75])) + '|';
          //22. VL_ICMS_ST
          campo22 = round(Number(arrTransaction[i][76])) + '|';
          //23. COD_INF
          campo23 = '|';
          //24. VALOR DE PIS
          campo24 = Number(arrTransaction[i][31]).toFixed(2) + '|';
          //25. VALOR DE COFINS
          campo25 = Number(arrTransaction[i][35]).toFixed(2) + '|';
          //26. TP LIGACAO -- NI IDEA QUE ES ESTO XD
          if (arrTransaction[i][2] != '06') {
            campo26 = '|';
          } else {
            campo26 = arrTransaction[i][44] + '|';
          }
          //27. COD_GRUPO_TENSA -- esto ta cada ves mas gracioso xD
          if (arrTransaction[i][2] != '06') {
            campo27 = '|';
          } else {
            campo27 = arrTransaction[i][45] + '|';
          }
          if (version_efd != '013' && version_efd != '016') {
            //28. CLAVE DE DOCUMENTO FISCAL ELECTRONICA
            if (arrTransaction[i][2] == '66') {
              if (arrTransaction[i][1] == 'VendBill') {
                campo28 = arrTransaction[i][53] + '|';
              } else if (arrTransaction[i][1] == 'CustInvc') {
                campo28 = arrTransaction[i][46] + '|';
              } else {
                campo28 = '|';
              }
            } else {
              campo28 = '|';
            }
            //29. FINALIDAD DE EMISION DE DOCUMENTO
            if (arrTransaction[i][2] == '66') {
              campo29 = '1|';
            } else {
              campo29 = '|';
            }
            //30. CLAVE DE NOTA REFERENCIADA-- NPI TABIEN
            campo30 = '|';
            var ciudades = JSON.parse(arrTransaction[i][47]);
            if (arrTransaction[i][1] == 'VendBill') {
              //31. IND_DEST
              campo31 = arrTransaction[i][54] + '|';
              //32. COD_MUN_DEST
              campo32 = ciudades.vendor + '|';
            } else {
              //31. IND_DEST
              campo31 = '|';
              //32. COD_MUN_DEST
              campo32 = '|';
            }
            //33. CDO CTA
            campo33 = '|' + salto;
            strC500 += campo1 + campo2 + campo3 + campo4 + campo5 + campo6 + campo7 + campo8 + campo9 + campo10 + campo11 + campo12 + campo13 + campo14 + campo15 + campo16 + campo17 + campo18 + campo19 + campo20 + campo21 + campo22 + campo23 + campo24 + campo25 + campo26 + campo27 + campo28 + campo29 + campo30 + campo31 + campo32 + campo33;
          } else if (version_efd == '016') {
            //28. CLAVE DE DOCUMENTO FISCAL ELECTRONICA
            if (arrTransaction[i][2] == '66') {
              if (arrTransaction[i][1] == 'VendBill') {
                campo28 = arrTransaction[i][53] + '|';
              } else if (arrTransaction[i][1] == 'CustInvc') {
                campo28 = arrTransaction[i][46] + '|';
              } else {
                campo28 = '|';
              }
            } else {
              campo28 = '|';
            }
            //29. FINALIDAD DE EMISION DE DOCUMENTO
            if (arrTransaction[i][2] == '66') {
              campo29 = '1|';
            } else {
              campo29 = '|';
            }
            //30. CLAVE DE NOTA REFERENCIADA-- NPI TABIEN
            campo30 = '|';
            var ciudades = JSON.parse(arrTransaction[i][47]);
            if (arrTransaction[i][1] == 'VendBill') {
              //31. IND_DEST
              campo31 = '|';
              //campo31 = arrTransaction[i][54]+'|';
              //32. COD_MUN_DEST
              campo32 = '|';
              //campo32 = ciudades.vendor+'|';
            } else {
              //31. IND_DEST
              campo31 = '|';
              //32. COD_MUN_DEST
              campo32 = '|';
            }
            //33. CDO CTA
            campo33 = '|';
            //34. COD_MOD_DOC_REF
            campo34 = '|';
            //35. HASH_DOC_REF
            campo35 = '|';
            //36. SER_DOC_REF
            campo36 = '|';
            //37. NUM_DOC_REF
            campo37 = '|';
            //38. MES_DOC_REF
            campo38 = '|';
            //39. ENER_INJET
            campo39 = '|';
            //40. OUTRAS_DED
            campo40 = '|' + salto;
            strC500 += campo1 + campo2 + campo3 + campo4 + campo5 + campo6 + campo7 + campo8 + campo9 + campo10 + campo11 + campo12 + campo13 + campo14 + campo15 + campo16 + campo17 + campo18 + campo19 + campo20 + campo21 + campo22 + campo23 + campo24 + campo25 + campo26 + campo27 + campo28 + campo29 + campo30 + campo31 + campo32 + campo33 + campo34 + campo35 + campo36 + campo37 + campo38 + campo39 + campo40;
          } else {
            strC500 += campo1 + campo2 + campo3 + campo4 + campo5 + campo6 + campo7 + campo8 + campo9 + campo10 + campo11 + campo12 + campo13 + campo14 + campo15 + campo16 + campo17 + campo18 + campo19 + campo20 + campo21 + campo22 + campo23 + campo24 + campo25 + campo26 + campo27 + salto;
          }
          contador_bloqueC500++;
          //Bloque C590

          var E200_4 = 0, E200_5 = 0, E200_6 = 0;
          if (ArrCamp4y6.indexOf(ValidaGuion(ArrItem[i][7])) != -1) {
            E200_4 += round(Number(ArrItem[i][56]));
          }
          if (ArrCamp5.indexOf(ValidaGuion(ArrItem[i][7])) != -1) {
            E200_5 += round(Number(ArrItem[i][56]));
          }
          if (ArrCamp4y6.indexOf(ValidaGuion(ArrItem[i][7])) == -1 && (ArrItem[i][7].substring(0, 1) == '1' || ArrItem[i][7].substring(0, 1) == '2')) {
            E200_6 += round(Number(ArrItem[i][56]));
          }
          if ((arrTransaction[i][1] == 'VendBill' || arrTransaction[i][1] == 'VendCred') && Number(ArrItem[i][56]) != 0) {
            if (!JSONE210[arrTransaction[i][77]]) {
              JSONE210[arrTransaction[i][77]] = {
                "UF": arrTransaction[i][77],
                "campo4": E200_4,
                "campo5": E200_5,
                "campo6": E200_6
              }
            } else {
              JSONE210[arrTransaction[i][77]].campo4 += E200_4;
              JSONE210[arrTransaction[i][77]].campo5 += E200_5;
              JSONE210[arrTransaction[i][77]].campo6 += E200_6;
            }
          }

          for (var j = 0; j < ArrItem.length; j++) {
            //aca de la misma manera los registros de C500 solo deben generar un C590 para el caso de ventas es distinto
            //si no lo hago yo --- tu el que revisa esto suerte con eso xd -- aunque lo dudo que hagamos facturas de luz para empresas que brindan dicho servicio pero quien sabe :'v
            if (arrTransaction[i][0] == ArrItem[j][1]) {
              var ID = ArrItem[j][7] + '|' + ArrItem[j][12] + '|' + ArrItem[j][13];
              if (!C590[ID]) {
                C590[ID] = {
                  "id": ID,
                  "baseicsm": Number(ArrItem[j][10]),
                  "montoicms": Number(ArrItem[j][11]),
                  "CFOP": ArrItem[j][7],
                  "montoitem": Number(ArrItem[j][2]),
                  "ST_ICMS": ArrItem[j][12],
                  "Porc_ICMS": ArrItem[j][13],
                  "MntNoTributado": Number(ArrItem[j][53]),
                  "base_icmsst": round(Number(ArrItem[j][55])),
                  "monto_icmsst": round(Number(ArrItem[j][56]))

                };
              } else {
                if (C590[ID] != undefined) {
                  C590[ID].baseicsm += Number(ArrItem[j][10]);
                  C590[ID].montoicms += Number(ArrItem[j][11]);
                  C590[ID].montoitem += Number(ArrItem[j][2]);
                  C590[ID].MntNoTributado += Number(ArrItem[j][53]);
                  C590[ID].base_icmsst += round(Number(ArrItem[j][55]));
                  C590[ID].monto_icmsst += round(Number(ArrItem[j][56]));
                }

              }

            }
          }

          for (var k in C590) {

            //1. REG
            strC500 += '|C590|';
            //2. CST_ICMS
            strC500 += C590[k].ST_ICMS + '|';
            //3. CFOP
            strC500 += ValidaGuion(C590[k].CFOP) + '|';
            //4. ALIQ_ICMS
            strC500 += (Number(ValidaPorcentaje(C590[k].Porc_ICMS)) * 100).toFixed(2) + '|';
            //5. VL_OPR
            strC500 += Number(C590[k].montoitem).toFixed(2) + '|';
            //6. VL_BC_ICMS
            strC500 += Number(C590[k].baseicsm).toFixed(2) + '|';
            //7. VL_ICMS
            strC500 += Number(C590[k].montoicms).toFixed(2) + '|';
            campo6_E110 += Number(C590[k].montoicms);
            //8. VL_BC_ICMS_ST
            strC500 += C590[k].base_icmsst + '|';
            //9. VL_ICMS_ST
            strC500 += C590[k].monto_icmsst + '|';
            //10. VL_RED_BC
            strC500 += Number(C590[k].MntNoTributado).toFixed(2) + '|';
            //11. COD_OBS
            strC500 += '|' + salto;
            contador_c590++;
          }

        }

      }

      for (var i = 0; i < arrAnuladas.length; i++) {
        if ((arrAnuladas[i][1] == '0') && (arrAnuladas[i][6] == '06' || arrAnuladas[i][6] == '66' || arrAnuladas[i][6] == '28' || arrAnuladas[i][6] == '29')) {
          existe = true;

          //1. TEXTO FIJO
          strC500 += '|C500|';
          //2. IND_OPE -- este campo sera de salida por ahora osea 0
          strC500 += arrAnuladas[i][1] + '|';
          //3. IND_EMIT --- lo mismo de arriba xD
          strC500 += arrAnuladas[i][7] + '|';
          //4. COD_PART
          strC500 += '|';
          //5. COD_MOD
          strC500 += arrAnuladas[i][6] + '|';
          //6. COD_SIT --- por el momento lo dejare como 00
          strC500 += '02|';
          //7.SERIE
          if (arrAnuladas[i][1] == '0') {
            strC500 += arrAnuladas[i][4].substring(0, 3) + '|';
          } else {
            strC500 += arrAnuladas[i][5].substring(0, 3) + '|';
          }
          //8. SUB
          strC500 += '|';
          //9. COD_CONS
          strC500 += '|';
          //10. NUMERO DE DOCUMENTO
          strC500 += arrAnuladas[i][2].substring(0, 9) + '|';
          //11. DIA DE EMISION DE DOCUMENTO
          strC500 += '|';
          //12. DATA DE ENTRADA O SALIDA
          strC500 += '|';
          //13. VALOR TOTAL DEL DOCUMENTO
          strC500 += '|';
          //14. VALOR DE DESCUENTO
          strC500 += '|';
          //15. VALOR TOTAL FORNECIDO/CONSUMIDO ---
          strC500 += '|';
          //16. VL_SERV_NT -- NPI de que quiere decir este campo (ya no quiero nada ya xD)
          strC500 += '|';
          //17. VALOR COBRADO POR TERCEROS XD
          strC500 += '|';
          //18. VL_DA --- NPI tambien
          strC500 += '|';
          //19. VL BASE DE CACULO DE ICMS ACUMULADO
          strC500 += '|';
          //20. VL_ICMS -- VALOR ACUMULADO DE ICMS
          strC500 += '|';
          //21. VL_BC_ICMS_ST
          strC500 += '|';
          //22. VL_ICMS_ST
          strC500 += '|';
          //23. COD_INF
          strC500 += '|';
          //24. VALOR DE PIS
          strC500 += '|';
          //25. VALOR DE COFINS
          strC500 += '|';
          //26. TP LIGACAO -- NI IDEA QUE ES ESTO XD
          cstrC500 += '|';
          //27. COD_GRUPO_TENSA -- esto ta cada ves mas gracioso xD
          strC500 += '|';
          if (version_efd != '013' && version_efd != '016') {
            //28. CLAVE DE DOCUMENTO FISCAL ELECTRONICA
            strC500 += '|';
            //29. FINALIDAD DE EMISION DE DOCUMENTO
            strC500 += '|';
            //30. CLAVE DE NOTA REFERENCIADA-- NPI TABIEN
            strC500 += '|';
            //31. IND_DEST
            strC500 += '|';
            //32. COD_MUN_DEST
            strC500 += '|';
            //33. CDO CTA
            strC500 += '|' + salto;

          } else if (version_efd == '016') {
            //28. CLAVE DE DOCUMENTO FISCAL ELECTRONICA
            strC500 += '|';
            //29. FINALIDAD DE EMISION DE DOCUMENTO
            strC500 += '|';
            //30. CLAVE DE NOTA REFERENCIADA-- NPI TABIEN
            strC500 += '|';
            //31. IND_DEST
            strC500 += '|';
            //32. COD_MUN_DEST
            strC500 += '|';
            //33. CDO CTA
            strC500 += '|';
            //34. COD_MOD_DOC_REF
            strC500 += '|';
            //35. HASH_DOC_REF
            strC500 += '|';
            //36. SER_DOC_REF
            strC500 += '|';
            //37. NUM_DOC_REF
            strC500 += '|';
            //38. MES_DOC_REF
            strC500 += '|';
            //39. ENER_INJET
            strC500 += '|';
            //40. OUTRAS_DED
            strC500 += '|' + salto;
          }
          contador_bloqueC500++;
        }
      }



      if (existe) {

        return strC500 + '%' + contador_bloqueC500 + '%' + contador_c590;/*+'%' + strC590*/
      }

      return '';
    }

    function GenerarC170(id_transaction, num_tank, vol_tank, fecha_ini, tipo_transaction, modelo, nomc195, codc195, situacion, BUF) {
      //inicializando el JSON
      var C190 = {};
      var C197 = {};
      var c_c170 = 0;
      var flag_c197 = false;
      var contador_bloque_C170 = 0;
      var contador_bloque_C171 = 0;
      var contador_bloque_C173 = 0;
      var contador_bloque_C175 = 0;
      var contador_bloque_C190 = 0;
      var contador_C195 = 0;
      var contador_C197 = 0;
      var strC170 = '';
      var monto_json = 0;
      var base_json = 0;
      var monto_ipi_json = 0;
      var salto = '\r\n';
      var monto_base_icms = 0;
      var monto_acre_icms = 0;
      var monto_base_ipi = 0;
      var monto_item = 0;
      var monto_acre_ipi = 0;
      //para comprobar los ultimos digitos de la situacion tributaria de ICMS
      //recordatorio para el Ivan del Futuro --- Probablemente tengas que validar
      //los ultimos dos digitos de la Situacion Tributaria
      for (var i = 0; i < ArrItem.length; i++) {
        if (id_transaction == ArrItem[i][1]) {
          /*log.error('validacion');
          log.error('modelo',modelo);
          log.error("tipo_transaction",tipo_transaction);
          log.error('el item', ArrItem[i]);
          log.error('sitaucion',situacion);
          log.error("CST DE ICMS DEL ITEM", ArrItem[i][12]);*/
          cfop = ValidaGuion(ValidaGuion(ArrItem[i][7]));
          if ((modelo != '55' && (tipo_transaction == 'CustInvc' || tipo_transaction == 'ItemShip' || tipo_transaction == 'VendCred') && ArrItem[i][12] != '' && ArrItem[i][12] != '0') || ((tipo_transaction == 'VendBill' || tipo_transaction == 'ItemRcpt') && cfop != '5910' && cfop != '6910') && ArrItem[i][12] != '' && ArrItem[i][12] != '0') {
            //1.- Texto Fijo
            strC170 += '|C170|';
            //2.- NUMERO DE ITEM
            strC170 += (c_c170 + 1) + '|';
            c_c170++;
            //3.- CODIGO DE ITEM
            strC170 += ArrItem[i][0] + '|';
            //4.- DESCRIPCION COMPLEMENTARIA
            strC170 += ArrItem[i][4] + '|';
            //5.- CANTIDAD DE ITEM
            strC170 += ArrItem[i][6] + '|';
            //6.- UNIDADES DEL ITEM
            strC170 += ArrItem[i][3] + '|';
            //7.- VALOR TOTAL DEL ITEM
            strC170 += Number(ArrItem[i][2]).toFixed(2) + '|';
            //8.- VALOR DE DESCUENTO COMERCIAL
            if (tipo_transaction == 'CustInvc' || tipo_transaction == 'VendBill') {
              strC170 += Number(ArrItem[i][61]).toFixed(2) + '|';
            } else {
              strC170 += '0|';
            }
            //9.- INDICE DE MOVIMIENTO
            //servicios 0 inventario 1
            if (ArrItem[i][5] != '09') {
              strC170 += '0|';
            } else {
              strC170 += '1|';
            }
            //10.- CODIGO DE SITUACION TRIBUTARIA PARA ICMS
            strC170 += ArrItem[i][12] + '|';
            //11.- CFOP
            strC170 += ValidaGuion(ArrItem[i][7]) + '|';
            //12.- CODIGO DE NATURALEZA
            if (c_0400 == 'T') {
              strC170 += ValidaGuion(ArrItem[i][7]) + '|';
            } else {
              strC170 += '|';
            }
            //13.- VALOR DE BASE DE CALCULO
            strC170 += Number(ArrItem[i][10]).toFixed(2) + '|';
            //aliquota de icmsa
            //14.- ALIQUOTA DE ICMS
            /*3*/strC170 += (Number(ValidaPorcentaje(ArrItem[i][13])) * 100).toFixed(2) + '|';
            //15.- VALOR DE ICMS CREDITADO/DEBITADO--- NPI ESTE CAMPO
            strC170 += Number(ArrItem[i][11]).toFixed(2) + '|';
            if (tipo_transaction != 'VendBill' && tipo_transaction != 'VendCred') {
              //16.-VALOR DE BASE DE CALCULO REFERENTE A SUBSTITUCION TRIBUTARIA
              strC170 += '0|';
              //17.- ALIQUOTA DE ICMS DE SUBSTITUCION TRIBUTARIA
              strC170 += '0|';
              //18.- VALOR DE ICSM REFERENTE A SUBSTITUCION TRIBUTARIA
              strC170 += '0|';
              /*strC170 += ArrItem[i][35]+'|';
              //17.- ALIQUOTA DE ICMS DE SUBSTITUCION TRIBUTARIA
              strC170 += Number(ValidaPorcentaje(ArrItem[i][38]))*100+'|';
              //18.- VALOR DE ICSM REFERENTE A SUBSTITUCION TRIBUTARIA
              strC170 += ArrItem[i][36]+'|';*/
            } else {
              //16.-VALOR DE BASE DE CALCULO REFERENTE A SUBSTITUCION TRIBUTARIA
              strC170 += round(Number(ArrItem[i][55])) + '|';
              //17.- ALIQUOTA DE ICMS DE SUBSTITUCION TRIBUTARIA
              strC170 += Number(Number(ValidaPorcentaje(ArrItem[i][57])) * 100).toFixed(2) + '|';
              //18.- VALOR DE ICSM REFERENTE A SUBSTITUCION TRIBUTARIA
              strC170 += round(Number(ArrItem[i][56])) + '|';
            }
            //19.- INDICE DE APURACAO XD por el momentirigillo lo pondre como 0
            //0. Mensual
            //1. Decenial
            strC170 += '0|';
            //20.- CODIGO SITUACION TRIBUTARIA DE IPI -- aun no esta esto
            if (ArrItem[i][16] != '0') {
              strC170 += ArrItem[i][16] + '|';
            } else {
              strC170 += '|';
            }
            //21.- CODIGO DE ENCUADRAMENTO QUE SERA ESTA SHIT XD
            //segun lei en unos foros vi que se este campo se seteaba como vacio 100% real no fake
            strC170 += '|';
            //aqui comienza lo bueno xD
            //22.- VALOR DE BASE DE CALCULO DE IPI
            strC170 += ArrItem[i][14] + '|';
            //23.- ALIQUOTA DE IPI
            strC170 += (Number(ValidaPorcentaje(ArrItem[i][17])) * 100).toFixed(2) + '|';
            //24.- VALOR ACREDITADO DE IPI
            strC170 += ArrItem[i][15] + '|';
            //25.- CODIGO DE SITUACION TRIBUTARIA DE PIS
            if (ArrItem[i][20] != 0) {
              strC170 += ArrItem[i][20] + '|';
            } else {
              strC170 += '|';
            }
            //26.- VALOR DE BASE DE CALCULO DE PIS
            strC170 += ArrItem[i][18] + '|';
            //27.- ALIQUOTA DE PIS XD
            strC170 += (Number(ValidaPorcentaje(ArrItem[i][21])) * 100).toFixed(2) + '|';
            //28.- CANTIDAD DE BASE DE CALCULO DE PIS
            strC170 += '|';
            //29.- ALIQUOTA DE PIS en reais
            strC170 += '|';
            //30.- VALOR DE PIS
            strC170 += ArrItem[i][19] + '|';
            //31.- CODIGO DE SITUACION TRIBUTARIA DE COFINS
            if (ArrItem[i][24] != '0') {
              strC170 += ArrItem[i][24] + '|';
            } else {
              strC170 += '|';
            }
            //32.- VALOR DE BASE DE CALCULO DE COFINS
            strC170 += ArrItem[i][22] + '|';
            //33.- ALIQUOTA DE COFINS
            strC170 += (Number(ValidaPorcentaje(ArrItem[i][25])) * 100).toFixed(2) + '|';
            //34.- CANTIDAD - BASE DE CALCUCLO DE COFINS
            strC170 += '|';
            //35.- ALIQUOTA DE COFINS
            strC170 += '|';
            //36.- VALOR DE COFINS
            strC170 += ArrItem[i][23] + '|';
            //37.- CODIGO DE CUENTA ANALITICA CONTABLE NPI QUE ES ESTO XD
            strC170 += '|';
            //38.- VL_ABAT_NT - YA NO SE QUE IRA AQUI
            strC170 += '|' + salto;
            contador_bloque_C170++;
          }
          //probando lo que marco me indico xD, esto de aca solo esta activo para compras
          //cada if es para campo 4 5 y 6 del E210
          var E200_4 = 0, E200_5 = 0, E200_6 = 0;
          if (ArrCamp4y6.indexOf(ValidaGuion(ArrItem[i][7])) != -1) {
            E200_4 += round(Number(ArrItem[i][56]));
          }
          if (ArrCamp5.indexOf(ValidaGuion(ArrItem[i][7])) != -1) {
            E200_5 += round(Number(ArrItem[i][56]));
          }
          if (ArrCamp4y6.indexOf(ValidaGuion(ArrItem[i][7])) == -1 && (ArrItem[i][7].substring(0, 1) == '1' || ArrItem[i][7].substring(0, 1) == '2')) {
            E200_6 += round(Number(ArrItem[i][56]));
          }
          if ((tipo_transaction == 'VendBill' || tipo_transaction == 'VendCred') && Number(ArrItem[i][56]) != 0) {
            if (!JSONE210[BUF]) {
              JSONE210[BUF] = {
                "UF": BUF,
                "campo4": E200_4,
                "campo5": E200_5,
                "campo6": E200_6
              }
            } else {
              JSONE210[BUF].campo4 += E200_4;
              JSONE210[BUF].campo5 += E200_5;
              JSONE210[BUF].campo6 += E200_6;
            }
          }

          //parte para agregar al arreglo que armara el bloque E de IPI ALEXXXX
          var arrAuxiliar = new Array();
          //tipo
          arrAuxiliar[0] = tipo_transaction;
          //sitaucion tribu IPI
          arrAuxiliar[1] = ArrItem[i][16];
          //CFOP
          arrAuxiliar[2] = ArrItem[i][7];
          //Baase IPI
          arrAuxiliar[3] = ArrItem[i][14];
          //MOnto Ipi
          arrAuxiliar[4] = ArrItem[i][15];
          arrBloqueEIPI.push(arrAuxiliar);

          var ID = ArrItem[i][7] + '|' + ArrItem[i][12] + '|' + ArrItem[i][13];
          if (tipo_transaction == 'CustInvc' || tipo_transaction == 'ItemShip' || tipo_transaction == 'VendCred') {

            if (!C190[ID] && ArrItem[i][12] != '' && ArrItem[i][12] != '0') {
              C190[ID] = {
                "id": ID,
                "baseicsm": Number(ArrItem[i][10]),
                "montoicms": round(Number(ArrItem[i][11])),
                "montoipi": Number(ArrItem[i][15]),
                "CFOP": ArrItem[i][7],
                "montoitem": Number(ArrItem[i][2]),
                "ST_ICMS": ArrItem[i][12],
                "Porc_ICMS": ArrItem[i][13],
                "monto_icmsst": Number(ArrItem[i][36]),
                "base_icmsst": Number(ArrItem[i][35]),
                "MntNoTributado": Number(ArrItem[i][53])
              };
            } else {
              if (C190[ID] != undefined) {
                C190[ID].baseicsm += Number(ArrItem[i][10]);
                C190[ID].montoicms += round(Number(ArrItem[i][11]));
                C190[ID].montoipi += Number(ArrItem[i][15]);
                C190[ID].montoitem += Number(ArrItem[i][2]);
                C190[ID].monto_icmsst += Number(ArrItem[i][36]);
                C190[ID].base_icmsst += Number(ArrItem[i][35]);
                C190[ID].MntNoTributado += Number(ArrItem[i][53]);
              }

            }
          }

          if (tipo_transaction == 'VendBill' || tipo_transaction == 'ItemRcpt') {

            if (!C190[ID] && ArrItem[i][12] != '' && ArrItem[i][12] != '0') {
              C190[ID] = {
                "id": ID,
                "baseicsm": Number(ArrItem[i][10]),
                "montoicms": round(Number(ArrItem[i][11])),
                "montoipi": Number(ArrItem[i][15]),
                "CFOP": ArrItem[i][7],
                "montoitem": Number(ArrItem[i][2]),
                "ST_ICMS": ArrItem[i][12],
                "Porc_ICMS": ArrItem[i][13],
                "monto_icmsst": round(Number(ArrItem[i][56])),
                "base_icmsst": round(Number(ArrItem[i][55])),
                "MntNoTributado": Number(ArrItem[i][53])
              };
            } else {
              if (C190[ID] != undefined) {
                C190[ID].baseicsm += Number(ArrItem[i][10]);
                C190[ID].montoicms += round(Number(ArrItem[i][11]));
                C190[ID].montoipi += Number(ArrItem[i][15]);
                C190[ID].montoitem += Number(ArrItem[i][2]);
                C190[ID].monto_icmsst += round(Number(ArrItem[i][56]));
                C190[ID].base_icmsst += round(Number(ArrItem[i][55]));
                C190[ID].MntNoTributado += Number(ArrItem[i][53]);
              }

            }
          }



          //armamos lo C197
          if (tipo_transaction == 'VendBill' && ArrItem[i][50] != '' && ArrItem[i][51] != '' && ArrItem[i][47] != '0' && ArrItem[i][47] != '') {
            if (!flag_c197) { flag_c197 = true; }
            if (!C197[ArrItem[i][0]]) {
              C197[ArrItem[i][0]] = {
                "codigo": ArrItem[i][0],
                "aju_ori": ArrItem[i][50],
                "aju_des": ArrItem[i][51],
                "baseicms": Number(ArrItem[i][10]),
                "Porc_ICMS": ArrItem[i][49],
                "monto_icms": Number(ArrItem[i][48]),
                "Porc_icmsst": ArrItem[i][47],
                "monto_icmsst": Number(ArrItem[i][45])
              };
            } else {
              C197[ArrItem[i][0]].baseicms += Number(ArrItem[i][10]);
              C197[ArrItem[i][0]].monto_icms += Number(ArrItem[i][48]);
              C197[ArrItem[i][0]].monto_icmsst += Number(ArrItem[i][45]);
            }
          }

        }
        //aqui se generara la Linea C171 - Una factura sobre combustible no deberia tener mas de un Item
        //OJO: ademas los campos con respecto a los tanques no deben estar vacíos
        if (num_tank != '' && vol_tank != '' && (ArrItem[i][9] == '01' || ArrItem[i][9] == '55') && id_transaction == ArrItem[i][1]) {
          //0. CAMPO FIJO
          strC170 += '|C171|';
          //1. NUMERO DE TANQUE
          strC170 += num_tank + '|';
          //2. VOLUMEN(LITROS) COMBUSTIBLE
          strC170 += vol_tank + '|' + salto;
          contador_bloque_C171++;
        }
        //aqui se generar la linea C173 - este campo sobre medicamentos aun no se como  validarlo
        //asi que lo hare para que aparezca solo si el item esta configurado para tener lote si no NEL no generara esta Linea
        //quedo claro? -- OK Polisha
        if (ArrItem[i][26] != '' && ArrItem[i][27] != '' && ArrItem[i][28] != '' && (ArrItem[i][9] == '01' || ArrItem[i][9] == '55') && id_transaction == ArrItem[i][1]) {
          //1. Campo FIJO
          strC170 += '|C173|';
          //2. LOTE_MED
          strC170 += ArrItem[i][26] + '|';
          //3. QTD_ITEM
          strC170 += ArrItem[i][27] + '|';
          //4. DT_FAB
          strC170 += fecha_ini + '|';
          //5. DT_VAL
          strC170 += ArrItem[i][28] + '|';
          //6. IND_MED
          strC170 += '0|';
          //7. TP_PROD
          strC170 += '1|';
          //8. VL_TAB_MAX
          strC170 += ArrItem[i][2] + '|' + salto;
          contador_bloque_C173++;
        }

        //Genero la Linea C175
        if (ArrItem[i][29] != '' && ArrItem[i][30] != '' && (ArrItem[i][9] == '01' || ArrItem[i][9] == '55') && id_transaction == ArrItem[i][1]) {
          //1. Campo Fijo
          strC170 += '|C175|';
          //2. IND_VEIC_OPER
          strC170 += ArrItem[i][29] + '|';
          //3. CNPJ consesionaria
          strC170 += ArrItem[i][30] + '|';
          //4. UF
          strC170 += ArrItem[i][59] + '|';
          //5. CHASSI_VEIC --seguro crearan un campo cuando ya no te aqui .... recuerda si viene del item hazlo en la busqueda de netsuite o de repente tmb viene del tax result xD ya tu ve
          //quien quiera que le toque esta shit :v
          //igual siento que se puede mejorar mas
          if (ArrItem[i][60] != '') {
            if (ArrItem[i][60].length > 17) {
              if (ArrItem[i][60].substring(16, 17) == ' ') {
                strC170 += ArrItem[i][60].substring(0, 16) + '|' + salto;
              } else {
                strC170 += ArrItem[i][60].substring(0, 17) + '|' + salto;
              }
            } else {
              strC170 += ArrItem[i][60] + '|' + salto;
            }
          } else {
            strC170 += '|' + salto;
          }

          contador_bloque_C175++;
        }
      }

      for (var i in C190) {
        //Se genera La linea C190
        //1. REG
        strC170 += '|C190|';
        //2. CST_ICMS
        strC170 += C190[i].ST_ICMS + '|';
        //3. CFOP
        strC170 += ValidaGuion(C190[i].CFOP) + '|';
        //4. Alicuota ICMS
        strC170 += (Number(ValidaPorcentaje(C190[i].Porc_ICMS)) * 100).toFixed(2) + '|';
        //5. VL_OPR
        strC170 += Number(C190[i].montoitem).toFixed(2) + '|';
        //6. VL_BC_ICMS
        strC170 += Number(C190[i].baseicsm).toFixed(2) + '|';
        //7. VL_ICMS
        strC170 += Number(C190[i].montoicms).toFixed(2) + '|';
        if (tipo_transaction == 'VendBill' || tipo_transaction == 'ItemRcpt') {
          campo6_E110 += Number(C190[i].montoicms);
          /*if (situacion == '01|') {
            campo15_E110 += Number(C190[i].montoicms);
          }*/
        } else {
          if (situacion == '00|') {
            campo2_E110 += Number(C190[i].montoicms);
          } else if (situacion == '01|') {
            campo15_E110 += Number(C190[i].montoicms);
          }
        }

        if (tipo_transaction != 'VendBill' && tipo_transaction != 'ItemRcpt') {
          //8. VL_BC_ICMS_ST
          strC170 += '0|';
          //9. VL_ICMS_ST
          strC170 += '0|';
          /*//8. VL_BC_ICMS_ST
          strC170 += Number(C190[i].base_icmsst).toFixed(2)+'|';
          //9. VL_ICMS_ST
          strC170 += Number(C190[i].monto_icmsst).toFixed(2)+'|';*/
        } else {
          //8. VL_BC_ICMS_ST
          strC170 += Number(C190[i].base_icmsst) + '|';
          //9. VL_ICMS_ST
          strC170 += Number(C190[i].monto_icmsst) + '|';
        }
        //10. VL_RED_BC
        if (tipo_transaction == 'VendBill') {
          strC170 += (C190[i].MntNoTributado).toFixed(2) + '|';
        } else {
          strC170 += '0|';
        }
        //11. VL_IPI
        strC170 += Number(C190[i].montoipi).toFixed(2) + '|';
        if (tipo_transaction == 'VendBill' && tipo_transaction != 'ItemRcpt') {
          campo4_E510 += C190[i].montoipi;
        }
        if (tipo_transaction == 'CustInvc' || tipo_transaction == 'VendCred') {
          campo3_E510 += C190[i].montoipi;
        }
        //12. COD_OBS
        if (tipo_transaction != 'VendBill') {
          strC170 += '|' + salto;
        } else {
          strC170 += codc195 + '|' + salto;
        }

        contador_bloque_C190++;
      }
      //Registro C195
      //icms - origin
      //icmsst - destino
      if (flag_c197 && tipo_transaction == 'VendBill' && codc195 != '' && nomc195 != '') {
        strC170 += '|C195|';
        strC170 += codc195 + '|';
        strC170 += nomc195 + '|' + salto;
        contador_C195++;
      }

      //Registro C197
      for (k in C197) {
        if (C197[k].aju_ori != '' && C197[k].aju_des != '' && C197[k].Porc_ICMS != '0' && C197[k].Porc_ICMS != '') {
          //1. Registro para Origen
          strC170 += '|C197|';
          //2. COD_AJ
          strC170 += C197[k].aju_ori + '|';
          //3. DESCR_COMPL_AJ
          strC170 += '|';
          //4. COD_ITEM
          strC170 += C197[k].codigo + '|';
          //5. VL_BC_ICMS
          strC170 += Number(C197[k].baseicms).toFixed(2) + '|';
          //6. ALIQ_ICMS
          strC170 += Number(ValidaPorcentaje(C197[k].Porc_ICMS)).toFixed(2) + '|';
          //7. VL_ICMS
          strC170 += Number(C197[k].monto_icms).toFixed(2) + '|';
          if (ArrAjusteDebito3C.indexOf(C197[k].aju_ori.charAt(2)) != -1 && ArrAjuste4C.indexOf(C197[k].aju_ori.charAt(3)) != -1) {
            campo3_E110 += C197[k].monto_icms;
          }
          if (ArrAjusteCredito3C.indexOf(C197[k].aju_ori.charAt(2)) != -1 && ArrAjuste4C.indexOf(C197[k].aju_ori.charAt(3)) != -1) {
            campo7_E110 += C197[k].monto_icms;
          }
          //8. VL_OUTROS
          strC170 += '|' + salto;
          contador_C197++;
          //1. Registro para salida
          strC170 += '|C197|';
          //2. COD_AJ
          strC170 += C197[k].aju_des + '|';
          //3. DESCR_COMPL_AJ
          strC170 += '|';
          //4. COD_ITEM
          strC170 += C197[k].codigo + '|';
          //5. VL_BC_ICMS
          strC170 += Number(C197[k].baseicms).toFixed(2) + '|';
          //6. ALIQ_ICMS
          strC170 += Number(ValidaPorcentaje(C197[k].Porc_icmsst)).toFixed(2) + '|';
          //7. VL_ICMS
          strC170 += Number(C197[k].monto_icmsst).toFixed(2) + '|';
          if (ArrAjusteDebito3C.indexOf(C197[k].aju_des.charAt(2)) != -1 && ArrAjuste4C.indexOf(C197[k].aju_des.charAt(3)) != -1) {
            campo3_E110 += C197[k].monto_icmsst;
          }
          if (ArrAjusteCredito3C.indexOf(C197[k].aju_des.charAt(2)) != -1 && ArrAjuste4C.indexOf(C197[k].aju_des.charAt(3)) != -1) {
            campo7_E110 += C197[k].monto_icmsst;
          }
          //8. VL_OUTROS
          strC170 += '|' + salto;
          contador_C197++;
        }
      }
      //esto tengo que arreglarlo xD
      return strC170 + '?' + contador_bloque_C170 + '?' + contador_bloque_C190 + '?' + contador_bloque_C171 + '?' + contador_bloque_C173 + '?' + contador_bloque_C175 + '?' + contador_C195 + '?' + contador_C197;
    }


    function GenerarC100() {
      var contador_bloque = 0;
      var strC100 = '';
      var flag = false;
      //***************** BLOQUEC *****************
      //Registro C100
      var salto = '\r\n';
      var contador_bloqueC100 = 0;
      var contadorC101 = 0;
      var contadorC110 = 0;
      var contadorC113 = 0;
      var contadorC170 = 0;
      var contadorC190 = 0;
      var contadorC120 = 0;
      var contadorC171 = 0;
      var contadorC173 = 0;
      var contadorC175 = 0;
      var contadorC195 = 0;
      var contadorC197 = 0;

      for (var i = 0; i < arrTransaction.length; i++) {
        //registro c120ç
        var C120 = '';
        if ((arrTransaction[i][2] == '01' || arrTransaction[i][2] == '1B' || arrTransaction[i][2] == '04' || arrTransaction[i][2] == '55' || arrTransaction[i][2] == '65') /*&& arrTransaction[i][22] != '0'*/) {
          if (!flag) {
            flag = true;
          }
          if (((arrTransaction[i][1] == 'CustInvc' || arrTransaction[i][1] == 'ItemShip') && arrTransaction[i][66] == 'Cancelada') || arrTransaction[i][1] == 'VendCred' && arrTransaction[i][72] == 'Cancelada') {
            //1.- Texto Fijo

            campo1 = '|C100|';
            if (arrTransaction[i][1] == 'VendCred') {
              //2.- Indice de Operacion sera codigo 0 solo porque se declararan compras
              campo2 = '1|';
              //3.- INDICE DE EMITENTE por el momento esta por terceros
              campo3 = '0|';
            } else {
              //2.- Indice de Operacion sera codigo 0 solo porque se declararan compras
              campo2 = '1|';
              //3.- INDICE DE EMITENTE por el momento esta por terceros
              campo3 = '0|';
            }
            //4.- CODIGO DE PARTICIPANTE
            campo4 = '|';
            //5.- CODIGO DE MODELO DE DOCUMENTO FISCAL
            campo5 = arrTransaction[i][2] + '|';
            //6.- CODIGO SITUACION -ESTE CAMPO SI SERA UN DOLOR DE CABEZA --esto aun no esta validado xD
            campo6 = '02|';
            //7.- SERIE DE DOCUEMNTO FISCL
            campo7 = arrTransaction[i][5].substring(0, 3) + '|';
            //8.- NUMERO DE DOCUMENTO FISCAL
            campo8 = arrTransaction[i][4].substring(0, 9) + '|';
            //9.- CLAVE DE LA NOTA FISCAL - si es NFE es el Preimpreso de la transaccion
            if (arrTransaction[i][2] == '55' || arrTransaction[i][2] == '65') {
              campo9 = arrTransaction[i][46] + '|';
            } else {
              campo9 = '|';
            }
            //10.- DATA DE EMISION DE DOCUMENTO
            campo10 = '|';
            //11.- DATA DE ENTRADA O DE SALIDA (NO ENITENDO A QUE SE REFIERE XD)
            campo11 = '|';
            //12.- VALOR DEL DCUMENTO FISCAL
            campo12 = '|';
            //por el momento este campo lo seteare como 1
            //13.- IND DE PAGAMENTO--- lo de arriba
            campo13 = '|';
            //14.- VALOR DE DESCUENTO (por el momento este campo se estara seteando como 0)
            if (arrTransaction[i][1] == 'CustInvc') {
              campo14 = Number(arrTransaction[i][80]).toFixed(2) + '|';
            } else {
              campo14 = '0|';
            }

            //15.- VL_ABAT_NT NI IDEA PARA QUE ES ESTE (tambien se estara seteando como 0)
            campo15 = '|';
            //16.-VALOR totAL DE LAS MERCADORIAS o SERVICIOS
            campo16 = '|';
            //17.- INDICIE DE FRETE
            //por el momento le voy a setear voy asumir que no contrata el frete
            if (arrTransaction[i][1] == 'CustInvc') {
              campo17 = arrTransaction[i][19] + '|';
            } else {
              campo17 = '|';
            }
            //18.- VALOR DEL FRETE
            if (arrTransaction[i][19] == '9' || arrTransaction[i][1] != 'CustInvc') {
              campo18 = '0|';
            } else {
              campo18 = Number(arrTransaction[i][79]).toFixed(2) + '|';
            }
            //19.- VALOR DE SEGURO INDICADO EN EL DOCUMENTO FISCAL -- Por el momento sera 0
            if (arrTransaction[i][1] == 'CustInvc') {
              campo19 = Number(arrTransaction[i][81]).toFixed(2) + '|';
            } else {
              campo19 = '0|';
            }
            //20.- VALOR DE OTRAS COSAS -- por el momento sera 0
            if (arrTransaction[i][1] == 'CustInvc') {
              campo20 = Number(arrTransaction[i][82]).toFixed(2) + '|';
            } else {
              campo20 = '0|';
            }

            //21.- VALOR DE BSE DE CALCULO DEL ICMS
            //campo de la base de calculo ICMS
            campo21 = '|';
            //22.- VALOR DEL ICMS
            campo22 = '|';
            //23.- VALOR DEL ICMS DE SUBSTITUCION TRIBUTARIA
            campo23 = '|';
            //24.- VALOR DE ICMS RETENIDO POR SUBTITUCION TRIBUTARIA
            campo24 = '|';
            //25.- VALOR TOTAL DE IPI
            campo25 = '|';
            //26.- VALOR TOTAL DE PIS
            campo26 = '|';
            //27.- VALOR TOTAL DE COFINS
            campo27 = '|';
            //if (version_efd  == '014' || version_efd == '015' || version_efd == '016') {
            if (version_efd != '013') {
              //28.- VALOR TOTAL DE PIS RETENIDO POR SUBSTITUCION TRIBUTARIA
              campo28 = '|';
              //29.- VALOR TOTAL DE COFINS RETENIDO POR SUBSTITUCION TRIBUTARIA
              campo29 = '|';
              strC100 += campo1 + campo2 + campo3 + campo4 + campo5 + campo6 + campo7 + campo8 + campo9 + campo10 + campo11 + campo12 + campo13 + campo14 + campo15 + campo16 + campo17 + campo18 +
                campo19 + campo20 + campo21 + campo22 + campo23 + campo24 + campo25 + campo26 + campo27 + campo28 + campo29 + salto;
            } else if (version_efd == '013') {
              strC100 += campo1 + campo2 + campo3 + campo4 + campo5 + campo6 + campo7 + campo8 + campo9 + campo10 + campo11 + campo12 + campo13 + campo14 + campo15 + campo16 + campo17 + campo18 +
                campo19 + campo20 + campo21 + campo22 + campo23 + campo24 + campo25 + campo26 + campo27 + salto;
            }
            contador_bloqueC100++;
          } else {
            //1.- Texto Fijo
            campo1 = '|C100|';
            //2.- Indice de Operacion sera codigo 0 solo porque se declararan compras
            if (arrTransaction[i][1] == 'VendBill' || arrTransaction[i][1] == 'ItemRcpt') {
              campo2 = '0|';
            } else {
              campo2 = '1|';
            }
            //3.- INDICE DE EMITENTE por el momento esta por terceros
            if (arrTransaction[i][1] == 'VendBill' || arrTransaction[i][1] == 'ItemRcpt') {
              campo3 = '1|';
            } else {
              campo3 = '0|';
            }
            //4.- CODIGO DE PARTICIPANTE
            campo4 = arrTransaction[i][3] + '|';
            //5.- CODIGO DE MODELO DE DOCUMENTO FISCAL
            campo5 = arrTransaction[i][2] + '|';
            //6.- CODIGO SITUACION -ESTE CAMPO SI SERA UN DOLOR DE CABEZA --esto aun no esta validado xD
            /*if (arrTransaction[i][1] == 'VendBill') {
              campo6 = Compararfechas(arrTransaction[i][6],arrTransaction[i][52],0) + '|';
            }else {
              campo6 = Compararfechas(arrTransaction[i][6],arrTransaction[i][65],0) + '|';
            }*/
            if (arrTransaction[i][1] == 'VendBill' || arrTransaction[i][1] == 'CustInvc') {
              campo6 = arrTransaction[i][71] + '|'
            } else {
              campo6 = '00|'
            }
            //7.- SERIE DE DOCUEMNTO FISCL
            //campo7 = completar_cero(3,arrTransaction[i][5]) + '|';
            campo7 = arrTransaction[i][5].substring(0, 3) + '|';
            //8.- NUMERO DE DOCUMENTO FISCAL
            campo8 = arrTransaction[i][4].substring(0, 9) + '|';
            //9.- CLAVE DE LA NOTA FISCAL - si es NFE es el Preimpreso de la transaccion
            if (arrTransaction[i][2] == '55' || arrTransaction[i][2] == '65') {
              if (arrTransaction[i][1] == 'VendBill' || arrTransaction[i][1] == 'VendCred' || arrTransaction[i][1] == 'ItemRcpt') {
                campo9 = arrTransaction[i][53] + '|';
              } else if (arrTransaction[i][1] == 'CustInvc' || arrTransaction[i][1] == 'ItemShip') {
                campo9 = arrTransaction[i][46] + '|';
              } else {
                campo9 = '|';
              }
            } else {
              campo9 = '|';
            }
            //10.- DATA DE EMISION DE DOCUMENTO
            campo10 = arrTransaction[i][6] + '|';
            //11.- DATA DE ENTRADA O DE SALIDA (NO ENITENDO A QUE SE REFIERE XD)
            if (arrTransaction[i][1] == 'VendBill' || arrTransaction[i][1] == 'ItemRcpt' || arrTransaction[i][1] == 'VendCred') {
              campo11 = arrTransaction[i][52] + '|';
            } else if (arrTransaction[i][1] == 'CustInvc' || arrTransaction[i][1] == 'ItemShip') {
              campo11 = arrTransaction[i][65] + '|';
            } else {
              campo11 = '|';
            }
            //12.- VALOR DEL DCUMENTO FISCAL

            campo12 = Number(arrTransaction[i][7]);
            campo12 = Number(campo12).toFixed(2) + '|';

            //por el momento este campo lo seteare como 1
            //13.- IND DE PAGAMENTO--- lo de arriba
            campo13 = arrTransaction[i][25] + '|';
            //14.- VALOR DE DESCUENTO
            if (arrTransaction[i][1] == 'VendBill' || arrTransaction[i][1] == 'CustInvc') {
              campo14 = Number(arrTransaction[i][80]).toFixed(2) + '|';
            } else {
              campo14 = '0|';
            }
            //15.- VL_ABAT_NT NI IDEA PARA QUE ES ESTE (tambien se estara seteando como 0)
            campo15 = '0|';
            //16.-VALOR totAL DE LAS MERCADORIAS o SERVICIOS
            campo16 = Number(arrTransaction[i][10]).toFixed(2) + '|';
            //17.- INDICIE DE FRETE
            //por el momento le voy a setear voy asumir que no contrata el frete
            campo17 = arrTransaction[i][19] + '|';
            //18.- VALOR DEL FRETE
            if (arrTransaction[i][19] == '9') {
              campo18 = '0|';
            } else {
              if (arrTransaction[i][1] == 'VendBill' || arrTransaction[i][1] == 'CustInvc') {
                campo18 = Number(arrTransaction[i][79]).toFixed(2) + '|';
              } else {
                campo18 = Number(arrTransaction[i][14]).toFixed(2) + '|';
              }

            }
            //19.- VALOR DE SEGURO INDICADO EN EL DOCUMENTO FISCAL
            if (arrTransaction[i][1] == 'VendBill' || arrTransaction[i][1] == 'CustInvc') {
              campo19 = Number(arrTransaction[i][81]).toFixed(2) + '|';
            } else {
              campo19 = Number(arrTransaction[i][15]).toFixed(2) + '|';
            }
            //20.- VALOR DE OTRAS COSAS -- por el momento sera 0
            if (arrTransaction[i][1] == 'VendBill' || arrTransaction[i][1] == 'CustInvc') {
              campo20 = Number(arrTransaction[i][82]).toFixed(2) + '|';
            } else {
              campo20 = '0|';
            }

            //21.- VALOR DE BSE DE CALCULO DEL ICMS
            //campo de la base de calculo ICMS
            campo21 = Number(arrTransaction[i][20]).toFixed(2) + '|';
            //22.- VALOR DEL ICMS
            campo22 = Number(arrTransaction[i][21]).toFixed(2) + '|';
            if (arrTransaction[i][1] == 'VendBill' || arrTransaction[i][1] == 'VendCred') {
              //23.- VALOR DE la base ICMS DE SUBSTITUCION TRIBUTARIA
              campo23 = round(Number(arrTransaction[i][75])) + '|';
              //24.- VALOR DE ICMS RETENIDO POR SUBTITUCION TRIBUTARIA
              campo24 = round(Number(arrTransaction[i][76])) + '|';
            } else {
              //23.- VALOR DEL ICMS DE SUBSTITUCION TRIBUTARIA
              //campo23 = Number(arrTransaction[i][48]).toFixed(2)+'|';
              //24.- VALOR DE ICMS RETENIDO POR SUBTITUCION TRIBUTARIA
              //campo24 = Number(arrTransaction[i][49]).toFixed(2)+'|';
              campo23 = '0|';
              //24.- VALOR DE ICMS RETENIDO POR SUBTITUCION TRIBUTARIA
              campo24 = '0|';
            }
            //25.- VALOR TOTAL DE IPI
            campo25 = Number(arrTransaction[i][27]).toFixed(2) + '|';
            //26.- VALOR TOTAL DE PIS
            campo26 = Number(arrTransaction[i][31]).toFixed(2) + '|';
            //27.- VALOR TOTAL DE COFINS
            campo27 = Number(arrTransaction[i][35]).toFixed(2) + '|';
            //if (version_efd  == '014' || version_efd  == '015' || version_efd == '016') {
            if (version_efd != '013') {
              //28.- VALOR TOTAL DE PIS RETENIDO POR SUBSTITUCION TRIBUTARIA
              campo28 = '|';
              //29.- VALOR TOTAL DE COFINS RETENIDO POR SUBSTITUCION TRIBUTARIA
              campo29 = '|';
              strC100 += campo1 + campo2 + campo3 + campo4 + campo5 + campo6 + campo7 + campo8 + campo9 + campo10 + campo11 + campo12 + campo13 + campo14 + campo15 + campo16 + campo17 + campo18 +
                campo19 + campo20 + campo21 + campo22 + campo23 + campo24 + campo25 + campo26 + campo27 + campo28 + campo29 + salto;
            } else if (version_efd == '013') {
              strC100 += campo1 + campo2 + campo3 + campo4 + campo5 + campo6 + campo7 + campo8 + campo9 + campo10 + campo11 + campo12 + campo13 + campo14 + campo15 + campo16 + campo17 + campo18 +
                campo19 + campo20 + campo21 + campo22 + campo23 + campo24 + campo25 + campo26 + campo27 + salto;
            }
            contador_bloqueC100++;
            var C101 = '';
            //AQUI SE GENERARA PARA EL BLOQUE C101
            if (arrTransaction[i][1] == 'CustInvc' && (arrTransaction[i][53] != '0' || arrTransaction[i][57] != '0')) {
              //1. REG
              C101 += '|C101|';
              //2. VL_FCP_UF_DEST
              C101 += arrTransaction[i][53] + '|';
              suma_FCP += Number(arrTransaction[i][53]);
              //3. VL_ICMS_UF_DEST
              C101 += arrTransaction[i][57] + '|';
              suma_ICMSUFDest += Number(arrTransaction[i][57]);
              //4. VL_ICMS_UF_REM
              C101 += '0|' + salto;
              contadorC101++;
              arrAuxiliar = new Array();
              //monto FCP
              arrAuxiliar[0] = Number(arrTransaction[i][53]);
              //MOnto ICMSUFDest
              arrAuxiliar[1] = Number(arrTransaction[i][57]);
              //UF DE DESTINO
              arrAuxiliar[2] = arrTransaction[i][60];
              arrFCPUF.push(arrAuxiliar);
            }
            C110 = '';
            //generar linea C110
            if ((arrTransaction[i][2] == '01' || arrTransaction[i][2] == '1B' || arrTransaction[i][2] == '04' || arrTransaction[i][2] == '55') && arrTransaction[i][1] != 'ItemShip' && arrTransaction[i][1] != 'ItemRcpt' && c_0450 == 'T') {
              if (arrTransaction[i][1] == 'CustInvc' && arrTransaction[i][70] != '') {
                C110 += '|C110|';
                //1.COD_INF
                C110 += arrTransaction[i][0].substring(arrTransaction[i][0].length - 6, arrTransaction[i][0].length) + '|';
                //2.TXT_COMPL
                auxiliar = String(arrTransaction[i][70]).substring(0, 250);
                auxiliar = auxiliar.replace(/\n/g,"");
                auxiliar = auxiliar.replace(/\r/g,"");
                auxiliar = auxiliar.replace(/\t/g,"");
                if (auxiliar.charAt(auxiliar.length - 1) == ' ') {
                  C110 += auxiliar.slice(0, -1) + '|' + salto;
                } else {
                  C110 += auxiliar + '|' + salto;
                }
                contadorC110++;
              } else if (arrTransaction[i][1] == 'VendBill' && arrTransaction[i][57] != '') {
                C110 += '|C110|';
                //1.COD_INF
                C110 += arrTransaction[i][0].substring(arrTransaction[i][0].length - 6, arrTransaction[i][0].length) + '|';
                //2.TXT_COMPL
                auxiliar = String(arrTransaction[i][57]).substring(0, 250);
                auxiliar = auxiliar.replace(/\n/g,"");
                auxiliar = auxiliar.replace(/\r/g,"");
                auxiliar = auxiliar.replace(/\t/g,"");
                if (auxiliar.charAt(auxiliar.length - 1) == ' ') {
                  C110 += auxiliar.slice(0, -1) + '|' + salto;
                } else {
                  C110 += auxiliar + '|' + salto;
                }
                contadorC110++;
              } else {
                if (arrTransaction[i][1] == 'VendCred') {
                  C110 += '|C110|';
                  //1.COD_INF
                  C110 += arrTransaction[i][0].substring(arrTransaction[i][0].length - 6, arrTransaction[i][0].length) + '|';
                  //2.TXT_COMPL
                  C110 += 'DANFE|' + salto;
                  contadorC110++;
                }

              }

            }

            //Registro C113 para Bill Referenciados en los Bill Credit
            C113 = '';
            if (arrTransaction[i][1] == 'VendCred' && c_0450 == 'T') {
              //1.
              C113 += '|C113|';
              //2. IND_OPER -- como es Bill se pondra 0 de entrada
              C113 += '0|';
              //3. IND_EMIT -- como es Bill se pondra 1 de entrada
              C113 += '1|';
              //4. COD_PART
              C113 += arrTransaction[i][3] + '|';
              //5. COD_MOD
              C113 += arrTransaction[i][70] + '|';
              //6. SER
              C113 += arrTransaction[i][67].substring(0, 4) + '|';
              //7. SUB -- este campo va vacio
              C113 += '|';
              //8. NUM_DOC
              C113 += arrTransaction[i][66].substring(0, 9) + '|';
              //9. DT_DOC
              C113 += arrTransaction[i][68] + '|';
              //10. CHV_DOCe
              if (arrTransaction[i][70] == '55') {
                C113 += ValidaGuion(arrTransaction[i][69]) + '|' + salto;
              } else {
                C113 += '|' + salto;
              }
              contadorC113++;
            }

            //hay que aclarar algo
            //para esta version pondre que por cada transaccion de importacion
            //generara una linea C120
            //SI tu el que esta revisando esto si cambia eso ya tu ves como lo haces (>.<)/
            if (arrTransaction[i][1] == 'VendBill' && arrTransaction[i][24] == '1' && arrTransaction[i][38] != '' && arrTransaction[i][39] != '' && (arrTransaction[i][2] == '01' || arrTransaction[i][2] == '55')) {
              //1. REG
              C120 += '|C120|';
              //2. COD_DOC_IMP
              C120 += arrTransaction[i][38] + '|';
              //3. NUM_DOC_IMP
              C120 += arrTransaction[i][39].substring(0, 12) + '|';
              //4. PIS_IMP
              C120 += arrTransaction[i][30] + '|';
              //5. COFINS IMP
              C120 += arrTransaction[i][34] + '|';
              //6. NUM_ACDRAW
              C120 += arrTransaction[i][40].substring(0, 20) + '|' + salto;
              contadorC120++;
            }
            auxiliar = GenerarC170(arrTransaction[i][0], arrTransaction[i][41], arrTransaction[i][42], arrTransaction[i][6], arrTransaction[i][1], arrTransaction[i][2], arrTransaction[i][58], arrTransaction[i][59], campo6, arrTransaction[i][77]);
            //auxiliar = auxiliar.replace(/\./g,',');
            //arreglo que tendra todo el poder xDDDDD
            var arregloC = auxiliar.split('?');
            strC100 += C101;
            strC100 += C110;
            strC100 += C113;
            strC100 += C120;
            strC100 += arregloC[0];
            contadorC170 += Number(arregloC[1]);
            contadorC190 += Number(arregloC[2]);
            contadorC171 += Number(arregloC[3]);
            contadorC173 += Number(arregloC[4]);
            contadorC175 += Number(arregloC[5]);
            contadorC195 += Number(arregloC[6]);
            contadorC197 += Number(arregloC[7]);
          }
        }
      }

      for (var i = 0; i < arrAnuladas.length; i++) {
        if (arrAnuladas[i][6] == '01' || arrAnuladas[i][6] == '1B' || arrAnuladas[i][6] == '04' || arrAnuladas[i][6] == '55' || arrAnuladas[i][6] == '65') {
          if (!flag) {
            flag = true;
          }
          //1.- Texto Fijo
          strC100 += '|C100|';
          //2.- Indice de Operacion sera codigo 0 solo porque se declararan compras
          strC100 += arrAnuladas[i][1] + '|';
          //3.- INDICE DE EMITENTE por el momento esta por terceros
          strC100 += arrAnuladas[i][7] + '|';
          //4.- CODIGO DE PARTICIPANTE
          strC100 += '|';
          //5.- CODIGO DE MODELO DE DOCUMENTO FISCAL
          strC100 += arrAnuladas[i][6] + '|';
          //6.- CODIGO SITUACION -ESTE CAMPO SI SERA UN DOLOR DE CABEZA --esto aun no esta validado xD
          strC100 += '02|';
          //7.- SERIE DE DOCUEMNTO FISCL
          if (arrAnuladas[i][1] == '0') {
            strC100 += arrAnuladas[i][4].substring(0, 3) + '|'
          } else {
            strC100 += arrAnuladas[i][5].substring(0, 3) + '|'
          }
          //8.- NUMERO DE DOCUMENTO FISCAL
          strC100 += arrAnuladas[i][2].substring(0, 9) + '|';
          //9.- CLAVE DE LA NOTA FISCAL - si es NFE es el Preimpreso de la transaccion
          if (arrAnuladas[i][6] == '55' || arrAnuladas[i][6] == '65') {
            strC100 += arrAnuladas[i][8] + '|';
          } else {
            strC100 += '|';
          }
          //10.- DATA DE EMISION DE DOCUMENTO
          strC100 += '|';
          //11.- DATA DE ENTRADA O DE SALIDA (NO ENITENDO A QUE SE REFIERE XD)
          strC100 += '|';
          //12.- VALOR DEL DCUMENTO FISCAL
          strC100 += '|';
          //por el momento este campo lo seteare como 1
          //13.- IND DE PAGAMENTO--- lo de arriba
          strC100 += '|';
          //14.- VALOR DE DESCUENTO (por el momento este campo se estara seteando como 0)
          strC100 += '|';
          //15.- VL_ABAT_NT NI IDEA PARA QUE ES ESTE (tambien se estara seteando como 0)
          strC100 += '|';
          //16.-VALOR totAL DE LAS MERCADORIAS o SERVICIOS
          strC100 += '|';
          //17.- INDICIE DE FRETE
          //por el momento le voy a setear voy asumir que no contrata el frete
          strC100 += '|';
          //18.- VALOR DEL FRETE
          strC100 += '|';
          //19.- VALOR DE SEGURO INDICADO EN EL DOCUMENTO FISCAL -- Por el momento sera 0
          strC100 += '|';
          //20.- VALOR DE OTRAS COSAS -- por el momento sera 0
          strC100 += '|';
          //21.- VALOR DE BSE DE CALCULO DEL ICMS
          //campo de la base de calculo ICMS
          strC100 += '|';
          //22.- VALOR DEL ICMS
          strC100 += '|';
          //23.- VALOR DEL ICMS DE SUBSTITUCION TRIBUTARIA
          strC100 += '|';
          //24.- VALOR DE ICMS RETENIDO POR SUBTITUCION TRIBUTARIA
          strC100 += '|';
          //25.- VALOR TOTAL DE IPI
          strC100 += '|';
          //26.- VALOR TOTAL DE PIS
          strC100 += '|';
          //27.- VALOR TOTAL DE COFINS
          strC100 += '|';
          //if (version_efd  == '014' || version_efd  == '015' || version_efd  == '016') {
          if (version_efd != '013') {
            //28.- VALOR TOTAL DE PIS RETENIDO POR SUBSTITUCION TRIBUTARIA
            strC100 += '|';
            //29.- VALOR TOTAL DE COFINS RETENIDO POR SUBSTITUCION TRIBUTARIA
            strC100 += '|' + salto;
          } else if (version_efd == '013') {

          }
          contador_bloqueC100++;
        }
      }

      for (var i = 0; i < arrInutilizados.length; i++) {
        a = Number(arrInutilizados[i][0]);
        for (var j = Number(arrInutilizados[i][0]); j < Number(arrInutilizados[i][1]) + 1; j++) {
          strC100 += '|C100|1|0||' + arrInutilizados[i][3] + '|05|' + arrInutilizados[i][2] + '|' + a + '||||||||||||||||||||||' + salto;
          a++;
          contador_bloqueC100++;
        }
      }

      if (flag) {
        return strC100 + '?' + contador_bloqueC100 + '?' + contadorC170 + '?' + contadorC190 + '?' + contadorC120 + '?' + contadorC171 + '?' + contadorC173 + '?' + contadorC175 + '?' + contadorC101 + '?' + contadorC110 + '?' + contadorC195 + '?' + contadorC197 + '?' + contadorC113;
      } else {
        return '';
      }

    }

    function GenerarArreglos() {

      //arreglos para compras
      if (param_bloqueD != '' && param_bloqueD != null && param_bloqueD != 'null') {
        var misarreglos = fileModulo.load({
          id: param_bloqueD
        });
        var contenido = misarreglos.getContents();
        var arregloGeneral = contenido.split('//');
        var arrAuxiliar1 = arregloGeneral[0].split('$$');
        var arrAuxiliar2 = arregloGeneral[1].split('&&');
        var arrAuxiliar3 = arregloGeneral[2].split('%%');


        for (var i = 0; i < arrAuxiliar1.length; i++) {
          var aux = arrAuxiliar1[i].split(';');
          if ((aux[51] != '' && aux[51] != '0') || (aux[55] != '' && aux[55] != '0')) {
            arrTransactionS.push(aux);
          } else {
            arrTransaction.push(aux);
          }
        }




        for (var i = 0; i < arrAuxiliar2.length; i++) {
          var aux = arrAuxiliar2[i].split(';');
          ArrItem.push(aux);
        }

        for (var i = 0; i < arrAuxiliar3.length; i++) {
          var aux = arrAuxiliar3[i].split(';');

          ArrVendor.push(aux);

        }

      }


      //arreglos para ventas
      if (param_archivo_ven != '' && param_archivo_ven != null && param_archivo_ven != 'null') {
        var misarreglos2 = fileModulo.load({
          id: param_archivo_ven
        });
        var contenido2 = misarreglos2.getContents();
        var arregloGeneral = contenido2.split('//');
        var arrAuxiliar1 = arregloGeneral[0].split('$$');
        var arrAuxiliar2 = arregloGeneral[1].split('&&');
        var arrAuxiliar3 = arregloGeneral[2].split('%%');
        for (var i = 0; i < arrAuxiliar1.length; i++) {
          var aux = arrAuxiliar1[i].split(';');
          if ((aux[64] != '' && aux[64] != '0') || (aux[67] != '' && aux[67] != '0')) {
            arrTransactionS.push(aux);
          } else {
            arrTransaction.push(aux);
          }
        }
        for (var i = 0; i < arrAuxiliar2.length; i++) {
          var aux = arrAuxiliar2[i].split(';');
          ArrItem.push(aux);
        }

        for (var i = 0; i < arrAuxiliar3.length; i++) {
          var aux = arrAuxiliar3[i].split(';');
          ArrVendor.push(aux);
        }

        ArrVendor.sort(compareSecondColumn);


      }
      //log.error('valor del id de archivo que si me interesa', param_archivo_ren);
      if (param_archivo_ren != '' && param_archivo_ren != null && param_archivo_ren != 'null') {
        var arreglo_G = fileModulo.load({
          id: param_archivo_ren
        });

        var contenido3 = arreglo_G.getContents();
        var arr_auxiliar = contenido3.split('///');

        if (arr_auxiliar[0] != '') {
          arrAuxiliar = arr_auxiliar[0].split('//')

          for (var i = 0; i < arrAuxiliar.length; i++) {
            var auxiliar = arrAuxiliar[i].split('#');
            ArrBloqueG0.push(auxiliar);
          }
        }

        if (arr_auxiliar[1] != '') {
          var Retenciones = arr_auxiliar[1].split('#');
          for (var i = 0; i < Retenciones.length; i++) {
            var auxiliar = Retenciones[i].split(',');
            ArrRetencion.push(auxiliar);
          }
        }



        if (arr_auxiliar[2] != '' && arr_auxiliar[2] != undefined) {
          strAnuladas = arr_auxiliar[2].split('$&');
          for (var i = 0; i < strAnuladas.length; i++) {
            auxiliar = strAnuladas[i].split(',');
            arrAnuladas.push(auxiliar);
          }

        }

        var ArrEntidad = new Array();


        if (arr_auxiliar[3] != '' && arr_auxiliar[3] != undefined) {
          str_inutilizadas = arr_auxiliar[3].split('$');
          for (var i = 0; i < str_inutilizadas.length; i++) {
            auxiliar = str_inutilizadas[i].split(',');
            arrInutilizados.push(auxiliar);
          }

        }

        //para formar los 0200, 0150 y 0190 de parte de las transacciones del bloque G
        if (arr_auxiliar[4] != '' && arr_auxiliar[4] != undefined) {
          str_arreglo = arr_auxiliar[4].split('=');
          entidad = str_arreglo[0].split('@@');
          items = str_arreglo[1].split('&&');

          for (var i = 0; i < entidad.length; i++) {
            auxiliar = entidad[i].split(';');
            ArrEntidad.push(auxiliar);
          }
          for (var i = 0; i < items.length; i++) {
            auxiliar = items[i].split(';');
            ArrItemG.push(auxiliar);
          }

          if (param_bloqueg == 'T') {

            for (var i = 0; i < ArrEntidad.length; i++) {
              existe = false;
              for (var j = 0; j < ArrVendor.length; j++) {
                if (ArrEntidad[i][0] == ArrVendor[j][0]) {
                  existe = true;
                  break;
                }
              }
              if (!existe && ArrSituaciones.indexOf(ArrEntidad[i][11]) != -1) {
                ArrVendorG.push(ArrEntidad[i]);
              }
            }
            /*for (var i = 0; i < ArrG140.length; i++) {
              existe = false;
              for (var j = 0; j < ArrItem.length; j++) {
                if (ArrG140[i][0] == ArrItem[j][0]) {
                  existe = true;
                  break;
                }
              }
              if (!existe && ArrSituaciones.indexOf(ArrG140[i][8]) != -1) {
                ArrItemG.push(ArrG140[i]);
                var arrAuxiliar = new Array();
                arrAuxiliar[0] = ArrG140[i][3];
                arrAuxiliar[1] = ArrG140[i][7];
                ArrUnidadG.push(arrAuxiliar);
              }
            }*/
          }
        }

      }
    }

    function compareSecondColumn(a, b) {
      if (a[0] === b[0]) {
        return 0;
      } else {
        return (a[0] < b[0]) ? -1 : 1;
      }
    }

    function ObtenerPeriodSpecial() {


    }

    function QuitarRepetidosMatriz(arreglo) {

      var arrAuxiliar = new Array();
      for (var i = 0; i < arreglo.length; i++) {
        if (arreglo[i][13] == '1' || arreglo[i][7] == '1') {
          arrAuxiliar.push(arreglo[i]);
        }
      }

      arreglo = arrAuxiliar;

      arrAuxiliar = new Array();
      arreglo.sort(sortFunction);

      function sortFunction(a, b) {
        if (a[0] === b[0]) {
          return 0;
        }
        else {
          return (a[0] < b[0]) ? -1 : 1;
        }
      }

      if (arreglo.length == 1) {
        return arreglo;
      } else {
        var pivote = arreglo[0];

        arrAuxiliar.push(pivote);

        for (var i = 1; i < arreglo.length; i++) {
          if (pivote[0] != arreglo[i][0]) {
            pivote = arreglo[i];
            arrAuxiliar.push(pivote);
          }
        }
        return arrAuxiliar;
      }
    }


    function NoData(hayError) {
      var usuarioTemp = runtime.getCurrentUser();
      var id = usuarioTemp.id;
      var employeename = search.lookupFields({
        type: search.Type.EMPLOYEE,
        id: id,
        columns: ['firstname', 'lastname']
      });
      var usuario = employeename.firstname + ' ' + employeename.lastname;

      if (featureTaxCalendars || featureTaxCalendars == 'T') {
        var nameRecord = ' Special Tax Period.';

      } else {
        var nameRecord = ' Special Accounting Period.';
      }

      if (language == 'es') {
        mensaje_nodata = "No existe informacion para los criterios seleccionados.";
        mensaje_error = "Ocurrio un error inesperado en la ejecucion del reporte.";
        mensaje_special = "El Periodo no esta configurado en el" + nameRecord;

      } else if (language == 'pt') {
        mensaje_nodata = "Não há informações para os critérios selecionados.";
        mensaje_error = "Ocorreu um erro inesperado ao executar o relatório.";
        mensaje_special = "O Período não é configurado no " + nameRecord;
      } else {
        mensaje_nodata = "There is no information for the selected criteria.";
        mensaje_error = "An unexpected error occurred while executing the report.";
        mensaje_special = "The Period is not configured in the" + nameRecord;
      }


      if (hayError) {
        //var message = "se cayo el script, ay dio mio";
        var message = mensaje_error;
      } else {
        if (periodSpecial && !confiSpecial) {
          var message = mensaje_special;
        } else {
          var message = mensaje_nodata;
        }

      }

      var record = recordModulo.load({
        type: 'customrecord_lmry_br_rpt_generator_log',
        id: param_RecorID
      });

      //Nombre de Archivo
      record.setValue({
        fieldId: 'custrecord_lmry_br_rg_name_field',
        value: message
      });

      //Creado Por
      record.setValue({
        fieldId: 'custrecord_lmry_br_rg_employee',
        value: usuario
      });

      //Periodo
      record.setValue({
        fieldId: 'custrecord_lmry_br_rg_period',
        value: periodname
      });

      var recordId = record.save();
    }



    function SaveFile() {
      var FolderId = objContext.getParameter({
        name: 'custscript_lmry_file_cabinet_rg_br'
      });

      // Almacena en la carpeta de Archivos Generados
      if (FolderId != '' && FolderId != null) {
        // Extension del archivo

        //StrReporte = StrReporte.replace(/\./g,',');
        var NameFile = Name_File() + '.txt';
        // Crea el archivo
        var file = fileModulo.create({
          name: NameFile,
          fileType: fileModulo.Type.PLAINTEXT,
          contents: StrReporte,
          //encoding: fileModulo.Encoding.ISO_8859_1,
          folder: FolderId
        });
        //antes como estaba en el SaveFile
        //ISO_8859_1


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
          var id = usuarioTemp.id;
          var employeename = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: id,
            columns: ['firstname', 'lastname']
          });
          var usuario = employeename.firstname + ' ' + employeename.lastname;
          if (false) {
            var record = recordModulo.create({
              type: 'customrecord_lmry_br_rpt_generator_log',

            });

            //Nombre de Archivo
            record.setValue({
              fieldId: 'custrecord_lmry_br_rg_name_field',
              value: NameFile
            });

            //Url de Archivo
            record.setValue({
              fieldId: 'custrecord_lmry_br_rg_url_file',
              value: urlfile
            });

            //Nombre de Reporte
            record.setValue({
              fieldId: 'custrecord_lmry_ar_rg_transaction',
              value: 'BR - Reporte EFD FISCAL'
            });

            //Nombre de Subsidiaria
            record.setValue({
              fieldId: 'custrecord_lmry_br_rg_subsidiary',
              value: companyname
            });

            //Periodo
            record.setValue({
              fieldId: 'custrecord_lmry_br_rg_period',
              value: periodname
            });

            //Multibook
            record.setValue({
              fieldId: 'custrecord_lmry_br_rg_multibook',
              value: multibookName
            });
            //Creado Por
            record.setValue({
              fieldId: 'custrecord_lmry_br_rg_employee',
              value: usuario
            });

            var recordId = record.save();

            // Envia mail de conformidad al usuario

            libreria.sendrptuserTranslate(namereport, 3, NameFile, language);
          } else {
            var record = recordModulo.load({
              type: 'customrecord_lmry_br_rpt_generator_log',
              id: param_RecorID
            });

            //Nombre de Archivo
            record.setValue({
              fieldId: 'custrecord_lmry_br_rg_name_field',
              value: NameFile
            });

            //Url de Archivo
            record.setValue({
              fieldId: 'custrecord_lmry_br_rg_url_file',
              value: urlfile
            });

            record.setValue({
              fieldId: 'custrecord_lmry_br_rg_period',
              value: periodname
            });

            //Creado Por
            record.setValue({
              fieldId: 'custrecord_lmry_br_rg_employee',
              value: usuario
            });


            var recordId = record.save();

            // Envia mail de conformidad al usuario
            libreria.sendrptuserTranslate(namereport, 3, NameFile, language);
          }

        }
      } else {
        // Debug
        // log.debug({
        //     title: 'Creacion de File:',
        //     details: 'No existe el folder'
        // });
      }
    }

    function Name_File() {
      var name = '';
      if (feature_Multi) {
        name = 'SPEDEFD-' + cnpj + '-' + estado_entidad + '-Remessa de arquivo original -' + param_Multi;
      } else {
        name = 'SPEDEFD-' + cnpj + '-' + estado_entidad + '-Remessa de arquivo original';
      }
      return name;
    }

    function ObtnerSetupRptDCTF() {
      var intDMinReg = 0;
      var intDMaxReg = 1000;

      var DbolStop = false;
      var arrAuxiliar = new Array();

      var _cont = 0;

      var savedsearch = search.create({
        type: 'customrecord_lmry_br_setup_rpt_dctf',

        columns: [
          //00 EMPLEADO ID
          search.createColumn({
            name: "custrecord_lmry_br_responsable_fiscal",
            label: "LATAM - BR VERSION:EFD-FISCAL"
          }),
          //01 LATAM - perfil
          search.createColumn({
            name: "custrecord_lmry_br_perfil",
            label: "LATAM - BR VERSION:EFD-FISCAL"
          }),
          search.createColumn({
            name: "custrecord_lmry_br_json_fiscal_registros",
            label: "Latam json que no es Json Raaaaaaa-LATAM - BR JSON REGISTROS FISCAL"
          })
        ]
      });

      if (feature_Subsi) {
        var subsidiaryFilter = search.createFilter({
          name: 'custrecord_lmry_br_rpt_subsidiary',
          operator: search.Operator.ANYOF,
          values: [param_Subsi]
        });
        savedsearch.filters.push(subsidiaryFilter);
      }

      var searchresult = savedsearch.run();

      while (!DbolStop) {
        var objResult = searchresult.getRange(intDMinReg, intDMaxReg);

        if (objResult != null) {
          var intLength = objResult.length;

          if (intLength != 1000) {
            DbolStop = true;
          }

          for (var i = 0; i < intLength; i++) {
            var columns = objResult[i].columns;
            //00 EMPLEADO -- Bueno ahora si viene lo shido
            id_empleado = objResult[i].getValue(columns[0]);
            //01 perfil
            perfil = objResult[i].getValue(columns[1]);
            if (perfil != '' && perfil != null) {
              perfil = String(perfil);
              if (perfil == '1') {
                perfil = 'A';
              }
              if (perfil == '2') {
                perfil = 'B'
              }
              if (perfil == '3') {
                perfil = 'C';
              }
            }
            var checks = objResult[i].getValue(columns[2]).split('|');;
            c_0400 = checks[0];
            c_0450 = checks[1];
            r_1400 = checks[6];
            r_1601 = checks[8] == 'T' ? 'S' : 'N';

          }
          intDMinReg = intDMaxReg;
          intDMaxReg += 1000;
        } else {
          DbolStop = true;
        }
      }

      //Aqui comienza lo shido
      if (id_empleado != '') {
        var datos_empleado = search.lookupFields({
          type: 'employee',
          id: id_empleado,
          columns: ["firstname", "lastname", "custentity_lmry_sv_taxpayer_number", "custentity_lmry_br_crc", "phone", "fax", "email"]
        });
        var address_empleado = search.lookupFields({
          type: 'employee',
          id: id_empleado,
          columns: ['address.address1', 'address.custrecord_lmry_addr_city_id', 'address.custrecord_lmry_addr_city_id', 'address.custrecord_lmry_address_number', 'address.custrecord_lmry_addr_reference', 'address.address2', 'address.zipcode']
        });
        email_responsable = datos_empleado.email;
        fax_responsable = datos_empleado.fax;
        telefono_responsable = datos_empleado.phone;
        crc_responsable = datos_empleado.custentity_lmry_br_crc
        cpf_responsable = datos_empleado.custentity_lmry_sv_taxpayer_number;
        cpf_responsable = ValidaGuion(cpf_responsable);
        nombre_responsable = datos_empleado.firstname + ' ' + datos_empleado.lastname;
        if (address_empleado['address.address1'] != undefined) {
          direccion_responsable = address_empleado['address.address1'];
        }
        if (address_empleado['address.custrecord_lmry_address_number'] != undefined) {
          numero_dire_responsable = address_empleado['address.custrecord_lmry_address_number'];
        }
        if (address_empleado['address.custrecord_lmry_addr_city_id'] != undefined) {
          municipio_responsable = address_empleado['address.custrecord_lmry_addr_city_id'];
        }
        if (address_empleado['address.address2'] != undefined) {
          barrio_responsable = address_empleado['address.address2'];
        }
        if (address_empleado['address.custrecord_lmry_addr_reference'] != undefined) {
          complmento_responsable = address_empleado['address.custrecord_lmry_addr_reference'];
        }
        if (address_empleado['address.zipcode'] != undefined) {
          cep_responsable = address_empleado['address.zipcode'];
          cep_responsable = ValidaGuion(cep_responsable);
        }

      } else {
        email_responsable = '';
        fax_responsable = '';
        telefono_responsable = '';
        crc_responsable = '';
        cpf_responsable = '';
        nombre_responsable = '';
        direccion_responsable = '';
        numero_dire_responsable = '';
        municipio_responsable = '';
        barrio_responsable = '';
        complmento_responsable = '';
        cep_responsable = '';
      }
    }

    function GenerarBLoque9() {
      cont_g = 0;

      var contador = 0;
      var salto = '\r\n';
      var strBloque9 = '';
      //registro 9001
      strBloque9 += '|9001|';
      strBloque9 += '0|' + salto;
      contador++;
      //Registro 9900
      //por el momento sera como 0
      for (var i = 0; i < ArrBloque9.length; i++) {
        if (ArrBloque9[i][1] != 0) {
          strBloque9 += '|9900|';
          strBloque9 += ArrBloque9[i][0] + '|';
          strBloque9 += ArrBloque9[i][1] + '|' + salto;
          contador++;
        }
        cont_g += Number(ArrBloque9[i][1]);
      }
      strBloque9 += '|9900|9001|1|' + salto;
      contador++;
      strBloque9 += '|9900|9990|1|' + salto;
      contador++;
      strBloque9 += '|9900|9999|1|' + salto;
      contador++;
      strBloque9 += '|9900|';
      strBloque9 += '9900|';
      contador++;
      strBloque9 += (contador - 1) + '|' + salto;

      //Registro 9990
      strBloque9 += '|9990|';
      var regi_9990 = contador + 2;
      strBloque9 += regi_9990 + '|' + salto;


      cont_g += regi_9990;
      //Registro 9999
      strBloque9 += '|9999|';
      suma_contadores = cont_g;
      strBloque9 += suma_contadores + '|' + salto;

      return strBloque9;
    }
    function GenerarBloqueB() {
      var salto = '\r\n';
      var contador_B = 0;
      var strBloqueB = '';
      var cont_for = 0;
      var arrAuxiliar = new Array();
      var B420 = {};
      var B440 = {};
      //campos para el b470
      var campo2_B470 = 0;
      var campo8_B470 = 0;
      var campo9_B470 = 0;
      var campo10_B470 = 0;
      var campo11_B470 = 0;
      var campo14_B470 = 0;


      if (provincia != 'DF') {
        strBloqueB += '|B001|1|' + salto;
        arrAuxiliar[0] = 'B001';
        arrAuxiliar[1] = 1;
        ArrBloque9.push(arrAuxiliar);
        strBloqueB += '|B990|2|' + salto;
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'B990';
        arrAuxiliar[1] = 1;
        ArrBloque9.push(arrAuxiliar);
        return strBloqueB;
      } else {
        if (arrTransactionS.length > 0) {
          strBloqueB += '|B001|0|' + salto;
          arrAuxiliar[0] = 'B001';
          arrAuxiliar[1] = 1;
          contador_B++;
          ArrBloque9.push(arrAuxiliar);
        } else {
          /*
          //log.debug("Esto es nuevo","si sale mal borrar y descomentar lo de abajo");
          strBloqueB += '|B001|1|'+salto;
          arrAuxiliar[0] = 'B001';
          arrAuxiliar[1] = 1;
          ArrBloque9.push(arrAuxiliar);
          strBloqueB += '|B990|2|'+salto;
          arrAuxiliar = new Array();
          arrAuxiliar[0] = 'B990';
          arrAuxiliar[1] = 1;
          ArrBloque9.push(arrAuxiliar);
          return strBloqueB;
          */

          strBloqueB += '|B001|0|' + salto;
          arrAuxiliar = new Array();
          arrAuxiliar[0] = 'B001';
          arrAuxiliar[1] = 1;
          ArrBloque9.push(arrAuxiliar);
          //No se si deberia quitar esto, pero x ahora normal funciona
          strBloqueB += '|B470|0|0|0|0|0|0|0|0|0|0|0|0|0|0|' + salto;
          arrAuxiliar = new Array();
          arrAuxiliar[0] = 'B470';
          arrAuxiliar[1] = 1;
          ArrBloque9.push(arrAuxiliar);
          strBloqueB += '|B990|3|' + salto;
          arrAuxiliar = new Array();
          arrAuxiliar[0] = 'B990';
          arrAuxiliar[1] = 1;
          ArrBloque9.push(arrAuxiliar);
          return strBloqueB;
        }
        var cont_b020 = 0;
        var cont_b025 = 0;
        //Registro B020
        for (var i = 0; i < arrTransactionS.length; i++) {

          if (arrTransactionS[i][2] == '01' || arrTransactionS[i][2] == '03' || arrTransactionS[i][2] == '3B' || arrTransactionS[i][2] == '04' || arrTransactionS[i][2] == '08' || arrTransactionS[i][2] == '55' || arrTransactionS[i][2] == '65') {
            cont_b020++;
            /*if (typeof arrTransactionS[i][5]) {
              arrTransactionS[i][5] = '';
            }*/
            //1.REG
            strBloqueB += '|B020|';
            //2.IND_OPER
            if (arrTransactionS[i][1] == 'CustInvc' || arrTransactionS[i][1] == 'ItemShip') {
              strBloqueB += '1|';
              //3.IND_EMIT
              strBloqueB += '0|';
            } else {
              strBloqueB += '0|';
              //3.IND_EMIT
              strBloqueB += '1|';
            }
            //4.COD_PART
            if (arrTransactionS[i][71] == '02') {
              strBloqueB += '|';
            } else {
              strBloqueB += arrTransactionS[i][3] + '|';
            }
            //5.COD_MOD
            strBloqueB += arrTransactionS[i][2] + '|';
            //6.COD_SIT
            if (arrTransactionS[i][71] == '02') {
              strBloqueB += arrTransactionS[i][71] + '|';
            } else {
              strBloqueB += '00|';
            }
            //7.SER
            //strBloqueB+= completar_cero(3,arrTransactionS[i][5])+ '|';
            strBloqueB += arrTransactionS[i][5].substring(0, 3) + '|';
            //8.NUM_DOC
            strBloqueB += arrTransactionS[i][4].substring(0, 9) + '|';
            //9.CHV_NFE
            if ((arrTransactionS[i][2] == '55' || arrTransactionS[i][2] == '65') && arrTransactionS[i][1] != 'ItemShip' && arrTransactionS[i][1] != 'ItemRcpt') {
              if (arrTransactionS[i][1] == 'VendBill') {
                strBloqueB += arrTransactionS[i][53] + '|';
              } else {
                strBloqueB += arrTransactionS[i][46] + '|';
              }
            } else {
              strBloqueB += '|';
            }

            if (arrTransactionS[i][71] == '02') {
              //10.DT_DOC
              strBloqueB += '|';
              //11.COD_MUN_SERV
              strBloqueB += '|';
              //12.VL_CONT
              strBloqueB += '|';
              //13.VL_MAT_TERC -- por el momento sera de 0;
              strBloqueB += '|';
              //14.VL_SUB
              strBloqueB += '|';
              //15.VL_ISNT_ISS
              strBloqueB += '|';
              //16.VL_DED_BC
              strBloqueB += '|';
              //17.VL_BC_ISS
              strBloqueB += '|';
              //18.VL_BC_ISS_RT -- por el momento 0
              strBloqueB += '|';
              //19.VL_ISS_RT
              strBloqueB += '|';
              //20.VL_ ISS
              strBloqueB += '|';
              //21.COD_INF_OBS
              strBloqueB += '|' + salto;
            } else {
              //10.DT_DOC
              strBloqueB += arrTransactionS[i][6] + '|';
              //11.COD_MUN_SERV
              if (arrTransactionS[i][1] == 'CustInvc') {
                strBloqueB += arrTransactionS[i][60] + '|';
              } else {
                strBloqueB += municipal + '|';
              }
              //12.VL_CONT
              strBloqueB += Number(arrTransactionS[i][7]).toFixed(2) + '|';
              //13.VL_MAT_TERC -- por el momento sera de 0;
              strBloqueB += '0|';
              //14.VL_SUB
              strBloqueB += '0|';
              //15.VL_ISNT_ISS
              strBloqueB += '0|';
              //16.VL_DED_BC
              strBloqueB += '0|';

              if (arrTransactionS[i][1] != 'VendBill') {
                //17.VL_BC_ISS
                strBloqueB += Number(arrTransactionS[i][61]).toFixed(2) + '|';
                //18.VL_BC_ISS_RT -- por el momento 0
                if (arrTransactionS[i][67] !== undefined) {
                  strBloqueB += Number(arrTransactionS[i][67]).toFixed(2) + '|';
                  var base_r = Number(Number(arrTransactionS[i][67]).toFixed(2));
                } else {
                  strBloqueB += '0|';
                  var base_r = 0;
                }
                //19.VL_ISS_RT
                if (arrTransactionS[i][68] !== undefined) {
                  strBloqueB += Number(arrTransactionS[i][68]).toFixed(2) + '|';
                  var valor_r = Number(Number(arrTransactionS[i][68]).toFixed(2));
                } else {
                  strBloqueB += '0|';
                  var valor_r = 0;
                }
                //20.VL_ ISS
                strBloqueB += Number(arrTransactionS[i][62]).toFixed(2) + '|';
              } else {
                //17.VL_BC_ISS
                strBloqueB += Number(arrTransactionS[i][48]).toFixed(2) + '|';
                //18.VL_BC_ISS_RT -- 0
                strBloqueB += Number(arrTransactionS[i][55]).toFixed(2) + '|';
                var base_r = Number(Number(arrTransactionS[i][55]).toFixed(2));
                //19.VL_ISS_RT
                strBloqueB += Number(arrTransactionS[i][56]).toFixed(2) + '|';
                var valor_r = Number(Number(arrTransactionS[i][56]).toFixed(2));
                //20.VL_ ISS
                strBloqueB += Number(arrTransactionS[i][49]).toFixed(2) + '|';
              }
              //21.COD_INF_OBS
              strBloqueB += '|' + salto;
            }

            if (arrTransactionS[i][71] != '02') {
              if (arrTransactionS[i][1] == 'VendBill') {
                var indice = '0';
              } else {
                var indice = '1';
              }
              var IDD = indice + '|' + arrTransactionS[i][3];
              if (!B440[IDD]) {
                B440[IDD] = {
                  Contable: Number(arrTransactionS[i][7]),
                  Base: base_r,
                  Total: valor_r,
                  Participante: arrTransactionS[i][3],
                  Indice: indice
                };
              } else {
                B440[IDD].Contable += Number(arrTransactionS[i][7]);
                B440[IDD].Base += base_r;
                B440[IDD].Total += valor_r;
              }


              //Registros B025
              var B025 = {};
              for (var j = 0; j < ArrItem.length; j++) {
                if (arrTransactionS[i][0] == ArrItem[j][1]) {
                  if (arrTransactionS[i][1] != 'VendBill') {
                    IDB = ArrItem[j][52] + ValidaPorcentaje(ArrItem[j][51]);
                    if (!B025[IDB]) {
                      B025[IDB] = {
                        COD_SERV: ArrItem[j][52],
                        VL_CONT_P: Number(ArrItem[j][2]),
                        VL_BC_ISS_P: Number(ArrItem[j][48]),
                        ALIQ_ISS: (Number(ValidaPorcentaje(ArrItem[j][51])) * 100).toFixed(2),
                        VL_ISS_P: Number(ArrItem[j][49])
                      };
                    } else {
                      B025[IDB].VL_CONT_P += Number(ArrItem[j][2]);
                      B025[IDB].VL_BC_ISS_P += Number(ArrItem[j][48]);
                      B025[IDB].VL_ISS_P += Number(ArrItem[j][49]);
                    }
                  } else {
                    ID = ArrItem[j][40] + ValidaPorcentaje(ArrItem[j][39]);
                    if (!B025[ID]) {
                      B025[ID] = {
                        COD_SERV: ArrItem[j][40],
                        VL_CONT_P: Number(ArrItem[j][2]),
                        VL_BC_ISS_P: Number(ArrItem[j][36]),
                        ALIQ_ISS: (Number(ValidaPorcentaje(ArrItem[j][39])) * 100).toFixed(2),
                        VL_ISS_P: Number(ArrItem[j][37])
                      };
                    } else {
                      B025[ID].VL_CONT_P += Number(ArrItem[j][2]);
                      B025[ID].VL_BC_ISS_P += Number(ArrItem[j][36]);
                      B025[ID].VL_ISS_P += Number(ArrItem[j][37]);
                    }
                  }

                }
              }

              var aux = '';
              var base = 0;
              var ali = 0;
              var res = 0;
              var monto_item = 0;
              for (var n in B025) {
                cont_b025++;
                //1.- Texto Fijo
                strBloqueB += '|B025|';
                //2.- VL_CONT_P
                strBloqueB += Number(B025[n].VL_CONT_P).toFixed(2) + '|';
                if (arrTransactionS[i][1] != 'VendBill') {
                  monto_item = B025[n].VL_CONT_P;
                  //3.- VL_BC_ISS_P
                  strBloqueB += Number(B025[n].VL_BC_ISS_P).toFixed(2) + '|';
                  base = B025[n].VL_BC_ISS_P;
                  //4.- ALIQ_ISS
                  strBloqueB += B025[n].ALIQ_ISS + '|';
                  aux = B025[n].ALIQ_ISS;
                  //5.- VL_ISS_P
                  strBloqueB += (B025[n].VL_ISS_P).toFixed(2) + '|';
                  res = (B025[n].VL_ISS_P).toFixed(2);
                  //6.- VL_ISNT_ISS_P
                  strBloqueB += '0|';
                  //7.- COD_SERV
                  strBloqueB += B025[n].COD_SERV + '|' + salto;
                  codigo = B025[n].COD_SERV;
                } else {
                  //3.- VL_BC_ISS_P
                  strBloqueB += Number(B025[n].VL_BC_ISS_P).toFixed(2) + '|';
                  //base = Number(ArrItem[j][36]);
                  //4.- ALIQ_ISS
                  strBloqueB += B025[n].ALIQ_ISS + '|';
                  //aux =ValidaPorcentaje(ArrItem[j][39]);
                  //5.- VL_ISS_P
                  strBloqueB += (B025[n].VL_ISS_P).toFixed(2) + '|';
                  //res = Number(ArrItem[j][37]);
                  //6.- VL_ISNT_ISS_P
                  strBloqueB += '0|';
                  //7.- COD_SERV
                  strBloqueB += B025[n].COD_SERV + '|' + salto;
                  //codigo = ArrItem[j][40].substring(0,4);
                }

                if (arrTransactionS[i][1] != 'VendBill') {
                  ID = aux + '|' + codigo;
                  if (!B420[ID]) {
                    B420[ID] = {
                      M_Contable: Number(monto_item),
                      M_Base: base,
                      M_Total: Number(res),
                      Aliquota: (Number(aux)).toFixed(2),
                      Cod_Serv: codigo
                    };
                  } else {
                    B420[ID].M_Contable += Number(monto_item);
                    B420[ID].M_Base += base;
                    B420[ID].M_Total += Number(res);
                  }
                }


              }
            }


          }
        }//aqui termina el for de transaccionesque genera estos registros


        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'B020';
        arrAuxiliar[1] = cont_b020;
        ArrBloque9.push(arrAuxiliar);
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'B025';
        arrAuxiliar[1] = cont_b025;
        ArrBloque9.push(arrAuxiliar);
        contador_B += cont_b020;
        contador_B += cont_b025;



        var cont_b420 = 0;
        var cont_b440 = 0;
        for (var k in B420) {
          cont_b420++;
          //1.REG
          strBloqueB += '|B420|';
          //2.VL_CONT
          strBloqueB += (B420[k].M_Contable).toFixed(2) + '|';
          campo2_B470 += B420[k].M_Contable;
          //3.VL_BC_ISS
          strBloqueB += (B420[k].M_Base).toFixed(2) + '|';
          campo8_B470 += B420[k].M_Base;
          //4.ALIQ_ISS
          strBloqueB += (B420[k].Aliquota) + '|';
          //5.VL_ISNT_ISS_P
          strBloqueB += '0|';
          //6.VL_ISS
          strBloqueB += (B420[k].M_Total).toFixed(2) + '|';
          campo10_B470 += B420[k].M_Total;
          //7.COD_SERV
          strBloqueB += B420[k].Cod_Serv + '|' + salto;
        }

        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'B420';
        arrAuxiliar[1] = cont_b420;
        ArrBloque9.push(arrAuxiliar);

        for (var j in B440) {
          cont_b440++;
          //1.REG
          strBloqueB += '|B440|';
          //2.IND_OPER
          strBloqueB += B440[j].Indice + '|';
          //3.COD_PART
          strBloqueB += B440[j].Participante + '|';
          //4.VL_CONT_RT
          strBloqueB += (B440[j].Contable).toFixed(2) + '|';
          //5.VL_BC_ISS_RT
          strBloqueB += Number(B440[j].Base).toFixed(2) + '|';
          if (B440[j].Indice == '1') {
            campo9_B470 += Number(B440[j].Base);
          }
          //6.VL_ISS_RT
          strBloqueB += round(B440[j].Total) + '|' + salto;
          if (B440[j].Indice == '0') {
            campo14_B470 += Number(B440[j].Total);
          } else {
            campo11_B470 += Number(B440[j].Total);
          }

        }
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'B440'
        arrAuxiliar[1] = cont_b440;
        ArrBloque9.push(arrAuxiliar);
        contador_B += cont_b420
        contador_B += cont_b440;


        //Registro B470
        //1.REG
        strBloqueB += '|B470|';
        //2.VL_CONT
        strBloqueB += Number(campo2_B470).toFixed(2) + '|';
        //3.VL_MAT_TERC
        strBloqueB += '0|';
        //4.VL_MAT_PROP
        strBloqueB += '0|';
        //5.VL_SUB
        strBloqueB += '0|';
        //6.VL_ISNT
        strBloqueB += '0|';
        //7.VL_DED_BC
        strBloqueB += '0|';
        //8.VL_BC_ISS
        strBloqueB += Number(campo8_B470).toFixed(2) + '|';
        //9.VL_BC_ISS_RT
        strBloqueB += Number(campo9_B470).toFixed(2) + '|';
        //10.VL_ ISS
        strBloqueB += Number(campo10_B470).toFixed(2) + '|';
        //11.VL_ISS_RT
        strBloqueB += Number(campo11_B470).toFixed(2) + '|';
        //12.VL_DED
        strBloqueB += '0|';
        //13.VL_ ISS_REC
        resultado = (campo10_B470 - campo11_B470)
        if (resultado > 0) {
          strBloqueB += (resultado).toFixed(2) + '|';
        } else {
          strBloqueB += '0|';
        }
        //14.VL_ ISS_ST
        strBloqueB += campo14_B470 + '|';
        //15.VL_ISS_REC_UNI
        strBloqueB += '0|' + salto;

        var arrAuxiliar = new Array();
        arrAuxiliar[0] = 'B470';
        arrAuxiliar[1] = 1;
        ArrBloque9.push(arrAuxiliar);
        contador_B++;
        //
        contador_B++;
        strBloqueB += '|B990|' + contador_B + '|' + salto;
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'B990'
        arrAuxiliar[1] = 1;
        ArrBloque9.push(arrAuxiliar);
        strBloqueB = strBloqueB.replace(/\./g, ',');
        return strBloqueB;
      }
    }


    function round(number) {
      return Math.round(Number(number) * 100) / 100;
    }

    function GenerarBloqueD() {
      var salto = '\r\n';
      var contador_E = 0;
      var StrBloqueD = '';
      var suma_D = 2;
      var arrAuxiliar = new Array();
      D100_b = false;
      D500_b = false;

      //ahora aqui si empieza lo bueno
      //Al fin otro bloque ya me habia aburrido de hacer el bloque C xD
      //Genera el Bloque D100 con sus hijos
      D100 = GenerarD100();
      if (D100 != '') {
        D100 = D100.split('&');
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'D100';
        arrAuxiliar[1] = Number(D100[1]);
        ArrBloque9.push(arrAuxiliar);
        //para el bloque D190
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'D190';
        arrAuxiliar[1] = Number(D100[2]);
        ArrBloque9.push(arrAuxiliar);
        //para el bloque D195
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'D195';
        arrAuxiliar[1] = Number(D100[3]);
        ArrBloque9.push(arrAuxiliar);
        D100_b = true;
      }

      //Genera el Bloque D500 con sus hijos
      D500 = GenerarD500();

      if (D500 != '') {
        D500_b = true;
        D500 = D500.split('&');
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'D500';
        arrAuxiliar[1] = Number(D500[1]);
        ArrBloque9.push(arrAuxiliar);
        //para el D510
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'D510';
        arrAuxiliar[1] = Number(D500[3]);
        ArrBloque9.push(arrAuxiliar);
        //para el D590
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'D590';
        arrAuxiliar[1] = Number(D500[2]);
        ArrBloque9.push(arrAuxiliar);
      }
      if (D500_b == true || D100_b == true) {
        hay_data = 0;
      } else {
        hay_data = 1;
      }

      StrBloqueD += '|D001|' + hay_data + '|' + salto;
      arrAuxiliar = new Array();
      arrAuxiliar[0] = 'D001';
      arrAuxiliar[1] = 1;
      ArrBloque9.push(arrAuxiliar);
      if (D100_b) {
        StrBloqueD += D100[0];
        suma_D += Number(D100[1]) + Number(D100[2]) + Number(D100[3]);
      }

      if (D500_b) {
        StrBloqueD += D500[0];
        suma_D += Number(D500[1]) + Number(D500[2]) + Number(D500[3]);
      }

      StrBloqueD += '|D990|' + suma_D + '|' + salto;
      arrAuxiliar = new Array();
      arrAuxiliar[0] = 'D990';
      arrAuxiliar[1] = 1;
      ArrBloque9.push(arrAuxiliar);

      return StrBloqueD;
    }

    function GenerarD500() {
      var strD500 = '';
      //***************** BLOQUED *****************
      //Registro D500
      var valida = false;
      var salto = '\r\n';
      var contador_bloqueD500 = 0;
      var contadorD590 = 0;
      var contadorD510 = 0;


      for (var i = 0; i < arrTransaction.length; i++) {
        var c_510 = 0;
        var D500 = {};
        if (arrTransaction[i][2] == '21' || arrTransaction[i][2] == '22') {
          valida = true;
          //1.- Texto Fijo
          campo1 = '|D500|';
          //2.- IND_OPER
          if (arrTransaction[i][1] == 'VendBill' || arrTransaction[i][1] == 'ItemRcpt' || arrTransaction[i][1] == 'VendCred') {
            campo2 = '0|';
          } else {
            campo2 = '1|';
          }
          //3.- IND_EMIT
          if (arrTransaction[i][1] == 'VendBill' || arrTransaction[i][1] == 'ItemRcpt' || arrTransaction[i][1] == 'VendCred') {
            campo3 = '1|';
          } else {
            campo3 = '0|';
          }
          //4.- COD_PART
          campo4 = arrTransaction[i][3] + '|';
          //5.- COD_MOD
          campo5 = arrTransaction[i][2] + '|';
          //6.- COD_SIT --esto aun no esta validado xD
          /*if (arrTransaction[i][1] == 'VendBill') {
            campo6 = Compararfechas(arrTransaction[i][6],arrTransaction[i][52],0) + '|';
          }else {
            campo6 = Compararfechas(arrTransaction[i][6],arrTransaction[i][65],0) + '|';
          }*/
          if (arrTransaction[i][1] == 'VendBill' || arrTransaction[i][1] == 'CustInvc') {
            campo6 = arrTransaction[i][71] + '|';
          } else {
            campo6 = '00|';
          }
          //7.- SERIE DE DOCUMENTO FISCAL
          campo7 = arrTransaction[i][5].substring(0, 4) + '|';
          //8.- SUB --- No se ah que se regfiere con este campo
          campo8 = '|';
          //9.- NUM_DOC - si es NFE es el Preimpreso de la transaccion
          campo9 = arrTransaction[i][4].substring(0, 9) + '|';
          //10.- DT_DOC
          campo10 = arrTransaction[i][6] + '|';
          //11.- DT_A_P---por el momento le seteare el mismo campo de la fecha
          if (arrTransaction[i][1] == 'VendBill') {
            campo11 = arrTransaction[i][52] + '|';
          } else if (arrTransaction[i][1] == 'CustInvc') {
            campo11 = arrTransaction[i][65] + '|';
          } else {
            campo11 = '|';
          }
          //12.- VL_DOC--
          campo12 = Number(arrTransaction[i][7]).toFixed(2) + '|';
          //13.- VL_DESC --- au no se sabe como se tratara esto asi que lo pondre como 0 xD
          campo13 = '0|';
          //14.- VL_SERV -- tiene que ver con el campo13 asi que tmb lo estare como vacio
          campo14 = Number(arrTransaction[i][7]).toFixed(2) + '|';
          //15.- VL_SERV_NT
          campo15 = '0|';
          //16.-VL_TERC -- este campo se estara dejando como cero por el momento hastya que me avisen lo contrario
          campo16 = '0|';
          //17.- VL_DA aun nose con que llenar este campo
          campo17 = '0|';
          //18.- VL_BC_ICMS
          campo18 = round(Number(arrTransaction[i][20])) + '|';
          //19.- VL_ICMS -- Por el momento sera 0
          campo19 = round(Number(arrTransaction[i][21])) + '|';
          //20.- COD_INF -- por el momento sera 0
          campo20 = '|';
          //21.- VL_PIS --
          campo21 = Number(arrTransaction[i][31]).toFixed(2) + '|';
          //22.- VL_COFINS -- esto aun no se completara
          campo22 = Number(arrTransaction[i][35]).toFixed(2) + '|';

          //24.- TP_ASSINANTE
          if (arrTransaction[i][1] != 'VendBill') {
            //23.- COD_CTA --- cuenta del primer de la factura asi se quedo no me preguntes porque fue asi - by : Kelly
            campo23 = arrTransaction[i][73] + '|';
            //24.- TP_ASSINANTE
            campo24 = arrTransaction[i][72] + '|' + salto;
          } else {
            //23.- COD_CTA --- cuenta del primer de la factura asi se quedo no me preguntes porque fue asi - by : Kelly
            campo23 = arrTransaction[i][74] + '|';
            //24.- TP_ASSINANTE
            campo24 = arrTransaction[i][73] + '|' + salto;
          }
          contador_bloqueD500++;
          //Aqui no mas generare el D190 xDxD
          //oye por cierto tu que estas revisando este scrip
          //me divertia mucho en latamready xD
          var D510 = '';
          for (var j = 0; j < ArrItem.length; j++) {
            if (arrTransaction[i][0] == ArrItem[j][1]) {
              //D510
              if (arrTransaction[i][1] != 'VendBill') {
                c_510++;
                D510 += '|D510|';
                // 2.NUM_ITEM
                D510 += c_510 + '|';
                // 3.COD_ITEM
                D510 += ArrItem[j][0] + '|';
                // 4.COD_CLASS
                D510 += ArrItem[j][47] + '|';
                // 5.QTD
                D510 += ArrItem[j][6] + '|';
                // 6.UNID
                D510 += ArrItem[j][3] + '|';
                // 7.VL_ITEM
                D510 += Number(ArrItem[j][2]).toFixed(2) + '|';
                // 8.VL_DESC
                D510 += 0 + '|';
                // 9.CST_ICMS
                D510 += ArrItem[j][12] + '|';
                // 10.CFOP
                D510 += ValidaGuion(ArrItem[j][7]) + '|';
                // 11.VL_BC_ICMS
                D510 += ArrItem[j][10] + '|';
                // 12.ALIQ_ICMS
                D510 += (Number(ValidaPorcentaje(ArrItem[j][13])) * 100).toFixed(2) + '|';
                // 13.VL_ICSM
                D510 += ArrItem[j][11] + '|';
                // 14.VL_BC_ICMS_UF
                D510 += '0|';
                // 15.VL_ICMS_UF
                D510 += '0|';
                // 16.IND_REC -- Por el momento se SETEA en 0
                D510 += '0' + '|';
                // 17.COD_PART
                D510 += arrTransaction[i][3] + '|';
                // 18.VL_PIS 15
                D510 += ArrItem[j][19] + '|';
                // 19.VL_COFINS
                D510 += ArrItem[j][23] + '|';
                // 20.COD_CTA
                D510 += '' + '|' + salto;
                D510 = D510.replace(/\./g, ',');
                contadorD510++;
              }


              var ID = ArrItem[j][7] + '|' + ArrItem[j][12] + '|' + ArrItem[j][13];
              if (!D500[ID]) {
                D500[ID] = {
                  "id": ID,
                  "baseicsm": Number(ArrItem[j][10]),
                  "montoicms": Number(ArrItem[j][11]),
                  "CFOP": ArrItem[j][7],
                  "montoitem": Number(ArrItem[j][2]),
                  "ST_ICMS": ArrItem[j][12],
                  "Porc_ICMS": ArrItem[j][13],
                  "MntNoTributado": Number(ArrItem[j][53])
                };
              } else {
                if (D500[ID] != undefined) {
                  D500[ID].baseicsm += Number(ArrItem[j][10]);
                  D500[ID].montoicms += Number(ArrItem[j][11]);
                  D500[ID].montoitem += Number(ArrItem[j][2]);
                  D500[ID].MntNoTributado += Number(ArrItem[j][53]);
                }


              }
            }
          }
          D590 = '';
          for (var k in D500) {
            //Bloque D190
            //1.-REG
            D590 += '|D590|';
            //2.-CST_ICMS
            D590 += D500[k].ST_ICMS + '|';
            //3.-CFOP
            D590 += ValidaGuion(D500[k].CFOP) + '|';
            //4.-ALIQ_ICMS
            D590 += (Number(ValidaPorcentaje(D500[k].Porc_ICMS)) * 100).toFixed(2) + '|';
            //por el momento todos estos valaores estaran como 0
            //5.-VL_OPR
            D590 += Number(D500[k].montoitem).toFixed(2) + '|';
            //6.-VL_BC_ICMS
            D590 += Number(D500[k].baseicsm).toFixed(2) + '|';
            //7.-VL_ICMS
            D590 += Number(D500[k].montoicms).toFixed(2) + '|';
            if (arrTransaction[i][1] != 'VendBill' && arrTransaction[i][1] != 'ItemRcpt') {
              if (campo6 == '00|') {
                campo2_E110 += Number(D500[k].montoicms);
              }
            } else {
              campo6_E110 += Number(D500[k].montoicms);
            }

            //8.-VL_BC_ICMS_UF
            D590 += '0|';
            //9.-VL_ICMS_UF
            D590 += '0|';
            //10. VL_RED_BC
            if (arrTransaction[i][1] == 'VendBill') {
              D590 += Number(D500[k].MntNoTributado).toFixed(2) + '|';
            } else {
              D590 += '0|';
            }
            //11. COD_OBS
            D590 += '|' + salto;
            D590 = D590.replace(/\./g, ',');
            contadorD590++;
          }
          auxliar = campo1 + campo2 + campo3 + campo4 + campo5 + campo6 + campo7 + campo8 + campo9 + campo10 + campo11 + campo12 + campo13 + campo14 + campo15 + campo16 + campo17 + campo18 +
            campo19 + campo20 + campo21 + campo22;
          auxliar = auxliar.replace(/\./g, ',');
          strD500 += auxliar + campo23 + campo24;
          strD500 += D510;
          strD500 += D590;
        }
      }

      for (var i = 0; i < arrAnuladas.length; i++) {
        if (arrAnuladas[i][6] == '21' || arrAnuladas[i][6] == '22') {
          valida = true;
          //1.- Texto Fijo
          campo1 = '|D500|';
          //2.- IND_OPER
          strD500 += arrAnuladas[i][1] + '|';
          //3.- IND_EMIT
          strD500 += arrAnuladas[i][7] + '|';
          //4.- COD_PART
          strD500 += '|';
          //5.- COD_MOD
          strD500 += arrAnuladas[i][6] + '|';
          //6.- COD_SIT --esto aun no esta validado xD
          strD500 += '02|';
          //7.- SERIE DE DOCUMENTO FISCAL
          if (arrAnuladas[i][1] == '0') {
            strD500 += arrAnuladas[i][4].substring(0, 4) + '|';
          } else {
            strD500 += arrAnuladas[i][5].substring(0, 4) + '|';
          }
          //8.- SUB --- No se ah que se regfiere con este campo
          strD500 += '|';
          //9.- NUM_DOC - si es NFE es el Preimpreso de la transaccion
          strD500 += arrAnuladas[i][2].substring(0, 9) + '|';
          //10.- DT_DOC
          strD500 += '|';
          //11.- DT_A_P---por el momento le seteare el mismo campo de la fecha
          strD500 += '|';
          //12.- VL_DOC--
          strD500 += '|';
          //13.- VL_DESC --- au no se sabe como se tratara esto asi que lo pondre como 0 xD
          strD500 += '|';
          //14.- VL_SERV -- tiene que ver con el campo13 asi que tmb lo estare como vacio
          strD500 += '|';
          //15.- VL_SERV_NT
          strD500 += '|';
          //16.-VL_TERC -- este campo se estara dejando como cero por el momento hastya que me avisen lo contrario
          strD500 += '|';
          //17.- VL_DA aun nose con que llenar este campo
          strD500 += '|';
          //18.- VL_BC_ICMS
          strD500 += '|';
          //19.- VL_ICMS -- Por el momento sera 0
          strD500 += '|';
          //20.- COD_INF -- por el momento sera 0
          strD500 += '|';
          //21.- VL_PIS --
          strD500 += '|';
          //22.- VL_COFINS -- esto aun no se completara
          strD500 += '|';
          //23.- COD_CTA --- no yet
          strD500 += '|';
          //24.- TP_ASSINANTE
          strD500 += '|' + salto;
          contador_bloqueD500++;
        }
      }

      if (valida) {

        return strD500 + '&' + contador_bloqueD500 + '&' + contadorD590 + '&' + contadorD510;
      }
      return '';
    }

    function GenerarD100() {
      var contador_bloque = 0;
      var strD100 = '';
      //***************** BLOQUED *****************
      //Registro C100
      var valida = false;
      var salto = '\r\n';
      var contador_bloqueD100 = 0;
      var contadorD170 = 0;
      var contadorD190 = 0;
      var contadorD195 = 0;
      for (var i = 0; i < arrTransaction.length; i++) {
        var D190 = {};
        if ((arrTransaction[i][2] == '07' || arrTransaction[i][2] == '08' || arrTransaction[i][2] == '8B' || arrTransaction[i][2] == '09' || arrTransaction[i][2] == '11' || arrTransaction[i][2] == '10' || arrTransaction[i][2] == '26' || arrTransaction[i][2] == '27' || arrTransaction[i][2] == '57' || arrTransaction[i][2] == '67' || arrTransaction[i][2] == '63') && (arrTransaction[i][1] == 'VendBill' || arrTransaction[i][1] == 'ItemRcpt' || arrTransaction[i][1] == 'VendCred')) {
          valida = true;
          //1.- Texto Fijo
          campo1 = '|D100|';
          //2.- IND_OPER
          if (arrTransaction[i][1] == 'VendBill' || arrTransaction[i][1] == 'ItemRcpt' || arrTransaction[i][1] == 'VendCred') {
            campo2 = '0|';
          } else {
            campo2 = '1|';
          }
          //3.- IND_EMIT
          campo3 = '1|';
          //4.- COD_PART
          campo4 = arrTransaction[i][3] + '|';
          //5.- COD_MOD
          campo5 = arrTransaction[i][2] + '|';
          //6.- COD_SIT --esto aun no esta validado xD
          //6.- CODIGO SITUACION -ESTE CAMPO SI SERA UN DOLOR DE CABEZA --esto aun no esta validado xD
          /*if (arrTransaction[i][1] == 'VendBill') {
            campo6 = Compararfechas(arrTransaction[i][6],arrTransaction[i][52],0) + '|';
          }else {
            campo6 = Compararfechas(arrTransaction[i][6],arrTransaction[i][65],0) + '|';
          }*/
          if (arrTransaction[i][1] == 'VendBill' || arrTransaction[i][1] == 'CustInvc') {
            campo6 = arrTransaction[i][71] + '|'
          } else {
            campo6 = '00|'
          }
          //7.- SERIE DE DOCUMENTO FISCAL
          campo7 = arrTransaction[i][5].substring(0, 4) + '|';
          //8.- SUB --- No se ah que se regfiere con este campo
          campo8 = '|';
          //9.- NUM_DOC - si es NFE es el Preimpreso de la transaccion
          campo9 = arrTransaction[i][4].substring(0, 9) + '|';
          //10.- CHV_CTE
          if (arrTransaction[i][1] == 'VendBill') {
            campo10 = ValidaGuion(arrTransaction[i][53]) + '|';
          } else if (arrTransaction[i][1] == 'CustInvc') {
            campo10 = arrTransaction[i][46] + '|';
          } else {
            campo10 = '|';
          }
          //11.- DT_DOC
          campo11 = arrTransaction[i][6] + '|';
          //12.- DT_A_P-- por el momento le seteare el mismo campo de la fecha
          //No se que pasara pero me siento muy nervioso.jpg
          if (arrTransaction[i][1] == 'VendBill') {
            campo12 = arrTransaction[i][52] + '|';
          } else if (arrTransaction[i][1] == 'CustInvc') {
            campo12 = arrTransaction[i][65] + '|';
          } else {
            campo12 = '|';
          }
          //este campo no tengo ni la mas minima idea de que es por el momento  lo dejare como vacio
          //13.- TP_CT-e--- lo de arriba
          campo13 = '|';
          //14.- CHV_CTE_REF -- tiene que ver con el campo13 asi que tmb lo estare como vacio
          campo14 = '|';

          //15.- VL_DOC
          campo15 = Number(arrTransaction[i][20]);
          campo15 = Number(campo15).toFixed(2) + '|';

          //16.-VL_DES -- este campo se estara dejando como cero por el momento hastya que me avisen lo contrario
          if (arrTransaction[i][1] == 'VendBill') {
            campo16 = Number(arrTransaction[i][80]).toFixed(2) + '|';
          } else {
            campo16 = '0|';
          }

          //17.- IND_FRT
          campo17 = arrTransaction[i][19] + '|';
          //18.- VL_SERV
          if (arrTransaction[i][1] == 'VendBill') {
            if (arrTransaction[i][19] == '9') {
              campo18 = '0|';
            } else {
              campo18 = Number(arrTransaction[i][79]).toFixed(2) + '|';
            }

          } else {
            campo18 = Number(arrTransaction[i][7]).toFixed(2) + '|';
          }
          //19.- VL_BC_ICMS -- Por el momento sera 0
          campo19 = Number(arrTransaction[i][20]).toFixed(2) + '|';
          //20.- VL_ICMS -- por el momento sera 0
          campo20 = Number(arrTransaction[i][21]).toFixed(2) + '|';
          //21.- VL_NT -- por el momento sera 0
          campo21 = '|';
          //22.- COD_INF -- esto aun no se completara
          campo22 = '|';
          //23.- COD_CTA --- no yet
          campo23 = '|';
          if (arrTransaction[i][2] == '57' || arrTransaction[i][2] == '67' || arrTransaction[i][2] == '63') {

            var ciudades = JSON.parse(arrTransaction[i][47]);
            if (ciudades.tipo == 'Compras') {
              //24.- COD_MUN_ORIG --- 
              if (ciudades.origen != '') {
                campo24 = ciudades.origen + '|';
              } else {
                campo24 = ciudades.vendor + '|';
              }
              //25.- COD_MUN_DEST ---IBGE subsidiaria
              if (ciudades.destino != '') {
                campo25 = ciudades.destino + '|' + salto;
              } else {
                campo25 = municipal + '|' + salto;
              }
            } else {
              //24.- COD_MUN_ORIG --- 
              campo24 = ciudades.vendor + '|';
              //25.- COD_MUN_DEST ---IBGE subsidiaria
              campo25 = municipal + '|' + salto;
            }

          } else {
            campo24 = '|';
            campo25 = '|' + salto;
          }
          contador_bloqueD100++;
          //Aqui no mas generare el D190 xDxD
          //oye por cierto tu que estas revisando este scrip
          //me divertia mucho en latamready xD
          for (var j = 0; j < ArrItem.length; j++) {
            if (arrTransaction[i][0] == ArrItem[j][1]) {
              //log.debug('momentos antes de la tragedia', ArrItem[j][7] + '|' + ArrItem[j][12] +'|'+ ArrItem[j][13])

              var ID = ArrItem[j][7] + '|' + ArrItem[j][12] + '|' + ArrItem[j][13];
              if (!D190[ID]) {
                D190[ID] = {
                  "id": ID,
                  "baseicsm": Number(ArrItem[j][10]),
                  "montoicms": Number(ArrItem[j][11]),
                  "CFOP": ArrItem[j][7],
                  "montoitem": Number(ArrItem[j][2]),
                  "ST_ICMS": ArrItem[j][12],
                  "Porc_ICMS": ArrItem[j][13],
                  "MntNoTributado": Number(ArrItem[j][53])
                };
              } else {
                if (D190[ID] != undefined) {
                  D190[ID].baseicsm += Number(ArrItem[j][10]);
                  D190[ID].montoicms += Number(ArrItem[j][11]);
                  D190[ID].montoitem += Number(ArrItem[j][2]);
                  D190[ID].MntNoTributado += Number(ArrItem[j][53]);
                }

              }
            }
          }

          strd190 = '';
          for (k in D190) {
            //Bloque D190
            //1.-REG
            strd190 += '|D190|';
            //2.-CST_ICMS
            strd190 += D190[k].ST_ICMS + '|';
            //3.-CFOP
            strd190 += ValidaGuion(D190[k].CFOP) + '|';
            //4.-ALIQ_ICMS
            strd190 += (Number(ValidaPorcentaje(D190[k].Porc_ICMS)) * 100).toFixed(2) + '|';
            //por el momento todos estos valores estaran como 0
            //5.-VL_OPR
            strd190 += Number(D190[k].montoitem).toFixed(2) + '|';
            //6.-VL_BC_ICMS
            strd190 += Number(D190[k].baseicsm).toFixed(2) + '|';
            //7.-VL_ICMS
            strd190 += Number(D190[k].montoicms).toFixed(2) + '|';
            campo6_E110 += Number(D190[k].montoicms);
            //8.-VL_RED_BC2
            if (arrTransaction[i][1] == 'VendBill') {
              strd190 += Number(D190[k].MntNoTributado).toFixed(2) + '|';
            } else {
              strd190 += '0|';
            }
            //9.-COD_OBS
            strd190 += '|' + salto;
            contadorD190++;
          }

          /*D195*/
          if (arrTransaction[i][59] != '' && arrTransaction[i][58] != '') {
            strd190 += '|D195|';
            strd190 += arrTransaction[i][59] + '|';
            strd190 += arrTransaction[i][58] + '|' + salto;
            contadorD195++;
          }

          strD100 += campo1 + campo2 + campo3 + campo4 + campo5 + campo6 + campo7 + campo8 + campo9 + campo10 + campo11 + campo12 + campo13 + campo14 + campo15 + campo16 + campo17 + campo18 +
            campo19 + campo20 + campo21 + campo22 + campo23 + campo24 + campo25;
          strD100 += strd190;
        }
      }

      for (var i = 0; i < arrAnuladas.length; i++) {
        if (arrAnuladas[i][6] == '07' || arrAnuladas[i][6] == '08' || arrAnuladas[i][6] == '8B' || arrAnuladas[i][6] == '11' || arrAnuladas[i][6] == '10' || arrAnuladas[i][6] == '26' || arrAnuladas[i][6] == '27' || arrAnuladas[i][6] == '57' || arrAnuladas[i][6] == '67' || arrAnuladas[i][6] == '63') {
          valida = true;
          //1.- Texto Fijo
          strD100 += '|D100|';
          //2.- IND_OPER
          strD100 += arrAnuladas[i][1] + '|';
          //3.- IND_EMIT
          strD100 += arrAnuladas[i][7] + '|';
          //4.- COD_PART
          strD100 += '|';
          //5.- COD_MOD
          strD100 += arrAnuladas[i][6] + '|';
          //6.- COD_SIT --esto aun no esta validado xD
          strD100 += '02|';
          //7.- SERIE DE DOCUMENTO FISCAL
          if (arrAnuladas[i][1] == '0') {
            strD100 += arrAnuladas[i][4].substring(0, 4) + '|';
          } else {
            strD100 += arrAnuladas[i][5].substring(0, 4) + '|';
          }
          //8.- SUB --- No se ah que se regfiere con este campo
          strD100 += '|';
          //9.- NUM_DOC - si es NFE es el Preimpreso de la transaccion
          strD100 += arrAnuladas[i][2].substring(0, 9) + '|';
          //10.- CHV_CTE
          strD100 += arrAnuladas[i][8] + '|';
          //11.- DT_DOC
          strD100 += '|';
          //12.- DT_A_P-- por el momento le seteare el mismo campo de la fecha
          //No se que pasara pero me siento muy nervioso.jpg
          strD100 += '|';
          //este campo no tengo ni la mas minima idea de que es por el momento  lo dejare como vacio
          //13.- TP_CT-e--- lo de arriba
          strD100 += '|';
          //14.- CHV_CTE_REF -- tiene que ver con el campo13 asi que tmb lo estare como vacio
          strD100 += '|';
          //15.- VL_DOC
          strD100 += '|';
          //16.-VL_DES -- este campo se estara dejando como cero por el momento hastya que me avisen lo contrario
          strD100 += '|';
          //17.- IND_FRT
          strD100 += '|';
          //18.- VL_SERV
          strD100 += '|';
          //19.- VL_BC_ICMS -- Por el momento sera 0
          strD100 += '|';
          //20.- VL_ICMS -- por el momento sera 0
          strD100 += '|';
          //21.- VL_NT -- por el momento sera 0
          strD100 += '|';
          //22.- COD_INF -- esto aun no se completara
          strD100 += '|';
          //23.- COD_CTA --- no yet
          strD100 += '|';
          //24.- COD_MUN_ORIG--- IBGE subsidiaria
          strD100 += '|';
          //25.- COD_MUN_DEST
          strD100 += '|' + salto;
          contador_bloqueD100++;
        }
      }

      if (valida) {
        strD100 = strD100.replace(/\./g, ',');
        return strD100 + '&' + contador_bloqueD100 + '&' + contadorD190 + '&' + contadorD195;
      }
      return '';
    }

    function GenerarBloqueE() {
      var salto = '\r\n';
      var contador_E = 0;
      var strBloqueE = '';
      var arrAuxiliar = new Array();

      strBloqueE += '|E001|0|' + salto;
      arrAuxiliar[0] = 'E001';
      arrAuxiliar[1] = 1;
      ArrBloque9.push(arrAuxiliar);
      contador_E++;
      //Generar E100
      strBloqueE += '|E100|';
      strBloqueE += periodfirstdate + '|';
      strBloqueE += periodenddate + '|' + salto;
      arrAuxiliar = new Array();
      arrAuxiliar[0] = 'E100';
      arrAuxiliar[1] = 1;
      ArrBloque9.push(arrAuxiliar);
      contador_global++;
      contador_E++;
      //por el momento lo dejare esto como hardcodeado xD
      //Generar E110
      //validaciones medias raras para este bloque xd
      //2. VL_TOT_DEBITOS
      camp2 = Number(campo2_E110.toFixed(2));
      //3. VL_AJ_DEBITOS
      camp3 = Number(campo3_E110.toFixed(2));
      //4. VL_TOT_AJ_DEBITOS
      camp4 = 0;
      //5. VL_ESTORNOS_CRED
      camp5 = 0;
      //6. VL_TOT_CREDITOS
      camp6 = Number(campo6_E110.toFixed(2));
      //7. VL_AJ_CREDITOS
      camp7 = Number(campo7_E110.toFixed(2));
      //8. VL_TOT_AJ_CREDITOS
      camp8 = 0;
      //9. VL_ESTORNOS_DEB
      camp9 = 0;
      //10. VL_SLD_CREDOR_ANT
      camp10 = 0;
      //11. VL_SLD_APURADO
      var a = camp2 + camp3 + camp4 + camp5;
      var b = camp6 + camp7 + camp8 + camp9 + camp10;
      //camp11 = (camp2 + camp3 + camp4 +camp5) - (camp6 + camp7 +camp8 + camp9 + camp10);
      camp11 = a - b;
      camp11 = camp11.toFixed(2);
      if (camp11 < 0) {
        camp11 = 0
      }
      //12. VL_TOT_DED
      camp12 = 0;
      //13. VL_ICMS_RECOLHER
      camp13 = camp11 - camp12;
      camp13 = camp13.toFixed(2);
      if (camp13 < 0) {
        camp13 = 0;
      }
      //VL_SLD_CREDOR_TRANSPORTAR
      camp14 = (camp2 + camp3 + camp4 + camp5) - (camp6 + camp7 + camp8 + camp9 + camp10 + camp12);
      if (camp14 > 0) {
        camp14 = 0;
      } else {
        camp14 = (Math.abs(camp14)).toFixed(2);
      }
      //15. DEB_ESP
      camp15 = campo15_E110;
      strBloqueE += '|E110|' + camp2 + '|' + camp3 + '|' + camp4 + '|' + camp5 + '|' + camp6 + '|' + camp7 + '|' + camp8 + '|' + camp9 + '|' + camp10 + '|' + camp11 + '|' + camp12 + '|' + camp13 + '|' + camp14 + '|' + camp15 + '|' + salto;
      arrAuxiliar = new Array();
      arrAuxiliar[0] = 'E110';
      arrAuxiliar[1] = 1;
      ArrBloque9.push(arrAuxiliar);

      valor_E116 = ObtenerE116();
      valor_E116 = valor_E116.split('|');

      if (valor_E116[1] != '') {
        //1.REG
        strBloqueE += '|E116|';
        //2.COD_OR
        strBloqueE += '000|';
        //3.VL_OR
        strBloqueE += valor_E116[1] + '|';
        //4.DT_VCTO
        strBloqueE += valor_E116[0] + '|';
        //5.COD_REC
        strBloqueE += valor_E116[2] + '|';
        //6.NUM_PROC
        strBloqueE += '|';
        //7.IND_PROC
        strBloqueE += '|';
        //8.PROC
        strBloqueE += '|';
        //9.TXT_COMPL
        strBloqueE += '|';
        //10.MES_REF
        strBloqueE += valor_E116[0].substring(2, 8) + '|' + salto;

        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'E116';
        arrAuxiliar[1] = 1;
        ArrBloque9.push(arrAuxiliar);
        contador_E++;
      }

      var cont_E200 = 0;
      //Registro E200
      for (var key in JSONE210) {
        strBloqueE += '|E200|';
        strBloqueE += JSONE210[key].UF + '|';
        strBloqueE += periodfirstdate + '|';
        strBloqueE += periodenddate + '|' + salto;

        //registro E210
        //1. Reg
        strBloqueE += '|E210|';
        //2. IND_MOV_ST
        strBloqueE += '1|';
        //3. VL_SLD_CRED_ANT_ST
        strBloqueE += '0,00|';
        //4. VL_DEVOL_ST
        strBloqueE += JSONE210[key].campo4 + '|';
        //5. VL_RESSARC_ST
        strBloqueE += JSONE210[key].campo5 + '|';
        //6. VL_OUT_CRED_ST
        strBloqueE += JSONE210[key].campo6 + '|';
        //7. VL_AJ_CREDITOS_ST
        strBloqueE += '0,00|';
        //8. VL_RETENÇAO_ST
        strBloqueE += '0,00|';
        //9. VL_OUT_DEB_ST
        strBloqueE += '0,00|';
        //10. VL_AJ_DEBITOS_ST
        strBloqueE += '0,00|';
        //11. VL_SLD_DEV_ANT_ST
        strBloqueE += '0,00|';
        //12. VL_DEDUÇÕES_ST
        strBloqueE += '0,00|';
        //13. VL_ICMS_RECOL_ST
        strBloqueE += '0,00|';
        //14. VL_SLD_CRED_ST_TRANSPORTAR -- por el momento estara como 0
        //8  +9  +10 - 3 +4+5 + 6+7 +12
        strBloqueE += Math.abs(-(JSONE210[key].campo4 + JSONE210[key].campo5 + JSONE210[key].campo6)) + '|';
        //15. DEB_ESP_ST
        strBloqueE += '0,00|' + salto;

        cont_E200++;
      }
      if (cont_E200 > 0) {
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'E200';
        arrAuxiliar[1] = cont_E200;
        ArrBloque9.push(arrAuxiliar);

        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'E210';
        arrAuxiliar[1] = cont_E200;
        ArrBloque9.push(arrAuxiliar);
        contador_E += 2 * cont_E200;
      }
      contador_E++;
      //BLOQUES QUE HACE REFERENCIA   A FCP E ICMS Dest
      LIPA = {};
      if (suma_FCP != 0 || suma_ICMSUFDest != 0) {
        for (var i = 0; i < arrFCPUF.length; i++) {
          IDD = arrFCPUF[i][2];
          if (!LIPA[IDD]) {
            LIPA[IDD] = {
              "UF": arrFCPUF[i][2],
              "FCP": Number(arrFCPUF[i][1]),
              "ICMS": Number(arrFCPUF[i][2])
            };
          } else {
            LIPA[IDD].FCP += Number(arrFCPUF[i][1]);
            LIPA[IDD].ICMS += Number(arrFCPUF[i][2]);
          }
        }
        var contadorE300 = 0;
        for (var j in JSON) {
          //REGISTRO E300
          //1.REG
          strBloqueE += '|E300|';
          //2.UF
          strBloqueE += LIPA[j].UF + '|';
          //3.DT_INI
          strBloqueE += periodfirstdate + '|';
          //4.DT_FIN
          strBloqueE += periodenddate + '|' + salto;

          //Registro E310
          //1.REG
          strBloqueE += '|E310|';
          //2.IND_MOV_FCP_DIFAL
          strBloqueE += '0|';
          //3.VL_SLD_CRED_ANT_DIFAL
          strBloqueE += '0|';
          //4.VL_TOT_DEBITOS_DIFAL
          strBloqueE += LIPA[j].ICMS + '|';
          //5.VL_OUT_DEB_DIFAL
          strBloqueE += '0|';
          //6.VL_TOT_CREDITOS_DIFAL
          strBloqueE += '0|';
          //7.VL_OUT_CRED_DIFAL
          strBloqueE += '0|';
          //8.VL_SLD_DEV_ANT_DIFAL
          strBloqueE += '0|';
          //9.VL_DEDUÇÕES_DIFAL
          strBloqueE += '0|';
          //10.VL_RECOL_DIFAL
          strBloqueE += '0|';
          //11.VL_SLD_CRED_TRANSPORTAR_DIFAL
          strBloqueE += '0|';
          //12.DEB_ESP_DIFAL
          strBloqueE += '0|';
          //13.VL_SLD_CRED_ANT_FCP
          strBloqueE += '0|';
          //14.VL_TOT_DEB_FCP
          strBloqueE += LIPA[j].FCP + '|';
          //15.VL_OUT_DEB_FCP
          strBloqueE += '0|';
          //16.VL_TOT_CRED_FCP
          strBloqueE += '0|';
          //17.VL_OUT_CRED_FCP
          strBloqueE += ' 0|';
          //18.VL_SLD_DEV_ANT_FCP
          strBloqueE += '0|';
          //19.VL_DEDUÇÕES_FCP
          strBloqueE += '0|';
          //20.VL_RECOL_FCP
          strBloqueE += '0|';
          //21.VL_SLD_CRED_TRANSPORTAR_FCP
          strBloqueE += '0|';
          //22.DEB_ESP_FCP
          strBloqueE += '0|' + salto;

          contadorE300++;
        }

        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'E300';
        arrAuxiliar[1] = contadorE300;
        ArrBloque9.push(arrAuxiliar);

        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'E100';
        arrAuxiliar[1] = contadorE300;
        ArrBloque9.push(arrAuxiliar);

        contador_E += contadorE300 + contadorE300;

      }
      //BLOques que hace referencia a IPI
      if ((campo3_E510 != 0 || campo4_E510 != 0) && actividad_economica != '1') {
        //Regitstro E500
        //1.REG
        strBloqueE += '|E500|';
        //2.IND_APUR
        strBloqueE += '0|';
        //3.DT_INI
        strBloqueE += periodfirstdate + '|';
        //4.DT_FIN
        strBloqueE += periodenddate + '|' + salto;
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'E500';
        arrAuxiliar[1] = 1;
        contador_E++;
        ArrBloque9.push(arrAuxiliar);
        RITA = {};
        for (var i = 0; i < arrBloqueEIPI.length; i++) {
          var IDDD = arrBloqueEIPI[i][0] + '|' + arrBloqueEIPI[i][1] + '|' + arrBloqueEIPI[i][2];

          if (!RITA[IDDD]) {
            RITA[IDDD] = {
              "Tipo": arrBloqueEIPI[i][0],
              "ST": arrBloqueEIPI[i][1],
              "CFOP": arrBloqueEIPI[i][2],
              "Base": Number(arrBloqueEIPI[i][3]),
              "Monto": Number(arrBloqueEIPI[i][4])
            };
          } else {
            RITA[IDDD].Base += Number(arrBloqueEIPI[i][3]);
            RITA[IDDD].Monto += Number(arrBloqueEIPI[i][4]);
          }
        }
        var cont510 = 0;
        var E510 = ''
        for (var j in RITA) {
          if (RITA[j].Monto != 0) {
            //1.REGhttps://4570554.app.netsuite.com/app/accounting/transactions/vendbill.nl?id=35987467&whence=
            strBloqueE += '|E510|';
            //2.CFOP
            strBloqueE += ValidaGuion(RITA[j].CFOP) + '|';
            //3.CST_IPI
            strBloqueE += RITA[j].ST + '|';
            //4.VL_CONT_IPI
            strBloqueE += '0|';
            //5.VL_BC_IPI
            strBloqueE += Number(RITA[j].Base).toFixed(2) + '|';
            //6.VL_IPI
            strBloqueE += Number(RITA[j].Monto).toFixed(2) + '|' + salto;
            cont510++;
          }
        }
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'E510';
        arrAuxiliar[1] = cont510;
        ArrBloque9.push(arrAuxiliar);
        contador_E += cont510;
        //Registro E520
        //1.REG
        strBloqueE += '|E520|';
        //2.VL_SD_ANT_IPI
        strBloqueE += '0|';
        //3.VL_DEB_IPI
        strBloqueE += Number(campo3_E510).toFixed(2) + '|';
        //4.VL_CRED_IPI
        strBloqueE += Number(campo4_E510).toFixed(2) + '|';
        //5.VL_OD_IPI
        strBloqueE += '0|';
        //6.VL_OC_IPI
        strBloqueE += '0|';
        var a = campo3_E510;
        var b = campo4_E510;
        resultado = a - b;
        resultado = Number(resultado.toFixed(2));
        if (resultado < 0) {
          resultado = (Math.abs(resultado)).toFixed(2);
          //7.VL_SC_IPI
          strBloqueE += resultado + '|';
          //8.VL_SD_IPI
          strBloqueE += '0|' + salto;
        } else {
          //7.VL_SC_IPI
          strBloqueE += '0|';
          //8.VL_SD_IPI
          strBloqueE += resultado + '|' + salto;
        }

        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'E520';
        arrAuxiliar[1] = 1;
        ArrBloque9.push(arrAuxiliar);
        contador_E++;
      } else if (actividad_economica != '1') {
        //Regitstro E500
        //1.REG
        strBloqueE += '|E500|';
        //2.IND_APUR
        strBloqueE += '0|';
        //3.DT_INI
        strBloqueE += periodfirstdate + '|';
        //4.DT_FIN
        strBloqueE += periodenddate + '|' + salto;
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'E500';
        arrAuxiliar[1] = 1;
        contador_E++;
        ArrBloque9.push(arrAuxiliar);
        //Registro E520
        //1.REG
        strBloqueE += '|E520|0|0|0|0|0|0|0|' + salto;
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'E520';
        arrAuxiliar[1] = 1;
        ArrBloque9.push(arrAuxiliar);
        contador_E++;
      }

      contador_global++;
      //Generar E990
      contador_E++;
      strBloqueE += '|E990|' + contador_E + '|' + salto;
      arrAuxiliar = new Array();
      arrAuxiliar[0] = 'E990';
      arrAuxiliar[1] = 1;
      ArrBloque9.push(arrAuxiliar);

      //reemplazamos los puntos por comas yaja¡¡¡¡
      strBloqueE = strBloqueE.replace(/\./g, ',');

      return strBloqueE;
    }

    function GenerarBloqueG() {
      var salto = '\r\n';
      var contador_G = 0;
      var strBloqueG = '';
      var arrAuxiliar = new Array();


      if (param_archivo_ren != null && param_archivo_ren != '' && ArrBloqueG0.length > 0 && param_bloqueg == 'T') {
        strBloqueG += '|G001|0|' + salto;
        arrAuxiliar[0] = 'G001';
        arrAuxiliar[1] = 1;
        ArrBloque9.push(arrAuxiliar);
        contador_G++;

        //bloque G110
        strBloqueG += ArrBloqueG0[0][0];
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'G110';
        arrAuxiliar[1] = Number(ArrBloqueG0[0][1]);
        ArrBloque9.push(arrAuxiliar);
        contador_G += Number(ArrBloqueG0[0][1]);

        //bloque G125
        strBloqueG += ArrBloqueG0[1][0];
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'G125';
        //contadores del G130 y G140 y G125, G126
        contadores = ArrBloqueG0[1][1].split('@');
        arrAuxiliar[1] = Number(contadores[0]);
        ArrBloque9.push(arrAuxiliar);
        contador_G += Number(contadores[0]);

        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'G126';
        arrAuxiliar[1] = Number(contadores[3]);
        ArrBloque9.push(arrAuxiliar);
        contador_G += Number(contadores[3]);
        //bloqueG130
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'G130';
        arrAuxiliar[1] = Number(contadores[2]);
        ArrBloque9.push(arrAuxiliar);
        contador_G += Number(contadores[2]);
        //bloqueG140
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'G140';
        arrAuxiliar[1] = Number(contadores[1]);
        ArrBloque9.push(arrAuxiliar);
        contador_G += Number(contadores[1]);
        //bloque G990
        contador_G++;
        strBloqueG += '|G990|' + contador_G + '|' + salto;
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'G990';
        arrAuxiliar[1] = 1;
        ArrBloque9.push(arrAuxiliar);
        strBloqueG = strBloqueG.replace(/\./g, ',')
        return strBloqueG;
      } else {
        strBloqueG += '|G001|1|' + salto;
        arrAuxiliar[0] = 'G001';
        arrAuxiliar[1] = 1;
        ArrBloque9.push(arrAuxiliar);
        strBloqueG += '|G990|2|' + salto;
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'G990';
        arrAuxiliar[1] = 1;
        ArrBloque9.push(arrAuxiliar);

        return strBloqueG;
      }
    }

    function GenerarBloqueH() {
      var salto = '\r\n';
      var contador_H = 0;
      var strBloqueH = '';
      var arrAuxiliar = new Array();
      var strAuxiliar = '';
      var suma_H010 = 0;
      var contador_h010 = 0;
      H010 = {};
      var arr_valido = ["07", "08", "8B", "09", "55", "10", "11", "26", "27", "57", "67", "63", "06", "66", "28", "29", "21", "22"];

      ArrItemH = QuitarRepetidos(ArrItem);
      for (var i = 0; i < ArrItemH.length; i++) {
        //log.error('mira','ID:'+ArrItemH[i][0]+'--cantidad:' + ArrItemH[i][31] + '--Cuenta:' + ArrItemH[i][33] + '--docu:'+ ArrItemH[i][9]+ '--CFOp:' + ArrItemH[i][7]+'--serv1:'+ArrItemH[i][tam - 4]+'--serv2:'+ArrItemH[i][tam - 12]);
        tam = ArrItemH[i].length;
        ID = ArrItemH[i][0];
        if (ArrItemH[i][31] != '0' && ArrItemH[i][31] != '' && ArrItemH[i][33] != '' && !H010[ID] && arr_valido.indexOf(ArrItemH[i][9]) == -1 && ArrItemH[i][ArrItemH[i].length - 2] == 'NO' && (ArrItemH[i][7].substring(0, 1) == '4' || ArrItemH[i][7].substring(0, 1) == '5' || ArrItemH[i][7].substring(0, 1) == '6')) {
          H010[ID] = {
            "codigo": ArrItemH[i][0],
            "unidad": ArrItemH[i][3],
            "cantidad": ArrItemH[i][31],
            "v_unitario": ArrItemH[i][32],
            "cuenta": ArrItemH[i][33],
            "CST": ArrItemH[i][12],
            "Porcentaje": ArrItemH[i][13]
          };
        }

        if (ArrItemH[i][31] != '0' && ArrItemH[i][31] != '' && ArrItemH[i][33] != '' && !H010[ID] && arr_valido_c.indexOf(ArrItemH[i][9]) == -1 && (ArrItemH[i][7].substring(0, 1) == '1' || ArrItemH[i][7].substring(0, 1) == '2' || ArrItemH[i][7].substring(0, 1) == '3') && ArrItemH[i][ArrItemH[i].length - 6] == 'NO') {
          H010[ID] = {
            "codigo": ArrItemH[i][0],
            "unidad": ArrItemH[i][3],
            "cantidad": ArrItemH[i][31],
            "v_unitario": ArrItemH[i][32],
            "cuenta": ArrItemH[i][33],
            "CST": ArrItemH[i][12],
            "Porcentaje": ArrItemH[i][13]
          };
        }

      }

      if (param_bloquek == 'T' || param_bloquek == true) {

        if (param_Mot_Inv != '01') {
          for (var k in H010) {
            //1.CMAPO FIJO
            strAuxiliar += '|H010|';
            //2.COD_ITEM
            strAuxiliar += H010[k].codigo + '|';
            //3.UNID
            strAuxiliar += H010[k].unidad + '|';
            //4.QTD
            strAuxiliar += H010[k].cantidad + '|';
            QTD = Number(H010[k].cantidad);
            //5.VL_UNIT
            strAuxiliar += H010[k].v_unitario + '|';
            VL_UNIT = Number(H010[k].v_unitario);
            //6.VL_ITEM
            suma_H010 += QTD * VL_UNIT;
            strAuxiliar += (QTD * VL_UNIT).toFixed(2) + '|';
            //7.IND_PROP --- por el momento lo dejare como 0
            strAuxiliar += '0|';
            //8.COD_PART -- esto va ir cambiando dependiendo del anterior campo
            strAuxiliar += '|';
            //9.TXT_COMPL -- ni idea de que va aqui xD
            strAuxiliar += '|';
            //10.COD_CTA -- ah todo item esta amarrado a una cuenta creo que si se puede sacar gaaaa
            strAuxiliar += H010[k].cuenta + '|';
            //11.VL_ITEM_IR
            strAuxiliar += (QTD * VL_UNIT).toFixed(2) + '|' + salto;
            contador_h010++;

            //genero bloque H020
            //1.CMAPO FIJO
            strAuxiliar += '|H020|';
            //2.CST_ICMS
            strAuxiliar += H010[k].CST + '|';
            //3.BC_ICMS
            base = QTD * VL_UNIT;
            strAuxiliar += base.toFixed(2) + '|';
            //4.VL_ICMS
            porc = Number(ValidaPorcentaje(H010[k].Porcentaje));
            porc = porc * base;
            strAuxiliar += porc.toFixed(2) + '|' + salto;

          }

          if (suma_H010 != 0) {
            strBloqueH += '|H001|';
            strBloqueH += '0|' + salto;
            arrAuxiliar[0] = 'H001';
            arrAuxiliar[1] = 1;
            ArrBloque9.push(arrAuxiliar);

            //Bloque H005
            //1.CMAPO FIJO
            strBloqueH += '|H005|';
            //2.DT_INV
            strBloqueH += periodenddate + '|';
            //3.VL_INV
            strBloqueH += suma_H010.toFixed(2) + '|';
            //4.MOT_INV
            strBloqueH += param_Mot_Inv + '|' + salto;

            arrAuxiliar = new Array();
            arrAuxiliar[0] = 'H005';
            arrAuxiliar[1] = 1;
            ArrBloque9.push(arrAuxiliar);
            arrAuxiliar = new Array();
            arrAuxiliar[0] = 'H010';
            arrAuxiliar[1] = contador_h010;
            ArrBloque9.push(arrAuxiliar);
            arrAuxiliar = new Array();
            arrAuxiliar[0] = 'H020';
            arrAuxiliar[1] = contador_h010;
            ArrBloque9.push(arrAuxiliar);
            resultado = (2 * contador_h010) + 3;
            strAuxiliar += '|H990|' + resultado + '|' + salto;
            arrAuxiliar = new Array();
            arrAuxiliar[0] = 'H990';
            arrAuxiliar[1] = 1;
            ArrBloque9.push(arrAuxiliar);

            strReturn = strBloqueH + strAuxiliar;
            strReturn = strReturn.replace(/\./g, ',')
            return strReturn;
          }
          strBloqueH += '|H001|';
          strBloqueH += '1|' + salto;
          arrAuxiliar[0] = 'H001';
          arrAuxiliar[1] = 1;
          ArrBloque9.push(arrAuxiliar);
          strAuxiliar += '|H990|2|' + salto;
          arrAuxiliar = new Array();
          arrAuxiliar[0] = 'H990';
          arrAuxiliar[1] = 1;
          ArrBloque9.push(arrAuxiliar);

          strReturn = strBloqueH + strAuxiliar;
          strReturn = strReturn.replace(/\./g, ',')
          return strReturn;


        } else {
          for (var k in H010) {
            //1.CMAPO FIJO
            strAuxiliar += '|H010|';
            //2.COD_ITEM
            strAuxiliar += H010[k].codigo + '|';
            //3.UNID
            strAuxiliar += H010[k].unidad + '|';
            //4.QTD
            strAuxiliar += H010[k].cantidad + '|';
            QTD = Number(H010[k].cantidad);
            //5.VL_UNIT
            strAuxiliar += H010[k].v_unitario + '|';
            VL_UNIT = Number(H010[k].v_unitario);
            //6.VL_ITEM
            suma_H010 += QTD * VL_UNIT;
            strAuxiliar += (QTD * VL_UNIT).toFixed(2) + '|';
            //7.IND_PROP --- por el momento lo dejare como 0
            strAuxiliar += '0|';
            //8.COD_PART -- esto va ir cambiando dependiendo del anterior campo
            strAuxiliar += '|';
            //9.TXT_COMPL -- ni idea de que va aqui xD
            strAuxiliar += '|';
            //10.COD_CTA -- ah todo item esta amarrado a una cuenta creo que si se puede sacar gaaaa
            strAuxiliar += H010[k].cuenta + '|';
            //11.VL_ITEM_IR
            strAuxiliar += (QTD * VL_UNIT).toFixed(2) + '|' + salto;
            contador_h010++;
          }

          if (suma_H010 != 0) {

            strBloqueH += '|H001|';
            strBloqueH += '0|' + salto;
            arrAuxiliar[0] = 'H001';
            arrAuxiliar[1] = 1;
            ArrBloque9.push(arrAuxiliar);
            //Bloque H005
            //1.CMAPO FIJO
            strBloqueH += '|H005|';
            //2.DT_INV
            strBloqueH += periodenddate + '|';
            //3.VL_INV
            strBloqueH += suma_H010.toFixed(2) + '|';
            //4.MOT_INV
            strBloqueH += param_Mot_Inv + '|' + salto;

            arrAuxiliar = new Array();
            arrAuxiliar[0] = 'H005';
            arrAuxiliar[1] = 1;
            ArrBloque9.push(arrAuxiliar);
            arrAuxiliar = new Array();
            arrAuxiliar[0] = 'H010';
            arrAuxiliar[1] = contador_h010;
            ArrBloque9.push(arrAuxiliar);
            resultado = contador_h010 + 3;
            strAuxiliar += '|H990|' + resultado + '|' + salto;
            arrAuxiliar = new Array();
            arrAuxiliar[0] = 'H990';
            arrAuxiliar[1] = 1;
            ArrBloque9.push(arrAuxiliar);
            strReturn = strBloqueH + strAuxiliar;
            strReturn = strReturn.replace(/\./g, ',');
            return strReturn;
          }
          strBloqueH += '|H001|';
          strBloqueH += '1|' + salto;
          arrAuxiliar[0] = 'H001';
          arrAuxiliar[1] = 1;
          ArrBloque9.push(arrAuxiliar);
          strAuxiliar += '|H990|2|' + salto;
          arrAuxiliar = new Array();
          arrAuxiliar[0] = 'H990';
          arrAuxiliar[1] = 1;
          ArrBloque9.push(arrAuxiliar);
          strReturn = strBloqueH + strAuxiliar;
          strReturn = strReturn.replace(/\./g, ',');
          return strReturn;
        }

      } else {
        strBloqueH += '|H001|';
        strBloqueH += '1|' + salto;
        arrAuxiliar[0] = 'H001';
        arrAuxiliar[1] = 1;
        ArrBloque9.push(arrAuxiliar);

        strBloqueH += '|H990|2|' + salto;
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'H990';
        arrAuxiliar[1] = 1;
        ArrBloque9.push(arrAuxiliar);
        return strBloqueH;
      }
    }

    function GenerarBloqueK() {
      var salto = '\r\n';
      var contador_K200 = 0;
      var strBloqueK = '';
      var arrAuxiliar = new Array();
      var existe = false;
      contador_K = 0;

      //Bloque K200

      arrItemNoRep = QuitarRepetidos(ArrItem);
      var strk200 = '';
      var arrK200 = ['', '07', '08', '09', '99'];
      var arr_valido = ["07", "08", "8B", "09", "55", "10", "11", "26", "27", "57", "67", "63", "06", "66", "28", "29", "21", "22"];

      K200 = {};
      for (var i = 0; i < arrItemNoRep.length; i++) {
        ID = arrItemNoRep[i][0];

        if ((!K200[ID] && arrItemNoRep[i][31] != '0' && arrItemNoRep[i][31] != '' && arrK200.indexOf(arrItemNoRep[i][5]) == -1 && arr_valido.indexOf(arrItemNoRep[i][9]) == -1 && arrItemNoRep[i][arrItemNoRep[i].length - 2] == 'NO') || (!K200[ID] && arrItemNoRep[i][31] != '0' && arrItemNoRep[i][31] != '' && arrK200.indexOf(arrItemNoRep[i][5]) == -1 && arrItemNoRep[i][9] == '55' && (arrItemNoRep[i][7].substring(0, 1) == '1' || arrItemNoRep[i][7].substring(0, 1) == '2' || arrItemNoRep[i][7].substring(0, 1) == '3') && arrItemNoRep[i][arrItemNoRep[i].length - 6] == 'NO')) {
          if (!existe) {
            existe = true;
          }
          K200[ID] = {
            "codigo": ID,
            "cantidad": ArrItem[i][31]
          }
        }
      }

      for (var k in K200) {
        //1. CAMPO FIJO
        strk200 += '|K200|';
        //2. DT_EST
        strk200 += periodenddate + '|';
        //3. COD_ITEM
        strk200 += K200[k].codigo + '|';
        //4. QTD
        strk200 += K200[k].cantidad + '|';
        //5. IND_EST -- por el momento lo dejare como 0
        strk200 += '0|';
        //6. COD_PART
        strk200 += '|' + salto;
        contador_K200++;
      }


      if (existe) {
        strBloqueK += '|K001|0|' + salto;
        arrAuxiliar[0] = 'K001';
        arrAuxiliar[1] = 1;
        ArrBloque9.push(arrAuxiliar);
        contador_K++;
        //Bloque K100
        //1. CAMPO FIJO
        strBloqueK += '|K100|';
        //2. DT_INI
        strBloqueK += periodfirstdate + '|';
        //3. DT_FIN
        strBloqueK += periodenddate + '|' + salto;
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'K100';
        arrAuxiliar[1] = 1;
        ArrBloque9.push(arrAuxiliar);
        contador_K++;
        strBloqueK += strk200;
      } else {
        strBloqueK += '|K001|1|' + salto;
        arrAuxiliar[0] = 'K001';
        arrAuxiliar[1] = 1;
        ArrBloque9.push(arrAuxiliar);
        contador_K++;
      }

      if (contador_K200 != 0) {
        arrAuxiliar = new Array();
        arrAuxiliar[0] = 'K200';
        arrAuxiliar[1] = contador_K200;
        ArrBloque9.push(arrAuxiliar);
        contador_K += contador_K200
      }

      contador_K++;
      strBloqueK += '|K990|' + contador_K + '|' + salto;
      arrAuxiliar = new Array();
      arrAuxiliar[0] = 'K990';
      arrAuxiliar[1] = 1;
      ArrBloque9.push(arrAuxiliar);

      strBloqueK = strBloqueK.replace(/\./g, ',');

      return strBloqueK;
    }


    function GenerarBloque0() {
      var contador_arreglo = 0;
      var arrAuxiliar = new Array();
      version_efd = BuscarLeadingVersion();
      //***************** BLOQUE0 *****************
      //Registro 0000
      var salto = '\r\n';
      arrAuxiliar[0] = '0000';
      //1
      StrReporte += '|0000|';
      //2
      StrReporte += version_efd + '|';
      //3
      StrReporte += param_Type_Decla + '|';
      //4
      StrReporte += periodfirstdate + '|';
      //5
      StrReporte += periodenddate + '|';
      //6
      StrReporte += subsiname + '|';
      //7
      StrReporte += cnpj + '|';
      //8
      StrReporte += '|';
      //9
      StrReporte += provincia + '|';
      //10
      StrReporte += estado_entidad + '|';
      //11
      StrReporte += municipal + '|';
      //12
      StrReporte += ValidaGuion(muni_inscripcion) + '|';
      //13
      StrReporte += ValidaGuion(suframa) + '|';
      //14
      StrReporte += perfil + '|';
      //15
      if (actividad_economica != '0') {
        actividad_economica = '1';
      }
      StrReporte += actividad_economica + '|' + salto;
      arrAuxiliar[1] = 1;
      ArrBloque9.push(arrAuxiliar);
      contador_global++;

      //Registro 0001
      arrAuxiliar = new Array();
      arrAuxiliar[0] = '0001';
      StrReporte += '|0001|';
      //por el momento este campo se seteara con '0'
      StrReporte += '0|' + salto;
      arrAuxiliar[1] = 1;
      ArrBloque9.push(arrAuxiliar);
      contador_global++;

      //registro 0002
      if (actividad_economica == '0') {
        StrReporte += '|0002|';
        StrReporte += codigo_industrial + '|' + salto;
        arrAuxiliar = new Array();
        arrAuxiliar[0] = '0002';
        arrAuxiliar[1] = 1;
        ArrBloque9.push(arrAuxiliar);
        contador_global++;
      }

      //Registro 0005
      arrAuxiliar = new Array();
      StrReporte += '|0005|';
      StrReporte += subsiname.substring(0, 60) + '|';
      StrReporte += codigo_postal + '|';
      StrReporte += direccion.substring(0, 60) + '|';
      StrReporte += num_subsi + '|';
      StrReporte += complemento + '|';
      StrReporte += barrio.substring(0, 60) + '|';
      StrReporte += ValidaGuion(telefono_subsi) + '|';
      StrReporte += ValidaGuion(fax_subsi) + '|';
      StrReporte += email_subsi + '|' + salto;
      arrAuxiliar[0] = '0005';
      arrAuxiliar[1] = 1;
      ArrBloque9.push(arrAuxiliar);
      contador_global++;

      //Registro 0100
      arrAuxiliar = new Array();
      StrReporte += '|0100|';
      StrReporte += nombre_responsable.substring(0, 100) + '|';
      StrReporte += cpf_responsable.substring(0, 11) + '|';
      StrReporte += crc_responsable.substring(0, 15) + '|';
      StrReporte += '|';
      StrReporte += cep_responsable.substring(0, 8) + '|';
      StrReporte += direccion_responsable.substring(0, 60) + '|';
      StrReporte += numero_dire_responsable.substring(0, 10) + '|';
      StrReporte += complmento_responsable.substring(0, 60) + '|';
      StrReporte += barrio_responsable.substring(0, 59) + '|';
      telefono_responsable = ValidaGuion(telefono_responsable);
      StrReporte += telefono_responsable.substring(0, 11) + '|';
      fax_responsable = ValidaGuion(fax_responsable);
      StrReporte += fax_responsable.substring(0, 11) + '|';
      StrReporte += email_responsable + '|';
      StrReporte += municipio_responsable + '|' + salto;
      contador_global++;
      arrAuxiliar[0] = '0100';
      arrAuxiliar[1] = 1;
      ArrBloque9.push(arrAuxiliar);


      var f_hoy = new Date();
      d = String(f_hoy.getDate());
      if (d.length == 1) {
        d = '0' + d;
      }
      m = String(f_hoy.getMonth() + 1);
      if (m.length == 1) {
        m = '0' + m;
      }
      y = f_hoy.getFullYear();
      f_hoy = d + m + y;
      var cont_0175 = 0;
      //Registro 0150
      arrAuxiliar = new Array();
      arrAuxiliar[0] = '0150';
      var contador1 = 0;

      for (var j = 0; j < ArrVendor.length; j++) {
        if (ArrVendor[j][0] != "") {


          if (ArrVendor[j][ArrVendor[j].length - 2] != '02') {
            //01. numero fijo del bloque
            StrReporte += '|0150|';
            //02. COD PART
            StrReporte += ArrVendor[j][0] + '|';
            //03. NOMBRE DE VENDOR
            StrReporte += ArrVendor[j][1] + '|';
            //04. COD PAIS
            StrReporte += ArrVendor[j][2] + '|';
            if (ArrVendor[j][2] == '1058') {

              if (ArrVendor[j][6] == 'F') {
                StrReporte += ValidaGuion(ArrVendor[j][3]) + '|';
                StrReporte += '|';
              } else {
                StrReporte += '|';
                StrReporte += ValidaGuion(ArrVendor[j][3]) + '|';
              }
            } else {
              StrReporte += '|';
              StrReporte += '|';
            }
            //07. INSCRIPCION ESTADUAL
            StrReporte += ValidaGuion(ArrVendor[j][11]).substring(0, 14) + '|';

            //08. COD MUNICIPIO
            StrReporte += ArrVendor[j][4] + '|';
            //09 SUFRAMA
            StrReporte += '|';
            //10. LOGRADURO LE DICEN END NO SE PORQUE XD
            auxiliar = ArrVendor[j][5].substring(0, 59);
            if (auxiliar.charAt(auxiliar.length - 1) == ' ') {
              StrReporte += auxiliar.slice(0, -1) + '|';
            } else {
              StrReporte += auxiliar + '|';
            }
            //11. NUM DE INMOVIL (QUE SERA ESTO)
            auxiliar = ArrVendor[j][8].substring(0, 10);
            if (auxiliar.charAt(auxiliar.length - 1) == ' ') {
              StrReporte += auxiliar.slice(0, -1) + '|';
            } else {
              StrReporte += auxiliar + '|';
            }
            //12. DATOS COMPLEMENTARIOS
            auxiliar = ArrVendor[j][10].substring(0, 59);
            if (auxiliar.charAt(auxiliar.length - 1) == ' ') {
              StrReporte += auxiliar.slice(0, -1) + '|';
            } else {
              StrReporte += auxiliar + '|';
            }
            //13. BARRIO EN EL QUE SE UBICA (LITERAL XD)
            auxiliar = ArrVendor[j][9].substring(0, 59);
            if (auxiliar.charAt(auxiliar.length - 1) == ' ') {
              StrReporte += auxiliar.slice(0, -1) + '|' + salto;
            } else {
              StrReporte += auxiliar + '|' + salto;
            }
            contador_global++;
            contador1++;

            //variable auxiliar para ver las keys del json
            //mikeys = Object.keys(JSONCambios[ArrVendor[j][0]]);
            //generamos los 0175 del vendor
            /*if (JSONCambios[ArrVendor[j][0]][3].Cambio == 'si') {
              log.debug('Alex2', JSONCambios[ArrVendor[j][0]]);
              log.debug('Alex3', JSONCambios[ArrVendor[j][0]][3].Valor2);
              StrReporte+= '|0175|';
              //DT_ALT
              StrReporte+= f_hoy+'|';
              //NR_CAMPO
              StrReporte+= completar_cero(2,mikeys[0]) +'|';
              //CONT_ANT
              StrReporte+= ValidaGuion(JSONCambios[ArrVendor[j][0]][3].Valor2)+'|' +salto;
              cont_0175++;
            }
            if (JSONCambios[ArrVendor[j][0]][4].Cambio == 'si') {
              StrReporte+= '|0175|';
              //DT_ALT
              StrReporte+= f_hoy+'|';
              //NR_CAMPO
              StrReporte+= completar_cero(2,mikeys[1])+'|';
              //CONT_ANT
              StrReporte+= ValidaGuion(JSONCambios[ArrVendor[j][0]][4].Valor2)+'|' +salto;
              cont_0175++;
            }
            if (JSONCambios[ArrVendor[j][0]][5].Cambio == 'si' && JSONCambios[ArrVendor[j][0]][5].Valor2 != '') {
              StrReporte+= '|0175|';
              //DT_ALT
              StrReporte+= f_hoy+'|';
              //NR_CAMPO
              StrReporte+= completar_cero(2,mikeys[2])+'|';
              //CONT_ANT
              StrReporte+= ValidaGuion(JSONCambios[ArrVendor[j][0]][5].Valor2)+'|' +salto;
              cont_0175++;
            }
            if (JSONCambios[ArrVendor[j][0]][6].Cambio == 'si' && JSONCambios[ArrVendor[j][0]][6].Valor2 != '') {
              StrReporte+= '|0175|';
              //DT_ALT
              StrReporte+= f_hoy+'|';
              //NR_CAMPO
              StrReporte+= completar_cero(2,mikeys[3])+'|';
              //CONT_ANT
              StrReporte+= ValidaGuion(JSONCambios[ArrVendor[j][0]][6].Valor2)+'|' +salto;
              cont_0175++;
            }
            if (JSONCambios[ArrVendor[j][0]][8].Cambio == 'si') {
              StrReporte+= '|0175|';
              //DT_ALT
              StrReporte+= f_hoy+'|';
              //NR_CAMPO
              StrReporte+= completar_cero(2,mikeys[4])+'|';
              //CONT_ANT
              StrReporte+= JSONCambios[ArrVendor[j][0]][8].Valor2+'|' +salto;
              cont_0175++;
            }
            if (JSONCambios[ArrVendor[j][0]][9].Cambio == 'si') {
              StrReporte+= '|0175|';
              //DT_ALT
              StrReporte+= f_hoy+'|';
              //NR_CAMPO
              StrReporte+= completar_cero(2,mikeys[5])+'|';
              //CONT_ANT
              StrReporte+= JSONCambios[ArrVendor[j][0]][9].Valor2+'|' +salto;
              cont_0175++;
            }
            if (JSONCambios[ArrVendor[j][0]][10].Cambio == 'si') {
              StrReporte+= '|0175|';
              //DT_ALT
              StrReporte+= f_hoy+'|';
              //NR_CAMPO
              StrReporte+= completar_cero(2,mikeys[6])+'|';
              //CONT_ANT
              StrReporte+= JSONCambios[ArrVendor[j][0]][10].Valor2+'|' +salto;
              cont_0175++;
            }
            if (JSONCambios[ArrVendor[j][0]][11].Cambio == 'si') {
              StrReporte+= '|0175|';
              //DT_ALT
              StrReporte+= f_hoy+'|';
              //NR_CAMPO
              StrReporte+= completar_cero(2,mikeys[7])+'|';
              //CONT_ANT
              StrReporte+= JSONCambios[ArrVendor[j][0]][11].Valor2+'|' +salto;
              cont_0175++;
            }
            if (JSONCambios[ArrVendor[j][0]][12].Cambio == 'si') {
              StrReporte+= '|0175|';
              //DT_ALT
              StrReporte+= f_hoy+'|';
              //NR_CAMPO
              StrReporte+= completar_cero(2,mikeys[8])+'|';
              //CONT_ANT
              StrReporte+= JSONCambios[ArrVendor[j][0]][12].Valor2+'|' +salto;
              cont_0175++;
            }
            if (JSONCambios[ArrVendor[j][0]][13].Cambio == 'si') {
              StrReporte+= '|0175|';
              //DT_ALT
              StrReporte+= f_hoy+'|';
              //NR_CAMPO
              StrReporte+= completar_cero(2,mikeys[9])+'|';
              //CONT_ANT
              StrReporte+= JSONCambios[ArrVendor[j][0]][13].Valor2+'|' +salto;
              cont_0175++;
            }*/
          }
        }


      }
      for (var j = 0; j < ArrVendorG.length; j++) {

        //01. numero fijo del bloque
        StrReporte += '|0150|';
        //02. COD PART
        StrReporte += ArrVendorG[j][0] + '|';
        //03. NOMBRE DE VENDOR
        StrReporte += ArrVendorG[j][1] + '|';
        //04. COD PAIS
        StrReporte += ArrVendorG[j][2] + '|';
        if (ArrVendorG[j][2] == '1058') {
          if (ArrVendorG[j][6] == 'F') {
            StrReporte += ValidaGuion(ArrVendorG[j][3]) + '|';
            StrReporte += /*ValidaGuion(Arrcustomer[i][3])+*/'|';
          } else {
            StrReporte += '|';
            StrReporte += ValidaGuion(ArrVendorG[j][3]) + '|';
          }
        } else {
          StrReporte += '|';
          StrReporte += '|';
        }
        //07. INSCRIPCION ESTADUAL
        StrReporte += ArrVendorG[j][11].substring(0, 14) + '|';
        //08. COD MUNICIPIO
        StrReporte += ArrVendorG[j][4] + '|';
        //09 SUFRAMA
        StrReporte += '|';
        //10. LOGRADURO LE DICEN END NO SE PORQUE XD
        StrReporte += ArrVendorG[j][5] + '|';
        //11. NUM DE INMOVIL (QUE SERA ESTO)
        StrReporte += ArrVendorG[j][8] + '|';
        //12. DATOS COMPLEMENTARIOS
        StrReporte += ArrVendorG[j][10] + '|';
        //13. BARRIO EN EL QUE SE UBICA (LITERAL XD)
        StrReporte += ArrVendorG[j][9] + '|' + salto;
        contador_global++;
      }

      arrAuxiliar[1] = contador1 + ArrCustomer.length + ArrVendorG.length;
      ArrBloque9.push(arrAuxiliar);

      //0175
      if (cont_0175 > 0) {
        arrAuxiliar = new Array();
        arrAuxiliar[0] = '0175';
        arrAuxiliar[1] = cont_0175;
        ArrBloque9.push(arrAuxiliar);
        contador_global += cont_0175;
      }
      arr_valido = ["07", "08", "8B", "09", "55", "10", "11", "26", "27", "57", "67", "63", "06", "66", "28", "29"];
      arr_valido_c = ["07", "08", "8B", "09", "10", "11", "26", "27", "57", "67", "63", "06", "66", "28", "29", "21", "22"];
      arr_valido_cfop = ["07", "08", "8B", "55", "09", "10", "11", "26", "21", "22", "27", "57", "67", "63", "06", "66", "28", "29"];
      arr_valido_cfop_c = ["07", "08", "8B", "09", "10", "11", "26", "27", "57", "67", "63", "21", "22", "06", "66", "28", "29"];
      //Registro 0190
      Registro0190 = Generar0190(arr_valido);
      R0190 = Registro0190.split('&');
      StrReporte += R0190[0];
      contador_global = contador_global + Number(R0190[1]);
      arrAuxiliar = new Array();
      arrAuxiliar[0] = '0190';
      arrAuxiliar[1] = Number(R0190[1]);
      ArrBloque9.push(arrAuxiliar);

      //Registro 0200
      arrAuxiliar = new Array();
      contador_0200 = 0;
      contador_0205 = 0;

      var R200 = {};
      var R400 = {};
      var R450 = {};
      var R460 = {};
      for (var i = 0; i < ArrItem.length; i++) {
        ID = ArrItem[i][0];
        var tam = ArrItem[i].length;
        if ((!R200[ID] && arr_valido.indexOf(ArrItem[i][9]) == -1 && (ArrItem[i][7].substring(0, 1) == '4' || ArrItem[i][7].substring(0, 1) == '5' || ArrItem[i][7].substring(0, 1) == '6') && ArrItem[i][56] == 'NO')) {
          R200[ID] = {
            "codigo": ID,
            "descripcion": ArrItem[i][4],
            "unidad": ArrItem[i][3],
            "tipo": ArrItem[i][5],
            "mcn": ArrItem[i][34],
            "Cambios": ArrItem[i][58]
          };
        }

        //log.error('esto es para ver el de compra',ID +'----)'+arr_valido_c.indexOf(ArrItem[i][9])+ '--'+ ArrItem[i][7].substring(0,1)+'--' + ArrItem[i][ArrItem[i].length - 1]);
        if (!R200[ID] && arr_valido_c.indexOf(ArrItem[i][9]) == -1 && (ArrItem[i][7].substring(0, 1) == '1' || ArrItem[i][7].substring(0, 1) == '2' || ArrItem[i][7].substring(0, 1) == '3') && ArrItem[i][52] == 'NO') {
          R200[ID] = {
            "codigo": ID,
            "descripcion": ArrItem[i][4],
            "unidad": ArrItem[i][3],
            "tipo": ArrItem[i][5],
            "mcn": ArrItem[i][34],
            "Cambios": ArrItem[i][58]
          };
        }
        //para generar el 0400 6933



        if (ArrItem[i][7] != '' && (ArrItem[i][7].substring(0, 1) == '1' || ArrItem[i][7].substring(0, 1) == '2' || ArrItem[i][7].substring(0, 1) == '3' || ArrItem[i][7].substring(0, 1) == '4' || ArrItem[i][7].substring(0, 1) == '5' || ArrItem[i][7].substring(0, 1) == '6') && c_0400 == 'T' && (ArrItem[i][9] == '01' || ArrItem[i][9] == '1B' || ArrItem[i][9] == '04' || ArrItem[i][9] == '55' || ArrItem[i][9] == '65')) {

          if (ArrItem[i][52] == 'NO') {
            IDD = ValidaGuion(ArrItem[i][7]);
            if (!R400[IDD]) {
              var status = Obtener_clave(ArrItem[i][1])
              if (status != 'Cancelada') {
                R400[IDD] = {
                  "cod": IDD,
                  "Descrp": ArrItem[i][42]
                };
              }

            }
          }



          if (ArrItem[i][56] == 'NO') {
            var tran = search.lookupFields({
              type: search.Type.TRANSACTION,
              id: ArrItem[i][1],
              //me da curiosidad esta partesirigilla xD
              columns: ["type"]
            });

            if ((tran.type[0].value == 'CustInvc' || tran.type[0].value == 'ItemShip' || tran.type[0].value == 'VendCred') && ArrItem[i][9] == '55') {
            } else {

              IDD = ValidaGuion(ArrItem[i][7]);
              if (!R400[IDD]) {
                var status = Obtener_clave(ArrItem[i][1]);
                if (status != 'Cancelada') {
                  R400[IDD] = {
                    "cod": IDD,
                    "Descrp": ArrItem[i][tam - 7]
                  };
                }
              }


            }

          }


        }

      }

      //para el 0460
      for (var i = 0; i < arrTransaction.length; i++) {
        if (arrTransaction[i][1] == 'VendBill') {
          ID = arrTransaction[i][59];
          if (!R460[ID] && ID != '') {
            R460[ID] = {
              "codigo": arrTransaction[i][59],
              "nombre": arrTransaction[i][58]
            };
          }
        }
      }


      if (param_bloqueg == 'T') {
        for (var i = 0; i < ArrItemG.length; i++) {
          ID = ArrItemG[i][0];


          if (!R200[ID] && ArrSituaciones.indexOf(ArrItemG[i][8]) != -1) {
            R200[ID] = {
              "codigo": ID,
              "descripcion": ArrItemG[i][1],
              "unidad": ArrItemG[i][7],
              "tipo": ArrItemG[i][2],
              "mcn": ArrItemG[i][4],
              "Cambios": "|||"
            };
          }

        }
      }

      h_0205 = false;
      for (var k in R200) {
        StrReporte += '|0200|';
        StrReporte += R200[k].codigo + '|';
        StrReporte += R200[k].descripcion + '|';
        StrReporte += '|';
        StrReporte += '|';
        StrReporte += R200[k].unidad + '|';
        StrReporte += R200[k].tipo + '|';
        if (R200[k].tipo != '09') {
          StrReporte += ValidaGuion(R200[k].mcn) + '|';
        } else {
          StrReporte += '|';
        }
        StrReporte += '|';
        StrReporte += '|';
        StrReporte += '|';
        StrReporte += '|';
        StrReporte += '|' + salto;
        contador_0200++;

        if (R200[k].Cambios != '|||') {

          StrReporte += '|0205|' + R200[k].Cambios + '|' + salto;
          contador_0205++;
          if (!h_0205) {
            h_0205 = true;
          }
        }

      }

      arrAuxiliar[0] = '0200';
      arrAuxiliar[1] = contador_0200;
      contador_global += contador_0200;
      ArrBloque9.push(arrAuxiliar);
      if (h_0205) {
        arrAuxiliar = new Array();
        arrAuxiliar[0] = '0205';
        arrAuxiliar[1] = contador_0205;
        contador_global += contador_0205;
        ArrBloque9.push(arrAuxiliar);
      }
      var h_0400 = false;
      var h_0450 = false;
      var h_0460 = false;
      var cont_0400 = 0;
      var cont_0450 = 0;
      var cont_0460 = 0;

      //empezaremos con el bloque 0300+

      if (ArrBloqueG0.length > 0 && param_bloqueg == 'T') {
        StrReporte += ArrBloqueG0[3][0];
        arrAuxiliar = new Array();
        arrAuxiliar[0] = '0300';
        contar_g = ArrBloqueG0[3][1].split('||');
        arrAuxiliar[1] = Number(contar_g[0]);
        ArrBloque9.push(arrAuxiliar);

        contador_global += Number(contar_g[0]);

        if (Number(contar_g[1] > 0)) {
          arrAuxiliar = new Array();
          arrAuxiliar[0] = '0305';
          arrAuxiliar[1] = Number(contar_g[1]);
          ArrBloque9.push(arrAuxiliar);
          contador_global += Number(contar_g[1]);
        }

        for (k in R400) {
          h_0400 = true;
          StrReporte += '|0400|';
          StrReporte += R400[k].cod + '|';
          StrReporte += R400[k].Descrp + '|' + salto;
          cont_0400++;
        }
        if (h_0400) {
          arrAuxiliar = new Array();
          arrAuxiliar[0] = '0400';
          arrAuxiliar[1] = cont_0400;

          ArrBloque9.push(arrAuxiliar);
          contador_global += cont_0400;
        }
        //0450
        h_0450 = true;
        for (var i = 0; i < arrTransaction.length; i++) {
          if ((arrTransaction[i][2] == '01' || arrTransaction[i][2] == '1B' || arrTransaction[i][2] == '04' || arrTransaction[i][2] == '55') && arrTransaction[i][1] != 'ItemShip' && arrTransaction[i][1] != 'ItemRcpt' && c_0450 == 'T') {
            if (arrTransaction[i][1] == 'VendCred' && arrTransaction[i][72] != 'Cancelada') {
              StrReporte += '|0450|';
              //1.COD_INF
              StrReporte += arrTransaction[i][0].substring(arrTransaction[i][0].length - 6, arrTransaction[i][0].length) + '|';
              //2.TXT_COMPL
              StrReporte += 'DANFE|' + salto;
              cont_0450++;
            } else {
              if (arrTransaction[i][1] != 'VendBill' && arrTransaction[i][70] != '') {
                StrReporte += '|0450|';
                //1.COD_INF
                StrReporte += arrTransaction[i][0].substring(arrTransaction[i][0].length - 6, arrTransaction[i][0].length) + '|';
                //2.TXT_COMPL
                auxiliar = String(arrTransaction[i][70]).substring(0, 250);
                auxiliar = auxiliar.replace(/\n/g,"");
                auxiliar = auxiliar.replace(/\r/g,"");
                auxiliar = auxiliar.replace(/\t/g,"");
                if (auxiliar.charAt(auxiliar.length - 1) == ' ') {
                  StrReporte += auxiliar.slice(0, -1) + '|' + salto;
                } else {
                  StrReporte += auxiliar + '|' + salto;
                }
                cont_0450++;
              } else {
                if (arrTransaction[i][57] != '') {
                  StrReporte += '|0450|';
                  //1.COD_INF
                  StrReporte += arrTransaction[i][0].substring(arrTransaction[i][0].length - 6, arrTransaction[i][0].length) + '|';
                  //2.TXT_COMPL
                  auxiliar = String(arrTransaction[i][57]).substring(0, 250);
                  auxiliar = auxiliar.replace(/\n/g,"");
                  auxiliar = auxiliar.replace(/\r/g,"");
                  auxiliar = auxiliar.replace(/\t/g,"");
                  if (auxiliar.charAt(auxiliar.length - 1) == ' ') {
                    StrReporte += auxiliar.slice(0, -1) + '|' + salto;
                  } else {
                    StrReporte += auxiliar + '|' + salto;
                  }
                  cont_0450++;
                }
              }

            }
          }
        }
        if (cont_0450 > 0) {
          arrAuxiliar = new Array();
          arrAuxiliar[0] = '0450';
          arrAuxiliar[1] = cont_0450;
          ArrBloque9.push(arrAuxiliar);
          contador_global += cont_0450;
        }
        //Bloque 0460
        for (k in R460) {
          if (!h_0460) {
            h_0460 = true;
          }
          StrReporte += "|0460|";
          StrReporte += R460[k].codigo + '|';
          StrReporte += R460[k].nombre + '|' + salto;
          cont_0460++;
        }
        if (cont_0460 > 0) {
          arrAuxiliar = new Array();
          arrAuxiliar[0] = '0460';
          arrAuxiliar[1] = cont_0460;
          ArrBloque9.push(arrAuxiliar);
          contador_global += cont_0460;
        }
        //bloque0500
        StrReporte += ArrBloqueG0[4][0];
        arrAuxiliar = new Array();
        arrAuxiliar[0] = '0500';
        arrAuxiliar[1] = Number(ArrBloqueG0[4][1]);
        ArrBloque9.push(arrAuxiliar);
        contador_global += Number(ArrBloqueG0[4][1]);

        //bloque 0600
        StrReporte += ArrBloqueG0[2][0];
        arrAuxiliar = new Array();
        arrAuxiliar[0] = '0600';
        arrAuxiliar[1] = Number(ArrBloqueG0[2][1]);
        ArrBloque9.push(arrAuxiliar);
        contador_global += Number(ArrBloqueG0[2][1]);
      }

      if (!h_0400) {
        for (k in R400) {
          h_0400 = true;
          StrReporte += '|0400|';
          StrReporte += R400[k].cod + '|';
          StrReporte += R400[k].Descrp + '|' + salto;
          cont_0400++;
        }
        if (h_0400) {
          arrAuxiliar = new Array();
          arrAuxiliar[0] = '0400';
          arrAuxiliar[1] = cont_0400;
          ArrBloque9.push(arrAuxiliar);
          contador_global += cont_0400;
        }
      }
      //0450
      if (!h_0450) {
        for (var i = 0; i < arrTransaction.length; i++) {
          if ((arrTransaction[i][2] == '01' || arrTransaction[i][2] == '1B' || arrTransaction[i][2] == '04' || arrTransaction[i][2] == '55') && arrTransaction[i][1] != 'ItemShip' && arrTransaction[i][1] != 'ItemRcpt' && c_0450 == 'T') {
            //log.error('mira el', arrTransaction[i][1] + '----' + arrTransaction[i][72]);
            if (arrTransaction[i][1] == 'VendCred' && arrTransaction[i][72] != 'Cancelada') {
              StrReporte += '|0450|';
              //1.COD_INF
              StrReporte += arrTransaction[i][0].substring(arrTransaction[i][0].length - 6, arrTransaction[i][0].length) + '|';
              //2.TXT_COMPL
              StrReporte += 'DANFE|' + salto;
              cont_0450++;
            } else {
              if (arrTransaction[i][1] == 'CustInvc' && arrTransaction[i][70] != '') {
                StrReporte += '|0450|';
                //1.COD_INF
                StrReporte += arrTransaction[i][0].substring(arrTransaction[i][0].length - 6, arrTransaction[i][0].length) + '|';
                //2.TXT_COMPL
                auxiliar = String(arrTransaction[i][70]).substring(0, 250);
                auxiliar = auxiliar.replace(/\n/g,"");
                auxiliar = auxiliar.replace(/\r/g,"");
                auxiliar = auxiliar.replace(/\t/g,"");
                if (auxiliar.charAt(auxiliar.length - 1) == ' ') {
                  StrReporte += auxiliar.slice(0, -1) + '|' + salto;
                } else {
                  StrReporte += auxiliar + '|' + salto;
                }
                cont_0450++;
              } else {
                if (arrTransaction[i][1] == 'VendBill' && arrTransaction[i][57] != '') {
                  StrReporte += '|0450|';
                  //1.COD_INF
                  StrReporte += arrTransaction[i][0].substring(arrTransaction[i][0].length - 6, arrTransaction[i][0].length) + '|';
                  //2.TXT_COMPL
                  auxiliar = String(arrTransaction[i][57]).substring(0, 250);
                  auxiliar = auxiliar.split("\n").join("");
                  auxiliar = auxiliar.split("\r").join("");
                  auxiliar = auxiliar.split("\t").join(""); 
                  if (auxiliar.charAt(auxiliar.length - 1) == ' ') {
                    StrReporte += auxiliar.slice(0, -1) + '|' + salto;
                  } else {
                    StrReporte += auxiliar + '|' + salto;
                  }
                  cont_0450++;
                }
              }
            }
          }
        }
        if (cont_0450 > 0) {
          arrAuxiliar = new Array();
          arrAuxiliar[0] = '0450';
          arrAuxiliar[1] = cont_0450;
          ArrBloque9.push(arrAuxiliar);
          contador_global += cont_0450;
        }
      }

      //Bloque 0460
      if (!h_0460) {
        for (k in R460) {
          StrReporte += "|0460|";
          StrReporte += R460[k].codigo + '|';
          StrReporte += R460[k].nombre + '|' + salto;
          cont_0460++;
        }
        if (cont_0460 > 0) {
          arrAuxiliar = new Array();
          arrAuxiliar[0] = '0460';
          arrAuxiliar[1] = cont_0460;
          ArrBloque9.push(arrAuxiliar);
          contador_global += cont_0460;
        }
      }
      //Registro 0990
      StrReporte += '|0990|';
      contador_global++;
      arrAuxiliar = new Array();
      arrAuxiliar[0] = '0990';
      arrAuxiliar[1] = 1;
      ArrBloque9.push(arrAuxiliar);

      StrReporte += contador_global + '|' + salto;
      //aqui se empezara a crear todos los bloquerigillos xD
      var bloqueB = GenerarBloqueB();
      StrReporte += bloqueB;
      //ya no invadas mi intimidad :'v
      contador_global = contador_global + 2;
      var bloqueC = GenerarBloqueC();
      //log.error('paso C');
      StrReporte += bloqueC;
      var BloqueD = GenerarBloqueD();
      //log.error('paso D');
      StrReporte += BloqueD;
      contador_global = contador_global + 2;
      var bloqueE = GenerarBloqueE();
      //log.error('paso E');
      StrReporte += bloqueE;
      contador_global = contador_global + 2;
      var bloqueG = GenerarBloqueG();
      //log.error('paso G');
      StrReporte += bloqueG;
      contador_global = contador_global + 2;
      var bloqueH = GenerarBloqueH();
      //log.error('paso H');
      StrReporte += bloqueH;
      contador_global = contador_global + 2;
      var bloqueK = GenerarBloqueK();
      //log.error('paso K');
      StrReporte += bloqueK;
      contador_global = contador_global + 2;
      var bloque1 = GenerarBloque1();
      //log.error('paso 1');
      StrReporte += bloque1;
      contador_global = contador_global + 3;
      var bloque9 = GenerarBLoque9(contador_global);
      //log.error('paso 9');
      StrReporte += bloque9;
    }

    //para que te relajes tu el que revisa esto xD
    //https://www.youtube.com/watch?v=q6DF5-UiPIM

    function GenerarBloque1() {
      var salto = '\r\n';
      var strBloque1 = '';
      var arrAuxiliar = new Array();

      var transacctions;

      strBloque1 += '|1001|0|' + salto;


      arrAuxiliar[0] = '1001';
      arrAuxiliar[1] = 1;
      ArrBloque9.push(arrAuxiliar);
      //Generar Bloque 1010

      strBloque1 += '|1010|N|N|N|N|N|N|' + r_1601 + '|N|N|N|N|N|N|' + salto;
      arrAuxiliar = new Array();
      arrAuxiliar[0] = '1010';
      arrAuxiliar[1] = 1;
      ArrBloque9.push(arrAuxiliar);
      //Generar Bloque 1601
      var BQ1601 = 0;
      if (r_1601 == 'S') {

        //bloque 1601
        var transacctions = arrTransaction.concat(arrTransactionS);

        for (var i = 0; i < transacctions.length; i++) {

          if (transacctions[i][1] == 'VendPymt' && (Number(transacctions[i][48]) != 0 || Number(transacctions[i][20]) != 0)) {
            //REG
            strBloque1 += '|1601|';
            //COD_PART_IP
            strBloque1 += transacctions[i][78] + '|';
            //COD_PART_IT
            strBloque1 += '' + '|';
            //TOT_VS
            strBloque1 += round(transacctions[i][20]) + '|';
            //TOT_ISS
            strBloque1 += round(transacctions[i][48]) + '|';
            //TOT_OUTROS
            var totOutros = Number(transacctions[i][7]) - (Number(transacctions[i][20]) + Number(transacctions[i][48]));
            strBloque1 += round(totOutros) + '|' + salto;
            BQ1601++;
          }
        }
        if (BQ1601 != 0) {
          arrAuxiliar = new Array();
          arrAuxiliar[0] = '1601';
          arrAuxiliar[1] = BQ1601;
          ArrBloque9.push(arrAuxiliar);
        }
      }


      //bloque 1990
      var QTD_LIN_1 = BQ1601 + 3;
      strBloque1 += '|1990|' + QTD_LIN_1 + '|' + salto;
      arrAuxiliar = new Array();
      arrAuxiliar[0] = '1990';
      arrAuxiliar[1] = 1;
      ArrBloque9.push(arrAuxiliar);

      strBloque1 = strBloque1.replace(/\./g, ',');

      return strBloque1;
    }
    //Vitacora de Ivan 22/10/2020
    //el tipo es para saber si el documento es regular, cancelado o complementario -- por el momento estara para rregular
    // 0 == regular ---
    // 1 == cancelado
    // 2 == complementario

    function Obtener_clave(id_transaction) {

      var clave = search.create({
        type: "customrecord_lmry_ei_docs_status",
        filters:
          [
            ["custrecord_lmry_ei_ds_doc", "anyof", id_transaction]
          ],
        columns:
          [
            search.createColumn({ name: "custrecord_lmry_ei_ds_doc_id", label: "Latam - EI Document Identifier" }),
            search.createColumn({ name: "custrecord_lmry_ei_ds_doc_status", label: "Latam - EI Document" })
          ]
      });
      retorno = clave.run().getRange(0, 1000);
      if (retorno.length != 0) {
        Clave = retorno[0].getValue('custrecord_lmry_ei_ds_doc_id');
        Clave = ValidaGuion(Clave);
        status = retorno[0].getValue('custrecord_lmry_ei_ds_doc_status');
        return status;
      }
      return '';
    }

    function Compararfechas(fecha1, fecha2, tipo) {
      if (tipo == 0) {
        if (fecha1 == '' || fecha2 == '') {
          return '00';
        } else {
          dia1 = fecha1.substring(0, 2);
          mes1 = Number(fecha1.substring(2, 4));
          anio1 = Number(fecha1.substring(4, 8));

          dia2 = fecha2.substring(0, 2);
          mes2 = Number(fecha2.substring(2, 4));
          anio2 = Number(fecha2.substring(4, 8));
          if (anio2 > anio1) {
            return '01';
          } else {
            if (mes2 > mes1) {
              return '01';
            } else {
              return '00';
            }
          }
        }
      } else if (tipo == 1) {
        if (fecha1 == '' || fecha2 == '') {
          return '02';
        } else {

        }
      }

    }

    function Generar0190() {
      var salto = '\r\n';
      str0190 = '';
      R190 = {};
      arr_valido_c = ["07", "08", "8B", "09", "10", "11", "26", "27", "57", "67", "63", "06", "66", "28", "29", "21", "22"];
      var resultado = new Array();
      for (var i = 0; i < ArrItem.length; i++) {
        var arrAuxiliar = new Array();
        tam = ArrItem[i].length;
        ID = ArrItem[i][3];
        if ((!R190[ID] && ID != '' && arr_valido.indexOf(ArrItem[i][9]) == -1 && ArrItem[i][56] == 'NO') || (!R190[ID] && ID != '' && arr_valido_c.indexOf(ArrItem[i][9]) == -1 && (ArrItem[i][7].substring(0, 1) == '1' || ArrItem[i][7].substring(0, 1) == '2' || ArrItem[i][7].substring(0, 1) == '3') && ArrItem[i][52] == 'NO')) {
          R190[ID] = {
            "nombre": ID,
            "unidad": ArrItem[i][8]
          };
        }
      }

      if (param_bloqueg == 'T') {
        for (var i = 0; i < ArrItemG.length; i++) {
          ID = ArrItemG[i][7];
          if (!R190[ID] && ID != '' && ArrSituaciones.indexOf(ArrItemG[i][8]) != -1) {
            R190[ID] = {
              "nombre": ID,
              "unidad": ArrItemG[i][3]
            };
          }
        }
      }

      for (var k in R190) {
        str0190 += '|0190|';
        str0190 += R190[k].nombre + '|';
        str0190 += R190[k].unidad + '|' + salto;
      }

      if (Object.keys(R190).length != 0) {
        return str0190 + '&' + Object.keys(R190).length;
      }
      return '&0';
    }

    function QuitarVacios(arreglo) {
      var arrAuxiliar = new Array();
      for (var i = 0; i < arreglo.length; i++) {
        if (arreglo[i] != '') {
          arrAuxiliar.push(arreglo[i]);
        }
      }
      return arrAuxiliar;
    }

    //esta funcion es exclusiva de items

    function QuitarVaciosMatriz(arreglo) {
      var arrAuxiliar = new Array();
      for (var i = 0; i < arreglo.length; i++) {
        if (arreglo[i][0] != '') {
          arrAuxiliar.push(arreglo[i]);
        }
      }
      return arrAuxiliar;
    }

    function QuitarRepetidos(arreglo) {

      var arrAuxiliar = new Array();
      var aux;
      var repetido = false;

      if (arreglo.length == 0) { return arreglo; }

      arreglo = QuitarVaciosMatriz(arreglo);

      arreglo.sort(sortFunction);

      function sortFunction(a, b) {
        if (a[0] === b[0]) {
          return 0;
        }
        else {
          return (a[0] < b[0]) ? -1 : 1;
        }
      }

      if (arreglo.length == 1) {
        return arreglo;
      } else {
        var pivote = arreglo[0];

        arrAuxiliar.push(pivote);

        for (var i = 1; i < arreglo.length; i++) {
          if (pivote[0] != arreglo[i][0]) {
            pivote = arreglo[i];
            arrAuxiliar.push(pivote);
          }
        }
        return arrAuxiliar;
      }

    }


    function ValidaGuion(s) {
      var AccChars = "+./-(), ";
      var RegChars = "";

      s = String(s);

      for (var c = 0; c < s.length; c++) {
        for (var special = 0; special < AccChars.length; special++) {
          if (s.charAt(c) == AccChars.charAt(special)) {
            s = s.substring(0, c) + RegChars.charAt(special) + s.substring(c + 1, s.length);
          }
        }
      }
      return s;

    }

    function validarAcentos(s) {
      var AccChars = "&°–—ªº·";
      var RegChars = "  --a .";

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

    function ValidaPorcentaje(s) {
      var AccChars = "%";
      var RegChars = "";

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
    function ObtenerDatosSubsidiaria() {
      var configpage = config.load({
        type: config.Type.COMPANY_INFORMATION
      });

      if (feature_Subsi) {
        companyname = ObtainNameSubsidiaria(param_Subsi);
        companyname = validarAcentos(companyname);
        companyruc = ObtainFederalIdSubsidiaria(param_Subsi);
      } else {
        companyruc = configpage.getValue('employerid');
        companyname = configpage.getValue('legalname');

      }

      companyruc = companyruc.replace(' ', '');
      companyruc = ValidaGuion(companyruc);

    }

    function ObtenerE116() {
      var savedsearch = search.create({
        type: "journalentry",
        filters:
          [
            ["type", "anyof", "Journal"],
            "AND",
            ["subsidiary", "anyof", param_Subsi],
            "AND",
            ["postingperiod", "abs", param_Periodo],
            "AND",
            ["mainline", "is", "T"],
            "AND",
            ["posting", "is", "T"],
            "AND",
            ["custcol_lmry_ar_item_tributo", "is", "T"],
            "AND",
            ["custcol_lmry_br_tax.name", "is", "ICMS"],
            "AND",
            ["custbody_lmry_type_concept.internalid", "anyof", "5"]
          ],
        settings: [
          search.createSetting({
            name: 'consolidationtype',
            value: 'NONE'
          })
        ],
        columns:
          [
            search.createColumn({
              name: "formulatext",
              summary: "GROUP",
              formula: "to_char({custbody_lmry_duedate},'ddmmyyyy')",
              label: " 1. Fecha de Vencimiento"
            }),
            search.createColumn({
              name: "formulanumeric",
              summary: "SUM",
              formula: "nvl({debitamount},0)",
              label: "Monto de pago para el E116"
            }),
            search.createColumn({
              name: "formulatext",
              summary: "GROUP",
              formula: "{custcol_lmry_br_receita.custrecord_lmry_br_code_revenue}",
              label: "Formula (Text)"
            })
          ]
      });

      if (feature_Subsi) {
        var subsidiaryFilter = search.createFilter({
          name: 'subsidiary',
          operator: search.Operator.ANYOF,
          values: [param_Subsi]
        });
        savedsearch.filters.push(subsidiaryFilter);
      }

      if (feature_Multi) {
        var multibook_Filter = search.createFilter({
          name: 'accountingbook',
          join: 'accountingtransaction',
          operator: search.Operator.IS,
          values: [param_Multi]
        });
        savedsearch.filters.push(multibook_Filter);

        //04 Exchange Rate / Multibook
        var exchangerate_Column = search.createColumn({
          name: "formulanumeric",
          summary: "SUM",
          formula: "nvl({accountingtransaction.debitamount},0) ",
          label: "Formula (Currency)"
        });

        savedsearch.columns.push(exchangerate_Column);
      }

      var searchResult = savedsearch.run().getRange(0, 1000);

      if (searchResult.length > 0) {
        var columns = searchResult[0].columns;
        if (searchResult[0].getValue(columns[0]) != '- None -' && searchResult[0].getValue(columns[0]) != null) {
          fech_vencimiento = searchResult[0].getValue(columns[0]);
        } else {
          fech_vencimiento = '';
        }
        if (feature_Multi) {
          monto = searchResult[0].getValue(columns[3]);
        } else {
          monto = searchResult[0].getValue(columns[1]);
        }
        cod_receita = searchResult[0].getValue(columns[2]);
        return fech_vencimiento + '|' + monto + '|' + cod_receita;
      } else {
        return '||';
      }

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
        libreria.sendMail(LMRY_script, ' [ ObtainNameSubsidiaria ] ' + err);
      }
      return '';
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
        libreria.sendMail(LMRY_script, ' [ ObtainFederalIdSubsidiaria ] ' + err);
      }
      return '';
    }


    function ValidateCountry(subsidiary) {
      try {
        if (subsidiary != '' && subsidiary != null) {
          var country_obj = search.lookupFields({
            type: search.Type.SUBSIDIARY,
            id: subsidiary,
            columns: ['country']
          });
          if (country_obj.country[0].value == 'AR') {
            return true;
          }
        }
      } catch (err) {
        libreria.sendMail(LMRY_script, ' [ ValidateCountry ] ' + err);
      }
      return false;
    }

    function completar_espacio(long, valor) {
      if ((('' + valor).length) <= long) {
        if (long != ('' + valor).length) {
          for (var i = ('' + valor.length); i < long; i++) {
            valor = valor + ' ';
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

    function completar_cero(long, valor) {
      if ((('' + valor).length) <= long) {
        if (long != ('' + valor).length) {
          for (var i = (('' + valor).length); i < long; i++) {
            valor = '0' + valor;
          }
        } else {
          return valor;
        }
        return valor;
      } else {
        valor = valor.substring(0, long);
        return valor;
      }
    }

    function Obtener_Codigo_version() {
      var codigo = search.lookupFields({
        type: 'customrecord_lmry_br_features',
        id: param_Feature,
        columns: ["custrecord_lmry_br_version"]
      });

      codigo = codigo.custrecord_lmry_br_version

      return codigo;
    }

    function BuscarLeadingVersion() {
      var arrResult = [];
      var arrLeadingVersions = '';




      var savedSearch = search.create({
        type: 'customrecord_lmry_br_rpt_feature_version',
        filters: [
          ["custrecord_lmry_br_year_to", "onorafter", periodStartDate],
          "AND",
          ["custrecord_lmry_br_year_from", "onorbefore", periodEndDate],
          "AND",
          ["custrecord_lmry_br_rpt_id_report", "is", param_Feature]
        ],
        columns: [
          search.createColumn({
            name: 'internalid'
          }),
          search.createColumn({
            name: "formulatext",
            formula: "{custrecord_lmry_br_rpt_version}",
            label: "Formula (Text)"
          }),
          search.createColumn({
            name: 'custrecord_lmry_br_year_from'
          }),
          search.createColumn({
            name: 'custrecord_lmry_br_year_to'
          }),
        ]
      });

      var pagedData = savedSearch.runPaged({
        pageSize: 1000
      });

      var page, columns;

      pagedData.pageRanges.forEach(function (pageRange) {
        page = pagedData.fetch({
          index: pageRange.index
        });

        page.data.forEach(function (result) {
          columns = result.columns;

          // 0. ID TRANSACCION
          var columna0 = result.getValue(columns[0]);

          // 1. ID TRANSACCION
          var columna1 = result.getValue(columns[1]);

          // 2. ID TRANSACCION
          var columna2 = result.getValue(columns[2]);

          // 3. ID TRANSACCION
          var columna3 = result.getValue(columns[3]);

          arrResult.push([columna0, columna1, columna2, columna3]);
        });
      });


      if (arrResult.length != 0) {
        arrLeadingVersions = arrResult[0][1];
      }

      return arrLeadingVersions;
    }

    function ObtenerMultiCalendars() {
      var subsidyName = search.lookupFields({
        type: search.Type.SUBSIDIARY,
        id: param_Subsi,
        columns: ['fiscalcalendar', 'taxfiscalcalendar']
      });
      //NO SE VALIDA EL CAMPO FISCAL/TAX CALENDAR PORQUE ES OBLIGATORIO EN LA SUBSIDIARIA
      calendarSubsi = {
        id: subsidyName.fiscalcalendar[0].value,
        nombre: subsidyName.fiscalcalendar[0].text
      }

      taxCalendarSubsi = {
        id: subsidyName.taxfiscalcalendar[0].value,
        nombre: subsidyName.taxfiscalcalendar[0].text
      }

      taxCalendarSubsi = JSON.stringify(taxCalendarSubsi);


    }

    function ObtenerConfigFeature(id_feature) {
      var activ_feature = false;
      var licenses = new Array();
      licenses = libFeature.getLicenses(param_Subsi);
      activ_feature = libFeature.getAuthorization(id_feature, licenses);

      return activ_feature;
    }

    function ObtenerDesvinculacion() {
      var calendarSubsi = '';
      var taxCalendarSubsi = '';

      featureSpecialPeriods = ObtenerConfigFeature(599);

      featureTaxCalendars = ObtenerConfigFeature(681);

      featureSpecialTaxPeriods = ObtenerConfigFeature(682);


      if (featureTaxCalendars || featureTaxCalendars == 'T') {

        if (featureSpecialTaxPeriods || featureSpecialTaxPeriods == 'T') {

          var SearchPeriodSpecial = search.create({
            type: "customrecord_lmry_tax_special_period",
            filters: [
              ["isinactive", "is", "F"], "AND",
              ["custrecord_lmry_tax_account_period", "anyof", param_Periodo]
            ],
            columns: [
              search.createColumn({
                name: "custrecord_lmry_taxdate_ini",
                label: "Date Ini"
              }),
              search.createColumn({
                name: "custrecord_lmry_taxdate_fin",
                label: "Date Fin"
              }),
              search.createColumn({
                name: "name",
                label: "Name"
              })
            ]
          });

          if (feature_MultiCalendar || feature_MultiCalendar == 'T') {
            var subsidyName = search.lookupFields({
              type: search.Type.SUBSIDIARY,
              id: param_Subsi,
              columns: ['taxfiscalcalendar']
            });

            taxCalendarSubsi = {
              id: subsidyName.taxfiscalcalendar[0].value,
              nombre: subsidyName.taxfiscalcalendar[0].text
            }

            taxCalendarSubsi = JSON.stringify(taxCalendarSubsi);

            var fiscalCalendarFilter = search.createFilter({
              name: 'custrecord_lmry_tax_calendar',
              operator: search.Operator.IS,
              values: taxCalendarSubsi
            });
            SearchPeriodSpecial.filters.push(fiscalCalendarFilter);
          }

          var searchResult = SearchPeriodSpecial.run().getRange(0, 100);

          if (searchResult.length != 0) {
            var columns = searchResult[0].columns;
            periodStartDate = searchResult[0].getValue(columns[0]);
            periodEndDate = searchResult[0].getValue(columns[1]);
            //periodname = searchResult[0].getValue(columns[2]);

          } else {
            //Este caso se debe validar en mismo suitelet.
            //log.debug('Alerta', 'No existe periodo en Special Tax Period.')
          }
          var period_temp = search.lookupFields({
            type: search.Type.TAX_PERIOD,
            id: param_Periodo,
            columns: ['periodname']
          });

          periodname = period_temp.periodname;
        } else {

          var period_temp = search.lookupFields({
            type: search.Type.TAX_PERIOD,
            id: param_Periodo,
            columns: ['startdate', 'enddate', 'periodname']
          });
          periodStartDate = period_temp.startdate;
          periodEndDate = period_temp.enddate;
          periodname = period_temp.periodname;

        }



      } else {

        if (featureSpecialPeriods || featureSpecialPeriods == 'T') {
          var SearchPeriodSpecial = search.create({
            type: "customrecord_lmry_special_accountperiod",
            filters: [
              ["isinactive", "is", "F"],
              "AND",
              ["custrecord_lmry_accounting_period", "anyof", param_Periodo]
            ],
            columns: [
              search.createColumn({
                name: "custrecord_lmry_date_ini",
                label: "Date Ini"
              }),
              search.createColumn({
                name: "custrecord_lmry_date_fin",
                label: "Date Fin"
              }),
              search.createColumn({
                name: "name",
                label: "Name"
              })
            ]
          });

          if (feature_MultiCalendar || feature_MultiCalendar == 'T') {
            var subsidyName = search.lookupFields({
              type: search.Type.SUBSIDIARY,
              id: param_Subsi,
              columns: ['fiscalcalendar']
            });

            calendarSubsi = {
              id: subsidyName.fiscalcalendar[0].value,
              nombre: subsidyName.fiscalcalendar[0].text
            }
            calendarSubsi = JSON.stringify(calendarSubsi);

            var fiscalCalendarFilter = search.createFilter({
              name: 'custrecord_lmry_calendar',
              operator: search.Operator.IS,
              values: calendarSubsi
            });
            SearchPeriodSpecial.filters.push(fiscalCalendarFilter);
          }

          var searchResult = SearchPeriodSpecial.run().getRange(0, 100);

          if (searchResult.length != 0) {
            var columns = searchResult[0].columns;
            periodStartDate = searchResult[0].getValue(columns[0]);
            periodEndDate = searchResult[0].getValue(columns[1]);
            //periodname = searchResult[0].getValue(columns[2]);

          } else {
            //Este caso se debe validar en mismo suitelet.
            //log.debug('Alerta', 'No existe periodo en Special Period.')
          }
          var period_temp = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: param_Periodo,
            columns: ['periodname']
          });

          periodname = period_temp.periodname;
        } else {
          var period_temp = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: param_Periodo,
            columns: ['startdate', 'enddate', 'periodname']
          });
          periodStartDate = period_temp.startdate;
          periodEndDate = period_temp.enddate;
          periodname = period_temp.periodname;

        }

      }

      //Nuevo Formato Fecha
      var parsedDateStringAsRawDateObject = format.parse({
        value: periodEndDate,
        type: format.Type.DATE
      });

      var MM = parsedDateStringAsRawDateObject.getMonth() + 1;
      var AAAA = parsedDateStringAsRawDateObject.getFullYear();
      var DD = parsedDateStringAsRawDateObject.getDate();


      periodenddate = DD + '/' + MM + '/' + AAAA;

      var auxiliar = periodenddate.split('/');

      if (auxiliar[0].length == 1) {
        auxiliar[0] = '0' + auxiliar[0];
      }
      if (auxiliar[1].length == 1) {
        auxiliar[1] = '0' + auxiliar[1];
      }
      periodenddate = auxiliar[0] + auxiliar[1] + auxiliar[2];
      periodfirstdate = '01' + auxiliar[1] + auxiliar[2];


    }

    function ObtenerParametrosYFeatures() {
      //ParÃ¡metros
      param_RecorID = objContext.getParameter({
        name: 'custscript_lmry_br_efd_fiscal_record'
      });

      param_Periodo = objContext.getParameter({
        name: 'custscript_lmry_br_efd_fiscal_periodo'
      });

      param_Subsi = objContext.getParameter({
        name: 'custscript_lmry_br_efd_fiscal_subsidiari'
      });

      param_Multi = objContext.getParameter({
        name: 'custscript_lmry_br_efd_fiscal_multibook'
      });

      param_Num_Recti = objContext.getParameter({
        name: 'custscript_lmry_br_efd_fiscal_num_rectif'
      });

      param_Feature = objContext.getParameter({
        name: 'custscript_lmry_br_efd_fiscal_feature'
      });

      param_Type_Decla = objContext.getParameter({
        name: 'custscript_lmry_br_efd_fiscal_tipo_decla'
      });

      param_bloqueD = objContext.getParameter({
        name: 'custscript_lmry_br_efd_fiscal_bloque_d'
      });

      param_bloquek = objContext.getParameter({
        name: 'custscript_lmry_br_efd_fiscal_bloque_k'
      });

      param_bloqueg = objContext.getParameter({
        name: 'custscript_lmry_br_efd_fiscal_bloque_g'
      });


      param_Mot_Inv = objContext.getParameter({
        name: 'custscript_lmry_br_efd_fiscal_motivo_inv'
      });

      param_archivo_ven = objContext.getParameter({
        name: 'custscript_lmry_br_efd_fiscal_archiv_ven'
      });

      param_archivo_ren = objContext.getParameter({
        name: 'custscript_lmry_br_efd_fiscal_archiv_ren'
      });

      log.debug('parametros', param_RecorID + '-' + param_Periodo + '-' + param_Subsi + '-' + param_Multi + '-' + param_Num_Recti + '-' + param_Feature + '-' + param_Type_Decla);

      //************FEATURES********************
      if (param_Num_Recti == null) {
        param_Num_Recti = '';
      }
      feature_Subsi = runtime.isFeatureInEffect({
        feature: "SUBSIDIARIES"
      });

      feature_Multi = runtime.isFeatureInEffect({
        feature: "MULTIBOOK"
      });

      feature_Calendars = runtime.isFeatureInEffect({
        feature: "MULTIPLECALENDARS"
      });


      //subsi_temp['address.custrecord_lmry_addr_city_id']
      //Period Name
      if (feature_Subsi) {
        //***DATOS DE SUBSIDIARIA***
        var subsi_temp = search.lookupFields({
          type: search.Type.SUBSIDIARY,
          id: param_Subsi,
          columns: ['legalname', 'taxidnum', 'custrecord_lmry_br_state_tax_sub', 'custrecord_lmry_br_economic_activity.custrecord_lmry_code_activity_type', 'custrecord_lmry_br_municipal_sub', 'custrecord_lmry_br_suframa', 'fax', 'custrecord_lmry_email_subsidiaria', 'custrecord_lmry_br_classification_type.custrecord_lmry_br_code_clasification']
        });
        var subsi_address = search.lookupFields({
          type: search.Type.SUBSIDIARY,
          id: param_Subsi,
          columns: ['address.custrecord_lmry_addr_prov_acronym', 'address.zip', 'address.address1', 'address.custrecord_lmry_addr_city', 'address.custrecord_lmry_addr_city_id', 'address.phone', 'address.custrecord_lmry_address_number', 'address.custrecord_lmry_addr_reference', 'address.address2']
        });
      } else {
        //***DATOS DE SUBSIDIARIA***
        var subsi_temp = search.lookupFields({
          type: search.Type.SUBSIDIARY,
          id: 1,
          columns: ['legalname', 'taxidnum', 'custrecord_lmry_br_state_tax_sub', 'custrecord_lmry_br_economic_activity.custrecord_lmry_code_activity_type', 'custrecord_lmry_br_municipal_sub', 'custrecord_lmry_br_suframa', 'fax', 'custrecord_lmry_email_subsidiaria', 'custrecord_lmry_br_classification_type.custrecord_lmry_br_code_clasification']
        });
        var subsi_address = search.lookupFields({
          type: search.Type.SUBSIDIARY,
          id: 1,
          columns: ['address.custrecord_lmry_addr_prov_acronym', 'address.zip', 'address.address1', 'address.custrecord_lmry_addr_city', 'address.custrecord_lmry_addr_city_id', 'address.phone', 'address.custrecord_lmry_address_number', 'address.custrecord_lmry_addr_reference', 'address.address2']
        });
      }

      subsiname = subsi_temp.legalname;
      cnpj = subsi_temp.taxidnum;
      cnpj = ValidaGuion(cnpj);
      provincia = subsi_address['address.custrecord_lmry_addr_prov_acronym'];
      codigo_industrial = subsi_temp["custrecord_lmry_br_classification_type.custrecord_lmry_br_code_clasification"];
      estado_entidad = subsi_temp.custrecord_lmry_br_state_tax_sub;
      estado_entidad = ValidaGuion(estado_entidad);
      actividad_economica = subsi_temp['custrecord_lmry_br_economic_activity.custrecord_lmry_code_activity_type'];
      if (subsi_address['address.zip'] != undefined) {
        codigo_postal = subsi_address['address.zip'];
        codigo_postal = ValidaGuion(codigo_postal);
      }

      if (subsi_address['address.address1'] != undefined) {
        direccion = subsi_address['address.address1'];
      }

      if (subsi_address['address.custrecord_lmry_addr_city_id'] != undefined) {
        municipal = subsi_address['address.custrecord_lmry_addr_city_id'];
      }
      //----
      if (subsi_address['address.custrecord_lmry_address_number'] != undefined) {
        num_subsi = subsi_address['address.custrecord_lmry_address_number'];
      }
      if (subsi_address['address.custrecord_lmry_addr_reference'] != undefined) {
        complemento = subsi_address['address.custrecord_lmry_addr_reference'];
      }
      if (subsi_address['address.address2'] != undefined) {
        barrio = subsi_address['address.address2'];
      }
      //desde aqui
      muni_inscripcion = subsi_temp.custrecord_lmry_br_municipal_sub;
      suframa = subsi_temp.custrecord_lmry_br_suframa;
      fax_subsi = subsi_temp.fax;
      email_subsi = subsi_temp.custrecord_lmry_email_subsidiaria;
      if (subsi_address['address.phone'] != undefined) {
        telefono_subsi = subsi_address['address.phone'];
      }

      //AQUI SE OBTIENE LA VERSION
      version_efd = Obtener_Codigo_version();

      if (feature_Multi) {
        //Multibook Name
        var multibookName_temp = search.lookupFields({
          type: search.Type.ACCOUNTING_BOOK,
          id: param_Multi,
          columns: ['name']
        });

        multibookName = multibookName_temp.name;
      }

    }

    return {
      execute: execute
    };

  });