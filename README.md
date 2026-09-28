# Equilibrista de Escolhas – Vanessa e Karine

Duas atividades, cada uma numa aba no alto da tela, e um login na frente das duas:

- **Vanessa e Karine** (`index.html`): o exercício em que o próprio aluno faz os cálculos da planilha "Escolhas Karine e Vanessa - PROFESSOR". São as 4 decisões que a Vanessa e a Karine tomaram ao longo de 40 anos. Em cada uma, ele usa os dados da história para preencher as contas, confere as respostas e, no fim, calcula a diferença total entre as duas (R$ 2.054.300,00). As 4 decisões e a diferença total são 5 etapas, feitas uma de cada vez: a próxima só abre quando todos os cálculos da etapa estão certos.
- **Seu dinheiro no tempo** (`dinheiro-no-tempo.html`): um jogo de escolhas no estilo do Kahoot, para alunos de 13 a 16 anos. São 10 rodadas, do fácil ao difícil, com 3 ou 4 opções. Os pontos não vêm de acertar nem de ser rápido: cada escolha é de um tipo, e cada tipo dá ou tira pontos em 4 categorias (**receita**, **patrimônio**, **conhecimento** e **bem-estar**). No fim, o placar mostra quantos pontos o aluno fez em cada categoria, e o ranking geral, quem fez mais em cada uma. Veja [Seu dinheiro no tempo](#seu-dinheiro-no-tempo).
- **O login** é o mesmo do Fluxo de Caixa, com o mesmo banco (Supabase): quem já tem conta lá entra aqui com o mesmo e-mail e a mesma senha. Veja [O login](#o-login).

Não tem build nem instalação: são páginas `.html` + alguns arquivos `.js` e `.css` estáticos, na mesma identidade visual do Simulador de Renda da Laura. As contas ficam no Supabase do Fluxo de Caixa. Para rodar, basta publicar a pasta no GitHub Pages (ou abrir o `index.html` no navegador, com internet, por causa do login).


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

## Seu dinheiro no tempo

Um jogo de escolhas com o dinheiro, no estilo do Kahoot, pensado para alunos de 13 a 16 anos: difícil o bastante pra fazer pensar, sem virar prova. Não tem resposta certa: cada escolha dá ou tira pontos em 4 categorias, e o placar mostra o que as escolhas do aluno fizeram com o dinheiro dele no tempo.

1. **A abertura.** Como é o jogo (10 rodadas, 3 ou 4 opções, 4 categorias), o que cada categoria quer dizer e, ao lado, o quadro roxo com quanto vale cada tipo de escolha (os que somam e os que tiram pontos). O aluno pode pôr um **apelido** (como no Kahoot), que aparece no ranking, e toca em **Começar o jogo**.

2. **As rodadas.** Uma de cada vez. A situação aparece grande, com uma etiqueta do nível (**Fácil**, **Médio** ou **Difícil**) e, antes das opções, uma contagem (3, 2, 1) dá tempo de todo mundo ler. As opções são botões grandes, cada uma com a sua forma e a sua cor: A é o triângulo rosa, B o losango azul, C o círculo âmbar e D o quadrado verde.

   - **Rodadas 1 a 5 (fácil), 3 opções:** as situações dos slides. A A e a B são as dos slides; a C é nova.
   - **Rodadas 6 a 8 (médio), 4 opções:** situações do dia a dia (o tênis furou, o primeiro salário do Jovem Aprendiz, a tela do celular quebrou).
   - **Rodadas 9 e 10 (difícil), 4 opções:** com armadilhas que parecem prudentes (guardar na gaveta pra fugir de um golpe) e a última rodada vale **pontos em dobro**, como a pergunta final do Kahoot.

   A melhor opção muda de letra de rodada pra rodada, e mais de uma opção pode somar pontos, cada uma numa categoria.

3. **A escolha.** Vale a primeira: depois de tocar, não dá pra trocar (só recomeçando o jogo). Aí o cartão mostra os pontos que ela deu (um número grande por categoria), o tipo da escolha e por quê, a linha da tabela (a escolha e o impacto em cada categoria) e o que cada uma das outras opções teria dado. O botão **Ir para a Rodada 2** abre a próxima.

   Enquanto o aluno joga, o placar fica grudado no alto: quantas rodadas ele respondeu e os pontos de cada categoria, com uma barrinha que sai do 0 pra direita quando soma e pra esquerda, em vermelho, quando tira (no celular, fica só o ícone e o número de cada um). Em cima das rodadas ficam as etapas: as respondidas ganham o selo verde e dá pra voltar nelas pra rever (sem mudar a escolha).

4. **O placar.** Na última rodada, **Ver o meu placar** mostra, pra cada categoria, quantos pontos o aluno fez, a régua do menor ao maior placar possível com o ponto onde ele ficou, e de que escolhas vieram os pontos. Depois vêm o **ranking geral** de cada categoria, quantas escolhas ele fez de cada tipo, a tabela preenchida rodada por rodada (com o total) e o que os pontos mostram: quantas escolhas somaram e quantas tiraram, o ponto forte dele e uma dica pra cada armadilha em que ele caiu (consumo, dinheiro parado, dívida, aposta). **Jogar de novo** apaga as escolhas e já abre a Rodada 1.

### As categorias e os tipos de escolha

As categorias do placar ficam em `CATEGORIES`, em [`backend/js/rounds.js`](backend/js/rounds.js) (até 4):

| Categoria | O que quer dizer |
| --- | --- |
| Receita | O dinheiro que entra: salário, vendas, rendimentos. |
| Patrimônio | O que você tem: dinheiro guardado, investido e os seus bens. |
| Conhecimento | O que você aprende e que pode virar trabalho e renda. |
| Bem-estar | Aproveitar a vida agora, sem se apertar. |

Os tipos de escolha ficam em `KINDS`, no mesmo arquivo. Os 3 primeiros são os do quadro roxo dos slides (com o bem-estar que consumir e equilibrar dão agora); os outros 4 são as armadilhas e o investimento em você:

| Tipo | Pontos |
| --- | --- |
| Gera renda | +2 receita |
| Investir em você | +2 conhecimento |
| Equilibrada | +1 patrimônio e +1 bem-estar |
| Consumo imediato | −2 patrimônio e +1 bem-estar |
| Dinheiro parado | −1 patrimônio |
| Dívida | −1 receita e −2 patrimônio |
| Aposta ou dinheiro fácil | −3 patrimônio |

### As rodadas

Ficam em `LIST`, em [`backend/js/rounds.js`](backend/js/rounds.js). O tipo de cada opção é o `kind` dela, e o professor pode mudar:

| Rodada | A | B | C | D |
| --- | --- | --- | --- | --- |
| 1. R$ 3.000 de presente (fácil) | Trocar de celular: consumo | Investir o dinheiro: gera renda | Fazer um curso de programação ou de edição de vídeo: investir em você | |
| 2. Renda extra com cookies (fácil) | Comprar um tablet novo: consumo | Comprar mais material para aumentar as vendas: gera renda | Pagar um lanche com os amigos e guardar o resto: equilibrada | |
| 3. Juntou R$ 20.000 (fácil) | Dar a entrada em um carro: dívida | Começar um pequeno negócio: gera renda | Deixar tudo guardado em casa, em dinheiro vivo: dinheiro parado | |
| 4. Herança (fácil) | Gastar em conforto imediato: consumo | Dividir entre investimentos: gera renda | Colocar tudo num esquema que promete dobrar o dinheiro: aposta | |
| 5. Sobrou dinheiro no mês (fácil) | Comprar um tênis ou uma bolsa nova: consumo | Investir o que sobrou: gera renda | Guardar como reserva para imprevistos: equilibrada | |
| 6. Tênis furado, R$ 600 (médio) | Parcelar em 10 vezes, com juros: dívida | Um modelo mais simples, à vista, e guardar a diferença: equilibrada | O de R$ 600 à vista, com o que tinha guardado: consumo | Apostar numa bet: aposta |
| 7. Primeiro salário (médio) | Guardar tudo numa gaveta: dinheiro parado | Pagar um curso de inglês: investir em você | Gastar tudo num fim de semana: consumo | Investir uma parte todo mês: gera renda |
| 8. Tela quebrada, R$ 400 (médio) | Usar a reserva para imprevistos: equilibrada | Celular novo em 12 vezes: dívida | Fazer bicos pra pagar o conserto: gera renda | Trocar por um último modelo: consumo |
| 9. "Rende 20% ao mês" (difícil) | Entrar com tudo: aposta | Deixar na gaveta: dinheiro parado | Investimento seguro, como o Tesouro Direto: gera renda | Curso de fotografia e cobrar por fotos: investir em você |
| 10. Notebook de R$ 3.000 (difícil, pontos em dobro) | Crediário em 18 vezes: dívida | Juntar investido e comprar à vista: equilibrada | O mais caro, à vista, com todo o dinheiro: consumo | Apostar numa bet: aposta |

Com essas rodadas, o placar vai de −5 a +16 na receita, de −27 a +6 no patrimônio, de 0 a +6 no conhecimento e de 0 a +9 no bem-estar. O sistema não guarda o placar pronto: mudando o tipo de uma opção, os pontos de um tipo, uma rodada ou uma categoria, as rodadas, o placar, as réguas, o ranking e os textos acompanham. Cada rodada pode ter de 2 a 4 opções, em ordem a partir da A; o nível é o `level` e os pontos em dobro, o `multiplier`.

### O ranking

No placar final, o ranking geral mostra, pra cada categoria (quem fez mais receita, mais patrimônio, mais conhecimento e mais bem-estar), os 5 primeiros colocados entre todo mundo que jogou: ouro, prata e bronze nos três primeiros, e empate divide a posição. Se o aluno ficou mais pra baixo, a posição dele aparece no fim, e a linha dele fica em destaque.

Na abertura, o aluno pode pôr um **apelido** (opcional, até 24 letras). No ranking, o apelido aparece em destaque e, embaixo dele, pequeno, o nome que o aluno cadastrou no login: os alunos se divertem com o apelido e o professor sabe quem é quem. Sem apelido, aparece só o nome do login.

O resultado vai pro ranking assim que o aluno responde a última rodada. Cada aluno tem um resultado só: jogando de novo (ou trocando o apelido e abrindo o placar), o resultado dele é trocado pelo novo. O ranking se atualiza sozinho a cada 15 segundos enquanto está na tela, e o botão **Atualizar** atualiza na hora.

O ranking fica no Supabase do login, na tabela `game_scores`: uma linha por aluno, com o apelido, o nome do login, os pontos de cada categoria e a escolha de cada rodada. Quem está logado lê todas as linhas (é o que monta o ranking), mas só grava, muda e apaga as próprias. Sem a tabela, o jogo funciona igual e, no lugar do ranking, aparece o aviso de que falta criá-la.

---

## O login

As duas páginas abrem numa tela de **Entrar / Criar conta**, a mesma do Fluxo de Caixa e com o mesmo banco: o projeto Supabase `xorqsuqjmvkyzgagdxfz`, em [`frontend/js/config.js`](frontend/js/config.js). Quem já tem conta no Fluxo de Caixa entra com o mesmo e-mail e a mesma senha, e quem cria a conta aqui também pode usar ela lá. A atividade só aparece depois que o aluno entra. No alto, ficam o nome dele e o botão **Sair**.

- **Criar conta** pede o nome completo, o e-mail e uma senha de pelo menos 6 caracteres. O nome vai pros dados do login e pra tabela `profiles` (a mesma do Fluxo de Caixa). Se o projeto pedir a confirmação do e-mail, a tela avisa que o link foi enviado.
- **Esqueceu a senha?** manda um link pro e-mail. O link volta pra página em que o aluno estava, que pede a senha nova.
- **Sair** volta pra tela de entrar. A página recarrega, pra nada do aluno anterior ficar na tela.

Pra os links do e-mail (trocar a senha, confirmar a conta) voltarem pra este sistema, e não pro Fluxo de Caixa, o endereço dele tem que estar em **Authentication → URL Configuration → Redirect URLs**, no painel do Supabase. No GitHub Pages, é algo como `https://financialexperts.github.io/Escolhas-Vanessa-e-Karine/**`.

O banco guarda as contas e o resultado de cada jogo do Seu dinheiro no tempo, pro ranking (veja [O ranking](#o-ranking)). O andamento das atividades (os cálculos feitos, a rodada em que o aluno está) fica guardado no navegador, separado por conta (veja [O que fica guardado no navegador](#o-que-fica-guardado-no-navegador)). O nome do topo, do placar e do ranking é o "Nome completo" do Criar conta.

---

## Estrutura de arquivos

```
index.html                      Vanessa e Karine: abertura, como fazer, linha do tempo,
                                decisões, diferença total e diferença final
dinheiro-no-tempo.html          Seu dinheiro no tempo: abertura, rodadas e placar
frontend/
  css/styles.css                o visual das duas páginas (identidade Financial Experts),
                                as abas do topo e o login
  css/game.css                  o visual que é só do jogo Seu dinheiro no tempo
  img/                          logos, favicon e as duas (vanessa.png e karine.png, já
                                sem fundo; Vanessa.jpg e Karine.avif são as originais)
  js/config.js                  o projeto Supabase do login (o mesmo do Fluxo de Caixa)
  js/supabaseClient.js          liga o cliente do Supabase
  js/auth.js                    a tela de entrar / criar conta / esqueci a senha
  js/session.js                 o login das duas páginas: qual tela aparece, quem entrou,
                                o botão de sair; a atividade só começa depois dele
  js/ui.js                      o que as duas páginas têm em comum: tema claro/escuro,
                                o brilho do vidro e as animações dos ícones
  js/format.js                  formatação de dinheiro, porcentagem, anos, meses, trocas
                                e pontos
  js/icons.js                   os desenhos dos ícones, os quadrinhos e os retratos das duas
  js/toast.js                   o aviso de quando uma ação ainda não pode

  (Vanessa e Karine)
  js/parse.js                   lê o que o aluno digitou numa célula: o número ou a conta
  js/mask.js                    a máscara das células: os pontos de milhar enquanto o aluno
                                digita um número
  js/exercise.js                o estado do exercício, as contas da planilha, a conferência,
                                as regras e o que fica guardado no navegador
  js/sheet.js                   as etapas, os cartões das decisões e o da diferença total,
                                do jeito da planilha, e os medidores do alto
  js/timeline.js                a linha do tempo das decisões
  js/result.js                  a diferença final
  js/app.js                     as duas e o balão, o botão de recomeçar, liga tudo

  (Seu dinheiro no tempo)
  js/game.js                    o estado do jogo, os pontos, as regras e o que fica
                                guardado no navegador
  js/play.js                    as etapas, os cartões das rodadas (a contagem, as opções,
                                o que a escolha deu) e o placar do alto
  js/score.js                   o placar final
  js/ranking.js                 o ranking geral: grava o resultado no Supabase e mostra
                                quem fez mais pontos em cada categoria
  js/game-app.js                a abertura, o apelido, começar e recomeçar, liga tudo
backend/
  js/scenario.js                o período, o objetivo e as duas personagens
  js/decisions.js               as 4 decisões: textos, dados e contas, linha por linha
                                como na planilha
  js/rounds.js                  as 10 rodadas, as opções e o tipo de cada uma, os tipos e
                                os pontos de cada um, e as categorias do placar
```

Os ícones de todas as partes da tela se mexem quando o mouse passa, quando o aluno toca neles ou quando recebem o foco do teclado. No celular, só um toque de verdade anima: passar o dedo para rolar a página não mexe em nada. Quem pede menos movimento no sistema operacional não vê animação nenhuma (o número da diferença final e os do placar já aparecem prontos, e as rodadas não têm a contagem).

Os arquivos em `backend/js/` não tocam no DOM: são só dados. O `exercise.js`, o `game.js`, o `parse.js` e o `mask.js` também não. São o `exercise.js` e o `game.js` que guardam o que o aluno fez, fazem as contas e aplicam as regras; as telas só leem deles.

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
| **Seu dinheiro no tempo:** as situações, as opções e a pergunta de cada rodada | `LIST`, em `backend/js/rounds.js` |
| De que tipo é cada opção e a frase que explica | `kind` e `why` de cada opção, em `backend/js/rounds.js` |
| O nível de uma rodada ou os pontos em dobro | `level` e `multiplier` da rodada; os nomes dos níveis ficam em `LEVELS`, em `backend/js/rounds.js` |
| Quantos pontos vale cada tipo, a explicação dele e a dica do placar | `points`, `about` e `tip` de cada tipo, em `KINDS` (`backend/js/rounds.js`) |
| As categorias do placar (até 4) | `CATEGORIES`, em `backend/js/rounds.js` |
| A contagem antes das opções (3, 2, 1) | `CONTAGEM` e `PASSO`, no `frontend/js/play.js` |
| As mensagens do pé de cada rodada | `statusText()`, no `frontend/js/play.js` |
| O que os pontos mostram, no placar | `insightHTML()` e `LICAO`, no `frontend/js/score.js` |
| Quantos aparecem no ranking e de quanto em quanto tempo ele se atualiza | `TOP` e `POLL`, no `frontend/js/ranking.js` |
| Os textos fixos do jogo (títulos, abertura, rodapé) | `dinheiro-no-tempo.html` |
| O visual do jogo | `frontend/css/game.css` |
| **Login:** o projeto Supabase | `frontend/js/config.js` |
| Os textos da tela de entrar e as mensagens de erro | `markup()` e `friendlyError()`, no `frontend/js/auth.js` |
| As abas do topo (uma por atividade) | o `<nav class="tabs">` no alto de `index.html` e de `dinheiro-no-tempo.html` (a mesma lista nas duas) |

Cada conta de `decisions.js` é uma lista como `["desv", "×", "preco"]`: os nomes são linhas de cima da mesma pessoa, `"v.total"` e `"k.total"` são linhas da Vanessa e da Karine (usado na diferença), e `"years"` são os anos que a decisão pesa (40, 32 ou 25). Um número fixo é `{ n: 12, unit: "meses" }`. A dica que o aluno vê quando erra é essa mesma conta, escrita com os nomes das linhas. Nos textos, `{v.perda}` e `{k.perda}` viram os valores da Vanessa e da Karine, `{diff}` a diferença entre as duas, `{years}` os anos da decisão e `{end}` o último ano do período.

A cor de cada uma (rosa para a Vanessa, azul para a Karine) aparece no fundo do retrato e na bolinha do balão. As duas ficam em `--vanessa` e `--karine`, no `styles.css`, e o par foi conferido para quem tem daltonismo, no tema claro e no escuro. O laranja das linhas de dados é o `--data`.

---

## O que fica guardado no navegador

- **O tema** claro ou escuro, no `localStorage`, com a mesma chave (`tema`) do Simulador de Renda e do Fluxo de Caixa: publicados no mesmo endereço, os sistemas lembram do mesmo tema.
- **O exercício** da Vanessa e da Karine, na chave `equilibrista-calculos:` + o id da conta: o que o aluno digitou, as células certas e as etapas já conferidas. Recarregar a página não apaga nada (a tela volta na etapa em que o aluno parou), e **Recomeçar o exercício** apaga tudo.
- **O jogo** Seu dinheiro no tempo, na chave `dinheiro-no-tempo:` + o id da conta: a escolha de cada rodada e o apelido. Recarregar volta na rodada em que o aluno parou. (O resultado de cada jogo terminado também vai pro Supabase, pro ranking.)
- **A sessão do login**, guardada pelo próprio Supabase.

O que o aluno faz fica guardado só naquele navegador, mas separado por conta: num computador compartilhado, cada aluno que entra vê só o que ele fez (e quem sai volta pra tela de entrar). O exercício feito antes de existir o login (na chave antiga, `equilibrista-calculos`) passa pra primeira conta que entrar naquele navegador. Numa janela anônima (ou com o armazenamento bloqueado), tudo funciona igual, só não lembra depois de recarregar. Se os dados de `decisions.js` mudarem, uma célula guardada como certa que não bate mais com a conta nova volta a ficar em aberto; se as rodadas de `rounds.js` mudarem, uma escolha que não existe mais é esquecida.

---

## A versão anterior

`_backup-sistema-de-escolhas.zip` é o sistema de antes, em que o aluno escolhia o caminho de uma das duas e revelava os cálculos prontos. Ele está no `.gitignore` (não vai junto quando a pasta vai pro GitHub) e pode ser apagado quando não fizer mais falta.
