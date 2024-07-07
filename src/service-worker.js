import TurndownService from 'turndown'
import * as tf from '@tensorflow/tfjs';

chrome.action.onClicked.addListener(function (tab) {
  chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
});

// const stubData = [
//   {
//     "id": "1",
//     "url": "https://news.ycombinator.com/",
//     "title": "HackerNews",
//     "parentId": null,
//     "category": "news",
//     "hostName": "ycombinator.com"
//   },
//   {
//     "id": "2",
//     "url": "https://www.randomeower.com/",
//     "title": "Randomeower",
//     "parentId": null,
//     "category": "General",
//     "hostName": "randomeower.com"
//   },
//   {
//     "id": "3",
//     "url": "https://www.boredombusted.com/",
//     "title": "Boredom Busted",
//     "parentId": null,
//     "category": "Entertainment",
//     "hostName": "boredombusted.com"
//   },
//   {
//     "id": "4",
//     "url": "https://www.shuffleme.se/",
//     "title": "ShuffleMe",
//     "parentId": null,
//     "category": "General",
//     "hostName": "shuffleme.se"
//   },
//   {
//     "id": "5",
//     "url": "https://www.kaspersky.com/resource-center/threats/malware-examples",
//     "title": "Types of Malware & Malware Examples",
//     "parentId": null,
//     "category": "Technology",
//     "hostName": "kaspersky.com"
//   },
//   {
//     "id": "6",
//     "url": "https://www.knowledgelover.com/",
//     "title": "Knowledge Lover",
//     "parentId": null,
//     "category": "Education",
//     "hostName": "knowledgelover.com"
//   },
//   {
//     "id": "7",
//     "url": "https://www.goodreads.com/",
//     "title": "Goodreads",
//     "parentId": null,
//     "category": "Books",
//     "hostName": "goodreads.com"
//   },
//   {
//     "id": "8",
//     "url": "https://www.howstuffworks.com/",
//     "title": "How Stuff Works",
//     "parentId": null,
//     "category": "Education",
//     "hostName": "howstuffworks.com"
//   },
//   {
//     "id": "9",
//     "url": "https://www.codecademy.com/",
//     "title": "Codecademy",
//     "parentId": null,
//     "category": "Education",
//     "hostName": "codecademy.com"
//   },
//   {
//     "id": "10",
//     "url": "https://www.bbc.com/future",
//     "title": "BBC Future",
//     "parentId": null,
//     "category": "News",
//     "hostName": "bbc.com"
//   },
//   {
//     "id": "11",
//     "url": "https://99u.adobe.com/",
//     "title": "99U",
//     "parentId": null,
//     "category": "Creativity",
//     "hostName": "99u.com"
//   },
//   {
//     "id": "12",
//     "url": "https://www.fastcompany.com/",
//     "title": "Fast Company",
//     "parentId": null,
//     "category": "Business",
//     "hostName": "fastcompany.com"
//   },
//   {
//     "id": "13",
//     "url": "https://www.ehow.com/",
//     "title": "eHow",
//     "parentId": null,
//     "category": "How To",
//     "hostName": "ehow.com"
//   },
//   {
//     "id": "14",
//     "url": "https://www.powersearchingwithgoogle.com/",
//     "title": "Power Searching With Google",
//     "parentId": null,
//     "category": "Education",
//     "hostName": "powersearchingwithgoogle.com"
//   },
//   {
//     "id": "15",
//     "url": "https://www.makeuseof.com/",
//     "title": "Make Use of",
//     "parentId": null,
//     "category": "Technology",
//     "hostName": "makeuseof.com"
//   },
//   {
//     "id": "16",
//     "url": "https://www.quora.com/",
//     "title": "Quora",
//     "parentId": null,
//     "category": "Q&A",
//     "hostName": "quora.com"
//   },
//   {
//     "id": "17",
//     "url": "https://www.factslides.com/",
//     "title": "Fact Slides",
//     "parentId": null,
//     "category": "Education",
//     "hostName": "factslides.com"
//   },
//   {
//     "id": "18",
//     "url": "https://www.reddit.com/",
//     "title": "Reddit",
//     "parentId": null,
//     "category": "Community",
//     "hostName": "reddit.com"
//   },
//   {
//     "id": "19",
//     "url": "https://www.code.org/",
//     "title": "Code.org",
//     "parentId": null,
//     "category": "Education",
//     "hostName": "code.org"
//   },
//   {
//     "id": "20",
//     "url": "https://www.writersdigest.com/",
//     "title": "Writer’s Digest",
//     "parentId": null,
//     "category": "Writing",
//     "hostName": "writersdigest.com"
//   },
//   {
//     "id": "21",
//     "url": "https://www.wikipedia.org/",
//     "title": "Wikipedia",
//     "parentId": null,
//     "category": "Education",
//     "hostName": "wikipedia.org"
//   },
//   {
//     "id": "22",
//     "url": "https://www.imdb.com/",
//     "title": "IMDb",
//     "parentId": null,
//     "category": "Entertainment",
//     "hostName": "imdb.com"
//   },
//   {
//     "id": "23",
//     "url": "https://www.stackoverflow.com/",
//     "title": "Stack Overflow",
//     "parentId": null,
//     "category": "Technology",
//     "hostName": "stackoverflow.com"
//   },
//   {
//     "id": "24",
//     "url": "https://www.ted.com/",
//     "title": "TED Talks",
//     "parentId": null,
//     "category": "Education",
//     "hostName": "ted.com"
//   },
//   {
//     "id": "25",
//     "url": "https://www.nytimes.com/",
//     "title": "The New York Times",
//     "parentId": null,
//     "category": "News",
//     "hostName": "nytimes.com"
//   },
//   {
//     "id": "26",
//     "url": "https://www.medium.com/",
//     "title": "Medium",
//     "parentId": null,
//     "category": "Writing",
//     "hostName": "medium.com"
//   },
//   {
//     "id": "27",
//     "url": "https://www.linkedin.com/",
//     "title": "LinkedIn",
//     "parentId": null,
//     "category": "Business",
//     "hostName": "linkedin.com"
//   },
//   {
//     "id": "28",
//     "url": "https://www.pinterest.com/",
//     "title": "Pinterest",
//     "parentId": null,
//     "category": "Lifestyle",
//     "hostName": "pinterest.com"
//   },
//   {
//     "id": "29",
//     "url": "https://www.netflix.com/",
//     "title": "Netflix",
//     "parentId": null,
//     "category": "Entertainment",
//     "hostName": "netflix.com"
//   },
//   {
//     "id": "30",
//     "url": "https://www.spotify.com/",
//     "title": "Spotify",
//     "parentId": null,
//     "category": "Music",
//     "hostName": "spotify.com"
//   },
//   {
//     "id": "31",
//     "url": "https://www.khanacademy.org/",
//     "title": "Khan Academy",
//     "parentId": null,
//     "category": "Education",
//     "hostName": "khanacademy.org"
//   },
//   {
//     "id": "32",
//     "url": "https://www.nationalgeographic.com/",
//     "title": "National Geographic",
//     "parentId": null,
//     "category": "Education",
//     "hostName": "nationalgeographic.com"
//   },
//   {
//     "id": "33",
//     "url": "https://www.coursera.org/",
//     "title": "Coursera",
//     "parentId": null,
//     "category": "Education",
//     "hostName": "coursera.org"
//   },
//   {
//     "id": "34",
//     "url": "https://www.nature.com/",
//     "title": "Nature",
//     "parentId": null,
//     "category": "Science",
//     "hostName": "nature.com"
//   },
//   {
//     "id": "35",
//     "url": "https://www.theguardian.com/",
//     "title": "The Guardian",
//     "parentId": null,
//     "category": "News",
//     "hostName": "theguardian.com"
//   },
//   {
//     "id": "36",
//     "url": "https://www.weather.com/",
//     "title": "The Weather Channel",
//     "parentId": null,
//     "category": "Weather",
//     "hostName": "weather.com"
//   },
//   {
//     "id": "37",
//     "url": "https://www.producthunt.com/",
//     "title": "Product Hunt",
//     "parentId": null,
//     "category": "Technology",
//     "hostName": "producthunt.com"
//   },
//   {
//     "id": "38",
//     "url": "https://www.theverge.com/",
//     "title": "The Verge",
//     "parentId": null,
//     "category": "Technology",
//     "hostName": "theverge.com"
//   },
//   {
//     "id": "39",
//     "url": "https://www.tripadvisor.com/",
//     "title": "TripAdvisor",
//     "parentId": null,
//     "category": "Travel",
//     "hostName": "tripadvisor.com"
//   },
//   {
//     "id": "40",
//     "url": "https://www.bloomberg.com/",
//     "title": "Bloomberg",
//     "parentId": null,
//     "category": "Finance",
//     "hostName": "bloomberg.com"
//   }
// ];

