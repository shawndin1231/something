import { useAppContext } from '../../context';
import { FormatSelect } from './FormatSelect';
import { QualitySlider } from './QualitySlider';
import { SizeSelector } from './SizeSelector';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { convertImage } from '../../services';
import { Play, RotateCcw } from 'lucide-react';

export function ConfigPanel() {
  const { state, setConvertedImages, setProgress, setStatus, reset } = useAppContext();
  const { showToast } = useToast();

  const handleConvert = async () => {
    if (state.images.length === 0) {
      showToast('请先上传图片', 'error');
      return;
    }

    setStatus('converting');
    setProgress(0, 0);

    const convertedImages = [];
    let hasError = false;

    for (let i = 0; i < state.images.length; i++) {
      const image = state.images[i];
      try {
        const converted = await convertImage(image, state.config, (progress) => {
          const totalProgress = ((i + progress / 100) / state.images.length) * 100;
          setProgress(totalProgress, i + 1);
        });
        convertedImages.push(converted);
      } catch (error) {
        hasError = true;
        console.error(`Failed to convert ${image.name}:`, error);
      }
    }

    if (convertedImages.length > 0) {
      setConvertedImages(convertedImages);
      showToast(`成功转换 ${convertedImages.length} 张图片`, 'success');
    }

    if (hasError) {
      showToast('部分图片转换失败', 'error');
    }
  };

  const handleReset = () => {
    state.images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    state.convertedImages.forEach((img) => URL.revokeObjectURL(img.convertedUrl));
    reset();
  };

  const isConverting = state.status === 'converting';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormatSelect />
        <QualitySlider />
        <SizeSelector />
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button
          onClick={handleConvert}
          disabled={state.images.length === 0 || isConverting}
          loading={isConverting}
          size="lg"
        >
          <Play className="h-5 w-5 mr-2" />
          开始转换
        </Button>
        
        {(state.images.length > 0 || state.convertedImages.length > 0) && (
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            disabled={isConverting}
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            重置
          </Button>
        )}
      </div>

      {isConverting && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>正在转换...</span>
            <span>{state.currentProcessing} / {state.images.length}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
