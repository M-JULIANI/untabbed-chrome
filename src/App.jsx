import { useState, useEffect } from 'react'
import logo from './logo.svg'
import './App.css'
import { Stage, Container, Sprite, Text, Graphics } from '@pixi/react';
import { WebNode } from './components/WebNode'
import * as use from '@tensorflow-models/universal-sentence-encoder';
import * as tf from '@tensorflow/tfjs';
import { UMAP } from 'umap-js';
import axios from 'axios'
import TurndownService from 'turndown'

const turndownService = new TurndownService();

// let html_text = "<h1>Hello World</h1>";
// let markdown_text = turndownService.turndown(html_text);

// console.log(markdown_text); // Outputs: # Hello World

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
  }
]

function App() {
  const [results, setResults] = useState();
  const [dimensions, setDimensions] = useState({
    height: window.innerHeight,
    width: window.innerWidth,
  });

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

  console.log('rendering')

  useEffect(() => {


  }, [])

  async function getWebsiteTextFromUrl(url) {

    // let headers = {
    //   "Accept": 'text/html',
    //   "Content-Type": 'text/html',
    // }

    const updated_url = `http://localhost:5000/api?url=${url}`
    const response = await axios.get(updated_url);

    console.log('response:')
    console.log({ response })

    const text = turndownService.turndown(response.data);
    console.log('xformed', {text})
    return text;
  }

  async function createEmbedding(text, url) {
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

  function storeEmbedding(url, embedding) {
    const dbName = "untabbedDB";
    const storeName = "textStore";

    let request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = function (event) {
      let db = event.target.result;
      let objectStore = db.createObjectStore(storeName, { keyPath: "url" });
      objectStore.createIndex("embedding", "embedding", { unique: false });
    };

    request.onsuccess = function (event) {
      let db = event.target.result;
      let transaction = db.transaction([storeName], "readwrite");
      let objectStore = transaction.objectStore(storeName);
      let request = objectStore.add({ url: url, embedding: embedding });

      request.onsuccess = function (event) {
        console.log("Embedding stored successfully!");
      };
    };

    request.onerror = function (event) {
      console.error("Database error: " + event.target.errorCode);
    };
  }

  async function runPipeline(stubData) {
    if (stubData) {
      try {

        const increment = 100
        const drawNodesPromises = await Promise.all(stubData.map(async (x, i) => {
          const url = x.url;
          console.log(`getting text from ${url}`)
          const text = await getWebsiteTextFromUrl(url);
          console.log(`website text: \n\n ${text}`);
          const embedding = await createEmbedding(text);
          console.log(`embedding: \n\n ${embedding}`);
          storeEmbedding(url, embedding);
          const xPos = Math.random() * window.innerWidth;
          return { x: xPos, y: i * increment, schema: { ...x } };
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
    const resultsPipeline = runPipeline(stubData)
    setResults(resultsPipeline);
  }, [])

  const draws = stubData.map((result, key) => {
    const xPos = Math.max(100, Math.min(window.innerWidth - 100, Math.random() * window.innerWidth));
    const yPos = Math.max(100, Math.min(window.innerHeight - 100, Math.random() * window.innerHeight));
    return { x: xPos, y: yPos, schema: { ...result } };
  });

  return (
    <Stage width={dimensions.width} height={dimensions.height} options={{ background: 0x1099bb }}>
      {draws && draws.map((result, key) => {
        return <WebNode key={result?.schema?.id || key} nodeInfo={result} radius={50} />
      })}
    </Stage>
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
