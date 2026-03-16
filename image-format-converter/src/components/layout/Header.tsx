import { Image } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Image className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Image Format Converter</h1>
            <p className="text-sm text-muted-foreground">
              在浏览器中安全转换图片格式，无需上传服务器
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
