

function ValidarCaracteres_Especiales(s) {
  var AccChars = "“ŠŽšžŸÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðñòóôõöùúûüýÿ°–—ªº·¡@";
  var RegChars = " SZszYAAAAAACEEEEIIIIDNOOOOOUUUUYaaaaaaceeeeiiiidnooooouuuuyyo--ao.ia";
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

      // s.replace(/'/i, '&#39;');
      // s = s.replace(/</gi, '&lt;');
      // s = s.replace(/>/gi, '&gt;');
      // s = s.replace(/&/gi, '&amp;');
      // s = s.replace(/"/g, '&quot;');
      s = s.replace(/" "/g, "");
  } else {
      s = '';
  }

  return s;
}
var result1=ValidarCaracteres_Especiales(ReemplazarCaracterEspecial("TS - BO Cúst°mer&Comp@ñy =)!$//"));
var result2=ValidarCaracteres_Especiales(ReemplazarCaracterEspecial("TS - BO \" Cúst°mer & ¡ñdividu@||12$=),."));
console.log("text 1:",result1)
console.log("text 2:",result2)
