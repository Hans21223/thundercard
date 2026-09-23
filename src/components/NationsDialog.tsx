import React, { useRef, useState } from 'react';
import { FLAGS } from '../data/flags';
import { shrinkImage } from '../utils/exportImage';

export interface Nation {
  id: string;
  name: string;
  flag: string; // image path or uploaded data URL
}
export interface NationPrefs {
  order: string[]; // nation ids in bar order
  hidden: string[];
  custom: Nation[]; // nations the user added
}
export const EMPTY_PREFS: NationPrefs = { order: [], hidden: [], custom: [] };

// Game nations first in game order, then custom ones; the user's order wins when set
export function orderNations(all: Nation[], prefs: NationPrefs): Nation[] {
  const pos = (id: string, i: number) => {
    const k = prefs.order.indexOf(id);
    return k < 0 ? 1000 + i : k;
  };
  return all.map((n, i) => [n, pos(n.id, i)] as const).sort((a, b) => a[1] - b[1]).map(([n]) => n);
}

export const NationsDialog: React.FC<{
  nations: Nation[]; // all, in bar order
  prefs: NationPrefs;
  onChange: (p: NationPrefs) => void;
  onClose: () => void;
}> = ({ nations, prefs, onChange, onClose }) => {
  const [name, setName] = useState('');
  const [flag, setFlag] = useState(FLAGS[0].path);
  const fileRef = useRef<HTMLInputElement>(null);
  const isCustom = (id: string) => prefs.custom.some((c) => c.id === id);

  const move = (i: number, d: number) => {
    const ids = nations.map((n) => n.id);
    if (i + d < 0 || i + d >= ids.length) return;
    [ids[i], ids[i + d]] = [ids[i + d], ids[i]];
    onChange({ ...prefs, order: ids });
  };
  const toggle = (id: string) =>
    onChange({ ...prefs, hidden: prefs.hidden.includes(id) ? prefs.hidden.filter((x) => x !== id) : [...prefs.hidden, id] });
  const rename = (id: string, value: string) =>
    onChange({ ...prefs, custom: prefs.custom.map((c) => (c.id === id ? { ...c, name: value } : c)) });
  const remove = (id: string) =>
    confirm('Remove this nation from the bar? Trees you made with it keep working.') &&
    onChange({ ...prefs, custom: prefs.custom.filter((c) => c.id !== id), order: prefs.order.filter((x) => x !== id) });
  const add = () => {
    if (!name.trim()) return;
    onChange({ ...prefs, custom: [...prefs.custom, { id: `custom_${Date.now()}`, name: name.trim(), flag }] });
    setName('');
  };

  return (
    <div className="ui-modal" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[85vh] flex flex-col bg-[#1e2328] border border-[#353e47]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#353e47]">
          <span className="flex-1 font-bold text-[#f0f0f0]">Nations</span>
          <button type="button" onClick={onClose} className="ui-btn">
            Done
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {nations.map((n, i) => (
            <div key={n.id} className="flex items-center gap-2 py-1.5 border-b border-[#2a3239]">
              <input type="checkbox" checked={!prefs.hidden.includes(n.id)} onChange={() => toggle(n.id)} className="ui-check" title="Show in the bar" />
              <img src={n.flag} alt="" className="w-9 h-6 object-contain shrink-0" />
              {isCustom(n.id) ? (
                <input type="text" value={n.name} onChange={(e) => rename(n.id, e.target.value)} className="ui-input flex-1 !h-6" />
              ) : (
                <span className="flex-1 text-[13px]">{n.name}</span>
              )}
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="ui-btn !h-6 !px-2 text-[12px]">
                Up
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === nations.length - 1} className="ui-btn !h-6 !px-2 text-[12px]">
                Down
              </button>
              {isCustom(n.id) && (
                <button type="button" onClick={() => remove(n.id)} className="ui-btn !h-6 !px-2 text-[12px] hover:!text-[#f02020]">
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-[#353e47] bg-[#1b1f24] space-y-2">
          <span className="ui-heading !mb-1">Add a nation</span>
          <div className="flex items-center gap-2">
            <img src={flag} alt="" className="w-12 h-8 object-contain shrink-0 bg-[#121518] border border-[#353e47]" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="Name"
              className="ui-input flex-1"
            />
            <button type="button" onClick={add} disabled={!name.trim()} className="ui-btn-primary">
              Add
            </button>
          </div>
          <div className="flex items-center gap-2">
            <select value={FLAGS.some((f) => f.path === flag) ? flag : ''} onChange={(e) => e.target.value && setFlag(e.target.value)} className="ui-input flex-1">
              <option value="">Uploaded image</option>
              {FLAGS.map((f) => (
                <option key={f.id} value={f.path}>
                  {f.name}
                </option>
              ))}
            </select>
            <input
              type="file"
              ref={fileRef}
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setFlag(await shrinkImage(file, 440, 250));
                } catch {
                  alert('Could not read that image. Try a PNG or JPG.');
                }
                e.target.value = '';
              }}
            />
            <button type="button" onClick={() => fileRef.current?.click()} className="ui-btn">
              Upload flag…
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
