/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for Inventory Balance Library                  ||
||                                                              ||
||  File Name: LMRY_BR_EstatalReportGenerator_CLNT_V2.0.js      ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Aug 16 2018  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/currentRecord', 'N/search', "N/log", "N/url", 'N/https', 'N/format', "SuiteBundles/Bundle 37714/Latam_Library/LMRY_libSendingEmailsLBRY_V2.0.js"],

  function (runtime, currentRecord, search, log, url, https, formato, Libreria_Features) {

    var LMRY_script = "LatamReady - BR Estatal Report Generator CLNT";
    var objContext = runtime.getCurrentScript();
    var estado_situacion;
    var language = runtime.getCurrentScript().getParameter("LANGUAGE").substring(0, 2);
    var featMultipleCalendars = false;
    var calendarSubsi = null;
    var taxCalendarSubsi = null;

    function pageInit(scriptContext) {

      var varRecordRpt = scriptContext.currentRecord.getValue({
        fieldId: 'custpage_lmry_reporte'
      });

      if (varRecordRpt == 0) {
        ocultaCampos(scriptContext);
      }
    }

    function _GetResult(field, strdata) {
      //try {
      var intpos = strdata.indexOf('=');
      var straux = strdata.substr(0, parseInt(intpos));
      var strcad = '';
      if (field == straux) {
        // Extrae la cadena desde (:) para adelante
        straux = strdata.substr(parseInt(intpos) + 1);
        // Valida que el campo no de null
        if (straux == 'null') {
          return '';
        }
        // Barre el resto de la cadena
        for (var pos = 0; pos < straux.length; pos++) {
          if (straux[pos] != '"') {
            strcad += straux[pos];
          }
        }
        return strcad;
      }
      /*} catch(err) {
          sendMail(' [ _GetResult ] ' + err, LMRY_script);
      }*/
      return '';
    }

    function saveRecord(scriptContext) {
      try {
        /*DATOS PARA DESVINCULACION DE PERIODO*/
        featMultipleCalendars = runtime.isFeatureInEffect({
          feature: 'MULTIPLECALENDARS'
        });
        var paramSubsidiary = scriptContext.currentRecord.getValue({
          fieldId: 'custpage_subsidiary'
        });
        obtenerDatosSubsidiaria(paramSubsidiary);

        var featTaxCalendar = ObtenerConfigFeature(paramSubsidiary, 681);
        var featSpecialPeriod = ObtenerConfigFeature(paramSubsidiary, 599);
        var featSpecialTaxPeriod = ObtenerConfigFeature(paramSubsidiary, 682);

        // Valida si tiene la licencia activa
        var reporteid = scriptContext.currentRecord.getValue({
          fieldId: 'custpage_lmry_reporte'
        });

        if (reporteid == 0 || reporteid == null) {
          if (language == 'es') {
            alert('Debe seleccionar el reporte a generar.');
          } else if (language == 'pt') {
            alert('Você deve selecionar o relatório a ser gerado.');
          } else {
            alert('You must select the report to generate.');
          }
          return false;
        }

        var filter_deploy = '';

        var id_report_feat = search.lookupFields({
          type: 'customrecord_lmry_br_features',
          id: reporteid,
          columns: ['custrecord_lmry_br_id_schedule', 'custrecord_lmry_br_id_deploy']
        });

        filter_deploy = id_report_feat.custrecord_lmry_br_id_deploy;


        var URL = 'https://' + window.location.host +
          url.resolveScript({
            scriptId: 'customscript_lmry_br_validatestatus_stlt',
            deploymentId: 'customdeploy_lmry_br_validatestatus_stlt',
            returnExternalUrl: false
          });

        URL += '&schdl=' + filter_deploy;
        //alert(url);

        var request = https.get({
          url: URL
        });

        var rpta = JSON.parse(request.body);
        //alert(rpta.value);
        var status = rpta.value;
        // var result = JSON.parse(request.getBody());
        // alert(result.value);

        if (!status) {
          if (language == 'es') {
            alert('El Reporte se esta procesando.');
          } else if (language == 'pt') {
            alert('O relatório está sendo processado.');
          } else {
            alert('The Report is being processed.');
          }
          return false;
        }

        //=================Validaciones GNRE=================
        var codigo_estado = scriptContext.currentRecord.getValue({
          fieldId: 'custpage_lmry_estado'
        });

        var codigo_receta = scriptContext.currentRecord.getValue({
          fieldId: 'custpage_lmry_receita'
        });

        var fecha_refer = scriptContext.currentRecord.getValue({
          fieldId: 'custpage_lmry_date_refer'
        });

        var period_refer = scriptContext.currentRecord.getValue({
          fieldId: 'custpage_lmry_periognre_refer'
        });

        if (language == 'es') {
          var AlertCampEsta = 'Debe seleccionar el campo Estado de Destino.';
          var AlertCodRece = 'Debe seleccionar el campo Codigo de Receita.';
          var AlertFecRef = 'Debe Completar el campo Fecha de referencia.';
          var AlertPerRef = 'Debe Seleccionar el campo Periodo de referencia.';
        } else if (language == 'pt') {
          var AlertCampEsta = 'Você deve selecionar o campo Estado de destino.';
          var AlertCodRece = 'Você deve selecionar o campo Código da receita.';
          var AlertFecRef = 'Você deve preencher o campo Data de referência.';
          var AlertPerRef = 'Você deve selecionar o campo Período de referência.';
        } else {
          var AlertCampEsta = 'You must select the Destination State field.';
          var AlertCodRece = 'You must select the Recipe Code field.';
          var AlertFecRef = 'You must Complete the Reference date field.';
          var AlertPerRef = 'You must Select the Reference period field.';
        }

        if (reporteid == 11) {
          if (codigo_estado == 0 || codigo_estado == null) {
            alert(AlertCampEsta);
            return false;
          }

          if (codigo_receta == 0 || codigo_receta == null) {
            alert(AlertCodRece);
            return false;
          }

          if (codigo_receta == '1396' || (codigo_receta == '1397' && (codigo_estado == '42' || codigo_estado == '23'))) {
            if (fecha_refer == 0 || fecha_refer == null) {
              alert(AlertFecRef);
              return false;
            }
          } else {
            if (codigo_receta == '1397') {
              if (period_refer == 0 || period_refer == null) {
                alert(AlertPerRef);
                return false;
              }
            }
          }
        }
        //=================Validaciones NFCe Sefaz=================
        var modeloNF = scriptContext.currentRecord.getValue({
          fieldId: 'custpage_lmry_nfce'
        });

        if (reporteid == 20) {
          if (modeloNF == 0 || modeloNF == null) {
            if (language == 'es') {
              alert('Debe seleccionar el campo Modelo de Nota Fiscal.');
            } else if (language == 'pt') {
              alert('Você deve selecionar o campo Modelo de nota fiscal.');
            } else {
              alert('You must select the Fiscal Note Model field.');
            }
            return false;
          }

        }
        //===================================================

        if (reporteid == 5) {

          if (language == 'es') {
            var repPro = 'El Reporte se esta procesando.';
          } else if (language == 'pt') {
            var repPro = 'O relatório está sendo processado.';
          } else {
            var repPro = 'The Report is being processed.';
          }

          if (!validarStatus('customdeploy_lmry_br_r2010_reinf_schdl')) {
            alert(repPro);
            return false;
          }
          if (!validarStatus('customdeploy_lmry_br_reinf_bll_updt_mprd')) {
            alert(repPro);
            return false;
          }
          if (!validarStatus('customdeploy_lmry_br_r2020_reinf_schdl')) {
            alert(repPro);
            return false;
          }
          if (!validarStatus('customdeploy_lmry_br_reinf_inv_updt_mprd')) {
            alert(repPro);
            return false;
          }
          if (!validarStatus('customdeploy_lmry_br_r2099_reinf_schdl')) {
            alert(repPro);
            return false;
          }
        }
        /*
        VALIDACION PARA DESVINCULACION DE PERIODOS (PARA ACCOUNTING/TAX PERIOD)
        Todos los reportes que usen desvinculación se deberian validar aqui.
        */

        var periodoContable = scriptContext.currentRecord.getValue({
          fieldId: 'custpage_custom_period'
        });

        if (reporteid == 13 || reporteid == 9 || reporteid == 18 || reporteid == 19) {
          if (periodoContable == '') {
            if (language == 'es') {
              alert('Seleccionar el periodo contable');
            } else if (language == 'pt') {
              alert('Seleccionar o período de contabilidade');
            } else {
              alert('Select the accounting period');
            }
            return false;
          }
        }

        if (featTaxCalendar || featTaxCalendar == 'T') {
          if (featSpecialTaxPeriod || featSpecialTaxPeriod == 'T') {
            if (reporteid == 13 || reporteid == 9 || reporteid == 18) {

              console.log('tax periodoContable', periodoContable);
              var periodSpecialIni = validarSpecialTaxPeriod(periodoContable);
              console.log('periodSpecialIni', periodSpecialIni);
              if (periodSpecialIni.length == 0) {
                if (language == 'es') {
                  alert('El Periodo Contable no esta configurado en el Special Tax Period');
                } else if (language == 'pt') {
                  alert('O período contabil não é configurado no Período Especial de Imposto');
                } else {
                  alert('The Tax Period is not configured in the Special Tax Period');
                }
                return false;
              }
            }

          }
        } else {
          if (featSpecialPeriod || featSpecialPeriod == 'T') {

            if (reporteid == 13 || reporteid == 9 || reporteid == 18) {

              var periodSpecialIni = validarSpecialPeriod(periodoContable);
              console.log('periodSpecialIni', periodSpecialIni);
              if (periodSpecialIni.length == 0) {
                if (language == 'es') {
                  alert('El Periodo Contable no esta configurado en el Special Accounting Period');
                } else if (language == 'pt') {
                  alert('O período contabil não é configurado no Período de Contabilidade Especial');
                } else {
                  alert('The Accounting Period is not configured in the Special Accounting Period');
                }
                return false;
              }
            }

          }

        }

        /* ************************************************************
         * Verifica si esta activo la funcionalidad
         *  MULTI-BOOK ACCOUNTING - ID multibook
         * ***********************************************************/

        //Features -- Se comentara la  parte de multibook
        var feamultibook = runtime.isFeatureInEffect({
          feature: "MULTIBOOK"
        });

        if (feamultibook == true || feamultibook == 'T') {
          var paramMulti = scriptContext.currentRecord.getValue({
            fieldId: 'custpage_multibook'
          });

          if (paramMulti == 0 || paramMulti == null) {
            if (language == 'es') {
              alert('Debe seleccionar el campo Multi Book.');
            } else if (language == 'pt') {
              alert('Você deve selecionar o campo Multi Book.');
            } else {
              alert('You must select the Multi Book field.');
            }
            return false;
          }
        }
        /* ************************************************************
         * Verifica si esta activo la funcionalidad
         *  SUBSIDIARY - ID Subsidiary
         * ***********************************************************/
        var varFlagSubsi = runtime.isFeatureInEffect({
          feature: "SUBSIDIARIES"
        });

        if (varFlagSubsi == true || varFlagSubsi == 'T') {
          var paramSubsi = scriptContext.currentRecord.getValue({
            fieldId: 'custpage_subsidiary'
          });

          if (paramSubsi == 0 || paramSubsi == null) {
            if (language == 'es') {
              alert('Debe seleccionar el campo Subsidiaria.');
            } else if (language == 'pt') {
              alert('Você deve selecionar o campo Subsidiária.');
            } else {
              alert('You must select the Subsidiary field.');
            }
            return false;
          }
        }

        // Mesaje al usuario
        if (language == 'es') {
          alert('Se generara un archivo y se enviara un mail con la confirmacion del proceso.\n\nEste proceso puede durar varios minutos.\n\nPor favor actualizar el log para su descarga.');
        } else if (language == 'pt') {
          alert('Um arquivo será gerado e um email será enviado com a confirmação do processo.\n\nEste processo pode demorar vários minutos.\n\nPor favor, atualize o log para download.');
        } else {
          alert('A file will be generated and an email will be sent with the confirmation of the process.\n\nThis process can take several minutes.\n\nPlease update the log for download.');
        }
        return true;

      } catch (err) {
        alert(err + "");
        //sendMail(LMRY_script , ' [ clientSaveRecord ] ' + err );
        return false;
      }
    }

    function obtenerDatosSubsidiaria(subsidiaryId) {
      if (featMultipleCalendars || featMultipleCalendars == 'T') {
        var subsidiary = search.lookupFields({
          type: search.Type.SUBSIDIARY,
          id: subsidiaryId,
          columns: ['fiscalcalendar', 'taxfiscalcalendar']
        });

        calendarSubsi = {
          id: subsidiary.fiscalcalendar[0].value,
          nombre: subsidiary.fiscalcalendar[0].text
        }
        calendarSubsi = JSON.stringify(calendarSubsi);
        console.log('calendarSubsi', calendarSubsi);

        taxCalendarSubsi = {
          id: subsidiary.taxfiscalcalendar[0].value,
          nombre: subsidiary.taxfiscalcalendar[0].text
        }
        taxCalendarSubsi = JSON.stringify(taxCalendarSubsi);
        console.log('taxCalendarSubsi', taxCalendarSubsi);
      }

    }

    function validarSpecialPeriod(paramPeriod) {
      var periodSpecial = new Array();

      var searchSpecialPeriod = search.create({
        type: "customrecord_lmry_special_accountperiod",
        filters: [
          ["isinactive", "is", "F"], 'AND',
          ["custrecord_lmry_accounting_period", "is", paramPeriod]
        ],
        columns: [
          search.createColumn({
            name: "custrecord_lmry_calendar",
            label: "0. Latam - Calendar"
          }),
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

      if (featMultipleCalendars || featMultipleCalendars == 'T') {
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

      pagedData.pageRanges.forEach(function (pageRange) {
        page = pagedData.fetch({
          index: pageRange.index
        });

        page.data.forEach(function (result) {
          columns = result.columns;
          var calendar = result.getValue(columns[0]);
          var periodName = result.getValue(columns[3]);
          var startDate = result.getValue(columns[1]);

          var temporal = [periodName, startDate];
          periodSpecial = temporal;
        });

      });

      return periodSpecial;
    }

    function validarSpecialTaxPeriod(paramPeriod) {
      var periodSpecial = new Array();

      var searchSpecialPeriod = search.create({
        type: "customrecord_lmry_tax_special_period",
        filters: [
          ["isinactive", "is", "F"], 'AND',
          ["custrecord_lmry_tax_account_period", "is", paramPeriod]
        ],
        columns: [
          search.createColumn({
            name: "custrecord_lmry_taxdate_ini",
            label: "0. Latam - Date Start",
          }),
          search.createColumn({
            name: "name",
            label: "1. Latam - Period Name",
          })
        ]
      });

      if (featMultipleCalendars || featMultipleCalendars == 'T') {
        console.log('taxCalendarSubsi', taxCalendarSubsi);
        var taxFiscalCalendarFilter = search.createFilter({
          name: 'custrecord_lmry_tax_calendar',
          operator: search.Operator.IS,
          values: taxCalendarSubsi
        });
        searchSpecialPeriod.filters.push(taxFiscalCalendarFilter);
      }

      var pagedData = searchSpecialPeriod.runPaged({
        pageSize: 1000
      });

      pagedData.pageRanges.forEach(function (pageRange) {
        page = pagedData.fetch({
          index: pageRange.index
        });

        page.data.forEach(function (result) {
          columns = result.columns;
          var startDate = result.getValue(columns[0]);
          var periodName = result.getValue(columns[1]);
          periodSpecial = [periodName, startDate];
        });

      });

      return periodSpecial;
    }

    function validateField(scriptContext) {
      var rec = scriptContext.currentRecord;
      var estado_situacion = false;

      var fieldName = scriptContext.fieldId;

      var IdReport = scriptContext.currentRecord.getValue({
        fieldId: 'custpage_lmry_reporte'
      });

      var IdReceita = scriptContext.currentRecord.getValue({
        fieldId: 'custpage_lmry_receita'
      });

      var codigo_estado = scriptContext.currentRecord.getValue({
        fieldId: 'custpage_lmry_estado'
      });

      if (fieldName == 'custpage_lmry_reporte') {
        ocultaCampos(scriptContext);

        if (IdReport == '' || IdReport == null) {
          return true;
        }

        if (IdReport == 13) {
          scriptContext.currentRecord.getField({
            fieldId: 'custpage_gia_type'
          }).isDisplay = true;

          scriptContext.currentRecord.getField({
            fieldId: 'custpage_transmitted'
          }).isDisplay = true;
        } else {
          scriptContext.currentRecord.getField({
            fieldId: 'custpage_gia_type'
          }).isDisplay = false;

          scriptContext.currentRecord.getField({
            fieldId: 'custpage_transmitted'
          }).isDisplay = false;
        }

        if (IdReport == 1 || IdReport == 3) {
          /*  //Parametro Periodicidad
            scriptContext.currentRecord.getField({
              fieldId: 'custpage_lmry_periodicidad'
            }).isDisplay = true;*/
          //Parametro Tipo de Declaración
          scriptContext.currentRecord.getField({
            fieldId: 'custpage_lmry_tipo_decla'
          }).isDisplay = true;

        }
        if (IdReport == 2 || IdReport == 5 || IdReport == 9 || IdReport == 4) {
          //Parametro Tipo de Declaración
          scriptContext.currentRecord.getField({
            fieldId: 'custpage_lmry_tipo_decla'
          }).isDisplay = true;


        }

        if (IdReport == 9) {
          scriptContext.currentRecord.getField({
            fieldId: 'custpage_bloque_h'
          }).isDisplay = true;
          scriptContext.currentRecord.getField({
            fieldId: 'custpage_bloque_g'
          }).isDisplay = true;


        }

        //eliminamos  (IdReport == 5)
        if (IdReport == 1 || IdReport == 6 || IdReport == 11 || IdReport == 7 || IdReport == 8) {
          scriptContext.currentRecord.getField({
            fieldId: 'custpage_insert_xcl'
          }).isDisplay = true;
        }

        //=====Activacion de Filtro de GNRE=====
        if (IdReport == 11) {

          scriptContext.currentRecord.getField({
            fieldId: 'custpage_lmry_estado'
          }).isDisplay = true;

          scriptContext.currentRecord.getField({
            fieldId: 'custpage_lmry_receita'
          }).isDisplay = true;

          scriptContext.currentRecord.getField({
            fieldId: 'custpage_lmry_date_venci'
          }).isDisplay = true;

          scriptContext.currentRecord.getField({
            fieldId: 'custpage_lmry_date_pago'
          }).isDisplay = true;

        }
        //======================================

        //=====Activacion de Filtro de DIMOB=====
        if (IdReport == 14) {
          scriptContext.currentRecord.getField({
            fieldId: 'custpage_lmry_tipo_decla'
          }).isDisplay = true;

          scriptContext.currentRecord.getField({
            fieldId: 'custpage_anio'
          }).isDisplay = true;
        }

        //=====Activacion de Filtro Sintegra=====
        if (IdReport == 18) {
          scriptContext.currentRecord.getField({
            fieldId: 'custpage_sintegra_type'
          }).isDisplay = true;
        }

        //=====Activacion de Filtro NFCE (21,22,06)=====
        if (IdReport == 20) {
          scriptContext.currentRecord.getField({
            fieldId: 'custpage_lmry_nfce'
          }).isDisplay = true;
        }

        // Variables
        // Filtros
        var transacdataSearch = search.create({
          type: 'customrecord_lmry_br_filter_report',
          columns: [{
            name: 'custrecord_lmry_br_filter_id'
          }],
          filters: [
            ['custrecord_lmry_br_filter_features', 'anyof', IdReport], 'AND', ['isinactive', 'is', 'F']
          ]
        })

        var objResult = transacdataSearch.run().getRange({
          start: 0,
          end: 10
        });

        if (objResult != null && objResult != '') {
          for (var i = 0; i < objResult.length; i++) {
            var idField = objResult[i].getValue('custrecord_lmry_br_filter_id');
            // Obteniendo datos de etiqueta y campo de ingreso
            if (idField != null && idField != '') {
              scriptContext.currentRecord.getField({
                fieldId: idField
              }).isDisplay = true;
            }
          }
        }
        //DES Y GIA
        if (IdReport == 19 || IdReport == 13 || IdReport == 9 || IdReport == 18) {
          scriptContext.currentRecord.getField({
            fieldId: 'custpage_custom_period'
          }).isDisplay = true;
        }

        //Solo para Reporte

        return true;
      }

      if (fieldName == 'custpage_bloque_h') {
        if (scriptContext.currentRecord.getValue({
          fieldId: 'custpage_bloque_h'
        }) == true) {
          scriptContext.currentRecord.getField({
            fieldId: 'custpage_list_mov_inv'
          }).isDisplay = true;
        } else {
          scriptContext.currentRecord.getField({
            fieldId: 'custpage_list_mov_inv'
          }).isDisplay = false;
        }
      }

      if (fieldName == 'custpage_lmry_tipo_decla') {

        if (scriptContext.currentRecord.getValue({
          fieldId: 'custpage_lmry_tipo_decla'
        }) == 1) {
          //Parametro Nro Rectificación
          scriptContext.currentRecord.getField({
            fieldId: 'custpage_lmry_nro_recti'
          }).isDisplay = true;
        } else {
          //Parametro Nro Rectificación
          scriptContext.currentRecord.getField({
            fieldId: 'custpage_lmry_nro_recti'
          }).isDisplay = false;
        }

        return true;
      }

      //EN CASO SE SELECCIONE LA RECEITA SE ACTIVARA EL CAMPO DE REFERNCIA PARA GNRE CORRESPONDIENTE
      if (fieldName == 'custpage_lmry_receita') {
        if (IdReceita == '' || IdReceita == null) {
          return true;
        }

        var mesVenci = 0;
        var objRecord = scriptContext.currentRecord;

        var newDate = new Date();
        var diaVenci = Number(15);
        var mesPago = Number(newDate.getMonth() + 1);
        var anioVenci = Number(newDate.getFullYear());

        if (mesPago < 12 && mesPago > 0) {
          mesVenci = Number(mesPago + 1);
        } else {
          mesVenci = 0;
          anioVenci = Number(anioVenci + 1);
        }


        if (IdReceita == '1396' || (IdReceita == '1397' && (codigo_estado == '42' || codigo_estado == '23'))) {
          scriptContext.currentRecord.getField({
            fieldId: 'custpage_lmry_date_refer'
          }).isDisplay = true;

          scriptContext.currentRecord.getField({
            fieldId: 'custpage_lmry_periognre_refer'
          }).isDisplay = false;

          //Agregar los campos de fecha
          objRecord.setValue({
            fieldId: 'custpage_lmry_date_refer',
            value: newDate
          });

          objRecord.setValue({
            fieldId: 'custpage_lmry_date_pago',
            value: newDate
          });

          objRecord.setValue({
            fieldId: 'custpage_lmry_date_venci',
            value: newDate
          });

          objRecord.getField('custpage_lmry_date_pago').isDisabled = true;
          objRecord.getField('custpage_lmry_date_venci').isDisabled = true;

        } else {

          if (IdReceita == '1397') {
            scriptContext.currentRecord.getField({
              fieldId: 'custpage_lmry_periognre_refer'
            }).isDisplay = true;

            scriptContext.currentRecord.getField({
              fieldId: 'custpage_lmry_date_refer'
            }).isDisplay = false;

            objRecord.setValue({
              fieldId: 'custpage_lmry_date_pago',
              value: newDate
            });
            var cadena_date = anioVenci + "-" + mesVenci + "-" + diaVenci;
            var date_obj = new Date(cadena_date);

            objRecord.setValue({
              fieldId: 'custpage_lmry_date_venci',
              value: date_obj
            });
            objRecord.getField('custpage_lmry_date_pago').isDisabled = false;
            objRecord.getField('custpage_lmry_date_venci').isDisabled = true;
          }
        }
      }

      if (fieldName == 'custpage_subsidiary') {

        var feamultibook = runtime.isFeatureInEffect({
          feature: "MULTIBOOK"
        });
        if (feamultibook == true || feamultibook == 'T') {

          //MULTIBOOK DE ACUERDO A SUBSIDIARIA

          var subsidiary = scriptContext.currentRecord.getValue({
            fieldId: 'custpage_subsidiary'
          });
          var featSubsi = runtime.isFeatureInEffect({
            feature: "SUBSIDIARIES"
          });
          var featForeignCurrency = runtime.isFeatureInEffect({
            feature: "FOREIGNCURRENCYMANAGEMENT"
          });

          if (featSubsi) {

            var search_currency = search.create({
              type: "customrecord_lmry_currency_by_country",
              filters: [
                ["custrecord_lmry_currency_country_local", "anyof", "30"], "AND",
                ["custrecord_lmry_is_country_base_currency", "is", "T"]
              ],
              columns: [
                "custrecord_lmry_currency"
              ]
            });

            var results_cur = search_currency.run().getRange(0, 10);
            var currency_per = results_cur[0].getValue('custrecord_lmry_currency');

            var select = scriptContext.currentRecord.getField({
              fieldId: 'custpage_multibook'
            });
            select.removeSelectOption({
              value: null
            });
            select.insertSelectOption({
              value: 0,
              text: ' '
            });

            if (featForeignCurrency) {

              //alert(currency_per);
              var search_acc = search.create({
                type: "accountingbook",
                filters: [
                  ["currency", "anyof", currency_per], "AND",
                  ["status", "anyof", "ACTIVE"], "AND",
                  ["subsidiary", "anyof", subsidiary]
                ],
                columns: ["internalid", "name"]
              });

              var results_acc = search_acc.run().getRange(0, 1000);

              for (var i = 0; i < results_acc.length; i++) {
                var subID = results_acc[i].getValue('internalid');
                var subNM = results_acc[i].getValue('name');
                select.insertSelectOption({
                  value: subID,
                  text: subNM
                });
              }
            } else {
              var subsidiaryRecord = search.lookupFields({
                type: search.Type.SUBSIDIARY,
                id: subsidiary,
                columns: ['currency']
              });
              var currency_sub = subsidiaryRecord.currency[0].value;

              if (currency_per == currency_sub) {
                var search_acc = search.create({
                  type: "accountingbook",
                  filters: [
                    ["status", "anyof", "ACTIVE"], "AND",
                    ["subsidiary", "anyof", subsidiary]
                  ],
                  columns: ["internalid", "name"]
                });

                var results_acc = search_acc.run().getRange(0, 1000);

                for (var i = 0; i < results_acc.length; i++) {
                  var subID = results_acc[i].getValue('internalid');
                  var subNM = results_acc[i].getValue('name');
                  select.insertSelectOption({
                    value: subID,
                    text: subNM
                  });
                }
              } else {
                //no se coloca ningun libro
              }
            }
          }
        }

        var obj_periodo = scriptContext.currentRecord.getField({
          fieldId: 'custpage_anio'
        });

        var paramSubsi = scriptContext.currentRecord.getValue({
          fieldId: 'custpage_subsidiary'
        });

        var varFlagSubsi = runtime.isFeatureInEffect({
          feature: "SUBSIDIARIES"
        });

        var varFiscalCalendar = runtime.isFeatureInEffect({
          feature: 'MULTIPLECALENDARS'
        });

        //PERIODO DIMOB
        if (IdReport == 14) {
          if (varFiscalCalendar == true) {
            //validacion de fiscal calendar --- si alguna ves se cae No tuve Eleccion.jpg
            var varSubsidiary = search.lookupFields({
              type: search.Type.SUBSIDIARY,
              id: paramSubsi,
              columns: ['fiscalcalendar']
            });
            filtro_calendar = varSubsidiary.fiscalcalendar[0].value;

            var filtro_fiscal_calendar = search.createFilter({
              name: 'fiscalcalendar',
              operator: search.Operator.IS,
              values: filtro_calendar
            });
          }

          var filtro_fecha = '31/12/2017';
          var fecha = new Date(2017, 11, 31);
          //var parseado= FORMAT.parse({value:filtro_fecha, type: FORMAT.Type.DATE});
          console.log('antes de dar formato a la fecha');
          var original = formato.format({
            value: fecha,
            type: formato.Type.DATE
          });

          console.log('valor de original', original);
          obj_periodo.removeSelectOption({
            value: null
          });

          console.log('paso de eliminar periodo');
          console.log('valor de la subsidiaria', paramSubsi);
          var busqueda_periodos = search.create({
            type: "accountingperiod",
            filters: [
              ["isadjust", "is", "F"],
              "AND",
              ["isquarter", "is", "F"],
              "AND",
              ["isinactive", "is", "F"],
              "AND",
              ["isyear", "is", "T"],
              "AND",
              ["startdate", "after", original],
            ],
            columns: [
              search.createColumn({
                name: "internalid",
                label: "Internal ID"
              }),
              search.createColumn({
                name: "periodname",
                label: "Name"
              }),
              search.createColumn({
                name: "formulatext",
                formula: "TO_CHAR({startdate},'yyyy')",
                label: "Formula (Text)"
              })
              //search.createColumn({name: "fiscalcalendar", label: "Fiscal Calendar"})

            ]
          });
          if (varFiscalCalendar == true) {

            busqueda_periodos.filters.push(filtro_fiscal_calendar);
          }
          var resultado = busqueda_periodos.run().getRange(0, 1000);
          if (resultado != null) {
            for (var i = 0; i < resultado.length; i++) {
              //console.log('aqui ta juan',resultado[i].getText('fiscalcalendar'))
              obj_periodo.insertSelectOption({
                value: resultado[i].getValue('internalid'),
                text: resultado[i].getValue('formulatext')
              });
            }
          }
        }

        // GNRE
        if (IdReport == 11) {
          var select_estados = scriptContext.currentRecord.getField({
            fieldId: 'custpage_lmry_estado'
          });
          var json_setup = obtenerJSONSetupGNRE(paramSubsi, varFlagSubsi);

          if (json_setup != null && json_setup != '') {
            json_setup = JSON.parse(json_setup);
          } else {
            if (language == 'es') {
              alert('No se tienen configuraciones del setup GNRE');
            } else if (language == 'pt') {
              alert('Não há configurações de instalação GNRE');
            } else {
              alert('There are no GNRE setup configurations');
            }
            return false;
          }
          //SE OBTIENE UN ARRAY DE ID'S DE LAS PROVINCIAS EN EL JSON
          var provincias_ids = []; //estados
          for (var i = 0; i < json_setup['gnreSubsi'].length; i++) {
            provincias_ids.push(json_setup['gnreSubsi'][i]['estado_uf']);
          }
          provincias_ids = agruparArray(provincias_ids);

          //BUSQUEDA DE ESTADOS CON LAS PROVINCIAS DEL SETUP
          var searchProvin = search.create({
            type: 'customrecord_lmry_province',
            columns: ['custrecord_lmry_prov_id', 'name'],
            filters: [
              ['isinactive', 'is', 'F'], 'and', ['custrecord_lmry_prov_country', 'is', '30']
            ]
          });

          var formula_estados = "CASE WHEN ";
          for (var i = 0; i < provincias_ids.length; i++) {
            if (i == provincias_ids.length - 1) {
              formula_estados += "{custrecord_lmry_prov_id} = '" + provincias_ids[i] + "' ";
            } else {
              formula_estados += "{custrecord_lmry_prov_id} = '" + provincias_ids[i] + "' OR";
            }
          }
          formula_estados += "THEN 1 ELSE 0 END";

          var filtro_estados = search.createFilter({
            name: 'formulatext',
            formula: formula_estados,
            operator: search.Operator.IS,
            values: '1'
          });
          searchProvin.filters.push(filtro_estados);
          var resultProvi = searchProvin.run().getRange(0, 100);

          //LLENADO DEL SELECT ESTADOS
          if (resultProvi != null && resultProvi.length != 0) {
            select_estados.removeSelectOption({
              value: null
            });
            select_estados.insertSelectOption({
              value: 0,
              text: ' '
            });
            for (var i = 0; i < resultProvi.length; i++) {
              row = resultProvi[0].columns;
              var estado_id = resultProvi[i].getValue(row[0]);
              var estado_name = resultProvi[i].getValue(row[1]);

              select_estados.insertSelectOption({
                value: estado_id,
                text: estado_name
              });
            }
          }
        }
      }

      if (fieldName == 'custpage_lmry_estado') {

        var paramSubsi = scriptContext.currentRecord.getValue({
          fieldId: 'custpage_subsidiary'
        });

        var varFlagSubsi = runtime.isFeatureInEffect({
          feature: "SUBSIDIARIES"
        });

        if (paramSubsi != null && paramSubsi != '' && IdReport == 11) { //previamente se eligio la subsi?
          var select_receita = scriptContext.currentRecord.getField({
            fieldId: 'custpage_lmry_receita'
          });

          var estado_suitelet = scriptContext.currentRecord.getValue({
            fieldId: 'custpage_lmry_estado'
          });

          var json_setup = JSON.parse(obtenerJSONSetupGNRE(paramSubsi, varFlagSubsi));

          //SE OBTIENE UN ARRAY DE ID'S DE LAS RECEITAS EN EL JSON
          var receitas_ids = [];
          for (var i = 0; i < json_setup['gnreSubsi'].length; i++) {
            if (json_setup['gnreSubsi'][i]['estado_uf'] == estado_suitelet) {
              receitas_ids.push(json_setup['gnreSubsi'][i]['id_receita']);
            }
          }

          receitas_ids = agruparArray(receitas_ids);
          //BUSQUEDA DE ESTADOS CON LAS PROVINCIAS DEL SETUP
          var searchReceita = search.create({
            type: 'customrecord_lmry_br_revenue_code',
            columns: ['internalid', 'name', 'custrecord_lmry_br_id_tax'],
            filters: [
              ['isinactive', 'is', 'F'], 'and', ['custrecord_lmry_br_id_tax', 'is', '09']
            ]
          });

          var filtro_receitas = search.createFilter({
            name: 'internalid',
            operator: search.Operator.ANYOF,
            values: receitas_ids
          });
          searchReceita.filters.push(filtro_receitas);

          resultReceita = searchReceita.run().getRange(0, 100);

          //LLENADO DEL SELECT ESTADOS
          if (resultReceita != null && resultReceita.length != 0) {
            select_receita.removeSelectOption({
              value: null
            });
            select_receita.insertSelectOption({
              value: 0,
              text: ' '
            });
            for (var i = 0; i < resultReceita.length; i++) {
              row = resultReceita[0].columns;
              var receita_id = resultReceita[i].getValue(row[0]);
              var receita_name = resultReceita[i].getValue(row[1]);

              select_receita.insertSelectOption({
                value: receita_id,
                text: receita_name
              });
            }
          }
        }
      }

      //DES - PERIODO SEGUN CALENDAR FISCAL
      var featureTaxFiscal = ObtenerConfigFeature(paramSubsi, 681);

      if (IdReport == 19 || IdReport == 13 || IdReport == 9 || IdReport == 18) {
        if (fieldName == 'custpage_subsidiary') {

          var fieldPeriod = scriptContext.currentRecord.getField({
            fieldId: 'custpage_custom_period'
          });

          if (featureTaxFiscal || featureTaxFiscal == 'T') {

            var periodMensualSearch = search.create({
              type: search.Type.TAX_PERIOD,
              filters: [
                ["isadjust", "is", "F"],
                "AND", ["isquarter", "is", "F"],
                "AND", ["isinactive", "is", "F"],
                "AND", ["isyear", "is", "F"]
              ]
            });

            if (varFiscalCalendar || varFiscalCalendar == 'T') {
              var varSubsidiary = search.lookupFields({
                type: search.Type.SUBSIDIARY,
                id: paramSubsi,
                columns: ['taxfiscalcalendar']
              });
              var taxfiscalCalendar = varSubsidiary.taxfiscalcalendar[0].value;
              var filtro_fiscal_calendar = search.createFilter({
                name: 'fiscalcalendar',
                operator: search.Operator.IS,
                values: taxfiscalCalendar
              });
              periodMensualSearch.filters.push(filtro_fiscal_calendar);

            }

          } else {
            //NO ES POR TAX FISCAL PERIOD SINO POR EL ACCOUNTGIN PERIOD
            var periodMensualSearch = search.create({
              type: search.Type.ACCOUNTING_PERIOD,
              filters: [
                ["isadjust", "is", "F"],
                "AND", ["isquarter", "is", "F"],
                "AND", ["isinactive", "is", "F"],
                "AND", ["isyear", "is", "F"]
              ]
            });

            if (varFiscalCalendar || varFiscalCalendar == 'T') {
              var varSubsidiary = search.lookupFields({
                type: search.Type.SUBSIDIARY,
                id: paramSubsi,
                columns: ['fiscalcalendar']
              });
              var fiscalCalendar = varSubsidiary.fiscalcalendar[0].value;

              console.log(fiscalCalendar);
              var filtro_fiscal_calendar = search.createFilter({
                name: 'fiscalcalendar',
                operator: search.Operator.IS,
                values: fiscalCalendar
              });
              periodMensualSearch.filters.push(filtro_fiscal_calendar);

            }

          }

          var internalIdColumn = search.createColumn({
            name: "internalid",
            label: "Internal ID"
          });
          var nameColumn = search.createColumn({
            name: "periodname",
            label: "Name"
          });
          var startDColumn = search.createColumn({
            name: "startdate",
            sort: search.Sort.ASC,
            label: "Start Date"
          });
          periodMensualSearch.columns = [internalIdColumn, nameColumn, startDColumn];

          var resultado = periodMensualSearch.run().getRange(0, 1000);

          fieldPeriod.removeSelectOption({
            value: null
          });
          fieldPeriod.insertSelectOption({
            value: '',
            text: ''
          });

          if (resultado != null) {
            for (var i = 0; i < resultado.length; i++) {
              fieldPeriod.insertSelectOption({
                value: resultado[i].getValue('internalid'),
                text: resultado[i].getValue('periodname')
              });
            }
          }

        }
      }


      return true;
    }

    function ObtenerConfigFeature(paramsubsidi, idFeature) {
      var activ_feature = false;
      var licenses = new Array();
      licenses = Libreria_Features.getLicenses(paramsubsidi);
      activ_feature = Libreria_Features.getAuthorization(idFeature, licenses);

      return activ_feature;
    }

    function fieldChanged(scriptContext) {

      //=================Validaciones GNRE=================
      if (scriptContext.fieldId == 'custpage_lmry_date_pago') {
        var mesVenci = 0;
        var objRecord = scriptContext.currentRecord;
        if (objRecord.getValue({
          fieldId: 'custpage_lmry_date_pago'
        }) != null || objRecord.getValue({
          fieldId: 'custpage_lmry_date_pago'
        }) != '') {
          var newDate = objRecord.getValue({
            fieldId: 'custpage_lmry_date_pago'
          });
          var diaVenci = 15;
          var mesPago = Number(newDate.getMonth() + 1);
          var anioVenci = Number(newDate.getFullYear());

          if (mesPago < 12 && mesPago > 0) {
            mesVenci = Number(mesPago + 1);
          } else {
            mesVenci = 1;
            anioVenci = Number(anioVenci + 1);
          }

        }

        if (objRecord.getValue({
          fieldId: 'custpage_lmry_date_venci'
        }) != null || objRecord.getValue({
          fieldId: 'custpage_lmry_date_venci'
        }) != '') {
          if (mesVenci == '10' || mesVenci == '11' || mesVenci == '12') {
            var cadena_date = anioVenci + "-" + mesVenci + "-" + "16";
          } else {
            var cadena_date = anioVenci + "-" + mesVenci + "-" + "15";
          }
          var date_obj = new Date(cadena_date);
          objRecord.setValue({
            fieldId: 'custpage_lmry_date_venci',
            value: date_obj
          });
        }
      }
      //==================================================

      return true;
    }

    function agruparArray(arrayReceitas) {
      var array_ordenado = [];

      for (var i = 0; i < arrayReceitas.length; i++) {
        if (array_ordenado.length == 0) {
          array_ordenado.push(arrayReceitas[i]);
        } else {
          for (var j = 0; j < array_ordenado.length; j++) {
            if (arrayReceitas[i] == array_ordenado[j]) {
              break;
            } else {
              if (j == array_ordenado.length - 1) {
                array_ordenado.push(arrayReceitas[i]);
              }
            }
          }
        }
      }
      return array_ordenado;
    }

    function obtenerJSONSetupGNRE(idSubsidiaria, flagSubsi) {

      var savedsearch = search.create({
        type: 'customrecord_lmry_br_setup_rpt_dctf',
        columns: [
          search.createColumn({
            name: "custrecord_lmry_br_valor_gnre",
            label: "Latam - BR GNRE"
          })
        ]
      });

      if (flagSubsi) {
        var subsidiaryFilter = search.createFilter({
          name: 'custrecord_lmry_br_rpt_subsidiary',
          operator: search.Operator.ANYOF,
          values: [idSubsidiaria]
        });
        savedsearch.filters.push(subsidiaryFilter);
      }

      var searchresult = savedsearch.run().getRange(0, 1);
      if (searchresult != null && searchresult != '' && searchresult != '- None -') {
        var contenidoGNRE_JSON = searchresult[0].getValue('custrecord_lmry_br_valor_gnre');
      } else {
        var contenidoGNRE_JSON = null;
      }

      return contenidoGNRE_JSON;
    }

    function ocultaCampos(pFormulario) {
      //PARAMETRO Bloque G
      pFormulario.currentRecord.getField({
        fieldId: 'custpage_bloque_g'
      }).isDisplay = false;
      //PARAMETRO Bloque H
      pFormulario.currentRecord.getField({
        fieldId: 'custpage_bloque_h'
      }).isDisplay = false;
      //Lista del bloque H
      pFormulario.currentRecord.getField({
        fieldId: 'custpage_list_mov_inv'
      }).isDisplay = false;

      //PARAMETRO TIPO DE DECLARACION
      pFormulario.currentRecord.getField({
        fieldId: 'custpage_lmry_tipo_decla'
      }).isDisplay = false;
      //PARAMETRO NRO DE RECTIFICATORIA
      pFormulario.currentRecord.getField({
        fieldId: 'custpage_lmry_nro_recti'
      }).isDisplay = false;

      //========Filtros Reporte GNRE=======

      //PARAMETRO Fecha Vencimiento
      pFormulario.currentRecord.getField({
        fieldId: 'custpage_lmry_date_venci'
      }).isDisplay = false;

      //PARAMETRO Fecha Pago
      pFormulario.currentRecord.getField({
        fieldId: 'custpage_lmry_date_pago'
      }).isDisplay = false;

      //PARAMETRO Estado
      pFormulario.currentRecord.getField({
        fieldId: 'custpage_lmry_estado'
      }).isDisplay = false;

      //PARAMETRO Receita
      pFormulario.currentRecord.getField({
        fieldId: 'custpage_lmry_receita'
      }).isDisplay = false;

      //PARAMETRO Fecha Referencia
      pFormulario.currentRecord.getField({
        fieldId: 'custpage_lmry_date_refer'
      }).isDisplay = false;

      //PARAMETRO Periodo Referencia
      pFormulario.currentRecord.getField({
        fieldId: 'custpage_lmry_periognre_refer'
      }).isDisplay = false;

      //PARAMETRO Tipo GIA
      pFormulario.currentRecord.getField({
        fieldId: 'custpage_gia_type'
      }).isDisplay = false;

      //PARAMETRO Transmitida GIA
      pFormulario.currentRecord.getField({
        fieldId: 'custpage_transmitted'
      }).isDisplay = false;

      //PARAMETRO Tipo Sintegra
      pFormulario.currentRecord.getField({
        fieldId: 'custpage_sintegra_type'
      }).isDisplay = false;

      //PARAMETRO PERIODO Anual
      pFormulario.currentRecord.getField({
        fieldId: 'custpage_anio'
      }).isDisplay = false;

      //PARAMETRO Tipo NFCE (21,22,06)
      pFormulario.currentRecord.getField({
        fieldId: 'custpage_lmry_nfce'
      }).isDisplay = false;

      //PERIODO SEGUN CALENDAR FISCAL
      pFormulario.currentRecord.getField({
        fieldId: 'custpage_custom_period'
      }).isDisplay = false;

      //====================================
      var transacdataSearch = search.create({
        type: 'customrecord_lmry_br_filter_report',
        filters: ['isinactive', 'is', 'F'],
        columns: [{
          name: 'custrecord_lmry_br_filter_id'
        }]
      })
      var objResult = transacdataSearch.run().getRange({
        start: 0,
        end: 1000
      });

      if (objResult != null && objResult != '') {
        for (var i = 0; i < objResult.length; i++) {
          var idField = objResult[i].getValue('custrecord_lmry_br_filter_id');
          //if ( auxfield!= idField && idField!=null && idField!='' )
          if (idField != null && idField != '') {
            //auxfield = idField;
            // Oculta el campo
            pFormulario.currentRecord.getField({
              fieldId: idField
            }).isDisplay = false;
          }
        }
      }
    }

    function validarStatus(deploymentId) {

      var suiteletURL = 'https://' + window.location.host +
        url.resolveScript({
          scriptId: 'customscript_lmry_br_validatestatus_stlt',
          deploymentId: 'customdeploy_lmry_br_validatestatus_stlt',
          returnExternalUrl: false
        });

      suiteletURL += '&schdl=' + deploymentId;

      var request = https.get({
        url: suiteletURL
      });
      var rpta = JSON.parse(request.body);

      var status = rpta.value;

      return status;
    }


    return {
      pageInit: pageInit,
      saveRecord: saveRecord,
      validateField: validateField,
      fieldChanged: fieldChanged
    };
  });