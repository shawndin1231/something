/**
 * Video Frame Extractor - ConfigPanel Component
 * 配置面板容器组件
 */

import { useMemo, useCallback } from 'react';
import { Card, CardTitle } from '../ui/Card';
import { IntervalInput } from './IntervalInput';
import { FormatSelect, type ImageFormat } from './FormatSelect';
import { QualitySlider } from './QualitySlider';
import { SizeSelector, type SizeMode } from './SizeSelector';
import { StartButton } from './StartButton';
import { useAppState, useAppActions } from '../../context/AppContext';
import { isConfiguring, isExtracting, isFFmpegLoading } from '../../context/appReducer';
import type { ExtractConfig, VideoInfo } from '../../types/state';

/** 设置图标组件 */
function SettingsIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

/** 默认配置 */
const DEFAULT_CONFIG: ExtractConfig = {
  mode: 'interval',
  interval: 1,
  timestamps: [],
  format: 'png',
  quality: 90,
  maxWidth: 0,
  maxHeight: 0,
};

/** 默认视频信息 */
const DEFAULT_VIDEO_INFO: VideoInfo = {
  filename: '',
  duration: 100,
  width: 1920,
  height: 1080,
  size: 0,
  format: '',
};

/**
 * 配置面板组件
 * 整合所有配置选项，管理状态交互
 */
export interface ConfigPanelProps {
  /** 开始提取回调 */
  onStartExtract?: () => void;
}

export function ConfigPanel({ onStartExtract }: ConfigPanelProps) {
  const state = useAppState();
  const actions = useAppActions();

  // 状态判断
  const isConfiguringState = isConfiguring(state);
  const isExtractingState = isExtracting(state);
  const isLoadingFFmpeg = isFFmpegLoading(state);
  const hasVideo = isConfiguringState || isExtractingState;
  const isDisabled = !hasVideo || isExtractingState;

  // 获取当前配置 - 使用类型断言
  const config: ExtractConfig = useMemo(() => {
    if (isConfiguringState) {
      return (state as { config: ExtractConfig }).config;
    }
    if (isExtractingState) {
      return (state as { config: ExtractConfig }).config;
    }
    return DEFAULT_CONFIG;
  }, [state, isConfiguringState, isExtractingState]);

  // 获取视频信息 - 使用类型断言
  const videoInfo: VideoInfo | null = useMemo(() => {
    if (isConfiguringState || isExtractingState) {
      return (state as { video: VideoInfo }).video;
    }
    return null;
  }, [state, isConfiguringState, isExtractingState]);

  // 计算预估帧数
  const estimatedFrames = useMemo(() => {
    if (!videoInfo || config.interval <= 0) return 0;
    return Math.floor(videoInfo.duration / config.interval);
  }, [videoInfo, config.interval]);

  // 配置验证
  const isConfigValid = useMemo(() => {
    if (!videoInfo) return false;
    if (config.interval < 0.1) return false;
    if (config.interval > videoInfo.duration) return false;
    return true;
  }, [videoInfo, config.interval]);

  // 更新配置的处理函数
  const handleIntervalChange = useCallback(
    (interval: number) => {
      actions.updateConfig({ interval });
    },
    [actions]
  );

  const handleFormatChange = useCallback(
    (format: ImageFormat) => {
      actions.updateConfig({ format });
    },
    [actions]
  );

  const handleQualityChange = useCallback(
    (quality: number) => {
      actions.updateConfig({ quality });
    },
    [actions]
  );

  // 尺寸相关状态和处理
  const sizeMode: SizeMode = useMemo(() => {
    if (config.maxWidth > 0 && config.maxHeight === 0) return 'custom-width';
    if (config.maxHeight > 0 && config.maxWidth === 0) return 'custom-height';
    return 'original';
  }, [config.maxWidth, config.maxHeight]);

  const handleSizeModeChange = useCallback(
    (mode: SizeMode) => {
      const currentVideoInfo = videoInfo || DEFAULT_VIDEO_INFO;
      switch (mode) {
        case 'original':
          actions.updateConfig({ maxWidth: 0, maxHeight: 0 });
          break;
        case 'custom-width':
          actions.updateConfig({ maxWidth: currentVideoInfo.width, maxHeight: 0 });
          break;
        case 'custom-height':
          actions.updateConfig({ maxWidth: 0, maxHeight: currentVideoInfo.height });
          break;
      }
    },
    [actions, videoInfo]
  );

  const handleWidthChange = useCallback(
    (width: number) => {
      actions.updateConfig({ maxWidth: width });
    },
    [actions]
  );

  const handleHeightChange = useCallback(
    (height: number) => {
      actions.updateConfig({ maxHeight: height });
    },
    [actions]
  );

  // 开始提取
  const handleStartExtract = useCallback(() => {
    if (isConfigValid && estimatedFrames > 0) {
      actions.startExtract(estimatedFrames);
      onStartExtract?.();
    }
  }, [actions, isConfigValid, estimatedFrames, onStartExtract]);

  // 获取视频时长
  const videoDuration = videoInfo?.duration || 100;

  return (
    <Card
      padding="lg"
      className="h-full"
      header={
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <SettingsIcon />
          <CardTitle>提取配置</CardTitle>
        </div>
      }
    >
      <div className={`space-y-6 ${isDisabled ? 'opacity-60 pointer-events-none' : ''}`}>
        {/* 时间间隔 */}
        <IntervalInput
          value={config.interval}
          maxDuration={videoDuration}
          disabled={isDisabled}
          onChange={handleIntervalChange}
        />

        {/* 输出格式 */}
        <FormatSelect
          value={config.format}
          disabled={isDisabled}
          onChange={handleFormatChange}
        />

        {/* 图片质量 */}
        <QualitySlider
          value={config.quality}
          format={config.format}
          disabled={isDisabled}
          onChange={handleQualityChange}
        />

        {/* 输出尺寸 */}
        {videoInfo && (
          <SizeSelector
            mode={sizeMode}
            customWidth={config.maxWidth}
            customHeight={config.maxHeight}
            originalWidth={videoInfo.width}
            originalHeight={videoInfo.height}
            disabled={isDisabled}
            onModeChange={handleSizeModeChange}
            onWidthChange={handleWidthChange}
            onHeightChange={handleHeightChange}
          />
        )}

        {/* 分隔线 */}
        <div className="border-t border-gray-200 dark:border-gray-700" />

        {/* 开始按钮 */}
        <StartButton
          hasVideo={hasVideo}
          isFFmpegLoading={isLoadingFFmpeg}
          isExtracting={isExtractingState}
          isConfigValid={isConfigValid}
          onClick={handleStartExtract}
        />
      </div>
    </Card>
  );
}

export default ConfigPanel;
