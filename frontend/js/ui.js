(function () {
  "use strict";

  // O que as duas páginas do sistema têm em comum: o tema claro/escuro, o
  // brilho do vidro que segue o ponteiro e os ícones animados. Vem antes do
  // app.js (Vanessa e Karine) e do game-app.js (Seu dinheiro no tempo).

  function el(id) { return document.getElementById(id); }

  /* ============ tema ============ */
  // A chave "tema" é a mesma nas duas páginas (e no Simulador de Renda):
  // trocar o tema numa troca em todas.
  var root = document.documentElement;
  var metaTheme = el("meta-theme-color");
  function syncThemeColor() {
    if (!metaTheme) return;
    metaTheme.setAttribute("content", root.getAttribute("data-theme") === "dark" ? "#171435" : "#F7F7FA");
  }
  var stored = null;
  try { stored = localStorage.getItem("tema"); } catch (err) { stored = null; }
  if (stored === "dark" || stored === "light") {
    root.setAttribute("data-theme", stored);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    root.setAttribute("data-theme", "dark");
  }
  syncThemeColor();
  el("tema").addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    syncThemeColor();
    try { localStorage.setItem("tema", next); } catch (err) {}
  });

  /* ============ liquid glass: brilho que segue o ponteiro ============ */
  document.addEventListener("pointermove", function (e) {
    var g = e.target.closest && e.target.closest(".glass");
    if (!g) return;
    var r = g.getBoundingClientRect();
    g.style.setProperty("--gx", ((e.clientX - r.left) / r.width * 100) + "%");
    g.style.setProperty("--gy", ((e.clientY - r.top) / r.height * 100) + "%");
  });

  /* ============ ícones animados ============ */
  // Tudo o que tem a classe .fx anima o próprio ícone quando o mouse entra,
  // quando é tocado (no celular não existe "passar o mouse") ou quando recebe
  // o foco do teclado. A animação de cada ícone está no styles.css; aqui só
  // se liga e desliga o .is-poked que dispara ela.
  //
  // No toque, a animação sai quando o dedo levanta (pointerup), e não quando
  // encosta: se o dedo encostou pra rolar a página, o navegador cancela o
  // toque (pointercancel), o pointerup não vem e nada chacoalha no caminho.
  window.Icons.mount(document);

  function cutucar(fx) {
    if (!fx || fx.classList.contains("is-poked")) return;
    fx.classList.add("is-poked");
    setTimeout(function () { fx.classList.remove("is-poked"); }, 900);
  }
  function fxDe(e) { return e.target.closest && e.target.closest(".fx"); }

  document.addEventListener("pointerover", function (e) {
    if (e.pointerType !== "mouse") return;
    var fx = fxDe(e);
    // só quando o mouse entra de fora, não a cada filho por onde ele passa
    if (fx && !(e.relatedTarget && fx.contains(e.relatedTarget))) cutucar(fx);
  });
  document.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse") cutucar(fxDe(e));
  });
  document.addEventListener("pointerup", function (e) {
    if (e.pointerType !== "mouse") cutucar(fxDe(e));
  });
  document.addEventListener("focusin", function (e) { cutucar(fxDe(e)); });
})();
