import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { FoodLogSchema } from "@nurturing/schemas";
import { DB_UNAVAILABLE_ERROR, prisma } from "../lib/prisma";
import { normalizeForLookup } from "../lib/normalize";

export const foodRouter = Router();

foodRouter.get("/suggestions", (req, res) => {
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

  return prisma.foodSuggestion
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
          mealType: row.mealType,
        }))
    )
    .then((result) => res.json(result))
    .catch((error: unknown) => {
      console.error("Failed to fetch food suggestions", error);
      res.status(500).json({ error: "Failed to fetch food suggestions" });
    });
});

foodRouter.get("/", (_req, res) => {
  const userId = res.locals.userId as string;

  if (!prisma) {
    return res.status(503).json(DB_UNAVAILABLE_ERROR);
  }

  return prisma.foodLog
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
      console.error("Failed to fetch food logs", error);
      res.status(500).json({ error: "Failed to fetch food logs" });
    });
});

foodRouter.post("/", (req, res) => {
  const userId = res.locals.userId as string;

  const result = FoodLogSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() });
  }
  if (!prisma) {
    return res.status(503).json(DB_UNAVAILABLE_ERROR);
  }

  const trimmedName = result.data.name.trim();
  const normalizedName = normalizeForLookup(trimmedName);

  return prisma
    .$transaction(async (tx) => {
      const created = await tx.foodLog.create({
        data: {
          userId,
          name: trimmedName,
          calories: result.data.calories,
          protein: result.data.protein,
          carbs: result.data.carbs,
          fat: result.data.fat,
          mealType: result.data.mealType,
          loggedAt: new Date(result.data.loggedAt),
        },
      });

      await tx.foodSuggestion.upsert({
        where: { normalizedLabel: normalizedName },
        create: {
          label: trimmedName,
          normalizedLabel: normalizedName,
          mealType: result.data.mealType,
          popularityScore: 1,
          active: true,
        },
        update: {
          popularityScore: { increment: 1 },
          mealType: result.data.mealType,
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
      console.error("Failed to create food log", error);
      res.status(500).json({ error: "Failed to create food log" });
    });
});

foodRouter.delete("/:id", (req, res) => {
  const userId = res.locals.userId as string;

  if (!prisma) {
    return res.status(503).json(DB_UNAVAILABLE_ERROR);
  }

  return prisma.foodLog
    .deleteMany({ where: { id: req.params.id, userId } })
    .then((result: Prisma.BatchPayload) => {
      if (result.count === 0) return res.status(404).json({ error: "Not found" });
      return res.status(204).send();
    })
    .catch((error: unknown) => {
      console.error("Failed to delete food log", error);
      res.status(500).json({ error: "Failed to delete food log" });
    });
});
