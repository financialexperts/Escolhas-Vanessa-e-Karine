(function (global) {
  "use strict";

  // O login das duas páginas, como o roteamento por sessão do Fluxo de
  // Caixa (e com as mesmas contas). Enquanto ninguém entrou, a página mostra
  // a tela de login (auth.js) no lugar da atividade. Quando alguém entra, a
  // atividade aparece e o app.js / game-app.js começam, pelo ready(), já
  // sabendo quem é (o que fica guardado no navegador é separado por conta).
  //
  // As telas: #view-loading (esperando o Supabase dizer se tem sessão),
  // #view-setup (o login não tem como funcionar: aviso), #view-auth (entrar
  // / criar conta) e #view-app (a atividade).

  var DB = global.DB;
  var AuthView = global.AuthView;

  function el(id) { return document.getElementById(id); }

  function showView(name) {
    ["loading", "setup", "auth", "app"].forEach(function (v) {
      var view = el("view-" + v);
      if (view) view.hidden = v !== name;
    });
  }

  /* ============ quem está esperando o login ============ */
  // O app.js e o game-app.js pedem pra começar pelo ready(fn): fn roda uma
  // vez só, com o usuário, quando alguém entra (ou na hora, se já entrou).
  var waiting = [];
  var user = null;

  // O nome que a pessoa cadastrou no login (o "Nome completo" do Criar
  // conta). Vem dos dados do login ou, numa conta antiga sem ele, do perfil
  // (tabela profiles, a mesma do Fluxo de Caixa). Sem nome nenhum, fica o
  // começo do e-mail. É o nome do topo, do placar e do ranking do jogo.
  var fullName = "";

  function ready(fn) {
    if (user) fn(user);
    else waiting.push(fn);
  }

  function getFullName() { return fullName; }

  // o primeiro nome, pro título do placar ("O seu placar, Ana")
  function firstName() {
    return fullName ? fullName.split(/\s+/)[0] : "";
  }

  /* ============ o aviso de quando o login não funciona ============ */
  function showSetup(title, text) {
    el("view-setup").innerHTML = '<div class="card setup-card">' +
      '<p class="card__kicker">Login indisponível</p>' +
      '<h2 class="invcard__title">' + title + "</h2>" +
      '<p class="card__sub" style="margin-top:10px">' + text + "</p>" +
      "</div>";
    showView("setup");
  }

  if (!DB.isConfigured) {
    showSetup("Falta ligar o Supabase",
      "O login precisa do projeto Supabase. Abra <code>frontend/js/config.js</code> e cole a URL e a chave pública do projeto (as mesmas do Fluxo de Caixa).");
    global.Session = { ready: ready, fullName: getFullName, firstName: firstName, finishRecovery: function () {} };
    return;
  }
  if (DB.libMissing) {
    showSetup("Não deu para carregar o login",
      "Confira a sua conexão com a internet e recarregue a página.");
    global.Session = { ready: ready, fullName: getFullName, firstName: firstName, finishRecovery: function () {} };
    return;
  }

  var db = DB.client;

  /* ============ a barra do topo ============ */
  // o nome de quem entrou (ou o começo do e-mail, sem nome) e o botão de sair
  function clean(s) { return String(s || "").replace(/\s+/g, " ").trim(); }

  function showUser(u) {
    var meta = clean(u.user_metadata && u.user_metadata.full_name);
    fullName = meta || clean(String(u.email || "").split("@")[0]);
    el("userbox-name").textContent = meta || u.email;
    el("userbox").hidden = false;
    if (meta) return;
    // conta sem o nome nos dados do login: o nome pode estar no perfil
    db.from("profiles").select("full_name").eq("id", u.id).maybeSingle().then(function (res) {
      var name = clean(res.data && res.data.full_name);
      if (!name) return;
      fullName = name;
      el("userbox-name").textContent = name;
    });
  }

  /* ============ roteamento por sessão ============ */
  // O link de recuperação de senha já chega com sessão válida: enquanto a
  // nova senha não for salva, qualquer rota cai na tela de troca de senha.
  var recovering = DB.isRecovery;

  function route(session) {
    if (recovering && session) {
      el("userbox").hidden = true;
      showView("auth");
      AuthView.showRecovery();
      return;
    }
    if (!session) {
      // Saiu depois de ter entrado: recarrega a página, pra nada do que o
      // aluno anterior fez ficar na memória da tela.
      if (user) {
        global.location.reload();
        return;
      }
      el("userbox").hidden = true;
      AuthView.reset();
      showView("auth");
      return;
    }

    // Outra conta entrou nesta aba (sem ter saído antes): recarrega pra
    // começar do zero com ela.
    if (user && session.user.id !== user.id) {
      global.location.reload();
      return;
    }
    showUser(session.user);
    showView("app");
    if (user) return;
    user = session.user;
    var fns = waiting;
    waiting = [];
    fns.forEach(function (fn) { fn(user); });
  }

  AuthView.mount(el("view-auth"));
  if (DB.linkError) AuthView.showLinkError(DB.linkError);

  db.auth.onAuthStateChange(function (event, session) {
    if (event === "PASSWORD_RECOVERY") recovering = true;
    if (event === "SIGNED_OUT") recovering = false;
    // TOKEN_REFRESHED dispara sozinho em segundo plano pra renovar a sessão,
    // sem o aluno fazer nada: não muda nada na tela.
    if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") return;
    // o Supabase pede pra não esperar outra chamada dele aqui dentro
    setTimeout(function () { route(session); }, 0);
  });

  el("btn-logout").addEventListener("click", function () {
    db.auth.signOut();
  });

  function refresh() {
    db.auth.getSession().then(function (res) { route(res.data.session); });
  }

  showView("loading");
  refresh();

  global.Session = {
    ready: ready,
    fullName: getFullName,
    firstName: firstName,
    finishRecovery: function () { recovering = false; refresh(); }
  };
})(window);
