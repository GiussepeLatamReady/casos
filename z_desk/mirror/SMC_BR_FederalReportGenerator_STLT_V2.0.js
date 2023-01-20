/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for Inventory Balance Library                  ||
||                                                              ||
||  File Name: SMC_BR_FederalReportGenerator_STLT_V2.0.js       ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Nov 10 2022  Jorge Meza    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope Public
 */

define(["N/format", "N/ui/serverWidget", "N/search", "N/runtime", "N/record", "N/redirect", "N/task",
    "N/log", "N/config", "/SuiteBundles/Bundle 37714/Latam_Library/LMRY_LibraryReport_LBRY_V2.js"
], runSuitelet);
var FORMAT, UI, SEARCH, RECORD, RUNTIME, REDIRECT, TASK, LOG, CONFIG, LIB_FEATURE;
// Titulo del Suitelet

var LMRY_script = "SMC Federal Report Generator BR STLT";
var namereport = "SMC - Federal Report Generator BR";
var language = '';
var taxCalendarSubsi = '';
var featTaxCalendar = '';

function runSuitelet(format, ui, search, runtime, record, redirect, task, log, config, libFeature) {

    language = runtime.getCurrentScript().getParameter("LANGUAGE").substring(0, 2);

    if (language == 'es') {
        //LMRY_script = "LMRY Generador de Informes Federales BR STLT";
        namereport = "SMC - Generador Reportes Federales BR";
    } else if (language == 'pt') {
        //LMRY_script = "LMRY Gerador de Relatórios Federais BR STLT";
        namereport = "SMC - Gerador de Relatórios Federais BR";
    } else {
        //LMRY_script = "LMRY Federal Report Generator BR STLT";
        namereport = "SMC - Federal Report Generator BR";
    }

    FORMAT = format;
    UI = ui;
    SEARCH = search;
    RUNTIME = runtime;
    RECORD = record;
    REDIRECT = redirect;
    TASK = task;
    LOG = log;
    CONFIG = config;
    LIB_FEATURE = libFeature;

    var taxFiscalCalendar = '';
    var featMultipleCalendars = '';
    var taxCalendarSubsi = '';
    var calendarSubsi = '';
    var returnObj = {};
    returnObj.onRequest = execute;
    return returnObj;
}

