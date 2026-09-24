# Equilibrista de Escolhas – Vanessa e Karine

Exercício da Aula 4 (Equilibrista de Escolhas) em que o próprio aluno faz os cálculos da planilha "Escolhas Karine e Vanessa - PROFESSOR". São as 4 decisões que a Vanessa e a Karine tomaram ao longo de 40 anos. Em cada uma, ele usa os dados da história para preencher as contas, confere as respostas e, no fim, calcula a diferença total entre as duas (R$ 2.054.300,00). As 4 decisões e a diferença total são 5 etapas, feitas uma de cada vez: a próxima só abre quando todos os cálculos da etapa estão certos.

Não tem build, instalação nem banco de dados: é `index.html` + alguns arquivos `.js` e `.css` estáticos, na mesma identidade visual do Simulador de Renda da Laura. Para rodar, basta abrir o `index.html` no navegador (ou publicar a pasta no GitHub Pages).


## O caminho do aluno

1. **O ponto de partida.** A Vanessa e a Karine abrem a tela num cartão com um balão de fala: tocando numa delas, ela dá um pulinho e diz a próxima frase dela. O mesmo cartão mostra o período (40 anos), quantos cálculos são (24, em 4 decisões) e o objetivo.

2. **Como fazer.** Uma legenda com as cores da planilha: laranja são os dados da história, em branco os cálculos que o aluno faz e verde a diferença entre as duas. Ela também diz o que dá pra digitar numa célula.

3. **A linha do tempo.** As 4 decisões numa escala de 0 a 40 anos, como no slide: Celular e Televisão desde o ano 0, Poupança no ano 8 e Herança no ano 15. Tocar numa linha abre a etapa daquela decisão (se ela já abriu), e as decisões concluídas ganham um selo verde.

4. **As etapas.** Logo abaixo dos medidores ficam as 5 etapas: as 4 decisões e a diferença total. Só o cartão da etapa aberta aparece. A etapa toda certa ganha o selo verde, a que está na tela fica roxa e as que ainda não abriram ficam com o círculo tracejado. Tocar numa etapa já feita volta até ela; tocar numa que ainda não abriu mostra um aviso com o que falta. Recarregar a página volta na etapa em que o aluno parou.

5. **Fazer os cálculos.** Cada decisão é um cartão com a pergunta do slide e as duas lado a lado, como as colunas da planilha: o retrato, o que cada uma escolheu, o texto do slide e as linhas da planilha. As linhas laranja já vêm preenchidas; nas brancas, o aluno digita o resultado. Embaixo, em verde, vem "Calcule a diferença entre as duas".

   Logo abaixo da pergunta, em roxo, vem o **período do cálculo**: quantos anos entram nas contas daquela decisão, de que ano a que ano, e uma barrinha dos 40 anos com o pedaço que conta. Celular e Televisão são os 40 anos inteiros; a Poupança acontece no ano 8 e conta 32 anos, e a Herança acontece no ano 15 e conta 25 anos, como na planilha. As linhas que dependem do período dizem os anos ("Quantidade de trocas em 40 anos", "Receita total em 25 anos"), e a desvalorização de cada aparelho é "até a troca", pra não confundir com o período.

   Numa célula vale o número do jeito brasileiro (`1800`, `1.800,00`) ou a conta, como numa célula da planilha (`=4500*40%`, `0,4 x 4500`, `(3000+1050)*300`). O "R$" e a unidade ("trocas", "meses") já estão desenhados em volta da célula.

   Cada célula tem uma **máscara**: enquanto o aluno digita um número, os pontos de milhar entram sozinhos (`1800` vira `1.800`), a vírgula separa os centavos e ficam no máximo 2 casas depois dela. Ao sair da célula, o número se completa do jeito que ela pede: `1.800,00` na de dinheiro, `20` na de trocas. Numa conta, a máscara não mexe: a célula mostra embaixo quanto ela dá e, no Enter, o resultado entra no lugar da conta (`3800*50/100` vira `1.900,00`). Saindo da célula sem o Enter, a conta fica como foi escrita. O Enter também leva à próxima célula em aberto e, na última, confere.

