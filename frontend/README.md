# Nexo - Frontend

Interface do Nexo, o planner da equipe. React 19 + TypeScript + Vite + Tailwind CSS v4.

## Como rodar

O backend precisa estar no ar primeiro:

```bash
cd ../backend && npm install && npm run dev   # sobe em :3000
```

Depois, em outro terminal:

```bash
npm install
npm run dev                                    # sobe em :5173
```

O front chama `/api/...` na **própria origem**, e o Vite repassa ao backend
(`server.proxy` em `vite.config.ts`). Por isso não há CORS para configurar.

Para apontar para outro backend, crie um `.env` com:

```
VITE_API_URL=http://outro-host:3000/api
```

### Abrir no celular, pela rede local

`server.host` já está ligado, então o Vite escuta em todas as interfaces. Ele
imprime o endereço "Network" ao subir; é só abrir esse endereço no celular,
no mesmo Wi-Fi e com o backend rodando na máquina.

Duas coisas que costumam confundir:

- O endereço **precisa ser o IP da máquina**, não `localhost` - no celular,
  `localhost` é o próprio celular. É justamente por isso que a base da API é
  relativa: com caminho absoluto para `localhost:3000`, a tela abriria e
  nenhum dado carregaria.
- Perfil, menu recolhido e notificações lidas ficam no `localStorage`, que é
  **por origem**. Aberto pelo IP, o app não enxerga o que você salvou em
  `localhost` - a saudação vem sem nome até preencher em Ajustes.

## Telas

| Rota           | Tela                | O que a especificação pede                                        |
|----------------|---------------------|-------------------------------------------------------------------|
| `/`            | Painel              | Resumo do dia + indicador geral de produtividade                  |
| `/dia`         | Meu dia             | Planejamento em blocos de meia hora, uma hora ou turno            |
| `/metas`       | Metas               | Metas semanais, mensais e anuais com status de resultado          |
| `/lembretes`   | Lembretes           | Lembretes únicos ou recorrentes, por tipo                         |
| `/relatorios`  | Relatórios          | Taxas, período e turno mais produtivos, ranking de categorias     |
| `/ajustes`     | Ajustes             | Perfil, categorias, faixas de turno (chega-se pelo avatar)        |

## Design system

Os tokens vivem em `src/index.css`, no bloco `@theme` do Tailwind v4. **Não escreva
cor em hex dentro de componente** - use os utilitários gerados (`bg-surface`,
`text-ink-muted`, `border-hairline`, `rounded-card`, `rounded-pill`).

O sistema é derivado do arquivo de direcionamento do time, com duas adaptações
deliberadas, documentadas em comentário no topo do `index.css`:

1. **TWK Lausanne** é fonte comercial e não pode ser distribuída. Usamos
   **Hanken Grotesk**, a grotesca mais próxima disponível gratuitamente.
2. A escala do documento é de **landing page** (display de 102px, padding de
   120px). Aqui usamos o terço inferior dela, porque planner é ferramenta densa.
   A identidade - paleta, alvo de 44px, hierarquia por peso - foi mantida
   integralmente.

Uma terceira rodada, o **refinamento orgânico**, trocou o
pill de 100px pelo raio `--radius-soft` de 10px, esvaziou as molduras (linha de
tarefa e cartão por turno perderam borda) e esquentou a lateral de `#f1efec`
para `#faf7f2`. O princípio: menos caixa desenhada, o espaço faz a separação.

A parte 2 do mesmo handoff trocou o **acento de ciano para ardósia**
(`#00b2ff` → `#55649e`) e reformulou o Painel. A troca do acento não é só de
gosto: o ciano dava **2,38:1** sobre branco e reprovava em WCAG AA como cor de
texto, e o acento também pinta foco visível e rótulo de selo. O ardósia dá
**5,67:1**. O token `info` deixou de existir na mesma passagem - seu valor já
era exatamente esse ardósia, então `Badge tone="info"` renderizava idêntico a
`tone="accent"`.

### Componentes compartilhados

