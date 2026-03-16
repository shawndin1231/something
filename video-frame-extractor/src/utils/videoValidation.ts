/**
 * Video Frame Extractor - Video Validation Utility
 * 视频文件验证工具
 */

/** 支持的视频格式 */
export const SUPPORTED_VIDEO_FORMATS = [
  'mp4',
  'avi',
  'mov',
  'mkv',
  'webm',
  'flv',
] as const;

export type SupportedVideoFormat = (typeof SUPPORTED_VIDEO_FORMATS)[number];

/** 支持的 MIME 类型映射 */
export const SUPPORTED_MIME_TYPES: Record<SupportedVideoFormat, string[]> = {
  mp4: ['video/mp4', 'video/x-m4v', 'video/mp4v-es'],
  avi: ['video/x-msvideo', 'video/avi', 'video/msvideo'],
  mov: ['video/quicktime', 'video/x-quicktime'],
  mkv: ['video/x-matroska', 'video/matroska'],
  webm: ['video/webm'],
  flv: ['video/x-flv', 'video/flv'],
};

/** 文件大小限制 */
export const FILE_SIZE_LIMITS = {
  /** 警告阈值: 500MB */
  WARNING_SIZE: 500 * 1024 * 1024,
  /** 硬限制: 1GB */
  MAX_SIZE: 1024 * 1024 * 1024,
} as const;

/** 验证结果接口 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误消息 */
  error?: string;
  /** 警告消息 */
  warning?: string;
  /** 检测到的格式 */
  format?: SupportedVideoFormat;
}

/**
 * 获取文件扩展名
 * @param filename 文件名
 * @returns 小写的文件扩展名（不含点）
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return '';
  }
  return filename.slice(lastDotIndex + 1).toLowerCase();
}

/**
 * 检查文件扩展名是否支持
 * @param extension 文件扩展名
 * @returns 是否支持
 */
export function isExtensionSupported(extension: string): extension is SupportedVideoFormat {
  return SUPPORTED_VIDEO_FORMATS.includes(extension as SupportedVideoFormat);
}

/**
 * 检查 MIME 类型是否支持
 * @param mimeType MIME 类型
 * @returns 是否支持及对应的格式
 */
export function isMimeTypeSupported(mimeType: string): { supported: boolean; format?: SupportedVideoFormat } {
  for (const [format, mimeTypes] of Object.entries(SUPPORTED_MIME_TYPES)) {
    if (mimeTypes.includes(mimeType.toLowerCase())) {
      return { supported: true, format: format as SupportedVideoFormat };
    }
  }
  return { supported: false };
}

/**
 * 检查文件大小
 * @param size 文件大小（字节）
 * @returns 大小检查结果
 */
export function checkFileSize(size: number): { valid: boolean; warning?: string; error?: string } {
  if (size > FILE_SIZE_LIMITS.MAX_SIZE) {
    return {
      valid: false,
      error: `文件大小超过限制。最大支持 ${formatFileSize(FILE_SIZE_LIMITS.MAX_SIZE)}，当前文件 ${formatFileSize(size)}`,
    };
  }

  if (size > FILE_SIZE_LIMITS.WARNING_SIZE) {
    return {
      valid: true,
      warning: `文件较大 (${formatFileSize(size)})，处理可能需要较长时间`,
    };
  }

  return { valid: true };
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));

  return `${size} ${units[i]}`;
}

/**
 * 验证视频文件
 * @param file 要验证的文件
 * @returns 验证结果
 */
export function validateVideoFile(file: File): ValidationResult {
  // 1. 检查文件扩展名
  const extension = getFileExtension(file.name);

  if (!extension) {
    return {
      valid: false,
      error: '无法识别文件格式，请确保文件有正确的扩展名',
    };
  }

  if (!isExtensionSupported(extension)) {
    return {
      valid: false,
      error: `不支持的文件格式 ".${extension}"。支持的格式: ${SUPPORTED_VIDEO_FORMATS.map(f => f.toUpperCase()).join(', ')}`,
    };
  }

  // 2. 检查 MIME 类型
  const mimeTypeCheck = isMimeTypeSupported(file.type);

  // 如果 MIME 类型存在但不匹配，给出警告（不阻止上传）
  let mimeTypeWarning: string | undefined;
  if (file.type && !mimeTypeCheck.supported) {
    mimeTypeWarning = `MIME 类型 "${file.type}" 可能不被支持，将尝试使用扩展名 "${extension}" 解析`;
  }

  // 3. 检查文件大小
  const sizeCheck = checkFileSize(file.size);

  if (!sizeCheck.valid) {
    return {
      valid: false,
      error: sizeCheck.error,
    };
  }

  // 4. 返回验证结果
  return {
    valid: true,
    format: extension,
    warning: sizeCheck.warning || mimeTypeWarning,
  };
}

/**
 * 获取支持格式的显示文本
 * @returns 格式化的支持格式文本
 */
export function getSupportedFormatsText(): string {
  return SUPPORTED_VIDEO_FORMATS.map(f => f.toUpperCase()).join(', ');
}

/**
 * 获取最大文件大小显示文本
 * @returns 格式化的最大文件大小文本
 */
export function getMaxSizeText(): string {
  return `最大 ${formatFileSize(FILE_SIZE_LIMITS.MAX_SIZE)}`;
}
