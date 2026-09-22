import React from 'react';
import { VehicleData } from '../../types/vehicle';
import { CardHeader } from './CardHeader';

interface ModernStatCardProps {
  vehicle: VehicleData;
  onViewArmor?: () => void;
  onViewXRay?: () => void;
}

// Colors and metrics sampled from the in-game capture (public/assets/sample/hstvl_statcard_reference.png).
// The game draws no bold here: highlighted values are regular-weight white.
const BLUE = 'text-[#9cc6de]';
const DIM = 'text-[#595c60]';
const GOLD = 'text-[#f9db78]';
const BRIGHT = 'text-white';

const Icon: React.FC<{ src: string }> = ({ src }) => (
  <img src={src} alt="" className="inline-block w-3.5 h-3.5 align-[-2px] object-contain" />
);
const RP = 'assets/game/svg/item_type_rp.svg';
const SL = 'assets/game/svg/item_type_warpoints.svg';
const GE = 'assets/game/svg/item_type_eagles.svg';
const STAR = 'assets/game/svg/spec_icon2.svg';

// Label column is 218px; long labels are clipped at its right edge (in-game they auto-scroll).
const Row: React.FC<{ label: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode }> = ({
  label,
  sub,
  children,
}) => (
  <div className="grid grid-cols-[218px_1fr]">
    <div>
      <div className="flex overflow-hidden whitespace-nowrap">
        <span className="shrink-0">{label}</span>
        <span className="wt-leader" />
      </div>
      {sub}
    </div>
    <div>{children}</div>
  </div>
);

const Group: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  React.Children.toArray(children).length ? <div className="mt-[6px]">{children}</div> : null;

const ViewButton: React.FC<{ icon: string; text: string; onClick?: () => void }> = ({ icon, text, onClick }) => (
  <div className="flex items-center gap-[6px] mt-[3px] mb-[5px] text-[12px] leading-[17px]">
    <span className={`${DIM} text-[11px]`}>go to viewing</span>
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-[5px] h-[18px] px-[3px] bg-[#0c1118] border border-[#3a474f] text-[#9a9a9a] hover:text-white"
    >
      <img src={icon} alt="" className="w-3.5 h-3.5 object-contain" />
      {text}
    </button>
  </div>
);

// Comma lists wrap between items like in-game, never inside one
const items = (list: string[]) =>
  list.map((it, i) => (
    <React.Fragment key={i}>
      <span className="whitespace-nowrap">{i < list.length - 1 ? `${it},` : it}</span>{' '}
    </React.Fragment>
  ));

const Ace: React.FC<{ value?: string }> = ({ value }) => (
  <>
    {' ('}
    <Icon src={STAR} />
    {value})
  </>
);

// "2.14×(100%+[talisman]100%)" → talisman icon + gold tail
function renderRpMultiplier(val: string) {
  const [head, tail] = val.replace(/\[talisman\]|talisman|🏅/gi, '🏅').split('🏅');
  if (tail === undefined) return val;
  return (
    <>
      {head}
      <img src="assets/game/svg/item_type_talisman.svg" alt="" className="inline-block w-3.5 h-3.5 align-[-2px] mx-0.5" />
      <span className={GOLD}>{tail}</span>
    </>
  );
}

// Premium account multiplier "2.0" shows in yellow
function renderSlMultiplier(val: string) {
  const i = val.indexOf('2.0');
  if (i < 0) return val;
  return (
    <>
      {val.slice(0, i)}
      <span className="text-[#ffff00]">2.0</span>
      {val.slice(i + 3)}
    </>
  );
}