// const turndownService = new TurndownService();

// chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
//   if (request.action === 'fetch_html') {
//     console.log('Responding to request!');
//     // Handling multiple URLs
//     if (Array.isArray(request.urls)) {
//       try {
//         const responses = await Promise.all(request.urls.map(async (url) => {
//           const response = await fetch(url, { mode: 'cors' });
//           const text = await response.text();
//           return { url, html: text }; // Return an object with URL and its HTML content
//         }));
//         sendResponse({ results: responses });
//         console.log('Sending response for multiple URLs');
//       } catch (error) {
//         sendResponse({ error: error.message });
//         console.log('Sending error: ' + error.message);
//       }
//     } else if (request.url) { // Single URL case for backward compatibility
//       try {
//         const response = await fetch(request.url, { mode: 'cors' });
//         const text = await response.text();
//         sendResponse({ html: text });
//         console.log('Sending response: ' + text);
//       } catch (error) {
//         sendResponse({ error: error.message });
//         console.log('Sending error: ' + error.message);
//       }
//     }
//   }
//   return true; // Keep the message channel open for sendResponse.
// });


// class TabHandler {
//   tabs = {}
//   constructor() {
//     this.tabs = {}
//   }

//   loadTabs() {
//     chrome.windows.getAll({ populate: true }, function (windowList) {
//       const tabs = {};
//       const tabIds = [];
//       for (var i = 0; i < windowList.length; i++) {
//         windowList[i].current = false
//         windowList[i].focused = false;