6. **Conferir.** O botão **Conferir os cálculos** confere a decisão toda:

   - **certo:** a célula fica verde, com ✓, e trava mostrando o valor do jeito da planilha;
   - **errado:** fica vermelha e ganha uma dica com a conta que tem que ser feita ("Dica: Perda por troca de telefone × Quantidade de trocas em 40 anos");
   - **não deu pra entender** o que foi digitado: fica vermelha, com um exemplo do que dá pra digitar;
   - **em branco:** ganha a borda tracejada e o aviso "Falta calcular".

   O sinal não conta (uma perda de R$ 36.000,00 pode ser escrita `36000` ou `-36000`), e uma diferença de até 1 centavo também não.

   Se a conferência achou algum erro, aparece **Refazer a etapa**. O aluno pode corrigir só as células vermelhas e conferir de novo, ou refazer: aí todas as células da etapa voltam em branco (até as que estavam certas) e o cursor vai pra primeira. Não existe botão que mostra as respostas: quem erra tem a dica da conta.

   Quando todas as células da decisão estão certas (100%), a etapa fica concluída. Aí aparece a pergunta do slide ("Por que a escolha do iPhone x Samsung deu uma diferença de R$ 26.800,00?"), com uma resposta possível escondida em **Ver uma resposta**, pra turma discutir antes, e o botão **Avançar para a Decisão 2**, que abre a próxima etapa.

   Enquanto o aluno trabalha, dois medidores ficam grudados no alto da tela: quantos dos 24 cálculos ele acertou e quantas decisões já concluiu.

7. **A diferença total.** A última etapa é a última célula da planilha. Ela mostra a diferença de cada decisão e pede a soma, e só abre com as 4 decisões certas. Com a diferença total certa, aparece a diferença final. Ela traz o número da aula, R$ 2.054.300,00 (que conta de zero até o valor), o resultado da Vanessa e o da Karine e quantos cálculos o aluno acertou. Depois vem uma linha por decisão com quanto da diferença final veio dela, o que os números mostram e as perguntas do slide de reflexão.

**Recomeçar o exercício** apaga tudo e volta ao começo. Se já tem alguma coisa feita, pergunta antes.

---

## As regras e os avisos

| Situação | O que acontece |
| --- | --- |
| Avançar com algum cálculo errado ou em branco | Não dá: o botão **Avançar** só aparece com todos os cálculos da etapa certos. |
| Abrir uma etapa antes da hora (pelas etapas ou pela linha do tempo) | Não abre, e o aviso no pé da tela diz o que falta: "A Decisão 3 só abre quando todos os cálculos da Decisão 2 estiverem certos." Na diferença total: "A diferença total só abre quando todos os cálculos das 4 decisões estiverem certos. Falta a Decisão 4." |
| Refazer uma etapa | O botão só aparece depois de uma conferência com erro. Apaga todas as células daquela etapa, sem perguntar. |
| Mudar uma célula certa | Ela fica travada. Com a etapa ainda em aberto, **Refazer a etapa** apaga tudo dela; com a etapa toda certa, só recomeçando o exercício. |
| Recomeçar com cálculos feitos | Pergunta "Apagar todos os cálculos e começar o exercício de novo?" |

---

## As decisões e as contas

Ficam em [`backend/js/decisions.js`](backend/js/decisions.js), linha por linha como na planilha. Estes são os 24 cálculos que o aluno faz (as células em branco e as verdes da planilha):

