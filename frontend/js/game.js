(function (global) {
  "use strict";

  var Catalog = global.Rounds;
  var Format = global.Format;

  // O estado do jogo "Seu dinheiro no tempo" e os pontos. Não toca no DOM: as
  // telas leem daqui e pedem as mudanças por aqui, e é aqui que ficam as
  // regras.
  //
  // As rodadas vão em ordem, como no Kahoot: uma só abre depois que o aluno
  // escolheu na de antes. A escolha vale na hora e não muda mais (só
  // recomeçando o jogo).
  //
  // picks: a escolha de cada rodada ("A" ou "B"), pelo id da rodada.
  // name: o nome ou apelido de quem joga (opcional, vai no placar).
  // begun: se o aluno já tocou em "Começar o jogo".
  var picks = {};
  var name = "";
  var begun = false;

  // Tudo isso fica guardado no navegador, pra recarregar a página não apagar
  // o que o aluno já escolheu, e separado por conta ("dinheiro-no-tempo:" e
  // o id de quem entrou). O open() escolhe a conta.
  var BASE = "dinheiro-no-tempo";
  var KEY = BASE;

  function ids() { return Catalog.list.map(function (r) { return String(r.id); }); }

  /* ============ os pontos ============ */
  // os pontos de uma opção em cada categoria: { receita: 2, patrimonio: 0 }
  function pointsOf(round, letter) {
    var kind = Catalog.kinds[round.options[letter].kind];
    var out = {};
    Catalog.categories.forEach(function (c) { out[c.key] = kind.points[c.key] || 0; });
    return out;
  }

  function kindOf(round, letter) {
    return Catalog.kinds[round.options[letter].kind];
  }

  // Os pontos numa frase: "+2 receita", "−2 patrimônio" ou, num tipo que
  // mexe nas duas categorias, "+1 receita e +1 patrimônio".
  function effectText(pts) {
    var parts = Catalog.categories.filter(function (c) { return pts[c.key]; }).map(function (c) {
      return Format.points(pts[c.key]) + " " + c.name.toLowerCase();
    });
    return parts.length ? parts.join(" e ") : "nenhum ponto";
  }

  // a cor de um número de pontos numa categoria: a da categoria quando
  // soma, vermelho quando tira ("down") e apagado quando é 0 ("zero")
  function toneOf(catKey, v) {
    if (v < 0) return "down";
    if (!v) return "zero";
    for (var i = 0; i < Catalog.categories.length; i++) {
      if (Catalog.categories[i].key === catKey) return Catalog.categories[i].tone;
    }
    return "zero";
  }

  // a soma dos pontos das rodadas já respondidas, em cada categoria
  function totals() {
    var out = {};
    Catalog.categories.forEach(function (c) { out[c.key] = 0; });
    Catalog.list.forEach(function (r) {
      var l = picks[r.id];
      if (!l) return;
      var p = pointsOf(r, l);
      Catalog.categories.forEach(function (c) { out[c.key] += p[c.key]; });
    });
    return out;
  }

  // Quantas vezes o aluno escolheu cada tipo e quantos pontos cada tipo deu:
  // { consumo: { count: 2, points: { receita: 0, patrimonio: -4 } }, ... }
  function byKind() {
    var out = {};
    Object.keys(Catalog.kinds).forEach(function (k) {
      var pts = {};
      Catalog.categories.forEach(function (c) { pts[c.key] = 0; });
      out[k] = { count: 0, points: pts };
    });
    Catalog.list.forEach(function (r) {
      var l = picks[r.id];
      if (!l) return;
      var k = r.options[l].kind;
      var p = pointsOf(r, l);
      out[k].count++;
      Catalog.categories.forEach(function (c) { out[k].points[c.key] += p[c.key]; });
    });
    return out;
  }

  // O menor e o maior placar possíveis em cada categoria, somando a pior e a
  // melhor opção de cada rodada: { receita: { min: 0, max: 6 }, ... }
  function range() {
    var out = {};
    Catalog.categories.forEach(function (c) {
      var min = 0;
      var max = 0;
      Catalog.list.forEach(function (r) {
        var v = Catalog.letters.map(function (l) { return pointsOf(r, l)[c.key]; });
        min += Math.min.apply(null, v);
        max += Math.max.apply(null, v);
      });
      out[c.key] = { min: min, max: max };
    });
    return out;
  }

  /* ============ as rodadas ============ */
  function pickOf(id) { return picks[id] || null; }
  function answered() { return ids().filter(function (id) { return !!picks[id]; }).length; }
  function isOver() { return answered() === Catalog.list.length; }
  function started() { return begun || answered() > 0; }

  // a rodada em que o aluno está: a primeira sem escolha (ou a última, com
  // todas respondidas)
  function current() {
    var list = ids();
    for (var i = 0; i < list.length; i++) if (!picks[list[i]]) return list[i];
    return list[list.length - 1];
  }

  // Por que uma rodada ainda não abre (ou null, se já dá pra abrir): falta
  // escolher na rodada de antes.
  function blocked(id) {
    var list = ids();
    var i = list.indexOf(String(id));
    if (i < 0) return "Essa rodada não existe.";
    for (var j = 0; j < i; j++) {
      if (!picks[list[j]]) {
        return "A Rodada " + list[i] + " só abre depois que você escolher na Rodada " + list[j] + ".";
      }
    }
    return null;
  }

  // Escolhe uma opção. Devolve o motivo quando não pode (ou null): a rodada
  // ainda não abriu ou já tem uma escolha.
  function pick(id, letter) {
    id = String(id);
    var err = blocked(id);
    if (err) return err;
    if (picks[id]) return "Você já escolheu nesta rodada. Para trocar, só recomeçando o jogo.";
    if (Catalog.letters.indexOf(letter) < 0) return "Essa opção não existe.";
    picks[id] = letter;
    begun = true;
    save();
    return null;
  }

  function start() {
    begun = true;
    save();
  }

  function getName() { return name; }
  function setName(v) {
    name = String(v || "").replace(/\s+/g, " ").trim().slice(0, 24);
    save();
  }

  // volta tudo ao começo: nenhuma escolha feita. O nome fica: quem recomeça
  // costuma ser a mesma pessoa.
  function reset() {
    picks = {};
    begun = false;
    save();
  }

  /* ============ guardar no navegador ============ */
  // Pode não ter como guardar (janela anônima, navegador que bloqueia): aí o
  // jogo funciona igual, só não lembra depois de recarregar.
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ picks: picks, name: name, begun: begun }));
    } catch (err) {}
  }

  // Volta o que estava guardado. Uma escolha que não bate mais com as
  // rodadas (rounds.js mudou) é esquecida, e as escolhas seguem em ordem:
  // uma rodada só vale com as de antes respondidas.
  function load() {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (err) { saved = null; }
    if (!saved || typeof saved !== "object") return;
    var p = saved.picks || {};
    var list = ids();
    for (var i = 0; i < list.length; i++) {
      if (Catalog.letters.indexOf(p[list[i]]) < 0) break;
      picks[list[i]] = p[list[i]];
    }
    name = typeof saved.name === "string" ? saved.name.slice(0, 24) : "";
    begun = !!saved.begun;
  }

  // abre o jogo de quem entrou, com o que ficou guardado na conta dele
  function open(userId) {
    KEY = BASE + ":" + userId;
    picks = {};
    name = "";
    begun = false;
    load();
  }

  global.Game = {
    open: open,
    ids: ids,
    pointsOf: pointsOf,
    kindOf: kindOf,
    effectText: effectText,
    toneOf: toneOf,
    totals: totals,
    byKind: byKind,
    range: range,
    pickOf: pickOf,
    answered: answered,
    isOver: isOver,
    started: started,
    current: current,
    blocked: blocked,
    pick: pick,
    start: start,
    getName: getName,
    setName: setName,
    reset: reset
  };
})(window);
