(function (global) {
  "use strict";

  // As 4 decisões da história, na ordem da linha do tempo, linha por linha
  // como na planilha "Escolhas Karine e Vanessa - PROFESSOR". Em cada uma, o
  // aluno usa os dados da história (as células laranja) para fazer os
  // cálculos (as células em branco) e a diferença entre as duas.
  //
  // topic: o assunto, curto (vai no quadrinho, na linha do tempo e no
  //   resultado). question: a pergunta do slide.
  // icon: o desenho do quadrinho (os nomes estão em frontend/js/icons.js).
  // from: o ano em que a decisão acontece. A conta vai dele até o fim do
  //   período (Scenario.years): a Decisão 3, no ano 8, pesa 32 anos.
  // rule: uma regra que vale para as duas (opcional).
  // why: a pergunta para discutir, que aparece quando a decisão termina.
  // answer: uma resposta possível, que fica fechada até o professor abrir.
  //
  // Em cada caminho (vanessa e karine):
  //   label: a etiqueta pequena ao lado do nome (a marca, o tamanho...).
  //   pick: o que ela escolheu, curto. story: o texto do slide.
  //   rows: as linhas da planilha, na ordem. Cada linha é um dado ou um
  //     cálculo:
  //     - dado (laranja): { key, label, value, unit }. value é um número ou
  //       uma conta (abaixo), que já aparece pronta pro aluno.
  //     - cálculo (em branco, o aluno preenche): { key, label, calc, unit }.
  //       hint é opcional: sem ele, a dica (que aparece quando o aluno erra)
  //       sai da própria conta.
  //   note: uma frase embaixo das linhas (opcional).
  //   result: a conta do resultado dela no período, que vai para o
  //     resultado final. kind "perda" faz ele entrar negativo.
  //
  // diff: a conta da diferença entre as duas, igual à fórmula da planilha.
  // diffHint: a dica da diferença, quando a que sai da conta não basta
  //   (opcional).
  //
  // Uma conta é uma lista [operando, "×", operando, ...], feita da esquerda
  // para a direita com "×", "÷", "+" e "−". O operando é a key de uma linha
  // de cima, "v.key" ou "k.key" (uma linha da Vanessa ou da Karine), "years"
  // (os anos que a decisão pesa) ou um número fixo, { n: 12, unit: "meses" }.
  //
  // unit: "money" (R$), "pct" (0.4 = 40%), "anos", "meses" ou "trocas".
  //
  // Nos textos, {key} vira o valor daquele caminho, {v.key} e {k.key} os da
  // Vanessa e da Karine, {diff} a diferença entre as duas, {years} os anos
  // que a decisão pesa e {end} o último ano do período.

  // celular e TV fazem a mesma conta: quanto se perde em cada troca, quantas
  // trocas cabem no período e quanto isso dá no total
  function contaDeTrocas(item, valor) {
    return [
      { key: "perda", label: "Perda por troca de " + item, calc: ["desv", "×", valor], unit: "money" },
      { key: "trocas", label: "Quantidade de trocas em {years} anos", calc: ["years", "÷", "anos"], unit: "trocas" },
      { key: "total", label: "Perda total em {years} anos", calc: ["perda", "×", "trocas"], unit: "money" }
    ];
  }

  var LIST = [
    {
      id: 1,
      topic: "Celular",
      question: "Quem vive sem celular hoje em dia?",
      icon: "celular",
      from: 0,
      rule: "Sempre revendendo o aparelho antigo: cada troca custa o quanto ele desvalorizou.",
      why: "Por que a escolha do iPhone x Samsung deu uma diferença de {diff}?",
      answer: "Porque a Vanessa paga mais caro e troca mais vezes: são {v.trocas} de {v.perda} em {years} anos, contra {k.trocas} de {k.perda} da Karine. Mesmo revendendo o aparelho antigo, cada troca leva embora o quanto ele desvalorizou.",
      vanessa: {
        label: "iPhone",
        pick: "Sempre o celular mais novo",
        story: "Sempre busca estar atualizada com a última versão de tudo. Está constantemente com o celular em mãos, compartilhando momentos no Instagram.",
        rows: [
          { key: "anos", label: "Quantidade de anos com cada aparelho", value: 2, unit: "anos" },
          { key: "desv", label: "Desvalorização do celular até a troca", value: 0.4, unit: "pct" },
          { key: "preco", label: "Preço médio do celular", value: 4500, unit: "money" }
        ].concat(contaDeTrocas("telefone", "preco")),
        result: ["total"],
        kind: "perda"
      },
      karine: {
        label: "Samsung",
        pick: "Um celular simples, só o básico",
        story: "Não se preocupa em ter o celular mais moderno e utiliza apenas as funções básicas.",
        rows: [
          { key: "anos", label: "Quantidade de anos com cada aparelho", value: 5, unit: "anos" },
          { key: "desv", label: "Desvalorização do celular até a troca", value: 0.5, unit: "pct" },
          { key: "preco", label: "Preço médio do celular", value: 2300, unit: "money" }
        ].concat(contaDeTrocas("telefone", "preco")),
        result: ["total"],
        kind: "perda"
      },
      diff: ["v.total", "−", "k.total"]
    },
    {
      id: 2,
      topic: "Televisão",
      question: "Já se imaginou sem televisão?",
      icon: "tv",
      from: 0,
      rule: "Sempre revendendo a TV antiga: cada troca custa o quanto ela desvalorizou.",
      why: "Por que escolher a TV maior e trocá-la mais vezes faz uma diferença de {diff} em {years} anos?",
      answer: "Porque a TV da Vanessa custa mais ({v.valor} contra {k.valor}) e é trocada a cada {v.anos}; a da Karine, a cada {k.anos}. São {v.trocas} de {v.perda} contra {k.trocas} de {k.perda}. A TV da Karine perde uma parte maior do valor em cada troca ({k.desv} contra {v.desv}), mas ela troca muito menos vezes.",
      vanessa: {
        label: "TV de 60 polegadas",
        pick: "A TV maior e mais moderna",
        story: "Adora assistir séries e faz questão de ter uma TV de 60 polegadas, sempre priorizando as melhores tecnologias disponíveis.",
        rows: [
          { key: "anos", label: "Quantidade de anos com cada TV", value: 4, unit: "anos" },
          { key: "desv", label: "Depreciação da TV até a troca", value: 0.5, unit: "pct" },
          { key: "valor", label: "Valor da TV", value: 3800, unit: "money" }
        ].concat(contaDeTrocas("TV", "valor")),
        result: ["total"],
        kind: "perda"
      },
      karine: {
        label: "TV de 32 polegadas",
        pick: "Uma TV simples, que ela usa pouco",
        story: "Não se importa em ter uma TV grande, por isso opta por uma de 32 polegadas, já que faz pouco uso.",
        rows: [
          { key: "anos", label: "Quantidade de anos com cada TV", value: 8, unit: "anos" },
          { key: "desv", label: "Depreciação da TV até a troca", value: 0.6, unit: "pct" },
          { key: "valor", label: "Valor da TV", value: 2300, unit: "money" }
        ].concat(contaDeTrocas("TV", "valor")),
        result: ["total"],
        kind: "perda"
      },
      diff: ["v.total", "−", "k.total"]
    },
    {
      id: 3,
      topic: "Poupança",
      question: "O que você faria com R$ 120.000,00?",
      icon: "cofrinho",
      from: 8,
      why: "Por que escolher comprar um carro ao invés de um apartamento para alugar gera uma diferença de {diff}?",
      answer: "Porque o carro perde valor a cada troca, e o apartamento, além de manter o valor, rende aluguel todo mês. A Vanessa perdeu {v.total} trocando de carro, e a Karine ganhou {k.ganho} de aluguel. A diferença entre as duas é a soma das duas coisas.",
      vanessa: {
        label: "Carro",
        pick: "O carro dos sonhos",
        story: "Ao atingir R$ 120.000,00 em sua conta, decidiu usar todo o valor para realizar o sonho de comprar o carro que sempre desejou. Ela sempre revende o carro antigo.",
        rows: [
          { key: "anos", label: "Quantidade de anos que ficou com o carro", value: 6, unit: "anos" },
          { key: "valor", label: "Valor do carro", value: 120000, unit: "money" },
          { key: "desv", label: "Depreciação do carro até a troca", value: 0.45, unit: "pct" },
          { key: "trocas", label: "Quantidade de trocas em {years} anos", value: 6, unit: "trocas" },
          { key: "perda", label: "Valor da perda do carro por troca", calc: ["valor", "×", "desv"], unit: "money" },
          { key: "total", label: "Valor total da perda em {years} anos", calc: ["trocas", "×", "perda"], unit: "money" }
        ],
        result: ["total"],
        kind: "perda"
      },
      karine: {
        label: "Apartamento",
        pick: "Um apartamento para alugar",
        story: "Com o dinheiro poupado, decidiu comprar um apartamento para gerar uma fonte de renda através do aluguel.",
        rows: [
          { key: "valor", label: "Valor da compra do apartamento", value: 120000, unit: "money" },
          { key: "aluguel", label: "Valor do aluguel por mês", value: 850, unit: "money" },
          { key: "meses", label: "Quantidade de meses em {years} anos", calc: ["years", "×", { n: 12, unit: "meses" }], unit: "meses" },
          { key: "ganho", label: "Ganho com o aluguel em {years} anos", calc: ["meses", "×", "aluguel"], unit: "money" },
          { key: "valorFinal", label: "Após {years} anos, o apartamento manteve o mesmo valor", value: ["valor"], unit: "money" }
        ],
        result: ["ganho"],
        kind: "ganho"
      },
      diff: ["k.ganho", "+", "v.total"]
    },
    {
      id: 4,
      topic: "Herança",
      question: "E se você recebesse uma herança de R$ 300.000,00? O que faria?",
      icon: "heranca",
      from: 15,
      why: "Por que comprar e reformar um apartamento gera uma diferença de {diff} em {years} anos, ao invés de investir esse dinheiro?",
      answer: "Porque o apartamento da Vanessa só manteve o valor: não gerou renda nenhuma em {years} anos. O dinheiro da Karine rendeu {k.mensal} por mês durante {k.meses}, e a startup ainda valorizou {k.valorizacao}.",
      vanessa: {
        label: "Apartamento",
        pick: "Comprar e reformar um apartamento",
        story: "Com a herança, Vanessa comprou um apartamento de R$ 250.000,00 e gastou R$ 50.000,00 com móveis e reformas.",
        rows: [
          { key: "custo", label: "Apartamento + reforma", value: 300000, unit: "money" },
          { key: "valorFinal", label: "Valor do apartamento no ano {end}", value: 300000, unit: "money" }
        ],
        note: "Nesta decisão não há cálculo para a Vanessa: compare o quanto ela gastou com o quanto o apartamento vale no ano {end}.",
        result: ["valorFinal", "−", "custo"],
        kind: "ganho"
      },
      karine: {
        label: "Investimentos",
        pick: "Investir numa startup e no banco",
        story: "Investiu o dinheiro da herança em dois tipos de investimentos distintos: metade numa startup, que paga dividendos todo mês, e metade numa aplicação de risco médio no banco.",
        rows: [
          { key: "startup", label: "Investiu em uma startup", value: 150000, unit: "money" },
          { key: "div", label: "Dividendo por mês (2% ao mês)", value: ["startup", "×", { n: 0.02, unit: "pct" }], unit: "money" },
          { key: "banco", label: "Investiu no banco", value: 150000, unit: "money" },
          { key: "juros", label: "Aplicação de risco médio, juros por mês (0,7% ao mês)", value: ["banco", "×", { n: 0.007, unit: "pct" }], unit: "money" },
          { key: "mensal", label: "Total da receita mensal", calc: ["div", "+", "juros"], unit: "money" },
          { key: "meses", label: "Período de receita em {years} anos", calc: ["years", "×", { n: 12, unit: "meses" }], unit: "meses" },
          { key: "receita", label: "Receita total em {years} anos", calc: ["mensal", "×", "meses"], unit: "money" },
          { key: "valorizacao", label: "Valorização da startup (de R$ 150.000,00 para R$ 300.000,00)", value: 150000, unit: "money" }
        ],
        result: ["receita", "+", "valorizacao"],
        kind: "ganho"
      },
      diff: ["k.receita", "+", "k.valorizacao"],
      diffHint: "Receita total da Karine + valorização da startup. O apartamento da Vanessa terminou valendo o mesmo que ela gastou."
    }
  ];

  function byId(id) {
    return LIST.filter(function (d) { return d.id === id; })[0] || null;
  }

  global.Decisions = {
    list: LIST,
    byId: byId
  };
})(window);
