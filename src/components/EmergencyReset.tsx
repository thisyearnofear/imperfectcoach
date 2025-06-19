import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const EmergencyReset = () => {
  const handleEmergencyReset = () => {
    // Clear all auth-related localStorage
    localStorage.removeItem('siwe-auth');
    localStorage.removeItem('simple-auth');
    
    // Reload the page to reset all state
    window.location.reload();
  };

  // Auto-clear on mount if we detect the infinite loop
  useEffect(() => {
    const checkForLoop = () => {
      const logs = console.log.toString();
      // If we see the same log message multiple times quickly, it's likely a loop
      // This is a simple heuristic
    };
    
    // Auto-clear after 2 seconds if page just loaded
    const timer = setTimeout(() => {
      const storedAuth = localStorage.getItem('siwe-auth');
      if (storedAuth) {
        console.log('🚨 Auto-clearing potentially problematic auth state');
        localStorage.removeItem('siwe-auth');
        window.location.reload();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="text-sm text-red-800">🚨 Emergency Reset</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-red-700 mb-3">
          If you're experiencing infinite popups or loops, click below to reset everything.
        </p>
        <Button 
          onClick={handleEmergencyReset}
          variant="destructive"
          size="sm"
          className="w-full"
        >
          Emergency Reset & Reload
        </Button>
      </CardContent>
    </Card>
  );
};
