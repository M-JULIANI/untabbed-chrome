export type NodeInfo = {
    id: string;
    title: string;
    url: string;
    favIconUrl: string | null;
    lastAccessed: number | null;
    text: string;
    embedding: number[][];
    x: number;
    y: number;
    radius: number;
    fullTextProcessed: boolean;
    xOriginal?: number;
    yOriginal?: number;
  }

export type PartialNodeInfo = {
    id: NodeInfo['id'];
    x: NodeInfo['x'];
    y: NodeInfo['y'];
    originalX: NodeInfo['xOriginal'];
    originalY: NodeInfo['yOriginal'];
    favIconUrl: NodeInfo['favIconUrl'];
    radius: NodeInfo['radius'];
    title: NodeInfo['title'];
    url: NodeInfo['url'];
};

export enum ViewMode {
    Semantic = 'Semantic',
    Concentric = 'Concentric',
    Historical = 'Historical'
  }