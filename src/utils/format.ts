/// <reference types="vite/client" />
import { VehicleData } from '../types/vehicle';

// Auto-format editor fields when they lose focus: bare numbers become in-game text
// ("130 38 50" → "130 / 38 / 50 mm", "350000" → "350,000"). Anything else is left as typed.

const nums = (s: string) => (s.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
const onlyNumbers = (s: string) => /^[\s\d.,/+\-−–]*$/.test(s) && nums(s).length > 0;
const single = (s: string) => (onlyNumbers(s) && nums(s.replace(/,/g, '')).length === 1 ? nums(s.replace(/,/g, ''))[0] : null);
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

const withUnit = (unit: string, digits?: number) => (s: string) => {
  const n = single(s);
  return n === null ? s : `${digits === undefined ? n : n.toFixed(digits)}${unit}`;
};
const grouped = (s: string) => {
  const n = single(s);
  return n === null ? s : Math.round(n).toLocaleString('en-US');
};
const triple = (unit: string) => (s: string) => {
  const n = nums(s);
  return onlyNumbers(s) && n.length === 3 ? `${n.join(' / ')} ${unit}` : s;
};
const multiplier = (s: string) => {
  const n = single(s);
  return n === null ? s : `${n}×(100%)`;
};
// Same rules as the game: 0 stays "0", otherwise one decimal and a "+" on the upper limit
const elevation = (s: string) => {
  const n = nums(s);
  if (!onlyNumbers(s) || n.length !== 2) return s;
  const [lo, hi] = n;
  return `${lo === 0 ? '0' : lo.toFixed(1)} / ${hi === 0 ? '0' : '+' + hi.toFixed(1)}°`;
};
const engine = (s: string) => {
  const n = nums(s);
  return onlyNumbers(s) && n.length === 2 ? `${n[0]} hp at ${n[1]} rpm` : s;
};
const repairTime = (s: string) => {
  const n = nums(s);
  if (!onlyNumbers(s) || n.length < 2 || n.length > 3) return s;
  const [d, h, m] = n.length === 3 ? n : [0, ...n];
  const parts: string[] = [];
  for (const [value, unit] of [[d, 'd'], [h, 'h'], [m, 'm']] as const)
    if (value) parts.push(parts.length ? `${String(value).padStart(2, '0')}${unit}` : `${value}${unit}`);
  return parts.join(' ') || '0m';
};
const rankRange = (s: string) => {
  const tokens = s.match(/\d+|[IVX]+/gi) ?? [];
  if (tokens.length !== 2 || !/^[\s\dIVX\-–—]*$/i.test(s)) return s;
  const r = tokens.map((t) => (/^\d+$/.test(t) ? ROMAN[+t] ?? t : t.toUpperCase()));
  return `${r[0]} – ${r[1]} Ranks`;
};

export const FORMATTERS: Partial<Record<keyof VehicleData, (s: string) => string>> = {
  battleRating: withUnit('', 1),
  guidanceSpeedHorStock: withUnit('', 1),
  guidanceSpeedHorAce: withUnit('', 1),
  guidanceSpeedVertStock: withUnit('', 1),
  guidanceSpeedVertAce: withUnit('', 1),
  verticalGuidance: elevation,
  fireRate: withUnit(' rounds/min'),
  reloadingRate: withUnit(' s', 1),
  reloadingRateAce: withUnit(' s', 1),
  ammoCaliber: withUnit(' mm'),
  uavRecon: withUnit('pcs'),
  mass: withUnit(' t', 1),
  enginePower: engine,
  maxSpeedForward: withUnit('', 1),
  maxSpeedReverse: withUnit('', 1),
  visibility: withUnit(' %'),
  hullArmor: triple('mm'),
  turretArmor: triple('mm'),
  armorPenetration: triple('mm'),
  atDistances: triple('m'),
  requiredRP: grouped,
  price: grouped,
  crewTrainCost: grouped,
  repairCostPerMin: grouped,
  maxRepairCost: grouped,
  freeRepairTime: repairTime,
  efficientProgressBonus: withUnit('%'),
  researchEfficiencyRanks: rankRange,
  rpRewardPercent: withUnit('%'),
  slRewardPercent: withUnit('%'),
  rpMultiplier: multiplier,
  slMultiplier: multiplier,
};

if (import.meta.env.DEV) {
  const check = (key: keyof VehicleData, input: string, want: string) =>
    console.assert(FORMATTERS[key]!(input) === want, `format ${key}("${input}") = "${FORMATTERS[key]!(input)}", want "${want}"`);
  check('hullArmor', '130 38 50', '130 / 38 / 50 mm');
  check('hullArmor', 'Composite', 'Composite');
  check('requiredRP', '350000', '350,000');
  check('verticalGuidance', '-17 45', '-17.0 / +45.0°');
  check('mass', '20', '20.0 t');
  check('enginePower', '575 3000', '575 hp at 3000 rpm');
  check('freeRepairTime', '15 0 21', '15d 21m');
  check('freeRepairTime', '18 57', '18h 57m');
  check('researchEfficiencyRanks', '6-8', 'VI – VIII Ranks');
  check('rpMultiplier', '2.44', '2.44×(100%)');
  check('maxRepairCost', 'Free', 'Free');
}
