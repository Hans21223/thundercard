import React from 'react';
import { VehicleData, VehicleClass } from '../../types/vehicle';

interface LegacyStatCardProps {
  vehicle: VehicleData;
}

const CLASS_COLORS: Record<VehicleClass, string> = {
  light_tank: '#ffffff',
  medium_tank: '#ffaaaa',
  heavy_tank: '#ff6666',
  destroyer_tank: '#a2c79f',
  spaa_tank: '#c6a0ff',
  aviation_fighter: '#ffaaaa',
  aviation_strike: '#a2c79f',
  aviation_bomber: '#ff6666',
  helicopter: '#ffffff',
};

const CLASS_ICONS: Record<VehicleClass, string> = {
  light_tank: 'assets/game/svg/def_light_tank_radar.svg',
  medium_tank: 'assets/game/svg/def_medium_tank_radar.svg',
  heavy_tank: 'assets/game/svg/def_heavy_tank_radar.svg',
  destroyer_tank: 'assets/game/svg/def_tank_destroyer_radar.svg',
  spaa_tank: 'assets/game/svg/def_spaa_radar.svg',
  aviation_fighter: 'assets/game/svg/def_fighter_radar.svg',
  aviation_strike: 'assets/game/svg/def_fighter_radar.svg',
  aviation_bomber: 'assets/game/svg/def_heavy_tank_radar.svg',
  helicopter: 'assets/game/svg/def_light_tank_radar.svg',
};

