import { useState } from "react";
import { Crown, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            <DialogTitle>Upgrade to Pro</DialogTitle>
          </div>
          <DialogDescription>
            Unlock unlimited clients and take your training business to the next level.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="rounded-lg border-2 border-primary bg-primary/5 p-6">
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-bold">$10</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                <span>Unlimited clients</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                <span>Unlimited workouts</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                <span>All workout features</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                <span>Priority support</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleUpgrade} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade Now
                </>
              )}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