export const ModernStatCard: React.FC<ModernStatCardProps> = ({ vehicle: v, onViewArmor, onViewXRay }) => {
  const isAce = v.topCrewStar;

  // Top accent line color matching unitcard.css
  const topLineColor =
    v.statusType === 'pack' || v.statusType === 'premium'
      ? '#ff7b591f'
      : v.statusType === 'locked'
        ? '#781511'
        : v.statusType === 'squadron'
          ? '#4c6045'
          : '#57767e';

  return (
    <div
      id="statcard-preview-target"
      className="w-[434px] font-ptsans text-[14px] leading-[17px] text-[#c0c0c0] select-none relative"
      style={{
        backgroundColor: '#2D343C',
        border: '1px solid #51626B',
        borderTop: `3px solid ${topLineColor}`,
        padding: '8px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.65)',
      }}
    >
      <CardHeader vehicle={v} />

      <Group>
        {v.primaryWeapon?.name && (
          <Row label={<span className={BLUE}>{v.primaryWeapon.name}</span>}>
            <span className="mr-[5px]">Ammo:</span>
            {v.primaryWeapon.ammo}
          </Row>
        )}
        {v.secondaryWeapons?.map((w) => (
          <Row
            key={w.id}
            label={
              <>
                {w.prefix && <span className="inline-block w-[33px]">{w.prefix}</span>}
                <span className={BLUE}>{w.name}</span>
              </>
            }
          >
            <span className="mr-[5px]">Ammo:</span>
            {w.ammo}
          </Row>
        ))}
      </Group>

      <Group>
        {v.uavRecon && <Row label={<span className={BLUE}>{v.uavName || 'UAV Recon Micro'}</span>}>{v.uavRecon}</Row>}
        {v.guidanceSpeedHorStock && (
          <Row label="Guidance Speed:">
            <div>
              Hor.: {v.guidanceSpeedHorStock}°/s{isAce && <Ace value={`${v.guidanceSpeedHorAce}°/s`} />}
            </div>
            <div>
              Vert.: {v.guidanceSpeedVertStock}°/s{isAce && <Ace value={`${v.guidanceSpeedVertAce}°/s`} />}
            </div>
          </Row>
        )}
        {v.verticalGuidance && <Row label="Vertical Guidance:">{v.verticalGuidance}</Row>}
        {v.fireRate && <Row label="Fire rate:">{v.fireRate}</Row>}
        {v.reloadingRate && (
          <Row label="Reloading rate:">
            {v.reloadingRate}
            {isAce && v.reloadingRateAce && <Ace value={v.reloadingRateAce} />}
          </Row>
        )}
      </Group>

      <Group>
        <Row label="Protection:" sub={<ViewButton icon="assets/game/svg/btn_dm_viewer_armor.svg" text="Armor" onClick={onViewArmor} />}>
          {[v.protectionSummary, v.bulletproofRating]
            .join('\n')
            .split('\n')
            .filter(Boolean)
            .map((line, i) => (
              <div key={i} className={BLUE}>
                {line}
              </div>
            ))}
        </Row>
      </Group>

      <Group>
        {v.systems && (
          <Row label="Systems:" sub={<ViewButton icon="assets/game/svg/btn_dm_viewer_xray.svg" text="X-Ray" onClick={onViewXRay} />}>
            {v.systems.split('\n').map((line, i) => (
              <div key={i} className={BLUE}>
                {items(line.split(/,\s*/).filter(Boolean))}
              </div>
            ))}
          </Row>
        )}
      </Group>

      <Group>
        {v.ammoTypes?.length > 0 && (
          <Row label={`Ammo ${v.ammoCaliber || v.primaryWeapon?.name.match(/^[\d.]+ mm/)?.[0] || ''}:`}>
            <div className={BLUE}>{items(v.ammoTypes)}</div>
          </Row>
        )}
      </Group>

      <Group>
        <Row label="Crew">{v.crew}</Row>
        <Row label="Mass:">{v.mass}</Row>
        <Row label={<span className={BLUE}>Engine Power:</span>}>{v.enginePower}</Row>
        <Row
          label={
            <>
              <span className={BLUE}>Max speed</span> (forward/reverse):
            </>
          }
        >
          {v.maxSpeedReverse ? `${v.maxSpeedForward} / ${v.maxSpeedReverse}` : v.maxSpeedForward} km/h
        </Row>
        {v.visibility && <Row label="Visibility:">{v.visibility}</Row>}
      </Group>

      <Group>
        {!v.owned && v.requiredRP && (
          <Row label="Required RP:">
            {v.requiredRP}
            <Icon src={RP} />
          </Row>
        )}
        {!v.owned && v.efficientProgressFrom && (
          <Row
            label={
              <>
                Efficient progress from <span className={GOLD}>{v.efficientProgressFrom}</span>:
              </>
            }
          >
            <span className={GOLD}>{v.efficientProgressBonus || '110%'}</span>
          </Row>
        )}
        {!v.owned && v.price && (
          <Row label="Price">
            <span className={v.cantAfford ? 'text-[#fa4a38]' : ''}>{v.price}</span>
            <Icon src={v.priceCurrency === 'ge' ? GE : SL} />
          </Row>
        )}
        {v.crewTrainCost && (
          <Row label="Crew train cost:">
            {v.crewTrainCost}
            <Icon src={SL} />
          </Row>
        )}
      </Group>

      <Group>
        {!v.owned && v.freeRepairs && <Row label="Free repairs:">{v.freeRepairs}</Row>}
        {v.repairCostPerMin && (
          <Row label="Repair cost depending on lifetime:">
            {v.repairCostPerMin}
            <Icon src={SL} />
            /min
          </Row>
        )}
        {v.maxRepairCost && (
          <Row label="Max repair cost:">
            {v.maxRepairCost}
            {v.maxRepairCost !== 'Free' && <Icon src={SL} />}
          </Row>
        )}
        {v.freeRepairTime && (
          <Row label={v.owned ? 'Free repair time (with crew):' : 'Free repair time:'}>
            {v.freeRepairTime}
          </Row>
        )}
      </Group>

      <Group>
        {v.researchEfficiencyRanks && <Row label="Max vehicle research efficiency:">{v.researchEfficiencyRanks}</Row>}
        <Row
          label={
            <>
              Reward <span className={BRIGHT}>{v.rpRewardPercent}</span>
              <Icon src={RP} />:
            </>
          }
        >
          {renderRpMultiplier(v.rpMultiplier)}
        </Row>
        <Row
          label={
            <>
              Reward <span className={BRIGHT}>{v.slRewardPercent}</span>
              <Icon src={SL} />:
            </>
          }
        >
          {renderSlMultiplier(v.slMultiplier)}
        </Row>
      </Group>

      <div className={`mt-[6px] ${DIM}`}>
        <div className="text-center">
          Information is relevant to: <Icon src="assets/game/svg/army_fighter.svg" />{' '}
          {v.gameMode === 'realistic' ? 'Realistic Battles' : v.gameMode === 'arcade' ? 'Arcade Battles' : 'Simulator Battles'}
        </div>
        {(v.crewModificationNote || v.owned) && (
          <div className="text-center">{v.crewModificationNote || 'Current vehicle modification with the crew.'}</div>
        )}
        {isAce && (
          <div>
            <Icon src={STAR} />
            value for a top crew
          </div>
        )}
      </div>
    </div>
  );
};
