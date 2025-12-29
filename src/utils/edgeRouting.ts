import { Node, Position, Edge } from '../types';

export type HandlePosition = 'top' | 'right' | 'bottom' | 'left';

export interface ConnectionPoint {
  x: number;
  y: number;
  handle: HandlePosition;
}

/**
 * EDGE ROUTING PHILOSOPHY:
 * - Default connector shape: single-bend L-shape or minimal Z-shape (zero or one waypoint)
 * - Waypoints are user-controlled bend points, not auto-generated clutter
 * - All segments strictly orthogonal (horizontal or vertical only)
 * - Primary bend control: midpoint handle on selected edge
 */

/**
 * Get the connection point coordinates for a specific handle on a node
 */
export function getNodeConnectionPoint(
  node: Node,
  handle: HandlePosition,
  nodeWidth: number = 120,
  nodeHeight: number = 60
): Position {
  const { x, y } = node.position;
  const width = node.width || nodeWidth;
  const height = node.height || nodeHeight;

  switch (handle) {
    case 'top':
      return { x: x + width / 2, y };
    case 'right':
      return { x: x + width, y: y + height / 2 };
    case 'bottom':
      return { x: x + width / 2, y: y + height };
    case 'left':
      return { x, y: y + height / 2 };
  }
}

/**
 * Calculate optimal connection handles based on node positions
 * Returns which sides should be used for most direct connection
 */
export function calculateOptimalHandles(
  sourceNode: Node,
  targetNode: Node
): { sourceHandle: HandlePosition; targetHandle: HandlePosition } {
  const sourceCenter = {
    x: sourceNode.position.x + (sourceNode.width || 120) / 2,
    y: sourceNode.position.y + (sourceNode.height || 60) / 2,
  };
  const targetCenter = {
    x: targetNode.position.x + (targetNode.width || 120) / 2,
    y: targetNode.position.y + (targetNode.height || 60) / 2,
  };

  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;

  // Determine primary direction
  const horizontal = Math.abs(dx) > Math.abs(dy);

  if (horizontal) {
    // Horizontal flow is dominant
    if (dx > 0) {
      // Target is to the right
      return { sourceHandle: 'right', targetHandle: 'left' };
    } else {
      // Target is to the left
      return { sourceHandle: 'left', targetHandle: 'right' };
    }
  } else {
    // Vertical flow is dominant
    if (dy > 0) {
      // Target is below
      return { sourceHandle: 'bottom', targetHandle: 'top' };
    } else {
      // Target is above
      return { sourceHandle: 'top', targetHandle: 'bottom' };
    }
  }
}

/**
 * Generate orthogonal (right-angle) path between two points
 * Creates an SVG path string with straight segments and 90-degree turns
 */
export function generateOrthogonalPath(
  sourcePoint: Position,
  targetPoint: Position,
  sourceHandle: HandlePosition,
  targetHandle: HandlePosition,
  waypoints?: Position[]
): string {
  const points: Position[] = [sourcePoint];

  if (waypoints && waypoints.length > 0) {
    // User has defined custom waypoints - route through them
    points.push(...waypoints);
  } else {
    // Auto-generate waypoints for orthogonal routing
    const autoWaypoints = generateAutoWaypoints(
      sourcePoint,
      targetPoint,
      sourceHandle,
      targetHandle
    );
    points.push(...autoWaypoints);
  }

  points.push(targetPoint);

  // Build SVG path with straight line segments
  const pathParts = points.map((point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    } else {
      return `L ${point.x} ${point.y}`;
    }
  });

  return pathParts.join(' ');
}

/**
 * Generate automatic waypoints for orthogonal routing
 * Prefers minimal L-shaped or Z-shaped paths
 */
