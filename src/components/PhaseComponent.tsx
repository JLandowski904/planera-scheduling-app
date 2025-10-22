import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Phase, Position, RectSize } from '../types';
import { Edit, Trash2 } from 'lucide-react';

type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface PhaseComponentProps {
  phase: Phase;
  dateLabel: string;
  isSelected: boolean;
  zoom: number;
  backgroundColor: string;
  borderColor: string;
  onSelect: (multi: boolean) => void;
  onDrag: (position: Position) => void;
  onResize: (rect: { position: Position; size: RectSize }) => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onEdit?: (phaseId: string) => void;
  onDelete?: (phaseId: string) => void;
}

const MIN_WIDTH = 200;
const MIN_HEIGHT = 140;

const PhaseComponent: React.FC<PhaseComponentProps> = ({
  phase,
  dateLabel,
  isSelected,
  zoom,
  backgroundColor,
  borderColor,
  onSelect,
  onDrag,
  onResize,
  onInteractionStart,
  onInteractionEnd,
  onContextMenu,
  onEdit,
  onDelete,
}) => {
  const [activeInteraction, setActiveInteraction] = useState<{
    type: 'move' | 'resize';
    handle?: ResizeHandle;
    startMouse: Position;
    initialPosition: Position;
    initialSize: RectSize;
  } | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseUp = useCallback(() => {
    if (activeInteraction) {
      setActiveInteraction(null);
      onInteractionEnd?.();
    }
  }, [activeInteraction, onInteractionEnd]);

  useEffect(() => {
    if (!activeInteraction) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const deltaX = (event.clientX - activeInteraction.startMouse.x) / zoom;
      const deltaY = (event.clientY - activeInteraction.startMouse.y) / zoom;

      if (activeInteraction.type === 'move') {
        onDrag({
          x: activeInteraction.initialPosition.x + deltaX,
          y: activeInteraction.initialPosition.y + deltaY,
        });
      } else if (activeInteraction.type === 'resize' && activeInteraction.handle) {
        const { handle, initialPosition, initialSize } = activeInteraction;

        let newX = initialPosition.x;
        let newY = initialPosition.y;
        let newWidth = initialSize.width;
        let newHeight = initialSize.height;

        if (handle.includes('e')) {
          newWidth = Math.max(MIN_WIDTH, initialSize.width + deltaX);
        }
        if (handle.includes('s')) {
          newHeight = Math.max(MIN_HEIGHT, initialSize.height + deltaY);
        }
        if (handle.includes('w')) {
          const proposedWidth = Math.max(MIN_WIDTH, initialSize.width - deltaX);
          newX = initialPosition.x + (initialSize.width - proposedWidth);
          newWidth = proposedWidth;
        }
        if (handle.includes('n')) {
          const proposedHeight = Math.max(MIN_HEIGHT, initialSize.height - deltaY);
          newY = initialPosition.y + (initialSize.height - proposedHeight);
          newHeight = proposedHeight;
        }

        onResize({
          position: { x: newX, y: newY },
          size: { width: newWidth, height: newHeight },
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeInteraction, zoom, onDrag, onResize, handleMouseUp]);

  const startInteraction = useCallback(
    (event: React.MouseEvent, type: 'move' | 'resize', handle?: ResizeHandle) => {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      onSelect(event.ctrlKey || event.metaKey);
      onInteractionStart?.();

      setActiveInteraction({
        type,
        handle,
        startMouse: { x: event.clientX, y: event.clientY },
        initialPosition: { ...phase.position },
        initialSize: { ...phase.size },
      });
    },
    [onSelect, onInteractionStart, phase.position, phase.size]
  );

  const handleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  const handleContextMenuInternal = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onContextMenu?.(event);
    },
    [onContextMenu]
  );

  const resizeHandles = useMemo(
    () =>
      [
        { key: 'nw' as ResizeHandle, style: { top: -6, left: -6 }, cursor: 'nwse-resize' },
        { key: 'n' as ResizeHandle, style: { top: -6, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
        { key: 'ne' as ResizeHandle, style: { top: -6, right: -6 }, cursor: 'nesw-resize' },
        { key: 'e' as ResizeHandle, style: { top: '50%', right: -6, transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
        { key: 'se' as ResizeHandle, style: { bottom: -6, right: -6 }, cursor: 'nwse-resize' },
        { key: 's' as ResizeHandle, style: { bottom: -6, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
        { key: 'sw' as ResizeHandle, style: { bottom: -6, left: -6 }, cursor: 'nesw-resize' },
        { key: 'w' as ResizeHandle, style: { top: '50%', left: -6, transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
      ],
    []
  );

  return (
    <div
      data-phase-id={phase.id}
      className={`phase-box${isSelected ? ' phase-box--selected' : ''}${isHovering ? ' phase-box--hover' : ''}`}
      style={{
        left: phase.position.x,
        top: phase.position.y,
        width: phase.size.width,
        height: phase.size.height,
        borderColor,
        backgroundColor,
        cursor: activeInteraction?.type === 'move' ? 'grabbing' : 'grab',
      }}
      onMouseDown={(event) => startInteraction(event, 'move')}
      onClick={handleClick}
      onContextMenu={handleContextMenuInternal}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="phase-box__label">
        <div className="phase-box__title">{phase.title}</div>
        <div className="phase-box__dates">{dateLabel}</div>
      </div>

      {(isSelected || isHovering) && (
        <div
          className="phase-box__actions"
        >
          {onEdit && (
            <button
              className="phase-box__action-button"
              onClick={(event) => {
                event.stopPropagation();
                onEdit(phase.id);
              }}
              onMouseDown={(event) => event.stopPropagation()}
              title="Edit phase"
            >
              <Edit size={16} />
            </button>
          )}
          {onDelete && (
            <button
              className="phase-box__action-button phase-box__action-button--danger"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(phase.id);
              }}
              onMouseDown={(event) => event.stopPropagation()}
              title="Delete phase"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}

      {isSelected &&
        resizeHandles.map(handle => (
          <div
            key={handle.key}
            className="phase-resize-handle"
            style={{
              ...handle.style,
              cursor: handle.cursor,
            }}
            onMouseDown={(event) => startInteraction(event, 'resize', handle.key)}
          />
        ))}
    </div>
  );
};

export default PhaseComponent;
