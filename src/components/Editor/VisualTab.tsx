import React, { useRef } from 'react';
import { VehicleData } from '../../types/vehicle';

interface VisualTabProps {
  vehicle: VehicleData;
  onChange: (updates: Partial<VehicleData>) => void;
  onOpenFlagPicker: () => void;
}

export const VisualTab: React.FC<VisualTabProps> = ({ vehicle, onChange, onOpenFlagPicker }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => reader.result && onChange({ vehicleImage: reader.result as string });
    reader.readAsDataURL(file);
  };

  const opacity = vehicle.flagBackdropOpacity ?? 1;
  const scale = vehicle.flagBackdropScale || 1;

  return (
    <div className="space-y-4">
      <div className="ui-section">
        <span className="ui-heading">Layout</span>
        <div className="flex gap-1.5">
          {(['modern', 'legacy'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => onChange({ cardLayout: l })}
              className={`ui-choice ${vehicle.cardLayout === l ? 'is-active' : ''}`}
            >
              {l === 'modern' ? 'In-game' : 'Legacy (555px)'}
            </button>
          ))}
        </div>
      </div>

      <div className="ui-section">
        <span className="ui-heading">Vehicle image</span>
        <div className="flex gap-3">
          <div className="w-28 h-16 bg-[#121518] border border-[#353e47] flex items-center justify-center shrink-0">
            {vehicle.vehicleImage && <img src={vehicle.vehicleImage} alt="" className="w-full h-full object-contain" />}
          </div>
          <div className="flex-1 space-y-2">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="ui-btn">
              Upload image…
            </button>
            <input
              type="text"
              value={vehicle.vehicleImage || ''}
              onChange={(e) => onChange({ vehicleImage: e.target.value })}
              placeholder="Image path or URL"
              className="ui-input"
            />
          </div>
        </div>
      </div>

      <div className="ui-section">
        <span className="ui-heading">Flag</span>
        <div className="flex gap-3">
          <div className="w-28 h-16 bg-[#121518] border border-[#353e47] flex items-center justify-center shrink-0">
            {vehicle.countryFlag && <img src={vehicle.countryFlag} alt="" className="w-full h-full object-contain" />}
          </div>
          <div className="flex-1 space-y-2">
            <button type="button" onClick={onOpenFlagPicker} className="ui-btn">
              Change flag…
            </button>
            <label className="grid grid-cols-[70px_1fr_40px] items-center gap-2 text-[12px] text-[#8a939b]">
              Opacity
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => onChange({ flagBackdropOpacity: parseFloat(e.target.value) })}
                className="accent-[#9cc6de]"
              />
              <span className="text-right text-[#c0c0c0]">{Math.round(opacity * 100)}%</span>
            </label>
            <label className="grid grid-cols-[70px_1fr_40px] items-center gap-2 text-[12px] text-[#8a939b]">
              Scale
              <input
                type="range"
                min="0.8"
                max="1.6"
                step="0.05"
                value={scale}
                onChange={(e) => onChange({ flagBackdropScale: parseFloat(e.target.value) })}
                className="accent-[#9cc6de]"
              />
              <span className="text-right text-[#c0c0c0]">{scale.toFixed(2)}×</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
