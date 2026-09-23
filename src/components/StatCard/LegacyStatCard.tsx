import React from 'react';
import { VehicleData } from '../../types/vehicle';
import { CLASS_METAS, PictureBox } from './CardHeader';

// The "Simple" 555px card layout (kept as cardLayout 'legacy' so saved JSON still loads).
// The game's PT Sans comes in regular weight only (no bold or italic file), so emphasis is by colour, not by a
// browser-faked bold that smears the letters. Icons are the game's own SVGs, like the In-game card's.

interface LegacyStatCardProps {
  vehicle: VehicleData;
  onImageChange?: (u: Partial<VehicleData>) => void;
}

const SL = 'assets/game/svg/item_type_warpoints.svg';
const RP = 'assets/game/svg/item_type_rp.svg';
const GE = 'assets/game/svg/item_type_eagles.svg';
const LABEL = 'text-[#8f989f]';
const VALUE = 'text-[#f0f0f0]';

// Empty values hide the row instead of showing sample numbers.
const Row: React.FC<{ label: string; value?: React.ReactNode; icon?: string }> = ({ label, value, icon }) =>
  value ? (
    <div className="flex justify-between items-center">
      <span className={LABEL}>{label}</span>
      <span className={`flex items-center gap-1 ${VALUE}`}>
        {value}
        {icon && <img src={icon} alt="" className="w-3.5 h-3.5" />}
      </span>
    </div>
  ) : null;

export const LegacyStatCard: React.FC<LegacyStatCardProps> = ({ vehicle: v, onImageChange }) => {
  const classMeta = CLASS_METAS[v.vehicleClass] || CLASS_METAS.medium_tank;

  let borderColor = '#57767e';
  if (v.statusType === 'squadron') borderColor = '#4b712f';
  else if (v.statusType === 'pack' || v.statusType === 'premium') borderColor = '#5b4622';

  return (
    <div
      id="statcard-preview-target"
      className="w-[555px] p-4 text-white font-ptsans select-none relative shadow-2xl"
      style={{ backgroundColor: '#2d343c', border: `3.4px solid ${borderColor}`, borderRadius: '4px' }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2">
        <div className="flex-1">
          <h2 className={`text-[19px] leading-tight ${VALUE}`}>{v.name || 'Vehicle Name'}</h2>
          <div className="flex items-center gap-1.5 mt-1 text-[16px]" style={{ color: classMeta.color }}>
            <span className="inline-flex [&>svg]:w-[18px] [&>svg]:h-auto">{classMeta.renderIcon()}</span>
            <span>{v.typeLabel || 'Medium Tank'}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {v.countryFlag && (
            <img src={v.countryFlag} alt="" className="h-7 w-auto object-contain border border-black/40 rounded-sm" />
          )}
          <div className="flex items-center gap-3 text-[13.5px]">
            <div>
              <span className={LABEL}>Rank: </span>
              <span className={VALUE}>{v.rank}</span>
            </div>
            <div>
              <span className={LABEL}>Battle rating: </span>
              <span className={VALUE}>{v.battleRating}</span>
            </div>
          </div>
        </div>
      </div>

      <PictureBox
        v={v}
        onChange={onImageChange}
        className="w-full h-[180px] bg-[#22272e] rounded my-2 flex items-center justify-center border border-black/40"
        imgClassName="max-h-[160px] max-w-[90%] object-contain"
      />

      {v.statusType === 'squadron' && <div className="text-center text-[#a1d26a] text-[14px] my-1">Squadron vehicle</div>}
      {v.statusType === 'pack' && (
        <div className="text-center text-[#f4d776] text-[14px] my-1">
          Pack vehicle
          <div className="text-[12px] text-[#c0c0c0]">
            {v.statusText || 'This vehicle can only be obtained by purchasing a special pack.'}
          </div>
        </div>
      )}
      {v.statusType === 'premium' && (
        <div className="text-center text-[#f4d776] text-[13.5px] my-1 flex items-center justify-center gap-1">
          <span>You can purchase this vehicle for</span>
          <span className="text-[#f74a38]">{v.price}</span>
          <img src={GE} alt="GE" className="w-3.5 h-3.5" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[13px] my-2 pt-2 border-t border-white/10">
        <div className="flex flex-col gap-1">
          <Row label="Turret Rotation Speed:" value={v.guidanceSpeedHorStock && `${v.guidanceSpeedHorStock}°/s`} />
          <Row label="Vertical Guidance:" value={v.verticalGuidance} />
          <Row label="Reloading rate:" value={v.reloadingRate} />
          <div className="mt-2 pt-2 border-t border-white/5 flex flex-col gap-1">
            <Row label="Hull Armor:" value={v.hullArmor} />
            <Row label="Turret Armor:" value={v.turretArmor} />
            <Row label="Armor Penetration:" value={v.armorPenetration} />
            <Row label="at distances:" value={v.atDistances} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Row label="Crew:" value={v.crew} />
          <Row label="Mass:" value={v.mass} />
          <Row label="Engine power:" value={v.enginePower} />
          <Row label="Max Speed:" value={v.maxSpeedForward && `${v.maxSpeedForward} km/h`} />
          <Row label="Visibility:" value={v.visibility} />
          <div className="mt-2 pt-2 border-t border-white/5 flex flex-col gap-1">
            <Row label="Crew train cost:" value={v.crewTrainCost} icon={SL} />
            <Row label="Back-ups:" value={v.freeRepairs} icon="assets/images/backups.png" />
            <Row label="Max repair cost:" value={v.maxRepairCost} icon={v.maxRepairCost === 'Free' ? undefined : SL} />
            <Row label="Free repair time:" value={v.freeRepairTime} />
          </div>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-1 text-[13px]">
        <Row label="Max vehicle research efficiency:" value={v.researchEfficiencyRanks} />
        {[
          [v.rpRewardPercent, v.rpMultiplier, RP],
          [v.slRewardPercent, v.slMultiplier, SL],
        ].map(([pct, mul, icon]) =>
          pct ? (
            <div key={icon} className="flex justify-between items-center">
              <div className={`flex items-center gap-1 ${LABEL}`}>
                Reward <span className={VALUE}>{pct}</span>
                <span className="flex items-center">
                  <img src={icon} alt="" className="w-3.5 h-3.5" />:
                </span>
              </div>
              <span className="text-[#c0c0c0]">{mul}</span>
            </div>
          ) : null
        )}
      </div>

      <div className={`mt-2 text-center text-[12px] ${LABEL}`}>
        {v.gameMode === 'arcade' ? 'Arcade Battles' : v.gameMode === 'simulator' ? 'Simulator Battles' : 'Realistic Battles'}
      </div>
    </div>
  );
};
