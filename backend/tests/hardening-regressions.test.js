const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const { TaskService } = require('../dist/services/TaskService');
const { GoalService } = require('../dist/services/GoalService');
const { CategoryService } = require('../dist/services/CategoryService');
const { ReminderService, getNextOccurrence } = require('../dist/services/ReminderService');
const { ReportService } = require('../dist/services/ReportService');
const { createReminderRouter } = require('../dist/controllers/ReminderController');
const { errorHandler } = require('../dist/utils/errors');
const express = require('express');
const {
  parseCreateTaskBody,
  parseUpdateTaskBody,
  parseTaskStatusBody,
  parseCreateGoalBody,
  parseCreateCategoryBody,
  parseCreateReminderBody,
  parseUpdateReminderBody,
  parseUpcomingQuery,
  parsePositiveDaysQuery,
} = require('../dist/utils/validation');
const { isValidISODate, getLocalISODate } = require('../dist/utils/reportCalculations');
const {
  GoalPeriod,
  ReminderRecurrence,
  ReminderType,
  Shift,
  TaskPriority,
  TaskStatus,
  TimeBlockType,
} = require('../dist/types/enums');

class MemoryRepository {
  constructor(items = []) {
    this.items = items.map((item) => ({ ...item }));
    this.sequence = 1;
  }
  async findAll() { return this.items.map((item) => ({ ...item })); }
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
    return before !== this.items.length;
  }
}


