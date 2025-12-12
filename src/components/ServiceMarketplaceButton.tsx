import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ServiceBookingFlow } from "./ServiceBookingFlow";
import { AgentCapability, ServiceTier } from "@/lib/agents/types";
import { Zap } from "lucide-react";

interface ServiceMarketplaceButtonProps {
  capability: AgentCapability;
  basePrice: string;
  label?: string;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost";
  size?: "default" | "sm" | "lg";
  preferredChain?: "base" | "solana";
  onBookingComplete?: (booking: any) => void;
  className?: string;
}

/**
 * ServiceMarketplaceButton
 * 
 * Quick-access button to open the full service booking flow.
 * Integrated with ServiceTierSelector, AgentServiceBrowser, and
 * ServiceBookingFlow for a complete Phase D user experience.
 * 
 * Usage:
 * <ServiceMarketplaceButton 
 *   capability="fitness_analysis"
 *   basePrice="0.05"
 *   label="Book Agent Analysis"
 *   onBookingComplete={(booking) => console.log(booking)}
 * />
 */
export const ServiceMarketplaceButton = ({
  capability,
  basePrice,
  label = "Book Service",
  variant = "default",
  size = "default",
  preferredChain = "base",
  onBookingComplete,
  className = "",
}: ServiceMarketplaceButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <Zap className="w-4 h-4 mr-2" />
        {label}
      </Button>

      <ServiceBookingFlow
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        capability={capability}
        basePrice={basePrice}
        preferredChain={preferredChain}
        onBookingComplete={onBookingComplete}
      />
    </>
  );
};
