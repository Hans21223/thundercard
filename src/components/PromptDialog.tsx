import React, { useState } from 'react';

// Small in-app popup that asks for a name (new folder, new tree, rename…)
export interface PromptRequest {
  title: string;
  initial?: string;
  placeholder?: string;
  confirmText?: string;
  onSubmit: (value: string) => void;
}

export const PromptDialog: React.FC<PromptRequest & { onClose: () => void }> = ({
  title,
  initial = '',
  placeholder,
  confirmText = 'OK',
  onSubmit,
  onClose,
}) => {
  const [value, setValue] = useState(initial);
  return (
    <div
      className="ui-modal z-[60]"
      onClick={(e) => {
        e.stopPropagation(); // don't also close a dialog underneath
        onClose();
      }}
    >
      <form
        className="w-80 bg-[#1e2328] border border-[#353e47] p-4 space-y-3"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!value.trim()) return;
          onSubmit(value.trim());
          onClose();
        }}
      >
        <div className="font-bold text-[#f0f0f0]">{title}</div>
        <input
          type="text"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={(e) => e.target.select()}
          placeholder={placeholder}
          className="ui-input"
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="ui-btn">
            Cancel
          </button>
          <button type="submit" className="ui-btn-primary" disabled={!value.trim()}>
            {confirmText}
          </button>
        </div>
      </form>
    </div>
  );
};
