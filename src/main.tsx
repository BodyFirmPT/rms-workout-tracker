import { createRoot } from "react-dom/client";
import posthog from "posthog-js";
import App from "./App.tsx";
import "./index.css";

// Initialize PostHog
posthog.init("phc_MZrIIVP5HqDqSDjQp6himOvrGpyvwBU6YmbASOKmIXx", {
  api_host: "https://us.i.posthog.com",
  person_profiles: "identified_only",
  capture_pageview: true,
  capture_pageleave: true,
});

createRoot(document.getElementById("root")!).render(<App />);
