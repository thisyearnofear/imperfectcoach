import React, { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async'; // You might need to install this

// Define types for workout data
type WorkoutData = {
  exercise: string;
  reps: number;
  formScore: number;
  duration?: string;
  timestamp?: string;
};

const WorkoutShareApp: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize the Mini App once data is ready
    const initApp = async () => {
      try {
        // Extract workout data from URL parameters
        const exercise = searchParams.get('exercise') || 'Workout';
        const reps = parseInt(searchParams.get('reps') || '0', 10);
        const formScore = parseInt(searchParams.get('formScore') || '0', 10);
        const duration = searchParams.get('duration') || '';
        const timestamp = searchParams.get('timestamp') || new Date().toISOString();

        setWorkoutData({
          exercise,
          reps,
          formScore,
          duration,
          timestamp
        });

        // Hide splash screen once app is ready
        await sdk.actions.ready();
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing Mini App:', err);
        setError('Failed to load workout data');
        setIsLoading(false);
      }
    };

    initApp();
  }, [searchParams]);

  // Generate dynamic meta tags for Farcaster Mini App embed
  const generateMiniAppMeta = () => {
    if (!workoutData) return null;
    
    const message = `Just crushed ${workoutData.reps} ${workoutData.exercise} with ${workoutData.formScore}% form accuracy using Imperfect Coach! 💪`;
    const imageUrl = `https://imperfectcoach.xyz/api/og?exercise=${encodeURIComponent(workoutData.exercise)}&reps=${workoutData.reps}&formScore=${workoutData.formScore}`;
    
    const miniAppEmbed = {
      version: "1",
      imageUrl: imageUrl,
      button: {
        title: "View Workout",
        action: {
          type: "launch_miniapp",
          name: "Imperfect Coach",
          url: window.location.href,
          splashImageUrl: "https://imperfectcoach.xyz/icon.png",
          splashBackgroundColor: "#000000"
        }
      }
    };

    return JSON.stringify(miniAppEmbed);
  };

  const handleShareToCast = async () => {
    try {
      const message = `Just crushed ${workoutData?.reps} ${workoutData?.exercise} with ${workoutData?.formScore}% form accuracy using Imperfect Coach! 💪 #FitAI #WorkoutChallenge`;
      
      await sdk.actions.composeCast({
        text: message,
        embeds: [`https://imperfectcoach.xyz/workout/${workoutData?.reps}-${workoutData?.exercise}`],
      });
    } catch (err) {
      console.error('Error sharing to cast:', err);
      alert('Failed to share workout. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-white">Loading your workout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center p-6 bg-gray-800 rounded-lg max-w-sm">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <meta name="fc:miniapp" content={generateMiniAppMeta() || ''} />
        <meta name="fc:frame" content={generateMiniAppMeta() || ''} />
        <meta property="og:title" content={`Workout Summary - Imperfect Coach`} />
        <meta property="og:description" content={`Just crushed ${workoutData?.reps} ${workoutData?.exercise} with ${workoutData?.formScore}% form accuracy!`} />
        <meta property="og:image" content={`https://imperfectcoach.xyz/api/og?exercise=${workoutData?.exercise || 'workout'}&reps=${workoutData?.reps || 0}&formScore=${workoutData?.formScore || 0}`} />
        <title>Workout Summary - Imperfect Coach</title>
      </Helmet>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-700">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🏋️</div>
          <h1 className="text-2xl font-bold">Imperfect Coach</h1>
          <p className="text-gray-400 mt-1">AI Fitness Form Analysis</p>
        </div>

        {workoutData && (
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
              <span className="text-gray-300">Exercise</span>
              <span className="font-bold text-lg capitalize">{workoutData.exercise}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
              <span className="text-gray-300">Reps</span>
              <span className="font-bold text-lg text-green-400">{workoutData.reps}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
              <span className="text-gray-300">Form Score</span>
              <span className="font-bold text-lg text-blue-400">{workoutData.formScore}%</span>
            </div>
            
            {workoutData.duration && (
              <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                <span className="text-gray-300">Duration</span>
                <span className="font-bold text-lg">{workoutData.duration}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleShareToCast}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <span>Share to Cast</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12l16-8-8 14H4z"/>
            </svg>
          </button>
          
          <button
            onClick={() => sdk.actions.openUrl('https://imperfectcoach.xyz')}
            className="w-full py-3 bg-gray-700 rounded-lg font-bold hover:bg-gray-600 transition-colors"
          >
            Open App
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-700 text-center text-sm text-gray-400">
          <p>Track your fitness journey with AI coaching</p>
        </div>
      </div>
    </div>
    </>
  );
};

export default WorkoutShareApp;