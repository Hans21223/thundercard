import React, { useEffect, useState } from 'react';
import { VehicleData } from '../types/vehicle';
import { loadLibrary } from './LibraryModal';
import { loadJson, saveJson } from '../utils/storage';

// My tree's card sidebar: the card in the editor and your Library's vehicle saves.
// Drag one into the tree (the row you drop it on sets its rank), or click to add it like "Add current card".
// Its left edge drags to resize it (double-click: default width).

const DEFAULT_WIDTH = 256;

interface CardShelfProps {
  current: VehicleData;
  onAdd: (card: VehicleData) => void;
  onDragCard: (card: VehicleData | null) => void; // null when the drag ends
}

export const CardShelf: React.FC<CardShelfProps> = ({ current, onAdd, onDragCard }) => {
  const [open, setOpen] = useState(() => loadJson<boolean>('thundercard_shelf_open') ?? true);
  const [lib, setLib] = useState(() => loadLibrary<VehicleData>('cards'));
  const [query, setQuery] = useState('');
  const [width, setWidth] = useState(() => loadJson<number>('thundercard_shelf_width') ?? DEFAULT_WIDTH);
  useEffect(() => {
    saveJson('thundercard_shelf_width', width);
  }, [width]);
  const resize = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const [x0, w0] = [e.clientX, width];
    el.setPointerCapture(e.pointerId);
    el.onpointermove = (ev) => setWidth(Math.min(600, Math.max(180, w0 + x0 - ev.clientX)));
    el.onpointerup = el.onpointercancel = () => (el.onpointermove = null);
  };
  const toggle = () => {
    saveJson('thundercard_shelf_open', !open);
    if (!open) setLib(loadLibrary<VehicleData>('cards')); // saves made since
    setOpen(!open);
  };

  if (!open)
    return (
      <button
        type="button"
        onClick={toggle}
        className="w-7 shrink-0 pt-3 border-l border-[#353e47] bg-[#1b1f24] text-[12px] text-[#8a939b] hover:text-[#f0f0f0] [writing-mode:vertical-rl]"
        title="Show the card sidebar"
      >
        ‹ Cards
      </button>
    );

  const q = query.trim().toLowerCase();
  const loose = lib.items.filter((it) => !it.folder || !lib.folders.includes(it.folder));
  const groups: [string, VehicleData[]][] = [
    ['Card in the editor', [current]],
    ...lib.folders.map((f): [string, VehicleData[]] => [f, lib.items.filter((it) => it.folder === f).map((it) => it.data)]),
    ['Library', loose.map((it) => it.data)],
  ];

  const item = (card: VehicleData, key: string) => (
    <div
      key={key}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', card.name);
        onDragCard(card);
      }}
      onDragEnd={() => onDragCard(null)}
      onClick={() => onAdd(card)}
      className="flex items-center gap-2 px-2 py-1 border-b border-[#2a3239] cursor-grab hover:bg-[#252b31]"
      title="Drag into the tree, or click to add"
    >
      {card.vehicleImage ? (
        <img src={card.vehicleImage} alt="" loading="lazy" className="w-14 h-7 object-contain shrink-0" />
      ) : (
        <span className="w-14 h-7 shrink-0" />
      )}
      <span className="flex-1 min-w-0">
        <span className="block truncate text-[12px] text-[#f0f0f0]">{card.shortName || card.name}</span>
        <span className="block text-[11px] text-[#8a939b]">
          Rank {card.rank} · {card.battleRating}
        </span>
      </span>
    </div>
  );

  return (
    <aside
      className="relative shrink-0 flex flex-col min-h-0 border-l border-[#353e47] bg-[#1b1f24]"
      style={{ width }}
      onMouseEnter={() => setLib(loadLibrary<VehicleData>('cards'))} // saves made in the Library meanwhile
    >
      <div
        onPointerDown={resize}
        onDoubleClick={() => setWidth(DEFAULT_WIDTH)}
        className="absolute inset-y-0 -left-[3px] w-1.5 z-10 cursor-col-resize touch-none hover:bg-[#9cc6de]/40"
        title="Drag to resize, double-click to reset"
      />
      <div className="flex items-center gap-2 px-2 py-2 border-b border-[#353e47]">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search cards" className="ui-input !h-6 text-[12px]" />
        <button type="button" onClick={toggle} className="ui-btn !h-6 !px-2" title="Hide the card sidebar">
          ›
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {groups.map(([title, cards]) => {
          const shown = cards.filter((c) => (c.shortName || c.name).toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
          return shown.length ? (
            <div key={title}>
              <div className="px-2 py-1 bg-[#252b31] text-[11px] text-[#8a939b]">{title}</div>
              {shown.map((c, i) => item(c, `${title}${i}`))}
            </div>
          ) : null;
        })}
        {!lib.items.length && (
          <div className="p-2 text-[12px] leading-relaxed text-[#8a939b]">
            Cards you save in the Library (or that auto-save keeps) show up here, ready to drag into your tree.
          </div>
        )}
      </div>
    </aside>
  );
};
