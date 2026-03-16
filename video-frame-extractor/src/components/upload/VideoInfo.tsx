/**
 * Video Frame Extractor - VideoInfo Component
 * 显示已加载视频的详细信息
 */

import { FileVideo, Clock, Maximize, HardDrive, Film } from 'lucide-react';
import { Card, CardTitle } from '../ui/Card';
import type { VideoInfo as VideoInfoType } from '../../types/state';
import {
  formatDuration,
  formatResolution,
  getFormatDisplayName,
} from '../../utils/videoMetadata';
import { formatFileSize } from '../../utils/videoValidation';

export interface VideoInfoProps {
  /** 视频信息数据 */
  video: VideoInfoType;
  /** 自定义类名 */
  className?: string;
}

/**
 * 信息项组件
 */
interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}

function InfoItem({ icon, label, value, className = '' }: InfoItemProps) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

export function VideoInfo({ video, className = '' }: VideoInfoProps) {
  const {
    filename,
    duration,
    width,
    height,
    size,
    format,
  } = video;

  return (
    <Card className={className} variant="default" padding="md">
      {/* 标题区域 */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <FileVideo className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base truncate">
            {filename}
          </CardTitle>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            视频已加载
          </p>
        </div>
      </div>

      {/* 信息网格 */}
      <div className="grid grid-cols-2 gap-4">
        <InfoItem
          icon={<Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
          label="时长"
          value={formatDuration(duration)}
        />
        <InfoItem
          icon={<Maximize className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
          label="分辨率"
          value={formatResolution(width, height)}
        />
        <InfoItem
          icon={<HardDrive className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
          label="文件大小"
          value={formatFileSize(size)}
        />
        <InfoItem
          icon={<Film className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
          label="格式"
          value={getFormatDisplayName(format)}
        />
      </div>

      {/* 额外信息 */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>总帧数估算</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            约 {Math.ceil(duration * 30)} 帧 (按 30fps 计算)
          </span>
        </div>
      </div>
    </Card>
  );
}

export default VideoInfo;
