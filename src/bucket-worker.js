import { makeBucketsWithRetry } from "./lib/ai";
import { SIDE_GUTTER, INDEXDB_NAME, INDEXDB_STORE, DB_VERSION } from "./lib/constants";
import { normalizePositionsOnlyWithWindow, remap, separateParticles } from "./lib/math";

function fetchAllRecords() {
  console.log("Opening IndexedDB:", INDEXDB_NAME);
  let request = indexedDB.open(INDEXDB_NAME, DB_VERSION);

  return new Promise((resolve, reject) => {
    request.onsuccess = function (event) {
      console.log("IndexedDB opened successfully");
      let db = event.target?.result;
      console.log("Starting transaction on store:", INDEXDB_STORE);
      let transaction = db.transaction(INDEXDB_STORE, "readonly");
      let objectStore = transaction.objectStore(INDEXDB_STORE);
      console.log("Fetching all records from store:", INDEXDB_STORE);

      let getAllRequest = objectStore.getAll();

      getAllRequest.onsuccess = function (event) {
        let records = event.target.result.map((record) => record);
        resolve(records);
      };

      getAllRequest.onerror = function (event) {
        console.error("Error fetching records:", event);
        reject("Database error: " + event);
      };
    };

    request.onerror = function (event) {
      console.error("IndexedDB open error:", event);
      reject("IndexedDB open error: " + event);
    };
  });
}

const layoutBuckets = async (data, results, innerWidth, innerHeight) => {
  let bm, mc;
  try {
    const bucketMap = await makeBucketsWithRetry(data);
    bm = bucketMap;

    console.log("laying out some buckets...");
    console.log({ bucketMap, results });

    const mappedContent = {};
    Object.values(bucketMap).forEach((bucket) => {
      const { name, children } = bucket;
      mappedContent[name] = children.map((childUrl) => {
        const match = results.find((result) => result.url === childUrl);
        return match;
      });
    });

    mc = mappedContent

    const randomPos = [];

    console.log(mappedContent);
    console.log({ mappedContent });

    // get the minimum and maximum size of the buckets
    const { minSize, maxSize } = Object.keys(mappedContent).reduce(
      (acc, bucketName) => {
        const children = mappedContent[bucketName];
        console.log({ children });
        const size = children?.length ?? 1;

        acc.minSize = Math.min(acc.minSize, size);
        acc.maxSize = Math.max(acc.maxSize, size);

        return acc;
      },
      { minSize: Infinity, maxSize: -Infinity },
    );

    //set target radius range
    const targetRange = { min: 50, max: 100 };

    //create random positions/radiui for each bucket
    Object.keys(mappedContent).forEach((bucketName) => {
      const children = mappedContent[bucketName];
      console.log({ children });
      const size = children?.length ?? 1;
      const randomX = Math.random();
      const randomY = Math.random();
      const rad = remap(size, minSize, maxSize, targetRange.min, targetRange.max);
      randomPos.push({ x: randomX, y: randomY, radius: rad });
    });

    //normalize positions
    const rawPositions = randomPos.map((x) => [x.x, x.y]);
    const normalized = normalizePositionsOnlyWithWindow(rawPositions, SIDE_GUTTER, innerWidth, innerHeight);
    //separate particles
    const particles = normalized.map((x, i) => ({ ...randomPos[i], x: x.x, y: x.y }));
    const separatedParticles = separateParticles(particles, 1.05);

    const bucketNodes = Object.keys(mappedContent).map((bucketName, index) => {
      const childPositions = mappedContent[bucketName].map((x) => {
        const randX = Math.random();
        const randY = Math.random();
        const multi = 1;
        return {
          ...x,
          x: x.x + randX * multi,
          y: x.y + randY * multi,
          originalX: x.x + randX * multi,
          originalY: x.y + randY * multi,
        };
      });

      const updatedChildPositions = separateParticles(childPositions, 1);

      const bucketNode = {
        id: "bucket-" + bucketName,
        x: separatedParticles[index]?.x ?? 10,
        y: separatedParticles[index]?.y ?? 10,
        originalX: separatedParticles[index]?.x ?? 10,
        originalY: separatedParticles[index]?.y ?? 10,
        radius: randomPos[index]?.radius ?? 10,
        title: bucketName,
        url: "",
        favIconUrl: "",
        children: updatedChildPositions,
      };
      return bucketNode;
    });

    return bucketNodes;
  } catch (error) {
    console.log("error yes:");
    console.log(error);
    console.log("bm: ");
    console.log(bm);
    console.log("mc: ");
    console.log(mc);
    return [];
  }
};

async function fetchRecordsWithRetry() {
    let records = await fetchAllRecords();
    let tries = 0

    if(tries === 5){
        console.log('tried 5 times, returning undefined');
        return undefined;
    }
    
    while (records.length === 1) {
      records = await fetchAllRecords();
      tries ++;
    }
    
    return records;
  }

self.onmessage = async (e) => {
  console.log("Bucket Worker: Message received from main script");
  const operation = e.data.operation;
  const data = e.data.data;
  const windowInnerWidth = e.data.windowInnerWidth;
  const windowInnerHeight = e.data.windowInnerHeight;
  try {
    if (operation === "bucketTabs") {
      //1 layout parent buckets
      //2 create kid nodes
      //3 relocate kids to parents
      //4 inject kids into parents
      const records = await fetchRecordsWithRetry()
      console.log("conchaaa");
      console.log(records);
      console.log(data);
      const buckets = await layoutBuckets(data, records, windowInnerWidth, windowInnerHeight);
      self.postMessage({
        type: "saveToLocalStorage",
        key: "untabbed-buckets",
        value: buckets,
      });
      //  self.postMessage({ result: 'Buckets stored in local storage.' });
    }
  } catch (error) {
    console.log("error in worker: ");
    console.log(error);
  }
};
