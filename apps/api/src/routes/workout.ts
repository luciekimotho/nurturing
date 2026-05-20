import { Router } from "express";
import { WorkoutLogSchema } from "@nurturing/schemas";
import type { WorkoutLog } from "@nurturing/core";
import { randomUUID } from "crypto";

export const workoutRouter = Router();

const logs: WorkoutLog[] = [];

workoutRouter.get("/", (_req, res) => {
  res.json(logs);
});

workoutRouter.post("/", (req, res) => {
  const result = WorkoutLogSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() });
  }
  const log: WorkoutLog = {
    id: randomUUID(),
    userId: "demo",
    ...result.data,
  };
  logs.push(log);
  res.status(201).json(log);
});

workoutRouter.delete("/:id", (req, res) => {
  const index = logs.findIndex((l) => l.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Not found" });
  logs.splice(index, 1);
  res.status(204).send();
});
