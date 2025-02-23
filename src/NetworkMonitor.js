import { Platform } from 'react-native';

class NetworkMonitor {
    constructor(storageDebugger) {
        this.storageDebugger = storageDebugger;
        this.isMonitoring = false;
        this.requestId = 1;
        this.pendingRequests = new Map();
        this.originalXHROpen = null;
        this.originalXHRSend = null;
        this.originalXHRSetRequestHeader = null;
        this.originalFetch = null;
        this.axiosInstances = new Set();
        
        console.log('🌐 NetworkMonitor initialized');
        
        this._setupPassiveMonitoring();
    }

    addAxiosInstance(instance) {
        if (!instance || !instance.interceptors) {
            console.log('⚠️ Invalid axios instance');
            return;
        }

        if (this.axiosInstances.has(instance)) {
            return;
        }

        this.axiosInstances.add(instance);
        this._patchAxiosInstance(instance);
        console.log('✅ Axios instance added to monitor');
    }

    setAxiosInstance(instance) {
        this.addAxiosInstance(instance);
    }

    _patchAxiosInstance(instance) {
        if (!instance || !instance.interceptors) {
            console.log('Invalid axios instance provided');
            return;
        }

        const self = this;

        instance.interceptors.request.use(
            (config) => {
                const requestData = {
                    id: self.requestId++,
                    method: (config.method || 'get').toUpperCase(),
                    url: config.url,
                    headers: config.headers || {},
                    startTime: Date.now(),
                    requestBody: config.data,
                    status: 0
                };

                // console.log(`📡 Monitoring request: ${requestData.method} ${requestData.url}`);
                self.pendingRequests.set(requestData.id, requestData);
                config._networkMonitorId = requestData.id;

                if (self.isMonitoring && self.storageDebugger.isConnected) {
                    self._sendNetworkEvent('REQUEST_STARTED', requestData);
                }

                return config;
            },
            (error) => Promise.reject(error)
        );

        instance.interceptors.response.use(
            (response) => {
                if (response.config._networkMonitorId) {
                    const requestData = self.pendingRequests.get(response.config._networkMonitorId);
                    if (requestData) {
                        requestData.status = response.status;
                        requestData.endTime = Date.now();
                        requestData.responseBody = response.data;
                        requestData.responseType = response.headers['content-type'];

                        if (self.isMonitoring && self.storageDebugger.isConnected) {
                            self._sendNetworkEvent('REQUEST_COMPLETED', requestData);
                        }

                        self.pendingRequests.delete(response.config._networkMonitorId);
                    }
                }
                return response;
            },
            (error) => {
                if (error.config && error.config._networkMonitorId) {
                    const requestData = self.pendingRequests.get(error.config._networkMonitorId);
                    if (requestData) {
                        requestData.status = error.response ? error.response.status : 0;
                        requestData.endTime = Date.now();
                        requestData.error = error.message;
                        requestData.responseBody = error.response ? error.response.data : null;

                        if (self.isMonitoring && self.storageDebugger.isConnected) {
                            self._sendNetworkEvent('REQUEST_FAILED', requestData);
                        }

                        self.pendingRequests.delete(error.config._networkMonitorId);
                    }
                }
                return Promise.reject(error);
            }
        );

        if (instance.defaults && instance.defaults.adapter) {
            const originalAdapter = instance.defaults.adapter;
            instance.defaults.adapter = async function(config) {
                try {
                    const response = await originalAdapter(config);
                    return response;
                } catch (error) {
                    throw error;
                }
            };
        }
    }

    _setupPassiveMonitoring() {
        if (global.XMLHttpRequest) {
            const self = this;
            
            const existingXHRProto = XMLHttpRequest.prototype;
            if (existingXHRProto.addEventListener) {
                const originalAddEventListener = existingXHRProto.addEventListener;
                
                existingXHRProto.addEventListener = function(type, listener, options) {
                    if (type === 'load' && !this._networkMonitorPassive) {
                        this._networkMonitorPassive = true;
                        
                        setTimeout(() => {
                            if (this.responseURL) {
                                const url = this.responseURL;
                                const method = this._requestMethod || 'GET';
                                const status = this.status;
                                
                                const reqId = self.requestId++;
                                
                                try {
                                    let responseBody = null;
                                    if (this.responseType === '' || this.responseType === 'text') {
                                        responseBody = this.responseText;
                                    } else if (this.responseType === 'json') {
                                        responseBody = JSON.stringify(this.response);
                                    }
                                    
                                    const requestData = {
                                        id: reqId,
                                        method,
                                        url,
                                        headers: {},
                                        startTime: Date.now() - 1000,
                                        endTime: Date.now(),
                                        status,
                                        responseType: this.responseType,
                                        responseBody
                                    };
                                    
                                    if (self.storageDebugger.isConnected) {
                                        self._sendNetworkEvent('REQUEST_COMPLETED', requestData);
                                    }
                                } catch (error) {
                                    console.error('❌ Error capturing passive XHR:', error);
                                }
                            }
                        }, 0);
                    }
                    return originalAddEventListener.apply(this, arguments);
                };
            }
        }
    }

