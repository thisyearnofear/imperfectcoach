import { toast } from "sonner";

export type ToastType = "success" | "info" | "warning" | "error";

interface ToastSpec {
  type: ToastType;
  title: string;
  description?: string;
  action?: { label: string; handler: () => void };
}

interface UIActions {
  toast?: ToastSpec;
}

const isOffline = () => typeof navigator !== "undefined" && navigator.onLine === false;

const openApiKeySettings = () => {
  // Dispatch a global event that components can listen to for opening API key settings
  const event = new CustomEvent("open-api-key-settings");
  window.dispatchEvent(event);
};

export const agentErrorToUI = (error: unknown): UIActions => {
  const message = (error as any)?.message || String(error);
  const lower = message.toLowerCase();

  if (isOffline()) {
    return {
      toast: {
        type: "error",
        title: "You are offline",
        description: "Reconnect to continue using AI coaching features.",
      },
    };
  }

  if (lower.includes("unauthorized") || lower.includes("401") || lower.includes("api key")) {
    return {
      toast: {
        type: "error",
        title: "API key required",
        description: "Add or update your API key to enable AI features.",
        action: { label: "Add key", handler: openApiKeySettings },
      },
    };
  }

  if (lower.includes("429") || lower.includes("rate") || lower.includes("quota")) {
    return {
      toast: {
        type: "warning",
        title: "Rate limit reached",
        description: "Please wait a moment and try again.",
      },
    };
  }

  if (lower.includes("timeout") || lower.includes("network")) {
    return {
      toast: {
        type: "error",
        title: "Network issue",
        description: "We had trouble reaching the AI service. Try again shortly.",
      },
    };
  }

  return {
    toast: {
      type: "error",
      title: "Something went wrong",
      description: message,
    },
  };
};

// Optional convenience to directly show a toast from an error
export const showAgentError = (error: unknown) => {
  const ui = agentErrorToUI(error);
  if (ui.toast) {
    const { type, title, description, action } = ui.toast;
    toast[type](title, {
      description,
      action: action ? { label: action.label, onClick: action.handler } : undefined,
    });
  }
};
