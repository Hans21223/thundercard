import { toPng, toJpeg, toBlob } from 'html-to-image';

export async function exportCardAsPng(elementId: string, filename = 'statcard.png'): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element #${elementId} not found`);
  }

  const dataUrl = await toPng(element, {
    quality: 1.0,
    pixelRatio: 2, // 2x DPI for crisp high-resolution renders
    cacheBust: true,
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function exportCardAsJpeg(elementId: string, filename = 'statcard.jpg'): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element #${elementId} not found`);
  }

  const dataUrl = await toJpeg(element, {
    quality: 0.95,
    pixelRatio: 2,
    backgroundColor: '#161a1e',
    cacheBust: true,
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function copyCardToClipboard(elementId: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element #${elementId} not found`);
  }

  try {
    const blob = await toBlob(element, {
      pixelRatio: 2,
      cacheBust: true,
    });

    if (!blob) return false;

    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob,
      }),
    ]);
    return true;
  } catch (err) {
    console.error('Failed to copy image to clipboard:', err);
    return false;
  }
}

// Shrink an uploaded image to fit maxW×maxH and return it as a PNG data URL (keeps saves small).
export async function shrinkImage(file: File, maxW: number, maxH: number): Promise<string> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, maxW / img.width, maxH / img.height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}
