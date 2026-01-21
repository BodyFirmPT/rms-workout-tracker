import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionState {
  isLoading: boolean;
  isPaid: boolean;
  subscriptionEnd: string | null;
  productId: string | null;
}

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    isLoading: true,
    isPaid: false,
    subscriptionEnd: null,
    productId: null,
  });

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState({
          isLoading: false,
          isPaid: false,
          subscriptionEnd: null,
          productId: null,
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) {
        console.error("Error checking subscription:", error);
        // Fall back to database value
        const { data: userData } = await supabase
          .from("users")
          .select("is_paid")
          .eq("id", session.user.id)
          .maybeSingle();
        
        setState({
          isLoading: false,
          isPaid: userData?.is_paid || false,
          subscriptionEnd: null,
          productId: null,
        });
        return;
      }

      setState({
        isLoading: false,
        isPaid: data?.subscribed || false,
        subscriptionEnd: data?.subscription_end || null,
        productId: data?.product_id || null,
      });
    } catch (error) {
      console.error("Error in checkSubscription:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    checkSubscription();

    // Check subscription every minute
    const interval = setInterval(checkSubscription, 60000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [checkSubscription]);

  return {
    ...state,
    refresh: checkSubscription,
  };
}
