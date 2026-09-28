// O exercício só começa quando alguém entra (session.js): cada conta tem o
// seu exercício guardado no navegador.
window.Session.ready(function (user) {
  "use strict";

  var S = window.Scenario;
  var Catalog = window.Decisions;
  var Ex = window.Exercise;
  var Toast = window.Toast;

  Ex.open(user.id);

  function el(id) { return document.getElementById(id); }

  // o tema, o vidro e os ícones animados ficam no ui.js (as duas páginas usam)
  var semAnimacao = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  // Um grupo foi conferido: a linha do tempo acompanha e, quando a diferença
  // total fica certa, o resultado final aparece.
  function aoMudar(group) {
    syncTimeline();
    if (group === "total" && Ex.isDone("total")) {
      window.ResultView.show();
      irPara(el("sec-final"));
    }
  }

  Toast.mount();
  window.SheetView.mount(el("decisions"), aoMudar);
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
});
