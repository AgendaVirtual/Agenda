const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { describe, it, beforeEach, afterEach } = require("node:test");

const { FileRepository } = require("../dist/persistence/FileRepository");
const { TaskService } = require("../dist/services/TaskService");
const { GoalService } = require("../dist/services/GoalService");
const { ReminderService } = require("../dist/services/ReminderService");
const { createReminderRouter } = require("../dist/controllers/ReminderController");
const { createDashboardRouter } = require("../dist/controllers/DashboardController");
const { errorHandler } = require("../dist/utils/errors");
const {
  parseCreateTaskBody,
  parseTaskStatusBody,
  parseCreateGoalBody,
  parseGoalStatusBody,
  parseCreateCategoryBody,
  parseCreateReminderBody,
  parseUpcomingQuery,
} = require("../dist/utils/validation");
const { getLocalISODate } = require("../dist/utils/reportCalculations");
const {
  GoalPeriod,
  GoalStatus,
  ReminderRecurrence,
  ReminderType,
  Shift,
  TaskPriority,
  TaskStatus,
  TimeBlockType,
} = require("../dist/types/enums");
const express = require("express");

class MemoryRepository {
  constructor(items = []) {
    this.items = items.map((item) => ({ ...item }));
    this.sequence = 1;
  }

  async findAll() {
    return this.items.map((item) => ({ ...item }));
  }

  async findById(id) {
    const found = this.items.find((item) => item.id === id);
    return found ? { ...found } : undefined;
  }

  async create(data) {
    const created = { ...data, id: `memory-${this.sequence++}` };
    this.items.push(created);
    return { ...created };
  }

  async update(id, data) {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) return undefined;
    this.items[index] = { ...this.items[index], ...data };
    return { ...this.items[index] };
  }

  async delete(id) {
    const before = this.items.length;
    this.items = this.items.filter((item) => item.id !== id);
    return this.items.length !== before;
  }
}

function category(overrides = {}) {
  return {
    id: "cat-1",
    name: "Estudos",
    color: "#00BCD4",
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    id: "task-1",
    description: "Estudar",
    categoryId: "cat-1",
    date: "2026-08-25",
    timeBlockType: TimeBlockType.UMA_HORA,
    time: "10:00",
    status: TaskStatus.PENDENTE,
    priority: TaskPriority.MEDIA,
    ...overrides,
  };
}

function goal(overrides = {}) {
  return {
    id: "goal-1",
    description: "Concluir trabalho",
    categoryId: "cat-1",
    period: GoalPeriod.MENSAL,
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    status: GoalStatus.EM_ANDAMENTO,
    ...overrides,
  };
}

async function startTestServer(routerPath, router) {
  const app = express();
  app.use(express.json());
  app.use(routerPath, router);
  app.use(errorHandler);

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });

  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

describe("01 - PUT /api/tasks/:id não pode corromper registro", () => {
  it("FileRepository preserva o id mesmo se data tentar sobrescrevê-lo", async () => {
    const fileName = `test-id-immutability-${process.pid}-${Date.now()}.json`;
    const filePath = path.join(process.cwd(), "data", fileName);
    const repository = new FileRepository(fileName);

    try {
      const created = await repository.create({ name: "Original" });
      const updated = await repository.update(created.id, {
        id: "HACKEADO",
        name: "Alterado",
      });

      assert.equal(updated.id, created.id);
      assert.equal(updated.name, "Alterado");
      assert.equal((await repository.findById(created.id)).id, created.id);
      assert.equal(await repository.findById("HACKEADO"), undefined);
    } finally {
      await fs.rm(filePath, { force: true });
    }
  });

  it("TaskService rejeita id e status no update e não altera o registro", async () => {
    const taskRepository = new MemoryRepository([task()]);
    const categoryRepository = new MemoryRepository([category()]);
    const service = new TaskService(taskRepository, categoryRepository);

    await assert.rejects(
      () => service.update("task-1", { id: "HACKEADO" }),
      /id da tarefa não pode ser alterado/
    );
    await assert.rejects(
      () => service.update("task-1", { status: "BANANA" }),
      /status deve ser alterado/
    );

    assert.deepEqual(await taskRepository.findById("task-1"), task());
  });

  it("revalida categoria e bloco de tempo antes de persistir update", async () => {
    const taskRepository = new MemoryRepository([task()]);
    const categoryRepository = new MemoryRepository([category()]);
    const service = new TaskService(taskRepository, categoryRepository);

    await assert.rejects(
      () => service.update("task-1", { categoryId: "cat-inexistente" }),
      /não existe/
    );

    await assert.rejects(
      () =>
        service.update("task-1", {
          timeBlockType: TimeBlockType.TURNO,
          shift: null,
        }),
      /exigem um turno/
    );

    assert.deepEqual(await taskRepository.findById("task-1"), task());
  });

  it("ignora a própria tarefa ao verificar conflito, mas bloqueia outra no mesmo horário", async () => {
    const taskRepository = new MemoryRepository([
      task({ id: "task-1", time: "10:00" }),
      task({ id: "task-2", time: "11:00" }),
    ]);
    const categoryRepository = new MemoryRepository([category()]);
    const service = new TaskService(taskRepository, categoryRepository);

    await assert.doesNotReject(() =>
      service.update("task-1", { description: "Estudar mais" })
    );

    await assert.rejects(
      () => service.update("task-1", { time: "11:00" }),
      /mesmo horário e dia/
    );
  });

  it("limpa shift/time antigo ao trocar o tipo do bloco", async () => {
    const taskRepository = new MemoryRepository([
      task({
        id: "turno",
        timeBlockType: TimeBlockType.TURNO,
        time: undefined,
        shift: Shift.MANHA,
      }),
      task({ id: "hora", time: "14:00", shift: undefined }),
    ]);
    const categoryRepository = new MemoryRepository([category()]);
    const service = new TaskService(taskRepository, categoryRepository);

    const porHorario = await service.update("turno", {
      timeBlockType: TimeBlockType.UMA_HORA,
      time: "09:00",
    });
    assert.equal(porHorario.time, "09:00");
    assert.equal(porHorario.shift, undefined);

    const porTurno = await service.update("hora", {
      timeBlockType: TimeBlockType.TURNO,
      shift: Shift.NOITE,
    });
    assert.equal(porTurno.shift, Shift.NOITE);
    assert.equal(porTurno.time, undefined);
  });
});

