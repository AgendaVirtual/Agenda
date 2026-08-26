import app from "./app";
import { CategoryService } from "./services/CategoryService";
import { migrar, usaPostgres } from "./persistence/db";
import { conferirSegredo } from "./services/AuthService";

const PORT = process.env.PORT ?? 3000;

function conferirAmbiente(): void {
  const producao = process.env.NODE_ENV === "production";

  if (producao && !usaPostgres()) {
    throw new Error(
      "DATABASE_URL ausente em produção. Sem banco o app cai para arquivo, " +
        "e nesse modo não há contas nem isolamento: as rotas de dados ficariam " +
        "abertas. Defina DATABASE_URL ou rode com NODE_ENV diferente."
    );
  }

  if (usaPostgres()) {
    conferirSegredo();
  } else {
    console.warn(
      "AVISO: sem DATABASE_URL. Modo de arquivo, SEM login e SEM separação por " +
        "usuário. Use apenas em desenvolvimento local."
    );
  }
}

async function start(): Promise<void> {
  conferirAmbiente();

  if (usaPostgres()) {
    await migrar();
    console.log("Esquema do banco aplicado");
  }

  if (!usaPostgres()) {
    await new CategoryService().seedDefaults();
  }

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