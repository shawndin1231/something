import type { ImageFormat, ImageFile, ConvertedImage, ConversionConfig } from '../types';
import { FORMAT_MIME_TYPES } from '../types';

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function getOutputDimensions(
  originalWidth: number,
  originalHeight: number,
  config: ConversionConfig
): { width: number; height: number } {
  if (!config.width && !config.height) {
    return { width: originalWidth, height: originalHeight };
  }

  if (config.maintainAspectRatio) {
    if (config.width && !config.height) {
      const ratio = config.width / originalWidth;
      return { width: config.width, height: Math.round(originalHeight * ratio) };
    }
    if (!config.width && config.height) {
      const ratio = config.height / originalHeight;
      return { width: Math.round(originalWidth * ratio), height: config.height };
    }
    if (config.width && config.height) {
      const originalRatio = originalWidth / originalHeight;
      const targetRatio = config.width / config.height;
      if (originalRatio > targetRatio) {
        const ratio = config.width / originalWidth;
        return { width: config.width, height: Math.round(originalHeight * ratio) };
      } else {
        const ratio = config.height / originalHeight;
        return { width: Math.round(originalWidth * ratio), height: config.height };
      }
    }
  }

  return {
    width: config.width || originalWidth,
    height: config.height || originalHeight,
  };
}

export async function convertImage(
  imageFile: ImageFile,
  config: ConversionConfig,
  onProgress?: (progress: number) => void
): Promise<ConvertedImage> {
  onProgress?.(0);

  const img = await loadImage(imageFile.file);
  onProgress?.(20);

  const { width, height } = getOutputDimensions(
    imageFile.width,
    imageFile.height,
    config
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(img, 0, 0, width, height);
  onProgress?.(60);

  const mimeType = FORMAT_MIME_TYPES[config.format];
  const quality = config.format === 'png' ? undefined : config.quality / 100;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) {
          resolve(b);
        } else {
          reject(new Error('Failed to convert image'));
        }
      },
      mimeType,
      quality
    );
  });

  onProgress?.(100);

  URL.revokeObjectURL(img.src);

  return {
    ...imageFile,
    convertedBlob: blob,
    convertedFormat: config.format,
    convertedSize: blob.size,
    convertedUrl: URL.createObjectURL(blob),
    convertedWidth: width,
    convertedHeight: height,
  };
}

export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const img = await loadImage(file);
  const dimensions = { width: img.naturalWidth, height: img.naturalHeight };
  URL.revokeObjectURL(img.src);
  return dimensions;
}

export function getFileExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ext;
}

export function isValidImageFormat(extension: string): boolean {
  const validFormats = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'tif', 'svg'];
  return validFormats.includes(extension);
}

export function normalizeFormat(format: string): ImageFormat | 'tiff' | 'svg' {
  const formatMap: Record<string, ImageFormat | 'tiff' | 'svg'> = {
    jpg: 'jpeg',
    jpeg: 'jpeg',
    png: 'png',
    webp: 'webp',
    gif: 'gif',
    bmp: 'bmp',
    tiff: 'tiff',
    tif: 'tiff',
    svg: 'svg',
  };
  return formatMap[format.toLowerCase()] || 'png';
}

export function canConvertTo(format: ImageFormat | 'tiff' | 'svg'): format is ImageFormat {
  return format !== 'tiff' && format !== 'svg';
}