| Decisão | Vanessa | Karine | Diferença entre as duas |
| --- | --- | --- | ---: |
| 1. Celular (ano 0 a 40) | Perda por troca: 40% × R$ 4.500 = R$ 1.800 · Trocas: 40 ÷ 2 = 20 · Perda total: 1.800 × 20 = R$ 36.000 | 50% × R$ 2.300 = R$ 1.150 · 40 ÷ 5 = 8 · R$ 9.200 | 36.000 − 9.200 = **R$ 26.800** |
| 2. Televisão (ano 0 a 40) | 50% × R$ 3.800 = R$ 1.900 · 40 ÷ 4 = 10 · R$ 19.000 | 60% × R$ 2.300 = R$ 1.380 · 40 ÷ 8 = 5 · R$ 6.900 | 19.000 − 6.900 = **R$ 12.100** |
| 3. Poupança (ano 8 a 40) | Perda por troca: R$ 120.000 × 45% = R$ 54.000 · Perda total: 6 × 54.000 = R$ 324.000 | Meses em 32 anos: 32 × 12 = 384 · Ganho com o aluguel: 384 × R$ 850 = R$ 326.400 | 326.400 + 324.000 = **R$ 650.400** |
| 4. Herança (ano 15 a 40) | sem cálculo: gastou R$ 300.000 e o apartamento vale R$ 300.000 no ano 40 | Receita mensal: 3.000 + 1.050 = R$ 4.050 · Período: 25 × 12 = 300 meses · Receita total: 4.050 × 300 = R$ 1.215.000 | 1.215.000 + 150.000 da valorização da startup = **R$ 1.365.000** |
| **Diferença total** | | | 26.800 + 12.100 + 650.400 + 1.365.000 = **R$ 2.054.300** |

Os dados laranja são os mesmos da planilha. Isso vale também para os dividendos (R$ 3.000, 2% ao mês de R$ 150.000) e os juros (R$ 1.050, 0,7% ao mês de R$ 150.000), que lá também são células laranja. Para o aluno calcular um deles, basta trocar o `value` daquela linha por `calc` (veja abaixo).

O sistema não guarda as respostas prontas: ele faz as contas a partir dos dados de cada decisão. Mudando um dado em `decisions.js`, as respostas, as dicas, os textos com números e o resultado final acompanham. Se a fórmula da diferença de uma decisão deixar de bater com o resultado das duas, aparece um aviso no console do navegador.

---

## Estrutura de arquivos

```
index.html                      a tela: abertura, como fazer, linha do tempo, decisões,
                                diferença total e diferença final
frontend/
  css/styles.css                todo o visual (identidade Financial Experts)
  img/                          logos, favicon e as duas (vanessa.png e karine.png, já
                                sem fundo; Vanessa.jpg e Karine.avif são as originais)
  js/format.js                  formatação de dinheiro, porcentagem, anos, meses e trocas
  js/parse.js                   lê o que o aluno digitou numa célula: o número ou a conta
  js/mask.js                    a máscara das células: os pontos de milhar enquanto o aluno
                                digita um número
  js/icons.js                   os desenhos dos ícones, os quadrinhos e os retratos das duas
  js/exercise.js                o estado do exercício, as contas da planilha, a conferência,
                                as regras e o que fica guardado no navegador
  js/toast.js                   o aviso de quando uma ação ainda não pode
  js/sheet.js                   as etapas, os cartões das decisões e o da diferença total,
                                do jeito da planilha, e os medidores do alto
  js/timeline.js                a linha do tempo das decisões
  js/result.js                  a diferença final
  js/app.js                     tema claro/escuro, as duas e o balão, as animações dos
                                ícones, o botão de recomeçar, liga tudo
backend/
  js/scenario.js                o período, o objetivo e as duas personagens
  js/decisions.js               as 4 decisões: textos, dados e contas, linha por linha
                                como na planilha
```

Os ícones de todas as partes da tela se mexem quando o mouse passa, quando o aluno toca neles ou quando recebem o foco do teclado. No celular, só um toque de verdade anima: passar o dedo para rolar a página não mexe em nada. Quem pede menos movimento no sistema operacional não vê animação nenhuma (e o número da diferença final já aparece pronto).

Os dois arquivos em `backend/js/` não tocam no DOM: são só dados. O `exercise.js`, o `parse.js` e o `mask.js` também não. É o `exercise.js` que guarda o que o aluno fez, faz as contas, confere e aplica as regras; as telas só leem dele.

---

## Onde mexer para mudar cada coisa

