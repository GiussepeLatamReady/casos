/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for Inventory Balance Library                  ||
||                                                              ||
||  File Name: LMRY_BR_ReportGenerator_STLT_V2.0                ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Aug 16 2018  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */


define(["N/format", "N/ui/serverWidget", "N/search", "N/runtime", "N/record", "N/redirect", "N/task", "N/log", "N/config", "./BR_LIBRERIA_MENSUAL/LMRY_BR_Reportes_LBRY_V2.0.js","SuiteBundles/Bundle 37714/Latam_Library/LMRY_libSendingEmailsLBRY_V2.0.js"], runSuitelet);
var FORMAT, UI, SEARCH, RECORD, RUNTIME, REDIRECT, TASK, LOG, CONFIG, LIBRARY, LIB_FEATURE;
// Titulo del Suitelet

var LMRY_script = "LMRY Estatal Report Generator BR STLT";
var namereport = "Latam Estatal Report Generator BR";

function runSuitelet(format, ui, search, runtime, record, redirect, task, log, config, library, libFeature) {

    language = runtime.getCurrentScript().getParameter("LANGUAGE").substring(0,2);

    if(language == 'es'){
        //LMRY_script = "LMRY Generador de Informes Estatales BR STLT";
        namereport = "Latam Generador de Reportes Estatales BR";
      } else if (language == 'pt'){
        //LMRY_script = "LMRY Gerador de Relatórios de Estado BR STLT";
        namereport = "Latam Gerador de Relatórios de Estado BR";
      } else {
        //LMRY_script = "LMRY Estatal Report Generator BR STLT";
        namereport = "Latam Estatal Report Generator BR";
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
    LIBRARY = library;
    LIB_FEATURE = libFeature;
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

            var varFlagCalendar = RUNTIME.isFeatureInEffect({
                feature: 'MULTIPLECALENDARS'
              });

            if(language == 'es'){
                var Treporte = 'Tipos de Reporte';
                var report = 'Reporte';
                var CritBusq = 'Criterios de Busqueda';
                var subsidia = 'SUBSIDIARIA';
                var modeFis = 'Modelo de Nota Fiscal';
                var TiPropo = 'TIPO DE PROPOSITO';
                var periodAnu = 'Periodo Anual';
                var EstDest = 'Estado de Destino';
                var cosRec = 'Codigo de Receita';
                var GeneH = 'Generar Bloque H';
                var GeneB = 'Generar Bloque G';
                var movInv = 'Motivo de Inventario';
                var TGia = 'Tipo de GIA'
                var TranFa = 'Transmitida a Fazenda';
                var CritEspe = 'Criterios Especiales';
                var tipoDecl = 'Tipo de Declaración';
                var numRect = 'Nro de Rectificatoria';
                var fecRef = 'Fecha de Referencia';
                var PerRef = 'Periodo de Referencia';
                var fecPago = 'Fecha de Pago';
                var fecVenc = 'Fecha de Vencimiento';
                var mensaje = 'Importante: Al utilizar la Transacción de NetSuite, asume toda la responsabilidad de determinar si los datos que genera y descarga son precisos o suficientes para sus propósitos. También asume toda la responsabilidad por la seguridad de cualquier dato que descargue de NetSuite y posteriormente almacene fuera del sistema NetSuite.';
                var logGe = 'Log de generacion';
                var fechaCrea = 'FECHA DE CREACION';
                var info = 'INFORME';
                var perio = 'PERIODO';
                var subsid = 'SUBSIDIARIA';
                var creado = 'CREADO POR';
                var nombreArc = 'NOMBRE ARCHIVO';
                var descarg = 'DESCARGAR ';
                var descarga = 'Descarga';
                var generar = 'Generar';
                var cancel = 'Cancelar';
              } else if (language == 'pt'){
                var Treporte = 'Tipos de Relatório';
                var report = 'Relatório';
                var CritBusq = 'Critérios de Pesquisa';
                var subsidia = 'SUBSIDIÁRIA';
                var modeFis = 'Modelo de Nota Fiscal';
                var TiPropo = 'TIPO DE PROPÓSITO';
                var periodAnu = 'Período Anual';
                var EstDest = 'Estado de Destino';
                var cosRec = 'Código de Receita';
                var GeneH = 'Gerar Bloco H';
                var GeneB = 'Gerar Bloco G';
                var movInv = 'Razão de estoque';
                var TGia = 'Tipo GIA'
                var TranFa = 'Transmitida para Fazenda';
                var CritEspe = 'Critérios Especiais';
                var tipoDecl = 'Tipo de Declaração';
                var numRect = 'Número de Retificação';
                var fecRef = 'Data de referencia';
                var PerRef = 'Período de Referência';
                var fecPago = 'Data de pagamento';
                var fecVenc = 'Data de venciment';
                var mensaje = 'Importante: ao usar a Transação NetSuite, você assume toda a responsabilidade por determinar se os dados que você gerar e baixar são precisos ou suficientes para seus propósitos. Você também assume toda a responsabilidade pela segurança de quaisquer dados baixados do NetSuite e subsequentemente armazenados fora do sistema NetSuite.';
                var logGe = 'Registro de geração';
                var fechaCrea = 'DATA DE CRIAÇÃO';
                var info = 'RELATÓRIO';
                var perio = 'PERÍODO';
                var subsid = 'SUBSIDIÁRIA';
                var creado = 'CRIADO POR';
                var nombreArc = 'NOME DO ARQUIVO';
                var descarg = 'DOWNLOAD';
                var descarga = 'Download';
                var generar = 'Gerar';
                var cancel = 'Cancelar';
              } else {
                var Treporte = 'Report Types';
                var report = 'Report';
                var CritBusq = 'Search Criteria';
                var subsidia = 'SUBSIDIARY';
                var modeFis = 'Fiscal Note Model';
                var TiPropo = 'TYPE OF PURPOSE';
                var periodAnu = 'Annual Period';
                var EstDest = 'Destination State';
                var cosRec = 'Recipe Code';
                var GeneH = 'Generate Block H';
                var GeneB = 'Generate Block G';
                var movInv = 'Stock Reason';
                var TGia = 'GIA type'
                var TranFa = 'Transmitted to Fazenda';
                var CritEspe = 'Special Criteria';
                var tipoDecl = 'Declaration Type';
                var numRect = 'Rectification number';
                var fecRef = 'Reference date';
                var PerRef = 'Reference Period';
                var fecPago = 'Payment date';
                var fecVenc = 'Due date';
                var mensaje = 'Important: By using the NetSuite Transaction, you assume all responsibility for determining whether the data you generate and download is accurate or sufficient for your purposes. You also assume all responsibility for the security of any data that you download from NetSuite and subsequently store outside of the NetSuite system.';
                var logGe = 'Generation log';
                var fechaCrea = 'CREATION DATE';
                var info = 'REPORT';
                var perio = 'PERIOD';
                var subsid = 'SUBSIDIARY';
                var creado = 'CREATED BY';
                var nombreArc = 'FILE NAME';
                var descarg = 'DOWNLOAD';
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
                values: 'E'
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
                    fieldreports.addSelectOption({
                        value: reportID,
                        text: reportNM
                    });
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

            //========Filtros Reporte NFCE (21,22,06) =====

            var fieldNF = form.addField({
                id: 'custpage_lmry_nfce',
                type: UI.FieldType.SELECT,
                label: modeFis,
                container: 'custpage_filran2'
            });

            var searchFiscalDocumentType = SEARCH.create({
                type: 'customrecord_lmry_tipo_doc',
                filters: [
                    ['isinactive', 'is', 'F'], 'and',
                    ['custrecord_lmry_country_applied', 'is', '30']
                ],
                columns: ['custrecord_lmry_codigo_doc', 'name'],

            });

            var filterModeloNF = SEARCH.createFilter({
                name: 'formulatext',
                formula: "CASE WHEN {custrecord_lmry_codigo_doc} = '06' OR {custrecord_lmry_codigo_doc} = '21' OR {custrecord_lmry_codigo_doc} = '22' THEN 1 ELSE 0 END",
                operator: SEARCH.Operator.IS,
                values: 1
            });
            searchFiscalDocumentType.filters.push(filterModeloNF);

            var resultFiscalDocumentType = searchFiscalDocumentType.run().getRange(0, 100);
            if (resultFiscalDocumentType != null && resultFiscalDocumentType.length != 0) {
                fieldNF.addSelectOption({
                    value: ' ',
                    text: ' '
                });
                for (var i = 0; i < resultFiscalDocumentType.length; i++) {
                    var row = resultFiscalDocumentType[0].columns;
                    var cod_nf = resultFiscalDocumentType[i].getValue(row[0]);
                    var name_nf = resultFiscalDocumentType[i].getValue(row[1]);

                    fieldNF.addSelectOption({
                        value: cod_nf,
                        text: name_nf
                    });
                }
            }

            //========Filtros Reporte SINTEGRA =====

            var LisaTipoGIA = form.addField({
                id: 'custpage_sintegra_type',
                label: TiPropo,
                type: UI.FieldType.SELECT,
                container: 'custpage_filran2'
            });

            LisaTipoGIA.addSelectOption({ value: '1', text: 'Normal' });
            LisaTipoGIA.addSelectOption({ value: '2', text: 'Rectificación total de archivos' });
            LisaTipoGIA.addSelectOption({ value: '3', text: 'Rectificación de archivos aditiva' });
            LisaTipoGIA.addSelectOption({ value: '5', text: 'Deshacer' });

            //========Filtros Reporte DIMOB =====

            var periodo_anual = form.addField({
                id: 'custpage_anio',
                label: periodAnu,
                type: UI.FieldType.SELECT,
                container: 'custpage_filran2'
            });

            //========Filtros Reporte GNRE=======

            var fieldEstado = form.addField({
                id: 'custpage_lmry_estado',
                type: UI.FieldType.SELECT,
                label: EstDest,
                container: 'custpage_filran2'
            });

            var fieldReceita = form.addField({
                id: 'custpage_lmry_receita',
                type: UI.FieldType.SELECT,
                label: cosRec,
                container: 'custpage_filran2'
            });

            var searchProvin = SEARCH.create({
                type: 'customrecord_lmry_province',
                columns: ['custrecord_lmry_prov_id', 'name'],
                filters: [
                    ['isinactive', 'is', 'F'], 'and', ['custrecord_lmry_prov_country', 'is', '30']
                ]
            });
            resultProvi = searchProvin.run().getRange(0, 100);
            // log.error('PROVINCIAS',resultProvi.length);
            if (resultProvi != null && resultProvi.length != 0) {
                fieldEstado.addSelectOption({
                    value: ' ',
                    text: ' '
                });
                for (var i = 0; i < resultProvi.length; i++) {
                    row = resultProvi[0].columns;
                    var estado_id = resultProvi[i].getValue(row[0]);
                    var estado_name = resultProvi[i].getValue(row[1]);

                    fieldEstado.addSelectOption({
                        value: estado_id,
                        text: estado_name
                    });
                }
            }

            var searchReceita = SEARCH.create({
                type: 'customrecord_lmry_br_revenue_code',
                columns: ['internalid', 'name', 'custrecord_lmry_br_id_tax'],
                filters: [
                    ['isinactive', 'is', 'F'], 'and', ['custrecord_lmry_br_id_tax', 'is', '09']
                ]
            });
            resultReceita = searchReceita.run().getRange(0, 20);

            if (resultReceita != null && resultReceita.length != 0) {
                fieldReceita.addSelectOption({
                    value: ' ',
                    text: ' '
                });
                for (var i = 0; i < resultReceita.length; i++) {
                    row = resultReceita[0].columns;
                    var receita_id = resultReceita[i].getValue(row[0]);
                    var receita_name = resultReceita[i].getValue(row[1]);

                    fieldReceita.addSelectOption({
                        value: receita_id,
                        text: receita_name
                    });
                }
            }
            //=====================================


            //Para el report EFD Fiscal - Generar Bloque H
            var BLoque_H = form.addField({
                id: 'custpage_bloque_h',
                label: GeneH,
                type: UI.FieldType.CHECKBOX,
                container: 'custpage_filran2'
            });

            var BLoque_G = form.addField({
                id: 'custpage_bloque_g',
                label: GeneB,
                type: UI.FieldType.CHECKBOX,
                container: 'custpage_filran2'
            });

            var Lista_Mot_Inv = form.addField({
                id: 'custpage_list_mov_inv',
                label: movInv,
                type: UI.FieldType.SELECT,
                container: 'custpage_filran2'
            });

            if(language == 'es'){
                Lista_Mot_Inv.addSelectOption({ value: '00', text: ' ' });
                Lista_Mot_Inv.addSelectOption({ value: '01', text: ' Al final del período' });
                Lista_Mot_Inv.addSelectOption({ value: '02', text: ' En el cambio de forma de tributacion de mercancias (ICMS)' });
                Lista_Mot_Inv.addSelectOption({ value: '03', text: ' Al solicitar cancelacion catastral, cierre temporal y otras situaciones' });
                Lista_Mot_Inv.addSelectOption({ value: '04', text: ' Al cambiar el regimen de pago - condicion del contribuyente' });
                Lista_Mot_Inv.addSelectOption({ value: '05', text: ' Al determinar las autoridades fiscales' });
                Lista_Mot_Inv.addSelectOption({ value: '06', text: ' Para el control de bienes sujetos al regimen de sustitucion fiscal - devolucion/devolucion/complementacion' });
              } else if (language == 'pt'){
                Lista_Mot_Inv.addSelectOption({ value: '00', text: ' ' });
                Lista_Mot_Inv.addSelectOption({ value: '01', text: ' No final no período' });
                Lista_Mot_Inv.addSelectOption({ value: '02', text: ' Na mudança de forma de tributação damercadoria (ICMS)' });
                Lista_Mot_Inv.addSelectOption({ value: '03', text: ' Na solicitação da baixa cadastral, paralisação temporária e outras situações' });
                Lista_Mot_Inv.addSelectOption({ value: '04', text: ' Na alteração de regime de pagamento – condição do contribuinte' });
                Lista_Mot_Inv.addSelectOption({ value: '05', text: ' Por determinação dos fiscos' });
                Lista_Mot_Inv.addSelectOption({ value: '06', text: ' Para controle das mercadorias sujeitas ao regimede substituição tributária – restituição/ressarcimento/complementação' });
              } else {
                Lista_Mot_Inv.addSelectOption({ value: '00', text: ' ' });
                Lista_Mot_Inv.addSelectOption({ value: '01', text: ' At the end of the period' });
                Lista_Mot_Inv.addSelectOption({ value: '02', text: ' In the change of form of taxation of goods (ICMS)' });
                Lista_Mot_Inv.addSelectOption({ value: '03', text: ' When requesting registration cancellation, temporary stoppage and other situations' });
                Lista_Mot_Inv.addSelectOption({ value: '04', text: ' When changing the payment regime - taxpayer condition' });
                Lista_Mot_Inv.addSelectOption({ value: '05', text: ' By determining the tax authorities' });
                Lista_Mot_Inv.addSelectOption({ value: '06', text: ' For the control of goods subject to the tax substitution regime - refund/refund/complementation' });
              }


            var LisaTipoGIA = form.addField({
                id: 'custpage_gia_type',
                label: TGia,
                type: UI.FieldType.SELECT,
                container: 'custpage_filran2'
            });

            if(language == 'es'){
                LisaTipoGIA.addSelectOption({ value: '01', text: 'Normal' });
                LisaTipoGIA.addSelectOption({ value: '02', text: 'Sustitutivo' });
                LisaTipoGIA.addSelectOption({ value: '03', text: 'Recogido' });
              } else if (language == 'pt'){
                LisaTipoGIA.addSelectOption({ value: '01', text: 'Normal' });
                LisaTipoGIA.addSelectOption({ value: '02', text: 'Substitutiva' });
                LisaTipoGIA.addSelectOption({ value: '03', text: 'Coligida' });
              } else {
                LisaTipoGIA.addSelectOption({ value: '01', text: 'Normal' });
                LisaTipoGIA.addSelectOption({ value: '02', text: 'Substitutive' });
                LisaTipoGIA.addSelectOption({ value: '03', text: 'Collected' });
              }



            var LisaTransmitida = form.addField({
                id: 'custpage_transmitted',
                label: TranFa,
                type: UI.FieldType.SELECT,
                container: 'custpage_filran2'
            });

            if(language == 'es'){
                LisaTransmitida.addSelectOption({ value: '0', text: 'No' });
                LisaTransmitida.addSelectOption({ value: '1', text: 'Si' });
              } else if (language == 'pt'){
                LisaTransmitida.addSelectOption({ value: '0', text: 'Não' });
                LisaTransmitida.addSelectOption({ value: '1', text: 'Sim' });
              } else {
                LisaTransmitida.addSelectOption({ value: '0', text: 'Not' });
                LisaTransmitida.addSelectOption({ value: '1', text: 'Yes' });
              }

            //PERIOD CON CALENDAR FISCAL
            var periodo_mensual = form.addField({
                id: 'custpage_custom_period',
                label: 'PERIODO CONTABLE',
                type: UI.FieldType.SELECT,
                container: 'custpage_filran2'
            });

            log.error('antes calendar',varFlagCalendar);

            if (!(varFlagCalendar || varFlagCalendar == 'T')) {
                log.error('paso calendar');
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

            /*  //Periodicidad
              var fieldPeriodicidad = form.addField({
                  id: 'custpage_lmry_periodicidad',
                  type: UI.FieldType.SELECT,
                  label: 'Periodicidad',
                  container: 'custpage_filran2'
              });
              var search_Periodicidad = SEARCH.create({
                  type: 'customrecord_lmry_br_periodicity',
                  columns: ['internalid', 'name']
              });
              var resul_periodicidad = search_Periodicidad.run();
              var varRecordPeriodicidad = resul_periodicidad.getRange({
                  start: 0,
                  end: 1000
              });
              if (varRecordPeriodicidad != null && varRecordPeriodicidad.length > 0) {

                  // Llena una linea vacia
                /*  fieldPeriodicidad.addSelectOption({
                      value: 0,
                      text: ' '
                  });*/

            // Llenado de listbox
            /*  for (var i = 0; i < varRecordPeriodicidad.length; i++) {
                  var subID = varRecordPeriodicidad[i].getValue('internalid');
                  var subNM = varRecordPeriodicidad[i].getValue('name');

                  if(subID=='5')
                  fieldPeriodicidad.addSelectOption({
                      value: subID,
                      text: subNM
                  });
              }
          }*/

            //Tipo de declaracion
            var fieldTipDecla = form.addField({
                id: 'custpage_lmry_tipo_decla',
                type: UI.FieldType.SELECT,
                label: tipoDecl,
                container: 'custpage_filran2'
            });

            if(language == 'es'){
                var Orig = 'Original';
                var Rect = 'Rectificatoria';
              } else if (language == 'pt'){
                var Orig = 'Original';
                var Rect = 'Retificação';
              } else {
                var Orig = 'Original';
                var Rect = 'Rectification';
              }

            fieldTipDecla.addSelectOption({
                value: 0,
                text: Orig
            });
            fieldTipDecla.addSelectOption({
                value: 1,
                text: Rect
            });

            var fieldNroRecti = form.addField({
                id: 'custpage_lmry_nro_recti',
                type: UI.FieldType.TEXT,
                label: numRect,
                container: 'custpage_filran2'
            });

            //======== Filtros Reporte GNRE - Referencia =======
            var fieldFechaRefere = form.addField({
                id: 'custpage_lmry_date_refer',
                type: UI.FieldType.DATE,
                label: fecRef,
                container: 'custpage_filran2'
            });

            var filtro_periodoGNRE = form.addField({
                id: 'custpage_lmry_periognre_refer',
                type: UI.FieldType.SELECT,
                label: PerRef,
                container: 'custpage_filran2'
            });

            filtro_periodoGNRE.defaultValue = '';

            addPeriods(filtro_periodoGNRE);

            //========Carga datos Filtros Reporte GNRE=======

            var fieldFechaPago = form.addField({
                id: 'custpage_lmry_date_pago',
                type: UI.FieldType.DATE,
                label: fecPago,
                container: 'custpage_filran2'
            });

            var fieldFechaVenci = form.addField({
                id: 'custpage_lmry_date_venci',
                type: UI.FieldType.DATE,
                label: fecVenc,
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
                "<div style=\"color: gray; font-size: 8pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver\">" +mensaje+ "</div>" +
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

            listaLog.addRefreshButton();

            var varLogData = SEARCH.load({
                id: 'customsearch_lmry_br_rpt_generator_log'
            });

            var reportEstatal = SEARCH.createFilter({
                name: 'custrecord_lmry_br_class_report',
                join: 'custrecord_lmry_br_rg_report_record',
                operator: SEARCH.Operator.IS,
                values: 'E'
            });
            varLogData.filters.push(reportEstatal);

            var resul_LogData = varLogData.run();
            var varRecordLog = resul_LogData.getRange({
                start: 0,
                end: 1000
            });


            var details = '', linktext = '', buttonText = '', url, status = 1, tipoOperacion = 'E';
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
                    linktext = '<a target="_blank" href="' + searchresult.getValue('custrecord_lmry_br_rg_url_file') + '"download>'+descarga+'</a>';
                }

                if (details || details.length != 0) {
                    // log.error('details ' + i + ': ', details);
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
                    //log.error('Numero de Caracteres', buttonText.length);
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

                if(language == 'es'){
                    var pendi = 'Pendiente';
                    var OcErr = 'Ocurrio un error inesperado en la ejecucion del reporte.';
                    var noExiInf = 'No existe informacion para los criterios seleccionados.';
                } else if (language == 'pt'){
                    var pendi = 'Pendente';
                    var OcErr = 'Ocorreu um erro inesperado ao executar o relatório.';
                    var noExiInf = 'Não há informações para os critérios selecionados.'
                } else {
                    var pendi = 'Pending';
                    var OcErr = 'An unexpected error occurred while executing the report.';
                    var noExiInf = 'There is no information for the selected criteria.';
                }
                if(nomb == 'Pendiente' || nomb == 'Pendente' || nomb == 'Pending'){
                    nomb = pendi;
                } else if(nomb == 'Ocurrio un error inesperado en la ejecucion del reporte.' ||
                          nomb == 'Ocorreu um erro inesperado ao executar o relatório.' ||
                          nomb == 'An unexpected error occurred while executing the report.'){
                    nomb = OcErr;
                } else if(nomb == 'No existe informacion para los criterios seleccionados.' ||
                          nomb == 'Não há informações para os critérios selecionados.' ||
                          nomb == 'There is no information for the selected criteria.'){
                    nomb = noExiInf;
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

            }
            // Botones del formulario
            form.addSubmitButton(generar);
            form.addResetButton(cancel);

            //Llama al cliente
            form.clientScriptModulePath = './LMRY_BR_EstatalReportGenerator_CLNT_V2.0.js';


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
            var paramSubsi = context.request.parameters.custpage_subsidiary;
            var featTaxCalendar = ObtenerConfigFeature(paramSubsi, 681);
            /*********************************************
             * Regista en el log de generacion de archivos
             ********************************************/
            var idrpts = context.request.parameters.custpage_lmry_reporte;
            var varReport = SEARCH.lookupFields({
                type: 'customrecord_lmry_br_features',
                id: idrpts,
                columns: ['custrecord_lmry_br_id_schedule', 'custrecord_lmry_br_id_deploy', 'name']
            });
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

            //Period Name
            if (idrpts == 11) {// GNRE
                var num_receita = context.request.parameters.custpage_lmry_receita;
                var num_estado = context.request.parameters.custpage_lmry_estado;
                if(num_receita=='1396' || (num_receita=='1397' && (num_estado=='42' || num_estado=='23'))){
                    var initialFechaRefer = context.request.parameters.custpage_lmry_date_refer;
                    var dateRefer = FORMAT.parse({
                      value: initialFechaRefer,
                      type: FORMAT.Type.DATE
                    });
                    var yearRefer = dateRefer.getFullYear();
                    var mesRefer = dateRefer.getMonth() + 1;

                   if (('' + mesRefer).length == 1) {
                    mesRefer = '0' + mesRefer;
                    }
                    var periodName = TraePeriodo(mesRefer) + ' ' + yearRefer;
                }else{
                    var varPeriodo = SEARCH.lookupFields({
                            type: 'accountingperiod',
                            id: context.request.parameters.custpage_lmry_periognre_refer,
                            columns: ['periodname']
                    });
                    var periodName = varPeriodo.periodname;
                }
              /********* RPT: GIA (POR CAMBIO DE FILTRO PERIODO)**********/
            } else if (idrpts == 13  || idrpts == 9 || idrpts == 18) {

              if (featTaxCalendar || featTaxCalendar == 'T') {
                var varPeriodo = SEARCH.lookupFields({
                    type: SEARCH.Type.TAX_PERIOD,
                    id: context.request.parameters.custpage_custom_period,
                    columns: ['periodname']
                });

              } else {
                var varPeriodo = SEARCH.lookupFields({
                    type: 'accountingperiod',
                    id: context.request.parameters.custpage_custom_period,
                    columns: ['periodname']
                });
              }
              var periodName = varPeriodo.periodname;

            } else {
              var varPeriodo = SEARCH.lookupFields({
                  type: 'accountingperiod',
                  id: context.request.parameters.custpage_periodo,
                  columns: ['periodname']
              });
              var periodName = varPeriodo.periodname;
            }


            //Creacion de la linea en el log de errores
            var varLogRecord = RECORD.create({
                type: 'customrecord_lmry_br_rpt_generator_log'
            });

            //Nombre de Periodo - DIMOB
            var id_anio = context.request.parameters.custpage_anio;
            if (idrpts == 14) {
                var busqueda_anio = SEARCH.lookupFields({
                    type: 'accountingperiod',
                    id: id_anio,
                    columns: ['periodname']
                });
                var anio = busqueda_anio.periodname;
                anio = anio.substring(anio.length - 4, anio.length);
                varLogRecord.setValue('custrecord_lmry_br_rg_period', anio);
            } else {
                varLogRecord.setValue('custrecord_lmry_br_rg_period', periodName);
            }
            //==========================

            if(language == 'es'){
                var Pendiente = "Pendiente";
              } else if (language == 'pt'){
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

            //Reporte EFD Fiscal ---02/10/2019
            params['custscript_lmry_br_rpt_efd_fiscal_featur'] = idrpts;
            params['custscript_lmry_br_rpt_efd_fiscal_period'] = context.request.parameters.custpage_custom_period;
            params['custscript_lmry_br_rpt_efd_fisca_log_rec'] = rec_id;
            if (varFlagSubsi == true || varFlagSubsi == 'T') {
                params['custscript_lmry_br_rpt_efd_fiscal_subsid'] = context.request.parameters.custpage_subsidiary;
            }

            if (varFlagMultiB == true || varFlagMultiB == 'T') {
                params['custscript_lmry_br_rpt_efd_fiscal_multib'] = context.request.parameters.custpage_multibook;
            }
            params['custscript_lmry_br_rpt_efd_fiscal_tipo_d'] = context.request.parameters.custpage_lmry_tipo_decla;
            params['custscript_lmry_br_rpt_efd_fiscal_finali'] = context.request.parameters.custpage_lmry_nro_recti;

            //parametro para el BloqueH
            params['custscript_lmry_br_rpt_efd_fiscal_block'] = context.request.parameters.custpage_bloque_h;
            //parametro bloque G
            params['custscript_lmry_br_rpt_efd_fiscal_bloc_g'] = context.request.parameters.custpage_bloque_g;
            //para el motivo de inventario
            params['custscript_lmry_br_rpt_efd_fiscal_mot_in'] = context.request.parameters.custpage_list_mov_inv;

            //==============================================================================================================
            //                              REPORTE BR - GNRE (DIFAL) MPRD 11/02/2020
            //==============================================================================================================
            params['custscript_lmry_br_gnre_difal_featureid'] = idrpts;
            params['custscript_lmry_br_gnre_difal_period'] = context.request.parameters.custpage_lmry_periognre_refer;
            params['custscript_lmry_br_gnre_difal_fecharef'] = context.request.parameters.custpage_lmry_date_refer;
            params['custscript_lmry_br_gnre_difal_recid'] = rec_id;
            if (varFlagSubsi == true || varFlagSubsi == 'T') {
                params['custscript_lmry_br_gnre_difal_subsid'] = context.request.parameters.custpage_subsidiary;
            }
            if (varFlagMultiB == true || varFlagMultiB == 'T') {
                params['custscript_lmry_br_gnre_difal_multib'] = context.request.parameters.custpage_multibook;
            }
            params['custscript_lmry_br_gnre_difal_uf_dest'] = context.request.parameters.custpage_lmry_estado;
            params['custscript_lmry_br_gnre_difal_receita'] = context.request.parameters.custpage_lmry_receita;
            params['custscript_lmry_br_gnre_difal_fecha_pago'] = context.request.parameters.custpage_lmry_date_pago;
            params['custscript_lmry_br_gnre_difal_fecha_venc'] = context.request.parameters.custpage_lmry_date_venci;
            params['custscript_lmry_br_gnre_difal_xcel'] = context.request.parameters.custpage_insert_xcl;

            //==============================================================================================================
            //                              REPORTE BR - GNRE - RJ MPRD 20/02/2020
            //==============================================================================================================

            //params['custscript_lmry_br_gnredifal_xls_ftr'] = idrpts;
            params['custscript_lmry_br_gnre_rj_periodo'] = context.request.parameters.custpage_lmry_periognre_refer;
            params['custscript_lmry_br_gnre_rj_recordid'] = rec_id;
            if (varFlagSubsi == true || varFlagSubsi == 'T') {
                params['custscript_lmry_br_gnre_rj_subsi'] = context.request.parameters.custpage_subsidiary;
            }
            if (varFlagMultiB == true || varFlagMultiB == 'T') {
                params['custscript_lmry_br_gnre_rj_multib'] = context.request.parameters.custpage_multibook;
            }
            params['custscript_lmry_br_gnre_rj_estado'] = context.request.parameters.custpage_lmry_estado;
            params['custscript_lmry_br_gnre_rj_receita'] = context.request.parameters.custpage_lmry_receita;
            params['custscript_lmry_br_gnre_rj_fechapago'] = context.request.parameters.custpage_lmry_date_pago;
            params['custscript_lmry_br_gnre_rj_fecharef'] = context.request.parameters.custpage_lmry_date_refer;
            params['custscript_lmry_br_gnre_rj_fechavenc'] = context.request.parameters.custpage_lmry_date_venci;
            params['custscript_lmry_br_gnre_rj_formexcel'] = context.request.parameters.custpage_insert_xcl;

            //==============================================================================================================
            //                  Reporte BR SISCOSERV Ventas
            //==============================================================================================================

            params['custscript_lmry_br_feature'] = idrpts;
            params['custscript_lmry_br_periodo'] = context.request.parameters.custpage_periodo;
            params['custscript_lmry_br_recordid'] = rec_id;
            params['custscript_lmry_br_excel'] = context.request.parameters.custpage_insert_xcl;
            if (varFlagSubsi == true || varFlagSubsi == 'T') {
                params['custscript_lmry_br_subsidiaria'] = context.request.parameters.custpage_subsidiary;
            }

            if (varFlagMultiB == true || varFlagMultiB == 'T') {
                params['custscript_lmry_br_multibook'] = context.request.parameters.custpage_multibook;
            }

            //==============================================================================================================
            //                  Reporte BR SISCOSERV Compras
            //==============================================================================================================

            params['custscript_lmry_br_sisco_compras_feature'] = idrpts;
            params['custscript_lmry_br_sisco_compras_peri'] = context.request.parameters.custpage_periodo;
            params['custscript_lmry_br_sisco_compras_rec_id'] = rec_id;
            params['custscript_lmry_br_sisco_comp_audit1'] = context.request.parameters.custpage_insert_xcl;
            if (varFlagSubsi == true || varFlagSubsi == 'T') {
                params['custscript_lmry_br_sisco_compras_subsi'] = context.request.parameters.custpage_subsidiary;
            }

            if (varFlagMultiB == true || varFlagMultiB == 'T') {
                params['custscript_lmry_br_sisco_compras_multi'] = context.request.parameters.custpage_multibook;
            }

            //==============================================================================================================

            /*|========================================================================================*/
            /*|===============================Reporte GIA PRE FORMATEADO===============================*/
            /*|========================================================================================*/
            params['custscript_lmry_gia_preformat_period'] = context.request.parameters.custpage_custom_period;
            params['custscript_lmry_gia_preformat_logid'] = rec_id;
            if (varFlagSubsi == true || varFlagSubsi == 'T') {
                params['custscript_lmry_gia_preformat_subsi'] = context.request.parameters.custpage_subsidiary;
            }
            if (varFlagMultiB == true || varFlagMultiB == 'T') {
                params['custscript_lmry_gia_preformat_multi'] = context.request.parameters.custpage_multibook;
            }
            params['custscript_lmry_gia_preformat_feature'] = idrpts;
            params['custscript_lmry_gia_preformat_gia_type'] = context.request.parameters.custpage_gia_type;
            params['custscript_lmry_gia_preformat_trans'] = context.request.parameters.custpage_transmitted;
            //==============================================================================================================
            //                              REPORTE BR - DIMOB  MPRD 28/04/2020
            //==============================================================================================================
            params['custscript_lmry_br_dimob_featureid'] = idrpts;
            params['custscript_lmry_br_dimob_period'] = context.request.parameters.custpage_anio;
            params['custscript_lmry_br_dimob_recid'] = rec_id;
            if (varFlagSubsi == true || varFlagSubsi == 'T') {
                params['custscript_lmry_br_dimob_subsid'] = context.request.parameters.custpage_subsidiary;
            }
            if (varFlagMultiB == true || varFlagMultiB == 'T') {
                params['custscript_lmry_br_dimob_multib'] = context.request.parameters.custpage_multibook;
            }
            params['custscript_lmry_br_dimob_type_decla'] = context.request.parameters.custpage_lmry_tipo_decla;
            params['custscript_lmry_br_dimob_num_recti'] = context.request.parameters.custpage_lmry_nro_recti;
            params['custscript_lmry_br_dimob_excel'] = context.request.parameters.custpage_insert_xcl;

            //==============================================================================================================
            //                              REPORTE BR - SINTEGRA  MPRD 16/07/2020
            //==============================================================================================================
            params['custscript_lmry_br_sintegra_mprd_idrep'] = idrpts;
            params['custscript_lmry_br_sintegra_mprd_per'] = context.request.parameters.custpage_custom_period;
            params['custscript_lmry_br_sintegra_mprd_idrec'] = rec_id;
            params['custscript_lmry_br_sintegra_mprd_pro'] = context.request.parameters.custpage_sintegra_type;
            if (varFlagSubsi == true || varFlagSubsi == 'T') {
                params['custscript_lmry_br_sintegra_mprd_sub'] = context.request.parameters.custpage_subsidiary;
            }
            if (varFlagMultiB == true || varFlagMultiB == 'T') {
                params['custscript_lmry_br_sintegra_mprd_mul'] = context.request.parameters.custpage_multibook;
            }
            //==============================================================================================================
            //                              REPORTE BR - NFCE (MODEL 21,22,06)  MPRD 26/08/2020
            //==============================================================================================================
            params['custscript_lmry_nfce_feature'] = idrpts;
            params['custscript_lmry_nfce_periodo'] = context.request.parameters.custpage_periodo;
            params['custscript_lmry_nfce_logid'] = rec_id;
            if (varFlagSubsi == true || varFlagSubsi == 'T') {
                params['custscript_lmry_nfce_subsidiary'] = context.request.parameters.custpage_subsidiary;
            }
            if (varFlagMultiB == true || varFlagMultiB == 'T') {
                params['custscript_lmry_nfce_multibook'] = context.request.parameters.custpage_multibook;
            }
            params['custscript_lmry_nfce_modelo']= context.request.parameters.custpage_lmry_nfce
            //==============================================================================================================
            //                              REPORTE BR - DES  MPRD 16/07/2020
            //==============================================================================================================
            params['custscript_lmry_br_des_featureid'] = idrpts;
            params['custscript_lmry_br_des_period'] = context.request.parameters.custpage_custom_period;
            params['custscript_lmry_br_des_recid'] = rec_id;
            if (varFlagSubsi == true || varFlagSubsi == 'T') {
                params['custscript_lmry_br_des_subsid'] = context.request.parameters.custpage_subsidiary;
            }
            if (varFlagMultiB == true || varFlagMultiB == 'T') {
                params['custscript_lmry_br_des_multib'] = context.request.parameters.custpage_multibook;
            }
            //==============================================================================================================

            try {

                if (idrpts == 20 || idrpts == 7 || idrpts == 8 || idrpts == 9 || idrpts == 4 || idrpts == 11 || idrpts == 14 || idrpts == 10 || idrpts == 12 || idrpts == 13 || idrpts == 18 || idrpts == 19) {
                    var Tipo_Script = TASK.TaskType.MAP_REDUCE;
                } else {
                    var Tipo_Script = TASK.TaskType.SCHEDULED_SCRIPT;
                }
                //log.debug("PARAMS",params)
                var RedirecSchdl = TASK.create({
                    taskType: Tipo_Script,
                    scriptId: varIdSchedule,
                    deploymentId: varIdDeploy,
                    params: params
                });

                if (context.request.parameters.custpage_lmry_estado == 33 && idrpts == 11) { //GNRE - RJ
                    varIdSchedule = "customscript_lmry_br_gnre_rj_mprd";
                    varIdDeploy = "customdeploy_lmry_br_gnre_rj_mprd";
                    var RedirecSchdl = TASK.create({
                        taskType: Tipo_Script,
                        scriptId: varIdSchedule,
                        deploymentId: varIdDeploy,
                        params: params
                    });
                }

                RedirecSchdl.submit();

                REDIRECT.toSuitelet({

                    scriptId: 'customscript_lmry_br_estatal_rptgen_stlt',
                    deploymentId: 'customdeploy_lmry_br_estatal_rptgen_stlt',
                    parameters: {
                        null: null
                    }
                });
            } catch (err) {
                if(language == 'es'){
                    var varMsgError = 'No se puede procesar dado que hay un proceso pendiente en la cola';
                  } else if (language == 'pt'){
                    var varMsgError = 'Não pode ser processado porque existe um processo pendente na fila';
                  } else {
                    var varMsgError = 'Cannot be processed as there is a pending process in the queue';
                  }
                LIBRARY.CreacionFormError(namereport, LMRY_script, varMsgError, err);

            }

        }
    }
    catch (err) {
        if(language == 'es'){
            var varMsgError = 'Importante: El acceso no esta permitido.';
          } else if (language == 'pt'){
            var varMsgError = 'Importante: o acesso não é permitido.';
          } else {
            var varMsgError = 'Important: Access is not allowed.';
          }
        LIBRARY.CreacionFormError(namereport, LMRY_script, varMsgError, err);
        //sendemail(err, LMRY_script);
    }
    return;
}

function ObtenerConfigFeature(paramsubsidi, idFeature) {
    var activ_feature = false;
    var licenses = new Array();
    licenses = LIB_FEATURE.getLicenses(paramsubsidi);
    activ_feature = LIB_FEATURE.getAuthorization(idFeature, licenses);

    return activ_feature;
}

function viewDetails(logDetails) {
    require(["N/xml", "N/record", "N/search", "N/format"],
        function (xml, record, search, format) {

            console.log('Resultado: ', logDetails);

            if(language == 'es'){
                var RegPer = 'Se encontro un registro para el periodo ';
                var NRegPer = 'No se encontro registro dentro del sistema REINF para el periodo ';
                var EnconRegID = 'Se encontro el registro para el proveedor/cliente con ID: ';
                var EnconReg = 'Se encontro un registro';
                var NEnconRegID = 'No se encontro registro para el proveedor/cliente con ID: ';
                var NEnconReg = 'No se encontro registro';
                var RegFec = 'Se encontro el registro registrado en la fecha siguiente: ';
            } else if (language == 'pt'){
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
                var respuestaArray = [], identificador = "- - -", nroRecibo = "- - -", status = "";

                cdRetornoElementArray = xmlDocument.getElementsByTagName('cdRetorno');

                if (cdRetornoElementArray) {
                    cdRetorno = cdRetornoElementArray[0].textContent;

                    var periodRecord = search.lookupFields({
                        type    : search.Type.ACCOUNTING_PERIOD,
                        id      : periodo,
                        columns : ['enddate', 'periodname']
                    });

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
                var respuestaArray = [], identificador = "- - -", nroRecibo = "- - -", status = "";

                var reinfElementArray = xmlDocument.getElementsByTagName("Reinf");

                if (reinfElementArray) {
                    var cdRetorno = "", entityId = "";
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
                var respuestaArray = [], identificador = "- - -", nroRecibo = "- - -", status = "", fecha;

                var reinfElementArray = xmlDocument.getElementsByTagName("Reinf");
                console.log("reinfElementArray", reinfElementArray);
                if (reinfElementArray) {
                    ideStatusElementArray = reinfElementArray[0].getElementsByTagName("ideStatus");

                    ideStatusElement = ideStatusElementArray[0].children;
                    console.log("ideStatusElement", ideStatusElement);
                    if (ideStatusElement) {
                        cdRetorno = ideStatusElement[0].textContent;

                        var periodRecord = search.lookupFields({
                            type    : search.Type.ACCOUNTING_PERIOD,
                            id      : periodo,
                            columns : ['enddate', 'periodname']
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
                                        fecha = obtenerDate(""+eventoElement[0].textContent);
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
                    fecha = date.substring(6,8) + "/" + date.substring(4,6) + "/" + date.substring(0,4) + " " + date.substring(8,10) + ":" + date.substring(10,12) + ":" + date.substring(12,14);
                }
                return fecha;
            }

            function obtenerCuerpo() {
                var respuestaArray = [], baseUrl = 'https://' + window.location.hostname + '/core/media/previewmedia.nl?id=';
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

                            if (statusElementArray) {
                                var statusElement = statusElementArray[0].children;

                                var cdStatus = statusElement[0].textContent;

                                var identificador = "", nroRecibo = "", status = "", cdRetorno = "";

                                if (cdStatus == 1) {
                                    identificador = "- - -";
                                    nroRecibo = "- - -";

                                    var ocorrenciasElementArray = xmlDocument.getElementsByTagName('ocorrencias');
                                    if (ocorrenciasElementArray) {
                                        for (var i = 0; i < ocorrenciasElementArray.length; i++) {
                                            ocorrenciasElement = ocorrenciasElementArray[i].children;
                                            status = ocorrenciasElement[1].textContent + ': ' + ocorrenciasElement[2].textContent;
                                            respuestaArray.push([identificador,nroRecibo,status]);
                                        }
                                    }
                                } else if (cdStatus== 0) {
                                    var eventoElementArray = xmlDocument.getElementsByTagName('evento');

                                    if (eventoElementArray) {
                                        var ideStatusElementArray, cdRetornoElementArray;

                                        for (var i = 0; i < eventoElementArray.length; i++) {

                                            infoRecEvElementArray = eventoElementArray[i].getElementsByTagName('infoRecEv');
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

                                            ideStatusElement = ideStatusElementArray[0].children;
                                            if (ideStatusElement && ideStatusElement.length) {
                                                cdRetorno = ideStatusElement[0].textContent;

                                                if (cdRetorno == 0) {
                                                    status = ideStatusElement[1].textContent;

                                                    nrRecArqBaseElement = eventoElementArray[i].getElementsByTagName('nrRecArqBase');
                                                    if (nrRecArqBaseElement) {
                                                        nroRecibo = nrRecArqBaseElement[0].textContent;
                                                    }
                                                    respuestaArray.push([identificador,nroRecibo,status]);
                                                } else if (cdRetorno == 2) {
                                                    status = ideStatusElement[1].textContent;

                                                    respuestaArray.push([identificador,nroRecibo,status]);
                                                } else if (cdRetorno == 1) {
                                                    paramsJson["hayError"] = true;
                                                    nroRecibo = '- - -';
                                                    regOcorrsElementArray = ideStatusElementArray[i].getElementsByTagName('regOcorrs');

                                                    for (var j = 0; j < regOcorrsElementArray.length; j++) {

                                                        regOcorrsElement = regOcorrsElementArray[j].children;
                                                        if (regOcorrsElement) {
                                                            status = regOcorrsElement[2].textContent + ': ' + regOcorrsElement[3].textContent;
                                                            if (regOcorrsElement[2].textContent == 'MS1028' || regOcorrsElement[2].textContent == 'MS1089' || regOcorrsElement[2].textContent == 'MS1091') {
                                                                paramsJson["insertarObservacion"] = true;
                                                            }
                                                        }
                                                        respuestaArray.push([identificador,nroRecibo,status]);
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
                var html = '';
                html += obtenerCabeceraDialogo(logDetails['type'], paramsJson);

                html += '<br/>';

                html += obtenerDetalleDialogo(respuestaArray);

                return html;
            }

            function obtenerCabeceraDialogo(tipoRespuestaArchivo, paramsJson) {

                if(language == 'es'){
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

                  } else if (language == 'pt'){
                    var EnvReg = 'Enviando o registro R';
                    var Correct = ' foi realizado de forma satisfatória';
                    var ContErro = ' contém erros';
                    var perdioConex = 'Registro R, envio de conexão perdida';
                    var urlRet = 'URL DE RETORNO:';
                    var descar = 'Baixar';
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
                html_cab    +=     '<tr>';
                html_cab    +=         '<td colspan="2" style="padding:6px 15px;width:67%">';

                if (tipoRespuestaArchivo == "E") {
                    if (!paramsJson["hayError"]) {
                        html_cab +=        '<p style="text-align:center;width: 100%;font-size:12px;color:#000000;border-radius: 5px;"><b>' + EnvReg + paramsJson['registro'] + Correct + '</b></p>';
                    } else {
                        html_cab +=        '<p style="text-align:center;width: 100%;font-size:12px;color:#000000;border-radius: 0px;"><b>' + EnvReg + paramsJson['registro'] + ContErro + '</b></p>';
                    }
                } else if (tipoRespuestaArchivo == "C") {
                    html_cab +=        '<p style="text-align:center;width: 100%;font-size:12px;color:#000000;border-radius: 5px;"><b>' + perdioConex + paramsJson['registro'] + '</b></p>';
                }

                html_cab    +=         '</td>';
                html_cab    +=     '</tr>';

                html_cab +=     '<tr>';
                html_cab +=         '<td style="text-align:right;padding:6px 20px;width:33%">';
                html_cab +=             '<p style="font-size:12px;color:#666666"><b>'+urlRet+'</b></p>';
                html_cab +=         '</td>';
                html_cab +=         '<td style="padding:6px 15px;width:67%">';
                html_cab +=             '<a style="style="font-size:12px;color:#000000" target="_blank" href="' + paramsJson['url'] + '">' + descar + '</a>';
                html_cab +=         '</td>';
                html_cab +=     '</tr>';

                html_cab +=     '<tr>';
                html_cab +=         '<td style="text-align:right;padding:6px 20px;width:33%">';
                html_cab +=             '<p style="font-size:12px;color:#666666"><b>'+obse+'</b></p>';
                html_cab +=         '</td>';


                if (!paramsJson["hayError"]) {

                    html_cab +=     '<td style="padding:6px 15px;width:67%">';
                    html_cab +=         '<p style="font-size:12px;color:#000000"><b></b></p>';
                    html_cab +=     '</td>';

                } else {

                    if (tipoRespuestaArchivo == "C" || paramsJson["registro"] == "1000" || paramsJson["registro"] == "2099") {

                        html_cab += '<td style="padding:6px 15px;width:67%">';
                        html_cab +=     '<p style="font-size:12px;color:#000000"><b>'+sigObs+'</b></p>';
                        html_cab += '</td>';

                    } else {
                        if (!paramsJson["insertarObservacion"]) {

                            html_cab += '<td style="padding:6px 15px;width:67%">';
                            html_cab +=     '<p style="font-size:12px;color:#000000"><b>'+revError+'</b></p>';
                            html_cab += '</td>';

                        } else {

                            html_cab += '<td style="padding:6px 15px;width:67%">';
                            html_cab +=     '<p style="font-size:12px;color:#000000"><b>' + mensaje1 + mensaje2 + mensaje3 + '</b></p>';
                            html_cab += '</td>';

                        }
                    }
                }



                html_cab +=     '</tr>';
                html_cab += '</table>';

                return html_cab;
            }

            function obtenerDetalleDialogo(respuestaArray) {

                if(language == 'es'){
                    var Iden = 'ID Identificador';
                    var NRec = 'Nro Recibo';
                    var stat = 'Estado';
                  } else if (language == 'pt'){
                    var Iden = 'ID Identificador';
                    var NRec = 'Número do Recibo';
                    var stat = 'Estado';
                  } else {
                    var Iden = 'Identifier ID';
                    var NRec = 'Receipt number';
                    var stat = 'Status';
                  }

                var html_det  = '<div style="overflow:scroll;">';
                    html_det +=     '<table  border="1px solid #333333" style="width:90%;border-collapse:collapse;text-align:center;margin: 0 auto;">';

                    html_det +=         '<tr>';
                    html_det +=             '<td style="padding:6px 15px;width:30%">';
                    html_det +=                 '<p style="font-size:12px;color:#666666"><b>'+Iden+'</b></p>';
                    html_det +=             '</td>';
                    html_det +=             '<td style="padding:6px 15px;width:30%">';
                    html_det +=                 '<p style="font-size:12px;color:#666666"><b>'+NRec+'</b></p>';
                    html_det +=             '</td>';
                    html_det +=             '<td style="padding:6px 15px;width:40%">';
                    html_det +=                 '<p style="font-size:12px;color:#666666"><b>'+stat+'</b></p>';
                    html_det +=             '</td>';
                    html_det +=         '</tr>';


                    for (var i = 0; i < respuestaArray.length; i++) {
                        html_det +=     '<tr>';
                        html_det +=         '<td style="padding:6px 15px;width:30%">';
                        html_det +=             '<p style="font-size:12px;color:#000000"><b>' + respuestaArray[i][0] + '</b></p>';
                        html_det +=         '</td>';
                        html_det +=         '<td style="padding:6px 15px;width:30%">';
                        html_det +=             '<p style="font-size:12px;color:#000000"><b>' + respuestaArray[i][1] + '</b></p>';
                        html_det +=         '</td>';
                        html_det +=         '<td style="padding:6px 15px;width:40%">';
                        html_det +=             '<p style="font-size:12px;color:#000000"><b>' + respuestaArray[i][2] + '</b></p>';
                        html_det +=         '</td>';
                        html_det +=     '</tr>';
                    }

                    html_det +=     '</table>';
                    html_det += '</div>';

                return html_det;
            }

            function obtenerSouthHTML() {
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
                southHTML += '                  <input type="button" style="" class="rndbuttoninpt bntBgT" value="Aceptar" name="resetter" onclick="closePopup();">';
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

                var width = 1100, height = 400;

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
                Ext.create({
                    xtype: 'window',
                    width: width,
                    layout: 'border',
                    height: height,
                    autoScroll: true,
                    title: 'DETAILS',
                    modal: true,
                    items: [objExtForm, objExtFormTwo],
                }).show();

            }

            crearVentana();
        }
    );
}

function addPeriods(select_period) {
    var search_period = SEARCH.create({
        type: 'accountingperiod',
        filters: [
            ['isadjust', 'is', 'F'], 'AND',
            ['isquarter', 'is', 'F'], 'AND',
            ['isinactive', 'is', 'F'], "AND",
            ['isyear', 'is', 'F']
        ],
        columns:
            [
                SEARCH.createColumn({ name: "internalid", summary: "GROUP", sort: SEARCH.Sort.DESC, label: "Internal ID" }),
                SEARCH.createColumn({ name: "periodname", summary: "GROUP", label: "Name" })
            ]
    });
    var results = search_period.run().getRange(0, 1000);
    var columns = search_period.columns;

    select_period.addSelectOption({
        value: ' ',
        text: ' '
    });

    if (results && results.length) {
        for (var i = 0; i < results.length; i++) {
            var id = results[i].getValue(columns[0]);
            var name = results[i].getValue(columns[1]);
            select_period.addSelectOption({
                value: id,
                text: name
            });
        }
    }
}

function TraePeriodo(periodo) {

    var mes = '';
    switch (periodo) {
      case '01':
        mes = 'Jan';
        break;
      case '02':
        mes = 'Feb';
        break;
      case '03':
        mes = 'Mar';
        break;
      case '04':
        mes = 'Apr';
        break;
      case '05':
        mes = 'May';
        break;
      case '06':
        mes = 'Jun';
        break;
      case '07':
        mes = 'Jul';
        break;
      case '08':
        mes = 'Aug';
        break;
      case '09':
        mes = 'Sep';
        break;
      case '10':
        mes = 'Oct';
        break;
      case '11':
        mes = 'Nov';
        break;
      case '12':
        mes = 'Dec';
        break;

    }
    //nlapiLogExecution('DEBUG', 'auxmess2-> ',auxmess);
    return mes;
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
            // log.error('result', objResult[i]);
            // log.error('Name', objResult[i].getValue(columns[1]));
            // log.error('URL', objResult[i].getValue(columns[2]));

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
        LIBRARY.sendMail(LMRY_script, ' [ onRequest ] ' + err);

    }
    return true;
}