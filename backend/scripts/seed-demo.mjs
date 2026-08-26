const BASE = process.env.NEXO_API ?? "http://localhost:8090/api";
const EMAIL = process.env.NEXO_DEMO_EMAIL ?? "demo@nexo.app";
const SENHA = process.env.NEXO_DEMO_SENHA ?? "nexo123456";
const NOME = process.env.NEXO_DEMO_NOME ?? "Ana Demonstração";

let cookie = "";

async function api(rota, opcoes = {}) {
  const r = await fetch(BASE + rota, {
    ...opcoes,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...opcoes.headers,
    },
  });

  const novo = r.headers.get("set-cookie");
  if (novo) cookie = novo.split(";")[0];

  const corpo = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${opcoes.method ?? "GET"} ${rota} -> ${r.status} ${corpo.error ?? ""}`);
  return corpo.data;
}

const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const emDias = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};

async function entrarOuCadastrar() {
  try {
    const conta = await api("/auth/registrar", {
      method: "POST",
      body: JSON.stringify({ name: NOME, email: EMAIL, password: SENHA }),
    });
    console.log(`  conta criada: ${conta.email}`);
    return true;
  } catch (erro) {
    if (!String(erro.message).includes("409")) throw erro;
    await api("/auth/entrar", {
      method: "POST",
      body: JSON.stringify({ email: EMAIL, password: SENHA }),
    });
    console.log(`  conta já existia, entrei: ${EMAIL}`);
    return false;
  }
}

async function jaTemDados() {
  const tarefas = await api(`/tasks?date=${emDias(0)}`);
  return tarefas.length > 0;
}

async function semear() {
  const cats = await api("/categories");
  const por = (nome) => cats.find((c) => c.name === nome)?.id ?? cats[0].id;
  const FAC = por("Faculdade"), TRA = por("Trabalho"), SAU = por("Saúde");
  const LAZ = por("Lazer"), PRO = por("Projetos pessoais"), EST = por("Estudos");

  const tarefa = (t) => api("/tasks", { method: "POST", body: JSON.stringify(t) });
  const meta = (m) => api("/goals", { method: "POST", body: JSON.stringify(m) });
  const lembrete = (l) => api("/reminders", { method: "POST", body: JSON.stringify(l) });

  const hoje = emDias(0);

  const doDia = [
    { description: "Academia", categoryId: SAU, date: hoje, timeBlockType: "UMA_HORA", time: "07:00", priority: "MEDIA" },
    { description: "Revisar slides da apresentação de PLP", categoryId: FAC, date: hoje, timeBlockType: "UMA_HORA", time: "08:00", priority: "ALTA" },
    { description: "Reunião de alinhamento do grupo", categoryId: FAC, date: hoje, timeBlockType: "MEIA_HORA", time: "10:30", priority: "ALTA" },
    { description: "Estudar paradigma funcional", categoryId: EST, date: hoje, timeBlockType: "TURNO", shift: "TARDE", priority: "ALTA" },
    { description: "Responder e-mails do estágio", categoryId: TRA, date: hoje, timeBlockType: "MEIA_HORA", time: "14:00", priority: "MEDIA" },
    { description: "Série com a família", categoryId: LAZ, date: hoje, timeBlockType: "TURNO", shift: "NOITE", priority: "BAIXA" },
    { description: "Commit da tela de metas", categoryId: PRO, date: hoje, timeBlockType: "UMA_HORA", time: "20:00", priority: "ALTA" },
  ];
  for (const t of doDia) await tarefa(t);
  console.log(`  ${doDia.length} tarefas de hoje`);

  let historico = 0;
  for (let d = 24; d >= 1; d--) {
    if (d % 3 === 0) continue;
    const data = emDias(-d);
    await tarefa({ description: "Bloco de estudos", categoryId: EST, date: data, timeBlockType: "TURNO", shift: "MANHA", priority: "MEDIA" });
    await tarefa({ description: "Turno no estágio", categoryId: TRA, date: data, timeBlockType: "TURNO", shift: "TARDE", priority: "ALTA" });
    historico += 2;
  }
  console.log(`  ${historico} tarefas de histórico, para os relatórios`);

  const metas = [
    { description: "Entregar o projeto de PLP funcionando", categoryId: FAC, period: "SEMANAL", startDate: emDias(-2), endDate: emDias(4) },
    { description: "Terminar a leitura do capítulo de paradigmas", categoryId: EST, period: "SEMANAL", startDate: emDias(-2), endDate: emDias(4) },
    { description: "Treinar 3x por semana", categoryId: SAU, period: "SEMANAL", startDate: emDias(-9), endDate: emDias(-3) },
    { description: "Fechar o mês sem atraso em nenhuma disciplina", categoryId: FAC, period: "MENSAL", startDate: emDias(-25), endDate: emDias(5) },
    { description: "Fechar o mês sem hora extra no estágio", categoryId: TRA, period: "MENSAL", startDate: emDias(-25), endDate: emDias(5) },
    { description: "Ler 12 livros no ano", categoryId: LAZ, period: "ANUAL", startDate: `${new Date().getFullYear()}-01-01`, endDate: `${new Date().getFullYear()}-12-31` },
    { description: "Publicar 4 projetos pessoais no GitHub", categoryId: PRO, period: "ANUAL", startDate: `${new Date().getFullYear()}-01-01`, endDate: `${new Date().getFullYear()}-12-31` },
  ];
  for (const m of metas) await meta(m);
  console.log(`  ${metas.length} metas`);

  const lembretes = [
    { description: "Reunião semanal do grupo de PLP", type: "REUNIAO", recurrence: "RECORRENTE_SEMANAL", dayOfWeek: 1, time: "19:00" },
    { description: "Treino na academia", type: "EXERCICIO", recurrence: "RECORRENTE_SEMANAL", dayOfWeek: 2, time: "07:00" },
    { description: "Monitoria de Estruturas de Dados", type: "ESTUDO", recurrence: "RECORRENTE_SEMANAL", dayOfWeek: 3, time: "16:00" },
    { description: "Ligar para a coordenação", type: "LIGACAO", recurrence: "RECORRENTE_SEMANAL", dayOfWeek: 4, time: "09:30" },
    { description: "Feira e compras da semana", type: "COMPRA", recurrence: "RECORRENTE_SEMANAL", dayOfWeek: 6, time: "10:00" },
    { description: "Enviar o formulário de matrícula", type: "ENTREGA", recurrence: "UNICO", date: emDias(1), time: "18:00" },
    { description: "Reunião com o orientador", type: "REUNIAO", recurrence: "UNICO", date: emDias(2), time: "14:00" },
    { description: "Entregar o relatório da disciplina", type: "ENTREGA", recurrence: "UNICO", date: emDias(3), time: "23:59" },
    { description: "Comprar material para a apresentação", type: "COMPRA", recurrence: "UNICO", date: emDias(4), time: "11:00" },
    { description: "Revisar o slide final com o grupo", type: "ESTUDO", recurrence: "UNICO", date: emDias(5), time: "20:00" },
  ];
  for (const l of lembretes) await lembrete(l);
  console.log(`  ${lembretes.length} lembretes`);

  let feitas = 0;
  for (const dia of [0, -1, -2, -4, -5, -7, -8]) {
    const doDia = await api(`/tasks?date=${emDias(dia)}`);
    for (const [i, t] of doDia.entries()) {
      if (dia === 0 && i >= 3) continue;
      if (i % 4 === 3) continue;
      await api(`/tasks/${t.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "EXECUTADA" }) });
      feitas++;
    }
  }
  console.log(`  ${feitas} tarefas marcadas como executadas`);

  const todas = await api("/goals");
  for (const g of todas.slice(2, 4)) {
    await api(`/goals/${g.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "CUMPRIDA" }) });
  }
  console.log("  2 metas marcadas como cumpridas");
}

console.log(`Semeando a conta de demonstração em ${BASE}`);
const nova = await entrarOuCadastrar();

if (!nova && (await jaTemDados())) {
  console.log("  a conta já tem dados de hoje; nada a fazer");
} else {
  await semear();
}

console.log("\nPronto. Para a apresentação, entre com:");
console.log(`  e-mail: ${EMAIL}`);
console.log(`  senha:  ${SENHA}`);
