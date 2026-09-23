import { AmmoRow, VehicleData } from '../types/vehicle';

// Keep old presets, JSON saves and Sprocket imports readable without a destructive migration.
export function getAmmoRows(v: Pick<VehicleData, 'ammoRows' | 'ammoTypes' | 'ammoCaliber' | 'primaryWeapon'>): AmmoRow[] {
  if (Array.isArray(v.ammoRows)) {
    return v.ammoRows.filter((row) => row && typeof row.id === 'string' && typeof row.caliber === 'string'
      && Array.isArray(row.types) && row.types.every((t) => typeof t === 'string'));
  }
  return [{
    id: 'primary',
    caliber: v.ammoCaliber || v.primaryWeapon?.name.match(/^[\d.]+ mm/)?.[0] || '',
    types: Array.isArray(v.ammoTypes) ? v.ammoTypes.filter((t) => typeof t === 'string') : [],
  }];
}

export const ammoLabel = (caliber: string) => `Ammo${caliber.trim() ? ` ${caliber.trim()}` : ''}:`;

// Older versions of the app can still read the first row from a new save.
export const ammoUpdates = (rows: AmmoRow[]): Partial<VehicleData> => ({
  ammoRows: rows,
  ammoCaliber: rows[0]?.caliber || '',
  ammoTypes: rows[0]?.types || [],
});
