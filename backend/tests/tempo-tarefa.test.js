const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const { TaskService } = require("../dist/services/TaskService");
const {
  Shift,
  TaskPriority,
  TaskRecurrence,
  TaskStatus,
  TimeBlockType,
} = require("../dist/types/enums");

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

const CATEGORIA = { id: "cat-1", name: "Estudos", color: "#1971C2" };

function servico(tarefas = []) {
  const repo = new MemoryRepository(tarefas);
  const service = new TaskService(repo, new MemoryRepository([CATEGORIA]));
  return { service, repo };
}

function nova(overrides = {}) {
  return {
    description: "Estudar",
    categoryId: "cat-1",
    date: "2026-09-10",
    priority: TaskPriority.MEDIA,
    time: "09:00",
    ...overrides,
  };
}

describe("bloco e turno deduzidos do horário", () => {
  it("sem hora de fim, vira meia hora", async () => {
    const { service } = servico();
    const t = await service.create(nova({ time: "08:00" }));
    assert.equal(t.timeBlockType, TimeBlockType.MEIA_HORA);
    assert.equal(t.shift, Shift.MANHA);
    assert.equal(t.time, "08:00");
  });

  it("respeita as fronteiras de 30 e 60 minutos", async () => {
    const { service } = servico();
    const meia = await service.create(nova({ time: "08:00", endTime: "08:30" }));
    const uma = await service.create(nova({ time: "09:00", endTime: "10:00" }));
    const turno = await service.create(nova({ time: "11:00", endTime: "12:01" }));
    assert.equal(meia.timeBlockType, TimeBlockType.MEIA_HORA);
    assert.equal(uma.timeBlockType, TimeBlockType.UMA_HORA);
    assert.equal(turno.timeBlockType, TimeBlockType.TURNO);
  });

  it("separa os turnos em 12h e 18h", async () => {
    const { service } = servico();
    const casos = [
      ["00:00", Shift.MANHA],
      ["11:59", Shift.MANHA],
      ["12:00", Shift.TARDE],
      ["17:59", Shift.TARDE],
      ["18:00", Shift.NOITE],
      ["23:59", Shift.NOITE],
    ];
    for (const [hora, turno] of casos) {
      const { service: s } = servico();
      const t = await s.create(nova({ time: hora }));
      assert.equal(t.shift, turno, `${hora} deveria cair em ${turno}`);
    }
    assert.ok(service);
  });

  it("recusa fim antes ou igual ao início", async () => {
    const { service } = servico();
    await assert.rejects(
      () => service.create(nova({ time: "10:00", endTime: "09:00" })),
      /fim precisa vir depois/
    );
    await assert.rejects(
      () => service.create(nova({ time: "10:00", endTime: "10:00" })),
      /fim precisa vir depois/
    );
  });

  it("recusa aviso em tarefa sem horário", async () => {
    const { service } = servico();
    await assert.rejects(
      () =>
        service.create({
          description: "Sem hora",
          categoryId: "cat-1",
          date: "2026-09-10",
          priority: TaskPriority.MEDIA,
          timeBlockType: TimeBlockType.TURNO,
          shift: Shift.MANHA,
          alertEnabled: true,
        }),
      /tarefa que tem horário/
    );
  });
});

describe("conflito compara a janela inteira", () => {
  it("bloqueia início que cai dentro de outra tarefa", async () => {
    const { service } = servico();
    await service.create(nova({ time: "19:00", endTime: "22:00" }));
    await assert.rejects(
      () => service.create(nova({ description: "Choque", time: "20:00" })),
      /mesmo horário e dia/
    );
  });

  it("deixa passar tarefas encostadas", async () => {
    const { service } = servico();
    await service.create(nova({ time: "09:00", endTime: "10:00" }));
    const seguinte = await service.create(
      nova({ description: "Depois", time: "10:00", endTime: "11:00" })
    );
    assert.equal(seguinte.time, "10:00");
  });

  it("não confunde dias diferentes", async () => {
    const { service } = servico();
    await service.create(nova({ time: "09:00", endTime: "11:00" }));
    const outroDia = await service.create(
      nova({ description: "Amanhã", date: "2026-09-11", time: "10:00" })
    );
    assert.equal(outroDia.date, "2026-09-11");
  });
});

describe("edição", () => {
  it("rededuz bloco e turno quando o horário muda", async () => {
    const { service } = servico();
    const t = await service.create(nova({ time: "08:00" }));
    const movida = await service.update(t.id, { time: "20:00" });
    assert.equal(movida.shift, Shift.NOITE);

    const esticada = await service.update(t.id, { endTime: "23:30" });
    assert.equal(esticada.timeBlockType, TimeBlockType.TURNO);
    assert.equal(esticada.endTime, "23:30");
  });

  it("preserva o horário quando a edição não o toca", async () => {
    const { service } = servico();
    const t = await service.create(nova({ time: "19:00", endTime: "22:00" }));
    assert.equal(t.timeBlockType, TimeBlockType.TURNO);

    const renomeada = await service.update(t.id, { description: "Outro nome" });
    assert.equal(renomeada.time, "19:00");
    assert.equal(renomeada.endTime, "22:00");
    assert.equal(renomeada.shift, Shift.NOITE);
  });

  it("mantém o caminho antigo de quem manda o bloco na mão", async () => {
    const { service } = servico();
    const t = await service.create({
      description: "Turno cheio",
      categoryId: "cat-1",
      date: "2026-09-10",
      priority: TaskPriority.MEDIA,
      timeBlockType: TimeBlockType.TURNO,
      shift: Shift.TARDE,
      time: "13:00",
    });
    assert.equal(t.time, undefined);
    assert.equal(t.shift, Shift.TARDE);
  });
});

