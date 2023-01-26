/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_PE_Report_InvBal_CLNT.js                    ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Dec 02 2021  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

define(['N/runtime', 'N/currentRecord', 'N/search', 'N/url', 'N/https', 'N/log', 'N/format', "/SuiteBundles/Bundle 37714/Latam_Library/LMRY_LibraryReport_LBRY_V2.js"],

  function (runtime, currentRecord, search, url, https, log, format, libFeature) {

    var LMRY_script = "LatamReady - PE Inventario y Balance CLNT";
    var objContext = runtime.getCurrentScript();
    var paramCheckAdjustmentBook = null;
    var featAccountingSpecial = null;
    var varFiscalCalendar = null;

    //Language
    var language = runtime.getCurrentScript().getParameter({
      name: 'LANGUAGE'
    }).substring(0, 2);
    if (language != "en" && language != "es") {
      language = "en";
    }
    var globalAlerts = getGlobalAlerts();
    function pageInit(scriptContext) {

      var varRecordRpt = scriptContext.currentRecord.getValue({
        fieldId: 'custpage_lmry_inv_bal_reporte'
      });

      if (varRecordRpt == 0) {
        ocultaCampos(scriptContext);
      }
    }

    function saveRecord(scriptContext) {
      try {
        // Valida si tiene la licencia activa
        var reporteid = scriptContext.currentRecord.getValue({
          fieldId: 'custpage_lmry_inv_bal_reporte'
        });

        var varFiscalCalendar = runtime.isFeatureInEffect({
          feature: 'MULTIPLECALENDARS'
        });

        if (reporteid == 0 || reporteid == null) {
          alert(globalAlerts.report[language]);
          return false;
        }

        if (reporteid == 1 || reporteid == 2 || reporteid == 3 || reporteid == 4 || reporteid == 5 || reporteid == 6 || reporteid == 7 || reporteid == 8 || reporteid == 9 || reporteid == 10) {
          var periodoAnual = scriptContext.currentRecord.getValue({
            fieldId: 'custpage_anio_id'
          });

          if (periodoAnual == 0 || periodoAnual == null || periodoAnual == '') {
            alert(globalAlerts.period[language]);
            return false;
          }

        }

        /*var periodo = scriptContext.currentRecord.getValue({
            fieldId: 'custpage_periodo'
        });
 
        if (periodo == 0 || periodo == null) {
            alert('Debe seleccionar el campo Periodo.');
            return false;
        }*/

        var filter_deploy = '';

        var id_report_feat = search.lookupFields({
          type: 'customrecord_lmry_pe_inv_bal_feature_rpt',
          id: reporteid,
          columns: ['custrecord_lmry_pe_inv_bal_id_schedule', 'custrecord_lmry_pe_inv_bal_id_deploy']
        });

        filter_deploy = id_report_feat.custrecord_lmry_pe_inv_bal_id_deploy;


        var URL = 'https://' + window.location.host +
          url.resolveScript({
            scriptId: 'customscript_lmry_pe_invbal_validatestat',
            deploymentId: 'customdeploy_lmry_pe_invbal_validatestat',
            returnExternalUrl: false
          });

        URL += '&schdl=' + filter_deploy;
        // console.log('URL '+URL );
        //alert(url);

        var request = https.get({
          url: URL
        });

        var rpta = JSON.parse(request.body);
        //alert(rpta.value);
        var status = rpta.value;
        // var result = JSON.parse(request.getBody());
        // alert(result.value);
        //console.log('status '+ status);
        if (!status) {
          alert(globalAlerts.status[language]);
          return false;
        }
        /* ************************************************************
         * Verifica si esta activo la funcionalidad
         *  MULTI-BOOK ACCOUNTING - ID multibook
         * ***********************************************************/

        //Features
        feamultibook = runtime.isFeatureInEffect({
          feature: "MULTIBOOK"
        });

        if (feamultibook == true || feamultibook == 'T') {
          var paramMulti = scriptContext.currentRecord.getValue({
            fieldId: 'custpage_multibook'
          });

          if (paramMulti == 0 || paramMulti == null) {
            alert(globalAlerts.multibook[language]);
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
            fieldId: 'custpage_inv_bal_subsidiary'
          });

          if (paramSubsi == 0 || paramSubsi == null) {
            alert(globalAlerts.subsidiary[language]);
            return false;
          }
          obtenerDatosSubsidiaria(paramSubsi);

          //special
          if (reporteid == 1 || reporteid == 2 || reporteid == 4 || reporteid == 6 || reporteid == 7 || reporteid == 8 || reporteid == 9) {
            if (featAccountingSpecial || featAccountingSpecial == 'T') {
              var searchPeriodSpecial = search.create({
                type: "customrecord_lmry_special_accountperiod",
                filters: [
                  ["isinactive", "is", "F"],
                  "AND",
                  ["custrecord_lmry_anio_fisco", "is", periodoAnual]
                ],
                columns: [
                  search.createColumn({
                    name: "name",
                    label: "Name"
                  })
                ]
              });
              if (varFiscalCalendar == true || varFiscalCalendar == 'T') {     
                var subsiCalendar = search.lookupFields({
                    type: search.Type.SUBSIDIARY,
                    id: paramSubsi,
                    columns: ['fiscalcalendar']
                });

                var calendarSub = {
                    id: subsiCalendar.fiscalcalendar[0].value,
                    nombre: subsiCalendar.fiscalcalendar[0].text
                }           
                calendarSub = JSON.stringify(calendarSub);            
                var fiscalCalendarFilter = search.createFilter({
                    name: 'custrecord_lmry_calendar',
                    operator: search.Operator.IS,
                    values: calendarSub
                });
                searchPeriodSpecial.filters.push(fiscalCalendarFilter);
              }
              var searchResult = searchPeriodSpecial.run().getRange(0, 100);

              if (searchResult.length == 0) {

                if (language == 'es') {
                  alert('Configurar todos los meses para el año seleccionado en el LatamReady - Special Accounting Period. y/o el calendario fiscal de la subsidiria');
                } else if (language == 'pt') {
                  alert('Definir todos os meses para o ano selecionado no LatamReady - Special Accounting Period. e/ou o calendário fiscal do subsídio.');
                } else {
                  alert('Set all months for the year selected in the LatamReady - Special Accounting Period. and/or the fiscal calendar of the subsidy.');
                }
                return false;
              }
            }
          }
        }

        if (paramCheckAdjustmentBook == 'T' || paramCheckAdjustmentBook == true) {
          var adjustmentBook = scriptContext.currentRecord.getValue({
            fieldId: 'custpage_adjustment_book'
          });

          if (adjustmentBook == 0 || adjustmentBook == null) {
            alert(globalAlerts.adjustbook[language]);
            return false;
          }
        }

        /* **********************************************************
         *  validacion del Special Accounting Period
         * **********************************************************
         */

        // Mesaje al usuario
        alert(globalAlerts.startmessage[language]);
        return true;
      } catch (err) {
        //sendMail(LMRY_script , ' [ clientSaveRecord ] ' + err );
        //console.log('ERROR',err);
        alert(err);
        return false;
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
          var endDate = result.getValue(columns[2]);

          var temporal = [periodName, startDate, endDate];

          //if (calendarSubsi != null && calendarSubsi != '') {
          /*if (calendar != null && calendar != '') {
            calendar = JSON.parse(calendar);
            //if (calendar.id == calendarSubsi) {*/
          periodSpecial = temporal;
          //}
          /*} else {
            log.debug('no se configuro periodo especial');
          }*/

          /*} else {
            periodSpecial = temporal;
          }*/

        })
      });

      return periodSpecial;
    }

    function getIdPeriods(endperiod) {
      var period = new Array();
      var accountingperiodObj = search.create({
        type: 'accountingperiod',
        filters: [
          ["isadjust", "is", "F"],
          "AND",
          ['isyear', 'is', 'F'],
          'AND',
          ['isquarter', 'is', 'F'],
          'AND',
          ["enddate", "on", endperiod]
        ],
        columns: [
          search.createColumn({
            name: "internalid",
            label: "Internal ID"
          })
        ]

      });

      // Ejecutando la busqueda
      var varResult = accountingperiodObj.run();
      var AccountingPeriodRpt = varResult.getRange({
        start: 0,
        end: 1000
      });

      var columns;
      for (var i = 0; i < AccountingPeriodRpt.length; i++) {
        columns = AccountingPeriodRpt[i].columns;
        period[i] = new Array();
        period[i] = AccountingPeriodRpt[i].getValue(columns[0]);
      }

      return period;

    }

    function obtenerDatosSubsidiaria(subsidiaryId) {
      if (varFiscalCalendar || varFiscalCalendar == 'T') {
        var subsidiary = search.lookupFields({
          type: search.Type.SUBSIDIARY,
          id: subsidiaryId,
          columns: ['fiscalcalendar']
        });

        calendarSubsi = subsidiary.fiscalcalendar[0].value;
        console.log('calendarSubsi', calendarSubsi);
      }

      var licenses = libFeature.getLicenses(subsidiaryId);
      featAccountingSpecial = libFeature.getAuthorization(664, licenses);
      console.log('featAccountingSpecial', featAccountingSpecial);
    }

    function validateField(scriptContext) {
      try {
        var feamultibook = runtime.isFeatureInEffect({
          feature: 'MULTIBOOK'
        });

        var varFiscalCalendar = runtime.isFeatureInEffect({
          feature: 'MULTIPLECALENDARS'
        });

        var reporteSunat = scriptContext.currentRecord.getValue({
          fieldId: 'custpage_lmry_inv_bal_reporte'
        });

        var name = scriptContext.fieldId;

        if (name == 'custpage_adjustment_book_check') {

          paramCheckAdjustmentBook = scriptContext.currentRecord.getValue({
            fieldId: 'custpage_adjustment_book_check'
          });
          if (paramCheckAdjustmentBook == 'T' || paramCheckAdjustmentBook == true) {
            scriptContext.currentRecord.getField({
              fieldId: 'custpage_adjustment_book'
            }).isDisplay = true;
          } else {
            scriptContext.currentRecord.getField({
              fieldId: 'custpage_adjustment_book'
            }).isDisplay = false;
          }

        }
        
        if (name == 'custpage_inv_bal_subsidiary') {

          console.log('entro al if');

          var subsidiary_id = scriptContext.currentRecord.getValue({
            fieldId: 'custpage_inv_bal_subsidiary'
          });
          obtenerDatosSubsidiaria(subsidiary_id);
          //alert(reporteSunat);

          if (reporteSunat == 3 || reporteSunat == 5 || reporteSunat == 1 || reporteSunat == 4 || reporteSunat == 9 || reporteSunat == 2 || reporteSunat == 6 || reporteSunat == 7 || reporteSunat == 8) {
            if (featAccountingSpecial || featAccountingSpecial == 'T') {
              //alert('featAccountingSpecial');
              var fieldPeriodes = scriptContext.currentRecord.getField({
                fieldId: 'custpage_anio_id'
              });
              var busquedaPeriodo = search.create({
                type: "customlist_lmry_year_period",
                filters: [
                ],
                columns: [
                  search.createColumn({
                    name: "internalid",
                    label: "Internal ID"
                  }),
                  search.createColumn({
                    name: "name",
                    sort: search.Sort.ASC,
                    label: "Name"
                  })
                ]
              })

              var resultado = busquedaPeriodo.run().getRange(0, 1000);

              console.log(resultado);
              if (resultado != null) {

                fieldPeriodes.removeSelectOption({
                  value: null
                });

                for (var i = 0; i < resultado.length; i++) {
                  fieldPeriodes.insertSelectOption({
                    value: resultado[i].getValue('name'),//sera necesario para el special period el name
                    text: resultado[i].getValue('name')
                  });
                }

              }

            } else {
              if (varFiscalCalendar || varFiscalCalendar == 'T') {

                var fieldPeriodes = scriptContext.currentRecord.getField({
                  fieldId: 'custpage_anio_id'
                });

                var busquedaPeriodo = search.create({
                  type: "accountingperiod",
                  filters: [
                    ["isadjust", "is", "F"],
                    "AND", ["isquarter", "is", "F"],
                    "AND", ["isinactive", "is", "F"],
                    "AND", ["isyear", "is", "T"]
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

                  ]
                })

                var varSubsidiary = search.lookupFields({
                  type: search.Type.SUBSIDIARY,
                  id: subsidiary_id,
                  columns: ['fiscalcalendar']
                });
                var fiscalCalendar = varSubsidiary.fiscalcalendar[0].value;

                //crea nuevo filtro y lo pushea
                var filtro_fiscal_calendar = search.createFilter({
                  name: 'fiscalcalendar',
                  operator: search.Operator.IS,
                  values: fiscalCalendar
                });
                busquedaPeriodo.filters.push(filtro_fiscal_calendar);

                var resultado = busquedaPeriodo.run().getRange(0, 1000);

                console.log(resultado);
                if (resultado != null) {

                  fieldPeriodes.removeSelectOption({
                    value: null
                  });

                  for (var i = 0; i < resultado.length; i++) {
                    var yearPeriod = resultado[i].getValue('periodname').split(' ');
                    fieldPeriodes.insertSelectOption({
                      value: resultado[i].getValue('internalid'),
                      text: yearPeriod[1]
                    });
                  }

                }
              }
            }
          } else {
            if (varFiscalCalendar || varFiscalCalendar == 'T') {

              var fieldPeriodes = scriptContext.currentRecord.getField({
                fieldId: 'custpage_anio_id'
              });

              var busquedaPeriodo = search.create({
                type: "accountingperiod",
                filters: [
                  ["isadjust", "is", "F"],
                  "AND", ["isquarter", "is", "F"],
                  "AND", ["isinactive", "is", "F"],
                  "AND", ["isyear", "is", "T"]
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

                ]
              })

              var varSubsidiary = search.lookupFields({
                type: search.Type.SUBSIDIARY,
                id: subsidiary_id,
                columns: ['fiscalcalendar']
              });
              var fiscalCalendar = varSubsidiary.fiscalcalendar[0].value;

              //crea nuevo filtro y lo pushea
              var filtro_fiscal_calendar = search.createFilter({
                name: 'fiscalcalendar',
                operator: search.Operator.IS,
                values: fiscalCalendar
              });
              busquedaPeriodo.filters.push(filtro_fiscal_calendar);

              var resultado = busquedaPeriodo.run().getRange(0, 1000);

              console.log(resultado);
              if (resultado != null) {

                fieldPeriodes.removeSelectOption({
                  value: null
                });

                for (var i = 0; i < resultado.length; i++) {
                  var yearPeriod = resultado[i].getValue('periodname').split(' ');
                  fieldPeriodes.insertSelectOption({
                    value: resultado[i].getValue('internalid'),
                    text: yearPeriod[1]
                  });
                }

              }
            }
          }
          scriptContext.currentRecord.getField({
            fieldId: 'custpage_anio_id'
          }).isDisplay = true;


          if (feamultibook == true || feamultibook == 'T') {

            //MULTIBOOK DE ACUERDO A SUBSIDIARIA

            var subsidiary = scriptContext.currentRecord.getValue({
              fieldId: 'custpage_inv_bal_subsidiary'
            });
            var featSubsi = runtime.isFeatureInEffect({
              feature: "SUBSIDIARIES"
            });


            if (featSubsi) {

              var search_currency = search.create({
                type: "customrecord_lmry_currency_by_country",
                filters: [
                  ["custrecord_lmry_currency_country_local", "anyof", "174"], "AND",
                  ["custrecord_lmry_is_country_base_currency", "is", "T"]
                ],
                columns: [
                  "custrecord_lmry_currency"
                ]
              });

              var results_cur = search_currency.run().getRange(0, 10);
              var currency_per = results_cur[0].getValue('custrecord_lmry_currency');

              //alert(currency_per);

              var search_acc = search.create({
                type: "accountingbook",
                filters: [
                  ["currency", "anyof", currency_per], "AND",
                  ["status", "anyof", "ACTIVE"], "AND",
                  ["subsidiary", "anyof", subsidiary], 'AND',
                  ['isadjustmentonly', 'is', 'F']
                ],
                columns: ["internalid", "name"]
              });

              var results_acc = search_acc.run().getRange(0, 1000);

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
              for (var i = 0; i < results_acc.length; i++) {
                var subID = results_acc[i].getValue('internalid');
                var subNM = results_acc[i].getValue('name');
                select.insertSelectOption({
                  value: subID,
                  text: subNM
                });
              }

              //llenado de libros de ajustes

              var search_accAdjs = search.create({
                type: "accountingbook",
                filters: [
                  ["currency", "anyof", currency_per], "AND",
                  ["status", "anyof", "ACTIVE"], "AND",
                  ["subsidiary", "anyof", subsidiary], 'AND',
                  ['isadjustmentonly', 'is', 'T']
                ],
                columns: ["internalid", "name"]
              });

              var results_acc = search_accAdjs.run().getRange(0, 1000);

              var select = scriptContext.currentRecord.getField({
                fieldId: 'custpage_adjustment_book'
              });
              select.removeSelectOption({
                value: null
              });

              select.insertSelectOption({
                value: 0,
                text: ' '
              });
              for (var i = 0; i < results_acc.length; i++) {
                var subID = results_acc[i].getValue('internalid');
                var subNM = results_acc[i].getValue('name');
                select.insertSelectOption({
                  value: subID,
                  text: subNM
                });
              }
            }
          }

        }

        if (name == 'custpage_lmry_inv_bal_reporte') {
          ocultaCampos(scriptContext);
          if (feamultibook) {
            paramCheckAdjustmentBook = scriptContext.currentRecord.getValue({
              fieldId: 'custpage_adjustment_book_check'
            });
            if (paramCheckAdjustmentBook == 'T' || paramCheckAdjustmentBook == true) {
              scriptContext.currentRecord.getField({
                fieldId: 'custpage_adjustment_book'
              }).isDisplay = true;
            } else {
              scriptContext.currentRecord.getField({
                fieldId: 'custpage_adjustment_book'
              }).isDisplay = false;
            }
          }


          var reporteSunat = scriptContext.currentRecord.getValue({
            fieldId: 'custpage_lmry_inv_bal_reporte'
          });

          if (reporteSunat == '' || reporteSunat == null) {
            return true;
          }

          if (reporteSunat == 1 || reporteSunat == 2 || reporteSunat == 3 || reporteSunat == 4 || reporteSunat == 5 || reporteSunat == 6 || reporteSunat == 7 || reporteSunat == 8 || reporteSunat == 9 || reporteSunat == 10) {
            scriptContext.currentRecord.getField({
              fieldId: 'custpage_anio_id'
            }).isDisplay = true;
          }

          // Registro personalizado de campos a ocular en el SuiteLet
          var transacdataSearch = search.create({
            type: 'customrecord_lmry_pe_inv_bal_filter_rpt',

            columns: [{
              name: 'custrecord_lmry_pe_inv_bal_filter_id'
            }],
            filters: [{
              name: 'custrecord_lmry_pe_inv_bal_filter_featu',
              operator: 'anyof',
              values: [reporteSunat]
            },
            {
              name: 'isinactive',
              operator: 'is',
              values: 'F'
            },
            ]
          })
          var objResult = transacdataSearch.run().getRange({
            start: 0,
            end: 100
          });

          if (objResult != null && objResult != '') {
            for (var i = 0; i < objResult.length; i++) {
              var idField = objResult[i].getValue('custrecord_lmry_pe_inv_bal_filter_id');
              console.log(idField);

              // Obteniendo datos de etiqueta y campo de ingreso
              if (feamultibook || feamultibook == 'T') {
                if (idField != null && idField != '' && idField != 'custpage_adjustment_book') {
                  scriptContext.currentRecord.getField({
                    fieldId: idField
                  }).isDisplay = true;
                }
              } else {
                if (idField != null && idField != '' && idField != 'custpage_multibook' && idField != 'custpage_adjustment_book' && idField != 'custpage_adjustment_book_check') {
                  scriptContext.currentRecord.getField({
                    fieldId: idField
                  }).isDisplay = true;
                }
              }
            }
          }

          return true;
        }

        return true;

      } catch (err) {
        alert(err);
        return false;
      }

    }

    function fieldChanged(scriptContext) {
      return true;
    }

    function ocultaCampos(pFormulario) {

      var feamultibook = runtime.isFeatureInEffect({
        feature: 'multibook'
      });

      pFormulario.currentRecord.getField({
        fieldId: 'custpage_anio_id'
      }).isDisplay = false;

      if (feamultibook) {
        pFormulario.currentRecord.getField({
          fieldId: 'custpage_adjustment_book'
        }).isDisplay = false;
      }

      var transacdataSearch = search.create({
        type: 'customrecord_lmry_pe_inv_bal_filter_rpt',
        filters: [
          ['isinactive', 'is', 'F']
        ],
        columns: [{
          name: 'custrecord_lmry_pe_inv_bal_filter_id'
        }],

      })
      var objResult = transacdataSearch.run().getRange({
        start: 0,
        end: 100
      });

      if (objResult != null && objResult != '') {
        var auxfield = '';
        for (var i = 0; i < objResult.length; i++) {
          var idField = objResult[i].getValue('custrecord_lmry_pe_inv_bal_filter_id');

          //if ( auxfield!= idField && idField!=null && idField!='' )
          if (idField != null && idField != '' && idField != 'custpage_adjustment_book') {
            //auxfield = idField;
            // Oculta el campo
            if (feamultibook) {

              pFormulario.currentRecord.getField({
                fieldId: idField
              }).isDisplay = false;
            } else {

              if (idField != 'custpage_multibook' && idField != 'custpage_adjustment_book' && idField != 'custpage_adjustment_book_check') {

                pFormulario.currentRecord.getField({
                  fieldId: idField
                }).isDisplay = false;
              }
            }

          }
        }
      }
    }

    function validacampo(rptid, rptfield) {
      // Variables
      var result = false;
      // Filtros
      var transacdataSearch = search.create({
        type: 'customrecord_lmry_pe_inv_bal_filter_rpt',

        columns: [{
          name: 'custrecord_lmry_pe_inv_bal_filter_manda'
        }],
        filters: [{
          name: 'custrecord_lmry_pe_inv_bal_filter_featu',
          operator: 'anyof',
          values: [rptid]
        }, {
          name: 'custrecord_lmry_pe_inv_bal_filter_id',
          operator: 'is',
          values: [rptfield]
        }]
      })

      var objResult = transacdataSearch.run().getRange({
        start: 0,
        end: 10
      });

      if (objResult != null && objResult != '') {
        if (objResult.length > 0) {
          if (objResult[0].getValue('custrecord_lmry_pe_inv_bal_filter_manda') == 'T' ||
            objResult[0].getValue('custrecord_lmry_pe_inv_bal_filter_manda') == true) {
            result = true;
          }
        }
      }
      return result;
    }

    function getGlobalAlerts() {
      var labels = {
        report: {
          en: 'You must select the Report field.',
          es: 'Debe seleccionar el campo Reporte.'
        },
        subsidiary: {
          en: 'You must select the Subsidiary field.',
          es: 'Debe seleccionar el campo Subsidiaria.'
        },
        period: {
          en: 'You must select the Annual Period field.',
          es: 'Debe seleccionar el campo Periodo Anual.'
        },
        multibook: {
          en: 'You must select the Multi Book field.',
          es: 'Debe seleccionar el campo Multi Book.'
        },
        adjustbook: {
          en: 'You must select an option in the Adjustment Book field.',
          es: 'Debe seleccionar una opción el campo Libro de Ajuste.'
        },
        status: {
          en: 'Report is being processed.',
          es: 'El Reporte se esta procesando.'
        },
        startmessage: {
          en: 'A file will be generated and an email will be sent confirming the process.\n\nThis process may take several minutes.\n\nPlease update the log for download.',
          es: 'Se generara un archivo y se enviara un mail con la confirmacion del proceso.\n\nEste proceso puede durar varios minutos.\n\nPor favor actualizar el log para su descarga.'
        }

      }

      return labels
    }

    return {
      pageInit: pageInit,
      saveRecord: saveRecord,
      validateField: validateField,
      fieldChanged: fieldChanged
    };

  });