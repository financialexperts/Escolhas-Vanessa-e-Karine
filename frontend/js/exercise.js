(function (global) {
  "use strict";

  var S = global.Scenario;
  var Catalog = global.Decisions;
  var Format = global.Format;
  var Parse = global.Parse;

  // O estado do exercício e as contas. Não toca no DOM: as telas leem daqui e
  // pedem as mudanças por aqui, e é aqui que ficam as regras.
  //
  // Cada cálculo que o aluno faz é um campo, com um id: "1.vanessa.perda"
  // (uma linha em branco da planilha), "1.diff" (a diferença entre as duas
  // numa decisão) e "total" (a diferença total, no fim). Os campos se juntam
  // em grupos, que são conferidos juntos: cada decisão ("1" a "4") e o
  // "total".
  //
  // text: o que o aluno digitou em cada campo.
  // done: os campos resolvidos, "ok" (o aluno acertou) ou "shown" (a
  //   resposta foi mostrada). Resolvido, o campo não muda mais.
  // checked: os grupos que o aluno já conferiu pelo menos uma vez. Só
  //   depois disso aparece o botão que mostra as respostas.
  var text = {};
  var done = {};
  var checked = {};

  // tudo isso fica guardado no navegador, pra recarregar a página não apagar
  // o que o aluno já fez
  var KEY = "equilibrista-calculos";

  function round2(n) { return Math.round(n * 100) / 100; }

  /* ============ as contas da planilha ============ */
  // quantos anos a decisão pesa: do ano em que acontece até o fim do período
  function yearsOf(dec) { return S.years - dec.from; }

  var WHO = { v: "vanessa", k: "karine" };

  function apply(a, op, b) {
    if (op === "×") return a * b;
    if (op === "÷") return a / b;
    if (op === "+") return a + b;
    if (op === "−") return a - b;
    throw new Error("Operação desconhecida: " + op);
  }

  // um operando da conta: "years", um número fixo, a key de uma linha de
  // quem está fazendo a conta (who) ou "v.key"/"k.key"
  function ref(tok, who) {
    var m = /^(v|k)\.(.+)$/.exec(tok);
    return { who: m ? WHO[m[1]] : who, key: m ? m[2] : tok, cross: !!m };
  }

  function operand(tok, dec, sheet, who) {
    if (tok === "years") return yearsOf(dec);
    if (typeof tok === "object") return tok.n;
    var r = ref(tok, who);
    if (!r.who || !(r.key in sheet.values[r.who])) {
      throw new Error("Decisão " + dec.id + ": não existe o valor \"" + tok + "\".");
    }
    return sheet.values[r.who][r.key];
  }

  function run(expr, dec, sheet, who) {
    var acc = null;
    var op = null;
    expr.forEach(function (tok, i) {
      if (i % 2) { op = tok; return; }
      var n = operand(tok, dec, sheet, who);
      acc = acc === null ? n : apply(acc, op, n);
    });
    return acc;
  }

  // Faz a planilha de uma decisão, linha por linha: o valor de cada linha
  // das duas, o resultado de cada uma no período (perda entra negativa) e a
  // diferença entre as duas. Os números não mudam durante a aula, então cada
  // decisão só é calculada uma vez.
  var cache = {};
  function sheetOf(dec) {
    if (cache[dec.id]) return cache[dec.id];
    var sheet = { values: {}, units: {}, rows: {}, saldo: {} };

    S.order.forEach(function (who) {
      sheet.values[who] = {};
      sheet.units[who] = {};
      sheet.rows[who] = {};
      dec[who].rows.forEach(function (row) {
        var expr = row.calc || (Array.isArray(row.value) ? row.value : null);
        sheet.values[who][row.key] = expr ? round2(run(expr, dec, sheet, who)) : row.value;
        sheet.units[who][row.key] = row.unit;
        sheet.rows[who][row.key] = row;
      });
    });

    S.order.forEach(function (who) {
      var v = round2(run(dec[who].result, dec, sheet, who));
      sheet.saldo[who] = dec[who].kind === "perda" ? -v : v;
    });
    sheet.diff = round2(run(dec.diff, dec, sheet, null));

    // a fórmula da diferença tem que dar o mesmo que o resultado da Karine
    // menos o da Vanessa: se não der, algum dado de decisions.js ficou errado
    var conta = round2(sheet.saldo.karine - sheet.saldo.vanessa);
    if (Math.abs(conta - sheet.diff) > 0.005 && global.console) {
      console.warn("Decisão " + dec.id + ": a diferença (" + sheet.diff + ") não bate com os resultados das duas (" + conta + ").");
    }

    cache[dec.id] = sheet;
    return sheet;
  }

  function diffOf(dec) { return sheetOf(dec).diff; }

  // Um {marcador} dos textos de decisions.js virando valor: {diff}, {years},
  // {end}, {v.key} e {k.key} (Vanessa e Karine) ou {key} (o caminho who).
  function token(name, dec, who) {
    if (name === "diff") return Format.money(diffOf(dec));
    if (name === "years") return String(yearsOf(dec));
    if (name === "end") return String(S.years);
    var r = ref(name, who);
    var sheet = sheetOf(dec);
    if (!r.who || !(r.key in sheet.values[r.who])) {
      throw new Error("Decisão " + dec.id + ": não existe o valor \"" + name + "\".");
    }
    return Format.unit(sheet.values[r.who][r.key], sheet.units[r.who][r.key]);
  }

  // o {years} dos rótulos é resolvido sem precisar da planilha pronta (os
  // rótulos são lidos enquanto ela ainda está sendo feita)
  function fill(str, dec, who) {
    return String(str).replace(/\{([^}]+)\}/g, function (m, name) {
      if (name === "years") return String(yearsOf(dec));
      if (name === "end") return String(S.years);
      return token(name, dec, who);
    });
  }

  // A dica de um cálculo, escrita a partir da própria conta: "Desvalorização
  // do celular no período × Preço médio do celular", "40 anos ÷ Quantidade
  // de anos com cada aparelho", "Perda total da Vanessa − Perda total da
  // Karine".
  function hintOf(expr, dec, who) {
    var sheet = sheetOf(dec);
    return expr.map(function (tok, i) {
      if (i % 2) return tok;
      if (tok === "years") return yearsOf(dec) + " anos";
      if (typeof tok === "object") return Format.unit(tok.n, tok.unit);
      var r = ref(tok, who);
      var label = fill(sheet.rows[r.who][r.key].label, dec, r.who);
      return r.cross ? label + " da " + S.people[r.who].name : label;
    }).join(" ");
  }

  /* ============ os campos que o aluno preenche ============ */
  var FIELDS = [];
  var BY_ID = {};

  Catalog.list.forEach(function (dec) {
    var sheet = sheetOf(dec);
    var group = String(dec.id);
    S.order.forEach(function (who) {
      dec[who].rows.forEach(function (row) {
        if (!row.calc) return;
        FIELDS.push({
          id: group + "." + who + "." + row.key,
          group: group,
          dec: dec,
          who: who,
          label: fill(row.label, dec, who),
          unit: row.unit,
          expected: sheet.values[who][row.key],
          hint: row.hint || hintOf(row.calc, dec, who)
        });
      });
    });
    FIELDS.push({
      id: group + ".diff",
      group: group,
      dec: dec,
      who: null,
      label: "Calcule a diferença entre as duas",
      unit: "money",
      expected: sheet.diff,
      hint: dec.diffHint || hintOf(dec.diff, dec, null)
    });
  });

  FIELDS.push({
    id: "total",
    group: "total",
    dec: null,
    who: null,
    label: "Calcule a diferença total",
    unit: "money",
    expected: round2(Catalog.list.reduce(function (t, d) { return t + diffOf(d); }, 0)),
    hint: "Some a diferença entre as duas de cada uma das " + Catalog.list.length + " decisões."
  });

  FIELDS.forEach(function (f) { BY_ID[f.id] = f; });

  function field(id) { return BY_ID[id] || null; }
  function fieldsOf(group) { return FIELDS.filter(function (f) { return f.group === group; }); }
  function groups() { return Catalog.list.map(function (d) { return String(d.id); }).concat("total"); }

  /* ============ conferir ============ */
  // O que o valor digitado é: "ok", "wrong" (outro valor), "invalid" (não
  // deu pra entender) ou "missing" (vazio). O sinal não conta: uma perda de
  // R$ 36.000,00 pode ser escrita 36000 ou −36000. A diferença de até 1
  // centavo também não, por causa dos arredondamentos.
  function judge(id) {
    var f = BY_ID[id];
    var r = Parse.read(text[id]);
    if (r.empty) return "missing";
    if (!r.ok) return "invalid";
    return Math.abs(Math.abs(r.n) - Math.abs(f.expected)) < 0.0101 ? "ok" : "wrong";
  }

  function textOf(id) { return text[id] || ""; }
  function statusOf(id) { return done[id] || ""; }

  // o aluno digitou; campo resolvido não muda mais
  function setText(id, value) {
    if (!BY_ID[id] || done[id]) return;
    text[id] = String(value).slice(0, 80);
    save();
  }

  function isDone(group) {
    return fieldsOf(group).every(function (f) { return !!done[f.id]; });
  }
  function wasChecked(group) { return !!checked[group]; }

  // as decisões que ainda têm cálculo em aberto
  function openDecisions() {
    return Catalog.list.filter(function (d) { return !isDone(String(d.id)); });
  }

  // "Falta a Decisão 3." / "Faltam as Decisões 1, 3 e 4."
  function faltaText(list) {
    var ids = list.map(function (d) { return d.id; });
    if (ids.length === 1) return "Falta a Decisão " + ids[0] + ".";
    return "Faltam as Decisões " + ids.slice(0, -1).join(", ") + " e " + ids[ids.length - 1] + ".";
  }

  // A diferença total só pode ser conferida com as decisões concluídas.
  // Devolve a frase que explica por que não, ou "".
  function blocked(group) {
    if (group !== "total") return "";
    var falta = openDecisions();
    if (!falta.length) return "";
    return "Termine os cálculos das " + Catalog.list.length + " decisões antes de calcular a diferença total. " + faltaText(falta);
  }

  // Confere os campos de um grupo. Os certos ficam resolvidos (e passam a
  // mostrar o valor do jeito da planilha); devolve { results } com o que
  // cada campo em aberto deu, ou { error } quando ainda não pode conferir.
  function check(group) {
    var err = blocked(group);
    if (err) return { error: err };
    var results = {};
    fieldsOf(group).forEach(function (f) {
      if (done[f.id]) return;
      var r = judge(f.id);
      results[f.id] = r;
      if (r === "ok") {
        done[f.id] = "ok";
        text[f.id] = Format.plain(Math.abs(f.expected), f.unit);
      }
    });
    checked[group] = true;
    save();
    return { results: results };
  }

  // mostra as respostas dos campos que ainda estão em aberto no grupo (só
  // depois de o aluno ter conferido o grupo pelo menos uma vez)
  function show(group) {
    if (!checked[group]) return "Confira os seus cálculos antes de ver as respostas.";
    var err = blocked(group);
    if (err) return err;
    fieldsOf(group).forEach(function (f) {
      if (done[f.id]) return;
      done[f.id] = "shown";
      text[f.id] = Format.plain(Math.abs(f.expected), f.unit);
    });
    save();
    return "";
  }

  // quantos campos o aluno acertou e quantos tiveram a resposta mostrada,
  // num grupo ou em tudo (group vazio)
  function counts(group) {
    var list = group ? fieldsOf(group) : FIELDS;
    var c = { ok: 0, shown: 0, open: 0, total: list.length };
    list.forEach(function (f) {
      if (done[f.id] === "ok") c.ok++;
      else if (done[f.id] === "shown") c.shown++;
      else c.open++;
    });
    return c;
  }

  function decisionsDone() {
    return Catalog.list.length - openDecisions().length;
  }

  // os números do resultado final: o resultado de cada uma no período,
  // somando as 4 decisões, e a diferença entre as duas
  function totals() {
    var t = { vanessa: 0, karine: 0 };
    Catalog.list.forEach(function (d) {
      var s = sheetOf(d);
      t.vanessa += s.saldo.vanessa;
      t.karine += s.saldo.karine;
    });
    t.vanessa = round2(t.vanessa);
    t.karine = round2(t.karine);
    t.diff = round2(t.karine - t.vanessa);
    return t;
  }

  // já tem alguma coisa feita? (pra perguntar antes de apagar tudo)
  function started() {
    return FIELDS.some(function (f) { return done[f.id] || textOf(f.id).trim(); });
  }

  // volta tudo ao começo: nenhum cálculo preenchido nem conferido
  function reset() {
    text = {};
    done = {};
    checked = {};
    save();
  }

  /* ============ guardar no navegador ============ */
  // Pode não ter como guardar (janela anônima, navegador que bloqueia): aí o
  // exercício funciona igual, só não lembra depois de recarregar.
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ text: text, done: done, checked: checked }));
    } catch (err) {}
  }

  // Volta o que estava guardado. Se os dados de decisions.js mudaram depois,
  // um "ok" que não bate mais com a conta volta a ficar em aberto, e uma
  // resposta mostrada passa a mostrar o valor novo.
  function load() {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (err) { saved = null; }
    if (!saved || typeof saved !== "object") return;
    var t = saved.text || {};
    var d = saved.done || {};
    var c = saved.checked || {};
    FIELDS.forEach(function (f) {
      if (typeof t[f.id] === "string") text[f.id] = t[f.id].slice(0, 80);
      if (d[f.id] === "shown") {
        done[f.id] = "shown";
        text[f.id] = Format.plain(Math.abs(f.expected), f.unit);
      } else if (d[f.id] === "ok" && judge(f.id) === "ok") {
        done[f.id] = "ok";
      }
    });
    groups().forEach(function (g) { if (c[g] === true) checked[g] = true; });
  }

  load();

  global.Exercise = {
    yearsOf: yearsOf,
    sheetOf: sheetOf,
    diffOf: diffOf,
    token: token,
    fill: fill,
    field: field,
    fieldsOf: fieldsOf,
    groups: groups,
    judge: judge,
    textOf: textOf,
    statusOf: statusOf,
    setText: setText,
    isDone: isDone,
    wasChecked: wasChecked,
    blocked: blocked,
    check: check,
    show: show,
    counts: counts,
    decisionsDone: decisionsDone,
    totals: totals,
    started: started,
    reset: reset
  };
})(window);
