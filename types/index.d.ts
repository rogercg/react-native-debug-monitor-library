declare module 'rn-storage-debugger' {
    interface StorageDebugger {
      start(): boolean;
      stop(): void;
    }
  
    const instance: StorageDebugger;
    export default instance;
  }