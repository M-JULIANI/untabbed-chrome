import chroma from "chroma-js";

export const generateGradientColors = (numItems: number): string[] => {
  const colors = [
    "#2196f3", // Blue
    "#4fc3f7", // Light Blue
    "#81c784", // Light Green
    "#66bb6a", // Green
    "#ffeb3b", // Yellow
    "#ffa726", // Orange
    "#ff7043", // Light Red
    "#f44336", // Red
    "#ba68c8", // Light Purple
    "#9c27b0", // Purple
  ];

  return chroma.scale(colors).mode("lab").colors(numItems);
};
export const COLOR_MAP = {
  Entertainment: "#FFB399",
  General: "#FFD1B3",
  Technology: "#E6B3CC",
  Education: "#B399FF",
  Books: "#99B3FF",
  News: "#99D6FF",
  Creativity: "#B3FFD9",
  Business: "#FFFFB3",
  "How-To": "#FFD699",
  "Q&A": "#FFB366",
  Community: "#FF8533",
  Writing: "#D1B3E6",
};
export const SIDE_GUTTER = 200;

export const INDEXDB_NAME = "untabbedDB";
export const INDEXDB_STORE = "textStore";
export const DB_VERSION = 2;
export const TAB_DELTA_ALLOWED = 10;
export const DEFAULT_RADIUS = 250;

export const MAX_BUCKETS = 10;

export const bucket_prefix = "untabbed-buckets";
export const todo_prefix = "untabbed-todo";
export const tabs_prefix = "untabbed-tabs";
