import { useState } from 'react';
import { Package } from 'lucide-react';
import { useAppContext } from '../../context';
import { downloadAllAsZip } from '../../services';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { useToast } from '../ui/Toast';
import { ImageCard } from './ImageCard';

export function DownloadPanel() {
  const { state } = useAppContext();
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  if (state.status !== 'completed' || state.convertedImages.length === 0) {
    return null;
  }

  const handleDownloadAll = async () => {
    setDownloading(true);
    setDownloadProgress(0);
    try {
      await downloadAllAsZip(state.convertedImages, (progress) => {
        setDownloadProgress(progress);
      });
      showToast('打包下载成功', 'success');
    } catch {
      showToast('打包下载失败', 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          转换完成 ({state.convertedImages.length} 张)
        </h3>
        <Button
          onClick={handleDownloadAll}
          disabled={downloading}
          loading={downloading}
        >
          <Package className="h-4 w-4 mr-2" />
          全部下载 (ZIP)
        </Button>
      </div>

      {downloading && (
        <ProgressBar value={downloadProgress} showLabel />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {state.convertedImages.map((image) => (
          <ImageCard key={image.id} image={image} />
        ))}
      </div>
    </div>
  );
}
