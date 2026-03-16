export type ImageFormat = 'png' | 'jpeg' | 'webp' | 'gif' | 'bmp';

export type InputFormat = ImageFormat | 'tiff' | 'svg';

export interface ImageFile {
  id: string;
  file: File;
  name: string;
  originalFormat: InputFormat;
  size: number;
  previewUrl: string;
  width: number;
  height: number;
}

export interface ConvertedImage extends ImageFile {
  convertedBlob: Blob;
  convertedFormat: ImageFormat;
  convertedSize: number;
  convertedUrl: string;
  convertedWidth: number;
  convertedHeight: number;
}

export interface ConversionConfig {
  format: ImageFormat;
  quality: number;
  width?: number;
  height?: number;
  maintainAspectRatio: boolean;
}

export const SUPPORTED_INPUT_FORMATS: InputFormat[] = [
  'png', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'svg'
];

export const SUPPORTED_OUTPUT_FORMATS: ImageFormat[] = [
  'png', 'jpeg', 'webp', 'gif', 'bmp'
];

export const FORMAT_MIME_TYPES: Record<ImageFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
};

export const FORMAT_EXTENSIONS: Record<ImageFormat, string> = {
  png: '.png',
  jpeg: '.jpg',
  webp: '.webp',
  gif: '.gif',
  bmp: '.bmp',
};

export const MAX_FILE_SIZE = 20 * 1024 * 1024;
export const MAX_TOTAL_SIZE = 200 * 1024 * 1024;
export const MAX_FILE_COUNT = 100;
