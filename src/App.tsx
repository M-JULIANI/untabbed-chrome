import './App.css'
import { useState, useEffect } from 'react'
import logo from './logo.svg'
import { Stage, Container, Sprite, Text, Graphics } from '@pixi/react';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import * as tf from '@tensorflow/tfjs';
import { UMAP } from 'umap-js';
import axios from 'axios'
import TurndownService from 'turndown'
import Prando from 'prando'
import { useCallback } from "react";
import { TextStyle } from 'pixi.js'
import '@pixi/unsafe-eval'
// import { DrawNode } from "../draw";


// export type WebNodeProps = {
//     radius: number;
//     nodeInfo: DrawNode
// }

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

  const style = new TextStyle({
    align: 'center',
    fontFamily: '"Source Sans Pro", Helvetica, sans-serif',
    fontSize: 10,
    fontWeight: '400',
  });

  return (
    <>
      <Graphics draw={draw} />
      <Text text={schema?.title || "NADA"} x={x} y={y} anchor={0.5} />
    </>
  );
}

const SIDE_GUTTER = 150
const DEFAULT_RADIUS = 50
const turndownService = new TurndownService();
// const stubData = [
//   {
//     "id": "1",
//     "url": "https://news.ycombinator.com/",
//     "title": "HackerNews",
//     "parentId": null,
//     "category": "news",
//     "hostName": "ycombinator.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "2",
//     "url": "https://www.randomeower.com/",
//     "title": "Randomeower",
//     "parentId": null,
//     "category": "General",
//     "hostName": "randomeower.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "3",
//     "url": "https://www.boredombusted.com/",
//     "title": "Boredom Busted",
//     "parentId": null,
//     "category": "Entertainment",
//     "hostName": "boredombusted.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "4",
//     "url": "https://www.shuffleme.se/",
//     "title": "ShuffleMe",
//     "parentId": null,
//     "category": "General",
//     "hostName": "shuffleme.se",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "5",
//     "url": "https://www.kaspersky.com/resource-center/threats/malware-examples",
//     "title": "Types of Malware & Malware Examples",
//     "parentId": null,
//     "category": "Technology",
//     "hostName": "kaspersky.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "6",
//     "url": "https://www.knowledgelover.com/",
//     "title": "Knowledge Lover",
//     "parentId": null,
//     "category": "Education",
//     "hostName": "knowledgelover.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "7",
//     "url": "https://www.goodreads.com/",
//     "title": "Goodreads",
//     "parentId": null,
//     "category": "Books",
//     "hostName": "goodreads.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "8",
//     "url": "https://www.howstuffworks.com/",
//     "title": "How Stuff Works",
//     "parentId": null,
//     "category": "Education",
//     "hostName": "howstuffworks.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "9",
//     "url": "https://www.codecademy.com/",
//     "title": "Codecademy",
//     "parentId": null,
//     "category": "Education",
//     "hostName": "codecademy.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "10",
//     "url": "https://www.bbc.com/future",
//     "title": "BBC Future",
//     "parentId": null,
//     "category": "News",
//     "hostName": "bbc.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "11",
//     "url": "https://99u.adobe.com/",
//     "title": "99U",
//     "parentId": null,
//     "category": "Creativity",
//     "hostName": "99u.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "12",
//     "url": "https://www.fastcompany.com/",
//     "title": "Fast Company",
//     "parentId": null,
//     "category": "Business",
//     "hostName": "fastcompany.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "13",
//     "url": "https://www.ehow.com/",
//     "title": "eHow",
//     "parentId": null,
//     "category": "How To",
//     "hostName": "ehow.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "14",
//     "url": "https://www.powersearchingwithgoogle.com/",
//     "title": "Power Searching With Google",
//     "parentId": null,
//     "category": "Education",
//     "hostName": "powersearchingwithgoogle.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "15",
//     "url": "https://www.makeuseof.com/",
//     "title": "Make Use of",
//     "parentId": null,
//     "category": "Technology",
//     "hostName": "makeuseof.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "16",
//     "url": "https://www.quora.com/",
//     "title": "Quora",
//     "parentId": null,
//     "category": "Q&A",
//     "hostName": "quora.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "17",
//     "url": "https://www.factslides.com/",
//     "title": "Fact Slides",
//     "parentId": null,
//     "category": "Education",
//     "hostName": "factslides.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "18",
//     "url": "https://www.reddit.com/",
//     "title": "Reddit",
//     "parentId": null,
//     "category": "Community",
//     "hostName": "reddit.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "19",
//     "url": "https://www.code.org/",
//     "title": "Code.org",
//     "parentId": null,
//     "category": "Education",
//     "hostName": "code.org",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "20",
//     "url": "https://www.writersdigest.com/",
//     "title": "Writer’s Digest",
//     "parentId": null,
//     "category": "Writing",
//     "hostName": "writersdigest.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "21",
//     "url": "https://www.wikipedia.org/",
//     "title": "Wikipedia",
//     "parentId": null,
//     "category": "Education",
//     "hostName": "wikipedia.org",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "22",
//     "url": "https://www.imdb.com/",
//     "title": "IMDb",
//     "parentId": null,
//     "category": "Entertainment",
//     "hostName": "imdb.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "23",
//     "url": "https://www.stackoverflow.com/",
//     "title": "Stack Overflow",
//     "parentId": null,
//     "category": "Technology",
//     "hostName": "stackoverflow.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "24",
//     "url": "https://www.ted.com/",
//     "title": "TED Talks",
//     "parentId": null,
//     "category": "Education",
//     "hostName": "ted.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "25",
//     "url": "https://www.nytimes.com/",
//     "title": "The New York Times",
//     "parentId": null,
//     "category": "News",
//     "hostName": "nytimes.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "26",
//     "url": "https://www.medium.com/",
//     "title": "Medium",
//     "parentId": null,
//     "category": "Writing",
//     "hostName": "medium.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "27",
//     "url": "https://www.linkedin.com/",
//     "title": "LinkedIn",
//     "parentId": null,
//     "category": "Business",
//     "hostName": "linkedin.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "28",
//     "url": "https://www.pinterest.com/",
//     "title": "Pinterest",
//     "parentId": null,
//     "category": "Lifestyle",
//     "hostName": "pinterest.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "29",
//     "url": "https://www.netflix.com/",
//     "title": "Netflix",
//     "parentId": null,
//     "category": "Entertainment",
//     "hostName": "netflix.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "30",
//     "url": "https://www.spotify.com/",
//     "title": "Spotify",
//     "parentId": null,
//     "category": "Music",
//     "hostName": "spotify.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "31",
//     "url": "https://www.khanacademy.org/",
//     "title": "Khan Academy",
//     "parentId": null,
//     "category": "Education",
//     "hostName": "khanacademy.org",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "32",
//     "url": "https://www.nationalgeographic.com/",
//     "title": "National Geographic",
//     "parentId": null,
//     "category": "Education",
//     "hostName": "nationalgeographic.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "33",
//     "url": "https://www.coursera.org/",
//     "title": "Coursera",
//     "parentId": null,
//     "category": "Education",
//     "hostName": "coursera.org",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "34",
//     "url": "https://www.nature.com/",
//     "title": "Nature",
//     "parentId": null,
//     "category": "Science",
//     "hostName": "nature.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "35",
//     "url": "https://www.theguardian.com/",
//     "title": "The Guardian",
//     "parentId": null,
//     "category": "News",
//     "hostName": "theguardian.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "36",
//     "url": "https://www.weather.com/",
//     "title": "The Weather Channel",
//     "parentId": null,
//     "category": "Weather",
//     "hostName": "weather.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "37",
//     "url": "https://www.producthunt.com/",
//     "title": "Product Hunt",
//     "parentId": null,
//     "category": "Technology",
//     "hostName": "producthunt.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "38",
//     "url": "https://www.theverge.com/",
//     "title": "The Verge",
//     "parentId": null,
//     "category": "Technology",
//     "hostName": "theverge.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "39",
//     "url": "https://www.tripadvisor.com/",
//     "title": "TripAdvisor",
//     "parentId": null,
//     "category": "Travel",
//     "hostName": "tripadvisor.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   },
//   {
//     "id": "40",
//     "url": "https://www.bloomberg.com/",
//     "title": "Bloomberg",
//     "parentId": null,
//     "category": "Finance",
//     "hostName": "bloomberg.com",
//     "favIconUrl": "",
//     "lastAccessed": 0
//   }
// ];

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

  useEffect(() => {
    // Example of importing a worker in your application
    const tfWorker = new Worker(new URL('tf-worker.js', import.meta.url), { type: 'module' });

    async function fetchDataAndPostMessage() {
      setLoading(true)
      const tabs = await loadTabs();
      if (tabs.length<1) {
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
      const embeddings = records.map(x=>x.embedding)
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
        const normalizedPositions = await calculatePositionsFromEmbeddings(records)
        setResults(normalizedPositions);
      }
      setLoading(false)
    };

    if(dataLoaded){
    runAsync();
    }
  }, [dataLoaded]);


  console.log({results})
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
        <Stage width={dimensions.width} height={dimensions.height} options={{ background: 0x1099bb }}>
          {results && results.map((result: any, key: number) => {
            return <WebNode key={result?.schema?.id || key} nodeInfo={result} radius={DEFAULT_RADIUS} />
          })}
        </Stage>
      )}
    </>
  );
}

export default App
