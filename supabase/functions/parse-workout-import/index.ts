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
  review_reason?: string;
}

interface ParsedWorkout {
  date: string | null;
  note: string | null;
  exercises: ParsedExercise[];
  needs_review?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Safely parse request body
    let body;
    try {
      const text = await req.text();
      if (!text || text.trim() === '') {
        return new Response(JSON.stringify({ error: "Request body is empty" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      body = JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new Response(JSON.stringify({ error: "Invalid request body - expected JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { rawText, muscleGroups } = body;
    
    if (!rawText || typeof rawText !== 'string' || rawText.trim() === '') {
      return new Response(JSON.stringify({ error: "rawText is required and must be a non-empty string" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
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
- reps_count: Number of reps (default 12 if not specified for weight/band exercises, default 30 for stretches)
- reps_unit: "reps", "seconds", or "minutes" (default "reps" for weight/band, default "seconds" for stretches)
- weight_count: Weight amount (0 if not specified or bodyweight)
- weight_unit: "lbs" or "kg" (default "lbs")
- left_weight: Different left weight if specified, null otherwise
- set_count: Number of sets (default 1 if not specified)
- type: "weight", "band", or "stretch" (ONLY use "stretch" if the word "stretch" explicitly appears in the exercise name/description; otherwise default to "weight")
- band_color: For band exercises, the color (null otherwise)
- band_type: For band exercises, the type like "1-handle", "2-handle", "flat", "figure-8", "double-leg-cuff", "single-leg-cuff", "ankle-weight" (null otherwise)
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

CRITICAL - SPLITTING COMPOUND STRETCHES:
12. When you see a stretch exercise with multiple stretches separated by "/" (e.g., "Pigeon Stretch/Hip Flexor Stretch/Hamstring Strap/Piriformis Stretch"), you MUST split these into SEPARATE exercise entries.
    - Each stretch becomes its own exercise row
    - For each individual stretch, determine the appropriate muscle_group from the list based on what that specific stretch targets
    - All split stretches share the same original_line from the source row
    - Each stretch defaults to 30 seconds if no duration/reps specified
    - Example: "Pigeon Stretch/Hip Flexor Stretch" becomes TWO exercises: "Pigeon Stretch" (targeting Glutes or Hips) and "Hip Flexor Stretch" (targeting Hips/Hip Lift or similar)

Also look for any workout description or note. This could be:
- Text after the date line but before the first exercise
- A line starting with "Note:", "Notes:", "Description:", or similar
- Any header text describing the workout session

Return a JSON object with this structure:
{
  "workouts": [
    {
      "date": "YYYY-MM-DD" or null,
      "note": "any description/note found for this workout" or null,
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
        max_tokens: 16384,
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
    const finishReason = data.choices?.[0]?.finish_reason;
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response finish_reason:", finishReason);
    const wasTruncated = finishReason === "length";
    
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

    // Sanitize control characters that break JSON parsing
    // Replace all control characters (except \n and \r which we handle separately) with escaped versions or remove them
    jsonContent = jsonContent.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, (char) => {
      const code = char.charCodeAt(0);
      if (code === 0x09) return '\\t';  // tab -> escaped tab
      if (code === 0x08) return '\\b';  // backspace
      if (code === 0x0C) return '\\f';  // form feed
      return ''; // Remove other control characters
    });

    // Handle truncated JSON - if the response got cut off, try to repair it
    // Check if JSON appears truncated (unbalanced braces/brackets or unterminated string)
    let parsed: { workouts?: ParsedWorkout[]; date?: string | null; exercises?: any[] };
    try {
      parsed = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("Problematic JSON content:", jsonContent.substring(0, 1000));
      
      // If we know response was truncated, give a specific error message
      if (wasTruncated) {
        console.warn("Response was truncated due to token limit");
        throw new Error("The response was too long and got cut off. Please try importing fewer workouts at a time (5 or fewer recommended).");
      }
      
      // Try to repair truncated JSON by finding the last complete workout
      const truncatedRepair = tryRepairTruncatedJson(jsonContent);
      if (truncatedRepair) {
        console.log("Successfully repaired truncated JSON");
        parsed = truncatedRepair;
      } else {
        throw new Error("Failed to parse workout data. The response may have been too long. Please try importing fewer workouts at a time.");
      }
    }

    // Helper function to repair truncated JSON
    function tryRepairTruncatedJson(json: string): { workouts: ParsedWorkout[] } | null {
      try {
        // Find the last complete exercise object by looking for the pattern "}," or "}" before truncation
        // We'll try to find complete workout objects
        
        // Look for the workouts array start
        const workoutsMatch = json.match(/"workouts"\s*:\s*\[/);
        if (!workoutsMatch) return null;
        
        const workoutsStart = json.indexOf(workoutsMatch[0]) + workoutsMatch[0].length;
        
        // Try to find complete workout objects by looking for the pattern that ends a workout
        // A workout ends with "exercises": [...]}
        const workoutEndPattern = /\]\s*\}\s*(?=,|\]|$)/g;
        let lastCompleteEnd = -1;
        let match;
        
        // Find all complete exercise array closings
        while ((match = workoutEndPattern.exec(json)) !== null) {
          // Verify this is actually closing a workout by checking bracket balance up to this point
          const upToHere = json.substring(0, match.index + match[0].length);
          const openBrackets = (upToHere.match(/\[/g) || []).length;
          const closeBrackets = (upToHere.match(/\]/g) || []).length;
          const openBraces = (upToHere.match(/\{/g) || []).length;
          const closeBraces = (upToHere.match(/\}/g) || []).length;
          
          // If brackets are balanced or close to balanced, this might be a good cutoff point
          if (closeBrackets <= openBrackets && closeBraces <= openBraces) {
            lastCompleteEnd = match.index + match[0].length;
          }
        }
        
        if (lastCompleteEnd === -1) return null;
        
        // Reconstruct valid JSON
        let repairedJson = json.substring(0, lastCompleteEnd);
        
        // Close any remaining open structures
        const openBrackets = (repairedJson.match(/\[/g) || []).length;
        const closeBrackets = (repairedJson.match(/\]/g) || []).length;
        const openBraces = (repairedJson.match(/\{/g) || []).length;
        const closeBraces = (repairedJson.match(/\}/g) || []).length;
        
        // Add missing closing brackets/braces
        repairedJson += ']'.repeat(openBrackets - closeBrackets);
        repairedJson += '}'.repeat(openBraces - closeBraces);
        
        return JSON.parse(repairedJson);
      } catch (e) {
        console.error("JSON repair failed:", e);
        return null;
      }
    }

    // Handle both old format (single workout) and new format (multiple workouts)
    let workouts: ParsedWorkout[];
    if (parsed.workouts && Array.isArray(parsed.workouts)) {
      workouts = parsed.workouts;
    } else if (parsed.exercises) {
      // Old format - single workout
      workouts = [{
        date: parsed.date || null,
        note: (parsed as any).note || null,
        exercises: parsed.exercises
      }];
    } else {
      workouts = [];
    }

    // Valid band colors (must match database constraint)
    const validBandColors = ['Black', 'Blue', 'Purple', 'Red', 'Green', 'Yellow', 'Pink'];
    
    // Valid band types (must match database constraint)
    const validBandTypes = ['1-handle', '2-handle', 'flat', 'figure-8', 'double-leg-cuff', 'single-leg-cuff', 'ankle-weight'];

    // Normalize band color to match valid options (case-insensitive)
    const normalizeBandColor = (color: string | null): string | null => {
      if (!color) return null;
      const normalized = color.trim().toLowerCase();
      const match = validBandColors.find(c => c.toLowerCase() === normalized);
      return match || null;
    };

    // Normalize band type to match valid options (case-insensitive)
    const normalizeBandType = (type: string | null): string | null => {
      if (!type) return null;
      const normalized = type.trim().toLowerCase();
      const match = validBandTypes.find(t => t.toLowerCase() === normalized);
      return match || null;
    };

    // Normalize all workouts
    const normalizedWorkouts = workouts.map((workout: any) => {
      const normalizedExercises: ParsedExercise[] = [];
      
      for (const ex of (workout.exercises || [])) {
        const exerciseType = ["weight", "band", "stretch"].includes(ex.type) ? ex.type : "weight";
        const exerciseName = String(ex.exercise_name || "").trim();
        
        if (exerciseName.length === 0) continue;
        
        let repsCount = Number(ex.reps_count) || 0;
        let repsUnit = String(ex.reps_unit || "reps");
        let reviewReason: string | undefined = undefined;
        
        // For stretch exercises with no reps, default to 30 seconds
        if (exerciseType === 'stretch' && repsCount === 0) {
          repsCount = 30;
          repsUnit = 'seconds';
        }
        
        // For weight/band exercises with no reps, flag for review
        if ((exerciseType === 'weight' || exerciseType === 'band') && repsCount === 0) {
          repsCount = 12; // Default but flag for review
          reviewReason = 'No reps specified for exercise';
        }
        
        normalizedExercises.push({
          muscle_group: String(ex.muscle_group || "Other").trim(),
          exercise_name: exerciseName,
          reps_count: repsCount,
          reps_unit: repsUnit,
          weight_count: Number(ex.weight_count) || 0,
          weight_unit: String(ex.weight_unit || "lbs"),
          left_weight: ex.left_weight !== null ? Number(ex.left_weight) : null,
          set_count: Number(ex.set_count) || 1,
          type: exerciseType,
          band_color: normalizeBandColor(ex.band_color),
          band_type: normalizeBandType(ex.band_type),
          note: String(ex.note || ""),
          raw_import_data: String(ex.original_line || ex.raw_import_data || "").trim(),
          review_reason: reviewReason,
        });
      }

      const needsReview = normalizedExercises.some(ex => ex.review_reason);

      return {
        date: workout.date || null,
        note: workout.note ? String(workout.note).trim() : null,
        exercises: normalizedExercises,
        needs_review: needsReview,
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
