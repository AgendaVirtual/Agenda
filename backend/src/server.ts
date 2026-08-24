import app from "./app";
import { CategoryService } from "./services/CategoryService";

const PORT = process.env.PORT ?? 3000;

async function start(): Promise<void> {
  await new CategoryService().seedDefaults();

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