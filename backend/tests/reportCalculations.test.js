const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const {
  calculateCompletionRate,
  calculateProductivityIndex,
  calculateReportRange,
  findMostProductivePeriod,
  findMostProductiveShift,
  getISOWeekKey,
  groupByCategory,
  isTaskExecuted,
} = require("../dist/utils/reportCalculations");
const {
  Shift,
  TaskPriority,
  TaskStatus,
  TimeBlockType,
} = require("../dist/types/enums");

function task(overrides = {}) {
  return {
    id: "task-1",
    description: "Tarefa",
    categoryId: "cat-1",
    date: "2026-08-18",
    timeBlockType: TimeBlockType.TURNO,
    shift: Shift.MANHA,
    status: TaskStatus.PENDENTE,
    priority: TaskPriority.MEDIA,
    ...overrides,
  };
}

describe("cálculos de relatório", () => {
  it("calcula taxa sobre o total e retorna zero para lista vazia", () => {
    assert.equal(calculateCompletionRate([], () => true), 0);

    const tasks = [
      task({ status: TaskStatus.EXECUTADA }),
      task({ status: TaskStatus.PENDENTE }),
      task({ status: TaskStatus.CANCELADA }),
      task({ status: TaskStatus.EXECUTADA }),
    ];

    assert.equal(calculateCompletionRate(tasks, isTaskExecuted), 0.5);
  });

  it("escolhe turno pela taxa de conclusão, não pelo volume", () => {
    const tasks = [
      task({ shift: Shift.MANHA, status: TaskStatus.EXECUTADA }),
      task({ shift: Shift.MANHA, status: TaskStatus.PENDENTE }),
      task({ shift: Shift.MANHA, status: TaskStatus.PENDENTE }),
      task({ shift: Shift.NOITE, status: TaskStatus.EXECUTADA }),
    ];

    assert.equal(findMostProductiveShift(tasks), Shift.NOITE);
  });

  it("escolhe período pela taxa de conclusão, não pelo volume", () => {
    const tasks = [
      task({ date: "2026-08-03", status: TaskStatus.EXECUTADA }),
      task({ date: "2026-08-04", status: TaskStatus.PENDENTE }),
      task({ date: "2026-08-05", status: TaskStatus.PENDENTE }),
      task({ date: "2026-08-10", status: TaskStatus.EXECUTADA }),
    ];

    assert.equal(
      findMostProductivePeriod(tasks, getISOWeekKey),
      getISOWeekKey("2026-08-10")
    );
  });

  it("agrupa categorias em ordem decrescente", () => {
    const result = groupByCategory([
      task({ categoryId: "cat-b" }),
      task({ categoryId: "cat-a" }),
      task({ categoryId: "cat-b" }),
    ]);

    assert.deepEqual(result, [
      { categoryId: "cat-b", count: 2 },
      { categoryId: "cat-a", count: 1 },
    ]);
  });

  it("calcula semana de segunda a domingo", () => {
    assert.deepEqual(calculateReportRange("weekly", "2026-08-20"), {
      startDate: "2026-08-17",
      endDate: "2026-08-23",
    });
  });

  it("calcula índice de produtividade com base nas tarefas executadas do dia", () => {
    const tasks = [
      task({ status: TaskStatus.EXECUTADA }),
      task({ status: TaskStatus.PENDENTE }),
    ];

    assert.equal(calculateProductivityIndex(tasks), 0.5);
  });
});
