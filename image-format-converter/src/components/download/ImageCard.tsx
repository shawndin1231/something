import { useState } from 'react';
import { Download, ZoomIn, ArrowRight } from 'lucide-react';
import type { ConvertedImage } from '../../types';
import { downloadImage } from '../../services';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface ImageCardProps {
  image: ConvertedImage;
}

export function ImageCard({ image }: ImageCardProps) {
  const { showToast } = useToast();
  const [showPreview, setShowPreview] = useState(false);

  const handleDownload = async () => {
    try {
      await downloadImage(image);
      showToast('下载成功', 'success');
    } catch {
      showToast('下载失败', 'error');
    }
  };

  const sizeDiff = image.size - image.convertedSize;
  const sizeDiffPercent = ((sizeDiff / image.size) * 100).toFixed(1);

  return (
    <>
      <div className="group relative rounded-lg border border-border overflow-hidden bg-card">
        <div className="aspect-square relative">
          <img
            src={image.convertedUrl}
            alt={image.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={() => setShowPreview(true)}
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <ZoomIn className="h-8 w-8 text-white" />
          </button>
        </div>
        <div className="p-3 space-y-2">
          <p className="text-sm font-medium truncate" title={image.name}>
            {image.name}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatFileSize(image.size)}</span>
            <ArrowRight className="h-3 w-3" />
            <span className={sizeDiff > 0 ? 'text-green-500' : sizeDiff < 0 ? 'text-red-500' : ''}>
              {formatFileSize(image.convertedSize)}
            </span>
          </div>
          {sizeDiff !== 0 && (
            <p className={`text-xs ${sizeDiff > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {sizeDiff > 0 ? '减少' : '增加'} {Math.abs(Number(sizeDiffPercent))}%
            </p>
          )}
          <Button
            onClick={handleDownload}
            size="sm"
            variant="outline"
            className="w-full"
          >
            <Download className="h-4 w-4 mr-1" />
            下载
          </Button>
        </div>
      </div>

      {showPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-auto">
            <img
              src={image.convertedUrl}
              alt={image.name}
              className="max-w-full max-h-[80vh] object-contain"
            />
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
