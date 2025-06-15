
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

export const shareCardImage = async (
  cardRef: React.RefObject<HTMLDivElement>,
  exercise: Exercise,
  totalReps: number,
  averageFormScore: number
) => {
  if (cardRef.current === null) {
    toast.error("Component not ready, please wait.");
    return;
  }

  toast.info("Generating summary card...");

  try {
    const dataUrl = await htmlToImage.toPng(cardRef.current, {
      cacheBust: true,
      backgroundColor: 'hsl(224 71.4% 4.1%)',
    });

    const fileName = `workout-summary-${new Date().toISOString().slice(0, 10)}.png`;
    const file = await dataUrlToFile(dataUrl, fileName);

    if (!file) {
      toast.error("Failed to create image file for sharing.");
      return;
    }

    const exerciseName = exercise.charAt(0).toUpperCase() + exercise.slice(1).replace('-', ' ');
    const shareData = {
      files: [file],
      title: `${exerciseName} Workout Summary`,
      text: `I just completed a workout on Fit AI! Total Reps: ${totalReps}, Avg. Form: ${averageFormScore.toFixed(0)}%. #FitAI #Workout`,
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
