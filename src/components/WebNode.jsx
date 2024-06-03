import { Graphics, Text} from "@pixi/react";
import { useCallback } from "react";
import { TextStyle } from 'pixi.js'
// import { DrawNode } from "../draw";


// export type WebNodeProps = {
//     radius: number;
//     nodeInfo: DrawNode
// }
const colorMap = {
    "Entertainment": "#FFB399",
    "General": "#FFD1B3",
    "Technology": "#E6B3CC",
    "Education": "#B399FF",
    "Books": "#99B3FF",
    "News": "#99D6FF",
    "Creativity": "#B3FFD9",
    "Business": "#FFFFB3",
    "How To": "#FFD699",
    "Q&A": "#FFB366",
    "Community": "#FF8533",
    "Writing": "#D1B3E6"
};

export const WebNode = ({ radius, nodeInfo }) => {
  const {x, y, schema} = nodeInfo;
  console.log('logging...')
  const draw = useCallback((g) => {
    g.clear();
    g.beginFill(colorMap[schema.category]); // Example color, change as needed
    g.drawCircle(x, y, radius);
    g.endFill();
 }, [x, y, radius]);

    return (
    <>
    <Graphics draw={draw}/>
    <Text text={schema.title || "NADA"} x={x} y={y} anchor={0.5}
    // style={ new TextStyle({
    //       align: 'center',
    //       fontFamily: '"Source Sans Pro", Helvetica, sans-serif',
    //       fontSize: 50,
    //       fontWeight: '400',
    //       fill: ['#ffffff', '#00ff99'], // gradient
    //       stroke: '#01d27e',
    //        strokeThickness: 5,
    //     //   letterSpacing: 20,
    //     //   dropShadow: true,
    //     //   dropShadowColor: '#ccced2',
    //     //   dropShadowBlur: 4,
    //     //   dropShadowAngle: Math.PI / 6,
    //     //   dropShadowDistance: 6,
    //     //   wordWrap: true,
    //     //   wordWrapWidth: 440,
    //     })
    //   }
      />
    </>
    );
}