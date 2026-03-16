/**
 * Video Frame Extractor - UploadArea Component
 * 视频上传区域组件，支持拖拽和点击上传
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileVideo, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import {
  validateVideoFile,
  getSupportedFormatsText,
  getMaxSizeText,
  type ValidationResult,
} from '../../utils/videoValidation';
import { extractVideoMetadata } from '../../utils/videoMetadata';
import { useAppActions, useAppState } from '../../context/AppContext';
import type { VideoInfo, AppError } from '../../types/state';

export interface UploadAreaProps {
  /** 自定义类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

type UploadState = 'idle' | 'dragover' | 'validating' | 'loading' | 'error';

export function UploadArea({ className = '', disabled = false }: UploadAreaProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef<number>(0);

  const appState = useAppState();
  const { loadVideo, videoLoaded, setError } = useAppActions();

  // 检查是否可以上传
  const canUpload = appState.status === 'idle' && !disabled;

  // 重置状态
  const resetState = useCallback(() => {
    setUploadState('idle');
    setValidationResult(null);
    setErrorMessage('');
    setLoadingProgress(0);
  }, []);

  // 处理文件选择
  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!canUpload) return;

      // 重置之前的状态
      setErrorMessage('');
      setValidationResult(null);

      // 1. 验证文件
      setUploadState('validating');
      const validation = validateVideoFile(file);
      setValidationResult(validation);

      if (!validation.valid) {
        setErrorMessage(validation.error || '文件验证失败');
        setUploadState('error');
        return;
      }

      // 2. 开始加载视频
      setUploadState('loading');
      setLoadingProgress(10);
      loadVideo(10, file);

      try {
        // 模拟进度更新
        const progressInterval = setInterval(() => {
          setLoadingProgress((prev) => {
            if (prev >= 80) {
              clearInterval(progressInterval);
              return prev;
            }
            const newProgress = prev + 10;
            loadVideo(newProgress);
            return newProgress;
          });
        }, 100);

        // 提取视频元数据
        const result = await extractVideoMetadata({ file, timeout: 60000 });

        clearInterval(progressInterval);

        if (!result.success) {
          setErrorMessage(result.error || '无法读取视频信息');
          setUploadState('error');
          const error: AppError = {
            code: 'VIDEO_LOAD_ERROR',
            message: result.error || '无法读取视频信息',
            recoverable: true,
          };
          setError(error);
          return;
        }

        // 3. 加载完成
        setLoadingProgress(100);
        loadVideo(100);

        // 短暂延迟后触发 videoLoaded
        setTimeout(() => {
          const videoInfo: VideoInfo = result.videoInfo!;
          videoLoaded(videoInfo, file);
        }, 200);
      } catch (err) {
        const message = err instanceof Error ? err.message : '处理视频时发生错误';
        setErrorMessage(message);
        setUploadState('error');
        const error: AppError = {
          code: 'VIDEO_PROCESS_ERROR',
          message,
          recoverable: true,
        };
        setError(error);
      }
    },
    [canUpload, loadVideo, videoLoaded, setError]
  );

  // 点击上传区域
  const handleClick = useCallback(() => {
    if (!canUpload) return;
    fileInputRef.current?.click();
  }, [canUpload]);

  // 文件输入变化
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      // 重置 input 以允许选择相同文件
      event.target.value = '';
    },
    [handleFileSelect]
  );

  // 拖拽事件处理
  const handleDragEnter = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (!canUpload) return;

      dragCounterRef.current++;
      if (event.dataTransfer.items.length > 0) {
        setUploadState('dragover');
      }
    },
    [canUpload]
  );

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setUploadState('idle');
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      dragCounterRef.current = 0;

      if (!canUpload) return;

      const file = event.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      } else {
        setUploadState('idle');
      }
    },
    [canUpload, handleFileSelect]
  );

  // 当应用状态重置时，重置上传状态
  useEffect(() => {
    if (appState.status === 'idle') {
      resetState();
    }
  }, [appState.status, resetState]);

  // 渲染上传区域内容
  const renderContent = () => {
    switch (uploadState) {
      case 'dragover':
        return (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary-600 dark:text-primary-400 animate-bounce" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-primary-700 dark:text-primary-300">
                松开鼠标上传视频
              </p>
            </div>
          </div>
        );

      case 'validating':
        return (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FileVideo className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">正在验证文件...</p>
          </div>
        );

      case 'loading':
        return (
          <div className="flex flex-col items-center gap-4 py-8 w-full max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <FileVideo className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="w-full">
              <p className="text-center text-gray-700 dark:text-gray-300 mb-2">
                正在加载视频信息...
              </p>
              <ProgressBar
                value={loadingProgress}
                showLabel
                animated
                size="md"
              />
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-center max-w-md">
              <p className="text-red-700 dark:text-red-300 font-medium mb-1">
                上传失败
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetState();
              }}
              className="mt-2 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              重试
            </button>
          </div>
        );

      case 'idle':
      default:
        return (
          <div className="flex flex-col items-center gap-4 py-8">
            <div
              className={`
                w-16 h-16 rounded-full flex items-center justify-center
                transition-colors duration-200
                ${canUpload
                  ? 'bg-gray-100 dark:bg-gray-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30'
                  : 'bg-gray-100 dark:bg-gray-800 opacity-50'
                }
              `}
            >
              <Upload
                className={`
                  w-8 h-8 transition-colors duration-200
                  ${canUpload
                    ? 'text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                    : 'text-gray-300 dark:text-gray-600'
                  }
                `}
              />
            </div>

            <div className="text-center">
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                {canUpload ? '拖拽视频文件到此处，或点击选择' : '请等待 FFmpeg 加载完成'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                支持格式: {getSupportedFormatsText()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getMaxSizeText()}
              </p>
            </div>

            {validationResult?.warning && (
              <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-700 dark:text-yellow-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{validationResult.warning}</span>
              </div>
            )}

            {validationResult?.valid && !validationResult.warning && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-700 dark:text-green-300">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>文件验证通过</span>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <Card
      className={`
        relative overflow-hidden cursor-pointer group
        transition-all duration-200
        ${uploadState === 'dragover'
          ? 'border-2 border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20'
          : uploadState === 'error'
            ? 'border-2 border-red-300 dark:border-red-700'
            : 'border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
        }
        ${!canUpload ? 'opacity-60 cursor-not-allowed' : ''}
        ${className}
      `}
      padding="none"
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="px-6">
        {renderContent()}
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.mp4,.avi,.mov,.mkv,.webm,.flv"
        onChange={handleInputChange}
        className="hidden"
        disabled={!canUpload}
      />
    </Card>
  );
}

export default UploadArea;