async function startTestServer(routerPath, router) {
  const app = express();
  app.use(express.json());
  app.use(routerPath, router);
  app.use(errorHandler);
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

const category = (overrides = {}) => ({
  id: 'cat-1', name: 'Estudos', color: '#00BCD4', ...overrides,
});
const validTask = (overrides = {}) => ({
  description: 'Estudar', categoryId: 'cat-1', date: '2026-08-25',
  timeBlockType: TimeBlockType.UMA_HORA, time: '10:00',
  priority: TaskPriority.MEDIA, ...overrides,
});
const storedTask = (overrides = {}) => ({
  id: 'task-1', ...validTask(), status: TaskStatus.PENDENTE, ...overrides,
});
const validGoal = (overrides = {}) => ({
  description: 'Meta', categoryId: 'cat-1', period: GoalPeriod.MENSAL,
  startDate: '2026-08-01', endDate: '2026-08-31', ...overrides,
});
const uniqueReminder = (overrides = {}) => ({
  id: 'r1', description: 'Entrega', type: ReminderType.ENTREGA,
  recurrence: ReminderRecurrence.UNICO, date: '2026-08-25', time: '10:00',
  ...overrides,
});
const weeklyReminder = (overrides = {}) => ({
  id: 'r2', description: 'Estudo', type: ReminderType.ESTUDO,
  recurrence: ReminderRecurrence.RECORRENTE_SEMANAL, dayOfWeek: 2, time: '09:00',
  ...overrides,
});

describe('hardening - services não confiam no controller', () => {
  it('TaskService.create rejeita id/status/campo desconhecido em runtime', async () => {
    const service = new TaskService(new MemoryRepository(), new MemoryRepository([category()]));
    await assert.rejects(() => service.create({ ...validTask(), id: 'HACKEADO' }), /não permitido/);
    await assert.rejects(() => service.create({ ...validTask(), status: 'BANANA' }), /não permitido/);
    await assert.rejects(() => service.create({ ...validTask(), admin: true }), /não permitido/);
  });

  it('TaskService.update rejeita update vazio e campo desconhecido sem mutar registro', async () => {
    const repo = new MemoryRepository([storedTask()]);
    const service = new TaskService(repo, new MemoryRepository([category()]));
    await assert.rejects(() => service.update('task-1', {}), /ao menos um campo/);
    await assert.rejects(() => service.update('task-1', { admin: true }), /não permitido/);
    assert.deepEqual(await repo.findById('task-1'), storedTask());
  });

  it('TaskService rejeita null em campo conhecido e mantém registro', async () => {
    const repo = new MemoryRepository([storedTask()]);
    const service = new TaskService(repo, new MemoryRepository([category()]));
    await assert.rejects(() => service.update('task-1', { description: null }), /Descrição/);
    await assert.rejects(() => service.update('task-1', { priority: null }), /Prioridade/);
    assert.deepEqual(await repo.findById('task-1'), storedTask());
  });

  it('TaskService normaliza campos incompatíveis de bloco no create', async () => {
    const repo = new MemoryRepository();
    const service = new TaskService(repo, new MemoryRepository([category()]));
    const turno = await service.create(validTask({
      timeBlockType: TimeBlockType.TURNO, shift: Shift.MANHA, time: '10:00',
    }));
    assert.equal(turno.time, undefined);
    assert.equal(turno.shift, Shift.MANHA);

    const hora = await service.create(validTask({ time: '12:00', shift: Shift.NOITE }));
    assert.equal(hora.time, '12:00');
    assert.equal(hora.shift, undefined);
  });

  it('GoalService.create rejeita id/status/campo desconhecido em runtime', async () => {
    const service = new GoalService(new MemoryRepository(), new MemoryRepository([category()]));
    await assert.rejects(() => service.create({ ...validGoal(), id: 'HACKEADO' }), /não permitido/);
    await assert.rejects(() => service.create({ ...validGoal(), status: 'XPTO' }), /não permitido/);
    await assert.rejects(() => service.create({ ...validGoal(), extra: 1 }), /não permitido/);
  });

  it('CategoryService.create rejeita id e campos desconhecidos mesmo sem controller', async () => {
    const service = new CategoryService(new MemoryRepository());
    await assert.rejects(() => service.create({ name: 'A', id: 'HACKEADO' }), /não permitido/);
    await assert.rejects(() => service.create({ name: 'A', extra: true }), /não permitido/);
  });

  it('ReminderService.create rejeita id e campos desconhecidos mesmo sem controller', async () => {
    const service = new ReminderService(new MemoryRepository());
    const base = { description: 'Entrega', type: ReminderType.ENTREGA, recurrence: ReminderRecurrence.UNICO, date: '2026-08-25' };
    await assert.rejects(() => service.create({ ...base, id: 'HACKEADO' }), /não permitido/);
    await assert.rejects(() => service.create({ ...base, extra: true }), /não permitido/);
  });
});

describe('hardening - validação HTTP e limites', () => {
  it('rejeita null, array e string como corpo JSON de criação', () => {
    for (const bad of [null, [], 'texto', 10]) {
      assert.throws(() => parseCreateTaskBody(bad), /objeto JSON/);
      assert.throws(() => parseCreateGoalBody(bad), /objeto JSON/);
      assert.throws(() => parseCreateCategoryBody(bad), /objeto JSON/);
      assert.throws(() => parseCreateReminderBody(bad), /objeto JSON/);
    }
  });

  it('status de tarefa rejeita campos adicionais', () => {
    assert.throws(
      () => parseTaskStatusBody({ status: TaskStatus.EXECUTADA, id: 'HACKEADO' }),
      /não permitido/
    );
  });

  it('datas ISO validam calendário real, incluindo ano bissexto', () => {
    assert.equal(isValidISODate('2024-02-29'), true);
    assert.equal(isValidISODate('2025-02-29'), false);
    assert.equal(isValidISODate('2026-13-01'), false);
    assert.equal(isValidISODate('2026-00-10'), false);
    assert.equal(isValidISODate('2026-04-31'), false);
  });

  it('horários aceitam limites reais e rejeitam 24:00', () => {
    const base = validTask();
    assert.doesNotThrow(() => parseCreateTaskBody({ ...base, time: '00:00' }));
    assert.doesNotThrow(() => parseCreateTaskBody({ ...base, time: '23:59' }));
    assert.throws(() => parseCreateTaskBody({ ...base, time: '24:00' }), /HH:mm/);
    assert.throws(() => parseUpdateReminderBody({ time: '12:60' }), /HH:mm/);
  });

  it('queries repetidas/arrays não são aceitas silenciosamente', () => {
    assert.throws(() => parseUpcomingQuery(['true', 'false']), /true ou false/);
    assert.throws(() => parsePositiveDaysQuery(['7', '8']), /inteiro positivo/);
  });

  it('update de tarefa bloqueia id/status já no parser', () => {
    assert.throws(() => parseUpdateTaskBody({ id: 'HACKEADO' }), /não permitido/);
    assert.throws(() => parseUpdateTaskBody({ status: 'BANANA' }), /não permitido/);
  });
});

describe('hardening - lembretes e calendário', () => {
  it('create rejeita combinações contraditórias de recorrência', () => {
    assert.throws(() => parseCreateReminderBody({
      description: 'X', type: ReminderType.ESTUDO,
      recurrence: ReminderRecurrence.UNICO, date: '2026-08-25', dayOfWeek: 2,
    }), /não deve informar dayOfWeek/);
    assert.throws(() => parseCreateReminderBody({
      description: 'X', type: ReminderType.ESTUDO,
      recurrence: ReminderRecurrence.RECORRENTE_SEMANAL, dayOfWeek: 2, date: '2026-08-25',
    }), /não deve informar date/);
  });

  it('listUpcoming com days=1 inclui somente o dia inicial', async () => {
    const repo = new MemoryRepository([
      uniqueReminder({ id: 'hoje', date: '2026-08-25' }),
      uniqueReminder({ id: 'amanha', date: '2026-08-26' }),
    ]);
    const result = await new ReminderService(repo).listUpcoming(1, new Date('2026-08-25T12:00:00-03:00'));
    assert.deepEqual(result.map((r) => r.id), ['hoje']);
  });

  it('recorrente fora da janela não aparece', async () => {
    const from = new Date('2026-08-25T12:00:00-03:00');
    const tomorrow = (from.getDay() + 1) % 7;
    const repo = new MemoryRepository([weeklyReminder({ id: 'fora', dayOfWeek: tomorrow })]);
    const result = await new ReminderService(repo).listUpcoming(1, from);
    assert.deepEqual(result, []);
  });

  it('getNextOccurrence valida weekday/data e é determinístico em UTC', () => {
    assert.throws(() => getNextOccurrence(7, new Date()), /0 e 6/);
    assert.throws(() => getNextOccurrence(1, new Date('invalid')), /referência inválida/);

    const previous = process.env.TZ;
    process.env.TZ = 'America/Maceio';
    try {
      const from = new Date('2026-08-25T22:30:00-03:00');
      const next = getNextOccurrence(from.getUTCDay(), from);
      assert.equal(next.toISOString(), '2026-08-26T00:00:00.000Z');
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
  });

  it('listUpcoming aceita data ISO explícita e independe do fuso do servidor', async () => {
    const previous = process.env.TZ;
    process.env.TZ = 'UTC';
    try {
      const repo = new MemoryRepository([
        uniqueReminder({ id: 'hoje', date: '2026-08-25' }),
        uniqueReminder({ id: 'amanha', date: '2026-08-26' }),
      ]);
      const result = await new ReminderService(repo).listUpcoming(1, '2026-08-25');
      assert.deepEqual(result.map((r) => r.id), ['hoje']);
      await assert.rejects(
        () => new ReminderService(repo).listUpcoming(1, 'amanha'),
        /YYYY-MM-DD/
      );
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
  });


  it('controller de lembretes encaminha date local validada para listUpcoming', async () => {
    const calls = [];
    const fake = {
      async create(data) { return { ...data, id: 'r' }; },
      async list() { return []; },
      async listUpcoming(days, date) { calls.push({ days, date }); return []; },
      async findById() { return uniqueReminder(); },
      async update() { return uniqueReminder(); },
      async remove() {},
    };
    const server = await startTestServer('/api/reminders', createReminderRouter(fake));
    try {
      let response = await fetch(`${server.baseUrl}/api/reminders?upcoming=true&days=2&date=2026-08-25`);
      assert.equal(response.status, 200);
      await response.json();
      assert.deepEqual(calls, [{ days: 2, date: '2026-08-25' }]);

      response = await fetch(`${server.baseUrl}/api/reminders?upcoming=true&date=amanha`);
      assert.equal(response.status, 400);
      const body = await response.json();
      assert.match(body.error, /YYYY-MM-DD/);
      assert.equal(calls.length, 1);
    } finally {
      await server.close();
    }
  });
});

describe('hardening - relatórios não aceitam datas parcialmente inválidas', () => {
  it('relatório mensal aceita YYYY-MM válido e rejeita mês inexistente', async () => {
    const service = new ReportService(new MemoryRepository(), new MemoryRepository());
    const report = await service.generate('monthly', '2026-02');
    assert.equal(report.startDate, '2026-02-01');
    assert.equal(report.endDate, '2026-02-28');
    await assert.rejects(() => service.generate('monthly', '2026-13'), /formato/);
  });
});
