# Yandex Tracker Helper Extension

VS Code extension for tracking work time on Yandex Tracker tasks and automatically sending time logs to the tracker.

## Features

- ⏱️ Task timer with automatic state persistence
- 📋 View assigned tasks from Yandex Tracker
- 📤 Send accumulated time to Yandex Tracker
- 🌿 Link tasks with Git branches
- 💾 Timer state survives VS Code restarts

## Quick Start

1. Get OAuth token and Organization ID from Yandex Tracker
2. Run command `Tracker: Set OAuth2.0 Token` (Ctrl+Shift+P)
3. Enter your credentials
4. Click refresh button (🔄) in Tracker Helper panel to fetch tasks
5. Click Play (▶️) on a task to start tracking

## Commands

- `Tracker: Start timer` - Start tracking time for selected task
- `Tracker: Stop timer` - Stop current timer
- `Tracker: Refresh` - Fetch tasks from Yandex Tracker
- `Tracker: Send All Time` - Send time for all tasks

## Configuration

- `trackerHelper.orgIdHeader` - Organization ID header (`X-Cloud-Org-ID` or `X-Org-ID`)

## Requirements

- VS Code 1.105.1+
- Yandex Tracker OAuth token
- Organization ID

## Development

### Building

The extension uses [Rspack](https://rspack.rs/) for fast bundling:

```bash
# Production build
yarn compile

# Development build
yarn compile:dev

# Watch mode (for development)
yarn watch
```

The extension is bundled into a single `extension.js` file for faster loading and smaller size.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

Found a bug or have a suggestion? Create an [Issue](https://github.com/MalyugaSensei/tracker-helper/issues).
