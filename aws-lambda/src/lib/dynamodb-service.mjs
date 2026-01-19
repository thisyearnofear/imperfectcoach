/**
 * DynamoDB Service - Single source of truth for all data operations
 * Follows Core Principles: DRY, CLEAN, MODULAR, PERFORMANT
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand,
    QueryCommand,
    UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

// Initialize client (reused across Lambda invocations)
const client = new DynamoDBClient({ region: process.env.AWS_REGION || "eu-north-1" });
const dynamoDB = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
    },
});

// Table names (environment-aware)
const TABLES = {
    WORKOUT_HISTORY: process.env.WORKOUT_HISTORY_TABLE || "ImperfectCoach-WorkoutHistory",
    USER_PROFILES: process.env.USER_PROFILES_TABLE || "ImperfectCoach-UserProfiles",
    AGENT_SESSIONS: process.env.AGENT_SESSIONS_TABLE || "ImperfectCoach-AgentSessions",
};

/**
 * WORKOUT HISTORY OPERATIONS
 */

export async function saveWorkout(userId, workoutData) {
    const item = {
        userId,
        timestamp: Date.now(),
        workoutId: `${userId}-${Date.now()}`,
        ...workoutData,
        createdAt: new Date().toISOString(),
    };

    await dynamoDB.send(
        new PutCommand({
            TableName: TABLES.WORKOUT_HISTORY,
            Item: item,
        })
    );

    return item;
}

export async function getWorkoutHistory(userId, options = {}) {
    const {
        limit = 30,
        exerciseType = null,
        daysBack = 30,
    } = options;

    const cutoffTime = Date.now() - (daysBack * 24 * 60 * 60 * 1000);

    const params = {
        TableName: TABLES.WORKOUT_HISTORY,
        KeyConditionExpression: "userId = :uid AND #ts >= :cutoff",
        ExpressionAttributeNames: {
            "#ts": "timestamp",
        },
        ExpressionAttributeValues: {
            ":uid": userId,
            ":cutoff": cutoffTime,
        },
        Limit: limit,
        ScanIndexForward: false, // newest first
    };

    // Add exercise filter if specified
    if (exerciseType) {
        params.FilterExpression = "exercise = :exercise";
        params.ExpressionAttributeValues[":exercise"] = exerciseType;
    }

    const { Items = [] } = await dynamoDB.send(new QueryCommand(params));
    return Items;
}

export async function getWorkoutStats(userId, exerciseType = null) {
    const history = await getWorkoutHistory(userId, { exerciseType, limit: 100 });

    if (history.length === 0) {
        return {
            totalWorkouts: 0,
            averageScore: 0,
            bestScore: 0,
            recentTrend: "no_data",
        };
    }

    const scores = history.map(w => w.formScore || w.score || 0);
    const reps = history.map(w => w.reps || 0);

    return {
        totalWorkouts: history.length,
        averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        bestScore: Math.max(...scores),
        averageReps: Math.round(reps.reduce((a, b) => a + b, 0) / reps.length),
        bestReps: Math.max(...reps),
        recentTrend: calculateTrend(scores),
        lastWorkout: history[0],
    };
}

function calculateTrend(scores) {
    if (scores.length < 3) return "insufficient_data";

    const recent = scores.slice(0, 5);
    const older = scores.slice(5, 10);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    if (recentAvg > olderAvg * 1.1) return "improving";
    if (recentAvg < olderAvg * 0.9) return "declining";
    return "stable";
}

/**
 * USER PROFILE OPERATIONS
 */

export async function getUserProfile(userId) {
    const { Item } = await dynamoDB.send(
        new GetCommand({
            TableName: TABLES.USER_PROFILES,
            Key: { userId },
        })
    );

    return Item || null;
}

export async function updateUserProfile(userId, updates) {
    const updateExpressions = [];
    const attributeNames = {};
    const attributeValues = {};

    Object.entries(updates).forEach(([key, value], index) => {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        updateExpressions.push(`${attrName} = ${attrValue}`);
        attributeNames[attrName] = key;
        attributeValues[attrValue] = value;
    });

    const { Attributes } = await dynamoDB.send(
        new UpdateCommand({
            TableName: TABLES.USER_PROFILES,
            Key: { userId },
            UpdateExpression: `SET ${updateExpressions.join(", ")}, updatedAt = :now`,
            ExpressionAttributeNames: attributeNames,
            ExpressionAttributeValues: {
                ...attributeValues,
                ":now": new Date().toISOString(),
            },
            ReturnValues: "ALL_NEW",
        })
    );

    return Attributes;
}

export async function createUserProfile(userId, profileData) {
    const item = {
        userId,
        ...profileData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    await dynamoDB.send(
        new PutCommand({
            TableName: TABLES.USER_PROFILES,
            Item: item,
        })
    );

    return item;
}

/**
 * AGENT SESSION OPERATIONS (for tracking agent reasoning)
 */

export async function saveAgentSession(sessionData) {
    const item = {
        sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        ...sessionData,
        createdAt: new Date().toISOString(),
    };

    await dynamoDB.send(
        new PutCommand({
            TableName: TABLES.AGENT_SESSIONS,
            Item: item,
        })
    );

    return item;
}

export async function getAgentSessions(userId, limit = 10) {
    const { Items = [] } = await dynamoDB.send(
        new QueryCommand({
            TableName: TABLES.AGENT_SESSIONS,
            IndexName: "UserIdIndex", // GSI on userId
            KeyConditionExpression: "userId = :uid",
            ExpressionAttributeValues: {
                ":uid": userId,
            },
            Limit: limit,
            ScanIndexForward: false,
        })
    );

    return Items;
}

/**
 * PERFORMANCE BENCHMARKING (cached in-memory for Lambda reuse)
 */

let benchmarkCache = null;
let benchmarkCacheTime = 0;
const CACHE_TTL = 3600000; // 1 hour

export async function getBenchmarks(exercise, experienceLevel = "intermediate") {
    // Return cached benchmarks if fresh
    if (benchmarkCache && Date.now() - benchmarkCacheTime < CACHE_TTL) {
        return benchmarkCache[exercise]?.[experienceLevel] || getDefaultBenchmark(exercise, experienceLevel);
    }

    // In production, this could query aggregated stats from DynamoDB
    // For now, use sensible defaults (can be updated via admin panel later)
    benchmarkCache = {
        pullups: { beginner: 5, intermediate: 12, advanced: 20 },
        pushups: { beginner: 10, intermediate: 25, advanced: 50 },
        jumps: { beginner: 30, intermediate: 50, advanced: 70 },
        squats: { beginner: 15, intermediate: 30, advanced: 60 },
    };
    benchmarkCacheTime = Date.now();

    return benchmarkCache[exercise]?.[experienceLevel] || getDefaultBenchmark(exercise, experienceLevel);
}

function getDefaultBenchmark(exercise, level) {
    const defaults = { beginner: 5, intermediate: 10, advanced: 20 };
    return defaults[level] || 10;
}
