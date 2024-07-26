chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Listen for tab creation
chrome.tabs.onCreated.addListener((tab) => {
  console.log('tab info!!')
  console.log({ tab })
  //send only when it is an actual tab
  if (tab.url !== '') {
    chrome.runtime.sendMessage({
      type: 'TAB_CREATED',
      id: tab.id,
      title: tab.title,
      url: tab.url,
      favIconUrl: tab.favIconUrl,
      lastAccessed: tab.lastAccessed
    });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    console.log('Tab URL updated!!');
    if(tab.url !== ''){
      chrome.runtime.sendMessage({
        type: 'TAB_UPDATED',
        id: tabId,
        title: tab.title,
        url: tab.url,
        favIconUrl: tab.favIconUrl,
        lastAccessed: tab.lastAccessed
      });
    }
  }
});

// Listen for tab removal
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  chrome.runtime.sendMessage({ type: 'TAB_REMOVED', id: tabId });
});

// Listen for tab activation
// Use this to add to the number of visits metric
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.runtime.sendMessage({ type: 'TAB_ACTIVATED', tabId: activeInfo.tabId });
});

