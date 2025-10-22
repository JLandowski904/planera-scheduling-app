import React from 'react';
import {
  CheckSquare,
  Package,
  Calendar,
  User,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  Layers,
} from 'lucide-react';
import { NodeType } from '../types';

interface CanvasToolbarProps {
  onNewNode: (type: NodeType) => void;
  onNewPhase: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onNewNode,
  onNewPhase,
  zoom,
  onZoomIn,
  onZoomOut,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNewNode('task')}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <CheckSquare className="w-4 h-4" />
          Task
        </button>
        <button
          onClick={() => onNewNode('deliverable')}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Package className="w-4 h-4" />
          Deliverable
        </button>
        <button
          onClick={() => onNewNode('milestone')}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Calendar className="w-4 h-4" />
          Milestone
        </button>
        <button
          onClick={() => onNewNode('person')}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <User className="w-4 h-4" />
          Person
        </button>
        <button
          onClick={onNewPhase}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Layers className="w-4 h-4" />
          Phase
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-300 mx-2" />

        <button
          onClick={onZoomOut}
          className="p-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-sm text-slate-600 min-w-12 text-center font-medium">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          className="p-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CanvasToolbar;
