import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BluetoothDevice } from '../../services/BluetoothService';

export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTING = 'DISCONNECTING',
}

interface BluetoothState {
  isEnabled: boolean;
  isScanning: boolean;
  devices: BluetoothDevice[];
  connectedDevice: BluetoothDevice | null;
  connectionStatus: ConnectionStatus;
  error: string | null;
}

const initialState: BluetoothState = {
  isEnabled: false,
  isScanning: false,
  devices: [],
  connectedDevice: null,
  connectionStatus: ConnectionStatus.DISCONNECTED,
  error: null,
};

const bluetoothSlice = createSlice({
  name: 'bluetooth',
  initialState,
  reducers: {
    setBluetoothEnabled: (state, action: PayloadAction<boolean>) => {
      state.isEnabled = action.payload;
    },
    
    setScanning: (state, action: PayloadAction<boolean>) => {
      state.isScanning = action.payload;
      if (action.payload) {
        state.devices = []; // 开始扫描时清空设备列表
        state.error = null;
      }
    },
    
    addDevice: (state, action: PayloadAction<BluetoothDevice>) => {
      const existingDevice = state.devices.find(device => device.id === action.payload.id);
      if (!existingDevice) {
        state.devices.push(action.payload);
      } else {
        // 更新现有设备信息（如RSSI）
        Object.assign(existingDevice, action.payload);
      }
    },
    
    clearDevices: (state) => {
      state.devices = [];
    },
    
    setConnectionStatus: (state, action: PayloadAction<ConnectionStatus>) => {
      state.connectionStatus = action.payload;
    },
    
    setConnectedDevice: (state, action: PayloadAction<BluetoothDevice | null>) => {
      state.connectedDevice = action.payload;
      
      // 更新设备列表中的连接状态
      state.devices.forEach(device => {
        device.isConnected = device.id === action.payload?.id;
      });
      
      if (action.payload) {
        state.connectionStatus = ConnectionStatus.CONNECTED;
      } else {
        state.connectionStatus = ConnectionStatus.DISCONNECTED;
      }
    },
    
    updateDeviceRSSI: (state, action: PayloadAction<{ deviceId: string; rssi: number }>) => {
      const device = state.devices.find(d => d.id === action.payload.deviceId);
      if (device) {
        device.rssi = action.payload.rssi;
      }
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    resetBluetoothState: () => initialState,
  },
});

export const {
  setBluetoothEnabled,
  setScanning,
  addDevice,
  clearDevices,
  setConnectionStatus,
  setConnectedDevice,
  updateDeviceRSSI,
  setError,
  clearError,
  resetBluetoothState,
} = bluetoothSlice.actions;

export default bluetoothSlice.reducer;