declare module 'react-native-debug-monitor' {
  interface NetworkMonitor {
    start(): boolean;
    stop(): void;
    addAxiosInstance(instance: any): void;
    setAxiosInstance(instance: any): void;
    clearNetworkHistory(): void;
    getPendingRequests(): any[];
    requestRefresh(): boolean;
  }

  interface StorageDebugger {
    start(options?: { 
      serverIP?: string;
      port?: number;
      monitorNetwork?: boolean;
    }): boolean;
    stop(): void;
    setServerIP(ip: string): StorageDebugger;
    setPort(port: number): StorageDebugger;
    networkMonitor: NetworkMonitor;
  }
  
  const debugMonitor: StorageDebugger;
  export default debugMonitor;
}