describe("02 - validação de entrada", () => {
  const validTaskBody = {
    description: "Estudar",
    categoryId: "cat-1",
    date: "2026-08-25",
    timeBlockType: TimeBlockType.UMA_HORA,
    time: "10:00",
    priority: TaskPriority.MEDIA,
  };

  it("rejeita tarefa sem descrição, data inválida, enum inválido e campos proibidos", () => {
    assert.throws(
      () => parseCreateTaskBody({ ...validTaskBody, description: "   " }),
      /Descrição.*obrigatório/
    );
    assert.throws(
      () => parseCreateTaskBody({ ...validTaskBody, date: "amanha" }),
      /YYYY-MM-DD/
    );
    assert.throws(
      () => parseCreateTaskBody({ ...validTaskBody, priority: "URGENTE" }),
      /Prioridade inválido|Prioridade inválida/
    );
    assert.throws(
      () => parseCreateTaskBody({ ...validTaskBody, status: "BANANA" }),
      /não permitido/
    );
    assert.throws(
      () => parseCreateTaskBody({ ...validTaskBody, id: "HACKEADO" }),
      /não permitido/
    );
  });

  it("rejeita status inválido de tarefa", () => {
    assert.throws(() => parseTaskStatusBody({ status: "BANANA" }), /inválido/);
    assert.equal(
      parseTaskStatusBody({ status: TaskStatus.EXECUTADA }),
      TaskStatus.EXECUTADA
    );
  });

  it("rejeita metas com data/período/status inválidos antes de persistir", () => {
    const validGoalBody = {
      description: "Meta",
      categoryId: "cat-1",
      period: GoalPeriod.MENSAL,
      startDate: "2026-08-01",
      endDate: "2026-08-31",
    };

    assert.throws(
      () => parseCreateGoalBody({ ...validGoalBody, startDate: "amanha" }),
      /YYYY-MM-DD/
    );
    assert.throws(
      () => parseCreateGoalBody({ ...validGoalBody, period: "QUINZENAL" }),
      /inválido/
    );
    assert.throws(() => parseGoalStatusBody({ status: "XPTO" }), /inválido/);
  });

  it("GoalService também impede NaN, período inválido, categoria inexistente e status inválido", async () => {
    const repository = new MemoryRepository([]);
    const categoryRepository = new MemoryRepository([category()]);
    const service = new GoalService(repository, categoryRepository);

    await assert.rejects(
      () =>
        service.create({
          description: "Meta",
          categoryId: "cat-1",
          period: GoalPeriod.MENSAL,
          startDate: "amanha",
          endDate: "2026-08-31",
        }),
      /YYYY-MM-DD/
    );

    await assert.rejects(
      () =>
        service.create({
          description: "Meta",
          categoryId: "cat-x",
          period: GoalPeriod.MENSAL,
          startDate: "2026-08-01",
          endDate: "2026-08-31",
        }),
      /não existe/
    );

    const statusRepository = new MemoryRepository([goal()]);
    const statusService = new GoalService(statusRepository, categoryRepository);
    await assert.rejects(
      () => statusService.updateStatus("goal-1", "XPTO"),
      /inválido/
    );
  });

  it("valida categoria e lembrete completos", () => {
    assert.throws(
      () => parseCreateCategoryBody({ name: "", color: "azul" }),
      /Nome da categoria|Cor/
    );
    assert.throws(
      () => parseCreateCategoryBody({ name: "Estudos", color: "blue" }),
      /hexadecimal/
    );

    assert.throws(
      () =>
        parseCreateReminderBody({
          description: "Reunião",
          type: ReminderType.REUNIAO,
          recurrence: ReminderRecurrence.UNICO,
          date: "amanha",
        }),
      /YYYY-MM-DD/
    );

    assert.throws(
      () =>
        parseCreateReminderBody({
          description: "Reunião",
          type: "QUALQUER",
          recurrence: ReminderRecurrence.UNICO,
          date: "2026-08-25",
        }),
      /inválido/
    );

    assert.throws(
      () =>
        parseCreateReminderBody({
          description: "Academia",
          type: ReminderType.EXERCICIO,
          recurrence: ReminderRecurrence.RECORRENTE_SEMANAL,
          dayOfWeek: 9,
        }),
      /entre 0 e 6/
    );
  });
});

