import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Prefer the stored Stripe customer id and check for override.
    const { data: dbUser, error: dbUserError } = await supabaseClient
      .from("users")
      .select("stripe_customer_id, subscription_override")
      .eq("id", user.id)
      .maybeSingle();

    if (dbUserError) {
      logStep("WARNING: Failed to read user record", { message: dbUserError.message });
    }

    // Check for subscription override first
    if (dbUser?.subscription_override === true) {
      logStep("Subscription override active: forced Pro", { userId: user.id });
      await supabaseClient
        .from("users")
        .update({ is_paid: true })
        .eq("id", user.id);
      return new Response(JSON.stringify({ subscribed: true, override: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (dbUser?.subscription_override === false) {
      logStep("Subscription override active: forced Free", { userId: user.id });
      await supabaseClient
        .from("users")
        .update({ is_paid: false })
        .eq("id", user.id);
      return new Response(JSON.stringify({ subscribed: false, override: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    let customerId: string | null = dbUser?.stripe_customer_id ?? null;
    if (customerId) {
      logStep("Using stored Stripe customer id", { customerId });
    }

    // Fall back to searching by email.
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found Stripe customer by email", { customerId });
      }
    }

    // Last-resort recovery:
    // If a customer was created without an email, `customers.list({ email })` will not find it.
    // We can still recover by looking for recent Checkout Sessions that captured the email.
    if (!customerId) {
      logStep("No customer found by email; scanning recent Checkout Sessions to recover customer id");
      const sessions = await stripe.checkout.sessions.list({ limit: 25 });
      const matching = sessions.data.find((s: any) => {
        const sessionEmail = s?.customer_details?.email ?? s?.customer_email ?? null;
        return sessionEmail && sessionEmail.toLowerCase() === user.email!.toLowerCase();
      });

      const recoveredCustomerId = (matching?.customer as string | null) ?? null;
      if (recoveredCustomerId) {
        customerId = recoveredCustomerId;
        logStep("Recovered customer id from Checkout Session", {
          customerId,
          sessionId: matching?.id,
        });

        // Ensure the customer has an email going forward.
        try {
          await stripe.customers.update(customerId, { email: user.email });
          logStep("Updated Stripe customer email", { customerId });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          logStep("WARNING: Failed to update Stripe customer email", { customerId, message: msg });
        }
      }
    }

    if (!customerId) {
      logStep("No customer found, user is not subscribed");

      // Update user's is_paid status to false
      await supabaseClient
        .from("users")
        .update({ is_paid: false, stripe_customer_id: null })
        .eq("id", user.id);

      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionEnd = null;
    let productId = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0].price.product;
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd, productId });
    } else {
      logStep("No active subscription found");
    }

    // Update user's is_paid status in database
    await supabaseClient
      .from("users")
      .update({
        is_paid: hasActiveSub,
        stripe_customer_id: customerId,
      })
      .eq("id", user.id);
    
    logStep("Updated user subscription status", { is_paid: hasActiveSub });

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