//         for (var j = 0; j < windowList[i].tabs.length; j++) {
//           tabIds[tabIds.length] = windowList[i].tabs[j].id;
//           tabs[windowList[i].tabs[j].id] = windowList[i].tabs[j];
//         }
//       }
//       console.log('windowList: ')
//       console.log({ windowList })
//       console.log({ tabs, tabIds })
//       this.tabs = tabs;
//     });
//   }


//   //fetches indexDB records and compares them to the current tabs
//   async processTabs() {
//     if (!Array.isArray(this.tabs) || this.tabs.length < 1) return;

//     if (!('indexedDB' in window)) {
//       console.warn('IndexedDB is not supported in this environment.');
//       return;
//     }

//     const storedRecords = await fetchAllRecords();

//     this.tabs.forEach(element => {
//       if (element.url === storedRecords.find(x => x.url === element.url) && element.id === storedRecords.find(x => x.id === element.id)) {
//         console.log('record found: ' + element.url);
//         return;
//       }
//       else{
//         console.log('record not found: ' + element.url);
//       }
//     });
//   }
// }

// function initializeDatabase() {
//   const dbName = "untabbedDB";
//   const storeName = "textStore";
//   const request = indexedDB.open(dbName, 1);

//   request.onupgradeneeded = function(event) {
//     const db = event.target.result;
//     if (!db.objectStoreNames.contains(storeName)) {
//       db.createObjectStore(storeName);
//       console.log(`${storeName} object store created.`);
//     }
//   };

