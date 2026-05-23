import { Router } from "express";
import { CycleLogSchema, SymptomSchema } from "@nurturing/schemas";
import { getCurrentPhase, getPhaseGuidance } from "@nurturing/core";
import { DB_UNAVAILABLE_ERROR, prisma } from "../lib/prisma";

export const cycleRouter = Router();

function serializeCycleLog(log: {
  id: string;
  userId: string;
  periodStart: Date;
  periodEnd: Date | null;
  cycleLength: number | null;
  createdAt: Date;
}) {
  return {
    ...log,
    periodStart: log.periodStart.toISOString(),
    periodEnd: log.periodEnd?.toISOString(),
  };
}

// Get all cycle logs
cycleRouter.get("/", (_req, res) => {
  const userId = res.locals.userId as string;

  if (!prisma) {
    return res.status(503).json(DB_UNAVAILABLE_ERROR);
  }

  return prisma.cycleLog
    .findMany({ where: { userId }, orderBy: { periodStart: "desc" } })
    .then((rows) => res.json(rows.map(serializeCycleLog)))
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
    .then((created) => res.status(201).json(serializeCycleLog(created)))
    .catch((error: unknown) => {
      console.error("Failed to create cycle log", error);
      return res.status(500).json({ error: "Failed to create cycle log" });
    });
});

// Update a cycle log
cycleRouter.patch("/:id", (req, res) => {
  const userId = res.locals.userId as string;
  const cycleId = req.params.id;

  const result = CycleLogSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() });
  }

  if (!prisma) {
    return res.status(503).json(DB_UNAVAILABLE_ERROR);
  }
  const db = prisma;

  return db.cycleLog
    .findFirst({ where: { id: cycleId, userId } })
    .then((existing) => {
      if (!existing) {
        return res.status(404).json({ error: "Cycle log not found" });
      }

      return db.cycleLog
        .update({
          where: { id: cycleId },
          data: {
            periodStart: new Date(result.data.periodStart),
            periodEnd: result.data.periodEnd ? new Date(result.data.periodEnd) : null,
            cycleLength: result.data.cycleLength,
          },
        })
        .then((updated) => res.json(serializeCycleLog(updated)));
    })
    .catch((error: unknown) => {
      console.error("Failed to update cycle log", error);
      return res.status(500).json({ error: "Failed to update cycle log" });
    });
});

// Delete a cycle log
cycleRouter.delete("/:id", (req, res) => {
  const userId = res.locals.userId as string;
  const cycleId = req.params.id;

  if (!prisma) {
    return res.status(503).json(DB_UNAVAILABLE_ERROR);
  }
  const db = prisma;

  return db.cycleLog
    .findFirst({ where: { id: cycleId, userId } })
    .then((existing) => {
      if (!existing) {
        return res.status(404).json({ error: "Cycle log not found" });
      }

      return db.cycleLog.delete({ where: { id: cycleId } }).then(() => res.status(204).send());
    })
    .catch((error: unknown) => {
      console.error("Failed to delete cycle log", error);
      return res.status(500).json({ error: "Failed to delete cycle log" });
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

// Delete a symptom
cycleRouter.delete("/symptoms/:id", (req, res) => {
  const userId = res.locals.userId as string;
  const symptomId = req.params.id;

  if (!prisma) {
    return res.status(503).json(DB_UNAVAILABLE_ERROR);
  }
  const db = prisma;

  return db.symptom
    .findFirst({ where: { id: symptomId, userId } })
    .then((existing) => {
      if (!existing) {
        return res.status(404).json({ error: "Symptom not found" });
      }
      return db.symptom.delete({ where: { id: symptomId } }).then(() => res.status(204).send());
    })
    .catch((error: unknown) => {
      console.error("Failed to delete symptom", error);
      return res.status(500).json({ error: "Failed to delete symptom" });
    });
});
