import { toPng, toJpeg, toBlob } from 'html-to-image';

// pixelRatio: export size (Settings → Export size: 1×, 2× or 4× the on-screen card)
export async function exportCardAsPng(elementId: string, filename = 'statcard.png', pixelRatio = 2): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element #${elementId} not found`);
  }

  const dataUrl = await toPng(element, {
    quality: 1.0,
    pixelRatio,
    cacheBust: true,
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function exportCardAsJpeg(elementId: string, filename = 'statcard.jpg', pixelRatio = 2): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element #${elementId} not found`);
  }

  const dataUrl = await toJpeg(element, {
    quality: 0.95,
    pixelRatio,
    backgroundColor: '#161a1e',
    cacheBust: true,
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function copyCardToClipboard(elementId: string, pixelRatio = 2): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element #${elementId} not found`);
  }

  try {
    const blob = await toBlob(element, {
      pixelRatio,
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

// Shrink an uploaded image to fit maxW×maxH and return it as a data URL (keeps saves small).
// WebP keeps transparency at a fraction of PNG's size; browsers without it fall back to PNG.
export async function shrinkImage(file: Blob, maxW: number, maxH: number, type = 'image/png'): Promise<string> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, maxW / img.width, maxH / img.height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL(type, 0.9);
}

// A vehicle picture from an uploaded / pasted / dropped file: big enough for a 4× export of the card's
// picture box, small enough that saves don't fill the browser's storage
export const vehiclePicture = (file: Blob) => shrinkImage(file, 1600, 800, 'image/webp');

// One rendered card as PNG data, for the tree's "Save all cards"
export const cardPng = (node: HTMLElement, pixelRatio: number) => toBlob(node, { pixelRatio, cacheBust: true });
