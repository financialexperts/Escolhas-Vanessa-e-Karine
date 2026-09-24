(function (global) {
  "use strict";

  // O ponto de partida da história: quanto tempo a conta cobre e quem são as
  // duas personagens. Os textos da tela (o cartão de abertura, a linha do
  // tempo, os cálculos e o resultado) saem daqui e de decisions.js, então
  // basta mudar aqui.
  global.Scenario = {
    // o período em análise da planilha: a conta de cada decisão vai do ano em
    // que ela acontece até aqui
    years: 40,
    goal: "Comparar gastos e receitas",

    // as duas personagens, na ordem da planilha (Vanessa à esquerda, Karine à
    // direita). A cor de cada uma fica no styles.css (--vanessa e --karine).
    people: {
      vanessa: { name: "Vanessa", img: "frontend/img/vanessa.png" },
      karine: { name: "Karine", img: "frontend/img/karine.png" }
    },
    order: ["vanessa", "karine"]
  };
})(window);
