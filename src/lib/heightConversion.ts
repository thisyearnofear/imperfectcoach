import { HeightUnit } from "./types";

// Base conversion: assume 1 pixel ≈ 0.5cm at typical camera distance
const PIXELS_TO_CM = 0.5;

export const convertHeight = (pixels: number, unit: HeightUnit): number => {
  const cm = pixels * PIXELS_TO_CM;

  switch (unit) {
    case "cm":
      return cm;
    case "meters":
      return cm / 100;
    case "inches":
      return cm / 2.54;
    case "feet":
      return cm / 30.48;
    default:
      return cm;
  }
};

export const formatHeight = (pixels: number, unit: HeightUnit): string => {
  const value = convertHeight(pixels, unit);

  switch (unit) {
    case "cm":
      return `${Math.round(value)}cm`;
    case "meters":
      return `${value.toFixed(2)}m`;
    case "inches":
      return `${value.toFixed(1)}"`;
    case "feet": {
      const feet = Math.floor(value);
      const inches = (value - feet) * 12;
      return feet > 0
        ? `${feet}'${inches.toFixed(1)}"`
        : `${inches.toFixed(1)}"`;
    }
    default:
      return `${Math.round(value)}cm`;
  }
};

export const getUnitLabel = (unit: HeightUnit): string => {
  switch (unit) {
    case "cm":
      return "Centimeters";
    case "meters":
      return "Meters";
    case "inches":
      return "Inches";
    case "feet":
      return "Feet & Inches";
    default:
      return "Centimeters";
  }
};

export const getUnitSymbol = (unit: HeightUnit): string => {
  switch (unit) {
    case "cm":
      return "cm";
    case "meters":
      return "m";
    case "inches":
      return '"';
    case "feet":
      return "ft";
    default:
      return "cm";
  }
};
