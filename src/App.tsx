import { useState, useEffect } from 'react'
import logo from './logo.svg'
import './App.css'
import { Stage, Container, Sprite, Text, Graphics } from '@pixi/react';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import * as tf from '@tensorflow/tfjs';
import { UMAP } from 'umap-js';
import axios from 'axios'
import TurndownService from 'turndown'
import Prando from 'prando'
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

const WebNode = ({ radius, nodeInfo, colorMap }: { radius: number, nodeInfo: any, colorMap: any }) => {
  const { x, y, schema } = nodeInfo;
  console.log('logging...')
  const draw = useCallback((g: any) => {
    g.clear();
    g.beginFill(colorMap[schema?.category] || 'white'); // Example color, change as needed
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
const stubData = [
  {
    "id": "1",
    "url": "https://news.ycombinator.com/",
    "title": "HackerNews",
    "parentId": null,
    "category": "news",
    "hostName": "ycombinator.com"
  },
  {
    "id": "2",
    "url": "https://www.randomeower.com/",
    "title": "Randomeower",
    "parentId": null,
    "category": "General",
    "hostName": "randomeower.com"
  },
  {
    "id": "3",
    "url": "https://www.boredombusted.com/",
    "title": "Boredom Busted",
    "parentId": null,
    "category": "Entertainment",
    "hostName": "boredombusted.com"
  },
  {
    "id": "4",
    "url": "https://www.shuffleme.se/",
    "title": "ShuffleMe",
    "parentId": null,
    "category": "General",
    "hostName": "shuffleme.se"
  },
  {
    "id": "5",
    "url": "https://www.kaspersky.com/resource-center/threats/malware-examples",
    "title": "Types of Malware & Malware Examples",
    "parentId": null,
    "category": "Technology",
    "hostName": "kaspersky.com"
  },
  {
    "id": "6",
    "url": "https://www.knowledgelover.com/",
    "title": "Knowledge Lover",
    "parentId": null,
    "category": "Education",
    "hostName": "knowledgelover.com"
  },
  {
    "id": "7",
    "url": "https://www.goodreads.com/",
    "title": "Goodreads",
    "parentId": null,
    "category": "Books",
    "hostName": "goodreads.com"
  },
  {
    "id": "8",
    "url": "https://www.howstuffworks.com/",
    "title": "How Stuff Works",
    "parentId": null,
    "category": "Education",
    "hostName": "howstuffworks.com"
  },
  {
    "id": "9",
    "url": "https://www.codecademy.com/",
    "title": "Codecademy",
    "parentId": null,
    "category": "Education",
    "hostName": "codecademy.com"
  },
  {
    "id": "10",
    "url": "https://www.bbc.com/future",
    "title": "BBC Future",
    "parentId": null,
    "category": "News",
    "hostName": "bbc.com"
  },
  {
    "id": "11",
    "url": "https://99u.adobe.com/",
    "title": "99U",
    "parentId": null,
    "category": "Creativity",
    "hostName": "99u.com"
  },
  {
    "id": "12",
    "url": "https://www.fastcompany.com/",
    "title": "Fast Company",
    "parentId": null,
    "category": "Business",
    "hostName": "fastcompany.com"
  },
  {
    "id": "13",
    "url": "https://www.ehow.com/",
    "title": "eHow",
    "parentId": null,
    "category": "How To",
    "hostName": "ehow.com"
  },
  {
    "id": "14",
    "url": "https://www.powersearchingwithgoogle.com/",
    "title": "Power Searching With Google",
    "parentId": null,
    "category": "Education",
    "hostName": "powersearchingwithgoogle.com"
  },
  {
    "id": "15",
    "url": "https://www.makeuseof.com/",
    "title": "Make Use of",
    "parentId": null,
    "category": "Technology",
    "hostName": "makeuseof.com"
  },
  {
    "id": "16",
    "url": "https://www.quora.com/",
    "title": "Quora",
    "parentId": null,
    "category": "Q&A",
    "hostName": "quora.com"
  },
  {
    "id": "17",
    "url": "https://www.factslides.com/",
    "title": "Fact Slides",
    "parentId": null,
    "category": "Education",
    "hostName": "factslides.com"
  },
  {
    "id": "18",
    "url": "https://www.reddit.com/",
    "title": "Reddit",
    "parentId": null,
    "category": "Community",
    "hostName": "reddit.com"
  },
  {
    "id": "19",
    "url": "https://www.code.org/",
    "title": "Code.org",
    "parentId": null,
    "category": "Education",
    "hostName": "code.org"
  },
  {
    "id": "20",
    "url": "https://www.writersdigest.com/",
    "title": "Writer’s Digest",
    "parentId": null,
    "category": "Writing",
    "hostName": "writersdigest.com"
  },
  {
    "id": "21",
    "url": "https://www.wikipedia.org/",
    "title": "Wikipedia",
    "parentId": null,
    "category": "Education",
    "hostName": "wikipedia.org"
  },
  {
    "id": "22",
    "url": "https://www.imdb.com/",
    "title": "IMDb",
    "parentId": null,
    "category": "Entertainment",
    "hostName": "imdb.com"
  },
  {
    "id": "23",
    "url": "https://www.stackoverflow.com/",
    "title": "Stack Overflow",
    "parentId": null,
    "category": "Technology",
    "hostName": "stackoverflow.com"
  },
  {
    "id": "24",
    "url": "https://www.ted.com/",
    "title": "TED Talks",
    "parentId": null,
    "category": "Education",
    "hostName": "ted.com"
  },
  {
    "id": "25",
    "url": "https://www.nytimes.com/",
    "title": "The New York Times",
    "parentId": null,
    "category": "News",
    "hostName": "nytimes.com"
  },
  {
    "id": "26",
    "url": "https://www.medium.com/",
    "title": "Medium",
    "parentId": null,
    "category": "Writing",
    "hostName": "medium.com"
  },
  {
    "id": "27",
    "url": "https://www.linkedin.com/",
    "title": "LinkedIn",
    "parentId": null,
    "category": "Business",
    "hostName": "linkedin.com"
  },
  {
    "id": "28",
    "url": "https://www.pinterest.com/",
    "title": "Pinterest",
    "parentId": null,
    "category": "Lifestyle",
    "hostName": "pinterest.com"
  },
  {
    "id": "29",
    "url": "https://www.netflix.com/",
    "title": "Netflix",
    "parentId": null,
    "category": "Entertainment",
    "hostName": "netflix.com"
  },
  {
    "id": "30",
    "url": "https://www.spotify.com/",
    "title": "Spotify",
    "parentId": null,
    "category": "Music",
    "hostName": "spotify.com"
  },
  {
    "id": "31",
    "url": "https://www.khanacademy.org/",
    "title": "Khan Academy",
    "parentId": null,
    "category": "Education",
    "hostName": "khanacademy.org"
  },
  {
    "id": "32",
    "url": "https://www.nationalgeographic.com/",
    "title": "National Geographic",
    "parentId": null,
    "category": "Education",
    "hostName": "nationalgeographic.com"
  },
  {
    "id": "33",
    "url": "https://www.coursera.org/",
    "title": "Coursera",
    "parentId": null,
    "category": "Education",
    "hostName": "coursera.org"
  },
  {
    "id": "34",
    "url": "https://www.nature.com/",
    "title": "Nature",
    "parentId": null,
    "category": "Science",
    "hostName": "nature.com"
  },
  {
    "id": "35",
    "url": "https://www.theguardian.com/",
    "title": "The Guardian",
    "parentId": null,
    "category": "News",
    "hostName": "theguardian.com"
  },
  {
    "id": "36",
    "url": "https://www.weather.com/",
    "title": "The Weather Channel",
    "parentId": null,
    "category": "Weather",
    "hostName": "weather.com"
  },
  {
    "id": "37",
    "url": "https://www.producthunt.com/",
    "title": "Product Hunt",
    "parentId": null,
    "category": "Technology",
    "hostName": "producthunt.com"
  },
  {
    "id": "38",
    "url": "https://www.theverge.com/",
    "title": "The Verge",
    "parentId": null,
    "category": "Technology",
    "hostName": "theverge.com"
  },
  {
    "id": "39",
    "url": "https://www.tripadvisor.com/",
    "title": "TripAdvisor",
    "parentId": null,
    "category": "Travel",
    "hostName": "tripadvisor.com"
  },
  {
    "id": "40",
    "url": "https://www.bloomberg.com/",
    "title": "Bloomberg",
    "parentId": null,
    "category": "Finance",
    "hostName": "bloomberg.com"
  }
];


function App() {
  const [results, setResults] = useState<any>();
  const [dimensions, setDimensions] = useState({
    height: window.innerHeight,
    width: window.innerWidth,
  });
  const [loading, setLoading] = useState(false);

  const [isMounted, setIsMounted] = useState(false);

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
    } catch (error) {
      console.warn(`website ${url} not accessible`);
      return undefined;
    }

    console.log('response:')
    console.log({ response })
    const text = turndownService.turndown(response.data);
    console.log('xformed', { text })
    return text;
  }

  async function createEmbedding(text: string, url: string) {
    try {
      await tf.setBackend('webgl');
    } catch (err) {
      console.log('WebGL not supported, falling back to CPU backend');
      await tf.setBackend('cpu');
    }

    //Check if the embedding is in the cache
    const cachedEmbedding = localStorage?.getItem(`untabbed-embedding-${url}`);
    if (cachedEmbedding) {
      return JSON.parse(cachedEmbedding);
    }

    // If not in the cache, create the embedding
    const model = await use.load();
    const embeddings = await model.embed([text]);
    const embeddingArray = embeddings.arraySync()[0];

    // Store the embedding in the cache
    localStorage?.setItem(`untabbed-embedding-${url}`, JSON.stringify(embeddingArray));
    return embeddingArray;
  }

  function storeEmbedding(url: string, embedding: number[]) {
    const dbName = "untabbedDB";
    const storeName = "textStore";

    let request = indexedDB.open(dbName, 1);

    // request.onupgradeneeded = function (event) {
    //   let db = (event.target as IDBOpenDBRequest)?.result;
    //   if (!db) return
    //   let objectStore = db.createObjectStore(storeName, { keyPath: "url" });
    //   objectStore.createIndex("embedding", "embedding", { unique: false });
    // };

    request.onupgradeneeded = function (event) {
      let db = (event.target as IDBOpenDBRequest)?.result;
      if (!db) return;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };

    request.onsuccess = function (event) {
      let db = (event.target as IDBOpenDBRequest)?.result;
      if (!db) return
      let transaction = db.transaction([storeName], "readwrite");
      let objectStore = transaction.objectStore(storeName);
      let request = objectStore.add({ url: url, embedding: embedding });

      request.onsuccess = function (event) {
        console.log("Embedding stored successfully!");
      };
    };

    request.onerror = function (event) {
      let ev = (event.target as IDBOpenDBRequest);
      console.error("Database error: " + ev);
    };
  }


  function fetchAllEmbeddings(): Promise<number[][]> {
    const dbName = "untabbedDB";
    const storeName = "textStore";

    let request = indexedDB.open(dbName, 1);

    return new Promise((resolve, reject) => {
      request.onsuccess = function (event) {
        let db = (event.target as IDBOpenDBRequest)?.result;
        let transaction = db.transaction([storeName], "readonly");
        let objectStore = transaction.objectStore(storeName);
        let getAllRequest = objectStore.getAll();

        getAllRequest.onsuccess = function (event: any) {
          if (event.target.result) {
            let embeddings = event.target.result.map((record: any) => record.embedding);
            resolve(embeddings);
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

  function fetchAllOpenTabs() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({}, function (tabs) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
        } else {
          resolve(tabs);
        }
      });
    });
  }


  async function visualizeEmbeddings(embeddings: number[][], stubData: any) {
    const prng = new Prando(42);
    try {

      const filteredIndeces = embeddings
        .map((x, i) => x !== undefined ? i : -1)
        .filter(i => i !== undefined);


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

  function normalizePositions(positions: number[][], indeces: number[]) {

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
      return { x: newX, y: newY, schema: stubData[index] }
    })
    return normalizedPositions;
  }

  async function runEmbeddingAndStorage(stubData: any) {
    const embeddings = await runEmbeddingPipeline(stubData)
    if (embeddings !== undefined) {
      const nonNulls = embeddings.filter(x => x !== undefined)
      nonNulls.filter(x => x !== undefined).forEach(async (embedding, i) => {
        storeEmbedding(stubData[i].url, embedding);
      })
      return embeddings
    }
  }
  async function calculatePositionsFromEmbeddings(embeddings: number[][], stubData: any) {
    console.log('about to visualize embeddings')
    const rawPositions = await visualizeEmbeddings(embeddings, stubData)
    console.log('raw positions')
    console.log({ rawPositions })
    if (rawPositions !== undefined) {
      const normalized = normalizePositions(rawPositions.positions, rawPositions.ids)
      console.log('normalized positions')
      console.log({ normalized })
      return normalized
    }
    return undefined
  }
  async function runEmbeddingPipeline(stubData: any): Promise<number[][] | undefined> {
    if (stubData) {
      try {
        const drawNodesPromises = await Promise.all(stubData.map(async (x: any, i: number) => {
          const url = x.url;
          console.log(`getting text from ${url}`)
          const text = await getWebsiteTextFromUrl(url);
          if (text === undefined) {
            return undefined
          }

          console.log(`website text: \n\n ${text}`);
          const embedding = await createEmbedding(text, url);
          console.log(`embedding: \n\n ${embedding}`);
          return embedding
        }))
        console.log('promises')
        console.log(drawNodesPromises)

        // const r = await Promise.all(drawNodesPromises); // Wait for all promises to resolve
        // console.log({ r })
        return drawNodesPromises
      } catch (error) {
        console.error('An error occurred:', error);
        return undefined;
      }
    }
    return undefined
  }


  // chrome?.storage?.onChanged.addListener((update) => {
  //   chrome?.storage?.sync.get(['mapKey'], async(result) => {
  //     if (chrome.runtime.lastError) {
  //       // Handle the error, e.g., log it or show a message to the user
  //       console.log('error message')
  //       console.error(chrome.runtime.lastError.message);
  //     } else {
  //       const r = result['mapKey'] || [];
  //       console.log('initial results: ', { r })
  //       if (r) {
  //         const sortedResults = r.sort((a, b) => (a?.timeEnter || '').localeCompare((b?.timeEnter || '')))

  //         console.log({ sortedResults })

  //         const increment = window.innerHeight / sortedResults.length;
  //         const drawNodesPromises = sortedResults.map(async (x, i) => {
  //           const url = x.url;
  //           console.log(`getting text from ${url}`)
  //           const text = await getWebsiteTextFromUrl(url);
  //           console.log(`website text: \n\n ${text}`);
  //           const embedding = await createEmbedding(text);
  //           console.log(`embedding: \n\n ${embedding}`);
  //           storeEmbedding(url, embedding);
  //           const xPos = Math.random() * window.innerWidth;
  //           return { x: xPos, y: i * increment, schema: { ...x } };
  //         })
  //         console.log('promises')
  //         console.log(drawNodesPromises)

  //         const drawNodes = await Promise.all(drawNodesPromises); // Wait for all promises to resolve

  //         console.log({ drawNodes })

  //         setResults(drawNodes);
  //       }
  //     }
  //   })
  // })

  // console.log({ results })
  // console.log({ stubData })

  useEffect(() => {
    const runAsync = async () => {
      // const embeddingResults = await fetchEmbeddings();
      setLoading(true)
      // console.log('pre running embedding pipeline')
      // const embeddingResults = await runEmbeddingPipeline(stubData)
      // console.log('ran embedding pipeline')
      // // const embeddingResults = await fetchAllEmbeddings();
      // if (embeddingResults) {
      //   const normalizedPositions = await calculatePositionsFromEmbeddings(embeddingResults, stubData)
      //   setResults(normalizedPositions);
      //   fetchAllOpenTabs().then((tabs) => {
      //     console.log('tabs are:')
      //     console.log({ tabs })
      //   })
      // }
      // setLoading(false)
    };

    runAsync();
  }, [dimensions.width, dimensions.height]);

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
          fontSize: '24px'
        }}>
          Loading...
        </div>
      ) : (
        <Stage width={dimensions.width} height={dimensions.height} options={{ background: 0x1099bb }}>
          {results && results.map((result: any, key: number) => {
            return <WebNode key={result?.schema?.id || key} nodeInfo={result} radius={DEFAULT_RADIUS} colorMap={colorMap} />
          })}
        </Stage>
      )}
    </>
  );

}
// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>Hello Vite + React!</p>
//         <p>
//           <button type="button" onClick={() => setCount((count) => count + 1)}>
//             count is: {count}
//           </button>
//         </p>
//         <p>
//           Edit <code>App.jsx</code> and save to test HMR updates.
//         </p>
//         <p>
//           <a
//             className="App-link"
//             href="https://reactjs.org"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Learn React
//           </a>
//           {' | '}
//           <a
//             className="App-link"
//             href="https://vitejs.dev/guide/features.html"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Vite Docs
//           </a>
//         </p>
//       </header>
//     </div>
//   )
// }

export default App
