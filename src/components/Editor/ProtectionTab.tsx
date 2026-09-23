import React from 'react';
import { VehicleData } from '../../types/vehicle';

interface ProtectionTabProps {
  vehicle: VehicleData;
  onChange: (updates: Partial<VehicleData>) => void;
}

export const ProtectionTab: React.FC<ProtectionTabProps> = ({ vehicle, onChange }) => {
  return (
    <div className="space-y-4">
      {/* Modern Protection & Armor description */}
      <div className="ui-section">
        <span className="ui-heading">Protection</span>
        <div className="grid grid-cols-2 gap-3 items-start">
          <div>
            <label className="ui-label">Armor types, one per line</label>
            <textarea
              rows={3}
              name="protectionSummary"
              value={vehicle.protectionSummary}
              onChange={(e) => onChange({ protectionSummary: e.target.value })}
              placeholder={'Steel armor\nAluminum armor'}
              className="ui-input"
            />
          </div>
          <div>
            <label className="ui-label">Protection class</label>
            <input
              type="text"
              name="bulletproofRating"
              value={vehicle.bulletproofRating}
              onChange={(e) => onChange({ bulletproofRating: e.target.value })}
              placeholder="Bullet proof"
              className="ui-input"
            />
          </div>
        </div>
      </div>

      {/* Systems & Avionics */}
      <div className="ui-section">
        <span className="ui-heading">Systems</span>
        <div>
          <label className="ui-label">
            One line per row on the card
          </label>
          <textarea
            rows={2}
            name="systems"
            value={vehicle.systems}
            onChange={(e) => onChange({ systems: e.target.value })}
            placeholder={'Laser rangefinder, NVD,\nSmoke grenade, Auto tracker'}
            className="ui-input"
          />
        </div>
      </div>

      {/* Mobility & Physical Attributes */}
      <div className="ui-section">
        <span className="ui-heading">Mobility</span>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2">
          <div>
            <label className="ui-label">Crew</label>
            <input
              type="text"
              name="crew"
              value={vehicle.crew}
              onChange={(e) => onChange({ crew: e.target.value })}
              placeholder="3"
              className="ui-input"
            />
          </div>
          <div>
            <label className="ui-label">Mass</label>
            <input
              type="text"
              name="mass"
              value={vehicle.mass}
              onChange={(e) => onChange({ mass: e.target.value })}
              placeholder="20.0 t"
              className="ui-input"
            />
          </div>
          <div>
            <label className="ui-label">Visibility</label>
            <input
              type="text"
              name="visibility"
              value={vehicle.visibility}
              onChange={(e) => onChange({ visibility: e.target.value })}
              placeholder="88 %"
              className="ui-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="ui-label">Forward, km/h</label>
            <input
              type="text"
              name="maxSpeedForward"
              value={vehicle.maxSpeedForward}
              onChange={(e) => onChange({ maxSpeedForward: e.target.value })}
              placeholder="83.1"
              className="ui-input"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="ui-label">Reverse, km/h</label>
            <input
              type="text"
              name="maxSpeedReverse"
              value={vehicle.maxSpeedReverse}
              onChange={(e) => onChange({ maxSpeedReverse: e.target.value })}
              placeholder="24.4"
              className="ui-input"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="ui-label">Engine power</label>
            <input
              type="text"
              name="enginePower"
              value={vehicle.enginePower}
              onChange={(e) => onChange({ enginePower: e.target.value })}
              placeholder="575 hp at 3000 rpm"
              className="ui-input"
            />
          </div>
        </div>
      </div>

      {/* Only shown on the Simple card */}
      <div className="ui-section">
        <span className="ui-heading">Simple card only</span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
          <div>
            <label className="ui-label">Hull armor</label>
            <input
              type="text"
              name="hullArmor"
              value={vehicle.hullArmor || ''}
              onChange={(e) => onChange({ hullArmor: e.target.value })}
              placeholder="130 / 38 / 50 mm"
              className="ui-input"
            />
          </div>
          <div>
            <label className="ui-label">Turret armor</label>
            <input
              type="text"
              name="turretArmor"
              value={vehicle.turretArmor || ''}
              onChange={(e) => onChange({ turretArmor: e.target.value })}
              placeholder="270 / 80 / 58 mm"
              className="ui-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="ui-label">Penetration</label>
            <input
              type="text"
              name="armorPenetration"
              value={vehicle.armorPenetration || ''}
              onChange={(e) => onChange({ armorPenetration: e.target.value })}
              placeholder="396 / 394 / 387 mm"
              className="ui-input"
            />
          </div>
          <div>
            <label className="ui-label">At distances</label>
            <input
              type="text"
              name="atDistances"
              value={vehicle.atDistances || ''}
              onChange={(e) => onChange({ atDistances: e.target.value })}
              placeholder="10 / 100 / 500 m"
              className="ui-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
