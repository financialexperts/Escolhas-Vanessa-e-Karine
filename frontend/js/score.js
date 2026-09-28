(function (global) {
  "use strict";

  var Catalog = global.Rounds;
  var Game = global.Game;
  var Format = global.Format;
  var Icons = global.Icons;
  var PlayView = global.PlayView;

  // O placar do fim do jogo: quantos pontos o aluno fez em cada categoria
  // (receita e patrimônio), de que tipos de escolha eles vieram, a tabela do
  // slide preenchida rodada por rodada e o que os pontos mostram.

  // A última frase do que os pontos mostram: a lição da atividade.
  var LICAO = "Consumir não é proibido: o importante é saber o que cada escolha faz com o seu dinheiro no tempo. " +
    "O consumo imediato tira do <strong>patrimônio</strong>, as escolhas que geram renda aumentam a " +
    "<strong>receita</strong> e as equilibradas fazem o <strong>patrimônio</strong> crescer aos poucos.";

  var semAnimacao = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var quadro = null;

  function el(id) { return document.getElementById(id); }
  function nw(s) { return '<span class="nw">' + Format.esc(s) + "</span>"; }

  // "1 escolha que gera renda", "2 escolhas que geram renda"
  function kindCount(kind, n) {
    return n + " " + (n === 1 ? kind.label : kind.plural).toLowerCase();
  }

  // "a, b e c"
  function lista(items) {
    if (items.length < 2) return items.join("");
    return items.slice(0, -1).join(", ") + " e " + items[items.length - 1];
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
  function kindStatHTML(key, k) {
    var kind = Catalog.kinds[key];
    return '<div class="stat fx">' +
      '<p class="stat__label">' + Icons.tile(kind.icon, kind.tone, "itile--xs") + Format.esc(kind.name) + "</p>" +
      '<p class="stat__value is-score">' + k.count + (k.count === 1 ? " escolha" : " escolhas") + "</p>" +
      '<p class="stat__sub">' + Format.esc(Game.effectText(k.points)) + "</p>" +
      "</div>";
  }

  /* ============ a tabela do slide ============ */
  function numCell(catKey, v) {
    return '<td class="gtable__num" data-tone="' + Game.toneOf(catKey, v) + '">' + Format.points(v) + "</td>";
  }

  function tableHTML(t) {
    var head = "<thead><tr>" +
      '<th scope="col">Rodada</th><th scope="col">Minha escolha</th>' +
      Catalog.categories.map(function (c) {
        return '<th scope="col" class="gtable__num"><span class="gtable__long">Impacto ' + Format.esc(c.where) + "</span>" +
          '<span class="gtable__short" aria-hidden="true">' + Format.esc(c.name) + "</span></th>";
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
          '<span class="gtable__kind">' + Format.esc(kind.name) + "</span></span></div></td>" +
        Catalog.categories.map(function (c) { return numCell(c.key, pts[c.key]); }).join("") +
        "</tr>";
    }).join("") + "</tbody>";

    var foot = '<tfoot><tr><th scope="row" colspan="2">Total</th>' +
      Catalog.categories.map(function (c) { return numCell(c.key, t[c.key]); }).join("") +
      "</tr></tfoot>";

    return '<caption class="sr-only">A sua tabela, rodada por rodada</caption>' + head + body + foot;
  }

  /* ============ o que os pontos mostram ============ */
  // Quantas escolhas tiraram pontos (as de consumo imediato) diz o tom da
  // frase: nenhuma, algumas, a maioria ou todas.
  function insightHTML(t, kinds) {
    var n = Catalog.list.length;
    var feitas = Object.keys(Catalog.kinds).filter(function (k) { return kinds[k].count; }).map(function (k) {
      return "<strong>" + Format.esc(kindCount(Catalog.kinds[k], kinds[k].count)) + "</strong>";
    });
    var perdas = Object.keys(Catalog.kinds).filter(function (k) {
      var p = Catalog.kinds[k].points;
      return Object.keys(p).some(function (c) { return p[c] < 0; });
    });
    var neg = perdas.reduce(function (s, k) { return s + kinds[k].count; }, 0);
    var nome = perdas.length ? Catalog.kinds[perdas[0]].name.toLowerCase() : "consumo imediato";

    var tom;
    if (!neg) tom = "Em nenhuma rodada o dinheiro foi para o " + nome + ": em todas, ele foi trabalhar por você.";
    else if (neg === n) tom = "Nas " + n + " rodadas, o dinheiro foi para o " + nome + ". Você aproveitou na hora, mas o placar mostra o custo: " +
      Format.esc(Game.effectText(t)) + ".";
    else if (neg * 2 > n) tom = "Na maior parte das rodadas (" + neg + " de " + n + "), o dinheiro foi para o " + nome + ". " +
      "É bom aproveitar, mas o patrimônio sente cada uma dessas escolhas.";
    else tom = "Em " + neg + " de " + n + " rodadas você escolheu o " + nome + " e, nas outras, fez o dinheiro trabalhar por você.";

    return '<p class="insight__title">' + Icons.tile("lampada", "amber", "itile--xs") + "O que os seus pontos mostram</p>" +
      "<p>Nas " + n + " rodadas, você fez " + lista(feitas) + ". " + tom + "</p>" +
      "<p>" + LICAO + "</p>";
  }

  /* ============ API ============ */
  // só se chega aqui com todas as rodadas respondidas
  function show() {
    var t = Game.totals();
    var r = Game.range();
    var kinds = Game.byKind();
    var nome = Game.getName();

    el("fn-kicker").textContent = "Fim do jogo · " + Catalog.list.length + " rodadas";
    el("fn-title").textContent = nome ? "O seu placar, " + nome : "O seu placar";

    el("fn-scores").innerHTML = Catalog.categories.map(function (c) {
      return scoreHTML(c, t[c.key], r[c.key], kinds);
    }).join("");
    el("fn-kinds").innerHTML = Object.keys(Catalog.kinds).map(function (k) { return kindStatHTML(k, kinds[k]); }).join("");
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
