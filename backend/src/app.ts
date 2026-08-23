import express from "express";
import cors from "cors";
import goalRoutes from "./controllers/GoalController";
import taskRoutes from "./controllers/TaskController";
import categoryRoutes from "./controllers/CategoryController";
import reminderRoutes from "./controllers/ReminderController";
import { reportRouter, dashboardRouter } from "./controllers/ReportController";
import { errorHandler } from "./utils/errors";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/goals", goalRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/reports", reportRouter);
app.use("/api/dashboard", dashboardRouter);

app.get("/health", (_req, res) => res.json({ success: true }));

// Deve ser o último middleware registrado
app.use(errorHandler);

export default app;
