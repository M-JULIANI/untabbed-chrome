// import { Schema } from './schema';
import { v4 } from 'uuid';

const categories = [
  'sports',
  'news',
  'research',
  'social media',
  'productivity'
]

// Event listener to record parent-child relationships
window.addEventListener('beforeunload', (event) => {


  // Get the current URL (child) and the referrer (parent)
  const childUrl = window.location.href;
  const parentUrl = document.referrer;

  const newEntry = {
    id: v4(),
    hostName: window.location.hostname,
    url: childUrl,
    title: document.title || '',
    parentId: parentUrl || null,
    category: categories[Math.floor(Math.random() * (categories.length))],
    timeEnter: new Date().toISOString()
  };
  console.log('new entry', { newEntry })
  chrome.storage.sync.get(['mapKey'], function (result) {
    if (chrome.runtime.lastError) {
      // Handle the error, e.g., log it or show a message to the user
      console.log('error message')
      console.error(chrome.runtime.lastError.message);

      // Initialize your data here
      const initialData = { 'mapKey': newEntry };
      chrome.storage.sync.set(initialData, function () {
        console.log('Data initialized');
      });
    } else {
      let myList = result['mapKey'] || []; // If the list doesn't exist, initialize it as an empty array

      // Add the new entry to the list
      myList.push(newEntry);

      // Save the updated list back to the storage
      chrome.storage.sync.set({ ['mapKey']: myList }, function () {
        console.log('List updated and saved');
      });
    }
  });

});

// export { };