import React, { useLayoutEffect, useRef, useState } from 'react';
import { VehicleData, VehicleClass } from '../../types/vehicle';

interface CardHeaderProps {
  vehicle: VehicleData;
  onImageChange?: (u: Partial<VehicleData>) => void;
}

// Calls fn with the pointer's offset from where the drag started, until the button is released
const track = (e: React.PointerEvent<HTMLElement>, fn: (dx: number, dy: number, ev: PointerEvent) => void) => {
  if (e.button !== 0) return;
  e.stopPropagation();
  const el = e.currentTarget;
  const [x0, y0] = [e.clientX, e.clientY];
  el.setPointerCapture(e.pointerId);
  el.onpointermove = (ev) => fn(ev.clientX - x0, ev.clientY - y0, ev);
  el.onpointerup = el.onpointercancel = () => (el.onpointermove = null);
};

// Handle positions on the box as fractions of its width / height
const HANDLES = [[0, 0], [0.5, 0], [1, 0], [1, 0.5], [1, 1], [0.5, 1], [0, 1], [0, 0.5]] as const;
const cursorOf = (hx: number, hy: number) =>
  hx === 0.5 ? 'ns-resize' : hy === 0.5 ? 'ew-resize' : hx === hy ? 'nwse-resize' : 'nesw-resize';

