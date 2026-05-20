import express from "express";
import cors from "cors";
import { foodRouter } from "./routes/food";
import { workoutRouter } from "./routes/workout";
import { cycleRouter } from "./routes/cycle";

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", app: "nurturing-api", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/food", foodRouter);
app.use("/api/workouts", workoutRouter);
app.use("/api/cycle", cycleRouter);

export default app;
