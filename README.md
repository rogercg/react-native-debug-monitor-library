# RN Storage Debugger
Real-time AsyncStorage Debugging Tool for React Native

## Table of Contents
1. Introduction
2. Installation
3. Features
4. Usage Guide
5. Configuration
6. Troubleshooting
7. Contributing
8. License

## 1. Introduction
RN Storage Debugger is a development tool designed to facilitate real-time debugging and management of AsyncStorage in React Native applications. Through its integration with Visual Studio Code, developers can visualize, edit, and manage AsyncStorage data directly from their development environment.

## 2. Installation

### 2.1 NPM Package
Install the npm package in your React Native project:
```bash
npm install --save-dev rn-storage-debugger
```

### 2.2 VSCode Extension
Install the "RN Storage Manager" extension from the Visual Studio Code marketplace.

## 3. Features
- Real-time AsyncStorage visualization
- Edit and delete storage values directly from VSCode
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
import StorageDebugger from 'rn-storage-debugger';

if (__DEV__) {
  // For emulators
  StorageDebugger.start();
}
```

Custom Port
```javascript
StorageDebugger.start({
  port: 8083              // Replace with your custom port. Optional Property.
});
```
Reload the app after changing the port.

### 4.2 Physical Device Setup
When using a physical device, specify your computer's IP address:

```javascript
if (__DEV__) {
  // For physical devices
  StorageDebugger.start({ serverIP: '192.168.1.100' });  // Replace with your computer's local IP address. Optional Property.
}
```
Reload the app after changing the IP.
### 4.3 Advanced Setup

For advanced configurations, you can specify additional options:

```javascript
StorageDebugger.start({
  serverIP: '192.168.1.100',  // Replace with your computer's local IP address. Optional Property.
  port: 8083,                // Replace with your custom port. Optional Property.
});
```
Reload the app after changing the port or IP.

### 4.3 VSCode Integration
1. Open Command Palette (Cmd/Ctrl + Shift + P)
2. Type "RN: View Storage"
3. Press Enter

## 5. Configuration

### 5.1 Configuration Options
```typescript
interface StorageDebuggerOptions {
  serverIP?: string;  // Your computer's IP address for physical devices
  port?: string;  // Custom port
}
```

### 5.2 Default Configuration
- Default port: 12380
- Default host: 
  - Emulators: Automatically configured
  - iOS Simulator: 'localhost'
  - Android Emulator: '10.0.2.2'

## 6. Troubleshooting

### 6.1 Physical Device Connection Issues
- Ensure device and computer are on the same network
- Verify the correct IP address is being used
- Check if port 12380 is not blocked by firewall
- Confirm the development server is running

### 6.2 Common Issues and Solutions
1. Connection fails
   - Check network configuration
   - Verify IP address
   - Ensure development mode is enabled

2. No data displays
   - Verify AsyncStorage initialization
   - Check console for error messages
   - Try manual refresh

3. Changes not reflecting
   - Use manual refresh
   - Check WebSocket connection status
   - Verify write permissions

## 7. Contributing
Contributions are welcome! Visit our GitHub repository at:
https://github.com/rogercg/rn-storage-manager

Steps to contribute:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 8. License
This project is licensed under the MIT License.