import { Router } from "express";
import { CycleLogSchema, SymptomSchema } from "@nurturing/schemas";
import { getCurrentPhase, getPhaseGuidance } from "@nurturing/core";
import type { CycleLog, Symptom } from "@nurturing/core";
import { randomUUID } from "crypto";

export const cycleRouter = Router();

const cycleLogs: CycleLog[] = [];
const symptoms: Symptom[] = [];

// Get all cycle logs
cycleRouter.get("/", (_req, res) => {
  res.json(cycleLogs);
});

// Log a new period start
cycleRouter.post("/", (req, res) => {
  const result = CycleLogSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() });
  }
  const log: CycleLog = {
    id: randomUUID(),
    userId: "demo",
    ...result.data,
  };
  cycleLogs.push(log);
  res.status(201).json(log);
});

// Get current phase + guidance based on most recent period start
cycleRouter.get("/phase", (_req, res) => {
  if (cycleLogs.length === 0) {
    return res.status(404).json({ error: "No cycle data logged yet" });
  }
  const latest = cycleLogs
    .slice()
    .sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime())[0];

  const phase = getCurrentPhase(new Date(latest.periodStart), new Date(), latest.cycleLength);
  const guidance = getPhaseGuidance(phase);

  res.json({
    phase,
    guidance,
    disclaimer: "This is general wellness information only, not medical advice.",
  });
});

// Log symptoms
cycleRouter.post("/symptoms", (req, res) => {
  const result = SymptomSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() });
  }
  const symptom: Symptom = {
    id: randomUUID(),
    userId: "demo",
    ...result.data,
  };
  symptoms.push(symptom);
  res.status(201).json(symptom);
});

// Get all symptoms
cycleRouter.get("/symptoms", (_req, res) => {
  res.json(symptoms);
});
