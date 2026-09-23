import { VehicleData, VehicleClass } from '../types/vehicle';

// Reads Sprocket .blueprint files (the 0.2.x format with typed parts, and the older 0.1 format with
// ENG/TSN/CNN blocks) into the numbers a stat card needs.

/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = any; // blueprint JSON is untyped and changes between game versions

// Toothed (drive sprocket) wheels, from Sprocket_Data/StreamingAssets/Parts/*.json ("toothed": true)
const SPROCKET_WHEELS = new Set([
  'd3ba78e2-b77b-4710-9e2f-cc9d5d12d562', // cometSprocket
  '0bc468a8-ccb3-49bd-91ea-e95ebfc919e6', // m4SprocketWheel
  '470581da-c2aa-4748-ad51-cbcf64767a1d', // smoothDriveSprocketWheel
  'e856f182-0c62-467b-a981-56455fcf4b28', // strvM42Sprocket
  '8b31d0e4-3946-4a3a-81ef-b2bbf3a84989', // tigerISprocket
]);

export interface SprocketGun {
  name: string;
  caliber: number; // mm
  count: number; // guns of this kind
  rounds: number; // shells in racks for it
  shells: string[]; // "AP", "HE", "APHE"…
  elevation?: [number, number]; // min, max degrees
}
export interface SprocketStats {
  name: string;
  massKg: number;
  crew: number;
  turrets: number;
  armourTech?: string;
  engine?: { cylinders: number; liters: number; rpm: number; torque?: number };
  speed?: { forward: number; reverse: number }; // km/h, needs a final drive ratio (game 0.2.54+)
  guns: SprocketGun[]; // biggest first
}

const parse = (s: Json) => (typeof s === 'string' ? JSON.parse(s) : s);
const round1 = (n: number) => Math.round(n * 10) / 10;

function gunName(cannon: Json, caliber: number, barrelMm: number): string {
  const custom = typeof cannon.name === 'string' ? cannon.name.trim() : '';
  if (custom && !/^(unnamed cannon|cannon|untitled|\d+(\.\d+)?)$/i.test(custom)) return custom;
  const kind = caliber <= 15 ? 'machine gun' : 'cannon';
  return barrelMm && caliber > 15 ? `${caliber} mm L/${Math.round(barrelMm / caliber)} ${kind}` : `${caliber} mm ${kind}`;
}

// Shells a box rack holds: shells lie along z, packed in a grid across x/y. Racks are often a little shorter
// than the round (683 mm for a 717 mm shell) and still hold it, so the length is rounded; width/height must fit.
const fit = (space: number, size: number) => Math.floor(space / size + 0.02);
const rackCapacity = (r: Json) => fit(r.x, r.diameter) * fit(r.y, r.diameter) * Math.round(r.z / (r.length || r.z));

function shellNames(slot: Json): string[] {
  const names = (slot?.generatedProjectiles ?? []).map((p: Json) =>
    (p.functions ?? []).map((f: Json) => f.id).filter((id: string) => id !== 'Propellant').join('')
  );
  return [...new Set<string>(names.filter(Boolean))];
}

