import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";

export const AuthDebug = () => {
  const auth = useAuth();
  const { chainId } = useAccount();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const storedAuth = localStorage.getItem('siwe-auth');
  let authData = null;
  try {
    authData = storedAuth ? JSON.parse(storedAuth) : null;
  } catch (e) {
    // Invalid JSON
  }

  return (
    <Card className="mt-4 border-orange-200">
      <CardHeader>
        <CardTitle className="text-sm">🔧 Auth Debug (Dev Only)</CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div>Connected: {auth.isConnected ? '✅' : '❌'}</div>
        <div>Authenticated: {auth.isAuthenticated ? '✅' : '❌'}</div>
        <div>Loading: {auth.isLoading ? '⏳' : '✅'}</div>
        <div>Address: {auth.address || 'None'}</div>
        <div>Chain ID: {chainId || 'None'}</div>
        <div>Error: {auth.error || 'None'}</div>
        <div>LocalStorage: {storedAuth ? '✅' : '❌'}</div>
        {authData && (
          <div className="space-y-1 p-2 bg-muted/30 rounded">
            <div>Stored Address: {authData.address?.slice(0, 10)}...</div>
            <div>Verified: {authData.verified ? '✅' : '❌'}</div>
            <div>Expires: {new Date(authData.expiresAt).toLocaleString()}</div>
          </div>
        )}
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              localStorage.removeItem('siwe-auth');
              auth.resetAuth();
            }}
            size="sm"
            variant="outline"
          >
            Clear Auth
          </Button>
          <Button 
            onClick={() => {
              auth.signInWithEthereum();
            }}
            size="sm"
            variant="outline"
            disabled={!auth.isConnected || auth.isLoading}
          >
            Retry Sign
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
