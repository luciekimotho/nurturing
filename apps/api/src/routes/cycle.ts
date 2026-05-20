import { Router } from "express";
import { CycleLogSchema, SymptomSchema } from "@nurturing/schemas";
import { getCurrentPhase, getPhaseGuidance } from "@nurturing/core";
import { DB_UNAVAILABLE_ERROR, prisma } from "../lib/prisma";

export const cycleRouter = Router();

// Get all cycle logs
cycleRouter.get("/", (_req, res) => {
  const userId = res.locals.userId as string;

  if (!prisma) {
    return res.status(503).json(DB_UNAVAILABLE_ERROR);
  }

  return prisma.cycleLog
    .findMany({ where: { userId }, orderBy: { periodStart: "desc" } })
    .then((rows) =>
      res.json(
        rows.map((r) => ({
          ...r,
          periodStart: r.periodStart.toISOString(),
          periodEnd: r.periodEnd?.toISOString(),
        }))
      )
    )
    .catch((error: unknown) => {
      console.error("Failed to fetch cycle logs", error);
      return res.status(500).json({ error: "Failed to fetch cycle logs" });
    });
});

// Log a new period start
cycleRouter.post("/", (req, res) => {
  const userId = res.locals.userId as string;

  const result = CycleLogSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() });
  }
  if (!prisma) {
    return res.status(503).json(DB_UNAVAILABLE_ERROR);
  }

  return prisma.cycleLog
    .create({
      data: {
        userId,
        periodStart: new Date(result.data.periodStart),
        periodEnd: result.data.periodEnd ? new Date(result.data.periodEnd) : null,
        cycleLength: result.data.cycleLength,
      },
    })
    .then((created) =>
      res.status(201).json({
        ...created,
        periodStart: created.periodStart.toISOString(),
        periodEnd: created.periodEnd?.toISOString(),
      })
    )
    .catch((error: unknown) => {
      console.error("Failed to create cycle log", error);
      return res.status(500).json({ error: "Failed to create cycle log" });
    });
});

// Get current phase + guidance based on most recent period start
cycleRouter.get("/phase", (_req, res) => {
  const userId = res.locals.userId as string;

  if (!prisma) {
    return res.status(503).json(DB_UNAVAILABLE_ERROR);
  }

  return prisma.cycleLog
    .findFirst({ where: { userId }, orderBy: { periodStart: "desc" } })
    .then((latest) => {
      if (!latest) {
        return res.status(404).json({ error: "No cycle data logged yet" });
      }
      const phase = getCurrentPhase(new Date(latest.periodStart), new Date(), latest.cycleLength ?? undefined);
      const guidance = getPhaseGuidance(phase);

      return res.json({
        phase,
        guidance,
        disclaimer: "This is general wellness information only, not medical advice.",
      });
    })
    .catch((error: unknown) => {
      console.error("Failed to fetch current cycle phase", error);
      return res.status(500).json({ error: "Failed to fetch current cycle phase" });
    });
});

// Log symptoms
cycleRouter.post("/symptoms", (req, res) => {
  const userId = res.locals.userId as string;

  const result = SymptomSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() });
  }
  if (!prisma) {
    return res.status(503).json(DB_UNAVAILABLE_ERROR);
  }

  return prisma.symptom
    .create({
      data: {
        userId,
        date: new Date(result.data.date),
        type: result.data.type,
        severity: result.data.severity,
      },
    })
    .then((created) =>
      res.status(201).json({
        ...created,
        date: created.date.toISOString(),
      })
    )
    .catch((error: unknown) => {
      console.error("Failed to create symptom", error);
      return res.status(500).json({ error: "Failed to create symptom" });
    });
});

// Get all symptoms
cycleRouter.get("/symptoms", (_req, res) => {
  const userId = res.locals.userId as string;

  if (!prisma) {
    return res.status(503).json(DB_UNAVAILABLE_ERROR);
  }

  return prisma.symptom
    .findMany({ where: { userId }, orderBy: { date: "desc" } })
    .then((rows) =>
      res.json(
        rows.map((r) => ({
          ...r,
          date: r.date.toISOString(),
        }))
      )
    )
    .catch((error: unknown) => {
      console.error("Failed to fetch symptoms", error);
      return res.status(500).json({ error: "Failed to fetch symptoms" });
    });
});
