const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const { ReportService } = require("../dist/services/ReportService");
const { DashboardService } = require("../dist/services/DashboardService");
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

class MemoryRepository {
  constructor(items) {
    this.items = items;
  }

  async findAll() {
    return this.items;
  }
}

function task(overrides = {}) {
  return {
    id: "task-1",
    description: "Tarefa",
    categoryId: "cat-estudos",
    date: "2026-08-18",
    timeBlockType: TimeBlockType.TURNO,
    shift: Shift.MANHA,
    status: TaskStatus.PENDENTE,
    priority: TaskPriority.MEDIA,
    ...overrides,
  };
}

function goal(overrides = {}) {
  return {
    id: "goal-1",
    description: "Meta",
    categoryId: "cat-estudos",
    period: GoalPeriod.MENSAL,
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    status: GoalStatus.EM_ANDAMENTO,
    ...overrides,
  };
}

describe("ReportService", () => {
  it("gera relatório mensal com quantidade, taxa, período, turno e categorias", async () => {
    const tasks = [
      task({ id: "t1", date: "2026-08-03", status: TaskStatus.EXECUTADA, categoryId: "cat-a" }),
      task({ id: "t2", date: "2026-08-04", status: TaskStatus.PENDENTE, categoryId: "cat-b" }),
      task({ id: "t3", date: "2026-08-10", status: TaskStatus.EXECUTADA, categoryId: "cat-a", shift: Shift.NOITE }),
      task({ id: "fora", date: "2026-09-01", status: TaskStatus.EXECUTADA }),
    ];

    const goals = [
      goal({ id: "g1", status: GoalStatus.CUMPRIDA, categoryId: "cat-a" }),
      goal({ id: "g2", status: GoalStatus.EM_ANDAMENTO, categoryId: "cat-b" }),
      goal({ id: "g3", period: GoalPeriod.SEMANAL, status: GoalStatus.CUMPRIDA }),
    ];

    const service = new ReportService(
      new MemoryRepository(tasks),
      new MemoryRepository(goals)
    );

    const report = await service.generate("monthly", "2026-08");

    assert.equal(report.period, "monthly");
    assert.equal(report.startDate, "2026-08-01");
    assert.equal(report.endDate, "2026-08-31");
    assert.equal(report.tasksTotal, 3);
    assert.equal(report.tasksExecuted, 2);
    assert.equal(report.tasksCompletionRate, 0.67);
    assert.equal(report.goalsTotal, 2);
    assert.equal(report.goalsCompleted, 1);
    assert.equal(report.goalsCompletionRate, 0.5);
    assert.equal(report.mostProductiveShift, Shift.NOITE);
    assert.equal(report.mostProductiveCategory, "cat-a");
    assert.deepEqual(report.topTaskCategories, [{ categoryId: "cat-a", count: 2 }]);
    assert.deepEqual(report.topGoalCategories, [{ categoryId: "cat-a", count: 1 }]);
  });

  it("rejeita tipo inválido", async () => {
    const service = new ReportService(
      new MemoryRepository([]),
      new MemoryRepository([])
    );

    await assert.rejects(() => service.generate("daily", "2026-08-18"));
  });
});

describe("DashboardService", () => {
  it("monta resumo do dia e calcula lembretes únicos/semanais sem depender do ReminderService completo", async () => {
    const tasks = [
      task({ id: "t1", date: "2026-08-18", status: TaskStatus.EXECUTADA }),
      task({ id: "t2", date: "2026-08-18", status: TaskStatus.PENDENTE }),
      task({ id: "t3", date: "2026-08-19", status: TaskStatus.EXECUTADA }),
    ];

    const goals = [
      goal({ id: "g1", status: GoalStatus.EM_ANDAMENTO }),
      goal({ id: "g2", status: GoalStatus.CUMPRIDA }),
    ];

    const reminders = [
      {
        id: "r1",
        description: "Ligar para orientador",
        type: ReminderType.LIGACAO,
        recurrence: ReminderRecurrence.RECORRENTE_SEMANAL,
        dayOfWeek: 2,
        time: "10:00",
      },
      {
        id: "r2",
        description: "Entrega",
        type: ReminderType.ENTREGA,
        recurrence: ReminderRecurrence.UNICO,
        date: "2026-08-21",
        time: "23:00",
      },
      {
        id: "r3",
        description: "Fora da janela",
        type: ReminderType.ENTREGA,
        recurrence: ReminderRecurrence.UNICO,
        date: "2026-09-10",
      },
    ];

    const service = new DashboardService(
      new MemoryRepository(tasks),
      new MemoryRepository(goals),
      new MemoryRepository(reminders)
    );

    const dashboard = await service.getToday("2026-08-18");

    assert.equal(dashboard.pendingTasks, 1);
    assert.equal(dashboard.completedTasks, 1);
    assert.equal(dashboard.goalsInProgress, 1);
    assert.equal(dashboard.productivityIndex, 0.5);
    assert.deepEqual(dashboard.upcomingReminders, [
      { description: "Ligar para orientador", time: "10:00" },
      { description: "Entrega", time: "23:00" },
    ]);
  });
});
