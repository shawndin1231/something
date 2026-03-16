import { useAppContext } from '../../context';
import type { ImageFormat } from '../../types';
import { SUPPORTED_OUTPUT_FORMATS } from '../../types';

const FORMAT_LABELS: Record<ImageFormat, string> = {
  png: 'PNG - 无损压缩，支持透明',
  jpeg: 'JPG - 有损压缩，文件小',
  webp: 'WebP - 现代格式，压缩率高',
  gif: 'GIF - 支持动图',
  bmp: 'BMP - 无压缩位图',
};

export function FormatSelect() {
  const { state, setConfig } = useAppContext();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">输出格式</label>
      <select
        value={state.config.format}
        onChange={(e) => setConfig({ format: e.target.value as ImageFormat })}
        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {SUPPORTED_OUTPUT_FORMATS.map((format) => (
          <option key={format} value={format}>
            {FORMAT_LABELS[format]}
          </option>
        ))}
      </select>
    </div>
  );
}