export const LegacyStatCard: React.FC<LegacyStatCardProps> = ({ vehicle }) => {
  const typeColor = CLASS_COLORS[vehicle.vehicleClass] || '#ffffff';
  const classIcon = CLASS_ICONS[vehicle.vehicleClass] || 'assets/game/svg/def_medium_tank_radar.svg';

  // Border and header banner color based on vehicle status
  let borderColor = '#57767e'; // regular standard
  if (vehicle.statusType === 'squadron') borderColor = '#4b712f';
  else if (vehicle.statusType === 'pack' || vehicle.statusType === 'premium') borderColor = '#5b4622';

  return (
    <div
      id="statcard-preview-target"
      className="w-[555px] p-4 text-white font-ptsans select-none relative shadow-2xl"
      style={{
        backgroundColor: '#2d343c',
        border: `3.4px solid ${borderColor}`,
        borderRadius: '4px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2">
        <div className="flex-1">
          <h2 className="text-[18.35px] font-bold text-white tracking-tight leading-tight">
            {vehicle.name || 'Vehicle Name'}
          </h2>
          <div className="flex items-center gap-1.5 mt-1">
            <img src={classIcon} alt="" className="w-5 h-5 object-contain" />
            <span className="text-[16px] font-medium" style={{ color: typeColor }}>
              {vehicle.typeLabel || 'Medium Tank'}
            </span>
          </div>
        </div>

        {/* Flag and Rank/BR */}
        <div className="flex flex-col items-end gap-1">
          {vehicle.countryFlag && (
            <img
              src={vehicle.countryFlag}
              alt=""
              className="h-7 w-auto object-contain border border-black/40 rounded-sm"
            />
          )}
          <div className="flex items-center gap-3 text-[13.5px] text-gray-300">
            <div>
              <span className="text-gray-400">Rank: </span>
              <span className="font-bold text-white">{vehicle.rank}</span>
            </div>
            <div>
              <span className="text-gray-400">Battle rating: </span>
              <span className="font-bold text-white">{vehicle.battleRating}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Image Preview */}
      <div className="relative w-full h-[180px] bg-[#22272e] rounded my-2 flex items-center justify-center overflow-hidden border border-black/40">
        {vehicle.vehicleImage && (
          <img
            src={vehicle.vehicleImage}
            alt={vehicle.name}
            className="max-h-[160px] max-w-[90%] object-contain"
          />
        )}
      </div>

      {/* Status banner */}
      {vehicle.statusType === 'squadron' && (
        <div className="text-center text-[#a1d26a] font-bold text-[14px] my-1">
          Squadron vehicle
        </div>
      )}
      {vehicle.statusType === 'pack' && (
        <div className="text-center text-[#f4d776] font-bold text-[14px] my-1">
          Pack vehicle
          <div className="text-[11.5px] font-normal text-gray-300">
            {vehicle.statusText || 'This vehicle can only be obtained by purchasing a special pack.'}
          </div>
        </div>
      )}
      {vehicle.statusType === 'premium' && (
        <div className="text-center text-[#f4d776] text-[13.5px] my-1 flex items-center justify-center gap-1">
          <span>You can purchase this vehicle for</span>
          <span className="text-[#f74a38] font-bold">{vehicle.price || '7,480'}</span>
          <img src="assets/images/ge.png" alt="GE" className="w-4 h-4 inline" />
          <span>.</span>
        </div>
      )}

      {/* Legacy 2-column or 3-column stats */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[13px] my-2 pt-2 border-t border-white/10">
        {/* Left column */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="text-gray-400">Turret Rotation Speed:</span>
            <span className="font-bold text-white">{vehicle.guidanceSpeedHorStock || '18.4'}°/s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Vertical Guidance:</span>
            <span className="font-bold text-white">{vehicle.verticalGuidance || '-10 / 20'}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Reloading rate:</span>
            <span className="font-bold text-white">{vehicle.reloadingRate || '6.5'} s</span>
          </div>

          {/* Legacy Armor */}
          <div className="mt-2 pt-2 border-t border-white/5 flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Hull Armor:</span>
              <span className="font-bold text-white">{vehicle.hullArmor || '130 / 38 / 50 mm'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Turret Armor:</span>
              <span className="font-bold text-white">{vehicle.turretArmor || '270 / 80 / 58 mm'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Armor Penetration:</span>
              <span className="font-bold text-white">{vehicle.armorPenetration || '396 / 394 / 387 mm'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">at distances:</span>
              <span className="text-gray-300">{vehicle.atDistances || '10 / 100 / 500 m'}</span>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="text-gray-400">Crew:</span>
            <span className="font-bold text-white">{vehicle.crew || '4'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Mass:</span>
            <span className="font-bold text-white">{vehicle.mass || '69.0'} t</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Engine power:</span>
            <span className="font-bold text-white">{vehicle.enginePower || '1144 hp at 2300 rpm'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Max Speed:</span>
            <span className="font-bold text-white">{vehicle.maxSpeedForward || '59'} km/h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Visibility:</span>
            <span className="font-bold text-white">{vehicle.visibility || '87'} %</span>
          </div>

          {/* Economy */}
          <div className="mt-2 pt-2 border-t border-white/5 flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Crew train cost:</span>
              <span className="flex items-center gap-1 font-bold text-white">
                <span>{vehicle.crewTrainCost || '300,000'}</span>
                <img src="assets/images/sl_flat.png" alt="" className="w-4 h-4 inline" />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Back-ups:</span>
              <span className="flex items-center gap-1 font-bold text-white">
                <span>{vehicle.freeRepairs || '2'}</span>
                <img src="assets/images/backups.png" alt="" className="w-4 h-4 inline" />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Max repair cost:</span>
              <span className="flex items-center gap-1 font-bold text-white">
                <span>{vehicle.maxRepairCost || '6,684'}</span>
                <img src="assets/images/sl_flat.png" alt="" className="w-4 h-4 inline" />
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Free repair time:</span>
              <span className="font-bold text-white">{vehicle.freeRepairTime || '19d 22h 55m'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rewards line */}
      <div className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-1 text-[13px]">
        <div className="flex justify-between">
          <span className="text-gray-400">Max vehicle research efficiency:</span>
          <span className="font-bold text-white">{vehicle.researchEfficiencyRanks || 'VI — VIII Ranks'}</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1 text-gray-400">
            <span>Reward</span>
            <span className="text-white font-bold">{vehicle.rpRewardPercent || '476%'}</span>
            <img src="assets/images/rp.png" alt="" className="w-4 h-4 inline" />
            <span>:</span>
          </div>
          <span className="text-gray-300 font-medium">{vehicle.rpMultiplier || '2.38 (100% + 100%)'}</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1 text-gray-400">
            <span>Reward</span>
            <span className="text-white font-bold">{vehicle.slRewardPercent || '285%'}</span>
            <img src="assets/images/sl_flat.png" alt="" className="w-4 h-4 inline" />
            <span>:</span>
          </div>
          <span className="text-gray-300 font-medium">{vehicle.slMultiplier || '1.9 (100% + 50%)'}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2 text-center text-gray-400 text-[12px] italic">
        Realistic Battles
      </div>
    </div>
  );
};
