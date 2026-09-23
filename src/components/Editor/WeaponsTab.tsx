import React from 'react';
import { VehicleData, WeaponEntry } from '../../types/vehicle';
import { AmmoRowsEditor } from './AmmoRowsEditor';

interface WeaponsTabProps {
  vehicle: VehicleData;
  onChange: (updates: Partial<VehicleData>) => void;
  autoFormat: boolean;
}

export const WeaponsTab: React.FC<WeaponsTabProps> = ({ vehicle, onChange, autoFormat }) => {
  const secondaries = vehicle.secondaryWeapons || [];
  const updateSecondary = (id: string, updates: Partial<WeaponEntry>) =>
    onChange({ secondaryWeapons: secondaries.map((w) => (w.id === id ? { ...w, ...updates } : w)) });

  const field = (label: string, key: keyof VehicleData, placeholder: string) => (
    <div>
      <label className="ui-label">{label}</label>
      <input
        type="text"
        name={key}
        value={(vehicle[key] as string) || ''}
        onChange={(e) => onChange({ [key]: e.target.value })}
        placeholder={placeholder}
        className="ui-input"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <span className="ui-heading">Main gun</span>
        <div className="grid grid-cols-[1fr_90px] gap-3">
          <div>
            <label className="ui-label">Name</label>
            <input
              type="text"
              name="primaryWeapon"
              value={vehicle.primaryWeapon?.name || ''}
              onChange={(e) => onChange({ primaryWeapon: { ...vehicle.primaryWeapon, name: e.target.value } })}
              placeholder="75 mm ADMAG cannon"
              className="ui-input"
            />
          </div>
          <div>
            <label className="ui-label">Ammo</label>
            <input
              type="text"
              name="primaryWeapon"
              value={vehicle.primaryWeapon?.ammo ?? ''}
              onChange={(e) => onChange({ primaryWeapon: { ...vehicle.primaryWeapon, ammo: e.target.value } })}
              placeholder="26"
              className="ui-input"
            />
          </div>
        </div>
      </div>

      <div className="ui-section">
        <div className="flex items-center justify-between mb-2">
          <span className="ui-heading !mb-0">Other weapons</span>
          <button
            type="button"
            onClick={() =>
              onChange({ secondaryWeapons: [...secondaries, { id: 'sec_' + Date.now(), name: '', ammo: '' }] })
            }
            className="ui-btn"
          >
            Add
          </button>
        </div>
        {secondaries.length > 0 && (
          <div className="grid grid-cols-[48px_1fr_90px_28px] gap-x-2 gap-y-1.5 items-end">
            <span className="ui-label">Count</span>
            <span className="ui-label">Name</span>
            <span className="ui-label">Ammo</span>
            <span />
            {secondaries.map((sec) => (
              <React.Fragment key={sec.id}>
                <input
                  type="text"
                  value={sec.prefix || ''}
                  onChange={(e) => updateSecondary(sec.id, { prefix: e.target.value })}
                  onBlur={(e) => autoFormat && /^\d+$/.test(e.target.value.trim()) && updateSecondary(sec.id, { prefix: `${e.target.value.trim()}x` })}
                  placeholder="2x"
                  className="ui-input"
                />
                <input
                  type="text"
                  value={sec.name}
                  onChange={(e) => updateSecondary(sec.id, { name: e.target.value })}
                  placeholder="7.62 mm M240 machine gun"
                  className="ui-input"
                />
                <input
                  type="text"
                  value={sec.ammo}
                  onChange={(e) => updateSecondary(sec.id, { ammo: e.target.value })}
                  placeholder="3200"
                  className="ui-input"
                />
                <button
                  type="button"
                  onClick={() => onChange({ secondaryWeapons: secondaries.filter((w) => w.id !== sec.id) })}
                  className="ui-btn !px-0 justify-center hover:!text-[#f02020]"
                  title="Remove"
                >
                  ×
                </button>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      <div className="ui-section">
        <span className="ui-heading">Guidance</span>
        <div className="grid grid-cols-4 gap-3">
          {field('Horizontal', 'guidanceSpeedHorStock', '33.9')}
          {field('Horizontal, top crew', 'guidanceSpeedHorAce', '48.5')}
          {field('Vertical', 'guidanceSpeedVertStock', '31.9')}
          {field('Vertical, top crew', 'guidanceSpeedVertAce', '45.6')}
        </div>
        <div className="grid grid-cols-4 gap-3 mt-3">
          {field('Elevation limits', 'verticalGuidance', '-17.0 / +45.0°')}
          {field('Fire rate', 'fireRate', '144 rounds/min')}
          {field('Reload', 'reloadingRate', '6.5 s')}
          {field('Reload, top crew', 'reloadingRateAce', '5.0 s')}
        </div>
      </div>

      <div className="ui-section">
        <AmmoRowsEditor vehicle={vehicle} onChange={onChange} autoFormat={autoFormat} />
        <div className="grid grid-cols-[1fr_90px] gap-3 mt-3">
          {field('Drone', 'uavName', 'UAV Recon Micro')}
          {field('Drones', 'uavRecon', '1pcs')}
        </div>
      </div>
    </div>
  );
};
