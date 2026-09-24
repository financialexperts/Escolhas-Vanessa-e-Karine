(function (global) {
  "use strict";

  // Lê o que o aluno digitou numa célula de cálculo. Vale o número do jeito
  // brasileiro ("1.800,00", "1800", "R$ 1.800") ou a conta, como numa célula
  // da planilha ("=4500*40%", "0,4 x 4500", "(3000 + 1050) * 300").
  //
  // Devolve { empty: true } quando não tem nada, { ok: false } quando não deu
  // pra entender, ou { ok: true, n, expr }: n é o valor e expr diz se era uma
  // conta (a tela mostra o resultado dela enquanto o aluno digita).

  // Um número com ponto e vírgula do jeito brasileiro: com vírgula, o ponto
  // separa os milhares ("1.800,50"). Sem vírgula, "1.800" é mil e oitocentos
  // e "0.4" é quatro décimos (o ponto só é de milhar em grupos de 3). Em
  // "1.234.5", os pontos de milhar são os da máscara (mask.js) e o último,
  // com menos de 3 algarismos depois, é o decimal.
  function number(s) {
    if (s.indexOf(",") >= 0) {
      if (s.indexOf(",") !== s.lastIndexOf(",")) return NaN;
      var parts = s.split(",");
      if (parts[0] && !/^\d{1,3}(\.\d{3})*$|^\d+$/.test(parts[0])) return NaN;
      return Number((parts[0].replace(/\./g, "") || "0") + "." + parts[1]);
    }
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g, ""));
    var m = /^(\d{1,3}(?:\.\d{3})+)\.(\d{1,2})$/.exec(s);
    if (m) return Number(m[1].replace(/\./g, "") + "." + m[2]);
    return /^\d*\.?\d+$|^\d+\.$/.test(s) ? Number(s) : NaN;
  }

  // × e x multiplicam, ÷ e : dividem, − é menos
  var OPS = { "+": "+", "-": "-", "−": "-", "*": "*", "x": "*", "X": "*", "×": "*", "/": "/", "÷": "/", ":": "/" };

  function tokens(text) {
    var list = [];
    var i = 0;
    while (i < text.length) {
      var c = text.charAt(i);
      var m = /^[\d.,]+/.exec(text.slice(i));
      if (m) {
        var n = number(m[0]);
        if (isNaN(n)) return null;
        list.push(n);
        i += m[0].length;
      } else if (OPS[c]) {
        list.push(OPS[c]);
        i++;
      } else if (c === "(" || c === ")" || c === "%") {
        list.push(c);
        i++;
      } else {
        return null;
      }
    }
    return list;
  }

  // soma e subtração por último, depois multiplicação e divisão; o % vale
  // pro número (ou parênteses) logo antes dele
  function evaluate(list) {
    var pos = 0;
    function peek() { return list[pos]; }

    function primary() {
      var t = list[pos++];
      var v;
      if (typeof t === "number") v = t;
      else if (t === "(") {
        v = sum();
        if (list[pos++] !== ")") throw new Error();
      } else if (t === "-") return -primary();
      else if (t === "+") return primary();
      else throw new Error();
      while (peek() === "%") { pos++; v = v / 100; }
      return v;
    }

    function product() {
      var v = primary();
      while (peek() === "*" || peek() === "/") {
        var op = list[pos++];
        var b = primary();
        v = op === "*" ? v * b : v / b;
      }
      return v;
    }

    function sum() {
      var v = product();
      while (peek() === "+" || peek() === "-") {
        var op = list[pos++];
        var b = product();
        v = op === "+" ? v + b : v - b;
      }
      return v;
    }

    var v = sum();
    if (pos !== list.length) throw new Error();
    return v;
  }

  function read(text) {
    // o "=" do começo (jeito da planilha), o "R$" e os espaços não contam
    var s = String(text == null ? "" : text).replace(/R\$/gi, "").replace(/\s+/g, "").replace(/^=/, "");
    if (!s) return { empty: true };
    var list = tokens(s);
    if (!list || !list.length) return { ok: false };
    var n;
    try { n = evaluate(list); } catch (err) { return { ok: false }; }
    if (!isFinite(n)) return { ok: false };
    var expr = list.some(function (t) { return typeof t === "string" && t !== "%"; }) &&
      !(list.length === 2 && list[0] === "-");
    return { ok: true, n: n, expr: expr };
  }

  global.Parse = {
    read: read
  };
})(window);
