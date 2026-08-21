# Exercise Ordering + Tabata Mode

## What you'll get

1. **Custom exercise order** — a reorder view where you drag exercises into a single flat sequence for the workout. The normal workout view keeps a toggle: "By muscle group" (today's grouped layout) or "Custom order" (flat, drag-to-reorder).
2. **Tabata mode** — a start dialog for work/rest times and sequence style, then a full-screen timer experience.

## Ordering

- New `sort_order` column on `workout_exercise` (backfilled from `created_at` per workout, so nothing jumps around).
- Toggle at the top of the workout exercise list: **Muscle group** (default, unchanged) / **Order**.
- In Order view, exercises render as a flat list with drag handles; dropping saves the new order. Newly added exercises append to the end.
- Print view and shared-workout view follow the custom order.

## Tabata mode

Entry: "Start Tabata" in the workout's three-dot menu (enabled once the workout has exercises). Opens a settings dialog:

- Work time (default 20s), Rest time (default 10s)
- Sequence style:
  - **Repeat sets** — each exercise runs its own `set_count` work intervals before moving on
  - **Circuit rounds** — one pass through all exercises per round, repeated N rounds (N configurable)
- Optional lead-in countdown (5s) before the first interval
- Settings are remembered in local storage for next time (per session, not saved to the database)

Full-screen experience (`/workout/:id/tabata`):

- Large circular countdown and huge current exercise name, with reps/weight/band color underneath
- Clear WORK vs REST state (color shift + label), and "Next up: Rest 10s" / next exercise preview
- Small list of the next 2-3 upcoming exercises below
- Round/interval progress ("Set 2 of 3", "Round 1 of 4") and overall progress bar
- Controls: pause/resume, skip interval, back, exit
- Beeps on the last 3 seconds and at interval end (reusing the existing timer's Web Audio beep)
- Screen stays awake via the Wake Lock API where supported

Progress tracking: each completed **work** interval increments that exercise's `completed_sets`, so workout progress and the completion state update just like manual tracking. Exiting early keeps whatever was completed.

## Technical notes

- Migration: `ALTER TABLE public.workout_exercise ADD COLUMN sort_order integer NOT NULL DEFAULT 0`, backfill with `row_number()` per `workout_id` ordered by `created_at`; index on `(workout_id, sort_order)`.
- `workoutService` / `workoutStore`: order exercise queries by `sort_order, created_at`; add `reorderExercises(workoutId, orderedIds)` (batched update) and set `sort_order` on insert to max+1.
- New files: `src/components/workout/exercise-order-list.tsx` (drag list, using `@dnd-kit` — add dependency), `src/components/workout/tabata-settings-dialog.tsx`, `src/pages/TabataMode.tsx`, `src/hooks/useTabataEngine.ts` (interval state machine, drift-corrected via timestamps).
- Route `/workout/:id/tabata` added in `App.tsx`, inside the existing protected route setup.
- Beep logic extracted from `exercise-timer.tsx` into a small shared helper so both use it.
- `PrintWorkout.tsx` and `useSharedWorkout`/`shared-workout` edge function updated to sort by `sort_order`.