Em `src/components/ui/`. Antes de escrever um botão, campo ou card novo, use os
que já existem:

- `Button` / `IconButton` - raio 10px (`rounded-soft`), 40px no desktop e 44px
  no toque (`h-11 lg:h-10`), variantes primary/secondary/ghost/ghost-danger/danger.
  `secondary` e `danger` são preenchidos, sem contorno
- `Card` / `SectionTitle` - raio 16px, borda hairline, sem sombra em repouso
- `Field` + `TextInput` / `SelectInput` / `TextArea` - campo **preenchido**:
  cinza sem borda em repouso, branco com borda de acento no foco. Rótulo amarrado
  ao campo, estado de erro.
  Passe `fullWidth={false}` fora de formulário (barras de ferramentas) e
  `controlSize="sm"` dentro de linha de lista
- `TaskRow` - uma tarefa é **linha solta**, sem moldura nem divisória: o que a
  separa das vizinhas é o espaço, e o fundo só aparece no hover. Altura mínima de
  48px, nunca fixa, porque em tela estreita a linha quebra em duas
- `CategoryTag` / `PriorityBadge` - as duas regras da linha moram aqui, e não em
  quem chama: categoria é ponto colorido + nome (sem chip), e prioridade **Baixa
  não vira selo** - se tudo tem etiqueta, nada se destaca
- `DayFocusCard` - protagonista do Painel: pendentes em 76px + a **linha do
  dia**. Substituiu os quatro `StatTile` iguais, que não tinham hierarquia
  nenhuma entre si
- `NotificationsBell` - sino da barra do topo com a lista suspensa
- `Checkbox` - círculo de 18px dentro de alvo de toque de 44px
- `Modal` - criação e edição acontecem em modal, nunca em formulário embutido
- `Badge` / `DotBadge` - `DotBadge` é para categorias (cor vem do banco)
- `StatTile` / `Meter` / `BlockGauge` / `BarList` / `Highlight` - painel e relatórios
- `LoadingState` / `EmptyState` / `ErrorBanner` - estados de tela

**Quando usar `Meter` e quando usar `BlockGauge`:** `BlockGauge` (um bloco por
tarefa) é para o resumo do dia, onde o total é pequeno e "4 de 7" diz mais que
"57%". `Meter` (barra contínua com porcentagem) é para os relatórios, onde o
total é grande o bastante para uma porcentagem significar alguma coisa.

### Regras de movimento

As animações são **classes CSS** definidas em `src/index.css` (`anim-grow`,
`anim-block`, `anim-highlight`) - nunca JavaScript. O motivo é direto: animação
dirigida por JS passa por cima do bloco `prefers-reduced-motion` e exigiria
`matchMedia` em cada componente. Em CSS, a preferência do usuário é respeitada
de graça, num lugar só. Verificado: com `prefers-reduced-motion: reduce`, os
elementos animados caem para duração 0,00001s.

Duas regras: **só anima na montagem ou em resposta a uma ação do usuário**, e
nada anima a cada re-render.

A transição entre telas acontece em **dois níveis**: `anim-rise` no `<main>`
(com `key` no pathname, em `AppShell`) leva o cabeçalho e os filtros, e
`anim-rise-late` leva a região de dados um respiro depois. **Não há esqueleto de
carregamento de propósito** - o backend é local e responde em milissegundos; um
esqueleto que vive dois quadros pisca, o que lê pior que nada.

Ao trocar de rota o scroll volta ao topo (`AppShell`). Sem isso, sair do fim de
uma tela alta para uma curta deixava o scroll no meio e a animação acontecia
fora da vista.

Não existe variante de elevação no hover para `Card`. Neste app nenhum card é
clicável por inteiro (todos contêm seletor e botões dentro), e elevar um card
não clicável mente sobre a affordance.

### A linha do dia (`DayFocusCard`)

Janela fixa de **06:30 às 23:30**. Tarefa concluída vira ponto cheio no acento;
pendente vira círculo vazado **na cor da categoria**, tracejado quando é tarefa
de turno e não de horário - o tracejado diz "em algum momento daqui", que é a
verdade do dado. Tarefa de turno é posicionada no **meio do próprio turno**,
lido das faixas configuradas em Ajustes, e não de 12h/18h fixos.

