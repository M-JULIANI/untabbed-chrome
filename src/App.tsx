import './globals.css'
import './App.css'
import { useState, useEffect } from 'react'
import { Stage, Container, Sprite, Text, Graphics } from '@pixi/react';
import { UMAP } from 'umap-js';
import axios from 'axios'
import TurndownService from 'turndown'
import Prando from 'prando'
import { useCallback } from "react";
import { TextStyle } from "pixi.js";
import '@pixi/unsafe-eval'
import { SliderDemo } from './SliderDemo'

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
    g.beginFill('red'); // Example color, change as needed
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
  return (
    <>
      <Graphics draw={draw} />
      <Text text={schema?.title || "NADA"} x={x} y={y} anchor={0.5}
      // style={
      //         {...tstyle}
      //       }
      />
    </>
  );
}

const SIDE_GUTTER = 150
const DEFAULT_RADIUS = 50
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
  const [loading, setLoading] = useState(false);

  const [isMounted, setIsMounted] = useState(false);
  const [stare, setStare] = useState(2); // Step 2
  const [localRecords, setLocalRecords] = useState<any[]>([]);
  const [neighborCount, setNeighborCount] = useState(5);
  const [minDistance, setMinDistance] = useState(0.001);

  useEffect(() => {
    // Example of importing a worker in your application
    const tfWorker = new Worker(new URL('tf-worker.js', import.meta.url), { type: 'module' });

    async function fetchDataAndPostMessage() {
      setLoading(true)
      const tabs = await loadTabs();
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

    tfWorker.onmessage = function (e) {
      const { result } = e.data;
      console.log('Result from TensorFlow.js computation:', result);
      setDataLoaded(true);
      setLoading(false)
      // Handle the result
    };

    console.log('loading tabs from APP')
    fetchDataAndPostMessage();

    return () => tfWorker.terminate(); // Clean up
  }, []);


  useEffect(() => {
    setIsMounted(true);
  }, []);


  useEffect(() => {
    function handleResize() {
      setDimensions({
        height: window.innerHeight,
        width: window.innerWidth,
      });
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

  async function visualizeEmbeddings(records: any) {
    const prng = new Prando(42);
    try {
      //@ts-ignore
      const embeddings = records.map(x => x.embedding)
      const filteredIndeces = embeddings
        .map((x: any, i: number) => x !== undefined ? i : -1)
        .filter((i: any) => i !== undefined);


      // const embeddingIdPair = filteredIndeces.map((x, i) => {
      //   return { embedding: x, id: stubData[i].id }
      // })

      const nonNullEmbeddings = filteredIndeces.map((x: any, i: number) => embeddings[i])

      // const nonNullIds = embeddingIdPair.map(x => x.id)
      const umap = new UMAP({ nNeighbors: 5, random: () => prng.next(), minDist: 0.001, nComponents: 2 });
      // console.log('this is causing the problem?')
      // console.log(nonNullEmbeddings)
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
      return { x: newX, y: newY, schema: records[index] }
    })
    return normalizedPositions;
  }

  async function calculatePositionsFromEmbeddings(records: any) {
    console.log('about to visualize embeddings')
    const rawPositions = await visualizeEmbeddings(records)
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

  useEffect(() => {
    const runAsync = async () => {
      setDataLoaded(false)
      console.log('pre running embedding pipeline')
      const records = await fetchAllRecords();
      if (records) {
        setLocalRecords(records)
        const normalizedPositions = await calculatePositionsFromEmbeddings(records)
        setResults(normalizedPositions);
      }
      setLoading(false)
    };

    if (dataLoaded) {
      runAsync();
    }
  }, [dataLoaded]);

  useEffect(() => {
    const runAsync = async () => {
      setLoading(true)
      const normalizedPositions = await calculatePositionsFromEmbeddings(localRecords)
      setResults(normalizedPositions);
      setLoading(false)
    };

    if (localRecords)
      runAsync();


  }, [neighborCount, minDistance])


  console.log({ results })

  useEffect(() => {
    console.log('slider value: ' + stare)
  }, [stare])
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '72px'
        }} className="loading"><span>u</span><span>n</span><span>t</span><span>a</span><span>b</span>
          <span>b</span><span>e</span><span>d</span>
        </div>
      ) : (
        <>
 
          <Stage width={dimensions.width} height={dimensions.height} options={{ background: 0x1099bb }}>
            {results && results.map((result: any, key: number) => {
              return <WebNode key={result?.schema?.id || key} nodeInfo={result} radius={DEFAULT_RADIUS} />
            })}
          </Stage>
          <input
            type="range"
            min="2"
            max="6"
            value={stare}
            onChange={(e) => setStare(Number(e.target.value))}
          />
                   <SliderDemo />

        </>
      )}
    </>
  );
}

export default App
