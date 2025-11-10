// Payment Status Component - CONSOLIDATED status tracking
// Replaces scattered payment status logic across components

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  RefreshCw 
} from 'lucide-react';
import type { PaymentResponse, PaymentChain } from '../../lib/payments/payment-types';

interface PaymentStatusProps {
  response: PaymentResponse | null;
  isLoading: boolean;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

export function PaymentStatus({ 
  response, 
  isLoading, 
  error, 
  onRetry, 
  className 
}: PaymentStatusProps) {
  
  const getExplorerUrl = (txHash: string, chain: PaymentChain): string => {
    if (chain === 'solana') {
      return `https://explorer.solana.com/tx/${txHash}?cluster=devnet`;
    } else {
      return `https://sepolia.basescan.org/tx/${txHash}`;
    }
  };

  const getChainName = (chain: PaymentChain): string => {
    return chain === 'solana' ? 'Solana Devnet' : 'Base Sepolia';
  };

  const getChainColor = (chain: PaymentChain): string => {
    return chain === 'solana' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <div>
              <div className="font-medium">Processing Payment...</div>
              <div className="text-sm text-gray-600">
                Please wait while we verify your payment
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error && !response) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-red-700">Payment Failed</div>
              <div className="text-sm text-gray-600 mt-1">{error}</div>
              {onRetry && (
                <Button 
                  onClick={onRetry} 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (response?.success) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Success header */}
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium text-green-700">Payment Successful</div>
                <div className="text-sm text-gray-600">
                  Your payment has been verified and processed
                </div>
              </div>
            </div>

            {/* Payment details */}
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Network:</span>
                <Badge className={getChainColor(response.chain)}>
                  {getChainName(response.chain)}
                </Badge>
              </div>

              {response.transactionHash && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Transaction:</span>
                  <div className="flex items-center gap-1">
                    <code className="text-xs bg-white px-2 py-1 rounded">
                      {response.transactionHash.slice(0, 8)}...{response.transactionHash.slice(-6)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => window.open(getExplorerUrl(response.transactionHash!, response.chain), '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {response.fallbackUsed && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  ⚠️ Fallback used: Payment processed via Base network
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Failed payment with response
  if (response && !response.success) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-red-700">Payment Failed</div>
              <div className="text-sm text-gray-600 mt-1">
                {response.error || 'An unknown error occurred'}
              </div>
              
              {response.chain && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    Attempted on {getChainName(response.chain)}
                  </Badge>
                </div>
              )}
              
              {onRetry && (
                <Button 
                  onClick={onRetry} 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default empty state
  return null;
}