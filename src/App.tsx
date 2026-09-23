import React, { useState, useEffect, useRef } from 'react';
import { VehicleData } from './types/vehicle';
import { VEHICLE_PRESETS } from './data/presets';
import { ModernStatCard } from './components/StatCard/ModernStatCard';
import { LegacyStatCard } from './components/StatCard/LegacyStatCard';
import { FlagPickerModal } from './components/FlagPickerModal';
import { GameVehiclePicker } from './components/GameVehiclePicker';
import { ExportBar } from './components/ExportBar';
import { GeneralTab } from './components/Editor/GeneralTab';
import { WeaponsTab } from './components/Editor/WeaponsTab';
import { ProtectionTab } from './components/Editor/ProtectionTab';
import { EconomyTab } from './components/Editor/EconomyTab';
import { VisualTab } from './components/Editor/VisualTab';
import { TechTreeView, MyTree, NodePath, EMPTY_TREE, setCardAt } from './components/TechTreeView';
import { LibraryModal, autoSave } from './components/LibraryModal';
import { SettingsModal } from './components/SettingsModal';
import { SprocketModal } from './components/SprocketModal';
import { loadVehicleFromStorage, saveVehicleToStorage, loadJson, saveJson } from './utils/storage';
import { FORMATTERS } from './utils/format';
import { vehiclePicture } from './utils/exportImage';
import { cardFromLink } from './utils/share';

type EditorTab = 'general' | 'weapons' | 'protection' | 'economy' | 'visual';

const TABS: Array<{ id: EditorTab; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'weapons', label: 'Armament' },
  { id: 'protection', label: 'Protection' },
  { id: 'economy', label: 'Economy' },
  { id: 'visual', label: 'Appearance' },
];

const BLANK: VehicleData = {
  id: 'custom',
  name: 'Custom Vehicle',
  dataFreshness: 'custom_mockup',
  cardLayout: 'modern',
  vehicleClass: 'medium_tank',
  typeLabel: 'Medium Tank',
  rank: 'I',
  battleRating: '1.0',
  countryFlag: 'assets/game/flags/country_usa.avif',
  vehicleImage: '',
  flagBackdropOpacity: 1.0,
  flagBackdropScale: 1.0,
  statusType: 'standard',
  talisman: false,
  topCrewStar: true,
  headerTooltip: 'The information window can be closed with a mouse click.',
  primaryWeapon: { id: 'pw1', name: '', ammo: '' },
  secondaryWeapons: [],
  guidanceSpeedHorStock: '',
  guidanceSpeedHorAce: '',
  guidanceSpeedVertStock: '',
  guidanceSpeedVertAce: '',
  verticalGuidance: '',
  reloadingRate: '',
  protectionSummary: '',
  bulletproofRating: '',
  systems: '',
  ammoTypes: [],
  crew: '',
  mass: '',
  enginePower: '',
  maxSpeedForward: '',
  maxSpeedReverse: '',
  visibility: '',
  crewTrainCost: '',
  freeRepairs: '',
  repairCostPerMin: '',
  maxRepairCost: '',
  freeRepairTime: '',
  researchEfficiencyRanks: '',
  rpRewardPercent: '',
  rpMultiplier: '',
  slRewardPercent: '',
  slMultiplier: '',
  gameMode: 'realistic',
};

