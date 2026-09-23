import { VehicleData } from '../types/vehicle';

// Saves live in the browser's IndexedDB, which has room for hundreds of MB where localStorage stops at
// about 5 MB. They are read into memory once at start-up (initStorage, before the app renders), so the app
// reads and writes them synchronously; each write is copied to IndexedDB in the background, and to other
// open ThunderCard tabs so none of them writes back an old copy. Without IndexedDB, localStorage is used.

const STORE = 'kv';
const cache = new Map<string, string>();
let db: IDBDatabase | null = null;
const tabs = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('thundercard_storage');
tabs?.addEventListener('message', (e: MessageEvent<[string, string]>) => cache.set(...e.data));

const done = <T>(r: IDBRequest<T>) =>
  new Promise<T>((ok, fail) => {
    r.onsuccess = () => ok(r.result);
    r.onerror = () => fail(r.error);
  });
const committed = (tx: IDBTransaction) =>
  new Promise((ok, fail) => {
    tx.oncomplete = ok;
    tx.onerror = tx.onabort = () => fail(tx.error);
  });

export async function initStorage(): Promise<void> {
  try {
    const open = indexedDB.open('thundercard', 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE);
    const opened = await done(open);
    const store = opened.transaction(STORE).objectStore(STORE);
    const [keys, values] = await Promise.all([done(store.getAllKeys()), done(store.getAll())]);
    keys.forEach((k, i) => cache.set(String(k), values[i]));
    // First run: move the saves over from localStorage, and free it only once they are safely stored
    const old = Object.keys(localStorage).filter((k) => k.startsWith('thundercard_') && !cache.has(k));
    if (old.length) {
      const tx = opened.transaction(STORE, 'readwrite');
      for (const k of old) tx.objectStore(STORE).put(localStorage.getItem(k), k);
      await committed(tx);
      for (const k of old) {
        cache.set(k, localStorage.getItem(k)!);
        localStorage.removeItem(k);
      }
    }
    db = opened;
  } catch (e) {
    console.error('IndexedDB unavailable, saving to localStorage instead:', e);
  }
}

let warned = false;
const write = (key: string, text: string) => {
  cache.set(key, text);
  tabs?.postMessage([key, text]);
  const tx = db!.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).put(text, key);
  committed(tx).catch((e) => {
    console.error(`Failed to save ${key}:`, e);
    if (!warned) alert("Couldn't save: the browser's storage for this site is full. Export your Library saves and delete some.");
    warned = true;
  });
};

// Size of the saves and the room the browser gives this site, in bytes
export const storageUse = async () => {
  const est = await navigator.storage?.estimate?.();
  return est ? { used: est.usage ?? 0, room: est.quota ?? 0 } : null;
};

const STORAGE_KEY = 'thundercard_current_vehicle';

export function saveVehicleToStorage(vehicle: VehicleData): void {
  saveJson(STORAGE_KEY, vehicle);
}

export function loadVehicleFromStorage(): VehicleData | null {
  try {
    const v = loadJson<VehicleData>(STORAGE_KEY);
    if (!v) return null;
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
    console.error('Failed to load the saved vehicle:', e);
    return null;
  }
}

export function loadJson<T>(key: string): T | null {
  try {
    const data = db ? cache.get(key) : localStorage.getItem(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
}

// false when the save could not be made (only knowable up front with localStorage; IndexedDB reports later)
export function saveJson(key: string, value: unknown): boolean {
  try {
    const text = JSON.stringify(value);
    if (db) write(key, text);
    else localStorage.setItem(key, text);
    return true;
  } catch (e) {
    console.error(`Failed to save ${key}:`, e);
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
