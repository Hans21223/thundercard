import React, { useState, useEffect } from 'react';
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
import { loadVehicleFromStorage, saveVehicleToStorage } from './utils/storage';

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

  useEffect(() => {
    saveVehicleToStorage(vehicle);
  }, [vehicle]);

  const updateVehicle = (updates: Partial<VehicleData>) => setVehicle((prev) => ({ ...prev, ...updates }));

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-[#16191d] font-ptsans text-[14px]">
      <header className="flex flex-wrap items-center gap-2 px-3 py-1.5 border-b border-[#353e47] bg-[#1e2328]">
        <span className="font-bold text-[#f0f0f0] mr-3">ThunderCard</span>
        <button type="button" onClick={() => setGamePickerOpen(true)} className="ui-btn-primary">
          Load from game…
        </button>
        <select
          value=""
          onChange={(e) => {
            const preset = VEHICLE_PRESETS.find((p) => p.id === e.target.value);
            if (preset) setVehicle({ ...preset });
          }}
          className="ui-input !w-44"
        >
          <option value="" disabled>
            Presets…
          </option>
          {VEHICLE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name.length > 40 ? p.name.slice(0, 40) + '…' : p.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setVehicle({ ...BLANK, id: 'custom_' + Date.now() })} className="ui-btn">
          New
        </button>
        <div className="flex-1" />
        <ExportBar
          vehicle={vehicle}
          onImportJson={setVehicle}
          onResetToDefault={() => {
            const found = VEHICLE_PRESETS.find((p) => p.id === vehicle.id);
            if (found) setVehicle({ ...found });
          }}
        />
      </header>

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
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'general' && (
              <GeneralTab vehicle={vehicle} onChange={updateVehicle} onOpenFlagPicker={() => setFlagPickerOpen(true)} />
            )}
            {activeTab === 'weapons' && <WeaponsTab vehicle={vehicle} onChange={updateVehicle} />}
            {activeTab === 'protection' && <ProtectionTab vehicle={vehicle} onChange={updateVehicle} />}
            {activeTab === 'economy' && <EconomyTab vehicle={vehicle} onChange={updateVehicle} />}
            {activeTab === 'visual' && (
              <VisualTab vehicle={vehicle} onChange={updateVehicle} onOpenFlagPicker={() => setFlagPickerOpen(true)} />
            )}
          </div>
        </aside>

        <section className="flex-1 overflow-auto flex justify-center items-start p-8 bg-[#101316]">
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

      <FlagPickerModal
        isOpen={flagPickerOpen}
        selectedFlag={vehicle.countryFlag}
        onSelect={(flagPath) => updateVehicle({ countryFlag: flagPath })}
        onClose={() => setFlagPickerOpen(false)}
      />
      <GameVehiclePicker
        isOpen={gamePickerOpen}
        gameMode={vehicle.gameMode}
        onSelect={(v) => setVehicle({ ...v, cardLayout: vehicle.cardLayout })}
        onClose={() => setGamePickerOpen(false)}
      />
    </div>
  );
};
export default App;
