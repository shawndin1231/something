import { useState, useEffect } from 'react';
import { useAppContext } from '../../context';
import { Lock, Unlock } from 'lucide-react';

type SizeMode = 'original' | 'custom';

export function SizeSelector() {
  const { state, setConfig } = useAppContext();
  const [mode, setMode] = useState<SizeMode>('original');
  const [width, setWidth] = useState<string>('');
  const [height, setHeight] = useState<string>('');

  useEffect(() => {
    if (mode === 'original') {
      setConfig({ width: undefined, height: undefined });
    }
  }, [mode, setConfig]);

  useEffect(() => {
    if (mode === 'custom' && width) {
      setConfig({ width: parseInt(width, 10) || undefined });
    }
  }, [width, mode, setConfig]);

  useEffect(() => {
    if (mode === 'custom' && height && !state.config.maintainAspectRatio) {
      setConfig({ height: parseInt(height, 10) || undefined });
    }
  }, [height, mode, setConfig, state.config.maintainAspectRatio]);

  const handleWidthChange = (value: string) => {
    setWidth(value);
    if (state.config.maintainAspectRatio && state.images.length > 0) {
      const firstImage = state.images[0];
      const ratio = firstImage.height / firstImage.width;
      const newWidth = parseInt(value, 10) || 0;
      setHeight(Math.round(newWidth * ratio).toString());
    }
  };

  const handleHeightChange = (value: string) => {
    setHeight(value);
    if (state.config.maintainAspectRatio && state.images.length > 0) {
      const firstImage = state.images[0];
      const ratio = firstImage.width / firstImage.height;
      const newHeight = parseInt(value, 10) || 0;
      setWidth(Math.round(newHeight * ratio).toString());
    }
  };

  const toggleAspectRatio = () => {
    setConfig({ maintainAspectRatio: !state.config.maintainAspectRatio });
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">尺寸调整</label>
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as SizeMode)}
        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="original">保持原始尺寸</option>
        <option value="custom">自定义尺寸</option>
      </select>

      {mode === 'custom' && (
        <div className="space-y-3 mt-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">宽度</label>
              <input
                type="number"
                value={width}
                onChange={(e) => handleWidthChange(e.target.value)}
                placeholder="宽度"
                min="1"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              onClick={toggleAspectRatio}
              className={`mt-4 p-2 rounded-lg border transition-colors ${
                state.config.maintainAspectRatio
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input text-muted-foreground'
              }`}
              title={state.config.maintainAspectRatio ? '锁定宽高比' : '解锁宽高比'}
            >
              {state.config.maintainAspectRatio ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
            </button>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">高度</label>
              <input
                type="number"
                value={height}
                onChange={(e) => handleHeightChange(e.target.value)}
                placeholder="高度"
                min="1"
                disabled={state.config.maintainAspectRatio}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
