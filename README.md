# 1518 :El reporte ARCIBA Percepciones Efectuadas IIBB CABA no está trayendo en el txt los importes correspondientes a las percepciones de las Notas de Crédito
  [https://docs.google.com/document/d/1uFxwdNoFw-lA3AyrBuDpRSCTQFLNnAIg7nJfsB1QGQY/edit]
## error null name

## permiso
h

## Name Script
Name: LatamReady - AR ARCIBA Efect. MPRD 2.0
id: customscript_lmry_ar_arcibav3_retpe_mprd
File: LMRY_AR_ARCIBA_PER_RET_EFECT_IIBBv3_MPRD_v2.0.js

## Espejo

Name: SMC - AR ARCIBA Efect. MPRD 2.0
id: customscript_smc_ar_arcibav3_retpe_mprd
File: SMC_AR_ARCIBA_PER_RET_EFECT_IIBBv3_MPRD_v2.0.js

## change search 

quitarle el valor absoluto
Name: LatamReady AR - Perception Done IIBB CABA Without Jobs
id: customsearch_lmry_ar_percep_done_ca_jobsluto al monto de comprobante


CASE WHEN {taxitem}<>'E-AR' AND NVL({custcol_lmry_ar_item_tributo},'F')<>'T' AND NVL({custcol_lmry_ar_item_tributo},'F')<>'Yes' AND {taxitem}<>'UNDEF_AR' AND {taxitem}<>'undef_ar' AND {taxitem}<>'UNDEF-AR' AND {taxitem}<>'undef-ar' AND {taxitem}<>'ENop-AR' AND {taxitem}<>'IZ-AR' AND SUBSTR({taxitem},0,4)<>'PERC' AND SUBSTR({taxitem},0,4)<>'Perc' THEN NVL({debitamount},0) - NVL({creditamount},0) ELSE 0 END
