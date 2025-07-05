# React Native Debug Monitor

[![npm version](https://badge.fury.io/js/react-native-debug-monitor.svg)](https://badge.fury.io/js/react-native-debug-monitor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The Ultimate AsyncStorage and Network Debugging Tool for React Native**

Debug your React Native apps like never before! Monitor storage operations and network requests in real-time directly from VS Code. Perfect for offline-first apps, authentication flows, and complex data synchronization scenarios.

---

## 🎬 See It In Action

### 📱 Storage Debugger - Real-Time AsyncStorage Management
*Easy access: `Ctrl+Shift+P` (Windows/Linux) or `⌘+Shift+P` (Mac) → `View React Native Monitor Storage`*

![Storage Demo](https://github.com/rogercg/react-native-debug-monitor-manager/blob/main/assets/storage-demo-hq.gif)

**See storage changes instantly as your app runs • Edit values directly from VS Code • Debug authentication tokens, user preferences, and cached data**

### 🌐 Network Monitor - HTTP Request Interception
*Multiple ways to access: Command Palette • VS Code Menu Bar • Right-click context menu → `View React Native Monitor Network`*

![Network Demo](https://github.com/rogercg/react-native-debug-monitor-manager/blob/main/assets/network-demo-hq.gif)

**Capture every HTTP request automatically • Inspect headers, payloads, and responses • Debug API calls, authentication, and network errors**

---

## ✨ Why React Native Debug Monitor?

🚀 **Instant Setup** - One line of code and you're debugging  
📱 **Works Everywhere** - Emulators and real devices  
⚡ **Real-Time Updates** - See changes as they happen  
🎯 **VS Code Integration** - Debug without leaving your editor  
🔍 **Deep Inspection** - Headers, payloads, timing, everything  
✏️ **Live Editing** - Modify storage values on the fly  

## 🚀 Quick Start

### 1. Install Package
```bash
npm install --save-dev react-native-debug-monitor
```

### 2. Install VS Code Extension
Search for **"React Native Debug Monitor"** in VS Code Extensions marketplace

### 3. Add One Line to Your App
```javascript
import StorageDebugger from 'react-native-debug-monitor';

if (__DEV__) {
  StorageDebugger.start(); // That's it! 🎉
}
```

### 4. Start Debugging
**Multiple ways to access:**
- **Command Palette**: `Ctrl+Shift+P` (Windows/Linux) or `⌘+Shift+P` (Mac)
- **VS Code Menu**: `View` → `Command Palette`
- **Right-click**: In any file → `Command Palette`

Then type:
- **Storage**: `View React Native Monitor Storage`
- **Network**: `View React Native Monitor Network`

## 📖 Real-World Usage Examples

### 🔐 Debug Authentication Flows
```javascript
// Login flow - see everything in real-time
const login = async (email, password) => {
  // 1. Network Monitor captures this request
  const response = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  
  // 2. Storage Monitor shows token being saved
  await AsyncStorage.setItem('auth_token', response.token);
  await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
  
  // 3. Edit these values directly from VS Code to test edge cases!
};
```

### 📱 Offline-First App Development
```javascript
// Perfect for debugging sync scenarios
const savePost = async (post, isOnline) => {
  if (isOnline) {
    // Network Monitor: See API call
    await fetch('/api/posts', { method: 'POST', body: JSON.stringify(post) });
  } else {
    // Storage Monitor: Watch offline storage
    await AsyncStorage.setItem(`offline_post_${Date.now()}`, JSON.stringify(post));
  }
};
```

### 🛒 E-commerce Cart Management
```javascript
// Debug cart persistence and checkout flows
const addToCart = async (product) => {
  const cart = await AsyncStorage.getItem('shopping_cart') || '[]';
  const cartItems = [...JSON.parse(cart), product];
  
  // Storage Monitor: See cart updates instantly
  await AsyncStorage.setItem('shopping_cart', JSON.stringify(cartItems));
  
  // Network Monitor: Track analytics calls
  fetch('/api/analytics/cart_add', { method: 'POST', body: JSON.stringify(product) });
};
```

## 🔧 Configuration

### Basic Setup (Emulators)
```javascript
import StorageDebugger from 'react-native-debug-monitor';

if (__DEV__) {
  StorageDebugger.start(); // Works out of the box
}
```

### Physical Device Setup
```javascript
if (__DEV__) {
  StorageDebugger.start({ 
    serverIP: '192.168.1.100',  // Your computer's IP address
    port: 12380                 // Optional: custom port
  });
}
```

### Advanced Configuration
```javascript
StorageDebugger.start({
  serverIP: '192.168.1.100',    // Required for physical devices
  port: 12380,                  // Default: 12380
  monitorNetwork: true          // Default: true
});
```

### Network Monitoring with Axios
```javascript
import axios from 'axios';

if (__DEV__) {
  StorageDebugger.start();
  
  // Optional: Monitor specific Axios instance
  StorageDebugger.networkMonitor.addAxiosInstance(axios);
}
```

## 🎯 Features Deep Dive

### 📱 Storage Monitor Features
- ✅ **Real-time AsyncStorage visualization** - See all storage operations instantly
- ✅ **Edit values directly** - Modify data without restarting your app
- ✅ **Delete entries** - Remove unwanted data with one click
- ✅ **Copy to clipboard** - Extract data for analysis
- ✅ **Preview/Edit toggle** - Better readability for complex JSON
- ✅ **Manual refresh** - Update view when needed
- ✅ **Automatic updates** - Changes appear immediately

### 🌐 Network Monitor Features
- ✅ **Automatic request interception** - XHR, Fetch, and Axios support
- ✅ **Detailed request inspection** - Method, URL, headers, body, response
- ✅ **Response timing** - Monitor API performance
- ✅ **Status code tracking** - Quickly identify errors
- ✅ **Request/response body** - Full payload inspection
- ✅ **Custom Axios instances** - Monitor specific API clients
- ✅ **Clear history** - Reset for clean debugging sessions

## 🖥️ VS Code Access Methods

### Command Palette (Primary Method)
| Platform | Shortcut | Alternative |
|----------|----------|-------------|
| **Windows** | `Ctrl + Shift + P` | `F1` |
| **Linux** | `Ctrl + Shift + P` | `F1` |
| **Mac** | `⌘ + Shift + P` | `F1` |

### Other Access Methods
- **Menu Bar**: `View` → `Command Palette`
- **Right-click**: Any file → `Command Palette`
- **Status Bar**: Click on command palette icon (if enabled)

### Available Commands
| Command | Description |
|---------|-------------|
| `View React Native Monitor Storage` | Open AsyncStorage debugger |
| `View React Native Monitor Network` | Open network request monitor |
| `Set Storage Port` | Change server port |

## 📱 Device Setup Guide

### 🖥️ Emulators (Automatic)
- **iOS Simulator**: Works with `localhost` automatically
- **Android Emulator**: Uses `10.0.2.2` automatically

### 📱 Physical Devices (Manual IP Required)
1. **Find your computer's IP address:**
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig | findstr "IPv4"
   ```

2. **Update your app configuration:**
   ```javascript
   StorageDebugger.start({ serverIP: '192.168.1.100' }); // Your IP here
   ```

3. **Ensure same WiFi network** for device and computer

## 🐛 Troubleshooting

### 🔌 Connection Issues
**Problem**: "Server not running" error  
**Solutions**:
- ✅ Verify `StorageDebugger.start()` is called
- ✅ Check development mode (`__DEV__` is true)
- ✅ For physical devices: Use correct IP address
- ✅ Check firewall settings for port 12380

### 📱 No Storage Data Appearing
**Problem**: Storage monitor shows empty  
**Solutions**:
- ✅ Verify AsyncStorage operations are happening
- ✅ Click "Refresh" button in VS Code
- ✅ Check app console for connection errors
- ✅ Restart debug session

### 🌐 Network Requests Not Showing
**Problem**: Network monitor doesn't capture requests  
**Solutions**:
- ✅ Verify network monitoring is enabled
- ✅ For Axios: ensure instance is added correctly
- ✅ Check if requests are actually being made
- ✅ Try without Axios configuration first

### ⚡ Performance Issues
**Problem**: App feels slower with debugger  
**Solutions**:
- ✅ Tool only runs in development mode
- ✅ Minimal performance impact by design
- ✅ Disable network monitoring if not needed: `monitorNetwork: false`

## 🎯 Best Practices

### 💡 Development Workflow
1. **Start early** - Initialize debugger before storage/network operations
2. **Open monitors** - Use `Ctrl+Shift+P` (Windows/Linux) or `⌘+Shift+P` (Mac) → Command name
3. **Use descriptive keys** - `user_profile` instead of `up`
4. **Group related data** - Prefixes like `cache_`, `temp_`, `user_`
5. **Keep monitors open** - Watch changes while developing
6. **Test edge cases** - Edit storage values to simulate different states

### 🚀 Pro Tips
- **Quick access**: Pin VS Code command palette for faster debugging
- **Keyboard shortcuts**: Use `F1` as alternative to open command palette
- **Multi-monitor setup**: Keep network monitor on second screen
- **Authentication debugging**: Watch token refresh cycles in real-time
- **Offline app testing**: Monitor cache-to-server sync operations
- **Performance optimization**: Track API call patterns and frequency
- **Data migration**: Verify storage updates during app version changes

## 🔄 Advanced Usage

### Multiple API Clients
```javascript
const authAPI = axios.create({ baseURL: 'https://auth.example.com' });
const dataAPI = axios.create({ baseURL: 'https://api.example.com' });

// Monitor both instances
StorageDebugger.networkMonitor.addAxiosInstance(authAPI);
StorageDebugger.networkMonitor.addAxiosInstance(dataAPI);
```

### Conditional Debugging
```javascript
// Only debug on specific platforms or environments
if (__DEV__ && Platform.OS === 'ios') {
  StorageDebugger.start();
}
```

### Custom Port for Team Development
```javascript
// Avoid port conflicts in team environments
StorageDebugger.start({ 
  port: parseInt(process.env.DEBUG_PORT) || 12380 
});
```

## 🤝 Contributing

We welcome contributions! Help make React Native debugging even better.

### 🛠️ Development Setup
1. Fork the [repository](https://github.com/rogercg/rn-storage-manager)
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### 🐛 Reporting Issues
- [Report bugs](https://github.com/rogercg/rn-storage-manager/issues)
- [Request features](https://github.com/rogercg/rn-storage-manager/discussions)
- [Improve documentation](https://github.com/rogercg/rn-storage-manager/pulls)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🌟 Show Your Support

If this tool saves you debugging time:
- ⭐ **Star the repository** on GitHub
- 📦 **Share with your team** and the React Native community
- 💬 **Leave feedback** and suggestions for improvements
- 🐦 **Tweet about it** - help other developers discover this tool

---

**Made with ❤️ for the React Native community**

*Stop console.log debugging. Start visual debugging.* 🚀