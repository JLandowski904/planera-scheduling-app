import { Node, Phase } from '../types';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const DEFAULT_PHASE_COLOR = '#1d4ed8';

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) {
    return `rgba(30, 64, 175, ${alpha})`;
  }
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getPhaseBackgroundColor = (hex: string, alpha: number = 0.1) =>
  hexToRgba(hex, alpha);

const NODE_DEFAULT_DIMENSIONS: Record<Node['type'], { width: number; height: number }> = {
  milestone: { width: 120, height: 120 },
  deliverable: { width: 140, height: 80 },
  task: { width: 140, height: 80 },
  person: { width: 100, height: 100 },
};

export const getNodeDimensions = (node: Node) => {
  const defaults = NODE_DEFAULT_DIMENSIONS[node.type] ?? { width: 120, height: 80 };
  return {
    width: node.width ?? defaults.width,
    height: node.height ?? defaults.height,
  };
};

export const getNodesBoundingBox = (nodes: Node[]): BoundingBox | null => {
  if (nodes.length === 0) {
    return null;
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  nodes.forEach(node => {
    const { width, height } = getNodeDimensions(node);
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

export const getPhaseDateRange = (
  phase: Phase,
  nodes: Node[]
): { startDate?: Date; endDate?: Date } => {
  const nodesById = new Map(nodes.map(node => [node.id, node]));
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  phase.nodeIds.forEach(nodeId => {
    const node = nodesById.get(nodeId);
    if (!node) return;
    if (node.type === 'person') return;

    const possibleStart = node.data.startDate ?? node.data.dueDate;
    const possibleEnd = node.data.dueDate ?? node.data.startDate;

    if (possibleStart) {
      startDate =
        !startDate || possibleStart.getTime() < startDate.getTime()
          ? possibleStart
          : startDate;
    }

    if (possibleEnd) {
      endDate =
        !endDate || possibleEnd.getTime() > endDate.getTime() ? possibleEnd : endDate;
    }
  });

  return { startDate, endDate };
};

export const formatPhaseDateRange = (
  range: { startDate?: Date; endDate?: Date }
): string => {
  const { startDate, endDate } = range;
  if (!startDate && !endDate) {
    return '—';
  }

  const format = (date: Date) =>
    date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  if (startDate && endDate) {
    return `${format(startDate)} – ${format(endDate)}`;
  }

  if (startDate) {
    return `${format(startDate)} – —`;
  }

  return `— – ${format(endDate!)}`;
};

export const removeNodeIdsFromPhases = (phases: Phase[], nodeIds: Set<string>): Phase[] => {
  if (nodeIds.size === 0) return phases;
  return phases.map(phase => ({
    ...phase,
    nodeIds: phase.nodeIds.filter(id => !nodeIds.has(id)),
  }));
};

/**
 * Check if a node is contained within a phase boundary
 */
export const isNodeInPhase = (node: Node, phase: Phase): boolean => {
  const { width, height } = getNodeDimensions(node);
  const nodeLeft = node.position.x;
  const nodeTop = node.position.y;
  const nodeRight = nodeLeft + width;
  const nodeBottom = nodeTop + height;

  const phaseLeft = phase.position.x;
  const phaseTop = phase.position.y;
  const phaseRight = phaseLeft + phase.size.width;
  const phaseBottom = phaseTop + phase.size.height;

  return (
    nodeLeft >= phaseLeft &&
    nodeTop >= phaseTop &&
    nodeRight <= phaseRight &&
    nodeBottom <= phaseBottom
  );
};

/**
 * Auto-detect nodes within a phase and update the phase's nodeIds
 */
export const getNodesInPhase = (phase: Phase, nodes: Node[]): string[] => {
  return nodes
    .filter(node => isNodeInPhase(node, phase))
    .map(node => node.id);
};

/**
 * Update all phases to include nodes that are now within their boundaries
 */
export const autoAssociateNodesWithPhases = (phases: Phase[], nodes: Node[]): Phase[] => {
  return phases.map(phase => ({
    ...phase,
    nodeIds: getNodesInPhase(phase, nodes),
  }));
};