function execute(context) {

    var varMethod = context.request.method;
    try {
        if (varMethod == 'GET') {

            // Crea el folder
            search_folder();

            //Creacion de Folder
            var form = UI.createForm(namereport);
            var varFlagSubsi = RUNTIME.isFeatureInEffect({
                feature: "SUBSIDIARIES"
            });
            var varFlagMultiB = RUNTIME.isFeatureInEffect({
                feature: "MULTIBOOK"
            });
            featMultipleCalendars = RUNTIME.isFeatureInEffect({
                feature: 'MULTIPLECALENDARS'
            });

            if (language == 'es') {
                var Treporte = 'Tipos de Reporte';
                var report = 'Reporte';
                var CritBusq = 'Criterios de Busqueda';
                var subsidia = 'SUBSIDIARIA';
                var periodAnu = 'Periodo Anual';
                var Devent = 'Dia de Evento';
                var IdAnu = 'Identifacion Anual';
                var CritEspe = 'Criterios Especiales';
                var InclR1000 = 'Incluir R-1000';
                var tipoDecl = 'Tipo de Declaración';
                var numRect = 'Nro de Rectificatoria';
                var NumOrdECD = 'NUMERO DE ORDEN CONTABLE - ECD';
                var tipoDeclECD = 'Tipo de Declaración ECD';
                var tipLib = 'Tipo de Libro ECD';
                var numOrd = 'Nro de Orden';
                var lucroCont = 'Lucro Contable';
                var montAdici = 'Monto Adicional';
                var montExcl = 'Monto Excluyente';
                var mensaje = 'Importante: Al utilizar la Transacción de NetSuite, asume toda la responsabilidad de determinar si los datos que genera y descarga son precisos o suficientes para sus propósitos. También asume toda la responsabilidad por la seguridad de cualquier dato que descargue de NetSuite y posteriormente almacene fuera del sistema NetSuite.';
                var logGe = 'Log de generacion';
                var fechaCrea = 'FECHA DE CREACION';
                var info = 'INFORME';
                var perio = 'PERIODO';
                var subsid = 'SUBSIDIARIA';
                var creado = 'CREADO POR';
                var nombreArc = 'NOMBRE ARCHIVO';
                var descarg = 'DESCARGAR ';
                var staRe = 'ESTADO REINF';
                var descarga = 'Descarga';
                var generar = 'Generar';
                var cancel = 'Cancelar';
            } else if (language == 'pt') {
                var Treporte = 'Tipos de Relatório';
                var report = 'Relatório';
                var CritBusq = 'Critérios de Pesquisa';
                var subsidia = 'SUBSIDIÁRIA';
                var periodAnu = 'Período Anual';
                var Devent = 'Dia do Evento';
                var IdAnu = 'Identificação Anual';
                var CritEspe = 'Critérios Especiais';
                var InclR1000 = 'Inclui R-1000';
                var tipoDecl = 'Tipo de Declaração';
                var numRect = 'Número de Retificação';
                var NumOrdECD = 'NÚMERO DE ORDEM DE CONTABILIDADE - ECD';
                var tipoDeclECD = 'Tipo de Declaração ECD';
                var tipLib = 'Tipo de Livro ECD';
                var numOrd = 'Número de Ordem';
                var lucroCont = 'Lucro Contábil';
                var montAdici = 'Quantia adicional';
                var montExcl = 'Excluindo Quantia';
                var mensaje = 'Importante: ao usar a Transação NetSuite, você assume toda a responsabilidade por determinar se os dados que você gerar e baixar são precisos ou suficientes para seus propósitos. Você também assume toda a responsabilidade pela segurança de quaisquer dados baixados do NetSuite e subsequentemente armazenados fora do sistema NetSuite.';
                var logGe = 'Registro de geração';
                var fechaCrea = 'DATA DE CRIAÇÃO';
                var info = 'RELATÓRIO';
                var perio = 'PERÍODO';
                var subsid = 'SUBSIDIÁRIA';
                var creado = 'CRIADO POR';
                var nombreArc = 'NOME DO ARQUIVO';
                var descarg = 'DOWNLOAD';
                var staRe = 'STATUS REINF';
                var descarga = 'Download';
                var generar = 'Gerar';
                var cancel = 'Cancelar';
            } else {
                var Treporte = 'Report Types';
                var report = 'Report';
                var CritBusq = 'Search Criteria';
                var subsidia = 'SUBSIDIARY';
                var periodAnu = 'Annual Period';
                var Devent = 'Event Day';
                var IdAnu = 'Annual Identification';
                var CritEspe = 'Special Criteria';
                var InclR1000 = 'Include R-1000';
                var tipoDecl = 'Declaration Type';
                var numRect = 'Rectification number';
                var NumOrdECD = 'ACCOUNTING ORDER NUMBER - ECD';
                var tipoDeclECD = 'ECD Declaration Type';
                var tipLib = 'ECD Book Type';
                var numOrd = 'Order Number';
                var lucroCont = 'Accounting Profit';
                var montAdici = 'Additional Amount';
                var montExcl = 'Excluding Amount';
                var mensaje = 'Important: By using the NetSuite Transaction, you assume all responsibility for determining whether the data you generate and download is accurate or sufficient for your purposes. You also assume all responsibility for the security of any data that you download from NetSuite and subsequently store outside of the NetSuite system.';
                var logGe = 'Generation log';
                var fechaCrea = 'CREATION DATE';
                var info = 'REPORT';
                var perio = 'PERIOD';
                var subsid = 'SUBSIDIARY';
                var creado = 'CREATED BY';
                var nombreArc = 'FILE NAME';
                var descarg = 'DOWNLOAD';
                var staRe = 'STATUS REINF';
                var descarga = 'Download';
                var generar = 'Generate';
                var cancel = 'Cancel';
            }

            /* ****** Grupo de Campos Criterios de Busqueda *******/
            form.addFieldGroup({
                id: 'custpage_filran1',
                label: Treporte
            });

            //Obtiene los datos de la lista de reportes SUNAT

            var fieldreports = form.addField({
                id: 'custpage_lmry_reporte',
                type: UI.FieldType.SELECT,
                label: report,
                container: 'custpage_filran1'
            });

            var varFilter = new Array();
            varFilter[0] = SEARCH.createFilter({
                name: 'isinactive',
                operator: SEARCH.Operator.IS,
                values: 'F'
            });

            varFilter[1] = SEARCH.createFilter({
                name: 'custrecord_lmry_br_class_report',
                operator: SEARCH.Operator.IS,
                values: 'F'
            });

            var varRecord = SEARCH.create({
                type: 'customrecord_lmry_br_features',
                filters: varFilter,
                columns: ['internalid', 'name']
            });
            var varResult = varRecord.run();
            var varRecordRpt = varResult.getRange({
                start: 0,
                end: 1000
            });

            if (varRecordRpt != null && varRecordRpt.length > 0) {
                // Llena una linea vacia
                fieldreports.addSelectOption({
                    value: 0,
                    text: ' '
                });

                // Llenado de listbox
                for (var i = 0; i < varRecordRpt.length; i++) {
                    var reportID = varRecordRpt[i].getValue('internalid');
                    var reportNM = varRecordRpt[i].getValue('name');

                    if (Number(reportID) == 1) {
                      fieldreports.addSelectOption({
                          value: reportID,
                          text: reportNM
                      });
                    }
                }
            }
            fieldreports.isMandatory = true;

            /* ****** Grupo de Campos Criterios de Busqueda ****** */
            form.addFieldGroup({
                id: 'custpage_filran2',
                label: CritBusq
            });

            // Valida si es OneWorld

            if (varFlagSubsi == true || varFlagSubsi == 'T') //EN ALGUNAS INSTANCIAS DEVUELVE CADENA OTRAS DEVUELVE BOOLEAN
            {
                var fieldsubs = form.addField({
                    id: 'custpage_subsidiary',
                    label: subsidia,
                    type: UI.FieldType.SELECT,
                    container: 'custpage_filran2'
                });

                fieldsubs.isMandatory = true;

                // Filtros
                var Filter_Custo = new Array();
                Filter_Custo[0] = SEARCH.createFilter({
                    name: 'isinactive',
                    operator: SEARCH.Operator.IS,
                    values: 'F'
                });
                Filter_Custo[1] = SEARCH.createFilter({
                    name: 'country',
                    operator: SEARCH.Operator.ANYOF,
                    values: 'BR'
                });
                Filter_Custo[2] = SEARCH.createFilter({
                    name: 'custrecord_lmry_br_is_matriz',
                    operator: SEARCH.Operator.IS,
                    values: 'T'
                });

                var search_Subs = SEARCH.create({
                    type: SEARCH.Type.SUBSIDIARY,
                    filters: Filter_Custo,
                    columns: ['internalid', 'name']
                });
                var resul_sub = search_Subs.run();
                var varRecordSub = resul_sub.getRange({
                    start: 0,
                    end: 1000
                });

                if (varRecordSub != null && varRecordSub.length > 0) {
                    // Llena una linea vacia
                    fieldsubs.addSelectOption({
                        value: 0,
                        text: ' '
                    });

                    // Llenado de listbox
                    for (var i = 0; i < varRecordSub.length; i++) {

                        var subID = varRecordSub[i].getValue('internalid');
                        var subNM = varRecordSub[i].getValue('name');
                        fieldsubs.addSelectOption({
                            value: subID,
                            text: subNM
                        });
                    }
                }
                //fieldsubs.isMandatory = true;
            }

            var periodo_anual = form.addField({
                id: 'custpage_anio',
                label: periodAnu,
                type: UI.FieldType.SELECT,
                container: 'custpage_filran2'
            });

            var dia_evento = form.addField({
                id: 'custpage_date_event',
                label: Devent,
                type: UI.FieldType.DATE,
                container: 'custpage_filran2'
            });


            //PERIOD CON CALENDAR FISCAL
            var periodo_mensual = form.addField({
                id: 'custpage_custom_period',
                label: 'PERIODO CONTABLE',
                type: UI.FieldType.SELECT,
                container: 'custpage_filran2'
            });

            //DATE CONSTITUTION
            var Chec_adjusment = form.addField({
                id: 'custpage_lmry_date_constitution',
                label: 'CONSTITUTION DATE',
                type: UI.FieldType.CHECKBOX,
                container: 'custpage_filran2'
            });

            /*
            log.debug('antes calendar',varFlagCalendar);

            if (!(varFlagCalendar || varFlagCalendar == 'T')) {
                log.debug('paso calendar');
                var periodMensualSearch = SEARCH.create({
                    type: "accountingperiod",
                    filters: [
                        ["isadjust", "is", "F"],
                        "AND", ["isquarter", "is", "F"],
                        "AND", ["isinactive", "is", "F"],
                        "AND", ["isyear", "is", "F"],
                    ],
                    columns: [
                        SEARCH.createColumn({
                            name: "internalid",
                            label: "Internal ID"
                        }),
                        SEARCH.createColumn({
                            name: "periodname",
                            label: "Name"
                        }),
                        SEARCH.createColumn({
                            name: "startdate",
                            sort: SEARCH.Sort.ASC,
                            label: "Start Date"
                        })
                    ]
                });

                var resultado = periodMensualSearch.run().getRange(0, 1000);

                periodo_mensual.addSelectOption({
                    value: '',
                    text: ''
                });

                if (resultado != null) {
                    for (var i = 0; i < resultado.length; i++) {
                        periodo_mensual.addSelectOption({
                            value: resultado[i].getValue('internalid'),
                            text: resultado[i].getValue('periodname')
                        });

                    }
                }

            }
            */
            //=====================================

            //Para el dirf Campo Codigo Añoptimize
            var anio_codigo = form.addField({
                id: 'custpage_codigo_anio',
                label: IdAnu,
                type: UI.FieldType.TEXT,
                container: 'custpage_filran2'
            });

            var varGrupoEspecial = form.addFieldGroup({
                id: 'custpage_filran3',
                label: CritEspe
            });

            if (varFlagMultiB == true || varFlagMultiB == 'T') {
                // variable - tipo - etiqueta - List/Record - grupo
                var varFieldMultiB = form.addField({
                    id: 'custpage_multibook',
                    label: 'MULTIBOOK',
                    type: UI.FieldType.SELECT,
                    container: 'custpage_filran3'
                });

                varFieldMultiB.isMandatory = true;

                var Filter_Custo = new Array();
                var search_MultiB = SEARCH.create({
                    type: SEARCH.Type.ACCOUNTING_BOOK,
                    columns: ['internalid', 'name']
                });

                var resul_multib = search_MultiB.run();
                var varRecordMultiB = resul_multib.getRange({
                    start: 0,
                    end: 1000
                });
                if (varRecordMultiB != null && varRecordMultiB.length > 0) {

                    // Llena una linea vacia
                    varFieldMultiB.addSelectOption({
                        value: 0,
                        text: ' '
                    });

                    // Llenado de listbox
                    for (var i = 0; i < varRecordMultiB.length; i++) {
                        var subID = varRecordMultiB[i].getValue('internalid');
                        var subNM = varRecordMultiB[i].getValue('name');
                        varFieldMultiB.addSelectOption({
                            value: subID,
                            text: subNM
                        });
                    }
                }
            }

            /* ************************************************************
             * Realiza busqueda por todos los campos agregados en la tabla
             * de filtros de reportes
             * ***********************************************************/

            var transacdata = SEARCH.load({
                id: 'customsearch_lmry_br_filter_report'
            });
            var auxfield = '';

            ColIdFilter = SEARCH.createColumn({
                name: 'custrecord_lmry_br_filter_id'
            });
            ColTypeFilter = SEARCH.createColumn({
                name: 'custrecord_lmry_br_filter_field_type'
            });
            ColLabelFilter = SEARCH.createColumn({
                name: 'custrecord_lmry_br_filter_field_label'
            });
            ColListFilter = SEARCH.createColumn({
                name: 'custrecord_lmry_br_filter_list_record'
            });
            ColHelpFilter = SEARCH.createColumn({
                name: 'custrecord_lmry_br_filter_field_help'
            });
            transacdata.colums = [ColIdFilter, ColTypeFilter, ColLabelFilter, ColListFilter, ColHelpFilter];

            var resul_transac = transacdata.run();
            var varRecordTransac = resul_transac.getRange({
                start: 0,
                end: 1000
            });



            if (varRecordTransac != null && varRecordTransac.length > 0) {

                for (var i = 0; i < varRecordTransac.length; i++) {
                    var idField = varRecordTransac[i].getValue('custrecord_lmry_br_filter_id');
                    var tipoField = varRecordTransac[i].getValue('custrecord_lmry_br_filter_field_type');
                    var lblField = varRecordTransac[i].getValue('custrecord_lmry_br_filter_field_label');
                    var listaRec = varRecordTransac[i].getValue('custrecord_lmry_br_filter_list_record');
                    if (listaRec == '') {
                        listaRec = null;
                    }
                    var ayudaField = varRecordTransac[i].getValue('custrecord_lmry_br_filter_field_help');
                    /* ************************************************************
                     * Agregando los campos, definidos en un registro personalizado
                     * varIdField       = ID Field
                     * tipoField    = Type
                     * lblField     = label
                     * listaRec     = List/Record
                     * ************************************************************/
                    if (auxfield != idField && idField != '' && idField != null && idField != 'custpage_locagroup' && idField != 'custpage_multibook') {
                        auxfield = idField;
                        var addFieldAux = form.addField({
                            id: idField,
                            label: lblField,
                            type: tipoField.toUpperCase(),
                            source: listaRec,
                            container: 'custpage_filran2'
                        });

                    }
                }
            }

            //REINF - Generar R-1000
            var fieldGenR1000 = form.addField({
                id: 'custpage_lmry_gen_r1000',
                type: UI.FieldType.CHECKBOX,
                label: InclR1000,
                container: 'custpage_filran2'
            });

            //ECD - Generar I100
            /*var fieldGenR1000 = form.addField({
                id: 'custpage_lmry_gen_i100',
                type: UI.FieldType.CHECKBOX,
                label: 'Generar I100',
                container: 'custpage_filran2'
            });*/

            //Tipo de declaracion
            var fieldTipDecla = form.addField({
                id: 'custpage_lmry_tipo_decla',
                type: UI.FieldType.SELECT,
                label: tipoDecl,
                container: 'custpage_filran2'
            });

            if (language == 'es') {
                var orig = 'Original';
                var rect = 'Rectificatoria';
            } else if (language == 'pt') {
                var orig = 'Original';
                var rect = 'Retificação';
            } else {
                var orig = 'Original';
                var rect = 'Rectification';
            }

            fieldTipDecla.addSelectOption({
                value: 0,
                text: orig
            });
            fieldTipDecla.addSelectOption({
                value: 1,
                text: rect
            });

            var fieldNroRecti = form.addField({
                id: 'custpage_lmry_nro_recti',
                type: UI.FieldType.TEXT,
                label: numRect,
                container: 'custpage_filran2'
            });

            //Numero de Orden del ecd para el ecf
            var fieldNumOrden = form.addField({
                id: 'custpage_lmry_num_orden_ecf',
                type: UI.FieldType.INTEGER,
                label: NumOrdECD,
                container: 'custpage_filran2'
            });

            //Cod version del ecd para el ecf
            var fieldNumOrden = form.addField({
                id: 'custpage_lmry_cod_vers_ecd',
                type: UI.FieldType.INTEGER,
                label: 'CODIGO DE VERSION - ECD',
                container: 'custpage_filran2'
            });

            //==================================================

            //========Filtros ECD ==============
            //Tipo de declaracion
            var fieldTipDeclaECD = form.addField({
                id: 'custpage_lmry_tipo_decla_ecd',
                type: UI.FieldType.SELECT,
                label: tipoDeclECD,
                container: 'custpage_filran2'
            });

            if (language == 'es') {
                var origi = 'Original';
                var sust = 'Sustituto';
            } else if (language == 'pt') {
                var origi = 'Original';
                var sust = 'Substituto';
            } else {
                var origi = 'Original';
                var sust = 'Substitute';
            }

            fieldTipDeclaECD.addSelectOption({
                value: 0,
                text: origi
            });
            fieldTipDeclaECD.addSelectOption({
                value: 1,
                text: sust
            });
            //Tipo de libro
            var fieldTipLibroECD = form.addField({
                id: 'custpage_lmry_tipo_libro_ecd',
                type: UI.FieldType.SELECT,
                label: tipLib,
                container: 'custpage_filran2'
            });

            if (language == 'es') {
                var LDiario = 'G - Libro diario (Completo sin contabilidad auxiliar)';
            } else if (language == 'pt') {
                var LDiario = 'G - Livro diário (Completo sem contabilidade auxiliar)';
            } else {
                var LDiario = 'G - Diary book (Complete without auxiliary accounting)';
            }

            fieldTipLibroECD.addSelectOption({
                value: 0,
                text: ''
            });
            fieldTipLibroECD.addSelectOption({
                value: 1,
                text: LDiario
            });
            /*
        fieldTipLibroECD.addSelectOption({
            value: 2,
            text: 'R - Libro diario con contabilidad resumida (con contabilidad auxiliar)'
        });
        fieldTipLibroECD.addSelectOption({
            value: 3,
            text: 'B - Balance diario y Balance general'
        });
*/
            //Numero de Orden
            var fieldNumOrden = form.addField({
                id: 'custpage_lmry_num_orden',
                type: UI.FieldType.INTEGER,
                label: numOrd,
                container: 'custpage_filran2'
            });

            //Filtro Lucro Contable
            var fieldLucroContable = form.addField({
                id: 'custpage_lmry_lucro_conta',
                type: UI.FieldType.TEXT,
                label: lucroCont,
                container: 'custpage_filran2'
            });

            //Monto Adicional
            var fieldMontoAdicional = form.addField({
                id: 'custpage_lmry_monto_adi',
                type: UI.FieldType.TEXT,
                label: montAdici,
                container: 'custpage_filran2'
            });

            //Monto Excluyente
            var fieldMontoExcluyente = form.addField({
                id: 'custpage_lmry_monto_exc',
                type: UI.FieldType.TEXT,
                label: montExcl,
                container: 'custpage_filran2'
            });

            //===================================

            varGrupoEspecial.setShowBorder = true;

            // Mensaje para el cliente
            var strhtml = "<html>";
            strhtml += "<table border='0' class='table_fields' cellspacing='0' cellpadding='0'>" +
                "<tr>" +
                "</tr>" +
                "<tr>" +
                "<td class='text'>" +
                "<div style=\"color: gray; font-size: 8pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver\">" + mensaje + "</div>" +
                "</td>" +
                "</tr>" +
                "</table>" +
                "</html>";

            var styleTag = '.bt1 {border:none; background:none;} .ic1 {width:18px;height:18px;}';

            var varInlineHtml = form.addField({
                id: 'custpage_btn',
                type: UI.FieldType.INLINEHTML,
                label: 'custpage_lmry_v1_message'
            }).updateLayoutType({
                layoutType: UI.FieldLayoutType.OUTSIDEBELOW
            }).updateBreakType({
                breakType: UI.FieldBreakType.STARTCOL
            }).defaultValue = strhtml;

            var varInlineHtml = form.addField({
                id: 'custpage_functions',
                type: UI.FieldType.INLINEHTML,
                label: ' '
            }).defaultValue = '<script>' + viewDetails + '</script><style>' + styleTag + '</style>';

            var tab = form.addTab({
                id: 'custpage_maintab',
                label: 'Tab'
            });
            //sublista
            var listaLog = form.addSublist({
                id: 'custpage_sublista',
                type: UI.SublistType.STATICLIST,
                label: logGe
            });
            listaLog.addField({
                id: 'custpage_lmry_rg_trandate',
                label: fechaCrea,
                type: UI.FieldType.TEXT
            });
            listaLog.addField({
                id: 'custpage_lmry_rg_transaction',
                label: info,
                type: UI.FieldType.TEXT
            });
            listaLog.addField({
                id: 'custpage_lmry_rg_postingperiod',
                label: perio,
                type: UI.FieldType.TEXT
            });
            listaLog.addField({
                id: 'custpage_lmry_rg_subsidiary',
                label: subsid,
                type: UI.FieldType.TEXT
            });


            /* ************************************************************
             * 2018/04/18 Verifica si esta activo la funcionalidad
             *  MULTI-BOOK ACCOUNTING - ID multibook
             * ***********************************************************/
            if (varFlagMultiB == true || varFlagMultiB == 'T') {
                listaLog.addField({
                    id: 'custpage_lmry_rg_multibook',
                    label: 'Multi Book',
                    type: UI.FieldType.TEXT
                });
            }
            listaLog.addField({
                id: 'custpage_lmry_rg_employee',
                label: creado,
                type: UI.FieldType.TEXT
            });
            listaLog.addField({
                id: 'custpage_lmry_rg_nombre',
                label: nombreArc,
                type: UI.FieldType.TEXT
            });
            listaLog.addField({
                id: 'custpage_lmry_rg_archivo',
                label: descarg,
                type: UI.FieldType.TEXT
            });
            listaLog.addField({
                id: 'custpage_lmry_rg_button',
                label: staRe,
                type: UI.FieldType.TEXT
            });

            listaLog.addRefreshButton();

            var varLogData = SEARCH.load({
                id: 'customsearch_lmry_br_rpt_generator_log'
            });

            var reportFederal = SEARCH.createFilter({
                name: 'custrecord_lmry_br_class_report',
                join: 'custrecord_lmry_br_rg_report_record',
                operator: SEARCH.Operator.IS,
                values: 'F'
            });

            varLogData.filters.push(reportFederal);
            var resul_LogData = varLogData.run();
            var varRecordLog = resul_LogData.getRange({
                start: 0,
                end: 1000
            });


            var details = '',
                linktext = '',
                buttonText = '',
                url, status = 1,
                tipoOperacion = 'E';
            var jsonImages = obtenerUrlImagenes();
            var TICK_ICON = '<img class="ic1" src="' + jsonImages['check'] + '"/>';

            var ERROR_ICON = '<img class="ic1" src="' + jsonImages['error'] + '"/>';

            for (var i = 0; varRecordLog != null && i < varRecordLog.length; i++) {
                buttonText = '';
                linktext = ''
                searchresult = varRecordLog[i];

                // var periodname = searchresult.getValue('custrecord_lmry_mx_rg_postingperiod');
                url = searchresult.getValue('custrecord_lmry_br_rg_url_file');
                details = searchresult.getValue('custrecord_lmry_br_details_report');
                if (url != null && url != '') {
                    linktext = '<a target="_blank" download href="' + searchresult.getValue('custrecord_lmry_br_rg_url_file') + '">' + descarga + '</a>';
                }

                if (details || details.length != 0) {
                    // log.debug('details ' + i + ': ', details);
                    /*
                detailsJson = JSON.parse(details.replace(/'/g,'"'));

                status = JSON.parse(details.replace(/'/g,'"'))['status'];
                tipoOperacion = JSON.parse(details.replace(/'/g,'"'))['type'];
*/
                    detailsHTML = details.replace(/"/g, "'");
                    status = JSON.parse(details)["status"];
                    tipoOperacion = JSON.parse(details)["type"];
                    if ((tipoOperacion == 'E' && (status == 0 || status == 2)) || (tipoOperacion == 'C' && status == 1)) {
                        buttonText = '<button class="bt1" onclick="viewDetails(' + detailsHTML + ')">' + TICK_ICON + '</button>';
                    } else if ((tipoOperacion == 'E' && status == 1) || (tipoOperacion == 'C' && (status == 0 || status == 3))) {
                        buttonText = '<button class="bt1" onclick="viewDetails(' + detailsHTML + ')">' + ERROR_ICON + '</button>';
                    }
                    //log.debug('Numero de Caracteres', buttonText.length);
                }

                var creat = searchresult.getValue('created');
                if (creat != null && creat != '') {
                    listaLog.setSublistValue({
                        id: 'custpage_lmry_rg_trandate',
                        line: i,
                        value: creat
                    });
                }

                var transact = searchresult.getValue('custrecord_lmry_br_rg_report');
                if (transact != null && transact != '') {
                    listaLog.setSublistValue({
                        id: 'custpage_lmry_rg_transaction',
                        line: i,
                        value: transact
                    });
                }

                var subsi = searchresult.getValue('custrecord_lmry_br_rg_subsidiary');
                if (subsi != null && subsi != '') {
                    listaLog.setSublistValue({
                        id: 'custpage_lmry_rg_subsidiary',
                        line: i,
                        value: subsi
                    });
                }

                var postingPeri = searchresult.getValue('custrecord_lmry_br_rg_period');
                if (postingPeri != null && postingPeri != '') {
                    listaLog.setSublistValue({
                        id: 'custpage_lmry_rg_postingperiod',
                        line: i,
                        value: postingPeri
                    });
                }

                if (varFlagMultiB == true || varFlagMultiB == 'T') {

                    var mult = searchresult.getValue('custrecord_lmry_br_rg_multibook');
                    if (mult != null && mult != '') {
                        listaLog.setSublistValue({
                            id: 'custpage_lmry_rg_multibook',
                            line: i,
                            value: mult
                        });
                    }
                }

                var empleado = searchresult.getValue('custrecord_lmry_br_rg_employee');
                if (empleado != null && empleado != '') {
                    listaLog.setSublistValue({
                        id: 'custpage_lmry_rg_employee',
                        line: i,
                        value: empleado
                    });
                }

                var nomb = searchresult.getValue('custrecord_lmry_br_rg_name_field');

                if (language == 'es') {
                    var pendi = 'Pendiente';
                    var OcErr = 'Ocurrio un error inesperado en la ejecucion del reporte.';
                    var noExiInf = 'No existe informacion para los criterios seleccionados.';
                    var errConf = 'No se ha configurado correctamente.';
                } else if (language == 'pt') {
                    var pendi = 'Pendente';
                    var OcErr = 'Ocorreu um erro inesperado ao executar o relatório.';
                    var noExiInf = 'Não há informações para os critérios selecionados.'
                    var errConf = 'Não foi configurado correctamente.';
                } else {
                    var pendi = 'Pending';
                    var OcErr = 'An unexpected error occurred while executing the report.';
                    var noExiInf = 'There is no information for the selected criteria.';
                    var errConf = 'Not correctly configured.';
                }
                if (nomb == 'Pendiente' || nomb == 'Pendente' || nomb == 'Pending') {
                    nomb = pendi;
                } else if (nomb == 'Ocurrio un error inesperado en la ejecucion del reporte.' ||
                    nomb == 'Ocorreu um erro inesperado ao executar o relatório.' ||
                    nomb == 'An unexpected error occurred while executing the report.') {
                    nomb = OcErr;
                } else if (nomb == 'No existe informacion para los criterios seleccionados.' ||
                    nomb == 'Não há informações para os critérios selecionados.' ||
                    nomb == 'There is no information for the selected criteria.') {
                    nomb = noExiInf;
                } else if (nomb == 'No se ha configurado correctamente.' ||
                    nomb == 'Não foi configurado correctamente.' ||
                    nomb == 'Not correctly configured.') {
                    nomb = errConf;
                }

                if (nomb != null && nomb != '') {
                    listaLog.setSublistValue({
                        id: 'custpage_lmry_rg_nombre',
                        line: i,
                        value: nomb
                    });
                }

                if (linktext != '') {
                    listaLog.setSublistValue({
                        id: 'custpage_lmry_rg_archivo',
                        line: i,
                        value: linktext
                    });
                }
                if (buttonText != '') {
                    listaLog.setSublistValue({
                        id: 'custpage_lmry_rg_button',
                        line: i,
                        value: buttonText
                    });
                }

            }
            // Botones del formulario
            form.addSubmitButton(generar);
            form.addResetButton(cancel);
            //Llama al cliente
            form.clientScriptModulePath = './SMC_BR_FederalReportGenerator_CLNT_V2.0.js';


            context.response.writePage(form);
        }

        if (varMethod == 'POST') {


            //Valida si es OneWorld
            var varFlagSubsi = RUNTIME.isFeatureInEffect({
                feature: "SUBSIDIARIES"
            });
            var varFlagMultiB = RUNTIME.isFeatureInEffect({
                feature: "MULTIBOOK"
            });


            /*********************************************
             * Regista en el log de generacion de archivos
             ********************************************/
            var idrpts = context.request.parameters.custpage_lmry_reporte;
            var varReport = SEARCH.lookupFields({
                type: 'customrecord_lmry_br_features',
                id: idrpts,
                columns: ['custrecord_lmry_br_id_schedule', 'custrecord_lmry_br_id_deploy', 'name']
            });

            var arr_id = [];
            if (idrpts == 10) {
                arr_id = BusquedaByVersion(idrpts, context);
                varReport.custrecord_lmry_br_id_schedule = arr_id[0];
                varReport.custrecord_lmry_br_id_deploy = arr_id[1];
            }

            var varTituloInforme = varReport.name;

            var varIdSchedule = varReport.custrecord_lmry_br_id_schedule;
            var varIdDeploy = varReport.custrecord_lmry_br_id_deploy;

            var objUser = RUNTIME.getCurrentUser();

            var varEmployee = SEARCH.lookupFields({
                type: 'employee',
                id: objUser.id,
                columns: ['firstname', 'lastname']
            });
            var varEmployeeName = varEmployee.firstname + ' ' + varEmployee.lastname;

            var id_anio = context.request.parameters.custpage_anio;
            //Creacion de la linea en el log de errores
            var varLogRecord = RECORD.create({
                type: 'customrecord_lmry_br_rpt_generator_log'
            });

            var subsidiaryId = context.request.parameters.custpage_subsidiary;
            taxFiscalCalendar = ObtenerConfigFeature(subsidiaryId, 681);

            if (idrpts == 6 || idrpts == 10 || idrpts == 14 || idrpts == 12) { // DIRF - ECF - BR DIMOB - ECD
                if ((taxFiscalCalendar || taxFiscalCalendar == 'T') && (idrpts == 6)) {
                    log.debug("Llego aqui", id_anio);
                    var busqueda_anio = SEARCH.lookupFields({
                        type: SEARCH.Type.TAX_PERIOD,
                        id: id_anio,
                        columns: ['periodname']
                    });
                } else {
                    var busqueda_anio = SEARCH.lookupFields({
                        type: 'accountingperiod',
                        id: id_anio,
                        columns: ['periodname']
                    });
                }

                var anio = busqueda_anio.periodname;
                log.debug("Se cae aqui", anio);
                anio = anio.substring(anio.length - 4, anio.length);
                log.debug("Paso el Se cae aqui", "hola mundo");
                varLogRecord.setValue('custrecord_lmry_br_rg_period', anio);

            } else if (idrpts == 1 || idrpts == 5) { //DCTF - REINF

                if (taxFiscalCalendar || taxFiscalCalendar == 'T') {
                    var periodField = SEARCH.lookupFields({
                        type: 'taxperiod',
                        id: context.request.parameters.custpage_custom_period,
                        columns: ['periodname']
                    });

                } else {
                    var periodField = SEARCH.lookupFields({
                        type: 'accountingperiod',
                        id: context.request.parameters.custpage_custom_period,
                        columns: ['periodname']
                    });

                }

                var periodName = periodField.periodname;
                varLogRecord.setValue('custrecord_lmry_br_rg_period', periodName);

            } else {
                //Period Name
                var varPeriodo = SEARCH.lookupFields({
                    type: 'accountingperiod',
                    id: context.request.parameters.custpage_custom_period,
                    columns: ['periodname']
                });
                var periodName = varPeriodo.periodname;
                varLogRecord.setValue('custrecord_lmry_br_rg_period', periodName);
            }

            if (language == 'es') {
                var Pendiente = "Pendiente";
            } else if (language == 'pt') {
                var Pendiente = "Pendente";
            } else {
                var Pendiente = "Pending";
            }

            varLogRecord.setValue('custrecord_lmry_br_rg_name_field', Pendiente);
            varLogRecord.setValue('custrecord_lmry_br_rg_report', varTituloInforme);


            if (varFlagSubsi == true || varFlagSubsi == 'T') //EN ALGUNAS INSTANCIAS DEVUELVE CADENA OTRAS DEVUELVE BOOLEAN
            {
                // Trae el nombre de la subsidiaria
                var varSubsidiary = SEARCH.lookupFields({
                    type: 'subsidiary',
                    id: context.request.parameters.custpage_subsidiary,
                    columns: ['legalname']
                });

                varLogRecord.setValue('custrecord_lmry_br_rg_subsidiary', varSubsidiary.legalname);
            }


            if (varFlagMultiB == true || varFlagMultiB == 'T') {
                // Descripcion del MultiBook
                var varIdBook = context.request.parameters.custpage_multibook;
                var varMultiBook = SEARCH.lookupFields({
                    type: 'accountingbook',
                    id: varIdBook,
                    columns: ['name']
                });
                varLogRecord.setValue('custrecord_lmry_br_rg_multibook', varMultiBook.name);
            }


            varLogRecord.setValue('custrecord_lmry_br_rg_url_file', '');
            varLogRecord.setValue('custrecord_lmry_br_rg_employee', varEmployeeName);
            varLogRecord.setValue('custrecord_lmry_br_rg_report_record', idrpts);
            var rec_id = varLogRecord.save();

            /*********************************************
             * Pasa los parametros para los reportes
             ********************************************/
            var params = {};
            /***************************  Reporte DCTF UNIFICADO  **************************************/
            params['custscript_smc_br_rpt_dctf_mpr_periodo'] = context.request.parameters.custpage_custom_period;
            params['custscript_smc_br_rpt_dctf_mpr_recordid'] = rec_id;
            if (varFlagSubsi == true || varFlagSubsi == 'T') {
                params['custscript_smc_br_rpt_dctf_mpr_subsidia'] = context.request.parameters.custpage_subsidiary;
            }
            if (varFlagMultiB == true || varFlagMultiB == 'T') {
                params['custscript_smc_br_rpt_dctf_mpr_multiboo'] = context.request.parameters.custpage_multibook;
            }
            params['custscript_smc_br_rpt_dctf_mpr_feature'] = idrpts;
            //params['custscript_smc_br_rpt_dctf_periodicidad'] = context.request.parameters.custpage_lmry_periodicidad;
            params['custscript_smc_br_rpt_dctf_mpr_tipo_dec'] = context.request.parameters.custpage_lmry_tipo_decla;
            params['custscript_smc_br_rpt_dctf_mpr_rectific'] = context.request.parameters.custpage_lmry_nro_recti;
            params['custscript_smc_br_rpt_dctf_mpr_lucro'] = context.request.parameters.custpage_lmry_lucro_conta;
            params['custscript_smc_br_rpt_dctf_mpr_monto_ad'] = context.request.parameters.custpage_lmry_monto_adi;
            params['custscript_smc_br_rpt_dctf_mpr_monto_ex'] = context.request.parameters.custpage_lmry_monto_exc;
            params['custscript_smc_br_rpt_dctf_mpr_excel'] = context.request.parameters.custpage_insert_xcl;
            /*******************************************************************************************/
            // Reporte BR EFD
            params['custscript_lmry_br_rpt_efd_idfeature'] = idrpts;
            params['custscript_lmry_br_rpt_efd_periodo'] = context.request.parameters.custpage_custom_period;
            params['custscript_lmry_br_rpt_efd_recorid'] = rec_id;
            if (varFlagSubsi == true || varFlagSubsi == 'T') {
                params['custscript_lmry_br_rpt_efd_subsi'] = context.request.parameters.custpage_subsidiary;
            }

            if (varFlagMultiB == true || varFlagMultiB == 'T') {
                params['custscript_lmry_br_rpt_efd_multi'] = context.request.parameters.custpage_multibook;
            }
            params['custscript_lmry_br_rpt_efd_type_decla'] = context.request.parameters.custpage_lmry_tipo_decla;
            params['custscript_lmry_br_rpt_efd_num_recti'] = context.request.parameters.custpage_lmry_nro_recti;

            // Reporte BR DIRF
            params['custscript_lmry_br_dirf_dec_feature'] = idrpts;
            params['custscript_lmry_br_dirf_dec_anio_calenda'] = context.request.parameters.custpage_anio;
            params['custscript_lmry_br_dirf_dec_recordid'] = rec_id;
            if (varFlagSubsi == true || varFlagSubsi == 'T') {
                params['custscript_lmry_br_dirf_dec_subsidiaria'] = context.request.parameters.custpage_subsidiary;
            }
            if (varFlagMultiB == true || varFlagMultiB == 'T') {
                params['custscript_lmry_br_dirf_dec_mutltibook'] = context.request.parameters.custpage_multibook;
            }
            params['custscript_lmry_br_dirf_dec_tipo_declara'] = context.request.parameters.custpage_lmry_tipo_decla;
            params['custscript_lmry_br_dirf_dec_num_rectific'] = context.request.parameters.custpage_lmry_nro_recti;
            params['custscript_lmry_br_dirf_dec_dia_evento'] = context.request.parameters.custpage_date_event;
            //campo  de identificador de codigo de año del dirf hoy 29/01/2020
            params['custscript_lmry_br_dirf_dec_cod_anio'] = context.request.parameters.custpage_codigo_anio;
            //para auditoria
            params['custscript_lmry_br_dirf_dec_auditoria'] = context.request.parameters.custpage_insert_xcl

            //*****************************///***************************//
            // Reporte BR EFD MPRD 21/01/2020
            params['custscript_lmry_br_efd_id_report_mprd'] = idrpts;
            params['custscript_lmry_br_efd_period_mprd'] = context.request.parameters.custpage_custom_period;
            params['custscript_lmry_br_efd_id_record_mprd'] = rec_id;
            if (varFlagSubsi == true || varFlagSubsi == 'T') {
                params['custscript_lmry_br_efd_subsi_mprd'] = context.request.parameters.custpage_subsidiary;
            }

            if (varFlagMultiB == true || varFlagMultiB == 'T') {
                params['custscript_lmry_br_efd_multi_mprd'] = context.request.parameters.custpage_multibook;
            }
            params['custscript_lmry_br_efd_tipo_decla_mprd'] = context.request.parameters.custpage_lmry_tipo_decla;
            params['custscript_lmry_br_efd_num_recti_mprd'] = context.request.parameters.custpage_lmry_nro_recti;
            // Reporte BR EFD BLOQUE D MPRD 21/01/2020
            params['custscript_lmry_br_efd_d_id_report_mprd'] = idrpts;
            params['custscript_lmry_br_efd_d_period_mprd'] = context.request.parameters.custpage_custom_period;
            params['custscript_lmry_br_efd_d_id_record_mprd'] = rec_id;
            if (varFlagSubsi == true || varFlagSubsi == 'T') {
                params['custscript_lmry_br_efd_d_subsi_mprd'] = context.request.parameters.custpage_subsidiary;
            }

            if (varFlagMultiB == true || varFlagMultiB == 'T') {
                params['custscript_lmry_br_efd_d_multi_mprd'] = context.request.parameters.custpage_multibook;
            }
            params['custscript_lmry_br_efd_d_tipo_decla_mprd'] = context.request.parameters.custpage_lmry_tipo_decla;
            params['custscript_lmry_br_efd_d_num_recti_mprd'] = context.request.parameters.custpage_lmry_nro_recti;
            //*****************************///***************************//
            // Reporte BR Reinf EFD
            params['custscript_lmry_br_rpt_edf_idfeature'] = idrpts;
            params['custscript_lmry_br_rpt_edf_periodo'] = context.request.parameters.custpage_custom_period;
            params['custscript_lmry_br_rpt_edf_recorid'] = rec_id;
            params['custscript_lmry_br_rpt_edf_xcel'] = context.request.parameters.custpage_insert_xcl;
            params['custscript_lmry_br_rpt_efd_gen_r1000'] = context.request.parameters.custpage_lmry_gen_r1000;
            if (varFlagSubsi == true || varFlagSubsi == 'T') {
                params['custscript_lmry_br_rpt_edf_subsi'] = context.request.parameters.custpage_subsidiary;
            }
            if (varFlagMultiB == true || varFlagMultiB == 'T') {
                params['custscript_lmry_br_rpt_edf_multi'] = context.request.parameters.custpage_multibook;
            }
            params['custscript_lmry_br_rpt_edf_type_decla'] = context.request.parameters.custpage_lmry_tipo_decla;
            params['custscript_lmry_br_rpt_edf_num_recti'] = context.request.parameters.custpage_lmry_nro_recti;
            params['custscript_lmry_br_rpt_edf_idrpt'] = idrpts;
            /*-------------------------------------------------------------------------------------------------------------
            -----------------------------    REPORTE BRAZIL - ECF (GERAL) 09/01/2020    -----------------------------------
            --------------------------------------------------------------------------------------------------------------- */
            if (idrpts == 10) {
                if (arr_id[2] == 1) {
                    params['custscript_br_ecf_mprd_idlog'] = idrpts;
                    params['custscript_br_ecf_mprd_periodo'] = context.request.parameters.custpage_anio;
                    params['custscript_br_ecf_mprd_recordid'] = rec_id;
                    if (varFlagSubsi == true || varFlagSubsi == 'T') {
                        params['custscript_br_ecf_mprd_subsi'] = context.request.parameters.custpage_subsidiary;
                    }
                    if (varFlagMultiB == true || varFlagMultiB == 'T') {
                        params['custscript_br_ecf_mprd_multi'] = context.request.parameters.custpage_multibook;
                    }
                    params['custscript_br_ecf_mprd_tipodecla'] = context.request.parameters.custpage_lmry_tipo_decla;
                    params['custscript_br_ecf_mprd_num_rectificat'] = context.request.parameters.custpage_lmry_nro_recti;
                    params['custscript_lmry_br_ecf_num_orden'] = context.request.parameters.custpage_lmry_num_orden_ecf;

                } else if (arr_id[2] == 2) {
                    params['custscript_br_ecf_mprd_idlog_v7'] = idrpts;
                    params['custscript_br_ecf_mprd_periodo_v7'] = context.request.parameters.custpage_anio;
                    params['custscript_br_ecf_mprd_recordid_v7'] = rec_id;
                    //params['custscript_br_ecf_idbyversion'] = arr_id[2];

                    if (varFlagSubsi == true || varFlagSubsi == 'T') {
                        params['custscript_br_ecf_mprd_subsi_v7'] = context.request.parameters.custpage_subsidiary;
                    }
                    if (varFlagMultiB == true || varFlagMultiB == 'T') {
                        params['custscript_br_ecf_mprd_multi_v7'] = context.request.parameters.custpage_multibook;
                    }
                    params['custscript_br_ecf_mprd_tipodecla_v7'] = context.request.parameters.custpage_lmry_tipo_decla;
                    params['custscript_br_ecf_mprd_num_rectific_v7'] = context.request.parameters.custpage_lmry_nro_recti;
                    params['custscript_br_ecf_mprd_num_orden_v7'] = context.request.parameters.custpage_lmry_num_orden_ecf;

                    params['custscript_br_ecf_date_constitution'] = context.request.parameters.custpage_lmry_date_constitution;
                    params['custscript_br_ecf_codver_ecd'] = context.request.parameters.custpage_lmry_cod_vers_ecd;
                    LOG.debug('params', params);

                }
            }

            /*-------------------------------------------------------------------------------------------------------------
            -----------------------------    REPORTE BRAZIL - ECD  21/02/2020   libro G -----------------------------------
            --------------------------------------------------------------------------------------------------------------- */
            params['custscript_lmry_br_ecd_mprd_idrep'] = idrpts;
            params['custscript_lmry_br_ecd_mprd_period'] = context.request.parameters.custpage_anio;
            params['custscript_lmry_br_ecd_mprd_idlog'] = rec_id;
            if (varFlagSubsi == true || varFlagSubsi == 'T') {
                params['custscript_lmry_br_ecd_mprd_subsi'] = context.request.parameters.custpage_subsidiary;
            }
            if (varFlagMultiB == true || varFlagMultiB == 'T') {
                params['custscript_lmry_br_ecd_mprd_multi'] = context.request.parameters.custpage_multibook;
            }
            params['custscript_lmry_br_ecd_mprd_dectype'] = context.request.parameters.custpage_lmry_tipo_decla_ecd;
            params['custscript_lmry_br_ecd_mprd_booktype'] = context.request.parameters.custpage_lmry_tipo_libro_ecd;
            params['custscript_lmry_br_ecd_mprd_num_orden'] = context.request.parameters.custpage_lmry_num_orden;
            //params['custscript_lmry_br_ecd_mprd_gen_i100'] = context.request.parameters.custpage_lmry_gen_i100;
            params['custscript_lmry_br_ecd_mprd_constitution'] = context.request.parameters.custpage_lmry_date_constitution;

            //==============================================================================================================

            try {

                if (idrpts == 1 || idrpts == 6 || idrpts == 7 || idrpts == 8 || idrpts == 9 || idrpts == 4 || idrpts == 11 || idrpts == 14 || idrpts == 10 || idrpts == 12 || idrpts == 13 || idrpts == 2) {
                    var Tipo_Script = TASK.TaskType.MAP_REDUCE;
                } else {
                    var Tipo_Script = TASK.TaskType.SCHEDULED_SCRIPT;
                }

                varIdSchedule = 'customscript_smc_br_dctf_imp_mprd';
                varIdDeploy = 'customdeploy_smc_br_dctf_imp_mprd';

                if (idrpts == 12) {
                    var name_libro = (context.request.parameters.custpage_lmry_tipo_libro_ecd);
                    name_libro = name_libro.substring(0, 1);
                    LOG.debug('name_libro', name_libro);
                    if (name_libro == 1) {
                        var RedirecSchdl = TASK.create({
                            taskType: Tipo_Script,
                            scriptId: varIdSchedule,
                            deploymentId: varIdDeploy,
                            params: params
                        });
                    } else if (name_libro == 2) {
                        var RedirecSchdl = TASK.create({
                            taskType: Tipo_Script,
                            scriptId: varIdSchedule,
                            deploymentId: varIdDeploy,
                            params: params
                        });
                    } else {
                        var RedirecSchdl = TASK.create({
                            taskType: Tipo_Script,
                            scriptId: varIdSchedule,
                            deploymentId: varIdDeploy,
                            params: params
                        });
                    }
                } else {
                    var RedirecSchdl = TASK.create({
                        taskType: Tipo_Script,
                        scriptId: varIdSchedule,
                        deploymentId: varIdDeploy,
                        params: params
                    });
                }

                RedirecSchdl.submit();

                REDIRECT.toSuitelet({

                    scriptId: 'customscript_smc_br_federal_rptgen_stlt',
                    deploymentId: 'customdeploy_smc_br_federal_rptgen_stlt',
                    parameters: {
                        null: null
                    }
                });
            } catch (err) {
                if (language == 'es') {
                    var varMsgError = 'No se puede procesar dado que hay un proceso pendiente en la cola';
                } else if (language == 'pt') {
                    var varMsgError = 'Não pode ser processado porque existe um processo pendente na fila';
                } else {
                    var varMsgError = 'Cannot be processed as there is a pending process in the queue';
                }
                LIB_FEATURE.CreacionFormError(namereport, LMRY_script, varMsgError, err);

            }

        }
    } catch (err) {
        if (language == 'es') {
            var varMsgError = 'Importante: El acceso no esta permitido.';
        } else if (language == 'pt') {
            var varMsgError = 'Importante: o acesso não é permitido.';
        } else {
            var varMsgError = 'Important: Access is not allowed.';
        }
        LIB_FEATURE.CreacionFormError(namereport, LMRY_script, varMsgError, err);
        //sendemail(err, LMRY_script);
    }
    return;
}

function viewDetails(logDetails) {
    require(["N/xml", "N/record", "N/search", "N/format", "N/runtime"],
        function(xml, record, search, format, runtime) {

            console.log('Resultado: ', logDetails);
            language = runtime.getCurrentScript().getParameter("LANGUAGE").substring(0, 2);

            if (language == 'es') {
                var RegPer = 'Se encontro un registro para el periodo ';
                var NRegPer = 'No se encontro registro dentro del sistema REINF para el periodo ';
                var EnconRegID = 'Se encontro el registro para el proveedor/cliente con ID: ';
                var EnconReg = 'Se encontro un registro';
                var NEnconRegID = 'No se encontro registro para el proveedor/cliente con ID: ';
                var NEnconReg = 'No se encontro registro';
                var RegFec = 'Se encontro el registro registrado en la fecha siguiente: ';
            } else if (language == 'pt') {
                var RegPer = 'Um registro foi encontrado para o período ';
                var NRegPer = 'Nenhum registro foi encontrado no sistema REINF para o período ';
                var EnconRegID = 'Registro encontrado para fornecedor/cliente com ID: ';
                var EnconReg = 'Um registro foi encontrado';
                var NEnconRegID = 'Nenhum registro encontrado para fornecedor/cliente com ID: ';
                var NEnconReg = 'Nenhum Registro Encontrado';
                var RegFec = 'O registro registrado foi encontrado na seguinte data: ';
            } else {
                var RegPer = 'A record was found for the period ';
                var NRegPer = 'No record was found within the REINF system for the period ';
                var EnconRegID = 'Found record for vendor/customer with ID: ';
                var EnconReg = 'A record was found';
                var NEnconRegID = 'No record found for vendor/customer with ID: ';
                var NEnconReg = 'No record found';
                var RegFec = 'The registered record was found on the following date: ';
            }

            function obtenerXmlDocument(baseUrl, fileId) {
                var url = baseUrl + fileId;
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                xhr.send();
                return xhr.responseXML;
            }

            function verificarConsultaR1000(xmlDocument, periodo) {
                var respuestaArray = [],
                    identificador = "- - -",
                    nroRecibo = "- - -",
                    status = "";

                cdRetornoElementArray = xmlDocument.getElementsByTagName('cdRetorno');

                if (cdRetornoElementArray) {
                    cdRetorno = cdRetornoElementArray[0].textContent;

                    if (taxFiscalCalendar || taxFiscalCalendar == 'T') {
                        var periodRecord = search.lookupFields({
                            type: search.Type.TAX_PERIOD,
                            id: periodo,
                            columns: ['enddate', 'periodname']
                        });

                    } else {
                        var periodRecord = search.lookupFields({
                            type: search.Type.ACCOUNTING_PERIOD,
                            id: periodo,
                            columns: ['enddate', 'periodname']
                        });

                    }

                    if (cdRetorno == 1) {
                        eventoElementArray = xmlDocument.getElementsByTagName('evento');

                        if (eventoElementArray) {

                            var periodEndDateObject = format.parse({
                                type: format.Type.DATE,
                                value: periodRecord.enddate
                            });

                            var period = periodEndDateObject.getFullYear() + '-' + completar_cero(2, periodEndDateObject.getMonth() + 1);

                            for (var i = 0; i < eventoElementArray.length; i++) {
                                iniValidElement = eventoElementArray[i].firstChild;

                                if (period == iniValidElement.textContent) {
                                    status = RegPer + periodRecord.periodname;
                                    break;
                                }
                            }
                            status = NRegPer + periodRecord.periodname;
                        }
                    } else if (cdRetorno == 3) {
                        status = NRegPer + periodRecord.periodname;
                    }
                    respuestaArray.push([identificador, nroRecibo, status]);
                }

                return respuestaArray;
            }

            function verificarConsultaEventoPeriodicos(xmlDocument) {
                var respuestaArray = [],
                    identificador = "- - -",
                    nroRecibo = "- - -",
                    status = "";

                var reinfElementArray = xmlDocument.getElementsByTagName("Reinf");

                if (reinfElementArray) {
                    var cdRetorno = "",
                        entityId = "";
                    var ideStatusElementArray, eventoElementArray, ideStatusElement, eventoElement, encontroRegistro = false;

                    for (var i = 0; i < reinfElementArray.length; i++) {
                        ideStatusElementArray = reinfElementArray[i].getElementsByTagName("ideStatus");

                        ideStatusElement = ideStatusElementArray[0].children;

                        if (ideStatusElement) {
                            cdRetorno = ideStatusElement[0].textContent;
                            if (ideStatusElement[2]) {
                                entityId = ideStatusElement[2].textContent;
                            }
                        }
                        if (cdRetorno == 1) {
                            eventoElementArray = reinfElementArray[i].getElementsByTagName("evento");

                            if (eventoElementArray) {
                                for (var j = 0; j < eventoElementArray.length; j++) {
                                    //    console.log("eventoElementArray", eventoElementArray[j]);
                                    eventoElement = eventoElementArray[j].children;
                                    if (eventoElement[2].textContent != 3) {
                                        encontroRegistro = true;
                                        identificador = eventoElementArray[j].id;
                                        nroRecibo = eventoElement[1].textContent;
                                    }
                                }
                                if (encontroRegistro) {
                                    if (entityId) {
                                        status = EnconRegID + entityId;
                                    } else {
                                        status = EnconReg;
                                    }
                                } else {
                                    if (entityId) {
                                        status = NEnconRegID + entityId;
                                    } else {
                                        status = NEnconReg
                                    }
                                }
                            }
                        } else if (cdRetorno == 0) {
                            if (entityId) {
                                status = NEnconRegID + entityId;
                            } else {
                                status = NEnconReg
                            }
                        }
                        respuestaArray.push([identificador, nroRecibo, status]);
                    }
                }

                return respuestaArray;
            }

            function verificarConsultaR2099(xmlDocument, periodo) {
                var respuestaArray = [],
                    identificador = "- - -",
                    nroRecibo = "- - -",
                    status = "",
                    fecha;

                var reinfElementArray = xmlDocument.getElementsByTagName("Reinf");
                console.log("reinfElementArray", reinfElementArray);
                if (reinfElementArray) {
                    ideStatusElementArray = reinfElementArray[0].getElementsByTagName("ideStatus");

                    ideStatusElement = ideStatusElementArray[0].children;
                    console.log("ideStatusElement", ideStatusElement);
                    if (ideStatusElement) {
                        cdRetorno = ideStatusElement[0].textContent;

                        var periodRecord = search.lookupFields({
                            type: search.Type.ACCOUNTING_PERIOD,
                            id: periodo,
                            columns: ['enddate', 'periodname']
                        });

                        if (cdRetorno == 1) {

                            eventoElementArray = reinfElementArray[i].getElementsByTagName("evento");

                            if (eventoElementArray) {
                                for (var j = 0; j < eventoElementArray.length; j++) {
                                    //    console.log("eventoElementArray", eventoElementArray[j]);
                                    eventoElement = eventoElementArray[j].children;
                                    if (eventoElement[3].textContent != 3) {
                                        encontroRegistro = true;
                                        identificador = eventoElementArray[j].id;
                                        nroRecibo = eventoElement[1].textContent;
                                        fecha = obtenerDate("" + eventoElement[0].textContent);
                                    }
                                }
                                if (encontroRegistro) {
                                    status = RegFec + fecha;
                                } else {
                                    status = NRegPer + periodRecord.periodname;
                                }
                            }

                        } else if (cdRetorno == 3) {
                            status = NRegPer + periodRecord.periodname;
                        }

                        respuestaArray.push([identificador, nroRecibo, status]);
                    }
                }
                return respuestaArray;
            }

            function obtenerDate(date) {
                var fecha = "";
                if (date.length == 14) {
                    fecha = date.substring(6, 8) + "/" + date.substring(4, 6) + "/" + date.substring(0, 4) + " " + date.substring(8, 10) + ":" + date.substring(10, 12) + ":" + date.substring(12, 14);
                }
                return fecha;
            }

            function obtenerCuerpo() {

                try {
                    var html = '';
                    var respuestaArray = [],
                        baseUrl = 'https://' + window.location.hostname + '/core/media/previewmedia.nl?id=';
                    var paramsJson = {};
                    paramsJson["insertarObservacion"] = false;
                    paramsJson["hayError"] = false;
                    paramsJson["registro"] = "";

                    if (logDetails && logDetails['rfileId']) {
                        paramsJson["url"] = baseUrl + logDetails['rfileId'];
                        var xmlDocument = obtenerXmlDocument(baseUrl, logDetails['rfileId']);

                        if (logDetails['type'] == 'E') {

                            if (xmlDocument) {

                                var statusElementArray = xmlDocument.getElementsByTagName('status');
                                console.log("statusElementArray", statusElementArray);
                                if (statusElementArray) {
                                    var statusElement = statusElementArray[0].children;

                                    var cdStatus = statusElement[0].textContent;

                                    var identificador = "",
                                        nroRecibo = "",
                                        status = "",
                                        cdRetorno = "";
                                    console.log("cdStatus", cdStatus);
                                    if (cdStatus == 1) {
                                        identificador = "- - -";
                                        nroRecibo = "- - -";

                                        var ocorrenciasElementArray = xmlDocument.getElementsByTagName('ocorrencias');
                                        if (ocorrenciasElementArray) {
                                            for (var i = 0; i < ocorrenciasElementArray.length; i++) {
                                                ocorrenciasElement = ocorrenciasElementArray[i].children;
                                                status = ocorrenciasElement[1].textContent + ': ' + ocorrenciasElement[2].textContent;
                                                respuestaArray.push([identificador, nroRecibo, status]);
                                            }
                                        }
                                    } else if (cdStatus == 0) {
                                        var eventoElementArray = xmlDocument.getElementsByTagName('evento');

                                        if (eventoElementArray) {
                                            var ideStatusElementArray, cdRetornoElementArray;

                                            for (var i = 0; i < eventoElementArray.length; i++) {
                                                console.log("eventoElementArray", eventoElementArray[i]);

                                                infoRecEvElementArray = eventoElementArray[i].getElementsByTagName('infoRecEv');

                                                console.log("infoRecEvElementArray", infoRecEvElementArray);

                                                if (infoRecEvElementArray) {
                                                    infoRecEvElement = infoRecEvElementArray[0].children;
                                                    if (infoRecEvElement.length == 4) {
                                                        paramsJson["registro"] = infoRecEvElement[1].textContent;
                                                        identificador = infoRecEvElement[2].textContent;
                                                    } else if (infoRecEvElement.length == 5) {
                                                        nroRecibo = infoRecEvElement[0].textContent;
                                                        paramsJson["registro"] = infoRecEvElement[2].textContent;
                                                        identificador = infoRecEvElement[3].textContent;
                                                    }
                                                }

                                                ideStatusElementArray = eventoElementArray[i].getElementsByTagName('ideStatus');

                                                console.log("ideStatusElementArray", ideStatusElementArray);

                                                ideStatusElement = ideStatusElementArray[0].children;
                                                if (ideStatusElement && ideStatusElement.length) {
                                                    cdRetorno = ideStatusElement[0].textContent;

                                                    if (cdRetorno == 0) {
                                                        status = ideStatusElement[1].textContent;

                                                        nrRecArqBaseElement = eventoElementArray[i].getElementsByTagName('nrRecArqBase');

                                                        console.log("nrRecArqBaseElement", nrRecArqBaseElement);

                                                        if (nrRecArqBaseElement) {
                                                            nroRecibo = nrRecArqBaseElement[0].textContent;
                                                        }
                                                        respuestaArray.push([identificador, nroRecibo, status]);
                                                    } else if (cdRetorno == 2) {
                                                        status = ideStatusElement[1].textContent;

                                                        respuestaArray.push([identificador, nroRecibo, status]);
                                                    } else if (cdRetorno == 1) {
                                                        paramsJson["hayError"] = true;
                                                        nroRecibo = '- - -';
                                                        regOcorrsElementArray = ideStatusElementArray[0].getElementsByTagName('regOcorrs');
                                                        console.log("regOcorrsElementArray", regOcorrsElementArray);


                                                        for (var j = 0; j < regOcorrsElementArray.length; j++) {

                                                            regOcorrsElement = regOcorrsElementArray[j].children;
                                                            if (regOcorrsElement) {
                                                                status = regOcorrsElement[2].textContent + ': ' + regOcorrsElement[3].textContent;
                                                                if (regOcorrsElement[2].textContent == 'MS1028' || regOcorrsElement[2].textContent == 'MS1089' || regOcorrsElement[2].textContent == 'MS1091') {
                                                                    paramsJson["insertarObservacion"] = true;
                                                                }
                                                            }
                                                            respuestaArray.push([identificador, nroRecibo, status]);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        } else if (logDetails['type'] == 'C') {
                            paramsJson["hayError"] = true;
                            paramsJson["registro"] = '' + logDetails['event'];
                            console.log("evento", paramsJson["registro"]);
                            if (paramsJson["registro"] == "1000") {
                                respuestaArray = verificarConsultaR1000(xmlDocument, logDetails['per']);
                            } else if (paramsJson["registro"] == "2010" || paramsJson["registro"] == "2020" || paramsJson["registro"] == "2060") {
                                respuestaArray = verificarConsultaEventoPeriodicos(xmlDocument);
                            } else if (paramsJson["registro"] == "2099") {
                                respuestaArray = verificarConsultaR2099(xmlDocument, logDetails['per']);
                            }
                        }

                    }

                    console.log("array", respuestaArray);
                    html += obtenerCabeceraDialogo(logDetails['type'], paramsJson);

                    html += '<br/>';

                    html += obtenerDetalleDialogo(respuestaArray);

                } catch (error) {
                    LOG.error("error", error);
                }

                return html;
            }

            function obtenerCabeceraDialogo(tipoRespuestaArchivo, paramsJson) {

                if (language == 'es') {
                    var EnvReg = 'El envio del registro R';
                    var Correct = ' se realizó satisfactoriamente';
                    var ContErro = ' contiene errores';
                    var perdioConex = 'Se perdio la conexion del envio del registro R';
                    var urlRet = 'URL RETORNO:';
                    var descar = 'Descargar';
                    var obse = 'OBSERVACIONES:';
                    var sigObs = 'Se encontraron las siguientes observaciones';
                    var revError = 'Para revisar el error, puede validar el excel de auditoria';
                    var mensaje1 = 'Para solucionar el error MS1028 o MS1089 ir a Informes/LatamReady - RPT BR/LatamReady - Delete Event - REINF. '
                    var mensaje2 = 'Luego, en la ventana "LatamReady - BR Delete Events REINF" llenar todos los campos segun lo requiera. Despues presionar el bot&oacute;n "Filtrar" '
                    var mensaje3 = 'para que se muestren todos los eventos enviados. Finalmente seleccione los CheckBox de los eventos que desea eliminar y presione el bot&oacute;n "Eliminar"'

                } else if (language == 'pt') {
                    var EnvReg = 'Enviando o registro R';
                    var Correct = ' foi realizado de forma satisfatória';
                    var ContErro = ' contém erros';
                    var perdioConex = 'Registro R, envio de conexão perdida';
                    var urlRet = 'URL DE RETORNO:';
                    var descar = 'Download';
                    var obse = 'OBSERVAÇÕES:';
                    var sigObs = 'As seguintes observações foram encontradas';
                    var revError = 'Para revisar o erro, você pode validar o excel de auditoria';
                    var mensaje1 = 'Para resolver o erro MS1028 ou MS1089 vá para Relatórios/LatamReady - RPT BR/LatamReady - Delete Event - REINF. '
                    var mensaje2 = 'Em seguida, na janela "LatamReady - BR Delete Events REINF" preencha todos os campos conforme necessário. Depois de pressionar o botão "Filtro" '
                    var mensaje3 = 'para exibir todos os eventos enviados. Por fim, selecione a CheckBox dos eventos que deseja excluir e pressione o botão "Eliminar"'

                } else {
                    var EnvReg = 'Sending the R record';
                    var Correct = ' it was carried out satisfactorily';
                    var ContErro = ' contains errors';
                    var perdioConex = 'R record send connection lost';
                    var urlRet = 'RETURN URL:';
                    var descar = 'Download';
                    var obse = 'OBSERVATIONS:';
                    var sigObs = 'The following observations were found';
                    var revError = 'review the error, you can validate the audit excel';
                    var mensaje1 = 'fix the error MS1028 or MS1089 go to reports/LatamReady - RPT BR/LatamReady - Delete Event - REINF. '
                    var mensaje2 = 'Then at the window "LatamReady - BR Delete Events REINF" fill in all the fields as required. After pressing the button "Filter" '
                    var mensaje3 = 'to display all sent events. Finally select the CheckBox of the events you want to delete and press the button "Remove"'

                }

                var html_cab = '<table  border="0" style="width:100%;border-collapse:collapse">';
                html_cab += '<tr>';
                html_cab += '<td colspan="2" style="padding:6px 15px;width:67%">';

                if (tipoRespuestaArchivo == "E") {
                    if (!paramsJson["hayError"]) {
                        html_cab += '<p style="text-align:center;width: 100%;font-size:12px;color:#000000;border-radius: 5px;"><b>' + EnvReg + paramsJson['registro'] + Correct + '</b></p>';
                    } else {
                        html_cab += '<p style="text-align:center;width: 100%;font-size:12px;color:#000000;border-radius: 0px;"><b>' + EnvReg + paramsJson['registro'] + ContErro + '</b></p>';
                    }
                } else if (tipoRespuestaArchivo == "C") {
                    html_cab += '<p style="text-align:center;width: 100%;font-size:12px;color:#000000;border-radius: 5px;"><b>' + perdioConex + paramsJson['registro'] + '</b></p>';
                }

                html_cab += '</td>';
                html_cab += '</tr>';

                html_cab += '<tr>';
                html_cab += '<td style="text-align:right;padding:6px 20px;width:33%">';
                html_cab += '<p style="font-size:12px;color:#666666"><b>' + urlRet + '</b></p>';
                html_cab += '</td>';
                html_cab += '<td style="padding:6px 15px;width:67%">';
                html_cab += '<a style="style="font-size:12px;color:#000000" target="_blank" href="' + paramsJson['url'] + '">' + descar + '</a>';
                html_cab += '</td>';
                html_cab += '</tr>';

                html_cab += '<tr>';
                html_cab += '<td style="text-align:right;padding:6px 20px;width:33%">';
                html_cab += '<p style="font-size:12px;color:#666666"><b>' + obse + '</b></p>';
                html_cab += '</td>';


                if (!paramsJson["hayError"]) {

                    html_cab += '<td style="padding:6px 15px;width:67%">';
                    html_cab += '<p style="font-size:12px;color:#000000"><b></b></p>';
                    html_cab += '</td>';

                } else {

                    if (tipoRespuestaArchivo == "C" || paramsJson["registro"] == "1000" || paramsJson["registro"] == "2099") {

                        html_cab += '<td style="padding:6px 15px;width:67%">';
                        html_cab += '<p style="font-size:12px;color:#000000"><b>' + sigObs + '</b></p>';
                        html_cab += '</td>';

                    } else {
                        if (!paramsJson["insertarObservacion"]) {

                            html_cab += '<td style="padding:6px 15px;width:67%">';
                            html_cab += '<p style="font-size:12px;color:#000000"><b>' + revError + '</b></p>';
                            html_cab += '</td>';

                        } else {

                            html_cab += '<td style="padding:6px 15px;width:67%">';
                            html_cab += '<p style="font-size:12px;color:#000000"><b>' + mensaje1 + mensaje2 + mensaje3 + '</b></p>';
                            html_cab += '</td>';

                        }
                    }
                }



                html_cab += '</tr>';
                html_cab += '</table>';

                return html_cab;
            }

            function obtenerDetalleDialogo(respuestaArray) {

                if (language == 'es') {
                    var Iden = 'ID Identificador';
                    var NRec = 'Nro Recibo';
                    var stat = 'Estado';
                } else if (language == 'pt') {
                    var Iden = 'ID Identificador';
                    var NRec = 'Número do Recibo';
                    var stat = 'Estado';
                } else {
                    var Iden = 'Identifier ID';
                    var NRec = 'Receipt number';
                    var stat = 'Status';
                }

                var html_det = '<div style="overflow:scroll;">';
                html_det += '<table  border="1px solid #333333" style="width:90%;border-collapse:collapse;text-align:center;margin: 0 auto;">';

                html_det += '<tr>';
                html_det += '<td style="padding:6px 15px;width:30%">';
                html_det += '<p style="font-size:12px;color:#666666"><b>' + Iden + '</b></p>';
                html_det += '</td>';
                html_det += '<td style="padding:6px 15px;width:30%">';
                html_det += '<p style="font-size:12px;color:#666666"><b>' + NRec + '</b></p>';
                html_det += '</td>';
                html_det += '<td style="padding:6px 15px;width:40%">';
                html_det += '<p style="font-size:12px;color:#666666"><b>' + stat + '</b></p>';
                html_det += '</td>';
                html_det += '</tr>';


                for (var i = 0; i < respuestaArray.length; i++) {
                    html_det += '<tr>';
                    html_det += '<td style="padding:6px 15px;width:30%">';
                    html_det += '<p style="font-size:12px;color:#000000"><b>' + respuestaArray[i][0] + '</b></p>';
                    html_det += '</td>';
                    html_det += '<td style="padding:6px 15px;width:30%">';
                    html_det += '<p style="font-size:12px;color:#000000"><b>' + respuestaArray[i][1] + '</b></p>';
                    html_det += '</td>';
                    html_det += '<td style="padding:6px 15px;width:40%">';
                    html_det += '<p style="font-size:12px;color:#000000"><b>' + respuestaArray[i][2] + '</b></p>';
                    html_det += '</td>';
                    html_det += '</tr>';
                }

                html_det += '</table>';
                html_det += '</div>';

                return html_det;
            }

            function obtenerSouthHTML() {
                if (language == 'es') {
                    var Acept = 'Aceptar';
                } else if (language == 'pt') {
                    var Acept = 'Aceitar';
                } else {
                    var Acept = 'Accept';
                }
                var southHTML = '';

                southHTML += '<div style="height:100%;text-align:right;width:100%;">';
                southHTML += '  <table align="right" cellpadding="0" border="0" class="uir-button" cellspacing="0" style="margin-right:6px;cursor:hand;" role="presentation">';
                southHTML += '      <tbody>';
                southHTML += '          <tr class="pgBntG">';
                southHTML += '              <td>';
                southHTML += '                  <img src="/images/nav/ns_x.gif" class="bntLT" border="0" height="50%" width="3" alt="">';
                southHTML += '                  <img src="/images/nav/ns_x.gif" class="bntLB" border="0" height="50%" width="3" alt="">';
                southHTML += '              </td>';
                southHTML += '              <td height="20" valign="top" nowrap="" class="bntBgB">';
                southHTML += '                  <input type="button" style="" class="rndbuttoninpt bntBgT" value="' + Acept + '" name="resetter" onclick="closePopup();">';
                southHTML += '              </td>';
                southHTML += '              <td id="tdrightcap_resetter"> ';
                southHTML += '                  <img src="/images/nav/ns_x.gif" height="50%" class="bntRT" border="0" width="3" alt="">';
                southHTML += '                  <img src="/images/nav/ns_x.gif" height="50%" class="bntRB" border="0" width="3" alt="">';
                southHTML += '              </td>';
                southHTML += '          </tr>';
                southHTML += '      </tbody>';
                southHTML += '  </table>';
                southHTML += '</div>';

                return southHTML;
            }

            function closePopup() {
                var win = Ext.WindowMgr.getActive();
                if (win) {
                    win.close();
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

            function crearVentana(context) {

                var html = obtenerCuerpo();

                var objExtForm = Ext.create({
                    xtype: 'form',
                    region: 'center',
                    labelAlign: 'top',
                    frame: false,
                    autoScroll: true,
                    html: html
                });

                var southHTML = obtenerSouthHTML();

                var objExtFormTwo = Ext.create({
                    xtype: 'form',
                    region: 'south',
                    frame: false,
                    height: 30,
                    html: southHTML
                });

                var width = 1100,
                    height = 400;

                /*
                                if (logDetails['type'] == 'E') {
                                    if (logDetails['status'] == 0 || logDetails['status'] == 2) {
                                        width = 1100;
                                        height = 400;
                                    } else if (logDetails['status'] == 1) {
                                        width = 1100;
                                        height = 400;
                                    }
                                } else if (logDetails['type'] == 'C') {
                                    if (logDetails['status'] == 1) {
                                        width = 1100;
                                        height = 400;
                                    } else if (logDetails['status'] == 0 || logDetails['status'] == 3) {
                                        width = 1100;
                                        height = 400;
                                    }
                                }
                */

                if (language == 'es') {
                    var Dato = 'DETALLES';
                } else if (language == 'pt') {
                    var Dato = 'DETALHES';
                } else {
                    var Dato = 'DETAILS';
                }

                Ext.create({
                    xtype: 'window',
                    width: width,
                    layout: 'border',
                    height: height,
                    autoScroll: true,
                    title: Dato,
                    modal: true,
                    items: [objExtForm, objExtFormTwo],
                }).show();

            }

            crearVentana();
        }
    );
}

function obtenerUrlImagenes() {
    var jsonResult = {};
    var folderSearch = SEARCH.create({
        type: 'folder',
        filters: ['name', 'is', 'BR_Images'],
        columns: ['internalid', 'file.name', 'file.url']
    });

    var objResult = folderSearch.run().getRange(0, 100);

    if (objResult && objResult.length != 0) {
        var columns = [];
        for (var i = 0; i < objResult.length; i++) {
            columns = objResult[i].columns;
            // log.debug('result', objResult[i]);
            // log.debug('Name', objResult[i].getValue(columns[1]));
            // log.debug('URL', objResult[i].getValue(columns[2]));

            if (objResult[i].getValue(columns[1]) == 'check.png') {
                jsonResult['check'] = objResult[i].getValue(columns[2]);
            }
            if (objResult[i].getValue(columns[1]) == 'error.png') {
                jsonResult['error'] = objResult[i].getValue(columns[2]);
            }
        }
    }
    jsonResult['check'] = jsonResult['check'] || '';
    jsonResult['error'] = jsonResult['error'] || '';

    return jsonResult;
}

function BusquedaByVersion(idrpts, context) {


    var DbolStop = false;
    var arrAllVersions = new Array();
    var cont = 0;

    var savedSearch = SEARCH.create({
        type: 'customrecord_lmry_br_rpt_feature_version',
        columns: [
            SEARCH.createColumn({
                name: 'custrecord_lmry_br_rpt_id_schedule'
            }),
            SEARCH.createColumn({
                name: 'custrecord_lmry_br_rpt_id_deploy'
            }),
            SEARCH.createColumn({
                name: 'custrecord_lmry_br_rpt_id_report'
            }),
            SEARCH.createColumn({
                name: 'custrecord_lmry_br_rpt_version'
            }),
            SEARCH.createColumn({
                name: 'custrecord_lmry_br_year_from'
            }),
            SEARCH.createColumn({
                name: 'custrecord_lmry_br_year_to'
            }),
            SEARCH.createColumn({
                name: 'internalid'
            })
        ]
    });

    var searchResult = savedSearch.run();

    while (!DbolStop) {

        var objResult = searchResult.getRange(0, 1000);

        if (objResult != null) {

            var intLength = objResult.length;

            if (intLength == 0) {
                DbolStop = true;
            }

            for (var i = 0; i < intLength; i++) {
                var columnas = objResult[i].columns;
                var arrAuxiliar = new Array();

                //0. id SCHDL
                if (objResult[i].getValue(columnas[0]) != null) {
                    arrAuxiliar[0] = objResult[i].getValue(columnas[0]);
                } else {
                    arrAuxiliar[0] = '';
                } //1. id DEPLOY
                if (objResult[i].getValue(columnas[1]) != null) {
                    arrAuxiliar[1] = objResult[i].getValue(columnas[1]);
                } else {
                    arrAuxiliar[1] = '';
                } //2. id RPT
                if (objResult[i].getValue(columnas[2]) != null) {
                    arrAuxiliar[2] = objResult[i].getValue(columnas[2]);
                } else {
                    arrAuxiliar[2] = '';
                } //3. Version del Reporte
                if (objResult[i].getValue(columnas[3]) != null) {
                    arrAuxiliar[3] = objResult[i].getValue(columnas[3]);
                } else {
                    arrAuxiliar[3] = '';
                } //4. PERIODO DESDE
                if (objResult[i].getValue(columnas[4]) != null) {
                    arrAuxiliar[4] = objResult[i].getValue(columnas[4]);
                } else {
                    arrAuxiliar[4] = '';
                } //5. PERIODO HASTA
                if (objResult[i].getValue(columnas[5]) != null) {
                    arrAuxiliar[5] = objResult[i].getValue(columnas[5]);
                } else {
                    arrAuxiliar[5] = '';
                }
                if (objResult[i].getValue(columnas[6]) != null) {
                    arrAuxiliar[6] = objResult[i].getValue(columnas[6]);
                } else {
                    arrAuxiliar[6] = '';
                }

                arrAllVersions[cont] = arrAuxiliar;
                cont++;

            }

            if (intLength < 1000) {
                DbolStop = true;
            }


        }
    }

    for (var i = 0; i < arrAllVersions.length; i++) {
        if (arrAllVersions[i][2] == idrpts) {

            // var periodocontable = context.request.parameters.custpage_periodo;
            var periodocontable = context.request.parameters.custpage_anio;

            //   var aux_fecha_per = FORMAT.parse({ value: periodocontable,type: FORMAT.Type.DATE });
            //   var anio = aux_fecha_per.getFullYear();

            var periodenddate_temp = SEARCH.lookupFields({
                type: SEARCH.Type.ACCOUNTING_PERIOD,
                id: periodocontable,
                columns: ['enddate', 'periodname']
            });


            var period_aux_moment = periodenddate_temp.enddate;

            var fecha_format = FORMAT.parse({
                value: period_aux_moment,
                type: FORMAT.Type.DATE
            });


            var anio = fecha_format.getFullYear();


            var Date1 = FORMAT.parse({
                value: arrAllVersions[i][4],
                type: FORMAT.Type.DATE
            });
            var Date2 = FORMAT.parse({
                value: arrAllVersions[i][5],
                type: FORMAT.Type.DATE
            });
            var year_from = Date1.getFullYear();
            var year_to = Date2.getFullYear();

            if ((Number(anio) >= Number(year_from) || (Number(year_to) == '' || Number(year_to) == null)) && ((Number(year_from) == '' || Number(year_from) == null) || Number(anio) <= Number(year_to))) {
                var nuevoidSCHL = arrAllVersions[i][0];
                var nuevoidDEPLOY = arrAllVersions[i][1];
                var nuevointernalId = arrAllVersions[i][6];

            }

        }

    }

    return [nuevoidSCHL, nuevoidDEPLOY, nuevointernalId];
}

function ObtenerConfigFeature(id_subsi, id_feature) {
    var activ_feature = false;
    var licenses = new Array();
    licenses = LIB_FEATURE.getLicenses(id_subsi);
    activ_feature = LIB_FEATURE.getAuthorization(id_feature, licenses);

    return activ_feature;
}
/*-----------------------------------------------------------------------------
 * Metodo para obtener los datos de la subsidiaria como calendars
 *-----------------------------------------------------------------------------------------*/
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

/* ------------------------------------------------------------------------------------------------------
 * Nota: Valida si existe el folder donde se guardaran los archivos
 * --------------------------------------------------------------------------------------------------- */
function search_folder() {
    try {
        // Ruta de la carpeta contenedora

        var varScriptObj = RUNTIME.getCurrentScript();
        var FolderId = varScriptObj.getParameter({
            name: 'custscript_lmry_file_cabinet_rg_br'
        });



        if (FolderId == '' || FolderId == null) {

            // Valida si existe "SuiteLatamReady" en File Cabinet
            var varIdFolderPrimary = '';

            var ResultSet = SEARCH.create({
                type: 'folder',
                columns: ['internalid'],
                filters: ['name', 'is', 'SuiteLatamReady']
            });

            objResult = ResultSet.run().getRange(0, 50);

            if (objResult == '' || objResult == null) {
                var varRecordFolder = RECORD.create({
                    type: 'folder'
                });
                varRecordFolder.setValue('name', 'SuiteLatamReady');
                varIdFolderPrimary = varRecordFolder.save();
            } else {
                varIdFolderPrimary = objResult[0].getValue('internalid');
            }

            // Valida si existe "LMRY Report Generator" en File Cabinet
            var varFolderId = '';
            var ResultSet = SEARCH.create({
                type: 'folder',
                columns: ['internalid'],
                filters: [
                    ['name', 'is', 'Latam Report Generator BR']
                ]
            });
            objResult = ResultSet.run().getRange(0, 50);

            if (objResult == '' || objResult == null) {
                var varRecordFolder = RECORD.create({
                    type: 'folder'
                });
                varRecordFolder.setValue('name', 'Latam Report Generator BR');
                varRecordFolder.setValue('parent', varIdFolderPrimary);
                varFolderId = varRecordFolder.save();
            } else {
                varFolderId = objResult[0].getValue('internalid');
            }


            // Load the NetSuite Company Preferences page
            var varCompanyReference = CONFIG.load({
                type: CONFIG.Type.COMPANY_PREFERENCES
            });

            // set field values
            varCompanyReference.setValue({
                fieldId: 'custscript_lmry_file_cabinet_rg_br',
                value: varFolderId
            });
            // save changes to the Company Preferences page
            varCompanyReference.save();
        }
    } catch (err) {

        LOG.error({
            title: 'Se genero un error en suitelet',
            details: err
        });
        // Mail de configuracion del folder
        LIB_FEATURE.sendErrorEmail(' [ onRequest ] ' + err, LMRY_script, language);
    }
    return true;
}
