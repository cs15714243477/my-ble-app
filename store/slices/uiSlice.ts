import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Theme = 'light' | 'dark';

interface UIState {
  theme: Theme;
  isLoading: boolean;
  error: string | null;
  showDeviceList: boolean;
  showSettings: boolean;
}

const initialState: UIState = {
  theme: 'light',
  isLoading: false,
  error: null,
  showDeviceList: false,
  showSettings: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setUIError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearUIError: (state) => {
      state.error = null;
    },
    
    setShowDeviceList: (state, action: PayloadAction<boolean>) => {
      state.showDeviceList = action.payload;
    },
    
    setShowSettings: (state, action: PayloadAction<boolean>) => {
      state.showSettings = action.payload;
    },
    
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    
    resetUIState: () => initialState,
  },
});

export const {
  setTheme,
  setLoading,
  setUIError,
  clearUIError,
  setShowDeviceList,
  setShowSettings,
  toggleTheme,
  resetUIState,
} = uiSlice.actions;

export default uiSlice.reducer;