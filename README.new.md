# WebSocket Proxy - Chrome DevTools Extension

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/[extension-id])](https://chrome.google.com/webstore/detail/[extension-id])
[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/[extension-id])](https://chrome.google.com/webstore/detail/[extension-id])
[![GitHub stars](https://img.shields.io/github/stars/your-username/websocket-proxy-extension)](https://github.com/your-username/websocket-proxy-extension/stargazers)
[![GitHub license](https://img.shields.io/github/license/your-username/websocket-proxy-extension)](https://github.com/your-username/websocket-proxy-extension/blob/main/LICENSE)
[![Build Status](https://img.shields.io/github/workflow/status/your-username/websocket-proxy-extension/CI)](https://github.com/your-username/websocket-proxy-extension/actions)

> Professional WebSocket debugging tool for Chrome DevTools. Monitor, intercept, and simulate WebSocket connections in real-time.

## 🎯 Features

### 🔍 Real-time Monitoring
- ✅ **Live WebSocket Detection** - Automatically detect and monitor all WebSocket connections
- ✅ **Message Capture** - Capture all incoming and outgoing messages in real-time
- ✅ **Connection State Tracking** - Monitor connection states (connecting, open, closed, error)
- ✅ **Timestamp Recording** - Precise timestamp logging for all events

### 🛠️ Advanced Control
- ✅ **Message Interception** - Block outgoing or incoming messages
- ✅ **Bi-directional Simulation** - Send simulated messages in both directions
- ✅ **Connection Pause/Resume** - Temporarily pause connections for debugging
- ✅ **Message Filtering** - Filter messages by content, direction, or connection

### 🎨 Modern Interface
- ✅ **Professional Dark Theme** - Easy on the eyes during long debugging sessions
- ✅ **Resizable Panels** - Customize layout to fit your workflow
- ✅ **JSON Syntax Highlighting** - Beautiful JSON formatting with CodeMirror
- ✅ **Responsive Design** - Works seamlessly in different DevTools window sizes

### 🔧 Developer Tools
- ✅ **Chrome Extension V3** - Built with the latest Chrome Extension architecture
- ✅ **React 19.1.0** - Modern React with hooks for optimal performance
- ✅ **Export/Import** - Save and load connection data for analysis
- ✅ **Search & Filter** - Quickly find specific messages or connections

## 🚀 Installation

### From Chrome Web Store (Recommended)
1. Visit the [Chrome Web Store page](https://chrome.google.com/webstore/detail/[extension-id])
2. Click "Add to Chrome"
3. Open Chrome DevTools (F12)
4. Navigate to the "WebSocket Proxy" tab

### From Source (Development)
```bash
# Clone the repository
git clone https://github.com/your-username/websocket-proxy-extension.git
cd websocket-proxy-extension

# Install dependencies
pnpm install

# Build the extension
pnpm run build

# Load in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked extension"
# 4. Select the dist/ folder
```

## 📖 Usage

### Basic Usage
1. **Open Chrome DevTools** (F12 or right-click → Inspect)
2. **Navigate to WebSocket Proxy tab**
3. **Click "Start Monitoring"** to begin capturing WebSocket connections
4. **Visit any page with WebSocket connections** - they'll appear automatically
5. **Click on any connection** to view detailed messages

### Advanced Features

#### Message Interception
```javascript
// Example: Block all outgoing messages
1. Click "Block Outgoing" in the control panel
2. All sent messages will be blocked and stored
3. Click "Allow Outgoing" to resume normal operation
```

#### Message Simulation
```javascript
// Example: Simulate an incoming message
1. Select a WebSocket connection
2. Click "Simulate Message" button
3. Choose "Incoming" direction
4. Enter your message content (supports JSON)
5. Click "Send Simulation"
```

#### Connection Analysis
- **View Connection Timeline** - See when connections were established
- **Message Statistics** - View message counts and data volumes
- **Error Tracking** - Monitor connection errors and failures

## 🎬 Demo

### Screenshots
| Feature | Screenshot |
|---------|------------|
| Main Interface | ![Main Interface](docs/images/main-interface.png) |
| Message Details | ![Message Details](docs/images/message-details.png) |
| Simulation Panel | ![Simulation Panel](docs/images/simulation-panel.png) |

### Video Demo
[![WebSocket Proxy Demo](https://img.youtube.com/vi/[video-id]/maxresdefault.jpg)](https://www.youtube.com/watch?v=[video-id])

## 🏗️ Technical Architecture

### Extension Structure
```
websocket-proxy-extension/
├── src/
│   ├── background/         # Service Worker
│   ├── content/           # Content Scripts & Injection
│   ├── devtools/          # DevTools Panel
│   ├── components/        # React UI Components
│   └── styles/           # CSS Stylesheets
├── dist/                 # Built Extension
└── docs/                # Documentation
```

### Key Technologies
- **Chrome Extension V3** - Modern extension architecture
- **React 19.1.0** - UI framework with hooks
- **Vite 7.0.0** - Build tool and development server
- **CodeMirror 6** - JSON syntax highlighting
- **React Resizable Panels** - Flexible layout system

## 🛠️ Development

### Prerequisites
- Node.js 18.0 or higher
- pnpm 8.0 or higher
- Chrome browser

### Setup
```bash
# Clone and install
git clone https://github.com/your-username/websocket-proxy-extension.git
cd websocket-proxy-extension
pnpm install

# Development build (with watch)
pnpm run dev

# Production build
pnpm run build

# Run tests
pnpm run test

# Code formatting
pnpm run format
```

### Project Scripts
| Script | Description |
|--------|-------------|
| `pnpm run dev` | Development build with watch mode |
| `pnpm run build` | Production build |
| `pnpm run test` | Run test suite |
| `pnpm run lint` | Run ESLint |
| `pnpm run format` | Format code with Prettier |

## 📚 API Reference

### WebSocket Proxy API
The extension provides a comprehensive API for advanced users:

```javascript
// Access proxy state
window.websocketProxyState

// Control monitoring
window.websocketProxyControl.startMonitoring()
window.websocketProxyControl.stopMonitoring()

// Message simulation
window.websocketProxyControl.simulateMessage(connectionId, message, direction)
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass

## 🐛 Bug Reports & Feature Requests

### Reporting Issues
If you encounter any bugs or have feature requests, please:
1. Check [existing issues](https://github.com/your-username/websocket-proxy-extension/issues)
2. Create a new issue with detailed information
3. Include steps to reproduce (for bugs)
4. Provide Chrome version and OS information

### Feature Requests
We're always looking to improve! Please:
1. Describe your use case
2. Explain why the feature would be useful
3. Provide examples if possible

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Chrome DevTools team for the excellent extension APIs
- React team for the amazing framework
- CodeMirror team for the excellent code editor
- All contributors who help improve this project

## 📊 Project Stats

- **Stars**: ![GitHub stars](https://img.shields.io/github/stars/your-username/websocket-proxy-extension)
- **Forks**: ![GitHub forks](https://img.shields.io/github/forks/your-username/websocket-proxy-extension)
- **Issues**: ![GitHub issues](https://img.shields.io/github/issues/your-username/websocket-proxy-extension)
- **Pull Requests**: ![GitHub pull requests](https://img.shields.io/github/issues-pr/your-username/websocket-proxy-extension)

## 🔗 Links

- [Chrome Web Store](https://chrome.google.com/webstore/detail/[extension-id])
- [GitHub Repository](https://github.com/your-username/websocket-proxy-extension)
- [Documentation](https://github.com/your-username/websocket-proxy-extension/docs)
- [Issue Tracker](https://github.com/your-username/websocket-proxy-extension/issues)
- [Discussions](https://github.com/your-username/websocket-proxy-extension/discussions)

## 💖 Support

If you find this project useful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 📢 Sharing with others
- 💝 [Sponsoring the project](https://github.com/sponsors/your-username)

---

**Made with ❤️ by [Your Name](https://github.com/your-username)**

*WebSocket Proxy Extension - Making WebSocket debugging simple and powerful*