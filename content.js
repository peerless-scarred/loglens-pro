// LogLens Pro - Main Content Script
// Enhances CI/CD log viewing across platforms

class LogLens {
  constructor() {
    this.config = {
      ansiColors: true,
      searchEnabled: true,
      foldEnabled: true,
      errorHighlighting: true,
      jumpToFailure: true,
      theme: 'default'
    };
    
    this.ansiColors = {
      '30': '#000000', '31': '#ff0000', '32': '#00ff00', '33': '#ffff00',
      '34': '#0000ff', '35': '#ff00ff', '36': '#00ffff', '37': '#ffffff',
      '90': '#555555', '91': '#ff5555', '92': '#55ff55', '93': '#ffff55',
      '94': '#5555ff', '95': '#ff55ff', '96': '#55ffff', '97': '#ffffff'
    };
    
    this.init();
  }
  
  async init() {
    // Load saved config
    const saved = await chrome.storage.sync.get('loglensConfig');
    if (saved.loglensConfig) {
      this.config = { ...this.config, ...saved.loglensConfig };
    }
    
    // Start observing for logs
    this.observePage();
    
    // Process existing logs
    this.processLogs();
  }
  
  observePage() {
    // Watch for DOM changes to catch dynamically loaded logs
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          this.processLogs();
        }
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  processLogs() {
    // GitHub Actions logs
    this.processGitHubActions();
    
    // GitLab CI logs
    this.processGitLabCI();
    
    // Jenkins logs
    this.processJenkins();
    
    // Generic log detection
    this.processGenericLogs();
  }
  
  processGitHubActions() {
    // GitHub Actions log container
    const containers = [
      '.js-log-line',
      '.log-line',
      'pre[data-filterable-for="job-logs-filter"]',
      '.job-logs'
    ];
    
    containers.forEach(selector => {
      document.querySelectorAll(selector).forEach(container => {
        if (!container.classList.contains('loglens-processed')) {
          this.enhanceLogContainer(container, 'github');
          container.classList.add('loglens-processed');
        }
      });
    });
  }
  
  processGitLabCI() {
    // GitLab CI log container
    const containers = [
      '.job-log',
      '.build-log',
      '.ci-log',
      'pre.build-trace'
    ];
    
    containers.forEach(selector => {
      document.querySelectorAll(selector).forEach(container => {
        if (!container.classList.contains('loglens-processed')) {
          this.enhanceLogContainer(container, 'gitlab');
          container.classList.add('loglens-processed');
        }
      });
    });
  }
  
  processJenkins() {
    // Jenkins console output
    const containers = [
      '#main-panel pre',
      '.console-output',
      'pre.console'
    ];
    
    containers.forEach(selector => {
      document.querySelectorAll(selector).forEach(container => {
        if (!container.classList.contains('loglens-processed')) {
          this.enhanceLogContainer(container, 'jenkins');
          container.classList.add('loglens-processed');
        }
      });
    });
  }
  
  processGenericLogs() {
    // Generic log detection - look for pre/code with common log patterns
    document.querySelectorAll('pre, code').forEach(element => {
      const text = element.textContent;
      if (text.length > 100 && (
        text.includes('[ERROR]') ||
        text.includes('[WARN]') ||
        text.includes('ERROR:') ||
        text.includes('FAILED') ||
        text.match(/^\d{4}-\d{2}-\d{2}/) ||
        text.includes('ansi') ||
        text.includes('\x1b[')
      )) {
        if (!element.classList.contains('loglens-processed')) {
          this.enhanceLogContainer(element, 'generic');
          element.classList.add('loglens-processed');
        }
      }
    });
  }
  
  enhanceLogContainer(container, platform) {
    const originalHTML = container.innerHTML;
    let enhancedHTML = originalHTML;
    
    // Apply ANSI color rendering
    if (this.config.ansiColors) {
      enhancedHTML = this.renderANSIColors(enhancedHTML);
    }
    
    // Apply error highlighting
    if (this.config.errorHighlighting) {
      enhancedHTML = this.highlightErrors(enhancedHTML);
    }
    
    // Update container if changes were made
    if (enhancedHTML !== originalHTML) {
      container.innerHTML = enhancedHTML;
      
      // Add LogLens controls
      this.addControls(container, platform);
    }
  }
  
