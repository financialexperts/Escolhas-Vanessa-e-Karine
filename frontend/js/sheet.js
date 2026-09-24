(function (global) {
  "use strict";

  var S = global.Scenario;
  var Catalog = global.Decisions;
  var Ex = global.Exercise;
  var Format = global.Format;
  var Parse = global.Parse;
  var Mask = global.Mask;
  var Toast = global.Toast;
  var Icons = global.Icons;

  // As decisões do jeito da planilha, uma etapa de cada vez. Cada decisão é
  // um cartão com as duas lado a lado (primeiro a Vanessa, depois a Karine):
  // os dados da história em laranja, os cálculos em branco pro aluno
  // preencher e, embaixo, em verde, a diferença entre as duas. A última
  // etapa é o cartão da diferença total.
  //
  // Em cima dos cartões ficam as etapas, e só o cartão da etapa aberta
  // aparece. Ao conferir, os campos certos ficam resolvidos e os errados
  // ganham uma dica; com algum erro, aparece o botão que refaz a etapa. O
  // botão de avançar só aparece com todos os cálculos da etapa certos.

  var root = null;      // o container das etapas e dos cartões
  var onChange = null;  // avisa o app.js que um grupo foi conferido
  var active = null;    // a etapa que está na tela: "1" a "4" ou "total"

  // O que a última conferência disse de cada campo em aberto: "wrong",
  // "invalid" ou "missing". É só da tela: some quando o aluno mexe no campo,
  // e ao recarregar a página.
  var mark = {};

  var semAnimacao = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function nw(s) { return '<span class="nw">' + Format.esc(s) + "</span>"; }
  function domId(id) { return id.replace(/\./g, "-"); }

  // o nome da etapa nas frases ("Avançar para a Decisão 2") e o nome curto,
  // embaixo do número dela ("Celular")
  function stepName(group) { return group === "total" ? "diferença total" : "Decisão " + group; }
  function stepTopic(group) { return group === "total" ? "Diferença total" : Catalog.byId(Number(group)).topic; }
  function nextOf(group) {
    var list = Ex.groups();
    return list[list.indexOf(group) + 1] || null;
  }

  // um texto de decisions.js com os {marcadores} já em negrito
  function fillHTML(text, dec, who) {
    return String(text).split(/(\{[^}]+\})/).map(function (part) {
      var m = /^\{([^}]+)\}$/.exec(part);
      return m ? "<strong>" + nw(Ex.token(m[1], dec, who)) + "</strong>" : Format.esc(part);
    }).join("");
  }

  /* ============ montagem da tela ============ */
  // As etapas, em cima dos cartões: o número (ou o selo de certo) e o nome.
  // Tocar numa leva até ela, se ela já abriu.
  function stepsHTML() {
    return '<nav class="card steps" id="steps" aria-label="Etapas do exercício"><ol class="steps__list">' +
      Ex.groups().map(function (g, i) {
        return '<li class="steps__item" data-step-item="' + g + '">' +
          '<button class="steps__btn" type="button" data-step="' + g + '">' +
            '<span class="steps__num" aria-hidden="true">' + (i + 1) + "</span>" +
            '<span class="steps__kicker">Etapa ' + (i + 1) + "</span>" +
            '<span class="steps__name">' + Format.esc(stepTopic(g)) +
              '<span class="sr-only" data-step-state></span></span>' +
          "</button>" +
          "</li>";
      }).join("") +
      "</ol></nav>";
  }

  // A célula onde o aluno escreve: o "R$" antes e a unidade depois ficam
  // desenhados em volta, então ele digita só o número (ou a conta).
  function cellHTML(f) {
    var id = domId(f.id);
    var word = Format.unitWord(f.unit);
    return '<span class="cell">' +
      (f.unit === "money" ? '<span class="cell__pre" aria-hidden="true">R$</span>' : "") +
      '<input class="cell__input" id="f-' + id + '" data-field="' + f.id + '" type="text" inputmode="decimal" ' +
        'autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="next" ' +
        'placeholder="Calcule" aria-describedby="m-' + id + '">' +
      (word ? '<span class="cell__suf" aria-hidden="true">' + word + "</span>" : "") +
      '<span class="cell__mark" aria-hidden="true"></span>' +
      "</span>";
  }

  // uma linha em branco da planilha: o rótulo, a célula e, embaixo, a
  // mensagem (a dica quando errou, o resultado da conta enquanto digita)
  function calcRowHTML(f, extra) {
    var id = domId(f.id);
    return '<div class="srow srow--calc' + (extra ? " " + extra : "") + '" data-row="' + f.id + '">' +
      '<label class="srow__label" for="f-' + id + '">' + Format.esc(f.label) +
        (f.who ? '<span class="sr-only"> (' + Format.esc(S.people[f.who].name) + ")</span>" : "") + "</label>" +
      cellHTML(f) +
      '<p class="srow__msg" id="m-' + id + '"></p>' +
      "</div>";
  }

  // uma linha laranja: um dado da história, já preenchido
  function dataRowHTML(dec, who, row) {
    var sheet = Ex.sheetOf(dec);
    return '<div class="srow srow--data">' +
      '<span class="srow__label">' + Format.esc(Ex.fill(row.label, dec, who)) + "</span>" +
      '<span class="srow__value">' + nw(Format.unit(sheet.values[who][row.key], row.unit)) + "</span>" +
      "</div>";
  }

  function colHTML(dec, who) {
    var side = dec[who];
    var name = S.people[who].name;
    var rows = side.rows.map(function (row) {
      return row.calc ? calcRowHTML(Ex.field(dec.id + "." + who + "." + row.key)) : dataRowHTML(dec, who, row);
    }).join("");
    return '<section class="scol" aria-label="' + Format.esc(name + ": " + side.pick) + '">' +
      '<header class="scol__head">' + Icons.avatar(who, "scol__avatar") +
        '<div class="scol__who">' +
          '<p class="scol__name">' + Format.esc(name) +
            (side.label ? '<span class="scol__label">' + Format.esc(side.label) + "</span>" : "") + "</p>" +
          '<p class="scol__pick">' + Format.esc(side.pick) + "</p>" +
        "</div>" +
      "</header>" +
      '<p class="scol__story">' + Format.esc(side.story) + "</p>" +
      '<div class="srows">' + rows + "</div>" +
      (side.note ? '<p class="scol__note">' + Format.esc(Ex.fill(side.note, dec, who)) + "</p>" : "") +
      "</section>";
  }

  // O período do cálculo, logo embaixo da pergunta: quantos anos entram nas
  // contas, de que ano a que ano, e a barrinha dos 40 anos com o pedaço que
  // conta (o mesmo desenho da linha do tempo). from = o ano em que a
  // decisão acontece; text = a frase que explica.
  function pos(year) { return (year / S.years * 100) + "%"; }

  function periodHTML(from, text) {
    var ticks = [0, from, S.years].filter(function (y, i, list) { return list.indexOf(y) === i; });
    return '<div class="speriod fx">' +
      Icons.tile("relogio", "violet", "speriod__ico") +
      '<div class="speriod__body">' +
        '<p class="speriod__label">Período do cálculo</p>' +
        '<p class="speriod__value">' + nw((S.years - from) + " anos") +
          ' <span class="speriod__range">' + nw("do ano " + from) + " " + nw("ao ano " + S.years) + "</span></p>" +
        '<p class="speriod__text">' + Format.esc(text) + "</p>" +
      "</div>" +
      '<div class="speriod__bar" aria-hidden="true">' +
        '<span class="speriod__track"><span class="speriod__fill" style="left:' + pos(from) + '"></span></span>' +
        '<span class="speriod__ticks">' + ticks.map(function (y) {
          var edge = y === 0 ? " is-first" : y === S.years ? " is-last" : "";
          return '<span class="speriod__tick' + edge + '" style="left:' + pos(y) + '">' + y + "</span>";
        }).join("") + "</span>" +
      "</div>" +
      "</div>";
  }

  // a frase do período de uma decisão: o período inteiro, ou do ano em que
  // ela acontece até o fim
  function periodText(dec) {
    if (dec.from === 0) return "É o período inteiro: todas as contas desta decisão são para os " + S.years + " anos.";
    return "A decisão acontece no ano " + dec.from + " dos " + S.years + " anos: as contas vão do ano " +
      dec.from + " até o fim, no ano " + S.years + ".";
  }

  // a célula verde da planilha: a diferença entre as duas (ou a total)
  function diffHTML(f, icon) {
    return '<div class="sdiff fx">' + Icons.tile(icon, "green", "sdiff__ico") + calcRowHTML(f, "srow--diff") + "</div>";
  }

  // o status da etapa (quantos certos) e os botões: o que refaz a etapa (só
  // depois de uma conferência com erro), o que confere e, com tudo certo, o
  // que avança pra próxima etapa
  function footHTML(group) {
    var one = group === "total";
    var next = nextOf(group);
    return '<div class="sfoot">' +
      '<p class="sfoot__status" data-status="' + group + '" aria-live="polite"></p>' +
      '<div class="sfoot__btns">' +
        '<button class="btn btn--ghost glass fx" type="button" data-redo="' + group + '" hidden>' +
          '<span data-icon="refazer"></span>Refazer a etapa</button>' +
        '<button class="btn btn--primary glass fx" type="button" data-check="' + group + '">' +
          '<span data-icon="conferir"></span>' + (one ? "Conferir" : "Conferir os cálculos") + "</button>" +
        (next
          ? '<button class="btn btn--primary glass fx" type="button" data-next="' + next + '" hidden>' +
              "Avançar para a " + Format.esc(stepName(next)) + '<span data-icon="avancar"></span></button>'
          : "") +
      "</div>" +
      "</div>";
  }

  // a pergunta do slide, que aparece quando a decisão termina, e uma
  // resposta possível que só abre quando o professor quiser
  function whyHTML(dec) {
    return '<div class="insight swhy fx" data-why tabindex="-1" hidden>' +
      '<p class="insight__title">' + Icons.tile("duvida", "amber", "itile--xs") + "Para discutir</p>" +
      "<p>" + fillHTML(dec.why, dec) + "</p>" +
      (dec.answer
        ? '<details class="answer"><summary>Ver uma resposta</summary><p>' + fillHTML(dec.answer, dec) + "</p></details>"
        : "") +
      "</div>";
  }

  function cardHTML(dec) {
    var id = dec.id;
    return '<article class="card deccard panel" id="dec-' + id + '" data-group="' + id + '" tabindex="-1" aria-labelledby="dec-' + id + '-title">' +
      '<div class="head fx">' + Icons.decisionTile(dec, "itile--lg") +
        "<div>" +
          '<p class="card__kicker">' + nw("Decisão " + id) + " · " + nw(dec.topic) + " · " +
            nw("Ano " + dec.from + " a " + S.years) + "</p>" +
          '<h3 class="invcard__title" id="dec-' + id + '-title">' + Format.esc(dec.question) + "</h3>" +
          (dec.rule ? '<p class="invcard__sub">' + Format.esc(dec.rule) + "</p>" : "") +
        "</div>" +
      "</div>" +
      periodHTML(dec.from, periodText(dec)) +
      '<div class="scols">' + S.order.map(function (who) { return colHTML(dec, who); }).join("") + "</div>" +
      diffHTML(Ex.field(id + ".diff"), "balanca") +
      whyHTML(dec) +
      footHTML(String(id)) +
      "</article>";
  }

  // O cartão da diferença total, a última célula da planilha. Em cima, a
  // diferença de cada decisão, que aparece quando ela é resolvida.
  function totalHTML() {
    return '<article class="card deccard panel" id="dec-total" data-group="total" tabindex="-1" aria-labelledby="dec-total-title">' +
      '<div class="head fx">' + Icons.tile("calculadora", "green", "itile--lg") +
        "<div>" +
          '<p class="card__kicker">' + nw("Diferença total") + " · " + nw(S.years + " anos") + "</p>" +
          '<h3 class="invcard__title" id="dec-total-title">E no fim dos ' + S.years + " anos?</h3>" +
          '<p class="invcard__sub">Some a diferença entre as duas de cada decisão para chegar à diferença total.</p>' +
        "</div>" +
      "</div>" +
      periodHTML(0, "A diferença total junta as " + Catalog.list.length + " decisões, cada uma do ano em que acontece até o ano " + S.years + ".") +
      '<ul class="srecap" data-recap></ul>' +
      diffHTML(Ex.field("total"), "balanca") +
      footHTML("total") +
      "</article>";
  }

  function recapHTML() {
    return Catalog.list.map(function (d) {
      var f = Ex.field(d.id + ".diff");
      var ok = !!Ex.statusOf(f.id);
      return '<li class="srecap__row' + (ok ? " is-done" : "") + '">' +
        '<a class="srecap__link" href="#dec-' + d.id + '" data-go="' + d.id + '">' +
          Icons.decisionTile(d, "itile--xs") +
          '<span class="srecap__name">' + d.id + ". " + Format.esc(d.topic) + "</span>" +
          '<span class="srecap__value">' + (ok ? nw(Format.money(Math.abs(f.expected))) : "a calcular") + "</span>" +
        "</a>" +
        "</li>";
    }).join("");
  }

  /* ============ a tela acompanha o estado ============ */
  // Os cartões são montados uma vez só e depois só atualizados: redesenhar
  // tudo a cada tecla tiraria o foco de quem está digitando.
  function rowEl(id) { return root.querySelector('[data-row="' + id + '"]'); }
  function cardEl(group) { return root.querySelector('[data-group="' + group + '"]'); }

  var MSG = {
    ok: "Certo!",
    invalid: "Não deu para entender esse valor. Confira o que foi digitado: vale o número, como 1800 ou 1.800,00.",
    missing: "Falta calcular."
  };
  var STATES = ["ok", "wrong", "invalid", "missing"];

  // enquanto o aluno digita uma conta, a célula mostra quanto ela dá
  function previewText(f) {
    var r = Parse.read(Ex.textOf(f.id));
    return r.ok && r.expr ? "= " + Format.unit(r.n, f.unit) : "";
  }

  function syncField(f) {
    var row = rowEl(f.id);
    var input = row.querySelector("input");
    var msg = row.querySelector(".srow__msg");
    var st = Ex.statusOf(f.id) || mark[f.id] || "";

    STATES.forEach(function (s) { row.classList.toggle("is-" + s, st === s); });
    var solved = st === "ok";
    input.readOnly = solved;
    input.placeholder = solved ? "" : "Calcule";
    if (input.value !== Ex.textOf(f.id)) input.value = Ex.textOf(f.id);
    if (st === "wrong" || st === "invalid") input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");

    if (st === "wrong") msg.innerHTML = "Não é esse valor. <strong>Dica:</strong> " + Format.esc(f.hint);
    else if (MSG[st]) msg.textContent = MSG[st];
    else msg.textContent = previewText(f);
    // o "Certo!" é pro leitor de tela: quem vê já tem a marca verde na célula
    msg.classList.toggle("sr-only", st === "ok");
  }

  function statusText(group) {
    var c = Ex.counts(group);
    var n = Catalog.list.length;
    if (group === "total") {
      if (!c.open) return "Você acertou a diferença total!";
      return Ex.wasChecked("total")
        ? "Ainda não é esse valor. Veja a dica e confira de novo, ou refaça a etapa."
        : "As " + n + " decisões estão certas. Faça a soma e confira.";
    }
    if (!c.open) return "Etapa concluída: você acertou os " + c.total + " cálculos!";
    if (!Ex.wasChecked(group)) return "Preencha os " + c.total + " cálculos em branco e confira. Para avançar, todos têm que estar certos.";
    return c.ok + " de " + c.total + " cálculos certos. Para avançar, acerte todos: corrija os que faltam ou refaça a etapa.";
  }

  function syncGroup(group) {
    Ex.fieldsOf(group).forEach(syncField);
    var card = cardEl(group);
    var finished = Ex.isDone(group);
    card.hidden = group !== active;
    card.classList.toggle("is-done", finished);
    card.querySelector("[data-check]").hidden = finished;
    card.querySelector("[data-redo]").hidden = finished || !Ex.wasChecked(group);
    var next = card.querySelector("[data-next]");
    if (next) next.hidden = !finished;
    // o status é anunciado pelo leitor de tela: só muda quando o texto muda,
    // pra não repetir o dos outros cartões a cada conferência
    var status = card.querySelector("[data-status]");
    var txt = statusText(group);
    if (status.textContent !== txt) status.textContent = txt;
    var why = card.querySelector("[data-why]");
    if (why) why.hidden = !finished;
    var recap = card.querySelector("[data-recap]");
    if (recap) recap.innerHTML = recapHTML();

    // no teclado do celular, a tecla de Enter diz o que vai acontecer: ir
    // pra próxima célula em aberto ou, na última, conferir
    var open = Array.prototype.filter.call(card.querySelectorAll("[data-field]"), function (x) { return !x.readOnly; });
    open.forEach(function (x, i) { x.setAttribute("enterkeyhint", i === open.length - 1 ? "done" : "next"); });
  }

  // As etapas acompanham: as certas ganham o selo, a que está na tela fica
  // marcada e as que ainda não abriram ficam apagadas.
  function syncSteps() {
    Ex.groups().forEach(function (g) {
      var item = root.querySelector('[data-step-item="' + g + '"]');
      var btn = item.querySelector("[data-step]");
      var ok = Ex.isDone(g);
      var locked = !!Ex.blocked(g);
      item.classList.toggle("is-done", ok);
      item.classList.toggle("is-active", g === active);
      item.classList.toggle("is-locked", locked);
      if (g === active) btn.setAttribute("aria-current", "step");
      else btn.removeAttribute("aria-current");
      item.querySelector("[data-step-state]").textContent = locked ? " (bloqueada)" : ok ? " (concluída)" : "";
    });
  }

  // Os medidores do alto: quantos cálculos o aluno acertou e quantas
  // decisões já terminaram.
  function syncMeters() {
    var c = Ex.counts();
    var n = Catalog.list.length;
    var d = Ex.decisionsDone();
    document.getElementById("meter-ok-used").textContent = String(c.ok);
    document.getElementById("meter-ok-fill").style.width = (c.ok / c.total * 100) + "%";
    document.getElementById("meter-dec-used").textContent = String(d);
    document.getElementById("meter-dec-fill").style.width = (d / n * 100) + "%";
  }

  function sync() {
    Ex.groups().forEach(syncGroup);
    syncSteps();
    syncMeters();
  }

  /* ============ medidores grudados no alto ============ */
  // Os medidores grudam logo abaixo da barra do topo enquanto as decisões
  // passam e, grudados, viram uma cápsula de vidro.
  var quadroPedido = false;

  function syncStuck() {
    var meters = document.getElementById("meters");
    meters.classList.toggle("is-stuck",
      meters.getBoundingClientRect().top <= parseFloat(getComputedStyle(meters).top) + 0.5);
  }

  function aoRolar() {
    if (quadroPedido) return;
    quadroPedido = true;
    requestAnimationFrame(function () {
      quadroPedido = false;
      syncStuck();
    });
  }

  /* ============ as etapas ============ */
  // Abre uma etapa, se ela já abriu (senão, o aviso diz o que falta). A tela
  // vai até as etapas, pra elas ficarem à vista em cima do cartão, e o foco
  // vai pro cartão, que o leitor de tela anuncia.
  function abrir(group) {
    var err = Ex.blocked(group);
    if (err) {
      Toast.show(err);
      return;
    }
    Toast.hide();
    active = group;
    sync();
    document.getElementById("steps").scrollIntoView({ behavior: semAnimacao ? "auto" : "smooth", block: "start" });
    cardEl(group).focus({ preventScroll: true });
  }

  /* ============ conferir e refazer ============ */
  // põe o foco numa parte que acabou de aparecer logo abaixo, rolando só o
  // necessário pra ela ficar à vista
  function mostrarPerto(el) {
    el.focus({ preventScroll: true });
    el.scrollIntoView({ behavior: semAnimacao ? "auto" : "smooth", block: "nearest" });
  }

  // Depois de conferir, a tela acompanha. Se a etapa terminou, o botão que
  // estava com o foco sumiu: o foco vai pra pergunta de discussão (numa
  // decisão) ou pro resultado final (o app.js cuida, pelo onChange).
  function depois(group) {
    sync();
    if (onChange) onChange(group);
    if (!Ex.isDone(group) || group === "total") return;
    mostrarPerto(cardEl(group).querySelector("[data-why]"));
  }

  function conferir(group) {
    var r = Ex.check(group);
    if (r.error) {
      Toast.show(r.error);
      return;
    }
    Toast.hide();
    Object.keys(r.results).forEach(function (id) {
      if (r.results[id] === "ok") delete mark[id];
      else mark[id] = r.results[id];
    });
    depois(group);
  }

  // Refaz a etapa: as células voltam em branco e o foco vai pra primeira
  // (o botão de refazer, que estava com o foco, some).
  function refazer(group) {
    var err = Ex.redo(group);
    if (err) {
      Toast.show(err);
      return;
    }
    Toast.hide();
    Ex.fieldsOf(group).forEach(function (f) { delete mark[f.id]; });
    sync();
    cardEl(group).querySelector("[data-field]").focus();
  }

  /* ============ eventos ============ */
  function handleClick(e) {
    var b = e.target.closest("[data-check]");
    if (b) { conferir(b.getAttribute("data-check")); return; }
    b = e.target.closest("[data-redo]");
    if (b) { refazer(b.getAttribute("data-redo")); return; }
    b = e.target.closest("[data-next]");
    if (b) { abrir(b.getAttribute("data-next")); return; }
    b = e.target.closest("[data-step]");
    if (b) { abrir(b.getAttribute("data-step")); return; }
    var go = e.target.closest("[data-go]");
    if (go) {
      e.preventDefault();
      abrir(go.getAttribute("data-go"));
    }
  }

  // A máscara enquanto o aluno digita um número (mask.js): os pontos de
  // milhar entram sozinhos e o cursor fica no mesmo lugar dos algarismos.
  function mascarar(input, inputType) {
    var raw = input.value;
    var masked = Mask.live(raw, /^delete/.test(inputType));
    if (masked === null || masked === raw) return;
    var after = Mask.significant(raw.slice(input.selectionEnd == null ? raw.length : input.selectionEnd));
    input.value = masked;
    var pos = Mask.caret(masked, after, /Backward$/.test(inputType));
    input.setSelectionRange(pos, pos);
  }

  // o aluno digitou: a máscara arruma o número, o texto fica guardado e a
  // marca da última conferência sai daquele campo (ele está corrigindo)
  function handleInput(e) {
    var input = e.target.closest("[data-field]");
    if (!input || input.readOnly) return;
    if (!e.isComposing) mascarar(input, e.inputType || "");
    var id = input.getAttribute("data-field");
    Ex.setText(id, input.value);
    delete mark[id];
    syncField(Ex.field(id));
  }

  // Deixa a célula do jeito que ela pede, com o valor que está nela: o
  // número se completa ("1.800" vira "1.800,00" na de dinheiro) e, com
  // conta = true, a conta vira o resultado, como a planilha faz no Enter
  // ("3800*50/100" vira "1.900,00"). O que não deu pra entender fica como
  // está. O valor não muda (é o mesmo que a conferência lê), então a marca
  // da última conferência fica.
  function completar(id, conta) {
    var f = Ex.field(id);
    var r = Parse.read(Ex.textOf(id));
    if (!r.ok || (r.expr && !conta)) return;
    var txt = Format.plain(r.n, f.unit);
    if (txt === Ex.textOf(id)) return;
    Ex.setText(id, txt);
    syncField(f);
  }

  // Ao sair da célula, o número se completa. A conta fica como o aluno
  // escreveu: ele pode ter saído só pra olhar um dado e voltar pra terminar.
  function handleBlur(e) {
    var input = e.target.closest && e.target.closest("[data-field]");
    if (!input || input.readOnly) return;
    completar(input.getAttribute("data-field"), false);
  }

  // Enter completa a célula (a conta vira o resultado) e vai pra próxima
  // célula em aberto do cartão, como numa planilha. Na última, confere.
  function handleKey(e) {
    if (e.key !== "Enter") return;
    var input = e.target.closest("[data-field]");
    if (!input) return;
    e.preventDefault();
    if (!input.readOnly) completar(input.getAttribute("data-field"), true);
    var card = input.closest("[data-group]");
    var all = Array.prototype.slice.call(card.querySelectorAll("[data-field]"));
    var next = all.slice(all.indexOf(input) + 1).filter(function (x) { return !x.readOnly; })[0];
    if (next) next.focus();
    else conferir(card.getAttribute("data-group"));
  }

  /* ============ API ============ */
  // monta as etapas e os cartões, com a etapa em que o aluno está aberta
  function render() {
    mark = {};
    active = Ex.current();
    root.innerHTML = stepsHTML() + Catalog.list.map(cardHTML).join("") + totalHTML();
    Icons.mount(root);
    sync();
  }

  function mount(container, changeCallback) {
    root = container;
    onChange = changeCallback || null;
    render();
    root.addEventListener("click", handleClick);
    root.addEventListener("input", handleInput);
    root.addEventListener("focusout", handleBlur);
    root.addEventListener("keydown", handleKey);

    document.getElementById("meter-ok-max").textContent = String(Ex.counts().total);
    document.getElementById("meter-dec-max").textContent = String(Catalog.list.length);

    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    syncStuck();
  }

  // abre a etapa de uma decisão (a linha do tempo usa)
  function show(id) {
    abrir(String(id));
  }

  global.SheetView = {
    mount: mount,
    render: render,
    sync: sync,
    show: show
  };
})(window);
