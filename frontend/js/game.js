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
  // picks: a escolha de cada rodada ("A" a "D"), pelo id da rodada.
  // classCode: o código da turma (opcional): quem joga com o mesmo código
  //   aparece no mesmo ranking, como o PIN do Kahoot.
  // begun: se o aluno já tocou em "Começar o jogo".
  var picks = {};
  var classCode = "";
  var begun = false;

  // Tudo isso fica guardado no navegador, pra recarregar a página não apagar
  // o que o aluno já escolheu, e separado por conta ("dinheiro-no-tempo:" e
  // o id de quem entrou). O open() escolhe a conta.
  var BASE = "dinheiro-no-tempo";
  var KEY = BASE;

  function ids() { return Catalog.list.map(function (r) { return String(r.id); }); }

  /* ============ os pontos ============ */
  // Os pontos de uma opção em cada categoria, já com o "pontos em dobro" da
  // rodada: { receita: 2, patrimonio: 0, ... }
  function pointsOf(round, letter) {
    var kind = Catalog.kinds[round.options[letter].kind];
    var m = round.multiplier || 1;
    var out = {};
    Catalog.categories.forEach(function (c) { out[c.key] = (kind.points[c.key] || 0) * m; });
    return out;
  }

  function kindOf(round, letter) {
    return Catalog.kinds[round.options[letter].kind];
  }

  // Os pontos numa frase: "+2 receita", "−2 patrimônio e +1 bem-estar".
  function effectText(pts) {
    var parts = Catalog.categories.filter(function (c) { return pts[c.key]; }).map(function (c) {
      return Format.points(pts[c.key]) + " " + c.name.toLowerCase();
    });
    if (!parts.length) return "nenhum ponto";
    return parts.length < 2 ? parts[0] : parts.slice(0, -1).join(", ") + " e " + parts[parts.length - 1];
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
  // { consumo: { count: 2, points: { receita: 0, patrimonio: -4, ... } }, ... }
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
  // melhor opção de cada rodada: { receita: { min: -3, max: 16 }, ... }
  function range() {
    var out = {};
    Catalog.categories.forEach(function (c) {
      var min = 0;
      var max = 0;
      Catalog.list.forEach(function (r) {
        var v = Catalog.lettersOf(r).map(function (l) { return pointsOf(r, l)[c.key]; });
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
  // ainda não abriu, já tem uma escolha ou não tem essa opção.
  function pick(id, letter) {
    id = String(id);
    var err = blocked(id);
    if (err) return err;
    if (picks[id]) return "Você já escolheu nesta rodada. Para trocar, só recomeçando o jogo.";
    if (Catalog.lettersOf(Catalog.byId(id)).indexOf(letter) < 0) return "Essa opção não existe.";
    picks[id] = letter;
    begun = true;
    save();
    return null;
  }

  function start() {
    begun = true;
    save();
  }

  // O código da turma vai em maiúsculas e sem espaços ("8a manhã" vira
  // "8AMANHÃ"), pra quem digitar de um jeito ou de outro cair no mesmo
  // ranking.
  function normalizeCode(v) {
    return String(v || "").toUpperCase().replace(/\s+/g, "").slice(0, 20);
  }
  function getClassCode() { return classCode; }
  function setClassCode(v) {
    classCode = normalizeCode(v);
    save();
  }

  // O resultado que vai pro ranking: os pontos de cada categoria e a escolha
  // de cada rodada.
  function result() {
    return { scores: totals(), picks: JSON.parse(JSON.stringify(picks)) };
  }

  // volta tudo ao começo: nenhuma escolha feita. A turma fica: quem
  // recomeça costuma estar na mesma aula.
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
      localStorage.setItem(KEY, JSON.stringify({ picks: picks, classCode: classCode, begun: begun }));
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
    Catalog.list.every(function (r) {
      var l = p[r.id];
      if (Catalog.lettersOf(r).indexOf(l) < 0) return false;
      picks[r.id] = l;
      return true;
    });
    classCode = normalizeCode(saved.classCode);
    begun = !!saved.begun;
  }

  // abre o jogo de quem entrou, com o que ficou guardado na conta dele
  function open(userId) {
    KEY = BASE + ":" + userId;
    picks = {};
    classCode = "";
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
    getClassCode: getClassCode,
    setClassCode: setClassCode,
    normalizeCode: normalizeCode,
    result: result,
    reset: reset
  };
})(window);
