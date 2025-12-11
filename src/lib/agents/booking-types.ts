/**
 * Booking Orchestrator Types
 * Phase D: Multi-Service Marketplace
 * 
 * Types for booking, negotiation, and service fulfillment
 */

import { AgentCapability, ServiceTier } from "./types";

export type BookingStatus = "pending" | "confirmed" | "processing" | "completed" | "cancelled" | "failed";

/**
 * Service booking request
 */
export interface ServiceBooking {
    id: string;                    // Unique booking ID
    agentId: string;               // Target service agent ID
    capability: AgentCapability;   // Service capability being booked
    tier: ServiceTier;             // Service tier (basic/pro/premium)
    status: BookingStatus;
    
    // Payment details
    priceUSDC: string;            // Price in USDC (e.g., "0.05")
    paymentChain: string;         // Chain for settlement
    
    // Metadata
    requestData?: any;             // Data to pass to service agent
    createdAt: number;             // Unix timestamp
    expiresAt: number;             // Booking expiry
    startedAt?: number;            // When service started
    completedAt?: number;          // When service completed
    
    // Results
    result?: any;                  // Service result/output
    transactionHash?: string;      // Payment tx hash
    errorMessage?: string;         // If failed
}

/**
 * Service booking request (client side)
 */
export interface BookServiceRequest {
    agentId: string;
    capability: AgentCapability;
    tier: ServiceTier;
    requestData?: any;
}

/**
 * Booking orchestrator response
 */
export interface BookingResponse {
    success: boolean;
    booking?: ServiceBooking;
    error?: string;
}

/**
 * Service negotiation parameters
 * Used during booking to finalize terms
 */
export interface ServiceNegotiation {
    agentId: string;
    capability: AgentCapability;
    tier: ServiceTier;
    
    // Proposed terms
    price: string;
    responseSLA: number;
    
    // Agent requirements
    minReputation?: number;
    maxConcurrent?: number;
    
    // Acceptance
    accepted?: boolean;
    expiresAt?: number;
}

/**
 * Multi-tier booking (book multiple agents across tiers)
 */
export interface MultiBookingRequest {
    bookings: Array<{
        agentId: string;
        capability: AgentCapability;
        tier: ServiceTier;
        requestData?: any;
    }>;
    timeout?: number; // Total timeout for all bookings
}

/**
 * Multi-booking result
 */
export interface MultiBookingResult {
    success: boolean;
    bookings: ServiceBooking[];
    totalCost: string;
    completionTime?: number;
    failedBookings?: Array<{
        agentId: string;
        error: string;
    }>;
}

/**
 * Booking history for tracking
 */
export interface BookingHistory {
    userId?: string;
    bookings: ServiceBooking[];
    totalSpent: string;
    averageRating?: number;
    lastBooking?: ServiceBooking;
}

/**
 * Service availability summary
 */
export interface ServiceAvailabilitySummary {
    agentId: string;
    capability: AgentCapability;
    tiers: {
        basic?: {
            available: boolean;
            price: string;
            nextSlot: number;
            sla: number;
        };
        pro?: {
            available: boolean;
            price: string;
            nextSlot: number;
            sla: number;
        };
        premium?: {
            available: boolean;
            price: string;
            nextSlot: number;
            sla: number;
        };
    };
}
