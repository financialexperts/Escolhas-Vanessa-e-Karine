(function (global) {
  "use strict";

  // Os ícones da tela, todos de traço numa grade de 24×24. A cor vem do texto
  // em volta (currentColor). As peças com classe (ico-hands, ico-beam…) são as
  // que se mexem na animação de cada ícone (styles.css, "Ícones animados").
  // pathLength="1" deixa o traço "se desenhar" sem precisar medir o caminho.
  var PATHS = {
    // as decisões (o "icon" de backend/js/decisions.js)
    celular: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.4"/><path d="M10.5 5.5h3"/><path d="M11.2 18.5h1.6"/>',
    tv: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M8 21h8M12 18v3"/><path class="ico-antenna" d="M8.5 2.5L12 6l3.5-3.5"/>',
    cofrinho: '<ellipse cx="11.5" cy="13" rx="7.5" ry="5.5"/><path d="M7.8 17.8v2.7M15.2 17.8v2.7"/><path d="M19 11.2h1.3a1 1 0 0 1 1 1v1.6a1 1 0 0 1-1 1H19"/><path d="M12.6 7.7l1.6-2.4 1.2 2.9"/><path d="M15.6 11h.01"/><path d="M4 12.5c-1.2 0-1.8-.8-1.6-1.8"/><path d="M9.8 8.6h3.2"/><circle class="ico-coin" cx="11.4" cy="3.4" r="1.5"/>',
    heranca: '<path d="M9.3 3.2h5.4l-1.4 3.3h-2.6z"/><path d="M10.4 6.5C6.6 8.4 4.5 11.9 4.5 15.1a5.4 5.4 0 0 0 5.4 5.4h4.2a5.4 5.4 0 0 0 5.4-5.4c0-3.2-2.1-6.7-5.9-8.6"/><path d="M13.9 11.6c-.4-.5-1.1-.9-1.9-.9-1.1 0-1.9.6-1.9 1.4 0 1.9 3.9 1 3.9 2.9 0 .8-.9 1.5-2 1.5-.8 0-1.6-.4-2-.9M12 9.6v1.1M12 16.5v1.1"/>',

    // as etiquetas dos cartões
    carro: '<path d="M3.5 16.5V13a2 2 0 0 1 1.2-1.8l1.8-.7 1.8-3.2A2 2 0 0 1 10 6.5h4.4a2 2 0 0 1 1.6.8l2.5 3.2 1.4.5a2 2 0 0 1 1.3 1.9v3.6"/><path d="M3.5 16.5h1.6M9.4 16.5h5.2M18.9 16.5h1.6"/><circle cx="7.2" cy="16.8" r="2.1"/><circle cx="16.8" cy="16.8" r="2.1"/><path d="M6.8 10.5h11.6"/>',
    predio: '<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M16 9h2a2 2 0 0 1 2 2v10"/><path d="M2 21h20"/><path d="M8 7h4M8 11h4M8 15h4"/>',
    grafico: '<path d="M3 3v18h18"/><path class="ico-line" pathLength="1" d="M7 15l4-4 3 3 6-6"/><path d="M16 8h4v4"/>',

    // o ponto de partida, os medidores e as etiquetas
    balanca: '<path d="M12 5v15M8.5 20h7"/><circle cx="12" cy="4" r="1.2"/><g class="ico-beam"><path d="M5 6.5h14"/><path d="M5 6.5l-2.5 6M5 6.5l2.5 6M19 6.5l-2.5 6M19 6.5l2.5 6"/><path d="M2 12.5h6a3 3 0 0 1-6 0zM16 12.5h6a3 3 0 0 1-6 0z"/></g>',
    moedas: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    relogio: '<circle cx="12" cy="12" r="9"/><path class="ico-hands" d="M12 7v5l3 2"/>',
    alvo: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/><g class="ico-arrow"><path d="M12 12l7.5-7.5"/><path d="M16.5 3.5v4h4"/></g>',
    camadas: '<path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z"/><path d="M3 12l9 4.5 9-4.5"/><path d="M3 16.5l9 4.5 9-4.5"/>',
    ajustes: '<path d="M4 6h16M4 12h16M4 18h16" opacity=".4"/><circle class="ico-k1" cx="15" cy="6" r="2.2"/><circle class="ico-k2" cx="9" cy="12" r="2.2"/><circle class="ico-k3" cx="16" cy="18" r="2.2"/>',
    linha: '<path class="ico-line" pathLength="1" d="M3 12h15"/><path d="M15.5 8.5l4 3.5-4 3.5"/><path d="M6.5 8.5v7M11.5 8.5v7"/>',
    calculadora: '<rect x="5" y="2.5" width="14" height="19" rx="2.2"/><rect x="8" y="5.5" width="8" height="3.8" rx=".8"/><path class="ico-keys" d="M8.8 13h.01M12 13h.01M15.2 13h.01M8.8 16.6h.01M12 16.6h.01M15.2 16.6h.01"/>',
    cifrao: '<path d="M12 2.5v19"/><path d="M16.5 6.5C15.7 5.2 14 4.5 12 4.5c-2.6 0-4.3 1.3-4.3 3.2 0 4.4 9 2.3 9 7 0 1.9-1.8 3.3-4.7 3.3-2.3 0-4.2-.9-5-2.5"/>',

    // os botões
    foguete: '<g class="ico-rocket"><path d="M12 2.5c3 2.4 4.5 5.8 4.5 9.5l-1.8 3.5H9.3L7.5 12c0-3.7 1.5-7.1 4.5-9.5z"/><circle cx="12" cy="9.5" r="1.8"/><path d="M7.6 12.8L5 15.5v3l4-1.8M16.4 12.8l2.6 2.7v3l-4-1.8"/><path class="ico-flame" d="M10.3 18.5c0 1.6.7 2.4 1.7 3.3 1-.9 1.7-1.7 1.7-3.3"/></g>',
    recomecar: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/>',
    conferir: '<circle cx="12" cy="12" r="9"/><path class="ico-line" pathLength="1" d="M7.8 12.4l2.9 2.9 5.5-6"/>',
    refazer: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    avancar: '<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>',

    // o resultado
    barras: '<path d="M3 21h18"/><rect class="ico-b1" x="5" y="12" width="3.5" height="8" rx="1"/><rect class="ico-b2" x="10.25" y="6" width="3.5" height="14" rx="1"/><rect class="ico-b3" x="15.5" y="9" width="3.5" height="11" rx="1"/>',
    lampada: '<path d="M9.5 18h5M10.5 21h3"/><path d="M12 4a5.5 5.5 0 0 0-3.3 9.9c.5.4.8 1 .8 1.6V16h5v-.5c0-.6.3-1.2.8-1.6A5.5 5.5 0 0 0 12 4z"/><path class="ico-rays" d="M12 .8v.4M4.3 3.8l.4.4M19.7 3.8l-.4.4M1.3 10h.4M22.3 10h.4"/>',
    duvida: '<path d="M20.5 11.5a8.5 8.5 0 0 1-12.4 7.6L3.5 20.5l1.4-4.4A8.5 8.5 0 1 1 20.5 11.5z"/><path d="M9.7 9.4a2.4 2.4 0 0 1 4.6.9c0 1.6-2.3 2-2.3 3.4"/><path d="M12 16.6h.01"/>',

    // o jogo "Seu dinheiro no tempo": a aba, as rodadas (o "icon" de
    // backend/js/rounds.js), os tipos de escolha e o placar
    ampulheta: '<path d="M6 3h12M6 21h12"/><path d="M7.5 3c0 4.6 4.5 5.4 4.5 9s-4.5 4.4-4.5 9M16.5 3c0 4.6-4.5 5.4-4.5 9s4.5 4.4 4.5 9"/><path class="ico-sand" d="M10 18.5h4"/>',
    presente: '<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5v8h14v-8"/><path d="M12 8.5v12"/><g class="ico-bow"><path d="M12 8.5C10.6 5 6.8 4.4 6.8 6.7c0 1.4 2.2 1.8 5.2 1.8z"/><path d="M12 8.5c1.4-3.5 5.2-4.1 5.2-1.8 0 1.4-2.2 1.8-5.2 1.8z"/></g>',
    cookie: '<path d="M20.9 12.6A9 9 0 1 1 11.4 3.1a2.8 2.8 0 0 0 3.6 3.4 2.8 2.8 0 0 0 5.9 6.1z"/><path class="ico-chips" d="M8 10h.01M11.5 15.5h.01M15.5 14h.01M7.8 14.6h.01M11.4 11.2h.01"/>',
    carteira: '<path d="M18 7.5V5.2A1.2 1.2 0 0 0 16.8 4H5.5a2 2 0 0 0 0 4"/><path d="M3.5 6v12a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-14"/><path d="M16 14h.01"/><circle class="ico-coin" cx="12" cy="3" r="1.5"/>',
    sacola: '<g class="ico-bag"><path d="M5.2 8h13.6l-1 12.5H6.2z"/><path d="M9 10.5V7a3 3 0 0 1 6 0v3.5"/></g>',
    trofeu: '<path d="M7.5 3.5h9V9a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 5.5H5.2a2.6 2.6 0 0 0 2.9 3.8M16.5 5.5h2.3a2.6 2.6 0 0 1-2.9 3.8"/><path d="M12 13.5V17M8.5 20.5h7M9.8 17h4.4l.6 3.5H9.2z"/>',
    // as categorias do placar e os tipos de escolha novos
    capelo: '<g class="ico-cap"><path d="M12 4.5 2.5 9.2 12 14l9.5-4.8z"/><path d="M6.5 11.3v4.4c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-4.4"/></g><path d="M21.5 9.2v5.3"/>',
    coracao: '<path class="ico-heart" d="M12 20s-7.8-4.6-7.8-10.3A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 7.8 2.7C19.8 15.4 12 20 12 20z"/>',
    cartao: '<g class="ico-card"><rect x="2.5" y="5.5" width="19" height="13" rx="2.2"/><path d="M2.5 9.8h19"/><path d="M6 15h4"/></g>',
    dados: '<g class="ico-die"><rect x="4" y="4" width="16" height="16" rx="3.2"/><path class="ico-pips" d="M8.6 8.6h.01M15.4 8.6h.01M12 12h.01M8.6 15.4h.01M15.4 15.4h.01"/></g>',
    gaveta: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M3.5 12h17"/><path class="ico-knob" d="M10 7.8h4M10 16.2h4"/>',
    // as rodadas novas
    tenis: '<path d="M2.8 15.8V8.5l3.9 1.2 1.6 2.1 2.6-.4 3 2.7 5.3 1.1a2 2 0 0 1 1.6 2v.6a1 1 0 0 1-1 1H3.8a1 1 0 0 1-1-1z"/><path d="M2.8 15.8h18.8"/><path d="M8.6 12.9l1.1-.9M11.1 13.4l1.1-.9"/>',
    maleta: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7"/><path d="M3 12.5h18"/><path d="M10.8 12.5v1.8h2.4v-1.8"/>',
    notebook: '<rect x="4.5" y="4.5" width="15" height="10.5" rx="1.5"/><path d="M2.5 19h19l-1.8-4H4.3z"/><path d="M10.5 17h3"/>',
    alerta: '<path d="M12 3.5 21.5 20h-19z"/><path class="ico-mark" d="M12 9.8v4.6M12 17.1h.01"/>'
  };

  // o quadrinho de cada decisão tem a mesma cor: a cor de cada personagem
  // fica só no retrato e na bolinha dela, pra não confundir
  var DECISION_TONE = "violet";

  function svg(name) {
    return '<svg class="ico ico--' + name + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      (PATHS[name] || "") + "</svg>";
  }

  // o ícone dentro de um quadrinho colorido; extra = classes a mais (tamanho…)
  function tile(name, tone, extra) {
    return '<span class="itile itile--' + (tone || "neutral") + (extra ? " " + extra : "") + '" aria-hidden="true">' +
      svg(name) + "</span>";
  }

  function decisionTile(dec, extra) {
    return tile(dec.icon, DECISION_TONE, extra);
  }

  // o retrato redondo de uma das duas (who = "vanessa" ou "karine"), com o
  // fundo na cor dela; é decorativo, o nome sempre vem escrito do lado
  function avatar(who, extra) {
    return '<span class="avatar avatar--' + who + (extra ? " " + extra : "") + '" aria-hidden="true">' +
      '<img src="' + global.Scenario.people[who].img + '" alt="" decoding="async"></span>';
  }

  // Os ícones fixos do index.html são marcados com data-icon="nome" e
  // desenhados aqui, pra os desenhos ficarem num lugar só.
  function mount(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll("[data-icon]"), function (el) {
      el.innerHTML = svg(el.getAttribute("data-icon"));
      el.setAttribute("aria-hidden", "true");
    });
  }

  global.Icons = {
    svg: svg,
    tile: tile,
    decisionTile: decisionTile,
    avatar: avatar,
    mount: mount
  };
})(window);
