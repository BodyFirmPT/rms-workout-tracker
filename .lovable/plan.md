# Flexible Per-Client Band Resistance Mapping

## Goal

Replace today's hardcoded `band_color` (Black/Blue/Red/etc.) with a **resistance level** (Extra Light → Extra Heavy) that maps to a **client-specific color**. Ankle weights have their own scale (Light/Medium/Heavy). Colors come from an admin-managed palette (name + hex) so display stays accurate across clients.

## Concepts

- **Color palette** (admin-managed): named colors with hex values used for visual display.
- **Resistance level** (system-defined enum): a non-localized strength rating stored on the exercise.
  - Resistance bands: `extra_light`, `light`, `medium`, `heavy`, `extra_heavy`
  - Ankle weights: `light`, `medium`, `heavy`
- **Client band mapping**: per-client overrides that map `(band category, resistance level) → color`. If no override exists for a client, system defaults are used.

System defaults:

```text
Resistance bands         Ankle weights
  extra_light  → White     light   → Green
  light        → Yellow    medium  → Pink
  medium       → Green     heavy   → Black
  heavy        → Blue
  extra_heavy  → Black
```

The existing `band_type` values stay; we just split them into two categories internally:
- "Ankle weight" → ankle-weight scale
- everything else (1-handle, 2-handle, flat, figure-8, leg cuffs) → resistance-band scale

## Database changes

New tables (migration):

1. `band_color_option` (admin-managed palette)
   - `id uuid pk`, `name text unique`, `hex text`, `sort_order int`, `created_at`
   - RLS: SELECT for all authenticated; INSERT/UPDATE/DELETE admin-only.
   - Seed with: White `#ffffff`, Yellow `#eab308`, Green `#22c55e`, Blue `#3b82f6`, Black `#374151`, Pink `#ec4899`, Red `#ef4444`, Purple `#8b5cf6`.

2. `client_band_mapping` (per-client overrides)
   - `id uuid pk`, `client_id uuid`, `band_category text` (`'band' | 'ankle_weight'`), `resistance_level text`, `color_id uuid` → `band_color_option.id`, `created_at`
   - Unique on `(client_id, band_category, resistance_level)`.
   - RLS mirrors other client-scoped tables (trainer-of-client or admin).

New columns on `workout_exercise`:
- `resistance_level text null` — stores level rather than a color name going forward.
- `band_category text null` — `'band' | 'ankle_weight'` so we know which scale applies.
- Keep `band_color` and `band_type` for backward-compatibility (read-only legacy display); new writes set `resistance_level` + `band_category` and leave `band_color` null.

No data backfill required — existing exercises keep their literal color via `band_color`.

## App changes

### Admin: manage color palette
- New page `/admin/band-colors` (admin-only) listing colors with name + hex picker, add/edit/delete. Reuse existing admin route pattern in `src/pages/Admin.tsx`.

### Client: manage band mapping
- New page `/client/:clientId/band-mapping` (linked from ClientDetails alongside Injuries/Locations).
- Two sections: "Resistance Bands" and "Ankle Weights". Each shows the levels with a color dropdown (options from `band_color_option`). A "Reset to defaults" button clears overrides.
- Effective mapping resolver: `client_band_mapping` row if present, else system default.

### Exercise form (`exercise-form.tsx`)
- Replace the Band Color dropdown with **Resistance Level**. Options depend on Band Type:
  - If `band_type === 'ankle-weight'`: Light / Medium / Heavy
  - Else: Extra Light / Light / Medium / Heavy / Extra Heavy
- Show a small color swatch next to each option, sourced from the resolved client mapping, plus the color name in subtle text — so the trainer sees both weight and color while editing.
- Persist `resistance_level` and `band_category` (derived from band_type).

### Exercise display (`unified-exercise-card.tsx`)
- When `resistance_level` is present, resolve `(client, band_category, resistance_level) → color` and render the color name in the resolved hex (current visual style).
- Format stays: `[Color name] [Band type] band` (color only, no level shown).
- Fallback: if only legacy `band_color` is set, render as today.

### Other touchpoints
- `src/types/workout.ts`: add `resistance_level`, `band_category` to `WorkoutExercise` and `CreateWorkoutExerciseInput`.
- `src/services/workoutService.ts`: include new fields in insert/update.
- `src/pages/ImportWorkout.tsx` + `supabase/functions/parse-workout-import/index.ts`: AI parser returns `resistance_level` + `band_category` instead of `band_color`. The import preview shows the resolved color for the workout's client.
- `src/pages/SharedWorkout.tsx` + `muscle-group-suggestions.tsx`: read-only display path updated to use the resolver.

## Technical notes

- Resolver helper `getBandColor(clientId, category, level)` lives in a small util that takes preloaded mapping + palette arrays from the workout store to avoid per-row queries. Workout store gains `bandColors` and `clientBandMappings` slices loaded once per session / on client switch.
- Keep `BAND_COLOR_MAP` in `unified-exercise-card.tsx` only as a legacy fallback for rows that still have `band_color` and no `resistance_level`.
- AI normalization in the edge function: map any color the LLM returns onto a level using the system default mapping, so old prompts still produce something sensible. Update the parser prompt to prefer levels.

## Out of scope

- Migrating historical `band_color` rows into `resistance_level` (leave them as legacy display).
- Localizing level names.