| Para mudar… | Edite |
| --- | --- |
| O período (40 anos), o objetivo, os nomes ou as imagens das duas | `backend/js/scenario.js` |
| Os textos, os números ou as contas de uma decisão | `backend/js/decisions.js` |
| Quais linhas o aluno calcula e quais já vêm prontas | em cada linha de `decisions.js`: `value` (já vem pronta, laranja) ou `calc` (o aluno calcula, em branco) |
| A dica de um cálculo | `hint` na linha, ou `diffHint` na decisão (para a diferença). Sem eles, a dica sai da própria conta |
| A pergunta para discutir e a resposta de cada decisão | `why` e `answer`, em `backend/js/decisions.js` |
| As falas do balão das duas | `FALAS`, no `frontend/js/app.js` |
| A última frase da análise do resultado | `LICAO`, no `frontend/js/result.js` |
| As mensagens das células e do pé de cada cartão | `MSG` e `statusText()`, no `frontend/js/sheet.js` |
| Os nomes das etapas ("Celular", "Avançar para a Decisão 2") | `stepTopic()` e `stepName()`, no `frontend/js/sheet.js` |
| A frase do período do cálculo, em cada decisão | `periodText()`, no `frontend/js/sheet.js` (a da diferença total fica no `totalHTML()`) |
| A máscara das células (o que ela faz enquanto o aluno digita) | `live()`, no `frontend/js/mask.js`; o jeito de cada célula ao sair dela (`1.800,00`, `20`) é o `Format.plain()`, no `frontend/js/format.js` |
| O que conta como certo (o sinal, o centavo) | `judge()`, no `frontend/js/exercise.js` |
| As regras (quando uma etapa abre e o que refazer apaga) | `blocked()`, `current()` e `redo()`, no `frontend/js/exercise.js` |
| Os textos fixos da tela (títulos, legenda, perguntas de reflexão, rodapé) | `index.html` |
| Cores, tamanhos e o visual | `frontend/css/styles.css` |

Cada conta de `decisions.js` é uma lista como `["desv", "×", "preco"]`: os nomes são linhas de cima da mesma pessoa, `"v.total"` e `"k.total"` são linhas da Vanessa e da Karine (usado na diferença), e `"years"` são os anos que a decisão pesa (40, 32 ou 25). Um número fixo é `{ n: 12, unit: "meses" }`. A dica que o aluno vê quando erra é essa mesma conta, escrita com os nomes das linhas. Nos textos, `{v.perda}` e `{k.perda}` viram os valores da Vanessa e da Karine, `{diff}` a diferença entre as duas, `{years}` os anos da decisão e `{end}` o último ano do período.

A cor de cada uma (rosa para a Vanessa, azul para a Karine) aparece no fundo do retrato e na bolinha do balão. As duas ficam em `--vanessa` e `--karine`, no `styles.css`, e o par foi conferido para quem tem daltonismo, no tema claro e no escuro. O laranja das linhas de dados é o `--data`.

---

## O que fica guardado no navegador

- **O tema** claro ou escuro, no `localStorage`, com a mesma chave (`tema`) do Simulador de Renda: publicados no mesmo endereço, os dois sistemas lembram do mesmo tema.
- **O exercício**, na chave `equilibrista-calculos`: o que o aluno digitou, as células certas e as etapas já conferidas. Recarregar a página não apaga nada (a tela volta na etapa em que o aluno parou), e **Recomeçar o exercício** apaga tudo.

O exercício fica guardado só naquele navegador. Num computador compartilhado, cada aluno deve tocar em **Recomeçar o exercício** antes de começar. Numa janela anônima (ou com o armazenamento bloqueado), o exercício funciona igual, só não lembra depois de recarregar. Se os dados de `decisions.js` mudarem, uma célula guardada como certa que não bate mais com a conta nova volta a ficar em aberto.

---

## A versão anterior

`_backup-sistema-de-escolhas.zip` é o sistema de antes, em que o aluno escolhia o caminho de uma das duas e revelava os cálculos prontos. Ele está no `.gitignore` (não vai junto quando a pasta vai pro GitHub) e pode ser apagado quando não fizer mais falta.
