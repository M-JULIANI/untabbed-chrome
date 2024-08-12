import React, { useEffect, useRef, Component, ErrorInfo, ReactNode } from "react";
import * as d3 from "d3";
import { hierarchy, treemap, treemapResquarify } from "d3-hierarchy";
import { BucketInfo, PartialNodeInfo } from "@/lib/types";
import { DrawBucket } from "./DrawBucket";
import { MAX_BUCKETS } from "@/lib/constants";

export const DrawBuckets = ({
  buckets,
  // colorMap,
  categoryColors,
  delays,
}: {
  buckets: BucketInfo[];
  // colorMap?: any;
  categoryColors: string[];
  delays: number[];
}) => {
  if (buckets == null || buckets?.length < 2) {
    return null;
  }

  const displayedBuckets = buckets.slice(0, Math.min(MAX_BUCKETS, buckets.length));

  return (
    <>
      {displayedBuckets.map((bucket, index) => (
        <DrawBucket key={bucket.id} bucketInfo={bucket} color={categoryColors[index]} delay={delays[index]} />
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
