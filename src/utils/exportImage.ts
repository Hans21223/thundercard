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
