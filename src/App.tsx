import './globals.css'
import './App.css'
import { useState, useEffect } from 'react'
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
import { stubTabs } from './lib/data/stubTabs';
import defaultImage from './favicon.svg';

const indexdb_name = "untabbedDB";
const indexdb_store = "textStore";
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

const WebNode = ({ radius, nodeInfo, colorMap }: { radius: number, nodeInfo: any, colorMap?: any }) => {
  const { x, y, schema } = nodeInfo;
  console.log('logging...')
  const draw = useCallback((g: any) => {
    g.clear();
    // g.beginFill('#E9E9E9'); // Example color, change as needed
    // g.drawCircle(x, y, radius);
    // g.endFill();

    const dropShadow = new DropShadowFilter({
      blur: 3,
      quality: 5,
      distance: 5,
      rotation: 45,
      color: '#000000',
      alpha: 0.5,
    });
    //g.filters = [dropShadow];

    // Begin drawing the circle
    g.beginFill('#E9E9E9'); // Example color, change as needed
    g.drawCircle(x, y, radius);
    g.endFill();

  }, [x, y, radius]);

  // const tstyle = {
  //   align: "center",
  //   fontFamily: "monospace",
  //   fontSize: 12,
  //   fontWeight: "100",
  //   fill: '#000000',
  //   stroke: "#01d27e",
  //   strokeThickness: 0.5,
  //   letterSpacing: 1,
  //   wordWrap: false,
  //   wordWrapWidth: 440,
  // };
  const [imageUrl, setImageUrl] = useState(schema?.favIconUrl || defaultImage);

  useEffect(() => {
    // Function to check image availability
    const checkImage = async (url) => {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          // If the image is available, set it
          setImageUrl(url);
        } else {
          // If the image is not available, fallback to the default image
          setImageUrl(defaultImage);
        }
      } catch (error) {
        // Handle errors (e.g., network issues) by falling back to the default image
        setImageUrl(defaultImage);
      }
    };
  
    // Call checkImage with the schema's favicon URL or the default image URL
    checkImage(schema?.favIconUrl || defaultImage);
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
      {/* <Text text={schema?.title || "NADA"} x={x} y={y} anchor={0.5}
      // style={
      //         {...tstyle}
      //       }
      /> */}
    </>
  );
}

const SIDE_GUTTER = 150
const DEFAULT_RADIUS = 40
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


type TabData = {
  url: string;
  favIconUrl: string;
  title: string;
  lastAccessed: number;
  text: string;
}

