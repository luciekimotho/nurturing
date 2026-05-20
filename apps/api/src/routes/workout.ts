import { Router } from "express";
import { WorkoutLogSchema } from "@nurturing/schemas";
import { DB_UNAVAILABLE_ERROR, prisma } from "../lib/prisma";

export const workoutRouter = Router();

workoutRouter.get("/", (_req, res) => {
  if (!prisma) {
    return res.status(503).json(DB_UNAVAILABLE_ERROR);
  }

  return prisma.workoutLog
    .findMany({ where: { userId: "demo" }, orderBy: { loggedAt: "desc" } })
    .then((rows) =>
      res.json(
        rows.map((r) => ({
          ...r,
          loggedAt: r.loggedAt.toISOString(),
        }))
      )
    )
    .catch((error) => {
      console.error("Failed to fetch workout logs", error);
      res.status(500).json({ error: "Failed to fetch workout logs" });
    });
});

workoutRouter.post("/", (req, res) => {
  const result = WorkoutLogSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() });
  }
  if (!prisma) {
    return res.status(503).json(DB_UNAVAILABLE_ERROR);
  }

  return prisma.workoutLog
    .create({
      data: {
        userId: "demo",
        type: result.data.type,
        durationMinutes: result.data.durationMinutes,
        intensityLevel: result.data.intensityLevel,
        notes: result.data.notes,
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
      console.error("Failed to create workout log", error);
      res.status(500).json({ error: "Failed to create workout log" });
    });
});

workoutRouter.delete("/:id", (req, res) => {
  if (!prisma) {
    return res.status(503).json(DB_UNAVAILABLE_ERROR);
  }

  return prisma.workoutLog
    .deleteMany({ where: { id: req.params.id, userId: "demo" } })
    .then((result) => {
      if (result.count === 0) return res.status(404).json({ error: "Not found" });
      return res.status(204).send();
    })
    .catch((error) => {
      console.error("Failed to delete workout log", error);
      res.status(500).json({ error: "Failed to delete workout log" });
    });
});
