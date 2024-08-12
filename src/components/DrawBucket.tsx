import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import defaultFavicon from "./favicon.svg";
import { Graphics, Sprite, Stage, Text } from "@pixi/react";
import { BucketInfo, PartialNodeInfo } from "@/lib/types";
import * as PIXI from "pixi.js";
import { DrawNodeNoAnimation } from "./DrawNodeNoAnimation";
import { useHovered } from "@/contexts/HoveredContext";

export const DrawBucket = ({ bucketInfo, color, delay }: { bucketInfo: BucketInfo; color: string; delay: number }) => {
  const { x, y, id, title, radius, children } = bucketInfo;
  const [currentRadius, setCurrentRadius] = useState(radius);
  const [decreasing, setDecreasing] = useState(true);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const startAnimation = () => {
      const animate = () => {
        setCurrentRadius((prevRadius) => {
          if (decreasing) {
            if (prevRadius > radius - radius * 0.15) {
              return prevRadius - 0.01;
            } else {
              setDecreasing(false);
              return prevRadius + 0.01;
            }
          } else {
            if (prevRadius < radius) {
              return prevRadius + 0.01;
            } else {
              setDecreasing(true);
              return prevRadius - 0.01;
            }
          }
        });

        animationFrameId.current = requestAnimationFrame(animate);
      };

      animate();
    };

    const timeoutId = setTimeout(startAnimation, delay);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [radius, decreasing, delay]);

  const draw = useCallback(
    (g: any) => {
      g.clear();

      g.lineStyle(6, color, 1);
      g.beginFill("#E9E9E9");
      g.drawCircle(x, y, currentRadius);
      g.endFill();
    },
    [x, y, currentRadius, color],
  );

  return (
    <>
      <Graphics draw={draw} />
      {children.map((child: PartialNodeInfo, i) => (
        <DrawNodeNoAnimation key={i} nodeInfo={child} />
      ))}
    </>
  );
};