//   request.onsuccess = function() {
//     console.log(`${dbName} database opened successfully.`);
//   };

//   request.onerror = function(event) {
//     console.error(`IndexDB error: ${event.target.errorCode}`);
//   };
// }
// async function fetchAllRecords() {
//   const dbName = "untabbedDB";
//   const storeName = "textStore";

//   let request = indexedDB.open(dbName, 1);

//   return new Promise((resolve, reject) => {
//     request.onsuccess = function (event) {
//       let db = (event.target)?.result;
//       console.log('fetchallrecords - onsuccess, db: ' + db)
//       try{
//       let transaction = db.transaction([storeName], "readonly");
//       let objectStore = transaction.objectStore(storeName);
//       let getAllRequest = objectStore.getAll();

//       getAllRequest.onsuccess = function (event) {
//         if (event.target.result) {
//           let embeddings = event.target.result.map((record) => record);
//           resolve(embeddings);
//         } else {
//           resolve([]);
//         }
//       };

//       getAllRequest.onerror = function (event) {
//         let ev = (event.target);
//         reject("Database error: " + ev);
//       };
//     } catch(error){
//       console.error("Transaction or objectStore access failed", error);
//       reject("Transaction or objectStore access error: " + error.message);
//     }
//     };

//     request.onerror = function (event) {
//       let ev = (event.target);
//       reject("Database error: " + ev);
//     };
//   });
// }

// async function getWebsiteTextFromUrl(url) {

//   // let headers = {
//   //   "Accept": 'text/html',
//   //   "Content-Type": 'text/html',
//   // }

//   const updated_url = `http://localhost:5000/api?url=${url}`
//   let response = undefined

//   try {
//     response = await axios.get(updated_url);
//     // console.log('response:')
//     // console.log({ response })
//     const text = turndownService.turndown(response.data);
//     console.log('xformed', { text })
//     return text;
//   }
//   catch (error) {
//     console.warn(`website ${url} not accessible`);
//     console.log(error)
//     return undefined;
//   }
// }

// async function createEmbedding(text, url) {
//   try {
//     await tf.setBackend('webgl');
//   } catch (err) {
//     console.log('WebGL not supported, falling back to CPU backend');
//     await tf.setBackend('cpu');
//   }

//   //Check if the embedding is in the cache
//   const cachedEmbedding = localStorage.getItem(`untabbed-embedding-${url}`);
//   if (cachedEmbedding) {
//     return JSON.parse(cachedEmbedding);
//   }

//   // If not in the cache, create the embedding
//   const model = await use.load();
//   const embeddings = await model.embed([text]);
//   const embeddingArray = embeddings.arraySync()[0];

//   // Store the embedding in the cache
//   localStorage.setItem(`untabbed-embedding-${url}`, JSON.stringify(embeddingArray));
//   return embeddingArray;
// }

// function storeEmbedding(url, embedding) {
//   const dbName = "untabbedDB";
//   const storeName = "textStore";

//   let request = indexedDB.open(dbName, 1);

//   // request.onupgradeneeded = function (event) {
//   //   let db = (event.target as IDBOpenDBRequest)?.result;
//   //   if (!db) return
//   //   let objectStore = db.createObjectStore(storeName, { keyPath: "url" });
//   //   objectStore.createIndex("embedding", "embedding", { unique: false });
//   // };

//   request.onupgradeneeded = function (event) {
//     let db = (event.target)?.result;
//     if (!db) return;
//     console.log('onupgradeneeded, db: ' + db)
//     if (!db.objectStoreNames.contains(storeName)) {
//       db.createObjectStore(storeName);
//     }
//   };

//   request.onsuccess = function (event) {
//     let db = (event.target)?.result;
//     console.log('onsuccess, db: ' + db)
//     if (!db) return
//     let transaction = db.transaction([storeName], "readwrite");
//     let objectStore = transaction.objectStore(storeName);
//     let request = objectStore.add({ url: url, embedding: embedding });

