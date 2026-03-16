import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { State, Action, ImageFile, ConversionConfig, ConvertedImage } from '../types';
import { appReducer } from './appReducer';
import { initialState } from '../types';

interface AppContextType {
  state: State;
  dispatch: React.Dispatch<Action>;
  addImages: (images: ImageFile[]) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
  setConfig: (config: Partial<ConversionConfig>) => void;
  setConvertedImages: (images: ConvertedImage[]) => void;
  setProgress: (progress: number, current: number) => void;
  setStatus: (status: State['status']) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const addImages = useCallback((images: ImageFile[]) => {
    dispatch({ type: 'ADD_IMAGES', payload: images });
  }, []);

  const removeImage = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_IMAGE', payload: id });
  }, []);

  const clearImages = useCallback(() => {
    dispatch({ type: 'CLEAR_IMAGES' });
  }, []);

  const setConfig = useCallback((config: Partial<ConversionConfig>) => {
    dispatch({ type: 'SET_CONFIG', payload: config });
  }, []);

  const setConvertedImages = useCallback((images: ConvertedImage[]) => {
    dispatch({ type: 'SET_CONVERTED_IMAGES', payload: images });
  }, []);

  const setProgress = useCallback((progress: number, current: number) => {
    dispatch({ type: 'SET_PROGRESS', payload: { progress, current } });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setStatus = useCallback((status: State['status']) => {
    dispatch({ type: 'SET_STATUS', payload: status });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        addImages,
        removeImage,
        clearImages,
        setConfig,
        setConvertedImages,
        setProgress,
        setStatus,
        setError,
        reset,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
