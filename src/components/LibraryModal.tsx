import React, { useRef, useState } from 'react';
import { VehicleData } from '../types/vehicle';
import { VEHICLE_PRESETS } from '../data/presets';
import { MyTree } from './TechTreeView';
import { downloadJson, loadJson, saveJson } from '../utils/storage';
import { PromptDialog, PromptRequest } from './PromptDialog';

// Saved vehicles and saved tech trees live in two separate libraries, each with its own folders.

interface LibItem<T> {
  id: string;
  name: string;
  folder: string; // '' = no folder
  saved: number;
  data: T;
}
interface Library<T> {
  folders: string[];
  items: LibItem<T>[];
}
type Kind = 'cards' | 'trees';
const KEY: Record<Kind, string> = { cards: 'thundercard_lib_cards', trees: 'thundercard_lib_trees' };
const load = <T,>(kind: Kind): Library<T> => loadJson<Library<T>>(KEY[kind]) ?? { folders: [], items: [] };

interface LibraryModalProps {
  isOpen: boolean;
  initialTab: Kind;
  card: VehicleData;
  tree: MyTree;
  onOpenCard: (card: VehicleData) => void;
  onOpenTree: (tree: MyTree) => void;
  onClose: () => void;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, initialTab, card, tree, onOpenCard, onOpenTree, onClose }) => {
  const [tab, setTab] = useState<Kind>(initialTab);
  const [libs, setLibs] = useState({ cards: load<VehicleData>('cards'), trees: load<MyTree>('trees') });
  const [saveName, setSaveName] = useState('');
  const [saveFolder, setSaveFolder] = useState('');
  const [ask, setAsk] = useState<PromptRequest | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Reset the form each time the dialog opens
  const [wasOpen, setWasOpen] = useState(false);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setTab(initialTab);
      setSaveName('');
    }
  }
  if (!isOpen) return null;

  const lib: Library<VehicleData | MyTree> = libs[tab];
  const current = tab === 'cards' ? card : tree;
  const currentName = tab === 'cards' ? card.name : tree.name;

  const commit = (next: Library<VehicleData | MyTree>) => {
    if (!saveJson(KEY[tab], next)) {
      alert('Browser storage is full. Use "Export" to keep a copy as a file, then delete some saves.');
      return;
    }
    setLibs({ ...libs, [tab]: next });
  };
  const patchItem = (id: string, patch: Partial<LibItem<VehicleData | MyTree>>) =>
    commit({ ...lib, items: lib.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });

  const save = () =>
    commit({
      ...lib,
      items: [
        ...lib.items,
        { id: `${Date.now()}`, name: saveName.trim() || currentName, folder: saveFolder, saved: Date.now(), data: structuredClone(current) },
      ],
    });

  const addFolder = () =>
    setAsk({
      title: 'New folder',
      placeholder: 'Folder name',
      confirmText: 'Create',
      onSubmit: (name) => {
        if (lib.folders.includes(name)) return;
        commit({ ...lib, folders: [...lib.folders, name] });
        setSaveFolder(name);
      },
    });
  const renameFolder = (old: string) =>
    setAsk({
      title: 'Rename folder',
      initial: old,
      confirmText: 'Rename',
      onSubmit: (name) => {
        if (name === old || lib.folders.includes(name)) return;
        commit({
          folders: lib.folders.map((f) => (f === old ? name : f)),
          items: lib.items.map((it) => (it.folder === old ? { ...it, folder: name } : it)),
        });
      },
    });
  const deleteFolder = (f: string) => {
    const n = lib.items.filter((it) => it.folder === f).length;
    if (n && !confirm(`Delete folder "${f}" and the ${n} save(s) in it?`)) return;
    commit({ folders: lib.folders.filter((x) => x !== f), items: lib.items.filter((it) => it.folder !== f) });
  };

  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const other = JSON.parse(await file.text()) as Library<VehicleData | MyTree>;
      if (!Array.isArray(other.items)) throw new Error();
      commit({
        folders: [...new Set([...lib.folders, ...(other.folders ?? [])])],
        items: [...lib.items, ...other.items.map((it, i) => ({ ...it, id: `${Date.now()}_${i}` }))],
      });
    } catch {
      alert('That file is not a ThunderCard library export.');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const open = (data: VehicleData | MyTree) => {
    if (tab === 'cards') onOpenCard(structuredClone(data as VehicleData));
    else onOpenTree(structuredClone(data as MyTree));
    onClose();
  };

  const row = (it: LibItem<VehicleData | MyTree>) => (
    <div key={it.id} className="flex items-center gap-2 px-2 py-1.5 border-b border-[#2a3239] hover:bg-[#252b31]">
      <button type="button" onClick={() => open(it.data)} className="flex-1 min-w-0 text-left">
        <div className="truncate text-[13px] text-[#f0f0f0]">{it.name}</div>
        <div className="text-[11px] text-[#8a939b]">{new Date(it.saved).toLocaleString()}</div>
      </button>
      <select
        value={it.folder}
        onChange={(e) => patchItem(it.id, { folder: e.target.value })}
        className="ui-input !w-32 !h-6 text-[12px]"
        title="Move to folder"
      >
        <option value="">No folder</option>
        {lib.folders.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => confirm(`Replace "${it.name}" with the current ${tab === 'cards' ? 'card' : 'tree'}?`) && patchItem(it.id, { data: structuredClone(current), saved: Date.now() })}
        className="ui-btn !h-6 !px-2 text-[12px]"
      >
        Save over
      </button>
      <button
        type="button"
        onClick={() => setAsk({ title: 'Rename', initial: it.name, confirmText: 'Rename', onSubmit: (n) => patchItem(it.id, { name: n }) })}
        className="ui-btn !h-6 !px-2 text-[12px]"
      >
        Rename
      </button>
      <button
        type="button"
        onClick={() => confirm(`Delete "${it.name}"?`) && commit({ ...lib, items: lib.items.filter((x) => x.id !== it.id) })}
        className="ui-btn !h-6 !px-2 text-[12px] hover:!text-[#f02020]"
      >
        Delete
      </button>
    </div>
  );

  const folderHead = (f: string, count: number, editable: boolean) => (
    <div className="flex items-center gap-2 px-2 py-1 mt-3 bg-[#252b31] border-l-2 border-[#9cc6de]">
      <span className="flex-1 text-[13px] font-bold text-[#c0c0c0]">
        {f} <span className="font-normal text-[#8a939b]">({count})</span>
      </span>
      {editable && (
        <>
          <button type="button" onClick={() => renameFolder(f)} className="text-[12px] text-[#8a939b] hover:text-[#f0f0f0]">
            Rename
          </button>
          <button type="button" onClick={() => deleteFolder(f)} className="text-[12px] text-[#8a939b] hover:text-[#f02020]">
            Delete
          </button>
        </>
      )}
    </div>
  );

  const loose = lib.items.filter((it) => !it.folder || !lib.folders.includes(it.folder));

  return (
    <div className="ui-modal" onClick={onClose}>
      {ask && <PromptDialog {...ask} onClose={() => setAsk(null)} />}
      <div className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-[#1e2328] border border-[#353e47]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#353e47]">
          <span className="font-bold text-[#f0f0f0] mr-2">Library</span>
          {(['cards', 'trees'] as const).map((k) => (
            <button key={k} type="button" onClick={() => setTab(k)} className={`ui-choice ${tab === k ? 'is-active' : ''}`}>
              {k === 'cards' ? `Vehicles (${libs.cards.items.length})` : `Tech trees (${libs.trees.items.length})`}
            </button>
          ))}
          <div className="flex-1" />
          <button type="button" onClick={() => downloadJson(lib, `thundercard_${tab === 'cards' ? 'vehicles' : 'trees'}.json`)} className="ui-btn" title="Download this library as a file">
            Export
          </button>
          <input type="file" ref={fileRef} accept=".json,application/json" onChange={(e) => importFile(e.target.files?.[0])} className="hidden" />
          <button type="button" onClick={() => fileRef.current?.click()} className="ui-btn" title="Add saves from an exported library file">
            Import
          </button>
          <button type="button" onClick={onClose} className="ui-btn">
            Close
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-[#353e47] bg-[#1b1f24]">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder={currentName}
            className="ui-input !w-60"
          />
          <select value={saveFolder} onChange={(e) => setSaveFolder(e.target.value)} className="ui-input !w-36">
            <option value="">No folder</option>
            {lib.folders.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <button type="button" onClick={save} className="ui-btn-primary">
            {tab === 'cards' ? 'Save current card' : 'Save current tree'}
          </button>
          <div className="flex-1" />
          <button type="button" onClick={addFolder} className="ui-btn">
            New folder…
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {!lib.items.length && !lib.folders.length && (
            <div className="py-6 text-[13px] text-[#8a939b]">
              Nothing saved yet. Name it, pick a folder if you like, and press {tab === 'cards' ? '"Save current card"' : '"Save current tree"'}.
            </div>
          )}
          {loose.length > 0 && <div className="mt-2">{loose.map(row)}</div>}
          {lib.folders.map((f) => {
            const inFolder = lib.items.filter((it) => it.folder === f);
            return (
              <div key={f}>
                {folderHead(f, inFolder.length, true)}
                {inFolder.map(row)}
              </div>
            );
          })}
          {tab === 'cards' && (
            <div>
              {folderHead('Built-in presets', VEHICLE_PRESETS.length, false)}
              {VEHICLE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => open(p)}
                  className="w-full text-left px-2 py-1.5 border-b border-[#2a3239] hover:bg-[#252b31] text-[13px] text-[#f0f0f0] truncate"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
