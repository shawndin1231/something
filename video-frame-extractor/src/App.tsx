/**
 * Video Frame Extractor - App Component
 * 应用程序主组件
 */

import { useState, useEffect, useCallback, useRef, type ErrorInfo } from 'react';
import { AppProvider, useAppState, useAppActions, useAppDispatch } from './context';
import { Header, MainLayout } from './components/layout';
import { ErrorBoundary } from './components/error';
import { ToastProvider, ToastContainer } from './components/toast';
import { MemoryWarningHandler } from './components/memory/MemoryWarningHandler';
import { SkipLink } from './components/accessibility';
import { classifyError, formatErrorForLog, shouldReportError } from './utils';
import { ffmpegService } from './services/ffmpegService';
import { UploadArea, VideoInfo } from './components/upload';
import { ConfigPanel } from './components/config';
import { ExtractionProgress, FFmpegLoadingOverlay } from './components/progress';
import { ThumbnailGrid } from './components/thumbnail';
import { useToast } from './components/toast';
import type { Frame, AppError } from './types/state';

const THEME_STORAGE_KEY = 'video-frame-extractor-theme';

function getInitialTheme(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored !== null) {
      return stored === 'dark';
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
  }
  return false;
}

function downloadFrame(frame: Frame): void {
  const link = document.createElement('a');
  link.href = frame.blobUrl;
  link.download = frame.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function MainContent() {
  const state = useAppState();
  const actions = useAppActions();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const ffmpegLoadStarted = useRef(false);
  const cancelledRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const handleCancelExtraction = useCallback(() => {
    cancelledRef.current = true;
    if (cleanupRef.current) {
      cleanupRef.current();
    }
    dispatch({ type: 'RESET' });
    toast.info('已取消提取');
  }, [dispatch, toast]);

  useEffect(() => {
    if (ffmpegLoadStarted.current) return;
    ffmpegLoadStarted.current = true;

    const loadFFmpegEngine = async () => {
      try {
        actions.loadFFmpeg();
        await ffmpegService.load((progress) => {
          dispatch({ type: 'LOAD_FFMPEG_PROGRESS', payload: { progress } });
        });
        actions.ffmpegReady();
        toast.success('视频处理引擎加载完成');
      } catch (error) {
        const appError: AppError = {
          code: 'FFMPEG_LOAD_ERROR',
          message: error instanceof Error ? error.message : 'FFmpeg 加载失败',
          recoverable: true,
        };
        actions.setError(appError);
        toast.error('视频处理引擎加载失败，请刷新页面重试');
      }
    };

    loadFFmpegEngine();
  }, [actions, dispatch, toast]);

  const handleStartExtraction = useCallback(async () => {
    if (state.status !== 'configuring') return;

    const { video, config, videoFile } = state;
    const ffmpeg = ffmpegService.getFFmpeg();

    if (!ffmpeg || !ffmpegService.isLoaded()) {
      toast.error('FFmpeg 未加载完成');
      return;
    }

    if (!videoFile) {
      toast.error('视频文件不存在，请重新上传');
      return;
    }

    cancelledRef.current = false;
    const totalFrames = Math.floor(video.duration / config.interval);
    actions.startExtract(totalFrames);

    const inputFileName = 'input' + getExtension(video.filename);
    const outputFormat = config.format;
    const ffmpegFormat = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
    const outputPattern = `/frame_%05d.${ffmpegFormat}`;

    cleanupRef.current = async () => {
      try {
        await ffmpegService.deleteFile(inputFileName);
        const files = await ffmpegService.listFiles('/');
        for (const file of files) {
          if (file.startsWith('frame_') && file.endsWith(`.${ffmpegFormat}`)) {
            await ffmpegService.deleteFile('/' + file);
          }
        }
      } catch {
        // ignore
      }
    };

    try {
      const arrayBuffer = await videoFile.arrayBuffer();
      await ffmpegService.writeFile(inputFileName, new Uint8Array(arrayBuffer));

      const fps = 1 / config.interval;
      
      const filterParts: string[] = [`fps=${fps}`];
      if (config.maxWidth > 0 || config.maxHeight > 0) {
        filterParts.push(`scale=${config.maxWidth > 0 ? config.maxWidth : -1}:${config.maxHeight > 0 ? config.maxHeight : -1}:flags=fast_bilinear`);
      }
      const vfFilter = filterParts.join(',');

      const args: string[] = [
        '-i', inputFileName,
        '-threads', '0',
        '-an',
        '-dn',
        '-vf', vfFilter,
        '-vsync', 'vfr',
      ];

      if (outputFormat === 'png') {
        args.push('-compression_level', '0');
      } else if (outputFormat === 'jpeg') {
        const quality = Math.round((100 - config.quality) * 31 / 100);
        args.push('-q:v', quality.toString());
      } else if (outputFormat === 'webp') {
        args.push('-quality', config.quality.toString());
        args.push('-compression_level', '0');
      }

      args.push('-y', outputPattern);

      await ffmpegService.exec(args, (progress) => {
        if (cancelledRef.current) return;
        const estimatedFrames = Math.round(progress * totalFrames / 100);
        actions.updateProgress({
          current: Math.min(estimatedFrames, totalFrames - 1),
          total: totalFrames,
          percent: Math.min(progress, 99),
          estimatedTime: 0,
        });
      });

      if (cancelledRef.current) {
        const files = await ffmpegService.listFiles('/');
        for (const file of files) {
          if (file.startsWith('frame_') && file.endsWith(`.${ffmpegFormat}`)) {
            await ffmpegService.deleteFile('/' + file);
          }
        }
        await ffmpegService.deleteFile(inputFileName);
        return;
      }

      const frames: Frame[] = [];
      const files = await ffmpegService.listFiles('/');
      console.log('FFmpeg files:', files);
      const frameFiles = files
        .filter(f => f.startsWith('frame_') && f.endsWith(`.${ffmpegFormat}`))
        .sort();

      console.log('Frame files found:', frameFiles);

      const BATCH_SIZE = 16;
      const totalFrameFiles = frameFiles.length;

      for (let batchStart = 0; batchStart < totalFrameFiles; batchStart += BATCH_SIZE) {
        if (cancelledRef.current) {
          frames.forEach(f => URL.revokeObjectURL(f.blobUrl));
          for (const file of frameFiles) {
            await ffmpegService.deleteFile('/' + file);
          }
          await ffmpegService.deleteFile(inputFileName);
          return;
        }

        const batchEnd = Math.min(batchStart + BATCH_SIZE, totalFrameFiles);
        const batchFiles = frameFiles.slice(batchStart, batchEnd);

        const batchResults = await Promise.all(
          batchFiles.map(async (file, batchIndex) => {
            const globalIndex = batchStart + batchIndex;
            const data = await ffmpegService.readFile('/' + file);
            const blob = new Blob([new Uint8Array(data)], { type: `image/${outputFormat}` });
            const blobUrl = URL.createObjectURL(blob);
            const timestamp = globalIndex * config.interval;

            return {
              frame: {
                id: `frame-${globalIndex}`,
                filename: file,
                timestamp,
                blobUrl,
                size: data.length,
                width: config.maxWidth || video.width,
                height: config.maxHeight || video.height,
              } as Frame,
              file,
            };
          })
        );

        for (const { frame, file } of batchResults) {
          frames.push(frame);
          await ffmpegService.deleteFile('/' + file);
        }

        actions.updateProgress({
          current: batchEnd,
          total: totalFrames,
          percent: Math.round((batchEnd / totalFrames) * 100),
          estimatedTime: 0,
        });
      }

      await ffmpegService.deleteFile(inputFileName);
      cleanupRef.current = null;

      console.log('Total frames extracted:', frames.length);

      if (!cancelledRef.current) {
        if (frames.length === 0) {
          toast.error('未能提取到任何帧，请检查视频文件和配置');
          dispatch({ type: 'RESET' });
        } else {
          actions.complete(frames);
          toast.success(`成功提取 ${frames.length} 帧`);
        }
      }
    } catch (error) {
      if (cancelledRef.current) return;
      
      const appError: AppError = {
        code: 'EXTRACTION_ERROR',
        message: error instanceof Error ? error.message : '提取失败',
        recoverable: true,
      };
      actions.setError(appError);
      toast.error('视频帧提取失败');
    }
  }, [state, actions, toast]);

  const handleDeleteFrames = useCallback((frameIds: string[]) => {
    if (state.status === 'completed') {
      frameIds.forEach(id => {
        const frame = state.frames.find(f => f.id === id);
        if (frame) {
          URL.revokeObjectURL(frame.blobUrl);
        }
      });
      dispatch({ type: 'DELETE_FRAMES', payload: { frameIds } });
    }
  }, [state, dispatch]);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  const renderContent = () => {
    switch (state.status) {
      case 'idle':
        return (
          <div className="max-w-2xl mx-auto">
            <UploadArea />
          </div>
        );

      case 'ffmpeg_loading':
        return (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">
              正在初始化视频处理引擎...
            </p>
          </div>
        );

      case 'video_loading':
        return (
          <div className="max-w-md mx-auto">
            <UploadArea />
            <div className="mt-4 text-center">
              <p className="text-gray-500 dark:text-gray-400">正在加载视频...</p>
            </div>
          </div>
        );

      case 'configuring':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <VideoInfo video={state.video} />
              <UploadArea />
            </div>
            <div className="lg:col-span-1">
              <ConfigPanel onStartExtract={handleStartExtraction} />
            </div>
          </div>
        );

      case 'extracting':
        return <ExtractionProgress onCancel={handleCancelExtraction} />;

      case 'completed':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                提取完成 ({state.frames.length} 帧)
              </h2>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                提取新视频
              </button>
            </div>
            <ThumbnailGrid
              frames={state.frames}
              onDeleteFrames={handleDeleteFrames}
              onDownloadFrame={downloadFrame}
            />
          </div>
        );

      case 'error':
        return (
          <div className="max-w-md mx-auto text-center py-12">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              发生错误
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {state.error.message}
            </p>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              重试
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main id="main-content" className="flex-1">
      {renderContent()}
    </main>
  );
}

function getExtension(filename: string): string {
  const match = filename.match(/\.[^.]+$/);
  return match ? match[0] : '.mp4';
}

function AppContent() {
  const [isDark, setIsDark] = useState(getInitialTheme);

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleToggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <SkipLink targetId="main-content" />
      <Header isDark={isDark} onToggleTheme={handleToggleTheme} />
      <MainLayout>
        <MainContent />
      </MainLayout>
      <FFmpegLoadingOverlay />
    </div>
  );
}

function App() {
  const handleBoundaryError = useCallback((error: Error, errorInfo: ErrorInfo) => {
    const classifiedError = classifyError(error);
    const formattedError = formatErrorForLog(classifiedError);
    console.error('[App] Uncaught error:', formattedError);
    console.error('[App] Component stack:', errorInfo.componentStack);

    if (shouldReportError(classifiedError)) {
      // TODO: 发送到错误监控服务
    }
  }, []);

  const handleBoundaryRetry = useCallback(() => {
    console.log('[App] Retrying after error...');
  }, []);

  const handleBoundaryReset = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <ErrorBoundary
      onError={handleBoundaryError}
      onRetry={handleBoundaryRetry}
      onReset={handleBoundaryReset}
    >
      <ToastProvider maxToasts={5}>
        <AppProvider>
          <MemoryWarningHandler />
          <AppContent />
          <ToastContainer />
        </AppProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
