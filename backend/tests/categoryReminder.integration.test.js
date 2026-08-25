const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  after,
  before,
  describe,
  it,
} = require("node:test");

const dataDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "planner-p3-")
);

process.env.PLANNER_DATA_DIR = dataDirectory;

const app = require("../dist/app").default;

const {
  ReminderRecurrence,
  ReminderType,
} = require("../dist/types/enums");

let server;
let baseUrl;

async function request(route, options = {}) {
  const response = await fetch(
    `${baseUrl}${route}`,
    {
      ...options,

      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    }
  );

  const body = await response.json();

  return {
    response,
    body,
  };
}

before(
  () =>
    new Promise((resolve) => {
      server = app.listen(
        0,
        "127.0.0.1",
        () => {
          const address = server.address();

          baseUrl =
            `http://127.0.0.1:${address.port}`;

          resolve();
        }
      );
    })
);

after(
  () =>
    new Promise((resolve, reject) => {
      server.close((error) => {
        fs.rmSync(
          dataDirectory,
          {
            recursive: true,
            force: true,
          }
        );

        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    })
);

describe("endpoints da Pessoa 3", () => {
  it(
    "executa o CRUD de categorias e impede cores duplicadas",
    async () => {
      const created = await request(
        "/api/categories",
        {
          method: "POST",

          body: JSON.stringify({
            name: "Faculdade",
            color: "#112233",
          }),
        }
      );

      assert.equal(
        created.response.status,
        201
      );

      assert.equal(
        created.body.success,
        true
      );

      const categoryId =
        created.body.data.id;

      const duplicate = await request(
        "/api/categories",
        {
          method: "POST",

          body: JSON.stringify({
            name: "Duplicada",
            color: "#112233",
          }),
        }
      );

      assert.equal(
        duplicate.response.status,
        400
      );

      assert.equal(
        duplicate.body.success,
        false
      );

      const invalidPayload = await request(
        "/api/categories",
        {
          method: "POST",

          body: JSON.stringify({
            name: 123,
            color: "azul",
          }),
        }
      );

      assert.equal(
        invalidPayload.response.status,
        400
      );

      const updated = await request(
        `/api/categories/${categoryId}`,
        {
          method: "PUT",

          body: JSON.stringify({
            name: "Universidade",
            color: "#445566",
          }),
        }
      );

      assert.equal(
        updated.response.status,
        200
      );

      assert.equal(
        updated.body.data.name,
        "Universidade"
      );

      const listed = await request(
        "/api/categories"
      );

      assert.equal(
        listed.body.data.length,
        1
      );

      const removed = await request(
        `/api/categories/${categoryId}`,
        {
          method: "DELETE",
        }
      );

      assert.equal(
        removed.response.status,
        200
      );

      assert.equal(
        removed.body.success,
        true
      );
    }
  );

  it(
    "cria, filtra, atualiza e remove lembretes",
    async () => {
      const today = new Date();

      today.setUTCHours(
        0,
        0,
        0,
        0
      );

      const todayText = today
        .toISOString()
        .slice(0, 10);

      const unique = await request(
        "/api/reminders",
        {
          method: "POST",

          body: JSON.stringify({
            description: "Entrega de hoje",
            type: ReminderType.ENTREGA,
            recurrence:
              ReminderRecurrence.UNICO,
            date: todayText,
            time: "11:00",
          }),
        }
      );

      assert.equal(
        unique.response.status,
        201
      );

      const weekly = await request(
        "/api/reminders",
        {
          method: "POST",

          body: JSON.stringify({
            description: "Reunião semanal",
            type: ReminderType.REUNIAO,
            recurrence:
              ReminderRecurrence
                .RECORRENTE_SEMANAL,
            dayOfWeek:
              today.getUTCDay(),
            time: "09:00",
          }),
        }
      );

      assert.equal(
        weekly.response.status,
        201
      );

      const weeklyId =
        weekly.body.data.id;

      const all = await request(
        "/api/reminders"
      );

      assert.equal(
        all.body.data.length,
        2
      );

      const upcoming = await request(
        "/api/reminders?upcoming=true&days=1"
      );

      assert.deepEqual(
        upcoming.body.data.map(
          (reminder) =>
            reminder.description
        ),
        [
          "Reunião semanal",
          "Entrega de hoje",
        ]
      );

      const updated = await request(
        `/api/reminders/${weeklyId}`,
        {
          method: "PUT",

          body: JSON.stringify({
            description:
              "Reunião atualizada",
          }),
        }
      );

      assert.equal(
        updated.response.status,
        200
      );

      assert.equal(
        updated.body.data.description,
        "Reunião atualizada"
      );

      const invalid = await request(
        "/api/reminders",
        {
          method: "POST",

          body: JSON.stringify({
            description: "Inválido",
            type: ReminderType.REUNIAO,
            recurrence:
              ReminderRecurrence
                .RECORRENTE_SEMANAL,
            dayOfWeek: 8,
          }),
        }
      );

      assert.equal(
        invalid.response.status,
        400
      );

      const missingFields = await request(
        "/api/reminders",
        {
          method: "POST",

          body: JSON.stringify({
            description: "Incompleto",
          }),
        }
      );

      assert.equal(
        missingFields.response.status,
        400
      );

      assert.equal(
        missingFields.body.success,
        false
      );

      const removed = await request(
        `/api/reminders/${weeklyId}`,
        {
          method: "DELETE",
        }
      );

      assert.equal(
        removed.response.status,
        200
      );

      assert.equal(
        removed.body.success,
        true
      );
    }
  );
});