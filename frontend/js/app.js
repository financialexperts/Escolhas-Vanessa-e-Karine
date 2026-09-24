(function () {
  "use strict";

  var S = window.Scenario;
  var Catalog = window.Decisions;
  var Ex = window.Exercise;
  var Toast = window.Toast;

  function el(id) { return document.getElementById(id); }

  /* ============ tema ============ */
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
  var semAnimacao = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  /* ============ a Vanessa e a Karine ============ */
  // Tocar numa delas faz ela dar um pulinho e dizer a próxima frase dela no
  // balão. O balão mostra o nome de quem está falando e aponta pra ela.
  var FALAS = {
    vanessa: [
      "Oi! Eu sou a " + S.people.vanessa.name + ". Adoro ter o que há de mais novo!",
      "Pra que esperar? Eu gosto de aproveitar agora.",
      "Série boa é na TV grande, né?",
      "Faz as contas pra mim? Quero saber se as minhas escolhas pesaram."
    ],
    karine: [
      "E eu sou a " + S.people.karine.name + ". Gosto de pensar no longo prazo.",
      "Se ainda funciona bem, pra que trocar?",
      "Prefiro que o meu dinheiro trabalhe por mim.",
      "Os dados estão em laranja. As contas são com você!"
    ]
  };
  var fala = { vanessa: -1, karine: -1 };
  var balao = el("duo-bubble");
  var balaoQuem = el("duo-who");
  var balaoTexto = el("duo-fala");

  balaoTexto.textContent = "Oi! Somos a " + S.people.vanessa.name + " e a " + S.people.karine.name + ".";
  S.order.forEach(function (who) {
    var persona = el("p-" + who);
    persona.querySelector("img").src = S.people[who].img;
    persona.setAttribute("aria-label", "Falar com a " + S.people[who].name);
    persona.addEventListener("click", function () {
      fala[who] = (fala[who] + 1) % FALAS[who].length;
      balaoQuem.textContent = S.people[who].name;
      balaoTexto.textContent = FALAS[who][fala[who]];
      balao.setAttribute("data-who", who);
      // o "toque em nós" já cumpriu o papel depois do primeiro toque
      balao.classList.add("is-known");
      // tira e põe a classe pra a animação repetir a cada toque
      [persona, balao].forEach(function (x) {
        x.classList.remove("is-talking");
        void x.offsetWidth;
        x.classList.add("is-talking");
      });
    });
  });

  /* ============ o ponto de partida ============ */
  el("sc-years").textContent = S.years + " anos";
  el("sc-count").textContent = Ex.counts().total + " em " + Catalog.list.length + " decisões";
  el("sc-goal").textContent = S.goal;

  /* ============ navegação ============ */
  // leva a tela até a parte que acabou de aparecer (o scroll-margin-top do
  // CSS desconta a barra do topo e os medidores) e põe o foco nela, pra o
  // leitor de tela anunciar e o próximo Tab já continuar lá dentro
  function irPara(secao) {
    secao.scrollIntoView({ behavior: semAnimacao ? "auto" : "smooth", block: "start" });
    secao.focus({ preventScroll: true });
  }

  function syncTimeline() {
    window.TimelineView.sync(function (id) { return Ex.isDone(String(id)); });
  }

  // Um grupo foi conferido ou teve as respostas mostradas: a linha do tempo
  // acompanha e, quando a diferença total fica resolvida, o resultado final
  // aparece.
  function aoMudar(group) {
    syncTimeline();
    if (group === "total" && Ex.isDone("total")) {
      window.ResultView.show();
      irPara(el("sec-final"));
    }
  }

  Toast.mount();
  window.SheetView.mount(el("decisions"), irPara, aoMudar);
  window.TimelineView.mount(el("timeline"), window.SheetView.show);
  syncTimeline();

  // o que ficou guardado de antes já pode ter terminado o exercício: o
  // resultado aparece, sem levar a tela até lá
  if (Ex.isDone("total")) window.ResultView.show();

  // Recomeçar apaga tudo o que o aluno fez: se já tem alguma coisa, pergunta
  // antes.
  el("btn-reset").addEventListener("click", function () {
    if (Ex.started() && !window.confirm("Apagar todos os cálculos e começar o exercício de novo?")) return;
    Ex.reset();
    window.SheetView.render();
    syncTimeline();
    window.ResultView.hide();
    Toast.hide();
    window.scrollTo({ top: 0, behavior: semAnimacao ? "auto" : "smooth" });
  });
})();
