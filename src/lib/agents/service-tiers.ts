/**
 * Service Tier Configurations
 * Phase D: Multi-Service Marketplace
 * 
 * Defines SLA, features, and constraints for each service tier
 */

import { ServiceTier, ServiceTierConfig } from "./types";

export const SERVICE_TIER_CONFIGS: Record<ServiceTier, ServiceTierConfig> = {
    basic: {
        name: "basic",
        label: "Basic",
        description: "Standard service with 5-10s response time",
        responseTime: 8000, // milliseconds
        features: [
            "Standard analysis",
            "Async processing",
            "24-hour results",
            "Email support",
        ],
    },
    pro: {
        name: "pro",
        label: "Professional",
        description: "Priority service with 2-3s response time",
        responseTime: 3000,
        features: [
            "Priority processing",
            "Real-time analysis",
            "Custom recommendations",
            "Chat support",
            "30-day history",
        ],
    },
    premium: {
        name: "premium",
        label: "Premium",
        description: "Ultra-fast service with <500ms response time",
        responseTime: 500,
        features: [
            "Ultra-fast analysis",
            "Real-time streaming",
            "Personalized coaching",
            "24/7 priority support",
            "Unlimited history",
            "Direct agent access",
            "Custom protocols",
        ],
    },
};

/**
 * Pricing multipliers relative to basic tier
 * Used to calculate tiered pricing from base pricing
 */
export const TIER_PRICE_MULTIPLIERS: Record<ServiceTier, number> = {
    basic: 1.0,      // Base price
    pro: 2.5,        // 2.5x base
    premium: 5.0,    // 5x base
};

/**
 * Availability slots per tier
 * Typical allocation for a service provider
 */
export const TIER_SLOT_ALLOCATION: Record<ServiceTier, number> = {
    basic: 200,      // Most slots for basic tier
    pro: 75,         // Medium slots for pro
    premium: 25,     // Limited slots for premium
};

/**
 * Get tier features
 */
export function getTierFeatures(tier: ServiceTier): string[] {
    return SERVICE_TIER_CONFIGS[tier].features;
}

/**
 * Get response time SLA
 */
export function getResponseTimeSLA(tier: ServiceTier): number {
    return SERVICE_TIER_CONFIGS[tier].responseTime;
}

/**
 * Calculate tiered price from base price
 * @param basePrice Base tier price in USDC (as string)
 * @param tier Target service tier
 * @returns Tiered price in USDC (as string)
 */
export function calculateTieredPrice(basePrice: string, tier: ServiceTier): string {
    const basePriceNum = parseFloat(basePrice);
    const multiplier = TIER_PRICE_MULTIPLIERS[tier];
    return (basePriceNum * multiplier).toFixed(4);
}

/**
 * Get human-readable tier description
 */
export function getTierDescription(tier: ServiceTier): string {
    return SERVICE_TIER_CONFIGS[tier].description;
}

/**
 * Determine if tier has uptime guarantee
 */
export function hasUptimeGuarantee(tier: ServiceTier): boolean {
    return tier === "pro" || tier === "premium";
}

/**
 * Get minimum reputation required for tier
 */
export function getMinReputationForTier(tier: ServiceTier): number {
    switch (tier) {
        case "basic":
            return 0; // Anyone can provide basic service
        case "pro":
            return 80; // Must have 80+ reputation
        case "premium":
            return 95; // Must have 95+ reputation
    }
}