function parseNew(b: Json): SprocketStats {
  const parts = new Map<number, { type: string; bp: Json }>();
  for (const p of b.blueprints ?? []) parts.set(p.id, { type: p.type, bp: parse(p.blueprint) });
  const ofType = (t: string) => [...parts.values()].filter((p) => p.type === t).map((p) => p.bp);
  const objects: Json[] = b.objects ?? [];
  const byVuid = new Map(objects.map((o) => [o.vuid, o]));
  const children = new Map<number, Json[]>();
  for (const o of objects) children.set(o.pvuid, [...(children.get(o.pvuid) ?? []), o]);

  const engine = ofType('engine')[0];
  const gearbox = ofType('transmission')[0];
  const track = ofType('track')[0];
  const liters = engine ? engine.cylinders * engine.cylinderDisplacement : 0;
  const rpm = engine?.targetMaxRPM ?? 0;

  // Top speed from engine rpm, gearing and the drive sprocket: v = rpm / (gear × final) × π × D
  let speed: SprocketStats['speed'];
  const finalDrive = gearbox?.finalDriveRatio ?? track?.finalDriveRatio;
  const sprocket = ofType('trackWheel').find((w) => SPROCKET_WHEELS.has(w.wheelID));
  if (finalDrive && sprocket && gearbox?.d?.length) {
    const kmh = (ratio: number) => round1((rpm / (ratio * finalDrive)) * Math.PI * sprocket.diameter * 0.06);
    speed = { forward: kmh(Math.min(...gearbox.d)), reverse: gearbox.r?.length ? kmh(Math.min(...gearbox.r)) : 0 };
  }

  // Guns: each cannon object hangs under the laying drive that aims it. A gun loads from every rack of its
  // caliber (racks may name a different shell entry than the gun does), so ammo is counted per caliber.
  const rounds = new Map<number, number>();
  const rackShells = new Map<number, Set<number>>();
  for (const o of objects) {
    const rack = o.ammoRackBlueprintVuid !== undefined ? parts.get(o.ammoRackBlueprintVuid)?.bp : undefined;
    if (!rack?.diameter) continue;
    rounds.set(rack.diameter, (rounds.get(rack.diameter) ?? 0) + rackCapacity(rack));
    rackShells.set(rack.diameter, (rackShells.get(rack.diameter) ?? new Set()).add(rack.shellID));
  }
  const guns = new Map<string, SprocketGun>();
  for (const o of objects) {
    if (o.cannonBlueprintVuid === undefined) continue;
    const cannon = parts.get(o.cannonBlueprintVuid)?.bp;
    if (!cannon?.caliber) continue;
    const barrel = (cannon.segments ?? []).flatMap((s: Json) => s.segments ?? []).reduce((sum: number, s: Json) => sum + (s.l ?? 0), 0);
    // The laying drive sits beside the gun under its mantlet: mantlet → (laying drive, trunnions → … → cannon)
    let elevation: [number, number] | undefined;
    for (let p = byVuid.get(o.pvuid); p && !elevation; p = byVuid.get(p.pvuid)) {
      const driveObj = [p, ...(children.get(p.vuid) ?? [])].find((c) => c.layingDriveBlueprintVuid !== undefined);
      const drive = driveObj && parts.get(driveObj.layingDriveBlueprintVuid)?.bp;
      if (drive?.elevation) elevation = [drive.elevation.min, drive.elevation.max];
    }
    const key = `${cannon.caliber}|${barrel}|${cannon.shellID}`;
    const gun = guns.get(key);
    if (gun) gun.count++;
    else
      guns.set(key, {
        name: gunName(cannon, cannon.caliber, barrel),
        caliber: cannon.caliber,
        count: 1,
        rounds: rounds.get(cannon.caliber) ?? 0,
        shells: [
          ...new Set([cannon.shellID, ...(rackShells.get(cannon.caliber) ?? [])].flatMap((id) => shellNames(parts.get(id)?.bp))),
        ],
        elevation,
      });
  }

  return {
    name: b.header?.name ?? 'Sprocket vehicle',
    massKg: b.header?.mass ?? 0,
    crew: ofType('crewSeat').filter((s) => s.occupied !== false).length,
    turrets: ofType('turret').length,
    armourTech: ofType('structure')[0]?.armourTechID,
    engine: engine && { cylinders: engine.cylinders, liters, rpm, torque: gearbox?.maxInputTorque },
    speed,
    guns: [...guns.values()].sort((a, b2) => b2.caliber - a.caliber),
  };
}

// Game 0.1 format: named blocks with the data as a JSON string
function parseOld(b: Json): SprocketStats {
  const block = (id: string) => {
    const p = (b.blueprints ?? []).find((x: Json) => x.id === id);
    return p ? parse(p.data) : undefined;
  };
  const eng = block('ENG');
  const cnn = block('CNN');
  const guns = new Map<string, SprocketGun>();
  for (const inst of cnn?.instances ?? []) {
    const c = cnn.blueprints?.[inst.blueprint];
    if (!c?.caliber) continue;
    const barrel = (c.segments ?? []).reduce((sum: number, s: Json) => sum + (s.len ?? 0) * 1000, 0);
    const key = `${c.caliber}|${barrel}`;
    const gun = guns.get(key);
    if (gun) gun.count++;
    else guns.set(key, { name: gunName(c, c.caliber, barrel), caliber: c.caliber, count: 1, rounds: 0, shells: [] });
  }
  return {
    name: b.header?.name ?? b.name ?? 'Sprocket vehicle',
    massKg: b.header?.mass ?? 0,
    crew: block('CRW')?.seats?.length ?? 0,
    turrets: (b.blueprints ?? []).filter((p: Json) => p.id === 'Compartment' && (parse(p.data).turret?.basketVolume ?? 0) > 0).length,
    engine: eng && { cylinders: eng.cylinders, liters: eng.cylinders * eng.cylinderDisplacement, rpm: eng.targetMaxRPM },
    guns: [...guns.values()].sort((a, b2) => b2.caliber - a.caliber),
  };
}

