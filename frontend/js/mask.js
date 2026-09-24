(function (global) {
  "use strict";

  // A máscara das células de cálculo, enquanto o aluno digita um número: os
  // pontos de milhar entram sozinhos ("1800" vira "1.800"), a vírgula separa
  // os centavos e ficam no máximo 2 casas depois dela. Ao sair da célula (ou
  // no Enter), o número se completa do jeito que a célula pede ("1.800,00" na
  // de dinheiro, "20" na de trocas): isso é o sheet.js, com o Format.plain.
  //
  // Numa conta ("=4500*40%", "3800*50/100"), a máscara não mexe: com
  // qualquer coisa que não seja número, o texto fica como o aluno escreveu.
  // Também não mexe enquanto não dá pra saber o que um ponto é: "1.8" pode
  // ser o começo de "1.800" ou um decimal escrito com ponto (o Parse lê os
  // dois). Não toca no DOM.

  // O texto com a máscara, ou null quando ela não mexe. deleting diz se o
  // aluno está apagando: aí os pontos são os da própria máscara, e o número
  // se reagrupa ("1.800" sem o 8 vira "100", e não "1.00").
  function live(text, deleting) {
    var m = /^([-−]?)([\d.]*)(,(\d*))?$/.exec(text);
    if (!m) return null;
    var sign = m[1];
    var whole = m[2];
    var cents = m[3] ? m[4] : null;
    if (cents === null && !deleting && /\.\d{0,2}$/.test(whole)) return null;
    var digits = whole.replace(/\./g, "").replace(/^0+(?=\d)/, "");
    var grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    if (cents === null) return sign + grouped;
    return sign + (grouped || "0") + "," + cents.slice(0, 2);
  }

  // o que conta pra achar o lugar do cursor: tudo menos os pontos de milhar
  function significant(text) {
    return text.replace(/\./g, "").length;
  }

  // Onde o cursor fica depois da máscara: com o mesmo tanto de algarismos
  // depois dele que tinha antes (after). Apagando pra trás, ele fica antes
  // do ponto de milhar, pra o próximo Backspace apagar o algarismo e não
  // ficar preso no ponto.
  function caret(text, after, backward) {
    var pos = text.length;
    for (var i = text.length; i >= 0; i--) {
      var n = significant(text.slice(i));
      if (n === after) pos = i;
      if (n === after && !backward) break;
      if (n > after) break;
    }
    return pos;
  }

  global.Mask = {
    live: live,
    significant: significant,
    caret: caret
  };
})(window);
