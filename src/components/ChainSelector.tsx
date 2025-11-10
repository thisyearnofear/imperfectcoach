import React from "react";
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
  onChainSelected: (chain: ChainType) => void;
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
            variant="outline"
            className="flex-1"
            onClick={() => {
              onChainSelected("solana");
            }}
          >
            <span className="text-lg mr-2">◎</span>
            {getChainDisplayName("solana")}
          </Button>
        </div>

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
    </AlertDialog>
  );
}
