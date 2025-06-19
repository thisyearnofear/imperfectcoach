import { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';

export const SimpleAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { address, isConnected } = useAccount();
  const { signMessage, isPending } = useSignMessage();

  const handleSimpleAuth = () => {
    if (!address) return;

    const message = `Sign in to Imperfect Coach\nAddress: ${address}\nTimestamp: ${Date.now()}`;
    
    signMessage(
      { message },
      {
        onSuccess: (signature) => {
          console.log('✅ Simple auth signature:', signature);
          localStorage.setItem('simple-auth', JSON.stringify({
            address,
            signature,
            timestamp: Date.now(),
          }));
          setIsAuthenticated(true);
          toast.success('Simple authentication successful!');
        },
        onError: (error) => {
          console.error('❌ Simple auth failed:', error);
          toast.error('Authentication failed');
        },
      }
    );
  };

  const handleSignOut = () => {
    localStorage.removeItem('simple-auth');
    setIsAuthenticated(false);
    toast.success('Signed out');
  };

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Connect wallet first</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">🔧 Simple Auth (Fallback)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs">
          <div>Address: {address?.slice(0, 10)}...</div>
          <div>Status: {isAuthenticated ? '✅ Authenticated' : '❌ Not authenticated'}</div>
        </div>
        
        {!isAuthenticated ? (
          <Button 
            onClick={handleSimpleAuth}
            disabled={isPending}
            size="sm"
            className="w-full"
          >
            {isPending ? 'Signing...' : 'Simple Sign In'}
          </Button>
        ) : (
          <Button 
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Sign Out
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
