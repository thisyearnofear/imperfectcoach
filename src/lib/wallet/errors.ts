/**
 * Wallet and blockchain error handling
 * Single source of truth for error messaging with context
 * Following core principle: CLEAN (Clear separation of concerns)
 */

export type ErrorContext = 
  | 'wallet-connection'
  | 'wallet-switch'
  | 'wallet-disconnect'
  | 'signature'
  | 'contract-interaction'
  | 'network-switch'
  | 'balance-check'
  | 'transaction-submission';

export interface ErrorDetail {
  message: string;
  userMessage: string;
  context: ErrorContext;
  action?: string;
}

/**
 * Map error messages to user-friendly context-aware messages
 */
const errorPatterns: Array<{
  pattern: RegExp;
  context: ErrorContext;
  getMessage: (error: Error) => string;
}> = [
  {
    pattern: /user rejected/i,
    context: 'signature',
    getMessage: () => 'You rejected the signature request. Please sign to proceed.',
  },
  {
    pattern: /user denied/i,
    context: 'wallet-connection',
    getMessage: () => 'You denied the wallet connection request. Please try again.',
  },
  {
    pattern: /network.*mismatch|wrong.*network|not.*supported/i,
    context: 'network-switch',
    getMessage: () => 'Your wallet is on an unsupported network. Please switch to Base Sepolia or Avalanche Fuji.',
  },
  {
    pattern: /insufficient.*balance|insufficient.*funds/i,
    context: 'balance-check',
    getMessage: () => 'Insufficient balance. Please ensure you have enough funds for this transaction.',
  },
  {
    pattern: /transaction.*failed|reverted/i,
    context: 'contract-interaction',
    getMessage: () => 'Transaction failed. Please check the contract and try again.',
  },
  {
    pattern: /gas.*required|exceeds.*limit/i,
    context: 'transaction-submission',
    getMessage: () => 'Transaction gas limit exceeded. Try increasing gas limit in your wallet.',
  },
  {
    pattern: /nonce.*too.*low|nonce.*already/i,
    context: 'transaction-submission',
    getMessage: () => 'Wallet state mismatch. Please reset your wallet account (Settings > Advanced > Reset Account).',
  },
  {
    pattern: /connection.*refused|network.*unreachable/i,
    context: 'wallet-connection',
    getMessage: () => 'Network connection failed. Please check your internet and try again.',
  },
];

/**
 * Parse error and provide context-aware messaging
 */
export const parseBlockchainError = (error: Error | unknown, context: ErrorContext): ErrorDetail => {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Find matching pattern
  for (const pattern of errorPatterns) {
    if (pattern.pattern.test(errorMessage)) {
      return {
        message: errorMessage,
        userMessage: pattern.getMessage(error as Error),
        context: pattern.context,
        action: getAction(pattern.context),
      };
    }
  }

  // Fallback: generic message based on context
  return {
    message: errorMessage,
    userMessage: getDefaultMessage(context),
    context,
    action: getAction(context),
  };
};

/**
 * Get default user-friendly message for context
 */
const getDefaultMessage = (context: ErrorContext): string => {
  switch (context) {
    case 'wallet-connection':
      return 'Failed to connect wallet. Please try again or use a different wallet.';
    case 'wallet-switch':
      return 'Failed to switch wallet. Please try again.';
    case 'wallet-disconnect':
      return 'Failed to disconnect wallet. Please try again.';
    case 'signature':
      return 'Failed to sign message. Check your wallet and try again.';
    case 'contract-interaction':
      return 'Contract interaction failed. Please verify your inputs and try again.';
    case 'network-switch':
      return 'Failed to switch network. Please switch manually in your wallet.';
    case 'balance-check':
      return 'Failed to check balance. Please try again.';
    case 'transaction-submission':
      return 'Transaction submission failed. Please check your wallet and try again.';
  }
};

/**
 * Get suggested action for context
 */
const getAction = (context: ErrorContext): string | undefined => {
  switch (context) {
    case 'network-switch':
      return 'Switch to Base Sepolia or Avalanche Fuji in your wallet settings';
    case 'balance-check':
      return 'Add funds to your wallet';
    case 'signature':
      return 'Sign the message in your wallet popup';
    case 'wallet-connection':
      return 'Check your wallet extension and try again';
    default:
      return undefined;
  }
};

/**
 * Format error for user display
 */
export const formatErrorForUser = (
  error: Error | unknown,
  context: ErrorContext
): { title: string; message: string; action?: string } => {
  const detail = parseBlockchainError(error, context);
  return {
    title: getTitleForContext(detail.context),
    message: detail.userMessage,
    action: detail.action,
  };
};

/**
 * Get title for error based on context
 */
const getTitleForContext = (context: ErrorContext): string => {
  switch (context) {
    case 'wallet-connection':
      return 'Wallet Connection Failed';
    case 'wallet-switch':
      return 'Wallet Switch Failed';
    case 'wallet-disconnect':
      return 'Wallet Disconnect Failed';
    case 'signature':
      return 'Signature Failed';
    case 'contract-interaction':
      return 'Contract Error';
    case 'network-switch':
      return 'Network Switch Failed';
    case 'balance-check':
      return 'Balance Check Failed';
    case 'transaction-submission':
      return 'Transaction Failed';
  }
};
