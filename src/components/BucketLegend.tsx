import { useState } from "react";
import { Button } from "./ui/button";

export const BucketLegend = ({ categories, legendColors }: { categories: string[]; legendColors: string[] }) => {
  const [legendVisible, setLegendVisible] = useState(false);
  // Check if categories and colors arrays are of the same length
  if (categories.length !== legendColors.length) {
    console.error("Categories and colors arrays must be of the same length.");
    return null;
  }

  return (
    <div className="bg-white bg-opacity-90 flex flex-col items-end gap-2 rounded-lg shadow-lg">
      <Button
        className="outline-menu"
        variant={legendVisible ? "outline" : "secondary"}
        onClick={() => setLegendVisible(!legendVisible)}
      >
        <div className="text-sm w-20">Legend</div>
      </Button>
      {legendVisible && (
        <div className="flex flex-col gap-2 p-2 justify-between items-center w-full">
          {categories.map((category, index) => {
            const color = legendColors[index];
            if (!color) {
              console.error(`No color found for category: ${category}`);
              return null;
            }

            return (
              <div className="flex flex-row items-center justify-between px-1 space-x-1" style={{ width: "100px" }}>
                <div className="w-2 h-2 rounded-full px-2" style={{ backgroundColor: color }}></div>
                <span
                  className="text-xxs break-words overflow-hidden text-ellipsis px-2 text-right"
                  style={{ fontSize: "8px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                >
                  {category.trim()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
