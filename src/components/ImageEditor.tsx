import React, { useEffect, useRef, useState } from 'react';
import { Pixels, cutOut, loadPixels, magicWand, segment } from '../utils/background';

// Background remover with Photoshop-style tools. Red = will be removed.
// Quick selection: paint over the vehicle, the selection snaps to its outline. Magic wand: click a colour area.
// Alt or the right mouse button does the opposite of the chosen mode. [ and ] change the brush size, Ctrl+Z undoes.

interface ImageEditorProps {
  src: string;
  onApply: (dataUrl: string) => void;
  onClose: () => void;
}

type Tool = 'quick' | 'wand';

export const ImageEditor: React.FC<ImageEditorProps> = ({ src, onApply, onClose }) => {
  const [pix, setPix] = useState<Pixels | null>(null);
  const [error, setError] = useState('');
  const [tool, setTool] = useState<Tool>('quick');
  const [subtract, setSubtract] = useState(false);
  const [brush, setBrush] = useState(16); // screen px radius
  const [tolerance, setTolerance] = useState(20);
  const [mask, setMask] = useState<Uint8Array | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const markers = useRef<Int8Array>(new Int8Array(0));
  const history = useRef<Int8Array[]>([]);
  const imageRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const stroke = useRef<{ x: number; y: number; value: number } | null>(null);

  useEffect(() => {
    loadPixels(src)
      .then((p) => {
        markers.current = new Int8Array(p.w * p.h);
        setPix(p);
      })
      .catch(() => setError("Couldn't read this picture. Pictures linked from another website can't be edited: save it and use Upload image… instead."));
  }, [src]);

  useEffect(() => {
    const c = imageRef.current;
    if (!pix || !c) return;
    [c.width, c.height] = [pix.w, pix.h];
    c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(pix.data), pix.w, pix.h), 0, 0);
  }, [pix]);

  // Red over what will be removed
  useEffect(() => {
    const c = overlayRef.current;
    if (!pix || !c) return;
    [c.width, c.height] = [pix.w, pix.h];
    const tint = new ImageData(pix.w, pix.h);
    if (mask) for (let i = 0; i < mask.length; i++) if (!mask[i]) tint.data.set([255, 40, 40, 120], i * 4);
    c.getContext('2d')!.putImageData(tint, 0, 0);
  }, [pix, mask]);

  const update = () => pix && setMask(segment(pix, markers.current));
  const remember = () => (history.current = [...history.current.slice(-29), markers.current.slice()]);
  const undo = () => {
    const prev = history.current.pop();
    if (!prev) return;
    markers.current = prev;
    update();
  };
  const reset = () => {
    remember();
    markers.current = new Int8Array(markers.current.length);
    setMask(null);
  };

  // Ctrl+Z / [ / ] belong to the editor while it is open, not to the card underneath
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === 'z') undo();
      else if (k === '[') setBrush((b) => Math.max(2, b - 2));
      else if (k === ']') setBrush((b) => Math.min(80, b + 2));
      else if (k === 'escape') onClose();
      else return;
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  // Pointer position in picture pixels, and how many picture pixels one screen pixel is
  const toPicture = (e: React.PointerEvent) => {
    const r = overlayRef.current!.getBoundingClientRect();
    const k = pix!.w / r.width;
    return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k, k };
  };

  const paint = (x0: number, y0: number, x1: number, y1: number, radius: number, value: number) => {
    const { w, h } = pix!;
    const ctx = overlayRef.current!.getContext('2d')!;
    ctx.fillStyle = value === 1 ? 'rgba(80,160,255,0.55)' : 'rgba(255,40,40,0.55)';
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (radius / 2)));
    for (let s = 0; s <= steps; s++) {
      const [cx, cy] = [x0 + ((x1 - x0) * s) / steps, y0 + ((y1 - y0) * s) / steps];
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      for (let y = Math.max(0, Math.floor(cy - radius)); y <= Math.min(h - 1, cy + radius); y++)
        for (let x = Math.max(0, Math.floor(cx - radius)); x <= Math.min(w - 1, cx + radius); x++)
          if ((x - cx) ** 2 + (y - cy) ** 2 <= radius * radius) markers.current[y * w + x] = value;
    }
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pix || (e.button !== 0 && e.button !== 2)) return;
    const value = subtract !== (e.altKey || e.button === 2) ? 2 : 1;
    const { x, y, k } = toPicture(e);
    remember();
    if (tool === 'wand') {
      const area = magicWand(pix, Math.floor(y) * pix.w + Math.floor(x), tolerance);
      area.forEach((a, i) => a && (markers.current[i] = value));
      update();
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    stroke.current = { x, y, value };
    paint(x, y, x, y, brush * k, value);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setCursor({ x: e.clientX - r.left, y: e.clientY - r.top });
    const s = stroke.current;
    if (!s) return;
    const { x, y, k } = toPicture(e);
    paint(s.x, s.y, x, y, brush * k, s.value);
    stroke.current = { ...s, x, y };
  };
  const up = () => {
    if (!stroke.current) return;
    stroke.current = null;
    update();
  };

  const apply = () => {
    if (!pix) return;
    const cut = cutOut(pix, mask ?? new Uint8Array(pix.w * pix.h).fill(1));
    if (!cut) return alert('Nothing is selected to keep.');
    const [x0, y0, x1, y1] = cut.box;
    const canvas = Object.assign(document.createElement('canvas'), { width: x1 - x0 + 1, height: y1 - y0 + 1 });
    canvas.getContext('2d')!.putImageData(new ImageData(cut.data, pix.w, pix.h), -x0, -y0, x0, y0, canvas.width, canvas.height);
    onApply(canvas.toDataURL('image/webp', 0.92));
    onClose();
  };

  const toolButton = (t: Tool, label: string, hint: string) => (
    <button type="button" onClick={() => setTool(t)} className={`ui-choice ${tool === t ? 'is-active' : ''}`} title={hint}>
      {label}
    </button>
  );

  return (
    <div className="ui-modal" onClick={onClose}>
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#1e2328] border border-[#353e47]" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-[#353e47] text-[12px] text-[#8a939b]">
          <span className="font-bold text-[14px] text-[#f0f0f0] mr-2">Remove background</span>
          {toolButton('quick', 'Quick selection', 'Paint over the vehicle; the selection snaps to its outline')}
          {toolButton('wand', 'Magic wand', 'Click an area of one colour')}
          <span className="w-px h-5 bg-[#353e47] mx-1" />
          <button type="button" onClick={() => setSubtract(false)} className={`ui-choice ${!subtract ? 'is-active' : ''}`} title="Mark what to keep">
            + Keep
          </button>
          <button type="button" onClick={() => setSubtract(true)} className={`ui-choice ${subtract ? 'is-active' : ''}`} title="Mark what to remove">
            − Remove
          </button>
          <span className="w-px h-5 bg-[#353e47] mx-1" />
          {tool === 'quick' ? (
            <label className="flex items-center gap-2">
              Brush
              <input type="range" min="2" max="80" value={brush} onChange={(e) => setBrush(+e.target.value)} className="w-28 accent-[#9cc6de]" />
              <span className="w-8 text-[#c0c0c0]">{brush * 2}px</span>
            </label>
          ) : (
            <label className="flex items-center gap-2">
              Tolerance
              <input type="range" min="1" max="60" value={tolerance} onChange={(e) => setTolerance(+e.target.value)} className="w-28 accent-[#9cc6de]" />
              <span className="w-8 text-[#c0c0c0]">{tolerance}</span>
            </label>
          )}
          <div className="flex-1" />
          <button type="button" onClick={undo} className="ui-btn" title="Ctrl+Z">
            Undo
          </button>
          <button type="button" onClick={reset} className="ui-btn">
            Clear
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-4 flex items-center justify-center bg-[#121518]">
          {error && <div className="text-[13px] text-[#fa4a38]">{error}</div>}
          {!pix && !error && <div className="text-[13px] text-[#8a939b]">Loading…</div>}
          {pix && (
            <div
              className="relative"
              style={{ background: 'repeating-conic-gradient(#3a4148 0 25%, #2a3037 0 50%) 0 0 / 16px 16px' }}
            >
              <canvas ref={imageRef} className="block max-w-full max-h-[68vh]" />
              <canvas
                ref={overlayRef}
                onPointerDown={down}
                onPointerMove={move}
                onPointerUp={up}
                onPointerCancel={up}
                onPointerLeave={() => setCursor(null)}
                onContextMenu={(e) => e.preventDefault()}
                className={`absolute inset-0 w-full h-full touch-none ${tool === 'wand' ? 'cursor-crosshair' : 'cursor-none'}`}
              />
              {tool === 'quick' && cursor && (
                <span
                  className="absolute pointer-events-none rounded-full border border-white mix-blend-difference"
                  style={{ left: cursor.x - brush, top: cursor.y - brush, width: brush * 2, height: brush * 2 }}
                />
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-t border-[#353e47] text-[12px] text-[#8a939b]">
          <span className="flex-1">
            Red is removed. Paint (or click, with the wand) what to keep; Alt or right-drag marks what to remove. [ ] brush size.
          </span>
          <button type="button" onClick={onClose} className="ui-btn">
            Cancel
          </button>
          <button type="button" onClick={apply} disabled={!pix} className="ui-btn-primary">
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
