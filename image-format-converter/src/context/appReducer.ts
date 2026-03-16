import type { State, Action } from '../types';
import { initialState } from '../types';

export function appReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.payload, error: null };

    case 'ADD_IMAGES':
      return { ...state, images: [...state.images, ...action.payload], status: 'configuring' };

    case 'REMOVE_IMAGE':
      const filteredImages = state.images.filter((img) => img.id !== action.payload);
      return {
        ...state,
        images: filteredImages,
        status: filteredImages.length === 0 ? 'idle' : state.status,
      };

    case 'CLEAR_IMAGES':
      return { ...state, images: [], convertedImages: [], status: 'idle' };

    case 'SET_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } };

    case 'SET_CONVERTED_IMAGES':
      return { ...state, convertedImages: action.payload, status: 'completed' };

    case 'SET_PROGRESS':
      return {
        ...state,
        progress: action.payload.progress,
        currentProcessing: action.payload.current,
      };

    case 'SET_ERROR':
      return { ...state, error: action.payload, status: action.payload ? 'error' : state.status };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}
