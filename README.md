# React Native Debug Monitor
AsyncStorage and Network Debugging Tool for React Native

## Table of Contents
1. Introduction
2. Installation
3. Features
4. Usage Guide
5. Network Monitor
6. Configuration
7. Troubleshooting
8. Contributing
9. License

## 1. Introduction
React Native Debug Monitor is a development tool designed to facilitate real-time debugging and management of AsyncStorage and Network requests in React Native applications. Through its integration with Visual Studio Code, developers can visualize, edit, and manage AsyncStorage data and monitor network activity directly from their development environment.

## 2. Installation

### 2.1 NPM Package
Install the npm package in your React Native project:
```bash
npm install --save-dev react-native-debug-monitor
```

### 2.2 VSCode Extension
Install the "React Native Debug Monitor" extension from the Visual Studio Code marketplace.

## 3. Features
- Real-time AsyncStorage visualization
- Network request monitoring (XHR, Fetch, and Axios)
- Edit and delete storage values directly from VSCode
- Network request inspection with details (headers, body, response)
- Automatic data updates
- Preview/Edit toggle for better readability
- Support for both emulators and physical devices
- Auto-reconnect capability
- Copy values to clipboard
- Manual refresh option

## 4. Usage Guide

### 4.1 Basic Setup
Add the following code to your React Native application's entry point:

```javascript
import StorageDebugger from 'react-native-debug-monitor';

if (__DEV__) {
  // For emulators
  StorageDebugger.start();
}
```

### 4.2 Network Monitor Setup
To enable network monitoring with Axios:

```javascript
import StorageDebugger from 'react-native-debug-monitor';
import axios from './axiosCustom';  // Your axios instance

if (__DEV__) {
  StorageDebugger.start();
  // Configure axios monitoring (optional)
  if (StorageDebugger.networkMonitor) {
    StorageDebugger.networkMonitor.addAxiosInstance(axios);
  }
}
```

### 4.3 Physical Device Setup
When using a physical device, specify your computer's IP address:

```javascript
if (__DEV__) {
  StorageDebugger.start({ 
    serverIP: '192.168.1.100',  // Replace with your computer's local IP address
  });
}
```

### 4.4 Advanced Setup
For advanced configurations:

```javascript
StorageDebugger.start({
  serverIP: '192.168.1.100',  // Optional: Your computer's IP address
  port: 8083,                 // Optional: Custom port
});
```

### 4.5 VSCode Integration
1. Open Command Palette (Cmd/Ctrl + Shift + P)
2. Type "RN: View Storage" for storage management
3. Type "RN: View Network" for network monitoring
4. Press Enter

## 5. Network Monitor

### 5.1 Features
- Monitor XHR, Fetch, and Axios requests
- Real-time request tracking
- Request/Response inspection
- Headers and body examination
- Status code tracking
- Request timing information
- Clear request history
- Support for custom Axios instances

### 5.2 Network Data Inspection
The network monitor provides detailed information for each request:
- Method (GET, POST, PUT, etc.)
- URL
- Status code
- Response time
- Request headers
- Request body
- Response headers
- Response body

### 5.3 Using Network Monitor
1. Open the Network Monitor from VSCode
2. View real-time requests
3. Click on any request to view details
4. Use the Clear History button to reset
5. Use the Refresh button to update the view

## 6. Configuration

### 6.1 Configuration Options
```typescript
interface StorageDebuggerOptions {
  serverIP?: string;     // Your computer's IP address for physical devices
  port?: number;         // Custom port number
  monitorNetwork?: boolean; // Enable/disable network monitoring (default: true)
}
```

### 6.2 Default Configuration
- Default port: 12380
- Default host: 
  - Emulators: Automatically configured
  - iOS Simulator: 'localhost'
  - Android Emulator: '10.0.2.2'
- Network monitoring: Enabled by default

## 7. Troubleshooting

### 7.1 Physical Device Connection Issues
- Ensure device and computer are on the same network
- Verify the correct IP address is being used
- Check if port 12380 is not blocked by firewall
- Confirm the development server is running

### 7.2 Network Monitor Issues
- Verify network monitoring is enabled
- Check axios instance configuration
- Ensure requests are made after initialization
- Verify WebSocket connection status

### 7.3 Common Issues and Solutions
1. Connection fails
   - Check network configuration
   - Verify IP address
   - Ensure development mode is enabled

2. No data displays
   - Verify AsyncStorage initialization
   - Check console for error messages
   - Try manual refresh

3. Network requests not showing
   - Verify network monitor initialization
   - Check axios instance configuration
   - Ensure requests are made after setup

## 8. Contributing
Contributions are welcome! Visit our GitHub repository at:
https://github.com/rogercg/rn-storage-manager

Steps to contribute:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 9. License
This project is licensed under the MIT License.