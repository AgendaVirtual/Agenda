export enum TaskStatus {
  PENDENTE = "PENDENTE",
  EXECUTADA = "EXECUTADA",
  PARCIALMENTE_EXECUTADA = "PARCIALMENTE_EXECUTADA",
  CANCELADA = "CANCELADA",
  ADIADA = "ADIADA",
}

export enum TaskPriority {
  BAIXA = "BAIXA",
  MEDIA = "MEDIA",
  ALTA = "ALTA",
}

export enum TimeBlockType {
  MEIA_HORA = "MEIA_HORA",
  UMA_HORA = "UMA_HORA",
  TURNO = "TURNO",
}

export enum Shift {
  MANHA = "MANHA",
  TARDE = "TARDE",
  NOITE = "NOITE",
}

export enum GoalPeriod {
  SEMANAL = "SEMANAL",
  MENSAL = "MENSAL",
  ANUAL = "ANUAL",
}

export enum GoalStatus {
  CUMPRIDA = "CUMPRIDA",
  PARCIALMENTE_CUMPRIDA = "PARCIALMENTE_CUMPRIDA",
  NAO_CUMPRIDA = "NAO_CUMPRIDA",
  EM_ANDAMENTO = "EM_ANDAMENTO",
}

export enum ReminderRecurrence {
  UNICO = "UNICO",
  RECORRENTE_SEMANAL = "RECORRENTE_SEMANAL",
}

export enum ReminderType {
  REUNIAO = "REUNIAO",
  LIGACAO = "LIGACAO",
  COMPRA = "COMPRA",
  ESTUDO = "ESTUDO",
  EXERCICIO = "EXERCICIO",
  ENTREGA = "ENTREGA",
}
