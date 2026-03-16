import { useCallback, useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { useAppContext } from '../../context';
import { useToast } from '../ui/Toast';
import type { ImageFile, InputFormat } from '../../types';
import {
  SUPPORTED_INPUT_FORMATS,
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE,
  MAX_FILE_COUNT,
} from '../../types';
import { getImageDimensions, getFileExtension, isValidImageFormat, normalizeFormat } from '../../services';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function UploadArea() {
  const { addImages, state } = useAppContext();
  const { showToast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (state.images.length + fileArray.length > MAX_FILE_COUNT) {
      showToast(`最多支持 ${MAX_FILE_COUNT} 张图片`, 'error');
      return;
    }

    const totalSize = fileArray.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      showToast(`总文件大小不能超过 ${formatFileSize(MAX_TOTAL_SIZE)}`, 'error');
      return;
    }

    const validFiles: ImageFile[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      const ext = getFileExtension(file.name);
      
      if (!isValidImageFormat(ext)) {
        errors.push(`${file.name}: 不支持的格式`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: 文件过大 (最大 ${formatFileSize(MAX_FILE_SIZE)})`);
        continue;
      }

      try {
        const dimensions = await getImageDimensions(file);
        const format = normalizeFormat(ext) as InputFormat;
        
        validFiles.push({
          id: generateId(),
          file,
          name: file.name,
          originalFormat: format,
          size: file.size,
          previewUrl: URL.createObjectURL(file),
          width: dimensions.width,
          height: dimensions.height,
        });
      } catch {
        errors.push(`${file.name}: 无法读取图片`);
      }
    }

    if (errors.length > 0) {
      showToast(errors[0], 'error');
    }

    if (validFiles.length > 0) {
      addImages(validFiles);
      showToast(`成功添加 ${validFiles.length} 张图片`, 'success');
    }
  }, [addImages, showToast, state.images.length]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  }, [processFiles]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer ${
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={SUPPORTED_INPUT_FORMATS.map(f => `.${f === 'jpeg' ? 'jpg,jpeg' : f}`).join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        <div>
          <p className="text-lg font-medium">拖拽图片到这里，或点击选择</p>
          <p className="text-sm text-muted-foreground mt-1">
            支持 PNG、JPG、WebP、GIF、BMP、TIFF、SVG 格式
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            单张最大 {formatFileSize(MAX_FILE_SIZE)}，最多 {MAX_FILE_COUNT} 张
          </p>
        </div>
      </div>
    </div>
  );
}

export function ImageList() {
  const { state, removeImage } = useAppContext();

  if (state.images.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">已上传图片 ({state.images.length})</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {state.images.map((image) => (
          <div
            key={image.id}
            className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-muted"
          >
            <img
              src={image.previewUrl}
              alt={image.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute top-2 right-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(image.id);
                    URL.revokeObjectURL(image.previewUrl);
                  }}
                  className="p-1 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-xs text-white truncate">{image.name}</p>
                <p className="text-xs text-white/70">
                  {image.width} × {image.height}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
