import { useState, useEffect } from "react";
import { Exercise } from "@/lib/types";

interface PersonalRecord {
  exercise: Exercise;
  maxReps: number;
  bestFormScore: number;
  bestJumpHeight?: number; // Only applies to jumps
  date: string;
}

interface PersonalRecordsData {
  [key: string]: PersonalRecord;
}

export const usePersonalRecords = () => {
  const [records, setRecords] = useState<PersonalRecordsData>({});

  // Load records from localStorage on mount
  useEffect(() => {
    const savedRecords = localStorage.getItem('personalRecords');
    if (savedRecords) {
      try {
        setRecords(JSON.parse(savedRecords));
      } catch (e) {
        console.error('Error loading personal records:', e);
      }
    }
  }, []);

  // Save records to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('personalRecords', JSON.stringify(records));
  }, [records]);

  const updatePersonalRecord = (exercise: Exercise, reps: number, formScore: number, jumpHeight?: number) => {
    const key = `${exercise}`;
    const currentRecord = records[key];
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    let hasNewRepRecord = false;
    let hasNewFormRecord = false;
    let hasNewJumpRecord = false;

    // Create or update the record
    const newRecord: PersonalRecord = {
      exercise,
      maxReps: Math.max(currentRecord?.maxReps || 0, reps),
      bestFormScore: Math.max(currentRecord?.bestFormScore || 0, formScore),
      date: today, // Update date to today when record is set
    };

    // Check if we have a new record in any category
    if (!currentRecord || reps > (currentRecord.maxReps || 0)) {
      hasNewRepRecord = true;
      newRecord.maxReps = reps;
    } else {
      newRecord.maxReps = currentRecord.maxReps;
    }

    if (!currentRecord || formScore > (currentRecord.bestFormScore || 0)) {
      hasNewFormRecord = true;
      newRecord.bestFormScore = formScore;
    } else {
      newRecord.bestFormScore = currentRecord.bestFormScore;
    }

    // Handle jump-specific record
    if (exercise === 'jumps' && jumpHeight !== undefined) {
      newRecord.bestJumpHeight = Math.max(currentRecord?.bestJumpHeight || 0, jumpHeight);
      if (!currentRecord || jumpHeight > (currentRecord.bestJumpHeight || 0)) {
        hasNewJumpRecord = true;
        newRecord.bestJumpHeight = jumpHeight;
      } else if (currentRecord.bestJumpHeight !== undefined) {
        newRecord.bestJumpHeight = currentRecord.bestJumpHeight;
      }
    }

    setRecords(prev => ({
      ...prev,
      [key]: newRecord
    }));

    return {
      hasNewRepRecord,
      hasNewFormRecord,
      hasNewJumpRecord,
      newRecord
    };
  };

  const getPersonalRecord = (exercise: Exercise) => {
    return records[`${exercise}`] || null;
  };

  const getAllRecords = () => {
    return records;
  };

  // Get the best values for comparison without creating a new record
  const getBestReps = (exercise: Exercise) => {
    return records[`${exercise}`]?.maxReps || 0;
  };

  const getBestFormScore = (exercise: Exercise) => {
    return records[`${exercise}`]?.bestFormScore || 0;
  };

  const getBestJumpHeight = (exercise: Exercise) => {
    if (exercise !== 'jumps') return 0;
    return records[`${exercise}`]?.bestJumpHeight || 0;
  };

  return {
    records,
    updatePersonalRecord,
    getPersonalRecord,
    getAllRecords,
    getBestReps,
    getBestFormScore,
    getBestJumpHeight
  };
};