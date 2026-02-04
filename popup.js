// LogLens Pro - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  // Load current configuration
  const config = await loadConfig();
  updateUI(config);
  
  // Set up event listeners
  setupEventListeners();
});

async function loadConfig() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getConfig' }, (response) => {
      resolve(response || {});
    });
  });
}

function updateUI(config) {
  // Update toggle switches
  document.getElementById('ansiColors').checked = config.ansiColors !== false;
  document.getElementById('errorHighlighting').checked = config.errorHighlighting !== false;
  document.getElementById('foldEnabled').checked = config.foldEnabled !== false;
  document.getElementById('darkTheme').checked = config.theme === 'default' || config.theme === undefined;
  
  // Check Pro status
  checkProStatus();
}

function setupEventListeners() {
  // Toggle switches
  document.getElementById('ansiColors').addEventListener('change', saveConfig);
  document.getElementById('errorHighlighting').addEventListener('change', saveConfig);
  document.getElementById('foldEnabled').addEventListener('change', saveConfig);
  document.getElementById('darkTheme').addEventListener('change', saveConfig);
  
  // Buttons
  document.getElementById('optionsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  document.getElementById('upgradeBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://blitztools.dev/loglens-pro' });
  });
  
  document.getElementById('feedbackBtn').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/blitztools/loglens-pro/issues' });
  });
}

async function saveConfig() {
  const config = {
    ansiColors: document.getElementById('ansiColors').checked,
    errorHighlighting: document.getElementById('errorHighlighting').checked,
    foldEnabled: document.getElementById('foldEnabled').checked,
    theme: document.getElementById('darkTheme').checked ? 'default' : 'light',
    proFeatures: false // Will be updated by Pro check
  };
  
  // Save to storage
  chrome.runtime.sendMessage({ 
    action: 'saveConfig', 
    config 
  }, (response) => {
    if (response?.success) {
      showToast('Settings saved');
      
      // Notify content script of config change
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { 
            action: 'configUpdated', 
            config 
          });
        }
      });
    }
  });
}

async function checkProStatus() {
  chrome.runtime.sendMessage({ action: 'checkProStatus' }, (response) => {
    if (response?.isPro) {
      // User has Pro - update UI
      document.getElementById('upgradeBtn').textContent = 'Pro Active';
      document.getElementById('upgradeBtn').classList.add('btn-secondary');
      document.getElementById('upgradeBtn').classList.remove('btn-primary');
      
      // Enable Pro features in UI
      document.querySelectorAll('.pro-feature').forEach(el => {
        el.style.opacity = '1';
      });
    }
  });
}

function showToast(message) {
  // Create toast element
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #007acc;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 13px;
    z-index: 1000;
    animation: fadeInOut 3s ease-in-out;
  `;
  
  // Add styles for animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInOut {
      0%, 100% { opacity: 0; transform: translateX(-50%) translateY(10px); }
      10%, 90% { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(toast);
  
  // Remove after animation
  setTimeout(() => {
    toast.remove();
    style.remove();
  }, 3000);
}

// Handle messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'configUpdated') {
    updateUI(message.config);
  }
});