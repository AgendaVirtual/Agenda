# Backend — Pessoa 3: Categorias e Lembretes

Este módulo implementa as responsabilidades da Pessoa 3 do backend do Planner Virtual.

## Categorias

- Interface `Category` e DTOs de criação e atualização.
- `CategoryRepository` baseado no `FileRepository<Category>`.
- CRUD completo de categorias.
- Validação de nome e cor hexadecimal.
- Garantia de cor única.
- Atribuição automática de cor com `assignDefaultColor()`.
- Criação automática das categorias padrão:
    - Faculdade;
    - Trabalho;
    - Saúde;
    - Lazer;
    - Projetos pessoais;
    - Estudos.

## Lembretes

- Interface `Reminder`.
- Enums `ReminderType` e `ReminderRecurrence`.
- `ReminderRepository` baseado no `FileRepository<Reminder>`.
- CRUD completo de lembretes.
- Validação de descrição, tipo, recorrência, data, dia da semana e horário.
- Cálculo da próxima ocorrência com `getNextOccurrence()`.
- Listagem dos lembretes dos próximos N dias.

### Regras

- Lembrete único exige `date` no formato `YYYY-MM-DD`.
- Lembrete semanal exige `dayOfWeek` entre `0` e `6`.
- `0` representa domingo e `6` representa sábado.

## Endpoints de Categorias

- `POST /api/categories`
- `GET /api/categories`
- `GET /api/categories/:id`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

## Endpoints de Lembretes

- `POST /api/reminders`
- `GET /api/reminders`
- `GET /api/reminders?upcoming=true&days=7`
- `GET /api/reminders/:id`
- `PUT /api/reminders/:id`
- `DELETE /api/reminders/:id`

## Testes

Execute:

```bash
npm test
```

Foram adicionados testes unitários dos serviços e testes de integração das rotas HTTP de Categorias e Lembretes.