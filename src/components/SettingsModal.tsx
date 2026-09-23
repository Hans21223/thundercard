import React from 'react';

// App settings: checkboxes, each saved in the browser by its owner
export interface Setting {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

export const SettingsModal: React.FC<{ settings: Setting[]; onClose: () => void }> = ({ settings, onClose }) => (
  <div className="ui-modal" onClick={onClose}>
    <div className="w-[28rem] bg-[#1e2328] border border-[#353e47] p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
      <div className="font-bold text-[#f0f0f0]">Settings</div>
      {settings.map((s) => (
        <label key={s.label} className="flex items-start gap-2.5 cursor-pointer">
          <input type="checkbox" checked={s.value} onChange={(e) => s.onChange(e.target.checked)} className="ui-check mt-0.5" />
          <span>
            <span className="block text-[13px] text-[#c0c0c0]">{s.label}</span>
            <span className="block text-[12px] text-[#8a939b]">{s.hint}</span>
          </span>
        </label>
      ))}
      <div className="flex justify-end">
        <button type="button" onClick={onClose} className="ui-btn">
          Close
        </button>
      </div>
    </div>
  </div>
);
