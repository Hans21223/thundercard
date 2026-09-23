import React, { useEffect, useMemo, useRef, useState } from 'react';
import { VehicleData } from '../types/vehicle';
import { parseBlueprint, sprocketToVehicle } from '../utils/sprocket';
import { shrinkImage } from '../utils/exportImage';
import { loadJson, saveJson } from '../utils/storage';
import { MyTree, MyTreeEntry } from './TechTreeView';
import { EMPTY_PREFS, NationPrefs } from './NationsDialog';
import { PromptDialog, PromptRequest } from './PromptDialog';

// Import Sprocket designs: pick .blueprint files or a whole faction / Vehicles folder
// (a folder also brings the Profiles/*.png side views and the faction name).

interface Entry {
  name: string;
  file: File;
  image?: File;
}

interface SprocketModalProps {
  isOpen: boolean;
  base: VehicleData; // flag, layout etc. are kept from the current card
  onOpenCard: (v: VehicleData) => void;
  onOpenTree: (t: MyTree) => void;
  onClose: () => void;
}

const baseName = (path: string) => path.split('/').pop()!.replace(/\.[^.]+$/, '');
// Variants share a column: "XE701F3" → "XE701", "RGM-34FA2" → "RGM-34", "TH-05DD" → "TH-05"
const family = (name: string) => name.match(/^\D*\d+/)?.[0] ?? name;

