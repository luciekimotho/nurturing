import { z } from "zod";

// ─── Food ────────────────────────────────────────────────────────────────────

export const FoodLogSchema = z.object({
  name: z.string().min(1, "Food name is required"),
  calories: z.number().positive("Calories must be positive"),
  protein: z.number().nonnegative().optional(),
  carbs: z.number().nonnegative().optional(),
  fat: z.number().nonnegative().optional(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  loggedAt: z.string().datetime(),
});

export type FoodLogInput = z.infer<typeof FoodLogSchema>;

// ─── Workout ─────────────────────────────────────────────────────────────────

export const WorkoutLogSchema = z.object({
  type: z.string().min(1, "Workout type is required"),
  durationMinutes: z.number().positive("Duration must be positive"),
  intensityLevel: z.enum(["low", "moderate", "high"]),
  notes: z.string().optional(),
  loggedAt: z.string().datetime(),
});

export type WorkoutLogInput = z.infer<typeof WorkoutLogSchema>;

// ─── Cycle ────────────────────────────────────────────────────────────────────

export const CycleLogSchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime().optional(),
  cycleLength: z.number().int().min(21).max(45).optional(),
});

export type CycleLogInput = z.infer<typeof CycleLogSchema>;

// ─── Symptom ─────────────────────────────────────────────────────────────────

export const SymptomSchema = z.object({
  date: z.string().datetime(),
  type: z.string().min(1, "Symptom type is required"),
  severity: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
});

export type SymptomInput = z.infer<typeof SymptomSchema>;
