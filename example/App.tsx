import StorageDebugger from 'rn-storage-debugger';

if (__DEV__) {
  // Para emuladores no es necesario indicar el IP de la computadora
  StorageDebugger.start();

  // Para dispositivos físicos, se debe indicar la IP de la computadora, reemplazar 192.168.1.100 por la IP de la computadora
  StorageDebugger.start({ serverIP: '192.168.1.100' });
}