import React, { useRef, useState, useCallback } from 'react';
import { Project, Node, Edge, Position, NodeType, RectSize } from '../types';
import NodeComponent from './NodeComponent';
import EdgeComponent from './EdgeComponent';
import CanvasToolbar from './CanvasToolbar';
import { getNodeById } from '../utils/projectUtils';
import { formatPhaseDateRange, getNodesInPhase, getPhaseBackgroundColor, getPhaseDateRange } from '../utils/phaseUtils';
import PhaseComponent from './PhaseComponent';

interface CanvasProps {
  project: Project;
  onProjectChange: (project: Project) => void;
  selectedNodes: string[];
  selectedEdges: string[];
  selectedPhases: string[];
  onNodeSelect: (nodeId: string, multiSelect?: boolean) => void;
  onEdgeSelect: (edgeId: string, multiSelect?: boolean) => void;
  onPhaseSelect: (phaseId: string, multiSelect?: boolean) => void;
  onCanvasClick: () => void;
  onContextMenu: (e: React.MouseEvent, targetId?: string, targetType?: 'node' | 'edge' | 'canvas') => void;
  linkMode: boolean;
  linkSource: string | null;
  onLinkSourceChange: (nodeId: string | null) => void;
  onEdgeDelete: (edgeId: string) => void;
  onNewNode: (type: NodeType) => void;
  onNewPhase: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onEditNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onEditPhase?: (phaseId: string) => void;
  onDeletePhase?: (phaseId: string) => void;
}

const MIN_PHASE_WIDTH = 200;
const MIN_PHASE_HEIGHT = 140;

