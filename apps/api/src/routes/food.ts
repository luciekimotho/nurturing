import { Router } from "express";
import { FoodLogSchema } from "@nurturing/schemas";
import { DB_UNAVAILABLE_ERROR, prisma } from "../lib/prisma";

export const foodRouter = Router();

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
    .catch((error) => {
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

  return prisma.foodLog
    .create({
      data: {
        userId,
        name: result.data.name,
        calories: result.data.calories,
        protein: result.data.protein,
        carbs: result.data.carbs,
        fat: result.data.fat,
        mealType: result.data.mealType,
        loggedAt: new Date(result.data.loggedAt),
      },
    })
    .then((created) =>
      res.status(201).json({
        ...created,
        loggedAt: created.loggedAt.toISOString(),
      })
    )
    .catch((error) => {
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
    .then((result) => {
      if (result.count === 0) return res.status(404).json({ error: "Not found" });
      return res.status(204).send();
    })
    .catch((error) => {
      console.error("Failed to delete food log", error);
      res.status(500).json({ error: "Failed to delete food log" });
    });
});
