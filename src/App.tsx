import './globals.css'
import './App.css'
import { useState, useEffect, useRef, MouseEventHandler } from 'react'
import { Stage, Container, Text, Graphics, Sprite } from '@pixi/react';
import { UMAP } from 'umap-js';
import axios from 'axios'
import TurndownService from 'turndown'
import Prando from 'prando'
import { useCallback } from "react";
import '@pixi/unsafe-eval'
// import { SliderDemo } from './SliderDemo'
import * as PIXI from 'pixi.js';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from './components/ui/sheet';
import { Button } from './components/ui/button';
import { Label } from './components/ui/label';
import { Input } from './components/ui/inputs';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from './components/ui/select';
import { Separator } from './components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './components/ui/accordion';
import { DropShadowFilter } from '@pixi/filter-drop-shadow';
import { Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarMenu, MenubarRadioGroup, MenubarRadioItem, MenubarSeparator, MenubarShortcut, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger } from './components/ui/menubar';
import { Slider } from './components/ui/slider';
import { stubResults } from './lib/data/stubResults';
import { stubResultsLarge } from './lib/data/stubResultsLarge';
import { stubTabs } from './lib/data/stubTabs';
import { DrawNode, PartialNodeInfo } from './components/DrawNode'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip';
import { cn } from './lib/utils';

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

export function remap(num: number, inputMin: number, inputMax: number, outputMin: number, outputMax: number) {
  const epsilon = 0; // small constant to avoid division by zero
  return ((num - inputMin) / (inputMax - inputMin + epsilon)) * (outputMax - outputMin) + outputMin;
}

const indexdb_name = "untabbedDB";
const indexdb_store = "textStore";
const db_version = 2;
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

const SIDE_GUTTER = 150
const DEFAULT_RADIUS = 5
const turndownService = new TurndownService();

async function loadTabs() {
  const tabs: any[] = [];
  const windowList = await new Promise<any[]>((resolve) => {
    chrome.windows.getAll({ populate: true }, function (windows) {
      resolve(windows);
    });
  });

  windowList.forEach(window => {
    window.current = false;
    window.focused = false;
    window.tabs.forEach((tab: any) => {
      tabs.push(tab);
    });
  });

  return tabs;
}

