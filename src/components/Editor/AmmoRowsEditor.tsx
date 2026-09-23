import React, { useState } from 'react';
import { AmmoRow, VehicleData } from '../../types/vehicle';
import { ammoUpdates, getAmmoRows } from '../../utils/ammo';
import { FORMATTERS } from '../../utils/format';

const ShellsInput: React.FC<{ row: AmmoRow; index: number; onChange: (types: string[]) => void }> = ({ row, index, onChange }) => {
  // Keep separators while typing; the preview receives the parsed list immediately.
  const [draft, setDraft] = useState<string | null>(null);
  const text = row.types.join(', ');
  return <input type="text" aria-label={`Ammo row ${index + 1} shells`} value={draft ?? text}
    onFocus={() => setDraft(text)}
    onChange={(e) => { setDraft(e.target.value); onChange(e.target.value.split(',').map((t) => t.trim()).filter(Boolean)); }}
    onBlur={() => setDraft(null)} placeholder="XM885, XM884" className="ui-input" />;
};

export const AmmoRowsEditor: React.FC<{
  vehicle: VehicleData;
  onChange: (updates: Partial<VehicleData>) => void;
  autoFormat: boolean;
}> = ({ vehicle, onChange, autoFormat }) => {
  const rows = getAmmoRows(vehicle);
  const update = (index: number, changes: Partial<AmmoRow>) =>
    onChange(ammoUpdates(rows.map((row, i) => i === index ? { ...row, ...changes } : row)));
  return <>
    <div className="flex items-center justify-between mb-2">
      <span className="ui-heading !mb-0">Ammunition</span>
      <button type="button" className="ui-btn" onClick={() => onChange(ammoUpdates([
        ...rows, { id: crypto.randomUUID(), caliber: '', types: [] },
      ]))}>Add Ammo row</button>
    </div>
    <p className="text-[12px] text-[#8a939b] mb-2">One row per caliber. Empty shell lists are hidden on the card.</p>
    {rows.length > 0 && <div className="grid grid-cols-[90px_1fr_28px] gap-x-3 gap-y-1.5 items-end">
      <span className="ui-label">Caliber</span><span className="ui-label">Shells, comma separated</span><span />
      {rows.map((row, i) => <React.Fragment key={`${vehicle.id}:${row.id}`}>
        <input type="text" aria-label={`Ammo row ${i + 1} caliber`} value={row.caliber}
          onChange={(e) => update(i, { caliber: e.target.value })}
          onBlur={(e) => {
            if (!autoFormat) return;
            const caliber = FORMATTERS.ammoCaliber!(e.target.value);
            if (caliber !== e.target.value) update(i, { caliber });
          }} placeholder="75 mm" className="ui-input" />
        <ShellsInput row={row} index={i} onChange={(types) => update(i, { types })} />
        <button type="button" className="ui-btn !px-0 justify-center hover:!text-[#f02020]"
          aria-label={`Remove Ammo row ${i + 1}`} title="Remove Ammo row"
          onClick={() => onChange(ammoUpdates(rows.filter((_, index) => index !== i)))}>×</button>
      </React.Fragment>)}
    </div>}
  </>;
};
