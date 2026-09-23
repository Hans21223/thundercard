import React from 'react';
import { VehicleData, VehicleClass } from '../../types/vehicle';

interface CardHeaderProps {
  vehicle: VehicleData;
}

// In-game War Thunder class colors (from const/colors.css) & authentic vector icons (from def_*_radar.svg)
interface ClassMeta {
  color: string;
  renderIcon: () => React.ReactNode;
}

export const CLASS_METAS: Record<VehicleClass, ClassMeta> = {
  light_tank: {
    color: '#ffeeee', // @light_tankColor
    renderIcon: () => (
      <svg width="12" height="7" viewBox="0 0 11 6" className="inline-block shrink-0" fill="currentColor">
        <path d="M 1 1 L 10 1 L 10 5 L 1 5 L 1 1 Z" fillOpacity="0.3"/>
        <path d="M 2 2 L 9 2 L 9 4 L 2 4 L 2 2 Z" />
      </svg>
    ),
  },
  medium_tank: {
    color: '#ffaaaa', // @medium_tankColor
    renderIcon: () => (
      <svg width="12" height="8" viewBox="0 0 11 7" className="inline-block shrink-0" fill="currentColor">
        <path d="M 7 5 L 4 5 L 4 6 L 1 6 L 1 1 L 10 1 L 10 6 L 7 6 L 7 5 Z" fillOpacity="0.3"/>
        <path d="M 8 4 L 3 4 L 3 5 L 2 5 L 2 2 L 9 2 L 9 5 L 8 5 L 8 4 Z" />
      </svg>
    ),
  },
  heavy_tank: {
    color: '#ff6666', // @heavy_tankColor
    renderIcon: () => (
      <svg width="12" height="10" viewBox="0 0 11 9" className="inline-block shrink-0" fill="currentColor">
        <path d="M 8 3 L 10 3 L 10 8 L 6 8 L 6 7 L 5 7 L 5 8 L 1 8 L 1 3 L 3 3 L 3 1 L 8 1 L 8 3 Z" fillOpacity="0.3"/>
        <path d="M 4 4 L 2 4 L 2 7 L 4 7 L 4 6 L 7 6 L 7 7 L 9 7 L 9 4 L 7 4 L 7 2 L 4 2 L 4 4 Z" />
      </svg>
    ),
  },
  destroyer_tank: {
    color: '#bde9b5', // @tank_destroyerColor
    renderIcon: () => (
      <svg width="12" height="11" viewBox="0 0 10 9" className="inline-block shrink-0" fill="currentColor">
        <path d="M 1 4.6 L 1 8 L 9 8 L 9 4 L 6.4 4 L 9 1.4 L 9 1 L 4.6 1 L 1 4.6 Z" fillOpacity="0.3"/>
        <path d="M 2 5 L 2 7 L 8 7 L 8 5 L 4 5 L 7 2 L 5 2 L 2 5 Z" />
      </svg>
    ),
  },
  spaa_tank: {
    color: '#c6a0ff', // @spaaColor
    renderIcon: () => (
      <svg width="12" height="11" viewBox="0 0 10 9" className="inline-block shrink-0" fill="currentColor">
        <path d="M 8 4.063 L 8 1 L 2 1 L 2 4.063 L 1 4.063 L 1 8 L 9 8 L 9 4.063 L 8 4.063 Z" fillOpacity="0.3"/>
        <path d="M 7 5 L 8 5 L 8 7 L 2 7 L 2 5 L 3 5 L 3 2 L 4 2 L 4 5 L 6 5 L 6 2 L 7 2 L 7 5 Z" />
      </svg>
    ),
  },
  aviation_fighter: {
    color: '#ffac6f', // @medium_fighterColor
    renderIcon: () => (
      <svg width="12" height="12" viewBox="0 0 28 28" className="inline-block shrink-0" fill="currentColor">
        <path d="m13.88,23.86l-.08-1.1-.56,1.02-3.03-.4c-.1-.43-.18-1-.11-1.32.02-.11.06-.17.12-.19l3.15-1.06-.7-5.06-8.93-1.36s-.09-.07-.14-.18c-.21-.53-.32-1.76-.16-2.42.05-.21.14-.32.26-.32h9.1s.23-2.02.23-2.02c0-.16.03-.28.07-.37.04-.09.09-.16.16-.2.07-.04.15-.07.24-.08.09-.01.19-.02.3-.02v-.17h-.05c-.42,0-.83.03-1.25.08-.42.06-.78.08-1.11.08-.11,0-.2-.01-.28-.06-.08-.04-.14-.09-.17-.14-.04-.05-.05-.09-.05-.13,0-.04.04-.06.11-.06h2.74s0-.08,0-.08c0-.03,0-.05.02-.08.02-.03.06-.05.11-.05h.03s0-.07,0-.09c0-.02.04-.03.08-.03.05,0,.08.01.08.03,0,.02.01.05.01.09h.05s.08.02.09.05c.02.03.03.05.03.08v.09c.41,0,.82-.04,1.24-.09.42-.06.78-.08,1.11-.08.11,0,.21.02.28.06.08.04.13.08.17.13.04.05.05.09.04.13-.01.04-.05.06-.11.06h-2.78s0,.17,0,.17c.11,0,.21.01.3.02.09.01.17.04.24.08.07.05.12.11.16.2.04.09.06.21.07.36l.22,2.03h9.1c.12,0,.21.11.26.32.16.67.04,1.88-.15,2.42-.04.12-.08.18-.13.18l-8.94,1.36-.69,5.07,3.14,1.05c.06.02.1.08.13.19.08.33-.01.91-.11,1.33l-3.04.39-.55-1.02-.08,1.1c0,.07-.05.1-.14.1-.03,0-.05-.01-.08-.03-.03-.01-.04-.04-.03-.07Z" />
      </svg>
    ),
  },
  aviation_strike: {
    color: '#bde9b5', // @common_assaultColor
    renderIcon: () => (
      <svg width="12" height="12" viewBox="0 0 28 28" className="inline-block shrink-0" fill="currentColor">
        <path d="m13.88,23.86l-.08-1.1-.56,1.02-3.03-.4c-.1-.43-.18-1-.11-1.32.02-.11.06-.17.12-.19l3.15-1.06-.7-5.06-8.93-1.36s-.09-.07-.14-.18c-.21-.53-.32-1.76-.16-2.42.05-.21.14-.32.26-.32h9.1s.23-2.02.23-2.02c0-.16.03-.28.07-.37.04-.09.09-.16.16-.2.07-.04.15-.07.24-.08.09-.01.19-.02.3-.02v-.17h-.05c-.42,0-.83.03-1.25.08-.42.06-.78.08-1.11.08-.11,0-.2-.01-.28-.06-.08-.04-.14-.09-.17-.14-.04-.05-.05-.09-.05-.13,0-.04.04-.06.11-.06h2.74s0-.08,0-.08c0-.03,0-.05.02-.08.02-.03.06-.05.11-.05h.03s0-.07,0-.09c0-.02.04-.03.08-.03.05,0,.08.01.08.03,0,.02.01.05.01.09h.05s.08.02.09.05c.02.03.03.05.03.08v.09c.41,0,.82-.04,1.24-.09.42-.06.78-.08,1.11-.08.11,0,.21.02.28.06.08.04.13.08.17.13.04.05.05.09.04.13-.01.04-.05.06-.11.06h-2.78s0,.17,0,.17c.11,0,.21.01.3.02.09.01.17.04.24.08.07.05.12.11.16.2.04.09.06.21.07.36l.22,2.03h9.1c.12,0,.21.11.26.32.16.67.04,1.88-.15,2.42-.04.12-.08.18-.13.18l-8.94,1.36-.69,5.07,3.14,1.05c.06.02.1.08.13.19.08.33-.01.91-.11,1.33l-3.04.39-.55-1.02-.08,1.1c0,.07-.05.1-.14.1-.03,0-.05-.01-.08-.03-.03-.01-.04-.04-.03-.07Z" />
      </svg>
    ),
  },
  aviation_bomber: {
    color: '#bfd4ff', // @light_bomberColor
    renderIcon: () => (
      <svg width="12" height="12" viewBox="0 0 28 28" className="inline-block shrink-0" fill="currentColor">
        <path d="m13.88,23.86l-.08-1.1-.56,1.02-3.03-.4c-.1-.43-.18-1-.11-1.32.02-.11.06-.17.12-.19l3.15-1.06-.7-5.06-8.93-1.36s-.09-.07-.14-.18c-.21-.53-.32-1.76-.16-2.42.05-.21.14-.32.26-.32h9.1s.23-2.02.23-2.02c0-.16.03-.28.07-.37.04-.09.09-.16.16-.2.07-.04.15-.07.24-.08.09-.01.19-.02.3-.02v-.17h-.05c-.42,0-.83.03-1.25.08-.42.06-.78.08-1.11.08-.11,0-.2-.01-.28-.06-.08-.04-.14-.09-.17-.14-.04-.05-.05-.09-.05-.13,0-.04.04-.06.11-.06h2.74s0-.08,0-.08c0-.03,0-.05.02-.08.02-.03.06-.05.11-.05h.03s0-.07,0-.09c0-.02.04-.03.08-.03.05,0,.08.01.08.03,0,.02.01.05.01.09h.05s.08.02.09.05c.02.03.03.05.03.08v.09c.41,0,.82-.04,1.24-.09.42-.06.78-.08,1.11-.08.11,0,.21.02.28.06.08.04.13.08.17.13.04.05.05.09.04.13-.01.04-.05.06-.11.06h-2.78s0,.17,0,.17c.11,0,.21.01.3.02.09.01.17.04.24.08.07.05.12.11.16.2.04.09.06.21.07.36l.22,2.03h9.1c.12,0,.21.11.26.32.16.67.04,1.88-.15,2.42-.04.12-.08.18-.13.18l-8.94,1.36-.69,5.07,3.14,1.05c.06.02.1.08.13.19.08.33-.01.91-.11,1.33l-3.04.39-.55-1.02-.08,1.1c0,.07-.05.1-.14.1-.03,0-.05-.01-.08-.03-.03-.01-.04-.04-.03-.07Z" />
      </svg>
    ),
  },
  helicopter: {
    color: '#f2f266', // @attack_helicopterColor
    renderIcon: () => (
      <svg width="12" height="12" viewBox="0 0 28 28" className="inline-block shrink-0" fill="currentColor">
        <path d="M 6.5 1 L 12 6 L 6.5 10 L 1 6 Z" />
      </svg>
    ),
  },
};

