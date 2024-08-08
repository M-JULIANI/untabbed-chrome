import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import defaultFavicon from "./favicon.svg";
import { Graphics, Sprite, Stage, Text } from "@pixi/react";
import { BucketInfo, PartialNodeInfo } from "@/lib/types";
import * as PIXI from "pixi.js";
import { DrawNodeNoAnimation } from "./DrawNodeNoAnimation";

export const DrawBucket = ({
  bucketInfo,
  colorMap,
  hovered,
}: {
  bucketInfo: BucketInfo;
  colorMap?: any;
  hovered: string;
}) => {
  const { x, y, id, title, radius } = bucketInfo;
  const draw = useCallback(
    (g: any) => {
      g.clear();

      if (hovered === id) {
        g.lineStyle(8, "white", 1);
      } else {
        g.lineStyle(4, "white", 1);
      }

      g.beginFill("#E9E9E9");
      g.drawCircle(x, y, radius);
      g.endFill();
    },
    [x, y, hovered, radius],
  );

  // console.log({radius})

  const safeguarded_rad = radius || 14;

  const drawTranslucentFill = useCallback(
    (g: any) => {
      g.clear();

      // Set the fill color with alpha for translucency
      g.beginFill(0x000000, 0.5); // Black color with 50% opacity

      // Draw a circle with the same dimensions as the sprite
      g.drawCircle(x, y, safeguarded_rad);

      g.endFill();
      const tabCount = `${bucketInfo.children.length} tabs`;

      const maxFontSize = 40;
      const baseFontSize = 24;
      const text = new PIXI.Text(`${title}\n${tabCount}`, {
        fontFamily: "Inter",
        fontSize: baseFontSize, // Increase the font size for better resolution
        align: "center",
        strokeThickness: 0.5, // Outline thickness
        //@ts-ignore
        resolution: 2, // Increase the resolution for better quality
        fill: "black", // Set the fill color to white for better contrast
        stroke: "black", // Set the stroke color to black for better outline
      });
      // Calculate the desired width based on the radius
      const padding = 10; // Padding around the text
      const desiredWidth = radius * 2;
      const desiredTextWidth = desiredWidth - padding * 2;

      // Calculate the dimensions of the text
      const textWidth = text.width;
      const textHeight = text.height;

      // Scale the text to fit within the desired width
      const scale = desiredTextWidth / textWidth;
      const scaledFontSize = Math.min(baseFontSize * scale, maxFontSize);
      text.style.fontSize = scaledFontSize;
      // text.scale.set(scale, scale);

      // Recalculate the dimensions of the scaled text
      const scaledTextWidth = textWidth * scale;
      const scaledTextHeight = textHeight * scale;

      text.style.strokeThickness = 0.5;
      // text.style.fontSize = scale;

      const pillWidth = scaledTextWidth + padding * 2;
      const pillHeight = scaledTextHeight + padding;
      // Draw the pill-shaped background
      g.beginFill(0xffffff); // Background color
      g.drawRoundedRect(
        x - pillWidth / 2,
        y - pillHeight / 2,
        pillWidth,
        pillHeight,
        pillHeight / 2, // Radius for rounded corners
      );
      g.endFill();

      // Position the text on top of the pill background
      text.x = x - scaledTextWidth / 2;
      text.y = y - scaledTextHeight / 2;
      g.addChild(text);
    },
    [x, y, safeguarded_rad],
  );

  return (
    <>
      <Graphics draw={draw} />
      {bucketInfo.children.map((child: PartialNodeInfo, i) => (
        <DrawNodeNoAnimation key={i} nodeInfo={child} hovered={hovered} />
      ))}
      {hovered !== id && (
        <>
          <Graphics draw={drawTranslucentFill} />
        </>
      )}
    </>
  );
};