    start() {
        if (this.isMonitoring) {
            console.log('⚠️ NetworkMonitor already started');
            return false;
        }

        if (typeof __DEV__ === 'undefined' || !__DEV__) {
            console.log('NetworkMonitor only runs in development mode');
            return false;
        }

        console.log('🚀 Starting NetworkMonitor...');
        
        if (global.XMLHttpRequest) {
            this.originalXHROpen = XMLHttpRequest.prototype.open;
            this.originalXHRSend = XMLHttpRequest.prototype.send;
            this.originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
        }
        this.originalFetch = global.fetch;
        
        this._patchXHR();
        this._patchFetch();
        this._patchAxios();
        this.isMonitoring = true;
        
        if (this.storageDebugger.isConnected && this.storageDebugger.ws) {
            this.storageDebugger.ws.send(JSON.stringify({
                type: 'NETWORK_STATUS',
                data: { monitoring: true }
            }));
        }
        
        return true;
    }

    stop() {
        if (!this.isMonitoring) {
            return;
        }
        
        if (global.XMLHttpRequest) {
            if (this.originalXHROpen) XMLHttpRequest.prototype.open = this.originalXHROpen;
            if (this.originalXHRSend) XMLHttpRequest.prototype.send = this.originalXHRSend;
            if (this.originalXHRSetRequestHeader) XMLHttpRequest.prototype.setRequestHeader = this.originalXHRSetRequestHeader;
        }
        
        if (this.originalFetch) {
            global.fetch = this.originalFetch;
        }
        
        this.isMonitoring = false;
        console.log('⏹️ NetworkMonitor stopped');
        
        if (this.storageDebugger.isConnected && this.storageDebugger.ws) {
            this.storageDebugger.ws.send(JSON.stringify({
                type: 'NETWORK_STATUS',
                data: { monitoring: false }
            }));
        }
    }

    _patchXHR() {
        if (!global.XMLHttpRequest) {
            console.log('⚠️ XMLHttpRequest not available, skipping patch');
            return;
        }
        
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
        const self = this;

        XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
            this._networkMonitorData = {
                id: self.requestId++,
                method,
                url,
                headers: {},
                startTime: Date.now(),
                requestBody: null,
                status: 0,
                responseType: '',
                responseBody: null,
                endTime: null
            };
            
            this._requestMethod = method;
            
            // console.log(`🔍 NetworkMonitor intercepted XHR: ${method} ${url}`);
            
            return originalOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
            if (this._networkMonitorData) {
                this._networkMonitorData.headers[header] = value;
            }
            return originalSetRequestHeader.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function(body) {
            if (this._networkMonitorData) {
                this._networkMonitorData.requestBody = body;
                
                if (self.isMonitoring && self.storageDebugger.isConnected) {
                    self._sendNetworkEvent('REQUEST_STARTED', this._networkMonitorData);
                }
                
                self.pendingRequests.set(this._networkMonitorData.id, this._networkMonitorData);

                this.addEventListener('load', function() {
                    if (this._networkMonitorData) {
                        this._networkMonitorData.status = this.status;
                        this._networkMonitorData.endTime = Date.now();
                        
                        try {
                            if (this.responseType === '' || this.responseType === 'text') {
                                this._networkMonitorData.responseBody = this.responseText;
                            } else if (this.responseType === 'json') {
                                this._networkMonitorData.responseBody = JSON.stringify(this.response);
                            } else {
                                this._networkMonitorData.responseBody = '[' + this.responseType + ' data]';
                            }
                            this._networkMonitorData.responseType = this.responseType;
                            
                            if (self.storageDebugger.isConnected) {
                                self._sendNetworkEvent('REQUEST_COMPLETED', this._networkMonitorData);
                            }
                            
                            self.pendingRequests.delete(this._networkMonitorData.id);
                        } catch (error) {
                            console.error('❌ Error capturing response:', error);
                        }
                    }
                });

                this.addEventListener('error', function() {
                    if (this._networkMonitorData) {
                        this._networkMonitorData.status = 0;
                        this._networkMonitorData.endTime = Date.now();
                        this._networkMonitorData.error = 'Network Error';
                        
                        if (self.storageDebugger.isConnected) {
                            self._sendNetworkEvent('REQUEST_FAILED', this._networkMonitorData);
                        }
                        
                        self.pendingRequests.delete(this._networkMonitorData.id);
                    }
                });

                this.addEventListener('abort', function() {
                    if (this._networkMonitorData) {
                        this._networkMonitorData.status = 0;
                        this._networkMonitorData.endTime = Date.now();
                        this._networkMonitorData.error = 'Aborted';
                        
                        if (self.storageDebugger.isConnected) {
                            self._sendNetworkEvent('REQUEST_ABORTED', this._networkMonitorData);
                        }
                        
                        self.pendingRequests.delete(this._networkMonitorData.id);
                    }
                });
            }
            
            return originalSend.apply(this, arguments);
        };
    }

