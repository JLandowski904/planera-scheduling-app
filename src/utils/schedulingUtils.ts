import { Project, Node, Edge, DependencyType } from '../types';
import { addDays, differenceInDays, isAfter, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, format, addMonths, addWeeks } from 'date-fns';

export type TimelineScale = 'month' | 'week' | 'day';

export interface TimeBucket {
  start: Date;
  end: Date;
  label: string;
  groupLabel?: string; // For day view, this is the month grouping
}

export interface SchedulingResult {
  updatedNodes: Node[];
  conflicts: Array<{
    type: 'date_conflict' | 'circular_dependency' | 'over_allocation';
    message: string;
    nodeIds: string[];
    edgeId?: string;
  }>;
}

/**
 * Propagate date changes through the dependency network
 */
export const propagateDateChanges = (
  project: Project,
  changedNodeId: string,
  newStartDate?: Date,
  newDueDate?: Date
): SchedulingResult => {
  const updatedNodes = [...project.nodes];
  const conflicts: SchedulingResult['conflicts'] = [];
  
  // Find the changed node
  const changedNodeIndex = updatedNodes.findIndex(n => n.id === changedNodeId);
  if (changedNodeIndex === -1) {
    return { updatedNodes, conflicts };
  }

  const changedNode = updatedNodes[changedNodeIndex];
  
  // Update the changed node
  if (newStartDate) {
    updatedNodes[changedNodeIndex] = {
      ...changedNode,
      data: { ...changedNode.data, startDate: newStartDate }
    };
  }
  
  if (newDueDate) {
    updatedNodes[changedNodeIndex] = {
      ...changedNode,
      data: { ...changedNode.data, dueDate: newDueDate }
    };
  }

  // Get all outgoing dependencies (nodes that depend on this one)
  const outgoingEdges = project.edges.filter(edge => edge.source === changedNodeId);
  
  // Process each dependent node
  outgoingEdges.forEach(edge => {
    const dependentNodeIndex = updatedNodes.findIndex(n => n.id === edge.target);
    if (dependentNodeIndex === -1) return;
    
    const dependentNode = updatedNodes[dependentNodeIndex];
    const predecessor = updatedNodes[changedNodeIndex];
    
    // Calculate new dates based on dependency type
    const newDates = calculateDependentDates(
      predecessor,
      dependentNode,
      edge.type
    );
    
    if (newDates) {
      updatedNodes[dependentNodeIndex] = {
        ...dependentNode,
        data: {
          ...dependentNode.data,
          startDate: newDates.startDate,
          dueDate: newDates.dueDate
        }
      };
      
      // Recursively propagate to this node's dependents
      const subResult = propagateDateChanges(
        { ...project, nodes: updatedNodes },
        dependentNode.id,
        newDates.startDate,
        newDates.dueDate
      );
      
      // Merge results
      subResult.updatedNodes.forEach((node, index) => {
        const existingIndex = updatedNodes.findIndex(n => n.id === node.id);
        if (existingIndex !== -1) {
          updatedNodes[existingIndex] = node;
        }
      });
      
      conflicts.push(...subResult.conflicts);
    }
  });

  // Check for conflicts
  conflicts.push(...detectDateConflicts(updatedNodes, project.edges));
  
  return { updatedNodes, conflicts };
};

/**
 * Calculate new dates for a dependent node based on its predecessor
 */
