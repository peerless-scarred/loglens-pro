# LogLens Pro - Universal DevOps Log Viewer

**Problem:** Every CI platform has terrible log UX. GitHub Actions, Jenkins, GitLab CI logs are all painful to read.

**Solution:** Chrome extension that enhances log viewing on any CI/CD platform with:
- ANSI color rendering
- Search/filter
- Log folding
- Error highlighting
- "Jump to failure" navigation

## Market Validation
- "GitHub Action Raw Log Viewer" (3.7★) — exists but poorly rated
- "Log Parser for Jenkins" (0 ratings) — tried but failed to get traction
- "GTLB CI logs viewer" (0 ratings) — validates the need for GitLab
- Reddit post: "Lightning-fast log highlighter Chrome extension" got engagement in r/devops

## Monetization
- **Free:** Basic highlighting, search, folding
- **Pro ($4/mo):** AI error summarization, cross-platform search, custom themes, export features

## Technical Approach
1. **Content script** that injects into CI/CD platforms
2. **ANSI parser** for color rendering
3. **DOM observer** to detect log containers
4. **UI overlay** for controls

## Target Platforms
- GitHub Actions
- GitLab CI
- Jenkins
- CircleCI
- Travis CI
- Azure DevOps

## Project Structure
```
loglens-pro/
├── manifest.json          # Extension manifest
├── content.js            # Main content script
├── background.js         # Background service worker
├── popup.html/js/css     # Extension popup UI
├── options.html/js/css   # Settings page
├── styles/               # CSS for log enhancement
└── icons/                # Extension icons
```

## Development Plan
**Week 1:** MVP with GitHub Actions support
**Week 2:** Add GitLab CI, Jenkins support
**Week 3:** Add Pro features, monetization
**Week 4:** Publish to Chrome Web Store