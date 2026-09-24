(function (global) {
  "use strict";

  var fmtBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var fmtInt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  var fmtNum = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
  var fmtCents = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // "R$ 10.000,00" — e "−R$ 250,00" quando é perda (o sinal vem antes do R$,
  // com o traço de menos de verdade)
  function money(v) {
    v = v || 0;
    return (v < 0 ? "−" : "") + fmtBRL.format(Math.abs(v));
  }

  // "R$ 30.000" quando não tem centavos, "R$ 5.000,50" quando tem. Serve nos
  // lugares apertados (medidores, etiquetas) sem esconder centavo nenhum. O
  // espaço depois do R$ é inquebrável, igual ao do money().
  function compactMoney(v) {
    v = v || 0;
    if (Math.round(v * 100) % 100 !== 0) return money(v);
    return (v < 0 ? "−" : "") + "R$ " + fmtInt.format(Math.abs(v));
  }

  // o resultado de um caminho: "+R$ 326.400,00" quando ganhou, "−R$ 36.000,00"
  // quando perdeu e "R$ 0,00" quando ficou igual
  function signed(v, compact) {
    var s = compact ? compactMoney(v) : money(v);
    return v > 0 ? "+" + s : s;
  }

  // "0,7%", "72,3%" e "40%": casa decimal só quando ela existe de verdade
  function pct(n) {
    return (Math.round(n * 10) / 10).toFixed(1).replace(".", ",").replace(/,0$/, "") + "%";
  }

  function int(n) { return fmtInt.format(n || 0); }

  // Um valor com a unidade dele, como nas células da planilha: "R$ 4.500,00",
  // "40%", "2 anos", "384 meses", "20 trocas" (e "13,33 trocas" quando a
  // conta do aluno não dá redondo). compact tira os centavos que não existem.
  var WORDS = {
    anos: ["ano", "anos"],
    meses: ["mês", "meses"],
    trocas: ["troca", "trocas"]
  };
  function unit(v, u, compact) {
    if (u === "money") return compact ? compactMoney(v) : money(v);
    if (u === "pct") return pct(v * 100);
    var w = WORDS[u];
    return fmtNum.format(v || 0) + (w ? " " + (v === 1 ? w[0] : w[1]) : "");
  }

  // o número sozinho, do jeito que fica dentro da célula de cálculo (o "R$"
  // e o "trocas" já estão desenhados em volta dela): "1.800,00", "20"
  function plain(v, u) {
    return u === "money" ? fmtCents.format(v || 0) : fmtNum.format(v || 0);
  }

  // a palavra da unidade no plural, pra ficar do lado da célula ("trocas")
  function unitWord(u) {
    return WORDS[u] ? WORDS[u][1] : "";
  }

  // escapa o texto pro HTML e prende o "R$" ao número (espaço inquebrável),
  // pra "R$" nunca ficar no fim de uma linha e o valor na outra
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/R\$ /g, "R$ ");
  }

  global.Format = {
    money: money,
    compactMoney: compactMoney,
    signed: signed,
    pct: pct,
    int: int,
    unit: unit,
    plain: plain,
    unitWord: unitWord,
    esc: esc
  };
})(window);
