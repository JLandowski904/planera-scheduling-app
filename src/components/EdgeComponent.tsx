import React, { useState, useCallback } from 'react';
import { Edge, Node } from '../types';
import { Edit, Trash2 } from 'lucide-react';

interface EdgeComponentProps {
  edge: Edge;
  sourceNode?: Node;
  targetNode?: Node;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onEdit?: () => void;
}

const EdgeComponent: React.FC<EdgeComponentProps> = ({
  edge,
  sourceNode,
  targetNode,
  isSelected,
  onClick,
  onDelete,
  onContextMenu,
  onEdit,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isActionsHovered, setIsActionsHovered] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(e);
  }, [onClick]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onContextMenu(e);
  }, [onContextMenu]);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const getEdgePath = () => {
    const sourceX = sourceNode.position.x + (sourceNode.width || 120) / 2;
    const sourceY = sourceNode.position.y + (sourceNode.height || 60) / 2;
    const targetX = targetNode.position.x + (targetNode.width || 120) / 2;
    const targetY = targetNode.position.y + (targetNode.height || 60) / 2;

    // Calculate control points for curved edge
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const controlOffset = Math.min(distance * 0.3, 100);

    const cp1x = sourceX + controlOffset;
    const cp1y = sourceY;
    const cp2x = targetX - controlOffset;
    const cp2y = targetY;

    return `M ${sourceX} ${sourceY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetX} ${targetY}`;
  };

  const getArrowMarker = () => {
    const sourceX = sourceNode.position.x + (sourceNode.width || 120) / 2;
    const sourceY = sourceNode.position.y + (sourceNode.height || 60) / 2;
    const targetX = targetNode.position.x + (targetNode.width || 120) / 2;
    const targetY = targetNode.position.y + (targetNode.height || 60) / 2;

    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const angle = Math.atan2(dy, dx);

    const arrowLength = 10;
    const arrowAngle = Math.PI / 6;

    const arrowX1 = targetX - arrowLength * Math.cos(angle - arrowAngle);
    const arrowY1 = targetY - arrowLength * Math.sin(angle - arrowAngle);
    const arrowX2 = targetX - arrowLength * Math.cos(angle + arrowAngle);
    const arrowY2 = targetY - arrowLength * Math.sin(angle + arrowAngle);

    return `M ${targetX} ${targetY} L ${arrowX1} ${arrowY1} M ${targetX} ${targetY} L ${arrowX2} ${arrowY2}`;
  };

  const getEdgeClasses = () => {
    const baseClasses = 'stroke-2 fill-none pointer-events-stroke';
    const stateClasses = edge.isBlocked ? 'edge-blocked' : 'edge-normal';
    const selectedClass = isSelected ? 'stroke-blue-500' : '';
    const hoverClass = isHovered ? 'stroke-opacity-80' : 'stroke-opacity-60';
    
    return `${baseClasses} ${stateClasses} ${selectedClass} ${hoverClass}`;
  };

  const getEdgeLabel = () => {
    if (edge.label) return edge.label;
    
    switch (edge.type) {
      case 'finish_to_start':
        return 'FS';
      case 'start_to_start':
        return 'SS';
      case 'finish_to_finish':
        return 'FF';
      default:
        return '';
    }
  };

  const getEdgeLabelPosition = () => {
    const sourceX = sourceNode.position.x + (sourceNode.width || 120) / 2;
    const sourceY = sourceNode.position.y + (sourceNode.height || 60) / 2;
    const targetX = targetNode.position.x + (targetNode.width || 120) / 2;
    const targetY = targetNode.position.y + (targetNode.height || 60) / 2;

    return {
      x: (sourceX + targetX) / 2,
      y: (sourceY + targetY) / 2 - 10,
    };
  };

  const labelPos = getEdgeLabelPosition();
  const showActions = isHovered || isActionsHovered;

  return (
    <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {/* Edge path */}
      <path
        d={getEdgePath()}
        className={getEdgeClasses()}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        style={{
          strokeWidth: isSelected ? 3 : 2,
          pointerEvents: 'stroke',
        }}
      />
      
      {/* Arrow */}
      <path
        d={getArrowMarker()}
        className={getEdgeClasses()}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        style={{
          strokeWidth: isSelected ? 3 : 2,
          pointerEvents: 'stroke',
        }}
      />

      {/* Edge label */}
      {getEdgeLabel() && (
        <g>
          <rect
            x={labelPos.x - 15}
            y={labelPos.y - 8}
            width={30}
            height={16}
            className="fill-white stroke-gray-300"
            rx={3}
          />
          <text
            x={labelPos.x}
            y={labelPos.y + 3}
            textAnchor="middle"
            className="text-xs fill-gray-700 pointer-events-none"
          >
            {getEdgeLabel()}
          </text>
        </g>
      )}

      {/* Blocked indicator */}
      {edge.isBlocked && (
        <g>
          <circle
            cx={labelPos.x}
            cy={labelPos.y + 20}
            r={8}
            className="fill-red-500"
          />
          <text
            x={labelPos.x}
            y={labelPos.y + 24}
            textAnchor="middle"
            className="text-xs fill-white pointer-events-none font-bold"
          >
            !
          </text>
        </g>
      )}

      {/* Hover overlay for easier clicking */}
      <path
        d={getEdgePath()}
        className="stroke-transparent fill-none"
        style={{ 
          strokeWidth: 20,
          pointerEvents: 'stroke',
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      />

      {/* Hover action buttons (edit/delete) */}
      {showActions && (
        <foreignObject x={labelPos.x - 24} y={labelPos.y - 28} width={56} height={28} style={{ pointerEvents: 'auto' }}>
          <div
            style={{ display: 'flex', gap: 4, alignItems: 'center' }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={() => setIsActionsHovered(true)}
            onMouseLeave={() => setIsActionsHovered(false)}
            className="no-print"
          >
            <button
              className="node-action-button"
              title="Edit dependency"
              aria-label="Edit dependency"
              onClick={() => onEdit && onEdit()}
            >
              <Edit className="w-3 h-3" />
            </button>
            <button
              className="node-action-button node-action-button--danger"
              title="Break dependency"
              aria-label="Break dependency"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </foreignObject>
      )}
    </g>
  );
};

export default EdgeComponent;
