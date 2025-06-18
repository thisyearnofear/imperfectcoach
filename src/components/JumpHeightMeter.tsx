
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { HeightUnit } from '@/lib/types';
import { formatHeight, convertHeight } from '@/lib/heightConversion';

interface JumpHeightMeterProps {
  currentHeight: number;
  personalBest: number;
  isAirborne: boolean;
  heightUnit: HeightUnit;
  className?: string;
}

const JumpHeightMeter: React.FC<JumpHeightMeterProps> = ({
  currentHeight,
  personalBest,
  isAirborne,
  heightUnit,
  className = ''
}) => {
  const maxDisplayHeight = Math.max(personalBest * 1.2, 100);
  const heightPercentage = Math.min((currentHeight / maxDisplayHeight) * 100, 100);
  const personalBestPercentage = (personalBest / maxDisplayHeight) * 100;

  const getHeightColor = (height: number) => {
    if (height >= 80) return 'bg-gradient-to-t from-purple-500 to-pink-500';
    if (height >= 60) return 'bg-gradient-to-t from-orange-500 to-yellow-500';
    if (height >= 40) return 'bg-gradient-to-t from-green-500 to-emerald-500';
    return 'bg-gradient-to-t from-blue-500 to-cyan-500';
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="text-sm font-semibold">Jump Height</div>
        <div className={`text-sm px-2 py-1 rounded-full transition-all duration-300 ${
          isAirborne 
            ? 'bg-green-100 text-green-800 animate-pulse' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {formatHeight(currentHeight, heightUnit)}
        </div>
      </div>
      
      <div className="relative h-32 w-6 bg-gray-200 rounded-full overflow-hidden">
        {/* Personal best marker */}
        {personalBest > 0 && (
          <div 
            className="absolute w-full h-0.5 bg-red-500 z-10"
            style={{ bottom: `${personalBestPercentage}%` }}
          >
            <div className="absolute -right-8 -top-2 text-xs text-red-600 font-semibold">
              PB
            </div>
          </div>
        )}
        
        {/* Current height bar */}
        <div 
          className={`absolute bottom-0 w-full transition-all duration-200 ${getHeightColor(currentHeight)} ${
            isAirborne ? 'animate-pulse' : ''
          }`}
          style={{ height: `${heightPercentage}%` }}
        />
        
        {/* Height markers */}
        {[25, 50, 75, 100].map(marker => {
          const markerPercentage = (marker / maxDisplayHeight) * 100;
          if (markerPercentage <= 100) {
            return (
              <div 
                key={marker}
                className="absolute w-full h-px bg-gray-400 opacity-50"
                style={{ bottom: `${markerPercentage}%` }}
              />
            );
          }
          return null;
        })}
      </div>
      
      <div className="text-xs text-center mt-1 text-gray-500">
        {formatHeight(maxDisplayHeight, heightUnit)} max
      </div>
    </div>
  );
};

export default JumpHeightMeter;
