import React, { useState, useRef } from 'react';
import { VehicleData } from '../types/vehicle';
import { exportCardAsPng, exportCardAsJpeg, copyCardToClipboard } from '../utils/exportImage';
import { downloadVehicleJson, parseVehicleJson } from '../utils/storage';

interface ExportBarProps {
  vehicle: VehicleData;
  onImportJson: (imported: VehicleData) => void;
  onResetToDefault: () => void;
}

export const ExportBar: React.FC<ExportBarProps> = ({ vehicle, onImportJson, onResetToDefault }) => {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filename = (ext: string) =>
    `${(vehicle.name || 'statcard').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}_statcard.${ext}`;

  const run = async (task: () => Promise<unknown>, error: string) => {
    try {
      setExporting(true);
      await task();
    } catch {
      alert(error);
    } finally {
      setExporting(false);
    }
  };

  const handleCopy = () =>
    run(async () => {
      if (!(await copyCardToClipboard('statcard-preview-target'))) throw new Error();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }, 'Could not copy the image. Try Save PNG instead.');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      onImportJson(await parseVehicleJson(file));
    } catch {
      alert('That file is not a ThunderCard JSON profile.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={handleCopy} disabled={exporting} className="ui-btn">
        {copied ? 'Copied' : 'Copy image'}
      </button>
      <button
        type="button"
        onClick={() => run(() => exportCardAsPng('statcard-preview-target', filename('png')), 'Could not export the image.')}
        disabled={exporting}
        className="ui-btn"
      >
        {exporting ? 'Rendering…' : 'Save PNG'}
      </button>
      <button
        type="button"
        onClick={() => run(() => exportCardAsJpeg('statcard-preview-target', filename('jpg')), 'Could not export the image.')}
        disabled={exporting}
        className="ui-btn"
      >
        Save JPG
      </button>
      <span className="w-px h-5 bg-[#353e47] mx-1" />
      <button type="button" onClick={() => downloadVehicleJson(vehicle)} className="ui-btn" title="Save this card as a JSON file">
        Save JSON
      </button>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json,application/json" className="hidden" />
      <button type="button" onClick={() => fileInputRef.current?.click()} className="ui-btn" title="Open a saved JSON file">
        Open JSON
      </button>
      <button
        type="button"
        onClick={() => confirm('Reset this card to its preset values?') && onResetToDefault()}
        className="ui-btn"
        title="Reset to the preset's values"
      >
        Reset
      </button>
    </div>
  );
};
