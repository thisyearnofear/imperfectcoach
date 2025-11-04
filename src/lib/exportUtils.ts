
import * as htmlToImage from "html-to-image";
import { toast } from "sonner";
import { RepData, Exercise } from "@/lib/types";
import React from "react";

const dataUrlToFile = async (dataUrl: string, fileName: string): Promise<File | null> => {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], fileName, { type: blob.type });
  } catch (error) {
    console.error("Error converting data URL to file:", error);
    return null;
  }
};

export const exportToCSV = (repHistory: RepData[]) => {
  let csvContent = "data:text/csv;charset=utf-8,Rep,Score,Timestamp\n";
  repHistory.forEach((rep, index) => {
    csvContent += `${index + 1},${rep.score.toFixed(0)},${new Date(
      rep.timestamp
    ).toISOString()}\n`;
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "session_analytics.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generates and shares a workout summary card
 * @param cardRef Reference to the card element to capture
 * @param exercise Type of exercise performed
 * @param totalReps Total repetitions completed
 * @param averageFormScore Average form score percentage
 * @param platform Optional platform parameter to customize sharing
 */
export const shareCardImage = async (
  cardRef: React.RefObject<HTMLDivElement>,
  exercise: Exercise,
  totalReps: number,
  averageFormScore: number,
  platform?: 'twitter' | 'farcaster' | 'general'
) => {
  if (cardRef.current === null) {
    toast.error("Component not ready, please wait.");
    return;
  }

  toast.info("Generating summary card...");

  try {
    // Capture image with appropriate sizing for social sharing
    const dataUrl = await htmlToImage.toPng(cardRef.current, {
      cacheBust: true,
      backgroundColor: 'hsl(224 71.4% 4.1%)',
      pixelRatio: 2, // Higher resolution for better social media display
      width: cardRef.current.clientWidth * 2,
      height: cardRef.current.clientHeight * 2,
    });

    const fileName = `workout-summary-${new Date().toISOString().slice(0, 10)}.png`;
    const file = await dataUrlToFile(dataUrl, fileName);

    if (!file) {
      toast.error("Failed to create image file for sharing.");
      return;
    }

    const exerciseName = exercise.charAt(0).toUpperCase() + exercise.slice(1).replace('-', ' ');

    // Customize share text based on platform
    let shareText = '';
    switch(platform) {
      case 'twitter':
        shareText = `Just crushed ${totalReps} ${exerciseName} with ${averageFormScore.toFixed(0)}% form accuracy using @imperfectcoach! 💪 #FitAI #WorkoutChallenge`;
        break;
      case 'farcaster':
        shareText = `Just crushed ${totalReps} ${exerciseName} with ${averageFormScore.toFixed(0)}% form accuracy using Imperfect Coach! \n\n💪 #FitAI #WorkoutChallenge`;
        break;
      default:
        shareText = `I just completed a workout on Fit AI! Total Reps: ${totalReps}, Avg. Form: ${averageFormScore.toFixed(0)}%. #FitAI #Workout`;
    }

    const shareData = {
      files: [file],
      title: `${exerciseName} Workout Summary`,
      text: shareText,
    };

    if (navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData);
    } else {
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Summary card downloaded! You can share it from your gallery.");
    }
  } catch (err) {
    console.error("Failed to share card:", err);
    toast.error("Oops! Something went wrong while creating your summary card.");
  }
};

/**
 * Generates a Twitter-specific share URL
 * @param exercise Type of exercise performed
 * @param totalReps Total repetitions completed
 * @param averageFormScore Average form score percentage
 * @param customMessage Optional custom message to include
 */
export const shareToTwitter = (
  exercise: Exercise,
  totalReps: number,
  averageFormScore: number,
  customMessage?: string
) => {
  const exerciseName = exercise.charAt(0).toUpperCase() + exercise.slice(1).replace('-', ' ');
  const defaultMessage = `Just crushed ${totalReps} ${exerciseName} with ${averageFormScore.toFixed(0)}% form accuracy using @imperfectcoach! 💪`;
  const message = customMessage || defaultMessage;
  
  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message);
  const hashtag = encodeURIComponent('#FitAI #WorkoutChallenge');
  const url = `https://twitter.com/intent/tweet?text=${encodedMessage}&hashtags=${hashtag}`;
  
  // Open Twitter share dialog
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Generates a Farcaster cast share URL
 * @param exercise Type of exercise performed
 * @param totalReps Total repetitions completed
 * @param averageFormScore Average form score percentage
 * @param customMessage Optional custom message to include
 */
export const shareToFarcaster = (
  exercise: Exercise,
  totalReps: number,
  averageFormScore: number,
  customMessage?: string
) => {
  const exerciseName = exercise.charAt(0).toUpperCase() + exercise.slice(1).replace('-', ' ');
  const defaultMessage = `Just crushed ${totalReps} ${exerciseName} with ${averageFormScore.toFixed(0)}% form accuracy using Imperfect Coach!\n\n💪 #FitAI #WorkoutChallenge`;
  const message = customMessage || defaultMessage;
  
  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message);
  const url = `https://warpcast.com/~/compose?text=${encodedMessage}`;
  
  // Open Farcaster share dialog
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Generates a Farcaster Mini App share URL
 * @param exercise Type of exercise performed
 * @param totalReps Total repetitions completed
 * @param averageFormScore Average form score percentage
 * @param customMessage Optional custom message to include
 */
export const shareToMiniApp = (
  exercise: Exercise,
  totalReps: number,
  averageFormScore: number,
  customMessage?: string
): string => {
  const exerciseName = exercise.charAt(0).toUpperCase() + exercise.slice(1).replace('-', ' ');
  
  // Create the Mini App URL with workout data as query parameters
  const queryParams = new URLSearchParams({
    exercise: exerciseName,
    reps: totalReps.toString(),
    formScore: averageFormScore.toFixed(0),
    timestamp: new Date().toISOString(),
    ...(customMessage && { message: customMessage })
  });
  
  // This would be the URL to the Mini App route
  const miniAppUrl = `${window.location.origin}/miniapp/workout-share?${queryParams.toString()}`;
  
  // Return the URL that can be shared in a cast
  return miniAppUrl;
};

export const exportChartImage = (chartRef: React.RefObject<HTMLDivElement>) => {
  if (chartRef.current === null) {
    return;
  }

  htmlToImage.toPng(chartRef.current, { cacheBust: true, backgroundColor: 'hsl(240 10% 3.9%)' })
    .then((dataUrl) => {
      const link = document.createElement('a');
      link.download = `form-score-trend-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    })
    .catch((err) => {
      console.error(err);
      toast.error("Failed to export chart.");
    });
};
