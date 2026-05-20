import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { foodRouter } from "./routes/food";
import { workoutRouter } from "./routes/workout";
import { cycleRouter } from "./routes/cycle";
import { AUTH_MODE, requireUser } from "./middleware/requireUser";

const app = express();

app.use(cors());
app.use(express.json());

if (AUTH_MODE === "clerk") {
  app.use(clerkMiddleware());
}

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", app: "nurturing-api", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api", requireUser);
app.use("/api/food", foodRouter);
app.use("/api/workouts", workoutRouter);
app.use("/api/cycle", cycleRouter);

export default app;
