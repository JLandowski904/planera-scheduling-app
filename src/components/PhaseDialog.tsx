import React, { useEffect, useState } from 'react';
import { Phase } from '../types';

interface PhaseDialogProps {
  isOpen: boolean;
  phase: Phase | null;
  onClose: () => void;
  onSubmit: (updatedPhase: Phase) => void;
}

const PhaseDialog: React.FC<PhaseDialogProps> = ({ isOpen, phase, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#1d4ed8');

  useEffect(() => {
    if (phase && isOpen) {
      setTitle(phase.title);
      setColor(phase.color || '#1d4ed8');
    }
  }, [phase, isOpen]);

  if (!isOpen || !phase) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      ...phase,
      title: title.trim(),
      color,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Edit phase</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"
            aria-label="Close phase dialog"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter phase name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="w-12 h-12 border border-slate-200 rounded cursor-pointer shadow-sm"
              />
              <input
                type="text"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#1d4ed8"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PhaseDialog;