function generateAutoWaypoints(
  sourcePoint: Position,
  targetPoint: Position,
  sourceHandle: HandlePosition,
  targetHandle: HandlePosition
): Position[] {
  const waypoints: Position[] = [];
  const gap = 20; // Minimum gap from node edge

  // Determine if we need intermediate waypoints based on handles
  const sourceIsHorizontal = sourceHandle === 'left' || sourceHandle === 'right';
  const targetIsHorizontal = targetHandle === 'left' || targetHandle === 'right';

  // Calculate if we can make a simple L-shaped connection
  const dx = targetPoint.x - sourcePoint.x;
  const dy = targetPoint.y - sourcePoint.y;

  if (sourceHandle === 'right' && targetHandle === 'left') {
    // Flowing left to right
    if (dx > gap) {
      // Simple L-shape: horizontal then vertical at midpoint
      const midX = (sourcePoint.x + targetPoint.x) / 2;
      if (Math.abs(dy) > 5) {
        waypoints.push({ x: midX, y: sourcePoint.y });
        waypoints.push({ x: midX, y: targetPoint.y });
      }
    } else {
      // Z-shape detour needed
      const detourX = sourcePoint.x + gap;
      waypoints.push({ x: detourX, y: sourcePoint.y });
      waypoints.push({ x: detourX, y: targetPoint.y });
    }
  } else if (sourceHandle === 'left' && targetHandle === 'right') {
    // Flowing right to left
    if (dx < -gap) {
      const midX = (sourcePoint.x + targetPoint.x) / 2;
      if (Math.abs(dy) > 5) {
        waypoints.push({ x: midX, y: sourcePoint.y });
        waypoints.push({ x: midX, y: targetPoint.y });
      }
    } else {
      const detourX = sourcePoint.x - gap;
      waypoints.push({ x: detourX, y: sourcePoint.y });
      waypoints.push({ x: detourX, y: targetPoint.y });
    }
  } else if (sourceHandle === 'bottom' && targetHandle === 'top') {
    // Flowing top to bottom
    if (dy > gap) {
      const midY = (sourcePoint.y + targetPoint.y) / 2;
      if (Math.abs(dx) > 5) {
        waypoints.push({ x: sourcePoint.x, y: midY });
        waypoints.push({ x: targetPoint.x, y: midY });
      }
    } else {
      const detourY = sourcePoint.y + gap;
      waypoints.push({ x: sourcePoint.x, y: detourY });
      waypoints.push({ x: targetPoint.x, y: detourY });
    }
  } else if (sourceHandle === 'top' && targetHandle === 'bottom') {
    // Flowing bottom to top
    if (dy < -gap) {
      const midY = (sourcePoint.y + targetPoint.y) / 2;
      if (Math.abs(dx) > 5) {
        waypoints.push({ x: sourcePoint.x, y: midY });
        waypoints.push({ x: targetPoint.x, y: midY });
      }
    } else {
      const detourY = sourcePoint.y - gap;
      waypoints.push({ x: sourcePoint.x, y: detourY });
      waypoints.push({ x: targetPoint.x, y: detourY });
    }
  } else {
    // Mixed horizontal/vertical - create simple L-shaped path
    if (sourceIsHorizontal && !targetIsHorizontal) {
      // Source exits horizontally, target enters vertically
      // Single L-shape: go horizontal from source, then vertical to target
      waypoints.push({ x: targetPoint.x, y: sourcePoint.y });
    } else if (!sourceIsHorizontal && targetIsHorizontal) {
      // Source exits vertically, target enters horizontally
      // Single L-shape: go vertical from source, then horizontal to target
      waypoints.push({ x: sourcePoint.x, y: targetPoint.y });
    } else {
      // Both horizontal or both vertical - create minimal Z-shape
      if (sourceIsHorizontal) {
        const midX = (sourcePoint.x + targetPoint.x) / 2;
        waypoints.push({ x: midX, y: sourcePoint.y });
        waypoints.push({ x: midX, y: targetPoint.y });
      } else {
        const midY = (sourcePoint.y + targetPoint.y) / 2;
        waypoints.push({ x: sourcePoint.x, y: midY });
        waypoints.push({ x: targetPoint.x, y: midY });
      }
    }
  }

  return waypoints;
}

/**
 * Simplify waypoints by removing redundant ones that lie on straight segments
 */
export function simplifyWaypoints(
  waypoints: Position[],
  sourcePoint: Position,
  targetPoint: Position
): Position[] {
  if (waypoints.length === 0) return [];

  const allPoints = [sourcePoint, ...waypoints, targetPoint];
  const simplified: Position[] = [];

  for (let i = 1; i < allPoints.length - 1; i++) {
    const prev = allPoints[i - 1];
    const curr = allPoints[i];
    const next = allPoints[i + 1];

    // Check if current point is redundant (lies on a straight line)
    const isHorizontalLine = prev.y === curr.y && curr.y === next.y;
    const isVerticalLine = prev.x === curr.x && curr.x === next.x;

    if (!isHorizontalLine && !isVerticalLine) {
      // This waypoint is needed for a turn
      simplified.push(curr);
    }
  }

  return simplified;
}

/**
 * Calculate arrow direction vector for orthogonal paths
 * Returns the direction the arrow should point based on the final segment
 */
export function getArrowDirection(
  targetPoint: Position,
  secondToLastPoint: Position
): { angle: number; dx: number; dy: number } {
  const dx = targetPoint.x - secondToLastPoint.x;
  const dy = targetPoint.y - secondToLastPoint.y;
  const angle = Math.atan2(dy, dx);

  return { angle, dx, dy };
}

/**
 * Get all four connection points for a node (for rendering anchor handles)
 */
export function getAllNodeConnectionPoints(
  node: Node,
  nodeWidth: number = 120,
  nodeHeight: number = 60
): Record<HandlePosition, Position> {
  return {
    top: getNodeConnectionPoint(node, 'top', nodeWidth, nodeHeight),
    right: getNodeConnectionPoint(node, 'right', nodeWidth, nodeHeight),
    bottom: getNodeConnectionPoint(node, 'bottom', nodeWidth, nodeHeight),
    left: getNodeConnectionPoint(node, 'left', nodeWidth, nodeHeight),
  };
}

