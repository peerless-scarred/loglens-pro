// LogLens Pro - Background Service Worker
// Handles extension lifecycle, messaging, and storage

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('LogLens Pro installed');
  
  // Set default configuration
  chrome.storage.sync.set({
    loglensConfig: {
      ansiColors: true,
      searchEnabled: true,
      foldEnabled: true,
      errorHighlighting: true,
      jumpToFailure: true,
      theme: 'default',
      proFeatures: false
    }
  });
  
  // Create context menu items
  chrome.contextMenus.create({
    id: 'loglens-enhance-page',
    title: 'Enhance Logs with LogLens',
    contexts: ['page']
  });
  
  chrome.contextMenus.create({
    id: 'loglens-copy-logs',
    title: 'Copy Enhanced Logs',
    contexts: ['page']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'loglens-enhance-page':
      chrome.tabs.sendMessage(tab.id, { action: 'enhanceLogs' });
      break;
    case 'loglens-copy-logs':
      chrome.tabs.sendMessage(tab.id, { action: 'copyLogs' });
      break;
  }
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'getConfig':
      chrome.storage.sync.get('loglensConfig', (result) => {
        sendResponse(result.loglensConfig);
      });
      return true; // Keep message channel open for async response
      
    case 'saveConfig':
      chrome.storage.sync.set({ loglensConfig: message.config }, () => {
        sendResponse({ success: true });
      });
      return true;
      
    case 'checkProStatus':
      // In production, this would check with a backend
      chrome.storage.sync.get(['loglensPro', 'loglensConfig'], (result) => {
        const isPro = result.loglensPro || (result.loglensConfig?.proFeatures === true);
        sendResponse({ isPro });
      });
      return true;
      
    case 'activatePro':
      // In production, this would validate license key
      chrome.storage.sync.set({ 
        loglensPro: true,
        loglensConfig: { ...message.config, proFeatures: true }
      }, () => {
        sendResponse({ success: true });
      });
      return true;
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open popup (handled by manifest)
});

// Keep service worker alive
chrome.alarms.create('keepAlive', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    // Just keep it alive
    console.log('LogLens Pro background service alive');
  }
});

// Clean up on uninstall
chrome.runtime.setUninstallURL('https://blitztools.dev/loglens-feedback');