import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GameMode, VehicleData, VehicleClass } from '../types/vehicle';
import { GameCatalog, GameVehicle, gameToVehicle, loadGameCatalog } from '../data/gameVehicles';
import { CLASS_METAS } from './StatCard/CardHeader';
import { exportCardAsPng } from '../utils/exportImage';
import { downloadJson } from '../utils/storage';

// My tree: same shape as the game's — columns of entries; a folder entry holds several cards.
export interface MyTreeEntry {
  cards: VehicleData[];
  link: boolean; // researched from the entry above (draws the arrow)
  folder?: boolean; // show as a folder even with one card
  name?: string; // folder name
}
export interface MyTree {
  name: string;
  country: string;
  columns: MyTreeEntry[][];
  premium?: number[]; // column indexes shown under "Premium vehicles"
}
export type NodePath = [column: number, entry: number, card: number]; // card -1 = the whole folder
export const EMPTY_TREE: MyTree = { name: 'My tree', country: 'country_usa', columns: [[]] };

export const setCardAt = (t: MyTree, [c, e, i]: NodePath, card: VehicleData): MyTree => ({
  ...t,
  columns: t.columns.map((col, ci) =>
    ci !== c ? col : col.map((en, ei) => (ei !== e ? en : { ...en, cards: en.cards.map((x, ii) => (ii === i ? card : x)) }))
  ),
});

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const rankNum = (r?: string) => Math.max(1, ROMAN.indexOf(r ?? 'I'));

// ---------- in-game tree look (sizes from the in-game capture) ----------

const T = { W: 146, H: 46, COL: 182, ROW: 90, LEFT: 150, HEAD: 30, PAD: 24, GAP: 60 };
type Kind = 'standard' | 'premium' | 'pack' | 'squadron' | 'event';
const KIND_BG: Record<Kind, string> = {
  standard: 'linear-gradient(90deg,#4d5b66,#34414b)',
  premium: 'linear-gradient(90deg,#5e4c2c,#3b301e)',
  pack: 'linear-gradient(90deg,#5e4c2c,#3b301e)',
  squadron: 'linear-gradient(90deg,#44583f,#2d3b2b)',
  event: 'linear-gradient(90deg,#355368,#233746)',
};
const KIND_BORDER: Record<Kind, string> = {
  standard: '#5f707b',
  premium: '#86703f',
  pack: '#86703f',
  squadron: '#5d7a55',
  event: '#4d7590',
};

interface Tile {
  name: string;
  image: string;
  br: string;
  rank: number;
  kind: Kind;
  price?: string; // GE price shown on premium tiles
  reserve: boolean;
  vclass: VehicleClass;
}
interface Entry {
  rank: number;
  link: boolean;
  folder: boolean;
  name?: string;
  tiles: Tile[];
}

const tileOf = (c: VehicleData): Tile => ({
  name: c.shortName || c.name,
  image: c.vehicleImage,
  br: c.battleRating,
  rank: rankNum(c.rank),
  kind: (['premium', 'pack', 'squadron', 'event'] as const).find((k) => k === c.statusType) ?? 'standard',
  price: c.statusType === 'premium' && c.priceCurrency === 'ge' ? c.price : undefined,
  reserve: c.rank === 'I' && !c.requiredRP && !c.price && c.statusType === 'standard',
  vclass: c.vehicleClass,
});

const ClassIcon: React.FC<{ vclass: VehicleClass }> = ({ vclass }) => {
  const meta = CLASS_METAS[vclass] || CLASS_METAS.medium_tank;
  return (
    <span className="inline-flex [&>svg]:w-[14px] [&>svg]:h-auto" style={{ color: meta.color }}>
      {meta.renderIcon()}
    </span>
  );
};

