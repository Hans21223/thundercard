export type VehicleClass =
  | 'light_tank'
  | 'medium_tank'
  | 'heavy_tank'
  | 'destroyer_tank'
  | 'spaa_tank'
  | 'aviation_fighter'
  | 'aviation_strike'
  | 'aviation_bomber'
  | 'helicopter';

export type CardLayout = 'modern' | 'legacy';

export type DataFreshness = 'verified_current' | 'legacy_archive' | 'custom_mockup';

export type CardStatusType =
  | 'standard'
  | 'reserve'
  | 'locked'
  | 'premium'
  | 'pack'
  | 'squadron'
  | 'event';

export type GameMode = 'realistic' | 'arcade' | 'simulator';

export interface WeaponEntry {
  id: string;
  name: string;
  ammo: string | number;
  prefix?: string; // e.g. "x", "5x", "2x"
  count?: number;
  isSecondary?: boolean;
}

export interface VehicleData {
  id: string;
  name: string;
  shortName?: string; // tech tree tile label
  dataFreshness: DataFreshness;
  freshnessNote?: string;
  cardLayout: CardLayout;
  
  // Classification & Header
  vehicleClass: VehicleClass;
  typeLabel: string;
  rank: string;
  battleRating: string;
  countryFlag: string;
  vehicleImage: string;
  imageScale?: number; // 1 = fit the picture box
  imageScaleY?: number; // vertical scale when stretched, defaults to imageScale
  imageX?: number; // px offset, set by dragging the picture on the card
  imageY?: number;
  flagBackdropOpacity: number;
  flagBackdropScale?: number;
  
  // Status & Badges
  statusType: CardStatusType;
  statusText?: string;
  talisman: boolean;
  topCrewStar: boolean;
  headerTooltip: string;
  
  // Armament
  primaryWeapon: WeaponEntry;
  secondaryWeapons: WeaponEntry[];
  uavRecon?: string;
  uavName?: string; // e.g. "UAV Recon Micro"
  
  // Guidance & Reload
  guidanceSpeedHorStock: string;
  guidanceSpeedHorAce: string;
  guidanceSpeedVertStock: string;
  guidanceSpeedVertAce: string;
  verticalGuidance: string;
  fireRate?: string; // e.g. "144 rounds/min", magazine-fed guns and launchers
  reloadingRate: string;
  reloadingRateAce?: string;
  
  // Protection & Systems
  protectionSummary: string;
  bulletproofRating: string;
  systems: string;
  ammoTypes: string[];
  ammoCaliber?: string;
  
  // Mobility & Physical
  crew: string | number;
  mass: string;
  enginePower: string;
  maxSpeedForward: string;
  maxSpeedReverse: string;
  visibility: string;
  
  // Legacy Card Stats
  hullArmor?: string;
  turretArmor?: string;
  armorPenetration?: string;
  atDistances?: string;
  
  // Economy & Research
  requiredRP?: string;
  efficientProgressFrom?: string;
  efficientProgressBonus?: string;
  price?: string;
  priceCurrency?: 'sl' | 'ge';
  cantAfford?: boolean; // price shown in red
  owned?: boolean; // hides Required RP / Price, repair time is "(with crew)"
  crewTrainCost: string;
  freeRepairs: string;
  repairCostPerMin: string;
  maxRepairCost: string;
  freeRepairTime: string;
  researchEfficiencyRanks: string;
  rpRewardPercent: string;
  rpMultiplier: string;
  slRewardPercent: string;
  slMultiplier: string;
  
  // Bottom footer
  gameMode: GameMode;
  crewModificationNote?: string;
}
