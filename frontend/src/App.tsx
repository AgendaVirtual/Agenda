import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { DailyPlannerPage } from "./pages/DailyPlannerPage";
import { GoalsPage } from "./pages/GoalsPage";
import { LoginPage } from "./pages/LoginPage";
import { RemindersPage } from "./pages/RemindersPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ProvedorDeSessao } from "./services/sessao";
import { useSessao } from "./services/sessaoContexto";
import { ErrorBanner, LoadingState } from "./components/ui/Feedback";
import { Button } from "./components/ui/Button";

function ExigeConta() {
  const { conta, carregando, indisponivel, reconferir } = useSessao();

  if (carregando) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <LoadingState label="Abrindo sua agenda..." />
      </div>
    );
  }

  if (indisponivel) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-[420px] flex-col items-center justify-center gap-4 px-4">
        <ErrorBanner message={indisponivel} />
        <Button variant="secondary" onClick={() => void reconferir()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (!conta) return <Navigate to="/entrar" replace />;

  return <AppShell />;
}

function SoDeslogado() {
  const { conta, carregando } = useSessao();

  if (carregando) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <LoadingState label="Abrindo sua agenda..." />
      </div>
    );
  }

  return conta ? <Navigate to="/" replace /> : <LoginPage />;
}

function App() {
  return (
    <BrowserRouter>
      <ProvedorDeSessao>
        <Routes>
          <Route path="/entrar" element={<SoDeslogado />} />

          <Route element={<ExigeConta />}>
            <Route index element={<DashboardPage />} />
            <Route path="dia" element={<DailyPlannerPage />} />
            <Route path="metas" element={<GoalsPage />} />
            <Route path="lembretes" element={<RemindersPage />} />
            <Route path="relatorios" element={<ReportsPage />} />
            <Route path="ajustes" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </ProvedorDeSessao>
    </BrowserRouter>
  );
}

export default App;