const calculateDependentDates = (
  predecessor: Node,
  dependent: Node,
  dependencyType: DependencyType
): { startDate: Date; dueDate: Date } | null => {
  if (!predecessor.data.startDate || !predecessor.data.dueDate) {
    return null;
  }

  const predecessorStart = predecessor.data.startDate;
  const predecessorEnd = predecessor.data.dueDate;
  const predecessorDuration = differenceInDays(predecessorEnd, predecessorStart);
  
  let newStartDate: Date;
  let newDueDate: Date;
  
  switch (dependencyType) {
    case 'finish_to_start':
      // Dependent starts when predecessor finishes
      newStartDate = addDays(predecessorEnd, 1);
      newDueDate = dependent.data.dueDate || addDays(newStartDate, predecessorDuration);
      break;
      
    case 'start_to_start':
      // Dependent starts when predecessor starts
      newStartDate = predecessorStart;
      newDueDate = dependent.data.dueDate || addDays(newStartDate, predecessorDuration);
      break;
      
    case 'finish_to_finish':
      // Dependent finishes when predecessor finishes
      newDueDate = predecessorEnd;
      newStartDate = dependent.data.startDate || addDays(newDueDate, -predecessorDuration);
      break;
      
    default:
      return null;
  }
  
  return { startDate: newStartDate, dueDate: newDueDate };
};

export interface DependencyConflictDetail {
  edgeId: string;
  sourceId: string;
  targetId: string;
  message: string;
}

export const getDependencyConflicts = (
  nodes: Node[],
  edges: Edge[]
): DependencyConflictDetail[] => {
  const conflicts: DependencyConflictDetail[] = [];
  const nodeLookup = new Map(nodes.map(node => [node.id, node]));

  edges.forEach(edge => {
    const sourceNode = nodeLookup.get(edge.source);
    const targetNode = nodeLookup.get(edge.target);
    if (!sourceNode || !targetNode) {
      return;
    }

    const sourceStart = sourceNode.data.startDate;
    const sourceDue = sourceNode.data.dueDate;
    const targetStart = targetNode.data.startDate;
    const targetDue = targetNode.data.dueDate;

    const addConflict = (message: string) => {
      conflicts.push({
        edgeId: edge.id,
        sourceId: edge.source,
        targetId: edge.target,
        message,
      });
    };

    switch (edge.type) {
      case 'finish_to_start': {
        if (sourceDue && targetStart && sourceDue.getTime() > targetStart.getTime()) {
          addConflict(`${targetNode.title} starts before ${sourceNode.title} finishes`);
        }
        break;
      }
      case 'start_to_start': {
        if (sourceStart && targetStart && sourceStart.getTime() > targetStart.getTime()) {
          addConflict(`${targetNode.title} starts before ${sourceNode.title} starts`);
        }
        break;
      }
      case 'finish_to_finish': {
        if (sourceDue && targetDue && sourceDue.getTime() > targetDue.getTime()) {
          addConflict(`${targetNode.title} finishes before ${sourceNode.title} finishes`);
        }
        break;
      }
      default:
        break;
    }
  });

  return conflicts;
};

/**
 * Detect date conflicts in the project
 */
export const detectDateConflicts = (
  nodes: Node[],
  edges: Edge[]
): SchedulingResult['conflicts'] => {
  const conflicts: SchedulingResult['conflicts'] = [];
  const dependencyConflicts = getDependencyConflicts(nodes, edges);

  dependencyConflicts.forEach(conflict => {
    conflicts.push({
      type: 'date_conflict',
      message: conflict.message,
      nodeIds: [conflict.sourceId, conflict.targetId],
      edgeId: conflict.edgeId,
    });
  });

  return conflicts;
};

/**
 * Calculate critical path through the project
 */
