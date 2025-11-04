import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Web3Providers } from "@/providers";
import ErrorBoundary from "@/components/ErrorBoundary";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { ProgressiveOnboarding } from "@/components/ProgressiveOnboarding";
import WorkoutShareApp from "./miniapps/workout-share/WorkoutShareApp";
import { SocialProvider } from "./contexts/SocialContext";

const App = () => (
  <ErrorBoundary
    maxRetries={3}
    resetTimeWindow={30000}
    onError={(error, errorInfo) => {
      console.error("Application Error:", error, errorInfo);
      // In production, send to error reporting service
    }}
  >
    <Web3Providers>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {/* First-time user onboarding */}
          <OnboardingFlow onComplete={() => console.log("Onboarding complete")} />
          {/* Progressive onboarding for returning users */}
          <ProgressiveOnboarding 
            onComplete={() => console.log("Progressive onboarding complete")}
            onTierSelect={(tier) => {
              console.log("User selected tier:", tier);
              // Handle tier selection
              if (tier === "agent") {
                window.dispatchEvent(new CustomEvent("showAgentUpsell"));
              }
            }}
          />
          <SocialProvider>
            <ErrorBoundary
              maxRetries={2}
              onError={(error) => console.error("Router Error:", error)}
            >
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/miniapp/workout-share" element={<WorkoutShareApp />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </ErrorBoundary>
          </SocialProvider>
        </TooltipProvider>
      </ThemeProvider>
    </Web3Providers>
  </ErrorBoundary>
);

export default App;
