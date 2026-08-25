const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const express = require('express');

const { CategoryService, DEFAULT_CATEGORIES } = require('../dist/services/CategoryService');
const { ReminderService } = require('../dist/services/ReminderService');
const { createCategoryRouter } = require('../dist/controllers/CategoryController');
const { createReminderRouter } = require('../dist/controllers/ReminderController');
const { errorHandler } = require('../dist/utils/errors');
const {
  parseCreateCategoryBody,
  parseUpdateCategoryBody,
  parseUpdateReminderBody,
  parsePositiveDaysQuery,
} = require('../dist/utils/validation');
const { ReminderRecurrence, ReminderType } = require('../dist/types/enums');

class MemoryRepository {
  constructor(items = []) {
    this.items = items.map((x) => ({ ...x }));
    this.seq = 1;
  }
  async findAll() { return this.items.map((x) => ({ ...x })); }
  async findById(id) { const x = this.items.find((i) => i.id === id); return x ? { ...x } : undefined; }
  async create(data) { const x = { ...data, id: `m-${this.seq++}` }; this.items.push(x); return { ...x }; }
  async update(id, data) { const i = this.items.findIndex((x) => x.id === id); if (i < 0) return undefined; this.items[i] = { ...this.items[i], ...data, id: this.items[i].id }; return { ...this.items[i] }; }
  async delete(id) { const n=this.items.length; this.items=this.items.filter((x)=>x.id!==id); return this.items.length!==n; }
}

async function start(routerPath, router) {
  const app = express();
  app.use(express.json());
  app.use(routerPath, router);
  app.use(errorHandler);
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const addr = server.address();
  return { base:`http://127.0.0.1:${addr.port}`, close:()=>new Promise((r)=>server.close(r)) };
}

function uniqueReminder(overrides={}) {
  return {
    id:'r1', description:'Entrega', type:ReminderType.ENTREGA,
    recurrence:ReminderRecurrence.UNICO, date:'2026-08-25', time:'10:00', ...overrides
  };
}
function weeklyReminder(overrides={}) {
  return {
    id:'r2', description:'Estudar', type:ReminderType.ESTUDO,
    recurrence:ReminderRecurrence.RECORRENTE_SEMANAL, dayOfWeek:2, time:'09:00', ...overrides
  };
}

describe('merge P3 + correções críticas - categorias', () => {
  it('mantém cor automática quando create não informa color', async () => {
    const repo = new MemoryRepository([]);
    const service = new CategoryService(repo);
    const parsed = parseCreateCategoryBody({ name:'  Nova  ' });
    const created = await service.create(parsed);
    assert.equal(created.name, 'Nova');
    assert.equal(created.color, DEFAULT_CATEGORIES[0].color);
  });

  it('rejeita cor inválida e campo desconhecido/id no controller parser', () => {
    assert.throws(() => parseCreateCategoryBody({name:'X', color:'blue'}), /hexadecimal/);
    assert.throws(() => parseUpdateCategoryBody({id:'HACKEADO'}), /não permitido/);
    assert.throws(() => parseUpdateCategoryBody({}), /ao menos um campo/);
  });

  it('service também rejeita id no update e preserva registro', async () => {
    const original = {id:'c1', name:'Estudos', color:'#00BCD4'};
    const repo = new MemoryRepository([original]);
    const service = new CategoryService(repo);
    await assert.rejects(() => service.update('c1', {id:'HACKEADO'}), /não permitido/);
    assert.deepEqual(await repo.findById('c1'), original);
  });

  it('normaliza nome/cor e impede cor duplicada ignorando maiúsculas', async () => {
    const repo = new MemoryRepository([
      {id:'c1', name:'A', color:'#ABCDEF'},
      {id:'c2', name:'B', color:'#123456'},
    ]);
    const service = new CategoryService(repo);
    const updated = await service.update('c2', {name:'  Novo ', color:'#fedcba'});
    assert.equal(updated.name, 'Novo');
    assert.equal(updated.color, '#FEDCBA');
    await assert.rejects(() => service.update('c2', {color:'#abcdef'}), /Já existe/);
  });

  it('seedDefaults adiciona apenas defaults ausentes', async () => {
    const repo = new MemoryRepository([{id:'c0', ...DEFAULT_CATEGORIES[0]}]);
    const service = new CategoryService(repo);
    await service.seedDefaults();
    const all = await repo.findAll();
    assert.equal(all.filter((x)=>x.name===DEFAULT_CATEGORIES[0].name).length, 1);
    for (const c of DEFAULT_CATEGORIES) assert.ok(all.some((x)=>x.name===c.name && x.color===c.color));
  });

  it('DELETE inexistente retorna erro de domínio', async () => {
    const service = new CategoryService(new MemoryRepository([]));
    await assert.rejects(() => service.remove('nao-existe'), /não encontrada/);
  });

  it('PUT HTTP bloqueia id antes de chamar service', async () => {
    let updateCalls=0;
    const fake = { async create(d){return {...d,id:'c'}}, async list(){return []}, async update(){updateCalls++; return {};}, async remove(){} };
    const server = await start('/api/categories', createCategoryRouter(fake));
    try {
      const res = await fetch(`${server.base}/api/categories/c1`, {method:'PUT', headers:{'content-type':'application/json'}, body:JSON.stringify({id:'HACKEADO'})});
      const body = await res.json();
      assert.equal(res.status, 400);
      assert.match(body.error, /não permitido/);
      assert.equal(updateCalls, 0);
    } finally { await server.close(); }
  });
});

