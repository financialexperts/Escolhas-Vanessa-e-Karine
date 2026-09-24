(function (global) {
  "use strict";

  var S = global.Scenario;
  var Catalog = global.Decisions;
  var Format = global.Format;
  var Icons = global.Icons;

  // A linha do tempo das decisões (o slide "Linha do tempo decisões em 40
  // anos"): cada decisão é uma barra que começa no ano em que ela acontece e
  // vai até o fim do período. As marcas embaixo são os anos da história
  // (0, 8, 15 e 40). Tocar numa linha leva até a decisão, e as decisões já
  // concluídas ganham um selo verde no quadrinho.
  var root = null;

  function pos(year) { return (year / S.years * 100) + "%"; }

  // os anos que aparecem na escala: o começo, o fim e o de cada decisão
  function years() {
    var list = [0, S.years];
    Catalog.list.forEach(function (d) { if (list.indexOf(d.from) < 0) list.push(d.from); });
    return list.sort(function (a, b) { return a - b; });
  }

  // as linhas verticais de cada ano marcado, atrás das barras
  function gridHTML() {
    return years().map(function (y) {
      return '<span class="tl__grid" style="left:' + pos(y) + '"></span>';
    }).join("");
  }

  function rowHTML(dec) {
    var n = S.years - dec.from;
    return '<a class="tl__row fx" href="#dec-' + dec.id + '" data-go="' + dec.id + '">' +
      '<span class="tl__name">' + Icons.decisionTile(dec, "itile--xs") +
        '<span class="tl__text"><span class="tl__title">' + dec.id + ". " + Format.esc(dec.topic) +
          '<span class="sr-only" data-done-text></span></span>' +
        '<span class="tl__when">Ano ' + dec.from + " a " + S.years + " · " + n + " anos</span></span>" +
      "</span>" +
      '<span class="tl__track" aria-hidden="true">' + gridHTML() +
        '<span class="tl__bar" style="left:' + pos(dec.from) + '"></span>' +
      "</span>" +
      "</a>";
  }

  function axisHTML() {
    var list = years();
    return '<div class="tl__axis" aria-hidden="true"><span class="tl__axis-pad"></span><span class="tl__scale">' +
      list.map(function (y, i) {
        var edge = i === 0 ? " tl__tick--first" : i === list.length - 1 ? " tl__tick--last" : "";
        return '<span class="tl__tick' + edge + '" style="left:' + pos(y) + '">' + y + "</span>";
      }).join("") +
      '</span></div><p class="tl__unit" aria-hidden="true">anos</p>';
  }

  // isDone(id) diz se a decisão já foi concluída
  function sync(isDone) {
    Catalog.list.forEach(function (dec) {
      var row = root.querySelector('[data-go="' + dec.id + '"]');
      var ok = isDone(dec.id);
      row.classList.toggle("is-done", ok);
      row.querySelector("[data-done-text]").textContent = ok ? " (concluída)" : "";
    });
  }

  function mount(container, goTo) {
    root = container;
    root.innerHTML = '<div class="tl__rows">' + Catalog.list.map(rowHTML).join("") + "</div>" + axisHTML();
    root.addEventListener("click", function (e) {
      var a = e.target.closest("[data-go]");
      if (!a || !goTo) return;
      e.preventDefault();
      goTo(Number(a.getAttribute("data-go")));
    });
  }

  global.TimelineView = {
    mount: mount,
    sync: sync
  };
})(window);
