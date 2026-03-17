/**
 * FFmpeg Service
 * 管理 FFmpeg.wasm 实例，提供多 CDN 加载策略和错误处理
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const CDN_SOURCES = [
  {
    name: 'unpkg',
    coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
    wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
  },
  {
    name: 'jsdelivr',
    coreURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
    wasmURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
  },
] as const;

export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type ProgressCallback = (progress: number, stage: string) => void;

export interface FFmpegLoadErrorInfo {
  message: string;
  cdn?: string;
  retryCount?: number;
}

export function createFFmpegLoadError(info: FFmpegLoadErrorInfo): Error & FFmpegLoadErrorInfo {
  const error = new Error(info.message) as Error & FFmpegLoadErrorInfo;
  error.name = 'FFmpegLoadError';
  error.cdn = info.cdn;
  error.retryCount = info.retryCount;
  return error;
}

class FFmpegService {
  private ffmpeg: FFmpeg | null = null;
  private loadStatus: LoadStatus = 'idle';
  private loadProgress: number = 0;
  private currentCDN: string | null = null;
  private retryCount: number = 0;

  getFFmpeg(): FFmpeg | null {
    return this.ffmpeg;
  }

  getStatus(): LoadStatus {
    return this.loadStatus;
  }

  getProgress(): number {
    return this.loadProgress;
  }

  isLoaded(): boolean {
    return this.loadStatus === 'loaded' && this.ffmpeg?.loaded === true;
  }

  async load(onProgress?: ProgressCallback): Promise<FFmpeg> {
    if (this.isLoaded() && this.ffmpeg) {
      return this.ffmpeg;
    }

    if (this.loadStatus === 'loading') {
      return this.waitForLoad();
    }

    this.loadStatus = 'loading';
    this.loadProgress = 0;
    this.retryCount = 0;

    let lastError: Error | null = null;

    for (const cdn of CDN_SOURCES) {
      try {
        this.currentCDN = cdn.name;
        onProgress?.(0, `Loading from ${cdn.name}...`);

        const ffmpeg = await this.loadFromCDN(cdn, onProgress);
        this.ffmpeg = ffmpeg;
        this.loadStatus = 'loaded';
        this.loadProgress = 100;
        onProgress?.(100, 'FFmpeg loaded successfully');

        return ffmpeg;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`Failed to load from ${cdn.name}:`, lastError.message);
        this.retryCount++;

        if (this.retryCount < CDN_SOURCES.length) {
          onProgress?.(0, `Retrying with another CDN...`);
        }
      }
    }

    this.loadStatus = 'error';
    throw createFFmpegLoadError({
      message: `Failed to load FFmpeg from all CDN sources: ${lastError?.message}`,
      cdn: this.currentCDN ?? undefined,
      retryCount: this.retryCount,
    });
  }

  private async loadFromCDN(
    cdn: (typeof CDN_SOURCES)[number],
    onProgress?: ProgressCallback
  ): Promise<FFmpeg> {
    const ffmpeg = new FFmpeg();

    ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    const progressHandler = ({ progress }: { progress: number }) => {
      const percent = Math.round(progress * 100);
      this.loadProgress = Math.max(this.loadProgress, percent);
      onProgress?.(percent, 'Processing...');
    };

    ffmpeg.on('progress', progressHandler);

    try {
      onProgress?.(10, 'Downloading FFmpeg core...');

      const coreBlobURL = await toBlobURL(cdn.coreURL, 'text/javascript');
      onProgress?.(40, 'Downloading FFmpeg WASM...');

      const wasmBlobURL = await toBlobURL(cdn.wasmURL, 'application/wasm');
      onProgress?.(80, 'Initializing FFmpeg...');

      await ffmpeg.load({
        coreURL: coreBlobURL,
        wasmURL: wasmBlobURL,
      });

      ffmpeg.off('progress', progressHandler);

      onProgress?.(100, 'FFmpeg initialized');

      return ffmpeg;
    } catch (error) {
      ffmpeg.off('progress', progressHandler);
      throw createFFmpegLoadError({
        message: `Failed to load from ${cdn.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        cdn: cdn.name,
      });
    }
  }

  private async waitForLoad(): Promise<FFmpeg> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (this.loadStatus === 'loaded' && this.ffmpeg) {
          clearInterval(checkInterval);
          resolve(this.ffmpeg);
        } else if (this.loadStatus === 'error') {
          clearInterval(checkInterval);
          reject(createFFmpegLoadError({ message: 'FFmpeg loading failed' }));
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        reject(createFFmpegLoadError({ message: 'FFmpeg loading timeout' }));
      }, 60000);
    });
  }

  async writeFile(filename: string, data: ArrayBuffer | Uint8Array): Promise<void> {
    if (!this.ffmpeg || !this.isLoaded()) {
      throw createFFmpegLoadError({ message: 'FFmpeg not loaded' });
    }

    const uint8Array = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
    await this.ffmpeg.writeFile(filename, uint8Array);
  }

  async readFile(filename: string): Promise<Uint8Array> {
    if (!this.ffmpeg || !this.isLoaded()) {
      throw createFFmpegLoadError({ message: 'FFmpeg not loaded' });
    }

    const data = await this.ffmpeg.readFile(filename);
    if (typeof data === 'string') {
      return new TextEncoder().encode(data);
    }
    return data;
  }

  async deleteFile(filename: string): Promise<void> {
    if (!this.ffmpeg || !this.isLoaded()) {
      throw createFFmpegLoadError({ message: 'FFmpeg not loaded' });
    }

    try {
      await this.ffmpeg.deleteFile(filename);
    } catch {
      // 文件可能不存在，忽略错误
    }
  }

  async exec(args: string[], onProgress?: (progress: number) => void): Promise<void> {
    if (!this.ffmpeg || !this.isLoaded()) {
      throw createFFmpegLoadError({ message: 'FFmpeg not loaded' });
    }

    const progressHandler = ({ progress }: { progress: number }) => {
      onProgress?.(Math.round(progress * 100));
    };

    this.ffmpeg.on('progress', progressHandler);

    try {
      await this.ffmpeg.exec(args);
    } finally {
      this.ffmpeg.off('progress', progressHandler);
    }
  }

  async listFiles(dirname: string = '/'): Promise<string[]> {
    if (!this.ffmpeg || !this.isLoaded()) {
      throw createFFmpegLoadError({ message: 'FFmpeg not loaded' });
    }

    try {
      const files = await this.ffmpeg.listDir(dirname);
      return files.map((f) => f.name);
    } catch {
      return [];
    }
  }

  terminate(): void {
    if (this.ffmpeg) {
      try {
        this.ffmpeg.terminate();
      } catch {
        // 忽略终止错误
      }
      this.ffmpeg = null;
      this.loadStatus = 'idle';
      this.loadProgress = 0;
      this.currentCDN = null;
    }
  }
}

export const ffmpegService = new FFmpegService();

export { fetchFile, toBlobURL };