describe('merge P3 + correções críticas - lembretes', () => {
  it('parser de update rejeita id, enum/data/horário inválidos e body vazio', () => {
    assert.throws(() => parseUpdateReminderBody({id:'HACKEADO'}), /não permitido/);
    assert.throws(() => parseUpdateReminderBody({type:'XPTO'}), /inválido/);
    assert.throws(() => parseUpdateReminderBody({date:'amanha'}), /YYYY-MM-DD/);
    assert.throws(() => parseUpdateReminderBody({time:'25:00'}), /HH:mm/);
    assert.throws(() => parseUpdateReminderBody({}), /ao menos um campo/);
  });

  it('service rejeita id no update mesmo sem controller', async () => {
    const repo = new MemoryRepository([uniqueReminder()]);
    const service = new ReminderService(repo);
    await assert.rejects(() => service.update('r1', {id:'HACKEADO'}), /não permitido/);
    assert.equal((await repo.findById('r1')).id, 'r1');
  });

  it('troca UNICO -> semanal e remove date antigo', async () => {
    const repo = new MemoryRepository([uniqueReminder()]);
    const service = new ReminderService(repo);
    const updated = await service.update('r1', {recurrence:ReminderRecurrence.RECORRENTE_SEMANAL, dayOfWeek:3});
    assert.equal(updated.recurrence, ReminderRecurrence.RECORRENTE_SEMANAL);
    assert.equal(updated.dayOfWeek, 3);
    assert.equal(updated.date, undefined);
  });

  it('troca semanal -> UNICO e remove dayOfWeek antigo', async () => {
    const repo = new MemoryRepository([weeklyReminder()]);
    const service = new ReminderService(repo);
    const updated = await service.update('r2', {recurrence:ReminderRecurrence.UNICO, date:'2026-08-30'});
    assert.equal(updated.recurrence, ReminderRecurrence.UNICO);
    assert.equal(updated.date, '2026-08-30');
    assert.equal(updated.dayOfWeek, undefined);
  });

  it('não aceita campos semanticamente incompatíveis com recorrência', async () => {
    const service1 = new ReminderService(new MemoryRepository([uniqueReminder()]));
    await assert.rejects(() => service1.update('r1', {dayOfWeek:2}), /não deve informar dayOfWeek/);
    const service2 = new ReminderService(new MemoryRepository([weeklyReminder()]));
    await assert.rejects(() => service2.update('r2', {date:'2026-08-25'}), /não deve informar date/);
  });

  it('list continua retornando TODOS, não apenas upcoming', async () => {
    const all=[uniqueReminder(), weeklyReminder()];
    const service=new ReminderService(new MemoryRepository(all));
    assert.deepEqual(await service.list(), all);
  });

  it('listUpcoming usa calendário local e inclui o dia local após 21h UTC-3', async () => {
    const previous=process.env.TZ; process.env.TZ='America/Maceio';
    try {
      const from=new Date('2026-08-26T01:30:00.000Z'); // 25/08 22:30 local
      const repo=new MemoryRepository([
        uniqueReminder({id:'hoje', date:'2026-08-25'}),
        uniqueReminder({id:'amanha', date:'2026-08-26'}),
        uniqueReminder({id:'fora', date:'2026-08-27'}),
      ]);
      const result=await new ReminderService(repo).listUpcoming(2, from);
      assert.deepEqual(result.map((x)=>x.id), ['hoje','amanha']);
    } finally { if(previous===undefined) delete process.env.TZ; else process.env.TZ=previous; }
  });

  it('listUpcoming inclui recorrente de hoje e ordena por data/horário', async () => {
    const previous=process.env.TZ; process.env.TZ='America/Maceio';
    try {
      const from=new Date('2026-08-25T12:00:00-03:00');
      const dow=from.getDay();
      const repo=new MemoryRepository([
        weeklyReminder({id:'b', dayOfWeek:dow, time:'11:00', description:'B'}),
        weeklyReminder({id:'a', dayOfWeek:dow, time:'09:00', description:'A'}),
      ]);
      const result=await new ReminderService(repo).listUpcoming(1, from);
      assert.deepEqual(result.map((x)=>x.id), ['a','b']);
    } finally { if(previous===undefined) delete process.env.TZ; else process.env.TZ=previous; }
  });

  it('days aceita apenas inteiro positivo', () => {
    assert.equal(parsePositiveDaysQuery(undefined,7),7);
    assert.equal(parsePositiveDaysQuery('3',7),3);
    for (const value of ['0','-1','1.5','abc','']) assert.throws(()=>parsePositiveDaysQuery(value,7), /inteiro positivo/);
  });

  it('GET HTTP sem upcoming chama list; upcoming=true recebe days validado', async () => {
    let listCalls=0; const days=[];
    const fake={
      async create(d){return {...d,id:'r'}}, async list(){listCalls++;return [uniqueReminder()]},
      async listUpcoming(d){days.push(d);return []}, async findById(){return uniqueReminder()}, async update(){return uniqueReminder()}, async remove(){}
    };
    const server=await start('/api/reminders', createReminderRouter(fake));
    try {
      let res=await fetch(`${server.base}/api/reminders`); assert.equal(res.status,200); await res.json(); assert.equal(listCalls,1);
      res=await fetch(`${server.base}/api/reminders?upcoming=true&days=3`); assert.equal(res.status,200); await res.json(); assert.deepEqual(days,[3]);
      res=await fetch(`${server.base}/api/reminders?upcoming=true&days=banana`); const body=await res.json(); assert.equal(res.status,400); assert.match(body.error,/inteiro positivo/); assert.deepEqual(days,[3]);
    } finally { await server.close(); }
  });

  it('PUT HTTP rejeita id antes de chamar update', async () => {
    let calls=0;
    const fake={ async create(d){return {...d,id:'r'}}, async list(){return []}, async listUpcoming(){return []}, async findById(){return uniqueReminder()}, async update(){calls++;return uniqueReminder()}, async remove(){} };
    const server=await start('/api/reminders', createReminderRouter(fake));
    try {
      const res=await fetch(`${server.base}/api/reminders/r1`, {method:'PUT', headers:{'content-type':'application/json'}, body:JSON.stringify({id:'HACKEADO'})});
      const body=await res.json();
      assert.equal(res.status,400); assert.match(body.error,/não permitido/); assert.equal(calls,0);
    } finally { await server.close(); }
  });
});
