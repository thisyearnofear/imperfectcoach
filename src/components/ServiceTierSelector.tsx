import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SERVICE_TIER_CONFIGS,
  TIER_PRICE_MULTIPLIERS,
  getTierDescription,
  getTierFeatures,
  getResponseTimeSLA,
} from "@/lib/agents/service-tiers";
import { ServiceTier } from "@/lib/agents/types";
import { Check, Clock, Zap } from "lucide-react";

interface ServiceTierSelectorProps {
  basePrice: string; // Price in USDC (e.g., "0.05")
  selectedTier: ServiceTier;
  onTierSelect: (tier: ServiceTier) => void;
  disabled?: boolean;
}

export const ServiceTierSelector = ({
  basePrice,
  selectedTier,
  onTierSelect,
  disabled = false,
}: ServiceTierSelectorProps) => {
  const tiers: ServiceTier[] = ["basic", "pro", "premium"];

  const getTierPrice = (tier: ServiceTier): string => {
    const baseNum = parseFloat(basePrice);
    const multiplier = TIER_PRICE_MULTIPLIERS[tier];
    return (baseNum * multiplier).toFixed(4);
  };

  const getTierIcon = (tier: ServiceTier) => {
    switch (tier) {
      case "basic":
        return <Clock className="w-4 h-4" />;
      case "pro":
        return <Zap className="w-4 h-4" />;
      case "premium":
        return <Zap className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold">Service Tier</h3>
        <p className="text-sm text-muted-foreground">
          Tier affects price, speed, and features
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier) => {
          const isSelected = selectedTier === tier;
          const config = SERVICE_TIER_CONFIGS[tier];
          const price = getTierPrice(tier);
          const slaMs = getResponseTimeSLA(tier);
          const features = getTierFeatures(tier);

          return (
            <Card
              key={tier}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "ring-2 ring-blue-500 border-blue-500"
                  : "hover:border-gray-300"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => !disabled && onTierSelect(tier)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {getTierIcon(tier)}
                    {config.label}
                  </CardTitle>
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-500 font-bold" />
                  )}
                </div>
                <CardDescription className="text-xs">
                  {getTierDescription(tier)}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Price */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-2 text-center">
                  <p className="text-2xl font-bold text-blue-600">${price}</p>
                  <p className="text-xs text-gray-600">USDC</p>
                </div>

                {/* SLA */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Response SLA:</span>
                  <Badge variant="outline">
                    {slaMs < 1000
                      ? `${slaMs}ms`
                      : `${(slaMs / 1000).toFixed(1)}s`}
                  </Badge>
                </div>

                {/* Features List */}
                <div className="space-y-1">
                  {features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                  {features.length > 3 && (
                    <p className="text-xs text-gray-500 italic">
                      +{features.length - 3} more features
                    </p>
                  )}
                </div>

                {/* Selection Button */}
                <Button
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className="w-full text-xs"
                  disabled={disabled}
                  onClick={() => !disabled && onTierSelect(tier)}
                >
                  {isSelected ? "Selected" : "Select"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
