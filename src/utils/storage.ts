import { VehicleData } from '../types/vehicle';

const STORAGE_KEY = 'thundercard_current_vehicle';

export function saveVehicleToStorage(vehicle: VehicleData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicle));
  } catch (e) {
    console.error('Failed to save vehicle to localStorage:', e);
  }
}

export function loadVehicleFromStorage(): VehicleData | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const v = JSON.parse(data) as VehicleData;
    // Auto-migrate old paths to authentic in-game assets
    if (v.vehicleImage === 'assets/game/hstvl_full_render.png') {
      v.vehicleImage = 'assets/game/tanks/us_hstv_l.avif';
    } else if (v.vehicleImage === 'assets/game/t34_57_render.png') {
      v.vehicleImage = 'assets/game/tanks/ussr_t_34_57_1943.avif';
    } else if (v.vehicleImage === 'assets/game/m2a4_render.png') {
      v.vehicleImage = 'assets/game/tanks/us_m2a4.avif';
    }
    if (v.countryFlag === 'assets/flags/country_usa.png') {
      v.countryFlag = 'assets/game/flags/country_usa.avif';
      v.flagBackdropOpacity = 1.0;
    } else if (v.countryFlag === 'assets/flags/country_ussr.png') {
      v.countryFlag = 'assets/game/flags/country_ussr.avif';
      v.flagBackdropOpacity = 1.0;
    } else if (v.countryFlag === 'assets/flags/country_germany.png') {
      v.countryFlag = 'assets/game/flags/country_germany.avif';
      v.flagBackdropOpacity = 1.0;
    }
    // A bare "x" prefix came from misreading a scrolled in-game label; the game shows "2x", "3x"…
    v.secondaryWeapons?.forEach((w) => w.prefix === 'x' && (w.prefix = ''));
    return v;
  } catch (e) {
    console.error('Failed to load vehicle from localStorage:', e);
    return null;
  }
}

export function downloadVehicleJson(vehicle: VehicleData): void {
  const jsonStr = JSON.stringify(vehicle, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = (vehicle.name || 'custom_vehicle').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  link.download = `${safeName}_statcard.json`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

export function parseVehicleJson(file: File): Promise<VehicleData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as VehicleData;
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON vehicle profile'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
