(function (global) {
  "use strict";

  // O cliente do Supabase, igual ao do Fluxo de Caixa. Se a biblioteca não
  // carregou (sem internet, CDN fora do ar), libMissing avisa o session.js,
  // que mostra o aviso em vez de ficar carregando pra sempre.
  var cfg = global.SUPABASE_CONFIG || {};
  var isConfigured = !!(cfg.url && cfg.anonKey && cfg.url.indexOf("COLE_AQUI") === -1);
  var lib = global.supabase && global.supabase.createClient ? global.supabase : null;

  // Lido antes do createClient: o Supabase consome e apaga o #hash do link
  // do e-mail ao iniciar, e aí não dá mais pra saber que era recuperação.
  var hash = global.location.hash || "";
  var isRecovery = /type=recovery/.test(hash);
  var linkError = /error_code=otp_expired/.test(hash)
    ? "Esse link expirou ou já foi usado. Peça um novo em \"Esqueceu a senha?\"."
    : null;

  var client = isConfigured && lib ? lib.createClient(cfg.url, cfg.anonKey) : null;

  global.DB = {
    isConfigured: isConfigured,
    libMissing: isConfigured && !lib,
    client: client,
    isRecovery: isRecovery,
    linkError: linkError
  };
})(window);
