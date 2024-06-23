// chrome.action.onClicked.addListener(function () {
//     chrome.tabs.create({
//       url: chrome.runtime.getURL('../index.html')
//     });
//   });

 import * as use from '@tensorflow-models/universal-sentence-encoder';
 import { UMAP } from 'umap-js';
 import axios from 'axios'
//  import jsdom from 'jsdom';
// const {JSDOM}  = jsdom;
async function getWebsiteText() {
    return document.body.innerText;
}

async function getWebsiteTextFromUrl(url) {
    const response = await axios.get(url);
    console.log('response:')
    console.log({response})
    return response;
}

async function createEmbedding(text, url) {
    // Check if the embedding is in the cache
    // const cachedEmbedding = localStorage?.getItem(url);
    // if (cachedEmbedding) {
    //     return JSON.parse(cachedEmbedding);
    // }

    // If not in the cache, create the embedding
    const model = await use.load();
    const embeddings = await model.embed([text]);
    const embeddingArray = embeddings.arraySync()[0];

    // Store the embedding in the cache
   // localStorage?.setItem(url, JSON.stringify(embeddingArray));

    return embeddingArray;
}

function storeEmbedding(url, embedding) {
    const dbName = "EmbeddingsDB";
    const storeName = "EmbeddingsStore";

    let request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = function(event) {
        let db = event.target.result;
        let objectStore = db.createObjectStore(storeName, { keyPath: "url" });
        objectStore.createIndex("embedding", "embedding", { unique: false });
    };

    request.onsuccess = function(event) {
        let db = event.target.result;
        let transaction = db.transaction([storeName], "readwrite");
        let objectStore = transaction.objectStore(storeName);
        let request = objectStore.add({ url: url, embedding: embedding });

        request.onsuccess = function(event) {
            console.log("Embedding stored successfully!");
        };
    };

    request.onerror = function(event) {
        console.error("Database error: " + event.target.errorCode);
    };
}

function visualizeEmbeddings(embeddings) {
    const umap = new UMAP();
    const embeddings2d = umap.fit(embeddings);
    console.log(embeddings2d);
}


(async () => {
    try{
  //  const url = window.location.href;
    const url = "https://duckdb.org/2021/06/25/querying-parquet"
    console.log(`getting text from ${url}`)
    const text = await getWebsiteTextFromUrl(url);
    console.log(`website text: \n\n ${text}`);
    const embedding = await createEmbedding(text);
    console.log(`embedding: \n\n ${embedding}`);
    storeEmbedding(url, embedding);
    }
    catch(e){
        console.log('throwing error: ')
        console.log(e)
    }

    // Assuming you have an array of embeddings for visualization
    // visualizeEmbeddings(arrayOfEmbeddings);
})();



//   chrome.action.onClicked.addListener((tab) => {
//     chrome.scripting.executeScript({
//         target: { tabId: tab.id },
//         files: ['website-embedder.js']
//     });
// });

  