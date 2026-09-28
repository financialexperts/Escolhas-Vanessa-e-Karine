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
  var TOP = 5;          // quantos aparecem em cada categoria
  var POLL = 15000;     // de quanto em quanto tempo o ranking se atualiza sozinho

  var box = null;       // o container do ranking
  var ctx = null;       // { userId, name, nickname, result }
  var timer = null;
  var busy = false;

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
    if (/failed to fetch|network/i.test(msg)) return "Sem conexão com o servidor. Confira a internet e toque em Atualizar.";
    return "Não deu para carregar o ranking agora. Toque em Atualizar para tentar de novo.";
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

  // Uma linha do ranking: a posição, o apelido em destaque com o nome do
  // login embaixo (sem apelido, só o nome) e os pontos.
  function rowHTML(item, c) {
    var mine = item.row.user_id === ctx.userId;
    var medal = item.pos <= 3 ? " rrank__pos--" + item.pos : "";
    var real = item.row.nickname && item.row.player_name
      ? '<span class="rrank__real">' + Format.esc(item.row.player_name) + "</span>" : "";
    return '<li class="rrank__row' + (mine ? " is-me" : "") + '">' +
      '<span class="rrank__pos' + medal + '">' + item.pos + "º</span>" +
      '<span class="rrank__name">' +
        '<span class="rrank__line"><span class="rrank__who">' + Format.esc(shownName(item.row)) + "</span>" +
          (mine ? '<span class="rrank__me">você</span>' : "") + "</span>" +
        real +
      "</span>" +
      '<span class="rrank__pts" data-tone="' + (item.v < 0 ? "down" : item.v > 0 ? c.tone : "zero") + '">' + Format.points(item.v) + "</span>" +
      "</li>";
  }

  // Um cartão por categoria: os TOP primeiros e, se o aluno ficou mais pra
  // baixo, a posição dele no fim.
  function catHTML(c, rows) {
    var list = positions(rows, c.key);
    var top = list.slice(0, TOP);
    var mine = list.filter(function (x) { return x.row.user_id === ctx.userId; })[0];
    var extra = mine && top.indexOf(mine) < 0;
    return '<div class="rrank fx" data-tone="' + c.tone + '">' +
      '<p class="rrank__title">' + Icons.tile(c.icon, c.tone, "itile--xs") + Format.esc(c.name) + "</p>" +
      '<ol class="rrank__list">' + top.map(function (x) { return rowHTML(x, c); }).join("") +
        (extra ? '<li class="rrank__gap" aria-hidden="true">…</li>' + rowHTML(mine, c) : "") +
      "</ol>" +
      "</div>";
  }

  /* ============ a tela ============ */
  function headHTML(n) {
    return '<div class="granking__head">' +
      "<div>" +
        '<p class="gtable__title">' + Icons.tile("trofeu", "amber", "itile--xs") + "Ranking geral</p>" +
        '<p class="granking__sub" data-rank-sub>' +
          (n == null ? "Carregando…" :
            n === 1 ? "Por enquanto, só você jogou."
            : "Quem fez mais pontos em cada categoria, entre " + nw(n + " jogadores") + ".") +
        "</p>" +
      "</div>" +
      '<button class="btn btn--ghost glass btn--sm fx" type="button" title="Atualizar o ranking" data-rank-refresh><span data-icon="recomecar"></span><span class="granking__btntext">Atualizar</span></button>' +
      "</div>";
  }

  function render(state) {
    if (state.error) {
      box.innerHTML = headHTML(null) + '<p class="granking__msg">' + Format.esc(errorText(state.error)) + "</p>";
      box.querySelector("[data-rank-sub]").textContent = "";
    } else {
      box.innerHTML = headHTML(state.rows.length) +
        '<div class="granking__grid">' + Catalog.categories.map(function (c) { return catHTML(c, state.rows); }).join("") + "</div>";
    }
    Icons.mount(box);
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
        var rows = state.rows.filter(function (r) { return r.user_id !== ctx.userId; });
        rows.push({ user_id: ctx.userId, player_name: ctx.name, nickname: ctx.nickname, scores: ctx.result.scores });
        render({ rows: rows });
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
    box.innerHTML = headHTML(null);
    Icons.mount(box);
    if (!box.getAttribute("data-bound")) {
      box.setAttribute("data-bound", "1");
      box.addEventListener("click", function (e) {
        if (e.target.closest("[data-rank-refresh]")) refresh(false);
      });
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
