import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Wallet,
  LogOut,
  Clock,
  Trophy,
  Copy,
  Check,
  Shield,
  Zap,
  Info,
  ChevronRight,
} from "lucide-react";
import { useUser } from "@/hooks/useUserHooks";
import { cn } from "@/lib/utils";

type WalletVariant = "header" | "card" | "inline" | "minimal";
type WalletSize = "sm" | "md" | "lg";

interface UnifiedWalletProps {
  variant?: WalletVariant;
  size?: WalletSize;
  className?: string;
  showOnboarding?: boolean;
  onConnect?: () => void;
  onAuthenticated?: () => void;
}

const WalletOnboarding = ({ onDismiss }: { onDismiss?: () => void }) => (
  <Alert className="border-primary/20 bg-primary/5">
    <Info className="h-4 w-4 text-primary" />
    <AlertDescription className="text-sm">
      <div className="space-y-2">
        <p className="font-medium text-primary">
          Welcome to Blockchain Fitness!
        </p>
        <p className="text-muted-foreground">
          Connect your Coinbase Smart Wallet to compete on the global
          leaderboard and track your progress permanently on-chain.
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>Secure</span>
          <span>•</span>
          <Zap className="h-3 w-3" />
          <span>Fast</span>
          <span>•</span>
          <Trophy className="h-3 w-3" />
          <span>Competitive</span>
        </div>
      </div>
    </AlertDescription>
  </Alert>
);

