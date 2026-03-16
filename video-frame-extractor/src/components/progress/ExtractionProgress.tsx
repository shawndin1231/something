/**
 * Video Frame Extractor - ExtractionProgress Component
 * 提取进度显示组件
 */

import { useAppState } from '../../context';
import { Card, CardContent, ProgressBar, Button } from '../ui';
import type { Progress } from '../../types/state';

/**
 * 格式化剩余时间
 * @param seconds 秒数
 * @returns 格式化的时间字符串
 */
function formatEstimatedTime(seconds: number): string {
  if (seconds <= 0 || !isFinite(seconds)) {
    return '计算中...';
  }

  if (seconds < 60) {
    return `约 ${Math.ceil(seconds)} 秒`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.ceil(seconds % 60);

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `约 ${minutes} 分 ${remainingSeconds} 秒`
      : `约 ${minutes} 分钟`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `约 ${hours} 小时 ${remainingMinutes} 分`;
}

/**
 * 进度统计信息组件
 */
function ProgressStats({ progress }: { progress: Progress }) {
  return (
    <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
      <span>
        已处理: {progress.current} / {progress.total} 帧
      </span>
      <span>
        剩余时间: {formatEstimatedTime(progress.estimatedTime)}
      </span>
    </div>
  );
}

/**
 * 提取进度组件
 * 显示提取进度条、帧数统计、预计剩余时间和取消按钮
 */
export interface ExtractionProgressProps {
  onCancel?: () => void;
}

export function ExtractionProgress({ onCancel }: ExtractionProgressProps) {
  const state = useAppState();

  // 只在 extracting 状态下显示
  if (state.status !== 'extracting') {
    return null;
  }

  const { progress, video } = state;

  const handleCancel = () => {
    onCancel?.();
  };

  return (
    <Card variant="default" padding="lg" className="w-full max-w-2xl mx-auto">
      <CardContent>
        {/* 标题 */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            正在提取视频帧
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            视频文件: {video.filename}
          </p>
        </div>

        {/* 进度百分比 */}
        <div className="flex items-center justify-center mb-4">
          <span className="text-5xl font-bold text-primary-500 dark:text-primary-400">
            {Math.round(progress.percent)}%
          </span>
        </div>

        {/* 进度条 */}
        <div className="mb-4">
          <ProgressBar
            value={progress.percent}
            max={100}
            size="lg"
            animated
            variant="default"
          />
        </div>

        {/* 统计信息 */}
        <ProgressStats progress={progress} />

        {/* 取消按钮 */}
        <div className="flex justify-center mt-6">
          <Button
            variant="secondary"
            size="md"
            onClick={handleCancel}
            leftIcon={
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            }
          >
            取消提取
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ExtractionProgress;
