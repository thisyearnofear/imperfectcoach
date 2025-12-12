import React from "react";
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Move,
  User,
  Activity,
} from "lucide-react";
import {
  ReadinessScore,
  ReadinessLevel,
  ReadinessIssue,
} from "@/lib/pose-readiness/ReadinessSystem";
import { cn } from "@/lib/utils";

interface PoseReadinessIndicatorProps {
  readinessScore: ReadinessScore | null;
  className?: string;
}

export const PoseReadinessIndicator: React.FC<PoseReadinessIndicatorProps> = ({
  readinessScore,
  className,
}) => {
  if (!readinessScore) {
    return (
      <div
        className={cn(
          "bg-gray-50 border border-gray-200 rounded-lg p-4",
          className
        )}
      >
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-gray-600">Analyzing pose...</span>
        </div>
      </div>
    );
  }

  const { overall, score, issues, feedback, canProceed } = readinessScore;

  // ENHANCEMENT: Get primary issue for clearer action
  const primaryIssue = issues.length > 0 ? issues[0] : null;
  const getPrimaryAction = (): string => {
    if (!primaryIssue) return "";
    if (primaryIssue.type === "VISIBILITY") return "Step back or adjust camera";
    if (primaryIssue.type === "POSITIONING") return "Adjust your stance";
    if (primaryIssue.type === "STABILITY") return "Stand still for a moment";
    if (primaryIssue.type === "POSTURE") return "Fix your posture";
    return primaryIssue.suggestion;
  };

  return (
    <div
      className={cn("border rounded-lg p-4 space-y-3 transition-all", className, {
        "border-green-300 bg-gradient-to-br from-green-50 to-emerald-50": overall === "READY",
        "border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50": overall === "EXCELLENT",
        "border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50": overall === "GOOD",
        "border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50": overall === "FAIR",
        "border-red-300 bg-gradient-to-br from-red-50 to-rose-50": overall === "POOR",
      })}
    >
      {/* Header with overall status and score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">{overall === "READY" ? "✅" : overall === "EXCELLENT" ? "🟢" : overall === "GOOD" ? "🟡" : overall === "FAIR" ? "🟠" : "🔴"}</div>
          <div>
            <div className="font-semibold text-gray-900">
              {overall === "READY" ? "Perfect position!" : overall === "EXCELLENT" ? "Excellent!" : overall === "GOOD" ? "Good setup" : overall === "FAIR" ? "Almost there" : "Adjust position"}
            </div>
            <div className="text-xs text-gray-600">{score}/100 readiness</div>
          </div>
        </div>

        {canProceed && (
          <div className="px-3 py-1 bg-green-100 rounded-full text-green-700 text-xs font-semibold animate-pulse">
            Ready to start
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
        <div
          className={cn("h-3 rounded-full transition-all duration-500", {
            "bg-gradient-to-r from-green-500 to-emerald-500": score >= 85,
            "bg-gradient-to-r from-blue-500 to-cyan-500": score >= 70 && score < 85,
            "bg-gradient-to-r from-yellow-500 to-amber-500": score >= 55 && score < 70,
            "bg-gradient-to-r from-orange-500 to-rose-500": score >= 35 && score < 55,
            "bg-gradient-to-r from-red-500 to-pink-500": score < 35,
          })}
          style={{ width: `${Math.max(8, score)}%` }}
        />
      </div>

      {/* Main feedback - encouraging tone */}
      <div className="text-sm text-gray-700 font-medium">{feedback}</div>

      {/* Primary action item - SINGLE CLEAR ACTION */}
      {primaryIssue && !canProceed && (
        <div className="mt-3 p-3 bg-white/60 rounded-lg border-l-4 border-orange-400">
          <div className="flex items-start space-x-2">
            <div className="text-xl mt-0.5">👉</div>
            <div>
              <div className="text-sm font-semibold text-gray-900">{getPrimaryAction()}</div>
              <div className="text-xs text-gray-600 mt-0.5">{primaryIssue.suggestion}</div>
            </div>
          </div>
        </div>
      )}

      {/* Show all issues if multiple - collapsible detail */}
      {issues.length > 1 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-900 font-medium">
            {issues.length - 1} more thing{issues.length > 2 ? "s" : ""} to check
          </summary>
          <div className="mt-2 space-y-1 pt-2 border-t border-gray-300">
            {issues.slice(1).map((issue, index) => (
              <IssueItem key={index} issue={issue} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

const ReadinessIcon: React.FC<{ level: ReadinessLevel }> = ({ level }) => {
  switch (level) {
    case "READY":
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case "EXCELLENT":
      return <CheckCircle className="w-5 h-5 text-blue-500" />;
    case "GOOD":
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    case "FAIR":
      return <AlertCircle className="w-5 h-5 text-orange-500" />;
    case "POOR":
      return <XCircle className="w-5 h-5 text-red-500" />;
  }
};

const IssueItem: React.FC<{ issue: ReadinessIssue }> = ({ issue }) => {
  const getIssueIcon = () => {
    switch (issue.type) {
      case "VISIBILITY":
        return <Eye className="w-3 h-3" />;
      case "POSITIONING":
        return <Move className="w-3 h-3" />;
      case "STABILITY":
        return <Activity className="w-3 h-3" />;
      case "POSTURE":
        return <User className="w-3 h-3" />;
    }
  };

  const getSeverityColor = () => {
    switch (issue.severity) {
      case "HIGH":
        return "text-red-600";
      case "MEDIUM":
        return "text-orange-600";
      case "LOW":
        return "text-yellow-600";
    }
  };

  return (
    <div className="flex items-start space-x-2 text-sm">
      <div className={cn("mt-0.5", getSeverityColor())}>{getIssueIcon()}</div>
      <div className="flex-1">
        <div className="text-gray-700">{issue.suggestion}</div>
        {issue.severity === "HIGH" && (
          <div className="text-xs text-gray-500 mt-1">
            This needs to be fixed before you can start
          </div>
        )}
      </div>
    </div>
  );
};