// The card's picture box. The vehicle picture carries the card's own offset / scale; with onChange, hovering
// shows a Photoshop-style transform box: drag inside to move, corners scale in proportion (Shift: freely),
// side handles stretch one way. The box sits outside the clipped picture area so its handles stay reachable.
export const PictureBox: React.FC<{
  v: VehicleData;
  onChange?: (u: Partial<VehicleData>) => void;
  className: string; // the picture area (clips the picture)
  imgClassName: string;
  children?: React.ReactNode; // drawn behind the picture (flag, placeholder)
}> = ({ v, onChange, className, imgClassName, children }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  // Untransformed layout of the <img> in wrapper coordinates, and the picture's natural size
  const [geo, setGeo] = useState<{ l: number; t: number; w: number; h: number; nw: number; nh: number } | null>(null);
  const measure = () => {
    const [wrap, box, img] = [wrapRef.current, boxRef.current, imgRef.current];
    if (!wrap || !box || !img?.naturalWidth) return setGeo(null);
    const [b, w] = [box.getBoundingClientRect(), wrap.getBoundingClientRect()];
    const g = {
      l: b.left - w.left + box.clientLeft + img.offsetLeft,
      t: b.top - w.top + box.clientTop + img.offsetTop,
      w: img.offsetWidth,
      h: img.offsetHeight,
      nw: img.naturalWidth,
      nh: img.naturalHeight,
    };
    setGeo((old) => (old && JSON.stringify(old) === JSON.stringify(g) ? old : g));
  };
  useLayoutEffect(measure);

  const x = v.imageX ?? 0;
  const y = v.imageY ?? 0;
  const sx = v.imageScale ?? 1;
  const sy = v.imageScaleY ?? sx;

  let frame: React.ReactNode = null;
  if (onChange && geo) {
    // object-contain + object-bottom: the visible picture inside the <img>; the transform origin is its bottom center
    const fit = Math.min(geo.w / geo.nw, geo.h / geo.nh);
    const [pw, ph] = [geo.nw * fit, geo.nh * fit];
    const [px, py] = [geo.l + (geo.w - pw) / 2, geo.t + geo.h - ph];
    const [ox, oy] = [geo.l + geo.w / 2, geo.t + geo.h];
    const r = { L: ox + x + sx * (px - ox), T: oy + y + sy * (py - oy), W: sx * pw, H: sy * ph };
    // Box on screen → the card's offset / scale
    const setBox = (L: number, T: number, W: number, H: number) => {
      const [nsx, nsy] = [W / pw, H / ph];
      onChange({
        imageScale: +nsx.toFixed(4),
        imageScaleY: +nsy.toFixed(4),
        imageX: Math.round(L - ox - nsx * (px - ox)),
        imageY: Math.round(T - oy - nsy * (py - oy)),
      });
    };
    const resize = (e: React.PointerEvent<HTMLElement>, hx: number, hy: number) =>
      track(e, (dx, dy, ev) => {
        const [ddx, ddy] = [hx ? dx : -dx, hy ? dy : -dy]; // outward = bigger
        let W = hx === 0.5 ? r.W : Math.max(8, r.W + ddx);
        let H = hy === 0.5 ? r.H : Math.max(8, r.H + ddy);
        if (hx !== 0.5 && hy !== 0.5 && !ev.shiftKey) {
          // Corner: follow the mouse along the diagonal, keep proportions
          const k = Math.max(8 / Math.min(r.W, r.H), 1 + (ddx * r.W + ddy * r.H) / (r.W ** 2 + r.H ** 2));
          [W, H] = [r.W * k, r.H * k];
        }
        // The opposite side stays put
        setBox(hx === 0 ? r.L + r.W - W : r.L, hy === 0 ? r.T + r.H - H : r.T, W, H);
      });
    frame = (
      <div
        title="Drag to move. Drag a corner to scale, Shift for free scaling; drag a side to stretch."
        onPointerDown={(e) => track(e, (dx, dy) => onChange({ imageX: Math.round(x + dx), imageY: Math.round(y + dy) }))}
        className="absolute z-20 border border-[#3d8ee6] cursor-move touch-none opacity-0 group-hover:opacity-100"
        style={{ left: r.L, top: r.T, width: r.W, height: r.H }}
      >
        {HANDLES.map(([hx, hy]) => (
          <span
            key={`${hx}${hy}`}
            onPointerDown={(e) => resize(e, hx, hy)}
            className="absolute w-[7px] h-[7px] -ml-[4px] -mt-[4px] bg-white border border-[#3d8ee6]"
            style={{ left: `${hx * 100}%`, top: `${hy * 100}%`, cursor: cursorOf(hx, hy) }}
          />
        ))}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="group relative w-full">
      <div ref={boxRef} className={`relative overflow-hidden ${className}`}>
        {children}
        {v.vehicleImage && (
          <img
            ref={imgRef}
            src={v.vehicleImage}
            alt={v.name}
            draggable={false}
            onLoad={measure}
            className={`${imgClassName} pointer-events-none`}
            style={{ transform: `translate(${x}px, ${y}px) scale(${sx}, ${sy})`, transformOrigin: '50% 100%' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'assets/game/tanks/us_m60a1_rise_mod.avif';
            }}
          />
        )}
      </div>
      {frame}
    </div>
  );
};

// In-game War Thunder class colors (from const/colors.css) & authentic vector icons (from def_*_radar.svg)
interface ClassMeta {
  color: string;
  renderIcon: () => React.ReactNode;
}

export const CLASS_METAS: Record<VehicleClass, ClassMeta> = {
  light_tank: {
    color: '#ffeeee', // @light_tankColor
    renderIcon: () => (
      <svg width="12" height="7" viewBox="0 0 11 6" className="inline-block shrink-0" fill="currentColor">
        <path d="M 1 1 L 10 1 L 10 5 L 1 5 L 1 1 Z" fillOpacity="0.3"/>
        <path d="M 2 2 L 9 2 L 9 4 L 2 4 L 2 2 Z" />
      </svg>
    ),
  },
  medium_tank: {
    color: '#ffaaaa', // @medium_tankColor
    renderIcon: () => (
      <svg width="12" height="8" viewBox="0 0 11 7" className="inline-block shrink-0" fill="currentColor">
        <path d="M 7 5 L 4 5 L 4 6 L 1 6 L 1 1 L 10 1 L 10 6 L 7 6 L 7 5 Z" fillOpacity="0.3"/>
        <path d="M 8 4 L 3 4 L 3 5 L 2 5 L 2 2 L 9 2 L 9 5 L 8 5 L 8 4 Z" />
      </svg>
    ),
  },
  heavy_tank: {
    color: '#ff6666', // @heavy_tankColor
    renderIcon: () => (
      <svg width="12" height="10" viewBox="0 0 11 9" className="inline-block shrink-0" fill="currentColor">
        <path d="M 8 3 L 10 3 L 10 8 L 6 8 L 6 7 L 5 7 L 5 8 L 1 8 L 1 3 L 3 3 L 3 1 L 8 1 L 8 3 Z" fillOpacity="0.3"/>
        <path d="M 4 4 L 2 4 L 2 7 L 4 7 L 4 6 L 7 6 L 7 7 L 9 7 L 9 4 L 7 4 L 7 2 L 4 2 L 4 4 Z" />
      </svg>
    ),
  },
  destroyer_tank: {
    color: '#bde9b5', // @tank_destroyerColor
    renderIcon: () => (
      <svg width="12" height="11" viewBox="0 0 10 9" className="inline-block shrink-0" fill="currentColor">
        <path d="M 1 4.6 L 1 8 L 9 8 L 9 4 L 6.4 4 L 9 1.4 L 9 1 L 4.6 1 L 1 4.6 Z" fillOpacity="0.3"/>
        <path d="M 2 5 L 2 7 L 8 7 L 8 5 L 4 5 L 7 2 L 5 2 L 2 5 Z" />
      </svg>
    ),
  },
  spaa_tank: {
    color: '#c6a0ff', // @spaaColor
    renderIcon: () => (
      <svg width="12" height="11" viewBox="0 0 10 9" className="inline-block shrink-0" fill="currentColor">
        <path d="M 8 4.063 L 8 1 L 2 1 L 2 4.063 L 1 4.063 L 1 8 L 9 8 L 9 4.063 L 8 4.063 Z" fillOpacity="0.3"/>
        <path d="M 7 5 L 8 5 L 8 7 L 2 7 L 2 5 L 3 5 L 3 2 L 4 2 L 4 5 L 6 5 L 6 2 L 7 2 L 7 5 Z" />
      </svg>
    ),
  },
  aviation_fighter: {
    color: '#ffac6f', // @medium_fighterColor
    renderIcon: () => (
      <svg width="12" height="12" viewBox="0 0 28 28" className="inline-block shrink-0" fill="currentColor">
        <path d="m13.88,23.86l-.08-1.1-.56,1.02-3.03-.4c-.1-.43-.18-1-.11-1.32.02-.11.06-.17.12-.19l3.15-1.06-.7-5.06-8.93-1.36s-.09-.07-.14-.18c-.21-.53-.32-1.76-.16-2.42.05-.21.14-.32.26-.32h9.1s.23-2.02.23-2.02c0-.16.03-.28.07-.37.04-.09.09-.16.16-.2.07-.04.15-.07.24-.08.09-.01.19-.02.3-.02v-.17h-.05c-.42,0-.83.03-1.25.08-.42.06-.78.08-1.11.08-.11,0-.2-.01-.28-.06-.08-.04-.14-.09-.17-.14-.04-.05-.05-.09-.05-.13,0-.04.04-.06.11-.06h2.74s0-.08,0-.08c0-.03,0-.05.02-.08.02-.03.06-.05.11-.05h.03s0-.07,0-.09c0-.02.04-.03.08-.03.05,0,.08.01.08.03,0,.02.01.05.01.09h.05s.08.02.09.05c.02.03.03.05.03.08v.09c.41,0,.82-.04,1.24-.09.42-.06.78-.08,1.11-.08.11,0,.21.02.28.06.08.04.13.08.17.13.04.05.05.09.04.13-.01.04-.05.06-.11.06h-2.78s0,.17,0,.17c.11,0,.21.01.3.02.09.01.17.04.24.08.07.05.12.11.16.2.04.09.06.21.07.36l.22,2.03h9.1c.12,0,.21.11.26.32.16.67.04,1.88-.15,2.42-.04.12-.08.18-.13.18l-8.94,1.36-.69,5.07,3.14,1.05c.06.02.1.08.13.19.08.33-.01.91-.11,1.33l-3.04.39-.55-1.02-.08,1.1c0,.07-.05.1-.14.1-.03,0-.05-.01-.08-.03-.03-.01-.04-.04-.03-.07Z" />
      </svg>
    ),
  },
  aviation_strike: {
    color: '#bde9b5', // @common_assaultColor
    renderIcon: () => (
      <svg width="12" height="12" viewBox="0 0 28 28" className="inline-block shrink-0" fill="currentColor">
        <path d="m13.88,23.86l-.08-1.1-.56,1.02-3.03-.4c-.1-.43-.18-1-.11-1.32.02-.11.06-.17.12-.19l3.15-1.06-.7-5.06-8.93-1.36s-.09-.07-.14-.18c-.21-.53-.32-1.76-.16-2.42.05-.21.14-.32.26-.32h9.1s.23-2.02.23-2.02c0-.16.03-.28.07-.37.04-.09.09-.16.16-.2.07-.04.15-.07.24-.08.09-.01.19-.02.3-.02v-.17h-.05c-.42,0-.83.03-1.25.08-.42.06-.78.08-1.11.08-.11,0-.2-.01-.28-.06-.08-.04-.14-.09-.17-.14-.04-.05-.05-.09-.05-.13,0-.04.04-.06.11-.06h2.74s0-.08,0-.08c0-.03,0-.05.02-.08.02-.03.06-.05.11-.05h.03s0-.07,0-.09c0-.02.04-.03.08-.03.05,0,.08.01.08.03,0,.02.01.05.01.09h.05s.08.02.09.05c.02.03.03.05.03.08v.09c.41,0,.82-.04,1.24-.09.42-.06.78-.08,1.11-.08.11,0,.21.02.28.06.08.04.13.08.17.13.04.05.05.09.04.13-.01.04-.05.06-.11.06h-2.78s0,.17,0,.17c.11,0,.21.01.3.02.09.01.17.04.24.08.07.05.12.11.16.2.04.09.06.21.07.36l.22,2.03h9.1c.12,0,.21.11.26.32.16.67.04,1.88-.15,2.42-.04.12-.08.18-.13.18l-8.94,1.36-.69,5.07,3.14,1.05c.06.02.1.08.13.19.08.33-.01.91-.11,1.33l-3.04.39-.55-1.02-.08,1.1c0,.07-.05.1-.14.1-.03,0-.05-.01-.08-.03-.03-.01-.04-.04-.03-.07Z" />
      </svg>
    ),
  },
  aviation_bomber: {
    color: '#bfd4ff', // @light_bomberColor
    renderIcon: () => (
      <svg width="12" height="12" viewBox="0 0 28 28" className="inline-block shrink-0" fill="currentColor">
        <path d="m13.88,23.86l-.08-1.1-.56,1.02-3.03-.4c-.1-.43-.18-1-.11-1.32.02-.11.06-.17.12-.19l3.15-1.06-.7-5.06-8.93-1.36s-.09-.07-.14-.18c-.21-.53-.32-1.76-.16-2.42.05-.21.14-.32.26-.32h9.1s.23-2.02.23-2.02c0-.16.03-.28.07-.37.04-.09.09-.16.16-.2.07-.04.15-.07.24-.08.09-.01.19-.02.3-.02v-.17h-.05c-.42,0-.83.03-1.25.08-.42.06-.78.08-1.11.08-.11,0-.2-.01-.28-.06-.08-.04-.14-.09-.17-.14-.04-.05-.05-.09-.05-.13,0-.04.04-.06.11-.06h2.74s0-.08,0-.08c0-.03,0-.05.02-.08.02-.03.06-.05.11-.05h.03s0-.07,0-.09c0-.02.04-.03.08-.03.05,0,.08.01.08.03,0,.02.01.05.01.09h.05s.08.02.09.05c.02.03.03.05.03.08v.09c.41,0,.82-.04,1.24-.09.42-.06.78-.08,1.11-.08.11,0,.21.02.28.06.08.04.13.08.17.13.04.05.05.09.04.13-.01.04-.05.06-.11.06h-2.78s0,.17,0,.17c.11,0,.21.01.3.02.09.01.17.04.24.08.07.05.12.11.16.2.04.09.06.21.07.36l.22,2.03h9.1c.12,0,.21.11.26.32.16.67.04,1.88-.15,2.42-.04.12-.08.18-.13.18l-8.94,1.36-.69,5.07,3.14,1.05c.06.02.1.08.13.19.08.33-.01.91-.11,1.33l-3.04.39-.55-1.02-.08,1.1c0,.07-.05.1-.14.1-.03,0-.05-.01-.08-.03-.03-.01-.04-.04-.03-.07Z" />
      </svg>
    ),
  },
  helicopter: {
    color: '#f2f266', // @attack_helicopterColor
    renderIcon: () => (
      <svg width="12" height="12" viewBox="0 0 28 28" className="inline-block shrink-0" fill="currentColor">
        <path d="M 6.5 1 L 12 6 L 6.5 10 L 1 6 Z" />
      </svg>
    ),
  },
};

export const CardHeader: React.FC<CardHeaderProps> = ({ vehicle, onImageChange }) => {
  const classMeta = CLASS_METAS[vehicle.vehicleClass] || CLASS_METAS.medium_tank;
  const lines = (text: string) => text.split('\n').map((line, i) => <div key={i}>{line}</div>);
  const withGe = (line: string, key: number) => (
    <div key={key}>
      {line.split('[GE]').map((part, i, all) => (
        <React.Fragment key={i}>
          {part}
          {i < all.length - 1 && <img src="assets/game/svg/item_type_eagles.svg" alt="GE" className="inline-block w-3.5 h-3.5 align-[-2px]" />}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="w-full flex flex-col items-center text-center">
      {vehicle.headerTooltip && <div className="text-[11px] text-[#bdbdbd]">{vehicle.headerTooltip}</div>}

      {/* Centered; a name too long for the card starts at the left and is clipped (in-game it auto-scrolls) */}
      <h1 className="w-full flex [justify-content:safe_center] overflow-hidden whitespace-nowrap mt-[2px] text-[14.5px] text-[#e0e0e0]">
        <span className="shrink-0">{vehicle.name || 'Vehicle Name'}</span>
      </h1>

      <div className="flex items-center justify-center gap-1.5" style={{ color: classMeta.color }}>
        {classMeta.renderIcon()}
        <span>{vehicle.typeLabel || 'Medium Tank'}</span>
      </div>

      <div className="flex items-center justify-center gap-3">
        <span>
          Rank: <span className="text-white">{vehicle.rank || 'I'}</span>
        </span>
        <span>
          Battle rating: <span className="text-white">{vehicle.battleRating || '1.0'}</span>
        </span>
      </div>

      {/* Vehicle render box matching in-game aircraft-image-nest */}
      <PictureBox
        v={vehicle}
        onChange={onImageChange}
        className="w-full h-[223px] flex items-end justify-center"
        imgClassName="relative z-10 w-full h-[190px] object-contain object-bottom"
      >
        {vehicle.countryFlag && (
          <img
            src={vehicle.countryFlag}
            alt="Flag"
            className="absolute top-0 left-0 w-[220px] h-[125px] object-contain object-left-top pointer-events-none"
            style={{
              maskImage: 'radial-gradient(ellipse 95% 85% at 20% 20%, black 45%, transparent 95%)',
              WebkitMaskImage: 'radial-gradient(ellipse 95% 85% at 20% 20%, black 45%, transparent 95%)',
              opacity: vehicle.flagBackdropOpacity ?? 1.0,
              transform: `scale(${vehicle.flagBackdropScale || 1.0})`,
            }}
          />
        )}
        {!vehicle.vehicleImage && <div className="relative z-10 text-xs text-gray-500 italic pb-8">No vehicle image</div>}
      </PictureBox>

      {vehicle.statusType === 'locked' && (
        <div className="w-full mt-[4px] text-[#f02020]">
          {vehicle.statusText
            ? lines(vehicle.statusText)
            : lines(`Rank ${vehicle.rank} is locked.\nYou need to purchase more vehicles of rank ${vehicle.rank}.`)}
        </div>
      )}

      {vehicle.statusType === 'reserve' && (
        <div className="w-full mt-[4px] px-2">
          {vehicle.statusText || 'A reserve vehicle, available to everyone. This vehicle is repaired immediately after each battle.'}
        </div>
      )}

      {vehicle.statusType === 'squadron' && (
        <div className="w-full mt-[4px] text-[#bde9b5]">
          <div>Squadron vehicle</div>
          {vehicle.statusText && <div className="text-[#c0c0c0]">{vehicle.statusText}</div>}
        </div>
      )}

      {vehicle.statusType === 'pack' && (
        <div className="w-full mt-[4px] text-[#f9db78]">
          {(vehicle.statusText ||
            'This vehicle can only be obtained by purchasing a special pack.\n+ 20 backup vehicles for free, you save 2,200[GE]!'
          )
            .split('\n')
            .map(withGe)}
        </div>
      )}

      {vehicle.statusType === 'premium' && (
        <div className="w-full mt-[4px] text-[#f9db78]">
          You can purchase this vehicle for <span className="text-[#fa4a38]">{vehicle.price || '7,480'}</span>
          <img src="assets/game/svg/item_type_eagles.svg" alt="GE" className="inline-block w-3.5 h-3.5 align-[-2px]" />
        </div>
      )}
    </div>
  );
};
