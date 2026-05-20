import { Router } from "express";
import { FoodLogSchema } from "@nurturing/schemas";
import type { FoodLog } from "@nurturing/core";
import { randomUUID } from "crypto";

export const foodRouter = Router();

// In-memory store for MVP — replace with DB in Phase 2
const logs: FoodLog[] = [];

foodRouter.get("/", (_req, res) => {
  res.json(logs);
});

foodRouter.post("/", (req, res) => {
  const result = FoodLogSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() });
  }
  const log: FoodLog = {
    id: randomUUID(),
    userId: "demo", // replaced with auth in Phase 2
    ...result.data,
  };
  logs.push(log);
  res.status(201).json(log);
});

foodRouter.delete("/:id", (req, res) => {
  const index = logs.findIndex((l) => l.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Not found" });
  logs.splice(index, 1);
  res.status(204).send();
});
