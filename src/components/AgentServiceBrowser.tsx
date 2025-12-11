import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentRegistry } from "@/lib/agents/agent-registry";
import { AgentProfile, ServiceTier, AgentCapability } from "@/lib/agents/types";
import { TIER_PRICE_MULTIPLIERS } from "@/lib/agents/service-tiers";
import { Star, MapPin, TrendingUp, AlertCircle } from "lucide-react";

interface AgentServiceBrowserProps {
  capability: AgentCapability;
  tier: ServiceTier;
  basePrice: string;
  onAgentSelected: (agent: AgentProfile) => void;
  selectedAgentId?: string;
}

export const AgentServiceBrowser = ({
  capability,
  tier,
  basePrice,
  onAgentSelected,
  selectedAgentId,
}: AgentServiceBrowserProps) => {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAgents = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const results = await AgentRegistry.findAgents({
          capability,
          tier,
          minReputation: tier === "premium" ? 95 : tier === "pro" ? 80 : 0,
          maxResponseTime: tier === "premium" ? 500 : tier === "pro" ? 3000 : 8000,
        });

        if (results.length === 0) {
          setError(`No ${tier} agents available for ${capability}`);
        } else {
          setAgents(results);
        }
      } catch (err) {
        console.error("Failed to load agents:", err);
        setError("Failed to load agents. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAgents();
  }, [capability, tier]);

  const getTierPrice = (basePriceStr: string): string => {
    const baseNum = parseFloat(basePriceStr);
    const multiplier = TIER_PRICE_MULTIPLIERS[tier];
    return (baseNum * multiplier).toFixed(4);
  };

  const tierPrice = getTierPrice(basePrice);

  if (error) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Available {tier} Agents</h3>
        <Badge variant="secondary">
          {isLoading ? "Loading..." : `${agents.length} agents`}
        </Badge>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-64" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {agents.map((agent) => {
            const isSelected = selectedAgentId === agent.id;
            const tierAvailability = agent.serviceAvailability?.[tier];
            const availableSlots = tierAvailability
              ? tierAvailability.slots - tierAvailability.slotsFilled
              : 0;

            return (
              <Card
                key={agent.id}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? "ring-2 ring-blue-500 border-blue-500"
                    : "hover:border-gray-300"
                }`}
                onClick={() => onAgentSelected(agent)}
              >
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {/* Agent Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{agent.name}</h4>
                        <CardDescription className="text-xs mt-1">
                          {agent.description || "Specialized service agent"}
                        </CardDescription>
                      </div>
                      {isSelected && (
                        <Badge className="ml-2">Selected</Badge>
                      )}
                    </div>

                    {/* Reputation & Location */}
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">
                          {agent.reputationScore}/100
                        </span>
                      </div>
                      {agent.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{agent.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Tier Availability Info */}
                    {tierAvailability && (
                      <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 rounded-lg p-2">
                        <div>
                          <span className="text-gray-600">Response SLA:</span>
                          <p className="font-semibold">
                            {tierAvailability.responseSLA < 1000
                              ? `${tierAvailability.responseSLA}ms`
                              : `${(tierAvailability.responseSLA / 1000).toFixed(1)}s`}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Available:</span>
                          <p className="font-semibold">
                            {availableSlots}/{tierAvailability.slots}
                            {availableSlots === 0 && " ⚠️"}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Price & Action */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-sm">
                        <p className="text-gray-600">Price:</p>
                        <p className="text-lg font-bold text-blue-600">
                          ${tierPrice}
                        </p>
                      </div>
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => onAgentSelected(agent)}
                      >
                        {isSelected ? "✓ Selected" : "Select"}
                      </Button>
                    </div>

                    {/* Success Metrics */}
                    {agent.successRate !== undefined && (
                      <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 rounded px-2 py-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{(agent.successRate * 100).toFixed(0)}% success rate</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
