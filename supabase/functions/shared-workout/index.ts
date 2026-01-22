import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SHARED-WORKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const token = url.searchParams.get('token');
    
    logStep("Request received", { action, token: token?.substring(0, 8) + "..." });

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Share token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET workout data by share token
    if (req.method === 'GET' && action === 'get-workout') {
      logStep("Fetching workout by share token");
      
      // Get workout
      const { data: workout, error: workoutError } = await supabase
        .from('workout')
        .select(`
          id,
          date,
          note,
          status,
          client_id,
          location_id,
          canceled_at,
          share_token,
          client:client_id (
            id,
            name
          )
        `)
        .eq('share_token', token)
        .single();

      if (workoutError || !workout) {
        logStep("Workout not found", { error: workoutError?.message });
        return new Response(
          JSON.stringify({ error: 'Workout not found or link has expired' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get exercises
      const { data: exercises, error: exercisesError } = await supabase
        .from('workout_exercise')
        .select('*')
        .eq('workout_id', workout.id)
        .order('created_at');

      if (exercisesError) {
        logStep("Error fetching exercises", { error: exercisesError.message });
        throw exercisesError;
      }

      // Get muscle groups for reference
      const { data: muscleGroups, error: mgError } = await supabase
        .from('muscle_group')
        .select('*')
        .order('default_group', { ascending: false })
        .order('name');

      if (mgError) {
        logStep("Error fetching muscle groups", { error: mgError.message });
        throw mgError;
      }

      // Get location if exists
      let location = null;
      if (workout.location_id) {
        const { data: locationData } = await supabase
          .from('location')
          .select('id, name')
          .eq('id', workout.location_id)
          .single();
        location = locationData;
      }

      logStep("Returning workout data", { 
        workoutId: workout.id, 
        exerciseCount: exercises?.length || 0 
      });

      return new Response(
        JSON.stringify({ 
          workout: {
            ...workout,
            client: Array.isArray(workout.client) ? workout.client[0] : workout.client
          }, 
          exercises: exercises || [], 
          muscleGroups: muscleGroups || [],
          location 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST - Start workout
    if (req.method === 'POST' && action === 'start-workout') {
      logStep("Starting workout via share token");
      
      // Get the workout first
      const { data: workout, error: fetchError } = await supabase
        .from('workout')
        .select('id, status')
        .eq('share_token', token)
        .single();

      if (fetchError || !workout) {
        return new Response(
          JSON.stringify({ error: 'Workout not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update workout status to started
      const { error: updateError } = await supabase
        .from('workout')
        .update({ status: 'started' })
        .eq('id', workout.id);

      if (updateError) {
        logStep("Error starting workout", { error: updateError.message });
        throw updateError;
      }

      logStep("Workout started successfully", { workoutId: workout.id });

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST - Complete exercise set
    if (req.method === 'POST' && action === 'complete-set') {
      const body = await req.json();
      const { exerciseId, decrement = false } = body;

      logStep("Completing exercise set", { exerciseId, decrement });

      if (!exerciseId) {
        return new Response(
          JSON.stringify({ error: 'Exercise ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify the exercise belongs to a workout with this share token
      const { data: workout, error: workoutError } = await supabase
        .from('workout')
        .select('id')
        .eq('share_token', token)
        .single();

      if (workoutError || !workout) {
        return new Response(
          JSON.stringify({ error: 'Invalid share token' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get current exercise state
      const { data: exercise, error: fetchError } = await supabase
        .from('workout_exercise')
        .select('*')
        .eq('id', exerciseId)
        .eq('workout_id', workout.id)
        .single();

      if (fetchError || !exercise) {
        return new Response(
          JSON.stringify({ error: 'Exercise not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate new completed sets
      let newCompletedSets: number;
      if (decrement) {
        newCompletedSets = Math.max(0, exercise.completed_sets - 1);
      } else {
        if (exercise.completed_sets >= exercise.set_count) {
          newCompletedSets = 0;
        } else {
          newCompletedSets = exercise.completed_sets + 1;
        }
      }
      const newIsCompleted = newCompletedSets >= exercise.set_count;

      // Update the exercise
      const { data: updatedExercise, error: updateError } = await supabase
        .from('workout_exercise')
        .update({ 
          completed_sets: newCompletedSets,
          is_completed: newIsCompleted
        })
        .eq('id', exerciseId)
        .select()
        .single();

      if (updateError) {
        logStep("Error updating exercise", { error: updateError.message });
        throw updateError;
      }

      logStep("Exercise set completed", { 
        exerciseId, 
        newCompletedSets, 
        isCompleted: newIsCompleted 
      });

      return new Response(
        JSON.stringify({ exercise: updatedExercise }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST - Complete workout
    if (req.method === 'POST' && action === 'complete-workout') {
      logStep("Completing workout via share token");
      
      // Get the workout first
      const { data: workout, error: fetchError } = await supabase
        .from('workout')
        .select('id, status')
        .eq('share_token', token)
        .single();

      if (fetchError || !workout) {
        return new Response(
          JSON.stringify({ error: 'Workout not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update workout status to completed
      const { error: updateError } = await supabase
        .from('workout')
        .update({ status: 'completed' })
        .eq('id', workout.id);

      if (updateError) {
        logStep("Error completing workout", { error: updateError.message });
        throw updateError;
      }

      logStep("Workout completed successfully", { workoutId: workout.id });

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logStep("Error", { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
