# RN Storage Debugger

A VSCode extension and React Native library for debugging AsyncStorage in real-time.

## Features

- 🔍 Real-time AsyncStorage visualization
- ✏️ Edit storage values directly from VSCode
- 🔄 Automatic updates
- 💻 Simple integration

## Installation

```bash
npm install rn-storage-debugger
```

Also install the VSCode extension "RN Storage Manager" from the marketplace.

## Usage

```javascript
import StorageDebugger from 'rn-storage-debugger';

// Initialize in your app's entry point
if (__DEV__) {
  StorageDebugger.start();
}
```

Then in VSCode:
1. Open Command Palette (Cmd/Ctrl + Shift + P)
2. Type "RN: View Storage"
3. Press Enter

## Requirements

- React Native project
- @react-native-async-storage/async-storage
- VSCode with RN Storage Manager extension

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT