/**
 * DynamoDB Client for Frontend
 * Provides a clean API for interacting with Lambda functions backed by DynamoDB
 */

const LAMBDA_ENDPOINTS = {
    AGENT_CORE: import.meta.env.VITE_AGENT_CORE_URL || "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/agent-coach",
    PREMIUM_ANALYSIS: import.meta.env.VITE_PREMIUM_ANALYSIS_URL || "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout",
};

export interface WorkoutData {
    exercise: string;
    reps: number;
    duration?: number;
    formScore?: number;
    averageFormScore?: number;
    repHistory?: Array<{ rep: number; score: number }>;
    poseData?: any;
    timestamp?: number;
}

export interface WorkoutHistoryOptions {
    exerciseType?: string;
    daysBack?: number;
    limit?: number;
}

export interface UserProfile {
    userId: string;
    name?: string;
    experienceLevel?: "beginner" | "intermediate" | "advanced";
    goals?: string[];
    preferences?: Record<string, any>;
    personalRecords?: Record<string, any>; // Personal records data
    [key: string]: any; // Allow additional properties
}

/**
 * Save workout to DynamoDB via Lambda
 */
export async function saveWorkout(
    userId: string,
    workoutData: WorkoutData,
    paymentProof?: string,
    network: string = "base-mainnet"
): Promise<any> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Chain": network,
    };

    if (paymentProof) {
        headers["X-Payment"] = paymentProof;
    }

    const response = await fetch(LAMBDA_ENDPOINTS.PREMIUM_ANALYSIS, {
        method: "POST",
        headers,
        body: JSON.stringify({
            type: "save_workout",
            userId,
            workoutData: {
                ...workoutData,
                timestamp: workoutData.timestamp || Date.now(),
            },
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save workout");
    }

    return response.json();
}

/**
 * Get workout history from DynamoDB via Lambda
 */
export async function getWorkoutHistory(
    userId: string,
    options: WorkoutHistoryOptions = {}
): Promise<any[]> {
    const params = new URLSearchParams({
        userId,
        ...options,
    } as any);

    const response = await fetch(
        `${LAMBDA_ENDPOINTS.AGENT_CORE}?${params}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.ok) {
        console.error("Failed to fetch workout history");
        return [];
    }

    const data = await response.json();
    return data.history || [];
}

/**
 * Get user profile from DynamoDB
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
        const response = await fetch(
            `${LAMBDA_ENDPOINTS.AGENT_CORE}?userId=${userId}&type=profile`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) return null;

        const data = await response.json();
        return data.profile || null;
    } catch (error) {
        console.error("Failed to fetch user profile:", error);
        return null;
    }
}

/**
 * Update user profile in DynamoDB
 */
export async function updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
): Promise<UserProfile | null> {
    try {
        const response = await fetch(LAMBDA_ENDPOINTS.AGENT_CORE, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                type: "update_profile",
                userId,
                updates,
            }),
        });

        if (!response.ok) return null;

        const data = await response.json();
        return data.profile || null;
    } catch (error) {
        console.error("Failed to update user profile:", error);
        return null;
    }
}

/**
 * Get workout statistics
 */
export async function getWorkoutStats(
    userId: string,
    exerciseType?: string
): Promise<any> {
    try {
        const params = new URLSearchParams({ userId });
        if (exerciseType) params.append("exerciseType", exerciseType);

        const response = await fetch(
            `${LAMBDA_ENDPOINTS.AGENT_CORE}?${params}&type=stats`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            return {
                totalWorkouts: 0,
                averageScore: 0,
                bestScore: 0,
                recentTrend: "no_data",
            };
        }

        const data = await response.json();
        return data.stats || {};
    } catch (error) {
        console.error("Failed to fetch workout stats:", error);
        return {
            totalWorkouts: 0,
            averageScore: 0,
            bestScore: 0,
            recentTrend: "no_data",
        };
    }
}

/**
 * Hybrid Storage Strategy
 * - Critical data (workouts, profiles) → DynamoDB via Lambda
 * - UI preferences (theme, dismissed tooltips) → localStorage
 * - Temporary data (current session) → React state
 */

export const StorageStrategy = {
    // DynamoDB (persistent, cross-device)
    DYNAMODB: [
        "workouts",
        "user_profile",
        "personal_records",
        "agent_sessions",
        "premium_sessions",
    ],

    // localStorage (device-specific, UI preferences)
    LOCAL_STORAGE: [
        "theme",
        "dismissed_features",
        "dismissed_suggestions",
        "onboarding_completed",
        "height_unit",
        "basename_cache",
    ],

    // Session storage (temporary, cleared on close)
    SESSION: ["current_workout", "temp_api_keys"],
};

/**
 * Migrate localStorage data to DynamoDB
 * Call this once when user first connects wallet
 */
export async function migrateLocalStorageToDynamoDB(userId: string) {
    try {
        // Migrate personal records
        const personalRecords = localStorage.getItem("personalRecords");
        if (personalRecords) {
            const records = JSON.parse(personalRecords);
            await updateUserProfile(userId, { personalRecords: records });
            console.log("✅ Migrated personal records to DynamoDB");
        }

        // Migrate premium sessions
        const premiumSessions = localStorage.getItem("premium-sessions");
        if (premiumSessions) {
            const sessions = JSON.parse(premiumSessions);
            // Save to DynamoDB via Lambda
            await fetch(LAMBDA_ENDPOINTS.AGENT_CORE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "migrate_premium_sessions",
                    userId,
                    sessions,
                }),
            });
            console.log("✅ Migrated premium sessions to DynamoDB");
        }

        // Keep UI preferences in localStorage (theme, dismissed tooltips, etc.)
        // These don't need to sync across devices
    } catch (error) {
        console.error("Migration failed:", error);
    }
}
