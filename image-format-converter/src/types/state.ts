import type { ImageFile, ConvertedImage, ConversionConfig } from './image';

export type AppState = 'idle' | 'uploading' | 'configuring' | 'converting' | 'completed' | 'error';

export interface State {
  status: AppState;
  images: ImageFile[];
  convertedImages: ConvertedImage[];
  config: ConversionConfig;
  progress: number;
  currentProcessing: number;
  error: string | null;
}

export type Action =
  | { type: 'SET_STATUS'; payload: AppState }
  | { type: 'ADD_IMAGES'; payload: ImageFile[] }
  | { type: 'REMOVE_IMAGE'; payload: string }
  | { type: 'CLEAR_IMAGES' }
  | { type: 'SET_CONFIG'; payload: Partial<ConversionConfig> }
  | { type: 'SET_CONVERTED_IMAGES'; payload: ConvertedImage[] }
  | { type: 'SET_PROGRESS'; payload: { progress: number; current: number } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

export const initialState: State = {
  status: 'idle',
  images: [],
  convertedImages: [],
  config: {
    format: 'png',
    quality: 90,
    maintainAspectRatio: true,
  },
  progress: 0,
  currentProcessing: 0,
  error: null,
};