  renderANSIColors(html) {
    // Convert ANSI escape codes to HTML spans
    return html.replace(/\x1b\[([0-9;]+)m/g, (match, codes) => {
      const codeList = codes.split(';');
      let styles = [];
      
      for (const code of codeList) {
        if (this.ansiColors[code]) {
          styles.push(`color: ${this.ansiColors[code]}`);
        } else if (code === '1') {
          styles.push('font-weight: bold');
        } else if (code === '4') {
          styles.push('text-decoration: underline');
        } else if (code === '7') {
          styles.push('background-color: #000; color: #fff');
        }
      }
      
      return styles.length ? `<span style="${styles.join('; ')}">` : '';
    }).replace(/\x1b\[0m/g, '</span>');
  }
  
  highlightErrors(html) {
    // Highlight common error patterns
    const errorPatterns = [
      /\[ERROR\].*?(?=<|$)/gi,
      /ERROR:.*?(?=<|$)/gi,
      /FAILED.*?(?=<|$)/gi,
      /Exception:.*?(?=<|$)/gi,
      /at .*?\.java:\d+\)/g,
      /at .*?\.js:\d+:\d+\)/g,
      /✗.*?(?=<|$)/g,
      /❌.*?(?=<|$)/g
    ];
    
    errorPatterns.forEach(pattern => {
      html = html.replace(pattern, match => 
        `<span class="loglens-error">${match}</span>`
      );
    });
    
    return html;
  }
  
  addControls(container, platform) {
    // Create controls container
    const controls = document.createElement('div');
    controls.className = 'loglens-controls';
    controls.innerHTML = `
      <div class="loglens-controls-inner">
        <button class="loglens-btn" data-action="search">🔍 Search</button>
        <button class="loglens-btn" data-action="fold">📁 Fold All</button>
        <button class="loglens-btn" data-action="jump">⬇ Jump to Error</button>
        <button class="loglens-btn" data-action="copy">📋 Copy</button>
        <span class="loglens-stats"></span>
      </div>
    `;
    
    // Insert before the log container
    container.parentNode.insertBefore(controls, container);
    
    // Add event listeners
    controls.querySelectorAll('.loglens-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleControlAction(action, container, platform);
      });
    });
    
    // Update stats
    this.updateStats(controls, container);
  }
  
  handleControlAction(action, container, platform) {
    switch (action) {
      case 'search':
        this.showSearch(container);
        break;
      case 'fold':
        this.toggleFold(container);
        break;
      case 'jump':
        this.jumpToError(container);
        break;
      case 'copy':
        this.copyLogs(container);
        break;
    }
  }
  
  showSearch(container) {
    const searchBox = document.createElement('div');
    searchBox.className = 'loglens-search';
    searchBox.innerHTML = `
      <input type="text" placeholder="Search logs..." class="loglens-search-input">
      <button class="loglens-search-close">×</button>
      <div class="loglens-search-results"></div>
    `;
    
    container.parentNode.insertBefore(searchBox, container.nextSibling);
    
    const input = searchBox.querySelector('.loglens-search-input');
    input.focus();
    
    input.addEventListener('input', () => {
      this.performSearch(container, input.value);
    });
    
    searchBox.querySelector('.loglens-search-close').addEventListener('click', () => {
      searchBox.remove();
      this.clearHighlights(container);
    });
  }
  
  performSearch(container, query) {
    this.clearHighlights(container);
    
    if (!query.trim()) return;
    
    const text = container.textContent;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    container.innerHTML = container.innerHTML.replace(regex, 
      '<span class="loglens-search-match">$1</span>'
    );
  }
  
  clearHighlights(container) {
    container.querySelectorAll('.loglens-search-match').forEach(match => {
      const parent = match.parentNode;
      parent.replaceChild(document.createTextNode(match.textContent), match);
      parent.normalize();
    });
  }
  
  toggleFold(container) {
    const lines = container.querySelectorAll('.loglens-line');
    if (lines.length) {
      const isFolded = lines[0].classList.contains('loglens-folded');
      lines.forEach(line => {
        if (isFolded) {
          line.classList.remove('loglens-folded');
        } else {
          line.classList.add('loglens-folded');
        }
      });
    }
  }
  
  jumpToError(container) {
    const firstError = container.querySelector('.loglens-error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstError.classList.add('loglens-error-highlight');
      setTimeout(() => {
        firstError.classList.remove('loglens-error-highlight');
      }, 2000);
    }
  }
  
  copyLogs(container) {
    const text = container.textContent;
    navigator.clipboard.writeText(text).then(() => {
      const btn = container.previousElementSibling?.querySelector('[data-action="copy"]');
      if (btn) {
        const original = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => {
          btn.textContent = original;
        }, 2000);
      }
    });
  }
  
  updateStats(controls, container) {
    const stats = controls.querySelector('.loglens-stats');
    if (!stats) return;
    
    const text = container.textContent;
    const lines = text.split('\n').length;
    const errors = (text.match(/ERROR|FAILED|Exception/gi) || []).length;
    const warnings = (text.match(/WARN/gi) || []).length;
    
    stats.textContent = `${lines} lines • ${errors} errors • ${warnings} warnings`;
  }
}

// Initialize LogLens
const loglens = new LogLens();

// Export for testing
if (typeof module !== 'undefined') {
  module.exports = LogLens;
}