export const CardHeader: React.FC<CardHeaderProps> = ({ vehicle }) => {
  const classMeta = CLASS_METAS[vehicle.vehicleClass] || CLASS_METAS.medium_tank;
  const lines = (text: string) => text.split('\n').map((line, i) => <div key={i}>{line}</div>);
  const withGe = (line: string, key: number) => (
    <div key={key}>
      {line.split('[GE]').map((part, i, all) => (
        <React.Fragment key={i}>
          {part}
          {i < all.length - 1 && <img src="assets/game/svg/item_type_eagles.svg" alt="GE" className="inline-block w-3.5 h-3.5 align-[-2px]" />}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="w-full flex flex-col items-center text-center">
      {vehicle.headerTooltip && <div className="text-[11px] text-[#bdbdbd]">{vehicle.headerTooltip}</div>}

      {/* Centered; a name too long for the card starts at the left and is clipped (in-game it auto-scrolls) */}
      <h1 className="w-full flex [justify-content:safe_center] overflow-hidden whitespace-nowrap mt-[2px] text-[14.5px] text-[#e0e0e0]">
        <span className="shrink-0">{vehicle.name || 'Vehicle Name'}</span>
      </h1>

      <div className="flex items-center justify-center gap-1.5" style={{ color: classMeta.color }}>
        {classMeta.renderIcon()}
        <span>{vehicle.typeLabel || 'Medium Tank'}</span>
      </div>

      <div className="flex items-center justify-center gap-3">
        <span>
          Rank: <span className="text-white">{vehicle.rank || 'I'}</span>
        </span>
        <span>
          Battle rating: <span className="text-white">{vehicle.battleRating || '1.0'}</span>
        </span>
      </div>

      {/* Vehicle render box matching in-game aircraft-image-nest */}
      <div className="relative w-full h-[223px] overflow-hidden flex items-end justify-center">
        {vehicle.countryFlag && (
          <img
            src={vehicle.countryFlag}
            alt="Flag"
            className="absolute top-0 left-0 w-[220px] h-[125px] object-contain object-left-top pointer-events-none"
            style={{
              maskImage: 'radial-gradient(ellipse 95% 85% at 20% 20%, black 45%, transparent 95%)',
              WebkitMaskImage: 'radial-gradient(ellipse 95% 85% at 20% 20%, black 45%, transparent 95%)',
              opacity: vehicle.flagBackdropOpacity ?? 1.0,
              transform: `scale(${vehicle.flagBackdropScale || 1.0})`,
            }}
          />
        )}
        {vehicle.vehicleImage ? (
          <img
            src={vehicle.vehicleImage}
            alt={vehicle.name}
            className="relative z-10 w-full h-[190px] object-contain object-bottom pointer-events-none"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'assets/game/tanks/us_m60a1_rise_mod.avif';
            }}
          />
        ) : (
          <div className="relative z-10 text-xs text-gray-500 italic pb-8">No vehicle image</div>
        )}
      </div>

      {vehicle.statusType === 'locked' && (
        <div className="w-full mt-[4px] text-[#f02020]">
          {vehicle.statusText
            ? lines(vehicle.statusText)
            : lines(`Rank ${vehicle.rank} is locked.\nYou need to purchase more vehicles of rank ${vehicle.rank}.`)}
        </div>
      )}

      {vehicle.statusType === 'reserve' && (
        <div className="w-full mt-[4px] px-2">
          {vehicle.statusText || 'A reserve vehicle, available to everyone. This vehicle is repaired immediately after each battle.'}
        </div>
      )}

      {vehicle.statusType === 'squadron' && (
        <div className="w-full mt-[4px] text-[#bde9b5]">
          <div>Squadron vehicle</div>
          {vehicle.statusText && <div className="text-[#c0c0c0]">{vehicle.statusText}</div>}
        </div>
      )}

      {vehicle.statusType === 'pack' && (
        <div className="w-full mt-[4px] text-[#f9db78]">
          {(vehicle.statusText ||
            'This vehicle can only be obtained by purchasing a special pack.\n+ 20 backup vehicles for free, you save 2,200[GE]!'
          )
            .split('\n')
            .map(withGe)}
        </div>
      )}

      {vehicle.statusType === 'premium' && (
        <div className="w-full mt-[4px] text-[#f9db78]">
          You can purchase this vehicle for <span className="text-[#fa4a38]">{vehicle.price || '7,480'}</span>
          <img src="assets/game/svg/item_type_eagles.svg" alt="GE" className="inline-block w-3.5 h-3.5 align-[-2px]" />
        </div>
      )}
    </div>
  );
};
