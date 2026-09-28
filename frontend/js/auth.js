(function (global) {
  "use strict";

  // A tela de entrar / criar conta / esqueci a senha, trazida do Fluxo de
  // Caixa, com as mesmas contas (o mesmo projeto Supabase). As duas páginas
  // do sistema usam esta mesma tela: ela é montada aqui dentro do
  // #view-auth, e o session.js decide quando ela aparece.
  //
  // As abas "Entrar" e "Criar conta" usam as classes .authtabs/.authtab
  // (no Fluxo de Caixa são .tabs/.tab): aqui .tabs já são as abas do topo.

  var panes = ["login", "signup", "forgot", "newpass"];

  // o endereço da página, sem o #hash e sem o ?busca: é pra onde voltam os
  // links do e-mail (confirmar a conta, trocar a senha)
  function pageUrl() {
    return global.location.href.split("#")[0].split("?")[0];
  }

  function field(id, label, type, autocomplete, placeholder, hint) {
    return '<div class="field">' +
      '<label for="' + id + '">' + label + "</label>" +
      (hint ? '<span class="hint">' + hint + "</span>" : "") +
      '<div class="input" id="' + id + '-box">' +
        '<input id="' + id + '" type="' + type + '" autocomplete="' + autocomplete + '" placeholder="' + placeholder + '" required>' +
      "</div>" +
      "</div>";
  }

  function markup() {
    return '<div class="auth__intro">' +
        '<p class="card__kicker intro__tag">Educação financeira</p>' +
        "<h1>Entre para fazer as atividades.</h1>" +
        "<p>Com a sua conta, você faz os cálculos das escolhas da Vanessa e da Karine e joga o Seu dinheiro no tempo. " +
          "Já tem conta no <strong>Fluxo de Caixa</strong>? Entre com o mesmo e-mail e a mesma senha.</p>" +
      "</div>" +

      '<div class="card auth__card">' +
        '<div class="authtabs" role="tablist" aria-label="Escolha entrar ou criar conta">' +
          '<button class="authtab glass" role="tab" id="tab-login" aria-controls="pane-login" aria-selected="true" type="button">Entrar</button>' +
          '<button class="authtab glass" role="tab" id="tab-signup" aria-controls="pane-signup" aria-selected="false" tabindex="-1" type="button">Criar conta</button>' +
        "</div>" +

        // entrar
        '<form id="pane-login" role="tabpanel" aria-labelledby="tab-login" class="card__body" novalidate>' +
          field("login-email", "E-mail", "email", "email", "voce@email.com") +
          field("login-password", "Senha", "password", "current-password", "Sua senha") +
          '<p class="error" role="alert" aria-live="polite" id="login-err"></p>' +
          '<div class="actions actions--1">' +
            '<button class="btn btn--primary glass" type="submit" id="login-submit">Entrar</button>' +
          "</div>" +
          '<button class="linklike" type="button" id="btn-forgot">Esqueceu a senha?</button>' +
        "</form>" +

        // criar conta
        '<form id="pane-signup" role="tabpanel" aria-labelledby="tab-signup" class="card__body" hidden novalidate>' +
          field("signup-name", "Nome completo", "text", "name", "Nome e sobrenome") +
          field("signup-email", "E-mail", "email", "email", "voce@email.com") +
          field("signup-password", "Crie uma senha", "password", "new-password", "Sua senha", "Pelo menos 6 caracteres.") +
          '<p class="error" role="alert" aria-live="polite" id="signup-err"></p>' +
          '<p class="ok" role="status" aria-live="polite" id="signup-ok"></p>' +
          '<div class="actions actions--1">' +
            '<button class="btn btn--primary glass" type="submit" id="signup-submit">Criar minha conta</button>' +
          "</div>" +
        "</form>" +

        // esqueci a senha
        '<form id="pane-forgot" class="card__body" hidden novalidate>' +
          '<p class="card__sub" style="margin-bottom:14px">Informe seu e-mail. Vamos enviar um link para você criar uma nova senha.</p>' +
          field("forgot-email", "E-mail", "email", "email", "voce@email.com") +
          '<p class="error" role="alert" aria-live="polite" id="forgot-err"></p>' +
          '<p class="ok" role="status" aria-live="polite" id="forgot-ok"></p>' +
          '<div class="actions">' +
            '<button class="btn btn--ghost glass" type="button" id="btn-forgot-back">Voltar</button>' +
            '<button class="btn btn--primary glass" type="submit" id="forgot-submit">Enviar link</button>' +
          "</div>" +
        "</form>" +

        // definir nova senha (vindo do e-mail de recuperação)
        '<form id="pane-newpass" class="card__body" hidden novalidate>' +
          '<p class="card__sub" style="margin-bottom:14px">Crie sua nova senha para continuar.</p>' +
          field("newpass-password", "Nova senha", "password", "new-password", "Nova senha") +
          '<p class="error" role="alert" aria-live="polite" id="newpass-err"></p>' +
          '<div class="actions actions--1">' +
            '<button class="btn btn--primary glass" type="submit" id="newpass-submit">Salvar nova senha</button>' +
          "</div>" +
        "</form>" +
      "</div>";
  }

  function showPane(name) {
    panes.forEach(function (p) {
      var el = document.getElementById("pane-" + p);
      if (el) el.hidden = p !== name;
    });
    var isTabbed = name === "login" || name === "signup";
    document.getElementById("tab-login").setAttribute("aria-selected", String(name === "login"));
    document.getElementById("tab-signup").setAttribute("aria-selected", String(name === "signup"));
    document.getElementById("tab-login").tabIndex = name === "login" ? 0 : -1;
    document.getElementById("tab-signup").tabIndex = name === "signup" ? 0 : -1;
    document.querySelector(".auth__card .authtabs").style.display = isTabbed ? "" : "none";
  }

  function setBoxError(id, msg) {
    var box = document.getElementById(id + "-box");
    if (box) box.classList.toggle("is-error", !!msg);
  }
  function setMsg(id, msg) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg || "";
    el.classList.toggle("is-on", !!msg);
  }
  function clearMsgs() {
    ["login-err", "signup-err", "signup-ok", "forgot-err", "forgot-ok", "newpass-err"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.textContent = ""; el.classList.remove("is-on"); }
    });
    ["login-email", "login-password", "signup-name", "signup-email", "signup-password", "forgot-email"].forEach(function (id) {
      setBoxError(id, "");
    });
  }

  function setLoading(btnId, loading, label, loadingLabel) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? loadingLabel : label;
  }

  function friendlyError(msg) {
    if (!msg) return "Algo deu errado. Tente de novo.";
    if (/invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
    if (/user already registered/i.test(msg)) return "Este e-mail já tem uma conta. Use a aba Entrar.";
    if (/email not confirmed/i.test(msg)) return "Confirme seu e-mail antes de entrar. Veja sua caixa de entrada.";
    if (/password should be at least/i.test(msg)) return "A senha precisa ter pelo menos 6 caracteres.";
    if (/rate limit/i.test(msg)) return "Muitas tentativas. Espere um instante e tente de novo.";
    if (/failed to fetch|network/i.test(msg)) return "Sem conexão com o servidor. Confira a internet e tente de novo.";
    return msg;
  }

  // o que o servidor devolveu, ou o erro de rede, no mesmo formato
  function orNetworkError(p) {
    return p.catch(function (err) { return { error: { message: (err && err.message) || "network" } }; });
  }

  function mount(container) {
    container.innerHTML = markup();

    document.getElementById("tab-login").addEventListener("click", function () { clearMsgs(); showPane("login"); });
    document.getElementById("tab-signup").addEventListener("click", function () { clearMsgs(); showPane("signup"); });
    document.getElementById("btn-forgot").addEventListener("click", function () {
      clearMsgs();
      var email = document.getElementById("login-email").value.trim();
      if (email) document.getElementById("forgot-email").value = email;
      showPane("forgot");
    });
    document.getElementById("btn-forgot-back").addEventListener("click", function () { clearMsgs(); showPane("login"); });

    document.getElementById("pane-login").addEventListener("submit", function (e) {
      e.preventDefault();
      clearMsgs();
      var email = document.getElementById("login-email").value.trim();
      var password = document.getElementById("login-password").value;
      if (!email) { setBoxError("login-email", true); setMsg("login-err", "Informe seu e-mail."); return; }
      if (!password) { setBoxError("login-password", true); setMsg("login-err", "Informe sua senha."); return; }
      setLoading("login-submit", true, "Entrar", "Entrando…");
      orNetworkError(global.DB.client.auth.signInWithPassword({ email: email, password: password })).then(function (res) {
        setLoading("login-submit", false, "Entrar", "Entrando…");
        if (res.error) {
          setBoxError("login-email", true); setBoxError("login-password", true);
          setMsg("login-err", friendlyError(res.error.message));
        }
      });
    });

    document.getElementById("pane-signup").addEventListener("submit", function (e) {
      e.preventDefault();
      clearMsgs();
      var name = document.getElementById("signup-name").value.trim();
      var email = document.getElementById("signup-email").value.trim();
      var password = document.getElementById("signup-password").value;
      if (!name) { setBoxError("signup-name", true); setMsg("signup-err", "Informe seu nome completo."); return; }
      if (!email) { setBoxError("signup-email", true); setMsg("signup-err", "Informe seu e-mail."); return; }
      if (password.length < 6) { setBoxError("signup-password", true); setMsg("signup-err", "A senha precisa ter pelo menos 6 caracteres."); return; }
      setLoading("signup-submit", true, "Criar minha conta", "Criando conta…");
      orNetworkError(global.DB.client.auth.signUp({
        email: email,
        password: password,
        options: { data: { full_name: name }, emailRedirectTo: pageUrl() }
      })).then(function (res) {
        setLoading("signup-submit", false, "Criar minha conta", "Criando conta…");
        if (res.error) {
          setMsg("signup-err", friendlyError(res.error.message));
          return;
        }
        // Com sessão, o onAuthStateChange (session.js) já assume daqui. O
        // upsert (não update) garante o nome no perfil mesmo que o gatilho
        // do banco que cria a linha em "profiles" ainda não tenha rodado: é
        // a mesma tabela do Fluxo de Caixa.
        if (res.data && res.data.user && res.data.session) {
          global.DB.client.from("profiles").upsert({ id: res.data.user.id, full_name: name }, { onConflict: "id" }).then(function () {});
        }
        // Sem sessão, o projeto pede a confirmação do e-mail antes de entrar.
        if (res.data && !res.data.session) {
          document.getElementById("pane-signup").reset();
          setMsg("signup-ok", "Conta criada! Enviamos um link para o seu e-mail: confirme por ele e depois entre na aba Entrar.");
        }
      });
    });

    document.getElementById("pane-forgot").addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("forgot-email").value.trim();
      if (!email) { setBoxError("forgot-email", true); setMsg("forgot-err", "Informe seu e-mail."); return; }
      setLoading("forgot-submit", true, "Enviar link", "Enviando…");
      orNetworkError(global.DB.client.auth.resetPasswordForEmail(email, { redirectTo: pageUrl() })).then(function (res) {
        setLoading("forgot-submit", false, "Enviar link", "Enviando…");
        if (res.error) { setMsg("forgot-err", friendlyError(res.error.message)); return; }
        setMsg("forgot-ok", "Pronto! Se esse e-mail tiver uma conta, um link para trocar a senha foi enviado.");
      });
    });

    document.getElementById("pane-newpass").addEventListener("submit", function (e) {
      e.preventDefault();
      var password = document.getElementById("newpass-password").value;
      if (password.length < 6) { setMsg("newpass-err", "A senha precisa ter pelo menos 6 caracteres."); return; }
      setLoading("newpass-submit", true, "Salvar nova senha", "Salvando…");
      orNetworkError(global.DB.client.auth.updateUser({ password: password })).then(function (res) {
        setLoading("newpass-submit", false, "Salvar nova senha", "Salvando…");
        if (res.error) { setMsg("newpass-err", friendlyError(res.error.message)); return; }
        document.getElementById("pane-newpass").reset();
        global.Session.finishRecovery();
      });
    });
  }

  // Aviso de link inválido guardado até a tela de login aparecer, senão o
  // clearMsgs() do reset() apagaria a mensagem antes do usuário ver.
  var pendingLinkError = null;

  function reset() {
    clearMsgs();
    document.getElementById("pane-login").reset();
    document.getElementById("pane-signup").reset();
    showPane("login");
    if (pendingLinkError) { setMsg("login-err", pendingLinkError); pendingLinkError = null; }
  }

  function showRecovery() {
    clearMsgs();
    showPane("newpass");
  }

  function showLinkError(msg) {
    pendingLinkError = msg;
  }

  global.AuthView = { mount: mount, reset: reset, showRecovery: showRecovery, showLinkError: showLinkError };
})(window);