const TileBox: React.FC<{
  entry: Entry;
  style?: React.CSSProperties;
  selected?: boolean;
  onClick: () => void;
}> = ({ entry, style, selected, onClick }) => {
  const t = entry.tiles[0];
  const brs = entry.tiles.map((x) => parseFloat(x.br)).filter((n) => !isNaN(n));
  const br =
    entry.folder && brs.length > 1 && Math.min(...brs) !== Math.max(...brs)
      ? `${Math.min(...brs).toFixed(1)}-${Math.max(...brs).toFixed(1)}`
      : t.br;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={entry.folder ? entry.name : t.name}
      className={`absolute text-left ${selected ? 'outline outline-2 outline-offset-1 outline-[#9cc6de]' : 'hover:brightness-125'}`}
      style={{ width: T.W, height: T.H, background: KIND_BG[t.kind], border: `1px solid ${KIND_BORDER[t.kind]}`, ...style }}
    >
      {entry.folder && (
        <span className="absolute -top-[6px] -left-px w-7 h-[6px]" style={{ background: KIND_BORDER[t.kind] }} />
      )}
      {t.kind !== 'standard' && (
        <span className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border border-[#6b4d16] bg-[radial-gradient(circle,#ffd98a,#c88a2a)]" />
      )}
      {entry.folder && entry.tiles[1] && (
        <img src={entry.tiles[1].image} alt="" className="absolute left-5 top-2 w-[58px] h-[32px] object-contain opacity-80" />
      )}
      <img src={t.image} alt="" loading="lazy" className="absolute left-1 top-1 w-[64px] h-[36px] object-contain" />
      <span className="absolute right-2 top-[5px] max-w-[96px] truncate text-[13px] leading-[16px] text-[#f0f0f0]">
        {entry.folder ? entry.name || entry.tiles.map((x) => x.name).join('/') : t.name}
      </span>
      <span className="absolute right-2 bottom-[5px] flex items-center gap-1 text-[13px] leading-[16px] text-[#f0f0f0]">
        {t.price && !entry.folder && (
          <>
            <span className="text-[#fa4a38]">{t.price}</span>
            <img src="assets/game/svg/item_type_eagles.svg" alt="" className="w-3.5 h-3.5 -ml-0.5" />
          </>
        )}
        {t.kind === 'pack' && <span>Pack</span>}
        {t.kind === 'event' && <span className="text-[15px] leading-none">Ⓖ</span>}
        <span>{t.reserve && !entry.folder ? 'Reserve' : br}</span>
        <ClassIcon vclass={t.vclass} />
      </span>
    </button>
  );
};

// Research arrow from one tile's bottom edge to the next tile's top edge (x = tile center)
const Arrow: React.FC<{ x: number; from: number; to: number }> = ({ x, from, to }) => (
  <>
    <div className="absolute w-2.5 bg-[#7d939e]" style={{ left: x - 5, top: from + 4, height: to - from - 18 }} />
    <div
      className="absolute w-0 h-0 border-x-[11px] border-x-transparent border-t-[12px] border-t-[#7d939e]"
      style={{ left: x - 11, top: to - 15 }}
    />
  </>
);

