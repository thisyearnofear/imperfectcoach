import { useState, useEffect } from "react";
import { Exercise } from "@/lib/types";
import { getUserProfile, updateUserProfile } from "@/lib/dynamodb-client";
import { useAccount } from "wagmi";

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
  const [isLoading, setIsLoading] = useState(true);
  const { address } = useAccount();

  // Load records from DynamoDB (or localStorage fallback) on mount
  useEffect(() => {
    const loadRecords = async () => {
      if (!address) {
        // Not connected - load from localStorage as fallback
        const savedRecords = localStorage.getItem('personalRecords');
        if (savedRecords) {
          try {
            setRecords(JSON.parse(savedRecords));
          } catch (e) {
            console.error('Error loading personal records:', e);
          }
        }
        setIsLoading(false);
        return;
      }

      try {
        // Load from DynamoDB
        const profile = await getUserProfile(address);

        if (profile?.personalRecords) {
          setRecords(profile.personalRecords);
        } else {
          // Migrate from localStorage if exists
          const savedRecords = localStorage.getItem('personalRecords');
          if (savedRecords) {
            const localRecords = JSON.parse(savedRecords);
            setRecords(localRecords);
            // Save to DynamoDB
            await updateUserProfile(address, { personalRecords: localRecords });
            console.log("✅ Migrated personal records to DynamoDB");
          }
        }
      } catch (error) {
        console.error("Failed to load personal records from DynamoDB:", error);
        // Fallback to localStorage
        const savedRecords = localStorage.getItem('personalRecords');
        if (savedRecords) {
          try {
            setRecords(JSON.parse(savedRecords));
          } catch (e) {
            console.error('Error loading personal records:', e);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadRecords();
  }, [address]);

  // Save records to DynamoDB (and localStorage as backup) whenever they change
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load

    // Always save to localStorage as backup
    localStorage.setItem('personalRecords', JSON.stringify(records));

    // Save to DynamoDB if connected
    if (address) {
      updateUserProfile(address, { personalRecords: records }).catch(error => {
        console.error("Failed to save personal records to DynamoDB:", error);
      });
    }
  }, [records, address, isLoading]);

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
    getBestJumpHeight,
    isLoading,
  };
};