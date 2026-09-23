import React, { useEffect, useState } from 'react';
import { storageUse } from '../utils/storage';

// App settings: checkboxes, or a choice from a list; each saved in the browser by its owner
export type Setting = { label: string; hint: string } & (
  | { value: boolean; onChange: (v: boolean) => void }
  | {
      value: string;
      options: [value: string, label: string][];
      onChange: (v: string) => void;
    }
);

const mb = (bytes: number) => (bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${(bytes / 1e6).toFixed(1)} MB`);

export const SettingsModal: React.FC<{
  settings: Setting[];
  onClose: () => void;
}> = ({ settings, onClose }) => {
  const [use, setUse] = useState<{ used: number; room: number } | null>(null);
  useEffect(() => {
    storageUse().then(setUse);
  }, []);
  return (
    <div className="ui-modal" onClick={onClose}>
      <div className="w-[28rem] bg-[#1e2328] border border-[#353e47] p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="font-bold text-[#f0f0f0]">Settings</div>
        {settings.map((s) => (
          <label key={s.label} className="flex items-start gap-2.5 cursor-pointer">
            {'options' in s ? (
              <select
                value={s.value}
                onChange={(e) => s.onChange(e.target.value)}
                className="ui-input !w-16 !h-6 shrink-0 text-[12px]"
              >
                {s.options.map(([v, text]) => (
                  <option key={v} value={v}>
                    {text}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="checkbox"
                checked={s.value}
                onChange={(e) => s.onChange(e.target.checked)}
                className="ui-check mt-0.5"
              />
            )}
            <span>
              <span className="block text-[13px] text-[#c0c0c0]">{s.label}</span>
              <span className="block text-[12px] text-[#8a939b]">{s.hint}</span>
            </span>
          </label>
        ))}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] text-[#8a939b]">
            {use &&
              `Saves use ${mb(use.used)} of the ${mb(use.room)} this browser allows. Export your Library now and then as a backup.`}
          </span>
          <button type="button" onClick={onClose} className="ui-btn shrink-0">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
