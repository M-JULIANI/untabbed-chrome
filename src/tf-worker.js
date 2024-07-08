// // tf-worker.js
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';
// require('@tensorflow/tfjs');
// const use = require('@tensorflow-models/universal-sentence-encoder');

const indexdb_name = "untabbedDB";
const indexdb_store = "textStore";

self.window = self;

let tf_model = undefined;

async function loadTFModel() {
    try {
        await tf.setBackend('webgl');
    } catch (err) {
        console.log('WebGL not supported, falling back to CPU backend');
        await tf.setBackend('cpu');
    }

    try {
        tf_model = await use.load();
        console.log('tf_model loaded: ', tf_model);
    } catch (error) {
        console.log('tf_model load error:', error);
    }
}


class TabHandler {
    constructor() {
    }
    //fetches indexDB records and compares them to the current tabs
    async processTabs(tabs) {
        if (!Array.isArray(tabs) || tabs.length < 1) return;
        const storedRecords = await fetchAllRecords();

        if (storedRecords.length === 0) {
            console.log('no records: running pipeline on the following')
            console.log(tabs)
            await runEmbeddingPipeline(tabs);
        }
        else {

            const notYetProcessed = tabs.filter((tab) => {
                return (!(storedRecords.find(x => x.url === tab.url) && storedRecords.find(x => x.id === tab.id)))
            });

            const processed = tabs.filter((tab) => {
                return (storedRecords.find(x => x.url === tab.url) && storedRecords.find(x => x.id === tab.id))
            });
            await runEmbeddingPipeline(notYetProcessed);

            processed.forEach((tab) => {
                console.log(`Tab ${tab.id} has already been processed`);
            })
        }
    }
}

async function fetchAllRecords() {
    let request = indexedDB.open(indexdb_name, 1);
    return new Promise((resolve, reject) => {
        request.onsuccess = function (event) {
            let db = event.target.result;
            try {
                let transaction = db.transaction([indexdb_store], "readonly");
                let objectStore = transaction.objectStore(indexdb_store);
                let getAllRequest = objectStore.getAll();

                getAllRequest.onsuccess = function (event) {
                    if (event.target.result) {
                        let embeddings = event.target.result.map((record) => record);
                        resolve(embeddings);
                    } else {
                        resolve([]);
                    }
                };

                getAllRequest.onerror = function (event) {
                    let ev = (event.target);
                    reject("Database error: " + ev);
                };
            } catch (error) {
                console.error("Transaction or objectStore access failed", error);
                reject("Transaction or objectStore access error: " + error.message);
            }
        };

        request.onerror = function (event) {
            let ev = (event.target);
            reject("Database error: " + ev);
        };
    });
}

function storeEmbedding(url, embedding, id, title, lastAccessed) {
    console.log('attempting to store embedding...')
    let request = indexedDB.open(indexdb_name, 1);

    request.onupgradeneeded = function (event) {
        try {
            let db = event.target.result;
            if (!db.objectStoreNames.contains(indexdb_store)) {
                makeObjectStore(db, indexdb_store)
            }
        } catch (error) {
            console.error("Upgrade needed error: ", error);
        }
    };

    request.onsuccess = function (event) {
        try {
            let db = event.target.result;
            console.log('onsuccess, db: ' + db)
            if (!db) return
            let transaction = db.transaction([indexdb_store], "readwrite");
            let objectStore = transaction.objectStore(indexdb_store);
            let request = objectStore.add({ url, id, title, embedding, lastAccessed });

            request.onsuccess = function (event) {
                console.log("Embedding stored successfully!");
            };

            request.onerror = function (event) {
                throw new Error("Error storing embedding: " + event.target.errorCode);
            };
        } catch (error) {
            console.error("Transaction error: ", error);
        }
    };

    request.onerror = function (event) {
        let ev = (event.target);
        console.error("Database error: " + ev.errorCode);
    };
}

async function createEmbedding(text) {
    //check to see if in fact tf_model is loaded
    if (tf_model !== undefined) {
        console.log('Model loaded...');
    }
    else {
        console.log('tf_model: ' + tf_model)
    }
    try {
        const texto = [text]
        const embeddings = await tf_model.embed(texto);
        const embeddingArray = embeddings.arraySync()[0];
        return embeddingArray;
    } catch (err) {
        console.error('Error during embedding or parsing:', err);
        return null; // Or handle this case as needed
    }
}