export const calculateCriticalPath = (project: Project): string[] => {
  const nodes = project.nodes;
  const edges = project.edges;
  
  // Build adjacency list
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  
  nodes.forEach(node => {
    graph.set(node.id, []);
    inDegree.set(node.id, 0);
  });
  
  edges.forEach(edge => {
    graph.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });
  
  // Find longest path using topological sort
  const distances = new Map<string, number>();
  const predecessors = new Map<string, string | null>();
  
  nodes.forEach(node => {
    distances.set(node.id, 0);
    predecessors.set(node.id, null);
  });
  
  // Topological sort
  const queue: string[] = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDistance = distances.get(current) || 0;
    const currentNode = nodes.find(n => n.id === current);
    
    if (currentNode?.data.dueDate && currentNode.data.startDate) {
      const duration = differenceInDays(currentNode.data.dueDate, currentNode.data.startDate);
      const newDistance = currentDistance + duration;
      
      graph.get(current)?.forEach(neighbor => {
        const neighborDistance = distances.get(neighbor) || 0;
        if (newDistance > neighborDistance) {
          distances.set(neighbor, newDistance);
          predecessors.set(neighbor, current);
        }
        
        const newInDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newInDegree);
        
        if (newInDegree === 0) {
          queue.push(neighbor);
        }
      });
    }
  }
  
  // Find the node with maximum distance (end of critical path)
  let maxDistance = 0;
  let endNode = '';
  
  distances.forEach((distance, nodeId) => {
    if (distance > maxDistance) {
      maxDistance = distance;
      endNode = nodeId;
    }
  });
  
  // Reconstruct critical path
  const criticalPath: string[] = [];
  let current = endNode;
  
  while (current) {
    criticalPath.unshift(current);
    current = predecessors.get(current) || '';
  }
  
  return criticalPath;
};

/**
 * Calculate workload for a person
 */
export const calculatePersonWorkload = (
  personId: string,
  project: Project
): { totalHours: number; tasks: string[]; isOverAllocated: boolean } => {
  const tasks = project.nodes.filter(node => 
    node.type === 'task' && 
    node.data.assignees?.includes(personId)
  );
  
  let totalHours = 0;
  const taskIds: string[] = [];
  
  tasks.forEach(task => {
    if (task.data.startDate && task.data.dueDate) {
      const duration = differenceInDays(task.data.dueDate, task.data.startDate) + 1;
      totalHours += duration * 8; // Assume 8 hours per day
      taskIds.push(task.id);
    }
  });
  
  return {
    totalHours,
    tasks: taskIds,
    isOverAllocated: totalHours > 40 // More than 40 hours per week
  };
};

/**
 * Auto-schedule tasks based on dependencies and constraints
 */
export const autoScheduleProject = (project: Project): SchedulingResult => {
  const updatedNodes = [...project.nodes];
  const conflicts: SchedulingResult['conflicts'] = [];
  
  // Sort nodes by dependency order (topological sort)
  const sortedNodes = topologicalSort(project.nodes, project.edges);
  
  // Schedule each node
  sortedNodes.forEach(node => {
    if (node.type === 'task' && !node.data.startDate) {
      const dependencies = project.edges.filter(edge => edge.target === node.id);
      
      if (dependencies.length > 0) {
        // Find the latest finish date among dependencies
        let latestFinishDate = new Date(0);
        
        dependencies.forEach(dep => {
          const sourceNode = updatedNodes.find(n => n.id === dep.source);
          if (sourceNode?.data.dueDate) {
            const finishDate = dep.type === 'finish_to_start' 
              ? addDays(sourceNode.data.dueDate, 1)
              : sourceNode.data.dueDate;
            
            if (isAfter(finishDate, latestFinishDate)) {
              latestFinishDate = finishDate;
            }
          }
        });
        
        // Set start date and calculate end date
        const duration = node.data.durationDays ?? 5; // Default 5 days
        const startDate = latestFinishDate;
        const dueDate = addDays(startDate, duration - 1);
        
        const nodeIndex = updatedNodes.findIndex(n => n.id === node.id);
        if (nodeIndex !== -1) {
          updatedNodes[nodeIndex] = {
            ...node,
            data: {
              ...node.data,
              startDate,
              dueDate
            }
          };
        }
      }
    }
  });
  
  // Check for conflicts
  conflicts.push(...detectDateConflicts(updatedNodes, project.edges));
  
  return { updatedNodes, conflicts };
};

/**
 * Topological sort for dependency ordering
 */
