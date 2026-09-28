(function (global) {
  "use strict";

  var Catalog = global.Rounds;
  var Format = global.Format;
  var Icons = global.Icons;

  // O ranking do jogo: quem fez mais pontos em cada categoria, entre quem
  // jogou com o mesmo código de turma (sem código, entre todo mundo que
  // jogou sem código). Os resultados ficam no Supabase do login, na tabela
  // game_scores: uma linha por aluno e por turma, com o nome que ele
  // cadastrou no login e os pontos de cada categoria. Jogando de novo com o
  // mesmo código, a linha é atualizada.
  //
  // O SQL que cria a tabela está em backend/sql/game_scores.sql. Sem ela, o
  // jogo funciona igual e o ranking mostra o aviso de que falta criá-la.

  var GAME = "dinheiro-no-tempo";
  var TABLE = "game_scores";
  var TOP = 5;          // quantos aparecem em cada categoria
  var POLL = 15000;     // de quanto em quanto tempo o ranking se atualiza sozinho

  var box = null;       // o container do ranking
  var ctx = null;       // { userId, name, classCode, result }
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
      class_code: c.classCode,
      player_name: c.name,
      scores: c.result.scores,
      picks: c.result.picks,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id,game,class_code" }).then(function (res) {
      return res.error || null;
    }, function (err) { return err || { message: "network" }; });
  }

  function load(classCode) {
    if (!db()) return Promise.resolve({ error: { message: "sem banco" } });
    return db().from(TABLE).select("user_id,player_name,scores")
      .eq("game", GAME).eq("class_code", classCode).limit(1000)
      .then(function (res) {
        return res.error ? { error: res.error } : { rows: res.data || [] };
      }, function (err) { return { error: err || { message: "network" } }; });
  }

  // o aviso de cada erro, do jeito que o professor e o aluno entendem
  function errorText(err) {
    var msg = (err && (err.message || err.code)) || "";
    if (/relation .* does not exist|42P01|could not find the table|schema cache/i.test(msg)) {
      return "O ranking ainda não está ligado: falta criar a tabela game_scores no Supabase (o SQL está em backend/sql/game_scores.sql).";
    }
    if (/failed to fetch|network/i.test(msg)) return "Sem conexão com o servidor. Confira a internet e toque em Atualizar.";
    return "Não deu para carregar o ranking agora. Toque em Atualizar para tentar de novo.";
  }

  /* ============ as posições ============ */
  // As posições numa categoria, com empate dividindo a posição ("1º, 1º,
  // 3º"); no empate, a ordem é a do nome.
  function positions(rows, key) {
    var sorted = rows.slice().sort(function (a, b) {
      return ((b.scores || {})[key] || 0) - ((a.scores || {})[key] || 0) ||
        String(a.player_name).localeCompare(String(b.player_name), "pt-BR");
    });
    var pos = 0;
    var prev = null;
    return sorted.map(function (row, i) {
      var v = (row.scores || {})[key] || 0;
      if (v !== prev) { pos = i + 1; prev = v; }
      return { pos: pos, row: row, v: v };
    });
  }

  function rowHTML(item, c) {
    var mine = item.row.user_id === ctx.userId;
    var medal = item.pos <= 3 ? " rrank__pos--" + item.pos : "";
    return '<li class="rrank__row' + (mine ? " is-me" : "") + '">' +
      '<span class="rrank__pos' + medal + '">' + item.pos + "º</span>" +
      '<span class="rrank__name"><span class="rrank__who">' + Format.esc(item.row.player_name) + "</span>" + (mine ? '<span class="rrank__me">você</span>' : "") + "</span>" +
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
    var code = ctx.classCode;
    return '<div class="granking__head">' +
      "<div>" +
        '<p class="gtable__title">' + Icons.tile("trofeu", "amber", "itile--xs") +
          (code ? "Ranking da turma " + nw(code) : "Ranking geral") + "</p>" +
        '<p class="granking__sub" data-rank-sub>' +
          (n == null ? "Carregando…" :
            n === 1 ? "Por enquanto, só você jogou" + (code ? " com esse código" : " sem código de turma") + "."
            : "Quem fez mais pontos em cada categoria, entre " + n + " jogadores" + (code ? " da turma" : " sem código de turma") + ".") +
        "</p>" +
      "</div>" +
      '<button class="btn btn--ghost glass btn--sm fx" type="button" data-rank-refresh><span data-icon="recomecar"></span>Atualizar</button>' +
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

  // Salva o resultado de quem está jogando e carrega o ranking da turma. O
  // resultado dele sempre aparece, mesmo que a leitura venha antes da
  // gravação terminar.
  function refresh(withSave) {
    if (busy || !ctx) return;
    busy = true;
    var saving = withSave ? save(ctx) : Promise.resolve(null);
    saving.then(function (saveErr) {
      return load(ctx.classCode).then(function (state) {
        busy = false;
        if (!box || !ctx) return;
        if (state.error || (saveErr && !state.rows.length)) {
          render({ error: state.error || saveErr });
          return;
        }
        var rows = state.rows.filter(function (r) { return r.user_id !== ctx.userId; });
        rows.push({ user_id: ctx.userId, player_name: ctx.name, scores: ctx.result.scores });
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
  // login), classCode, result }
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
