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
import { LibraryModal } from './components/LibraryModal';
import { SprocketModal } from './components/SprocketModal';
import { loadVehicleFromStorage, saveVehicleToStorage, loadJson, saveJson } from './utils/storage';
import { FORMATTERS } from './utils/format';

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

  useEffect(() => {
    saveVehicleToStorage(vehicle);
  }, [vehicle]);
  useEffect(() => {
    saveJson('thundercard_my_tree', myTree);
  }, [myTree]);
  useEffect(() => {
    saveJson('thundercard_autoformat', autoFormat);
  }, [autoFormat]);

  // Undo / redo over the card and My tree. Typing merges into one step; every other change is its own step.
  type Snapshot = { vehicle: VehicleData; myTree: MyTree };
  const undoStack = useRef<Snapshot[]>([]);
  const redoStack = useRef<Snapshot[]>([]);
  const lastChange = useRef(0);
  const [, rerender] = useState(0);
  const remember = (typing = false) => {
    const now = Date.now();
    if (!typing || now - lastChange.current > 700) {
      undoStack.current = [...undoStack.current.slice(-99), { vehicle, myTree }];
      redoStack.current = [];
      rerender((n) => n + 1);
    }
    lastChange.current = now;
  };
  const step = (from: React.MutableRefObject<Snapshot[]>, to: React.MutableRefObject<Snapshot[]>) => {
    const snap = from.current.pop();
    if (!snap) return;
    to.current.push({ vehicle, myTree });
    setVehicle(snap.vehicle);
    setMyTree(snap.myTree);
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
    const next = { ...vehicle, ...updates };
    setVehicle(next);
    if (editPath) setMyTree((t) => setCardAt(t, editPath, next));
  };
  const loadCard = (v: VehicleData, path: NodePath | null = null) => {
    remember();
    setEditPath(path);
    setVehicle(v);
    setView('card');
  };

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
        <button type="button" onClick={() => setLibraryOpen(true)} className="ui-btn" title="Saved vehicles and tech trees">
          Library…
        </button>
        <button type="button" onClick={() => loadCard({ ...BLANK, id: 'custom_' + Date.now() })} className="ui-btn">
          New
        </button>
        <button type="button" onClick={undo} disabled={!undoStack.current.length} className="ui-btn" title="Undo (Ctrl+Z)">
          Undo
        </button>
        <button type="button" onClick={redo} disabled={!redoStack.current.length} className="ui-btn" title="Redo (Ctrl+Y)">
          Redo
        </button>
        <div className="flex-1" />
        {view === 'card' && (
          <ExportBar
            vehicle={vehicle}
            onImportJson={(v) => loadCard(v)}
            onResetToDefault={() => {
              const found = VEHICLE_PRESETS.find((p) => p.id === vehicle.id);
              if (found) loadCard({ ...found });
            }}
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
          onChangeMyTree={(t) => {
            remember();
            setEditPath(null); // the tree changed shape; stop writing edits into an old slot
            setMyTree(t);
          }}
          onOpenCard={(card, path) => loadCard({ ...card }, path ?? null)}
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
          <label className="flex items-center gap-2 px-4 py-2 border-t border-[#353e47] text-[12px] text-[#8a939b]">
            <input type="checkbox" checked={autoFormat} onChange={(e) => setAutoFormat(e.target.checked)} className="ui-check" />
            Auto-format numbers when you leave a field (130 38 50 becomes 130 / 38 / 50 mm)
          </label>
        </aside>

        <section className="flex-1 overflow-auto flex flex-col items-center gap-3 p-8 bg-[#101316]">
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
            />
          ) : (
            <LegacyStatCard vehicle={vehicle} />
          )}
        </section>
      </main>
      )}

      <SprocketModal
        isOpen={sprocketOpen}
        base={vehicle}
        onOpenCard={(v) => loadCard(v)}
        onOpenTree={(t) => {
          remember();
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
        onOpenCard={(v) => loadCard(v)}
        onOpenTree={(t) => {
          remember();
          setEditPath(null);
          setMyTree(t);
          setTreeMode('mine');
          setView('tree');
        }}
        onClose={() => setLibraryOpen(false)}
      />

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