const topologicalSort = (nodes: Node[], edges: Edge[]): Node[] => {
  const inDegree = new Map<string, number>();
  const graph = new Map<string, string[]>();
  
  nodes.forEach(node => {
    inDegree.set(node.id, 0);
    graph.set(node.id, []);
  });
  
  edges.forEach(edge => {
    graph.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });
  
  const queue: string[] = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });
  
  const result: Node[] = [];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentNode = nodes.find(n => n.id === current);
    if (currentNode) {
      result.push(currentNode);
    }
    
    graph.get(current)?.forEach(neighbor => {
      const newInDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newInDegree);
      
      if (newInDegree === 0) {
        queue.push(neighbor);
      }
    });
  }
  
  return result;
};

/**
 * Generate time buckets for the timeline based on scale
 */
export const getTimeBuckets = (
  visibleStart: Date,
  visibleEnd: Date,
  scale: TimelineScale
): TimeBucket[] => {
  const buckets: TimeBucket[] = [];
  
  switch (scale) {
    case 'month': {
      let current = startOfMonth(visibleStart);
      const end = endOfMonth(visibleEnd);
      
      while (current <= end) {
        const monthEnd = endOfMonth(current);
        buckets.push({
          start: current,
          end: monthEnd,
          label: format(current, 'MMM yyyy'),
        });
        current = addMonths(current, 1);
      }
      break;
    }
    
    case 'week': {
      let current = startOfWeek(visibleStart);
      const end = endOfWeek(visibleEnd);
      
      while (current <= end) {
        const weekEnd = endOfWeek(current);
        buckets.push({
          start: current,
          end: weekEnd,
          label: format(current, 'MMM d'),
        });
        current = addWeeks(current, 1);
      }
      break;
    }
    
    case 'day': {
      let current = startOfDay(visibleStart);
      const end = endOfDay(visibleEnd);
      let lastMonth = '';
      
      while (current <= end) {
        const dayEnd = endOfDay(current);
        const monthLabel = format(current, 'MMM yyyy');
        
        buckets.push({
          start: current,
          end: dayEnd,
          label: format(current, 'd'),
          groupLabel: monthLabel !== lastMonth ? monthLabel : undefined,
        });
        
        lastMonth = monthLabel;
        current = addDays(current, 1);
      }
      break;
    }
  }
  
  return buckets;
};

/**
 * Get the x position for a date in the timeline
 */
export const getXPositionForDate = (
  date: Date,
  visibleStart: Date,
  visibleEnd: Date,
  totalWidth: number
): number => {
  const totalDays = differenceInDays(visibleEnd, visibleStart);
  const daysSinceStart = differenceInDays(date, visibleStart);
  return (daysSinceStart / totalDays) * totalWidth;
};

/**
 * Get the width for a date range in the timeline
 */
export const getWidthForDateRange = (
  startDate: Date,
  endDate: Date,
  visibleStart: Date,
  visibleEnd: Date,
  totalWidth: number
): number => {
  const duration = differenceInDays(endDate, startDate) + 1; // +1 to include end day
  const totalDays = differenceInDays(visibleEnd, visibleStart);
  return (duration / totalDays) * totalWidth;
};

/**
 * Calculate appropriate visible date range based on nodes and padding
 */
export const calculateVisibleDateRange = (
  nodes: Node[],
  paddingDays: number = 7
): { start: Date; end: Date } => {
  const nodesWithDates = nodes.filter(node => 
    node.data.startDate || node.data.dueDate
  );

  if (nodesWithDates.length === 0) {
    const today = new Date();
    return {
      start: addDays(today, -30),
      end: addDays(today, 90),
    };
  }

  const dates = nodesWithDates.flatMap(node => [
    node.data.startDate,
    node.data.dueDate,
  ]).filter(Boolean) as Date[];

  const start = new Date(Math.min(...dates.map(d => d.getTime())));
  const end = new Date(Math.max(...dates.map(d => d.getTime())));

  return {
    start: addDays(start, -paddingDays),
    end: addDays(end, paddingDays),
  };
};


