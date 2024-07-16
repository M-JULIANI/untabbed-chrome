import { DropShadowFilter } from "@pixi/filter-drop-shadow";
import { useCallback, useEffect, useRef, useState } from "react";
import defaultFavicon from './favicon.svg';
import { Graphics, Sprite, Stage } from '@pixi/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

export const DrawNode = ({ radius, nodeInfo, colorMap, hovered }: { radius: number, nodeInfo: any, colorMap?: any, hovered: string }) => {
    const { x, y, schema } = nodeInfo;
    const [imageUrl, setImageUrl] = useState(schema?.favIconUrl || defaultFavicon);
    const [animatedRadius, setAnimatedRadius] = useState(radius);
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

        if(hovered === schema?.id){
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

        if (hovered === schema?.id) {
            animate();
        } else {
            setAnimatedRadius(radius);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [hovered, radius]);


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
        checkImage(schema?.favIconUrl || defaultFavicon);
    }, [schema?.favIconUrl]);

    return (
        <>
            <Graphics draw={draw} />
            <Sprite
                image={imageUrl}
                anchor={0.5}
                x={x}
                y={y}
                width={radius * 1}
                height={radius * 1}
            />
        </>
    );
}