(function (global) {
  "use strict";

  // A atividade "Seu dinheiro no tempo" (Aula 4): 5 rodadas de decisões, como
  // nos slides. Em cada rodada aparece uma situação e o aluno escolhe entre a
  // Opção A e a Opção B. Cada escolha é de um tipo, e cada tipo vale pontos
  // de receita ou de patrimônio. No fim, o placar mostra quantos pontos o
  // aluno fez em cada categoria.
  //
  // O sistema não guarda o placar pronto: ele soma os pontos a partir daqui.
  // Mudando o tipo de uma opção (kind) ou os pontos de um tipo, a rodada, o
  // placar e os textos acompanham.

  // As categorias do placar, na ordem das colunas da tabela do slide
  // ("Impacto na receita" e "Impacto no patrimônio").
  // where: a categoria no meio da frase ("Impacto na receita").
  // icon: o desenho do quadrinho (os nomes estão em frontend/js/icons.js).
  // tone: a cor dos pontos a mais daquela categoria (os pontos a menos são
  //   sempre vermelhos).
  var CATEGORIES = [
    { key: "receita", name: "Receita", where: "na receita", icon: "moedas", tone: "green" },
    { key: "patrimonio", name: "Patrimônio", where: "no patrimônio", icon: "predio", tone: "violet" }
  ];

  // Os tipos de escolha e quantos pontos cada um vale, como no quadro roxo
  // dos slides. points: os pontos em cada categoria (a que não aparece fica
  // com 0).
  // label: o nome na frase ("Escolha que gera renda").
  // plural: o nome no quadro das regras ("Escolhas que geram renda").
  var KINDS = {
    consumo: {
      name: "Consumo imediato",
      label: "Escolha de consumo imediato",
      plural: "Escolhas de consumo imediato",
      points: { patrimonio: -2 },
      icon: "sacola",
      tone: "amber"
    },
    renda: {
      name: "Gera renda",
      label: "Escolha que gera renda",
      plural: "Escolhas que geram renda",
      points: { receita: 2 },
      icon: "grafico",
      tone: "green"
    },
    equilibrada: {
      name: "Equilibrada",
      label: "Escolha equilibrada",
      plural: "Escolhas equilibradas",
      points: { patrimonio: 1 },
      icon: "balanca",
      tone: "violet"
    }
  };

  // As 5 rodadas, na ordem dos slides.
  // topic: o nome curto (vai nas etapas e na tabela do placar).
  // situation: a situação do slide. question: a pergunta embaixo dela.
  // icon: o desenho do quadrinho da rodada.
  // options: a Opção A e a Opção B. text é o que aparece no botão, kind o
  //   tipo da escolha (acima) e why a frase que explica o tipo, que aparece
  //   depois que o aluno escolhe.
  var LIST = [
    {
      id: 1,
      topic: "Presente",
      icon: "presente",
      situation: "Você recebeu inesperadamente R$ 3.000 de presente.",
      question: "O que você faz com esse dinheiro?",
      options: {
        A: {
          text: "Trocar de celular",
          kind: "consumo",
          why: "O celular novo começa a perder valor no dia da compra, e os R$ 3.000 saem do seu patrimônio."
        },
        B: {
          text: "Investir o dinheiro",
          kind: "renda",
          why: "Investido, o dinheiro rende todo mês: ele passa a trabalhar por você."
        }
      }
    },
    {
      id: 2,
      topic: "Cookies",
      icon: "cookie",
      situation: "Você conseguiu uma renda extra vendendo cookies na escola.",
      question: "O que você faz com o que ganhou?",
      options: {
        A: {
          text: "Comprar um tablet novo",
          kind: "consumo",
          why: "A renda extra vira um aparelho para usar agora, que perde valor com o tempo."
        },
        B: {
          text: "Comprar mais material para aumentar as vendas",
          kind: "renda",
          why: "Mais material, mais cookies para vender: a renda extra cresce nas próximas semanas."
        }
      }
    },
    {
      id: 3,
      topic: "R$ 20 mil",
      icon: "cofrinho",
      situation: "Você conseguiu juntar R$ 20.000.",
      question: "Qual é o próximo passo?",
      options: {
        A: {
          text: "Dar a entrada em um carro",
          kind: "consumo",
          why: "A entrada sai do seu bolso, depois vêm as parcelas, o seguro e a manutenção, e o carro desvaloriza todo ano."
        },
        B: {
          text: "Começar um pequeno negócio",
          kind: "renda",
          why: "Um negócio pode virar uma nova fonte de renda, que entra todo mês."
        }
      }
    },
    {
      id: 4,
      topic: "Herança",
      icon: "heranca",
      situation: "Você recebeu uma herança.",
      question: "O que você faz com ela?",
      options: {
        A: {
          text: "Gastar em conforto imediato",
          kind: "consumo",
          why: "O conforto passa rápido, e a herança, que podia durar a vida toda, some do seu patrimônio."
        },
        B: {
          text: "Dividir entre investimentos",
          kind: "equilibrada",
          why: "Dividir entre vários investimentos equilibra segurança e rendimento: a herança fica protegida e continua crescendo."
        }
      }
    },
    {
      id: 5,
      topic: "Sobra do mês",
      icon: "carteira",
      situation: "Sobrou dinheiro a mais no mês.",
      question: "O que você faz com a sobra?",
      options: {
        A: {
          text: "Comprar um tênis ou uma bolsa nova",
          kind: "consumo",
          why: "Um gasto que não estava no plano: a sobra do mês vira consumo e o patrimônio não cresce."
        },
        B: {
          text: "Investir o que sobrou",
          kind: "equilibrada",
          why: "As contas do mês ficam pagas e a sobra é investida: um passo pequeno que, repetido todo mês, faz o patrimônio crescer."
        }
      }
    }
  ];

  // as letras das opções, na ordem dos botões
  var LETTERS = ["A", "B"];

  // Confere os dados quando a página abre: um tipo que não existe quebraria
  // o placar sem aviso nenhum.
  LIST.forEach(function (r) {
    LETTERS.forEach(function (l) {
      var o = r.options[l];
      if (!o || !KINDS[o.kind]) console.warn("Rodada " + r.id + ": a Opção " + l + " não tem um tipo que exista em KINDS.");
    });
  });

  global.Rounds = {
    list: LIST,
    kinds: KINDS,
    categories: CATEGORIES,
    letters: LETTERS,
    byId: function (id) {
      id = Number(id);
      for (var i = 0; i < LIST.length; i++) if (LIST[i].id === id) return LIST[i];
      return null;
    }
  };
})(window);
