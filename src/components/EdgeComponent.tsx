import React, { useState, useCallback, useMemo } from 'react';
import { Edge, Node, Position } from '../types';
import { Edit, Trash2 } from 'lucide-react';
import {
  getNodeConnectionPoint,
  calculateOptimalHandles,
  generateOrthogonalPath,
  getAllNodeConnectionPoints,
  getPathMidpoint,
  HandlePosition,
} from '../utils/edgeRouting';

interface EdgeComponentProps {
  edge: Edge;
  sourceNode?: Node;
  targetNode?: Node;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onEdit?: () => void;
  onMidpointDragStart?: (e: React.MouseEvent) => void;
  onAnchorDragStart?: (anchorType: 'source' | 'target', e: React.MouseEvent) => void;
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
  onMidpointDragStart,
  onAnchorDragStart,
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

  const handlePathClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Just select the edge - don't auto-add waypoints
    onClick(e);
  }, [onClick]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onContextMenu(e);
  }, [onContextMenu]);

  // Calculate connection points and path - MUST be before early return
  const { pathData, pathPoints, sourcePoint, targetPoint, sourceHandle, targetHandle } = useMemo(() => {
    if (!sourceNode || !targetNode) {
      // Return empty defaults if nodes are missing
      return {
        pathData: '',
        pathPoints: [],
        sourcePoint: { x: 0, y: 0 },
        targetPoint: { x: 0, y: 0 },
        sourceHandle: 'right' as HandlePosition,
        targetHandle: 'left' as HandlePosition,
      };
    }

    // Determine handles (use manual or auto-calculate)
    const handles = edge.sourceHandle && edge.targetHandle
      ? { sourceHandle: edge.sourceHandle, targetHandle: edge.targetHandle }
      : calculateOptimalHandles(sourceNode, targetNode);

    const srcHandle = edge.sourceHandle || handles.sourceHandle;
    const tgtHandle = edge.targetHandle || handles.targetHandle;

    // Get connection points on node edges
    const srcPoint = getNodeConnectionPoint(
      sourceNode,
      srcHandle,
      sourceNode.width || 120,
      sourceNode.height || 60
    );
    const tgtPoint = getNodeConnectionPoint(
      targetNode,
      tgtHandle,
      targetNode.width || 120,
      targetNode.height || 60
    );

    // Generate orthogonal path
    const path = generateOrthogonalPath(
      srcPoint,
      tgtPoint,
      srcHandle,
      tgtHandle,
      edge.waypoints
    );

    // Build array of all points for waypoint rendering
    const points: Position[] = [srcPoint];
    if (edge.waypoints && edge.waypoints.length > 0) {
      points.push(...edge.waypoints);
    }
    points.push(tgtPoint);

    return {
      pathData: path,
      pathPoints: points,
      sourcePoint: srcPoint,
      targetPoint: tgtPoint,
      sourceHandle: srcHandle,
      targetHandle: tgtHandle,
    };
  }, [sourceNode, targetNode, edge.sourceHandle, edge.targetHandle, edge.waypoints]);

  // Get anchor points for rendering handles - MUST be before early return
  const sourceAnchorPoints = useMemo(
    () => sourceNode ? getAllNodeConnectionPoints(sourceNode, sourceNode.width || 120, sourceNode.height || 60) : {},
    [sourceNode]
  );
  const targetAnchorPoints = useMemo(
    () => targetNode ? getAllNodeConnectionPoints(targetNode, targetNode.width || 120, targetNode.height || 60) : {},
    [targetNode]
  );

  if (!sourceNode || !targetNode) {
    return null;
  }

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
    // Place label at true midpoint of path using utility function
    const midPoint = getPathMidpoint(pathPoints);

    return {
      x: midPoint.x,
      y: midPoint.y - 10,
    };
  };

  // Calculate offset positions for red endpoint handles
  // Offset them slightly away from nodes to avoid hitbox conflicts
  const getEndpointHandlePositions = () => {
    const offset = 12; // pixels away from node edge

    // Source endpoint: offset along first segment
    let sourceHandlePos = sourcePoint;
    if (pathPoints.length >= 2) {
      const p0 = pathPoints[0];
      const p1 = pathPoints[1];
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length > offset) {
        sourceHandlePos = {
          x: p0.x + (dx / length) * offset,
          y: p0.y + (dy / length) * offset,
        };
      }
    }

    // Target endpoint: offset along last segment (moving backward from target)
    let targetHandlePos = targetPoint;
    if (pathPoints.length >= 2) {
      const pLast = pathPoints[pathPoints.length - 1];
      const pSecondLast = pathPoints[pathPoints.length - 2];
      const dx = pLast.x - pSecondLast.x;
      const dy = pLast.y - pSecondLast.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length > offset) {
        targetHandlePos = {
          x: pLast.x - (dx / length) * offset,
          y: pLast.y - (dy / length) * offset,
        };
      }
    }

    return { sourceHandlePos, targetHandlePos };
  };

  const { sourceHandlePos, targetHandlePos } = getEndpointHandlePositions();
  const labelPos = getEdgeLabelPosition();
  const showActions = isHovered || isActionsHovered;
  const markerId = `edge-arrow-${edge.id}`;

  return (
    <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {/* Arrow marker definition - solid triangle aligned to stroke color */}
      <defs>
        <marker
          id={markerId}
          markerWidth="14"
          markerHeight="14"
          refX="12"
          refY="7"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,1 L0,13 L13,7 z" fill="context-stroke" stroke="context-stroke" />
        </marker>
      </defs>

      {/* Edge path */}
      <path
        d={pathData}
        className={getEdgeClasses()}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        style={{
          strokeWidth: isSelected ? 4 : 2,
          pointerEvents: 'stroke',
        }}
        markerEnd={`url(#${markerId})`}
      />

      {/* Invisible wider path for easier clicking/dragging when selected */}
      {isSelected && onMidpointDragStart && (
        <path
          d={pathData}
          className="stroke-transparent fill-none cursor-move"
          strokeWidth={20}
          style={{ pointerEvents: 'stroke' }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onMidpointDragStart(e);
          }}
        />
      )}

      {/* Source connection point handle (red circle offset from node) */}
      {isSelected && onAnchorDragStart && (
        <g key="source-connection-handle">
          <circle
            cx={sourceHandlePos.x}
            cy={sourceHandlePos.y}
            r={7}
            className="fill-red-500 dark:fill-red-400 stroke-white dark:stroke-slate-900 stroke-2 cursor-move"
            style={{ pointerEvents: 'all' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onAnchorDragStart('source', e);
            }}
          />
          {/* Larger invisible hover area */}
          <circle
            cx={sourceHandlePos.x}
            cy={sourceHandlePos.y}
            r={14}
            className="fill-transparent"
            style={{ pointerEvents: 'all', cursor: 'move' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onAnchorDragStart('source', e);
            }}
          />
        </g>
      )}

      {/* Target connection point handle (red circle offset from node) */}
      {isSelected && onAnchorDragStart && (
        <g key="target-connection-handle">
          <circle
            cx={targetHandlePos.x}
            cy={targetHandlePos.y}
            r={7}
            className="fill-red-500 dark:fill-red-400 stroke-white dark:stroke-slate-900 stroke-2 cursor-move"
            style={{ pointerEvents: 'all' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onAnchorDragStart('target', e);
            }}
          />
          {/* Larger invisible hover area */}
          <circle
            cx={targetHandlePos.x}
            cy={targetHandlePos.y}
            r={14}
            className="fill-transparent"
            style={{ pointerEvents: 'all', cursor: 'move' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onAnchorDragStart('target', e);
            }}
          />
        </g>
      )}

      {/* Edge label */}
      {getEdgeLabel() && (
        <g style={{ pointerEvents: 'none' }}>
          <rect
            x={labelPos.x - 15}
            y={labelPos.y - 8}
            width={30}
            height={16}
            className="fill-white dark:fill-slate-800 stroke-gray-300 dark:stroke-slate-600"
            rx={3}
          />
          <text
            x={labelPos.x}
            y={labelPos.y + 3}
            textAnchor="middle"
            className="text-xs fill-gray-700 dark:fill-slate-300"
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
            className="fill-red-500 dark:fill-red-600"
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
        d={pathData}
        className="stroke-transparent fill-none"
        style={{ 
          strokeWidth: 20,
          pointerEvents: 'stroke',
        }}
        onClick={handlePathClick}
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