describe("recorrência", () => {
  it("materializa as ocorrências no mesmo grupo", async () => {
    const { service, repo } = servico();
    await service.create(nova({ recurrence: TaskRecurrence.SEMANAL }));
    const todas = await repo.findAll();
    assert.equal(todas.length, 12);
    assert.equal(new Set(todas.map((t) => t.recurrenceGroupId)).size, 1);
    assert.deepEqual(
      todas.slice(0, 3).map((t) => t.date),
      ["2026-09-10", "2026-09-17", "2026-09-24"]
    );
  });

  it("encaixa o dia 31 no último dia dos meses curtos", async () => {
    const { service, repo } = servico();
    await service.create(
      nova({ date: "2027-01-31", recurrence: TaskRecurrence.MENSAL })
    );
    const datas = (await repo.findAll()).map((t) => t.date);
    assert.deepEqual(datas, [
      "2027-01-31",
      "2027-02-28",
      "2027-03-31",
      "2027-04-30",
      "2027-05-31",
      "2027-06-30",
    ]);
  });

  it("pula a ocorrência que esbarra em algo já marcado", async () => {
    const { service, repo } = servico();
    await service.create(nova({ description: "Fixa", date: "2026-09-17", time: "09:15" }));
    await service.create(nova({ recurrence: TaskRecurrence.SEMANAL }));
    const serie = (await repo.findAll()).filter((t) => t.recurrenceGroupId);
    assert.equal(serie.length, 11);
    assert.ok(!serie.some((t) => t.date === "2026-09-17"));
  });

  it("tarefa única não ganha grupo", async () => {
    const { service } = servico();
    const t = await service.create(nova());
    assert.equal(t.recurrence, TaskRecurrence.UNICA);
    assert.equal(t.recurrenceGroupId, undefined);
  });
});

describe("remoção", () => {
  it("apaga só a ocorrência por padrão", async () => {
    const { service, repo } = servico();
    const t = await service.create(nova({ recurrence: TaskRecurrence.SEMANAL }));
    assert.equal(await service.remove(t.id), 1);
    assert.equal((await repo.findAll()).length, 11);
  });

  it("apaga a série inteira quando pedido", async () => {
    const { service, repo } = servico();
    const t = await service.create(nova({ recurrence: TaskRecurrence.SEMANAL }));
    assert.equal(await service.remove(t.id, "serie"), 12);
    assert.equal((await repo.findAll()).length, 0);
  });

  it("escopo de série não afeta tarefa solta", async () => {
    const { service, repo } = servico();
    const a = await service.create(nova({ time: "09:00" }));
    await service.create(nova({ description: "Outra", time: "14:00" }));
    assert.equal(await service.remove(a.id, "serie"), 1);
    assert.equal((await repo.findAll()).length, 1);
  });

  it("404 em tarefa que não existe", async () => {
    const { service } = servico();
    await assert.rejects(() => service.remove("nao-existe"), /não encontrada/);
  });
});

describe("status", () => {
  it("nasce pendente e o aviso vem desligado", async () => {
    const { service } = servico();
    const t = await service.create(nova());
    assert.equal(t.status, TaskStatus.PENDENTE);
    assert.equal(t.alertEnabled, false);
    assert.equal(t.alertLeadMinutes, 30);
  });
});

describe("turno não vem do cliente", () => {
  it("recusa shift solto no update", async () => {
    const { service } = servico();
    const t = await service.create(nova({ time: "08:00" }));
    await assert.rejects(
      () => service.update(t.id, { shift: Shift.NOITE }),
      /turno vem do horário/
    );
  });

  it("mantém o turno coerente com o horário depois da tentativa", async () => {
    const { service, repo } = servico();
    const t = await service.create(nova({ time: "08:00" }));
    await service.update(t.id, { shift: Shift.NOITE }).catch(() => {});
    const [guardada] = await repo.findAll();
    assert.equal(guardada.shift, Shift.MANHA);
  });

  it("caminho antigo ainda aceita bloco e turno juntos", async () => {
    const { service } = servico();
    const t = await service.create(nova({ time: "08:00" }));
    const virada = await service.update(t.id, {
      timeBlockType: TimeBlockType.TURNO,
      shift: Shift.TARDE,
    });
    assert.equal(virada.shift, Shift.TARDE);
    assert.equal(virada.time, undefined);
  });

  it("create ignora shift solto e deduz do horário", async () => {
    const { service } = servico();
    const t = await service.create(nova({ time: "08:00", shift: Shift.NOITE }));
    assert.equal(t.shift, Shift.MANHA);
  });
});
