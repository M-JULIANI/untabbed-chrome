import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { hierarchy, treemap, treemapResquarify } from "d3-hierarchy";
import { BucketInfo, PartialNodeInfo } from "@/lib/types";
import { DrawBucket } from "./DrawBucket";

export const DrawBuckets = ({
  buckets,
  // colorMap,
  hovered,
}: {
  buckets: BucketInfo[];
  // colorMap?: any;
  hovered: string;
}) => {
  if (buckets == null || buckets?.length < 2) {
    return null;
  }

  // console.log("converting to tree");
  // console.log(buckets);
  return (
    <>
      {buckets.map((bucket) => (
        <DrawBucket key={bucket.id} nodeInfo={bucket} hovered={hovered} />
      ))}
    </>
  );
};

// type Node = {
//   name: string;
//   value: number;
//   urls: string[];
//   children: Node[];
// };

// const convertToTree = (buckets: Bucket[]): Node => {
//   if (buckets.length === 0) {
//     return {
//       name: "root",
//       value: 0,
//       urls: [],
//       children: [],
//     };
//   }

//   const root: Node = {
//     name: "root",
//     value: 0,
//     urls: [],
//     children: [],
//   };

//   let currentNode = root;

//   buckets?.forEach((bucket) => {
//     const node: Node = {
//       name: bucket.name,
//       value: bucket.children.length,
//       urls: bucket.children,
//       children: [],
//     };
//     currentNode.children.push(node);
//     currentNode = node;
//   });

//   return root;
// };
