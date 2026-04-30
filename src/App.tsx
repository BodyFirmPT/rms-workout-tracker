import { useEffect } from "react";
import posthog from "posthog-js";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmulationProvider } from "@/contexts/EmulationContext";
import { EmulationBanner } from "@/components/EmulationBanner";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import ClientDetails from "./pages/ClientDetails";
import ClientInjuries from "./pages/ClientInjuries";
import ClientRestrictedExercises from "./pages/ClientRestrictedExercises";
import ClientLocations from "./pages/ClientLocations";
import EditClient from "./pages/EditClient";
import ImportWorkout from "./pages/ImportWorkout";
import ActiveWorkout from "./pages/ActiveWorkout";
import PrintWorkout from "./pages/PrintWorkout";
import SharedWorkout from "./pages/SharedWorkout";
import MuscleGroups from "./pages/MuscleGroups";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import AdminBandColors from "./pages/AdminBandColors";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Initialize PostHog after React is mounted
    posthog.init("phc_MZrIIVP5HqDqSDjQp6himOvrGpyvwBU6YmbASOKmIXx", {
      api_host: "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <EmulationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <EmulationBanner />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/client/:clientId" element={<ProtectedRoute><ClientDetails /></ProtectedRoute>} />
              <Route path="/client/:clientId/injuries" element={<ProtectedRoute><ClientInjuries /></ProtectedRoute>} />
              <Route path="/client/:clientId/restricted-exercises" element={<ProtectedRoute><ClientRestrictedExercises /></ProtectedRoute>} />
              <Route path="/client/:clientId/locations" element={<ProtectedRoute><ClientLocations /></ProtectedRoute>} />
              <Route path="/client/:clientId/edit" element={<ProtectedRoute><EditClient /></ProtectedRoute>} />
              <Route path="/client/:clientId/band-mapping" element={<ProtectedRoute><EditClient /></ProtectedRoute>} />
              <Route path="/client/:clientId/import" element={<ProtectedRoute><ImportWorkout /></ProtectedRoute>} />
              <Route path="/workout/:id?" element={<ProtectedRoute><ActiveWorkout /></ProtectedRoute>} />
              <Route path="/workout/:id/print" element={<ProtectedRoute><PrintWorkout /></ProtectedRoute>} />
              <Route path="/share/:token" element={<SharedWorkout />} />
              <Route path="/muscle-groups" element={<ProtectedRoute><MuscleGroups /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/admin/band-colors" element={<ProtectedRoute><AdminBandColors /></ProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </EmulationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