function App() {
  const [results, setResults] = useState<any>();
  const [dimensions, setDimensions] = useState({
    height: window.innerHeight,
    width: window.innerWidth,
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingDrawing, setLoadingDrawing] = useState(false);

  const [isMounted, setIsMounted] = useState(false);
  const [stare, setStare] = useState(2); // Step 2
  const [localRecords, setLocalRecords] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [neighborCount, setNeighborCount] = useState([5]);
  const [neighborCountReady, setNeighborCountReady] = useState(true);
  const [minDistance, setMinDistance] = useState([0.002]);
  const [minDistanceReady, setMinDistanceReady] = useState(true);
  const [resizeFlag, setResizeFlag] = useState(false);

  //activate when not in dev mode
  useEffect(() => {
    // const runAsync = async () => {
    //   const records = await fetchAllRecords();
    //   if (records) {
    //     setLocalRecords(records)
    //     const normalizedPositions = await calculatePositionsFromEmbeddings(records)
    //     setResults(normalizedPositions);
    //   }
    // };

    // if (dataLoaded) {
    //   setStatus('Calculating positions')
    //   setDataLoaded(false)
    //   setLoading(true);
    //   runAsync().then(() => {
    //     setLoading(false)
    //     setStatus('');
    //   });
    // }
    console.log('data loaded...')
    //setResults(stubResults)
    if (stubResults !== undefined) setLocalRecords(stubResults)
    setLoading(false)
  }, [dataLoaded]);

  useEffect(() => {

    console.log('calling this loop how many times?')
    const runAsync = async () => {
      const normalizedPositions = await calculatePositionsFromEmbeddings(localRecords, neighborCount[0], minDistance[0])
      if (normalizedPositions)
        setResults(normalizedPositions);
    };


    if (localRecords.length > 0 && neighborCountReady && minDistanceReady) {
      //reset
      setMinDistanceReady(false);
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

  }, [neighborCountReady, minDistanceReady, localRecords, resizeFlag])



  useEffect(() => {
    // Example of importing a worker in your application
    const tfWorker = new Worker(new URL('tf-worker.js', import.meta.url), { type: 'module' });

    async function fetchDataAndPostMessage() {
      //const tabs = await loadTabs();
      const tabs = stubTabs;
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
    // fetchDataAndPostMessage();

    //REMOVE
    setDataLoaded(true);

    tfWorker.onmessage = function (e) {
      const { result } = e.data;
      console.log('Result from TensorFlow.js computation:', result);
      setDataLoaded(true);
      setStatus('Tabs loaded... ')
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
    let request = indexedDB.open(indexdb_name, 1);

    return new Promise((resolve, reject) => {
      request.onsuccess = function (event) {
        let db = (event.target as IDBOpenDBRequest)?.result;
        let transaction = db.transaction([indexdb_store], "readonly");
        let objectStore = transaction.objectStore(indexdb_store);
        let getAllRequest = objectStore.getAll();

        getAllRequest.onsuccess = function (event: any) {
          if (event.target.result) {
            let records = event.target.result.map((record: any) => record);
            resolve(records);
          } else {
            resolve([]);
          }
        };

        getAllRequest.onerror = function (event) {
          let ev = (event.target as IDBOpenDBRequest);
          reject("Database error: " + ev);
        };
      };

      request.onerror = function (event) {
        let ev = (event.target as IDBOpenDBRequest);
        reject("Database error: " + ev);
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
      const embeddings = records.map(x => x.schema.embedding)
      console.log({ records, embeddings })
      const filteredIndeces = embeddings
        .map((x: any, i: number) => x !== undefined ? i : -1)
        .filter((i: any) => i !== undefined);

      const nonNullEmbeddings = filteredIndeces.map((x: any, i: number) => embeddings[i])
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
  function remap(num: number, inputMin: number, inputMax: number, outputMin: number, outputMax: number) {
    const epsilon = 0; // small constant to avoid division by zero
    return ((num - inputMin) / (inputMax - inputMin + epsilon)) * (outputMax - outputMin) + outputMin;
  }

  function normalizePositions(positions: number[][], indeces: number[], records: any) {

    const inputMinX = positions.map(x => x[0]).reduce((a, b) => Math.min(a, b))
    const inputMaxX = positions.map(x => x[0]).reduce((a, b) => Math.max(a, b))
    const inputMinY = positions.map(x => x[1]).reduce((a, b) => Math.min(a, b))
    const inputMaxY = positions.map(x => x[1]).reduce((a, b) => Math.max(a, b))

    console.log({ inputMaxX, inputMinX, inputMaxY, inputMinY })
    const outputMinX = SIDE_GUTTER
    const outputMaxX = window.innerWidth - SIDE_GUTTER
    const outputMinY = SIDE_GUTTER
    const outputMaxY = window.innerHeight - SIDE_GUTTER

    const normalizedPositions = positions.map((x, i) => {
      const newX = remap(x[0], inputMinX, inputMaxX, outputMinX, outputMaxX)
      const newY = remap(x[1], inputMinY, inputMaxY, outputMinY, outputMaxY)
      const index = indeces[i]
      return { x: newX, y: newY, schema: records[index].schema }
    })
    return normalizedPositions;
  }

  async function calculatePositionsFromEmbeddings(records: any, nCount: number, minDist: number) {
    console.log('about to visualize embeddings')
    console.log({ records })
    const rawPositions = await tryVisualizeEmbeddings(records, nCount, minDist)
    console.log('raw positions')
    console.log({ rawPositions })
    if (rawPositions !== undefined) {
      const normalized = normalizePositions(rawPositions.positions, rawPositions.ids, records)
      console.log('normalized positions')
      console.log({ normalized })
      return normalized
    }
    return undefined
  }

  console.log({ results })

  // useEffect(() => {
  //   console.log('slider value: ' + stare)
  // }, [stare])

  // if (!isMounted) {
  //   return null;
  // }

  useEffect(() => {
    console.log('min distance: ')
    console.log(minDistance)
  }, [minDistance])

  console.log('loading: ' + loading)
  const statusChars = status.split('');

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
          {loadingDrawing && <div className="loading">Drawing...</div>}
          <div style={{ position: 'relative' }}>
            <Stage width={dimensions.width} height={dimensions.height} options={{ background: '#6B6B6B' }}>
              {results && results.map((result: any, key: number) => {
                return <WebNode key={result?.schema?.id || key} nodeInfo={result} radius={DEFAULT_RADIUS} />
              })}
            </Stage>
            <div className="popover-top-right flex flex-col gap-2 px-8 py-4" style={{ margin: '10px 20px' }}>
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
                          max={0.15}
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
                          max={15}
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