    _patchFetch() {
        const originalFetch = global.fetch;
        const self = this;
        
        global.fetch = function(input, init) {
            const requestData = {
                id: self.requestId++,
                method: (init && init.method) || (typeof input === 'object' ? input.method : 'GET'),
                url: typeof input === 'string' ? input : input.url,
                headers: {},
                startTime: Date.now(),
                requestBody: null,
                status: 0,
                responseType: '',
                responseBody: null,
                endTime: null
            };
            
            // console.log(`🔍 NetworkMonitor intercepted fetch: ${requestData.method} ${requestData.url}`);
            
            if (init && init.headers) {
                if (init.headers instanceof Headers) {
                    init.headers.forEach((value, name) => {
                        requestData.headers[name] = value;
                    });
                } else if (typeof init.headers === 'object') {
                    Object.keys(init.headers).forEach(key => {
                        requestData.headers[key] = init.headers[key];
                    });
                }
            }
            
            if (init && init.body) {
                if (typeof init.body === 'string') {
                    requestData.requestBody = init.body;
                } else {
                    try {
                        requestData.requestBody = JSON.stringify(init.body);
                    } catch (e) {
                        requestData.requestBody = '[complex body]';
                    }
                }
            }
            
            if (self.isMonitoring && self.storageDebugger.isConnected) {
                self._sendNetworkEvent('REQUEST_STARTED', requestData);
            }
            
            self.pendingRequests.set(requestData.id, requestData);
            
            return originalFetch.apply(this, arguments)
                .then(response => {
                    requestData.endTime = Date.now();
                    requestData.status = response.status;
                    
                    const clonedResponse = response.clone();
                    
                    return clonedResponse.text()
                        .then(text => {
                            try {
                                JSON.parse(text);
                                requestData.responseType = 'json';
                            } catch (e) {
                                requestData.responseType = 'text';
                            }
                            
                            requestData.responseBody = text;
                            
                            if (self.storageDebugger.isConnected) {
                                self._sendNetworkEvent('REQUEST_COMPLETED', requestData);
                            }
                            
                            self.pendingRequests.delete(requestData.id);
                            
                            return response;
                        })
                        .catch(error => {
                            requestData.responseType = 'unknown';
                            requestData.responseBody = '[unreadable response]';
                            
                            if (self.storageDebugger.isConnected) {
                                self._sendNetworkEvent('REQUEST_COMPLETED', requestData);
                            }
                            
                            self.pendingRequests.delete(requestData.id);
                            
                            return response;
                        });
                })
                .catch(error => {
                    requestData.endTime = Date.now();
                    requestData.status = 0;
                    requestData.error = error.message || 'Network Error';
                    
                    if (self.storageDebugger.isConnected) {
                        self._sendNetworkEvent('REQUEST_FAILED', requestData);
                    }
                    
                    self.pendingRequests.delete(requestData.id);
                    
                    throw error;
                });
        };
    }