//     request.onsuccess = function (event) {
//       console.log("Embedding stored successfully!");
//     };
//   };

//   request.onerror = function (event) {
//     let ev = (event.target);
//     console.error("Database error: " + ev);
//   };
// }
// async function runEmbeddingPipeline(stubData) {
//   if (stubData) {
//     try {
//       const urls = stubData.map(x => x.url);
//       // chrome.runtime.sendMessage({
//       //   action: 'fetch_html',
//       //   urls: [...urls]
//       // }, response => {
//       //   console.log('Response for multiple URLs:', response);
//       // });

//       const drawNodesPromises = await Promise.all(stubData.map(async (x, i) => {
//         const url = x.url;
//         console.log(`getting text from ${url}`)
//         // const text = await getWebsiteTextFromUrl(url);
//         let text = 'test text'
//         chrome.runtime.sendMessage({
//           action: 'fetch_html',
//           urls: [url]
//         }, response => {
//           console.log('Response for multiple URLs:', response);
//           text = response.results[0].html;
//           console.log('text reponse: ')
//           console.log(text)
//         });
//         console.log('texto: ' + text)
//         if (text === undefined) {
//           return undefined
//         }

//         console.log(`website text: \n\n ${text}`);
//         const embedding = await createEmbedding(text, url);
//         storeEmbedding(url, embedding)
//         console.log(`embedding: \n\n ${embedding}`);
//         return embedding
//       }))
//       console.log('promises')
//       console.log(drawNodesPromises)

//       // const r = await Promise.all(drawNodesPromises); // Wait for all promises to resolve
//       // console.log({ r })
//       return drawNodesPromises
//     } catch (error) {
//       console.error('An error occurred:', error);
//       return undefined;
//     }
//   }
//   return undefined
// }

// //seed indexDB storage
// console.log('seeding the db...')
// initializeDatabase();
// runEmbeddingPipeline(stubData)

// const tabController = new TabHandler();
// console.log('loading tabs...')
// tabController.loadTabs();
// console.log('processing tabs...')
// tabController.processTabs();

// let worker;

// function startWorker() {
//   if (worker) {
//     worker.terminate();
//   }
//   worker = new Worker(chrome.runtime.getURL('worker.js'));

//   worker.onmessage = function(e) {
//     console.log('Message received from worker:', e.data);
//   };

//   worker.postMessage({cmd: 'process'});
// }

// // Run the worker on initialization
// startWorker();
// console.log('worker initialized..')


// Function to check for changes in the IndexedDB store
function pollIndexedDBChanges(dbName, storeName) {
  let lastCheck = 0; // Timestamp of the last check

  const checkForChanges = () => {
    const request = indexedDB.open(dbName, 1);

    request.onsuccess = function(event) {
      const db = event.target.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);

      // Assuming there's a timestamp field in your store to track the last update time
      const index = store.index('timestamp'); // Make sure to create this index
      const keyRange = IDBKeyRange.lowerBound(lastCheck, true); // Get all entries updated after the last check

      index.openCursor(keyRange).onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
          // Found an updated record
          console.log('Change detected in store:', cursor.value);
          lastCheck = cursor.value.timestamp; // Update the timestamp of the last check
          cursor.continue();
        } else {
          // No more updated records
          console.log('No new changes since last check.');
        }
      };

      transaction.oncomplete = function() {
        db.close();
      };
    };

    request.onerror = function(event) {
      console.error('Error opening IndexedDB:', event.target.errorCode);
      // If the error is because the database doesn't exist, return a default object
      if (event.target.errorCode === 'NotFoundError') {
        console.log('Database or store not found. Returning default object.');
        return { message: 'No data store exists.' }; // Adjust this object as needed
      }
    };
  };

  // Poll for changes every 10 seconds
  setInterval(checkForChanges, 10000);
}

// Call the function with your database and store names
pollIndexedDBChanges("untabbedDB", "textStore");
