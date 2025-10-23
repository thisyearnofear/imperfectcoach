import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { agentErrorToUI } from "@/lib/utils/agentErrorMapper";
import { CoachModel, ChatMessage, CoachPersonality } from "@/lib/types";
import { useAIFeedback } from "@/hooks/useAIFeedback";
import { getPersonalityFeedback } from "@/lib/coachPersonalities";

export type AgentRequest =
  | { type: "session-summary"; params: { reps: number; workoutMode: string; exercise: string; stats?: Record<string, unknown>; selectedCoaches: CoachModel[] } }
  | { type: "chat"; params: { messages: ChatMessage[]; model?: CoachModel } };

export type AgentResult =
  | { type: "session-summary"; data: { summaries: Partial<Record<CoachModel, string>> } }
  | { type: "chat"; data: { reply: string; model?: CoachModel } };

export type AgentStatus = "idle" | "loading" | "success" | "error";

export interface UseAgentActionOptions {
  showOverlay?: boolean;
  personality?: CoachPersonality;
  onSuccess?: (result: AgentResult) => void;
  onError?: (error: unknown) => void;
}

export const useAgentAction = (opts: UseAgentActionOptions = {}) => {
  const { showOverlay = false, personality, onSuccess, onError } = opts;
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [error, setError] = useState<unknown>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isMounted = useRef(true);

  // Wire up existing AI feedback domain logic
  // Note: useAIFeedback is designed for real-time feedback during workouts
  // For post-workout summaries and chat, we'll call the functions directly
  // This is a temporary bridge until we refactor useAIFeedback
  const { getAISessionSummary, getAIChatResponse } = useAIFeedback({
    exercise: "pull-ups", // Default, will be overridden by request params
    coachPersonality: "competitive", // Default, will be overridden
    workoutMode: "training",
    onFormFeedback: () => {}, // Not used in agent actions
  });

  // Get personality-aware success messages
  const getSuccessMessage = useCallback((type: "session-summary" | "chat") => {
    if (!personality) return null;

    const messages = {
      SNEL: {
        "session-summary": { title: "Analysis Complete! 🐌", description: "Take your time reviewing the insights." },
        "chat": { title: "Got it! 🐌", description: "Here's what I found for you." },
      },
      STEDDIE: {
        "session-summary": { title: "Analysis Ready 🐢", description: "Centered insights await your review." },
        "chat": { title: "Understood 🐢", description: "Balanced response prepared." },
      },
      RASTA: {
        "session-summary": { title: "Analysis Done! 🐙", description: "Check out these powerful insights!" },
        "chat": { title: "On it! 🐙", description: "Dynamic response ready!" },
      },
    };

    return messages[personality]?.[type] || null;
  }, [personality]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const setSafeState = useCallback((next: Partial<{ status: AgentStatus; error: unknown }>) => {
    if (!isMounted.current) return;
    if (next.status !== undefined) setStatus(next.status);
    if (next.error !== undefined) setError(next.error);
  }, []);

  const execute = useCallback(async (request: AgentRequest): Promise<AgentResult> => {
    cancel();
    const controller = new AbortController();
    abortRef.current = controller;

    setSafeState({ status: "loading", error: null });

    try {
      if (request.type === "session-summary") {
        const { stats, selectedCoaches } = request.params;
        const result = await getAISessionSummary(
          stats || {},
          selectedCoaches
        );
        const data: AgentResult = { type: "session-summary", data: { summaries: result } };
        setSafeState({ status: "success" });
        
        // Show personality-aware success toast
        const successMsg = getSuccessMessage("session-summary");
        if (successMsg) {
          toast.success(successMsg.title, { description: successMsg.description });
        }
        
        onSuccess?.(data);
        return data;
      }

      if (request.type === "chat") {
        const { messages, model } = request.params;
        // Extract the last user message and session data from messages
        const lastUserMessage = messages.filter(m => m.role === "user").pop();
        const sessionData = { message: lastUserMessage?.content || "" };
        
        const reply = await getAIChatResponse(messages, sessionData, model || "gemini");
        const data: AgentResult = { type: "chat", data: { reply, model: model || "gemini" } };
        setSafeState({ status: "success" });
        
        // Show personality-aware success toast (optional for chat)
        const successMsg = getSuccessMessage("chat");
        if (successMsg && messages.length === 1) {
          // Only show for first message to avoid spam
          toast.success(successMsg.title, { description: successMsg.description });
        }
        
        onSuccess?.(data);
        return data;
      }

      throw new Error("Unsupported agent request type");
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // Silently ignore cancels
        setSafeState({ status: "idle", error: null });
        throw err;
      }
      setSafeState({ status: "error", error: err });
      const ui = agentErrorToUI(err);
      if (ui.toast) {
        const { type, title, description, action } = ui.toast;
        const actionLabel = action?.label;
        const actionFn = action?.handler;
        toast[type](title, {
          description,
          action: actionLabel && actionFn ? { label: actionLabel, onClick: actionFn } : undefined,
        });
      }
      onError?.(err);
      throw err;
    } finally {
      abortRef.current = null;
    }
  }, [cancel, getAISessionSummary, getAIChatResponse, onError, onSuccess, setSafeState, getSuccessMessage]);

  return useMemo(
    () => ({ status, error, execute, cancel }),
    [status, error, execute, cancel]
  );
};
