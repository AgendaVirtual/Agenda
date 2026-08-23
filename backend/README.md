# Planner Virtual — Backend

Backend em Node.js + TypeScript + Express, com persistência em arquivos JSON.

## Como rodar

```bash
npm install
npm run dev
```

O servidor sobe em `http://localhost:3000`. Os dados são salvos automaticamente
em `backend/data/*.json` (criado na primeira escrita).

## O que já está pronto

- Contrato compartilhado: `src/types/enums.ts` e `src/types/entities.ts`
- Infraestrutura: `FileRepository<T>` genérico + `AppError`/`errorHandler`
- Módulo de Metas: CRUD completo + atualização de status
- Módulo de Tarefas: CRUD + validação de bloco de tempo + checagem de sobreposição de horário
- Módulo de Categorias: CRUD + seed automático das categorias padrão
- Módulo de Lembretes: CRUD + cálculo de próxima ocorrência (recorrentes)
- Módulo de Relatórios: taxa de conclusão, turno/categoria mais produtivos
- Painel Analítico: resumo do dia

## Endpoints

| Método | Rota                        |
|--------|------------------------------|
| POST   | /api/goals                   |
| GET    | /api/goals?period=            |
| PATCH  | /api/goals/:id/status         |
| POST   | /api/tasks                    |
| GET    | /api/tasks?date=               |
| PUT    | /api/tasks/:id                 |
| PATCH  | /api/tasks/:id/status           |
| DELETE | /api/tasks/:id                  |
| POST   | /api/categories                  |
| GET    | /api/categories                   |
| POST   | /api/reminders                     |
| GET    | /api/reminders?upcoming=true        |
| DELETE | /api/reminders/:id                   |
| GET    | /api/reports?type=weekly\|monthly\|yearly |
| GET    | /api/dashboard/today                   |

## O que falta (ajustar quando o grupo definir a divisão)

- Filtrar relatórios por data real (hoje pega todos os registros)
- Testes unitários por serviço
- Validações adicionais conforme o time for combinando o contrato final (seção 6 do PDF)
