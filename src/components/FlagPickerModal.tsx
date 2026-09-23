import React, { useState, useMemo, useRef } from 'react';
import { FLAGS } from '../data/flags';

interface FlagPickerModalProps {
  isOpen: boolean;
  selectedFlag: string;
  onSelect: (flagPath: string) => void;
  onClose: () => void;
}

export const FlagPickerModal: React.FC<FlagPickerModalProps> = ({ isOpen, selectedFlag, onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Shrink to 2× the card's 220×125 flag box so the autosave (localStorage) and JSON stay small.
  const uploadFlag = async (file?: File) => {
    if (!file) return;
    try {
      const img = await createImageBitmap(file);
      const scale = Math.min(1, 440 / img.width, 250 / img.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      onSelect(canvas.toDataURL('image/png'));
      onClose();
    } catch {
      alert('Could not read that image. Try a PNG or JPG.');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const filteredFlags = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return FLAGS.filter((f) => f.name.toLowerCase().includes(q) || f.id.includes(q));
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="ui-modal" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#1e2328] border border-[#353e47]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#353e47]">
          <span className="font-bold text-[#f0f0f0]">Flag</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search"
            className="ui-input flex-1"
            autoFocus
          />
          <input
            type="file"
            ref={fileRef}
            accept="image/*"
            onChange={(e) => uploadFlag(e.target.files?.[0])}
            className="hidden"
          />
          <button type="button" onClick={() => fileRef.current?.click()} className="ui-btn" title="Use your own flag image">
            Upload…
          </button>
          <button type="button" onClick={onClose} className="ui-btn">
            Close
          </button>
        </div>
        <div className="p-3 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {filteredFlags.map((flag) => (
            <button
              key={flag.id}
              type="button"
              onClick={() => {
                onSelect(flag.path);
                onClose();
              }}
              className={`ui-choice flex items-center gap-2 ${selectedFlag === flag.path ? 'is-active' : ''}`}
            >
              <img src={flag.path} alt="" className="w-8 h-5 object-contain shrink-0" />
              <span className="truncate">{flag.name}</span>
            </button>
          ))}
          {filteredFlags.length === 0 && <div className="col-span-full py-8 text-center">No flags match.</div>}
        </div>
      </div>
    </div>
  );
};
