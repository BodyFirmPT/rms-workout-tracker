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
    const { rawText } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Parsing workout import text:", rawText.substring(0, 200) + "...");

    const systemPrompt = `You are a workout data parser. Parse the provided workout text into structured exercise data.

IMPORTANT: First, look for a date in the data. Common formats include:
- "Date,1/15/2019" or "Date: 1/15/2019"
- "1/15/2019" or "01/15/2019" (MM/DD/YYYY)
- "2019-01-15" (YYYY-MM-DD)
- Any other date format

Return the date in YYYY-MM-DD format, or null if no date is found.

For each exercise found in the text, extract:
- muscle_group: The muscle group being worked (e.g., "Chest", "Back", "Legs", "Abdominal", "Tricep", "Bicep")
- exercise_name: The specific exercise name
- reps_count: Number of reps (default 12 if not specified)
- reps_unit: "reps", "seconds", or "minutes" (default "reps")
- weight_count: Weight amount (0 if not specified or bodyweight)
- weight_unit: "lbs" or "kg" (default "lbs")
- left_weight: Different left weight if specified, null otherwise
- set_count: Number of sets (default 1 if not specified)
- type: "weight", "band", or "stretch"
- band_color: For band exercises, the color (null otherwise)
- band_type: For band exercises, the type like "1-handle", "2-handle", "flat" (null otherwise)
- note: Any additional instructions or notes about the exercise
- original_line: THE EXACT ORIGINAL LINE from the input data that this exercise came from. Copy it verbatim, including all text, commas, and formatting. This is critical for verification.

Rules:
1. Skip empty rows or rows without an exercise name
2. If a row has a muscle group but no exercise, skip it
3. Look for patterns like "15 reps", "3 sets", "10 lbs", etc.
4. Band exercises often mention colors like "Green", "Blue", "Red"
5. Stretches typically have duration in seconds
6. Parse natural language descriptions carefully
7. ALWAYS include the original_line field with the exact text from the input

Return a JSON object with this structure:
{
  "date": "YYYY-MM-DD" or null,
  "exercises": [array of exercise objects with original_line field]
}

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
          { role: "user", content: `Parse this workout data and return a JSON object with date and exercises:\n\n${rawText}` }
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

    let parsed: ParsedWorkout;
    try {
      parsed = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      throw new Error("Failed to parse workout data. The AI response was not valid JSON.");
    }

    // Validate and normalize exercises
    const normalizedExercises = (parsed.exercises || []).map((ex: any) => ({
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

    console.log(`Parsed date: ${parsed.date}, ${normalizedExercises.length} exercises`);

    return new Response(JSON.stringify({ 
      date: parsed.date || null,
      exercises: normalizedExercises 
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
