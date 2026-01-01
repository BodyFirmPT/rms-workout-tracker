import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedExercise {
  muscle_group: string;
  exercise_name: string;
  reps_count: number;
  reps_unit: string;
  weight_count: number;
  weight_unit: string;
  left_weight: number | null;
  set_count: number;
  type: 'weight' | 'band' | 'stretch';
  band_color: string | null;
  band_type: string | null;
  note: string;
  raw_import_data: string;
}

interface ParsedWorkout {
  date: string | null;
  exercises: ParsedExercise[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rawText, muscleGroups } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Parsing workout import text:", rawText.substring(0, 200) + "...");
    console.log("Available muscle groups:", muscleGroups);

    const muscleGroupList = (muscleGroups || []).join(", ");

    const systemPrompt = `You are a workout data parser. Parse the provided workout text into structured exercise data.

IMPORTANT: The input may contain MULTIPLE workouts separated by different dates. Parse ALL workouts and return them as an array.

For each workout found, look for a date. Common formats include:
- "Date,1/15/2019" or "Date: 1/15/2019"
- "1/15/2019" or "01/15/2019" (MM/DD/YYYY)
- "2019-01-15" (YYYY-MM-DD)
- Any other date format

Return each date in YYYY-MM-DD format, or null if no date is found for that workout.

CRITICAL - MUSCLE GROUPS:
You MUST use one of these exact muscle group names (case-sensitive): ${muscleGroupList}

If the input mentions a muscle group that doesn't exactly match one of the above, find the closest match:
- "Hams", "Hamstring", "Hams/Deadlift" → "Hamstrings"
- "Abs", "Ab", "Abdominal" → "Abdominals" (or closest match from the list)
- "Tri", "Tris" → "Triceps"
- "Bi", "Bis" → "Biceps"
- "Quads", "Quad" → "Quadriceps" (or closest match)
- "Lats", "Lat" → "Latissimus" (or closest match)
- etc.

If there is NO good match in the provided list, set muscle_group to null. Do not invent muscle groups that aren't in the list.

For each exercise found in the text, extract:
- muscle_group: One of the exact muscle group names from the list above, or null if no match
- exercise_name: The specific exercise name
- reps_count: Number of reps (default 12 if not specified)
- reps_unit: "reps", "seconds", or "minutes" (default "reps")
- weight_count: Weight amount (0 if not specified or bodyweight)
- weight_unit: "lbs" or "kg" (default "lbs")
- left_weight: Different left weight if specified, null otherwise
- set_count: Number of sets (default 1 if not specified)
- type: "weight", "band", or "stretch" (ONLY use "stretch" if the word "stretch" explicitly appears in the exercise name/description; otherwise default to "weight")
- band_color: For band exercises, the color (null otherwise)
- band_type: For band exercises, the type like "1-handle", "2-handle", "flat", "figure-8", "double-leg-cuff", "single-leg-cuff" (null otherwise)
- note: Any additional instructions or notes about the exercise
- original_line: THE EXACT ORIGINAL LINE from the input data that this exercise came from. Copy it verbatim, including all text, commas, and formatting. This is critical for verification.

Rules:
1. CRITICAL: Skip rows that only have a muscle group but no exercise name (e.g., "Shrugs,," or "Cat/Cow,," or "Stretch,,"). If the second column is empty, DO NOT create an exercise.
2. Skip empty rows entirely
3. The exercise_name MUST be a specific exercise, not just a muscle group name
4. Look for patterns like "15 reps", "3 sets", "10 lbs", etc.
5. Band exercises often mention colors like "Green", "Blue", "Red" - classify as "band"
6. ONLY classify as "stretch" if the word "stretch" is explicitly in the exercise name or description
7. Default to "weight" for most exercises (dumbbells, machines, bodyweight exercises, etc.)
8. Parse natural language descriptions carefully
9. ALWAYS include the original_line field with the exact text from the input
10. Only use muscle groups from the provided list - if no match, use null
11. When you encounter a new date, start a new workout. Group all exercises under the most recent date until a new date is found.

Return a JSON object with this structure:
{
  "workouts": [
    {
      "date": "YYYY-MM-DD" or null,
      "exercises": [array of exercise objects with original_line field]
    },
    ...more workouts if multiple dates found
  ]
}

If there's only one date or no dates, still return the workouts array with a single workout object.

Only return the JSON object, no other text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse this workout data and return a JSON object with workouts array. Each workout has a date and exercises. Group exercises by their date:\n\n${rawText}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response from AI");
    }

    console.log("AI response:", content);

    // Parse the JSON response - handle markdown code blocks
    let jsonContent = content.trim();
    if (jsonContent.startsWith("```json")) {
      jsonContent = jsonContent.slice(7);
    } else if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent.slice(3);
    }
    if (jsonContent.endsWith("```")) {
      jsonContent = jsonContent.slice(0, -3);
    }
    jsonContent = jsonContent.trim();

    let parsed: { workouts?: ParsedWorkout[]; date?: string | null; exercises?: any[] };
    try {
      parsed = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      throw new Error("Failed to parse workout data. The AI response was not valid JSON.");
    }

    // Handle both old format (single workout) and new format (multiple workouts)
    let workouts: ParsedWorkout[];
    if (parsed.workouts && Array.isArray(parsed.workouts)) {
      workouts = parsed.workouts;
    } else if (parsed.exercises) {
      // Old format - single workout
      workouts = [{
        date: parsed.date || null,
        exercises: parsed.exercises
      }];
    } else {
      workouts = [];
    }

    // Normalize all workouts
    const normalizedWorkouts = workouts.map((workout: any) => {
      const normalizedExercises = (workout.exercises || []).map((ex: any) => ({
        muscle_group: String(ex.muscle_group || "Other").trim(),
        exercise_name: String(ex.exercise_name || "").trim(),
        reps_count: Number(ex.reps_count) || 12,
        reps_unit: String(ex.reps_unit || "reps"),
        weight_count: Number(ex.weight_count) || 0,
        weight_unit: String(ex.weight_unit || "lbs"),
        left_weight: ex.left_weight !== null ? Number(ex.left_weight) : null,
        set_count: Number(ex.set_count) || 1,
        type: ["weight", "band", "stretch"].includes(ex.type) ? ex.type : "weight",
        band_color: ex.band_color ? String(ex.band_color) : null,
        band_type: ex.band_type ? String(ex.band_type) : null,
        note: String(ex.note || ""),
        raw_import_data: String(ex.original_line || ex.raw_import_data || "").trim(),
      })).filter((ex: ParsedExercise) => ex.exercise_name.length > 0);

      return {
        date: workout.date || null,
        exercises: normalizedExercises
      };
    }).filter((workout: ParsedWorkout) => workout.exercises.length > 0);

    // Limit to 10 workouts max
    const limitedWorkouts = normalizedWorkouts.slice(0, 10);

    console.log(`Parsed ${limitedWorkouts.length} workouts`);
    limitedWorkouts.forEach((w: ParsedWorkout, i: number) => {
      console.log(`  Workout ${i + 1}: date=${w.date}, ${w.exercises.length} exercises`);
    });

    return new Response(JSON.stringify({ 
      workouts: limitedWorkouts 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error parsing workout import:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