async function runEmbeddingPipeline(data) {
    if (data) {
        try {
            const embedPromises = await Promise.all(data.map(async (x, i) => {
                const url = x.url;
                const title = x.title
                const id = x.id
                const lastAccessed = x.lastAccessed
                // console.log(`getting text from ${url}`)
                // // const text = await getWebsiteTextFromUrl(url);
                // let text = 'test text'
                // chrome.runtime.sendMessage({
                //   action: 'fetch_html',
                //   urls: [url]
                // }, response => {
                //   console.log('Response for multiple URLs:', response);
                //   text = response.results[0].html;
                //   console.log('text reponse: ')
                //   console.log(text)
                // });
                // console.log('texto: ' + text)
                // if (text === undefined) {
                //   return undefined
                // }

                console.log(`website title:  ${title}`);
                const validModel = tf_model !== undefined;
                console.log('valid tf_model? ' + validModel)
                const embedding = tf_model ? await createEmbedding(title) : null;
                console.log('attempting to store...')
                storeEmbedding(url, embedding, id, title, lastAccessed)
                console.log(`embedding: \n\n ${embedding}`);
                return embedding
            }))
            console.log('promises')
            console.log(embedPromises)

            return embedPromises
        } catch (error) {
            console.error('An error occurred:', error);
            return undefined;
        }
    }
    return undefined
}

function checkIndexes(db, indexdb_store) {
    try {
        const transaction = db.transaction(indexdb_store, 'readonly');
        const objectStore = transaction.objectStore(indexdb_store);
        const indexNames = objectStore.indexNames;

        console.log(`Indexes in ${indexdb_store}:`);
        for (let i = 0; i < indexNames.length; i++) {
            console.log(indexNames[i]);
        }
    }
    catch (err) {
        console.log('error checking indexes: ' + err)

    }
}
// Modified version to handle promises
function makeObjectStore(db, dbStore) {
    return new Promise((resolve, reject) => {
        const objectStore = db.createObjectStore(dbStore, { keyPath: 'id' });
        try {
            objectStore.createIndex("embedding", "embedding", { unique: false });
            objectStore.createIndex("url", "url", { unique: false });
            objectStore.createIndex("title", "title", { unique: false });
            objectStore.createIndex("lastAccessed", "lastAccessed", { unique: false });
            resolve(objectStore);
        } catch (error) {
            console.log('error creating object store with creator method');
            console.log(error);
            reject(error);
        }
    });
}
async function initializeDatabase() {
    try {
        const db = await new Promise((resolve, reject) => {
            const request = indexedDB.open(indexdb_name, 1);

            console.log('attempting to open DB__----____-');

            request.onupgradeneeded = function (event) { // Make this handler async
                const db = event.target.result;
                if (!db.objectStoreNames.contains(indexdb_store)) {
                    makeObjectStore(db, indexdb_store); // Await the creation
                }
            };

            request.onsuccess = function (event) {
                resolve(event.target.result);
            };

            request.onerror = function (event) {
                reject(`IndexDB error: ${event.target.errorCode}`);
            };
        });

            // Ensure the object store exists before proceeding
            if (!db.objectStoreNames.contains(indexdb_store)) {
                throw new Error("Object store does not existttttttt");
            }

        const transaction = db.transaction(indexdb_store, 'readonly');
        await new Promise((resolve, reject) => {
            transaction.oncomplete = function () {
                // Now it's safe to check indexes
                checkIndexes(db, indexdb_store);
                resolve();
            };
            transaction.onerror = function (event) {
                reject(`Transaction error: ${event.target.errorCode}`);
            };
        });

        console.log(`${indexdb_name} database opened successfully.`);
    } catch (error) {
        console.error(error);
    }
}


self.onmessage = async (e) => {
    console.log('Worker: Message received from main script');
    const operation = e.data.operation;
    const tabs = e.data.data
    try {
        if (operation === 'processTabs') {
            await loadTFModel();
            console.log('EEEENTERING>>>>>')
            console.log('seeding the db...')
            await initializeDatabase();
            const tabHandler = new TabHandler();
            console.log('tabs to process... ' + tabs.length)
            await tabHandler.processTabs(tabs);
            console.log('TensorFlow.js version:', tf.version.tfjs); e
            self.postMessage({ result: 'Computation done' });
        }
    } catch (error) {
        console.log('error in worker: ')
        console.log(error)
    }
};