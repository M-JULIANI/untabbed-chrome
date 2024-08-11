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

    // janky logic, maybe replace
    if(bucketMap?.buckets?.length > 0){
      bm = bucketMap.buckets;
    }
    else{
      bm = bucketMap
    }

    const mappedContent = {};
    Object.values(bm).forEach((bucket) => {
      const { name, children } = bucket;
      console.log('children:' + children.length)
      console.log('buck')
      console.log(bucket)
      if(children && children.length > 0){
      mappedContent[name] = [];
      children.forEach((childUrl) => {
        const match = results.find((result) => result.url === childUrl);
        if (match) {
          mappedContent[name].push({
            favIconUrl: match?.favIconUrl ?? "",
            title: match?.title ?? "Failed title",
            url: match?.url ?? "Failed url",
            id: match?.id ?? "Failed id",
          });
        }
      });
    }
    });

    mc = mappedContent;

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
    const targetBucketRadiiRange = { min: 50, max: 100 };

    console.log('min: ', minSize, 'max: ', maxSize);

    //create random positions/radiui for each bucket
    Object.keys(mappedContent).forEach((bucketName) => {
      const children = mappedContent[bucketName];
      console.log({ children });
      const size = children?.length ?? 1;
      const randomX = Math.random();
      const randomY = Math.random();
      const rad = remap(size, minSize, maxSize, targetBucketRadiiRange.min, targetBucketRadiiRange.max);
      randomPos.push({ x: randomX, y: randomY, radius: rad });
    });

    console.log('randomPos')
    console.log(randomPos)

    //normalize positions
    const rawPositions = randomPos.map((x) => [x.x, x.y]);
    const normalized = normalizePositionsOnlyWithWindow(rawPositions, SIDE_GUTTER, innerWidth, innerHeight);
    //separate particles
    const particles = normalized.map((x, i) => ({ ...randomPos[i], x: x.x, y: x.y }));
    const separatedParticles = separateParticles(particles, 1.05);

    const bucketNodes = Object.keys(mappedContent).map((bucketName, index) => {
      const bucketPosX = separatedParticles[index]?.x ?? 10;
      const bucketPosY = separatedParticles[index]?.y ?? 10;

      const childPositions = mappedContent[bucketName].map((x) => {
        const randX = Math.random();
        const randY = Math.random();
        const multi = 2;
        return {
          ...x,
          x: bucketPosX + (randX * multi),
          y: bucketPosY + (randY * multi),
          originalX: bucketPosX + (randX * multi),
          originalY: bucketPosY + (randY * multi),
          radius: 10
        };
      });

      const updatedChildPositions = separateParticles(childPositions, 1.12);

      const bucketNode = {
        id: "bucket-" + bucketName,
        x: bucketPosX,
        y: bucketPosY,
        originalX: bucketPosX,
        originalY: bucketPosY,
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
  let tries = 0;

  if (tries === 5) {
    console.log("tried 5 times, returning undefined");
    return undefined;
  }

  while (records.length <2) {
    records = await fetchAllRecords();
    tries++;
  }

  console.log('returning records: ' + records.length)
  console.log(records)

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
      const records = await fetchRecordsWithRetry();
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
