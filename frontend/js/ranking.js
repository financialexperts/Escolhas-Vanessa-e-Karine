(function (global) {
  "use strict";

  var Catalog = global.Rounds;
  var Format = global.Format;
  var Icons = global.Icons;

  // O ranking do jogo: quem fez mais pontos em cada categoria (receita,
  // patrimônio...), entre todo mundo que jogou. Os resultados ficam no
  // Supabase do login, na tabela game_scores: uma linha por aluno, com o
  // apelido, o nome que ele cadastrou no login e os pontos de cada
  // categoria. Jogando de novo, a linha é atualizada.
  //
  // A tabela é criada uma vez, no SQL Editor do Supabase. Sem ela, o
  // jogo funciona igual e o ranking mostra o aviso de que falta criá-la.

  var GAME = "dinheiro-no-tempo";
  var TABLE = "game_scores";
  var TOP = 10;         // quantos aparecem na categoria escolhida (3 no pódio)
  var POLL = 15000;     // de quanto em quanto tempo o ranking se atualiza sozinho

  var box = null;       // o container do ranking
  var ctx = null;       // { userId, name, nickname, result }
  var timer = null;
  var busy = false;
  var rows = null;      // os resultados da última leitura (a troca de aba não lê de novo)
  var active = Catalog.categories[0].key;   // a categoria escolhida nas abas

  function db() { return global.DB && global.DB.client; }
  function nw(s) { return '<span class="nw">' + Format.esc(s) + "</span>"; }

  /* ============ o banco ============ */
  // salva (ou atualiza) o resultado de quem jogou; devolve o erro ou null
  function save(c) {
    if (!db()) return Promise.resolve({ message: "sem banco" });
    return db().from(TABLE).upsert({
      user_id: c.userId,
      game: GAME,
      player_name: c.name,
      nickname: c.nickname,
      scores: c.result.scores,
      picks: c.result.picks,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id,game" }).then(function (res) {
      return res.error || null;
    }, function (err) { return err || { message: "network" }; });
  }

  function load() {
    if (!db()) return Promise.resolve({ error: { message: "sem banco" } });
    return db().from(TABLE).select("user_id,player_name,nickname,scores")
      .eq("game", GAME).limit(1000)
      .then(function (res) {
        return res.error ? { error: res.error } : { rows: res.data || [] };
      }, function (err) { return { error: err || { message: "network" } }; });
  }

  // o aviso de cada erro, do jeito que o professor e o aluno entendem
  function errorText(err) {
    var msg = (err && (err.message || err.code)) || "";
    // a tabela existe, mas é a da versão antiga do SQL (a do código da turma)
    if (/column|ON CONFLICT/i.test(msg)) {
      return "O ranking precisa de uma atualização no banco: falta rodar no Supabase o SQL novo da tabela game_scores.";
    }
    if (/relation .* does not exist|42P01|could not find the table|schema cache/i.test(msg)) {
      return "O ranking ainda não está ligado: falta criar a tabela game_scores no Supabase.";
    }
    // a tabela existe, mas não foi liberada pra quem está logado (GRANT)
    if (/permission denied|42501/i.test(msg + " " + (err && err.code))) {
      return "O ranking ainda não tem permissão no banco: falta liberar a tabela game_scores para quem está logado, no Supabase.";
    }
    if (/failed to fetch|network/i.test(msg)) return "Sem conexão com o servidor. Confira a internet e toque em Atualizar.";
    // outro erro: o detalhe técnico vai junto, pra dar pra descobrir o que foi
    return "Não deu para carregar o ranking agora. Toque em Atualizar para tentar de novo." +
      (msg ? " (Detalhe: " + msg + ")" : "");
  }

  /* ============ as posições ============ */
  // o nome que aparece em destaque: o apelido ou, sem apelido, o do login
  function shownName(row) { return row.nickname || row.player_name || ""; }

  // As posições numa categoria, com empate dividindo a posição ("1º, 1º,
  // 3º"); no empate, a ordem é a do nome.
  function positions(rows, key) {
    var sorted = rows.slice().sort(function (a, b) {
      return ((b.scores || {})[key] || 0) - ((a.scores || {})[key] || 0) ||
        shownName(a).localeCompare(shownName(b), "pt-BR");
    });
    var pos = 0;
    var prev = null;
    return sorted.map(function (row, i) {
      var v = (row.scores || {})[key] || 0;
      if (v !== prev) { pos = i + 1; prev = v; }
      return { pos: pos, row: row, v: v };
    });
  }

  function isMine(item) { return item.row.user_id === ctx.userId; }
  function toneOf(v, c) { return v < 0 ? "down" : v > 0 ? c.tone : "zero"; }

  // as iniciais do nome, pro círculo de cada um ("Lucão do Investimento" vira
  // "LI", "Duda" vira "D")
  function initials(name) {
    var words = String(name).trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "?";
    var first = Array.from(words[0])[0];
    var last = words.length > 1 ? Array.from(words[words.length - 1])[0] : "";
    return (first + last).toUpperCase();
  }

  // o apelido em destaque, com o nome do login embaixo (sem apelido, só o
  // nome), e o "você" em quem está jogando
  function nameHTML(item) {
    var real = item.row.nickname && item.row.player_name
      ? '<span class="rrank__real">' + Format.esc(item.row.player_name) + "</span>" : "";
    return '<span class="rrank__name">' +
      '<span class="rrank__line"><span class="rrank__who">' + Format.esc(shownName(item.row)) + "</span>" +
        (isMine(item) ? '<span class="rrank__me">você</span>' : "") + "</span>" +
      real +
      "</span>";
  }

  // O pódio: os 3 primeiros, com o 1º no meio e mais alto, como no fim do
  // Kahoot. Na página eles vêm em ordem (1º, 2º, 3º, pro leitor de tela); o
  // CSS é que põe o 2º à esquerda e o 3º à direita.
  function podiumHTML(list, c) {
    return '<ol class="rpodium" aria-label="Pódio ' + Format.esc(c.where) + '">' +
      list.slice(0, 3).map(function (item) {
        return '<li class="rpodium__spot rpodium__spot--' + item.pos + (isMine(item) ? " is-me" : "") + '">' +
          '<span class="rpodium__avatar" aria-hidden="true">' + Format.esc(initials(shownName(item.row))) + "</span>" +
          nameHTML(item) +
          '<span class="rpodium__pts" data-tone="' + toneOf(item.v, c) + '">' + Format.points(item.v) + "</span>" +
          '<span class="rpodium__step"><span class="rpodium__pos">' + item.pos + "º</span></span>" +
          "</li>";
      }).join("") +
      "</ol>";
  }

  // Uma linha da lista, do 4º pra baixo: a posição, as iniciais, o nome e os
  // pontos. O --i escalona a entrada das linhas.
  function rowHTML(item, c, i) {
    var medal = item.pos <= 3 ? " rrank__pos--" + item.pos : "";
    return '<li class="rrank__row' + (isMine(item) ? " is-me" : "") + '" style="--i:' + i + '">' +
      '<span class="rrank__pos' + medal + '">' + item.pos + "º</span>" +
      '<span class="rrank__avatar" aria-hidden="true">' + Format.esc(initials(shownName(item.row))) + "</span>" +
      nameHTML(item) +
      '<span class="rrank__pts" data-tone="' + toneOf(item.v, c) + '">' + Format.points(item.v) + "</span>" +
      "</li>";
  }

  // "Você está em 3º lugar na receita, entre 8 jogadores."
  function youHTML(list, c) {
    var me = list.filter(isMine)[0];
    if (!me || list.length < 2) return "";
    var tie = list.filter(function (x) { return x.pos === me.pos; }).length > 1;
    return '<p class="granking__you">Você está em <strong>' + me.pos + "º lugar</strong> " + Format.esc(c.where) +
      (tie ? ", com empate," : ",") + " entre " + nw(list.length + " jogadores") + ".</p>";
  }

  /* ============ a tela ============ */
  function headHTML(n) {
    return '<div class="granking__head">' +
      "<div>" +
        '<p class="gtable__title">' + Icons.tile("trofeu", "amber", "itile--xs") + "Ranking geral</p>" +
        '<p class="granking__sub" data-rank-sub>' +
          (n == null ? "Carregando…" :
            n === 1 ? "Por enquanto, só você jogou. Quando a turma jogar, o pódio aparece aqui."
            : "Entre " + nw(n + " jogadores") + ". Escolha a categoria pra ver quem fez mais pontos nela.") +
        "</p>" +
      "</div>" +
      '<button class="btn btn--ghost glass btn--sm fx" type="button" title="Atualizar o ranking" data-rank-refresh><span data-icon="recomecar"></span><span class="granking__btntext">Atualizar</span></button>' +
      "</div>";
  }

  // As abas das categorias, cada uma com a posição de quem está jogando
  // nela: dá pra ver de relance onde ele foi melhor.
  function tabsHTML(lists) {
    return '<div class="granking__tabs" role="tablist" aria-label="Categoria do ranking">' +
      Catalog.categories.map(function (c) {
        var on = c.key === active;
        var me = lists[c.key].filter(isMine)[0];
        return '<button class="granking__tab" type="button" role="tab" id="rk-tab-' + c.key + '" data-rank-tab="' + c.key + '"' +
          ' data-tone="' + c.tone + '" aria-selected="' + on + '" aria-controls="rk-panel" tabindex="' + (on ? "0" : "-1") + '">' +
          Icons.tile(c.icon, c.tone, "itile--xs") +
          '<span class="granking__tabname">' + Format.esc(c.name) + "</span>" +
          (me ? '<span class="granking__tabpos"><span class="granking__tabvoce">você em </span>' + me.pos + "º</span>" : "") +
          "</button>";
      }).join("") +
      "</div>";
  }

  // A categoria escolhida: onde o aluno ficou, o pódio e, do 4º ao TOP, a
  // lista (com a linha dele no fim, se ele ficou mais pra baixo).
  function panelHTML(lists, animate) {
    var c = Catalog.categories.filter(function (k) { return k.key === active; })[0];
    var list = lists[c.key];
    var rest = list.slice(3, TOP);
    var me = list.filter(isMine)[0];
    var extra = me && list.indexOf(me) >= TOP;
    var more = rest.length || extra;
    return '<div class="granking__panel' + (animate ? " is-anim" : "") + '" id="rk-panel" role="tabpanel" tabindex="0"' +
      ' aria-labelledby="rk-tab-' + c.key + '" data-tone="' + c.tone + '">' +
      youHTML(list, c) +
      '<div class="granking__body' + (more ? "" : " is-solo") + '">' +
        podiumHTML(list, c) +
        (more ? '<ol class="rrank__list">' +
          rest.map(function (x, i) { return rowHTML(x, c, i); }).join("") +
          (extra ? '<li class="rrank__gap" aria-hidden="true">…</li>' + rowHTML(me, c, rest.length) : "") +
          "</ol>" : "") +
      "</div>" +
      "</div>";
  }

  // Desenha o ranking. animate: o pódio sobe e as linhas entram (na
  // primeira vez e na troca de aba; a atualização sozinha não mexe). O foco
  // que estava no ranking volta pro mesmo lugar (ou pro focusSel, quando
  // for outro).
  function render(state, animate, focusSel) {
    var f = document.activeElement;
    if (!focusSel && f && box.contains(f)) {
      focusSel = f.hasAttribute("data-rank-tab") ? '[data-rank-tab="' + f.getAttribute("data-rank-tab") + '"]'
        : f.hasAttribute("data-rank-refresh") ? "[data-rank-refresh]"
        : f.id === "rk-panel" ? "#rk-panel" : null;
    }
    if (state.error) {
      box.innerHTML = headHTML(null) + '<p class="granking__msg">' + Format.esc(errorText(state.error)) + "</p>";
      box.querySelector("[data-rank-sub]").textContent = "";
    } else {
      rows = state.rows;
      var lists = listsOf(rows);
      box.innerHTML = headHTML(rows.length) + tabsHTML(lists) + panelHTML(lists, animate);
    }
    Icons.mount(box);
    var t = focusSel && box.querySelector(focusSel);
    if (t) t.focus({ preventScroll: true });
  }

  function listsOf(all) {
    var lists = {};
    Catalog.categories.forEach(function (c) { lists[c.key] = positions(all, c.key); });
    return lists;
  }

  // Troca a categoria escolhida, sem ler o banco de novo: as abas ficam (e o
  // foco nelas) e só o painel embaixo muda.
  function choose(key, focusTab) {
    var panel = box.querySelector("#rk-panel");
    if (!rows || !panel || key === active) return;
    active = key;
    box.querySelectorAll("[data-rank-tab]").forEach(function (t) {
      var on = t.getAttribute("data-rank-tab") === key;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panel.outerHTML = panelHTML(listsOf(rows), true);
    if (focusTab) box.querySelector('[data-rank-tab="' + key + '"]').focus();
  }

  // as setas, o Home e o End andam entre as abas, como numa lista de abas
  function onKey(e) {
    var tab = e.target.closest("[data-rank-tab]");
    if (!tab) return;
    var keys = Catalog.categories.map(function (c) { return c.key; });
    var i = keys.indexOf(tab.getAttribute("data-rank-tab"));
    var next = e.key === "ArrowRight" ? (i + 1) % keys.length
      : e.key === "ArrowLeft" ? (i - 1 + keys.length) % keys.length
      : e.key === "Home" ? 0
      : e.key === "End" ? keys.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    choose(keys[next], true);
  }

  // Salva o resultado de quem está jogando e carrega o ranking. O resultado
  // dele sempre aparece, mesmo que a leitura venha antes da gravação
  // terminar.
  function refresh(withSave) {
    if (busy || !ctx) return;
    busy = true;
    var saving = withSave ? save(ctx) : Promise.resolve(null);
    saving.then(function (saveErr) {
      return load().then(function (state) {
        busy = false;
        if (!box || !ctx) return;
        if (state.error || (saveErr && !state.rows.length)) {
          render({ error: state.error || saveErr });
          return;
        }
        var list = state.rows.filter(function (r) { return r.user_id !== ctx.userId; });
        list.push({ user_id: ctx.userId, player_name: ctx.name, nickname: ctx.nickname, scores: ctx.result.scores });
        // o pódio sobe só na primeira vez; a atualização sozinha não mexe
        render({ rows: list }, rows === null);
      });
    });
  }

  function poll() {
    clearInterval(timer);
    timer = setInterval(function () {
      if (document.hidden || !box || !box.offsetParent) return;
      refresh(false);
    }, POLL);
  }

  /* ============ API ============ */
  // mostra o ranking de quem acabou de jogar: { userId, name (o nome do
  // login), nickname, result }
  function show(container, c) {
    box = container;
    ctx = c;
    rows = null;
    box.innerHTML = headHTML(null);
    Icons.mount(box);
    if (!box.getAttribute("data-bound")) {
      box.setAttribute("data-bound", "1");
      box.addEventListener("click", function (e) {
        if (e.target.closest("[data-rank-refresh]")) { refresh(false); return; }
        var tab = e.target.closest("[data-rank-tab]");
        if (tab) choose(tab.getAttribute("data-rank-tab"), false);
      });
      box.addEventListener("keydown", onKey);
    }
    refresh(true);
    poll();
  }

  function hide() {
    clearInterval(timer);
    timer = null;
    ctx = null;
  }

  global.Ranking = {
    save: save,
    show: show,
    hide: hide
  };
})(window);
