(function (global) {
  "use strict";

  var Catalog = global.Rounds;
  var Game = global.Game;
  var Format = global.Format;
  var Toast = global.Toast;
  var Icons = global.Icons;

  // As rodadas do jogo, uma de cada vez, como no Kahoot. Cada rodada é um
  // cartão com a situação do slide e as duas opções em botões grandes, cada
  // uma com a sua forma e a sua cor. Quando a rodada abre, uma contagem
  // (3, 2, 1) segura as opções, pra todo mundo ler a situação antes.
  //
  // O aluno toca numa opção e a escolha vale na hora: o cartão mostra o tipo
  // da escolha, os pontos que ela deu (como na tabela do slide) e o que a
  // outra opção teria dado. Aí aparece o botão da próxima rodada.
  //
  // Em cima dos cartões ficam as etapas (uma por rodada) e o placar, que
  // gruda no alto: as rodadas respondidas e os pontos de cada categoria.

  var root = null;      // o container das etapas e dos cartões
  var on = {};          // avisa o game-app.js: picked(id) e final()
  var active = null;    // a rodada que está na tela: "1" a "5"
  var ready = {};       // as rodadas em que a contagem já acabou
  var timer = null;     // a contagem em andamento
  var shown = null;     // os pontos que o placar do alto está mostrando

  // a contagem antes das opções aparecerem: 3, 2, 1, um número a cada PASSO
  var CONTAGEM = 3;
  var PASSO = 750;

  var semAnimacao = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function nw(s) { return '<span class="nw">' + Format.esc(s) + "</span>"; }
  function el(id) { return document.getElementById(id); }

  function nextOf(id) {
    var list = Game.ids();
    return list[list.indexOf(String(id)) + 1] || null;
  }

  /* ============ montagem da tela ============ */
  // A forma de cada opção, como no Kahoot: triângulo, losango, círculo e
  // quadrado (C e D ficam prontos, caso uma rodada ganhe mais opções).
  var SHAPES = {
    A: '<path d="M12 3.2l9.8 17H2.2z"/>',
    B: '<path d="M12 2l10 10-10 10L2 12z"/>',
    C: '<circle cx="12" cy="12" r="9.5"/>',
    D: '<rect x="3" y="3" width="18" height="18" rx="2.5"/>'
  };
  function shape(letter, cls) {
    return '<svg class="' + cls + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (SHAPES[letter] || SHAPES.C) + "</svg>";
  }

  // a etiqueta pequena de uma opção, com a forma e a letra na cor dela (vai
  // no que a escolha deu e na tabela do placar)
  function letterHTML(letter) {
    return '<span class="rletter rletter--' + letter.toLowerCase() + '">' + shape(letter, "rletter__shape") + letter + "</span>";
  }

  // As etapas, em cima dos cartões: uma por rodada. Tocar numa leva até ela,
  // se ela já abriu.
  function stepsHTML() {
    return '<nav class="card steps" id="steps" aria-label="Rodadas do jogo"><ol class="steps__list">' +
      Catalog.list.map(function (r) {
        var id = String(r.id);
        return '<li class="steps__item" data-step-item="' + id + '">' +
          '<button class="steps__btn" type="button" data-step="' + id + '">' +
            '<span class="steps__num" aria-hidden="true">' + id + "</span>" +
            '<span class="steps__kicker">Rodada ' + id + "</span>" +
            '<span class="steps__name">' + Format.esc(r.topic) +
              '<span class="sr-only" data-step-state></span></span>' +
          "</button>" +
          "</li>";
      }).join("") +
      "</ol></nav>";
  }

  // um botão de opção: a forma na cor dela, a letra e o texto do slide
  function optHTML(r, letter) {
    return '<button class="ropt ropt--' + letter.toLowerCase() + '" type="button" data-pick="' + letter + '" data-round="' + r.id + '">' +
      '<span class="ropt__badge" aria-hidden="true">' + shape(letter, "ropt__shape") + "</span>" +
      '<span class="ropt__body">' +
        '<span class="ropt__letter">Opção ' + letter + "</span>" +
        '<span class="ropt__text">' + Format.esc(r.options[letter].text) + "</span>" +
      "</span>" +
      '<span class="ropt__mark">Sua escolha</span>' +
      "</button>";
  }

  // o pé do cartão: o que fazer agora e o botão da próxima rodada (ou, na
  // última, o do placar)
  function footHTML(r) {
    var next = nextOf(r.id);
    return '<div class="sfoot">' +
      '<p class="sfoot__status" data-status aria-live="polite"></p>' +
      '<div class="sfoot__btns">' +
        (next
          ? '<button class="btn btn--primary glass fx" type="button" data-next="' + next + '" hidden>' +
              "Ir para a Rodada " + next + '<span data-icon="avancar"></span></button>'
          : '<button class="btn btn--primary glass fx" type="button" data-final hidden>' +
              '<span data-icon="trofeu"></span>Ver o meu placar</button>') +
      "</div>" +
      "</div>";
  }

  function cardHTML(r) {
    var id = String(r.id);
    return '<article class="card deccard rcard panel" id="r-' + id + '" data-card="' + id + '" tabindex="-1" aria-labelledby="r-' + id + '-title">' +
      '<div class="head fx">' + Icons.tile(r.icon, "violet", "itile--lg") +
        "<div>" +
          '<p class="card__kicker">' + nw("Rodada " + id + " de " + Catalog.list.length) + " · " + nw(r.topic) + "</p>" +
          '<h3 class="invcard__title" id="r-' + id + '-title">' + Format.esc(r.situation) + "</h3>" +
          '<p class="invcard__sub">' + Format.esc(r.question) + "</p>" +
        "</div>" +
      "</div>" +
      // a contagem fica por cima das opções (que ocupam o lugar delas, só
      // escondidas): quando elas aparecem, nada pula de lugar
      '<div class="rstage" data-stage>' +
        '<div class="ropts" role="group" aria-label="Opções da Rodada ' + id + '">' +
          Catalog.letters.map(function (l) { return optHTML(r, l); }).join("") +
        "</div>" +
        '<div class="rready" data-ready aria-hidden="true" hidden>' +
          '<span class="rready__ring"><span class="rready__num" data-ready-num></span></span>' +
          '<span class="rready__text">Leia a situação: as opções já vão aparecer</span>' +
        "</div>" +
      "</div>" +
      '<div class="rreveal" data-reveal tabindex="-1" hidden></div>' +
      footHTML(r) +
      "</article>";
  }

  /* ============ o que a escolha deu ============ */
  // O número grande dos pontos, um por categoria que a escolha mexe (quase
  // sempre uma só). Sem ponto nenhum, aparece o 0.
  function bigPointsHTML(pts) {
    var cats = Catalog.categories.filter(function (c) { return pts[c.key]; });
    if (!cats.length) {
      return '<div class="rpts" data-tone="zero"><span class="rpts__num">0</span><span class="rpts__cat">pontos</span></div>';
    }
    return cats.map(function (c) {
      var v = pts[c.key];
      return '<div class="rpts" data-tone="' + Game.toneOf(c.key, v) + '">' +
        '<span class="rpts__num">' + Format.points(v) + "</span>" +
        '<span class="rpts__cat">' + Format.esc(c.name) + "</span>" +
        "</div>";
    }).join("");
  }

  // a linha da tabela do slide: a escolha e o impacto em cada categoria
  function tableRowHTML(r, letter, pts) {
    return '<div class="rrow">' +
      '<p class="rrow__title">Na sua tabela</p>' +
      '<dl class="rrow__cells">' +
        '<div class="rrow__cell rrow__cell--pick"><dt>Minha escolha</dt>' +
          '<dd>' + letterHTML(letter) +
          Format.esc(r.options[letter].text) + "</dd></div>" +
        Catalog.categories.map(function (c) {
          var v = pts[c.key];
          return '<div class="rrow__cell"><dt>Impacto ' + Format.esc(c.where) + "</dt>" +
            '<dd class="rrow__num" data-tone="' + Game.toneOf(c.key, v) + '">' + Format.points(v) + "</dd></div>";
        }).join("") +
      "</dl>" +
      "</div>";
  }

  // o que a outra opção teria dado
  function otherHTML(r, letter) {
    var kind = Game.kindOf(r, letter);
    return '<p class="rother">' +
      letterHTML(letter) +
      "<span><strong>Se fosse a Opção " + letter + "</strong> (" + Format.esc(r.options[letter].text) + "): " +
      Format.esc(kind.label.toLowerCase()) + ", " + nw(Game.effectText(Game.pointsOf(r, letter))) + ".</span>" +
      "</p>";
  }

  function revealHTML(r, letter) {
    var kind = Game.kindOf(r, letter);
    var pts = Game.pointsOf(r, letter);
    return '<div class="rreveal__main">' +
        '<div class="rreveal__pts" aria-hidden="true">' + bigPointsHTML(pts) + "</div>" +
        '<div class="rreveal__body">' +
          '<p class="rreveal__kind">' + Icons.tile(kind.icon, kind.tone, "itile--sm") +
            "<span>" + Format.esc(kind.label) + '<span class="sr-only">: ' + Format.esc(Game.effectText(pts)) + ".</span></span></p>" +
          '<p class="rreveal__why">' + Format.esc(r.options[letter].why) + "</p>" +
        "</div>" +
      "</div>" +
      tableRowHTML(r, letter, pts) +
      Catalog.letters.filter(function (l) { return l !== letter; }).map(function (l) { return otherHTML(r, l); }).join("");
  }

  /* ============ a tela acompanha o estado ============ */
  // Os cartões são montados uma vez só e depois só atualizados.
  function cardEl(id) { return root.querySelector('[data-card="' + id + '"]'); }

  function statusText(id, letter, waiting) {
    var n = Catalog.list.length;
    if (waiting) return "Prepare-se: as opções já vão aparecer.";
    if (!letter) return "Toque na Opção A ou na Opção B. Vale a primeira escolha: depois não dá para trocar.";
    if (Game.isOver() && !nextOf(id)) return "Você respondeu as " + n + " rodadas! Veja quantos pontos fez em cada categoria.";
    return "Rodada " + id + " respondida: " + Game.effectText(Game.pointsOf(Catalog.byId(id), letter)) + ".";
  }

  function syncCard(id) {
    var card = cardEl(id);
    var r = Catalog.byId(id);
    var letter = Game.pickOf(id);
    var waiting = !letter && !ready[id];

    card.hidden = id !== active;
    card.classList.toggle("is-done", !!letter);
    card.querySelector("[data-stage]").classList.toggle("is-waiting", waiting);
    card.querySelector("[data-ready]").hidden = !waiting;

    Array.prototype.forEach.call(card.querySelectorAll("[data-pick]"), function (b) {
      var l = b.getAttribute("data-pick");
      b.classList.toggle("is-picked", l === letter);
      b.classList.toggle("is-other", !!letter && l !== letter);
      // respondida, a rodada não muda mais: os botões ficam só pra ver
      b.disabled = !!letter || waiting;
    });

    var reveal = card.querySelector("[data-reveal]");
    if (letter && reveal.getAttribute("data-letter") !== letter) {
      reveal.innerHTML = revealHTML(r, letter);
      reveal.setAttribute("data-letter", letter);
    }
    reveal.hidden = !letter;

    var next = card.querySelector("[data-next],[data-final]");
    next.hidden = !letter;

    // o status é anunciado pelo leitor de tela: só muda quando o texto muda
    var status = card.querySelector("[data-status]");
    var txt = statusText(id, letter, waiting);
    if (status.textContent !== txt) status.textContent = txt;
  }

  // As etapas acompanham: as respondidas ganham o selo, a que está na tela
  // fica marcada e as que ainda não abriram ficam apagadas.
  function syncSteps() {
    Game.ids().forEach(function (id) {
      var item = root.querySelector('[data-step-item="' + id + '"]');
      var btn = item.querySelector("[data-step]");
      var ok = !!Game.pickOf(id);
      var locked = !!Game.blocked(id);
      item.classList.toggle("is-done", ok);
      item.classList.toggle("is-active", id === active);
      item.classList.toggle("is-locked", locked);
      if (id === active) btn.setAttribute("aria-current", "step");
      else btn.removeAttribute("aria-current");
      item.querySelector("[data-step-state]").textContent = locked ? " (bloqueada)" : ok ? " (respondida)" : "";
    });
  }

  // O placar do alto: as rodadas respondidas e os pontos de cada categoria.
  // A barrinha dos pontos sai do meio: pra direita quando soma, pra
  // esquerda (em vermelho) quando tira. Todas na mesma escala, a do maior
  // placar possível. O número que mudou dá um pulinho.
  function scale() {
    var r = Game.range();
    var m = 1;
    Catalog.categories.forEach(function (c) { m = Math.max(m, Math.abs(r[c.key].min), Math.abs(r[c.key].max)); });
    return m;
  }

  function syncMeters() {
    var n = Catalog.list.length;
    var a = Game.answered();
    el("meter-rounds-used").textContent = String(a);
    el("meter-rounds-fill").style.width = (a / n * 100) + "%";

    var t = Game.totals();
    var s = scale();
    Catalog.categories.forEach(function (c) {
      var box = el("meters").querySelector('[data-cat="' + c.key + '"]');
      var v = t[c.key];
      var num = box.querySelector("[data-cat-pts]");
      var fill = box.querySelector("[data-cat-fill]");
      var w = Math.abs(v) / s * 50;
      num.textContent = Format.points(v);
      box.setAttribute("data-sign", v < 0 ? "down" : v > 0 ? "up" : "zero");
      fill.style.left = (v < 0 ? 50 - w : 50) + "%";
      fill.style.width = w + "%";
      if (shown && shown[c.key] !== v) {
        num.classList.remove("is-bump");
        void num.offsetWidth;
        num.classList.add("is-bump");
      }
    });
    shown = t;
  }

  function sync() {
    Game.ids().forEach(syncCard);
    syncSteps();
    syncMeters();
  }

  function catMetersHTML() {
    return Catalog.categories.map(function (c) {
      return '<div class="meter meter--score fx" data-cat="' + c.key + '" data-tone="' + c.tone + '">' +
        '<div class="meter__top">' +
          '<p class="meter__label"><span class="meter__ico">' + Icons.svg(c.icon) + "</span>" + Format.esc(c.name) + "</p>" +
          '<p class="meter__nums"><span class="meter__used meter__pts" data-cat-pts>0</span><span class="meter__more">&nbsp;pts</span></p>' +
        "</div>" +
        '<span class="meter__track meter__track--mid" aria-hidden="true"><span class="meter__fill" data-cat-fill></span></span>' +
        "</div>";
    }).join("");
  }

  /* ============ placar grudado no alto ============ */
  var quadroPedido = false;

  function syncStuck() {
    var meters = el("meters");
    if (!meters.offsetParent) return;
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

  /* ============ a contagem ============ */
  // 3, 2, 1 e as opções aparecem. Só na primeira vez que a rodada abre (e
  // quem pede menos movimento não espera: as opções já vêm prontas).
  function parar() {
    clearInterval(timer);
    timer = null;
  }

  function contar(id) {
    parar();
    if (Game.pickOf(id) || ready[id]) return;
    if (semAnimacao) {
      ready[id] = true;
      syncCard(id);
      return;
    }
    var card = cardEl(id);
    var num = card.querySelector("[data-ready-num]");
    var n = CONTAGEM;
    function tick() {
      num.textContent = String(n);
      num.classList.remove("is-tick");
      void num.offsetWidth;
      num.classList.add("is-tick");
    }
    syncCard(id);
    tick();
    timer = setInterval(function () {
      n--;
      if (n > 0) { tick(); return; }
      parar();
      ready[id] = true;
      var stage = card.querySelector("[data-stage]");
      stage.classList.remove("is-in");
      void stage.offsetWidth;
      stage.classList.add("is-in");
      syncCard(id);
    }, PASSO);
  }

  /* ============ as rodadas ============ */
  // Abre uma rodada, se ela já abriu (senão, o aviso diz o que falta). A
  // tela vai até as etapas e o foco vai pro cartão, que o leitor de tela
  // anuncia.
  function abrir(id) {
    id = String(id);
    var err = Game.blocked(id);
    if (err) {
      Toast.show(err);
      return;
    }
    Toast.hide();
    parar();
    active = id;
    sync();
    contar(id);
    el("steps").scrollIntoView({ behavior: semAnimacao ? "auto" : "smooth", block: "start" });
    cardEl(id).focus({ preventScroll: true });
  }

  // O aluno escolheu: a escolha vale na hora. O foco vai pro que a escolha
  // deu (o botão tocado ficou desativado) e a tela rola só o necessário
  // pro botão da próxima rodada ficar à vista.
  function escolher(id, letter) {
    var err = Game.pick(id, letter);
    if (err) {
      Toast.show(err);
      return;
    }
    Toast.hide();
    sync();
    var card = cardEl(id);
    card.querySelector("[data-reveal]").focus({ preventScroll: true });
    card.querySelector(".sfoot").scrollIntoView({ behavior: semAnimacao ? "auto" : "smooth", block: "nearest" });
    if (on.picked) on.picked(id);
  }

  /* ============ eventos ============ */
  function handleClick(e) {
    var b = e.target.closest("[data-pick]");
    if (b) { escolher(b.getAttribute("data-round"), b.getAttribute("data-pick")); return; }
    b = e.target.closest("[data-next]");
    if (b) { abrir(b.getAttribute("data-next")); return; }
    b = e.target.closest("[data-step]");
    if (b) { abrir(b.getAttribute("data-step")); return; }
    if (e.target.closest("[data-final]") && on.final) on.final();
  }

  /* ============ API ============ */
  // monta as etapas e os cartões, com a rodada em que o aluno está aberta
  // (a contagem só começa no begin(), quando as rodadas aparecem)
  function render() {
    parar();
    ready = {};
    shown = null;
    active = Game.current();
    root.innerHTML = stepsHTML() + Catalog.list.map(cardHTML).join("");
    Icons.mount(root);
    sync();
  }

  function mount(container, handlers) {
    root = container;
    on = handlers || {};
    el("meters").insertAdjacentHTML("beforeend", catMetersHTML());
    el("meter-rounds-max").textContent = String(Catalog.list.length);
    render();
    root.addEventListener("click", handleClick);
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
  }

  // As rodadas acabaram de aparecer: abre a rodada em que o aluno está e a
  // contagem dela começa. go = true leva a tela até lá (no "Começar o
  // jogo"); ao recarregar a página, a tela fica onde o navegador deixou.
  function begin(go) {
    if (go) {
      abrir(Game.current());
    } else {
      active = Game.current();
      sync();
      contar(active);
    }
    syncStuck();
  }

  global.PlayView = {
    mount: mount,
    render: render,
    begin: begin,
    show: abrir,
    letter: letterHTML
  };
})(window);
