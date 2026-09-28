(function (global) {
  "use strict";

  // O jogo "Seu dinheiro no tempo": 10 rodadas de decisões,
  // do fácil ao difícil. As 5 primeiras são as dos slides; as outras 5 são
  // situações do dia a dia de quem tem de 13 a 16 anos. Em cada rodada
  // aparece uma situação e o aluno escolhe uma das opções (3 nas fáceis, 4
  // nas outras). Cada escolha é de um tipo, e cada tipo dá ou tira pontos em
  // até 4 categorias. No fim, o placar mostra quantos pontos o aluno fez em
  // cada categoria, e o ranking, quem fez mais em cada uma.
  //
  // O sistema não guarda o placar pronto: ele soma os pontos a partir daqui.
  // Mudando o tipo de uma opção (kind) ou os pontos de um tipo, a rodada, o
  // placar, o ranking e os textos acompanham.

  // As categorias do placar, na ordem das colunas da tabela. Os slides têm
  // receita e patrimônio; conhecimento e bem-estar deixam as escolhas menos
  // óbvias (consumir dá bem-estar agora, mas custa patrimônio). Até 4.
  // where: a categoria no meio da frase ("Impacto na receita").
  // about: o que ela quer dizer, na abertura do jogo.
  // icon: o desenho do quadrinho (os nomes estão em frontend/js/icons.js).
  // tone: a cor dos pontos a mais daquela categoria (os pontos a menos são
  //   sempre vermelhos).
  var CATEGORIES = [
    { key: "receita", name: "Receita", where: "na receita", about: "O dinheiro que entra: salário, vendas, rendimentos.", icon: "moedas", tone: "green" },
    { key: "patrimonio", name: "Patrimônio", where: "no patrimônio", about: "O que você tem: dinheiro guardado, investido e os seus bens.", icon: "predio", tone: "violet" },
    { key: "conhecimento", name: "Conhecimento", where: "no conhecimento", about: "O que você aprende e que pode virar trabalho e renda.", icon: "capelo", tone: "blue" },
    { key: "bemestar", name: "Bem-estar", where: "no bem-estar", about: "Aproveitar a vida agora, sem se apertar.", icon: "coracao", tone: "amber" }
  ];

  // Os tipos de escolha e quantos pontos cada um vale. Os 3 primeiros são os
  // do quadro roxo dos slides (com o bem-estar que o consumo e o equilíbrio
  // dão agora); os outros 4 deixam o jogo mais difícil, com armadilhas.
  // points: os pontos em cada categoria (a que não aparece fica com 0).
  // label: o nome na frase ("Escolha que gera renda").
  // plural: o nome na contagem ("2 escolhas que geram renda").
  // about: o que o tipo quer dizer, no quadro das regras.
  // tip: a dica que aparece no placar quando o aluno escolheu esse tipo
  //   (nos que tiram pontos).
  var KINDS = {
    renda: {
      name: "Gera renda",
      label: "Escolha que gera renda",
      plural: "Escolhas que geram renda",
      about: "O dinheiro trabalha e traz mais dinheiro: investir, vender, empreender.",
      points: { receita: 2 },
      icon: "grafico",
      tone: "green"
    },
    voce: {
      name: "Investir em você",
      label: "Escolha de investir em você",
      plural: "Escolhas de investir em você",
      about: "Aprender algo que pode virar trabalho e renda.",
      points: { conhecimento: 2 },
      icon: "lampada",
      tone: "blue"
    },
    equilibrada: {
      name: "Equilibrada",
      label: "Escolha equilibrada",
      plural: "Escolhas equilibradas",
      about: "Aproveitar uma parte e guardar a outra, ou ter uma reserva para imprevistos.",
      points: { patrimonio: 1, bemestar: 1 },
      icon: "balanca",
      tone: "violet"
    },
    consumo: {
      name: "Consumo imediato",
      label: "Escolha de consumo imediato",
      plural: "Escolhas de consumo imediato",
      about: "Gastar agora com algo que perde valor: é bom na hora, mas o dinheiro vai embora.",
      tip: "É bom aproveitar, mas repare quanto do seu patrimônio foi embora com o consumo imediato. Antes de comprar, vale perguntar: eu preciso disso agora?",
      points: { patrimonio: -2, bemestar: 1 },
      icon: "sacola",
      tone: "amber"
    },
    parado: {
      name: "Dinheiro parado",
      label: "Escolha de dinheiro parado",
      plural: "Escolhas de dinheiro parado",
      about: "Dinheiro guardado na gaveta: não rende e a inflação vai comendo o valor dele.",
      tip: "Guardar é um bom hábito, mas dinheiro parado perde valor com a inflação. Um investimento seguro protege o dinheiro e ainda faz ele render.",
      points: { patrimonio: -1 },
      icon: "gaveta",
      tone: "neutral"
    },
    divida: {
      name: "Dívida",
      label: "Escolha de dívida",
      plural: "Escolhas de dívida",
      about: "Comprar com juros: as parcelas comem o dinheiro dos próximos meses.",
      tip: "Comprar com juros faz tudo sair mais caro, e as parcelas prendem o seu dinheiro por meses. Quando dá, juntar antes e comprar à vista é melhor.",
      points: { receita: -1, patrimonio: -2 },
      icon: "cartao",
      tone: "pink"
    },
    aposta: {
      name: "Aposta ou dinheiro fácil",
      label: "Escolha de aposta ou dinheiro fácil",
      plural: "Escolhas de aposta ou dinheiro fácil",
      about: "Bets e promessas de lucro rápido: quase sempre quem perde é você.",
      tip: "Desconfie de quem promete lucro alto e rápido: nas bets e nos golpes, quem ganha é quem organiza. O caminho mais seguro é mais devagar.",
      points: { patrimonio: -3 },
      icon: "dados",
      tone: "pink"
    }
  };

  // Os níveis das rodadas: aparecem numa etiqueta no cartão de cada uma.
  var LEVELS = {
    1: { name: "Fácil", tone: "green" },
    2: { name: "Médio", tone: "amber" },
    3: { name: "Difícil", tone: "pink" }
  };

  // As 10 rodadas, na ordem do jogo.
  // topic: o nome curto (vai nas etapas e na tabela do placar).
  // level: o nível (1, 2 ou 3, acima).
  // multiplier: quantas vezes os pontos da rodada valem (opcional; a última
  //   rodada vale em dobro, como a pergunta final do Kahoot).
  // situation: a situação. question: a pergunta embaixo dela.
  // icon: o desenho do quadrinho da rodada.
  // options: as opções, de A a D (de 2 a 4, em ordem). text é o que aparece
  //   no botão, kind o tipo da escolha (acima) e why a frase que explica o
  //   tipo, que aparece depois que o aluno escolhe. Nas rodadas 1 a 5, a A e
  //   a B são as dos slides.
  var LIST = [
    {
      id: 1,
      topic: "Presente",
      level: 1,
      icon: "presente",
      situation: "Você recebeu inesperadamente R$ 3.000 de presente.",
      question: "O que você faz com esse dinheiro?",
      options: {
        A: { text: "Trocar de celular", kind: "consumo",
          why: "O celular novo é bom de usar agora, mas começa a perder valor no dia da compra, e os R$ 3.000 saem do seu patrimônio." },
        B: { text: "Investir o dinheiro", kind: "renda",
          why: "Investido, o dinheiro rende todo mês: ele passa a trabalhar por você." },
        C: { text: "Fazer um curso de programação ou de edição de vídeo", kind: "voce",
          why: "Uma habilidade nova fica com você pra sempre e pode virar trabalho: é um investimento em você." }
      }
    },
    {
      id: 2,
      topic: "Cookies",
      level: 1,
      icon: "cookie",
      situation: "Você conseguiu uma renda extra vendendo cookies na escola.",
      question: "O que você faz com o que ganhou?",
      options: {
        A: { text: "Comprar um tablet novo", kind: "consumo",
          why: "O tablet é pra curtir agora, mas vira um aparelho que perde valor com o tempo." },
        B: { text: "Comprar mais material para aumentar as vendas", kind: "renda",
          why: "Mais material, mais cookies pra vender: a renda extra cresce nas próximas semanas." },
        C: { text: "Pagar um lanche com os amigos e guardar o resto", kind: "equilibrada",
          why: "Você aproveita um pouco com os amigos e ainda guarda a maior parte: equilíbrio entre o agora e o depois." }
      }
    },
    {
      id: 3,
      topic: "R$ 20 mil",
      level: 1,
      icon: "cofrinho",
      situation: "Você conseguiu juntar R$ 20.000.",
      question: "Qual é o próximo passo?",
      options: {
        A: { text: "Dar a entrada em um carro", kind: "divida",
          why: "A entrada é só o começo: o resto vira parcelas com juros por anos, e o carro ainda desvaloriza todo ano." },
        B: { text: "Começar um pequeno negócio", kind: "renda",
          why: "Um negócio pode virar uma nova fonte de renda, que entra todo mês." },
        C: { text: "Deixar tudo guardado em casa, em dinheiro vivo", kind: "parado",
          why: "Em casa, o dinheiro não rende nada e, com a inflação, compra um pouco menos a cada ano. E ainda corre o risco de sumir." }
      }
    },
    {
      id: 4,
      topic: "Herança",
      level: 1,
      icon: "heranca",
      situation: "Você recebeu uma herança.",
      question: "O que você faz com ela?",
      options: {
        A: { text: "Gastar em conforto imediato", kind: "consumo",
          why: "O conforto é bom, mas passa rápido, e a herança, que podia durar a vida toda, some do seu patrimônio." },
        B: { text: "Dividir entre investimentos", kind: "renda",
          why: "Dividida entre vários investimentos, a herança fica mais protegida e rende todo mês." },
        C: { text: "Colocar tudo num esquema que promete dobrar o dinheiro em um mês", kind: "aposta",
          why: "Promessa de dobrar o dinheiro rápido é sinal de golpe: esses esquemas pagam os primeiros com o dinheiro de quem entra depois e, um dia, param de pagar." }
      }
    },
    {
      id: 5,
      topic: "Sobra do mês",
      level: 1,
      icon: "carteira",
      situation: "Sobrou dinheiro a mais no mês.",
      question: "O que você faz com a sobra?",
      options: {
        A: { text: "Comprar um tênis ou uma bolsa nova", kind: "consumo",
          why: "É gostoso estrear coisa nova, mas foi um gasto fora do plano: a sobra vira consumo e o patrimônio não cresce." },
        B: { text: "Investir o que sobrou", kind: "renda",
          why: "Investida, a sobra rende todo mês. Repetido todo mês, esse hábito faz muita diferença." },
        C: { text: "Guardar como reserva para imprevistos", kind: "equilibrada",
          why: "A reserva é o que salva quando algo quebra ou dá errado: você fica mais tranquilo e não precisa se endividar." }
      }
    },
    {
      id: 6,
      topic: "Tênis novo",
      level: 2,
      icon: "tenis",
      situation: "O seu tênis furou e você precisa de um novo. O modelo que você quer custa R$ 600.",
      question: "Como você compra?",
      options: {
        A: { text: "Parcelar em 10 vezes no cartão, com juros", kind: "divida",
          why: "Com os juros, o tênis sai bem mais caro que R$ 600, e as parcelas comem o seu dinheiro pelos próximos 10 meses." },
        B: { text: "Comprar um modelo mais simples, à vista, e guardar a diferença", kind: "equilibrada",
          why: "Você resolve o problema, fica com um tênis novo e ainda guarda a diferença: ótimo equilíbrio." },
        C: { text: "Levar o de R$ 600 à vista, com o dinheiro que você tinha guardado", kind: "consumo",
          why: "Sem juros, o que é bom, mas todo o dinheiro guardado vai embora num tênis que se gasta com o uso." },
        D: { text: "Apostar numa bet para tentar ganhar o dinheiro do tênis", kind: "aposta",
          why: "Nas apostas, a casa sempre ganha no longo prazo: o mais provável é perder o dinheiro e continuar sem tênis." }
      }
    },
    {
      id: 7,
      topic: "1º salário",
      level: 2,
      icon: "maleta",
      situation: "Você entrou no Jovem Aprendiz e recebeu o seu primeiro salário.",
      question: "O que você faz com ele?",
      options: {
        A: { text: "Guardar tudo numa gaveta para não gastar", kind: "parado",
          why: "Guardar é bom, mas na gaveta o dinheiro não rende e ainda perde valor com a inflação." },
        B: { text: "Pagar um curso de inglês com uma parte dele", kind: "voce",
          why: "Inglês abre portas para estágios e empregos melhores: você investe em você." },
        C: { text: "Gastar tudo num fim de semana com os amigos", kind: "consumo",
          why: "O fim de semana é ótimo, mas o salário do mês inteiro acaba em dois dias." },
        D: { text: "Investir uma parte todo mês, de forma automática", kind: "renda",
          why: "Investindo um pouco todo mês, sem precisar lembrar, o dinheiro vai crescendo sozinho." }
      }
    },
    {
      id: 8,
      topic: "Tela quebrada",
      level: 2,
      icon: "celular",
      situation: "O seu celular caiu e a tela quebrou. O conserto custa R$ 400.",
      question: "Como você resolve?",
      options: {
        A: { text: "Usar a reserva que você vinha guardando para imprevistos", kind: "equilibrada",
          why: "É para isso que a reserva existe: você resolve sem dívida e sem estresse." },
        B: { text: "Comprar um celular novo, parcelado em 12 vezes", kind: "divida",
          why: "Um celular novo por causa de uma tela: são 12 parcelas com juros comendo o seu dinheiro." },
        C: { text: "Fazer bicos no fim de semana, como passear com cachorros, para pagar o conserto", kind: "renda",
          why: "Você cria uma renda nova para resolver o problema, e ela pode continuar depois." },
        D: { text: "Trocar por um celular último modelo, já que vai gastar mesmo", kind: "consumo",
          why: "O conserto custava R$ 400; o celular novo custa muito mais e perde valor rápido." }
      }
    },
    {
      id: 9,
      topic: "Rende 20%?",
      level: 3,
      icon: "alerta",
      situation: "Você tem R$ 1.000 guardados. Um amigo diz que conhece um investimento que rende 20% ao mês, garantido.",
      question: "O que você faz?",
      options: {
        A: { text: "Entrar com tudo, antes que a oportunidade acabe", kind: "aposta",
          why: "Nenhum investimento sério garante 20% ao mês. Pressa e promessa de lucro alto são os dois sinais mais comuns de golpe." },
        B: { text: "Deixar o dinheiro na gaveta, que é mais seguro", kind: "parado",
          why: "Fugir do golpe foi bom, mas na gaveta o dinheiro perde valor para a inflação: dá para ter segurança e rendimento ao mesmo tempo." },
        C: { text: "Colocar num investimento seguro, como o Tesouro Direto", kind: "renda",
          why: "Rende menos que a promessa do amigo, mas rende de verdade, todo mês, com segurança." },
        D: { text: "Fazer um curso de fotografia e começar a cobrar por fotos", kind: "voce",
          why: "Você aprende uma habilidade que pode virar trabalho: um investimento em você." }
      }
    },
    {
      id: 10,
      topic: "Notebook",
      level: 3,
      multiplier: 2,
      icon: "notebook",
      situation: "Você quer um notebook de R$ 3.000 para estudar.",
      question: "Qual é o melhor caminho?",
      options: {
        A: { text: "Comprar agora no crediário, em 18 parcelas com juros", kind: "divida",
          why: "Com os juros, o notebook sai muito mais caro, e as parcelas duram um ano e meio." },
        B: { text: "Juntar um pouco por mês, investido, e comprar à vista com desconto", kind: "equilibrada",
          why: "Enquanto você junta, o dinheiro rende; na hora de comprar, à vista, ainda ganha desconto. Planejar vale a pena." },
        C: { text: "Comprar agora o mais caro da loja, à vista, com todo o dinheiro que você tem", kind: "consumo",
          why: "Você não precisava do mais caro, e todo o dinheiro guardado foi embora de uma vez." },
        D: { text: "Apostar numa bet para ganhar o notebook mais rápido", kind: "aposta",
          why: "Na bet, o mais provável é perder o dinheiro que você já tinha e continuar sem o notebook." }
      }
    }
  ];

  // as letras das opções, na ordem dos botões (cada rodada usa as primeiras)
  var LETTERS = ["A", "B", "C", "D"];

  function lettersOf(round) {
    return LETTERS.filter(function (l) { return !!round.options[l]; });
  }

  // Confere os dados quando a página abre: um tipo ou uma categoria que não
  // existe, ou uma opção pulada (A, C sem B), quebraria o placar sem aviso.
  var catKeys = CATEGORIES.map(function (c) { return c.key; });
  Object.keys(KINDS).forEach(function (k) {
    Object.keys(KINDS[k].points).forEach(function (c) {
      if (catKeys.indexOf(c) < 0) console.warn("Tipo " + k + ": a categoria \"" + c + "\" não existe em CATEGORIES.");
    });
  });
  LIST.forEach(function (r) {
    var ls = lettersOf(r);
    if (ls.length < 2 || ls.join("") !== LETTERS.slice(0, ls.length).join("")) {
      console.warn("Rodada " + r.id + ": as opções têm que ser de 2 a 4, em ordem, a partir da A.");
    }
    ls.forEach(function (l) {
      if (!KINDS[r.options[l].kind]) console.warn("Rodada " + r.id + ": a Opção " + l + " não tem um tipo que exista em KINDS.");
    });
    if (!LEVELS[r.level]) console.warn("Rodada " + r.id + ": o nível " + r.level + " não existe em LEVELS.");
  });

  global.Rounds = {
    list: LIST,
    kinds: KINDS,
    categories: CATEGORIES,
    levels: LEVELS,
    letters: LETTERS,
    lettersOf: lettersOf,
    byId: function (id) {
      id = Number(id);
      for (var i = 0; i < LIST.length; i++) if (LIST[i].id === id) return LIST[i];
      return null;
    }
  };
})(window);
