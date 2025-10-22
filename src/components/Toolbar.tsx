import React, { useRef } from 'react';
import { Project, NodeType, ViewType } from '../types';
import {
  Plus,
  Undo2,
  Redo2,
  Download,
  Upload,
  Link,
  Grid,
  ZoomIn,
  ZoomOut,
  Settings,
  AlertTriangle,
  FileText,
  BarChart3,
  Layout,
  CalendarDays,
} from 'lucide-react';

interface ToolbarProps {
  project: Project;
  onProjectChange: (project: Project) => void;
  onNewNode: (type: NodeType) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExport: (project: Project) => void;
  onImport: (file: File) => Promise<void>;
  linkMode: boolean;
  onLinkModeToggle: () => void;
  onToggleProperties: () => void;
  onToggleConflicts: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  project,
  onProjectChange,
  onNewNode,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExport,
  onImport,
  linkMode,
  onLinkModeToggle,
  onToggleProperties,
  onToggleConflicts,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await onImport(file);
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import project file');
      }
    }
  };

  const handleZoomIn = () => {
    onProjectChange({
      ...project,
      viewSettings: {
        ...project.viewSettings,
        zoom: Math.min(3, project.viewSettings.zoom * 1.2),
      },
    });
  };

  const handleZoomOut = () => {
    onProjectChange({
      ...project,
      viewSettings: {
        ...project.viewSettings,
        zoom: Math.max(0.1, project.viewSettings.zoom / 1.2),
      },
    });
  };

  const handleToggleGrid = () => {
    onProjectChange({
      ...project,
      viewSettings: {
        ...project.viewSettings,
        showGrid: !project.viewSettings.showGrid,
      },
    });
  };

  const handleToggleSnapToGrid = () => {
    onProjectChange({
      ...project,
      viewSettings: {
        ...project.viewSettings,
        snapToGrid: !project.viewSettings.snapToGrid,
      },
    });
  };

  const handleSwitchView = (view: ViewType) => {
    onProjectChange({
      ...project,
      viewSettings: {
        ...project.viewSettings,
        currentView: view,
      },
    });
  };

  const getConflictCount = () => {
    // This would be calculated from actual conflicts
    return 0;
  };

  const conflictCount = getConflictCount();

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
      {/* Left section */}
      <div className="flex items-center gap-2">
        {/* Project name */}
        <h1 className="text-lg font-semibold text-gray-900 mr-4">
          {project.name}
        </h1>

        {/* Add buttons */}
        <div className="flex items-center gap-1">
          <button
            className="toolbar-button"
            onClick={() => onNewNode('task')}
            title="New Task (N)"
          >
            <Plus className="w-4 h-4 mr-1" />
            Task
          </button>
          <button
            className="toolbar-button"
            onClick={() => onNewNode('milestone')}
            title="New Milestone (M)"
          >
            <Plus className="w-4 h-4 mr-1" />
            Milestone
          </button>
          <button
            className="toolbar-button"
            onClick={() => onNewNode('deliverable')}
            title="New Deliverable (D)"
          >
            <Plus className="w-4 h-4 mr-1" />
            Deliverable
          </button>
          <button
            className="toolbar-button"
            onClick={() => onNewNode('person')}
            title="New Person (P)"
          >
            <Plus className="w-4 h-4 mr-1" />
            Person
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 ml-4">
          <button
            className="toolbar-button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            className="toolbar-button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center section - View switcher */}
      <div className="flex items-center gap-1">
        <button
          className={`toolbar-button ${project.viewSettings.currentView === 'whiteboard' ? 'active' : ''}`}
          onClick={() => handleSwitchView('whiteboard')}
          title="Whiteboard View (1)"
        >
          <Layout className="w-4 h-4 mr-1" />
          Whiteboard
        </button>
        <button
          className={`toolbar-button ${project.viewSettings.currentView === 'timeline' ? 'active' : ''}`}
          onClick={() => handleSwitchView('timeline')}
          title="Timeline View (2)"
        >
          <BarChart3 className="w-4 h-4 mr-1" />
          Timeline
        </button>
        <button
          className={`toolbar-button ${project.viewSettings.currentView === 'calendar' ? 'active' : ''}`}
          onClick={() => handleSwitchView('calendar')}
          title="Calendar View (4)"
        >
          <CalendarDays className="w-4 h-4 mr-1" />
          Calendar
        </button>
        <button
          className={`toolbar-button ${project.viewSettings.currentView === 'table' ? 'active' : ''}`}
          onClick={() => handleSwitchView('table')}
          title="Table View (3)"
        >
          <FileText className="w-4 h-4 mr-1" />
          Table
        </button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Link mode */}
        <button
          className={`toolbar-button ${linkMode ? 'active' : ''}`}
          onClick={onLinkModeToggle}
          title="Link Mode (L)"
        >
          <Link className="w-4 h-4 mr-1" />
          Link
        </button>

        {/* Grid controls */}
        <div className="flex items-center gap-1">
          <button
            className={`toolbar-button ${project.viewSettings.showGrid ? 'active' : ''}`}
            onClick={handleToggleGrid}
            title="Toggle Grid"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            className={`toolbar-button ${project.viewSettings.snapToGrid ? 'active' : ''}`}
            onClick={handleToggleSnapToGrid}
            title="Snap to Grid"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            className="toolbar-button"
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600 px-2">
            {Math.round(project.viewSettings.zoom * 100)}%
          </span>
          <button
            className="toolbar-button"
            onClick={handleZoomIn}
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Conflicts */}
        {conflictCount > 0 && (
          <button
            className="toolbar-button bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
            onClick={onToggleConflicts}
            title={`${conflictCount} conflicts detected`}
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            {conflictCount}
          </button>
        )}

        {/* Properties panel */}
        <button
          className="toolbar-button"
          onClick={onToggleProperties}
          title="Properties Panel"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Import/Export */}
        <div className="flex items-center gap-1 ml-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <button
            className="toolbar-button"
            onClick={() => fileInputRef.current?.click()}
            title="Import Project"
          >
            <Upload className="w-4 h-4 mr-1" />
            Import
          </button>
          <button
            className="toolbar-button"
            onClick={() => onExport(project)}
            title="Export Project"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;


