import app from "./app";
import { CategoryService } from "./services/CategoryService";
import { migrar, usaPostgres } from "./persistence/db";
import { conferirSegredo } from "./services/AuthService";

const PORT = process.env.PORT ?? 3000;

function conferirAmbiente(): void {
  if (!usaPostgres()) {
    throw new Error(
      "DATABASE_URL ausente. O Nexo precisa de PostgreSQL para funcionar: é " +
        "onde ficam as contas e a separação de dados entre usuários. Sem banco " +
        "não há como entrar no app. Suba um com `docker compose up -d db` e " +
        "aponte DATABASE_URL para ele."
    );
  }

  conferirSegredo();
}

async function start(): Promise<void> {
  conferirAmbiente();

  await migrar();
  console.log("Esquema do banco aplicado");

  app.listen(PORT, () => {
    console.log(
      `Planner Virtual backend rodando na porta ${PORT}`
    );
  });
}

start().catch((error) => {
  console.error(
    "Não foi possível iniciar o backend",
    error
  );

  process.exitCode = 1;
});