import { Project, Node, Edge, ViewType, TaskStatus, Priority } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const createDefaultProject = (): Project => ({
  id: 'default',
  name: 'New Project',
  description: 'A new construction scheduling project',
  createdAt: new Date(),
  updatedAt: new Date(),
  nodes: [],
  edges: [],
  phases: [],
  viewSettings: {
    currentView: 'whiteboard' as ViewType,
    zoom: 1,
    pan: { x: 0, y: 0 },
    snapToGrid: true,
    gridSize: 20,
    showGrid: true,
  },
  filters: {
    types: [],
    statuses: [],
    assignees: [],
    disciplines: [],
    tags: [],
    phases: [],
    blockedOnly: false,
    customPresets: [],
  },
});

export const createSampleProject = (): Project => {
  const projectId = uuidv4();
  const now = new Date();
  
  // Create people
  const pm = createPersonNode('PM', 'Project Manager', { x: 50, y: 50 });
  const civil = createPersonNode('CE', 'Civil Engineer', { x: 50, y: 100 });
  const stormwater = createPersonNode('SW', 'Stormwater Engineer', { x: 50, y: 150 });
  const survey = createPersonNode('SV', 'Surveyor', { x: 50, y: 200 });

  // Create milestones
  const milestone30 = createMilestoneNode('30% Design', { x: 300, y: 50 }, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));
  const milestone60 = createMilestoneNode('60% Design', { x: 500, y: 50 }, new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000));
  const milestone90 = createMilestoneNode('90% Design', { x: 700, y: 50 }, new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000));
  const permitIssued = createMilestoneNode('Permit Issued', { x: 900, y: 50 }, new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000));

  // Create deliverables
  const sitePlan = createDeliverableNode('Site Plan', { x: 300, y: 150 }, new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000));
  const utilityPlan = createDeliverableNode('Utility Plan', { x: 500, y: 150 }, new Date(now.getTime() + 55 * 24 * 60 * 60 * 1000));
  const stormwaterReport = createDeliverableNode('Stormwater Report', { x: 700, y: 150 }, new Date(now.getTime() + 85 * 24 * 60 * 60 * 1000));

  // Create tasks
  const topoSurvey = createTaskNode('Topo Survey', { x: 200, y: 250 }, {
    startDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
    status: 'in_progress' as TaskStatus,
    priority: 'high' as Priority,
    percentComplete: 30,
    assignees: [survey.id],
    discipline: 'Survey',
    tags: ['Survey'],
  });

  const geotechReport = createTaskNode('Geotech Report', { x: 200, y: 300 }, {
    startDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
    dueDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
    status: 'not_started' as TaskStatus,
    priority: 'med' as Priority,
    percentComplete: 0,
    assignees: [civil.id],
    discipline: 'Civil',
    tags: ['Geotech'],
  });

  const utilityCoordination = createTaskNode('Utility Coordination', { x: 400, y: 250 }, {
    startDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
    dueDate: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000),
    status: 'not_started' as TaskStatus,
    priority: 'high' as Priority,
    percentComplete: 0,
    assignees: [civil.id],
    discipline: 'Civil',
    tags: ['Utility'],
  });

  const stormwaterModeling = createTaskNode('Stormwater Modeling', { x: 600, y: 250 }, {
    startDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    dueDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
    status: 'not_started' as TaskStatus,
    priority: 'med' as Priority,
    percentComplete: 0,
    assignees: [stormwater.id],
    discipline: 'Stormwater',
    tags: ['Modeling'],
  });

  const planSet60 = createTaskNode('Plan Set (60%)', { x: 600, y: 300 }, {
    startDate: new Date(now.getTime() + 50 * 24 * 60 * 60 * 1000),
    dueDate: new Date(now.getTime() + 70 * 24 * 60 * 60 * 1000),
    status: 'not_started' as TaskStatus,
    priority: 'high' as Priority,
    percentComplete: 0,
    assignees: [civil.id, pm.id],
    discipline: 'Civil',
    tags: ['Plan Set'],
  });

  const agencyReview = createTaskNode('Agency Review', { x: 800, y: 250 }, {
    startDate: new Date(now.getTime() + 80 * 24 * 60 * 60 * 1000),
    dueDate: new Date(now.getTime() + 100 * 24 * 60 * 60 * 1000),
    status: 'not_started' as TaskStatus,
    priority: 'high' as Priority,
    percentComplete: 0,
    assignees: [pm.id],
    discipline: 'Civil',
    tags: ['Review', 'Permit'],
  });

  const nodes: Node[] = [
    pm, civil, stormwater, survey,
    milestone30, milestone60, milestone90, permitIssued,
    sitePlan, utilityPlan, stormwaterReport,
    topoSurvey, geotechReport, utilityCoordination, stormwaterModeling, planSet60, agencyReview,
  ];

  // Create edges (dependencies)
  const edges: Edge[] = [
    // Topo Survey -> Site Plan
    createEdge(topoSurvey.id, sitePlan.id),
    // Geotech Report -> Site Plan
    createEdge(geotechReport.id, sitePlan.id),
    // Site Plan -> 30% Design
    createEdge(sitePlan.id, milestone30.id),
    // Utility Coordination -> Utility Plan
    createEdge(utilityCoordination.id, utilityPlan.id),
    // Utility Plan -> 60% Design
    createEdge(utilityPlan.id, milestone60.id),
    // Stormwater Modeling -> Stormwater Report
    createEdge(stormwaterModeling.id, stormwaterReport.id),
    // Stormwater Report -> 90% Design
    createEdge(stormwaterReport.id, milestone90.id),
    // Plan Set (60%) -> Agency Review
    createEdge(planSet60.id, agencyReview.id),
    // Agency Review -> Permit Issued
    createEdge(agencyReview.id, permitIssued.id),
  ];

  return {
    id: projectId,
    name: 'Subdivision – Oak Ridge',
    description: 'Residential subdivision development project',
    createdAt: now,
    updatedAt: now,
    nodes,
    edges,
    phases: [],
    viewSettings: {
      currentView: 'whiteboard' as ViewType,
      zoom: 0.8,
      pan: { x: -100, y: -50 },
      snapToGrid: true,
      gridSize: 20,
      showGrid: true,
    },
    filters: {
      types: [],
      statuses: [],
      assignees: [],
      disciplines: [],
      tags: [],
      phases: [],
      blockedOnly: false,
      customPresets: [
        {
          id: 'permitting',
          name: 'Permitting',
          filters: { tags: ['Permit', 'Review'] },
        },
        {
          id: 'civil-only',
          name: 'Civil Only',
          filters: { disciplines: ['Civil'] },
        },
        {
          id: 'blocked-items',
          name: 'Blocked Items',
          filters: { blockedOnly: true },
        },
      ],
    },
  };
};

