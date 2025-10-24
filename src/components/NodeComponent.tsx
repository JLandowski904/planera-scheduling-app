import React, { useState, useRef, useCallback } from 'react';
import { Node, Position } from '../types';
import {
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
} from 'lucide-react';

interface NodeComponentProps {
  node: Node;
  isSelected: boolean;
  onDrag: (position: Position) => void;
  onResize: (width: number, height: number) => void;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragStart: (e: React.MouseEvent) => void;
  onDragEnd: (e: React.MouseEvent) => void;
  onHandleDragStart?: (e: React.MouseEvent, handlePosition: string) => void;
  zoom?: number;
  onEdit?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
}

const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  isSelected,
  onDrag,
  onResize,
  onClick,
  onContextMenu,
  onDragStart,
  onDragEnd,
  onHandleDragStart,
  zoom = 1,
  onEdit,
  onDelete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState<Position>({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState<Position>({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);
  const [isHoveringNode, setIsHoveringNode] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  const { id, type, title, position, data } = node;
  const isMilestone = type === 'milestone';
  const width = node.width || 120;
  const height = node.height || 60;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Check if clicking on connection handle
    if ((e.target as HTMLElement).closest('.connection-handle')) {
      return; // Let connection handle handle its own events
    }
    
    if (e.target === nodeRef.current || (e.target as HTMLElement).closest('.resize-handle')) {
      return; // Let resize handle handle its own events
    }
    
    if ((e.target as HTMLElement).closest('.node-action-bar')) {
      return; // Let action bar handle its own events
    }

    setIsDragging(true);
    // Store initial mouse position AND initial node position
    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });
    setInitialPosition({
      x: position.x,
      y: position.y,
    });
    onDragStart(e);
    e.stopPropagation();
  }, [position, onDragStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      // Calculate delta in screen pixels from the initial drag start
      const screenDeltaX = e.clientX - dragStart.x;
      const screenDeltaY = e.clientY - dragStart.y;
      // Convert to canvas pixels by dividing by zoom
      const canvasDeltaX = screenDeltaX / zoom;
      const canvasDeltaY = screenDeltaY / zoom;
      // Apply delta to INITIAL position (not current position)
      const newPosition = {
        x: initialPosition.x + canvasDeltaX,
        y: initialPosition.y + canvasDeltaY,
      };
      onDrag(newPosition);
    } else if (isResizing) {
      if (type === 'milestone') {
        // For milestones, resize proportionally to maintain diamond shape
        const deltaX = (e.clientX - resizeStart.x) / zoom;
        const newSize = Math.max(60, Math.min(200, initialSize.width + deltaX));
        onResize(newSize, newSize);
      } else {
        const newWidth = Math.max(80, initialSize.width + (e.clientX - resizeStart.x));
        const newHeight = Math.max(40, initialSize.height + (e.clientY - resizeStart.y));
        onResize(newWidth, newHeight);
      }
    }
  }, [isDragging, isResizing, dragStart, resizeStart, initialSize, initialPosition, zoom, onDrag, onResize, type]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    setIsDragging(false);
    setIsResizing(false);
    onDragEnd(e);
  }, [onDragEnd]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({ x: e.clientX, y: e.clientY });
    setInitialSize({ width, height });
  }, [width, height]);

  const handleEditClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    onEdit?.(id);
  }, [onEdit, id]);

  const handleDeleteClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete?.(id);
  }, [onDelete, id]);

  const handleMilestoneResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({ x: e.clientX, y: e.clientY });
    setInitialSize({ width, height });
  }, [width, height]);

  // Add global mouse event listeners
  React.useEffect(() => {
    if (isDragging || isResizing) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (isDragging) {
          // Calculate delta in screen pixels from the initial drag start
          const screenDeltaX = e.clientX - dragStart.x;
          const screenDeltaY = e.clientY - dragStart.y;
          // Convert to canvas pixels by dividing by zoom
          const canvasDeltaX = screenDeltaX / zoom;
          const canvasDeltaY = screenDeltaY / zoom;
          // Apply delta to INITIAL position (not current position)
          const newPosition = {
            x: initialPosition.x + canvasDeltaX,
            y: initialPosition.y + canvasDeltaY,
          };
          onDrag(newPosition);
        } else if (isResizing) {
          if (type === 'milestone') {
            // For milestones, resize proportionally to maintain diamond shape
            const deltaX = (e.clientX - resizeStart.x) / zoom;
            const newSize = Math.max(60, Math.min(200, initialSize.width + deltaX));
            onResize(newSize, newSize);
          } else {
            const newWidth = Math.max(80, initialSize.width + (e.clientX - resizeStart.x));
            const newHeight = Math.max(40, initialSize.height + (e.clientY - resizeStart.y));
            onResize(newWidth, newHeight);
          }
        }
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
        // Create a minimal synthetic event
        const syntheticEvent = {
          stopPropagation: () => {},
          preventDefault: () => {},
        } as React.MouseEvent<Element>;
        onDragEnd(syntheticEvent);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, initialSize, initialPosition, zoom, onDrag, onResize, onDragEnd, type]);

  const getNodeIcon = () => {
    switch (type) {
      case 'milestone':
        return <Calendar className="w-4 h-4 milestone-icon" />;
      case 'deliverable':
        return <CheckCircle className="w-4 h-4 deliverable-icon" />;
      case 'task':
        return <Clock className="w-4 h-4 task-icon" />;
      case 'person':
        return <User className="w-4 h-4 person-icon" />;
      default:
        return null;
    }
  };

  const getStatusIcon = () => {
    if (type === 'task' && data.status) {
      switch (data.status) {
        case 'blocked':
          return <AlertTriangle className="w-3 h-3 text-red-500" />;
        case 'done':
          return <CheckCircle className="w-3 h-3 text-green-500" />;
        case 'in_progress':
          return <Clock className="w-3 h-3 text-blue-500" />;
        default:
          return null;
      }
    }
    return null;
  };

  const getNodeClasses = () => {
    const baseClasses = 'absolute border-2 cursor-move select-none';
    const typeClasses = {
      milestone: 'node-milestone',
      deliverable: 'node-deliverable',
      task: 'node-task',
      person: 'node-person',
    };
    const selectedClass = isSelected ? 'node-selected' : '';
    
    return `${baseClasses} ${typeClasses[type]} ${selectedClass}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: '2-digit'
    });
  };

  const renderProgressBar = () => {
    if (type === 'task' && data.percentComplete !== undefined) {
      return (
        <div className="progress-bar w-full h-2 mt-1">
          <div 
            className="progress-fill"
            style={{ width: `${data.percentComplete}%` }}
          />
        </div>
      );
    }
    return null;
  };

  const renderPersonAvatar = () => {
    // Avatar is now handled by the icon, so we don't need a separate avatar
    return null;
  };

  const renderTaskInfo = () => {
    if (type === 'task') {
      return (
        <div className="text-xs mt-1 space-y-1 text-left">
          {data.startDate && data.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(data.startDate)} - {formatDate(data.dueDate)}</span>
            </div>
          )}
          {data.assignees && data.assignees.length > 0 && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{data.assignees.length} assignee{data.assignees.length > 1 ? 's' : ''}</span>
            </div>
          )}
          {data.discipline && (
            <div className="text-xs opacity-75">{data.discipline}</div>
          )}
        </div>
      );
    }
    return null;
  };

  const renderMilestoneInfo = () => {
    if (type === 'milestone' && data.dueDate) {
      return (
        <div className="text-xs mt-1 text-center">
          <span>{formatDate(data.dueDate)}</span>
        </div>
      );
    }
    return null;
  };

  const renderDeliverableInfo = () => {
    if (type === 'deliverable' && (data.startDate || data.dueDate)) {
      return (
        <div className="text-xs mt-1 text-left">
          {data.startDate && data.dueDate ? (
            <span>{formatDate(data.startDate)} - {formatDate(data.dueDate)}</span>
          ) : data.dueDate ? (
            <span>{formatDate(data.dueDate)}</span>
          ) : data.startDate ? (
            <span>{formatDate(data.startDate)}</span>
          ) : null}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      ref={nodeRef}
      data-node-id={id}
      className={getNodeClasses()}
      style={{
        left: position.x,
        top: position.y,
        width,
        height,
        minWidth: type === 'person' ? 60 : 80,
        minHeight: type === 'person' ? 60 : 40,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setIsHoveringNode(true)}
      onMouseLeave={() => setIsHoveringNode(false)}
    >
      {isHoveringNode && (
        <div 
          className="node-action-bar"
          onMouseEnter={(e) => {
            e.stopPropagation();
            setIsHoveringNode(true);
          }}
          onMouseLeave={(e) => {
            e.stopPropagation();
            // Don't set isHoveringNode to false here to prevent flickering
          }}
        >
          <button
            className="node-action-button"
            onClick={handleEditClick}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label={`Edit ${title}`}
          >
            <Edit className="w-3 h-3" />
          </button>
          <button
            className="node-action-button node-action-button--danger"
            onClick={handleDeleteClick}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label={`Delete ${title}`}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
      {/* Node content */}
      <div className={`${type === 'milestone' || type === 'person' ? 'p-2 h-full flex flex-col items-center justify-center text-center' : 'p-2 h-full flex flex-col items-start text-left'}`}>
        {/* Header */}
        <div className={`${type === 'milestone' || type === 'person' ? 'flex flex-col items-center justify-center text-center' : 'flex items-center gap-2 mb-1 w-full justify-start text-left'}`}>
          <div className={`${type === 'milestone' || type === 'person' ? 'flex flex-col items-center justify-center text-center' : 'flex items-center gap-1 flex-1 min-w-0 justify-start'}`}>
            {getNodeIcon()}
            <span className="text-sm font-medium truncate">{title}</span>
            {type !== 'milestone' && type !== 'person' && getStatusIcon()}
          </div>
        </div>

        {/* Person avatar */}
        {renderPersonAvatar()}

        {/* Task info */}
        {renderTaskInfo()}

        {/* Milestone info */}
        {renderMilestoneInfo()}

        {/* Deliverable info */}
        {renderDeliverableInfo()}

        {/* Progress bar */}
        {renderProgressBar()}

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {data.tags.slice(0, 2).map((tag, index) => (
              <span key={index} className="text-xs bg-white bg-opacity-20 px-1 rounded">
                {tag}
              </span>
            ))}
            {data.tags.length > 2 && (
              <span className="text-xs bg-white bg-opacity-20 px-1 rounded">
                +{data.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Resize handle */}
      <div
        className="resize-handle absolute cursor-nw-resize"
        onMouseDown={type === 'milestone' ? handleMilestoneResizeMouseDown : handleResizeMouseDown}
        onMouseEnter={() => {
          setIsHoveringHandle(true);
          setIsHoveringNode(true);
        }}
        onMouseLeave={() => setIsHoveringHandle(false)}
        style={{
          width: 14,
          height: 14,
          right: isMilestone ? -10 : -4,
          bottom: isMilestone ? -10 : -4,
          backgroundColor: 'rgba(37, 99, 235, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          borderRadius: '4px',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.18)',
          zIndex: 200,
          opacity: (isHoveringNode || isHoveringHandle) ? 0.6 : 0,
          transition: 'opacity 0.2s ease',
          pointerEvents: (isHoveringNode || isHoveringHandle) ? 'auto' : 'none',
        }}
      />


      {/* Connection handles */}
      <div
        className="connection-handle connection-handle-top"
        data-handle-position="top"
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onHandleDragStart?.(e, 'top');
        }}
        onMouseEnter={() => setIsHoveringHandle(true)}
        onMouseLeave={() => setIsHoveringHandle(false)}
        style={{
          position: 'absolute',
          top: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          backgroundColor: '#3b82f6',
          border: '2px solid white',
          cursor: 'crosshair',
          opacity: isSelected || isHoveringNode || isHoveringHandle ? 1 : 0,
          transition: 'opacity 0.2s',
          zIndex: 100,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          pointerEvents: 'auto',
        }}
      />
      <div
        className="connection-handle connection-handle-right"
        data-handle-position="right"
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onHandleDragStart?.(e, 'right');
        }}
        onMouseEnter={() => setIsHoveringHandle(true)}
        onMouseLeave={() => setIsHoveringHandle(false)}
        style={{
          position: 'absolute',
          top: '50%',
          right: '-6px',
          transform: 'translateY(-50%)',
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          backgroundColor: '#3b82f6',
          border: '2px solid white',
          cursor: 'crosshair',
          opacity: isSelected || isHoveringNode || isHoveringHandle ? 1 : 0,
          transition: 'opacity 0.2s',
          zIndex: 100,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          pointerEvents: 'auto',
        }}
      />
      <div
        className="connection-handle connection-handle-bottom"
        data-handle-position="bottom"
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onHandleDragStart?.(e, 'bottom');
        }}
        onMouseEnter={() => setIsHoveringHandle(true)}
        onMouseLeave={() => setIsHoveringHandle(false)}
        style={{
          position: 'absolute',
          bottom: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          backgroundColor: '#3b82f6',
          border: '2px solid white',
          cursor: 'crosshair',
          opacity: isSelected || isHoveringNode || isHoveringHandle ? 1 : 0,
          transition: 'opacity 0.2s',
          zIndex: 100,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          pointerEvents: 'auto',
        }}
      />
      <div
        className="connection-handle connection-handle-left"
        data-handle-position="left"
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onHandleDragStart?.(e, 'left');
        }}
        onMouseEnter={() => setIsHoveringHandle(true)}
        onMouseLeave={() => setIsHoveringHandle(false)}
        style={{
          position: 'absolute',
          top: '50%',
          left: '-6px',
          transform: 'translateY(-50%)',
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          backgroundColor: '#3b82f6',
          border: '2px solid white',
          cursor: 'crosshair',
          opacity: isSelected || isHoveringNode || isHoveringHandle ? 1 : 0,
          transition: 'opacity 0.2s',
          zIndex: 100,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          pointerEvents: 'auto',
        }}
      />
    </div>
  );
};

export default NodeComponent;