function App() {
  const [results, setResults] = useState<PartialNodeInfo[]>();
  const [minLastAccessed, setMinLastAccessed] = useState(0);
  const [maxLastAccessed, setMaxLastAccessed] = useState(100);
  const [dimensions, setDimensions] = useState({
    height: window.innerHeight,
    width: window.innerWidth,
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingDrawing, setLoadingDrawing] = useState(false);

  const [isMounted, setIsMounted] = useState(false);
  const [stare, setStare] = useState(2); // Step 2
  const [localRecords, setLocalRecords] = useState<NodeInfo[]>([]);
  const [status, setStatus] = useState('');
  const [neighborCount, setNeighborCount] = useState([5]);
  const [neighborCountReady, setNeighborCountReady] = useState(true);
  const [minDistance, setMinDistance] = useState([0.002]);
  const [minDistanceReady, setMinDistanceReady] = useState(true);
  const [resizeFlag, setResizeFlag] = useState(false);
  const ref = useRef(null);
  const [bounds, setBounds] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [hovered, setHovered] = useState<string>('');
  const [tooltip, setTooltip] = useState({ visible: false, content: '', url: '', x: 0, y: 0 });
  const [calculated_radius, setCalculatedRadius] = useState(100 / DEFAULT_RADIUS);
  const [activeTabCount, setActiveTabCount] = useState(0);

  useEffect(() => {
    if (results) {
      setCalculatedRadius(results.length / DEFAULT_RADIUS)
    }
  }, [results])

  useEffect(() => {
    const updateBounds = () => {
      if (ref.current) {
        //@ts-ignore
        const rect = ref.current.getBoundingClientRect();
        setBounds({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
      }
    };

    window.addEventListener('resize', updateBounds);
    updateBounds();

    return () => window.removeEventListener('resize', updateBounds);
  }, []);


  //runs when not all the things have been fetched correctly
  useEffect(() => {
    const runAsync = async () => {
      const records = await fetchAllRecords();
      console.log("FETCHED RECORDS")
      console.log({ records })
      if (records) {
        setLocalRecords(records)
        //@ts-ignore
        const minLastAccesses = records.map(x => x.lastAccessed).reduce((a: any, b: any) => Math.min(a, b))
        if (minLastAccesses) setMinLastAccessed(minLastAccesses)
        //@ts-ignore
        const maxLastAccesses = records?.map(x => x.lastAccessed).reduce((a: any, b: any) => Math.max(a, b))
        if (maxLastAccesses) setMaxLastAccessed(maxLastAccesses)
        const particlesCopy = records.map((x: NodeInfo) => {
          const remapped = remap(x?.lastAccessed || 0, minLastAccessed, maxLastAccessed, 0.5, 1.0);
          const newRad = remapped * calculated_radius
          console.log({ newRad, calculated_radius, minLastAccesses, maxLastAccesses })
          return { ...x, xOriginal: x.x, yOriginal: x.y, radius: newRad }
        });
        const normalizedPositions = await calculatePositionsFromEmbeddings(particlesCopy, neighborCount[0], minDistance[0])

        setResults(normalizedPositions);
      }
    }
    console.log('possibly rerunning fetch...')
    console.log({ dataLoaded, results, activeTabCount })
    if (dataLoaded && results && results.length > 0 && activeTabCount !== results.length) {
      setStatus('Fetching tabs..')
      // setDataLoaded(false)
      setLoading(true);
      runAsync().then(() => {
        setLoading(false)
        setStatus('');
      });
    }
  }, [activeTabCount, dataLoaded, results])

  //activate when not in dev mode
  useEffect(() => {
    const runAsync = async () => {
      const records = await fetchAllRecords();
      console.log("FETCHED RECORDS")
      console.log({ records })
      if (records) {
        setLocalRecords(records)
        //@ts-ignore
        const minLastAccesses = records.map(x => x.lastAccessed).reduce((a: any, b: any) => Math.min(a, b))
        if (minLastAccesses) setMinLastAccessed(minLastAccesses)
        //@ts-ignore
        const maxLastAccesses = records?.map(x => x.lastAccessed).reduce((a: any, b: any) => Math.max(a, b))
        if (maxLastAccesses) setMaxLastAccessed(maxLastAccesses)
        const particlesCopy = records.map((x: NodeInfo) => {
          const remapped = remap(x?.lastAccessed || 0, minLastAccessed, maxLastAccessed, 0.5, 1.0);
          return { ...x, xOriginal: x.x, yOriginal: x.y, radius: remapped * calculated_radius }
        });
        const normalizedPositions = await calculatePositionsFromEmbeddings(particlesCopy, neighborCount[0], minDistance[0])
        setResults(normalizedPositions);
      }
    };

    if (dataLoaded) {
      setStatus('Positions......')
      // setDataLoaded(false)
      setLoading(true);
      runAsync().then(() => {
        setLoading(false)
        setStatus('');
      });
    }

    // //FOR LOCAL
    // console.log('data loaded...')
    // setResults(stubResultsLarge)
    // const minLastAccesses = results.map(x => x.lastAccessed).reduce((a, b) => Math.min(a, b))
    // setMinLastAccessed(minLastAccesses)
    // const maxLastAccesses = results.map(x => x.lastAccessed).reduce((a, b) => Math.max(a, b))
    // setMaxLastAccessed(maxLastAccesses)
    // if (stubResults !== undefined) setLocalRecords(stubResultsLarge)
    // setLoading(false)
  }, [dataLoaded]);


  useEffect(() => {
    console.log('calling this loop how many times?')
    console.log({ localRecords })
    const runAsync = async () => {
      const normalizedPositions = await calculatePositionsFromEmbeddings(localRecords, neighborCount[0], minDistance[0])
      if (normalizedPositions)
        setResults(normalizedPositions);
    };


    if (localRecords.length > 0 && minDistanceReady) {
      //reset
      setMinDistanceReady(false);
      setLoadingDrawing(true)
      runAsync().then(() => {
        setLoadingDrawing(false)
        setLoading(false)
      });
    }
    if (localRecords.length > 0 && neighborCountReady) {
      //reset
      setNeighborCountReady(false);
      setLoadingDrawing(true)
      runAsync().then(() => {
        setLoadingDrawing(false)
        setLoading(false)
      });
    }
    if (localRecords.length > 0 && resizeFlag) {
      setResizeFlag(false)
      setLoadingDrawing(true)
      runAsync().then(() => {
        setLoadingDrawing(false)
        setLoading(false)
      });
    }

  }, [neighborCountReady, minDistanceReady, resizeFlag, localRecords])



  useEffect(() => {
    // Example of importing a worker in your application
    const tfWorker = new Worker(new URL('tf-worker.js', import.meta.url), { type: 'module' });

    async function fetchDataAndPostMessage() {
      const tabs = await loadTabs();
      if (tabs.length > 0) { setActiveTabCount(tabs.length) }
      //FOR LOCAL
      // const tabs = stubTabs;
      console.log('here...')
      console.log({ tabs })
      if (tabs.length < 1) {
        console.log('No tabs loaded.');
      } else {
        const simplifiedTabs = tabs.map((tab, index) => {
          return {
            id: tab.id,
            title: tab.title,
            url: tab.url,
            favIconUrl: tab.favIconUrl,
            lastAccessed: tab.lastAccessed,
            text: ''
          };
        });

        console.log('Sending tabs w/ text:', simplifiedTabs);
        tfWorker.postMessage({
          operation: 'processTabs',
          data: simplifiedTabs
        });
      }
    }

    console.log('loading tabs from APP')
    setLoading(true)
    setStatus('Loading tabs...')
    fetchDataAndPostMessage();

    //FOR LOCAL
    // setDataLoaded(true);

    tfWorker.onmessage = function (e) {
      const { result } = e.data;
      console.log('Result from TensorFlow.js computation:', result);
      setDataLoaded(true);
      setStatus('Tabs loaded....')
    };

    return () => tfWorker.terminate(); // Clean up
  }, []);


  useEffect(() => {
    function handleResize() {
      setDimensions({
        height: window.innerHeight,
        width: window.innerWidth,
      });
      setResizeFlag(true);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  async function getWebsiteTextFromUrl(url: string) {

    // let headers = {
    //   "Accept": 'text/html',
    //   "Content-Type": 'text/html',
    // }

    const updated_url = `http://localhost:5000/api?url=${url}`
    let response = undefined

    try {
      response = await axios.get(updated_url);
      // console.log('response:')
      // console.log({ response })
      const text = turndownService.turndown(response.data);
      console.log('xformed', { text })
      return text;
    }
    catch (error) {
      console.log(error)
      console.warn(`website ${url} not accessible`);
      return undefined;
    }
  }

  function fetchAllRecords(): Promise<any> {
    console.log('Opening IndexedDB:', indexdb_name);
    let request = indexedDB.open(indexdb_name, db_version);

    return new Promise((resolve, reject) => {
      request.onsuccess = function (event) {
        console.log('IndexedDB opened successfully');
        let db = (event.target as IDBOpenDBRequest)?.result;
        console.log('Starting transaction on store:', indexdb_store);
        let transaction = db.transaction(indexdb_store, "readonly");
        let objectStore = transaction.objectStore(indexdb_store);
        console.log('Fetching all records from store:', indexdb_store);

        let getAllRequest = objectStore.getAll();

        getAllRequest.onsuccess = function (event: any) {
          let records = event.target.result.map((record: any) => record);
          resolve(records);
        };

        getAllRequest.onerror = function (event) {
          console.error('Error fetching records:', event);
          reject("Database error: " + event);
        };
      };

      request.onerror = function (event) {
        console.error('IndexedDB open error:', event);
        reject("IndexedDB open error: " + event);
      };
    });
  }

  async function tryVisualizeEmbeddings(records: any, nNeighbors: number, minDist: number) {
    if (!records) undefined;
    const results = await visualizeEmbeddings(records, nNeighbors, minDist)

    if (results !== undefined) {
      return results;
    }
    else {
      console.log('retrying with fewer neighbors... ' + (nNeighbors - 1))
      if (nNeighbors > 1) {
        return await tryVisualizeEmbeddings(records, nNeighbors - 1, minDist)
      }
      else {
        return undefined;
      }
    }
  }

  async function visualizeEmbeddings(records: any, nNeighbors: number, minDist: number) {
    const prng = new Prando(42);
    try {
      //@ts-ignore
      const embeddings = records.map(x => x.embedding)
      console.log({ records, embeddings })
      const filteredIndeces = embeddings
        .map((x: any, i: number) => x !== undefined ? i : -1)
        .filter((i: any) => i !== undefined);

      const nonNullEmbeddings = filteredIndeces.map((x: any, i: number) => embeddings[i])
      console.log({ nonNullEmbeddings })
      //const nonNullEmbeddings = filteredIndeces.map((x: any, i: number) => embeddings[i][0]); // Assuming extra array wrapping
      console.log({ nonNullEmbeddings })
      const umap = new UMAP({ nNeighbors, random: () => prng.next(), minDist, nComponents: 2 });
      const positions = await umap.fitAsync(nonNullEmbeddings);
      return { positions, ids: filteredIndeces };
    }
    catch (error) {
      console.log('error in visualizeEmbeddings')
      console.log(error)
      return undefined
    }
  }
  function normalizePositions(positions: number[][], indeces: number[], records: PartialNodeInfo[]) {

    const inputMinX = positions.map(x => x[0]).reduce((a, b) => Math.min(a, b))
    const inputMaxX = positions.map(x => x[0]).reduce((a, b) => Math.max(a, b))
    const inputMinY = positions.map(x => x[1]).reduce((a, b) => Math.min(a, b))
    const inputMaxY = positions.map(x => x[1]).reduce((a, b) => Math.max(a, b))

    const outputMinX = SIDE_GUTTER
    const outputMaxX = window.innerWidth - SIDE_GUTTER
    const outputMinY = SIDE_GUTTER
    const outputMaxY = window.innerHeight - SIDE_GUTTER

    const normalizedPositions = positions.map((x, i) => {
      const newX = remap(x[0], inputMinX, inputMaxX, outputMinX, outputMaxX)
      const newY = remap(x[1], inputMinY, inputMaxY, outputMinY, outputMaxY)
      const index = indeces[i]
      return { ...records[index], x: newX, y: newY }
    })
    return normalizedPositions;
  }

  function separateParticles(particles: PartialNodeInfo[]) {
    const kSpringConstant = 0.1; // Spring constant
    let isOverlapping = true;
    const maxIterations = 100;
    let iteration = 0;

    while (isOverlapping && iteration < maxIterations) {
      isOverlapping = false;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[j].x - particles[i].x;
          const dy = particles[j].y - particles[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = particles[i].radius + particles[j].radius;
          if (distance < minDistance) {
            isOverlapping = true;
            const overlap = minDistance - distance;
            const force = overlap * kSpringConstant;
            const forceX = (dx / distance) * force;
            const forceY = (dy / distance) * force;
            particles[i].x -= forceX;
            particles[i].y -= forceY;
            particles[j].x += forceX;
            particles[j].y += forceY;
          }
        }
      }
      iteration++;
    }

    return particles;
  }

  async function calculatePositionsFromEmbeddings(records: NodeInfo[], nCount: number, minDist: number) {
    console.log('about to visualize embeddings')
    console.log({ records })
    const rawPositions = await tryVisualizeEmbeddings(records, nCount, minDist)
    console.log('raw positions')
    console.log({ rawPositions })
    if (rawPositions !== undefined) {
      const partialNodeInfo: PartialNodeInfo[] = records.map(nodeInfo => ({
      x: nodeInfo.x,
      y: nodeInfo.y,
      id: nodeInfo.id,
      favIconUrl: nodeInfo.favIconUrl,
      radius: nodeInfo.radius,
      title: nodeInfo.title,
      url: nodeInfo.url
    }));
      const normalized = normalizePositions(rawPositions.positions, rawPositions.ids, partialNodeInfo)
      const particles = separateParticles(normalized.map((x: any) => ({ ...x, x: x.x, y: x.y, radius: calculated_radius })));
      console.log('normalized particle positions')
      console.log({ particles })
      return particles
    }
    return undefined
  }

  console.log({ results })


  useEffect(() => {
    console.log('min distance: ')
    console.log(minDistance)
  }, [minDistance])

  console.log('loading: ' + loading)

  function isPointInsideRectangle(
    point: { x: number, y: number },
    rect: { position: { x: number, y: number }; length: number; height: number },
  ): boolean {
    return (
      point.x >= rect.position.x - rect.length * 0.5 &&
      point.x <= rect.position.x + rect.length * 0.5 &&
      point.y >= rect.position.y - rect.height * 0.5 &&
      point.y <= rect.position.y + rect.height * 0.5
    );
  }

  const checkHover = (point: { x: number, y: number }, results: PartialNodeInfo[]) => {
    let isHovering: string = '';
    results?.forEach((result) => {
      if (
        isPointInsideRectangle(point, {
          position: { x: result.x, y: result.y },
          length: result?.radius || 1,
          height: result?.radius || 1,
        })
      ) {
        isHovering = result.id || '';
        return;
      }
    });
    return isHovering;
  };

  const onMouseMove: MouseEventHandler = (e) => {
    if (loading || loadingDrawing) return;
    const point = { x: e.clientX, y: e.clientY };

    // check if hovering polygon
    if (results) {
      const idx = checkHover(point, results);
      if (idx !== '') {
        if (hovered !== idx) {
          setHovered(idx);
          const match = results.find((r: any) => r.id === idx);
          if (match) {
            setTooltip({
              visible: true,
              content: match?.title || '',
              url: match?.url || '',
              x: match.x,
              y: match.y
            });
          }
        }
      }
      else {
        if (hovered !== '') {
          setHovered('');
          setTooltip({
            visible: false,
            content: '',
            url: '',
            x: e.clientX,
            y: e.clientY
          });
        }
      }
    }
  }

  //handle open tab
  const onMouseDown: MouseEventHandler = (e) => {
    if (loading || loadingDrawing) return;
    const point = { x: e.clientX, y: e.clientY };

    // if (hovered) {
    //   const match = results.find((r: any) => r.id === hovered);

    // }
  }

  useEffect(() => {
    console.log('hovered: ' + hovered)
  }, [hovered])

  return (
    <>
      {loading ? (
        <>
          <div style={{
            display: 'flex',
            flexDirection: 'column', // Stack the divs vertically
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}>
            <div style={{
              fontSize: '72px'
            }} className="loading">
              <span>u</span><span>n</span><span>t</span><span>a</span><span>b</span>
              <span>b</span><span>e</span><span>d</span>
            </div>
            <div className="chatbox">
              <div className="text">
                {status}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {loadingDrawing ? (<div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              zIndex: 2,
            }}
          >
            <div className="chatbox">
              <div className="text">
                Re-drawing...
              </div>
            </div>
          </div>) : null}
          <div style={{ position: 'relative' }}>
            <Stage width={dimensions.width} height={dimensions.height}
              options={{ background: '#202025' }}
              onMouseMove={onMouseMove}
              onMouseDown={onMouseDown}>
              {results && results.map((result: PartialNodeInfo, key: number) => {
                return <DrawNode key={result?.id || key}
                  nodeInfo={result}
                  hovered={hovered} />
              })}
            </Stage>
            {tooltip.visible && (
              <div style={{
                position: 'absolute',
                left: tooltip.x,
                top: tooltip.y,
                padding: '5px',
                background: 'red',
                border: '1px solid black',
                borderRadius: '5px',
                pointerEvents: 'none', // Prevents the tooltip from interfering with mouse events
                transform: `translate(-50%, -${(calculated_radius * 2) + 20}px)`, // Adjusts the position to be above the cursor
                whiteSpace: 'nowrap'
              }} className={cn(
                "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
              )}>
                <div className="flex-col">
                  <div style={{
                    fontWeight: 'bold',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    maxWidth: '200px',
                  }}>{tooltip.content}</div>
                  <div style={{
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    maxWidth: '200px',
                  }}>{tooltip.url}</div>
                </div>
              </div>
            )}


            <div className="popover-top-right flex flex-col gap-2 px-8 py-4" style={{ margin: '10px 20px' }}>
              <div>{results?.length || 0}</div>
              <Menubar className="outline-menu">
                <MenubarMenu>
                  <MenubarTrigger>Tabs</MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem>
                      Collapse All <MenubarShortcut>⌘C</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem>
                      Expand All<MenubarShortcut>⌘E</MenubarShortcut>
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem>
                      Print... <MenubarShortcut>⌘P</MenubarShortcut>
                    </MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                  <MenubarTrigger>View Mode</MenubarTrigger>
                  <MenubarContent>
                    <MenubarCheckboxItem>Semantic</MenubarCheckboxItem>
                    <MenubarCheckboxItem checked>
                      Concentric
                    </MenubarCheckboxItem>
                    <MenubarItem inset>
                      Historical
                    </MenubarItem>
                    <MenubarSeparator />
                    <div className="flex flex-col justify-between gap-6 my-4 ml-8">
                      <div className="grid grid-cols-2 items-center gap-4 mr-8">
                        <Label htmlFor="width">Distance</Label>
                        <Slider
                          className={"flex-grow"}
                          min={0.001}
                          defaultValue={minDistance}
                          step={0.001}
                          max={1.0}
                          onValueChange={(v) => setMinDistance(v)}
                          onBlur={(v) => {
                            setMinDistanceReady(true)
                          }}
                        />

                      </div>
                      <div className="grid grid-cols-2 items-center gap-4 mr-8">
                        <Label htmlFor="width">Neighbors</Label>
                        <Slider
                          className={"flex-grow"}
                          min={3}
                          defaultValue={neighborCount}
                          step={1}
                          max={20}
                          onValueChange={(v) => setNeighborCount(v)}
                          onBlur={(v) => {
                            setNeighborCountReady(true)
                          }}
                        />
                      </div>
                    </div>
                  </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                  <MenubarTrigger>Settings</MenubarTrigger>
                  <MenubarContent>
                    <MenubarRadioGroup value="benoit">
                      <MenubarRadioItem value="andy">Andy</MenubarRadioItem>
                      <MenubarRadioItem value="benoit">Benoit</MenubarRadioItem>
                      <MenubarRadioItem value="Luis">Luis</MenubarRadioItem>
                    </MenubarRadioGroup>
                    <MenubarSeparator />
                    <MenubarItem inset>Edit...</MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem inset>Add Profile...</MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                  <MenubarTrigger>Analytics</MenubarTrigger>
                  <MenubarContent>
                    <MenubarRadioGroup value="benoit">
                      <MenubarRadioItem value="andy">Andy</MenubarRadioItem>
                      <MenubarRadioItem value="benoit">Benoit</MenubarRadioItem>
                      <MenubarRadioItem value="Luis">Luis</MenubarRadioItem>
                    </MenubarRadioGroup>
                    <MenubarSeparator />
                    <MenubarItem inset>Edit...</MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem inset>Add Profile...</MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default App
