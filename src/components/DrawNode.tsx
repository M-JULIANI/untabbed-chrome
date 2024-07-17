import { DropShadowFilter } from "@pixi/filter-drop-shadow";
import { useCallback, useEffect, useRef, useState } from "react";
import defaultFavicon from './favicon.svg';
import { Graphics, Sprite, Stage } from '@pixi/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { remap } from "@/App";

export const DrawNode = ({ radius, nodeInfo, colorMap, hovered, minLastAccessed, maxLastAccesed }: { radius: number, nodeInfo: any, colorMap?: any, hovered: string, minLastAccessed: number, maxLastAccesed: number }) => {
    const { x, y, favIconUrl, id, lastAccessed } = nodeInfo;
    const remapped = remap(lastAccessed, minLastAccessed, maxLastAccesed, 0.5, 1.0);
    const [imageUrl, setImageUrl] = useState(favIconUrl || defaultFavicon);
    const scaledRadius = remapped * radius;
    const [animatedRadius, setAnimatedRadius] = useState(scaledRadius);
    const draw = useCallback((g: any) => {
        g.clear();
        // const dropShadow = new DropShadowFilter({
        //     blur: 3,
        //     quality: 10,
        //     distance: 5,
        //     rotation: 45,
        //     color: '#000000',
        //     alpha: 0.5,
        // });
        // g.filters = [dropShadow];

        if(hovered === id){
            g.lineStyle(8, 'white', 1);
        }
        else{
            g.lineStyle(4, 'white', 1);
        }

        // Begin drawing the circle
        // g.beginFill('#E9E9E9'); // Example color, change as needed
        // g.drawCircle(x, y, radius);
        // g.endFill();
        g.beginFill('#E9E9E9');
        g.drawCircle(x, y, animatedRadius);
        g.endFill();


    }, [x, y, hovered, animatedRadius]);

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
            setAnimatedRadius(scaledRadius);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [hovered, scaledRadius]);


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
                x={x}
                y={y}
                width={scaledRadius * 1}
                height={scaledRadius * 1}
            />
        </>
    );
}