export const App: React.FC = () => {
  const [vehicle, setVehicle] = useState<VehicleData>(() => loadVehicleFromStorage() || VEHICLE_PRESETS[0]);
  const [activeTab, setActiveTab] = useState<EditorTab>('general');
  const [flagPickerOpen, setFlagPickerOpen] = useState(false);
  const [gamePickerOpen, setGamePickerOpen] = useState(false);
  const [view, setView] = useState<'card' | 'tree'>('card');
  const [myTree, setMyTree] = useState<MyTree>(() => loadJson<MyTree>('thundercard_my_tree') ?? EMPTY_TREE);
  const [editPath, setEditPath] = useState<NodePath | null>(null); // card being edited belongs to My tree
  const [treeMode, setTreeMode] = useState<'game' | 'mine'>('game');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [sprocketOpen, setSprocketOpen] = useState(false);
  const [treeKey, setTreeKey] = useState(0); // remounts the tree view so it re-reads nations after an import
  const [autoFormat, setAutoFormat] = useState(() => loadJson<boolean>('thundercard_autoformat') ?? true);
  const [autoSaveOn, setAutoSaveOn] = useState(() => loadJson<boolean>('thundercard_autosave') ?? true);
  const [hoverCards, setHoverCards] = useState(() => loadJson<boolean>('thundercard_hover_cards') ?? true);
  const [exportScale, setExportScale] = useState(() => loadJson<number>('thundercard_export_scale') ?? 2);
  const [saveNote, setSaveNote] = useState<'' | 'saving' | 'saved' | 'full'>(''); // auto-save status in the header
  const [dropping, setDropping] = useState(false); // a picture file is dragged over the card
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    saveVehicleToStorage(vehicle);
  }, [vehicle]);
  useEffect(() => {
    saveJson('thundercard_my_tree', myTree);
  }, [myTree]);
  useEffect(() => {
    saveJson('thundercard_autoformat', autoFormat);
  }, [autoFormat]);
  useEffect(() => {
    saveJson('thundercard_autosave', autoSaveOn);
  }, [autoSaveOn]);
  useEffect(() => {
    saveJson('thundercard_hover_cards', hoverCards);
  }, [hoverCards]);
  useEffect(() => {
    saveJson('thundercard_export_scale', exportScale);
  }, [exportScale]);

  // Auto-save: edits go into the Library save the card / tree was opened from, or once edited,
  // into a new save in the Library's Autosave folder. Pending edits are flushed before anything replaces them.
  type SaveIds = { cards: string | null; trees: string | null };
  const saveIds = useRef<SaveIds>({ cards: null, trees: null });
  const dirty = useRef({ cards: false, trees: false });
  const warnedFull = useRef(false);
  const flush = () => {
    if (!autoSaveOn) return;
    for (const kind of ['cards', 'trees'] as const) {
      if (!dirty.current[kind]) continue;
      dirty.current[kind] = false;
      const id =
        kind === 'cards'
          ? autoSave(kind, saveIds.current.cards, vehicle.name, vehicle)
          : autoSave(kind, saveIds.current.trees, myTree.name, myTree);
      if (id) {
        saveIds.current[kind] = id;
        setSaveNote('saved');
        continue;
      }
      setSaveNote('full');
      if (!warnedFull.current) {
        warnedFull.current = true;
        alert('Auto-save stopped: browser storage is full. Export or delete some saves in the Library.');
      }
    }
  };
  useEffect(() => {
    if (autoSaveOn && (dirty.current.cards || dirty.current.trees)) setSaveNote('saving');
    const t = setTimeout(flush, 1000);
    return () => clearTimeout(t);
  }, [vehicle, myTree, autoSaveOn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Undo / redo over the card and My tree. Typing merges into one step; every other change is its own step.
  type Snapshot = { vehicle: VehicleData; myTree: MyTree; ids: SaveIds };
  const undoStack = useRef<Snapshot[]>([]);
  const redoStack = useRef<Snapshot[]>([]);
  const lastChange = useRef(0);
  const [, rerender] = useState(0);
  const remember = (typing = false) => {
    const now = Date.now();
    if (!typing || now - lastChange.current > 700) {
      undoStack.current = [...undoStack.current.slice(-99), { vehicle, myTree, ids: { ...saveIds.current } }];
      redoStack.current = [];
      rerender((n) => n + 1);
    }
    lastChange.current = now;
  };
  const step = (from: React.MutableRefObject<Snapshot[]>, to: React.MutableRefObject<Snapshot[]>) => {
    const snap = from.current.pop();
    if (!snap) return;
    flush();
    to.current.push({ vehicle, myTree, ids: { ...saveIds.current } });
    setVehicle(snap.vehicle);
    setMyTree(snap.myTree);
    saveIds.current = snap.ids;
    dirty.current = { cards: snap.ids.cards !== null, trees: snap.ids.trees !== null }; // re-save what undo changed
    lastChange.current = 0;
    rerender((n) => n + 1);
  };
  const undo = () => step(undoStack, redoStack);
  const redo = () => step(redoStack, undoStack);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!(e.ctrlKey || e.metaKey) || (k !== 'z' && k !== 'y')) return;
      e.preventDefault();
      if (k === 'y' || e.shiftKey) redo();
      else undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Edits made in the editor; a card opened from My tree is saved back into the tree as you type
  const updateVehicle = (updates: Partial<VehicleData>) => {
    remember(true);
    dirty.current[editPath ? 'trees' : 'cards'] = true;
    const next = { ...vehicle, ...updates };
    setVehicle(next);
    if (editPath) setMyTree((t) => setCardAt(t, editPath, next));
  };
  const loadCard = (v: VehicleData, path: NodePath | null = null, saveId: string | null = null) => {
    flush();
    remember();
    saveIds.current.cards = saveId;
    dirty.current.cards = false;
    setEditPath(path);
    setVehicle(v);
    setView('card');
  };

  // A shared "#card=…" link opens that card (the address is cleaned so a reload keeps your edits)
  const loadCardRef = useRef(loadCard);
  loadCardRef.current = loadCard;
  useEffect(() => {
    const openLink = async () => {
      const card = await cardFromLink(location.hash);
      if (!card) return;
      history.replaceState(null, '', location.pathname + location.search);
      loadCardRef.current({ ...BLANK, ...card });
    };
    openLink();
    window.addEventListener('hashchange', openLink);
    return () => window.removeEventListener('hashchange', openLink);
  }, []);

  // Paste (Ctrl+V) or drop a picture: it becomes the card's vehicle picture
  const takePicture = async (file?: File) => {
    if (file?.type.startsWith('image/')) updateVehicle({ vehicleImage: await vehiclePicture(file) });
  };
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'));
      if (view !== 'card' || !file) return;
      e.preventDefault();
      takePicture(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-[#16191d] font-ptsans text-[14px]">
      <header className="flex flex-wrap items-center gap-2 px-3 py-1.5 border-b border-[#353e47] bg-[#1e2328]">
        <span className="font-bold text-[#f0f0f0] mr-3">ThunderCard</span>
        {(['card', 'tree'] as const).map((v) => (
          <button key={v} type="button" onClick={() => setView(v)} className={`ui-choice ${view === v ? 'is-active' : ''}`}>
            {v === 'card' ? 'Card' : 'Tech tree'}
          </button>
        ))}
        <span className="w-px h-5 bg-[#353e47] mx-1" />
        <button type="button" onClick={() => setGamePickerOpen(true)} className="ui-btn-primary">
          Load from game…
        </button>
        <button type="button" onClick={() => setSprocketOpen(true)} className="ui-btn" title="Make cards from Sprocket .blueprint files">
          Sprocket…
        </button>
        <button
          type="button"
          onClick={() => {
            flush(); // the Library reads what auto-save wrote
            setLibraryOpen(true);
          }}
          className="ui-btn"
          title="Saved vehicles and tech trees"
        >
          Library…
        </button>
        <button type="button" onClick={() => loadCard({ ...BLANK, id: 'custom_' + Date.now() })} className="ui-btn">
          New
        </button>
        <button type="button" onClick={undo} disabled={!undoStack.current.length} className="ui-btn" data-tip="Undo (Ctrl+Z)">
          Undo
        </button>
        <button type="button" onClick={redo} disabled={!redoStack.current.length} className="ui-btn" data-tip="Redo (Ctrl+Y)">
          Redo
        </button>
        <button type="button" onClick={() => setSettingsOpen(true)} className="ui-btn">
          Settings…
        </button>
        {autoSaveOn && saveNote && (
          <span
            className={`text-[12px] ${saveNote === 'full' ? 'text-[#fa4a38]' : 'text-[#8a939b]'}`}
            data-tip="Auto-save writes your edits into the Library"
          >
            {{ saving: 'Saving…', saved: 'Saved ✓', full: 'Not saved: storage full' }[saveNote]}
          </span>
        )}
        <div className="flex-1" />
        {view === 'card' && (
          <ExportBar
            vehicle={vehicle}
            onImportJson={(v) => loadCard(v)}
            onResetToDefault={() => {
              const found = VEHICLE_PRESETS.find((p) => p.id === vehicle.id);
              if (found) loadCard({ ...found });
            }}
            pixelRatio={exportScale}
          />
        )}
        <a
          href="https://hans21223.itch.io/sakurarequiem"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 pl-3 border-l border-[#353e47] text-[12px] leading-tight text-[#8a939b] hover:text-[#f0f0f0]"
          title="hans21223.itch.io/sakurarequiem"
        >
          Support my work by playing my game <span className="text-[#9cc6de]">Sakura Requiem</span>
        </a>
      </header>

      {view === 'tree' ? (
        <TechTreeView
          key={treeKey}
          mode={treeMode}
          onModeChange={setTreeMode}
          gameMode={vehicle.gameMode}
          currentCard={vehicle}
          myTree={myTree}
          onChangeMyTree={(t, replaced) => {
            if (replaced) flush(); // save the old tree before it goes
            remember();
            if (replaced) saveIds.current.trees = null;
            dirty.current.trees = true;
            setEditPath(null); // the tree changed shape; stop writing edits into an old slot
            setMyTree(t);
          }}
          onOpenCard={(card, path) => loadCard({ ...card }, path ?? null)}
          hoverCards={hoverCards}
          exportScale={exportScale}
        />
      ) : (
      <main className="flex-1 flex flex-col lg:flex-row min-h-0">
        <aside className="lg:w-[480px] shrink-0 flex flex-col border-r border-[#353e47] bg-[#1e2328] min-h-0">
          <nav className="flex border-b border-[#353e47]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 text-[13px] border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-[#9cc6de] text-[#f0f0f0]'
                    : 'border-transparent text-[#8a939b] hover:text-[#c0c0c0]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div
            className="flex-1 overflow-y-auto p-4"
            onBlur={(e) => {
              // Auto-format the field you just left ("130 38 50" → "130 / 38 / 50 mm")
              if (!autoFormat) return;
              const el = e.target as HTMLInputElement;
              const formatted = FORMATTERS[el.name as keyof VehicleData]?.(el.value);
              if (formatted !== undefined && formatted !== el.value) updateVehicle({ [el.name]: formatted });
            }}
          >
            {activeTab === 'general' && (
              <GeneralTab vehicle={vehicle} onChange={updateVehicle} onOpenFlagPicker={() => setFlagPickerOpen(true)} />
            )}
            {activeTab === 'weapons' && <WeaponsTab vehicle={vehicle} onChange={updateVehicle} autoFormat={autoFormat} />}
            {activeTab === 'protection' && <ProtectionTab vehicle={vehicle} onChange={updateVehicle} />}
            {activeTab === 'economy' && <EconomyTab vehicle={vehicle} onChange={updateVehicle} />}
            {activeTab === 'visual' && (
              <VisualTab vehicle={vehicle} onChange={updateVehicle} onOpenFlagPicker={() => setFlagPickerOpen(true)} />
            )}
          </div>
        </aside>

        <section
          className={`relative flex-1 overflow-auto flex flex-col items-center gap-3 p-8 bg-[#101316] ${dropping ? 'outline outline-2 -outline-offset-8 outline-dashed outline-[#9cc6de]' : ''}`}
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes('Files')) return;
            e.preventDefault();
            setDropping(true);
          }}
          onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setDropping(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDropping(false);
            takePicture(e.dataTransfer.files[0]);
          }}
        >
          {dropping && (
            <div className="absolute top-3 z-20 px-3 py-1 bg-[#0c1118] border border-[#4a5661] text-[13px] text-[#c0c0c0] pointer-events-none">
              Drop the picture to use it on the card
            </div>
          )}
          {editPath && (
            <div className="text-[13px] text-[#8a939b]">
              Editing a card from <span className="text-[#c0c0c0]">{myTree.name}</span>. Changes are saved into the tree.{' '}
              <button type="button" onClick={() => setView('tree')} className="text-[#9cc6de] hover:underline">
                Back to tree
              </button>
            </div>
          )}
          {vehicle.cardLayout === 'modern' ? (
            <ModernStatCard
              vehicle={vehicle}
              onViewArmor={() => setActiveTab('protection')}
              onViewXRay={() => setActiveTab('protection')}
              onImageChange={updateVehicle}
            />
          ) : (
            <LegacyStatCard vehicle={vehicle} onImageChange={updateVehicle} />
          )}
        </section>
      </main>
      )}

      <SprocketModal
        isOpen={sprocketOpen}
        base={vehicle}
        onOpenCard={(v) => loadCard(v)}
        onOpenTree={(t) => {
          flush();
          remember();
          saveIds.current.trees = null;
          dirty.current.trees = true;
          setEditPath(null);
          setMyTree(t);
          setTreeMode('mine');
          setTreeKey((k) => k + 1);
          setView('tree');
        }}
        onClose={() => setSprocketOpen(false)}
      />

      <LibraryModal
        isOpen={libraryOpen}
        initialTab={view === 'tree' ? 'trees' : 'cards'}
        card={vehicle}
        tree={myTree}
        onOpenCard={(v, id) => loadCard(v, null, id ?? null)}
        onOpenTree={(t, id) => {
          flush();
          remember();
          saveIds.current.trees = id ?? null;
          dirty.current.trees = false;
          setEditPath(null);
          setMyTree(t);
          setTreeMode('mine');
          setView('tree');
        }}
        onSaved={(kind, id) => {
          saveIds.current[kind] = id;
          dirty.current[kind] = false;
        }}
        onClose={() => setLibraryOpen(false)}
      />

      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          settings={[
            {
              label: 'Auto-save',
              hint: 'Edits are saved into the Library as you work: into the save you opened, otherwise into the Autosave folder (newest 30 kept).',
              value: autoSaveOn,
              onChange: setAutoSaveOn,
            },
            {
              label: 'Stat card on hover',
              hint: 'In the tech tree, hovering a vehicle shows its stat card, like in-game.',
              value: hoverCards,
              onChange: setHoverCards,
            },
            {
              label: 'Export size',
              hint: 'Size of Copy image, Save PNG / JPG and Save all cards, compared to the card on screen.',
              value: String(exportScale),
              options: [
                ['1', '1×'],
                ['2', '2×'],
                ['4', '4×'],
              ],
              onChange: (v: string) => setExportScale(+v),
            },
            {
              label: 'Auto-format',
              hint: 'Tidy numbers when you leave a field: 130 38 50 becomes 130 / 38 / 50 mm.',
              value: autoFormat,
              onChange: setAutoFormat,
            },
          ]}
        />
      )}

      <FlagPickerModal
        isOpen={flagPickerOpen}
        selectedFlag={vehicle.countryFlag}
        onSelect={(flagPath) => updateVehicle({ countryFlag: flagPath })}
        onClose={() => setFlagPickerOpen(false)}
      />
      <GameVehiclePicker
        isOpen={gamePickerOpen}
        gameMode={vehicle.gameMode}
        onSelect={(v) => loadCard({ ...v, cardLayout: vehicle.cardLayout })}
        onClose={() => setGamePickerOpen(false)}
      />
    </div>
  );
};
export default App;
