import React, { useEffect, useRef } from 'react';
import { ContextMenuState, Project, NodeType } from '../types';
import {
  Edit,
  Copy,
  Trash2,
  Link,
  Unlink,
  User,
  Calendar,
  CheckCircle,
  Clock,
  MoreHorizontal,
} from 'lucide-react';

interface ContextMenuProps {
  contextMenu: ContextMenuState;
  onClose: () => void;
  onAction: (action: string) => void;
  project: Project;
  selectedNodes: string[];
  selectedEdges: string[];
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  contextMenu,
  onClose,
  onAction,
  project,
  selectedNodes,
  selectedEdges,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu.visible, onClose]);

  if (!contextMenu.visible) {
    return null;
  }

  const handleAction = (action: string) => {
    onAction(action);
    onClose();
  };

  const handleConvertType = (newType: NodeType) => {
    onAction(`convert-${newType}`);
    onClose();
  };

  const getNodeTypeIcon = (type: NodeType) => {
    switch (type) {
      case 'milestone':
        return <Calendar className="w-4 h-4" />;
      case 'deliverable':
        return <CheckCircle className="w-4 h-4" />;
      case 'task':
        return <Clock className="w-4 h-4" />;
      case 'person':
        return <User className="w-4 h-4" />;
    }
  };

  const renderCanvasMenu = () => (
    <div className="context-menu">
      <div className="context-menu-item" onClick={() => handleAction('new-task')}>
        <Clock className="w-4 h-4" />
        New Task
      </div>
      <div className="context-menu-item" onClick={() => handleAction('new-milestone')}>
        <Calendar className="w-4 h-4" />
        New Milestone
      </div>
      <div className="context-menu-item" onClick={() => handleAction('new-deliverable')}>
        <CheckCircle className="w-4 h-4" />
        New Deliverable
      </div>
      <div className="context-menu-item" onClick={() => handleAction('new-person')}>
        <User className="w-4 h-4" />
        New Person
      </div>
    </div>
  );

  const renderNodeMenu = () => {
    const node = project.nodes.find(n => n.id === contextMenu.targetId);
    if (!node) return null;

    return (
      <div className="context-menu">
        <div className="context-menu-item" onClick={() => handleAction('edit-node')}>
          <Edit className="w-4 h-4" />
          Edit
        </div>
        <div className="context-menu-item" onClick={() => handleAction('duplicate-node')}>
          <Copy className="w-4 h-4" />
          Duplicate
        </div>
        
        {/* Convert type options */}
        <div className="border-t border-gray-200 my-1"></div>
        <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
          Convert to
        </div>
        {(['milestone', 'deliverable', 'task', 'person'] as NodeType[])
          .filter(type => type !== node.type)
          .map(type => (
            <div
              key={type}
              className="context-menu-item"
              onClick={() => handleAction(`convert-to-${type}`)}
            >
              {getNodeTypeIcon(type)}
              <span className="capitalize">{type}</span>
            </div>
          ))}

        {/* Dependencies */}
        <div className="border-t border-gray-200 my-1"></div>
        <div className="context-menu-item" onClick={() => handleAction('add-dependency')}>
          <Link className="w-4 h-4" />
          Add Dependency
        </div>
        <div className="context-menu-item" onClick={() => handleAction('break-dependencies')}>
          <Unlink className="w-4 h-4" />
          Break Dependencies
        </div>

        {/* Delete */}
        <div className="border-t border-gray-200 my-1"></div>
        <div className="context-menu-item danger" onClick={() => handleAction('delete-node')}>
          <Trash2 className="w-4 h-4" />
          Delete
        </div>
      </div>
    );
  };

  const renderEdgeMenu = () => {
    const edge = project.edges.find(e => e.id === contextMenu.targetId);
    
    return (
      <div className="context-menu">
        <div className="context-menu-item" onClick={() => handleAction('edit-edge')}>
          <Edit className="w-4 h-4" />
          Edit Dependency
        </div>
        
        {/* Dependency type options */}
        <div className="border-t border-gray-200 my-1"></div>
        <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
          Change Type
        </div>
        <div 
          className={`context-menu-item ${edge?.type === 'finish_to_start' ? 'bg-blue-50' : ''}`}
          onClick={() => handleAction('edge-type-finish_to_start')}
        >
          <MoreHorizontal className="w-4 h-4" />
          Finish to Start (FS)
        </div>
        <div 
          className={`context-menu-item ${edge?.type === 'start_to_start' ? 'bg-blue-50' : ''}`}
          onClick={() => handleAction('edge-type-start_to_start')}
        >
          <MoreHorizontal className="w-4 h-4" />
          Start to Start (SS)
        </div>
        <div 
          className={`context-menu-item ${edge?.type === 'finish_to_finish' ? 'bg-blue-50' : ''}`}
          onClick={() => handleAction('edge-type-finish_to_finish')}
        >
          <MoreHorizontal className="w-4 h-4" />
          Finish to Finish (FF)
        </div>
        
        <div className="border-t border-gray-200 my-1"></div>
        <div className="context-menu-item danger" onClick={() => handleAction('delete-edge')}>
          <Trash2 className="w-4 h-4" />
          Break Dependency
        </div>
      </div>
    );
  };

  const renderMultiSelectMenu = () => (
    <div className="context-menu">
      <div className="context-menu-item" onClick={() => handleAction('edit-selected')}>
        <Edit className="w-4 h-4" />
        Edit Selected ({selectedNodes.length + selectedEdges.length})
      </div>
      <div className="context-menu-item" onClick={() => handleAction('duplicate-selected')}>
        <Copy className="w-4 h-4" />
        Duplicate Selected
      </div>
      <div className="context-menu-item" onClick={() => handleAction('group-selected')}>
        <MoreHorizontal className="w-4 h-4" />
        Group Selected
      </div>
      <div className="border-t border-gray-200 my-1"></div>
      <div className="context-menu-item danger" onClick={() => handleAction('delete-selected')}>
        <Trash2 className="w-4 h-4" />
        Delete Selected
      </div>
    </div>
  );

  const renderMenu = () => {
    if (selectedNodes.length > 1 || selectedEdges.length > 1 || 
        (selectedNodes.length > 0 && selectedEdges.length > 0)) {
      return renderMultiSelectMenu();
    }

    switch (contextMenu.targetType) {
      case 'canvas':
        return renderCanvasMenu();
      case 'node':
        return renderNodeMenu();
      case 'edge':
        return renderEdgeMenu();
      default:
        return null;
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
      }}
    >
      {renderMenu()}
    </div>
  );
};

export default ContextMenu;

