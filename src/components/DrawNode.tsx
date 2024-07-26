import { useCallback, useEffect, useRef, useState } from "react";
import defaultFavicon from './favicon.svg';
import { Graphics, Sprite, Stage } from '@pixi/react';
import { PartialNodeInfo } from "@/lib/types";

export type DrawNodeProps = {
    partialNodeInfo: PartialNodeInfo;
    hovered: string;
    colorMap?: any;
    minLastAccessed: number;
    maxLastAccessed: number;
};


export const DrawNode = ({ nodeInfo, colorMap, hovered }: { nodeInfo: PartialNodeInfo, colorMap?: any, hovered: string }) => {
    const { x, y, favIconUrl, id, radius, originalX, originalY } = nodeInfo;
    const [imageUrl, setImageUrl] = useState(favIconUrl || defaultFavicon);
    const [animatedRadius, setAnimatedRadius] = useState(radius);
    const [animatedPosition, setAnimatedPosition] = useState({ x: originalX || x, y: originalY || y });
    const draw = useCallback((g: any) => {
        g.clear();


        if(hovered === id){
            g.lineStyle(8, 'white', 1);
        }
        else{
            g.lineStyle(4, 'white', 1);
        }

        g.beginFill('#E9E9E9');
        g.drawCircle(animatedPosition.x, animatedPosition.y, animatedRadius);
        g.endFill();


    }, [animatedPosition, hovered, animatedRadius]);

    //animate on-hover
    useEffect(() => {
        let animationFrameId: number | null = null;
        let growing = true;
        const animate = () => {
            setAnimatedRadius((prevRadius) => {
                if (prevRadius >= radius + 5) growing = false;
                else if (prevRadius <= radius) growing = true;

                return growing ? prevRadius + 0.1 : prevRadius - 0.1;
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        if (hovered === id) {
            animate();
        } else {
            setAnimatedRadius(radius);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [hovered, radius]);

    //animate on-load
    useEffect(() => {
        let animationFrameId: number | null = null;

        const animatePosition = () => {
            setAnimatedPosition(prevPosition => {
                const deltaX = x - prevPosition.x;
                const deltaY = y - prevPosition.y;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                if (distance < 0.5) {
                    return { x, y }; // Close enough to target
                } else {
                    return {
                        x: prevPosition.x + deltaX * 0.05, // Move 10% closer to the target
                        y: prevPosition.y + deltaY * 0.05,
                    };
                }
            });

            animationFrameId = requestAnimationFrame(animatePosition);
        };

        animatePosition();

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [x, y]);


    useEffect(() => {
        // Function to check image availability
        const checkImage = async (url: string) => {
            try {
                const response = await fetch(url, { method: 'HEAD' });
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

    return (
        <>
            <Graphics draw={draw} />
            <Sprite
                image={imageUrl}
                anchor={0.5}
                x={animatedPosition.x}
                y={animatedPosition.y}
                width={radius}
                height={radius}
            />
        </>
    );
}