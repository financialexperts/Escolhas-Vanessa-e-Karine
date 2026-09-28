// O jogo só começa quando alguém entra (session.js): cada conta tem o seu
// jogo guardado no navegador.
window.Session.ready(function (user) {
  "use strict";

  var Catalog = window.Rounds;
  var Game = window.Game;
  var Format = window.Format;
  var Icons = window.Icons;
  var Toast = window.Toast;
  var PlayView = window.PlayView;
  var ScoreView = window.ScoreView;

  Game.open(user.id);

  function el(id) { return document.getElementById(id); }

  // o tema, o vidro e os ícones animados ficam no ui.js (as duas páginas usam)
  var semAnimacao = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============ a abertura ============ */
  var n = Catalog.list.length;
  var cats = Catalog.categories.map(function (c, i) { return i ? c.name.toLowerCase() : c.name; });

  el("g-lead").textContent = "São " + n + " rodadas. Em cada uma aparece uma situação com duas opções, A ou B, " +
    "e você escolhe o que faria com o dinheiro. Cada escolha dá (ou tira) pontos de " +
    Catalog.categories.map(function (c) { return c.name.toLowerCase(); }).join(" ou de ") +
    ". No fim, você vê quantos pontos fez em cada categoria.";
  el("sc-rounds").textContent = n + " rodadas";
  el("sc-cats").textContent = cats.slice(0, -1).join(", ") + (cats.length > 1 ? " e " : "") + cats[cats.length - 1];
  el("gm-sub").textContent = "Leia a situação, escolha a Opção A ou a Opção B e veja quantos pontos a sua escolha faz. " +
    "A próxima rodada só abre depois da escolha nesta.";

  // O quadro roxo dos slides: quanto vale cada tipo de escolha. A cor dos
  // pontos é a da categoria (ou vermelha, quando tira).
  el("g-rules").innerHTML = Object.keys(Catalog.kinds).map(function (k) {
    var kind = Catalog.kinds[k];
    var main = Catalog.categories.filter(function (c) { return kind.points[c.key]; })[0];
    var tone = main ? Game.toneOf(main.key, kind.points[main.key]) : "zero";
    return '<li class="grule fx">' + Icons.tile(kind.icon, kind.tone, "itile--sm") +
      '<span class="grule__name">' + Format.esc(kind.plural) + "</span>" +
      '<span class="grule__pts" data-tone="' + tone + '">' + Format.esc(Game.effectText(kind.points)) + "</span>" +
      "</li>";
  }).join("");

  // O nome ou apelido vai no placar. Fica guardado junto com o jogo; o Enter
  // no campo já começa. Sem nome guardado, vem o primeiro nome da conta.
  var nome = el("g-name");
  nome.value = Game.getName() || window.Session.firstName();
  nome.addEventListener("input", function () { Game.setName(nome.value); });
  nome.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    comecar();
  });

  // o botão da abertura acompanha o jogo: começar, continuar ou ver o placar
  function syncStart() {
    el("btn-start-text").textContent = Game.isOver() ? "Ver o meu placar" : Game.started() ? "Continuar o jogo" : "Começar o jogo";
  }

  /* ============ navegação ============ */
  // leva a tela até a parte que acabou de aparecer (o scroll-margin-top do
  // CSS desconta a barra do topo) e põe o foco nela, pra o leitor de tela
  // anunciar e o próximo Tab já continuar lá dentro
  function irPara(secao) {
    secao.scrollIntoView({ behavior: semAnimacao ? "auto" : "smooth", block: "start" });
    secao.focus({ preventScroll: true });
  }

  function mostrarPlacar() {
    ScoreView.show();
    irPara(el("sec-final"));
  }

  // Começa o jogo (ou volta pra rodada em que o aluno parou): as rodadas
  // aparecem e a tela vai até a rodada aberta. Com as rodadas todas
  // respondidas, vai pro placar.
  function comecar() {
    Game.setName(nome.value);
    if (Game.isOver()) {
      mostrarPlacar();
      return;
    }
    Game.start();
    el("sec-game").hidden = false;
    PlayView.begin(true);
    syncStart();
  }
  el("btn-start").addEventListener("click", comecar);

  Toast.mount();
  PlayView.mount(el("rounds"), {
    picked: syncStart,
    final: mostrarPlacar
  });

  // o que ficou guardado de antes: as rodadas voltam na rodada em que o
  // aluno parou e, com todas respondidas, o placar já aparece (sem levar a
  // tela até lá)
  if (Game.started()) {
    el("sec-game").hidden = false;
    PlayView.begin(false);
  }
  if (Game.isOver()) ScoreView.show();
  syncStart();

  /* ============ recomeçar ============ */
  // Apaga as escolhas e volta tudo ao começo (o nome fica). No meio do jogo,
  // pergunta antes; o "Jogar de novo" do placar já começa a Rodada 1.
  function zerar() {
    Game.reset();
    PlayView.render();
    ScoreView.hide();
    Toast.hide();
  }

  el("btn-reset").addEventListener("click", function () {
    if (Game.started() && !window.confirm("Apagar as suas escolhas e começar o jogo de novo?")) return;
    zerar();
    el("sec-game").hidden = true;
    syncStart();
    window.scrollTo({ top: 0, behavior: semAnimacao ? "auto" : "smooth" });
  });

  el("btn-again").addEventListener("click", function () {
    zerar();
    Game.start();
    PlayView.begin(true);
    syncStart();
  });
});
