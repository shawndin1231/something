/**
 * Video Frame Extractor - App Context
 * 提供全局状态管理的 React Context
 */

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
  type Dispatch,
} from 'react';
import type { AppState, VideoInfo, ExtractConfig, Progress, AppError, Frame } from '../types/state';
import type { AppAction } from '../types/actions';
import { appReducer } from './appReducer';
import { INITIAL_STATE } from '../types/state';

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);

  const value: AppContextValue = {
    state,
    dispatch,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState(): AppState {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context.state;
}

export function useAppDispatch(): Dispatch<AppAction> {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppDispatch must be used within an AppProvider');
  }
  return context.dispatch;
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export function useAppActions() {
  const dispatch = useAppDispatch();

  return {
    loadFFmpeg: useCallback(() => {
      dispatch({ type: 'LOAD_FFMPEG' });
    }, [dispatch]),

    ffmpegReady: useCallback(() => {
      dispatch({ type: 'FFMPEG_READY' });
    }, [dispatch]),

    loadVideo: useCallback(
      (progress: number, videoFile?: File) => {
        dispatch({ type: 'LOAD_VIDEO', payload: { progress, videoFile } });
      },
      [dispatch]
    ),

    videoLoaded: useCallback(
      (video: VideoInfo, videoFile?: File) => {
        dispatch({ type: 'VIDEO_LOADED', payload: { video, videoFile } });
      },
      [dispatch]
    ),

    updateConfig: useCallback(
      (config: Partial<ExtractConfig>) => {
        dispatch({ type: 'UPDATE_CONFIG', payload: { config } });
      },
      [dispatch]
    ),

    startExtract: useCallback(
      (totalFrames: number) => {
        dispatch({ type: 'START_EXTRACT', payload: { totalFrames } });
      },
      [dispatch]
    ),

    updateProgress: useCallback(
      (progress: Progress) => {
        dispatch({ type: 'UPDATE_PROGRESS', payload: { progress } });
      },
      [dispatch]
    ),

    complete: useCallback(
      (frames: Frame[]) => {
        dispatch({ type: 'COMPLETE', payload: { frames } });
      },
      [dispatch]
    ),

    setError: useCallback(
      (error: AppError) => {
        dispatch({ type: 'ERROR', payload: { error } });
      },
      [dispatch]
    ),

    reset: useCallback(() => {
      dispatch({ type: 'RESET' });
    }, [dispatch]),

    deleteFrames: useCallback(
      (frameIds: string[]) => {
        dispatch({ type: 'DELETE_FRAMES', payload: { frameIds } });
      },
      [dispatch]
    ),
  };
}

export { AppContext };
