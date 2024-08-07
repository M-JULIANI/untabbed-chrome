import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { hierarchy, treemap, treemapResquarify } from "d3-hierarchy";

type Bucket = {
  name: string;
  children: string[];
};
export const DrawBuckets = ({
  buckets,
  // colorMap,
  // hovered,
}: {
  buckets: Bucket[];
  // colorMap?: any;
  // hovered: string;
}) => {
  if (buckets == null || buckets?.length < 2) {
    return null;
  }
  console.log("converting to tree");
  console.log(buckets);
  const tree = convertToTree(buckets);
  console.log("tree: ");
  console.log(tree);
  return (
    <div>
      <TreeMap data={tree} />
    </div>
  );
};

type Node = {
  name: string;
  value: number;
  urls: string[];
  children: Node[];
};

const convertToTree = (buckets: Bucket[]): Node => {
  if (buckets.length === 0) {
    return {
      name: "root",
      value: 0,
      urls: [],
      children: [],
    };
  }

  const root: Node = {
    name: "root",
    value: 0,
    urls: [],
    children: [],
  };

  let currentNode = root;

  buckets?.forEach((bucket) => {
    const node: Node = {
      name: bucket.name,
      value: bucket.children.length,
      urls: bucket.children,
      children: [],
    };
    currentNode.children.push(node);
    currentNode = node;
  });

  return root;
};
