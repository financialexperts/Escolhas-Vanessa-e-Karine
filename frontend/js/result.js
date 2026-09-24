(function (global) {
  "use strict";

  var S = global.Scenario;
  var Catalog = global.Decisions;
  var Ex = global.Exercise;
  var Format = global.Format;
  var Icons = global.Icons;

  // De onde veio a diferença, em uma frase: fecha a análise do resultado.
  var LICAO = "As perdas da " + S.people.vanessa.name + " vieram da <strong>desvalorização</strong>: " +
    "celular, TV e carro perdem valor a cada troca. Os ganhos da " + S.people.karine.name +
    " vieram da <strong>receita</strong> (aluguel, dividendos e juros) e da <strong>valorização</strong> da startup.";

  var semAnimacao = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var quadro = null;

  function el(id) { return document.getElementById(id); }
  function dir(v) { return v < 0 ? "is-down" : v > 0 ? "is-up" : "is-same"; }

  function statHTML(icon, label, value, cls, sub, highlight) {
    return '<div class="stat fx' + (highlight ? " stat--hl" : "") + '">' +
      '<p class="stat__label">' + icon + label + "</p>" +
      '<p class="stat__value ' + cls + '">' + value + "</p>" +
      '<p class="stat__sub">' + sub + "</p>" +
      "</div>";
  }

  // uma linha por decisão: o que cada uma ganhou ou perdeu, a diferença e o
  // pedaço da diferença final que veio dela (a barrinha)
  function cmpHTML(label, value, cls) {
    return '<div class="cmp__col"><p class="ledger__label">' + label + "</p>" +
      '<p class="ledger__num ' + cls + '">' + value + "</p></div>";
  }

  function share(d, total) {
    return total > 0 ? Math.max(Ex.diffOf(d), 0) / total * 100 : 0;
  }

  function rowHTML(dec, total) {
    var s = Ex.sheetOf(dec);
    var d = Ex.diffOf(dec);
    var p = share(dec, total);
    return '<li class="ledger__row fx">' +
      Icons.decisionTile(dec, "itile--sm") +
      '<div class="ledger__main">' +
        '<p class="ledger__badge">Decisão ' + dec.id + " · " + Format.esc(dec.topic) + "</p>" +
        '<p class="ledger__title">' + Format.esc(dec.vanessa.label + " × " + dec.karine.label) + "</p>" +
        '<div class="share"><span class="share__track" aria-hidden="true"><span class="share__fill" style="width:' + p + '%"></span></span>' +
          '<span class="share__label">' + Format.pct(p) + " da diferença final</span></div>" +
      "</div>" +
      '<div class="cmp">' +
        cmpHTML(Format.esc(S.people.vanessa.name), Format.esc(Format.signed(s.saldo.vanessa, true)), dir(s.saldo.vanessa)) +
        cmpHTML(Format.esc(S.people.karine.name), Format.esc(Format.signed(s.saldo.karine, true)), dir(s.saldo.karine)) +
        cmpHTML("Diferença", Format.esc(Format.compactMoney(d)), "is-diff") +
      "</div>" +
      "</li>";
  }

  // o que os números mostram: a decisão que mais pesou e de onde veio a
  // diferença
  function insightHTML(t) {
    var maior = Catalog.list.slice().sort(function (a, b) { return Ex.diffOf(b) - Ex.diffOf(a); })[0];
    var txt = "A decisão que mais pesou foi a da <strong>" + Format.esc(maior.topic) + "</strong>: sozinha, ela fez " +
      Format.pct(share(maior, t.diff)) + " da diferença entre as duas. ";
    return '<p class="insight__title">' + Icons.tile("lampada", "amber", "itile--xs") + "O que os números mostram</p>" +
      "<p>" + txt + "</p>" +
      "<p>" + LICAO + "</p>";
  }

  // o número grande conta de zero até a diferença final (quem pede menos
  // movimento já vê o número pronto). O leitor de tela ouve só o valor final.
  function contar(alvo) {
    var box = el("fn-total-anim");
    cancelAnimationFrame(quadro);
    el("fn-total").textContent = Format.money(alvo);
    if (semAnimacao) {
      box.textContent = Format.money(alvo);
      return;
    }
    var inicio = null;
    var DURACAO = 1400;
    function passo(agora) {
      if (inicio === null) inicio = agora;
      var p = Math.min((agora - inicio) / DURACAO, 1);
      var suave = 1 - Math.pow(1 - p, 3);
      box.textContent = Format.money(p < 1 ? Math.round(alvo * suave) : alvo);
      if (p < 1) quadro = requestAnimationFrame(passo);
    }
    box.textContent = Format.money(0);
    quadro = requestAnimationFrame(passo);
  }

  function show() {
    var t = Ex.totals();
    var c = Ex.counts();
    var n = Catalog.list.length;

    el("fn-kicker").textContent = "Depois de " + S.years + " anos";
    el("fn-total-label").textContent = "Por causa dessas " + n + " decisões, a diferença entre as duas foi de";
    el("fn-total-sub").textContent = "em " + S.years + " anos, somando as " + n + " decisões";

    // só se chega aqui com as etapas todas certas: o placar é sempre cheio
    el("fn-stats").innerHTML =
      statHTML(Icons.avatar("vanessa", "avatar--xs"), "Resultado da " + Format.esc(S.people.vanessa.name),
        Format.esc(Format.signed(t.vanessa)), dir(t.vanessa), "somando as " + n + " decisões") +
      statHTML(Icons.avatar("karine", "avatar--xs"), "Resultado da " + Format.esc(S.people.karine.name),
        Format.esc(Format.signed(t.karine)), dir(t.karine), "somando as " + n + " decisões") +
      statHTML(Icons.tile("calculadora", "green", "itile--xs"), "Os seus cálculos",
        c.ok + " de " + c.total, "is-score", "certos, todos feitos por você", true);

    el("fn-list").innerHTML = Catalog.list.map(function (d) { return rowHTML(d, t.diff); }).join("");
    el("fn-insight").innerHTML = insightHTML(t);
    el("sec-final").hidden = false;
    contar(t.diff);
  }

  function hide() {
    cancelAnimationFrame(quadro);
    el("sec-final").hidden = true;
  }

  global.ResultView = {
    show: show,
    hide: hide
  };
})(window);
