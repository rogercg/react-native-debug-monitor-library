import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import NetworkMonitor from './NetworkMonitor';

class StorageDebugger {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectInterval = null;
        this.isInitialized = false;
        this._hasStarted = false;
        this.serverIP = null;
        this.port = null;
        this.networkMonitor = null;
        this.connectionAttempts = 0;
        this.maxAttempts = 3;
    }

    // Obtener IP automáticamente usando diferentes métodos
    async getDeviceIPs() {
        const possibleIPs = [];
        
        // IPs por defecto según plataforma
        if (Platform.OS === 'android') {
            possibleIPs.push('10.0.2.2'); // Android emulator
            possibleIPs.push('10.0.3.2'); // Genymotion
        } else {
            possibleIPs.push('localhost'); // iOS simulator
        }

        // IPs comunes de desarrollo
        possibleIPs.push(
            '192.168.1.1',   // Router común
            '192.168.0.1',   // Router común
            '172.16.0.1',    // Docker/VPN
            '10.0.0.1'       // Otra configuración común
        );

        // Intentar obtener IP desde endpoint público (solo para referencia)
        try {
            const response = await fetch('https://api.ipify.org?format=json', { 
                timeout: 3000 
            });
            const data = await response.json();
            // No usar IP pública directamente, pero ayuda para debug
            console.log('🔍 Public IP detected:', data.ip);
        } catch (e) {
            console.log('📍 Could not detect public IP');
        }

        return possibleIPs;
    }

    getDebugHost() {
        if (this.serverIP) {
            console.log('🔧 Using custom server IP:', this.serverIP);
            return this.serverIP;
        }

        // Para dispositivos reales, necesitamos la IP de la máquina host
        if (Platform.OS === 'android') {
            const defaultHost = '10.0.2.2'; // Android emulator default
            console.log('🔧 Using Android host:', defaultHost);
            return defaultHost;
        } else {
            const defaultHost = 'localhost'; // iOS simulator default
            console.log('🔧 Using iOS host:', defaultHost);
            return defaultHost;
        }
    }

    // Método mejorado para detectar la IP del servidor automáticamente
    async autoDetectServerIP() {
        const port = this.port || 12380;
        const commonIPs = [
            '192.168.1.100', '192.168.1.101', '192.168.1.102', '192.168.1.103',
            '192.168.0.100', '192.168.0.101', '192.168.0.102', '192.168.0.103',
            '10.0.1.100', '10.0.1.101', '10.0.1.102',
            '172.16.0.100', '172.16.0.101',
        ];

        // En Android emulator, probar primero la IP por defecto
        if (Platform.OS === 'android') {
            commonIPs.unshift('10.0.2.2');
        }

        console.log('🔍 Auto-detecting server IP...');
        
        for (const ip of commonIPs) {
            try {
                console.log(`🔌 Testing connection to ${ip}:${port}`);
                const testWs = new WebSocket(`ws://${ip}:${port}`);
                
                const connected = await new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        testWs.close();
                        resolve(false);
                    }, 2000);

                    testWs.onopen = () => {
                        clearTimeout(timeout);
                        testWs.close();
                        resolve(true);
                    };

                    testWs.onerror = () => {
                        clearTimeout(timeout);
                        resolve(false);
                    };
                });

                if (connected) {
                    console.log(`✅ Found server at ${ip}:${port}`);
                    this.serverIP = ip;
                    return ip;
                }
            } catch (error) {
                // Continuar con la siguiente IP
            }
        }

        console.log('❌ Could not auto-detect server IP');
        return null;
    }

    setServerIP(ip) {
        if (!ip) return this;
        
        // Validar IP
        const isValidIP = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
        const isLocalhost = ip === 'localhost';
        
        if (!isValidIP && !isLocalhost) {
            console.warn('⚠️ Invalid IP address:', ip);
            return this;
        }
        
        this.serverIP = ip;
        this.connectionAttempts = 0; // Reset attempts
        console.log('🔧 Server IP set to:', ip);

        return this;
    }

    setPort(port) {
        if (!port || isNaN(port) || port < 1 || port > 65535) {
            console.warn('⚠️ Invalid port number:', port);
            return this;
        }
        
        this.port = port;
        this.connectionAttempts = 0; // Reset attempts
        console.log('🔧 Port set to:', port);

        if (this._hasStarted) {
            console.log('🔄 Restarting connection with new port...');
            this.connect();
        }

        return this;
    }

    start(options = {}) {
        if (this._hasStarted) {
            console.log('⚠️ StorageDebugger already started');
            return false;
        }
        
        if (typeof __DEV__ === 'undefined' || !__DEV__) {
            console.log('StorageDebugger only runs in development mode');
            return false;
        }
        
        // IMPORTANTE: Configurar IP ANTES de marcar como iniciado
        if (options.serverIP) {
            console.log('🔧 Setting custom server IP:', options.serverIP);
            this.serverIP = options.serverIP; // Asignar directamente
        }

        if (options.port) {
            console.log('🔧 Setting custom port:', options.port);
            this.port = parseInt(options.port);
        }

        this._hasStarted = true;
        console.log('🚀 StorageDebugger starting...');
        
        this.connect();
        return true;
    }

    async connect() {
        if (this.ws) {
            console.log('🔄 WebSocket already exists, closing previous connection');
            this.ws.close();
            this.ws = null;
        }

        // Si no tenemos IP y llegamos al límite de intentos, intentar auto-detectar
        if (!this.serverIP && this.connectionAttempts >= this.maxAttempts) {
            console.log('🔍 Max attempts reached, trying auto-detection...');
            const detectedIP = await this.autoDetectServerIP();
            if (detectedIP) {
                this.serverIP = detectedIP;
                this.connectionAttempts = 0; // Reset counter
            }
        }

        const debugHost = this.getDebugHost();
        const port = this.port || 12380;
        const wsUrl = `ws://${debugHost}:${port}`.trim();
        
        this.connectionAttempts++;
        console.log(`🔌 Attempting to connect to WebSocket at ${wsUrl} (attempt ${this.connectionAttempts})`);
        
        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('✅ WebSocket connection established');
                this.isConnected = true;
                this.connectionAttempts = 0; // Reset on successful connection
                
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
                        case 'CLEAR_ALL_STORAGE':
                            await this.clearAllStorage();
                            await this.sendStorageData();
                            break;
                    }
                } catch (error) {
                    console.error('❌ Error handling message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.log('❌ WebSocket error:', error);
                // Si el error es de conexión y no hemos probado auto-detectar
                if (!this.serverIP && this.connectionAttempts < this.maxAttempts) {
                    console.log('🔍 Connection failed, will try auto-detection on next attempt');
                }
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

        const delay = Math.min(5000 * this.connectionAttempts, 30000); // Backoff progresivo
        console.log(`🔄 Scheduling reconnection in ${delay/1000}s...`);
        
        this.reconnectInterval = setTimeout(() => {
            this.reconnectInterval = null;
            if (!this.isConnected) {
                this.connect();
            }
        }, delay);
    }



    // Resto de métodos sin cambios...
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

    async clearAllStorage() {
        try {
            const keys = await AsyncStorage.getAllKeys();
            await AsyncStorage.multiRemove(keys);
            console.log('✅ All storage items cleared');
            return true;
        } catch (error) {
            console.error('❌ Error clearing storage:', error);
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
            clearTimeout(this.reconnectInterval);
        }
        this.isConnected = false;
        this.ws = null;
        this.reconnectInterval = null;
        this._hasStarted = false;
        this.connectionAttempts = 0;
    }

    suggestIPs() {
        console.log('💡 Suggested IPs to try:');
        console.log('   For development machine: 192.168.1.xxx, 192.168.0.xxx');
        console.log('   Check your machine IP with: ipconfig (Windows) or ifconfig (Mac/Linux)');
        console.log('   Usage: StorageDebugger.start({ serverIP: "192.168.1.100" })');
    }
}

const instance = new StorageDebugger();
const networkMonitor = new NetworkMonitor(instance);

const originalStart = instance.start;
instance.start = function(options = {}) {
    const result = originalStart.call(this, options);
    
    if (result && options.monitorNetwork !== false) {
        networkMonitor.start();
    }
    
    return result;
};

const originalStop = instance.stop;
instance.stop = function() {
    networkMonitor.stop();
    return originalStop.call(this);
};

instance.networkMonitor = networkMonitor;

export default instance;