const createPersonNode = (initials: string, title: string, position: { x: number; y: number }): Node => ({
  id: uuidv4(),
  type: 'person',
  title,
  position,
  width: 60,
  height: 60,
  data: {
    id: uuidv4(),
    title,
    type: 'person',
    initials,
    tags: [],
    workload: {
      tasks: [],
      totalDurationByWeek: {},
      isOverAllocated: false,
    },
  },
});

const createMilestoneNode = (title: string, position: { x: number; y: number }, dueDate: Date): Node => ({
  id: uuidv4(),
  type: 'milestone',
  title,
  position,
  width: 80,
  height: 80,
  data: {
    id: uuidv4(),
    title,
    type: 'milestone',
    dueDate,
    tags: ['Milestone'],
  },
});

const createDeliverableNode = (title: string, position: { x: number; y: number }, dueDate: Date): Node => ({
  id: uuidv4(),
  type: 'deliverable',
  title,
  position,
  width: 120,
  height: 60,
  data: {
    id: uuidv4(),
    title,
    type: 'deliverable',
    dueDate,
    tags: ['Deliverable'],
  },
});

const createTaskNode = (title: string, position: { x: number; y: number }, data: any): Node => ({
  id: uuidv4(),
  type: 'task',
  title,
  position,
  width: 140,
  height: 80,
  data: {
    id: uuidv4(),
    title,
    type: 'task',
    tags: [],
    ...data,
  },
});

const createEdge = (source: string, target: string): Edge => ({
  id: uuidv4(),
  source,
  target,
  type: 'finish_to_start',
});

export const getNodeById = (nodes: Node[], id: string): Node | undefined => {
  return nodes.find(node => node.id === id);
};

export const getEdgeById = (edges: Edge[], id: string): Edge | undefined => {
  return edges.find(edge => edge.id === id);
};

export const getConnectedNodes = (nodeId: string, edges: Edge[]): string[] => {
  const connected: string[] = [];
  edges.forEach(edge => {
    if (edge.source === nodeId && !connected.includes(edge.target)) {
      connected.push(edge.target);
    }
    if (edge.target === nodeId && !connected.includes(edge.source)) {
      connected.push(edge.source);
    }
  });
  return connected;
};

export const getNodeDependencies = (nodeId: string, edges: Edge[]): Edge[] => {
  return edges.filter(edge => edge.target === nodeId);
};

export const getNodeDependents = (nodeId: string, edges: Edge[]): Edge[] => {
  return edges.filter(edge => edge.source === nodeId);
};

export const detectCircularDependencies = (edges: Edge[]): string[][] => {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const dfs = (nodeId: string, path: string[]): void => {
    if (recursionStack.has(nodeId)) {
      const cycleStart = path.indexOf(nodeId);
      cycles.push(path.slice(cycleStart));
      return;
    }

    if (visited.has(nodeId)) return;

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const outgoingEdges = edges.filter(edge => edge.source === nodeId);
    outgoingEdges.forEach(edge => {
      dfs(edge.target, [...path, nodeId]);
    });

    recursionStack.delete(nodeId);
  };

  const allNodes = new Set<string>();
  edges.forEach(edge => {
    allNodes.add(edge.source);
    allNodes.add(edge.target);
  });

  allNodes.forEach(nodeId => {
    if (!visited.has(nodeId)) {
      dfs(nodeId, []);
    }
  });

  return cycles;
};
