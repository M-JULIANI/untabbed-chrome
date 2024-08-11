import { useCallback, useEffect, useRef, useState } from "react";
import defaultFavicon from "./favicon.svg";
import { Graphics, Sprite, Stage } from "@pixi/react";
import { PartialNodeInfo } from "@/lib/types";

// export type DrawNodeProps = {
//   partialNodeInfo: PartialNodeInfo | BucketInfo;
//   hovered: string;
//   colorMap?: any;
//   minLastAccessed: number;
//   maxLastAccessed: number;
// };

export const DrawNodeNoAnimation = ({ nodeInfo }: { nodeInfo: PartialNodeInfo; colorMap?: any }) => {
  const { x, y, id, radius, favIconUrl } = nodeInfo;
  const [imageUrl, setImageUrl] = useState(favIconUrl || defaultFavicon);
  //   const [animatedRadius, setAnimatedRadius] = useState(radius);
  //   const [animatedPosition, setAnimatedPosition] = useState({ x: originalX || x, y: originalY || y });
  const draw = useCallback(
    (g: any) => {
      g.clear();

      g.lineStyle(4, "white", 1);

      g.beginFill("#E9E9E9");
      g.drawCircle(x, y, radius);
      g.endFill();
    },
    [x, y, radius],
  );

  useEffect(() => {
    // Function to check image availability
    const checkImage = async (url: string) => {
      try {
        const response = await fetch(url, { method: "HEAD" });
        if (response.ok) {
          // If the image is available, set it
          setImageUrl(url);
        } else {
          // If the image is not available, fallback to the default image
          setImageUrl(defaultFavicon);
        }
      } catch (error) {
        // Handle errors (e.g., network issues) by falling back to the default image
        setImageUrl(defaultFavicon);
      }
    };

    // Call checkImage with the schema's favicon URL or the default image URL
    checkImage(favIconUrl || defaultFavicon);
  }, [favIconUrl]);

  // console.log({radius})

  const safeguarded_rad = radius || 14;

  return (
    <>
      <Graphics draw={draw} />
      <Sprite image={imageUrl} anchor={0.5} x={x} y={y} width={safeguarded_rad} height={safeguarded_rad} />
    </>
  );
};
