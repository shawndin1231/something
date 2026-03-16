import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { ConvertedImage } from '../types';
import { FORMAT_EXTENSIONS } from '../types';

export async function downloadImage(convertedImage: ConvertedImage): Promise<void> {
  const extension = FORMAT_EXTENSIONS[convertedImage.convertedFormat];
  const baseName = convertedImage.name.replace(/\.[^.]+$/, '');
  const filename = `${baseName}${extension}`;

  saveAs(convertedImage.convertedBlob, filename);
}

export async function downloadAllAsZip(
  convertedImages: ConvertedImage[],
  onProgress?: (progress: number) => void
): Promise<void> {
  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (let i = 0; i < convertedImages.length; i++) {
    const image = convertedImages[i];
    const extension = FORMAT_EXTENSIONS[image.convertedFormat];
    const baseName = image.name.replace(/\.[^.]+$/, '');
    
    let filename = `${baseName}${extension}`;
    let counter = 1;
    while (usedNames.has(filename)) {
      filename = `${baseName}_${counter}${extension}`;
      counter++;
    }
    usedNames.add(filename);

    zip.file(filename, image.convertedBlob);
    onProgress?.((i + 1) / convertedImages.length * 50);
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  }, (metadata) => {
    onProgress?.(50 + metadata.percent * 0.5);
  });

  saveAs(blob, `converted-images-${Date.now()}.zip`);
  onProgress?.(100);
}
