import { useAppContext } from '../../context';

export function QualitySlider() {
  const { state, setConfig } = useAppContext();
  const showQuality = state.config.format === 'jpeg' || state.config.format === 'webp';

  if (!showQuality) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">图片质量</label>
        <span className="text-sm text-muted-foreground">{state.config.quality}%</span>
      </div>
      <input
        type="range"
        min="1"
        max="100"
        value={state.config.quality}
        onChange={(e) => setConfig({ quality: parseInt(e.target.value, 10) })}
        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>最小体积</span>
        <span>最高质量</span>
      </div>
    </div>
  );
}
