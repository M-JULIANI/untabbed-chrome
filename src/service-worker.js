chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));


// Function to check for changes in the IndexedDB store
function pollIndexedDBChanges(dbName, storeName, version, interval) {
  let lastCheck = 0; // Timestamp of the last check

  const checkForChanges = () => {
    const request = indexedDB.open(dbName, version);

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
  setInterval(checkForChanges, interval);
}

const indexdb_name = "untabbedDB";
const indexdb_store = "textStore";
const db_version = 2;

// Call the function with your database and store names
pollIndexedDBChanges(indexdb_name, indexdb_store, db_version, 30000);