const CopyableAddress = ({
  address,
  displayName,
  size = "md",
  showFullAddress = false,
}: {
  address: string;
  displayName: string;
  size?: WalletSize;
  showFullAddress?: boolean;
}) => {
  const { copyAddress } = useUser();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await copyAddress();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className={cn(
              "cursor-pointer hover:bg-secondary/80 transition-colors max-w-full",
              sizeClasses[size],
            )}
            onClick={handleCopy}
          >
            <span className="truncate">{displayName}</span>
            {copied ? (
              <Check className="h-3 w-3 ml-1 shrink-0" />
            ) : (
              <Copy className="h-3 w-3 ml-1 opacity-50 shrink-0" />
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Click to copy: {showFullAddress ? address : displayName}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const ConnectButton = ({
  size,
  variant,
  isLoading,
  onConnect,
}: {
  size: WalletSize;
  variant: WalletVariant;
  isLoading: boolean;
  onConnect: () => void;
}) => {
  const sizeProps = {
    sm: { size: "sm" as const, iconSize: "h-3 w-3" },
    md: { size: "default" as const, iconSize: "h-4 w-4" },
    lg: { size: "lg" as const, iconSize: "h-5 w-5" },
  };

  const { size: buttonSize, iconSize } = sizeProps[size];

  if (variant === "minimal") {
    return (
      <Button
        onClick={onConnect}
        disabled={isLoading}
        size={buttonSize}
        variant="ghost"
        className="h-auto p-1"
      >
        <Wallet className={iconSize} />
      </Button>
    );
  }

  return (
    <Button
      onClick={onConnect}
      disabled={isLoading}
      size={buttonSize}
      className={cn(
        variant === "header" && "shrink-0",
        variant === "card" && "w-full",
      )}
    >
      <Wallet className={cn(iconSize, "mr-2")} />
      {isLoading ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
};

const AuthenticatedState = ({
  variant,
  size,
}: {
  variant: WalletVariant;
  size: WalletSize;
}) => {
  const { address, displayName, signOut, timeUntilNextSubmission, canSubmit } =
    useUser();

  const formatTime = (seconds: number) => {
    const minutes = Math.ceil(seconds / 60);
    return minutes > 1 ? `${minutes}m` : `${seconds}s`;
  };

  if (variant === "header") {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          <Trophy className="h-3 w-3 mr-1 shrink-0" />
          <span className="truncate">{displayName}</span>
        </Badge>
        {!canSubmit && timeUntilNextSubmission > 0 && (
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {formatTime(timeUntilNextSubmission)}
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="h-8 px-2 shrink-0"
        >
          <LogOut className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="text-xs cursor-pointer">
              <Trophy className="h-3 w-3 mr-1" />
              <span className="truncate max-w-16">{displayName}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Authenticated as {displayName}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-center space-y-2">
        <Badge variant="default" className="bg-green-600">
          <Trophy className="h-3 w-3 mr-1" />
          <span>Authenticated</span>
        </Badge>
        <div className="space-y-1">
          <CopyableAddress
            address={address!}
            displayName={displayName}
            size={size}
            showFullAddress
          />
          {!canSubmit && timeUntilNextSubmission > 0 && (
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Next submission in {formatTime(timeUntilNextSubmission)}
            </Badge>
          )}
        </div>
      </div>
      <Button onClick={signOut} variant="outline" className="w-full">
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
};

const ConnectedNotAuthenticatedState = ({
  variant,
  size,
}: {
  variant: WalletVariant;
  size: WalletSize;
}) => {
  const { address, displayName, signInWithEthereum, signOut, isLoading } =
    useUser();

  if (variant === "header") {
    return (
      <div className="flex items-center gap-2">
        <CopyableAddress
          address={address!}
          displayName={displayName}
          size="sm"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={signInWithEthereum}
                disabled={isLoading}
                className="h-7 px-2 text-xs shrink-0"
              >
                {isLoading ? "Signing..." : "SIWE"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sign-In with Ethereum for enhanced security</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="h-8 px-2 shrink-0"
        >
          <LogOut className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-center">
        <Badge variant="outline" className="mb-3">
          Connected: {displayName}
        </Badge>
      </div>

      <Alert className="border-primary/20 bg-primary/5">
        <Shield className="h-4 w-4 text-primary" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium text-primary">
              Optional: Enhanced Security
            </p>
            <p className="text-sm text-muted-foreground">
              Sign in with Ethereum (SIWE) for secure session management and
              enhanced features.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Button
          onClick={signInWithEthereum}
          disabled={isLoading}
          className="w-full"
          variant="default"
        >
          <Shield className="h-4 w-4 mr-2" />
          {isLoading ? "Signing..." : "Sign In with Ethereum"}
        </Button>

        <Button
          onClick={signOut}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </Button>
      </div>
    </div>
  );
};

export const UnifiedWallet = ({
  variant = "card",
  size = "md",
  className,
  showOnboarding = false,
  onConnect,
  onAuthenticated,
}: UnifiedWalletProps) => {
  const { isConnected, isAuthenticated, isLoading, connectAndSignIn } =
    useUser();

  // Trigger callbacks
  React.useEffect(() => {
    if (isConnected && onConnect) {
      onConnect();
    }
  }, [isConnected, onConnect]);

  React.useEffect(() => {
    if (isAuthenticated && onAuthenticated) {
      onAuthenticated();
    }
  }, [isAuthenticated, onAuthenticated]);

  // Render based on variant
  if (variant === "header" || variant === "minimal") {
    return (
      <div className={cn("flex items-center", className)}>
        {isAuthenticated ? (
          <AuthenticatedState variant={variant} size={size} />
        ) : isConnected ? (
          <ConnectedNotAuthenticatedState variant={variant} size={size} />
        ) : (
          <ConnectButton
            size={size}
            variant={variant}
            isLoading={isLoading}
            onConnect={connectAndSignIn}
          />
        )}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("space-y-3", className)}>
        {showOnboarding && !isConnected && <WalletOnboarding />}

        {isAuthenticated ? (
          <AuthenticatedState variant={variant} size={size} />
        ) : isConnected ? (
          <ConnectedNotAuthenticatedState variant={variant} size={size} />
        ) : (
          <ConnectButton
            size={size}
            variant={variant}
            isLoading={isLoading}
            onConnect={connectAndSignIn}
          />
        )}
      </div>
    );
  }

  // Card variant
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Wallet className="h-5 w-5" />
          {isAuthenticated
            ? "Wallet Connected"
            : isConnected
              ? "Complete Setup"
              : "Connect Wallet"}
        </CardTitle>
        <CardDescription>
          {isAuthenticated
            ? "You're ready to compete on the blockchain leaderboard!"
            : isConnected
              ? "Complete authentication to unlock all features"
              : "Connect your Coinbase Smart Wallet to get started"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showOnboarding && !isConnected && <WalletOnboarding />}

        {isAuthenticated ? (
          <AuthenticatedState variant={variant} size={size} />
        ) : isConnected ? (
          <ConnectedNotAuthenticatedState variant={variant} size={size} />
        ) : (
          <ConnectButton
            size={size}
            variant={variant}
            isLoading={isLoading}
            onConnect={connectAndSignIn}
          />
        )}
      </CardContent>
    </Card>
  );
};

// Convenience components for common use cases
export const HeaderWallet = (props: Omit<UnifiedWalletProps, "variant">) => (
  <UnifiedWallet {...props} variant="header" />
);

export const WalletCard = (props: Omit<UnifiedWalletProps, "variant">) => (
  <UnifiedWallet {...props} variant="card" showOnboarding />
);

export const InlineWallet = (props: Omit<UnifiedWalletProps, "variant">) => (
  <UnifiedWallet {...props} variant="inline" />
);

export const MinimalWallet = (props: Omit<UnifiedWalletProps, "variant">) => (
  <UnifiedWallet {...props} variant="minimal" />
);
