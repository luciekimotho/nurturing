import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { WorkoutLogSchema } from "@nurturing/schemas";
import { DB_UNAVAILABLE_ERROR, prisma } from "../lib/prisma";
import { normalizeForLookup } from "../lib/normalize";

export const workoutRouter = Router();

workoutRouter.get("/suggestions", (req, res) => {
  if (!prisma) {
    return res.status(503).json(DB_UNAVAILABLE_ERROR);
  }

  const q = typeof req.query.q === "string" ? req.query.q : "";
  const normalizedQuery = normalizeForLookup(q);
  const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 8;
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(20, Math.trunc(limitRaw))) : 8;

  if (normalizedQuery.length < 2) {
    return res.status(400).json({ error: "Query must be at least 2 characters" });
  }

  return prisma.workoutSuggestion
    .findMany({
      where: {
        active: true,
        normalizedLabel: { contains: normalizedQuery },
      },
      take: Math.max(20, limit * 4),
    })
    .then((rows) =>
      rows
        .sort((a, b) => {
          const aPrefix = a.normalizedLabel.startsWith(normalizedQuery) ? 1 : 0;
          const bPrefix = b.normalizedLabel.startsWith(normalizedQuery) ? 1 : 0;

          if (aPrefix !== bPrefix) return bPrefix - aPrefix;
          if (a.popularityScore !== b.popularityScore) return b.popularityScore - a.popularityScore;
          return a.label.localeCompare(b.label);
        })
        .slice(0, limit)
        .map((row) => ({
          label: row.label,
          popularityScore: row.popularityScore,
          intensityHint: row.intensityHint,
        }))
    )
    .then((result) => res.json(result))
    .catch((error: unknown) => {
      console.error("Failed to fetch workout suggestions", error);
      res.status(500).json({ error: "Failed to fetch workout suggestions" });
    });
});

workoutRouter.get("/", (_req, res) => {
  const userId = res.locals.userId as string;

  if (!prisma) {
    return res.status(503).json(DB_UNAVAILABLE_ERROR);
  }

  return prisma.workoutLog
    .findMany({ where: { userId }, orderBy: { loggedAt: "desc" } })
    .then((rows) =>
      res.json(
        rows.map((r) => ({
          ...r,
          loggedAt: r.loggedAt.toISOString(),
        }))
      )
    )
    .catch((error: unknown) => {
      console.error("Failed to fetch workout logs", error);
      res.status(500).json({ error: "Failed to fetch workout logs" });
    });
});

workoutRouter.post("/", (req, res) => {
  const userId = res.locals.userId as string;

  const result = WorkoutLogSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() });
  }
  if (!prisma) {
    return res.status(503).json(DB_UNAVAILABLE_ERROR);
  }

  const trimmedType = result.data.type.trim();
  const normalizedType = normalizeForLookup(trimmedType);
  const notes = result.data.notes?.trim();

  return prisma
    .$transaction(async (tx) => {
      const created = await tx.workoutLog.create({
        data: {
          userId,
          type: trimmedType,
          durationMinutes: result.data.durationMinutes,
          intensityLevel: result.data.intensityLevel,
          ...(notes ? { notes } : {}),
          loggedAt: new Date(result.data.loggedAt),
        },
      });

      await tx.workoutSuggestion.upsert({
        where: { normalizedLabel: normalizedType },
        create: {
          label: trimmedType,
          normalizedLabel: normalizedType,
          intensityHint: result.data.intensityLevel,
          popularityScore: 1,
          active: true,
        },
        update: {
          popularityScore: { increment: 1 },
          intensityHint: result.data.intensityLevel,
          active: true,
        },
      });

      return created;
    })
    .then((created) =>
      res.status(201).json({
        ...created,
        loggedAt: created.loggedAt.toISOString(),
      })
    )
    .catch((error: unknown) => {
      console.error("Failed to create workout log", error);
      res.status(500).json({ error: "Failed to create workout log" });
    });
});

workoutRouter.delete("/:id", (req, res) => {
  const userId = res.locals.userId as string;

  if (!prisma) {
    return res.status(503).json(DB_UNAVAILABLE_ERROR);
  }

  return prisma.workoutLog
    .deleteMany({ where: { id: req.params.id, userId } })
    .then((result: Prisma.BatchPayload) => {
      if (result.count === 0) return res.status(404).json({ error: "Not found" });
      return res.status(204).send();
    })
    .catch((error: unknown) => {
      console.error("Failed to delete workout log", error);
      res.status(500).json({ error: "Failed to delete workout log" });
    });
});
