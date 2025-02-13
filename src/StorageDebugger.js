import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class StorageDebugger {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectInterval = null;
        this.isInitialized = false;
        this._hasStarted = false;
        this.serverIP = null;
        console.log('📦 StorageDebugger constructor called 2');
    }

    getDebugHost() {
        if (this.serverIP) {
            console.log('🔧 Using custom server IP:', this.serverIP);
            return this.serverIP;
        }
        const defaultHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
        console.log('🔧 Using default host:', defaultHost);
        return defaultHost;
    }

    setServerIP(ip) {
        if (!ip) return this;
        
        // Validación básica de IP
        const isValidIP = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
        
        if (!isValidIP) {
            console.warn('⚠️ Invalid IP address:', ip);
            return this;
        }
        
        this.serverIP = ip;
        console.log('🔧 Server IP set to:', ip);
        return this;
    }

    // Modificamos start para aceptar opciones
    start(options = {}) {
        console.log("options ip: ", options);
        if (this._hasStarted) {
            console.log('⚠️ StorageDebugger already started');
            return false;
        }
        
        if (typeof __DEV__ === 'undefined' || !__DEV__) {
            console.log('StorageDebugger only runs in development mode');
            return false;
        }

        this._hasStarted = true;

        
        
        if (options.serverIP) {
            console.log('🔧 Setting custom server IP:', options.serverIP);
            this.setServerIP(options.serverIP);
        }

        console.log('🚀 StorageDebugger starting...');
        this.connect();
        return true;
    }

    connect() {
        if (this.ws) {
            console.log('🔄 WebSocket already exists, closing previous connection');
            this.ws.close();
            this.ws = null;
        }

        const debugHost = this.getDebugHost();
        console.log(`🔌 Attempting to connect to WebSocket at ${debugHost}:8082...`);
        
        try {
            this.ws = new WebSocket(`ws://${debugHost}:8082`);

            this.ws.onopen = () => {
                console.log('✅ WebSocket connection established');
                this.isConnected = true;
                this.getAllKeys()
                    .then(data => {
                        if (this.ws && this.isConnected) {
                            this.ws.send(JSON.stringify({
                                type: 'STORAGE_DATA',
                                data
                            }));
                        }
                    })
                    .catch(console.error);
            };

            this.ws.onclose = () => {
                console.log('❌ WebSocket connection closed');
                this.isConnected = false;
                this.scheduleReconnect();
            };

            this.ws.onmessage = async (event) => {
                try {
                    const message = JSON.parse(event.data);
                    console.log('📥 Received message:', message);
                    
                    switch (message.type) {
                        case 'GET_STORAGE':
                            const data = await this.getAllKeys();
                            if (this.ws && this.isConnected) {
                                this.ws.send(JSON.stringify({
                                    type: 'STORAGE_DATA',
                                    data
                                }));
                            }
                            break;
                        case 'DELETE_VALUE':
                            if (message.data?.key) {
                                await AsyncStorage.removeItem(message.data.key);
                                await this.sendStorageData();
                            }
                            break;
                        case 'UPDATE_VALUE':
                            if (message.data?.key && message.data?.value) {
                                await this.updateValue(message.data.key, message.data.value);
                                await this.sendStorageData();
                            }
                            break;
                    }
                } catch (error) {
                    console.error('❌ Error handling message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.log('❌ WebSocket error:', error);
            };
        } catch (error) {
            console.error('❌ Error creating WebSocket:', error);
            this.scheduleReconnect();
        }
    }

    scheduleReconnect() {
        if (this.reconnectInterval) {
            return;
        }

        console.log('🔄 Scheduling reconnection...');
        this.reconnectInterval = setInterval(() => {
            if (!this.isConnected) {
                this.connect();
            } else {
                clearInterval(this.reconnectInterval);
                this.reconnectInterval = null;
            }
        }, 5000);
    }

    async getAllKeys() {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const entries = await Promise.all(
                keys.map(async (key) => {
                    const value = await AsyncStorage.getItem(key);
                    return { key, value: value || '' };
                })
            );
            return entries;
        } catch (error) {
            console.error('❌ Error getting storage data:', error);
            return [];
        }
    }

    async updateValue(key, value) {
        try {
            await AsyncStorage.setItem(key, value);
            console.log(`✅ Updated ${key} with value ${value}`);
            return true;
        } catch (error) {
            console.error('❌ Error updating storage:', error);
            return false;
        }
    }

    async sendStorageData() {
        if (!this.isConnected || !this.ws) {
            return;
        }

        try {
            const data = await this.getAllKeys();
            this.ws.send(JSON.stringify({
                type: 'STORAGE_DATA',
                data
            }));
        } catch (error) {
            console.error('❌ Error sending storage data:', error);
        }
    }

    stop() {
        if (this.ws) {
            this.ws.close();
        }
        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
        }
        this.isConnected = false;
        this.ws = null;
        this.reconnectInterval = null;
        this._hasStarted = false;
    }
}

// Exportar una única instancia
const instance = new StorageDebugger();
export default instance;