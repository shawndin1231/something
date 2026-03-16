/**
 * Video Frame Extractor - Utils Index
 * 导出所有工具函数
 */

export {
  // 常量
  SUPPORTED_VIDEO_FORMATS,
  SUPPORTED_MIME_TYPES,
  FILE_SIZE_LIMITS,
  // 类型
  type ValidationResult,
  type SupportedVideoFormat,
  // 函数
  validateVideoFile,
  getFileExtension,
  isExtensionSupported,
  isMimeTypeSupported,
  checkFileSize,
  formatFileSize,
  getSupportedFormatsText,
  getMaxSizeText,
} from './videoValidation';

export {
  // 函数
  extractVideoMetadata,
  formatDuration,
  formatResolution,
  getFormatDisplayName,
  createVideoPreviewUrl,
  revokeVideoPreviewUrl,
  getVideoThumbnail,
  // 类型
  type ExtractMetadataOptions,
  type ExtractMetadataResult,
} from './videoMetadata';

export {
  // 函数
  downloadFile,
  fetchBlobFromUrl,
  generateFrameFilename,
  extractFormatFromFrame,
  downloadFramesAsZip,
  formatFileSize as formatDownloadFileSize,
  calculateTotalSize,
  // 类型
  type ProgressCallback,
  type ZipDownloadOptions,
} from './download';

export {
  classifyError,
  getErrorMessage,
  isRecoverable,
  getRecoveryAction,
  getErrorSeverity,
  createAppError,
  formatErrorForLog,
  shouldReportError,
  type ClassifiedError,
  type ExtendedErrorCode,
} from './errorClassification';

export {
  getMemoryInfo,
  getMemoryStatus,
  shouldReduceQuality,
  estimateMemoryForFrames,
  canSafelyProcessFrames,
  formatBytes,
  type MemoryInfo,
  type MemoryThresholds,
  DEFAULT_THRESHOLDS,
} from './memoryMonitor';

export {
  KeyCodes,
  isKeyboardEvent,
  isActivationKey,
  getFocusableElements,
  trapFocus,
  focusFirstElement,
  focusLastElement,
  announceToScreenReader,
  generateId,
  type KeyCode,
} from './accessibility';
