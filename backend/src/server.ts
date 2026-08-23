import app from "./app";
import { CategoryService } from "./services/CategoryService";

const PORT = process.env.PORT ?? 3000;

// Popula as categorias padrão na primeira execução
new CategoryService().seedDefaults().catch(console.error);

app.listen(PORT, () => {
  console.log(`Planner Virtual backend rodando na porta ${PORT}`);
});