A cor da categoria nunca aparece sozinha nessa linha: toda pendente carrega o
nome da tarefa logo acima do próprio marcador. Quando dois rótulos vizinhos se
sobrepõem, o primeiro passa a se estender para a esquerda do marcador e o
segundo para a direita, em vez de empilharem.

O traço do agora e a barra do decorrido saem do relógio real, com
`setInterval` de 30s limpo no unmount. Medido: às 17:59 a barra fecha em
**67,6%** da janela, e o traço cai exatamente no fim dela. Sob
`prefers-reduced-motion` a animação colapsa mas a largura final continua certa.

### Notificações

Não há mural de eventos no servidor. Cada notificação é um **lembrete real** da
janela de 7 dias, o mesmo dado que alimenta a contagem do sino - encher a lista
com "meta atingiu 60%" seria fabricar histórico que o app não guarda.

"Lida" também não existe no backend, então é marcado no próprio navegador. É
uma promessa que dá para cumprir: o estado é do aparelho, não da conta.

### Controles que aguardam backend

"Sair" está no rodapé da lateral, com a aparência que o desenho pede, e
**desabilitado**: não existe usuário, login nem senha no servidor, e um botão
que parece funcionar e não faz nada é pior que um visivelmente indisponível.
Quando `POST /api/auth/logout` existir, troca-se o `disabled` pela chamada.
Mesma regra da seção de senha em Ajustes.

### Regra de cor e acessibilidade

As cores de categoria vêm do banco e são a codificação visual que a
especificação pede. Elas **não** são seguras para daltonismo em seis matizes -
medimos: verde e laranja da paleta semeada ficam a ΔE 3.6 sob protanopia.

Por isso vale uma regra sem exceção: **a cor de categoria nunca aparece
sozinha**. Sempre acompanhada do nome em texto (é o que `DotBadge` e `BarList`
garantem). Se você criar um componente novo que use cor de categoria, mantenha
essa regra.

### Casco e navegação

Menu **lateral a partir de 1024px**, barra superior abaixo disso - os dois em
`components/AppShell.tsx`, compartilhando a mesma lista `NAV`.

A lateral não foi escolha de gosto: a 1440px sobravam **120px mortos de cada
lado** do conteúdo, e a faixa do menu no topo ocupava 1076px para cinco itens
curtos. A lateral aproveita uma dessas margens e devolve os **68px de altura**
que o cabeçalho cobrava em toda tela. No celular ela vira a barra superior de
antes: 240px de menu numa tela de 390px não deixa largura para conteúdo.

**O app é branco. O único elemento cinza é a lateral**, que é um cartão com
cantos arredondados recuado 12px por dentro do branco, sem divisória. É daí que
vem a sensação de integrado: a lateral flutua no mesmo plano do conteúdo, em vez
de ser um painel colado na borda. O item ativo recebe branco, então parece
continuar dentro da área de conteúdo.

**Marca:** o símbolo vem de `src/assets/nexo-symbol.svg` e o nome "Nexo" é
escrito em HTML, não pelo lockup pronto. O lockup embute TWK Lausanne, que é
comercial e cairia em fallback; escrevendo o nome em HTML ele usa a mesma
tipografia do app.

**Controles discretos.** Campos que se repetem em lista (`StatusSelector`, o
seletor de resultado das metas, a barra de Meu dia) usam `variant="subtle"`:
a borda existe mas é transparente, e só aparece no hover e no foco. É isso que
faz o controle parecer parte da página em vez de peça de interface colada por
cima. A borda existe sempre para o texto não pular 1px quando ela surge.

O sino da barra do topo escuta `aoMudarLembretes` de
`services/reminderApi.ts`. O aviso é emitido **de dentro do próprio
`createReminder`/`deleteReminder`**, não das telas: assim qualquer chamada
nova dispara a atualização sem alguém precisar lembrar. Antes a contagem só
era refeita na troca de rota, então criar ou remover um lembrete estando já
na tela deixava o número velho.

