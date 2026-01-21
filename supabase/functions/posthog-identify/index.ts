import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const POSTHOG_API_KEY = "phc_MZrIIVP5HqDqSDjQp6himOvrGpyvwBU6YmbASOKmIXx";
const POSTHOG_HOST = "https://us.i.posthog.com";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") ?? "" },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.log("No authenticated user found");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { isSignup } = await req.json().catch(() => ({ isSignup: false }));

    // Get user data from users table
    const { data: userData, error: userError } = await supabaseClient
      .from("users")
      .select("id, email, full_name, trainer_id, client_id, created_at")
      .eq("id", user.id)
      .maybeSingle();

    if (userError || !userData) {
      console.error("Failed to fetch user data:", userError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Count clients (excluding the user's own auto-created client)
    const { count: clientCount, error: countError } = await supabaseClient
      .from("client")
      .select("id", { count: "exact", head: true })
      .eq("trainer_id", userData.trainer_id)
      .neq("id", userData.client_id || "");

    if (countError) {
      console.error("Failed to count clients:", countError);
    }

    // Build properties for PostHog
    const properties: Record<string, any> = {
      email: userData.email,
      name: userData.full_name,
      client_count: clientCount || 0,
    };

    // Add join date for signups
    if (isSignup) {
      properties.$set_once = {
        joined_at: userData.created_at || new Date().toISOString(),
      };
    }

    // Send identify call to PostHog
    const posthogPayload = {
      api_key: POSTHOG_API_KEY,
      distinct_id: userData.id,
      properties: {
        $set: {
          email: userData.email,
          name: userData.full_name,
          client_count: clientCount || 0,
        },
        ...(isSignup ? {
          $set_once: {
            joined_at: userData.created_at || new Date().toISOString(),
          },
        } : {}),
      },
    };

    console.log("Sending PostHog identify for user:", userData.id);

    const posthogResponse = await fetch(`${POSTHOG_HOST}/capture/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: POSTHOG_API_KEY,
        event: "$identify",
        distinct_id: userData.id,
        properties: posthogPayload.properties,
      }),
    });

    if (!posthogResponse.ok) {
      const errorText = await posthogResponse.text();
      console.error("PostHog API error:", errorText);
      return new Response(
        JSON.stringify({ error: "PostHog API error", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Successfully identified user in PostHog:", userData.id);

    return new Response(
      JSON.stringify({ success: true, userId: userData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in posthog-identify:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