describe("03 - listagem de lembretes", () => {
  it("ReminderService.list retorna todos os lembretes", async () => {
    const reminders = [
      {
        id: "r1",
        description: "Hoje",
        type: ReminderType.ESTUDO,
        recurrence: ReminderRecurrence.UNICO,
        date: "2026-08-25",
      },
      {
        id: "r2",
        description: "Semanal",
        type: ReminderType.EXERCICIO,
        recurrence: ReminderRecurrence.RECORRENTE_SEMANAL,
        dayOfWeek: 3,
      },
    ];
    const service = new ReminderService(new MemoryRepository(reminders));
    assert.deepEqual(await service.list(), reminders);
  });

  it("GET /api/reminders sem upcoming chama list(), não devolve [] fixo", async () => {
    const expected = [
      {
        id: "r1",
        description: "Todos",
        type: ReminderType.ESTUDO,
        recurrence: ReminderRecurrence.UNICO,
        date: "2026-08-25",
      },
    ];

    let listCalls = 0;
    let upcomingCalls = 0;
    const fakeService = {
      async create(data) {
        return { ...data, id: "r-new" };
      },
      async list() {
        listCalls += 1;
        return expected;
      },
      async listUpcoming() {
        upcomingCalls += 1;
        return [];
      },
      async remove() {},
    };

    const server = await startTestServer(
      "/api/reminders",
      createReminderRouter(fakeService)
    );
    try {
      const response = await fetch(`${server.baseUrl}/api/reminders`);
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.deepEqual(body.data, expected);
      assert.equal(listCalls, 1);
      assert.equal(upcomingCalls, 0);
    } finally {
      await server.close();
    }
  });

  it("GET /api/reminders?upcoming=true continua usando listUpcoming()", async () => {
    let listCalls = 0;
    let upcomingCalls = 0;
    const fakeService = {
      async create(data) {
        return { ...data, id: "r-new" };
      },
      async list() {
        listCalls += 1;
        return [];
      },
      async listUpcoming() {
        upcomingCalls += 1;
        return [{ id: "r-upcoming", description: "Próximo" }];
      },
      async remove() {},
    };

    const server = await startTestServer(
      "/api/reminders",
      createReminderRouter(fakeService)
    );
    try {
      const response = await fetch(
        `${server.baseUrl}/api/reminders?upcoming=true`
      );
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.data[0].id, "r-upcoming");
      assert.equal(listCalls, 0);
      assert.equal(upcomingCalls, 1);
    } finally {
      await server.close();
    }
  });

  it("rejeita valor inválido do filtro upcoming", () => {
    assert.throws(() => parseUpcomingQuery("sim"), /true ou false/);
  });
});

describe("04 - data local versus UTC", () => {
  it("getLocalISODate preserva o dia local em UTC-3 após 21h", () => {
    const previousTZ = process.env.TZ;
    process.env.TZ = "America/Maceio";
    try {
      const instant = new Date("2026-08-26T01:30:00.000Z");
      assert.equal(getLocalISODate(instant), "2026-08-25");
      assert.equal(instant.toISOString().slice(0, 10), "2026-08-26");
    } finally {
      if (previousTZ === undefined) delete process.env.TZ;
      else process.env.TZ = previousTZ;
    }
  });

  it("DashboardController repassa ?date= ao service", async () => {
    let receivedDate;
    const fakeService = {
      async getToday(date) {
        receivedDate = date;
        return {
          pendingTasks: 0,
          completedTasks: 0,
          goalsInProgress: 0,
          upcomingReminders: [],
          productivityIndex: 0,
        };
      },
    };

    const server = await startTestServer(
      "/api/dashboard",
      createDashboardRouter(fakeService)
    );
    try {
      const response = await fetch(
        `${server.baseUrl}/api/dashboard/today?date=2026-08-25`
      );
      assert.equal(response.status, 200);
      assert.equal(receivedDate, "2026-08-25");
    } finally {
      await server.close();
    }
  });

  it("DashboardController rejeita data inválida", async () => {
    const fakeService = {
      async getToday() {
        throw new Error("não deveria ser chamado");
      },
    };

    const server = await startTestServer(
      "/api/dashboard",
      createDashboardRouter(fakeService)
    );
    try {
      const response = await fetch(
        `${server.baseUrl}/api/dashboard/today?date=amanha`
      );
      const body = await response.json();
      assert.equal(response.status, 400);
      assert.equal(body.success, false);
      assert.match(body.error, /YYYY-MM-DD/);
    } finally {
      await server.close();
    }
  });
});
