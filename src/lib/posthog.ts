import posthog from "posthog-js";
import { supabase } from "@/integrations/supabase/client";

interface IdentifyUserOptions {
  isSignup?: boolean;
}

/**
 * Identifies a user in PostHog with their properties.
 * Uses the user's UUID from the database as the identifier.
 */
export async function identifyUser(options: IdentifyUserOptions = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user data from our users table
    const { data: userData } = await supabase
      .from("users")
      .select("id, email, full_name, trainer_id, created_at")
      .eq("id", user.id)
      .maybeSingle();

    if (!userData) return;

    // Count clients (excluding the user's own auto-created client)
    const { count: clientCount } = await supabase
      .from("client")
      .select("id", { count: "exact", head: true })
      .eq("trainer_id", userData.trainer_id)
      .neq("id", user.id); // Exclude self-client (where client.id matches user.id won't work - need to check via users table)

    // Get the user's own client_id to exclude it
    const { data: selfClient } = await supabase
      .from("users")
      .select("client_id")
      .eq("id", user.id)
      .maybeSingle();

    // Recount excluding the user's own client
    const { count: actualClientCount } = await supabase
      .from("client")
      .select("id", { count: "exact", head: true })
      .eq("trainer_id", userData.trainer_id)
      .neq("id", selfClient?.client_id || "");

    const properties: Record<string, any> = {
      email: userData.email,
      name: userData.full_name,
      client_count: actualClientCount || 0,
    };

    if (options.isSignup) {
      properties.joined_at = userData.created_at || new Date().toISOString();
    }

    // Identify user in PostHog using their database UUID
    posthog.identify(userData.id, properties);

    // Also call the server-side edge function for redundancy
    await supabase.functions.invoke("posthog-identify", {
      body: { isSignup: options.isSignup },
    });
  } catch (error) {
    console.error("Failed to identify user in PostHog:", error);
  }
}

/**
 * Resets PostHog identification (call on logout)
 */
export function resetPostHogUser() {
  posthog.reset();
}