const Canvas: React.FC<CanvasProps> = ({
  project,
  onProjectChange,
  selectedNodes,
  selectedEdges,
  selectedPhases,
  onNodeSelect,
  onEdgeSelect,
  onPhaseSelect,
  onCanvasClick,
  onContextMenu,
  linkMode,
  linkSource,
  onLinkSourceChange,
  onEdgeDelete,
  onNewNode,
  onNewPhase,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onEditNode,
  onDeleteNode,
  onEditPhase,
  onDeletePhase,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });
  const [marqueeStart, setMarqueeStart] = useState<Position | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<Position | null>(null);
  const [isDraggingLink, setIsDraggingLink] = useState(false);
  const [dragLinkStart, setDragLinkStart] = useState<Position | null>(null);
  const [dragLinkEnd, setDragLinkEnd] = useState<Position | null>(null);
  const [dragLinkSourceId, setDragLinkSourceId] = useState<string | null>(null);
  const [dragLinkTargetId, setDragLinkTargetId] = useState<string | null>(null);

  const { viewSettings } = project;
  const { zoom, pan, snapToGrid, gridSize, showGrid } = viewSettings;

  // Use refs to avoid re-creating event listeners
  const isDraggingLinkRef = React.useRef<boolean>(false);
  const dragLinkSourceIdRef = React.useRef<string | null>(null);
  const projectRef = React.useRef(project);
  const panRef = React.useRef(pan);
  const zoomRef = React.useRef(zoom);
  const onProjectChangeRef = React.useRef(onProjectChange);
  
  React.useEffect(() => {
    // Don't sync isDraggingLink or dragLinkSourceId - we set them directly in handleHandleDragStart
    // isDraggingLinkRef.current = isDraggingLink;
    // dragLinkSourceIdRef.current = dragLinkSourceId;
    projectRef.current = project;
    panRef.current = pan;
    zoomRef.current = zoom;
    onProjectChangeRef.current = onProjectChange;
  });

  // Global mouse handlers for handle dragging - set up ONCE on mount
  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Check ref to see if we should process this
      if (!isDraggingLinkRef.current) return;
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const endX = (e.clientX - canvasRect.left - panRef.current.x) / zoomRef.current;
      const endY = (e.clientY - canvasRect.top - panRef.current.y) / zoomRef.current;

      setDragLinkEnd({ x: endX, y: endY });

      // Check if hovering over a node by querying actual DOM elements
      const nodeElements = Array.from(document.querySelectorAll('[data-node-id]'));
      let hoveredNodeId: string | null = null;

      for (const nodeElement of nodeElements) {
        const nodeId = nodeElement.getAttribute('data-node-id');
        if (nodeId === dragLinkSourceIdRef.current) continue; // Skip source node

        const nodeRect = nodeElement.getBoundingClientRect();
        
        // Check if mouse is within this node's bounding box
        if (
          e.clientX >= nodeRect.left &&
          e.clientX <= nodeRect.right &&
          e.clientY >= nodeRect.top &&
          e.clientY <= nodeRect.bottom
        ) {
          hoveredNodeId = nodeId;
          break;
        }
      }

      setDragLinkTargetId(hoveredNodeId);
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      // Check ref to ensure we're actually dragging
      if (!isDraggingLinkRef.current) {
        return;
      }
      
      // Re-check for target node at the moment of mouseup to ensure we have the latest value
      const nodeElements = Array.from(document.querySelectorAll('[data-node-id]'));
      let finalTargetId: string | null = null;

      for (const nodeElement of nodeElements) {
        const nodeId = nodeElement.getAttribute('data-node-id');
        if (nodeId === dragLinkSourceIdRef.current) continue; // Skip source node

        const nodeRect = nodeElement.getBoundingClientRect();
        
        // Check if mouse is within this node's bounding box
        if (
          e.clientX >= nodeRect.left &&
          e.clientX <= nodeRect.right &&
          e.clientY >= nodeRect.top &&
          e.clientY <= nodeRect.bottom
        ) {
          finalTargetId = nodeId;
          break;
        }
      }

      if (finalTargetId && dragLinkSourceIdRef.current && finalTargetId !== dragLinkSourceIdRef.current) {
        // Create the edge
        const newEdge: Edge = {
          id: `edge-${Date.now()}`,
          source: dragLinkSourceIdRef.current,
          target: finalTargetId,
          type: 'finish_to_start',
        };

        onProjectChangeRef.current({
          ...projectRef.current,
          edges: [...projectRef.current.edges, newEdge],
          updatedAt: new Date(),
        });
      }

      // Reset state and ref
      setIsDraggingLink(false);
      setDragLinkStart(null);
      setDragLinkEnd(null);
      setDragLinkSourceId(null);
      setDragLinkTargetId(null);
      
      // CRITICAL: Reset the ref
      isDraggingLinkRef.current = false;
      dragLinkSourceIdRef.current = null;
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []); // Empty dependency array - only run once on mount

  // Handle connection handle drag
  const handleHandleDragStart = useCallback((nodeId: string, e: React.MouseEvent, handlePosition: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    const node = getNodeById(project.nodes, nodeId);
    if (!node) return;
    
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    
    // Get the actual position of the clicked handle element
    const handleElement = e.currentTarget as HTMLElement;
    const handleRect = handleElement.getBoundingClientRect();
    
    // Calculate the center of the handle in screen coordinates
    const handleCenterScreenX = handleRect.left + handleRect.width / 2;
    const handleCenterScreenY = handleRect.top + handleRect.height / 2;
    
    // Convert screen coordinates to canvas coordinates (accounting for pan and zoom)
    const startX = (handleCenterScreenX - canvasRect.left - pan.x) / zoom;
    const startY = (handleCenterScreenY - canvasRect.top - pan.y) / zoom;

    setDragLinkStart({ x: startX, y: startY });
    setDragLinkEnd({ x: startX, y: startY });
    setIsDraggingLink(true);
    setDragLinkSourceId(nodeId);
    
    // CRITICAL: Set the ref directly here
    isDraggingLinkRef.current = true;
    dragLinkSourceIdRef.current = nodeId;
  }, [project.nodes, pan, zoom]);

  // Handle canvas pan and zoom
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && !linkMode) {
      if (e.shiftKey) {
        // Shift + left click for marquee selection
        setIsPanning(false);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const startX = (e.clientX - rect.left - pan.x) / zoom;
          const startY = (e.clientY - rect.top - pan.y) / zoom;
          setMarqueeStart({ x: startX, y: startY });
          setMarqueeEnd({ x: startX, y: startY });
        }
      } else {
        // Default left drag for panning
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        setMarqueeStart(null);
        setMarqueeEnd(null);
      }
    } else if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      // Middle mouse or Ctrl+left click fallback for panning
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setMarqueeStart(null);
      setMarqueeEnd(null);
    }
  }, [pan, zoom, linkMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const newPan = {
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      };
      onProjectChange({
        ...project,
        viewSettings: {
          ...viewSettings,
          pan: newPan,
        },
      });
    } else if (marqueeStart && !isDragging) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const endX = (e.clientX - rect.left - pan.x) / zoom;
        const endY = (e.clientY - rect.top - pan.y) / zoom;
        setMarqueeEnd({ x: endX, y: endY });
      }
    }
  }, [isPanning, panStart, marqueeStart, isDragging, pan, zoom, project, viewSettings, onProjectChange]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
    } else if (marqueeStart && marqueeEnd) {
      // Handle marquee selection
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const startX = Math.min(marqueeStart.x, marqueeEnd.x);
        const startY = Math.min(marqueeStart.y, marqueeEnd.y);
        const endX = Math.max(marqueeStart.x, marqueeEnd.x);
        const endY = Math.max(marqueeStart.y, marqueeEnd.y);

        const selectedNodeIds: string[] = [];
        const selectedPhaseIds: string[] = [];
        project.nodes.forEach(node => {
          if (
            node.position.x >= startX &&
            node.position.x <= endX &&
            node.position.y >= startY &&
            node.position.y <= endY
          ) {
            selectedNodeIds.push(node.id);
          }
        });

        project.phases.forEach(phase => {
          if (
            phase.position.x >= startX &&
            phase.position.x <= endX &&
            phase.position.y >= startY &&
            phase.position.y <= endY
          ) {
            selectedPhaseIds.push(phase.id);
          }
        });

        if (selectedNodeIds.length > 0 || selectedPhaseIds.length > 0) {
          selectedNodeIds.forEach(nodeId => onNodeSelect(nodeId, true));
          selectedPhaseIds.forEach(phaseId => onPhaseSelect(phaseId, true));
        } else {
          onCanvasClick();
        }
      }
      setMarqueeStart(null);
      setMarqueeEnd(null);
    }
  }, [isPanning, marqueeStart, marqueeEnd, project.nodes, project.phases, onNodeSelect, onPhaseSelect, onCanvasClick]);


  // Handle node resize
  const handleNodeResize = useCallback((nodeId: string, width: number, height: number) => {
    const updatedNodes = project.nodes.map(node =>
      node.id === nodeId
        ? { ...node, width, height }
        : node
    );

    const updatedPhases = project.phases.map(phase => ({
      ...phase,
      nodeIds: getNodesInPhase(phase, updatedNodes),
    }));

    onProjectChange({
      ...project,
      nodes: updatedNodes,
      phases: updatedPhases,
      updatedAt: new Date(),
    });
  }, [project, onProjectChange]);

  const handlePhaseDrag = useCallback((phaseId: string, newPosition: Position) => {
    const snapPosition = snapToGrid
      ? {
          x: Math.round(newPosition.x / gridSize) * gridSize,
          y: Math.round(newPosition.y / gridSize) * gridSize,
        }
      : newPosition;

    const updatedPhases = project.phases.map(phase => {
      if (phase.id === phaseId) {
        const updatedPhase = {
          ...phase,
          position: snapPosition,
        };
        return {
          ...updatedPhase,
          nodeIds: getNodesInPhase(updatedPhase, project.nodes),
        };
      }
      return {
        ...phase,
        nodeIds: getNodesInPhase(phase, project.nodes),
      };
    });

    onProjectChange({
      ...project,
      phases: updatedPhases,
      updatedAt: new Date(),
    });
  }, [snapToGrid, gridSize, project, onProjectChange]);

  const handlePhaseResize = useCallback((phaseId: string, rect: { position: Position; size: RectSize }) => {
    const snappedPosition = snapToGrid
      ? {
          x: Math.round(rect.position.x / gridSize) * gridSize,
          y: Math.round(rect.position.y / gridSize) * gridSize,
        }
      : rect.position;

    const snappedSize = snapToGrid
      ? {
          width: Math.max(MIN_PHASE_WIDTH, Math.round(rect.size.width / gridSize) * gridSize),
          height: Math.max(MIN_PHASE_HEIGHT, Math.round(rect.size.height / gridSize) * gridSize),
        }
      : rect.size;

    const updatedPhases = project.phases.map(phase => {
      if (phase.id === phaseId) {
        const updatedPhase = {
          ...phase,
          position: snappedPosition,
          size: snappedSize,
        };
        return {
          ...updatedPhase,
          nodeIds: getNodesInPhase(updatedPhase, project.nodes),
        };
      }
      return {
        ...phase,
        nodeIds: getNodesInPhase(phase, project.nodes),
      };
    });

    onProjectChange({
      ...project,
      phases: updatedPhases,
      updatedAt: new Date(),
    });
  }, [snapToGrid, gridSize, project, onProjectChange]);

  const handlePhaseInteractionStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handlePhaseInteractionEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle node click for linking
  const handleNodeClick = useCallback((nodeId: string, e: React.MouseEvent) => {
    if (linkMode) {
      if (linkSource === null) {
        onLinkSourceChange(nodeId);
      } else if (linkSource !== nodeId) {
        // Create edge
        const newEdge: Edge = {
          id: `edge-${Date.now()}`,
          source: linkSource,
          target: nodeId,
          type: 'finish_to_start',
        };
        
        onProjectChange({
          ...project,
          edges: [...project.edges, newEdge],
          updatedAt: new Date(),
        });
        
        onLinkSourceChange(null);
      }
    } else {
      onNodeSelect(nodeId, e.ctrlKey || e.metaKey);
    }
  }, [linkMode, linkSource, onLinkSourceChange, project, onProjectChange, onNodeSelect]);

  // Handle node drag start for linking
  const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    if (linkMode && !linkSource) {
      e.preventDefault();
      e.stopPropagation();
      
      const node = getNodeById(project.nodes, nodeId);
      if (node) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const startX = (e.clientX - rect.left - pan.x) / zoom;
          const startY = (e.clientY - rect.top - pan.y) / zoom;
          
          setDragLinkStart({ x: startX, y: startY });
          setDragLinkEnd({ x: startX, y: startY });
          setIsDraggingLink(true);
          onLinkSourceChange(nodeId);
        }
      }
    }
  }, [linkMode, linkSource, project.nodes, pan, zoom, onLinkSourceChange]);

  // Handle node drag for linking
  const handleNodeDrag = useCallback((nodeId: string, newPosition: Position) => {
    if (isDraggingLink && dragLinkStart) {
      setDragLinkEnd(newPosition);
    } else {
      // The newPosition is already in canvas coordinates (from NodeComponent)
      // Just apply grid snapping if needed
      const snapPosition = snapToGrid ? {
        x: Math.round(newPosition.x / gridSize) * gridSize,
        y: Math.round(newPosition.y / gridSize) * gridSize,
      } : newPosition;

      const updatedNodes = project.nodes.map(node =>
        node.id === nodeId
          ? { ...node, position: snapPosition }
          : node
      );

      const updatedPhases = project.phases.map(phase => ({
        ...phase,
        nodeIds: getNodesInPhase(phase, updatedNodes),
      }));

      onProjectChange({
        ...project,
        nodes: updatedNodes,
        phases: updatedPhases,
        updatedAt: new Date(),
      });
    }
  }, [isDraggingLink, dragLinkStart, snapToGrid, gridSize, project, onProjectChange]);

  // Handle node drag end for linking
  const handleNodeDragEnd = useCallback((nodeId: string, e: React.MouseEvent) => {
    if (isDraggingLink && linkSource && linkSource !== nodeId) {
      // Create edge from link source to this node
      const newEdge: Edge = {
        id: `edge-${Date.now()}`,
        source: linkSource,
        target: nodeId,
        type: 'finish_to_start',
      };
      
      onProjectChange({
        ...project,
        edges: [...project.edges, newEdge],
        updatedAt: new Date(),
      });
    }
    
    setIsDraggingLink(false);
    setDragLinkStart(null);
    setDragLinkEnd(null);
    onLinkSourceChange(null);
  }, [isDraggingLink, linkSource, project, onProjectChange, onLinkSourceChange]);

  // Handle edge click
  const handleEdgeClick = useCallback((edgeId: string, e: React.MouseEvent) => {
    onEdgeSelect(edgeId, e.ctrlKey || e.metaKey);
  }, [onEdgeSelect]);

  // Handle edge delete
  const handleEdgeDelete = useCallback((edgeId: string) => {
    onProjectChange({
      ...project,
      edges: project.edges.filter(edge => edge.id !== edgeId),
      updatedAt: new Date(),
    });
  }, [project, onProjectChange]);

  // Handle canvas context menu
  const handleCanvasContextMenu = useCallback((e: React.MouseEvent) => {
    onContextMenu(e, undefined, 'canvas');
  }, [onContextMenu]);

  // Calculate marquee rectangle
  const marqueeRect = marqueeStart && marqueeEnd ? {
    left: Math.min(marqueeStart.x, marqueeEnd.x),
    top: Math.min(marqueeStart.y, marqueeEnd.y),
    width: Math.abs(marqueeEnd.x - marqueeStart.x),
    height: Math.abs(marqueeEnd.y - marqueeStart.y),
  } : null;

  // Add wheel event listener with passive: false to allow preventDefault
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(3, zoom * delta));
      
      onProjectChange({
        ...project,
        viewSettings: {
          ...viewSettings,
          zoom: newZoom,
        },
      });
    };

    canvas.addEventListener('wheel', handleWheelEvent, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheelEvent);
    };
  }, [zoom, project, viewSettings, onProjectChange]);

  return (
      <div
        ref={canvasRef}
        className="w-full h-full relative overflow-hidden bg-slate-50"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleCanvasContextMenu}
        onClick={onCanvasClick}
        style={{
          cursor: isPanning ? 'grabbing' : linkMode ? 'crosshair' : 'grab',
          backgroundImage: showGrid ? `radial-gradient(circle, #cbd5e1 1px, transparent 1px)` : 'none',
          backgroundSize: showGrid ? `${gridSize * zoom}px ${gridSize * zoom}px` : 'auto',
          backgroundPosition: showGrid ? `${pan.x}px ${pan.y}px` : '0 0',
        }}
      >
      {/* Canvas content */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Phases */}
        {project.phases.map(phase => {
          const range = getPhaseDateRange(phase, project.nodes);
          const dateLabel = formatPhaseDateRange(range);
          return (
            <PhaseComponent
              key={phase.id}
              phase={phase}
              dateLabel={dateLabel}
              isSelected={selectedPhases.includes(phase.id)}
              zoom={zoom}
              backgroundColor={getPhaseBackgroundColor(phase.color, 0.12)}
              borderColor={phase.color}
              onSelect={(multi) => onPhaseSelect(phase.id, multi)}
              onDrag={(position) => handlePhaseDrag(phase.id, position)}
              onResize={(rect) => handlePhaseResize(phase.id, rect)}
              onInteractionStart={handlePhaseInteractionStart}
              onInteractionEnd={handlePhaseInteractionEnd}
              onEdit={onEditPhase}
              onDelete={onDeletePhase}
            />
          );
        })}

        {/* Edges - wrapped in SVG */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ 
            width: '100%', 
            height: '100%',
            overflow: 'visible'
          }}
        >
          {project.edges.map(edge => (
            <EdgeComponent
              key={edge.id}
              edge={edge}
              sourceNode={getNodeById(project.nodes, edge.source)}
              targetNode={getNodeById(project.nodes, edge.target)}
              isSelected={selectedEdges.includes(edge.id)}
              onClick={(e) => handleEdgeClick(edge.id, e)}
              onDelete={() => onEdgeDelete(edge.id)}
              onContextMenu={(e) => onContextMenu(e, edge.id, 'edge')}
            />
          ))}
          
          {/* Dragging link preview - inside same SVG for correct transforms */}
          {isDraggingLink && dragLinkStart && dragLinkEnd && (
            <g key="drag-preview">
              <defs>
                <marker
                  id="link-preview-arrow-inline"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L0,6 L9,3 z" fill={dragLinkTargetId ? "#10b981" : "#3b82f6"} />
                </marker>
              </defs>
              <path
                d={`M ${dragLinkStart.x} ${dragLinkStart.y} L ${dragLinkEnd.x} ${dragLinkEnd.y}`}
                stroke={dragLinkTargetId ? "#10b981" : "#3b82f6"}
                strokeWidth="3"
                fill="none"
              strokeDasharray="5,5"
              markerEnd="url(#link-preview-arrow-inline)"
            />
            </g>
          )}
        </svg>

        {/* Nodes */}
        {project.nodes.map(node => (
          <NodeComponent
            key={node.id}
            node={node}
            isSelected={selectedNodes.includes(node.id)}
            onDrag={(newPosition) => handleNodeDrag(node.id, newPosition)}
            onResize={(width, height) => handleNodeResize(node.id, width, height)}
            onClick={(e) => handleNodeClick(node.id, e)}
            onContextMenu={(e) => onContextMenu(e, node.id, 'node')}
            onDragStart={(e) => {
              setIsDragging(true);
              handleNodeDragStart(node.id, e);
            }}
            onDragEnd={(e) => {
              setIsDragging(false);
              handleNodeDragEnd(node.id, e);
            }}
            onHandleDragStart={(e, handlePosition) => {
              handleHandleDragStart(node.id, e, handlePosition);
            }}
            zoom={zoom}
            onEdit={onEditNode}
            onDelete={onDeleteNode}
          />
        ))}

        {/* Marquee selection */}
        {marqueeRect && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none"
            style={{
              left: marqueeRect.left,
              top: marqueeRect.top,
              width: marqueeRect.width,
              height: marqueeRect.height,
            }}
          />
        )}
      </div>

      {/* Link mode indicator */}
      {linkMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded text-sm shadow-lg">
          Link Mode {linkSource ? `- Click target node` : '- Click source node'}
        </div>
      )}
    </div>
  );
};

const CanvasWithToolbar: React.FC<CanvasProps> = (props) => {
  const { project, onProjectChange, onNewNode, onNewPhase, onUndo, onRedo, canUndo, canRedo } = props;
  
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(3, project.viewSettings.zoom * 1.1);
    onProjectChange({
      ...project,
      viewSettings: {
        ...project.viewSettings,
        zoom: newZoom,
      },
    });
  }, [project, onProjectChange]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(0.1, project.viewSettings.zoom * 0.9);
    onProjectChange({
      ...project,
      viewSettings: {
        ...project.viewSettings,
        zoom: newZoom,
      },
    });
  }, [project, onProjectChange]);

  return (
    <div className="flex flex-col h-full">
      <CanvasToolbar
        onNewNode={onNewNode}
        onNewPhase={onNewPhase}
        zoom={project.viewSettings.zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <Canvas {...props} />
    </div>
  );
};

export default CanvasWithToolbar;