    _patchAxios() {
        if (!this.axiosInstance) {
            console.log('⚠️ No Axios instance provided');
            return;
        }

        const self = this;

        this.axiosInstance.interceptors.request.use(
            (config) => {
                const requestData = {
                    id: self.requestId++,
                    method: config.method?.toUpperCase() || 'GET',
                    url: config.url,
                    headers: config.headers || {},
                    startTime: Date.now(),
                    requestBody: config.data,
                    status: 0,
                    responseType: '',
                    responseBody: null,
                    endTime: null
                };

                if (self.isMonitoring && self.storageDebugger.isConnected) {
                    self._sendNetworkEvent('REQUEST_STARTED', requestData);
                }

                self.pendingRequests.set(requestData.id, requestData);
                config._networkMonitorId = requestData.id;

                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        this.axiosInstance.interceptors.response.use(
            (response) => {
                const requestId = response.config._networkMonitorId;
                if (requestId && self.pendingRequests.has(requestId)) {
                    const requestData = self.pendingRequests.get(requestId);
                    requestData.status = response.status;
                    requestData.endTime = Date.now();
                    requestData.responseBody = response.data;
                    requestData.responseType = response.headers['content-type'];

                    if (self.isMonitoring && self.storageDebugger.isConnected) {
                        self._sendNetworkEvent('REQUEST_COMPLETED', requestData);
                    }

                    self.pendingRequests.delete(requestId);
                }
                return response;
            },
            (error) => {
                if (error.config && error.config._networkMonitorId) {
                    const requestId = error.config._networkMonitorId;
                    const requestData = self.pendingRequests.get(requestId);
                    if (requestData) {
                        requestData.status = error.response ? error.response.status : 0;
                        requestData.endTime = Date.now();
                        requestData.error = error.message;
                        requestData.responseBody = error.response ? error.response.data : null;

                        if (self.isMonitoring && self.storageDebugger.isConnected) {
                            self._sendNetworkEvent('REQUEST_FAILED', requestData);
                        }

                        self.pendingRequests.delete(requestId);
                    }
                }
                return Promise.reject(error);
            }
        );

        if (this.axiosInstance.defaults.adapter) {
            const originalAdapter = this.axiosInstance.defaults.adapter;
            this.axiosInstance.defaults.adapter = async function(config) {
                try {
                    const response = await originalAdapter(config);
                    return response;
                } catch (error) {
                    throw error;
                }
            };
        }
    }

    _patchCustomAdapter() {
        const self = this;
        const originalAdapter = instance.defaults.adapter;

        instance.defaults.adapter = async function(config) {
            const requestData = {
                id: self.requestId++,
                method: config.method.toUpperCase(),
                url: config.url,
                headers: config.headers || {},
                startTime: Date.now(),
                requestBody: config.data,
                status: 0,
                responseType: '',
                responseBody: null,
                endTime: null
            };

            if (self.isMonitoring && self.storageDebugger.isConnected) {
                self._sendNetworkEvent('REQUEST_STARTED', requestData);
            }

            try {
                const response = await originalAdapter(config);
                
                requestData.status = response.status;
                requestData.endTime = Date.now();
                requestData.responseBody = response.data;
                requestData.responseType = response.headers['content-type'];

                if (self.isMonitoring && self.storageDebugger.isConnected) {
                    self._sendNetworkEvent('REQUEST_COMPLETED', requestData);
                }

                return response;
            } catch (error) {
                requestData.status = error.response ? error.response.status : 0;
                requestData.endTime = Date.now();
                requestData.error = error.message;
                requestData.responseBody = error.response ? error.response.data : null;

                if (self.isMonitoring && self.storageDebugger.isConnected) {
                    self._sendNetworkEvent('REQUEST_FAILED', requestData);
                }

                throw error;
            }
        };
    }

    _sendNetworkEvent(eventType, data) {
        if (!this.storageDebugger || !this.storageDebugger.isConnected || !this.storageDebugger.ws) {
            return;
        }
        
        try {
            this.storageDebugger.ws.send(JSON.stringify({
                type: 'NETWORK_EVENT',
                eventType,
                data
            }));
        } catch (error) {
            console.error('❌ Error sending network event:', error);
        }
    }
    
    getPendingRequests() {
        return Array.from(this.pendingRequests.values());
    }
    
    requestRefresh() {
        if (this.storageDebugger && this.storageDebugger.isConnected && this.storageDebugger.ws) {
            this.storageDebugger.ws.send(JSON.stringify({
                type: 'NETWORK_EVENT',
                eventType: 'REQUEST_REFRESH',
                data: {}
            }));
            
            const pendingRequests = this.getPendingRequests();
            pendingRequests.forEach(request => {
                this._sendNetworkEvent('REQUEST_PENDING', request);
            });
            
            return true;
        }
        return false;
    }

    clearNetworkHistory() {
        this.pendingRequests.clear();
        if (this.storageDebugger.isConnected && this.storageDebugger.ws) {
            this._sendNetworkEvent('CLEAR_NETWORK_HISTORY', {});
        }
    }
    
    
}

export default NetworkMonitor;