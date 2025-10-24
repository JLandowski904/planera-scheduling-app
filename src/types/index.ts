export type NodeType = 'milestone' | 'deliverable' | 'task' | 'person';
export type TaskStatus = 'not_started' | 'in_progress' | 'blocked' | 'done';
export type Priority = 'low' | 'med' | 'high';
export type DependencyType = 'finish_to_start' | 'start_to_start' | 'finish_to_finish';
export type ViewType = 'whiteboard' | 'timeline' | 'table' | 'calendar';
export interface Position {
  x: number;
  y: number;
}

export interface RectSize {
  width: number;
  height: number;
}

export interface Node {
  id: string;
  type: NodeType;
  title: string;
  position: Position;
  data: NodeData;
  selected?: boolean;
  width?: number;
  height?: number;
}

export interface NodeData {
  // Common fields
  id: string;
  title: string;
  type: NodeType;
  notes?: string;
  tags: string[];
  
  // Task-specific fields
  assignees?: string[]; // Person node IDs
  startDate?: Date;
  dueDate?: Date;
  durationDays?: number;
  status?: TaskStatus;
  priority?: Priority;
  percentComplete?: number;
  dependencies?: string[]; // Edge IDs
  
  // Person-specific fields
  initials?: string;
  avatar?: string;
  workload?: WorkloadData;
  
  // Construction-specific fields
  discipline?: string;
  submittalNumber?: string;
  reviewDays?: number;
  
  // Hierarchy
  parentId?: string;
  children?: string[];
}

export interface WorkloadData {
  tasks: string[];
  totalDurationByWeek: { [week: string]: number };
  isOverAllocated: boolean;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type: DependencyType;
  label?: string;
  selected?: boolean;
  isBlocked?: boolean;
  blockedBy?: string;
}

export interface Phase {
  id: string;
  title: string;
  position: Position;
  size: RectSize;
  color: string;
  nodeIds: string[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  nodes: Node[];
  edges: Edge[];
  phases: Phase[];
  viewSettings: ViewSettings;
  filters: FilterSettings;
}

export interface ViewSettings {
  currentView: ViewType;
  zoom: number;
  pan: Position;
  snapToGrid: boolean;
  gridSize: number;
  showGrid: boolean;
}

export interface FilterSettings {
  types: NodeType[];
  statuses: TaskStatus[];
  assignees: string[];
  disciplines: string[];
  tags: string[];
  phases: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  blockedOnly: boolean;
  customPresets: FilterPreset[];
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: Partial<FilterSettings>;
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  targetId?: string;
  targetType?: 'node' | 'edge' | 'canvas';
}

export interface UndoRedoState {
  history: Project[];
  currentIndex: number;
  maxHistorySize: number;
}

export interface ConflictWarning {
  id: string;
  type: 'circular_dependency' | 'over_allocation' | 'deliverable_conflict' | 'date_conflict';
  message: string;
  nodeIds: string[];
  edgeId?: string;
  severity: 'warning' | 'error';
}

// Construction templates
export interface ConstructionTemplate {
  id: string;
  name: string;
  description: string;
  phases: ConstructionPhase[];
  defaultDisciplines: string[];
  defaultTags: string[];
}

export interface ConstructionPhase {
  name: string;
  milestones: string[];
  deliverables: string[];
  typicalDuration: number; // in days
}

// API types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description?: string;
  nodeCount: number;
  edgeCount: number;
  lastModified: Date;
}
