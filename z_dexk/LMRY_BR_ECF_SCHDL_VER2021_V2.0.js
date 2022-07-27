/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for Inventory Balance Library                  ||
||                                                              ||
||  File Name: LMRY_BR_ECF_SCHDL_VER2021_V2.0.js         ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Aug 16 2018  geral    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
 define(["N/record", "N/runtime", "N/file", "N/email", "N/search", "N/format",
 "N/log", "N/config", "N/task", "./BR_LIBRERIA_MENSUAL/LMRY_BR_Reportes_LBRY_V2.0.js","/SuiteBundles/Bundle 37714/Latam_Library/LMRY_LibraryReport_LBRY_V2.js"
],

function(record, runtime, fileModulo, email, search, format, log,
 config, task, libreria,libFeature) {

 var objContext = runtime.getCurrentScript();
 // Nombre del Reporte
 var namereport = "BR - ECF";
 var LMRY_script = 'LMRY_BR_Reporte_ECF_SCHDL_v2.0.js';

 //ParÃ¡metros
 var param_RecorID = null;
 var param_AnioCalendario = null;
 var param_Subsi = null;
 var param_Num_Recti = null;
 var param_Multi = null;
 var param_Feature = null;
 var param_idfile = null;
 var param_AccountCostingIdFile = '';
 var param_AccountsPadronBIdFile = '';
 var paramNumOrder = null;

 //var param_TransactionsIdFile = '';
 var param_AccountsForPeriodIdFile = '';
 var param_AccountsM300IdFile = '';
 var param_AccountsM350IdFile = '';
 var param_AccountsBloqueJId = '';
 var param_AccountsBloqueKId = '';
 var param_ArchivoECD_Id = '';
 var param_ArchivoECD_Id_2 = '';
 var param_AccountsPlanTotalIdFile = '';
 var param_J050 = '';
 var param_J051 = '';
 var param_K = '';


 var filter_Feature_tax = null;
 var filter_Feature_taxcode = null;
 var file_size = 7340032;

 //Features
 var feature_Subsi = null;
 var feature_Multi = null;

 //Datos de Subsidiaria
 var companyname = null;
 var companyruc = null;

 //Datos del Setup de la  subsidiaria
 //tab del EFD FISCAL
 var IND_SIT_INI_PER = null;
 var SIT_ESPECIAL = null;
 var PAT_REMAN_CIS = null;
 var DT_SIT_ESP = null;
 var TIP_ECF = null;
 var NUM_REC = null;
 var IDENT_CPF_CNPJ_1 = null;
 var DDDFONE_1 = null;
 var Email_1 = null;
 var IDENT_NOM_1 = null;
 var IDENT_CPF_CNPJ_2 = null;
 var DDDFONE_2 = null;
 var Email_2 = null;
 var IDENT_NOM_2 = null;
 var IDENT_QUALIF_1 = null;
 var IDENT_QUALIF_2 = null;
 var STOCK_VALUATION = null;
 var GEN_COST_CENTER = null;
 var califPj = null
 var Reg0010 = null;
 var Reg0020 = null;
 var Reg0021 = null;

 var codPlanCuentasReferencial = "";

 //variables para el bloque p
 var setupJson = {};
 var subsidiaryJson = {};

 var numeroLineasBloqueP = 0;

 var cuentasReferencialesJson = {
     "resultado": [],
     "noresultado": []
 };

 var registrosP200Json = {};
 var registrosP400Json = {};

 var registrosP300Json = {
     "1": ["BASE DE CÁLCULO DO IMPOSTO SOBRE O LUCRO PRESUMIDO", "CA"],
     "2": ["IMPOSTO APURADO COM BASE NO LUCRO PRESUMIDO", "R"],
     "3": ["À Alíquota de 15%", "CNA"],
     "4": ["Adicional", "CNA"],
     "5": ["Diferença de IR Devida pela Mudança de Coeficiente sobre a Receita Bruta", "E"],
     "15": ["IMPOSTO DE RENDA A PAGAR", "CNA"]
 };

 var registrosP500Json = {
     "1": ["BASE DE CÁLCULO DA CSLL", "CA"],
     "2": ["CSLL Apurada", "CNA"],
     "3": ["Adição de Créditos de CSLL sobre Depreciação Utilizados no Regime de Lucro Real (Lei nº 11.051/2004, art. 1º, § 9º)", "E"],
     "4": ["TOTAL DA CONTRIBUIÇÃO SOCIAL SOBRE O LUCRO LÍQUIDO", "CNA"],
     "13": ["CSLL A PAGAR", "CNA"]
 };



 //montos globales que se utilizaran mas adelante equisde

 //Datos de la Subsidiaria
 var subsiname = null;
 var cnpj_scp = null;
 var cnpj = null;
 var COD_NAT = null;
 var nire = null;
 var CNAE_FISCAL = null;
 var ENDERECO = null;
 var NUM = null;
 var COMPL = null;
 var BARRIO = null;
 var UF = null;
 var COD_MUN = null;
 var CEP = null;
 var NUM_TEL = null;
 var Email = null;
 var regimen = null;

 //variables para las fechas
 var periodenddate = null;
 var periodfirstdate = null;
 var startDate = null;
 var startdate = null;
 var periodStartDate = '';
 var fechaInicial = null;
 var fechaFinal = null;
 var AAAA = null;

 //Nombre de libro contable
 var multibookName = '';

 //String para generar el Reporte
 var StrReporte = '';

 //Arreglos que se Usaran
 var ArrBloque9 = new Array();

 //mis contadores
 var contador_global = 0;
 var contador_L00 = 0;
 var numeroLineasL030 = 0;
 var contador_L100 = 0;
 var numeroLineasL200 = 0;
 var contador_L210 = 0;
 var contador_L300 = 0;
 var contador_M010 = 0;
 var contador_M030 = 0;
 var contador_M300 = 0;
 var contador_M00 = 0;
 var numeroLineasM030 = 0;
 var numeroLineasM300 = 0;
 var numeroLineasM350 = 0;
 var contador_M500 = 0;
 var numeroLineasK030 = 0;
 var numeroLineasK155 = 0;


 //ARREGLOS
 var registrosMostrados = [];
 var saldoPeriodosJson = {
     0: [],
     1: [],
     2: [],
     3: [],
     4: [],
     5: [],
     6: [],
     7: [],
     8: [],
     9: [],
     10: [],
     11: [],
     12: []
 }; //cuentas de balance utilizadopara l100 anual
 var saldoPeriodosResultadoJson = {
     0: [],
     1: [],
     2: [],
     3: [],
     4: [],
     5: [],
     6: [],
     7: [],
     8: [],
     9: [],
     10: [],
     11: [],
     12: []
 }; //cuentas de resultado
 var saldoPeriodosLA00Json = {
     0: [],
     1: [],
     2: [],
     3: [],
     4: [],
     5: [],
     6: [],
     7: [],
     8: [],
     9: [],
     10: [],
     11: [],
     12: []
 }; //cuentas en general para el registro A00 del Bloque L
 var planCuentasCostingArray = [];
 var SaldosCuentasPadronBArray = []; // cuentas y saldos del paronBpara registro M010
 var planCuentasTotalesResultadoArray = [];
 var saldoPeriodosL210Json = {}; //cuentas finales para el l210
 var saldoPeriodosM010Json = {}; //cuentas finales para el m010

 var planCuentasTotalesBalanceArray = [];
 var saldoPeriodosLanzaM300Json = {}; // saldos y cuentas totales de lanzamiento para registro M300 m00
 var saldoPeriodosirpjM300Json = {}; // saldos y cuentas de lanzamiento tipo irpj para registro m300
 var saldoPeriodoscsllM350Json = {}; // saldos y cuentas de lanzamiento tipo csll para registro m350
 var ArrReturn = [];
 var transactionsJson = {};

 //variabales para bloque K
 var saldoPerBloqueKJson = {
     0: [],
     1: [],
     2: [],
     3: [],
     4: [],
     5: [],
     6: [],
     7: [],
     8: [],
     9: [],
     10: [],
     11: [],
     12: []
 };



 var montosAcumuladosBrCoaJson = {};
 var numeroLineasBloqueK = 0;
 var numeroLineasBloqueC = 0;
 var numeroLineasBloqueE = 0;

 //variable para bloque J
 var planCuentasBloqueJJson = {};
 var numeroLineasBloqueJ = 0;
 var localAccountJsonJ051 = {};
 var departmentJson = {};

 // variable que contiene el archivo final del ecd
 var ArchivoECDJson = [];
 var ArchivoECDJson_2 = []; //por si hay otro archivo del ecd por superar los 10 mb


 //var saldoPeriodosJson = {0:[],1:[],2:[],3:[],4:[],5:[],6:[],7:[],8:[],9:[],10:[],11:[],12:[]};


 var ArrAgrupadoAnual = [];
 var ArrAgrupadoAnual_Result = [];
 var ArrAgrupadoAnual_m300 = [];
 var ArrAgrupadoAnual_CSLL = [];
 var ArrAgrupadoAnual_L210 = [];
 var ArrAgrupadoAnual_M010 = [];
 var ArrAgrupadoAnual_K00 = [];
 var ArrCuentaReferencial = [];
 var arrBloquel100 = [];
 var L100Final = [];
 var arrBloquel300 = [];
 var L300Final = [];

 var arrBloquel100_mensual = [];
 var L100Final_mensual = [];
 var arrBloquel300_mensual = [];
 var L300Final_mensual = [];
 var arrTempM010 = [];
 var ArrNewregistrok155_dic = [];
 var ArrNewregistroL100_dic = [];
 var arrTempK155_mensual = []
 var arrTempKECD = []
 var arrTempK155 = [];

 var ArrCuentaReferencial = [];
 var arregloFechas = [];

 var N500_codes = {
     "1": "Valor da base de cálculo do IRPJ",
     "2": "Valor da base de cálculo do IRPJ - Estimativa com base na receita bruta"
 };

 var m300_175 = 0;
 var m350_175 = 0;
 var N500_values = [
     [1, 1],
     [2, 2],
     [3, 3],
     [4, 4],
     [5, 5],
     [6, 6],
     [7, 7],
     [8, 8],
     [9, 9],
     [10, 10],
     [11, 11],
     [12, 12],
     [13, 13]
 ];

 var N620_codes = {
     "1": "Base de Cálculo do Imposto de Renda",
     "2": "IMPOSTO DE RENDA APURADO",
     "3": "A Alíquota de 15%",
     "4": "Adicional",
     "5": "Diferença de IR Devida pela Mudança de Coeficiente sobre a Receita Bruta",
     "6": "DEDUÇÕES",
     "7": "(-) Operações de Caráter Cultural e Artístico",
     "9": "(-) Programa de Alimentação do Trabalhador",
     "10": "(-) Desenvolvimento Tecnológico Industrial / Agropecuário",
     "11": "(-) Atividade Audiovisual",
     "12": "(-) Fundos dos Direitos da Criança e do Adolescente",
     "13": "(-) Fundos Nacional, Estaduais ou Municipais do Idoso (Lei nº 12.213/2010, art. 3º)",
     "14": "(-) Atividades de Caráter Desportivo",
     "15": "(-) Programa Nacional de Apoio à Atenção Oncológica - PRONON (Lei nº 12.715/2012, arts. 1º e 4º)",
     "16": "(-) Programa Nacional de Apoio à Atenção da Saúde da Pessoa com Deficiência - PRONAS/PCD (Lei nº 12.715/2012, arts. 3º e 4º)",
     "17": "(-) Valor da Remuneração da Prorrogação da Licença-Maternidade e da Licença-Paternidade (Lei nº 11.770/2008, art. 5º)",
     "17.01": "(-) Crédito Presumido de 9% Sobre a Parcela dos Lucros Auferidos no Exterior (Art. 28, da Instrução Normativa 1.520/2014)",
     "17.05": "(-) Programa Rota 2030 - Mobilidade e Logística - Despesa Operacional do Período (Art. 11 da Lei nº 13.755/2018)",
     "17.06": "(-) Programa Rota 2030 - Mobilidade e Logística - Parcela Excedente de Períodos Anteriores (Art. 11, § 3º da Lei nº 13.755/2018)",
     "18": "(-) Isenção e Redução do Imposto",
     "19": "(-) Redução por Reinvestimento",
     "20": "(-) Imposto de Renda Devido em Meses Anteriores",
     "20.01": "(-) Imposto de Renda Devido no Mês Antes de Retenções e Pagamentos",
     "21": "(-) Imposto de Renda Retido na Fonte",
     "22": "(-) Imposto Pago no Exterior sobre Lucros, Rendimentos e Ganhos de Capital",
     "23": "(-) Imposto de Renda Retido na Fonte por Órgãos, Autarquias e Fundações Federais (Lei nº 9.430/1996, art. 64)",
     "24": "(-) Imposto de Renda Retido na Fonte pelas Demais Entidades da Administração Pública Federal (Lei n° 10.833/2003, art. 34)",
     "25": "(-) Imposto de Renda Pago sobre Ganhos no Mercado de Renda Variável",
     "25.01": "(-) Imposto Sobre a Renda Pago no Exterior pela Controlada Direta ou Indireta, no Caso do Art. 87 da Lei nº 12.973/2014",
     "25.02": "(-) Imposto Sobre a Renda Retido na Fonte no Exterior Incidente Sobre os Dividendos no Caso do Art. 88 da Lei nº 12.973/2014",
     "26": "IMPOSTO DE RENDA DEVIDO NO MÊS"
 };

 var N620_values = [
     [1, 1],
     [2, 2],
     [3, 3],
     [4, 4],
     [5, 5],
     [6, 6],
     [7, 7],
     [8, 8],
     [9, 9],
     [10, 10],
     [11, 11],
     [12, 12],
     [13, 13]
 ];

 var N630A_codes = {
     "1": "BASE DE CÁLCULO DO IRPJ",
     "2": "IMPOSTO SOBRE O LUCRO REAL",
     "3": "À Alíquota de 15%",
     "4": "Adicional",
     "5": "DEDUÇÕES",
     "6": "(-) Operações de Caráter Cultural e Artístico",
     "8": "(-) Programa de Alimentação do Trabalhador",
     "9": "(-) Desenvolvimento Tecnológico Industrial / Agropecuário",
     "10": "(-) Atividade Audiovisual",
     "11": "(-) Fundos dos Direitos da Criança e do Adolescente",
     "12": "(-) Fundos Nacional, Estaduais ou Municipais do Idoso (Lei nº 12.213/2010, art. 3º)",
     "13": "(-) Atividades de Caráter Desportivo",
     "14": "(-) Programa Nacional de Apoio à Atenção Oncológica - PRONON (Lei nº 12.715/2012, arts. 1º e 4º)",
     "15": "(-) Programa Nacional de Apoio à Atenção da Saúde da Pessoa com Deficiência - PRONAS/PCD (Lei nº 12.715/2012, arts. 3º e 4º)",
     "16": "(-) Valor da Remuneração da Prorrogação da Licença-Maternidade e da Licença-Paternidade (Lei nº 11.770/2008, art. 5º)",
     "16.01": "(-) Crédito Presumido de 9% Sobre a Parcela dos Lucros Auferidos no Exterior (Art. 28, da Instrução Normativa 1.520/2014)",
     "16.04": "(-) Imposto Sobre a Renda Pago no Exterior pela Controlada Direta ou Indireta, no Caso do Art. 87 da Lei nº 12.973/2014",
     "16.05": "(-) Imposto Sobre a Renda Retido na Fonte no Exterior Incidente Sobre os Dividendos no Caso do Art. 88 da Lei nº 12.973/2014",
     "16.06": "(-) Programa Rota 2030 - Mobilidade e Logística - Despesa Operacional do Período (Art. 11 da Lei nº 13.755/2018)",
     "16.07": "(-) Programa Rota 2030 - Mobilidade e Logística - Parcela Excedente de Períodos Anteriores (Art. 11, § 3º da Lei nº 13.755/2018)",
     "17": "(-) Isenção e Redução do Imposto",
     "18": "(-) Redução por Reinvestimento",
     "19": "(-) Imposto Pago no Exterior sobre Lucros, Rendimentos e Ganhos de Capital",
     "20": "(-) Imposto de Renda Retido na Fonte",
     "21": "(-) Imposto de Renda Retido na Fonte por Órgãos, Autarquias e Fundações Federais (Lei nº 9.430/1996, art. 64)",
     "22": "(-) Imposto de Renda Retido na Fonte pelas Demais Entidades da Administração Pública Federal (Lei n° 10.833/2003, art. 34)",
     "23": "(-) Imposto Pago Incidente sobre Ganhos no Mercado de Renda Variável",
     "24": "(-) Imposto de Renda Mensal Efetivamente Pago por Estimativa",
     "25": "(-) Parcelamento Formalizado de IR sobre a Base de Cálculo Estimada",
     "26": "IMPOSTO DE RENDA A PAGAR",
     "27": "IMPOSTO DE RENDA SOBRE A DIFERENÇA ENTRE O CUSTO ORÇADO E O CUSTO EFETIVO",
     "28": "IMPOSTO DE RENDA POSTERGADO DE PERÍODOS DE APURAÇÃO ANTERIORES"
 };

 var N630A_values = [
     [1, 1],
     [2, 2],
     [3, 3],
     [4, 4],
     [5, 5],
     [6, 6],
     [7, 7],
     [8, 8],
     [9, 9],
     [10, 10],
     [11, 11],
     [12, 12],
     [13, 13]
 ];

 var N650_codes = {
         "1": "Valor da Base de Cálculo da CSLL",
         "2": "Valor da Base de Cálculo da CSLL - Estimativa com Base na Receita Bruta"
     },
     N650_values = [];

 var N660_codes = {
         "1": "CÁLCULO DA CSLL",
         "2": "Base de Cálculo da CSLL",
         "3": "CSLL Apurada",
         "4": "DEDUÇÕES",
         "5": "(-) Isenção sobre o Lucro da Exploração Relativo ao Prouni",
         "6": "(-) Isenção sobre o Lucro da Exploração de Eventos da Fifa",
         "7": "(-) Isenção sobre o Lucro da Exploração da Atividade de Serviços - SPE - Eventos da Fifa",
         "8": "(-) Isenção sobre o Lucro da Exploração de Eventos do CIO",
         "9": "(-) Isenção sobre o Lucro da Exploração da Atividade de Serviços - SPE - Eventos do CIO",
         "10": "(-) Recuperação de Crédito de CSLL (MP nº 1.807/1999, art. 8º)",
         "11": "(-) Créditos sobre Depreciação de Bens do Ativo Imobilizado (Lei nº 11.051/2004, art. 1º)",
         "11.01": "(-) Programa Rota 2030 - Mobilidade e Logística - Despesa Operacional do Período (Art. 11 da Lei nº 13.755/2018)",
         "11.02": "(-) Programa Rota 2030 - Mobilidade e Logística - Parcela Excedente de Períodos Anteriores (Art. 11, § 3º da Lei nº 13.755/2018)",
         "12": "(-) CSLL Devida em Meses Anteriores",
         "12.01": "CSLL Devida no Mês Antes de Retenções e Pagamentos",
         "13": "(-) Imposto Pago no Exterior sobre Lucros, Rendimentos e Ganhos de Capital (MP nº 1.858-6/1999, art. 19)",
         "14": "(-) CSLL Retida na Fonte por Órgãos, Autarquias e Fundações Federais (Lei nº 9.430/1996, art. 64)",
         "15": "(-) CSLL Retida na Fonte pelas Demais Entidades da Administração Pública Federal (Lei n° 10.833/2003, art. 34)",
         "16": "(-) CSLL Retida na Fonte por Pessoas Jurídicas de Direito Privado (Lei n° 10.833/2003, art. 30)",
         "17": "(-) CSLL Retida na Fonte por Órgãos, Autarquias e Fundações dos Estados, Distrito Federal e Municípios (Lei n° 10.833/2003, art. 33)",
         "17.01": "(-) Imposto Sobre a Renda Pago no Exterior pela Controlada Direta ou Indireta, no Caso do Art. 87 da Lei nº 12.973/2014",
         "17.02": "(-) Imposto Sobre a Renda Retido na Fonte no Exterior Incidente Sobre os Dividendos no Caso do Art. 88 da Lei nº 12.973/2014",
         "18": "CSLL DEVIDA NO MÊS"
     },
     N660_values = [];

 var N670_codes = {
         "1": "BASE DE CÁLCULO DA CSLL",
         "2": "Contribuição Social sobre o Lucro Líquido por Atividade",
         "3": "Adição de Créditos de CSLL sobre Depreciação Utilizados Anteriormente (Lei nº 11.051/2004, art. 1º, §§ 7º, 11 e 12)",
         "4": "TOTAL DA CONTRIBUIÇÃO SOCIAL SOBRE O LUCRO LÍQUIDO",
         "5": "DEDUÇÕES",
         "6": "(-) Recuperação de Crédito de CSLL (MP nº 1.807/1999, art. 8º)",
         "7": "(-) Créditos sobre Depreciação de Bens do Ativo Imobilizado (Lei nº 11.051/2004, art. 1º)",
         "8": "(-) Isenção sobre o Lucro da Exploração Relativo ao Prouni",
         "9": "(-) Isenção sobre o Lucro da Exploração de Eventos da Fifa",
         "10": "(-) Isenção sobre o Lucro da Exploração da Atividade de Serviços SPE Eventos da Fifa",
         "11": "(-) Isenção sobre o Lucro da Exploração de Eventos do CIO",
         "12": "(-) Isenção sobre o Lucro da Exploração da Atividade de Serviços - SPE - Eventos do CIO",
         "13": "(-) Bônus de Adimplência Fiscal (Lei nº 10.637/2002, art. 38)",
         "13.01": "(-) Programa Rota 2030 - Mobilidade e Logística - Despesa Operacional do Período (Art. 11 da Lei nº 13.755/2018)",
         "13.02": "(-) Programa Rota 2030 - Mobilidade e Logística - Parcela Excedente de Períodos Anteriores (Art. 11, § 3º da Lei nº 13.755/2018)",
         "14": "(-) Imposto Pago no Exterior sobre Lucros, Rendimentos e Ganhos de Capital (MP nº 1.858-6/1999, art. 19)",
         "14.03": "(-) Imposto Sobre a Renda Pago no Exterior pela Controlada Direta ou Indireta, no Caso do Art. 87 da Lei nº 12.973/2014",
         "14.04": "(-) Imposto Sobre a Renda Retido na Fonte no Exterior Incidente Sobre os Dividendos no Caso do Art. 88 da Lei nº 12.973/2014",
         "15": "(-) CSLL Retida na Fonte por Órgãos, Autarquias e Fundações Federais (Lei nº 9.430/1996, art. 64)",
         "16": "(-) CSLL Retida na Fonte pelas Demais Entidades da Administração Pública Federal (Lei n° 10.833/2003, art. 34)",
         "17": "(-) CSLL Retida na Fonte por Pessoas Jurídicas de Direito Privado (Lei n° 10.833/2003, art. 30)",
         "18": "(-) CSLL Retida na Fonte por Órgãos, Autarquias e Fundações dos Estados, Distrito Federal e Municípios (Lei n° 10.833/2003, art. 33)",
         "19": "(-) CSLL Mensal Efetivamente Paga por Estimativa",
         "20": "(-) Parcelamento Formalizado de CSLL sobre a Base de Cálculo Estimada",
         "21": "CSLL A PAGAR",
         "22": "CSLL SOBRE A DIFERENÇA ENTRE O CUSTO ORÇADO E O CUSTO EFETIVO",
         "23": "CSLL POSTERGADA DE PERÍODOS DE APURAÇÃO ANTERIORES"
     },
     N670_values = [];

 var language = runtime.getCurrentScript().getParameter({
     name: 'LANGUAGE'
 }).substring(0, 2);

 function execute(context) {
     //try {
    
     ObtenerParametrosYFeatures();

     var a = 'Accounts_Plan_ECD';
     var b = 'Local_Account_Accounting_Group_ECD';
     var c = 'AccountsForPeriods_I150_ECD';
     //archivo final generado del ecd 
     var d = 'SpedECD-' + cnpj + '_' + fechaInicial + '_' + fechaFinal + '_G.txt';
     var e = 'SpedECD-' + cnpj + '_' + fechaInicial + '_' + fechaFinal + '_G_';

     param_AccountsBloqueJId = CargarIDFileCabinet(a); //Accounts_Plan_ECD_    -para bloque j
     param_J051LocalAccountId = CargarIDFileCabinet(b); //Local_Account_Accounting_Group_ECD_   - para bloque J051
     param_AccountsBloqueKId = CargarIDFileCabinet(c); //AccountsForPeriods_I150_ECD_     - para bloque k 
     param_ArchivoECD_Id = CargarIDFileCabinet(d); //rchivo generado del ecf
     param_ArchivoECD_Id_2 = CargarIDFileCabinet(e); //archivo generado delecf particionado
    
     ObtenerSetupRptECF();
     ObtenerDepartamentos();
     ObtenerDatosSubsidiaria();

     codPlanCuentasReferencial = obtenerCodPlanCuentasReferencial();
     if (param_AccountCostingIdFile != '' && param_AccountCostingIdFile != null) {
         ObtenerArchivo(param_AccountCostingIdFile, 1); //cuentas de costing L210
     }
     if (param_AccountsForPeriodIdFile != '' && param_AccountsForPeriodIdFile != null) {
         ObtenerArchivo(param_AccountsForPeriodIdFile, 2); //cuentas con todas las transacciones y saldos 
     } else {
         ObtenerArchivo(param_AccountsPlanTotalIdFile, 3); //funciona cuando el map no trae data. Cuentas totales sin data con saldo inicial 
     }

     if (param_AccountsPadronBIdFile != '' && param_AccountsPadronBIdFile != null) {
         ObtenerArchivo(param_AccountsPadronBIdFile, 4); //transacciones para M010
     }
     if (param_AccountsM300IdFile != '' && param_AccountsM300IdFile != null) {
         ObtenerArchivo(param_AccountsM300IdFile, 5); //transacciones para m300
     }
     if (param_AccountsM350IdFile != '' && param_AccountsM350IdFile != null) {
         ObtenerArchivo(param_AccountsM350IdFile, 6); //transacciones para m350
     }

     if (param_AccountsBloqueJId != '' && param_AccountsBloqueJId != null) {
         ObtenerArchivo(param_AccountsBloqueJId, 7);
     }

     if (param_J051LocalAccountId != '' && param_J051LocalAccountId != null) {
         ObtenerArchivo(param_J051LocalAccountId, 8);
     }

     if (param_AccountsBloqueKId != '' && param_AccountsBloqueKId != null) {
         ObtenerArchivo(param_AccountsBloqueKId, 9);
     }

     if (param_ArchivoECD_Id != '' && param_ArchivoECD_Id != null) {
         ObtenerArchivo(param_ArchivoECD_Id, 10);
        
     }
     if (param_ArchivoECD_Id_2 != '' && param_ArchivoECD_Id_2 != null) {
         ObtenerArchivo(param_ArchivoECD_Id_2, 11);
     }

     obtenerCuentasReferenciales();

     obtenerBRP200ECF();

     obtenerBRP400ECF();

     GenerarBloquesNecesarios();

     if (StrReporte.length != 0) {
         SaveFile();
     } else {
         NoData();
     }
     //  } catch (error) {

     //       log.error("ERROR", error);
     //     libreria.sendemailTranslate(error, LMRY_script, language);
     //   }
 }

 function BuscarL210() {
     var DbolStop = false;
     var arrL210 = new Array();
     var cont = 0;
     var savedSearch = search.create({
         type: 'customrecord_lmry_br_costing_account',
         filters: ["isinactive", "is", "F"],
         columns: [
             search.createColumn({
                 name: "internalid",
                 sort: search.Sort.ASC,
                 label: "Internal ID"
             }),
             search.createColumn({
                 name: "name",
                 label: "Name"
             }),
             search.createColumn({
                 name: "custrecord_lmry_br_costing_code",
                 label: "Latam - BR Costing Code"
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
                 //0. id l210
                 if (objResult[i].getValue(columnas[0]) != null) {
                     arrAuxiliar[0] = objResult[i].getValue(columnas[0]);
                 } else {
                     arrAuxiliar[0] = '';
                 }
                 //1. name l210
                 if (objResult[i].getValue(columnas[1]) != null) {
                     arrAuxiliar[1] = objResult[i].getValue(columnas[1]);
                 } else {
                     arrAuxiliar[1] = '';
                 }
                 //2. codigo l210
                 if (objResult[i].getValue(columnas[2]) != null) {
                     arrAuxiliar[2] = objResult[i].getValue(columnas[2]);
                 } else {
                     arrAuxiliar[2] = '';
                 }

                 arrL210[cont] = arrAuxiliar;
                 cont++;
             }
             if (intLength < 1000) {
                 DbolStop = true;
             }
         }
     }
     // log.error('arrL210', arrL210);
     return arrL210;
 }

 function BuscarM300() {
     var DbolStop = false;
     var arrM300 = new Array();
     var cont = 0;
     var savedSearch = search.create({
         type: 'customrecord_lmry_br_lanzpartea_ecf',
         filters: ["isinactive", "is", "F"],
         columns: [
             search.createColumn({
                 name: "internalid",
                 sort: search.Sort.ASC,
                 label: "Internal ID"
             }),
             search.createColumn({
                 name: "custrecord_lmry_br_code_lanzamiento",
                 label: "Latam - BR Code Release"
             }),
             search.createColumn({
                 name: "name",
                 label: "Name"
             }),
             search.createColumn({
                 name: "custrecord_lmry_br_type_release",
                 label: "Latam - BR Type Release"
             }),
             search.createColumn({
                 name: "custrecord_lmry_br_ind_release_parta",
                 label: "Latam - BR Ind. Release Part A"
             }),
             search.createColumn({
                 name: "custrecord_lmry_br_tax_release",
                 label: "Latam - BR Tax Release"
             }),
             search.createColumn({
                 name: "custrecord_lmry_br_account_type_ecf",
                 label: "Latam - BR Type Account ECF"
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
                 //0. id m300
                 if (objResult[i].getValue(columnas[0]) != null) {
                     arrAuxiliar[0] = objResult[i].getValue(columnas[0]);
                 } else {
                     arrAuxiliar[0] = '';
                 }
                 //1. codigo de lanzamiento
                 if (objResult[i].getValue(columnas[1]) != null) {
                     arrAuxiliar[1] = objResult[i].getValue(columnas[1]);
                 } else {
                     arrAuxiliar[1] = '';
                 }
                 //2. descripcion de lanzamiento
                 if (objResult[i].getValue(columnas[2]) != null) {
                     arrAuxiliar[2] = objResult[i].getValue(columnas[2]);
                 } else {
                     arrAuxiliar[2] = '';
                 }
                 //3. tipo de lanzamiento indicador 
                 if (objResult[i].getValue(columnas[3]) != null) {
                     var tipola = objResult[i].getText(columnas[3]);
                     arrAuxiliar[3] = tipola.substring(0, 1);
                 } else {
                     arrAuxiliar[3] = '';
                 }

                 //4. indicador de relacionamiento de lanzamiento
                 if (objResult[i].getValue(columnas[4]) != null) {
                     arrAuxiliar[4] = objResult[i].getValue(columnas[4]);
                 } else {
                     arrAuxiliar[4] = '';
                 }
                 //5. tipo  de impuesto al que pertenece el lanzamiento
                 if (objResult[i].getValue(columnas[5]) != null) {
                     var campo4 = objResult[i].getText(columnas[5]);
                 } else {
                     var campo4 = '';
                 }
                 // log.error('campo4',campo4);

                 if (campo4 == 'CSLL') {
                     arrAuxiliar[5] = 'C';
                 } else if (campo4 == 'IRPJ') {
                     arrAuxiliar[5] = 'I';
                 } else {
                     arrAuxiliar[5] = 'A';
                 }

                 //6. tipo  de lnzamiento segun tabka dinamica rotulacion editable
                 if (objResult[i].getValue(columnas[6]) != null) {
                     arrAuxiliar[6] = objResult[i].getValue(columnas[6]);
                 } else {
                     arrAuxiliar[6] = '';
                 }
                 
                 arrM300[cont] = arrAuxiliar;
                 cont++;
             }
             if (intLength < 1000) {
                 DbolStop = true;
             }
         }
     }
     // log.error('arrM300', arrM300);
     return arrM300;
 }

 function BuscarLeadingVersion() {
     var DbolStop = false;
     var arrLeadingVersions = new Array();
     var cont = 0;
     var periodenddate_temp = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: param_AnioCalendario,
            columns: ['enddate', 'periodname', 'startdate']
     });
     
     
     //Period EndDate
     periodenddate = periodenddate_temp.enddate;
     periodStartDate = periodenddate_temp.startdate;
     
     var savedSearch = search.create({
         type: 'customrecord_lmry_br_rpt_feature_version',
         filters: [
             ["custrecord_lmry_br_year_to", "onorafter", periodenddate],
             "AND",
             ["custrecord_lmry_br_year_from", "onorbefore", periodenddate]
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

                 //0. cdd version
                 if (objResult[i].getValue(columnas[1]) != null) {
                     arrAuxiliar[0] = '000' + objResult[i].getValue(columnas[1]);
                 } else {
                     arrAuxiliar[0] = '';
                 }

                 arrLeadingVersions[cont] = arrAuxiliar;
                 cont++;
             }
             if (intLength < 1000) {
                 DbolStop = true;
             }
         }
     }
     
     return arrLeadingVersions;
 }

 function NoData() {
     var usuarioTemp = runtime.getCurrentUser();
     var id = usuarioTemp.id;
     var employeename = search.lookupFields({
         type: search.Type.EMPLOYEE,
         id: id,
         columns: ['firstname', 'lastname']
     });
     var usuario = employeename.firstname + ' ' + employeename.lastname;

     var Logrecord = record.load({
         type: 'customrecord_lmry_br_rpt_generator_log',
         id: param_RecorID
     });

     //Nombre de Archivo
     Logrecord.setValue({
         fieldId: 'custrecord_lmry_br_rg_name_field',
         value: 'No existe informacion para los criterios seleccionados.'
     });

     //Creado Por
     Logrecord.setValue({
         fieldId: 'custrecord_lmry_br_rg_employee',
         value: usuario
     });

     var recordId = Logrecord.save();
 }

 function SaveFile() {
     var FolderId = objContext.getParameter({
         name: 'custscript_lmry_file_cabinet_rg_br'
     });

     // Almacena en la carpeta de Archivos Generados
     if (FolderId != '' && FolderId != null) {
         // Extension del archivo

         var NameFile = Name_File() + '.txt';
         // Crea el archivo
         var file = fileModulo.create({
             name: NameFile,
             fileType: fileModulo.Type.PLAINTEXT,
             contents: StrReporte,
             encoding: fileModulo.Encoding.UTF8,
             folder: FolderId
         });

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

         log.error('url', urlfile);

         //Genera registro personalizado como log
         if (idfile) {
             //log.error('entro idfile', 'idfile');
             var usuarioTemp = runtime.getCurrentUser();
             var id = usuarioTemp.id;
             var employeename = search.lookupFields({
                 type: search.Type.EMPLOYEE,
                 id: id,
                 columns: ['firstname', 'lastname']
             });
             var usuario = employeename.firstname + ' ' + employeename.lastname;
                var periodLookUpField = search.lookupFields({
                    type: search.Type.ACCOUNTING_PERIOD,
                    id: param_AnioCalendario,
                    columns: ['startdate']
                });
             
             
             var año_Mostrado = periodLookUpField.startdate;
             var FECHA_FORMAT = format.parse({
                 value: año_Mostrado,
                 type: format.Type.DATE
             });

             var AAAA = FECHA_FORMAT.getFullYear();
             var AnioFinal = Number(AAAA).toFixed(0);
             //log.error('paso periodo', 'paso periodo');

             if (false) {
                 var Logrecord = record.create({
                     type: 'customrecord_lmry_br_rpt_generator_log'
                 });
             } else {
                 var Logrecord = record.load({
                     type: 'customrecord_lmry_br_rpt_generator_log',
                     id: param_RecorID
                 });
             }

             //Nombre de Archivo
             Logrecord.setValue({
                 fieldId: 'custrecord_lmry_br_rg_name_field',
                 value: NameFile
             });
             //Url de Archivo
             Logrecord.setValue({
                 fieldId: 'custrecord_lmry_br_rg_url_file',
                 value: urlfile
             });
             //Nombre de Reporte
             Logrecord.setValue({
                 fieldId: 'custrecord_lmry_br_rg_report',
                 value: namereport
             });
             //Nombre de Subsidiaria
             Logrecord.setValue({
                 fieldId: 'custrecord_lmry_br_rg_subsidiary',
                 value: companyname
             });
             //Periodo
             Logrecord.setValue({
                 fieldId: 'custrecord_lmry_br_rg_period',
                 value: AnioFinal
             });
             //Multibook
             if (feature_Multi) {
                 Logrecord.setValue({
                     fieldId: 'custrecord_lmry_br_rg_multibook',
                     value: multibookName
                 });
             }
             //Creado Por
             Logrecord.setValue({
                 fieldId: 'custrecord_lmry_br_rg_employee',
                 value: usuario
             });
             var recordId = Logrecord.save();

             // Envia mail de conformidad al usuario
             // libreria.sendrptuser(namereport, 3, NameFile);
             libFeature.sendConfirmUserEmail(namereport, 3, NameFile, language);
             log.error('paso envio correo', 'paso envio correo');

             // }
         }
     } else {
         // Debug
         log.error({
             title: 'Creacion de File:',
             details: 'No existe el folder'
         });
     }
 }

 function Name_File() {
     //SpedECF-CNpj-Original-dez2018.txt
     var name = '';
     var periodLookUpField = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: param_AnioCalendario,
            columns: ['startdate']
     });
     
     

     var año_Mostrado = periodLookUpField.startdate;

     var FECHA_FORMAT = format.parse({
         value: año_Mostrado,
         type: format.Type.DATE
     });
     //log.error('fechaFinal2',fechaFinal);
     var AAAA = FECHA_FORMAT.getFullYear();
     if (feature_Multi) {
         name = 'SpedECF-' + cnpj + '_' + '0101' + AAAA + '_' + '3112' + AAAA + '_' + AAAA;
     } else {
         name = 'SpedECF-' + cnpj + '_' + '0101' + AAAA + '_' + '3112' + AAAA + '_' + AAAA;
     }
     return name;
 }

 function ObtenerSetupRptECF() {
     var intDMinReg = 0;
     var intDMaxReg = 1000;
     var DbolStop = false;
     var arrAuxiliar = new Array();

     var savedsearch = search.create({
         type: 'customrecord_lmry_br_setup_rpt_dctf',

         columns: [
             //00 LATAM - BR IND. PERIOD START
             search.createColumn({
                 name: "custrecord_lmry_br_ind_period_start",
                 label: "LATAM - BR IND. PERIOD START"
             }),
             //01 LATAM - BR SITUATION ECF
             search.createColumn({
                 name: "custrecord_lmry_br_situation_ecf",
                 label: "LATAM - BR SITUATION ECF"
             }),
             //02 LATAM - BR PATRIMONIO
             search.createColumn({
                 name: "custrecord_lmry_br_pat_reman_cis",
                 label: "LATAM - BR PATRIMONIO"
             }),
             //03 LATAM - BR SITUATION DATE
             search.createColumn({
                 name: "custrecord_lmry_br_situation_date",
                 label: "LATAM - BR SITUATION DATE"
             }),

             //04 Latam - BR ECF's Type
             search.createColumn({
                 name: "custrecord_lmry_br_ecf_type",
                 label: "Latam - BR ECF's Type"
             }),

             //05 Latam - BR Reg 0010 ECF
             search.createColumn({
                 name: "custrecord_lmry_br_reg0010_ecf",
                 label: "Latam - BR Reg 0010 ECF"
             }),

             //06 Latam - BR Reg 0020 ECF
             search.createColumn({
                 name: "custrecord_lmry_br_reg0020_ecf",
                 label: "Latam - BR Reg 0020 ECF"
             }),
             //07 Latam - BR Reg 0021 ECF
             search.createColumn({
                 name: "custrecord_lmry_br_reg0021_ecf",
                 label: "Latam - BR Reg 0021 ECF"
             }),
             //08 LATAM - BR LEGAL REPRESENTATIVE
             search.createColumn({
                 name: "custrecord_lmry_br_responsable_ecd",
                 label: "Latam - BR Responsable’s ECD"
             }),

             //09 Latam - BR Stock Evaluation
             search.createColumn({
                 name: "custrecord_lmry_br_ind_aval_estoq",
                 label: "Latam - BR Stock Evaluation"
             }),

             search.createColumn({
                 name: "custrecord_lmry_br_gen_cost_center",
                 label: "Latam - BR Gen Cost Center"
             }),

             search.createColumn({
                 name: "custrecord_lmry_br_calificacion_pj",
                 label: "Latam - BR calificacion pj"
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
                 //00 LATAM - BR IND. PERIOD START
                 if (objResult[i].getValue(columns[0]) != null) {
                     IND_SIT_INI_PER = objResult[i].getText(columns[0]);
                     IND_SIT_INI_PER = completar_cero(1, IND_SIT_INI_PER)
                 } else {
                     IND_SIT_INI_PER = '';
                 }
                 ///01 LATAM - BR SITUATION ECF
                 if (objResult[i].getValue(columns[1]) != null) {
                     SIT_ESPECIAL = objResult[i].getValue(columns[1]);
                 } else {
                     SIT_ESPECIAL = '';
                 }
                 //02 LATAM - BR PATRIMONIO
                 if (objResult[i].getValue(columns[2]) != null) {
                     PAT_REMAN_CIS = objResult[i].getValue(columns[2]);
                 } else {
                     PAT_REMAN_CIS = '';
                 }
                 //03 LATAM - BR SITUATION DATE
                 if ((objResult[i].getValue(columns[3]) != null) && (objResult[i].getValue(columns[3]) != '')) {
                     DT_SIT_ESP = objResult[i].getValue(columns[3]);
                 } else {
                     DT_SIT_ESP = '';
                 }
                 //04 Latam - BR ECF's Type
                 if (objResult[i].getValue(columns[4]) != null) {
                     TIP_ECF = objResult[i].getText(columns[4]).substring(0, 1);
                 } else {
                     TIP_ECF = '';
                 }

                 //05 Latam - BR Reg 0010 ECF
                 if (objResult[i].getValue(columns[5]) != null) {
                     Reg0010 = objResult[i].getValue(columns[5]);

                     auxArray = Reg0010.split('|');

                     setupJson["OPT_PAES"] = auxArray[4];
                     setupJson["FORMA_TRIB"] = auxArray[5];
                     setupJson["FORMA_APUR"] = auxArray[6];
                     setupJson["FORMA_TRIB_PER"] = auxArray[8];
                     log.error('auxArray[9]', auxArray[9]);
                     setupJson["MES_BAL_RED"] = auxArray[9];

                     Reg0010 = '|0010||' + auxArray[3] + '|' + auxArray[5] + '|' + auxArray[6] + '|' + auxArray[7] + '|' + auxArray[8] + '|' + auxArray[9] + '|' + auxArray[10] + '|' + auxArray[11] + '|' + auxArray[12] + '|' + auxArray[13] + '|' + auxArray[14] + '|';
                 } else {
                     Reg0010 = '';
                 }

                 //06 Latam - BR Reg 0020 ECF
                 if (objResult[i].getValue(columns[6]) != null) {
                     Reg0020 = objResult[i].getValue(columns[6]);

                     auxArray = Reg0020.split('|');
                     setupJson["IND_ALIQ_CSLL"] = auxArray[2];

                     Reg0020 = '|0020|1||' + auxArray[4] + '|' + auxArray[5] + '|' + auxArray[6] + '|' + auxArray[7] + '|' + auxArray[8] + '|' + auxArray[9] + '|' + auxArray[10] + '|' + auxArray[11] + '|' + auxArray[12] + '|' + auxArray[13] + '|' + auxArray[15] + '|' + auxArray[17] + '|' + auxArray[18] + '|' + auxArray[20] + '|' + auxArray[21] + '|' + auxArray[22] + '|' + auxArray[23] + '|' + auxArray[24] + '|' + auxArray[25] + '|' + auxArray[26] + '|' + auxArray[27] + '|' + auxArray[28] + '|' + auxArray[29] + '|' + auxArray[30] + '|' + auxArray[31] + '|' + auxArray[32] + '|' + auxArray[33] + '|';

                 } else {
                     Reg0020 = '';
                 }
                 //07 Latam - BR Reg 0021 ECF
                 if (objResult[i].getValue(columns[7]) != null) {
                     Reg0021 = objResult[i].getValue(columns[7]);
                 } else {
                     Reg0021 = '';
                 }
                 //08 LATAM - BR LEGAL REPRESENTATIVE
                 IDENT_NOM_1 = objResult[i].getValue(columns[8]);


                 //09. Latam - BR Stock Evaluation
                 STOCK_VALUATION = objResult[i].getText(columns[9]);
                 STOCK_VALUATION = completar_cero(1, STOCK_VALUATION)

                 //Gen Cost Center
                 GEN_COST_CENTER = objResult[i].getValue(columns[10]);

                 //Gen Cost Center
                 califPj = objResult[i].getValue(columns[11]);

             }
             intDMinReg = intDMaxReg;
             intDMaxReg += 1000;
         } else {
             DbolStop = true;
         }
     }
 }

 function GenerarBloquesNecesarios() {

     var arrAuxiliar = new Array();
     //***************** BLOQUE 0 ***************************************************************************************
     /*******************************************************************************************************************
      *                                                  REGISTRO 0000     OCURRENCIA [1:1]                             *
      * 1.REG|2.NOMBRE ESC|3.COD VERSION|4.CNPJ|5.NOMBRE|6.IND_SIT_INI_PER|7.SIT_ESPECIAL|8.PAT_REMAN_CIS|              *
      * 9.DT_SIT_ESP|10.DT_INI|11.DT_FIN|12.RETIFICADORA|13.NUM_REC|14.TIP_ECF|15.COD_SCP|                              *
      *******************************************************************************************************************/
     var salto = '\r\n';
     arrAuxiliar[0] = '0000';
     //1 - REG   //2 - NOMBRE ESC
     StrReporte += '|0000|LECF|';

     //3 - COD VERSION   ----- LatamReady - BR Leading Version
     var LeadingVersion = BuscarLeadingVersion();
     var version_ecf;
     //[[],["10","1/1/2019","2019","0006"]]
     log.error('LeadingVersion', LeadingVersion);

     if (LeadingVersion != '' && LeadingVersion != null && LeadingVersion != undefined) {
        
         if (LeadingVersion[0][0] != null && LeadingVersion[0][0] != '' && LeadingVersion[0][0] != undefined && LeadingVersion[0][0] != ' ') {
             version_ecf = LeadingVersion[0][0];
             log.error('version_ecf1', version_ecf);
         }
         
     } else {
         version_ecf = '';
     }

     if (version_ecf == undefined || version_ecf == null || version_ecf == '') {
         version_ecf = '';
     }
     
     StrReporte += version_ecf + '|';
     if (PAT_REMAN_CIS == '0.0%') {
         PAT_REMAN_CIS = '';
     }

     log.error('DT_SIT_ESP', DT_SIT_ESP);
     if (DT_SIT_ESP != '' && DT_SIT_ESP != undefined && DT_SIT_ESP != null) {
         var fechaDT_SIT_ESP = format.parse({
             value: DT_SIT_ESP,
             type: format.Type.DATE
         });


         var MM = fechaDT_SIT_ESP.getMonth() + 1;
         var AAAA = fechaDT_SIT_ESP.getFullYear();
         var DD = fechaDT_SIT_ESP.getDate();
         log.error('fechaDT_SIT_ESP', fechaDT_SIT_ESP);
         var aux = DD + '/' + MM + '/' + AAAA;
         var auxiliar = aux.split('/');

         if (auxiliar[1].length == 1) {
             auxiliar[1] = '0' + auxiliar[1];
         }
         if (auxiliar[0].length == 1) {
             auxiliar[0] = '0' + auxiliar[0];
         }

         fechaDT_SIT_ESP = auxiliar[0] + auxiliar[1] + auxiliar[2];
     } else {
         var fechaDT_SIT_ESP = '';
     }
     fechaDT_SIT_ESP = '';

     //4.CNPJ //5.NOMBRE //6.IND_SIT_INI_PER //7.SIT_ESPECIAL//8.PAT_REMAN_CIS   //9.DT_SIT_ESP //10 - DT_INI    //11 - DT_FIN
     StrReporte += cnpj + '|' + subsiname + '|' + IND_SIT_INI_PER + '|' + SIT_ESPECIAL + '|' + PAT_REMAN_CIS + '|' + fechaDT_SIT_ESP + '|' + fechaInicial + '|' + fechaFinal + '|';

     //12 - RETIFICADORA
     if (param_Type_Decla == '1') {
         RETIFICADORA = 'S';
     } else if (param_Type_Decla == '0') {
         RETIFICADORA = 'N';
     } else {
         RETIFICADORA = 'F';
     }
     StrReporte += RETIFICADORA + '|';

     //13 - NUM_REC
     if (RETIFICADORA == 'N') {
         NUM_REC = '';
     } else {
         if (param_Num_Recti != null && param_Num_Recti != '') {
             NUM_REC = param_Num_Recti;
         } else {
             NUM_REC = '';
         }
     }
     StrReporte += NUM_REC + '|';
     //14 - TIP_ECF
     StrReporte += TIP_ECF + '|';
     //15 - COD_SCP
     if (TIP_ECF == '2') {
         // COD_SCP = completar_cero(14, COD_SCP);
         StrReporte += cnpj_scp + '|' + salto;
     } else {
         StrReporte += '|' + salto;
     }

     arrAuxiliar[1] = 1;
     ArrBloque9.push(arrAuxiliar);
     contador_global++;

     //+++++++++++++++REGISTRO 0001++++++++++++++++ OCURRENCIA [1:1]
     arrAuxiliar = new Array();
     arrAuxiliar[0] = '0001';
     //1. REG        //2. IND_DAD
     StrReporte += '|0001|0|' + salto;
     arrAuxiliar[1] = 1;
     ArrBloque9.push(arrAuxiliar);
     contador_global++;

     /*******************************************************************************************************************
      *                                                  REGISTRO 0010      OCURRENCIA [1:1]                            *
      * 1.REG|2.HASH(POR EL SISTEMA)|3.OPT_REFIS|4.OPT_PAES|5.FORMA_TRIB|6.FORMA_APUR|7.COD_QUALIF_PJ|8.FORMA_TRIB_PER| *
      * 9.MES_BAL_RED|10.TIP_ESC_PRE|11.TIP_ENT|12.FORMA_APUR_I|13.APUR_CSLL|14.IND_REC_RECETA|                         *
      *******************************************************************************************************************/
     arrAuxiliar = new Array();
     // Cadena de campos del REGISTRO 0010 
     StrReporte += Reg0010 + salto;
     arrAuxiliar[0] = '0010';
     arrAuxiliar[1] = 1;
     ArrBloque9.push(arrAuxiliar);
     contador_global++;

     /**********************************************************************************************************************
      *                                                  REGISTRO 0020     OCURRENCIA [1:1]                                 *
      * 1.REG|2.IND_ALIQ_CSLL|3.IND_QTE_SCP|4.IND_ADM_FUN_CLU|5.IND_PART_CONS|6.IND_OP_EXT|7.IND_OP_VINC|8.IND_PJ_ENQUAD|   *
      * 9.IND_PART_EXT|10.IND_ATIV_RURAL|11.IND_LUC_EXP|12.IND_RED_ISEN|13.IND_FIN|14.IND_DONA_ELEIT|15.IND_PART_COLIG|     *
      * 16.IND_VEND_EXP|17.IND_REC_EXT|18.IND_ATIV_EXT|19.IND_CON_EXP|20.IND_PGTO_EXT|21.IND_ICON_TI|22.IND_ROY_REC|        *
      * 23.IND_ROY_PAG|24.IND_REND_SERV|25.IND_PGTO_REM|26. IND_INOV_TEC|27.IND_CAP_INF|28.IND_PJ_HAB|29. IND_POLO_AM|      *
      * 30.IND_ZON_EXP|31.IND_AREA_CON|32.IND_PADRES_A_PADRES|33.IND_DEREX|                                                 *
      ***********************************************************************************************************************/
     arrAuxiliar = new Array();
     // Cadena de campos del REGISTRO 0020 
     StrReporte += Reg0020 + salto;
     //StrReporte += '|0020|||N|N|N|N|N|N|N|N|N|N|N|N|N|N|N|N|N|N|N|N|N|N|N|N|N|N|N|N|N|N|' + salto;

     contador_global++;
     arrAuxiliar[0] = '0020';
     arrAuxiliar[1] = 1;
     ArrBloque9.push(arrAuxiliar);

     /********************************************************************************************************************************
      *                                                  REGISTRO 0021    OCURRENCIA [0:1]                                            *
      * 1.REG|2.IND_REPES|3.IND_RECAP|4.IND_PADIS|5.IND_PATVD|6.IND_REIDI|7.IND_REPENEC|8.IND_REICOMP|9.IND_RETAERO|10.IND_RECINE|    *
      * 11.IND_RESIDUOS_SOLIDOS|12.IND_RECOPA|13.IND_COPA_DEL_MUNDO|14.IND_RETID|15.IND_REPNBL_REDES|16.IND_REIF|17.IND_OLIMPIADAS|   *                                                                           *
      *********************************************************************************************************************************/
     arrAuxiliar = new Array();
     // Cadena de campos del REGISTRO 0021 
     if (Reg0021 != '|0021|N|N|N|N|N|N|N|N|N|N|N|N|N|N|N|N|') {
         StrReporte += Reg0021 + salto;
         contador_global++;
         arrAuxiliar[0] = '0021';
         arrAuxiliar[1] = 1;
         ArrBloque9.push(arrAuxiliar);
     }


     /********************************************************************************************************************************
      *                                                  REGISTRO 0030    OCURRENCIA [1:1]                                            *
      * 1.REG|2.COD_NAT|3.CNAE_FISCAL|4.ENDERECO|5.NUM|6.COMPLEMENTO|7.BARRIO|8.UF|9.COD_MUN|10.CEP|11.NUM_TEL|12.EMAIL|              *                                                                           *
      *********************************************************************************************************************************/
     arrAuxiliar = new Array();

     //1. REG   //2. COD_NAT //3. CNAE_FISCAL  //4. ENDERECO  //5. NUM  //6. COMPL  //7. BARRIO  //8. UF   //9. COD_MUN  //10. CEP //11. NUM_TEL //12. EMAIL
     StrReporte += '|0030|' + COD_NAT + '|' + CNAE_FISCAL + '|' + ENDERECO + '|' + NUM + '|' + COMPL + '|' + BARRIO + '|' + UF + '|' + COD_MUN + '|' + CEP + '|' + NUM_TEL + '|' + Email + '|' + salto;
     contador_global++;
     arrAuxiliar[0] = '0030';
     arrAuxiliar[1] = 1;
     ArrBloque9.push(arrAuxiliar);

     //+++++++++++++++REGISTRO 0035++++++++++++++++ OCURRENCIA [0:N]
     //NO OBLIGATORIO
     /********************************************************************************************************************************
      *                                                  REGISTRO 0930    OCURRENCIA [1:N]       solo 2    jefe y contador           *
      * 1.REG|2.IDENT_NOM|3.IDENT_CPF_CNPJ|4.IDENT_QUALIF|5.IDENT_CRC|6.EMAIL|7.FONE                                                 *                                                                           *
      *********************************************************************************************************************************/

     arrAuxiliar = new Array();

     var filesIdArray = IDENT_NOM_1.split(',');
     
     if(filesIdArray.length!=0 && filesIdArray.length!= null && filesIdArray.length!= '' ){
        for (var i = 0; i < filesIdArray.length; i++) {
            var suscriber_1 = search.lookupFields({
                type: search.Type.EMPLOYEE,
                id: filesIdArray[i],
                columns: ['custentity_lmry_sv_taxpayer_number', 'custentity_lmry_br_category', 'firstname', 'lastname', 'custentity_lmry_br_crc', 'phone', 'email']
            });
   
            var firstname = suscriber_1.firstname;
            var lastname = suscriber_1.lastname;
            var IDENT_NOM = firstname + ' ' + lastname;
            var IDENT_CPF_CNPJ = suscriber_1.custentity_lmry_sv_taxpayer_number;
            var IDENT_QUALIF = suscriber_1.custentity_lmry_br_category;
            if (IDENT_QUALIF != '') {
                
                IDENT_QUALIF = IDENT_QUALIF[0].value;
                
                var suscriber_2 = search.lookupFields({
                    type: 'customrecord_lmry_br_category_person',
                    id: IDENT_QUALIF,
                    columns: ['custrecord_lmry_br_code_category']
                });
                var IDENT_QUALIF_2 = suscriber_2.custrecord_lmry_br_code_category;
                //log.error('IDENT_QUALIF_2',IDENT_QUALIF_2);
            } else {
                IDENT_QUALIF = '';
                var IDENT_QUALIF_2 = '';
            }
   
            var IDENT_CRC = suscriber_1.custentity_lmry_br_crc;
            IDENT_CRC = QuitaGuion(IDENT_CRC);
            var EMAIL = suscriber_1.email;
            var FONE = suscriber_1.phone;
            FONE = QuitaGuion(FONE);
   
   
            StrReporte += '|0930|' + IDENT_NOM + '|' + ValidaGuion(IDENT_CPF_CNPJ) + '|' + IDENT_QUALIF_2 + '|' + IDENT_CRC + '|' + EMAIL + '|' + FONE + '|' + salto;
   
        }
     }
     

     contador_global += filesIdArray.length;

     arrAuxiliar[0] = '0930';
     arrAuxiliar[1] = filesIdArray.length;
     ArrBloque9.push(arrAuxiliar);

     //+++++++++++++++REGISTRO 0990++++++++++++++++ OCURRENCIA [1:1]
     arrAuxiliar = new Array();
     contador_global++;
     //1. REG
     StrReporte += '|0990|';
     //2. QTD_LIN
     StrReporte += contador_global + '|' + salto;

     arrAuxiliar[0] = '0990';
     arrAuxiliar[1] = 1;
     ArrBloque9.push(arrAuxiliar);

     //***************** BLOQUE C *****************  
     var bloqueC = GenerarBloqueC();
     StrReporte += bloqueC;
     contador_global = contador_global + 2;

     //***************** BLOQUE E *****************  
     var bloqueE = GenerarBloqueE();
     StrReporte += bloqueE;
     contador_global = contador_global + 2;

     //***************** BLOQUE J *****************  
     var bloqueJ = GenerarBloqueJ();
     StrReporte += bloqueJ;
     contador_global = contador_global + 2;

     //***************** BLOQUE K *****************  
     var bloqueK = GenerarBloqueK();
     StrReporte += bloqueK;
     contador_global = contador_global + 2;

     //REAL
     if (setupJson["FORMA_TRIB"] == "1") {
         //***************** BLOQUE L *****************  
         var bloqueL = GenerarBloqueL();
         StrReporte += bloqueL;
         contador_global = contador_global + 2;

         //***************** BLOQUE M ***************** 
         var bloqueM = GenerarBloqueM();
         StrReporte += bloqueM;
         contador_global = contador_global + 2;

         //***************** BLOQUE N ***************** 
         var BloqueN = GenerarBloqueN();
         StrReporte += BloqueN;
         contador_global = contador_global + 2;
     }

     //PRESUMIDO
     if (setupJson["FORMA_TRIB"] == "5") {
         //***************** BLOQUE P *****************
         var bloqueP = GenerarBloqueP();
         StrReporte += bloqueP;
     } else {
         // Registro P001: Abertura do Bloco P
         StrReporte += '|P001|1|\r\n';
         StrReporte += '|P990|2|\r\n';
         numeroLineasBloqueP++;
         ArrBloque9.push(['P001', 1]);
         ArrBloque9.push(['P990', 1]);
     }

     //***************** BLOQUE Q ***************** 
     /*var bloqueQ = GenerarBloqueQ();
      StrReporte += bloqueQ;
      contador_global = contador_global + 2;
//ARBITRADO
      //***************** BLOQUE T ***************** 
      var bloqueT = GenerarBloqueT();
      StrReporte += bloqueT;
      contador_global = contador_global + 2;*/
     //INFORMACION ECONOMICA
     //***************** BLOQUE Y ***************** 
     var bloqueY = GenerarBloqueY();
     StrReporte += bloqueY;
     contador_global = contador_global + 3;

     //***************** BLOQUE 9 ***************** 
     var bloque9 = GenerarBLoque9(contador_global);
     StrReporte += bloque9;

 }

 function GenerarBloqueE() {
     var salto = '\r\n';
     var contador_E = 0;
     var strBloqueE = '';
     var arrAuxiliar = new Array();

     //+++++++++++++++E001++++++++++++++++++
     //1. REG | 2. IND_DAD
     strBloqueE += '|E001|0|' + salto;

     arrAuxiliar[0] = 'E001';
     arrAuxiliar[1] = 1;
     ArrBloque9.push(arrAuxiliar);
     contador_E++;
     contador_global++;
     //+++++++++++++++E010++++++++++++++++++// VIENE DEL ECF ANTERIOR (NO HAY DISEÑO)
     //+++++++++++++++E015++++++++++++++++++// VIENE DEL ECF ANTERIOR (NO HAY DISEÑO)
     //+++++++++++++++E020++++++++++++++++++// VIENE DEL ECF ANTERIOR (NO HAY DISEÑO)

     //+++++++++++++++E030++++++++++++++++++// 
     //1. REG
     strBloqueE += ObtenerE030ªE155();

     //+++++++++++++++E355++++++++++++++++++ // VIENE DEL I350 Y I355
     strBloqueE += ObtenerE355();

     contador_global += numeroLineasBloqueE;
     contador_E += numeroLineasBloqueE;

     //+++++++++++++++C990++++++++++++++++++
     contador_E++;

     //1. REG | 2. QTD_LIN
     strBloqueE += '|E990|' + contador_E + '|' + salto;
     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'E990';
     arrAuxiliar[1] = 1;
     ArrBloque9.push(arrAuxiliar);

     //reemplazamos los puntos por comas
     strBloqueE = strBloqueE.replace(/\&lt;/g, '<').replace(/\&gt;/g, '>');
     return strBloqueE;
 }

 function ObtenerE355() { //este registro es el I355 del ecd
     var numeroLineasE355 = 0;

     var totalStringE355 = "";
     for (var i = 0; i < saldoPerBloqueKJson[12].length; i++) {
         amount = Number(saldoPerBloqueKJson[12][i][3]);

         totalStringE355 += "|E355|" + saldoPerBloqueKJson[12][i][1] + "|" + departmentJson[saldoPerBloqueKJson[12][i][2]][2] + "|" + obtenerFormatoNumero(amount) + "|";

         if (amount >= 0) {
             totalStringE355 += "D|" + "\r\n";
         } else {
             totalStringE355 += "C|" + "\r\n";
         }

         numeroLineasE355++;

     }

     numeroLineasBloqueE += numeroLineasE355;

     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'E355';
     arrAuxiliar[1] = numeroLineasE355;
     ArrBloque9.push(arrAuxiliar);

     return totalStringE355;
 }

 function ObtenerE030ªE155() {
        var periodRecord = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: param_AnioCalendario,
            columns: ['enddate', 'startdate']
        });
    
     

     var startDateObject = format.parse({
         type: format.Type.DATE,
         value: periodRecord.startdate
     });
     startDate = obtenerFormatoFecha(startDateObject);

     periodYear = startDateObject.getFullYear() + "";



     var numeroLineasE030 = 0,
         numeroLineasE155 = 0;

     var totalStringE030 = "",
         debito, credito, saldoInicial, saldoFinal, monthStartDate, monthEndDate;

     //totalString += "|L030|0101" + AAAA + "|" + obtenerFormatoFecha(monthEndDate) + "|A" + completar_cero(2, monthStartDate.getMonth() + 1) + "|\r\n";

     for (var i = 0; i < 12; i++) {
         monthStartDate = new Date(periodYear, i, 1);
         monthEndDate = new Date(periodYear, i + 1, 0);
         if (saldoPerBloqueKJson[i] !== undefined) {
             // totalStringE030 += "|E030|" + obtenerFormatoFecha(monthStartDate) + "|" + obtenerFormatoFecha(monthEndDate) + "|A" + completar_cero(2, monthStartDate.getMonth() + 1) +"|\r\n";
             totalStringE030 += "|E030|" + fechaInicial + "|" + obtenerFormatoFecha(monthEndDate) + "|A" + completar_cero(2, monthStartDate.getMonth() + 1) + "|\r\n";

             numeroLineasE030++;
             for (var j = 0; j < saldoPerBloqueKJson[i].length; j++) {
                 //log.error("saldoPerBloqueKJson[i][j][2]", saldoPerBloqueKJson[i][j][2]);
                 centroCosto = departmentJson[saldoPerBloqueKJson[i][j][2]][2];
                 saldoInicial = saldoPerBloqueKJson[i][j][3];
                 debito = saldoPerBloqueKJson[i][j][4];
                 credito = saldoPerBloqueKJson[i][j][5];

                 saldoFinal = redondear(Number(saldoInicial) + Number(debito) - Number(credito));

                 totalStringE030 += "|E155|" + saldoPerBloqueKJson[i][j][1] + "|" + centroCosto + "|" + obtenerFormatoNumero(saldoInicial) + "|";

                 if (Number(saldoInicial) >= 0) {
                     totalStringE030 += "D|";
                 } else {
                     totalStringE030 += "C|";
                 }

                 totalStringE030 += obtenerFormatoNumero(debito) + "|" + obtenerFormatoNumero(credito) + "|" + obtenerFormatoNumero(saldoFinal) + "|";

                 if (saldoFinal >= 0) {
                     totalStringE030 += "D|" + "\r\n";
                 } else {
                     totalStringE030 += "C|" + "\r\n";
                 }
                 numeroLineasE155++;

             }

         }
     }

     numeroLineasBloqueE += numeroLineasE030;
     numeroLineasBloqueE += numeroLineasE155;

     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'E030';
     arrAuxiliar[1] = numeroLineasE030;
     ArrBloque9.push(arrAuxiliar);

     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'E155';
     arrAuxiliar[1] = numeroLineasE155;
     ArrBloque9.push(arrAuxiliar);

     return totalStringE030;
 }

 function GenerarBloqueC() {
     var salto = '\r\n';
     var contador_C = 0;
     var strBloqueC = '';
     var arrAuxiliar = new Array();

     //+++++++++++++++C001++++++++++++++++++
     //1. REG | 2. IND_DAD
     strBloqueC += '|C001|0|' + salto;

     arrAuxiliar[0] = 'C001';
     arrAuxiliar[1] = 1;
     ArrBloque9.push(arrAuxiliar);
     contador_C++;
     contador_global++;

     //+++++++++++++++C040++++++++++++++++++// VIENE DEL I010,I012;I030
     //1. REG
     strBloqueC += ObtenerC040();

     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'C040';
     arrAuxiliar[1] = 1;
     ArrBloque9.push(arrAuxiliar);
     contador_C++;
     contador_global++;

     //contador_global += numeroLineasBloqueC + 1;
     //contador_C += numeroLineasBloqueC;


     //+++++++++++++++C050 y C051++++++++++++++++++// VIENE DEL I050 Y I051
     //1. REG
     strBloqueC += ObtenerCuentasC050ºC051();
     strBloqueC += ObtenerC100(); // VIENE DEL I100

     //  contador_global += numeroLineasBloqueC;
     //  contador_C += numeroLineasBloqueC;

     //+++++++++++++++C150 y C155++++++++++++++++++//VIENE DEL I150 Y I155
     //1. REG
     strBloqueC += ObtenerC150ªC155();

     //+++++++++++++++C350 Y C355++++++++++++++++++ // VIENE DEL I350 Y I355
     strBloqueC += ObtenerC350ºC355();

     contador_global += numeroLineasBloqueC;
     contador_C += numeroLineasBloqueC;

     //+++++++++++++++C990++++++++++++++++++
     contador_C++;

     //1. REG | 2. QTD_LIN
     strBloqueC += '|C990|' + contador_C + '|' + salto;
     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'C990';
     arrAuxiliar[1] = 1;
     ArrBloque9.push(arrAuxiliar);

     //reemplazamos los puntos por comas
     strBloqueC = strBloqueC.replace(/\&lt;/g, '<').replace(/\&gt;/g, '>');
     return strBloqueC;
 }
 //VIENE DEL REGISTRO 0000 DEL ECD
 function ObtenerC040() {
     var arregloCampos = [];

     arregloCampos[1] = 'C040';
     arregloCampos[2] = '';
     arregloCampos[3] = fechaInicial;
     arregloCampos[4] = fechaFinal;
     arregloCampos[5] = '';
     arregloCampos[6] = cnpj;

     // Número de ordem do instrumento de escrituração. - Obligatorio
     arregloCampos[7] = paramNumOrder;
     // nire - Obligatorio
     arregloCampos[8] = nire;

     // NATURALEZA DEL LIBRO
     arregloCampos[9] = 'Livro Diario';

     arregloCampos[10] = '7.00';

     // Número de Identificação do Registro de Empresas da Junta Comercial - No Obligatorio
     arregloCampos[11] = 'G';
     //moneda funcional
     arregloCampos[12] = 'N';

     // Escriturações Contábeis Consolidadas - Obligatorio version 2020 8.00
     arregloCampos[13] = 'N';

     // Indicador da modalidade de escrituração centralizada ou descentralizada: - Obligatorio
     arregloCampos[14] = '0';

     // Indicador de mudança de plano de contas: - Obligatorio
     arregloCampos[15] = '0';

     // Código do Plano de Contas Referencial
     arregloCampos[16] = codPlanCuentasReferencial;

     return recorrerCampos(arregloCampos);
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

 function obtenerCodPlanCuentasReferencial() {
     var codigoPlanCuentasReferencial = "";

     log.debug("regimen", regimen);
     log.debug("tipo", califPj);

     if (califPj == "7") {
         if (regimen == "2" || regimen == "4") {
             codigoPlanCuentasReferencial = "1";
         } else if (regimen == "3") {
             codigoPlanCuentasReferencial = "2";
         }
     } else if (califPj == "2" && (regimen == "2" || regimen == "4")) {
         codigoPlanCuentasReferencial = "3";
     } else if (califPj == "39" && (regimen == "2" || regimen == "4")) {
         codigoPlanCuentasReferencial = "4";
     }
     log.debug("codigoPlanCuentasReferencial", codigoPlanCuentasReferencial);
     return codigoPlanCuentasReferencial;
 }


 function ObtenerCuentasC050ºC051() {
     var totalStringC050 = "",
         numeroLineasC050 = 0,
         numeroLineasC051 = 0;

     for (var brCoaId in planCuentasBloqueJJson) {
         totalStringC050 += '|C050|' + planCuentasBloqueJJson[brCoaId][1] + '|' + planCuentasBloqueJJson[brCoaId][2] + '|' + planCuentasBloqueJJson[brCoaId][3] + '|' + planCuentasBloqueJJson[brCoaId][4] + '|' + planCuentasBloqueJJson[brCoaId][5] + '|' + planCuentasBloqueJJson[brCoaId][6] + '|' + planCuentasBloqueJJson[brCoaId][7] + '|' + '\r\n';

         if (localAccountJsonJ051[brCoaId] !== undefined) {
             totalStringC050 += '|C051||' + localAccountJsonJ051[brCoaId] + '|\r\n';
             numeroLineasC051++;
         }

         numeroLineasC050++;
     }

     numeroLineasBloqueC += numeroLineasC050;
     numeroLineasBloqueC += numeroLineasC051;

     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'C050';
     arrAuxiliar[1] = numeroLineasC050;
     ArrBloque9.push(arrAuxiliar);

     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'C051';
     arrAuxiliar[1] = numeroLineasC051;
     ArrBloque9.push(arrAuxiliar);

     return totalStringC050;
 }

 function ObtenerC100() {
     var numeroLineasC100 = 0,
         totalStringC100 = '';
     if (GEN_COST_CENTER) {
         for (var departament in departmentJson) {
             totalStringC100 += '|C100|' + (departmentJson[departament][1] || '') + '|' + departmentJson[departament][2] + '|' + departmentJson[departament][3] + '|\r\n';
             numeroLineasC100++;
         }
     }
     departmentJson['0'] = ['', '', '', ''];

     numeroLineasBloqueC += numeroLineasC100;

     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'C100';
     arrAuxiliar[1] = numeroLineasC100;
     ArrBloque9.push(arrAuxiliar);

     return totalStringC100;
 }

 function ObtenerC150ªC155() {
        var periodRecord = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: param_AnioCalendario,
            columns: ['enddate', 'startdate']
        });
    
     

     var startDateObject = format.parse({
         type: format.Type.DATE,
         value: periodRecord.startdate
     });
     startDate = obtenerFormatoFecha(startDateObject);

     periodYear = startDateObject.getFullYear() + "";

     var numeroLineasC150 = 0,
         numeroLineasC155 = 0;

     var totalStringC150 = "",
         debito, credito, saldoInicial, saldoFinal, monthStartDate, monthEndDate;
     var contador_line = 0;
     var contador_line_2 = 0;

     for (var cont = 0; cont < ArchivoECDJson.length; cont++) {

         if ((ArchivoECDJson[cont][1]) == 'I155') {
             log.error('cont', cont);
             contador_line = cont + 1;
             break;
         }

     }

     if (contador_line == 1) {
         for (var cont_2 = 0; cont_2 < ArchivoECDJson_2.length; cont_2++) {

             if ((ArchivoECDJson_2[cont][1]) == 'I155') {
                 log.error('cont_2', cont_2);
                 contador_line_2 = cont_2 + 1;
                 
                 break;
             }

         }
         contador_line = contador_line_2;
     }

     for (var i = 0; i < 12; i++) {
         monthStartDate = new Date(periodYear, i, 1);
         monthEndDate = new Date(periodYear, i + 1, 0);
         if (saldoPerBloqueKJson[i] !== undefined) {
             totalStringC150 += "|C150|" + obtenerFormatoFecha(monthStartDate) + "|" + obtenerFormatoFecha(monthEndDate) + "|\r\n";
             numeroLineasC150++;
             for (var j = 0; j < saldoPerBloqueKJson[i].length; j++) {
                 //log.error("saldoPerBloqueKJson[i][j][2]", saldoPerBloqueKJson[i][j][2]);
                 centroCosto = departmentJson[saldoPerBloqueKJson[i][j][2]][2];
                 saldoInicial = saldoPerBloqueKJson[i][j][3];
                 debito = saldoPerBloqueKJson[i][j][4];
                 credito = saldoPerBloqueKJson[i][j][5];

                 saldoFinal = redondear(Number(saldoInicial) + Number(debito) - Number(credito));

                 totalStringC150 += "|C155|" + saldoPerBloqueKJson[i][j][1] + "|" + centroCosto + "|" + obtenerFormatoNumero(saldoInicial) + "|";

                 if (Number(saldoInicial) >= 0) {
                     totalStringC150 += "D|";
                 } else {
                     totalStringC150 += "C|";
                 }

                 totalStringC150 += obtenerFormatoNumero(debito) + "|" + obtenerFormatoNumero(credito) + "|" + obtenerFormatoNumero(saldoFinal) + "|";

                 if (saldoFinal >= 0) {
                     totalStringC150 += "D|" + contador_line + "|" + "\r\n";
                 } else {
                     totalStringC150 += "C|" + contador_line + "|" + "\r\n";
                 }
                 numeroLineasC155++;
                 contador_line++;
             }
             contador_line++;
         }
     }

     numeroLineasBloqueC += numeroLineasC150;
     numeroLineasBloqueC += numeroLineasC155;

     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'C150';
     arrAuxiliar[1] = numeroLineasC150;
     ArrBloque9.push(arrAuxiliar);

     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'C155';
     arrAuxiliar[1] = numeroLineasC155;
     ArrBloque9.push(arrAuxiliar);

     return totalStringC150;
 }

 function ObtenerC350ºC355() { //este registro es el I355 del ecd
     var numeroLineasC350 = 0,
         numeroLineasC355 = 0;
     var contador_line_I355 = 0;
     var contador_line_I355_2 = 0;

     for (var cont = 0; cont < ArchivoECDJson.length; cont++) {

         if ((ArchivoECDJson[cont][1]) == 'I355') {
             log.error('cont', cont);
             contador_line_I355 = cont + 1;
             break;
         }

     }
     if (contador_line_I355 == 1) {
         for (var cont_2 = 0; cont_2 < ArchivoECDJson_2.length; cont_2++) {

             if ((ArchivoECDJson_2[cont][1]) == 'I355') {
                 log.error('cont_2', cont_2);
                 contador_line_I355_2 = cont_2 + 1;
                 break;
             }

         }
         contador_line_I355 = contador_line_I355_2;
     }

     var totalStringC350ºC355 = "|C350|" + obtenerPeriodoAjuste() + "|\r\n",
         amount;
     numeroLineasC350++;
     //var totalStringC355 = "";
     for (var i = 0; i < saldoPerBloqueKJson[12].length; i++) {
         amount = Number(saldoPerBloqueKJson[12][i][3]);

         totalStringC350ºC355 += "|C355|" + saldoPerBloqueKJson[12][i][1] + "|" + departmentJson[saldoPerBloqueKJson[12][i][2]][2] + "|" + obtenerFormatoNumero(amount) + "|";

         if (amount >= 0) {
             totalStringC350ºC355 += "D|" + contador_line_I355 + "|" + "\r\n";
         } else {
             totalStringC350ºC355 += "C|" + contador_line_I355 + "|" + "\r\n";
         }
         contador_line_I355++;
         numeroLineasC355++;

     }
     contador_line_I355++;

     numeroLineasBloqueC += numeroLineasC350;
     numeroLineasBloqueC += numeroLineasC355;

     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'C350';
     arrAuxiliar[1] = numeroLineasC350;
     ArrBloque9.push(arrAuxiliar);

     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'C355';
     arrAuxiliar[1] = numeroLineasC355;
     ArrBloque9.push(arrAuxiliar);

     return totalStringC350ºC355;
 }

 function obtenerPeriodoAjuste() {
     var startDatePeriodoAjuste = "";
     var savedSearch = search.create({
         type: "accountingperiod",
         filters: [
             ["isadjust", "is", "T"],
             "AND",
             ["parent", "anyof", param_AnioCalendario]
         ],
         columns: ["internalid", "startdate"]
     });

     var pagedData = savedSearch.runPaged({
         pageSize: 1000
     });

     var page, auxArray, columns;
     pagedData.pageRanges.forEach(function(pageRange) {
         page = pagedData.fetch({
             index: pageRange.index
         });

         page.data.forEach(function(result) {
             columns = result.columns;
             startDatePeriodoAjuste = result.getValue(columns[1]);
             log.error("startDatePeriodoAjuste", startDatePeriodoAjuste);
             var date = format.parse({
                 type: format.Type.DATE,
                 value: startDatePeriodoAjuste
             });

             startDatePeriodoAjuste = obtenerFormatoFecha(date);
     
         });
     });

     return startDatePeriodoAjuste || "3112" + periodYear;
 }

 function GenerarBloqueJ() {
     var salto = '\r\n';
     var contador_J = 0;
     var strBloqueJ = '';
     var arrAuxiliar = new Array();

     //+++++++++++++++L001++++++++++++++++++
     //1. REG | 2. IND_DAD
     strBloqueJ += '|J001|0|' + salto;
     arrAuxiliar[0] = 'J001';
     arrAuxiliar[1] = 1;
     ArrBloque9.push(arrAuxiliar);
     contador_J++;

     //+++++++++++++++J050 y J051++++++++++++++++++
     //1. REG
     strBloqueJ += ObtenerCuentasJ050ºJ051();
     strBloqueJ += ObtenerJ100();

     contador_global += numeroLineasBloqueJ + 1;
     contador_J += numeroLineasBloqueJ;

     //+++++++++++++++J990++++++++++++++++++
     contador_J++;
     //1. REG | 2. QTD_LIN
     strBloqueJ += '|J990|' + contador_J + '|' + salto;
     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'J990';
     arrAuxiliar[1] = 1;
     ArrBloque9.push(arrAuxiliar);

     //reemplazamos los puntos por comas
     strBloqueJ = strBloqueJ.replace(/\&lt;/g, '<').replace(/\&gt;/g, '>');
     return strBloqueJ;
 }

 function ObtenerCuentasJ050ºJ051() {
     var totalStringJ050 = "",
         numeroLineasJ050 = 0,
         numeroLineasJ051 = 0;

     for (var brCoaId in planCuentasBloqueJJson) {
         totalStringJ050 += '|J050|' + planCuentasBloqueJJson[brCoaId][1] + '|' + planCuentasBloqueJJson[brCoaId][2] + '|' + planCuentasBloqueJJson[brCoaId][3] + '|' + planCuentasBloqueJJson[brCoaId][4] + '|' + planCuentasBloqueJJson[brCoaId][5] + '|' + planCuentasBloqueJJson[brCoaId][6] + '|' + planCuentasBloqueJJson[brCoaId][7] + '|' + '\r\n';

         if (localAccountJsonJ051[brCoaId] !== undefined) {
             totalStringJ050 += '|J051||' + localAccountJsonJ051[brCoaId] + '|\r\n';
             numeroLineasJ051++;
         }

         numeroLineasJ050++;
     }

     numeroLineasBloqueJ += numeroLineasJ050;
     numeroLineasBloqueJ += numeroLineasJ051;

     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'J050';
     arrAuxiliar[1] = numeroLineasJ050;
     ArrBloque9.push(arrAuxiliar);

     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'J051';
     arrAuxiliar[1] = numeroLineasJ051;
     ArrBloque9.push(arrAuxiliar);

     return totalStringJ050;
 }

 function ObtenerJ100() {
     var numeroLineasJ100 = 0,
         totalStringJ100 = '';
     if (GEN_COST_CENTER) {
         for (var departament in departmentJson) {
             if (departmentJson[departament][1] != '') {
                 totalStringJ100 += '|J100|' + (departmentJson[departament][1] || '') + '|' + departmentJson[departament][2] + '|' + departmentJson[departament][3] + '|\r\n';
                 numeroLineasJ100++;
             }
         }
         numeroLineasBloqueJ += numeroLineasJ100;
     }
     departmentJson['0'] = ['', '', '', ''];

     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'J100';
     arrAuxiliar[1] = numeroLineasJ100;
     ArrBloque9.push(arrAuxiliar);

     return totalStringJ100;
 }

 function ObtenerDepartamentos() {

     var newSearch = search.create({
         type: 'department',
         filters: ['isinactive', 'is', 'F'],
         columns: [
             search.createColumn({
                 name: "internalid",
                 label: "Internal ID"
             }),
             search.createColumn({
                 name: "custrecord_lmry_department_date",
                 label: "Date"
             }),
             search.createColumn({
                 name: "custrecord_lmry_department_code",
                 label: "Latam - Department Code"
             }),
             search.createColumn({
                 name: "name",
                 sort: search.Sort.ASC,
                 label: "Name"
             })
         ]
     });

     if (feature_Subsi) {
         var subsidiaryFilter = search.createFilter({
             name: 'subsidiary',
             operator: search.Operator.IS,
             values: param_Subsi
         });
         newSearch.filters.push(subsidiaryFilter);
     }

     var pagedData = newSearch.runPaged({
         pageSize: 1000
     });
     var page, auxArray, columns, fechaCreacion;
     pagedData.pageRanges.forEach(function(pageRange) {
         page = pagedData.fetch({
             index: pageRange.index
         });

         page.data.forEach(function(result) {
             columns = result.columns;
             auxArray = [];

             //0. Internalid
             auxArray[0] = result.getValue(columns[0]);

             //1. Fecha Creacion
             if (result.getValue(columns[1]) !== undefined && result.getValue(columns[1]) != "") {
                 fechaCreacion = format.parse({
                     type: format.Type.DATE,
                     value: result.getValue(columns[1])
                 });
                 auxArray[1] = obtenerFormatoFecha(fechaCreacion);
             }
             //2. Codigo
             auxArray[2] = result.getValue(columns[2]);

             //3. Name
             auxArray[3] = result.getValue(columns[3]);

             departmentJson[auxArray[0]] = auxArray;
         });
     });
 }

 function GenerarBloqueK() {
     var salto = '\r\n';
     var contador_K = 0;
     var strBloqueK = '';
     var arrAuxiliar = new Array();

     //+++++++++++++++K001++++++++++++++++++
     //1. REG | 2. IND_DAD
     strBloqueK += '|K001|0|' + salto;
     arrAuxiliar[0] = 'K001';
     arrAuxiliar[1] = 1;
     ArrBloque9.push(arrAuxiliar);
     contador_K++;

     //1. REG
     var ArrNewregistrok155 = FormarRegistroK();
     strBloqueK += ObtenerK00(ArrNewregistrok155);
     if (setupJson["MES_BAL_RED"] == "BBBBBBBBBBBB") {
         strBloqueK += ObtenerK030ªK155(ArrNewregistrok155);
     }
     numeroLineasBloqueK += numeroLineasK030;
     numeroLineasBloqueK += numeroLineasK155;

     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'K030';
     arrAuxiliar[1] = numeroLineasK030;
     ArrBloque9.push(arrAuxiliar);

     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'K155';
     arrAuxiliar[1] = numeroLineasK155;
     ArrBloque9.push(arrAuxiliar);
     //+++++++++++++++K355++++++++++++++++++
     strBloqueK += ObtenerK355();

     //contador_global += numeroLineasBloqueK + 1;
     contador_K += numeroLineasBloqueK;
     contador_global += numeroLineasBloqueK;

     //+++++++++++++++K990++++++++++++++++++
     contador_K++;
     //1. REG | 2. QTD_LIN
     strBloqueK += '|K990|' + contador_K + '|' + salto;
     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'K990';
     arrAuxiliar[1] = 1;
     ArrBloque9.push(arrAuxiliar);

     contador_global += contador_global + 1;
     //reemplazamos los puntos por comas
     strBloqueK = strBloqueK.replace(/\&lt;/g, '<').replace(/\&gt;/g, '>');
     //strBloqueK = strBloqueK.replace(/\./g, ',');
     return strBloqueK;
 }

 function ObtenerK00(ArrNewregistrok155) { //funcion anual que agarra K030 y K155
     //+++++++++++++++K030 y K155++++++++++++++++++
     // aqui se forma primero el K030(A00) y K155(anual)
     var totalStringK00 = "",
         centroCostok00, saldoInicialk00, debitok00, creditok00, saldoFinalk00;

     for (var j = 0; j < ArrNewregistrok155.length; j++) {
         if (ArrNewregistrok155[j][0] == '11') { //saldos de diciembre
             ArrNewregistrok155[j][7] = ArrNewregistrok155[j][4];
             ArrNewregistrok155[j][8] = ArrNewregistrok155[j][5];
         } else {
             ArrNewregistrok155[j][7] = 0;
             ArrNewregistrok155[j][8] = 0;
         }
         ArrNewregistrok155_dic.push(ArrNewregistrok155[j]);
     }

     var ArrAgrupado_K00 = AgruparArregloAnualK00(ArrNewregistrok155_dic, 1);


     totalStringK00 += "|K030|" + fechaInicial + "|" + fechaFinal + "|A00" + "|\r\n";
     numeroLineasK030++;

     for (var i = 0; i < ArrAgrupado_K00.length; i++) {

         centroCostok00 = '';
         saldoInicialk00 = Number(ArrAgrupado_K00[i][3]).toFixed(2);
         debitok00 = Number(ArrAgrupado_K00[i][4]).toFixed(2);
         creditok00 = Number(ArrAgrupado_K00[i][5]).toFixed(2);

         saldoFinalk00 = redondear(Number(saldoInicialk00) + Number(debitok00) - Number(creditok00));

         totalStringK00 += "|K155|" + ArrAgrupado_K00[i][1] + "|" + centroCostok00 + "|" + obtenerFormatoNumero(Number(saldoInicialk00).toFixed(2)) + "|";

         if (Number(saldoInicialk00) >= 0) {
             totalStringK00 += "D|";
         } else {
             totalStringK00 += "C|";
         }

         totalStringK00 += obtenerFormatoNumero(Number(debitok00).toFixed(2)) + "|" + obtenerFormatoNumero(Number(creditok00).toFixed(2)) + "|" + obtenerFormatoNumero(Number(saldoFinalk00).toFixed(2)) + "|";

         if (saldoFinalk00 >= 0) {
             totalStringK00 += "D|\r\n";
         } else {
             totalStringK00 += "C|\r\n";
         }
         numeroLineasK155++;
     }

     return totalStringK00;

 }

 function ObtenerK030ªK155(ArrNewregistrok155) { // funcion separado por meses
        var periodRecord = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: param_AnioCalendario,
            columns: ['enddate', 'startdate']
        });
    
     

     var startDateObject = format.parse({
         type: format.Type.DATE,
         value: periodRecord.startdate
     });
     startDate = obtenerFormatoFecha(startDateObject);

     periodYear = startDateObject.getFullYear() + "";

     var totalStringK030 = "",
         saldoInicial, saldoFinal, monthStartDate, monthEndDate, saldoInicialEnero, IdCodigo, mes;
     var totalStringK155_mensual = "";
     var debito = 0;
     var credito = 0;
     var acumulado = [];
     for (var i = 0; i < 12; i++) {
         monthStartDate = new Date(periodYear, i, 1);
         monthEndDate = new Date(periodYear, i + 1, 0);
         if (saldoPerBloqueKJson[i] !== undefined) {
             //totalStringK030 += "|K030|" + obtenerFormatoFecha(monthStartDate) + "|" + obtenerFormatoFecha(monthEndDate) + "|A" + completar_cero(2, monthStartDate.getMonth() + 1) +"|\r\n";
             totalStringK030 += "|K030|" + fechaInicial + "|" + obtenerFormatoFecha(monthEndDate) + "|A" + completar_cero(2, monthStartDate.getMonth() + 1) + "|\r\n";

             numeroLineasK030++;

             for (var j = 0; j < ArrNewregistrok155.length; j++) {
                
                 if (ArrNewregistrok155[j][0] == i) {
                     centroCosto = '';
                     saldoInicial = ArrNewregistrok155[j][3]; // siempre sera el de enero 
                     debito = (ArrNewregistrok155[j][4]);
                     credito = (ArrNewregistrok155[j][5]);

                     saldoFinal = redondear(Number(saldoInicial) + Number(debito) - Number(credito));

                     totalStringK030 += "|K155|" + ArrNewregistrok155[j][1] + "|" + centroCosto + "|" + obtenerFormatoNumero(Number(saldoInicial.toFixed(2))) + "|";

                     if (Number(saldoInicial) >= 0) {
                         totalStringK030 += "D|";
                     } else {
                         totalStringK030 += "C|";
                     }

                     totalStringK030 += obtenerFormatoNumero(Number(debito).toFixed(2)) + "|" + obtenerFormatoNumero(Number(credito).toFixed(2)) + "|" + obtenerFormatoNumero(Number(saldoFinal).toFixed(2)) + "|";

                     if (saldoFinal >= 0) {
                         totalStringK030 += "D|\r\n";
                     } else {
                         totalStringK030 += "C|\r\n";
                     }
                     numeroLineasK155++;
                 }

             }
         }

     }
     return totalStringK030;
 }

 function ObtenerK355() { //este registro es el I355 del ecd
     // var totalStringK155 = "|I350|" + obtenerPeriodoAjuste() + "|\r\n", amount;
     var numeroLineasK355 = 0;
     var totalStringK155 = "";
     for (var i = 0; i < saldoPerBloqueKJson[12].length; i++) {
         amount = Number(saldoPerBloqueKJson[12][i][3]).toFixed(2);

         totalStringK155 += "|K355|" + saldoPerBloqueKJson[12][i][1] + "|" + departmentJson[saldoPerBloqueKJson[12][i][2]][2] + "|" + obtenerFormatoNumero(amount) + "|";

         if (amount >= 0) {
             totalStringK155 += "D|\r\n";
         } else {
             totalStringK155 += "C|\r\n";
         }
         numeroLineasK355++;
     }
     numeroLineasBloqueK += numeroLineasK355;

     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'K355';
     arrAuxiliar[1] = numeroLineasK355;
     ArrBloque9.push(arrAuxiliar);

     return totalStringK155;
 }

 function CargarIDFileCabinet(id_ecd) {
     //AccountsForPeriods_I150_ECD_     - para bloque k 
     //Accounts_Plan_ECD_    -para bloque j
     //Local_Account_Accounting_Group_ECD_   - para bloque J051
     var intDMinReg = 0;
     var intDMaxReg = 1000;

     var DbolStop = false;
     var arrAuxiliar = new Array();
     var IdFileCabinet = new Array();

     var _cont = 0;

     var savedsearch = search.create({
         type: 'file',

         filters: [
             // ["name","is","Accounts_Plan_9_0.txt"], 
             // "AND", 
             ["name", "startswith", id_ecd]
         ],
         columns: [

             //0. nombre del archivo del file cabinet
             search.createColumn({
                 name: "name",
                 sort: search.Sort.ASC,
                 label: "Name"
             }),
             //1. internal id del archivo del file cabinet
             search.createColumn({
                 name: "internalid",
                 label: "Internal ID"
             })
         ]
     });

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
                 arrAuxiliar = new Array();

                 //0. name del archivo
                 arrAuxiliar[0] = objResult[i].getValue(columns[0]);
                 //1. Internal id del archivo
                 var idg = objResult[i].getValue(columns[1]);

                 IdFileCabinet[_cont] = arrAuxiliar;
                 _cont++;

             }

             intDMinReg = intDMaxReg;
             intDMaxReg += 1000;
         } else {
             DbolStop = true;
         }
     }
    
     return idg;
 }


 function ObtenerArchivo(stringIdFile, tipoArchivo) {
     var filesIdArray = stringIdFile.split('|');
     var auxArray = [];
     var archivo;

     for (var i = 0; i < filesIdArray.length; i++) {
         if (filesIdArray[i]) {
             archivo = fileModulo.load({
                 id: filesIdArray[i]
             });
             auxArray.push(archivo.getContents());
         }
     }

     var contenidoArray = [];
     for (var i = 0; i < auxArray.length; i++) {
         contenidoArray = auxArray[i].split('\r\n');
         for (var j = 0; j < contenidoArray.length; j++) {
             if (contenidoArray[j].length != 0) {
                 CargarArchivo(contenidoArray[j].split('|'), tipoArchivo);
             }
         }
     }
 }

 function CargarArchivo(arreglo, tipo) {
     if (tipo == 1) { //cuentas costing
         //planCuentasCostingArray.push(arreglo);
         if (saldoPeriodosL210Json[arreglo[0]] === undefined) {
             saldoPeriodosL210Json[arreglo[0]] = [];
         }
         saldoPeriodosL210Json[arreglo[0]].push(arreglo);

     } else if (tipo == 2) { //balance por mes cuentas y saldos 
         if (saldoPeriodosLA00Json[arreglo[0]] === undefined) {
             saldoPeriodosLA00Json[arreglo[0]] = [];
         }
         saldoPeriodosLA00Json[arreglo[0]].push(arreglo);
         if (arreglo[4] == '04') { //cuentas de resultado l300 
             if (saldoPeriodosResultadoJson[arreglo[0]] === undefined) {
                 saldoPeriodosResultadoJson[arreglo[0]] = [];
             }
             saldoPeriodosResultadoJson[arreglo[0]].push(arreglo);
         } else { //cuentas de balance l100

             if (saldoPeriodosJson[arreglo[0]] === undefined) {
                 saldoPeriodosJson[arreglo[0]] = [];
             }
             saldoPeriodosJson[arreglo[0]].push(arreglo);
         }
     } else if (tipo == 4) { //todas las transacciones para Padron b registro M010
         //SaldosCuentasPadronBArray.push(arreglo);
         if (saldoPeriodosM010Json[arreglo[0]] === undefined) {
             saldoPeriodosM010Json[arreglo[0]] = [];
         }
         saldoPeriodosM010Json[arreglo[0]].push(arreglo);
     } else if (tipo == 5) { //balance por mes cuentas y saldos de lanzamiento para registro M300
         //if (arreglo[3] != 'R') { //solo se muestran los que son diferentes de rotulacion
         if (arreglo[7] == 'I' || arreglo[7] == 'A') { //cuentas de lanzamiento con irpj  para registro m300
             if (saldoPeriodosirpjM300Json[arreglo[0]] === undefined) {
                 saldoPeriodosirpjM300Json[arreglo[0]] = [];
             }
             saldoPeriodosirpjM300Json[arreglo[0]].push(arreglo);
         }
         //}

     } else if (tipo == 6) {
         if (arreglo[7] == 'C' || arreglo[7] == 'A') { //cuentas de lanzamiento con csll  para registro m350
             if (saldoPeriodoscsllM350Json[arreglo[0]] === undefined) {
                 saldoPeriodoscsllM350Json[arreglo[0]] = [];
             }
             saldoPeriodoscsllM350Json[arreglo[0]].push(arreglo);
         }
     } else if (tipo == 3) {
         if (arreglo[2] != '04') {
             planCuentasTotalesBalanceArray.push(arreglo);
         } else {
             planCuentasTotalesResultadoArray.push(arreglo);
         }

     } else if (tipo == 7) { //archivo traido del file cabinet para bloque j
         planCuentasBloqueJJson[arreglo[0]] = arreglo;
     } else if (tipo == 8) { //archivo del local account para registro J051
         if (arreglo[0] == "LA") {
             localAccountJsonJ051[arreglo[1]] = arreglo[2];
         }
     } else if (tipo == 9) { //archivo traido del file cabinet para bloque K
         saldoPerBloqueKJson[arreglo[0]].push(arreglo);

     } else if (tipo == 10) { //archivo traido del file cabinet - archivo final generado del ecd
         ArchivoECDJson.push(arreglo);
     } else if (tipo == 11) { //archivo traido del file cabinet - archivo final generado del ecd
         ArchivoECDJson_2.push(arreglo);
     }
 }

 function FormarRegistroK() {
     var NewArregloK = new Array();
     //var acumulado = [];
    var acumulado2 = {};
     // var debit_acumu = 0;
     // var credit_acumu = 0; 
     var debito_acum_aux = 0;
     var credito_acum_aux = 0;
     var saldoInic_acum_aux = 0;
     var cuenta_aux ='';
     var banderaEnero = false;
     var banderaFebreroDiciembre = false;
     for (var i = 0; i < 12; i++) {
         var arrTempKECD = new Array();
         if (saldoPerBloqueKJson[i] !== undefined) {

             for (var j = 0; j < saldoPerBloqueKJson[i].length; j++) {
                 arrTempKECD.push(saldoPerBloqueKJson[i][j]);
             }

             var ArrAgrupadoAnual_K00 = AgruparArregloKECD(arrTempKECD);
             log.debug("vector agrupado",ArrAgrupadoAnual_K00);
             for (var z = 0; z < ArrAgrupadoAnual_K00.length; z++) {
                 //if (ArrAgrupadoAnual_K00[z][0] == 0) { //enero

                     var debit_acumu = Number(ArrAgrupadoAnual_K00[z][4]);
                     var credit_acumu = Number(ArrAgrupadoAnual_K00[z][5]);
                     var codigoCuenta = (ArrAgrupadoAnual_K00[z][6]);
                     var saldoInicialEnero = Number(ArrAgrupadoAnual_K00[z][3]);
                     var acuAux = [];
                     //acuAux.push(debit_acumu);
                     //acuAux.push(credit_acumu);
                     if(acumulado2[codigoCuenta]!=undefined){
                        acumulado2[codigoCuenta][0] += debit_acumu;
                        acumulado2[codigoCuenta][1] += credit_acumu;

                        debit_acumu = acumulado2[codigoCuenta][0];
                        credit_acumu = acumulado2[codigoCuenta][1];
                        saldoInicialEnero = acumulado2[codigoCuenta][3];
                     }else{
                        acuAux.push(debit_acumu);
                        acuAux.push(credit_acumu);
                        acuAux.push(codigoCuenta);
                        acuAux.push(saldoInicialEnero);
                        acumulado2[codigoCuenta] = acuAux;
                        
                        debit_acumu = acumulado2[codigoCuenta][0];
                        credit_acumu = acumulado2[codigoCuenta][1];
                        saldoInicialEnero = acumulado2[codigoCuenta][3];
                     }
                     /*
                     acuAux.push(debit_acumu);
                     acuAux.push(credit_acumu);
                     acuAux.push(codigoCuenta);
                     acuAux.push(saldoInicialEnero);
                     acumulado.push(acuAux);
                     */
                     //} else { // meses febrero - diciembre 
                     /*for (var k = 0; k < acumulado.length; k++) {
                         if (ArrAgrupadoAnual_K00[z][6] == acumulado[k][2]) {
                             acumulado[k][0] += Number(ArrAgrupadoAnual_K00[z][4]);
                             acumulado[k][1] += Number(ArrAgrupadoAnual_K00[z][5]);
                             //acumulado[k][3] = saldoInicialEnero;
                             debit_acumu = acumulado[k][0];
                             credit_acumu = acumulado[k][1];
                             saldoInicialEnero = acumulado[k][3];
                             //banderaEnero = true;
                             //banderaFebreroDiciembre = true;
                         }
                     }*/
                 //}
                    var acuAux2 = [];
                 //if(banderaEnero && banderaFebreroDiciembre){
                    
                    acuAux2[0] = ArrAgrupadoAnual_K00[z][0];
                    acuAux2[1] = ArrAgrupadoAnual_K00[z][1];
                    acuAux2[2] = '';
                    acuAux2[3] = Number(saldoInicialEnero);
                    acuAux2[4] = Number(debit_acumu);
                    acuAux2[5] = Number(credit_acumu);
                    acuAux2[6] = ArrAgrupadoAnual_K00[z][6];
                /*}else{
                    log.debug('cuenta_aux',cuenta_aux);
                    log.debug('ArrAgrupadoAnual_K00[z][0]',ArrAgrupadoAnual_K00[z][0]);
                    log.debug('ArrAgrupadoAnual_K00[z][1]',ArrAgrupadoAnual_K00[z][1]);
                    log.debug('ArrAgrupadoAnual_K00[z][6]',ArrAgrupadoAnual_K00[z][6]);
                    log.debug('debito_acum_aux',debito_acum_aux);
                    log.debug('credito_acum_aux',credito_acum_aux);
                    log.debug('saldoInic_acum_aux',saldoInic_acum_aux);

                    if(cuenta_aux==ArrAgrupadoAnual_K00[z][6]){
                        //cuenta_aux = ArrAgrupadoAnual_K00[z][6];
                        debito_acum_aux += Number(ArrAgrupadoAnual_K00[z][3]);
                        credito_acum_aux += Number(ArrAgrupadoAnual_K00[z][4]);
                        saldoInic_acum_aux += Number(ArrAgrupadoAnual_K00[z][5]);
                    }else{
                        cuenta_aux = ArrAgrupadoAnual_K00[z][6];
                        debito_acum_aux = Number(ArrAgrupadoAnual_K00[z][3]);
                        credito_acum_aux = Number(ArrAgrupadoAnual_K00[z][4]);
                        saldoInic_acum_aux = Number(ArrAgrupadoAnual_K00[z][5]);
                    }

                    acuAux2[0] = ArrAgrupadoAnual_K00[z][0];
                    acuAux2[1] = ArrAgrupadoAnual_K00[z][1];
                    acuAux2[2] = '';
                    acuAux2[3] = Number(debito_acum_aux);
                    acuAux2[4] = Number(credito_acum_aux);
                    acuAux2[5] = Number(saldoInic_acum_aux);
                    acuAux2[6] = ArrAgrupadoAnual_K00[z][6];
                 }

                 banderaEnero = false;
                 banderaFebreroDiciembre = false;
                 */
                 NewArregloK.push(acuAux2);

             }

         }
     }

     return NewArregloK;
 }

 function FormarRegistroL() {   //funcion para formar los montos enero diciembre y saldo inicial anual 
     var NewArregloL = new Array();
     //var acumulado = [];
     var acumulado2 ={};
     for (var i = 0; i < 12; i++) {
         var arrTempLECF = new Array();
         if (saldoPeriodosJson[i] !== undefined) {

            //  for (var j = 0; j < saldoPeriodosJson[i].length; j++) {
            //     arrTempLECF.push(saldoPeriodosJson[i][j]);
            //  }

            // var ArrAgrupadoAnual_K00 = AgruparArregloKECD(arrTempKECD);

             for (var z = 0; z < saldoPeriodosJson[i].length; z++) {
                 /*if (saldoPeriodosJson[i][z][0] == 0) { //enero
                     var debit_acumu = Number(saldoPeriodosJson[i][z][6]);
                     var credit_acumu = Number(saldoPeriodosJson[i][z][7]);
                     var codigoCuenta = (saldoPeriodosJson[i][z][10]);
                     var saldoInicialEnero = Number(saldoPeriodosJson[i][z][5]);
                     var acuAux = [];
                     acuAux.push(debit_acumu);
                     acuAux.push(credit_acumu);
                     acuAux.push(codigoCuenta);
                     acuAux.push(saldoInicialEnero);
                     acumulado.push(acuAux);
                 } else { // meses febrero - diciembre 
                     for (var k = 0; k < acumulado.length; k++) {
                         if (saldoPeriodosJson[i][z][10] == acumulado[k][2]) {
                             acumulado[k][0] += Number(saldoPeriodosJson[i][z][6]);
                             acumulado[k][1] += Number(saldoPeriodosJson[i][z][7]);
                             //acumulado[k][3] = saldoInicialEnero;
                             debit_acumu = acumulado[k][0];
                             credit_acumu = acumulado[k][1];
                             saldoInicialEnero = acumulado[k][3];
                         }
                     }
                 }*/
                 var debit_acumu = Number(saldoPeriodosJson[i][z][6]);
                 var credit_acumu = Number(saldoPeriodosJson[i][z][7]);
                 var codigoCuenta = (saldoPeriodosJson[i][z][10]);
                 var saldoInicialEnero = Number(saldoPeriodosJson[i][z][5]);
                 var acuAux = [];
                 
                 if(acumulado2[codigoCuenta]!=undefined){
                    acumulado2[codigoCuenta][0] += debit_acumu;
                    acumulado2[codigoCuenta][1] += credit_acumu;

                    debit_acumu = acumulado2[codigoCuenta][0];
                    credit_acumu = acumulado2[codigoCuenta][1];
                    saldoInicialEnero = acumulado2[codigoCuenta][3];
                 }else{
                    acuAux.push(debit_acumu);
                    acuAux.push(credit_acumu);
                    acuAux.push(codigoCuenta);
                    acuAux.push(saldoInicialEnero);
                    acumulado2[codigoCuenta] = acuAux;
                    
                    debit_acumu = acumulado2[codigoCuenta][0];
                    credit_acumu = acumulado2[codigoCuenta][1];
                    saldoInicialEnero = acumulado2[codigoCuenta][3];
                 }


                 var acuAux2 = [];
                 acuAux2[0] = saldoPeriodosJson[i][z][0];
                 acuAux2[1] = saldoPeriodosJson[i][z][1];
                 acuAux2[2] = saldoPeriodosJson[i][z][2];
                 acuAux2[3] = saldoPeriodosJson[i][z][3];
                 acuAux2[4] = saldoPeriodosJson[i][z][4];
                 acuAux2[5] = Number(saldoInicialEnero);
                 acuAux2[6] = Number(debit_acumu);
                 acuAux2[7] = Number(credit_acumu);
                 acuAux2[8] = saldoPeriodosJson[i][z][8];
                 acuAux2[9] = saldoPeriodosJson[i][z][9];
                 acuAux2[10] = saldoPeriodosJson[i][z][10];
                 acuAux2[11] = saldoPeriodosJson[i][z][11];
                 acuAux2[12] = saldoPeriodosJson[i][z][12];
                 NewArregloL.push(acuAux2);

             }
         }
     }

     return NewArregloL;
 }

 function SepararCuentasReferenciales() {
     //se hace esto ya que el campo Local br account puede traer mas de un id 
     var intDMinReg = 0;
     var intDMaxReg = 1000;
     var DbolStop = false;
     var arrAuxiliar = new Array();
     var ArrCuentaReferencial1 = new Array();
     var _cont = 0;

     var savedsearch = search.create({
         type: 'customrecord_lmry_br_local_account',

         filters: [
             // ["formulatext: {custrecord_lmry_br_account}", "isnotempty", ""],
             // "AND",
             ["isinactive", "is", "F"],
             "AND",
             ["custrecord_lmry_br_subsidiarie", "anyof", param_Subsi]
         ],
         columns: [

             //0. codigo de cuenta referencial
             search.createColumn({
                 name: "name",
                 sort: search.Sort.ASC,
                 label: "Name"
             }),
             //1. subsidiaria a la que pertenece
             search.createColumn({
                 name: "custrecord_lmry_br_subsidiarie",
                 label: "Latam - BR Subsidiarie"
             }),
             //2. listado de cuentas corporativas asociadas a la cuenta referencial
             search.createColumn({
                 name: "custrecord_lmry_br_account",
                 label: "Latam - BR Account"
             }),
             //3. cuenta superior
             search.createColumn({
                 name: "custrecord_lmry_br_acc_parent",
                 label: "Latam - BR Account's Parent"
             }),
             //4. Nivel de la cuenta
             search.createColumn({
                 name: "custrecord_lmry_br_level",
                 label: "Latam - BR Level"
             }),
             //5. Naturaleza de la cuenta
             search.createColumn({
                 name: "custrecord_lmry_id_acc_group",
                 label: "Latam - BR Account's Nature"
             }),
             //6. ID de la ceunta referencial
             search.createColumn({
                 name: "internalid",
                 label: "Internal ID"
             }),
             //7. nombre de la cuenta referencial
             search.createColumn({
                 name: "custrecord_lmry_br_name",
                 label: "Latam - BR Name"
             }),
             //8. tipo de cuenta referencial
             search.createColumn({
                 name: "custrecord_lmry_br_acc_type",
                 label: "Latam - BR Account's Type"
             })
         ]
     });

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
                 arrAuxiliar = new Array();

                 var IDCuentaReferencial = objResult[i].getValue(columns[2]).split(',');

                 for (var j = 0; j < IDCuentaReferencial.length; j++) {
                     arrAuxiliar = new Array();

                     //0. codigo de cuenta referencial name
                     arrAuxiliar[0] = objResult[i].getValue(columns[0]);
                     //1. subsidiaria asociada
                     arrAuxiliar[1] = objResult[i].getValue(columns[1]);
                     //2. Latam - BR Account - cuenta corporativa asociada
                     arrAuxiliar[2] = IDCuentaReferencial[j];
                     //  log.error('arrAuxiliar[2].1', arrAuxiliar[2]);
                     //3. Latam - BR Account's Parent
                     arrAuxiliar[3] = objResult[i].getValue(columns[3]);
                     //4. Latam - BR Level
                     arrAuxiliar[4] = objResult[i].getValue(columns[4]);
                     //5. Latam - BR Account's Nature
                     arrAuxiliar[5] = objResult[i].getValue(columns[5]);
                     //6. ID de la cuenta referncial
                     arrAuxiliar[6] = objResult[i].getValue(columns[6]);
                     //7. nombre de la cuenta referncial
                     arrAuxiliar[7] = objResult[i].getValue(columns[7]);
                     //8. tipo de la cuenta referncial
                     arrAuxiliar[8] = objResult[i].getText(columns[8]).substring(0, 1);

                     ArrCuentaReferencial1[_cont] = arrAuxiliar;
                     _cont++;

                 }
             }

             intDMinReg = intDMaxReg;
             intDMaxReg += 1000;
         } else {
             DbolStop = true;
         }
     }
    
     return ArrCuentaReferencial1;
 }

 function ObtenerL00(ArrNewregistroL100) {
     
     var strBloqueL00 = '';
     var strL100 = '';
     var strL300 = '';

     var salto = '\r\n';
     //+++++++++++++++L030 A00++++++++++++++++++
     //1. REG | 2. IND_DAD
     strBloqueL00 += '|L030|' + fechaInicial + '|' + fechaFinal + '|A00|' + salto;
     contador_L00++;

    
    for (var j = 0; j < ArrNewregistroL100.length; j++) {
        if (ArrNewregistroL100[j][0] == '11') { //saldos de diciembre
            ArrNewregistroL100[j][13] = ArrNewregistroL100[j][6];
            ArrNewregistroL100[j][14] = ArrNewregistroL100[j][7];
        } else {
            ArrNewregistroL100[j][13] = 0;
            ArrNewregistroL100[j][14] = 0;
        }
        ArrNewregistroL100_dic.push(ArrNewregistroL100[j]);
    }

    var ArrAgrupadoAnual = [];
     ArrAgrupadoAnual = AgruparArregloAnualL(ArrNewregistroL100_dic,1);
     ArrCuentaReferencial = SepararCuentasReferenciales();

     var debito, credito, saldoInicial, saldoFinal;
     var strL100 = '';
     for (var j = 0; j < ArrCuentaReferencial.length; j++) {
         if (ArrCuentaReferencial[j][5] != '4' && ArrCuentaReferencial[j][5] != '04') {
             var flag_l100 = false;
             for (var i = 0; i < ArrAgrupadoAnual.length; i++) {
                 
                 if (ArrCuentaReferencial[j][2] != '' && ArrCuentaReferencial[j][2] != null && ArrCuentaReferencial[j][2] != undefined) {
                    
                    

                     if (Number(ArrCuentaReferencial[j][2]) == Number(ArrAgrupadoAnual[i][10])) {
                        
                        
                        if(isNaN(ArrAgrupadoAnual[i][5])==true){
                            saldoInicial = Number(0).toFixed(2);
                        }else{
                            saldoInicial = Number(ArrAgrupadoAnual[i][5]).toFixed(2)
                        }
                        if(isNaN(ArrAgrupadoAnual[i][6])==true){
                            debito = Number(0).toFixed(2);
                        }else{
                            debito = Number(ArrAgrupadoAnual[i][6]).toFixed(2);
                        }
                        if(isNaN(ArrAgrupadoAnual[i][7])==true){
                            credito = Number(0).toFixed(2);
                        }else{
                            credito = Number(ArrAgrupadoAnual[i][7]).toFixed(2);
                        }
                         /*
                         saldoInicial = Number(ArrAgrupadoAnual[i][5]).toFixed(2);
                         debito = Number(ArrAgrupadoAnual[i][6]).toFixed(2);
                         credito = Number(ArrAgrupadoAnual[i][7]).toFixed(2);
                         */
                         saldoFinal = ((Number(saldoInicial) + Number(debito) - Number(credito)).toFixed(2));

                         strL100 += ArrCuentaReferencial[j][6] + "|L100|" + ArrCuentaReferencial[j][0] + '|' + ArrCuentaReferencial[j][7] + '|' + ArrCuentaReferencial[j][8] + '|' + ArrCuentaReferencial[j][4] + '|' + ArrCuentaReferencial[j][5] + '|' + ArrCuentaReferencial[j][3] + '|' + (saldoInicial) + '|';

                         if (saldoInicial > 0) {
                             strL100 += "D|";
                         } else {
                             strL100 += "C|";
                         }

                         // strL100 += obtenerFormatoNumero(debito) + "|" + obtenerFormatoNumero(credito) + "|" + obtenerFormatoNumero(saldoFinal) + "|";
                         strL100 += (debito) + "|" + (credito) + "|" + (saldoFinal) + "|";

                         if (saldoFinal > 0) {
                             strL100 += "D|\r\n";
                         } else {
                             strL100 += "C|\r\n";
                         }
                         // contador_L100++;
                         flag_l100 = true;
                         break;
                     }

                 } else {
                     //este es el caso en el que la cuenta corporativa esta vacia dentro de este record entonces lo manda con 0 xq no hay de donde sacar transacciones
                     strL100 += ArrCuentaReferencial[j][6] + "|L100|" + ArrCuentaReferencial[j][0] + '|' + ArrCuentaReferencial[j][7] + '|' + ArrCuentaReferencial[j][8] + '|' + ArrCuentaReferencial[j][4] + '|' + ArrCuentaReferencial[j][5] + '|' + ArrCuentaReferencial[j][3] + '|' + '0.00' + '|';
                     strL100 += "C|" + '0.00' + "|" + '0.00' + "|" + '0.00' + "|" + "C|\r\n";

                     //  contador_L100++;
                     flag_l100 = true;
                     break;
                 }

             }
             if (!flag_l100) {
                 //este caso es cuando la cuenta corporativa esta llena pero no hace match ya que en l100 solo ve cuentas de balance
                 strL100 += ArrCuentaReferencial[j][6] + "|L100|" + ArrCuentaReferencial[j][0] + '|' + ArrCuentaReferencial[j][7] + '|' + ArrCuentaReferencial[j][8] + '|' + ArrCuentaReferencial[j][4] + '|' + ArrCuentaReferencial[j][5] + '|' + ArrCuentaReferencial[j][3] + '|' + '0.00' + '|';
                 strL100 += "C|" + '0.00' + "|" + '0.00' + "|" + '0.00' + "|" + "C|\r\n";

                 // contador_L100++;
             }
         }
     }
     var arrBloquel100 = ConvertToArray(strL100);

     var arrBL100agrupado = AgruparArregloAnualL100(arrBloquel100, 3);
     L100Final = sumaraPadres_Montos(arrBL100agrupado);

     for (var i = 0; i < L100Final.length; i++) {
         if (L100Final[i][8] > 0) {
             L100Final[i][9] = 'D'
         } else {
             L100Final[i][9] = 'C'
         }

         if (L100Final[i][12] > 0) {
             L100Final[i][13] = 'D'
         } else {
             L100Final[i][13] = 'C'
         }
         strBloqueL00 += '|' + L100Final[i][1] + '|' + L100Final[i][2] + '|' + L100Final[i][3] + '|' + L100Final[i][4] + '|' + L100Final[i][5] + '|' + L100Final[i][6] + '|' + L100Final[i][7] + '|';
         strBloqueL00 += obtenerFormatoNumero(Number(L100Final[i][8]).toFixed(2)) + '|' + L100Final[i][9] + '|' + obtenerFormatoNumero(Number(L100Final[i][10]).toFixed(2)) + '|' + obtenerFormatoNumero(Number(L100Final[i][11]).toFixed(2)) + '|' + obtenerFormatoNumero(Number(L100Final[i][12]).toFixed(2)) + '|' + L100Final[i][13] + '|\r\n';
         contador_L100++;
     }

     //cuando no viene data en las transacciones del map se toma en cuenta las busqueda sola de las cuentas con sus saldos iniciales 
     if (ArrAgrupadoAnual.length == 0) {
         var saldofinalBalance = 0;

         for (var i = 0; i < planCuentasTotalesBalanceArray.length; i++) {

             strBloqueL00 += "|L100|" + planCuentasTotalesBalanceArray[i][5] + '|' + planCuentasTotalesBalanceArray[i][7] + '|' + planCuentasTotalesBalanceArray[i][3] + '|' + planCuentasTotalesBalanceArray[i][4] + '|' + planCuentasTotalesBalanceArray[i][2] + '|' + planCuentasTotalesBalanceArray[i][6] + '|' + Number(planCuentasTotalesBalanceArray[i][8]).toFixed(2) + '|';
             if (planCuentasTotalesBalanceArray[i][8] > 0) {
                 strBloqueL00 += "D|";
             } else {
                 strBloqueL00 += "C|";
             }

             strBloqueL00 += 0.00 + '|' + 0.00 + '|' + planCuentasTotalesBalanceArray[i][8] + '|';
             if (planCuentasTotalesBalanceArray[i][8] > 0) {
                 strBloqueL00 += "D|\r\n";
             } else {
                 strBloqueL00 += "C|\r\n";
             }
             contador_L100++;
         }
     }

     strBloqueL00 += '|L200|' + STOCK_VALUATION + '|' + salto;

     //l210

     var strL210 = '';
     var arrTempL210 = [];

     for (var i = 0; i < 12; i++) {
         if (saldoPeriodosL210Json[i] != null) {
             for (var j = 0; j < saldoPeriodosL210Json[i].length; j++) {
                 arrTempL210.push(saldoPeriodosL210Json[i][j]);
             }
         }
     }

     ArrAgrupadoAnual_L210 = AgruparArregloAnualL210(arrTempL210);
     var arrL210_busq_anual = BuscarL210();
     //log.error('saldoPeriodosL210Json[i]', saldoPeriodosL210Json[i]);

     for (var j = 0; j < arrL210_busq_anual.length; j++) {
         var flag_l210 = false;
         var saldoInicial, saldoFinal, debito, credito;

         for (var z = 0; z < ArrAgrupadoAnual_L210.length; z++) {

             if (arrL210_busq_anual[j][2] == ArrAgrupadoAnual_L210[z][1]) {
                 saldoInicial = Number(ArrAgrupadoAnual_L210[z][3]).toFixed(2);
                 debito = Number(ArrAgrupadoAnual_L210[z][4]).toFixed(2);
                 credito = Number(ArrAgrupadoAnual_L210[z][5]).toFixed(2);
                 saldoFinal = ((Number(saldoInicial) + Number(debito) - Number(credito)).toFixed(2));

                 strL210 += "|L210|" + arrL210_busq_anual[j][2] + '|' + arrL210_busq_anual[j][1] + '|' + (saldoFinal) + '|\r\n';

                 flag_l210 = true;
                 break;
             }
         }

         if (!flag_l210) {
             //este caso es cuando la cuenta corporativa esta llena pero no hace match ya que en l100 solo ve cuentas de balance
             strL210 += "|L210|" + arrL210_busq_anual[j][2] + '|' + arrL210_busq_anual[j][1] + '|' + '0.00' + '|\r\n';
         }
     }

     var StringL210 = strL210;
     var arrBloquel210_mensual = ConvertToArray(StringL210);

     for (var b = 0; b < arrBloquel210_mensual.length; b++) {

         strBloqueL00 += '|' + arrBloquel210_mensual[b][1] + '|' + arrBloquel210_mensual[b][2] + '|' + arrBloquel210_mensual[b][3] + '|' + obtenerFormatoNumero(Number(arrBloquel210_mensual[b][4]).toFixed(2)) + '|\r\n';
         contador_L210++;
     }

     //fin del l210

     //empieza l300
     var arrTempResultado = [];

     for (var i = 0; i < 12; i++) {
         if (saldoPeriodosResultadoJson[i] != null) {
             for (var j = 0; j < saldoPeriodosResultadoJson[i].length; j++) {
                 arrTempResultado.push(saldoPeriodosResultadoJson[i][j]);
             }
         }
     }

     ArrAgrupadoAnual_Result = AgruparArregloAnualL(arrTempResultado,2);

     var flag = false;
     for (var j = 0; j < ArrCuentaReferencial.length; j++) {
         if (ArrCuentaReferencial[j][5] == '04' || ArrCuentaReferencial[j][5] == '4') {
             var debito, credito, saldoInicial, saldoFinal;
             var flag = false;
             //  if (saldoPeriodosResultadoJson[i] !== undefined) {
             for (var i = 0; i < ArrAgrupadoAnual_Result.length; i++) {

                 if (ArrCuentaReferencial[j][2] != '' && ArrCuentaReferencial[j][2] != null && ArrCuentaReferencial[j][2] != undefined) {
                     if (ArrCuentaReferencial[j][2] == ArrAgrupadoAnual_Result[i][10]) {
                         saldoInicial = Number(ArrAgrupadoAnual_Result[i][5]).toFixed(2);
                         debito = Number(ArrAgrupadoAnual_Result[i][6]).toFixed(2);
                         credito = Number(ArrAgrupadoAnual_Result[i][7]).toFixed(2);

                         saldoFinal = ((Number(saldoInicial) + Number(debito) - Number(credito)).toFixed(2));
                         strL300 += "|L300|" + ArrCuentaReferencial[j][0] + '|' + ArrCuentaReferencial[j][7] + '|' + ArrCuentaReferencial[j][8] + '|' + ArrCuentaReferencial[j][4] + '|' + ArrCuentaReferencial[j][5] + '|' + ArrCuentaReferencial[j][3] + '|' + (saldoFinal) + '|';

                         if (saldoFinal > 0) {
                             strL300 += "D|\r\n";
                         } else {
                             strL300 += "C|\r\n";
                         }
                         //contador_L300++;
                         flag = true;
                         break;
                     }

                 } else {
                     //este es el caso en el que la cuenta corporativa esta vacia dentro de este record entonces lo manda con 0 xq no hay de donde sacar transacciones
                     strL300 += "|L300|" + ArrCuentaReferencial[j][0] + '|' + ArrCuentaReferencial[j][7] + '|' + ArrCuentaReferencial[j][8] + '|' + ArrCuentaReferencial[j][4] + '|' + ArrCuentaReferencial[j][5] + '|' + ArrCuentaReferencial[j][3] + '|' + '0.00' + '|';
                     strL300 += "C|\r\n";

                     // contador_L300++;
                     flag = true;
                     break;
                 }
             }
             if (!flag) {
                 //este caso es cuando la cuenta corporativa esta llena pero no hace match ya que en l100 solo ve cuentas de balance
                 strL300 += "|L300|" + ArrCuentaReferencial[j][0] + '|' + ArrCuentaReferencial[j][7] + '|' + ArrCuentaReferencial[j][8] + '|' + ArrCuentaReferencial[j][4] + '|' + ArrCuentaReferencial[j][5] + '|' + ArrCuentaReferencial[j][3] + '|' + '0.00' + '|';
                 strL300 += "C|\r\n";

                 //  contador_L300++;
             }
         }
     }

     arrBloquel300 = ConvertToArray(strL300);
     var arrBL300agrupado = AgruparArregloAnualL100(arrBloquel300, 4);
     
     L300Final = sumaraPadres_Montosl300(arrBL300agrupado);
     //log.error('L300Finall00',L300Final.length);
     for (var i = 0; i < L300Final.length; i++) {
         if (L300Final[i][8] > 0) {
             L300Final[i][9] = 'D'
         } else {
             L300Final[i][9] = 'C'
         }

         strBloqueL00 += '|' + L300Final[i][1] + '|' + L300Final[i][2] + '|' + L300Final[i][3] + '|' + L300Final[i][4] + '|' + L300Final[i][5] + '|' + L300Final[i][6] + '|' + L300Final[i][7] + '|';
         strBloqueL00 += obtenerFormatoNumero(Number(L300Final[i][8]).toFixed(2)) + '|' + L300Final[i][9] + '|\r\n';
         contador_L300++;
     }
     //fin l300 anual
  
     if (ArrAgrupadoAnual_Result.length == 0) {
         var saldofinalBalance = 0;

         for (var i = 0; i < planCuentasTotalesResultadoArray.length; i++) {

             strBloqueL00 += "|L300|" + planCuentasTotalesResultadoArray[i][5] + '|' + planCuentasTotalesResultadoArray[i][7] + '|' + planCuentasTotalesResultadoArray[i][3] + '|' + planCuentasTotalesResultadoArray[i][4] + '|' + planCuentasTotalesResultadoArray[i][2] + '|' + planCuentasTotalesResultadoArray[i][6] + '|' + Number(planCuentasTotalesResultadoArray[i][8]).toFixed(0) + '|';
             if (Number(planCuentasTotalesResultadoArray[i][8]).toFixed(0) > 0) {
                 strBloqueL00 += "D|\r\n";
             } else {
                 strBloqueL00 += "C|\r\n";
             }

             contador_L300++;
         }
     }
     return strBloqueL00;
 }

 function ConvertToArray(strFile) {
     var rows = strFile.split('\r\n');

     var ArrReturn = new Array();
     var cont = 0;

     for (var i = 0; i < rows.length - 1; i++) {
         var columns = rows[i].split('|');

         var arr = new Array();

         for (var j = 0; j < columns.length - 1; j++) {
             arr[j] = columns[j];
         }

         ArrReturn[cont] = arr;
         cont++;
     }

     return ArrReturn;
 }

 function sumaraPadres_Montos(arr) {
     var pivote;
     var pivote_temporal;
     //log.error('arrantes', arr);
     for (var p = 0; p < arr.length; p++) {
         //log.error('arr[i][4]',arr[i][4]);
         //el A se le atribuye a las cuentas analiticas
         if (arr[p][4] == 'A') {
             pivote = arr[p];

             // Sumar a todos los padres de pivote
             pivote_temporal = pivote;
             for (var q = p - 1; q >= 0; q--) {
                 if (arr[q][4] != "A") {
                     if (arr[q][2] == pivote_temporal[7]) {
                         // sumar
                         arr[q][8] = Number(arr[p][8]) + Number(arr[q][8]);
                         arr[q][10] = Number(arr[p][10]) + Number(arr[q][10]);
                         arr[q][11] = Number(arr[p][11]) + Number(arr[q][11]);
                         arr[q][12] = Number(arr[p][12]) + Number(arr[q][12]);

                         // cambiar pivote temporal
                         pivote_temporal = arr[q];
                     }
                 }
             }
         }
     }
     return arr;

 }

 function sumaraPadres_Montosl300(arrBloquel300) {
     var pivote;
     var pivote_temporal;

     for (var i = 0; i < arrBloquel300.length; i++) {
         //log.error('arrBloquel300[i][3]',arrBloquel300[i][3]);
         //el A se le atribuye a las cuentas analiticas
         if (arrBloquel300[i][4] == 'A') {
             pivote = arrBloquel300[i];
             // Sumar a todos los padres de pivote
             pivote_temporal = pivote;
             for (var j = i - 1; j >= 0; j--) {
                 if (arrBloquel300[j][4] != "A") {
                     if (arrBloquel300[j][2] == pivote_temporal[7]) {
                         // sumar
                         arrBloquel300[j][8] = Number(arrBloquel300[i][8]) + Number(arrBloquel300[j][8]);

                         // cambiar pivote temporal
                         pivote_temporal = arrBloquel300[j];
                     }
                 }
             }
         }
     }
     // log.error('arrBloquel300', arrBloquel300);
     return arrBloquel300;
 }

 function AgruparArregloAnualL(ArrTemp,type) {
     if(type==1){
     var aux = [];
     if (ArrTemp != null) {
        var long = ArrTemp.length;
        for (var i = 0; i < long - 1; i++) {
            for (var j = 0; j < long - 1; j++) {
                if (Number(ArrTemp[j][10]) > Number(ArrTemp[j + 1][10])) {
                    var temp = ArrTemp[j + 1];
                    ArrTemp[j + 1] = ArrTemp[j];
                    ArrTemp[j] = temp;
                }
            }
        }
        //   log.error('ordenado',ArrTemp);
        //   log.error('ordenado',ArrTemp.length);
        for (var x = 0; x < long; x++) {
            var auxiliar = new Array();
            auxiliar[0] = ArrTemp[x][0];
            auxiliar[1] = ArrTemp[x][1];
            auxiliar[2] = ArrTemp[x][2];
            auxiliar[3] = ArrTemp[x][3];
            auxiliar[4] = ArrTemp[x][4];
            auxiliar[5] = ArrTemp[x][5];
            auxiliar[6] = ArrTemp[x][6];
            auxiliar[7] = ArrTemp[x][7];
            auxiliar[8] = ArrTemp[x][8];
            auxiliar[9] = ArrTemp[x][9];
            auxiliar[10] = ArrTemp[x][10];
            auxiliar[11] = ArrTemp[x][11];
            auxiliar[12] = ArrTemp[x][12];
            auxiliar[13] = ArrTemp[x][13];
            auxiliar[14] = ArrTemp[x][14];

            if (x != long - 1) {
                while (ArrTemp[x][10] == ArrTemp[x + 1][10]) {
                    //auxiliar[5] = Number(auxiliar[5]) + Number(ArrTemp[x + 1][5]);
                    auxiliar[6] = Number(auxiliar[13]) + Number(ArrTemp[x + 1][13]);
                    auxiliar[7] = Number(auxiliar[14]) + Number(ArrTemp[x + 1][14]);
                    x++;

                    if (x == long - 1) {
                        break;
                    }

                }
            }
            aux.push(auxiliar);

        }
        return aux;
    } else {
        return aux;
    }
     }else{
        var aux = [];
        if (ArrTemp != null) {
           var long = ArrTemp.length;
           for (var i = 0; i < long - 1; i++) {
               for (var j = 0; j < long - 1; j++) {
                   if (Number(ArrTemp[j][10]) > Number(ArrTemp[j + 1][10])) {
                       var temp = ArrTemp[j + 1];
                       ArrTemp[j + 1] = ArrTemp[j];
                       ArrTemp[j] = temp;
                   }
               }
           }
           //   log.error('ordenado',ArrTemp);
           //   log.error('ordenado',ArrTemp.length);
           for (var x = 0; x < long; x++) {
               var auxiliar = new Array();
               auxiliar[0] = ArrTemp[x][0];
               auxiliar[1] = ArrTemp[x][1];
               auxiliar[2] = ArrTemp[x][2];
               auxiliar[3] = ArrTemp[x][3];
               auxiliar[4] = ArrTemp[x][4];
               auxiliar[5] = ArrTemp[x][5];
               auxiliar[6] = ArrTemp[x][6];
               auxiliar[7] = ArrTemp[x][7];
               auxiliar[8] = ArrTemp[x][8];
               auxiliar[9] = ArrTemp[x][9];
               auxiliar[10] = ArrTemp[x][10];
               auxiliar[11] = ArrTemp[x][11];
               auxiliar[12] = ArrTemp[x][12];
   
               if (x != long - 1) {
                   while (ArrTemp[x][10] == ArrTemp[x + 1][10]) {
                       auxiliar[5] = Number(auxiliar[5]) + Number(ArrTemp[x + 1][5]);
                       auxiliar[6] = Number(auxiliar[6]) + Number(ArrTemp[x + 1][6]);
                       auxiliar[7] = Number(auxiliar[7]) + Number(ArrTemp[x + 1][7]);
                       x++;
   
                       if (x == long - 1) {
                           break;
                       }
   
                   }
               }
               aux.push(auxiliar);
   
           }
           return aux;
       } else {
           return aux;
       }
     }
    
     
 }

 function AgruparArregloAnualL210(ArrTemp) {
     var aux = [];

     if (ArrTemp != null) {
         var long = ArrTemp.length;
         for (var i = 0; i < long - 1; i++) {
             for (var j = 0; j < long - 1; j++) {
                 if (Number(ArrTemp[j][1]) > Number(ArrTemp[j + 1][1])) {
                     var temp = ArrTemp[j + 1];
                     ArrTemp[j + 1] = ArrTemp[j];
                     ArrTemp[j] = temp;
                 }
             }
         }
         
         for (var x = 0; x < long; x++) {
             var auxiliar = new Array();
             auxiliar[0] = ArrTemp[x][0];
             auxiliar[1] = ArrTemp[x][1];
             auxiliar[2] = ArrTemp[x][2];
             auxiliar[3] = ArrTemp[x][3];
             auxiliar[4] = ArrTemp[x][4];
             auxiliar[5] = ArrTemp[x][5];

             if (x != long - 1) {
                 while (ArrTemp[x][1] == ArrTemp[x + 1][1]) {
                     auxiliar[3] = Number(auxiliar[3]) + Number(ArrTemp[x + 1][3]);
                     auxiliar[4] = Number(auxiliar[4]) + Number(ArrTemp[x + 1][4]);
                     auxiliar[5] = Number(auxiliar[5]) + Number(ArrTemp[x + 1][5]);
                     x++;

                     if (x == long - 1) {
                         break;
                     }
                 }
             }
             aux.push(auxiliar);
         }
         return aux;
     } else {
         return aux;
     }
 }

 function AgruparArregloAnualM010(ArrTemp) {
     var aux = [];

     if (ArrTemp != null) {
         var long = ArrTemp.length;
         for (var i = 0; i < long - 1; i++) {
             for (var j = 0; j < long - 1; j++) {
                 if (Number(ArrTemp[j][4]) > Number(ArrTemp[j + 1][4])) {
                     var temp = ArrTemp[j + 1];
                     ArrTemp[j + 1] = ArrTemp[j];
                     ArrTemp[j] = temp;
                 }
             }
         }
         //   log.error('ordenado',ArrTemp);
         //   log.error('ordenado',ArrTemp.length);
         for (var x = 0; x < long; x++) {
             var auxiliar = new Array();
             auxiliar[0] = ArrTemp[x][0];
             auxiliar[1] = ArrTemp[x][1];
             auxiliar[2] = ArrTemp[x][2];
             auxiliar[3] = ArrTemp[x][3];
             auxiliar[4] = ArrTemp[x][4];
             auxiliar[5] = ArrTemp[x][5];
             auxiliar[6] = ArrTemp[x][6];
             auxiliar[7] = ArrTemp[x][7];
             auxiliar[8] = ArrTemp[x][8];
             auxiliar[9] = ArrTemp[x][9];

             if (x != long - 1) {
                 while (ArrTemp[x][4] == ArrTemp[x + 1][4]) {
                     auxiliar[6] = Number(auxiliar[6]) + Number(ArrTemp[x + 1][6]);
                     auxiliar[7] = Number(auxiliar[7]) + Number(ArrTemp[x + 1][7]);
                     auxiliar[8] = Number(auxiliar[8]) + Number(ArrTemp[x + 1][8]);
                     x++;

                     if (x == long - 1) {
                         break;
                     }
                 }
             }
             aux.push(auxiliar);

         }
         return aux;
     } else {
         return aux;
     }

 }

 function AgruparArregloKECD(ArrTemp) {
     var aux = [];
     //log.debug("valor de ArrTemp",ArrTemp);
     
     if (ArrTemp != null && (ArrTemp.length >= 2)) {
         var long = ArrTemp.length;
         for (var i = 0; i < long - 1; i++) {
             for (var j = 0; j < long - 1; j++) {
                 if (Number(ArrTemp[j][6]) > Number(ArrTemp[j + 1][6])) {
                     var temp = ArrTemp[j + 1];
                     ArrTemp[j + 1] = ArrTemp[j];
                     ArrTemp[j] = temp;
                 }
             }
         }

         for (var x = 0; x < long; x++) {
            /*             
            if(ArrTemp[x][6]==132){
                log.debug("valor de ArrTemp[3]",ArrTemp[x][3]);
                log.debug("valor de ArrTemp[4]",ArrTemp[x][4]);
                log.debug("valor de ArrTemp[5]",ArrTemp[x][5]);
                log.debug("valor de ArrTemp[6]",ArrTemp[x][6]);    
             }
            */
             var auxiliar = new Array();
             auxiliar[0] = ArrTemp[x][0];
             auxiliar[1] = ArrTemp[x][1];
             auxiliar[2] = '';
             auxiliar[3] = ArrTemp[x][3];
             auxiliar[4] = ArrTemp[x][4];
             auxiliar[5] = ArrTemp[x][5];
             auxiliar[6] = ArrTemp[x][6];


             if (x != long - 1) {
                 while (((ArrTemp[x][6] == ArrTemp[x + 1][6]))) {
                     auxiliar[3] = Number(auxiliar[3]) + Number(ArrTemp[x + 1][3]);
                     auxiliar[4] = Number(auxiliar[4]) + Number(ArrTemp[x + 1][4]);
                     auxiliar[5] = Number(auxiliar[5]) + Number(ArrTemp[x + 1][5]);
                     x++;
                    //quitar luego de qa 
                    if(ArrTemp[x][6]==132){
                        log.debug("valor de saldo inicial1",auxiliar[3]);
                        log.debug("valor de debito1",auxiliar[4]);
                        log.debug("valor de credito1",auxiliar[5]);
                        log.debug("valor de br coa1",auxiliar[6]);
                    }
                     if (x == long - 1) {
                         break;
                     }
                 }
             }
             aux.push(auxiliar);

         }
         return aux;
     } else {
         return aux;
     }
 }

 function AgruparArregloAnualK00(ArrTemp, tipo) {
     if (tipo == 1) { //entra en los anuales 
         var aux = [];

         if (ArrTemp != null) {
             var long = ArrTemp.length;
             for (var i = 0; i < long - 1; i++) {
                 for (var j = 0; j < long - 1; j++) {
                     if (Number(ArrTemp[j][6]) > Number(ArrTemp[j + 1][6])) {
                         var temp = ArrTemp[j + 1];
                         ArrTemp[j + 1] = ArrTemp[j];
                         ArrTemp[j] = temp;
                     }
                 }
             }

             for (var x = 0; x < long; x++) {
                 var auxiliar = new Array();
                 auxiliar[0] = ArrTemp[x][0];
                 auxiliar[1] = ArrTemp[x][1];
                 auxiliar[2] = ArrTemp[x][2];
                 auxiliar[3] = ArrTemp[x][3];
                 auxiliar[4] = ArrTemp[x][4];
                 auxiliar[5] = ArrTemp[x][5];
                 auxiliar[6] = ArrTemp[x][6];
                 auxiliar[7] = ArrTemp[x][7];
                 auxiliar[8] = ArrTemp[x][8];


                 if (x != long - 1) {
                     while (((ArrTemp[x][6] == ArrTemp[x + 1][6]))) {
                         //auxiliar[3] = Number(auxiliar[11]) + Number(ArrTemp[x+1][11]);
                         auxiliar[4] = Number(auxiliar[7]) + Number(ArrTemp[x + 1][7]);
                         auxiliar[5] = Number(auxiliar[8]) + Number(ArrTemp[x + 1][8]);
                         x++;

                         if (x == long - 1) {
                             break;
                         }
                     }
                 }
                 aux.push(auxiliar);

             }
             return aux;
         } else {
             return aux;
         }
     } 

 }

 function AgruparArregloAnualL100(ArrTemp, tipo) {
     if (tipo == 3) {
         //se agrupa ya el arreglo cuando mas deuna ccse le asigna a una cuenta referencial
         if (ArrTemp != null) {
             for (var i = 0; i < ArrTemp.length - 1; i++) {
                 for (var j = i + 1; j < ArrTemp.length; j++) {
                     if (ArrTemp[i][2] == ArrTemp[j][2]) {
                         ArrTemp[i][8] = Number(ArrTemp[i][8]) + Number(ArrTemp[j][8]);
                         ArrTemp[i][10] = Number(ArrTemp[i][10]) + Number(ArrTemp[j][10]);
                         ArrTemp[i][11] = Number(ArrTemp[i][11]) + Number(ArrTemp[j][11]);
                         ArrTemp[i][12] = Number(ArrTemp[i][12]) + Number(ArrTemp[j][12]);
                         ArrTemp.splice(j, 1);
                         j--;
                     }
                 }
             }

             return ArrTemp;
         } else {
             return [];
         }
     } else if (tipo == 4) {
         if (ArrTemp != null) {
             for (var i = 0; i < ArrTemp.length - 1; i++) {
                 for (var j = i + 1; j < ArrTemp.length; j++) {
                     if (ArrTemp[i][2] == ArrTemp[j][2]) {
                         ArrTemp[i][8] = Number(ArrTemp[i][8]) + Number(ArrTemp[j][8]);

                         ArrTemp.splice(j, 1);
                         j--;
                     }
                 }
             }
             return ArrTemp;
         } else {
             return [];
         }
     }

 }

 function AgruparArregloAnualM(ArrTemp) {
     var aux = [];

     if (ArrTemp != null) {
         var long = ArrTemp.length;
         for (var i = 0; i < long - 1; i++) {
             for (var j = 0; j < long - 1; j++) {
                 if (Number(ArrTemp[j][1]) > Number(ArrTemp[j + 1][1])) {
                     var temp = ArrTemp[j + 1];
                     ArrTemp[j + 1] = ArrTemp[j];
                     ArrTemp[j] = temp;
                 }
             }
         }
         
         for (var x = 0; x < long; x++) {
             var auxiliar = new Array();
             auxiliar[0] = ArrTemp[x][0];
             auxiliar[1] = ArrTemp[x][1];
             auxiliar[2] = ArrTemp[x][2];
             auxiliar[3] = ArrTemp[x][3];
             auxiliar[4] = ArrTemp[x][4];
             auxiliar[5] = ArrTemp[x][5];
             auxiliar[6] = ArrTemp[x][6];
             auxiliar[7] = ArrTemp[x][7];
             auxiliar[8] = ArrTemp[x][8];


             if (x != long - 1) {
                 while (ArrTemp[x][1] == ArrTemp[x + 1][1]) {
                     auxiliar[4] = Number(auxiliar[4]) + Number(ArrTemp[x + 1][4]);
                     auxiliar[5] = Number(auxiliar[5]) + Number(ArrTemp[x + 1][5]);
                     auxiliar[6] = Number(auxiliar[6]) + Number(ArrTemp[x + 1][6]);
                     x++;

                     if (x == long - 1) {
                         break;
                     }
                 }
             }
             aux.push(auxiliar);
         }
         return aux;
     } else {
         return aux;
     }
 }

 function GenerarBloqueL() {
     var salto = '\r\n';
     var contador_L = 0;
     var strBloqueL = '';
     var arrAuxiliar = new Array();

     //+++++++++++++++L001++++++++++++++++++
     //1. REG | 2. IND_DAD
     strBloqueL += '|L001|0|' + salto;
     arrAuxiliar[0] = 'L001';
     arrAuxiliar[1] = 1;
     ArrBloque9.push(arrAuxiliar);
     contador_L++;

     var ArrNewregistroL100 = FormarRegistroL();
     //+++++++++++++++L030A00++++++++++++++++++
     //1. REG
     strBloqueL += ObtenerL00(ArrNewregistroL100);
     //+++++++++++++++L030A01 - L030A12++++++++++++++++++

     //+++++++++++++++L100 - L200 - L300+++++++++++++++++
     //solo se genera esta parte cuando es balancete 
     if (setupJson["MES_BAL_RED"] == "BBBBBBBBBBBB") {
         strBloqueL += ObtenerL100ºL200ºL300(ArrNewregistroL100);
     }
     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'L030';
     arrAuxiliar[1] = numeroLineasL030 + 1;
     ArrBloque9.push(arrAuxiliar);

     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'L100';
     arrAuxiliar[1] = contador_L100;
     ArrBloque9.push(arrAuxiliar);

     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'L200';
     arrAuxiliar[1] = numeroLineasL200 + 1;
     ArrBloque9.push(arrAuxiliar);
     contador_L++;

     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'L210';
     arrAuxiliar[1] = contador_L210;
     ArrBloque9.push(arrAuxiliar);

     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'L300';
     arrAuxiliar[1] = contador_L300;
     ArrBloque9.push(arrAuxiliar);

     contador_global += contador_L00 + numeroLineasL030 + contador_L100 + numeroLineasL200 + contador_L210 + contador_L300;
     contador_L += contador_L00 + numeroLineasL030 + contador_L100 + contador_L210 + numeroLineasL200 + contador_L300;

     //+++++++++++++++L990++++++++++++++++++
     contador_L++;
     //1. REG | 2. QTD_LIN
     strBloqueL += '|L990|' + contador_L + '|' + salto;
     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'L990';
     arrAuxiliar[1] = 1;
     ArrBloque9.push(arrAuxiliar);

     //reemplazamos los puntos por comas
     strBloqueL = strBloqueL.replace(/\&lt;/g, '<').replace(/\&gt;/g, '>');
     //strBloqueL = strBloqueL.replace(/\./g, ',');

     return strBloqueL;
 }

 function ObtenerL100ºL200ºL300(ArrNewregistroL100) {
     var strL100_mensual = '';
     var strL300_mensual = '';

     var startDateObject = format.parse({
         type: format.Type.DATE,
         value: periodStartDate
     });
     var totalString = "",
         debito, credito, saldoInicial, saldoFinal, monthStartDate, monthEndDate, debitoResu, creditoresu, saldoInicialresu, saldoFinalresu;
     var arrL210_busq = BuscarL210();
        var periodenddate_temp = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: param_AnioCalendario,
            columns: ['enddate']
        });
     
     

     periodenddate = periodenddate_temp.enddate;

     var fechaEnd = format.parse({
         value: periodenddate,
         type: format.Type.DATE
     });
     var AAAA = fechaEnd.getFullYear();

     //obtenerFormatoFecha(monthEndDate)

     for (var i = 0; i < 12; i++) {
        
         var strL100_mensual = '';
         monthStartDate = new Date(startDateObject.getFullYear(), i, 1);
         monthEndDate = new Date(fechaEnd.getFullYear(), i + 1, 0);
        
         totalString += "|L030|0101" + AAAA + "|" + obtenerFormatoFecha(monthEndDate) + "|A" + completar_cero(2, monthStartDate.getMonth() + 1) + "|\r\n";
         // totalString += "|L030|0101" + AAAA + "|" + arregloFechas[11 - i] + "|A" + completar_cero(2, i) + "|\r\n";
         numeroLineasL030++;
         //log.error('numeroLineasL030',numeroLineasL030);
         for (var j = 0; j < ArrCuentaReferencial.length; j++) {

             if (ArrCuentaReferencial[j][5] != '4' && ArrCuentaReferencial[j][5] != '04') {
                 var flag_l100 = false;

                // if (saldoPeriodosJson[i] !== undefined) {

                     //for (var i = 0; i < ArrAgrupadoAnual.length; i++) {
                     for (var z = 0; z < ArrNewregistroL100.length; z++) {

                        if(ArrNewregistroL100[z][0]==i){

                         if (ArrCuentaReferencial[j][2] != '' && ArrCuentaReferencial[j][2] != null && ArrCuentaReferencial[j][2] != undefined) {
                            
                             if (Number(ArrCuentaReferencial[j][2]) == Number(ArrNewregistroL100[z][10])) {
                               
                                if(isNaN(ArrNewregistroL100[z][5])==true){
                                    saldoInicial = Number(0).toFixed(2);
                                }else{
                                    saldoInicial = Number(ArrNewregistroL100[z][5]).toFixed(2)
                                }
                                if(isNaN(ArrNewregistroL100[z][6])==true){
                                    debito = Number(0).toFixed(2);
                                }else{
                                    debito = Number(ArrNewregistroL100[z][6]).toFixed(2);
                                }
                                if(isNaN(ArrNewregistroL100[z][7])==true){
                                    credito = Number(0).toFixed(2);
                                }else{
                                    credito = Number(ArrNewregistroL100[z][7]).toFixed(2);
                                }
                            
                                 
                                 saldoFinal = ((Number(saldoInicial) + Number(debito) - Number(credito)).toFixed(2));
                                 saldoFinal = ((Number(saldoInicial) + Number(debito) - Number(credito)).toFixed(2));

                                 strL100_mensual += ArrCuentaReferencial[j][6] + "|L100|" + ArrCuentaReferencial[j][0] + '|' + ArrCuentaReferencial[j][7] + '|' + ArrCuentaReferencial[j][8] + '|' + ArrCuentaReferencial[j][4] + '|' + ArrCuentaReferencial[j][5] + '|' + ArrCuentaReferencial[j][3] + '|' + (saldoInicial) + '|';

                                 if (saldoInicial > 0) {
                                     strL100_mensual += "D|";
                                 } else {
                                     strL100_mensual += "C|";
                                 }

                                 strL100_mensual += (debito) + "|" + (credito) + "|" + (saldoFinal) + "|";

                                 if (saldoFinal > 0) {
                                     strL100_mensual += "D|\r\n";
                                 } else {
                                     strL100_mensual += "C|\r\n";
                                 }

                                 // contador_L100++;
                                 flag_l100 = true;
                                 break;
                             }

                         } else {
                             //este es el caso en el que la cuenta corporativa esta vacia dentro de este record entonces lo manda con 0 xq no hay de donde sacar transacciones
                             strL100_mensual += ArrCuentaReferencial[j][6] + "|L100|" + ArrCuentaReferencial[j][0] + '|' + ArrCuentaReferencial[j][7] + '|' + ArrCuentaReferencial[j][8] + '|' + ArrCuentaReferencial[j][4] + '|' + ArrCuentaReferencial[j][5] + '|' + ArrCuentaReferencial[j][3] + '|' + '0.00' + '|';
                             strL100_mensual += "C|" + '0.00' + "|" + '0.00' + "|" + '0.00' + "|" + "C|\r\n";
                             // log.error('que boto', strL100_mensual);
                             //contador_L100++;
                             flag_l100 = true;
                             break;

                         }
                        }
                     }
                // }
                 if (!flag_l100) {
                     //este caso es cuando la cuenta corporativa esta llena pero no hace match ya que en l100 solo ve cuentas de balance
                     strL100_mensual += ArrCuentaReferencial[j][6] + "|L100|" + ArrCuentaReferencial[j][0] + '|' + ArrCuentaReferencial[j][7] + '|' + ArrCuentaReferencial[j][8] + '|' + ArrCuentaReferencial[j][4] + '|' + ArrCuentaReferencial[j][5] + '|' + ArrCuentaReferencial[j][3] + '|' + '0.00' + '|';
                     strL100_mensual += "C|" + '0.00' + "|" + '0.00' + "|" + '0.00' + "|" + "C|\r\n";
                     //contador_L100++;

                 }
             }
         }
         var StringL100 = strL100_mensual;

         var arrBloquel100_mensual = ConvertToArray(StringL100);
        
         var arrBL100agrupado_mensual = AgruparArregloAnualL100(arrBloquel100_mensual, 3);

         L100Final_mensual = sumaraPadres_Montos(arrBL100agrupado_mensual);
         
         for (var b = 0; b < L100Final_mensual.length; b++) {
             if (L100Final_mensual[b][8] > 0) {
                 L100Final_mensual[b][9] = 'D'
             } else {
                 L100Final_mensual[b][9] = 'C'
             }

             if (L100Final_mensual[b][12] > 0) {
                 L100Final_mensual[b][13] = 'D'
             } else {
                 L100Final_mensual[b][13] = 'C'
             }
             totalString += '|' + L100Final_mensual[b][1] + '|' + L100Final_mensual[b][2] + '|' + L100Final_mensual[b][3] + '|' + L100Final_mensual[b][4] + '|' + L100Final_mensual[b][5] + '|' + L100Final_mensual[b][6] + '|' + L100Final_mensual[b][7] + '|';
             totalString += obtenerFormatoNumero(Number(L100Final_mensual[b][8]).toFixed(2)) + '|' + L100Final_mensual[b][9] + '|' + obtenerFormatoNumero(Number(L100Final_mensual[b][10]).toFixed(2)) + '|' + obtenerFormatoNumero(Number(L100Final_mensual[b][11]).toFixed(2)) + '|' + obtenerFormatoNumero(Number(L100Final_mensual[b][12]).toFixed(2)) + '|' + L100Final_mensual[b][13] + '|\r\n';
             contador_L100++;
         }

         totalString += "|L200|" + STOCK_VALUATION + "|\r\n";
         numeroLineasL200++;

         //l210
         var flag_l210 = false;
         var strL210_mensual = '';

         for (var j = 0; j < arrL210_busq.length; j++) {
             var flag_l210 = false;
             var saldoInicial, saldoFinal, debito, credito;
             if (saldoPeriodosL210Json[i] !== undefined) {
                 for (var z = 0; z < saldoPeriodosL210Json[i].length; z++) {

                     if (arrL210_busq[j][2] == saldoPeriodosL210Json[i][z][1]) {
                         saldoInicial = Number(saldoPeriodosL210Json[i][z][3]).toFixed(2);
                         debito = Number(saldoPeriodosL210Json[i][z][4]).toFixed(2);
                         credito = Number(saldoPeriodosL210Json[i][z][5]).toFixed(2);
                         saldoFinal = ((Number(saldoInicial) + Number(debito) - Number(credito)).toFixed(2));

                         strL210_mensual += "|L210|" + arrL210_busq[j][2] + '|' + arrL210_busq[j][1] + '|' + (saldoFinal) + '|\r\n';

                         //contador_L300++;
                         flag_l210 = true;
                         break;
                     }

                 }
             }
             if (!flag_l210) {
                 //este caso es cuando la cuenta corporativa esta llena pero no hace match ya que en l100 solo ve cuentas de balance
                 strL210_mensual += "|L210|" + arrL210_busq[j][2] + '|' + arrL210_busq[j][1] + '|' + '0.00' + '|\r\n';
             }
         }

         var StringL210 = strL210_mensual;

         var arrBloquel210_mensual = ConvertToArray(StringL210);

         for (var b = 0; b < arrBloquel210_mensual.length; b++) {

             totalString += '|' + arrBloquel210_mensual[b][1] + '|' + arrBloquel210_mensual[b][2] + '|' + arrBloquel210_mensual[b][3] + '|' + obtenerFormatoNumero(Number(arrBloquel210_mensual[b][4]).toFixed(2)) + '|\r\n';
             contador_L210++;
         }

         //fin del l210
         //empieza l300
         // var flag = false;
         var strL300_mensual = '';
         for (var j = 0; j < ArrCuentaReferencial.length; j++) {
             if (ArrCuentaReferencial[j][5] == '04' || ArrCuentaReferencial[j][5] == '4') {
                 var flag = false;
                 var debitoResu, creditoresu, saldoInicialresu, saldoFinalresu;
                 if (saldoPeriodosResultadoJson[i] !== undefined) {
                     for (var z = 0; z < saldoPeriodosResultadoJson[i].length; z++) {

                         if (ArrCuentaReferencial[j][2] != '' && ArrCuentaReferencial[j][2] != null && ArrCuentaReferencial[j][2] != undefined) {
                             if (ArrCuentaReferencial[j][2] == saldoPeriodosResultadoJson[i][z][10]) {
                                 saldoInicialresu = Number(saldoPeriodosResultadoJson[i][z][5]).toFixed(2);
                                 debitoResu = Number(saldoPeriodosResultadoJson[i][z][6]).toFixed(2);
                                 creditoresu = Number(saldoPeriodosResultadoJson[i][z][7]).toFixed(2);
                                 saldoFinalresu = ((Number(saldoInicialresu) + Number(debitoResu) - Number(creditoresu)).toFixed(2));

                                 strL300_mensual += "|L300|" + ArrCuentaReferencial[j][0] + '|' + ArrCuentaReferencial[j][7] + '|' + ArrCuentaReferencial[j][8] + '|' + ArrCuentaReferencial[j][4] + '|' + ArrCuentaReferencial[j][5] + '|' + ArrCuentaReferencial[j][3] + '|' + (saldoFinalresu) + '|';

                                 if (saldoFinal > 0) {
                                     strL300_mensual += "D|\r\n";
                                 } else {
                                     strL300_mensual += "C|\r\n";
                                 }
                                 //contador_L300++;
                                 flag = true;
                                 break;
                             }

                         } else {
                             //este es el caso en el que la cuenta corporativa esta vacia dentro de este record entonces lo manda con 0 xq no hay de donde sacar transacciones
                             strL300_mensual += "|L300|" + ArrCuentaReferencial[j][0] + '|' + ArrCuentaReferencial[j][7] + '|' + ArrCuentaReferencial[j][8] + '|' + ArrCuentaReferencial[j][4] + '|' + ArrCuentaReferencial[j][5] + '|' + ArrCuentaReferencial[j][3] + '|' + '0.00' + '|';
                             strL300_mensual += "C|\r\n";

                             // contador_L300++;
                             flag = true;
                             break;
                         }
                     }
                 }
                 if (!flag) {
                     //este caso es cuando la cuenta corporativa esta llena pero no hace match ya que en l100 solo ve cuentas de balance
                     strL300_mensual += "|L300|" + ArrCuentaReferencial[j][0] + '|' + ArrCuentaReferencial[j][7] + '|' + ArrCuentaReferencial[j][8] + '|' + ArrCuentaReferencial[j][4] + '|' + ArrCuentaReferencial[j][5] + '|' + ArrCuentaReferencial[j][3] + '|' + '0.00' + '|';
                     strL300_mensual += "C|\r\n";
                     //  contador_L300++;
                 }

             }
         }
         var StringL300 = strL300_mensual;
         var arrBloquel300_mensual = ConvertToArray(StringL300);
        
         //agrupa las cuentas
         var arrBL300agrupado_mensual = AgruparArregloAnualL100(arrBloquel300_mensual, 4);
        
         L300Final_mensual = sumaraPadres_Montosl300(arrBL300agrupado_mensual);
        
         for (var a = 0; a < L300Final_mensual.length; a++) {
             if (L300Final_mensual[a][8] > 0) {
                 L300Final_mensual[a][9] = 'D'
             } else {
                 L300Final_mensual[a][9] = 'C'
             }

             totalString += '|' + L300Final_mensual[a][1] + '|' + L300Final_mensual[a][2] + '|' + L300Final_mensual[a][3] + '|' + L300Final_mensual[a][4] + '|' + L300Final_mensual[a][5] + '|' + L300Final_mensual[a][6] + '|' + L300Final_mensual[a][7] + '|';
             totalString += obtenerFormatoNumero(Number(L300Final_mensual[a][8]).toFixed(2)) + '|' + L300Final_mensual[a][9] + '|\r\n';
             contador_L300++;
         }
     }
     return totalString;
 }

 function obtenerFormatoFecha(date) {
     return "" + completar_cero(2, date.getDate()) + completar_cero(2, date.getMonth() + 1) + date.getFullYear();
 }

 function obtenerFormatoNumero(numero) {
     return ("" + numero).replace("-", "").replace(".", ",");
 }

 function ObtenerM00() {
     var strBloqueM00 = '';
     var salto = '\r\n';
     //+++++++++++++++M030 A00++++++++++++++++++
     //1. REG | 2. IND_DAD

     strBloqueM00 += '|M030|' + fechaInicial + '|' + ValidaGuion(fechaFinal) + '|A00|' + salto;
     
     var debito, credito, saldoInicial, saldoFinal;
     var arrTempM300 = [];

     for (var i = 0; i < 12; i++) {
         if (saldoPeriodosirpjM300Json[i] != null) {
             for (var j = 0; j < saldoPeriodosirpjM300Json[i].length; j++) {
                 arrTempM300.push(saldoPeriodosirpjM300Json[i][j]);
             }
         }
     }

     ArrAgrupadoAnual_m300 = AgruparArregloAnualM(arrTempM300);

     var arrM300_busq_anual = BuscarM300();
     //log.error('saldoPeriodosL210Json[i]', saldoPeriodosL210Json[i]);

     for (var j = 0; j < arrM300_busq_anual.length; j++) {
         var flag_M300 = false;
         //var saldoInicial, saldoFinal, debito, credito;
         if (arrM300_busq_anual[j][5] == 'I' || arrM300_busq_anual[j][5] == 'A') {
             for (var z = 0; z < ArrAgrupadoAnual_m300.length; z++) {

                 if (arrM300_busq_anual[j][1] == ArrAgrupadoAnual_m300[z][1]) {
                     saldoInicial = Number(ArrAgrupadoAnual_m300[z][4]).toFixed(2);
                     debito = Number(ArrAgrupadoAnual_m300[z][5]).toFixed(2);
                     credito = Number(ArrAgrupadoAnual_m300[z][6]).toFixed(2);
                     saldoFinal = ((Number(saldoInicial) + Number(debito) - Number(credito)).toFixed(2));
                     if (ArrAgrupadoAnual_m300[z][1] == '175') {
                         log.error('entrom300_175', 'entrom300_175');
                         m300_175 = saldoFinal;
                     }
                     strBloqueM00 += "|M300|" + arrM300_busq_anual[j][1] + '|' + arrM300_busq_anual[j][2] + '|' + arrM300_busq_anual[j][3] + '|' + arrM300_busq_anual[j][4] + '|' + (saldoFinal) + '||' + "\r\n";
                     log.error('ArrAgrupadoAnual_m300[z][8]', ArrAgrupadoAnual_m300[z][8]);
                     if (ArrAgrupadoAnual_m300[z][8] == '1') {
                         //aumneta registro m305 parte b m010
                         var saldoInicialM305, saldoFinalM305, debitoM305, creditoM305;
                         log.error('tipo1 m010', ArrAgrupadoAnual_M010);
                         for (var M = 0; M < ArrAgrupadoAnual_M010.length; M++) {
                             //["0","","","2020-04-13","1000","I",-3201.8900000000003,"0","12.91",""]
                             saldoInicialM305 = Number(ArrAgrupadoAnual_M010[M][6]).toFixed(2);
                             // log.error('saldoInicialM305',saldoInicialM305);
                             debitoM305 = Number(ArrAgrupadoAnual_M010[M][7]).toFixed(2);
                             // log.error('debitoM305',debitoM305);
                             creditoM305 = Number(ArrAgrupadoAnual_M010[M][8]).toFixed(2);
                             // log.error('creditoM305',creditoM305);
                             saldoFinalM305 = ((Number(saldoInicialM305) + Number(debitoM305) - Number(creditoM305)).toFixed(2));
                             //log.error('saldoFinalM305',saldoFinalM305);

                             strBloqueM00 += "|M305|" + ArrAgrupadoAnual_M010[M][1] + '|' + obtenerFormatoNumero(saldoFinalM305);
                             if (saldoFinalM305 > 0) {
                                 strBloqueM00 += "|D|\r\n";
                             } else {
                                 strBloqueM00 += "|C|\r\n";
                             }

                         }
                     } else if (ArrAgrupadoAnual_m300[z][8] == '2') {
                         //aumenta registr m310 parte a los que tienen valor 
                         if (saldoFinal > 0) {
                             strBloqueM00 += "|M310|" + ArrAgrupadoAnual_m300[z][1] + '||' + obtenerFormatoNumero(saldoFinal) + '|D|' + "\r\n";
                         } else if (saldoFinal < 0) {
                             strBloqueM00 += "|M310|" + ArrAgrupadoAnual_m300[z][1] + '||' + obtenerFormatoNumero(saldoFinal) + '|C|' + "\r\n";
                         }

                     } else if (ArrAgrupadoAnual_m300[z][8] == '3') {
                         //aumenta registros m305y m310
                         var saldoInicialM305, saldoFinalM305, debitoM305, creditoM305;
                         log.error('entra para el tipo 3 ', 'entro');
                         for (var M = 0; M < ArrAgrupadoAnual_M010.length; M++) {
                             log.error('entra para el tipo 3 M305', 'entro');
                             saldoInicialM305 = Number(ArrAgrupadoAnual_M010[M][6]).toFixed(2);
                             debitoM305 = Number(ArrAgrupadoAnual_M010[M][7]).toFixed(2);
                             creditoM305 = Number(ArrAgrupadoAnual_M010[M][8]).toFixed(2);
                             saldoFinalM305 = ((Number(saldoInicialM305) + Number(debitoM305) - Number(creditoM305)).toFixed(2));

                             strBloqueM00 += "|M305|" + ArrAgrupadoAnual_M010[M][1] + '|' + obtenerFormatoNumero(saldoFinalM305);
                             if (saldoFinalM305 > 0) {
                                 strBloqueM00 += "|D|\r\n";
                             } else {
                                 strBloqueM00 += "|C|\r\n";
                             }

                         }
                         if (saldoFinal > 0) {
                             strBloqueM00 += "|M310|" + ArrAgrupadoAnual_m300[z][1] + '||' + obtenerFormatoNumero(saldoFinal) + '|D|' + "\r\n";
                         } else if (saldoFinal < 0) {
                             strBloqueM00 += "|M310|" + ArrAgrupadoAnual_m300[z][1] + '||' + obtenerFormatoNumero(saldoFinal) + '|C|' + "\r\n";
                         }
                     }

                     contador_M300++;
                     flag_M300 = true;
                     break;
                 }
             }

             if (!flag_M300) {
                 //este caso es cuando la cuenta corporativa esta llena pero no hace match ya que en l100 solo ve cuentas de balance
                 strBloqueM00 += "|M300|" + arrM300_busq_anual[j][1] + '|' + arrM300_busq_anual[j][2] + '|' + arrM300_busq_anual[j][3] + '|' + arrM300_busq_anual[j][4] + '|' + '0.00' + '||' + "\r\n";
                 contador_M300++;
             }
         }
     }
     //fin del M300

     //m350
     var arrTempM350 = [];

     for (var i = 0; i < 12; i++) {
         if (saldoPeriodoscsllM350Json[i] != null) {
             for (var j = 0; j < saldoPeriodoscsllM350Json[i].length; j++) {
                 arrTempM350.push(saldoPeriodoscsllM350Json[i][j]);
             }
         }
     }

     ArrAgrupadoAnual_CSLL = AgruparArregloAnualM(arrTempM350);
     //1     2    3    9    4    8    5    indicador        6    7        saldo final    indicador

     var debito, credito, saldoInicial, saldoFinal, debitoM350, creditoM350, saldoInicialM350, saldoFinalM350;
     var flag_M350 = false;
    
     for (var j = 0; j < arrM300_busq_anual.length; j++) {
         var flag_M350 = false;
         var saldoInicialM350, saldoFinalM350, debitoM350, creditoM350;
         if (arrM300_busq_anual[j][5] == 'A' || arrM300_busq_anual[j][5] == 'C') {

             for (var z = 0; z < ArrAgrupadoAnual_CSLL.length; z++) {

                 if (arrM300_busq_anual[j][1] == ArrAgrupadoAnual_CSLL[z][1]) {
                     saldoInicialM350 = Number(ArrAgrupadoAnual_CSLL[z][4]).toFixed(2);
                     debitoM350 = Number(ArrAgrupadoAnual_CSLL[z][5]).toFixed(2);
                     creditoM350 = Number(ArrAgrupadoAnual_CSLL[z][6]).toFixed(2);
                     saldoFinalM350 = ((Number(saldoInicialM350) + Number(debitoM350) - Number(creditoM350)).toFixed(2));

                     strBloqueM00 += "|M350|" + arrM300_busq_anual[j][1] + "|" + arrM300_busq_anual[j][2] + "|" + arrM300_busq_anual[j][3] + "|" + arrM300_busq_anual[j][4] + "|" + (saldoFinalM350) + "||" + "\r\n";

                     if (ArrAgrupadoAnual_CSLL[z][8] == '1') {
                         //aumneta registro m355 parte b m010
                         var saldoInicialM355, saldoFinalM355, debitoM355, creditoM355;
                         for (var M = 0; M < ArrAgrupadoAnual_M010.length; M++) {

                             saldoInicialM355 = Number(ArrAgrupadoAnual_M010[M][6]).toFixed(2);
                             debitoM355 = Number(ArrAgrupadoAnual_M010[M][7]).toFixed(2);
                             creditoM355 = Number(ArrAgrupadoAnual_M010[M][8]).toFixed(2);
                             saldoFinalM355 = ((Number(saldoInicialM355) + Number(debitoM355) - Number(creditoM355)).toFixed(2));

                             strBloqueM00 += "|M355|" + ArrAgrupadoAnual_M010[M][1] + '|' + obtenerFormatoNumero(saldoFinalM355);
                             if (saldoFinalM355 > 0) {
                                 strBloqueM00 += "|D|\r\n";
                             } else {
                                 strBloqueM00 += "|C|\r\n";
                             }

                             strBloqueM00 += "|M410|" + ArrAgrupadoAnual_M010[M][4] + '|' + ArrAgrupadoAnual_M010[M][5] + '|' + obtenerFormatoNumero(saldoFinalM355) + '|' + ArrAgrupadoAnual_M010[M][9] + '|' + ArrAgrupadoAnual_M010[M][1] + '||' + 'N' + "|\r\n";

                         }
                     } else if (ArrAgrupadoAnual_CSLL[z][8] == '2') {
                         //aumenta registr m360 parte a los que tienen valor 
                         if (saldoFinalM350 > 0) {
                             strBloqueM00 += "|M360|" + ArrAgrupadoAnual_CSLL[z][1] + '||' + obtenerFormatoNumero(saldoFinalM350) + '|D|' + "\r\n";
                         } else if (saldoFinalM350 < 0) {
                             strBloqueM00 += "|M360|" + ArrAgrupadoAnual_CSLL[z][1] + '||' + obtenerFormatoNumero(saldoFinalM350) + '|C|' + "\r\n";
                         }

                     } else if (ArrAgrupadoAnual_CSLL[z][8] == '3') {
                         //aumenta registros m355y m360
                         var saldoInicialM355, saldoFinalM355, debitoM355, creditoM355;
                         for (var M = 0; M < ArrAgrupadoAnual_M010.length; M++) {

                             saldoInicialM355 = Number(ArrAgrupadoAnual_M010[M][6]).toFixed(2);
                             debitoM355 = Number(ArrAgrupadoAnual_M010[M][7]).toFixed(2);
                             creditoM355 = Number(ArrAgrupadoAnual_M010[M][8]).toFixed(2);
                             saldoFinalM355 = ((Number(saldoInicialM355) + Number(debitoM355) - Number(creditoM355)).toFixed(2));

                             strBloqueM00 += "|M355|" + ArrAgrupadoAnual_M010[M][1] + '|' + obtenerFormatoNumero(saldoFinalM355);
                             if (saldoFinalM355 > 0) {
                                 strBloqueM00 += "|D|\r\n";
                             } else {
                                 strBloqueM00 += "|C|\r\n";
                             }

                         }

                         if (saldoFinalM350 > 0) {
                             strBloqueM00 += "|M360|" + ArrAgrupadoAnual_CSLL[z][1] + '||' + obtenerFormatoNumero(saldoFinalM350) + '|D|' + "\r\n";
                         } else if (saldoFinalM350 < 0) {
                             strBloqueM00 += "|M360|" + ArrAgrupadoAnual_CSLL[z][1] + '||' + obtenerFormatoNumero(saldoFinalM350) + '|C|' + "\r\n";
                         }
                     }
                     numeroLineasM350++;
                     flag_M350 = true;
                     break;
                 }

             }
             if (!flag_M350) {
                 //este caso es cuando la cuenta corporativa esta llena pero no hace match ya que en l100 solo ve cuentas de balance
                 strBloqueM00 += "|M350|" + arrM300_busq_anual[j][1] + "|" + arrM300_busq_anual[j][2] + "|" + arrM300_busq_anual[j][3] + "|" + arrM300_busq_anual[j][4] + "|" + '0.00' + "||" + "\r\n";
                 numeroLineasM350++;
             }
         }
     }
     return strBloqueM00;
 }

 function GenerarBloqueM() {
     var salto = '\r\n';
     var contador_M = 0;
     var strBloqueM = '';
     var arrAuxiliar = new Array();

     //+++++++++++++++M001++++++++++++++++++
     //1. REG | 2. IND_DAD
     strBloqueM += '|M001|0|' + salto;
     arrAuxiliar[0] = 'M001';
     arrAuxiliar[1] = 1;
     ArrBloque9.push(arrAuxiliar);
     contador_M++;

     //+++++++++++++++M010++++++++++++++++++
    
     for (var i = 0; i < 12; i++) {
         if (saldoPeriodosM010Json[i] != null) {
             for (var j = 0; j < saldoPeriodosM010Json[i].length; j++) {
                 arrTempM010.push(saldoPeriodosM010Json[i][j]);
             }
         }
     }

     ArrAgrupadoAnual_M010 = AgruparArregloAnualM010(arrTempM010);
     log.error('ArrAgrupadoAnualM010', ArrAgrupadoAnual_M010);
     //1     2    3    9    4    8    5    indicador        6    7        saldo final    indicador
     var saldoInicial, saldoFinal, debito, credito;
     for (var i = 0; i < ArrAgrupadoAnual_M010.length; i++) {

         saldoInicial = Number(ArrAgrupadoAnual_M010[i][6]).toFixed(2);

         strBloqueM += "|M010|" + ArrAgrupadoAnual_M010[i][1] + '|' + ArrAgrupadoAnual_M010[i][2] + '|' + obtenerFormatoNumero(ArrAgrupadoAnual_M010[i][3]) + '|' + ArrAgrupadoAnual_M010[i][4] + '||' + ArrAgrupadoAnual_M010[i][5] + '|' + obtenerFormatoNumero(saldoInicial);
         if (saldoInicial > 0) {
             strBloqueM += "|D||\r\n";
         } else {
             strBloqueM += "|C||\r\n";
         }

         contador_M010++;

     }

     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'M010';
     arrAuxiliar[1] = contador_M010;
     ArrBloque9.push(arrAuxiliar);
     contador_global += contador_M010;
     contador_M += contador_M010;

     //+++++++++++++++M030 A00++++++++++++++++++
     strBloqueM += ObtenerM00();

     if (setupJson["MES_BAL_RED"] == "BBBBBBBBBBBB") {
         //+++++++++++++++M030 A01 - A12++++++++++++++++++ es solo cuando es balancete
         //+++++++++++++++M300 +++++++++++++++++
         strBloqueM += ObtenerM030ºM300();
     }
     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'M030';
     arrAuxiliar[1] = 1 + numeroLineasM030;
     ArrBloque9.push(arrAuxiliar);
     contador_global++;;
     contador_M++;

     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'M300';
     arrAuxiliar[1] = contador_M300;
     ArrBloque9.push(arrAuxiliar);

     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'M350';
     arrAuxiliar[1] = numeroLineasM350;
     ArrBloque9.push(arrAuxiliar);

     contador_M += contador_M300 + numeroLineasM350 + numeroLineasM030;
     contador_global += contador_M300 + numeroLineasM350;

     var saldoInicialM500, saldoFinalM500, debitoM500, creditoM500;

     for (var M = 0; M < ArrAgrupadoAnual_M010.length; M++) {

         saldoInicialM500 = Number(ArrAgrupadoAnual_M010[M][6]).toFixed(2);
         debitoM500 = Number(ArrAgrupadoAnual_M010[M][7]).toFixed(2);
         creditoM500 = Number(ArrAgrupadoAnual_M010[M][8]).toFixed(2);
         saldoFinalM500 = ((Number(saldoInicialM500) + Number(debitoM500) - Number(creditoM500)).toFixed(2));

         strBloqueM += "|M500|" + ArrAgrupadoAnual_M010[M][1] + '|' + ArrAgrupadoAnual_M010[M][5] + '|' + obtenerFormatoNumero(saldoInicialM500);
         if (saldoInicialM500 > 0) {
             strBloqueM += "|D|";
         } else {
             strBloqueM += "|C|";
         }

         strBloqueM += obtenerFormatoNumero(saldoFinalM500);
         if (saldoFinalM500 > 0) {
             strBloqueM += "|D|";
         } else {
             strBloqueM += "|C|";
         }

         strBloqueM += obtenerFormatoNumero(saldoFinalM500);

         if (saldoFinalM500 > 0) {
             strBloqueM += "|D|";
         } else {
             strBloqueM += "|C|";
         }
         var SFM500 = Number(Number(saldoInicialM500) + Number(saldoFinalM500)).toFixed(2);

         strBloqueM += obtenerFormatoNumero(SFM500);
         if (SFM500 > 0) {
             strBloqueM += "|D||\r\n";
         } else {
             strBloqueM += "|C||\r\n";
         }

         contador_M500++;

     }
     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'M500';
     arrAuxiliar[1] = contador_M500;
     ArrBloque9.push(arrAuxiliar);
     contador_M += contador_M500;
     //+++++++++++++++M990++++++++++++++++++
     contador_M++;
     //1. REG | 2. QTD_LIN
     strBloqueM += '|M990|' + contador_M + '|' + salto;
     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'M990';
     arrAuxiliar[1] = 1;
     ArrBloque9.push(arrAuxiliar);

     //reemplazamos los puntos por comas
     strBloqueM = strBloqueM.replace(/\./g, ',');

     return strBloqueM;
 }

 function ObtenerM030ºM300() {
     var arrM300_busq = BuscarM300();

     var startDateObject = format.parse({
         type: format.Type.DATE,
         value: periodStartDate
     });

     var totalString = "",
         debito, credito, saldoInicial, saldoFinal, monthStartDate, monthEndDate, debitoM350, creditoM350, saldoInicialM350, saldoFinalM350;

     for (var i = 0; i < 12; i++) {
         monthStartDate = new Date(startDateObject.getFullYear(), i, 1);
         monthEndDate = new Date(startDateObject.getFullYear(), i + 1, 0);

         totalString += "|M030|" + fechaInicial + "|" + obtenerFormatoFecha(monthEndDate) + "|A" + completar_cero(2, monthStartDate.getMonth() + 1) + "|\r\n";
         numeroLineasM030++;

         var flag_M300 = false;
         var strM300_mensual = '';
        
         for (var j = 0; j < arrM300_busq.length; j++) {
             var flag_M300 = false;
             var saldoInicial, saldoFinal, debito, credito;
             if (arrM300_busq[j][5] == 'A' || arrM300_busq[j][5] == 'I') {

                 if (saldoPeriodosirpjM300Json[i] !== undefined) {
                     for (var z = 0; z < saldoPeriodosirpjM300Json[i].length; z++) {

                         if (arrM300_busq[j][1] == saldoPeriodosirpjM300Json[i][z][1]) {
                             saldoInicial = Number(saldoPeriodosirpjM300Json[i][z][4]).toFixed(2);
                             debito = Number(saldoPeriodosirpjM300Json[i][z][5]).toFixed(2);
                             credito = Number(saldoPeriodosirpjM300Json[i][z][6]).toFixed(2);
                             saldoFinal = ((Number(saldoInicial) + Number(debito) - Number(credito)).toFixed(2));

                             totalString += "|M300|" + arrM300_busq[j][1] + "|" + arrM300_busq[j][2] + "|" + arrM300_busq[j][3] + "|" + arrM300_busq[j][4] + "|" + (saldoFinal) + "||" + "\r\n";

                             if (saldoPeriodosirpjM300Json[i][z][8] == '1') {
                                 //aumneta registro m305 parte b m010
                                 var saldoInicialM305, saldoFinalM305, debitoM305, creditoM305;
                                 
                                 if (saldoPeriodosM010Json[i] !== undefined) {
                                     for (var m305 = 0; m305 < saldoPeriodosM010Json[i].length; m305++) {
                                         saldoInicialM305 = Number(saldoPeriodosM010Json[i][m305][6]).toFixed(2);
                                         debitoM305 = Number(saldoPeriodosM010Json[i][m305][7]).toFixed(2);
                                         creditoM305 = Number(saldoPeriodosM010Json[i][m305][8]).toFixed(2);
                                         saldoFinalM305 = ((Number(saldoInicialM305) + Number(debitoM305) - Number(creditoM305)).toFixed(2));

                                         totalString += "|M305|" + saldoPeriodosM010Json[i][m305][1] + '|' + obtenerFormatoNumero(saldoFinalM305);
                                         if (saldoFinalM305 > 0) {
                                             totalString += "|D|\r\n";
                                         } else {
                                             totalString += "|C|\r\n";
                                         }
                                     }

                                 }
                             } else if (saldoPeriodosirpjM300Json[i][z][8] == '2') {
                                 //aumenta registr m310 parte a los que tienen valor 
                                 if (saldoFinal > 0) {
                                     totalString += "|M310|" + saldoPeriodosirpjM300Json[i][z][1] + '||' + obtenerFormatoNumero(saldoFinal) + '|D|' + "\r\n";
                                 } else if (saldoFinal < 0) {
                                     totalString += "|M310|" + saldoPeriodosirpjM300Json[i][z][1] + '||' + obtenerFormatoNumero(saldoFinal) + '|C|' + "\r\n";
                                 }

                             } else if (saldoPeriodosirpjM300Json[i][z][8] == '3') {
                                 //aumenta registros m305y m310
                                 var saldoInicialM305, saldoFinalM305, debitoM305, creditoM305;
                                 if (saldoPeriodosM010Json[i] !== undefined) {
                                     log.error('i', i);
                                     log.error('saldoPeriodosM010Json[i] 3 mensual', saldoPeriodosM010Json[i]);
                                     for (var m305 = 0; m305 < saldoPeriodosM010Json[i].length; m305++) {
                                       
                                         saldoInicialM305 = Number(saldoPeriodosM010Json[i][m305][6]).toFixed(2);
                                         //log.error('saldoInicialM305qqqen 3 mensual',saldoInicialM305);
                                         debitoM305 = Number(saldoPeriodosM010Json[i][m305][7]).toFixed(2);
                                         //log.error('debitoM305 en 3 mensual',debitoM305);
                                         creditoM305 = Number(saldoPeriodosM010Json[i][m305][8]).toFixed(2);
                                         //log.error('creditoM305 en 3 mensual',creditoM305);
                                         saldoFinalM305 = ((Number(saldoInicialM305) + Number(debitoM305) - Number(creditoM305)).toFixed(2));

                                         totalString += "|M305|" + saldoPeriodosM010Json[i][m305][1] + '|' + obtenerFormatoNumero(saldoFinalM305);
                                         if (saldoFinalM305 > 0) {
                                             totalString += "|D|\r\n";
                                         } else {
                                             totalString += "|C|\r\n";
                                         }

                                     }

                                 }

                                 if (saldoFinal > 0) {
                                     totalString += "|M310|" + saldoPeriodosirpjM300Json[i][z][1] + '||' + obtenerFormatoNumero(saldoFinal) + '|D|' + "\r\n";
                                 } else if (saldoFinal < 0) {
                                     totalString += "|M310|" + saldoPeriodosirpjM300Json[i][z][1] + '||' + obtenerFormatoNumero(saldoFinal) + '|C|' + "\r\n";
                                 }
                             }

                             //contador_L300++;
                             contador_M300++;
                             flag_M300 = true;
                             break;
                         }
                     }
                 }
                 if (!flag_M300) {
                     //este caso es cuando la cuenta corporativa esta llena pero no hace match ya que en l100 solo ve cuentas de balance
                     totalString += "|M300|" + arrM300_busq[j][1] + "|" + arrM300_busq[j][2] + "|" + arrM300_busq[j][3] + "|" + arrM300_busq[j][4] + "|" + '0.00' + "||" + "\r\n";
                     contador_M300++;
                 }
             }
         }

         var flag_M350 = false;
        
         for (var j = 0; j < arrM300_busq.length; j++) {
             var flag_M350 = false;
             var saldoInicialM350, saldoFinalM350, debitoM350, creditoM350;
             if (arrM300_busq[j][5] == 'A' || arrM300_busq[j][5] == 'C') {

                 if (saldoPeriodoscsllM350Json[i] !== undefined) {
                     for (var z = 0; z < saldoPeriodoscsllM350Json[i].length; z++) {

                         if (arrM300_busq[j][1] == saldoPeriodoscsllM350Json[i][z][1]) {
                             saldoInicialM350 = Number(saldoPeriodoscsllM350Json[i][z][4]).toFixed(2);
                             debitoM350 = Number(saldoPeriodoscsllM350Json[i][z][5]).toFixed(2);
                             creditoM350 = Number(saldoPeriodoscsllM350Json[i][z][6]).toFixed(2);
                             saldoFinalM350 = ((Number(saldoInicialM350) + Number(debitoM350) - Number(creditoM350)).toFixed(2));

                             totalString += "|M350|" + arrM300_busq[j][1] + "|" + arrM300_busq[j][2] + "|" + arrM300_busq[j][3] + "|" + arrM300_busq[j][4] + "|" + (saldoFinalM350) + "||" + "\r\n";

                             if (saldoPeriodoscsllM350Json[i][z][8] == '1') {
                                 //aumneta registro m355 parte b m010
                                 var saldoInicialM355, saldoFinalM355, debitoM355, creditoM355;
                                 if (saldoPeriodosM010Json[i] !== undefined) {
                                     for (var m355 = 0; m355 < saldoPeriodosM010Json[i].length; m355++) {
                                         saldoInicialM355 = Number(saldoPeriodosM010Json[i][m355][6]).toFixed(2);
                                         debitoM355 = Number(saldoPeriodosM010Json[i][m355][7]).toFixed(2);
                                         creditoM355 = Number(saldoPeriodosM010Json[i][m355][8]).toFixed(2);
                                         saldoFinalM355 = ((Number(saldoInicialM355) + Number(debitoM355) - Number(creditoM355)).toFixed(2));

                                         totalString += "|M355|" + saldoPeriodosM010Json[i][m355][1] + '|' + obtenerFormatoNumero(saldoFinalM355);
                                         if (saldoFinalM355 > 0) {
                                             totalString += "|D|\r\n";
                                         } else {
                                             totalString += "|C|\r\n";
                                         }

                                         totalString += "|M410|" + saldoPeriodosM010Json[i][m355][4] + '|' + saldoPeriodosM010Json[i][m355][5] + '|' + obtenerFormatoNumero(saldoFinalM355) + '|' + saldoPeriodosM010Json[i][m355][9] + '|' + saldoPeriodosM010Json[i][m355][1] + '||' + 'N' + "|\r\n";;

                                     }

                                 }
                                 
                             } else if (saldoPeriodoscsllM350Json[i][z][8] == '2') {
                                 //aumenta registr m360 parte a los que tienen valor 
                                 if (saldoFinalM350 > 0) {
                                     totalString += "|M360|" + saldoPeriodoscsllM350Json[i][z][1] + '||' + obtenerFormatoNumero(saldoFinalM350) + '|D|' + "\r\n";
                                 } else if (saldoFinalM350 < 0) {
                                     totalString += "|M360|" + saldoPeriodoscsllM350Json[i][z][1] + '||' + obtenerFormatoNumero(saldoFinalM350) + '|C|' + "\r\n";
                                 }

                             } else if (saldoPeriodoscsllM350Json[i][z][8] == '3') {
                                 //aumenta registros m355y m360

                                 var saldoInicialM355, saldoFinalM355, debitoM355, creditoM355;
                                 if (saldoPeriodosM010Json[i] !== undefined) {
                                     for (var m355 = 0; m355 < saldoPeriodosM010Json[i].length; m355++) {
                                         saldoInicialM355 = Number(saldoPeriodosM010Json[i][m355][6]).toFixed(2);
                                         debitoM355 = Number(saldoPeriodosM010Json[i][m355][7]).toFixed(2);
                                         creditoM355 = Number(saldoPeriodosM010Json[i][m355][8]).toFixed(2);
                                         saldoFinalM355 = ((Number(saldoInicialM355) + Number(debitoM355) - Number(creditoM355)).toFixed(2));

                                         totalString += "|M355|" + saldoPeriodosM010Json[i][m355][1] + '|' + obtenerFormatoNumero(saldoFinalM355);
                                         if (saldoFinalM355 > 0) {
                                             totalString += "|D|\r\n";
                                         } else {
                                             totalString += "|C|\r\n";
                                         }
                                     }

                                 }

                                 if (saldoFinalM350 > 0) {
                                     totalString += "|M360|" + saldoPeriodoscsllM350Json[i][z][1] + '||' + obtenerFormatoNumero(saldoFinalM350) + '|D|' + "\r\n";
                                 } else if (saldoFinalM350 < 0) {
                                     totalString += "|M360|" + saldoPeriodoscsllM350Json[i][z][1] + '||' + obtenerFormatoNumero(saldoFinalM350) + '|C|' + "\r\n";
                                 }
                             }

                             numeroLineasM350++;
                             flag_M350 = true;
                             break;
                         }

                     }
                 }
                 if (!flag_M350) {
                     //este caso es cuando la cuenta corporativa esta llena pero no hace match ya que en l100 solo ve cuentas de balance
                     totalString += "|M350|" + arrM300_busq[j][1] + "|" + arrM300_busq[j][2] + "|" + arrM300_busq[j][3] + "|" + arrM300_busq[j][4] + "|" + '0.00' + "||" + "\r\n";
                     numeroLineasM350++;
                 }
             }
         }
     }

     return totalString;
 }

 function obtenerRegistrosN() {
     // var arregloFechas = [];
     var salto = '\r\n';
     var string = '';
    
        var periodenddate_temp = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: param_AnioCalendario,
            columns: ['enddate']
        });
    

     periodenddate = periodenddate_temp.enddate;

     var fechaEnd = format.parse({
         value: periodenddate,
         type: format.Type.DATE
     });

     for (var i = 0; i < 12; i++) {
         var MM = fechaEnd.getMonth() + 1;
         var AAAA = fechaEnd.getFullYear();
         var DD = fechaEnd.getDate();
         var aux = DD + '/' + MM + '/' + AAAA;
         var auxiliar = aux.split('/');

         if (auxiliar[1].length == 1) {
             auxiliar[1] = '0' + auxiliar[1];
         }

         formatFecha = auxiliar[0] + auxiliar[1] + auxiliar[2];
         arregloFechas.push(formatFecha);

         var newFechaEnd = restDays(fechaEnd, DD);
         fechaEnd = newFechaEnd;
     }

     log.error('arregloFechasN', arregloFechas);

     string += '|N030|0101' + AAAA + '|' + arregloFechas[0] + '|' + 'A00' + '|' + salto;
     for (var key_N500 in N500_codes) {
         if (key_N500 == '1') {
             string += '|N500|' + key_N500 + '|' + N500_codes[key_N500] + '|' + m300_175 + '|' + salto;
         } else {
             string += '|N500|' + key_N500 + '|' + N500_codes[key_N500] + '|' + '0,00' + '|' + salto;
         }

     }
     var n630A_3 = 0;
     var n630_4 = 0;
     for (var key_N630A in N630A_codes) {
         if (key_N630A == '1') {
             string += '|N630|' + key_N630A + '|' + N630A_codes[key_N630A] + '|' + m300_175 + '|' + salto;
         } else if (key_N630A == '3') {
             if (m300_175 > 0) {
                 var n630A_3 = m300_175 * 0.15;
                 string += '|N630|' + key_N630A + '|' + N630A_codes[key_N630A] + '|' + n630A_3 + '|' + salto;
             } else {
                 string += '|N630|' + key_N630A + '|' + N630A_codes[key_N630A] + '|' + '0,00' + '|' + salto;
             }
         } else if (key_N630A == '4') {
             if (m300_175 < 20000) {

                 string += '|N630|' + key_N630A + '|' + N630A_codes[key_N630A] + '|' + '0,00' + '|' + salto;
             } else {
                 var n630_4 = (m300_175 - (20000 * 12 * 0, 1));
                 string += '|N630|' + key_N630A + '|' + N630A_codes[key_N630A] + '|' + n630_4 + '|' + salto;
             }
         } else if (key_N630A == '26') {
             string += '|N630|' + key_N630A + '|' + N630A_codes[key_N630A] + '|' + (n630A_3 + n630_4) + '|' + salto;
         } else {
             string += '|N630|' + key_N630A + '|' + N630A_codes[key_N630A] + '|' + '0,00' + '|' + salto;
         }


     }
     for (var key_N650 in N650_codes) {

         if (key_N650 == '1') {
             string += '|N650|' + key_N650 + '|' + N650_codes[key_N650] + '|' + m350_175 + '|' + salto;
         } else {
             string += '|N650|' + key_N650 + '|' + N650_codes[key_N650] + '|' + '0,00' + '|' + salto;
         }
     }
     for (var key_N670 in N670_codes) {
         if (key_N670 == '1') {
             string += '|N670|' + key_N670 + '|' + N670_codes[key_N670] + '|' + m350_175 + '|' + salto;
         } else if (key_N670 == '2') {

             var n670A_2 = m350_175 * 0.15;
             string += '|N670|' + key_N670 + '|' + N670_codes[key_N670] + '|' + n670A_2 + '|' + salto;

         } else if (key_N670 == '4') { //falta la sumatoria para n670_4 del 3 con el 2 
             string += '|N670|' + key_N670 + '|' + N670_codes[key_N670] + '|' + n670A_2 + '|' + salto;

         } else if (key_N670 == '21') { //falta la sumatoria con n670 del 6 al 20 (viene de netsuite)
             string += '|N670|' + key_N670 + '|' + N670_codes[key_N670] + '|' + n670A_2 + '|' + salto;
         } else {
             string += '|N670|' + key_N670 + '|' + N670_codes[key_N670] + '|' + '0,00' + '|' + salto;
         }

     }

     for (var i = 1; i < 13; i++) {
         string += '|N030|0101' + AAAA + '|' + arregloFechas[12 - i] + '|' + 'A' + completar_cero(2, i) + '|' + salto;
         for (var key_N500 in N500_codes) {
             string += '|N500|' + key_N500 + '|' + N500_codes[key_N500] + '|' + '0,00' + '|' + salto;
         }
         for (var key_N620 in N620_codes) {
             string += '|N620|' + key_N620 + '|' + N620_codes[key_N620] + '|' + '0,00' + '|' + salto;
         }
         for (var key_N650 in N650_codes) {
             string += '|N650|' + key_N650 + '|' + N650_codes[key_N650] + '|' + '0,00' + '|' + salto;
         }
         for (var key_N660 in N660_codes) {
             string += '|N660|' + key_N660 + '|' + N660_codes[key_N660] + '|' + '0,00' + '|' + salto;
         }

     }

     return string;
 }

 function restDays(date, days) {
     var result = new Date(date);
     result.setDate(result.getDate() - days);
     return result;
 }

 function GenerarBloqueN() {
     var salto = '\r\n';
     var contador_N = 0;
     var strBloqueN = '';
     var arrAuxiliar = new Array();

     //+++++++++++++++N001++++++++++++++++++
     //1. REG | 2. IND_DAD
     strBloqueN += '|N001|0|' + salto;
     arrAuxiliar[0] = 'N001';
     arrAuxiliar[1] = 1;
     ArrBloque9.push(arrAuxiliar);
     contador_N++;

     //+++++++++++++++N030, N500, N620, N630, N650, N660 y N670++++++++++++++++++
     strBloqueN += obtenerRegistrosN();

     //+++++++++++++++N030++++++++++++++++++
     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'N030';
     arrAuxiliar[1] = 13;
     ArrBloque9.push(arrAuxiliar);
     contador_global += 13;
     contador_N += 13;

     //+++++++++++++++N500++++++++++++++++++
     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'N500'; // A00 a A12
     arrAuxiliar[1] = 26;
     ArrBloque9.push(arrAuxiliar);
     contador_N += 26;
     contador_global += 26;

     //+++++++++++++++N620++++++++++++++++++
     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'N620'; // A01 a A12
     arrAuxiliar[1] = 372;
     ArrBloque9.push(arrAuxiliar);
     contador_N += 372;
     contador_global += 372;

     //+++++++++++++++N630++++++++++++++++++
     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'N630'; // A00
     arrAuxiliar[1] = 32;
     ArrBloque9.push(arrAuxiliar);
     contador_N += 32;
     contador_global += 32;

     //+++++++++++++++N650++++++++++++++++++
     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'N650'; // A00 a A12 
     arrAuxiliar[1] = 26;
     ArrBloque9.push(arrAuxiliar);
     contador_N += 26;
     contador_global += 26;

     //+++++++++++++++N660++++++++++++++++++
     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'N660'; // A01 a A12
     arrAuxiliar[1] = 276;
     ArrBloque9.push(arrAuxiliar);
     contador_N += 276;
     contador_global += 276;

     //+++++++++++++++N670++++++++++++++++++
     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'N670'; // A00
     arrAuxiliar[1] = 27;
     ArrBloque9.push(arrAuxiliar);
     contador_N += 27;
     contador_global += 27;

     //+++++++++++++++N990++++++++++++++++++
     contador_N++;
     //1. REG | 2. QTD_LIN
     strBloqueN += '|N990|' + contador_N + '|' + salto;
     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'N990';
     arrAuxiliar[1] = 1;
     ArrBloque9.push(arrAuxiliar);
     //reemplazamos los puntos por comas
     // strBloqueN = strBloqueN.replace(/\A1:I32/g, '');

     return strBloqueN;
 }

 function GenerarBloqueP() {
     var strBloqueP = '';
     // Registro P001: Abertura do Bloco P
     strBloqueP += '|P001|0|\r\n';
     numeroLineasBloqueP++;
     ArrBloque9.push(['P001', 1]);

     if (setupJson["FORMA_APUR"] == "A") {
         strBloqueP += ObtenerP030YDetalleAnual();

     } else if (setupJson["FORMA_APUR"] == "T") {
         strBloqueP += ObtenerP030YDetalleTrimestral();
     }

     // Registro P990: Encerramento do Bloco P
     numeroLineasBloqueP++;
     contador_global += numeroLineasBloqueP;
     strBloqueP += '|P990|' + numeroLineasBloqueP + '|\r\n';
     ArrBloque9.push(['P990', 1]);

     return strBloqueP;
 }

 function ObtenerP030YDetalleTrimestral() {
     var totalString = '';
     var startDateText = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: param_AnioCalendario,
            columns: ['startdate']
        }).startdate;
     
     

     var startDateObject = format.parse({
         value: startDateText,
         type: format.Type.DATE
     });

     var registrosJson = obtenerCuentasTrimestral();
     var cuentasJson = registrosJson["cuentas"];
     var p200Json = registrosJson["p200"];
     var p300Json = {
         "0": {},
         "1": {},
         "2": {},
         "3": {}
     };
     var p400Json = registrosJson["p400"];
     var p500json = {
         "0": {},
         "1": {},
         "2": {},
         "3": {}
     };
     var trimestres = setupJson["FORMA_TRIB_PER"].length;

     var valorCodigoP200, valorCodigoP300, valorCodigoP400, valorCodigoP500;

     var fechainicio, fechafin, encontro = false,
         saldoInicial, debito, credito;
     for (var t = 0; t < trimestres; t++) {

         if (setupJson["FORMA_TRIB_PER"][t] == 'P') {
             fechainicio = new Date(startDateObject.getFullYear(), t * 3, 1);
             fechafin = new Date(startDateObject.getFullYear(), (t + 1) * 3, 0);

             // P030
             totalString += '|P030|' + obtenerFormatoFecha(fechainicio) + '|' + obtenerFormatoFecha(fechafin) + '|T0' + (t + 1) + '|\r\n';

             // ********************** INICIO SUMA DE HIJOS A PADRES ACTIVO PASIVO PATRIMONIO *********************
             var indices = [],
                 nivel;
             for (var i = 0; i < cuentasReferencialesJson["noresultado"].length; i++) {
                 nivel = cuentasReferencialesJson["noresultado"][i][4];

                 if (nivel != "") {
                     indices[nivel] = i;
                 }

                 encontro = false;
                 if (cuentasReferencialesJson["noresultado"][i][7] != "") {
                     saldoInicial = 0, debito = 0, credito = 0;
                     idCuentasArray = cuentasReferencialesJson["noresultado"][i][7].split(',');

                     for (var j = 0; j < idCuentasArray.length; j++) {
                         if (cuentasJson[t][idCuentasArray[j]] !== undefined) {
                             encontro = true;
                             saldoInicial = redondear(saldoInicial + cuentasJson[t][idCuentasArray[j]][0]);
                             debito = redondear(debito + cuentasJson[t][idCuentasArray[j]][1]);
                             credito = redondear(credito + cuentasJson[t][idCuentasArray[j]][2]);
                         }
                     }
                     cuentasReferencialesJson["noresultado"][i][8] = saldoInicial;
                     cuentasReferencialesJson["noresultado"][i][9] = debito;
                     cuentasReferencialesJson["noresultado"][i][10] = credito;
                 }

                 if (encontro) {
                     for (var k = 1; k < Number(nivel); k++) {
                         cuentasReferencialesJson["noresultado"][indices[k]][8] = redondear(cuentasReferencialesJson["noresultado"][indices[k]][8] + cuentasReferencialesJson["noresultado"][i][8]);
                         cuentasReferencialesJson["noresultado"][indices[k]][9] = redondear(cuentasReferencialesJson["noresultado"][indices[k]][9] + cuentasReferencialesJson["noresultado"][i][9]);
                         cuentasReferencialesJson["noresultado"][indices[k]][10] = redondear(cuentasReferencialesJson["noresultado"][indices[k]][10] + cuentasReferencialesJson["noresultado"][i][10]);
                     }
                 }
             }
             // ********************** TERMINA SUMA DE HIJOS A PADRES ACTIVO PASIVO PATRIMONIO  *********************

             // P100
             for (var i = 0; i < cuentasReferencialesJson["noresultado"].length; i++) {
                 totalString += '|P100|' + cuentasReferencialesJson["noresultado"][i][1] + '|' + cuentasReferencialesJson["noresultado"][i][2] + '|' + cuentasReferencialesJson["noresultado"][i][3] + '|' + cuentasReferencialesJson["noresultado"][i][4] + '|' + cuentasReferencialesJson["noresultado"][i][5] + '|' + cuentasReferencialesJson["noresultado"][i][6] + '|';

                 saldoInicial = cuentasReferencialesJson["noresultado"][i][8];
                 debito = cuentasReferencialesJson["noresultado"][i][9];
                 credito = cuentasReferencialesJson["noresultado"][i][10];

                 totalString += obtenerFormatoNumero(saldoInicial);

                 if (saldoInicial >= 0) {
                     totalString += '|D|';
                 } else {
                     totalString += '|C|';
                 }

                 totalString += obtenerFormatoNumero(debito) + '|' + obtenerFormatoNumero(credito) + '|';

                 saldoFinal = saldoInicial + debito - credito;

                 totalString += obtenerFormatoNumero(saldoFinal);
                 if (saldoFinal >= 0) {
                     totalString += '|D|\r\n';
                 } else {
                     totalString += '|C|\r\n';
                 }

                 cuentasReferencialesJson["noresultado"][i][8] = 0;
                 cuentasReferencialesJson["noresultado"][i][9] = 0;
                 cuentasReferencialesJson["noresultado"][i][10] = 0;

                 numeroLineasBloqueP++;
             }

             // ********************** INICIO SUMA DE HIJOS A PADRES RESULTADO *********************
             var indices = [],
                 nivel;
             for (var i = 0; i < cuentasReferencialesJson["resultado"].length; i++) {
                 nivel = cuentasReferencialesJson["resultado"][i][4];

                 if (nivel != "") {
                     indices[nivel] = i;
                 }

                 encontro = false;
                 if (cuentasReferencialesJson["resultado"][i][7] != "") {
                     saldoInicial = 0, debito = 0, credito = 0;
                     idCuentasArray = cuentasReferencialesJson["resultado"][i][7].split(',');

                     for (var j = 0; j < idCuentasArray.length; j++) {
                         if (cuentasJson[t][idCuentasArray[j]] !== undefined) {
                             encontro = true;
                             saldoInicial = redondear(saldoInicial + cuentasJson[t][idCuentasArray[j]][0]);
                             debito = redondear(debito + cuentasJson[t][idCuentasArray[j]][1]);
                             credito = redondear(credito + cuentasJson[t][idCuentasArray[j]][2]);
                         }
                     }
                     cuentasReferencialesJson["resultado"][i][8] = saldoInicial;
                     cuentasReferencialesJson["resultado"][i][9] = debito;
                     cuentasReferencialesJson["resultado"][i][10] = credito;
                 }

                 if (encontro) {
                     for (var k = 1; k < Number(nivel); k++) {
                         cuentasReferencialesJson["resultado"][indices[k]][8] = redondear(cuentasReferencialesJson["resultado"][indices[k]][8] + cuentasReferencialesJson["resultado"][i][8]);
                         cuentasReferencialesJson["resultado"][indices[k]][9] = redondear(cuentasReferencialesJson["resultado"][indices[k]][9] + cuentasReferencialesJson["resultado"][i][9]);
                         cuentasReferencialesJson["resultado"][indices[k]][10] = redondear(cuentasReferencialesJson["resultado"][indices[k]][10] + cuentasReferencialesJson["resultado"][i][10]);
                     }
                 }
             }
             // ********************** TERMINA SUMA DE HIJOS A PADRES RESULTADO  *********************

             // P150
             for (var i = 0; i < cuentasReferencialesJson["resultado"].length; i++) {
                 totalString += '|P150|' + cuentasReferencialesJson["resultado"][i][1] + '|' + cuentasReferencialesJson["resultado"][i][2] + '|' + cuentasReferencialesJson["resultado"][i][3] + '|' + cuentasReferencialesJson["resultado"][i][4] + '|' + cuentasReferencialesJson["resultado"][i][5] + '|' + cuentasReferencialesJson["resultado"][i][6] + '|';

                 saldoInicial = cuentasReferencialesJson["resultado"][i][8];
                 debito = cuentasReferencialesJson["resultado"][i][9];
                 credito = cuentasReferencialesJson["resultado"][i][10];
                 saldoFinal = redondear(saldoInicial + debito - credito);

                 totalString += obtenerFormatoNumero(saldoFinal);

                 if (saldoFinal >= 0) {
                     totalString += '|D|\r\n';
                 } else {
                     totalString += '|C|\r\n';
                 }
                 cuentasReferencialesJson["resultado"][i][8] = 0;
                 cuentasReferencialesJson["resultado"][i][9] = 0;
                 cuentasReferencialesJson["resultado"][i][10] = 0;

                 numeroLineasBloqueP++;
             }

             // p200
             for (var codigoP200 in registrosP200Json) {

                 if (registrosP200Json[codigoP200][1] == 'R') {
                     valorCodigoP200 = '';
                 } else {
                     if (registrosP200Json[codigoP200][1] == 'E') {

                         valorCodigoP200 = (p200Json[t][t][codigoP200] || 0);

                     } else if (registrosP200Json[codigoP200][1] == 'CNA') {
                         if (codigoP200 == '10') {

                             valorCodigoP200 = (p200Json[t][t]["2"] || 0) + (p200Json[t][t]["4"] || 0) + (p200Json[t][t]["6"] || 0) +
                                 (p200Json[t][t]["8"] || 0) + (p200Json[t][t]["9"] || 0);
                             p200Json[t][t][codigoP200] = valorCodigoP200;

                         } else if (codigoP200 == '26') {

                             valorCodigoP200 = (p200Json[t][t]["10"] || 0) +
                                 (p200Json[t][t]["11"] || 0) +
                                 (p200Json[t][t]["12"] || 0) +
                                 (p200Json[t][t]["13"] || 0) +
                                 (p200Json[t][t]["14"] || 0) +
                                 (p200Json[t][t]["15"] || 0) +
                                 (p200Json[t][t]["16"] || 0) +
                                 (p200Json[t][t]["15"] || 0) +
                                 (p200Json[t][t]["16"] || 0) +
                                 (p200Json[t][t]["17"] || 0) +
                                 (p200Json[t][t]["18"] || 0) +
                                 (p200Json[t][t]["19"] || 0) +
                                 (p200Json[t][t]["20"] || 0) +
                                 (p200Json[t][t]["20.01"] || 0) -
                                 (
                                     (p200Json[t][t]["22"] || 0) +
                                     (p200Json[t][t]["23"] || 0) +
                                     (p200Json[t][t]["24"] || 0) +
                                     (p200Json[t][t]["25"] || 0) +
                                     (p200Json[t][t]["25.01"] || 0) +
                                     (p200Json[t][t]["25.02"] || 0)
                                 );
                             if (valorCodigoP200 < 0) valorCodigoP200 = 0;
                         }
                         valorCodigoP200 = redondear(valorCodigoP200);
                         p200Json[t][t][codigoP200] = valorCodigoP200;
                     }
                     valorCodigoP200 = obtenerFormatoNumero(valorCodigoP200);
                 }

                 totalString += '|P200|' + codigoP200 + '|' + registrosP200Json[codigoP200][0] + '|' + valorCodigoP200 + '|\r\n';
                 numeroLineasBloqueP++;
             }

             // p300
             for (var codigoP300 in registrosP300Json) {

                 if (registrosP300Json[codigoP300][1] == 'R') {
                     valorCodigoP300 = '';
                 } else {
                     if (registrosP300Json[codigoP300][1] == 'CA') {
                         valorCodigoP300 = (p200Json[t]["26"] || 0);

                     } else if (registrosP300Json[codigoP300][1] == 'CNA') {
                         if (codigoP300 == "3") {
                             valorCodigoP300 = p300Json[t]["1"] * 0.15;
                         } else if (codigoP300 == "4") {
                             valorCodigoP300 = p300Json[t]["1"] - (20000 * 3);
                             if (valorCodigoP300 < 0) valorCodigoP300 = 0;
                         } else if (codigoP300 == "15") {
                             valorCodigoP300 = p300Json[t]["3"] + p300Json[t]["4"] + p300Json[t]["5"];
                         }

                     } else if (registrosP300Json[codigoP300][1] == 'E') {
                         valorCodigoP300 = 0;
                     }
                     valorCodigoP300 = redondear(valorCodigoP300);
                     p300Json[t][codigoP300] = valorCodigoP300;
                     valorCodigoP300 = obtenerFormatoNumero(valorCodigoP300);
                 }
                 totalString += '|P300|' + codigoP300 + '|' + registrosP300Json[codigoP300][0] + '|' + valorCodigoP300 + '|\r\n';
             }

             // p400
             for (var codigoP400 in registrosP400Json) {
                 if (registrosP400Json[codigoP400][1] == 'R') {
                     valorCodigoP400 = '';
                 } else {

                     if (registrosP400Json[codigoP400][1] == 'E') {

                         if (codigoP400 == '2' || codigoP400 == '4' || codigoP400 == '5' || codigoP400 == '9' || codigoP400 == '11' || codigoP400 == '20') {
                             valorCodigoP400 = (p400Json[t][codigoP400] || 0);
                         } else if (codigoP400 == '16.01') {
                             valorCodigoP400 = (p200Json[t]["20.01"] || 0);
                             p400Json[t][codigoP400] = valorCodigoP400;
                         } else if (codigoP400 == '19.01') {
                             valorCodigoP400 = (p200Json[t]["20.01"] || 0);
                             p400Json[t][codigoP400] = valorCodigoP400;
                         } else if (codigoP400 == '19.02') {
                             valorCodigoP400 = (p200Json[t]["25.02"] || 0);
                             p400Json[t][codigoP400] = valorCodigoP400;
                         }

                     } else if (registrosP400Json[codigoP400][1] == 'CA') {

                         valorCodigoP400 = (p200Json[t][(Number(codigoP400) + 4) + ''] || 0);

                     } else if (registrosP400Json[codigoP400][1] == 'CNA') {

                         if (codigoP400 == '6') {
                             valorCodigoP400 = (p400Json[t]["2"] || 0) * 0.12 +
                                 (p400Json[t]["4"] || 0) * 0.32 +
                                 (p400Json[t]["5"] || 0) * 0.384;

                         } else if (codigoP400 == '21') {
                             valorCodigoP400 = (p400Json[t]["6"] || 0) + (p400Json[t]["7"] || 0) +
                                 (p400Json[t]["8"] || 0) + (p400Json[t]["9"] || 0) +
                                 (p400Json[t]["10"] || 0) + (p400Json[t]["11"] || 0) +
                                 (p400Json[t]["12"] || 0) + (p400Json[t]["13"] || 0) +
                                 (p400Json[t]["14"] || 0) + (p400Json[t]["15"] || 0) +
                                 (p400Json[t]["16"] || 0) + (p400Json[t]["16.01"] || 0) - (
                                     (p400Json[t]["18"] || 0) + (p400Json[t]["19"] || 0) +
                                     (p400Json[t]["19.01"] || 0) + (p400Json[t]["19.02"] || 0) +
                                     (p400Json[t]["20"] || 0)
                                 );
                         }
                         if (valorCodigoP400 < 0) valorCodigoP400 = 0;
                         valorCodigoP400 = redondear(valorCodigoP400);

                     }
                     p400Json[t][codigoP400] = valorCodigoP400;
                     valorCodigoP400 = obtenerFormatoNumero(valorCodigoP400);

                 }

                 totalString += '|P400|' + codigoP400 + '|' + registrosP400Json[codigoP400][0] + '|' + valorCodigoP400 + '|\r\n';
                 numeroLineasBloqueP++;
             }

             // p500
             for (var codigoP500 in registrosP500Json) {

                 if (registrosP500Json[codigoP500][1] == 'R') {
                     valorCodigoP500 = '';
                 } else {

                     if (registrosP500Json[codigoP500][1] == 'CA') {
                         valorCodigoP500 = (p400Json[t]["21"] || 0);
                     } else if (registrosP500Json[codigoP500][1] == 'CNA') {
                         if (codigoP500 == "2") {

                             if (setupJson["IND_ALIQ_CSLL"] == "1") {
                                 valorCodigoP500 = p500json[t]["1"] * 0.09;
                             } else {
                                 if (new Date(startdate.getFullYear(), startdate.getMoth(), 1) < new Date(2019, 0, 1)) {
                                     if (setupJson["IND_ALIQ_CSLL"] == "2") {
                                         valorCodigoP500 = p500json[t]["1"] * 0.17;
                                     } else if (setupJson["IND_ALIQ_CSLL"] == "3") {
                                         valorCodigoP500 = p500json[t]["1"] * 0.20;
                                     }
                                 } else {
                                     valorCodigoP500 = p500json[t]["1"] * 0.15;
                                 }
                             }

                         } else if (codigoP500 == "4") {
                             valorCodigoP500 = (p500Json["2"] || 0) + (p500Json["3"] || 0);
                         } else if (codigoP500 == "13") {
                             valorCodigoP500 = p500Json["4"] || 0;
                         }

                     } else if (registrosP500Json[codigoP500][1] == 'E') {
                         valorCodigoP500 = 0;
                     }
                     valorCodigoP500 = redondear(valorCodigoP500);
                     p500json[t][codigoP500] = valorCodigoP500;
                     valorCodigoP500 = obtenerFormatoNumero(valorCodigoP500);
                 }

                 totalString += '|P500|' + codigoP500 + '|' + registrosP500Json[codigoP500][0] + '|' + valorCodigoP500 + '|\r\n';
             }
         }
     }

     return totalString;
 }

 function ObtenerP030YDetalleAnual() {
     var totalString = '';
     // P030
     totalString += '|P030|' + fechaInicial + '|' + periodenddate + '|A00|\r\n';

     var registrosJson = obtenerCuentasAnual();
     var cuentasJson = registrosJson["cuentas"];
     var p200Json = registrosJson["p200"];
     var p300Json = {};
     var p400Json = registrosJson["p400"];
     var p500json = {};

     var valorCodigoP200, valorCodigoP300, valorCodigoP400, valorCodigoP500;
     var saldoInicial = 0,
         debito = 0,
         credito = 0,
         saldoFinal = 0,
         idCuentasArray;
        var startdate = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: param_AnioCalendario,
            columns: ['startdate']
        }).startdate;   
    
     
     startdate = format.parse({
         value: startdate,
         type: format.Type.DATE
     });

     //|P150|3.11.05.01.03.03|Outras Participações|A|6|04|3.11.05.01.03|10000,00|D|
     // ********************** INICIO SUMA DE HIJOS A PADRES ACTIVO PASIVO PATRIMONIO *********************
     var indices = [],
         nivel;
     for (var i = 0; i < cuentasReferencialesJson["noresultado"].length; i++) {
         nivel = cuentasReferencialesJson["noresultado"][i][4];

         if (nivel != "") {
             indices[nivel] = i;
         }

         encontro = false;
         if (cuentasReferencialesJson["noresultado"][i][7] != "") {
             saldoInicial = 0, debito = 0, credito = 0;
             idCuentasArray = cuentasReferencialesJson["noresultado"][i][7].split(',');

             for (var j = 0; j < idCuentasArray.length; j++) {
                 if (cuentasJson[idCuentasArray[j]] !== undefined) {
                     encontro = true;
                     saldoInicial = redondear(saldoInicial + cuentasJson[idCuentasArray[j]][0]);
                     debito = redondear(debito + cuentasJson[idCuentasArray[j]][1]);
                     credito = redondear(credito + cuentasJson[idCuentasArray[j]][2]);
                 }
             }
             cuentasReferencialesJson["noresultado"][i][8] = saldoInicial;
             cuentasReferencialesJson["noresultado"][i][9] = debito;
             cuentasReferencialesJson["noresultado"][i][10] = credito;
         }

         if (encontro) {
             for (var k = 1; k < Number(nivel); k++) {
                 cuentasReferencialesJson["noresultado"][indices[k]][8] = redondear(cuentasReferencialesJson["noresultado"][indices[k]][8] + cuentasReferencialesJson["noresultado"][i][8]);
                 cuentasReferencialesJson["noresultado"][indices[k]][9] = redondear(cuentasReferencialesJson["noresultado"][indices[k]][9] + cuentasReferencialesJson["noresultado"][i][9]);
                 cuentasReferencialesJson["noresultado"][indices[k]][10] = redondear(cuentasReferencialesJson["noresultado"][indices[k]][10] + cuentasReferencialesJson["noresultado"][i][10]);

             }
         }
     }
     // ********************** TERMINA SUMA DE HIJOS A PADRES ACTIVO PASIVO PATRIMONIO  *********************

     // ********************** INICIO IMPRIMIR P100 *********************
     for (var i = 0; i < cuentasReferencialesJson["noresultado"].length; i++) {

         totalString += '|P100|' + cuentasReferencialesJson["noresultado"][i][1] + '|' + cuentasReferencialesJson["noresultado"][i][2] + '|' + cuentasReferencialesJson["noresultado"][i][3] + '|' + cuentasReferencialesJson["noresultado"][i][4] + '|' + cuentasReferencialesJson["noresultado"][i][5] + '|' + cuentasReferencialesJson["noresultado"][i][6] + '|';

         saldoInicial = cuentasReferencialesJson["noresultado"][i][8];
         debito = cuentasReferencialesJson["noresultado"][i][9];
         credito = cuentasReferencialesJson["noresultado"][i][10];

         totalString += obtenerFormatoNumero(saldoInicial);

         if (saldoInicial >= 0) {
             totalString += '|D|';
         } else {
             totalString += '|C|';
         }

         totalString += obtenerFormatoNumero(debito) + '|' + obtenerFormatoNumero(credito) + '|';

         saldoFinal = saldoInicial + debito - credito;

         totalString += obtenerFormatoNumero(saldoFinal);
         if (saldoFinal >= 0) {
             totalString += '|D|\r\n';
         } else {
             totalString += '|C|\r\n';
         }

         numeroLineasBloqueP++;
     }
     // ********************** TERMINA IMPRIMIR P100 *********************

     // ********************** INICIA SUMA DE HIJOS A PADRES RESULTADO *********************
     for (var i = 0; i < cuentasReferencialesJson["resultado"].length; i++) {
         log.debug("cuentasReferencialesJson['resultado']",cuentasReferencialesJson["resultado"]);
         nivel = cuentasReferencialesJson["resultado"][i][4];

         if (nivel != "") {
             indices[nivel] = i;
         }

         encontro = false;
         if (cuentasReferencialesJson["resultado"][i][7] != "") {
             saldoInicial = 0, debito = 0, credito = 0;
             idCuentasArray = cuentasReferencialesJson["resultado"][i][7].split(',');

             for (var j = 0; j < idCuentasArray.length; j++) {
                 if (cuentasJson[idCuentasArray[j]] !== undefined) {
                     encontro = true;
                     saldoInicial = redondear(saldoInicial + cuentasJson[idCuentasArray[j]][0]);
                     debito = redondear(debito + cuentasJson[idCuentasArray[j]][1]);
                     credito = redondear(credito + cuentasJson[idCuentasArray[j]][2]);
                 }
             }
             cuentasReferencialesJson["resultado"][i][8] = saldoInicial;
             cuentasReferencialesJson["resultado"][i][9] = debito;
             cuentasReferencialesJson["resultado"][i][10] = credito;
         }

         if (encontro) {
             for (var k = 1; k < Number(nivel); k++) {
                 cuentasReferencialesJson["resultado"][indices[k]][8] = redondear(cuentasReferencialesJson["resultado"][indices[k]][8] + cuentasReferencialesJson["resultado"][i][8]);
                 cuentasReferencialesJson["resultado"][indices[k]][9] = redondear(cuentasReferencialesJson["resultado"][indices[k]][9] + cuentasReferencialesJson["resultado"][i][9]);
                 cuentasReferencialesJson["resultado"][indices[k]][10] = redondear(cuentasReferencialesJson["resultado"][indices[k]][10] + cuentasReferencialesJson["resultado"][i][10]);

             }
         }
     }
     // ********************** TERMINA SUMA DE HIJOS A PADRES RESULTADO *********************

     // ********************** INICIA IMPRIMIR P150 *********************
     for (var i = 0; i < cuentasReferencialesJson["resultado"].length; i++) {

         totalString += '|P150|' + cuentasReferencialesJson["resultado"][i][1] + '|' + cuentasReferencialesJson["resultado"][i][2] + '|' + cuentasReferencialesJson["resultado"][i][3] + '|' + cuentasReferencialesJson["resultado"][i][4] + '|' + cuentasReferencialesJson["resultado"][i][5] + '|' + cuentasReferencialesJson["resultado"][i][6] + '|';

         saldoInicial = cuentasReferencialesJson["resultado"][i][8];
         debito = cuentasReferencialesJson["resultado"][i][9];
         credito = cuentasReferencialesJson["resultado"][i][10];
         saldoFinal = redondear(saldoInicial + debito - credito);

         totalString += obtenerFormatoNumero(saldoFinal);

         if (saldoFinal >= 0) {
             totalString += '|D|\r\n';
         } else {
             totalString += '|C|\r\n';
         }

         numeroLineasBloqueP++;
     }
     // ********************** TERMINA IMPRIMIR P150 *********************

     // p200
     for (var codigoP200 in registrosP200Json) {

         if (registrosP200Json[codigoP200][1] == 'R') {
             valorCodigoP200 = '';
         } else {
             if (registrosP200Json[codigoP200][1] == 'E') {
                 valorCodigoP200 = (p200Json[codigoP200] || 0);


             } else if (registrosP200Json[codigoP200][1] == 'CNA') {
                 if (codigoP200 == '10') {

                     valorCodigoP200 = (p200Json["2"] || 0) + (p200Json["4"] || 0) + (p200Json["6"] || 0) +
                         (p200Json["8"] || 0) + (p200Json["9"] || 0);
                     p200Json[codigoP200] = valorCodigoP200;

                 } else if (codigoP200 == '26') {

                     valorCodigoP200 = (p200Json["10"] || 0) +
                         (p200Json["11"] || 0) +
                         (p200Json["12"] || 0) +
                         (p200Json["13"] || 0) +
                         (p200Json["14"] || 0) +
                         (p200Json["15"] || 0) +
                         (p200Json["16"] || 0) +
                         (p200Json["15"] || 0) +
                         (p200Json["16"] || 0) +
                         (p200Json["17"] || 0) +
                         (p200Json["18"] || 0) +
                         (p200Json["19"] || 0) +
                         (p200Json["20"] || 0) +
                         (p200Json["20.01"] || 0) -
                         (
                             (p200Json["22"] || 0) +
                             (p200Json["23"] || 0) +
                             (p200Json["24"] || 0) +
                             (p200Json["25"] || 0) +
                             (p200Json["25.01"] || 0) +
                             (p200Json["25.02"] || 0)
                         );
                     if (valorCodigoP200 < 0) valorCodigoP200 = 0;
                 }
                 valorCodigoP200 = redondear(valorCodigoP200);
                 p200Json[codigoP200] = valorCodigoP200;
             }
             valorCodigoP200 = obtenerFormatoNumero(valorCodigoP200);
         }

         totalString += '|P200|' + codigoP200 + '|' + registrosP200Json[codigoP200][0] + '|' + valorCodigoP200 + '|\r\n';
         numeroLineasBloqueP++;
     }

     // p300
     for (var codigoP300 in registrosP300Json) {

         if (registrosP300Json[codigoP300][1] == 'R') {
             valorCodigoP300 = '';
         } else {
             if (registrosP300Json[codigoP300][1] == 'CA') {
                 valorCodigoP300 = (p200Json["26"] || 0);

             } else if (registrosP300Json[codigoP300][1] == 'CNA') {
                 if (codigoP300 == "3") {
                     valorCodigoP300 = p300Json["1"] * 0.15;
                 } else if (codigoP300 == "4") {
                     valorCodigoP300 = p300Json["1"] - (20000 * 3);
                     if (valorCodigoP300 < 0) valorCodigoP300 = 0;
                 } else if (codigoP300 == "15") {
                     valorCodigoP300 = p300Json["3"] + p300Json["4"] + p300Json["5"];
                 }

             } else if (registrosP300Json[codigoP300][1] == 'E') {
                 valorCodigoP300 = 0;
             }
             valorCodigoP300 = redondear(valorCodigoP300);
             p300Json[codigoP300] = valorCodigoP300;
             valorCodigoP300 = obtenerFormatoNumero(valorCodigoP300);
         }
         totalString += '|P300|' + codigoP300 + '|' + registrosP300Json[codigoP300][0] + '|' + valorCodigoP300 + '|\r\n';
     }

     // p400
     log.debug("valor de registrosP400Json",registrosP400Json);
     for (var codigoP400 in registrosP400Json) {
         if (registrosP400Json[codigoP400][1] == 'R') {
             valorCodigoP400 = '';
         } else {

             if (registrosP400Json[codigoP400][1] == 'E') {

                 if (codigoP400 == '2' || codigoP400 == '4' || codigoP400 == '5' || codigoP400 == '9' || codigoP400 == '11' || codigoP400 == '20') {
                     valorCodigoP400 = (p400Json[codigoP400] || 0);
                 } else if (codigoP400 == '16.01') {
                     valorCodigoP400 = (p200Json["20.01"] || 0);
                     p400Json[codigoP400] = valorCodigoP400;
                 } else if (codigoP400 == '19.01') {
                     valorCodigoP400 = (p200Json["20.01"] || 0);
                     p400Json[codigoP400] = valorCodigoP400;
                 } else if (codigoP400 == '19.02') {
                     valorCodigoP400 = (p200Json["25.02"] || 0);
                     p400Json[codigoP400] = valorCodigoP400;
                 }

             } else if (registrosP400Json[codigoP400][1] == 'CA') {

                 valorCodigoP400 = (p200Json[(Number(codigoP400) + 4) + ''] || 0);

             } else if (registrosP400Json[codigoP400][1] == 'CNA') {

                 if (codigoP400 == '6') {
                     valorCodigoP400 = (p400Json["2"] || 0) * 0.12 +
                         (p400Json["4"] || 0) * 0.32 +
                         (p400Json["5"] || 0) * 0.384;

                 } else if (codigoP400 == '21') {
                     valorCodigoP400 = (p400Json["6"] || 0) + (p400Json["7"] || 0) +
                         (p400Json["8"] || 0) + (p400Json["9"] || 0) +
                         (p400Json["10"] || 0) + (p400Json["11"] || 0) +
                         (p400Json["12"] || 0) + (p400Json["13"] || 0) +
                         (p400Json["14"] || 0) + (p400Json["15"] || 0) +
                         (p400Json["16"] || 0) + (p400Json["16.01"] || 0) - (
                             (p400Json["18"] || 0) + (p400Json["19"] || 0) +
                             (p400Json["19.01"] || 0) + (p400Json["19.02"] || 0) +
                             (p400Json["20"] || 0)
                         );
                 }
                 if (valorCodigoP400 < 0) valorCodigoP400 = 0;
                 valorCodigoP400 = redondear(valorCodigoP400);

             }
             p400Json[codigoP400] = valorCodigoP400;
             valorCodigoP400 = obtenerFormatoNumero(valorCodigoP400);

         }

         totalString += '|P400|' + codigoP400 + '|' + registrosP400Json[codigoP400][0] + '|' + valorCodigoP400 + '|\r\n';
         numeroLineasBloqueP++;
     }
     // p500
     for (var codigoP500 in registrosP500Json) {

         if (registrosP500Json[codigoP500][1] == 'R') {
             valorCodigoP500 = '';
         } else {
             /*
             log.debug("valor de codigoP500",codigoP500);
             log.debug("valor de registrosP500Json[codigoP500]",registrosP500Json[codigoP500]);
             log.debug("valor de p400Json[21]",p400Json["21"]);
            */
             if (registrosP500Json[codigoP500][1] == 'CA') {
                 valorCodigoP500 = (p400Json["21"] || 0);
             } else if (registrosP500Json[codigoP500][1] == 'CNA') {
                 if (codigoP500 == "2") {

                     if (setupJson["IND_ALIQ_CSLL"] == "1") {
                         valorCodigoP500 = p500json["1"] * 0.09;
                     } else {
                         if (new Date(startdate.getFullYear(), startdate.getMoth(), 1) < new Date(2019, 0, 1)) {
                             if (setupJson["IND_ALIQ_CSLL"] == "2") {
                                 valorCodigoP500 = p500json["1"] * 0.17;
                             } else if (setupJson["IND_ALIQ_CSLL"] == "3") {
                                 valorCodigoP500 = p500json["1"] * 0.20;
                             }
                         } else {
                             valorCodigoP500 = p500json["1"] * 0.15;
                         }
                     }

                 } else if (codigoP500 == "4") {
                     valorCodigoP500 = (p500json["2"] || 0) + (p500json["3"] || 0);
                 } else if (codigoP500 == "13") {
                     valorCodigoP500 = p500json["4"] || 0;
                 }

             } else if (registrosP500Json[codigoP500][1] == 'E') {
                 valorCodigoP500 = 0;
             }
             valorCodigoP500 = redondear(valorCodigoP500);
             p500json[codigoP500] = valorCodigoP500;
             valorCodigoP500 = obtenerFormatoNumero(valorCodigoP500);
         }

         totalString += '|P500|' + codigoP500 + '|' + registrosP500Json[codigoP500][0] + '|' + valorCodigoP500 + '|\r\n';
     }

     return totalString;
 }

 function obtenerCuentasTrimestral() {
     var trimestre = 0,
         resultJson = {
             "cuentas": {},
             "p200": {},
             "p400": {}
         };

     resultJson["cuentas"][trimestre] = {};
     resultJson["p200"][trimestre] = {};
     resultJson["p400"][trimestre] = {};

     for (var i = 0; i < 12; i++) {

         if (i == 3) {
             trimestre = 1;
             resultJson["cuentas"][trimestre] = {};
             resultJson["p200"][trimestre] = {};
             resultJson["p400"][trimestre] = {};

         } else if (i == 6) {
             trimestre = 2;
             resultJson["cuentas"][trimestre] = {};
             resultJson["p200"][trimestre] = {};
             resultJson["p400"][trimestre] = {};

         } else if (i == 9) {
             trimestre = 3;
             resultJson["cuentas"][trimestre] = {};
             resultJson["p200"][trimestre] = {};
             resultJson["p400"][trimestre] = {};
         }

         if (saldoPeriodosLA00Json[i] !== undefined) {

             for (var j = 0; j < saldoPeriodosLA00Json[i].length; j++) {
                 if (saldoPeriodosLA00Json[i][j][11]) {
                     if (resultJson["p200"][trimestre][saldoPeriodosLA00Json[i][j][11]] === undefined) {
                         resultJson["p200"][trimestre][saldoPeriodosLA00Json[i][j][11]] = 0;
                     }
                 }
                 if (saldoPeriodosLA00Json[i][j][12]) {
                     if (resultJson["p400"][trimestre][saldoPeriodosLA00Json[i][j][12]] === undefined) {
                         resultJson["p400"][trimestre][saldoPeriodosLA00Json[i][j][12]] = 0;
                     }
                     resultJson["p400"][trimestre][saldoPeriodosLA00Json[i][j][12]] = redondear(resultJson["p400"][trimestre][saldoPeriodosLA00Json[i][j][12]] + Number(saldoPeriodosLA00Json[i][j][6]) - Number(saldoPeriodosLA00Json[i][j][7]));
                 }
                 if (resultJson["cuentas"][trimestre][saldoPeriodosLA00Json[i][j][10]] === undefined) {
                     resultJson["cuentas"][trimestre][saldoPeriodosLA00Json[i][j][10]] = [0, 0, 0];
                 }
                 resultJson["cuentas"][trimestre][saldoPeriodosLA00Json[i][j][10]][0] = redondear(resultJson["cuentas"][trimestre][saldoPeriodosLA00Json[i][j][10]][0] + Number(saldoPeriodosLA00Json[i][j][5]));
                 resultJson["cuentas"][trimestre][saldoPeriodosLA00Json[i][j][10]][1] = redondear(resultJson["cuentas"][trimestre][saldoPeriodosLA00Json[i][j][10]][1] + Number(saldoPeriodosLA00Json[i][j][6]));
                 resultJson["cuentas"][trimestre][saldoPeriodosLA00Json[i][j][10]][2] = redondear(resultJson["cuentas"][trimestre][saldoPeriodosLA00Json[i][j][10]][2] + Number(saldoPeriodosLA00Json[i][j][7]));
             }
         }
     }

     return resultJson;
 }

 function obtenerCuentasAnual() {
     var resultJson = {
         "cuentas": {},
         "p200": {},
         "p400": {}
     };
     var localJson = saldoPeriodosLA00Json;
     for (var i = 0; i < 12; i++) {
         if (saldoPeriodosLA00Json[i] !== undefined) {

             for (var j = 0; j < saldoPeriodosLA00Json[i].length; j++) {
                 if (saldoPeriodosLA00Json[i][j][11]) {
                     if (resultJson["p200"][saldoPeriodosLA00Json[i][j][11]] === undefined) {
                         resultJson["p200"][saldoPeriodosLA00Json[i][j][11]] = 0;
                     }
                     resultJson["p200"][saldoPeriodosLA00Json[i][j][11]] = redondear(resultJson["p200"][saldoPeriodosLA00Json[i][j][11]] + Number(saldoPeriodosLA00Json[i][j][6]) - Number(saldoPeriodosLA00Json[i][j][7]));
                 }

                 if (saldoPeriodosLA00Json[i][j][12]) {
                     if (resultJson["p400"][saldoPeriodosLA00Json[i][j][12]] === undefined) {
                         resultJson["p400"][saldoPeriodosLA00Json[i][j][12]] = 0;
                     }
                     resultJson["p400"][saldoPeriodosLA00Json[i][j][12]] = redondear(resultJson["p400"][saldoPeriodosLA00Json[i][j][12]] + Number(saldoPeriodosLA00Json[i][j][6]) - Number(saldoPeriodosLA00Json[i][j][7]));
                 }

                 if (resultJson["cuentas"][saldoPeriodosLA00Json[i][j][10]] === undefined) {
                     resultJson["cuentas"][saldoPeriodosLA00Json[i][j][10]] = [0, 0, 0];
                 }
                 resultJson["cuentas"][saldoPeriodosLA00Json[i][j][10]][0] = redondear(resultJson["cuentas"][saldoPeriodosLA00Json[i][j][10]][0] + Number(saldoPeriodosLA00Json[i][j][5]));
                 resultJson["cuentas"][saldoPeriodosLA00Json[i][j][10]][1] = redondear(resultJson["cuentas"][saldoPeriodosLA00Json[i][j][10]][1] + Number(saldoPeriodosLA00Json[i][j][6]));
                 resultJson["cuentas"][saldoPeriodosLA00Json[i][j][10]][2] = redondear(resultJson["cuentas"][saldoPeriodosLA00Json[i][j][10]][2] + Number(saldoPeriodosLA00Json[i][j][7]));

             }
         }
     }

     return resultJson;
 }

 function obtenerBRP400ECF() {
     var savedSearch = search.create({
         type: 'customrecord_lmry_br_calc_bc_csll_presum',
         columns: [
             search.createColumn({
                 name: 'internalid',
                 sort: search.Sort.ASC
             }),
             'custrecord_lmry_br_code_calc_bc_csll',
             'name',
             'custrecord_lmry_br_type_calc_bc_csll'
         ]
     });

     var objResult = savedSearch.run().getRange(0, 1000);

     if (objResult != null && objResult.length != 0) {
         var columns, auxArray = [];

         for (var i = 0; i < objResult.length; i++) {
             columns = objResult[i].columns;

             auxArray[0] = objResult[i].getValue(columns[0]);

             auxArray[1] = objResult[i].getValue(columns[1]);

             auxArray[2] = objResult[i].getValue(columns[2]);

             if (objResult[i].getValue(columns[3]) != '') {
                 auxArray[3] = objResult[i].getText(columns[3]).split('-')[0].trim();
             }

             if (auxArray[1]) {
                 if (registrosP400Json[auxArray[1]] === undefined) {
                     registrosP400Json[auxArray[1]] = [auxArray[2], auxArray[3]];
                 }
             }
         }
     }

 }

 function obtenerBRP200ECF() {
     var savedSearch = search.create({
         type: 'customrecord_lmry_br_calculate_bc_irpj',
         columns: [
             search.createColumn({
                 name: 'internalid',
                 sort: search.Sort.ASC
             }),
             'custrecord_lmry_br_code_calc_bc_irpj',
             'name',
             'custrecord_lmry_br_type_calc_bc_irpj'
         ]
     });

     var objResult = savedSearch.run().getRange(0, 1000);

     if (objResult != null && objResult.length != 0) {
         var columns, auxArray = [];

         for (var i = 0; i < objResult.length; i++) {
             columns = objResult[i].columns;

             auxArray[0] = objResult[i].getValue(columns[0]);

             auxArray[1] = objResult[i].getValue(columns[1]);

             auxArray[2] = objResult[i].getValue(columns[2]);

             if (objResult[i].getValue(columns[3]) != '') {
                 auxArray[3] = objResult[i].getText(columns[3]).split('-')[0].trim();
             }

             if (auxArray[1]) {
                 if (registrosP200Json[auxArray[1]] === undefined) {
                     registrosP200Json[auxArray[1]] = [auxArray[2], auxArray[3]];
                 }
             }

         }
     }
 }

 function obtenerCuentasReferenciales() {

     var savedSearch = search.create({
         type: 'customrecord_lmry_br_local_account',
         filters: [
             ["custrecord_lmry_br_subsidiarie", "anyof", param_Subsi]
         ],
         columns: [
             //0. InternalId
             search.createColumn({
                 name: "internalid",
                 label: "Internal ID"
             }),
             //1. Codigo de cuenta referencial
             search.createColumn({
                 name: "name",
                 sort: search.Sort.ASC,
                 label: "Name"
             }),
             //2. Descripcion de la cuenta referencial
             search.createColumn({
                 name: "custrecord_lmry_br_name",
                 label: "Latam - BR Name"
             }),
             //3. Tipo de cuenta referencial Analitica/Sintetica
             search.createColumn({
                 name: "custrecord_lmry_br_acc_type",
                 label: "Latam - BR Account's Type"
             }),
             //4. Nivel de la cuenta
             search.createColumn({
                 name: "custrecord_lmry_br_level",
                 label: "Latam - BR Level"
             }),
             //5. Naturaleza de la cuenta
             search.createColumn({
                 name: "custrecord_lmry_id_acc_group",
                 label: "Latam - BR Account's Nature"
             }),
             //6. Cuenta Padre
             search.createColumn({
                 name: "custrecord_lmry_br_acc_parent",
                 label: "Latam - BR Account's Parent"
             }),
             //7. listado de cuentas del chart of account asociadas a la cuenta referencial
             search.createColumn({
                 name: "custrecord_lmry_br_account",
                 label: "Latam - BR Account"
             })
         ]
     });

     var searchResult = savedSearch.run();
     var DbolStop = false,
         intDMaxReg = 1000,
         intDMinReg = 0,
         objResult, auxArray = [],
         columns, idCuentasArray;
     var objReferencia;
     while (!DbolStop) {
         objResult = searchResult.getRange(intDMinReg, intDMaxReg);

         if (objResult != null && objResult.length != 0) {
             if (objResult.length != 1000) {
                 DbolStop = true;
             }

             for (var i = 0; i < objResult.length; i++) {
                 columns = objResult[i].columns;
                 auxArray = [];

                 //0. InternalId
                 auxArray[0] = objResult[i].getValue(columns[0]);

                 //1. Codigo de cuenta referencial
                 auxArray[1] = objResult[i].getValue(columns[1]);

                 //2. Descripcion de la cuenta referencial
                 auxArray[2] = objResult[i].getValue(columns[2]);

                 //3. Tipo de cuenta referencial Analitica/Sintetica
                 auxArray[3] = objResult[i].getText(columns[3]);

                 //4. Nivel de la cuenta
                 auxArray[4] = objResult[i].getValue(columns[4]);

                 //5. Naturaleza de la cuenta
                 auxArray[5] = objResult[i].getValue(columns[5]);

                 //6. Cuenta Padre
                 auxArray[6] = objResult[i].getValue(columns[6]);

                 //7. listado de cuentas del chart of account asociadas a la cuenta referencial
                 auxArray[7] = objResult[i].getValue(columns[7]);

                 //8. Saldo Inicial
                 auxArray[8] = 0;

                 //9. Debito
                 auxArray[9] = 0;

                 //10. Credito
                 auxArray[10] = 0;

                 if (auxArray[3]) {
                     auxArray[3] = auxArray[3].substring(0, 1);
                 }

                 if (auxArray[5] == '04' || auxArray[5] == '4') {
                     cuentasReferencialesJson["resultado"].push(auxArray)
                 } else {
                     cuentasReferencialesJson["noresultado"].push(auxArray);
                 }
             }
             intDMinReg = intDMaxReg;
             intDMaxReg += 1000;
         }
     }
 }

 function GenerarBloqueY() {

     var salto = '\r\n';
     var contador_Y = 0;
     var strBloqueY = '';
     var arrAuxiliar = new Array();

     // strBloqueY += '|P001|1|' + salto;
     // strBloqueY += '|P990|2|' + salto;
     strBloqueY += '|Q001|1|' + salto;
     strBloqueY += '|Q990|2|' + salto;
     strBloqueY += '|T001|1|' + salto;
     strBloqueY += '|T990|2|' + salto;
     strBloqueY += '|U001|1|' + salto;
     strBloqueY += '|U990|2|' + salto;
     strBloqueY += '|V001|1|' + salto;
     strBloqueY += '|V990|2|' + salto;
     strBloqueY += '|W001|1|' + salto;
     strBloqueY += '|W990|2|' + salto;
     strBloqueY += '|X001|1|' + salto;
     strBloqueY += '|X990|2|' + salto;
     //+++++++++++++++Y001++++++++++++++++++
     //1. REG | 2. IND_DAD
     strBloqueY += '|Y001|0|' + salto;
     arrAuxiliar[0] = 'Y001';
     arrAuxiliar[1] = 1;
     ArrBloque9.push(arrAuxiliar);
     contador_Y++;

     //+++++++++++++++Y990++++++++++++++++++
     contador_Y++;
     //1. REG | 2. QTD_LIN
     strBloqueY += '|Y990|' + contador_Y + '|' + salto;
     arrAuxiliar = new Array();
     arrAuxiliar[0] = 'Y990';
     arrAuxiliar[1] = 1;
     ArrBloque9.push(arrAuxiliar);

     return strBloqueY;
 }

 function GenerarBLoque9(cont) {
     //log.error('valor del contador General', cont);
     var contador = 0;
     var salto = '\r\n';
     var strBloque9 = '';
     //+++++++++++++++9001++++++++++++++++++
     strBloque9 += '|9001|';
     strBloque9 += '0|' + salto;
     contador++;
     cont++;

     //+++++++++++++++9100++++++++++++++++++
     //LLENADO POR EL SISTEMA

     //+++++++++++++++9900++++++++++++++++++
     //log.error('valor de este arregligirigillo del bloque 9', ArrBloque9);
     for (var i = 0; i < ArrBloque9.length; i++) {
         strBloque9 += '|9900|';
         strBloque9 += ArrBloque9[i][0] + '|';
         strBloque9 += ArrBloque9[i][1] + '|' + salto;
         contador++;
         cont++;
     }
     strBloque9 += '|9900|9001|1|' + salto;
     cont++;
     contador++;
     strBloque9 += '|9900|9990|1|' + salto;
     cont++;
     contador++;
     strBloque9 += '|9900|9999|1|' + salto;
     cont++;
     contador++;
     strBloque9 += '|9900|';
     strBloque9 += '9900|';
     contador++;
     strBloque9 += (contador - 1) + '|' + salto;
     cont++;

     //+++++++++++++++9099++++++++++++++++++
     strBloque9 += '|9099|';
     var regi_9099 = contador + 2;
     strBloque9 += regi_9099 + '|' + salto;
     cont++;

     //+++++++++++++++9999++++++++++++++++++
     strBloque9 += '|9999|';
     cont++;
     cont = cont + 14;
     strBloque9 += cont + '|' + salto;

     return strBloque9;
 }

 function ValidaGuion(s) {
     var AccChars = "+./- ";
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
         libFeature.sendErrorEmail(' [ ObtainNameSubsidiaria ] ' + err,LMRY_script,language);
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
        libFeature.sendErrorEmail(' [ ObtainFederalIdSubsidiaria ] ' + err,LMRY_script,language);
     }
     return '';
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

 function QuitaGuion(s) {
     var AccChars = "-./(),;_-";
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

 function ObtenerParametrosYFeatures() { 
     param_RecorID = objContext.getParameter({
         name: 'custscript_lmry_br_ecf_record_id_v7'
     });

     param_AnioCalendario = objContext.getParameter({
         name: 'custscript_lmry_br_ecf_anio_v7'
     });

     param_Subsi = objContext.getParameter({
         name: 'custscript_lmry_br_ecf_subsidiaria_v7'
     });

     param_Multi = objContext.getParameter({
         name: 'custscript_lmry_br_ecf_multibook_v7'
     });

     param_Num_Recti = objContext.getParameter({
         name: 'custscript_lmry_br_ecf_num_rec_v7'
     });

     param_Feature = objContext.getParameter({
         name: 'custscript_lmry_br_ecf_feature_id_v7'
     });

     param_Type_Decla = objContext.getParameter({
         name: 'custscript_lmry_br_ecf_tipo_decl_v7'
     });

     // id de archivo de costing de cuentas para registro L210
     param_AccountCostingIdFile = objContext.getParameter({
         name: 'custscript_lmry_br_ecf_accidfile_v7'
     });
     // // id de archivo de transacciones totales para debitos y creditos
     // param_TransactionsIdFile = objContext.getParameter({
     //     name: 'custscript_lmry_br_ecf_tranidfile'
     // });
     // id de archivo de transacciones por mes y saldos 
     param_AccountsForPeriodIdFile = objContext.getParameter({
         name: 'custscript_lmry_br_ecf_accper_idfile_v7'
     });
     // id de archivo de padron B para registro M010
     param_AccountsPadronBIdFile = objContext.getParameter({
         name: 'custscript_lmry_br_ecf_acc_padronb_v7'
     });
     // id de archivo de cuenats de lanzamiento para registro m300
     param_AccountsM300IdFile = objContext.getParameter({
         name: 'custscript_lmry_br_ecf_lanza_m300_idf_v7'
     });

     // id de archivo de cuenats de lanzamiento para registro m350
     param_AccountsM350IdFile = objContext.getParameter({
         name: 'custscript_lmry_br_ecf_lanza_m350_idf_v7'
     });

     // id de archivo de plan de cuentas totales
     param_AccountsPlanTotalIdFile = objContext.getParameter({
         name: 'custscript_lmry_br_ecf_plan_accou_v7'
     });

     //parametro Num orden -- viene del campo suitelet para el ecf 
     //Número de Ordem do Instrumento de Escrituração
     paramNumOrder = objContext.getParameter({
         name: 'custscript_lmry_br_ecf_num_orden_v7'
     });

     log.error('parametros', param_RecorID + '-' + param_AnioCalendario + '-' + param_Subsi + '-' + param_Multi + '-' + param_Num_Recti + '-' + param_Feature + '-' + param_Type_Decla + '-id file:' + param_idfile + '-' + paramNumOrder);

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

     //Period Name
     if (feature_Subsi) {
         //***DATOS DE SUBSIDIARIA***
         var subsi_temp = search.lookupFields({
             type: search.Type.SUBSIDIARY,
             id: param_Subsi,
             columns: ['legalname', 'custrecord_lmry_br_cnpj_scp', 'taxidnum', 'custrecord_lmry_br_legalnature', 'custrecord_lmry_br_cnae_code', 'address.custrecord_lmry_addr_prov_acronym', 'address.custrecord_lmry_address_number', 'address.custrecord_lmry_addr_reference', 'address.zip', 'address.address1', 'address.custrecord_lmry_addr_city', 'address.custrecord_lmry_addr_city_id', 'address.phone', 'custrecord_lmry_email_subsidiaria', 'custrecord_lmry_br_nire', 'custrecord_lmry_br_regimen_pis_confis']
         });

         subsiname = subsi_temp.legalname;
         cnpj_scp = subsi_temp.custrecord_lmry_br_cnpj_scp;
         //CNPJ
         cnpj = subsi_temp.taxidnum;
         cnpj = ValidaGuion(cnpj);
         //COD_NAT
         if (subsi_temp.custrecord_lmry_br_legalnature != undefined && subsi_temp.custrecord_lmry_br_legalnature != '') {
             COD_NAT = subsi_temp.custrecord_lmry_br_legalnature[0].text;
             log.error('COD_NAT', COD_NAT);
             if (COD_NAT != null && COD_NAT != '') {
                 COD_NAT = completar_cero(5, COD_NAT);
                 log.error('COD_NAT', COD_NAT);
                 COD_NAT = ValidaGuion(COD_NAT);
             } else {
                 COD_NAT = '';
             }
         } else {
             COD_NAT = '';
         }
         //NIRE
         if (subsi_temp.custrecord_lmry_br_nire != undefined && subsi_temp.custrecord_lmry_br_nire != '') {
             nire = subsi_temp.custrecord_lmry_br_nire;
         } else {
             nire = '';
         }
         //CNAE_FISCAL
         CNAE_FISCAL = subsi_temp.custrecord_lmry_br_cnae_code;
         CNAE_FISCAL = ValidaGuion(CNAE_FISCAL);
         //ENDERECO addr1
         ENDERECO = subsi_temp['address.address1'];
         //NUM
         NUM = subsi_temp['address.custrecord_lmry_address_number'];
         //COMPL
         COMPL = subsi_temp['address.custrecord_lmry_addr_reference'];
         //BARRIO
         BARRIO = subsi_temp['address.custrecord_lmry_addr_city'];
         BARRIO = BARRIO[0].text;
         //UF
         UF = subsi_temp['address.custrecord_lmry_addr_prov_acronym'];
         //COD_MUN
         COD_MUN = subsi_temp['address.custrecord_lmry_addr_city_id'];
         //CEP
         CEP = subsi_temp['address.zip'];
         CEP = ValidaGuion(CEP);
         //NUM_TEL
         NUM_TEL = subsi_temp['address.phone'];
         NUM_TEL = QuitaGuion(NUM_TEL);
         // NUM_TEL = '';
         //E-mail
         Email = subsi_temp.custrecord_lmry_email_subsidiaria;
         //regimen 
         regimen = subsi_temp.custrecord_lmry_br_regimen_pis_confis[0].value;

     }
     //para obtener los campos de periodo
     
        var periodenddate_temp = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: param_AnioCalendario,
            columns: ['enddate', 'periodname', 'startdate']
        });
     
     
     //Period EndDate
     periodenddate = periodenddate_temp.enddate;
     periodStartDate = periodenddate_temp.startdate;

     //Nuevo Formato Fecha
     var FECHA_FORMAT = format.parse({
         value: periodenddate,
         type: format.Type.DATE
     });

     var MM = FECHA_FORMAT.getMonth() + 1;
     var AAAA = FECHA_FORMAT.getFullYear();
     var DD = FECHA_FORMAT.getDate();

     periodenddate = DD + '/' + MM + '/' + AAAA;

     var auxiliar = periodenddate.split('/');

     if (auxiliar[0].length == 1) {
         auxiliar[0] = '0' + auxiliar[0];
     }
     if (auxiliar[1].length == 1) {
         auxiliar[1] = '0' + auxiliar[1];
     }
     periodenddate = auxiliar[0] + auxiliar[1] + auxiliar[2];
     periodfirstdate = '01' + auxiliar[1] + AAAA;
     fechaFinal = auxiliar[0] + auxiliar[1] + auxiliar[2];

     //especial acounting period
     //Nuevo Formato Fecha
     var FECHA_FORMAT = format.parse({
         value: periodStartDate,
         type: format.Type.DATE
     });

     var MM = FECHA_FORMAT.getMonth() + 1;
     var AAAA = FECHA_FORMAT.getFullYear();
     var DD = FECHA_FORMAT.getDate();

     var periodenddateq = DD + '/' + MM + '/' + AAAA;

     var auxiliar = periodenddateq.split('/');

     if (auxiliar[0].length == 1) {
         auxiliar[0] = '0' + auxiliar[0];
     }
     if (auxiliar[1].length == 1) {
         auxiliar[1] = '0' + auxiliar[1];
     }

     fechaInicial = '01' + auxiliar[1] + AAAA;
     // fechaFinal= periodenddate;

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

function redondear(number) {
     return Math.round(Number(number) * 100) / 100;
}

 return {
     execute: execute
 };

});