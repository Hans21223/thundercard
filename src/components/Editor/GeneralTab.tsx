import React from 'react';
import { VehicleData, VehicleClass, CardStatusType } from '../../types/vehicle';

interface GeneralTabProps {
  vehicle: VehicleData;
  onChange: (updates: Partial<VehicleData>) => void;
  onOpenFlagPicker: () => void;
}

const VEHICLE_CLASSES: Array<{ value: VehicleClass; label: string }> = [
  { value: 'light_tank', label: 'Light Tank' },
  { value: 'medium_tank', label: 'Medium Tank' },
  { value: 'heavy_tank', label: 'Heavy Tank' },
  { value: 'destroyer_tank', label: 'Tank Destroyer' },
  { value: 'spaa_tank', label: 'SPAA' },
  { value: 'aviation_fighter', label: 'Fighter Aircraft' },
  { value: 'aviation_strike', label: 'Strike Aircraft' },
  { value: 'aviation_bomber', label: 'Bomber' },
  { value: 'helicopter', label: 'Attack Helicopter' },
];

const RANKS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

const STATUSES: Array<{ id: CardStatusType; label: string }> = [
  { id: 'standard', label: 'Tech tree' },
  { id: 'locked', label: 'Locked' },
  { id: 'premium', label: 'Premium' },
  { id: 'pack', label: 'Pack' },
  { id: 'squadron', label: 'Squadron' },
  { id: 'event', label: 'Event' },
];

export const GeneralTab: React.FC<GeneralTabProps> = ({ vehicle, onChange, onOpenFlagPicker }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr_140px] gap-3">
        <div>
          <label className="ui-label">Name</label>
          <input
            type="text"
            name="name"
            value={vehicle.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="High Survivability Test Vehicle — Lightweight"
            className="ui-input"
          />
        </div>
        <div>
          <label className="ui-label">Short name (tech tree)</label>
          <input
            type="text"
            name="shortName"
            value={vehicle.shortName || ''}
            onChange={(e) => onChange({ shortName: e.target.value })}
            placeholder="HSTV-L"
            className="ui-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="ui-label">Class</label>
          <select
            name="vehicleClass"
            value={vehicle.vehicleClass}
            onChange={(e) => {
              const val = e.target.value as VehicleClass;
              const found = VEHICLE_CLASSES.find((c) => c.value === val);
              onChange({ vehicleClass: val, typeLabel: found ? found.label : vehicle.typeLabel });
            }}
            className="ui-input"
          >
            {VEHICLE_CLASSES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="ui-label">Type label</label>
          <input
            type="text"
            name="typeLabel"
            value={vehicle.typeLabel}
            onChange={(e) => onChange({ typeLabel: e.target.value })}
            placeholder="Light Tank"
            className="ui-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="ui-label">Rank</label>
          <select value={vehicle.rank} onChange={(e) => onChange({ rank: e.target.value })} className="ui-input">
            {RANKS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="ui-label">Battle rating</label>
          <input
            type="text"
            name="battleRating"
            value={vehicle.battleRating}
            onChange={(e) => onChange({ battleRating: e.target.value })}
            placeholder="12.0"
            className="ui-input"
          />
        </div>
        <div>
          <label className="ui-label">Flag</label>
          <button type="button" onClick={onOpenFlagPicker} className="ui-input flex items-center gap-2 text-left">
            {vehicle.countryFlag && <img src={vehicle.countryFlag} alt="" className="w-6 h-4 object-contain shrink-0" />}
            <span className="truncate text-[12px]">
              {vehicle.countryFlag.startsWith('data:')
                ? 'Custom'
                : vehicle.countryFlag
                  ? vehicle.countryFlag.split('/').pop()?.replace(/^country_|\.\w+$/g, '')
                  : 'Choose…'}
            </span>
          </button>
        </div>
      </div>

      <div className="ui-section">
        <span className="ui-heading">Status</span>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((st) => (
            <React.Fragment key={st.id}>
              <button
                type="button"
                // Tech tree and Locked mean "not owned"; the rest keep the Owned toggle as it is
                onClick={() => onChange(st.id === 'standard' || st.id === 'locked' ? { statusType: st.id, owned: false } : { statusType: st.id })}
                className={`ui-choice ${vehicle.statusType === st.id && !(st.id === 'standard' && vehicle.owned) ? 'is-active' : ''}`}
              >
                {st.label}
              </button>
              {st.id === 'standard' && (
                <button
                  type="button"
                  title='Hides Required RP and Price; repair time shows "(with crew)"'
                  onClick={() =>
                    onChange({ owned: !vehicle.owned, ...(vehicle.statusType === 'locked' ? { statusType: 'standard' as const } : {}) })
                  }
                  className={`ui-choice ${vehicle.owned ? 'is-active' : ''}`}
                >
                  Owned
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
        {vehicle.statusType !== 'standard' && (
          <div className="mt-3">
            <label className="ui-label">Status text (one line per row; [GE], [SL], [RP] become icons)</label>
            <textarea
              rows={2}
              name="statusText"
              value={vehicle.statusText || ''}
              onChange={(e) => onChange({ statusText: e.target.value })}
              placeholder={
                vehicle.statusType === 'locked'
                  ? 'Rank VII is locked.\nYou need to purchase 5 more vehicles of rank VI.'
                  : vehicle.statusType === 'pack'
                    ? 'This vehicle can only be obtained by purchasing a special pack.'
                    : ''
              }
              className="ui-input"
            />
          </div>
        )}
      </div>

      <div className="ui-section space-y-2">
        <label className="flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={vehicle.topCrewStar}
            onChange={(e) => onChange({ topCrewStar: e.target.checked })}
            className="ui-check"
          />
          <img src="assets/game/svg/spec_icon2.svg" alt="" className="w-4 h-4" />
          Show top crew values
        </label>
        <label className="flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={vehicle.talisman}
            onChange={(e) => onChange({ talisman: e.target.checked })}
            className="ui-check"
          />
          <img src="assets/game/svg/item_type_talisman.svg" alt="" className="w-4 h-4" />
          Talisman
        </label>
      </div>

      <div className="ui-section">
        <label className="ui-label">Top hint</label>
        <input
          type="text"
          name="headerTooltip"
          value={vehicle.headerTooltip}
          onChange={(e) => onChange({ headerTooltip: e.target.value })}
          placeholder="The information window can be closed with a mouse click."
          className="ui-input"
        />
      </div>
    </div>
  );
};