/**
 * Find closest handle to a given position
 * Used when dragging anchor points
 */
export function getClosestHandle(
  mousePos: Position,
  nodeConnectionPoints: Record<HandlePosition, Position>
): HandlePosition {
  let closestHandle: HandlePosition = 'right';
  let minDistance = Infinity;

  Object.entries(nodeConnectionPoints).forEach(([handle, point]) => {
    const distance = Math.sqrt(
      Math.pow(mousePos.x - point.x, 2) + Math.pow(mousePos.y - point.y, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestHandle = handle as HandlePosition;
    }
  });

  return closestHandle;
}

/**
 * Insert a waypoint into the edge at the optimal position
 * Finds which segment the click point is closest to and inserts there
 */
export function insertWaypointAtPosition(
  clickPos: Position,
  pathPoints: Position[]
): { waypoints: Position[]; insertIndex: number } {
  let closestSegmentIndex = 0;
  let minDistance = Infinity;
  let insertionPoint = clickPos;

  // Find which segment is closest to the click
  for (let i = 0; i < pathPoints.length - 1; i++) {
    const p1 = pathPoints[i];
    const p2 = pathPoints[i + 1];
    
    // Calculate distance from click to this segment
    const { distance, point } = distanceToSegment(clickPos, p1, p2);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestSegmentIndex = i;
      insertionPoint = point;
    }
  }

  // Insert the waypoint (excluding source and target which are first and last)
  const waypoints: Position[] = [];
  for (let i = 1; i < pathPoints.length - 1; i++) {
    if (i - 1 === closestSegmentIndex) {
      waypoints.push(insertionPoint);
    }
    waypoints.push(pathPoints[i]);
  }
  
  // If insertion is after all existing waypoints
  if (closestSegmentIndex >= pathPoints.length - 2) {
    waypoints.push(insertionPoint);
  }

  return { waypoints, insertIndex: closestSegmentIndex };
}

/**
 * Calculate distance from a point to a line segment
 */
function distanceToSegment(
  point: Position,
  lineStart: Position,
  lineEnd: Position
): { distance: number; point: Position } {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    // Line segment is actually a point
    const dist = Math.sqrt(
      Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2)
    );
    return { distance: dist, point: lineStart };
  }

  // Calculate projection of point onto line segment
  let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));

  const projectedPoint = {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  };

  const distance = Math.sqrt(
    Math.pow(point.x - projectedPoint.x, 2) + Math.pow(point.y - projectedPoint.y, 2)
  );

  return { distance, point: projectedPoint };
}

/**
 * Check if a waypoint can be removed (it's close to the straight line between neighbors)
 */
export function isWaypointRedundant(
  waypoint: Position,
  prevPoint: Position,
  nextPoint: Position,
  threshold: number = 5
): boolean {
  const { distance } = distanceToSegment(waypoint, prevPoint, nextPoint);
  return distance < threshold;
}

/**
 * Constrain a waypoint position to maintain orthogonal (90°) segments
 * Returns a corrected position that ensures horizontal or vertical segments only
 */
export function constrainToOrthogonal(
  newPos: Position,
  prevPoint: Position,
  nextPoint: Position
): Position {
  // Calculate distances to determine which axis to constrain
  const dxPrev = Math.abs(newPos.x - prevPoint.x);
  const dyPrev = Math.abs(newPos.y - prevPoint.y);
  const dxNext = Math.abs(newPos.x - nextPoint.x);
  const dyNext = Math.abs(newPos.y - nextPoint.y);

  // Determine if we should create horizontal-then-vertical or vertical-then-horizontal
  // We want to minimize the total path length while staying orthogonal
  
  // Try both options and pick the one with shorter total distance
  const option1Distance = dxPrev + dyNext; // horizontal to prev, vertical to next
  const option2Distance = dyPrev + dxNext; // vertical to prev, horizontal to next

  if (option1Distance <= option2Distance) {
    // Horizontal segment to prev, vertical segment to next
    // Keep x from new position, y from next point
    return { x: newPos.x, y: nextPoint.y };
  } else {
    // Vertical segment to prev, horizontal segment to next
    // Keep y from new position, x from next point  
    return { x: nextPoint.x, y: newPos.y };
  }
}

/**
 * Calculate the geometric midpoint of a path (polyline)
 * Returns the point roughly halfway along the path for placing handles and labels
 */
export function getPathMidpoint(pathPoints: Position[]): Position {
  if (pathPoints.length === 0) {
    return { x: 0, y: 0 };
  }
  
  if (pathPoints.length === 1) {
    return pathPoints[0];
  }
  
  if (pathPoints.length === 2) {
    return {
      x: (pathPoints[0].x + pathPoints[1].x) / 2,
      y: (pathPoints[0].y + pathPoints[1].y) / 2,
    };
  }
  
  // For paths with 3+ points, find the point roughly in the middle
  // This works well for L-shapes and Z-shapes
  const midIndex = Math.floor(pathPoints.length / 2);
  return pathPoints[midIndex];
}