**Barra do topo** (`components/TopBar.tsx`): trilha à esquerda, sino de
lembretes com contagem real e avatar à direita. Sem fundo, sem borda, sem
sombra - ela vive no mesmo branco do conteúdo. Só entram ações que fazem
alguma coisa: a referência tem compartilhar, favoritar e comentar, e nada
disso existe aqui. Não há login no sistema, então o avatar mostra uma inicial
como marcador, sem inventar uma conta.

Os itens são agrupados sob rótulos curtos em caixa alta ("Hoje",
"Acompanhamento"). Com cinco itens, agrupar só se justifica se disser algo
verdadeiro: "hoje" é o que se opera agora, "acompanhamento" é o que se revisa
depois.

No desktop a área de conteúdo **rola por dentro do app**, não pela janela, o que
mantém a lateral sempre inteira na tela. Por isso o retorno ao topo na troca de
rota cobre os dois modelos: `window.scrollTo` e o contêiner.

Ícones da navegação são SVG em traço, grade de 24, todos no mesmo estilo -
nunca emoji.

O menu **recolhe para só ícones** (224px → 64px) pelo botão no rodapé da
lateral, e a preferência fica em `localStorage`. Recolhido, o rótulo continua
no DOM com `sr-only` - o nome acessível do link vem dele, não do `title`, que
serve só como dica de mouse. Área útil a 1440px: 1216px com o menu aberto,
1376px recolhido.

O teto da área útil é **1600px**, não 1200: a 1728px o antigo deixava 152px
mortos de cada lado. O teto só entra em telas muito largas, onde uma linha de
tarefa sem limite ficaria com um vão enorme entre o texto e as ações.

### Modal

Usa `<dialog>` nativo com `showModal()`, não um overlay próprio. O elemento
nativo entrega de graça quatro coisas que uma `div` não entrega: camada
superior, prisão de foco, `Esc` para fechar e o resto da página inerte para
leitores de tela. Verificado: 14 tabulações sem escapar.

Três armadilhas que já custaram tempo e estão resolvidas no componente:

1. **`m-auto` é obrigatório.** O navegador centraliza `<dialog>` com
   `margin: auto`, e o preflight do Tailwind zera a margem de tudo. Sem isso o
   modal cola no canto superior esquerdo e o clique no fundo cai dentro dele.
2. **O conteúdo só monta com o modal aberto** (`{open && children}`). Montado
   sempre, um formulário nasce antes de as listas assíncronas chegarem e
   inicializa os campos vazios - foi exatamente o que aconteceu com a categoria.
3. **`::backdrop` precisa de regra própria de `prefers-reduced-motion`.** O
   seletor universal não o alcança, nem `*::before` / `*::after`.

O fundo do modal escurece (40%) **e desfoca** (`blur(4px)`), pelas regras
`dialog::backdrop` em `index.css`. O desfoque mora no `::backdrop`, que fica
entre o modal e a página: assim ele afeta só o que está atrás. Aplicar filtro
no conteúdo em si criaria contexto de empilhamento e poderia arrastar o próprio
modal junto. O escurecimento desceu de 50% para 40% porque, somado ao desfoque,
50% apagava o contexto por completo.

O foco inicial vai para o primeiro campo, não para o botão Fechar - `showModal()`
foca o primeiro focável em ordem de DOM, que seria o Fechar do cabeçalho.

### Densidade

Medida, não estimada. Linha de lista fecha em **48px no desktop**: `4+4` de
padding vertical `+ 40px` do controle mais alto. **O piso é o `<select>`** - a
área de clique de um `<select>` nativo é exatamente a sua caixa, e não existe
truque de margem negativa que estenda o alvo sem aumentar a caixa (ao contrário
do que `Checkbox` e os links de atalho do Painel fazem).

