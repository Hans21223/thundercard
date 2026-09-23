import React, { useRef, useState } from 'react';
import { VehicleData } from '../../types/vehicle';
import { ImageEditor } from '../ImageEditor';
import { vehiclePicture } from '../../utils/exportImage';

interface VisualTabProps {
  vehicle: VehicleData;
  onChange: (updates: Partial<VehicleData>) => void;
  onOpenFlagPicker: () => void;
}

export const VisualTab: React.FC<VisualTabProps> = ({ vehicle, onChange, onOpenFlagPicker }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) onChange({ vehicleImage: await vehiclePicture(file) });
  };

  // Picture size as width / height scale, the same numbers the card's transform box changes
  const sx = vehicle.imageScale ?? 1;
  const sy = vehicle.imageScaleY ?? sx;
  const [linked, setLinked] = useState(true);
  const setScale = (axis: 'Width' | 'Height', v: number) => {
    if (!linked) return onChange(axis === 'Width' ? { imageScale: v, imageScaleY: sy } : { imageScaleY: v });
    const k = v / (axis === 'Width' ? sx : sy);
    onChange({ imageScale: +(sx * k).toFixed(4), imageScaleY: +(sy * k).toFixed(4) });
  };

  const [editing, setEditing] = useState(false);

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
              {l === 'modern' ? 'In-game' : 'Simple'}
            </button>
          ))}
        </div>
        {vehicle.cardLayout !== 'legacy' && (
          <label
            className="grid grid-cols-[90px_1fr_48px] items-center gap-2 mt-2 text-[12px] text-[#8a939b]"
            data-tip="Where the values start. The game's is 218 px; you can also drag the dashed line on the card"
          >
            Label column
            <input
              type="range"
              min="120"
              max="330"
              value={vehicle.labelWidth ?? 218}
              onChange={(e) => onChange({ labelWidth: +e.target.value })}
              className="accent-[#9cc6de]"
            />
            <span className="text-right text-[#c0c0c0]">{vehicle.labelWidth ?? 218} px</span>
          </label>
        )}
      </div>

      <div className="ui-section">
        <span className="ui-heading">Vehicle image</span>
        <div className="flex gap-3">
          <div className="w-28 h-16 bg-[#121518] border border-[#353e47] flex items-center justify-center shrink-0">
            {vehicle.vehicleImage && <img src={vehicle.vehicleImage} alt="" className="w-full h-full object-contain" />}
          </div>
          <div className="flex-1 space-y-2">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="ui-btn"
              data-tip="Or paste (Ctrl+V) or drop a picture onto the card"
            >
              Upload image…
            </button>
            <input
              type="text"
              name="vehicleImage"
              value={vehicle.vehicleImage || ''}
              onChange={(e) => onChange({ vehicleImage: e.target.value })}
              placeholder="Image path or URL"
              className="ui-input"
            />
            {(['Width', 'Height'] as const).map((axis) => {
              const value = axis === 'Width' ? sx : sy;
              return (
                <label key={axis} className="grid grid-cols-[70px_1fr_40px] items-center gap-2 text-[12px] text-[#8a939b]">
                  {axis}
                  <input
                    type="range"
                    min="0.3"
                    max="3"
                    step="0.01"
                    value={value}
                    onChange={(e) => setScale(axis, parseFloat(e.target.value))}
                    className="accent-[#9cc6de]"
                  />
                  <span className="text-right text-[#c0c0c0]">{Math.round(value * 100)}%</span>
                </label>
              );
            })}
            <label className="flex items-center gap-2 text-[12px] text-[#8a939b]">
              <input type="checkbox" checked={linked} onChange={(e) => setLinked(e.target.checked)} className="ui-check" />
              Keep proportions
            </label>
            <div className="flex items-center justify-between gap-2 text-[12px] text-[#8a939b]">
              On the card, hover the picture for its transform box: drag to move, corners scale (Shift: freely), sides stretch.
              <button
                type="button"
                onClick={() => onChange({ imageScale: 1, imageScaleY: 1, imageX: 0, imageY: 0 })}
                className="ui-btn shrink-0"
              >
                Reset
              </button>
            </div>
            <button type="button" onClick={() => setEditing(true)} disabled={!vehicle.vehicleImage} className="ui-btn">
              Remove background…
            </button>
            {editing && (
              <ImageEditor
                src={vehicle.vehicleImage}
                // The cut-out is cropped to the vehicle, so the old placement no longer applies
                onApply={(url) => onChange({ vehicleImage: url, imageScale: 1, imageScaleY: 1, imageX: 0, imageY: 0 })}
                onClose={() => setEditing(false)}
              />
            )}
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