export function parseBlueprint(text: string): SprocketStats {
  const b = JSON.parse(text);
  if (!Array.isArray(b.blueprints)) throw new Error('Not a Sprocket blueprint');
  return b.blueprints.some((p: Json) => 'type' in p) ? parseNew(b) : parseOld(b);
}

// ---------- to a stat card ----------

// Designs carry the in-game campaign date (often the same for a whole faction), so the starting rank comes
// from the main gun instead; drag vehicles in the tech tree to change it.
const RANK_BY_CALIBER: [number, string][] = [
  [37, 'I'], [57, 'II'], [76, 'III'], [90, 'IV'], [105, 'V'], [120, 'VI'], [130, 'VII'],
];
const DEFAULT_BR: Record<string, string> = { I: '1.0', II: '2.3', III: '3.7', IV: '5.0', V: '6.7', VI: '8.0', VII: '9.7', VIII: '11.3' };
const CLASS_LABEL: Record<string, string> = {
  light_tank: 'Light Tank',
  medium_tank: 'Medium Tank',
  heavy_tank: 'Heavy Tank',
  destroyer_tank: 'Tank Destroyer',
};
// ponytail: horsepower from the engine torque Sprocket saves in the gearbox; recheck against the game's engine tab
const HP_PER_NM_RPM = 1 / 7121;

export function sprocketToVehicle(s: SprocketStats, base: VehicleData, image = ''): VehicleData {
  const rank = RANK_BY_CALIBER.find(([c]) => (s.guns[0]?.caliber ?? 0) <= c)?.[1] ?? 'VIII';
  const tons = s.massKg / 1000;
  const main = s.guns[0];
  const vehicleClass: VehicleClass =
    main && s.turrets === 0 ? 'destroyer_tank' : tons < 20 ? 'light_tank' : tons > 50 ? 'heavy_tank' : 'medium_tank';
  const e = s.engine;
  const hp = e?.torque ? Math.round(e.torque * e.rpm * HP_PER_NM_RPM) : 0;
  const elev = main?.elevation;
  return {
    ...base,
    id: `sprocket_${s.name}_${Date.now()}`,
    name: s.name,
    shortName: s.name,
    dataFreshness: 'custom_mockup',
    freshnessNote: 'Sprocket blueprint',
    vehicleClass,
    typeLabel: CLASS_LABEL[vehicleClass],
    rank,
    battleRating: DEFAULT_BR[rank],
    vehicleImage: image, // blank rather than the previous card's picture
    statusType: 'standard',
    owned: false,
    primaryWeapon: { id: 'pw1', name: main?.name ?? '', ammo: main?.rounds || '' },
    secondaryWeapons: s.guns.slice(1).map((g, i) => ({
      id: `sw${i + 1}`,
      name: g.name,
      ammo: g.rounds || '',
      prefix: g.count > 1 ? `${g.count}x` : '',
    })),
    ammoCaliber: main ? `${main.caliber} mm` : '',
    ammoTypes: main?.shells ?? [],
    verticalGuidance: elev ? `${elev[0] === 0 ? '0' : elev[0].toFixed(1)} / ${elev[1] === 0 ? '0' : '+' + elev[1].toFixed(1)}°` : '',
    guidanceSpeedHorStock: '',
    guidanceSpeedHorAce: '',
    guidanceSpeedVertStock: '',
    guidanceSpeedVertAce: '',
    reloadingRate: '',
    reloadingRateAce: '',
    fireRate: '',
    uavRecon: '',
    rpRewardPercent: '',
    rpMultiplier: '',
    slRewardPercent: '',
    slMultiplier: '',
    freeRepairs: '',
    crew: s.crew || '',
    mass: `${tons.toFixed(1)} t`,
    enginePower: e ? (hp ? `${hp} hp at ${e.rpm} rpm` : `${e.liters.toFixed(1)} L at ${e.rpm} rpm`) : '',
    maxSpeedForward: s.speed ? s.speed.forward.toFixed(1) : '',
    maxSpeedReverse: s.speed ? s.speed.reverse.toFixed(1) : '',
    protectionSummary: s.armourTech && s.armourTech !== 'rha' ? 'Composite armor' : 'Steel armor',
    bulletproofRating: vehicleClass === 'light_tank' ? 'Bullet proof' : 'Projectile proof',
    systems: '',
    visibility: '',
    hullArmor: '',
    turretArmor: '',
    requiredRP: '',
    efficientProgressFrom: '',
    price: '',
    crewTrainCost: '',
    repairCostPerMin: '',
    maxRepairCost: '',
    freeRepairTime: '',
    researchEfficiencyRanks: '',
  };
}
