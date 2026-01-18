import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, ShieldCheck } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ChainType, getChainDisplayName } from "@/lib/chainRouting";

interface ChainSelectorProps {
  open: boolean;
  onChainSelected: (chain: ChainType, privacyMode?: boolean) => void;
  onCancel: () => void;
  baseConnected: boolean;
  solanaConnected: boolean;
}

export function ChainSelector({
  open,
  onChainSelected,
  onCancel,
  baseConnected,
  solanaConnected,
}: ChainSelectorProps) {
  const [privacyMode, setPrivacyMode] = useState(false);

  if (!baseConnected || !solanaConnected) {
    return null; // Only show when both are connected
  }

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Choose Chain to Submit To</AlertDialogTitle>
          <AlertDialogDescription>
            You have both Base and Solana wallets connected. Which chain would
            you like to submit your score to?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex gap-3 py-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              onChainSelected("base");
            }}
          >
            <span className="text-lg mr-2">⛓️</span>
            {getChainDisplayName("base")}
          </Button>



          <Button
            variant={privacyMode ? "default" : "outline"}
            className={cn(
              "flex-1 relative overflow-hidden transition-all",
              privacyMode && "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-purple-400/50"
            )}
            onClick={() => {
              onChainSelected("solana", privacyMode);
            }}
          >
            {privacyMode && (
              <div className="absolute inset-0 bg-black/10 z-0" />
            )}
            <span className="text-lg mr-2 z-10 relative">{privacyMode ? "🕵️" : "◎"}</span>
            <span className="z-10 relative">
              {privacyMode ? "Solana (Private)" : getChainDisplayName("solana")}
            </span>
          </Button>
        </div>

        {solanaConnected && (
          <div className="flex items-center justify-center space-x-2 pb-4">
            <Switch
              id="privacy-mode"
              checked={privacyMode}
              onCheckedChange={setPrivacyMode}
              className="data-[state=checked]:bg-purple-600"
            />
            <Label htmlFor="privacy-mode" className="flex items-center gap-1.5 cursor-pointer text-sm font-medium">
              {privacyMode ? (
                <>
                  <ShieldCheck className="h-4 w-4 text-purple-500" />
                  <span className="text-purple-700 dark:text-purple-300">Privacy Mode Enabled</span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>Enable Privacy Mode</span>
                </>
              )}
            </Label>
          </div>
        )}

        <div className="flex gap-2">
          <AlertDialogCancel asChild>
            <Button
              variant="ghost"
              className="flex-1"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog >
  );
}
