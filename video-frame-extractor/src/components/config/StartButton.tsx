/**
 * Video Frame Extractor - StartButton Component
 * 开始提取按钮组件
 */

import { useMemo } from 'react';
import { Button } from '../ui/Button';

export interface StartButtonProps {
  /** 是否有视频加载 */
  hasVideo: boolean;
  /** 是否正在加载 FFmpeg */
  isFFmpegLoading: boolean;
  /** 是否正在提取 */
  isExtracting: boolean;
  /** 配置是否有效 */
  isConfigValid: boolean;
  /** 点击回调 */
  onClick: () => void;
}

/**
 * 开始提取按钮组件
 * 显示不同状态：禁用、加载中、可点击
 */
export function StartButton({
  hasVideo,
  isFFmpegLoading,
  isExtracting,
  isConfigValid,
  onClick,
}: StartButtonProps) {
  // 按钮状态计算
  const buttonState = useMemo(() => {
    if (!hasVideo) {
      return {
        disabled: true,
        text: '请先选择视频',
        icon: null,
      };
    }
    if (isFFmpegLoading) {
      return {
        disabled: true,
        text: '正在初始化 FFmpeg...',
        icon: 'loading',
      };
    }
    if (isExtracting) {
      return {
        disabled: true,
        text: '正在提取...',
        icon: 'loading',
      };
    }
    if (!isConfigValid) {
      return {
        disabled: true,
        text: '请检查配置',
        icon: null,
      };
    }
    return {
      disabled: false,
      text: '开始提取',
      icon: 'play',
    };
  }, [hasVideo, isFFmpegLoading, isExtracting, isConfigValid]);

  // 播放图标
  const PlayIcon = (
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
        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  return (
    <div className="space-y-3">
      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={buttonState.disabled}
        isLoading={buttonState.icon === 'loading'}
        onClick={onClick}
        leftIcon={buttonState.icon === 'play' ? PlayIcon : undefined}
      >
        {buttonState.text}
      </Button>

      {/* 状态提示 */}
      {!hasVideo && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          请先上传或拖拽视频文件
        </p>
      )}
      {hasVideo && isFFmpegLoading && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          FFmpeg 正在初始化，请稍候...
        </p>
      )}
      {hasVideo && !isFFmpegLoading && !isConfigValid && (
        <p className="text-center text-sm text-amber-500 dark:text-amber-400">
          请检查配置参数是否正确
        </p>
      )}
    </div>
  );
}

export default StartButton;
