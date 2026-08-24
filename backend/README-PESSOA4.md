# Backend — Pessoa 4: Relatórios + Painel Analítico

Esta implementação foi feita diretamente sobre a estrutura do `Agenda-main`, preservando o padrão de TypeScript, `FileRepository`, services, controllers e resposta `{ success, data?, error? }` já existentes. A organização também segue a ideia de separação por responsabilidade vista no Scientia: cálculo puro separado de service, service sem conhecer Express e controller apenas traduzindo HTTP.

## O que é da Pessoa 4

- `src/utils/reportCalculations.ts`
  - `calculateCompletionRate()`
  - `findMostProductiveShift()`
  - `findMostProductivePeriod()`
  - `groupByCategory()`
  - `calculateProductivityIndex()`
  - auxiliares de intervalo/data
- `src/services/ReportService.ts`
- `src/services/DashboardService.ts`
- `src/controllers/ReportController.ts`
- `src/controllers/DashboardController.ts`
- extensão de `ReportDTO` e `DashboardSummaryDTO` em `src/types/entities.ts`
- testes em `backend/tests/`

## Mínimo usado da Pessoa 3

A Pessoa 4 precisa de lembretes para montar o painel, mas não precisa implementar o CRUD da Pessoa 3. Para reduzir o acoplamento foi criado somente:

- `src/repositories/ReminderRepository.ts`: herda `FileRepository<Reminder>` e fornece leitura do arquivo `reminders.json`.

O `DashboardService` lê os lembretes desse repositório e calcula localmente quais ocorrências estão nos próximos 7 dias. Assim a Pessoa 4 já funciona agora; quando a Pessoa 3 terminar o `ReminderService`, o serviço da Pessoa 4 não precisa ser refeito.

O `ReminderService.ts` existente foi apenas ajustado para importar esse repositório, sem ampliar o escopo do CRUD da Pessoa 3.

## Relatórios

Endpoint:

```text
GET /api/reports?type=weekly|monthly|yearly&date=...
```

Formatos aceitos para `date`:

- `weekly`: `YYYY-MM-DD`
- `monthly`: `YYYY-MM` ou `YYYY-MM-DD`
- `yearly`: `YYYY` ou `YYYY-MM-DD`
- sem `date`: usa a data atual

A semana é considerada de segunda a domingo.

O relatório retorna quantidade e taxa de metas cumpridas/tarefas executadas, semana ou mês mais produtivo, turno mais produtivo, categoria de tarefa executada mais frequente e rankings por categoria de tarefas/metas realizadas.

A regra de "mais produtivo" usa **taxa de conclusão**, nunca volume bruto.

## Painel

Endpoint:

```text
GET /api/dashboard/today
```

Retorna tarefas pendentes/concluídas do dia, metas em andamento e ativas no dia, lembretes dos próximos 7 dias e índice de produtividade.

Como o PDF exige um "indicador geral de produtividade" mas não define fórmula, o índice foi implementado como a taxa de tarefas executadas entre as tarefas planejadas para o dia. Isso evita inventar pesos arbitrários para metas e status parciais.

## Testes

Dentro de `backend/`:

```bash
npm install
npm run typecheck
npm test
```

`npm test` compila o TypeScript e usa `node:test`, seguindo a abordagem simples de testes encontrada no Scientia e sem adicionar biblioteca de teste nova.
