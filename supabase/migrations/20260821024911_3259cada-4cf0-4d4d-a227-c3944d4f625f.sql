ALTER TABLE public.workout_exercise ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

WITH ordered AS (
  SELECT id, row_number() OVER (PARTITION BY workout_id ORDER BY created_at, id) - 1 AS rn
  FROM public.workout_exercise
)
UPDATE public.workout_exercise we
SET sort_order = ordered.rn
FROM ordered
WHERE we.id = ordered.id;

CREATE INDEX IF NOT EXISTS workout_exercise_workout_sort_idx ON public.workout_exercise (workout_id, sort_order);