const TreeCanvas: React.FC<{
  columns: Entry[][];
  premium: Set<number>;
  selected?: NodePath | null;
  onPick: (path: NodePath) => void;
}> = ({ columns, premium, selected, onPick }) => {
  const [open, setOpen] = useState<string | null>(null); // folder "c:e" whose members are shown

  // Column x positions: researchable columns, then premium ones after a divider
  const order = [...columns.keys()].sort((a, b) => Number(premium.has(a)) - Number(premium.has(b)) || a - b);
  const xs = new Map<number, number>();
  let x = T.LEFT;
  let dividerX: number | null = null;
  for (const ci of order) {
    if (premium.has(ci) && dividerX === null) {
      dividerX = x - (T.COL - T.W) / 2 + T.GAP / 2;
      x += T.GAP;
    }
    xs.set(ci, x);
    x += T.COL;
  }
  const width = x - (T.COL - T.W) + T.LEFT / 3;

  // Rank bands: as tall as the column with the most entries of that rank
  const maxRank = Math.max(1, ...columns.flat().map((e) => e.rank));
  const bands: { rank: number; top: number; height: number }[] = [];
  let y = T.HEAD;
  for (let r = 1; r <= maxRank; r++) {
    const slots = Math.max(1, ...columns.map((col) => col.filter((e) => e.rank === r).length));
    const height = T.PAD * 2 + slots * T.ROW - (T.ROW - T.H);
    bands.push({ rank: r, top: y, height });
    y += height;
  }
  const pos = columns.map((col) => {
    const seen: Record<number, number> = {};
    return col.map((e) => {
      const slot = (seen[e.rank] = (seen[e.rank] ?? -1) + 1);
      return bands[e.rank - 1].top + T.PAD + slot * T.ROW;
    });
  });

  const researchCenter = ((dividerX ?? width) + T.LEFT) / 2;
  const premiumCenter = dividerX !== null ? (dividerX + width) / 2 : 0;

  return (
    <div
      id="techtree-target"
      className="relative shrink-0 select-none"
      style={{ width, height: y + 12, background: 'radial-gradient(ellipse at 50% 30%,#2a333b,#171c21 70%)' }}
      onClick={() => setOpen(null)}
    >
      {/* header */}
      <div className="absolute inset-x-0 top-0 border-b border-[#3a454f] bg-[#1f262c]" style={{ height: T.HEAD }} />
      <div className="absolute text-[15px] text-[#c0c0c0] -translate-x-1/2" style={{ left: researchCenter, top: 5 }}>
        Researchable vehicles
      </div>
      {dividerX !== null && (
        <>
          <div className="absolute text-[15px] text-[#c0c0c0] -translate-x-1/2" style={{ left: premiumCenter, top: 5 }}>
            Premium vehicles
          </div>
          <div className="absolute top-0 bottom-0 w-px bg-[#3a454f]" style={{ left: dividerX }} />
        </>
      )}

      {/* rank bands */}
      {bands.map((b) => (
        <React.Fragment key={b.rank}>
          <div className="absolute inset-x-0 h-px bg-[#2e373f]" style={{ top: b.top }} />
          <div className="absolute text-[15px] text-[#c0c0c0]" style={{ left: 10, top: b.top + 4 }}>
            Rank {ROMAN[b.rank]}
          </div>
          <div className="absolute w-2 bg-[#5f7884]" style={{ left: 14, top: b.top + 28, height: b.height - 46 }} />
          <div
            className="absolute w-0 h-0 border-x-[9px] border-x-transparent border-t-[10px] border-t-[#5f7884]"
            style={{ left: 9, top: b.top + b.height - 18 }}
          />
        </React.Fragment>
      ))}

      {/* research arrows, drawn across rank bands */}
      {columns.map((col, ci) =>
        col.map((e, ei) => {
          if (!e.link || ei === 0) return null;
          const from = pos[ci][ei - 1] + T.H;
          const to = pos[ci][ei];
          if (to - from < 20) return null;
          return <Arrow key={`a${ci}:${ei}`} x={xs.get(ci)! + T.W / 2} from={from} to={to} />;
        })
      )}

      {/* tiles */}
      {columns.map((col, ci) =>
        col.map((e, ei) => {
          const key = `${ci}:${ei}`;
          const isSel = selected?.[0] === ci && selected[1] === ei;
          return (
            <React.Fragment key={key}>
              <TileBox
                entry={e}
                selected={isSel && (!e.folder || selected![2] === -1)}
                style={{ left: xs.get(ci), top: pos[ci][ei] }}
                onClick={() => {
                  if (e.folder) {
                    setOpen(open === key ? null : key);
                    onPick([ci, ei, -1]);
                  } else onPick([ci, ei, 0]);
                }}
              />
              {e.folder && open === key && (
                // Like the game: the rest of the tree blurs, the folder opens as a column of linked vehicles
                <>
                  <div
                    className="absolute inset-0 z-10 bg-black/30 backdrop-blur-[3px]"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setOpen(null);
                    }}
                  />
                  <div
                    className="absolute z-20 bg-[#12171b] border border-[#3d4851] shadow-2xl"
                    style={{
                      left: xs.get(ci)! - 21,
                      top: Math.max(T.HEAD, pos[ci][ei] - 33),
                      width: T.W + 42,
                      height: 42 + (e.tiles.length - 1) * T.ROW + T.H,
                    }}
                    onClick={(ev) => ev.stopPropagation()}
                  >
                    {e.tiles.map((t, ii) => (
                      <React.Fragment key={ii}>
                        {ii > 0 && <Arrow x={21 + T.W / 2} from={21 + (ii - 1) * T.ROW + T.H} to={21 + ii * T.ROW} />}
                        <TileBox
                          entry={{ ...e, folder: false, tiles: [t] }}
                          style={{ left: 21, top: 21 + ii * T.ROW }}
                          selected={isSel && selected![2] === ii}
                          onClick={() => onPick([ci, ei, ii])}
                        />
                      </React.Fragment>
                    ))}
                  </div>
                </>
              )}
            </React.Fragment>
          );
        })
      )}
    </div>
  );
};

