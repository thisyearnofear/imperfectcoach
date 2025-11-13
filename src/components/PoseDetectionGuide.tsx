import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Exercise } from "@/lib/types";

interface PoseDetectionGuideProps {
  exercise?: Exercise;
}

const PoseDetectionGuide: React.FC<PoseDetectionGuideProps> = ({ exercise }) => {
  const signals = [
    {
      type: "Screen Flash",
      color: "bg-red-500",
      description: "Red flash when poor form detected",
      icon: "📸",
    },
    {
      type: "Landmarks",
      color: "bg-yellow-400",
      description: "Yellow dots show detected body points",
      icon: "📍",
    },
    {
      type: "Ready State",
      color: "bg-green-500",
      description: "Green indicates good starting position",
      icon: "✅",
    },
    {
      type: "Rep Count",
      color: "bg-blue-500",
      description: "Blue pulse when rep is counted",
      icon: "🔄",
    },
  ];

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="text-2xl">👁️</span>
          Visual Signals Guide
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Watch for these visual cues during your workout:
        </p>

        {/* Desktop: Horizontal layout for landscape format */}
        <div className="hidden lg:grid lg:grid-cols-4 lg:gap-4">
          {signals.map((signal, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{signal.icon}</span>
                <div
                  className={`w-3 h-3 rounded-full ${signal.color} flex-shrink-0`}
                />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {signal.type}
                </div>
                <div className="text-xs text-gray-500 leading-tight">
                  {signal.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: Vertical layout */}
        <div className="lg:hidden space-y-3">
          {signals.map((signal, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{signal.icon}</span>
                <div
                  className={`w-3 h-3 rounded-full ${signal.color} flex-shrink-0`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  {signal.type}
                </div>
                <div className="text-xs text-gray-500 leading-tight">
                  {signal.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-3 mt-4 space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>💡</span>
            <span>
              Keep your whole body visible in the frame for best results
            </span>
          </div>
          
          {exercise && (
            <div className="text-center space-y-1">
              <div className="text-xs font-medium text-primary">
                {exercise === 'pull-ups' ? '🏋️ Pull-ups requires:' : '🦘 Jumps requires:'}
              </div>
              <div className="text-xs text-muted-foreground">
                {exercise === 'pull-ups' 
                  ? 'Head, hands, elbows, shoulders, hips, knees, feet (13 points)'
                  : 'Shoulders, hips, knees, ankles (8 points)'}
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-500 italic">
                {exercise === 'pull-ups' 
                  ? 'Tip: Side or 45° angle works best'
                  : 'Tip: Camera at eye level, 6-8 feet away'}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PoseDetectionGuide;
