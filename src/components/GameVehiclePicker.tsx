import React, { useEffect, useMemo, useState } from 'react';
import { GameMode, VehicleData } from '../types/vehicle';
import { GameCatalog, gameToVehicle, loadGameCatalog } from '../data/gameVehicles';

interface GameVehiclePickerProps {
  isOpen: boolean;
  gameMode: GameMode;
  onSelect: (vehicle: VehicleData) => void;
  onClose: () => void;
}

export const GameVehiclePicker: React.FC<GameVehiclePickerProps> = ({ isOpen, gameMode, onSelect, onClose }) => {
  const [data, setData] = useState<GameCatalog | null>(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [country, setCountry] = useState('all');

  useEffect(() => {
    if (isOpen && !data) loadGameCatalog().then(setData, (e) => setError(String(e)));
  }, [isOpen, data]);

  const countries = useMemo(() => [...new Set(data?.vehicles.map((v) => v.country))], [data]);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return (data?.vehicles ?? []).filter(
      (v) =>
        (country === 'all' || v.country === country) &&
        (v.short.toLowerCase().includes(q) || v.card.name!.toLowerCase().includes(q) || v.card.id!.toLowerCase().includes(q))
    );
  }, [data, searchTerm, country]);

  if (!isOpen) return null;

  return (
    <div className="ui-modal" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-[#1e2328] border border-[#353e47]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#353e47]">
          <span className="font-bold text-[#f0f0f0] shrink-0">Load from game</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vehicles"
            className="ui-input flex-1"
            autoFocus
          />
          <button type="button" onClick={onClose} className="ui-btn">
            Close
          </button>
        </div>

        <div className="flex flex-wrap gap-1 px-4 py-2 border-b border-[#353e47]">
          {['all', ...countries].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCountry(c)}
              title={c.replace('country_', '')}
              className={`ui-choice h-7 !py-0 ${country === c ? 'is-active' : ''}`}
            >
              {c === 'all' ? 'All' : <img src={`assets/game/flags/${c}.avif`} alt={c} className="h-4 w-7 object-contain" />}
            </button>
          ))}
        </div>

        <div className="p-3 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {error && <div className="col-span-full py-8 text-center text-[#f02020]">{error}</div>}
          {!data && !error && <div className="col-span-full py-8 text-center">Loading…</div>}
          {filtered.map((v) => (
            <button
              key={v.card.id}
              type="button"
              onClick={() => {
                onSelect(gameToVehicle(v, gameMode, data!.version));
                onClose();
              }}
              className="ui-choice flex items-center gap-3"
            >
              <img src={v.card.vehicleImage} alt="" loading="lazy" className="w-20 h-10 object-contain shrink-0" />
              <div className="min-w-0">
                <div className="truncate text-[13px] text-[#c0c0c0]">{v.short}</div>
                <div className="text-[12px]">
                  {v.card.typeLabel} · Rank {v.card.rank} · BR <span className="text-white">{v.modes[gameMode].battleRating}</span>
                  {v.card.statusType === 'premium' && <span className="text-[#f9db78]"> · Premium</span>}
                </div>
              </div>
            </button>
          ))}
          {data && filtered.length === 0 && <div className="col-span-full py-8 text-center">No vehicles match.</div>}
        </div>

        {data && (
          <div className="px-4 py-2 border-t border-[#353e47] text-[12px] text-[#8a939b]">
            {filtered.length} of {data.vehicles.length} vehicles · War Thunder {data.version} ·{' '}
            {gameMode === 'realistic' ? 'Realistic' : gameMode === 'arcade' ? 'Arcade' : 'Simulator'} battles
          </div>
        )}
      </div>
    </div>
  );
};