// ---------- view ----------

interface TechTreeViewProps {
  mode: 'game' | 'mine';
  onModeChange: (m: 'game' | 'mine') => void;
  gameMode: GameMode;
  currentCard: VehicleData;
  myTree: MyTree;
  onChangeMyTree: (t: MyTree) => void;
  onOpenCard: (card: VehicleData, editPath?: NodePath) => void;
}

export const TechTreeView: React.FC<TechTreeViewProps> = ({
  mode,
  onModeChange: setMode,
  gameMode,
  currentCard,
  myTree,
  onChangeMyTree,
  onOpenCard,
}) => {
  const [data, setData] = useState<GameCatalog | null>(null);
  const [error, setError] = useState('');
  const [country, setCountry] = useState(myTree.country);
  const [sel, setSel] = useState<NodePath | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadGameCatalog().then(setData, (e) => setError(String(e)));
  }, []);

  const byId = useMemo(() => new Map<string, GameVehicle>(data?.vehicles.map((v) => [v.card.id!, v])), [data]);
  const countries = data ? Object.keys(data.trees) : [];
  const card = (id: string) => gameToVehicle(byId.get(id)!, gameMode, data!.version);

  const gameTree = data?.trees[country] ?? [];
  const gameColumns: Entry[][] = useMemo(
    () =>
      gameTree.map((col) =>
        col.map((e) => {
          const tiles = e.ids.map((id) => tileOf(card(id)));
          return { rank: tiles[0].rank, link: e.link, folder: e.ids.length > 1, name: e.name, tiles };
        })
      ),
    [data, country, gameMode] // card() and gameTree derive from these
  );
  // The game's premium/event columns are the ones with no research links at all
  const premiumOf = (cols: { link: boolean }[][]) => cols.flatMap((col, ci) => (col.length && col.every((e) => !e.link) ? [ci] : []));
  const gamePremium = useMemo(() => new Set(premiumOf(gameTree)), [gameTree]);

  const cols = myTree.columns;
  const myColumns: Entry[][] = cols.map((col) =>
    col.map((e) => ({
      rank: rankNum(e.cards[0]?.rank),
      link: e.link,
      folder: !!e.folder || e.cards.length > 1,
      name: e.name,
      tiles: e.cards.map(tileOf),
    }))
  );

  // ----- my tree edits -----
  const update = (t: Partial<MyTree>) => onChangeMyTree({ ...myTree, ...t });
  const setCols = (columns: MyTreeEntry[][]) => update({ columns });
  const selEntry = sel ? cols[sel[0]]?.[sel[1]] : undefined;
  const selIsFolder = !!selEntry && (!!selEntry.folder || selEntry.cards.length > 1);
  const mapEntry = (fn: (e: MyTreeEntry) => MyTreeEntry) =>
    setCols(cols.map((col, ci) => (ci !== sel![0] ? col : col.map((en, ei) => (ei === sel![1] ? fn(en) : en)))));

  const addCurrent = () => {
    const newCard = { ...currentCard };
    if (sel && selIsFolder) {
      mapEntry((en) => ({ ...en, cards: [...en.cards, newCard] }));
      return;
    }
    const entry: MyTreeEntry = { cards: [newCard], link: false };
    if (!sel) {
      const base = cols.length ? cols : [[]];
      const last = base.length - 1;
      setCols(base.map((col, ci) => (ci === last ? [...col, entry] : col)));
      setSel([last, base[last].length, 0]);
      return;
    }
    const [c, e] = sel;
    setCols(cols.map((col, ci) => (ci === c ? [...col.slice(0, e + 1), { ...entry, link: true }, ...col.slice(e + 1)] : col)));
    setSel([c, e + 1, 0]);
  };

  const moveEntry = (dc: number, de: number) => {
    if (!sel || !selEntry) return;
    const [c, e] = sel;
    const next = cols.map((col) => [...col]);
    if (de) {
      const to = e + de;
      if (to < 0 || to >= next[c].length) return;
      [next[c][e], next[c][to]] = [next[c][to], next[c][e]];
      setCols(next);
      setSel([c, to, sel[2]]);
    } else {
      const to = c + dc;
      if (to < 0) return;
      if (to >= next.length) next.push([]);
      next[c].splice(e, 1);
      const at = Math.min(e, next[to].length);
      next[to].splice(at, 0, selEntry);
      setCols(next);
      setSel([to, at, sel[2]]);
    }
  };

  const removeSelected = () => {
    if (!sel || !selEntry) return;
    const [c, e, i] = sel;
    const cards = i === -1 ? [] : selEntry.cards.filter((_, ii) => ii !== i);
    if (!cards.length && !confirm(selIsFolder ? 'Remove this folder and its vehicles?' : 'Remove this vehicle?')) return;
    setCols(cols.map((col, ci) => (ci !== c ? col : cards.length ? col.map((en, ei) => (ei === e ? { ...en, cards } : en)) : col.filter((_, ei) => ei !== e))));
    setSel(null);
  };

  const putInFolderAbove = () => {
    if (!sel || !selEntry || sel[1] === 0) return;
    const [c, e] = sel;
    const above = cols[c][e - 1];
    setCols(cols.map((col, ci) => (ci !== c ? col : [...col.slice(0, e - 1), { ...above, folder: true, cards: [...above.cards, ...selEntry.cards] }, ...col.slice(e + 1)])));
    setSel([c, e - 1, -1]);
  };

  const takeOutOfFolder = () => {
    if (!sel || !selEntry || sel[2] < 0) return;
    const [c, e, i] = sel;
    const out: MyTreeEntry = { cards: [selEntry.cards[i]], link: true };
    const rest = { ...selEntry, cards: selEntry.cards.filter((_, ii) => ii !== i) };
    setCols(cols.map((col, ci) => (ci !== c ? col : [...col.slice(0, e), rest, out, ...col.slice(e + 1)])));
    setSel([c, e + 1, 0]);
  };

  const ungroup = () => {
    if (!sel || !selEntry) return;
    const [c, e] = sel;
    const singles = selEntry.cards.map((cd, i) => ({ cards: [cd], link: i === 0 ? selEntry.link : true }));
    setCols(cols.map((col, ci) => (ci !== c ? col : [...col.slice(0, e), ...singles, ...col.slice(e + 1)])));
    setSel([c, e, 0]);
  };

  const togglePremium = () => {
    if (!sel) return;
    const p = new Set(myTree.premium ?? []);
    if (p.has(sel[0])) p.delete(sel[0]);
    else p.add(sel[0]);
    update({ premium: [...p] });
  };

  const copyGameTree = () => {
    if (!data || (cols.flat().length && !confirm(`Replace "${myTree.name}" with the game's tree?`))) return;
    onChangeMyTree({
      ...myTree,
      country,
      columns: gameTree.map((col) => col.map((e) => ({ link: e.link, name: e.name, folder: e.ids.length > 1, cards: e.ids.map(card) }))),
      premium: premiumOf(gameTree),
    });
    setSel(null);
  };

  const openJson = async (file?: File) => {
    if (!file) return;
    try {
      const t = JSON.parse(await file.text()) as MyTree;
      if (!Array.isArray(t.columns)) throw new Error();
      onChangeMyTree(t);
      setSel(null);
    } catch {
      alert('That file is not a ThunderCard tree.');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const safeName = (myTree.name || 'tree').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const activeCountry = mode === 'game' ? country : myTree.country;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-[#353e47] bg-[#1e2328]">
        {(['game', 'mine'] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} className={`ui-choice ${mode === m ? 'is-active' : ''}`}>
            {m === 'game' ? 'Game tree' : 'My tree'}
          </button>
        ))}
        <span className="w-px h-5 bg-[#353e47] mx-1" />
        {countries.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setCountry(c);
              if (mode === 'mine') update({ country: c });
            }}
            title={c.replace('country_', '')}
            className={`ui-choice h-7 !py-0 ${activeCountry === c ? 'is-active' : ''}`}
          >
            <img src={`assets/game/flags/${c}.avif`} alt={c} className="h-4 w-7 object-contain" />
          </button>
        ))}
        <div className="flex-1" />
        {mode === 'mine' && (
          <>
            <input
              type="text"
              value={myTree.name}
              onChange={(e) => update({ name: e.target.value })}
              className="ui-input !w-40"
              title="Tree name"
            />
            <button type="button" onClick={() => exportCardAsPng('techtree-target', `${safeName}_tree.png`)} className="ui-btn">
              Save PNG
            </button>
            <button type="button" onClick={() => downloadJson(myTree, `${safeName}_tree.json`)} className="ui-btn">
              Save JSON
            </button>
            <input type="file" ref={fileRef} accept=".json,application/json" onChange={(e) => openJson(e.target.files?.[0])} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} className="ui-btn">
              Open JSON
            </button>
          </>
        )}
      </div>

      {mode === 'mine' && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-[#353e47] bg-[#1b1f24] text-[12px]">
          <button type="button" onClick={addCurrent} className="ui-btn-primary" title="Add the card open in the editor">
            {selIsFolder ? 'Add current card to folder' : 'Add current card'}
          </button>
          <button type="button" onClick={() => setCols([...cols, []])} className="ui-btn">
            Add column
          </button>
          <button type="button" onClick={copyGameTree} className="ui-btn" disabled={!data}>
            Copy game tree
          </button>
          {selEntry && (
            <>
              <span className="w-px h-5 bg-[#353e47] mx-1" />
              {sel![2] >= 0 && (
                <button type="button" onClick={() => onOpenCard(selEntry.cards[sel![2]], sel!)} className="ui-btn">
                  Edit card
                </button>
              )}
              <button type="button" onClick={() => moveEntry(-1, 0)} className="ui-btn" title="Move to the column on the left">
                Left
              </button>
              <button type="button" onClick={() => moveEntry(1, 0)} className="ui-btn" title="Move to the column on the right">
                Right
              </button>
              <button type="button" onClick={() => moveEntry(0, -1)} className="ui-btn">
                Up
              </button>
              <button type="button" onClick={() => moveEntry(0, 1)} className="ui-btn">
                Down
              </button>
              <label className="flex items-center gap-1.5 px-1">
                <input type="checkbox" checked={selEntry.link} onChange={(e) => mapEntry((en) => ({ ...en, link: e.target.checked }))} className="ui-check" />
                Researched from above
              </label>
              <label className="flex items-center gap-1.5 px-1">
                <input type="checkbox" checked={!!myTree.premium?.includes(sel![0])} onChange={togglePremium} className="ui-check" />
                Premium column
              </label>
              <span className="w-px h-5 bg-[#353e47] mx-1" />
              {selIsFolder ? (
                <>
                  <input
                    type="text"
                    value={selEntry.name ?? ''}
                    onChange={(e) => mapEntry((en) => ({ ...en, name: e.target.value }))}
                    placeholder="Folder name"
                    className="ui-input !w-36"
                  />
                  {sel![2] >= 0 && (
                    <button type="button" onClick={takeOutOfFolder} className="ui-btn">
                      Take out of folder
                    </button>
                  )}
                  <button type="button" onClick={ungroup} className="ui-btn">
                    Ungroup
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => mapEntry((en) => ({ ...en, folder: true, name: en.cards[0].shortName || en.cards[0].name }))} className="ui-btn">
                  Make folder
                </button>
              )}
              <button type="button" onClick={putInFolderAbove} className="ui-btn" disabled={sel![1] === 0}>
                Put in folder above
              </button>
              <button type="button" onClick={removeSelected} className="ui-btn hover:!text-[#f02020]">
                Remove
              </button>
            </>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto bg-[#101316]" onClick={() => setSel(null)}>
        {error && <div className="p-4 text-[#f02020]">{error}</div>}
        {!data && !error && <div className="p-4">Loading…</div>}
        {data && mode === 'game' && (
          <TreeCanvas
            columns={gameColumns}
            premium={gamePremium}
            onPick={([c, e, i]) => i >= 0 && onOpenCard(card(gameTree[c][e].ids[i]))}
          />
        )}
        {mode === 'mine' &&
          (cols.flat().length ? (
            <TreeCanvas columns={myColumns} premium={new Set(myTree.premium ?? [])} selected={sel} onPick={setSel} />
          ) : (
            <div className="p-4 max-w-md text-[13px] leading-relaxed">
              Your tree is empty. <b className="text-[#f0f0f0]">Add current card</b> puts the card from the editor here, or{' '}
              <b className="text-[#f0f0f0]">Copy game tree</b> starts from the selected nation's real tree. A card's rank sets its row.
            </div>
          ))}
      </div>
    </div>
  );
};
