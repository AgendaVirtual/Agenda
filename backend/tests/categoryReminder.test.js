const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const {
  assignDefaultColor,
  CategoryService,
  DEFAULT_CATEGORIES,
} = require("../dist/services/CategoryService");

const {
  getNextOccurrence,
  ReminderService,
} = require("../dist/services/ReminderService");

const {
  ReminderRecurrence,
  ReminderType,
} = require("../dist/types/enums");

class MemoryRepository {
  constructor(items = []) {
    this.items = items.map((item) => ({ ...item }));
    this.nextId = this.items.length + 1;
  }

  async findAll() {
    return this.items.map((item) => ({ ...item }));
  }

  async findById(id) {
    const item = this.items.find(
      (candidate) => candidate.id === id
    );

    return item ? { ...item } : undefined;
  }

  async create(data) {
    const item = {
      ...data,
      id: `id-${this.nextId++}`,
    };

    this.items.push(item);

    return { ...item };
  }

  async update(id, data) {
    const index = this.items.findIndex(
      (item) => item.id === id
    );

    if (index === -1) {
      return undefined;
    }

    this.items[index] = {
      ...this.items[index],
      ...data,
    };

    return { ...this.items[index] };
  }

  async delete(id) {
    const originalLength = this.items.length;

    this.items = this.items.filter(
      (item) => item.id !== id
    );

    return this.items.length !== originalLength;
  }
}

function uniqueReminder(overrides = {}) {
  return {
    description: "Entregar atividade",
    type: ReminderType.ENTREGA,
    recurrence: ReminderRecurrence.UNICO,
    date: "2026-08-21",
    time: "18:30",
    ...overrides,
  };
}

function weeklyReminder(overrides = {}) {
  return {
    description: "Ligar para o orientador",
    type: ReminderType.LIGACAO,
    recurrence:
      ReminderRecurrence.RECORRENTE_SEMANAL,
    dayOfWeek: 2,
    time: "10:00",
    ...overrides,
  };
}

describe("CategoryService", () => {
  it(
    "atribui cor padrão, normaliza a entrada e mantém a cor única",
    async () => {
      const repository = new MemoryRepository();
      const service = new CategoryService(repository);

      const category = await service.create({
        name: "  Faculdade  ",
      });

      assert.equal(
        category.name,
        "Faculdade"
      );

      assert.equal(
        category.color,
        "#3F51B5"
      );

      assert.equal(
        assignDefaultColor(["#3f51b5"]),
        "#F44336"
      );

      await assert.rejects(
        () =>
          service.create({
            name: "Outra",
            color: "#3f51b5",
          }),
        /Já existe uma categoria com essa cor/
      );
    }
  );

  it(
    "cria as categorias iniciais apenas uma vez",
    async () => {
      const repository = new MemoryRepository();
      const service = new CategoryService(repository);

      await service.seedDefaults();
      await service.seedDefaults();

      const categories = await service.list();

      assert.equal(
        categories.length,
        DEFAULT_CATEGORIES.length
      );

      assert.deepEqual(
        categories.map(
          (category) => category.name
        ),
        DEFAULT_CATEGORIES.map(
          (category) => category.name
        )
      );
    }
  );

  it(
    "consulta, atualiza e remove uma categoria",
    async () => {
      const service = new CategoryService(
        new MemoryRepository()
      );

      const created = await service.create({
        name: "Leitura",
        color: "#123456",
      });

      const found = await service.findById(
        created.id
      );

      assert.equal(found.name, "Leitura");

      const updated = await service.update(
        created.id,
        {
          name: "Leitura diária",
          color: "#654321",
        }
      );

      assert.equal(
        updated.name,
        "Leitura diária"
      );

      assert.equal(
        updated.color,
        "#654321"
      );

      await service.remove(created.id);

      await assert.rejects(
        () => service.findById(created.id),
        /não encontrada/
      );
    }
  );
});

describe("ReminderService", () => {
  it(
    "valida e cria lembretes únicos e recorrentes",
    async () => {
      const service = new ReminderService(
        new MemoryRepository()
      );

      const unique = await service.create(
        uniqueReminder()
      );

      const weekly = await service.create(
        weeklyReminder()
      );

      assert.equal(
        unique.date,
        "2026-08-21"
      );

      assert.equal(
        unique.dayOfWeek,
        undefined
      );

      assert.equal(
        weekly.dayOfWeek,
        2
      );

      assert.equal(
        weekly.date,
        undefined
      );

      await assert.rejects(
        () =>
          service.create(
            weeklyReminder({
              dayOfWeek: 7,
            })
          ),
        /entre 0 e 6/
      );

      await assert.rejects(
        () =>
          service.create(
            uniqueReminder({
              date: "2026-02-30",
            })
          ),
        /data válida/
      );

      await assert.rejects(
        () =>
          service.create(
            uniqueReminder({
              time: "25:00",
            })
          ),
        /formato HH:mm/
      );
    }
  );

  it(
    "calcula a próxima ocorrência incluindo o dia de referência",
    () => {
      const reference = new Date(
        "2026-08-18T15:00:00.000Z"
      );

      assert.equal(
        getNextOccurrence(
          2,
          reference
        ).toISOString(),
        "2026-08-18T00:00:00.000Z"
      );

      assert.equal(
        getNextOccurrence(
          5,
          reference
        ).toISOString(),
        "2026-08-21T00:00:00.000Z"
      );
    }
  );

  it(
    "lista e ordena os lembretes dos próximos dias",
    async () => {
      const repository = new MemoryRepository([
        {
          id: "r1",
          ...weeklyReminder(),
        },
        {
          id: "r2",
          ...uniqueReminder(),
        },
        {
          id: "r3",
          ...uniqueReminder({
            description: "Fora da janela",
            date: "2026-08-25",
          }),
        },
      ]);

      const service = new ReminderService(
        repository
      );

      const upcoming =
        await service.listUpcoming(
          4,
          new Date(
            "2026-08-18T12:00:00.000Z"
          )
        );

      assert.deepEqual(
        upcoming.map(
          (reminder) => reminder.id
        ),
        ["r1", "r2"]
      );
    }
  );

  it(
    "atualiza a recorrência e remove campos que não se aplicam",
    async () => {
      const repository = new MemoryRepository([
        {
          id: "r1",
          ...uniqueReminder(),
        },
      ]);

      const service = new ReminderService(
        repository
      );

      const updated = await service.update(
        "r1",
        {
          recurrence:
            ReminderRecurrence.RECORRENTE_SEMANAL,
          dayOfWeek: 1,
        }
      );

      assert.equal(
        updated.recurrence,
        ReminderRecurrence.RECORRENTE_SEMANAL
      );

      assert.equal(
        updated.dayOfWeek,
        1
      );

      assert.equal(
        updated.date,
        undefined
      );

      await service.remove("r1");

      await assert.rejects(
        () => service.findById("r1"),
        /não encontrado/
      );
    }
  );
});