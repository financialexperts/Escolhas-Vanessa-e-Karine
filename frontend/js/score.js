(function (global) {
  "use strict";

  var Catalog = global.Rounds;
  var Game = global.Game;
  var Format = global.Format;
  var Icons = global.Icons;
  var PlayView = global.PlayView;

  // O placar do fim do jogo: quantos pontos o aluno fez em cada categoria,
  // quantas escolhas ele fez de cada tipo, a tabela preenchida rodada por
  // rodada e o que os pontos mostram. O ranking fica no ranking.js (o
  // game-app.js mostra os dois juntos).

  // A última frase do que os pontos mostram: a lição do jogo.
  var LICAO = "Consumir não é proibido: o importante é saber o que cada escolha faz com o seu dinheiro no tempo. " +
    "Quem equilibra aproveita o agora (<strong>bem-estar</strong>) sem esquecer o depois " +
    "(<strong>patrimônio</strong>, <strong>receita</strong> e <strong>conhecimento</strong>).";

  var semAnimacao = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var quadro = null;

  function el(id) { return document.getElementById(id); }
  function nw(s) { return '<span class="nw">' + Format.esc(s) + "</span>"; }

  // "1 escolha que gera renda", "2 escolhas que geram renda"
  function kindCount(kind, n) {
    return n + " " + (n === 1 ? kind.label : kind.plural).toLowerCase();
  }

  /* ============ o placar de cada categoria ============ */
  // A régua do menor ao maior placar possível na categoria, com o 0 marcado
  // e o ponto onde o aluno ficou.
  function scaleHTML(v, r) {
    var span = r.max - r.min || 1;
    function pos(x) { return ((x - r.min) / span * 100) + "%"; }
    var from = Math.min(0, v);
    var to = Math.max(0, v);
    var ticks = [r.min, 0, r.max].filter(function (x, i, all) { return all.indexOf(x) === i; });
    return '<div class="gscale" aria-hidden="true">' +
      '<span class="gscale__track">' +
        '<span class="gscale__fill" style="left:' + pos(from) + ";width:" + ((to - from) / span * 100) + '%"></span>' +
        '<span class="gscale__zero" style="left:' + pos(0) + '"></span>' +
        '<span class="gscale__dot" style="left:' + pos(v) + '"></span>' +
      "</span>" +
      '<span class="gscale__ticks">' + ticks.map(function (x) {
        var edge = x === r.min ? " is-first" : x === r.max ? " is-last" : "";
        return '<span class="gscale__tick' + edge + '" style="left:' + pos(x) + '">' + Format.points(x) + "</span>";
      }).join("") + "</span>" +
      "</div>";
  }

  // De onde vieram os pontos da categoria: "+4 de 2 escolhas que geram
  // renda". Sem ponto nenhum, diz que nenhuma escolha mexeu nela.
  function fromHTML(c, kinds) {
    var parts = Object.keys(Catalog.kinds).filter(function (k) { return kinds[k].points[c.key]; }).map(function (k) {
      return "<li><strong>" + nw(Format.points(kinds[k].points[c.key])) + "</strong> de " +
        Format.esc(kindCount(Catalog.kinds[k], kinds[k].count)) + "</li>";
    });
    if (!parts.length) parts = ["<li>Nenhuma das suas escolhas mexeu " + Format.esc(c.where) + ".</li>"];
    return '<ul class="gscore__from">' + parts.join("") + "</ul>";
  }

  function scoreHTML(c, v, r, kinds) {
    return '<div class="gscore fx" data-tone="' + Game.toneOf(c.key, v) + '">' +
      '<div class="gscore__head">' + Icons.tile(c.icon, c.tone, "itile--sm") +
        '<p class="gscore__label">' + Format.esc(c.name) + "</p>" +
      "</div>" +
      '<p class="gscore__value">' +
        '<span class="gscore__num" data-count="' + v + '" aria-hidden="true">' + Format.points(v) + "</span>" +
        '<span class="gscore__unit" aria-hidden="true">' + (Math.abs(v) === 1 ? "ponto" : "pontos") + "</span>" +
        '<span class="sr-only">' + Format.points(v) + (Math.abs(v) === 1 ? " ponto" : " pontos") + "</span>" +
      "</p>" +
      scaleHTML(v, r) +
      '<p class="gscore__range">O placar ' + Format.esc(c.where) + " vai de " + nw(Format.points(r.min)) + " a " + nw(Format.points(r.max)) + ".</p>" +
      fromHTML(c, kinds) +
      "</div>";
  }

  // Cada número grande conta de 0 até o placar (quem pede menos movimento
  // já vê o número pronto). O placar já vem escrito no HTML e só vira 0 no
  // primeiro quadro da animação: se ela não rodar, o número certo fica.
  function contar() {
    cancelAnimationFrame(quadro);
    var nums = Array.prototype.slice.call(el("fn-scores").querySelectorAll("[data-count]"));
    if (semAnimacao) return;
    var inicio = null;
    var DURACAO = 900;
    function passo(agora) {
      if (inicio === null) inicio = agora;
      var p = Math.min((agora - inicio) / DURACAO, 1);
      var suave = 1 - Math.pow(1 - p, 3);
      nums.forEach(function (n) {
        var alvo = Number(n.getAttribute("data-count"));
        n.textContent = Format.points(p < 1 ? Math.round(alvo * suave) : alvo);
      });
      if (p < 1) quadro = requestAnimationFrame(passo);
    }
    quadro = requestAnimationFrame(passo);
  }

  /* ============ os tipos de escolha ============ */
  // Uma linha por tipo: quantas vezes o aluno escolheu e quantos pontos deu.
  // Os tipos que ele não escolheu ficam apagados, mas aparecem: "0 apostas"
  // também conta.
  function kindsHTML(kinds) {
    return Object.keys(Catalog.kinds).map(function (key) {
      var kind = Catalog.kinds[key];
      var k = kinds[key];
      return '<li class="gkind fx' + (k.count ? "" : " is-zero") + '">' +
        Icons.tile(kind.icon, kind.tone, "itile--sm") +
        '<span class="gkind__name">' + Format.esc(kind.name) + "</span>" +
        '<span class="gkind__count">' + k.count + (k.count === 1 ? " escolha" : " escolhas") + "</span>" +
        '<span class="gkind__pts">' + (k.count ? PlayView.effect(k.points) : "—") + "</span>" +
        "</li>";
    }).join("");
  }

  /* ============ a tabela ============ */
  function numCell(catKey, v) {
    return '<td class="gtable__num gtable__cat" data-tone="' + Game.toneOf(catKey, v) + '">' + Format.points(v) + "</td>";
  }

  // No celular, as colunas das categorias saem e o impacto vira uma frase
  // embaixo da escolha (gtable__effect).
  function tableHTML(t) {
    var head = "<thead><tr>" +
      '<th scope="col">Rodada</th><th scope="col">Minha escolha</th>' +
      Catalog.categories.map(function (c) {
        return '<th scope="col" class="gtable__num gtable__cat">' + Format.esc(c.name) + "</th>";
      }).join("") +
      "</tr></thead>";

    var body = "<tbody>" + Catalog.list.map(function (r) {
      var l = Game.pickOf(r.id);
      var pts = Game.pointsOf(r, l);
      var kind = Game.kindOf(r, l);
      return "<tr>" +
        '<th scope="row"><span class="gtable__round">' + r.id + '</span><span class="gtable__topic">' + Format.esc(r.topic) + "</span></th>" +
        '<td><div class="gtable__pick">' + PlayView.letter(l) +
          '<span class="gtable__text">' + Format.esc(r.options[l].text) +
          '<span class="gtable__kind">' + Format.esc(kind.name) + (r.multiplier > 1 ? " · pontos em dobro" : "") + "</span>" +
          '<span class="gtable__effect">' + PlayView.effect(pts) + "</span>" +
          "</span></div></td>" +
        Catalog.categories.map(function (c) { return numCell(c.key, pts[c.key]); }).join("") +
        "</tr>";
    }).join("") + "</tbody>";

    var foot = '<tfoot><tr><th scope="row" colspan="2">Total</th>' +
      Catalog.categories.map(function (c) { return numCell(c.key, t[c.key]); }).join("") +
      "</tr></tfoot>";

    return '<caption class="sr-only">A sua tabela, rodada por rodada</caption>' + head + body + foot;
  }

  /* ============ o que os pontos mostram ============ */
  // Quantas escolhas somaram e quantas tiraram pontos, o ponto forte do
  // aluno (a categoria em que ele chegou mais perto do máximo) e uma dica
  // pra cada armadilha em que ele caiu.
  function insightHTML(t, kinds) {
    var n = Catalog.list.length;
    var r = Game.range();
    function net(k) {
      var p = Catalog.kinds[k].points;
      return Object.keys(p).reduce(function (s, c) { return s + p[c]; }, 0);
    }
    var keys = Object.keys(Catalog.kinds);
    var bons = keys.filter(function (k) { return net(k) > 0; }).reduce(function (s, k) { return s + kinds[k].count; }, 0);
    var ruins = n - bons;

    var forte = null;
    Catalog.categories.forEach(function (c) {
      if (t[c.key] <= 0 || r[c.key].max <= 0) return;
      var p = t[c.key] / r[c.key].max;
      if (!forte || p > forte.p) forte = { c: c, p: p };
    });

    var resumo = "Nas " + n + " rodadas, você fez <strong>" + bons + (bons === 1 ? " escolha" : " escolhas") + " que " +
      (bons === 1 ? "somou" : "somaram") + " pontos</strong> e <strong>" + ruins + " que " + (ruins === 1 ? "tirou" : "tiraram") + "</strong>. " +
      (forte
        ? "O seu ponto forte foi " + (forte.c.where.split(" ")[0] === "no" ? "o " : "a ") + "<strong>" + Format.esc(forte.c.name.toLowerCase()) +
          "</strong>: " + nw(Format.points(t[forte.c.key])) + " de " + nw(Format.points(r[forte.c.key].max)) + " possíveis."
        : "Nenhuma categoria ficou positiva: vale jogar de novo e comparar.");

    var dicas = keys.filter(function (k) { return kinds[k].count && Catalog.kinds[k].tip; }).map(function (k) {
      var kind = Catalog.kinds[k];
      return '<li><span class="insight__tip">' + Icons.tile(kind.icon, kind.tone, "itile--xs") +
        "<strong>" + Format.esc(kind.name) + "</strong> (" + kinds[k].count + "×)</span> " + Format.esc(kind.tip) + "</li>";
    });

    return '<p class="insight__title">' + Icons.tile("lampada", "amber", "itile--xs") + "O que os seus pontos mostram</p>" +
      "<p>" + resumo + "</p>" +
      (dicas.length ? '<ul class="insight__tips">' + dicas.join("") + "</ul>" : "<p>Você não caiu em nenhuma armadilha: nem dívida, nem aposta, nem dinheiro parado. Mandou bem!</p>") +
      "<p>" + LICAO + "</p>";
  }

  /* ============ API ============ */
  // só se chega aqui com todas as rodadas respondidas
  function show() {
    var t = Game.totals();
    var r = Game.range();
    var kinds = Game.byKind();
    // o primeiro nome que a pessoa cadastrou no login
    var nome = global.Session ? global.Session.firstName() : "";

    el("fn-kicker").textContent = "Fim do jogo · " + Catalog.list.length + " rodadas";
    el("fn-title").textContent = nome ? "O seu placar, " + nome : "O seu placar";

    el("fn-scores").innerHTML = Catalog.categories.map(function (c) {
      return scoreHTML(c, t[c.key], r[c.key], kinds);
    }).join("");
    el("fn-kinds").innerHTML = kindsHTML(kinds);
    el("fn-table").innerHTML = tableHTML(t);
    el("fn-insight").innerHTML = insightHTML(t, kinds);
    el("sec-final").hidden = false;
    contar();
  }

  function hide() {
    cancelAnimationFrame(quadro);
    el("sec-final").hidden = true;
  }

  global.ScoreView = {
    show: show,
    hide: hide
  };
})(window);
