-- Create global suggestion catalogs for food and workout names
CREATE TABLE "FoodSuggestion" (
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "normalizedLabel" TEXT NOT NULL,
  "mealType" TEXT,
  "popularityScore" INTEGER NOT NULL DEFAULT 1,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FoodSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkoutSuggestion" (
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "normalizedLabel" TEXT NOT NULL,
  "intensityHint" TEXT,
  "popularityScore" INTEGER NOT NULL DEFAULT 1,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkoutSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FoodSuggestion_normalizedLabel_key" ON "FoodSuggestion"("normalizedLabel");
CREATE UNIQUE INDEX "WorkoutSuggestion_normalizedLabel_key" ON "WorkoutSuggestion"("normalizedLabel");
CREATE INDEX "FoodSuggestion_active_popularityScore_idx" ON "FoodSuggestion"("active", "popularityScore");
CREATE INDEX "WorkoutSuggestion_active_popularityScore_idx" ON "WorkoutSuggestion"("active", "popularityScore");

-- Seed common food suggestions
INSERT INTO "FoodSuggestion" ("id", "label", "normalizedLabel", "mealType", "popularityScore", "active", "createdAt", "updatedAt")
VALUES
  ('food_oatmeal', 'Oatmeal', 'oatmeal', 'breakfast', 50, true, NOW(), NOW()),
  ('food_eggs', 'Eggs', 'eggs', 'breakfast', 48, true, NOW(), NOW()),
  ('food_greek_yogurt', 'Greek Yogurt', 'greek yogurt', 'breakfast', 42, true, NOW(), NOW()),
  ('food_banana', 'Banana', 'banana', 'snack', 41, true, NOW(), NOW()),
  ('food_avocado_toast', 'Avocado Toast', 'avocado toast', 'breakfast', 36, true, NOW(), NOW()),
  ('food_chicken_salad', 'Chicken Salad', 'chicken salad', 'lunch', 44, true, NOW(), NOW()),
  ('food_grilled_chicken', 'Grilled Chicken', 'grilled chicken', 'dinner', 46, true, NOW(), NOW()),
  ('food_rice_beans', 'Rice and Beans', 'rice and beans', 'lunch', 39, true, NOW(), NOW()),
  ('food_ugali_sukuma', 'Ugali and Sukuma Wiki', 'ugali and sukuma wiki', 'dinner', 34, true, NOW(), NOW()),
  ('food_lentil_stew', 'Lentil Stew', 'lentil stew', 'dinner', 31, true, NOW(), NOW()),
  ('food_beef_stew', 'Beef Stew', 'beef stew', 'dinner', 29, true, NOW(), NOW()),
  ('food_salmon', 'Salmon', 'salmon', 'dinner', 33, true, NOW(), NOW()),
  ('food_protein_shake', 'Protein Shake', 'protein shake', 'snack', 38, true, NOW(), NOW()),
  ('food_pb_sandwich', 'Peanut Butter Sandwich', 'peanut butter sandwich', 'snack', 27, true, NOW(), NOW()),
  ('food_sweet_potato', 'Sweet Potato', 'sweet potato', 'dinner', 26, true, NOW(), NOW()),
  ('food_apple', 'Apple', 'apple', 'snack', 35, true, NOW(), NOW())
ON CONFLICT ("normalizedLabel") DO NOTHING;

-- Seed common workout suggestions
INSERT INTO "WorkoutSuggestion" ("id", "label", "normalizedLabel", "intensityHint", "popularityScore", "active", "createdAt", "updatedAt")
VALUES
  ('workout_walk', 'Walk', 'walk', 'low', 56, true, NOW(), NOW()),
  ('workout_jog', 'Jog', 'jog', 'moderate', 41, true, NOW(), NOW()),
  ('workout_run', 'Run', 'run', 'high', 44, true, NOW(), NOW()),
  ('workout_yoga', 'Yoga', 'yoga', 'low', 52, true, NOW(), NOW()),
  ('workout_pilates', 'Pilates', 'pilates', 'moderate', 33, true, NOW(), NOW()),
  ('workout_strength_training', 'Strength Training', 'strength training', 'high', 47, true, NOW(), NOW()),
  ('workout_hiit', 'HIIT', 'hiit', 'high', 37, true, NOW(), NOW()),
  ('workout_cycling', 'Cycling', 'cycling', 'moderate', 36, true, NOW(), NOW()),
  ('workout_spin_class', 'Spin Class', 'spin class', 'high', 24, true, NOW(), NOW()),
  ('workout_swimming', 'Swimming', 'swimming', 'moderate', 29, true, NOW(), NOW()),
  ('workout_dance_workout', 'Dance Workout', 'dance workout', 'moderate', 28, true, NOW(), NOW()),
  ('workout_stretching', 'Stretching', 'stretching', 'low', 32, true, NOW(), NOW()),
  ('workout_mobility', 'Mobility', 'mobility', 'low', 22, true, NOW(), NOW()),
  ('workout_elliptical', 'Elliptical', 'elliptical', 'moderate', 21, true, NOW(), NOW()),
  ('workout_stair_climber', 'Stair Climber', 'stair climber', 'high', 19, true, NOW(), NOW())
ON CONFLICT ("normalizedLabel") DO NOTHING;
