# Yandex Tracker Helper Extension

VS Code extension for tracking work time on Yandex Tracker tasks and automatically sending time logs to the tracker.

## Features

- ⏱️ Task timer with automatic state persistence
- 📋 View assigned tasks from Yandex Tracker
- 📤 Send accumulated time to Yandex Tracker
- 🌿 Link tasks with Git branches
- 💾 Timer state survives VS Code restarts

## Installation

Install from VS Code Marketplace or build from source:

```bash
# Install from .vsix file
code --install-extension vscode-yandex-tracker-1.0.0.vsix
```

## Quick Start

1. **Get OAuth token from Yandex Tracker:**
   - Go to [Yandex Tracker OAuth Apps](https://oauth.yandex.ru/)
   - Create a new OAuth application
   - Copy the OAuth token

2. **Get Organization ID:**
   - Open your Yandex Tracker organization settings
   - Find your Organization ID

3. **Configure the extension:**
   - Run command `Tracker: Set OAuth2.0 Token` (Ctrl+Shift+P)
   - Enter your OAuth token
   - Set `trackerHelper.orgId` in VS Code settings (File → Preferences → Settings)

4. **Start using:**
   - Open Tracker Helper panel from the Activity Bar (clock icon)
   - Click refresh button (🔄) to fetch tasks
   - Click Play (▶️) on a task to start tracking

## Commands

- `Tracker: Set OAuth2.0 Token` - Set OAuth token for Yandex Tracker API
- `Tracker: Start timer` - Start tracking time for selected task
- `Tracker: Stop timer` - Stop current timer
- `Tracker: Refresh` - Fetch tasks from Yandex Tracker
- `Tracker: Assign Task with Branch` - Link current Git branch with a task
- `Tracker: Send Time` - Send accumulated time for selected task
- `Tracker: Send All Time` - Send time for all tasks
- `Tracker: Clear All Data` - Clear all stored timer data

## Configuration

- `trackerHelper.orgId` - Organization ID for Yandex Tracker (required)
- `trackerHelper.orgIdHeader` - Organization ID header (`X-Cloud-Org-ID` or `X-Org-ID`, default: `X-Cloud-Org-ID`)

You can configure these settings in VS Code Settings (File → Preferences → Settings) or in `.vscode/settings.json`:

```json
{
  "trackerHelper.orgId": "your-organization-id",
  "trackerHelper.orgIdHeader": "X-Cloud-Org-ID"
}
```

## Requirements

- VS Code 1.105.1+
- Yandex Tracker OAuth token
- Organization ID

## Development

### Prerequisites

- Node.js 22.x
- Yarn package manager
- VS Code 1.105.1+

### Building

The extension uses [Rspack](https://rspack.rs/) bundling:

```bash
# Install dependencies
yarn install

# Production build
yarn compile

# Development build
yarn compile:dev

# Watch mode (for development)
yarn watch
```

The extension is bundled into a single `extension.js` file for faster loading and smaller size.

### Debugging

1. Open the project in VS Code
2. Press F5 to launch Extension Development Host
3. In the new window, open the Tracker Helper panel to test the extension

## License

MIT License - see [LICENSE](LICENSE) for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for details about changes in each version.

## Support

Found a bug or have a suggestion? Create an [Issue](https://github.com/MalyugaSensei/vscode-yandex-tracker/issues).
