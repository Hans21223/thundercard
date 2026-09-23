import React from 'react';
import { VehicleData, GameMode } from '../../types/vehicle';

interface EconomyTabProps {
  vehicle: VehicleData;
  onChange: (updates: Partial<VehicleData>) => void;
}

export const EconomyTab: React.FC<EconomyTabProps> = ({ vehicle, onChange }) => {
  return (
    <div className="space-y-4">
      {/* Game Mode Selector */}
      <div className="ui-section">
        <span className="ui-heading">Game mode</span>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: 'realistic', label: 'Realistic' },
              { id: 'arcade', label: 'Arcade' },
              { id: 'simulator', label: 'Simulator' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange({ gameMode: m.id as GameMode })}
              className={`ui-choice ${vehicle.gameMode === m.id ? 'is-active' : ''}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Research & Progress */}
      <div className="ui-section space-y-3">
        <span className="ui-heading">Research</span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="ui-label">Required RP</label>
            <input
              type="text"
              name="requiredRP"
              value={vehicle.requiredRP}
              onChange={(e) => onChange({ requiredRP: e.target.value })}
              placeholder="350,000"
              className="ui-input"
            />
          </div>
          <div>
            <label className="ui-label">Efficient progress from</label>
            <input
              type="text"
              name="efficientProgressFrom"
              value={vehicle.efficientProgressFrom}
              onChange={(e) => onChange({ efficientProgressFrom: e.target.value })}
              placeholder="M10 Booker"
              className="ui-input"
            />
          </div>
          <div>
            <label className="ui-label">Bonus</label>
            <input
              type="text"
              name="efficientProgressBonus"
              value={vehicle.efficientProgressBonus}
              onChange={(e) => onChange({ efficientProgressBonus: e.target.value })}
              placeholder="110%"
              className="ui-input"
            />
          </div>
        </div>

        <div>
          <label className="ui-label">
            Max research efficiency
          </label>
          <input
            type="text"
            name="researchEfficiencyRanks"
            value={vehicle.researchEfficiencyRanks}
            onChange={(e) => onChange({ researchEfficiencyRanks: e.target.value })}
            placeholder="VI – VIII Ranks"
            className="ui-input"
          />
        </div>
      </div>

      {/* Purchase & Repair Economy */}
      <div className="ui-section space-y-3">
        <span className="ui-heading">Cost & repair</span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="ui-label">Price</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="price"
                value={vehicle.price}
                onChange={(e) => onChange({ price: e.target.value })}
                placeholder="950,000"
                className="ui-input flex-1"
              />
              <select
                name="priceCurrency"
                value={vehicle.priceCurrency}
                onChange={(e) => onChange({ priceCurrency: e.target.value as 'sl' | 'ge' })}
                className="ui-input w-24"
              >
                <option value="sl">SL</option>
                <option value="ge">GE</option>
              </select>
            </div>
            <label className="flex items-center gap-2 mt-1.5 text-[12px] text-[#8a939b]">
              <input
                type="checkbox"
                checked={!!vehicle.cantAfford}
                onChange={(e) => onChange({ cantAfford: e.target.checked })}
                className="ui-check"
              />
              Can't afford (price in red)
            </label>
          </div>

          <div>
            <label className="ui-label">Crew train cost</label>
            <input
              type="text"
              name="crewTrainCost"
              value={vehicle.crewTrainCost}
              onChange={(e) => onChange({ crewTrainCost: e.target.value })}
              placeholder="270,000"
              className="ui-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div>
            <label className="ui-label">Free repairs</label>
            <input
              type="text"
              name="freeRepairs"
              value={vehicle.freeRepairs}
              onChange={(e) => onChange({ freeRepairs: e.target.value })}
              placeholder="10"
              className="ui-input"
            />
          </div>
          <div>
            <label className="ui-label">Repair, SL/min</label>
            <input
              type="text"
              name="repairCostPerMin"
              value={vehicle.repairCostPerMin}
              onChange={(e) => onChange({ repairCostPerMin: e.target.value })}
              placeholder="976"
              className="ui-input"
            />
          </div>
          <div>
            <label className="ui-label">Max repair cost</label>
            <input
              type="text"
              name="maxRepairCost"
              value={vehicle.maxRepairCost}
              onChange={(e) => onChange({ maxRepairCost: e.target.value })}
              placeholder="3,550"
              className="ui-input"
            />
          </div>
          <div>
            <label className="ui-label">Free repair time</label>
            <input
              type="text"
              name="freeRepairTime"
              value={vehicle.freeRepairTime}
              onChange={(e) => onChange({ freeRepairTime: e.target.value })}
              placeholder="14d 06h 21m"
              className="ui-input"
            />
          </div>
        </div>
      </div>

      {/* Rewards Multipliers */}
      <div className="ui-section space-y-3">
        <span className="ui-heading">Rewards</span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[13px]">RP</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="ui-label">Percentage</label>
                <input
                  type="text"
                  name="rpRewardPercent"
                  value={vehicle.rpRewardPercent}
                  onChange={(e) => onChange({ rpRewardPercent: e.target.value })}
                  placeholder="244%"
                  className="ui-input"
                />
              </div>
              <div>
                <label className="ui-label">Multiplier</label>
                <input
                  type="text"
                  name="rpMultiplier"
                  value={vehicle.rpMultiplier}
                  onChange={(e) => onChange({ rpMultiplier: e.target.value })}
                  placeholder="2.44×(100%)"
                  className="ui-input"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[13px]">SL</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="ui-label">Percentage</label>
                <input
                  type="text"
                  name="slRewardPercent"
                  value={vehicle.slRewardPercent}
                  onChange={(e) => onChange({ slRewardPercent: e.target.value })}
                  placeholder="160%"
                  className="ui-input"
                />
              </div>
              <div>
                <label className="ui-label">Multiplier</label>
                <input
                  type="text"
                  name="slMultiplier"
                  value={vehicle.slMultiplier}
                  onChange={(e) => onChange({ slMultiplier: e.target.value })}
                  placeholder="1.6×(100%)"
                  className="ui-input"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
