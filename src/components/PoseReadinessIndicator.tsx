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

  return (
    <div
      className={cn("bg-white border rounded-lg p-4 space-y-3", className, {
        "border-green-200 bg-green-50": overall === "READY",
        "border-blue-200 bg-blue-50": overall === "EXCELLENT",
        "border-yellow-200 bg-yellow-50": overall === "GOOD",
        "border-orange-200 bg-orange-50": overall === "FAIR",
        "border-red-200 bg-red-50": overall === "POOR",
      })}
    >
      {/* Header with overall status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ReadinessIcon level={overall} />
          <div>
            <div className="font-medium text-gray-900">
              Pose Readiness: {overall}
            </div>
            <div className="text-sm text-gray-600">Score: {score}/100</div>
          </div>
        </div>

        {canProceed && (
          <div className="flex items-center space-x-1 text-green-600 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            <span>Ready to start</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={cn("h-2 rounded-full transition-all duration-300", {
            "bg-green-500": score >= 85,
            "bg-blue-500": score >= 70 && score < 85,
            "bg-yellow-500": score >= 55 && score < 70,
            "bg-orange-500": score >= 35 && score < 55,
            "bg-red-500": score < 35,
          })}
          style={{ width: `${Math.max(5, score)}%` }}
        />
      </div>

      {/* Main feedback */}
      <div className="text-gray-700">{feedback}</div>

      {/* Issues breakdown */}
      {issues.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-900">
            Areas to improve:
          </div>
          <div className="space-y-1">
            {issues.slice(0, 3).map((issue, index) => (
              <IssueItem key={index} issue={issue} />
            ))}
            {issues.length > 3 && (
              <div className="text-xs text-gray-500">
                +{issues.length - 3} more issues
              </div>
            )}
          </div>
        </div>
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
