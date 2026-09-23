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

export function loadJson<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
}

export function saveJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage:`, e);
    return false;
  }
}

export function downloadJson(value: unknown, filename: string): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadVehicleJson(vehicle: VehicleData): void {
  const safeName = (vehicle.name || 'custom_vehicle').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  downloadJson(vehicle, `${safeName}_statcard.json`);
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
