import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DeviceMode } from '../../services/BluetoothService';

export type PressureUnit = 'BAR' | 'PSI';

interface DeviceState {
  currentMode: DeviceMode | null;
  currentSpeed: number;
  currentVoltage: number;
  currentPressure: number; // BAR单位
  pressureUnit: PressureUnit;
  isConnected: boolean;
  lastUpdate: number;
  isControlling: boolean;
  error: string | null;
}

const initialState: DeviceState = {
  currentMode: null,
  currentSpeed: 0,
  currentVoltage: 0,
  currentPressure: 0,
  pressureUnit: 'BAR',
  isConnected: false,
  lastUpdate: 0,
  isControlling: false,
  error: null,
};

const deviceSlice = createSlice({
  name: 'device',
  initialState,
  reducers: {
    setCurrentMode: (state, action: PayloadAction<DeviceMode>) => {
      state.currentMode = action.payload;
      state.lastUpdate = Date.now();
      state.error = null;
    },
    
    setCurrentSpeed: (state, action: PayloadAction<number>) => {
      state.currentSpeed = action.payload;
      state.lastUpdate = Date.now();
    },
    
    setCurrentVoltage: (state, action: PayloadAction<number>) => {
      state.currentVoltage = action.payload;
      state.lastUpdate = Date.now();
    },
    
    setCurrentPressure: (state, action: PayloadAction<number>) => {
      state.currentPressure = action.payload;
      state.lastUpdate = Date.now();
    },
    
    setPressureUnit: (state, action: PayloadAction<PressureUnit>) => {
      state.pressureUnit = action.payload;
    },
    
    togglePressureUnit: (state) => {
      state.pressureUnit = state.pressureUnit === 'BAR' ? 'PSI' : 'BAR';
    },
    
    setDeviceConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      if (!action.payload) {
        // 设备断开时重置状态
        state.currentMode = null;
        state.currentSpeed = 0;
        state.currentVoltage = 0;
        state.currentPressure = 0;
        state.isControlling = false;
      }
    },
    
    setControlling: (state, action: PayloadAction<boolean>) => {
      state.isControlling = action.payload;
    },
    
    setDeviceError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isControlling = false;
    },
    
    clearDeviceError: (state) => {
      state.error = null;
    },
    
    updateLastUpdate: (state) => {
      state.lastUpdate = Date.now();
    },
    
    resetDeviceState: () => initialState,
  },
});

export const {
  setCurrentMode,
  setCurrentSpeed,
  setCurrentVoltage,
  setCurrentPressure,
  setPressureUnit,
  togglePressureUnit,
  setDeviceConnected,
  setControlling,
  setDeviceError,
  clearDeviceError,
  updateLastUpdate,
  resetDeviceState,
} = deviceSlice.actions;

export default deviceSlice.reducer;