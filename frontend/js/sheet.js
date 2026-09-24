(function (global) {
  "use strict";

  var S = global.Scenario;
  var Catalog = global.Decisions;
  var Ex = global.Exercise;
  var Format = global.Format;
  var Parse = global.Parse;
  var Toast = global.Toast;
  var Icons = global.Icons;

  // As decisões do jeito da planilha. Cada decisão é um cartão com as duas
  // lado a lado (primeiro a Vanessa, depois a Karine): os dados da história
  // em laranja, os cálculos em branco pro aluno preencher e, embaixo, em
  // verde, a diferença entre as duas. No fim vem o cartão da diferença total.
  //
  // O aluno confere uma decisão de cada vez. Os campos certos ficam
  // resolvidos; os errados ganham uma dica. Depois da primeira conferência,
  // aparece o botão que mostra as respostas que faltam.

  var root = null;      // o container dos cartões
  var goTo = null;      // leva a tela até uma parte e põe o foco nela (app.js)
  var onChange = null;  // avisa o app.js que um grupo foi conferido ou mostrado

  // O que a última conferência disse de cada campo em aberto: "wrong",
  // "invalid" ou "missing". É só da tela: some quando o aluno mexe no campo,
  // e ao recarregar a página.
  var mark = {};

  var semAnimacao = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function nw(s) { return '<span class="nw">' + Format.esc(s) + "</span>"; }
  function domId(id) { return id.replace(/\./g, "-"); }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }

  // um texto de decisions.js com os {marcadores} já em negrito
  function fillHTML(text, dec, who) {
    return String(text).split(/(\{[^}]+\})/).map(function (part) {
      var m = /^\{([^}]+)\}$/.exec(part);
      return m ? "<strong>" + nw(Ex.token(m[1], dec, who)) + "</strong>" : Format.esc(part);
    }).join("");
  }

  /* ============ montagem da tela ============ */
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

  // a célula verde da planilha: a diferença entre as duas (ou a total)
  function diffHTML(f, icon) {
    return '<div class="sdiff fx">' + Icons.tile(icon, "green", "sdiff__ico") + calcRowHTML(f, "srow--diff") + "</div>";
  }

  // o status do grupo (quantos certos), o botão que mostra as respostas (só
  // depois da primeira conferência) e o que confere
  function footHTML(group) {
    var one = group === "total";
    return '<div class="sfoot">' +
      '<p class="sfoot__status" data-status="' + group + '" aria-live="polite"></p>' +
      '<div class="sfoot__btns">' +
        '<button class="btn btn--ghost glass fx" type="button" data-show="' + group + '" hidden>' +
          '<span data-icon="olho"></span>' + (one ? "Mostrar a resposta" : "Mostrar as respostas") + "</button>" +
        '<button class="btn btn--primary glass fx" type="button" data-check="' + group + '">' +
          '<span data-icon="conferir"></span>' + (one ? "Conferir" : "Conferir os cálculos") + "</button>" +
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
    return '<article class="card deccard" id="dec-' + id + '" data-group="' + id + '" tabindex="-1" aria-labelledby="dec-' + id + '-title">' +
      '<div class="head fx">' + Icons.decisionTile(dec, "itile--lg") +
        "<div>" +
          '<p class="card__kicker">' + nw("Decisão " + id) + " · " + nw(dec.topic) + " · " +
            nw("Ano " + dec.from + " a " + S.years) + "</p>" +
          '<h3 class="invcard__title" id="dec-' + id + '-title">' + Format.esc(dec.question) + "</h3>" +
          (dec.rule ? '<p class="invcard__sub">' + Format.esc(dec.rule) + "</p>" : "") +
        "</div>" +
      "</div>" +
      '<div class="scols">' + S.order.map(function (who) { return colHTML(dec, who); }).join("") + "</div>" +
      diffHTML(Ex.field(id + ".diff"), "balanca") +
      footHTML(String(id)) +
      whyHTML(dec) +
      "</article>";
  }

  // O cartão da diferença total, a última célula da planilha. Em cima, a
  // diferença de cada decisão, que aparece quando ela é resolvida.
  function totalHTML() {
    return '<article class="card deccard" id="dec-total" data-group="total" tabindex="-1" aria-labelledby="dec-total-title">' +
      '<div class="head fx">' + Icons.tile("calculadora", "green", "itile--lg") +
        "<div>" +
          '<p class="card__kicker">' + nw("Diferença total") + " · " + nw(S.years + " anos") + "</p>" +
          '<h3 class="invcard__title" id="dec-total-title">E no fim dos ' + S.years + " anos?</h3>" +
          '<p class="invcard__sub">Some a diferença entre as duas de cada decisão para chegar à diferença total.</p>' +
        "</div>" +
      "</div>" +
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
    shown: "Resposta mostrada.",
    invalid: "Não deu para entender esse valor. Confira o que foi digitado: vale o número, como 1800 ou 1.800,00.",
    missing: "Falta calcular."
  };
  var STATES = ["ok", "shown", "wrong", "invalid", "missing"];

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
    var solved = st === "ok" || st === "shown";
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
      if (!c.open) return c.ok ? "Você acertou a diferença total!" : "A resposta foi mostrada.";
      if (Ex.blocked("total")) return "Termine as " + n + " decisões para calcular a diferença total.";
      return Ex.wasChecked("total")
        ? "Ainda não é esse valor. Veja a dica e confira de novo."
        : "As " + n + " decisões estão prontas. Faça a soma e confira.";
    }
    if (!c.open) {
      if (!c.shown) return "Decisão concluída: você acertou os " + c.total + " cálculos!";
      if (!c.ok) return "Decisão concluída: as respostas foram mostradas.";
      return "Decisão concluída: " + plural(c.ok, "cálculo certo", "cálculos certos") + " e " +
        plural(c.shown, "resposta mostrada", "respostas mostradas") + ".";
    }
    if (!Ex.wasChecked(group)) return "Preencha os " + c.total + " cálculos em branco e confira.";
    return c.ok + " de " + c.total + " cálculos certos. Corrija ou preencha os que faltam e confira de novo.";
  }

  function syncGroup(group) {
    Ex.fieldsOf(group).forEach(syncField);
    var card = cardEl(group);
    var finished = Ex.isDone(group);
    card.classList.toggle("is-done", finished);
    card.querySelector("[data-check]").hidden = finished;
    card.querySelector("[data-show]").hidden = finished || !Ex.wasChecked(group);
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

  // Os medidores do alto: quantos cálculos o aluno acertou (a barra mais
  // clara depois dela são as respostas mostradas) e quantas decisões já
  // terminaram.
  function syncMeters() {
    var c = Ex.counts();
    var n = Catalog.list.length;
    var d = Ex.decisionsDone();
    document.getElementById("meter-ok-used").textContent = String(c.ok);
    document.getElementById("meter-ok-fill").style.width = (c.ok / c.total * 100) + "%";
    document.getElementById("meter-ok-shown").style.width = (c.shown / c.total * 100) + "%";
    document.getElementById("meter-dec-used").textContent = String(d);
    document.getElementById("meter-dec-fill").style.width = (d / n * 100) + "%";
  }

  function sync() {
    Ex.groups().forEach(syncGroup);
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

  /* ============ conferir e mostrar ============ */
  // põe o foco numa parte que acabou de aparecer logo abaixo, rolando só o
  // necessário pra ela ficar à vista
  function mostrarPerto(el) {
    el.focus({ preventScroll: true });
    el.scrollIntoView({ behavior: semAnimacao ? "auto" : "smooth", block: "nearest" });
  }

  // Depois de conferir ou mostrar, a tela acompanha. Se o grupo terminou, o
  // botão que estava com o foco sumiu: o foco vai pra pergunta de discussão
  // (numa decisão) ou pro resultado final (o app.js cuida, pelo onChange).
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

  function mostrar(group) {
    var err = Ex.show(group);
    if (err) {
      Toast.show(err);
      return;
    }
    Toast.hide();
    Ex.fieldsOf(group).forEach(function (f) { delete mark[f.id]; });
    depois(group);
  }

  /* ============ eventos ============ */
  function handleClick(e) {
    var b = e.target.closest("[data-check]");
    if (b) { conferir(b.getAttribute("data-check")); return; }
    b = e.target.closest("[data-show]");
    if (b) { mostrar(b.getAttribute("data-show")); return; }
    var go = e.target.closest("[data-go]");
    if (go) {
      e.preventDefault();
      show(Number(go.getAttribute("data-go")));
    }
  }

  // o aluno digitou: guarda, e a marca da última conferência sai daquele
  // campo (ele está corrigindo)
  function handleInput(e) {
    var input = e.target.closest("[data-field]");
    if (!input || input.readOnly) return;
    var id = input.getAttribute("data-field");
    Ex.setText(id, input.value);
    delete mark[id];
    syncField(Ex.field(id));
  }

  // Enter vai pra próxima célula em aberto do cartão, como numa planilha. Na
  // última, confere.
  function handleKey(e) {
    if (e.key !== "Enter") return;
    var input = e.target.closest("[data-field]");
    if (!input) return;
    e.preventDefault();
    var card = input.closest("[data-group]");
    var all = Array.prototype.slice.call(card.querySelectorAll("[data-field]"));
    var next = all.slice(all.indexOf(input) + 1).filter(function (x) { return !x.readOnly; })[0];
    if (next) next.focus();
    else conferir(card.getAttribute("data-group"));
  }

  /* ============ API ============ */
  function render() {
    mark = {};
    root.innerHTML = Catalog.list.map(cardHTML).join("") + totalHTML();
    Icons.mount(root);
    sync();
  }

  function mount(container, goToCallback, changeCallback) {
    root = container;
    goTo = goToCallback || null;
    onChange = changeCallback || null;
    render();
    root.addEventListener("click", handleClick);
    root.addEventListener("input", handleInput);
    root.addEventListener("keydown", handleKey);

    document.getElementById("meter-ok-max").textContent = String(Ex.counts().total);
    document.getElementById("meter-dec-max").textContent = String(Catalog.list.length);

    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    syncStuck();
  }

  // leva até o cartão de uma decisão (a linha do tempo e o cartão da
  // diferença total usam)
  function show(id) {
    if (goTo) goTo(cardEl(String(id)));
  }

  global.SheetView = {
    mount: mount,
    render: render,
    sync: sync,
    show: show
  };
})(window);
