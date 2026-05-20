// Cycle phases
export type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal";

export interface CycleDay {
  date: string; // ISO date
  phase: CyclePhase;
  dayInCycle: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface FoodLog {
  id: string;
  userId: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  loggedAt: string;
}

export interface WorkoutLog {
  id: string;
  userId: string;
  type: string;
  durationMinutes: number;
  intensityLevel: "low" | "moderate" | "high";
  notes?: string;
  loggedAt: string;
}

export interface CycleLog {
  id: string;
  userId: string;
  periodStart: string;
  periodEnd?: string;
  cycleLength?: number;
}

export interface Symptom {
  id: string;
  userId: string;
  date: string;
  type: string; // e.g. "cramps", "bloating", "mood_swings", "energy_low"
  severity: 1 | 2 | 3 | 4 | 5;
}

/**
 * Given a period start date and today's date, returns the current cycle phase.
 * Uses average cycle length of 28 days as default.
 */
export function getCurrentPhase(
  periodStart: Date,
  today: Date = new Date(),
  cycleLength = 28
): CyclePhase {
  const msPerDay = 1000 * 60 * 60 * 24;
  const dayInCycle = Math.floor((today.getTime() - periodStart.getTime()) / msPerDay) + 1;
  const normalizedDay = ((dayInCycle - 1) % cycleLength) + 1;

  if (normalizedDay <= 5) return "menstrual";
  if (normalizedDay <= 13) return "follicular";
  if (normalizedDay <= 16) return "ovulatory";
  return "luteal";
}

/**
 * Returns general guidance for a given cycle phase.
 * This is informational only, not medical advice.
 */
export function getPhaseGuidance(phase: CyclePhase): {
  foodFocus: string[];
  workoutFocus: string[];
  note: string;
} {
  const guidance = {
    menstrual: {
      foodFocus: ["Iron-rich foods (leafy greens, lentils)", "Anti-inflammatory foods", "Warm soups and stews"],
      workoutFocus: ["Rest or gentle yoga", "Light walks", "Stretching"],
      note: "Focus on rest and replenishment.",
    },
    follicular: {
      foodFocus: ["Fermented foods", "Light proteins", "Fresh vegetables and fruits"],
      workoutFocus: ["Cardio", "Strength training", "HIIT"],
      note: "Energy rises — great time to try new workouts.",
    },
    ovulatory: {
      foodFocus: ["Fibre-rich foods", "Zinc and antioxidants", "Raw veggies and smoothies"],
      workoutFocus: ["High-intensity workouts", "Group classes", "Runs"],
      note: "Peak energy and strength — push yourself.",
    },
    luteal: {
      foodFocus: ["Complex carbohydrates", "Magnesium-rich foods (dark chocolate, nuts)", "Calming teas"],
      workoutFocus: ["Moderate cardio", "Pilates", "Swimming"],
      note: "Prioritise consistency over intensity.",
    },
  };
  return guidance[phase];
}
