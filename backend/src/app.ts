import express from "express";
import cors from "cors";
import goalRoutes from "./controllers/GoalController";
import taskRoutes from "./controllers/TaskController";
import categoryRoutes from "./controllers/CategoryController";
import reminderRoutes from "./controllers/ReminderController";
import reportRoutes from "./controllers/ReportController";
import dashboardRoutes from "./controllers/DashboardController";
import authRoutes from "./controllers/AuthController";
import { exigirSessao } from "./middleware/sessao";
import { errorHandler } from "./utils/errors";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.use("/api/goals", exigirSessao, goalRoutes);
app.use("/api/tasks", exigirSessao, taskRoutes);
app.use("/api/categories", exigirSessao, categoryRoutes);
app.use("/api/reminders", exigirSessao, reminderRoutes);
app.use("/api/reports", exigirSessao, reportRoutes);
app.use("/api/dashboard", exigirSessao, dashboardRoutes);

app.get("/health", (_req, res) => res.json({ success: true }));

// Deve ser o último middleware registrado
app.use(errorHandler);

export default app;