Daí a regra `h-11 lg:h-10` nos controles: **40px é o visual que o design pede,
44px é o alvo que o dedo exige**. Em vez de escolher um, o ponto de corte `lg`
decide - tela de toque fica em 44px, mouse fica em 40px.

Em 390px a linha vai a **120px**, porque descrição, categoria, prioridade e as
três ações não cabem lado a lado. Não é o `w-full` que empurra: medimos sem ele
e a quebra acontece igual.

**As ações da linha somem em repouso** e voltam no hover ou no `focus-within` -
mas só a partir de `lg`. Em tela de toque não existe hover, então esconder ali
deixaria Editar e Remover inalcançáveis. Verificado nos dois caminhos: no
desktop a opacidade em repouso é 0, e dar foco no select por teclado, sem mouse
nenhum, revela as ações.

Cuidado com **colisão de utilitários do Tailwind**: `h-[50px]` e `h-11` no mesmo
elemento não se resolvem pela ordem na string de classes, e sim pela ordem no
CSS gerado. Já mordeu duas vezes neste projeto (`w-full`/`w-auto` e
`h-[50px]`/`h-11`). Por isso largura e altura dos controles são **props**, não
classes passadas de fora.

### Hierarquia e cor

Cada tela tem **um** protagonista. No Painel é o indicador de produtividade -
os quatro `StatTile` abaixo dele são faixa secundária de propósito e não devem
crescer para competir.

O acento (`accent`) aparece em três lugares e só neles: o anel de foco, o
indicador de produtividade e o marcador de "agora" em Meu dia. Essa contenção é
o que separa "cor contida" de "sem cor" - não espalhe.

### Preferências

`services/preferencias.ts` guarda perfil, faixas de turno e menu recolhido no
navegador, com o mesmo padrão de aviso de `reminderApi`. **Toda leitura e
escrita passa por ali de propósito**: quando o backend expuser usuário, troca-se
a fonte dentro desse arquivo e nenhuma tela muda.

Valores vindos do armazenamento são tratados como entrada não confiável e
normalizados na leitura. Uma tarde que comece depois da noite quebraria o
agrupamento do dia em silêncio.

As faixas de turno eram 12h e 18h fixos em `DailyPlannerPage`. Agora são o
padrão, não a regra.

## Dependências do backend ainda abertas

Três telas convivem hoje com limitações do backend, sinalizadas em comentário no
código:

- `GET /api/reminders` devolve lista vazia sem `?upcoming=true`, então a tela de
  lembretes só mostra os próximos 7 dias.
- Metas não têm rota de edição nem exclusão (`PUT` e `DELETE` respondem 404).
- O "turno mais produtivo" do relatório ignora tarefas criadas com horário.
- O backend calcula "hoje" em UTC e o frontend em horário local; depois das 21h
  em UTC−3 os dois discordam. `src/utils/date.ts` mantém horário local de
  propósito.

Para a tela de Ajustes ficar inteira, o backend precisa expor:

- `PUT` e `DELETE` de categoria (criar já funciona). Na exclusão, decidir o que
  fazer com tarefas e metas que usam a categoria; bloquear é mais simples e mais
  honesto que reatribuir em silêncio. Sem o `DELETE`, **uma categoria criada por
  engano fica para sempre** e só sai editando `backend/data/categories.json` na
  mão.
- Corrigir `CategoryService.create`, que hoje barra **cor** duplicada e aceita
  **nome** duplicado: dá para ter duas "Faculdade", mas não duas azuis. Enquanto
  essa regra existir, o formulário precisa oferecer **cor livre** além da paleta
  sugerida, senão esgotadas as seis o usuário fica sem saída: todas as sugeridas
  desabilitadas e nenhum outro caminho. O seletor de cor livre e a trava de cor
  repetida em `pages/SettingsPage.tsx` existem por causa disso.
- Entidade `User`, `GET`/`PUT /api/me`, login e troca de senha.
- Guardar as faixas de turno junto do usuário **e usá-las no relatório**. Hoje o
  servidor calcula turno mais produtivo com 12h e 18h fixos, então mudar a
  preferência na tela faz relatório e tela discordarem.