export const SprocketModal: React.FC<SprocketModalProps> = ({ isOpen, base, onOpenCard, onOpenTree, onClose }) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [faction, setFaction] = useState('');
  const [busy, setBusy] = useState('');
  const [ask, setAsk] = useState<PromptRequest | null>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement | null>(null);

  const thumbs = useMemo(() => new Map(entries.map((e) => [e.name, e.image && URL.createObjectURL(e.image)])), [entries]);
  useEffect(() => () => thumbs.forEach((u) => u && URL.revokeObjectURL(u)), [thumbs]);

  if (!isOpen) return null;

  const collect = async (list: FileList | null) => {
    if (!list?.length) return;
    // A faction folder also holds component blueprints (Cannons, Engines…); only its Vehicles folder counts
    const all = [...list];
    const vehicles = all.filter((f) => /(^|\/)Vehicles\//.test(f.webkitRelativePath));
    const files = vehicles.length ? [...vehicles, ...all.filter((f) => f.name.endsWith('.fdef'))] : all;
    const images = new Map(files.filter((f) => f.name.toLowerCase().endsWith('.png')).map((f) => [baseName(f.name), f]));
    const fdef = files.find((f) => f.name.endsWith('.fdef'));
    setFaction(fdef ? (JSON.parse(await fdef.text()).name ?? '') : '');
    setEntries(
      files
        .filter((f) => f.name.endsWith('.blueprint') && baseName(f.name) !== 'Autosave')
        .map((f) => ({ name: baseName(f.name), file: f, image: images.get(baseName(f.name)) }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    );
  };

  const toCard = async (e: Entry) =>
    sprocketToVehicle(parseBlueprint(await e.file.text()), base, e.image ? await shrinkImage(e.image, 868, 380, 'image/webp') : '');

  const openOne = async (e: Entry) => {
    setBusy(`Reading ${e.name}…`);
    try {
      onOpenCard(await toCard(e));
      onClose();
    } catch (err) {
      alert(`Could not read ${e.name}: ${(err as Error).message}`);
    }
    setBusy('');
  };

  // Whole faction → a tech tree in its own nation: variants in one column, rows by rank
  const addAll = (treeName: string) =>
    (async () => {
      const cards: VehicleData[] = [];
      let failed = 0;
      for (const [i, e] of entries.entries()) {
        setBusy(`Reading ${i + 1} / ${entries.length}: ${e.name}…`);
        try {
          cards.push(await toCard(e));
        } catch {
          failed++;
        }
      }
      const prefs = loadJson<NationPrefs>('thundercard_nations') ?? EMPTY_PREFS;
      const nation = { id: `custom_${Date.now()}`, name: treeName, flag: base.countryFlag };
      saveJson('thundercard_nations', { ...prefs, custom: [...prefs.custom, nation] });

      const rankOf = (c: VehicleData) => ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].indexOf(c.rank);
      const groups = new Map<string, VehicleData[]>();
      for (const c of cards) groups.set(family(c.name), [...(groups.get(family(c.name)) ?? []), c]);
      const columns: MyTreeEntry[][] = [...groups.values()]
        .map((g) => g.sort((a, b) => rankOf(a) - rankOf(b) || a.name.localeCompare(b.name, undefined, { numeric: true })))
        .sort((a, b) => rankOf(a[0]) - rankOf(b[0]) || a[0].name.localeCompare(b[0].name))
        .map((g) => g.map((c, i) => ({ cards: [{ ...c, countryFlag: nation.flag }], link: i > 0 })));
      setBusy('');
      if (failed) alert(`${failed} blueprint(s) could not be read and were skipped.`);
      onOpenTree({ name: treeName, country: nation.id, columns });
      onClose();
    })();

  return (
    <div className="ui-modal" onClick={() => !busy && onClose()}>
      {ask && <PromptDialog {...ask} onClose={() => setAsk(null)} />}
      <div className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-[#1e2328] border border-[#353e47]" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[#353e47]">
          <span className="font-bold text-[#f0f0f0] mr-2">Sprocket blueprints</span>
          <input type="file" ref={filesRef} multiple accept=".blueprint,.png,.fdef" className="hidden" onChange={(e) => collect(e.target.files)} />
          <input
            type="file"
            ref={(el) => {
              folderRef.current = el;
              el?.setAttribute('webkitdirectory', '');
            }}
            className="hidden"
            onChange={(e) => collect(e.target.files)}
          />
          <button type="button" onClick={() => folderRef.current?.click()} className="ui-btn-primary" disabled={!!busy}>
            Choose folder…
          </button>
          <button type="button" onClick={() => filesRef.current?.click()} className="ui-btn" disabled={!!busy}>
            Choose files…
          </button>
          <div className="flex-1" />
          {entries.length > 1 && (
            <button
              type="button"
              disabled={!!busy}
              onClick={() =>
                setAsk({
                  title: 'Add all to a new tech tree',
                  initial: faction || 'Sprocket faction',
                  placeholder: 'Tree and nation name',
                  confirmText: `Add ${entries.length} vehicles`,
                  onSubmit: addAll,
                })
              }
              className="ui-btn"
              title="Builds a My tree with every vehicle; variants share a column"
            >
              Add all to a tech tree…
            </button>
          )}
          <button type="button" onClick={onClose} className="ui-btn" disabled={!!busy}>
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {busy && <div className="px-1 pb-2 text-[13px] text-[#9cc6de]">{busy}</div>}
          {!entries.length && (
            <div className="p-2 text-[13px] leading-relaxed text-[#8a939b]">
              Pick your faction folder (or its <span className="text-[#c0c0c0]">Blueprints\Vehicles</span> folder) to bring in every design
              with its side view, usually in <span className="text-[#c0c0c0]">Documents\My Games\Sprocket\Factions</span>. Or choose single
              .blueprint files. Click a vehicle to make its stat card.
              <div className="mt-2">
                Filled in from the blueprint: name, mass, crew, guns and ammo, shell types, gun elevation, engine, and top speed
                (designs saved in game 0.2.54 or newer). Battle rating, rank and anything Sprocket doesn't store are left for you to set.
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {entries.map((e) => (
              <button key={e.name} type="button" disabled={!!busy} onClick={() => openOne(e)} className="ui-choice flex items-center gap-3">
                {thumbs.get(e.name) ? (
                  <img src={thumbs.get(e.name)} alt="" className="w-24 h-9 object-contain shrink-0" />
                ) : (
                  <span className="w-24 h-9 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="truncate text-[13px] text-[#c0c0c0]">{e.name}</div>
                  <div className="text-[11px]">{(e.file.size / 1e6).toFixed(1)} MB</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
