// O jogo só começa quando alguém entra (session.js): cada conta tem o seu
// jogo guardado no navegador, e o ranking usa o nome cadastrado no login.
window.Session.ready(function (user) {
  "use strict";

  var Catalog = window.Rounds;
  var Game = window.Game;
  var Format = window.Format;
  var Icons = window.Icons;
  var Toast = window.Toast;
  var Session = window.Session;
  var PlayView = window.PlayView;
  var ScoreView = window.ScoreView;
  var Ranking = window.Ranking;

  Game.open(user.id);

  function el(id) { return document.getElementById(id); }

  // o tema, o vidro e os ícones animados ficam no ui.js (as duas páginas usam)
  var semAnimacao = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============ a abertura ============ */
  // Os números da abertura saem de backend/js/rounds.js: quantas rodadas,
  // quantas opções, quantas categorias e se alguma vale em dobro.
  var n = Catalog.list.length;
  var counts = Catalog.list.map(function (r) { return Catalog.lettersOf(r).length; });
  var minOpts = Math.min.apply(null, counts);
  var maxOpts = Math.max.apply(null, counts);
  var dobro = Catalog.list.some(function (r) { return r.multiplier > 1; });
  var nCats = Catalog.categories.length;

  el("g-lead").textContent = "São " + n + " rodadas, do fácil ao difícil. Em cada uma aparece uma situação do dia a dia " +
    "e você escolhe o que faria com o dinheiro. Cada escolha dá (ou tira) pontos em " + nCats + " categorias. " +
    "No fim, você vê o seu placar e o ranking da turma.";
  el("sc-rounds").textContent = n + " rodadas";
  el("sc-opts").textContent = minOpts === maxOpts ? minOpts + " opções"
    : maxOpts - minOpts === 1 ? minOpts + " ou " + maxOpts + " opções"
    : "De " + minOpts + " a " + maxOpts + " opções";
  el("sc-cats").textContent = nCats + " categorias";
  el("gm-sub").textContent = "Leia a situação, escolha uma das opções e veja quantos pontos a sua escolha faz. " +
    "A próxima rodada só abre depois da escolha nesta." + (dobro ? " A última vale pontos em dobro!" : "");

  // as categorias do placar e o que cada uma quer dizer
  el("g-cats").innerHTML = Catalog.categories.map(function (c) {
    return '<li class="gcat fx">' + Icons.tile(c.icon, c.tone, "itile--sm") +
      '<span class="gcat__name">' + Format.esc(c.name) + "</span>" +
      '<span class="gcat__about">' + Format.esc(c.about) + "</span>" +
      "</li>";
  }).join("");

  // o quadro roxo: quanto vale cada tipo de escolha
  el("g-rules").innerHTML = PlayView.rules();

  // O código da turma: fica guardado junto com o jogo e vai em maiúsculas.
  // O Enter no campo já começa.
  var codigo = el("g-code");
  codigo.value = Game.getClassCode();
  codigo.addEventListener("input", function () { Game.setClassCode(codigo.value); });
  codigo.addEventListener("blur", function () { codigo.value = Game.getClassCode(); });
  codigo.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    comecar();
  });

  // o botão da abertura acompanha o jogo: começar, continuar ou ver o placar
  function syncStart() {
    el("btn-start-text").textContent = Game.isOver() ? "Ver o meu placar" : Game.started() ? "Continuar o jogo" : "Começar o jogo";
  }

  /* ============ o ranking ============ */
  // o que vai pro ranking: quem jogou (com o nome do login), a turma e os
  // pontos
  function resultado() {
    return {
      userId: user.id,
      name: Session.fullName() || "Aluno",
      classCode: Game.getClassCode(),
      result: Game.result()
    };
  }

  /* ============ navegação ============ */
  // leva a tela até a parte que acabou de aparecer (o scroll-margin-top do
  // CSS desconta a barra do topo) e põe o foco nela, pra o leitor de tela
  // anunciar e o próximo Tab já continuar lá dentro
  function irPara(secao) {
    secao.scrollIntoView({ behavior: semAnimacao ? "auto" : "smooth", block: "start" });
    secao.focus({ preventScroll: true });
  }

  // o placar e o ranking da turma (que guarda o resultado de quem jogou)
  function placar() {
    ScoreView.show();
    Ranking.show(el("fn-ranking"), resultado());
  }

  function mostrarPlacar() {
    placar();
    irPara(el("sec-final"));
  }

  // Na última escolha, o resultado já vai pro ranking, mesmo que o aluno
  // não abra o placar.
  function escolheu() {
    syncStart();
    if (Game.isOver()) Ranking.save(resultado());
  }

  // Começa o jogo (ou volta pra rodada em que o aluno parou): as rodadas
  // aparecem e a tela vai até a rodada aberta. Com as rodadas todas
  // respondidas, vai pro placar.
  function comecar() {
    Game.setClassCode(codigo.value);
    codigo.value = Game.getClassCode();
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
    picked: escolheu,
    final: mostrarPlacar
  });

  // o que ficou guardado de antes: as rodadas voltam na rodada em que o
  // aluno parou e, com todas respondidas, o placar já aparece (sem levar a
  // tela até lá)
  if (Game.started()) {
    el("sec-game").hidden = false;
    PlayView.begin(false);
  }
  if (Game.isOver()) placar();
  syncStart();

  /* ============ recomeçar ============ */
  // Apaga as escolhas e volta tudo ao começo (a turma fica). No meio do
  // jogo, pergunta antes; o "Jogar de novo" do placar já começa a Rodada 1.
  // O resultado que já está no ranking fica lá até o novo jogo terminar.
  function zerar() {
    Game.reset();
    PlayView.render();
    ScoreView.hide();
    Ranking.hide();
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
