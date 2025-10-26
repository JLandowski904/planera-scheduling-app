import React, { useEffect, useMemo, useState } from 'react';
import { format, addDays, differenceInCalendarDays } from 'date-fns';
import { Project, Node, NodeType, TaskStatus, Priority, DependencyType } from '../types';

type DialogMode = 'create' | 'edit';

interface NodeDialogProps {
  isOpen: boolean;
  mode: DialogMode;
  nodeType: NodeType;
  project: Project;
  node?: Node | null;
  initialPosition?: { x: number; y: number };
  initialPhaseId?: string | null;
  currentPredecessorId?: string | null;
  currentPredecessorType?: DependencyType | null;
  currentSuccessorId?: string | null;
  currentSuccessorType?: DependencyType | null;
  onClose: () => void;
  onSubmit: (payload: {
    node: Node;
    selectedPhaseId: string | null;
    predecessor: { nodeId: string; type: DependencyType } | null;
    successor: { nodeId: string; type: DependencyType } | null;
  }) => void;
}

interface TaskFormState {
  title: string;
  phaseId: string | null;
  predecessorId: string | null;
  predecessorType: DependencyType;
  successorId: string | null;
  successorType: DependencyType;
  startDate: string;
  duration: number;
  dueDate: string;
  status: TaskStatus;
  progress: number;
  priority: Priority;
  discipline: string;
  notes: string;
}

interface PersonFormState {
  title: string;
  role: string;
  initials: string;
}

const DEFAULT_DURATION_DAYS = 7;

const DEPENDENCY_TYPE_OPTIONS: Array<{ value: DependencyType; label: string }> = [
  { value: 'finish_to_start', label: 'Finish to Start (FS)' },
  { value: 'start_to_start', label: 'Start to Start (SS)' },
  { value: 'finish_to_finish', label: 'Finish to Finish (FF)' },
];

const toDateInputValue = (value?: Date | null) => {
  if (!value) return '';
  return format(value, 'yyyy-MM-dd');
};

const parseInputDate = (value: string): Date | undefined => {
  if (!value) return undefined;
  const parsed = new Date(value + 'T00:00:00');
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const clampNumber = (value: number, min: number, max: number) => {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
};

const buildDefaultTaskState = (
  project: Project,
  nodeType: NodeType,
  node?: Node | null,
  initialPhaseId?: string | null,
  predecessorId?: string | null,
  predecessorType?: DependencyType | null,
  successorId?: string | null,
  successorType?: DependencyType | null
): TaskFormState => {
  if (node) {
    const start = node.data.startDate ? toDateInputValue(node.data.startDate) : '';
    const due = node.data.dueDate ? toDateInputValue(node.data.dueDate) : '';
    const duration =
      node.data.durationDays ??
      (node.data.startDate && node.data.dueDate
        ? Math.max(0, differenceInCalendarDays(node.data.dueDate, node.data.startDate))
        : DEFAULT_DURATION_DAYS);

  const existingPhase = project.phases.find(phase => phase.nodeIds.includes(node.id));

    return {
      title: node.title,
      phaseId: existingPhase?.id ?? null,
      predecessorId: predecessorId ?? null,
      predecessorType: predecessorType ?? 'finish_to_start',
      successorId: successorId ?? null,
      successorType: successorType ?? 'finish_to_start',
      startDate: start,
      duration,
      dueDate: due,
      status: node.data.status ?? 'not_started',
      progress: clampNumber(node.data.percentComplete ?? 0, 0, 100),
      priority: node.data.priority ?? 'med',
      discipline: node.data.discipline ?? '',
      notes: node.data.notes ?? '',
    };
  }

  const today = new Date();
  const due = addDays(today, DEFAULT_DURATION_DAYS);

  return {
    title: '',
    phaseId: initialPhaseId ?? null,
    predecessorId: predecessorId ?? null,
    predecessorType: predecessorType ?? 'finish_to_start',
    successorId: successorId ?? null,
    successorType: successorType ?? 'finish_to_start',
    startDate: toDateInputValue(today),
    duration: DEFAULT_DURATION_DAYS,
    dueDate: toDateInputValue(due),
    status: nodeType === 'milestone' ? 'not_started' : 'not_started',
    progress: 0,
    priority: 'med',
    discipline: '',
    notes: '',
  };
};

const buildDefaultPersonState = (node?: Node | null): PersonFormState => {
  if (node) {
    return {
      title: node.title,
      role: node.data.notes ?? '',
      initials: node.data.initials ?? deriveInitials(node.title),
    };
  }

  return {
    title: '',
    role: '',
    initials: '',
  };
};

const deriveInitials = (title: string) => {
  if (!title) return '';
  const parts = title.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const calculateDatesFromPredecessor = (
  predecessor: { startDate?: Date; dueDate?: Date },
  dependencyType: DependencyType,
  duration: number
): { startDate: Date; dueDate: Date } | null => {
  if (!predecessor.startDate || !predecessor.dueDate) {
    return null;
  }

  const predecessorStart = predecessor.startDate;
  const predecessorEnd = predecessor.dueDate;
  
  let newStartDate: Date;
  let newDueDate: Date;
  
  switch (dependencyType) {
    case 'finish_to_start':
      // Current task starts when predecessor finishes
      newStartDate = addDays(predecessorEnd, 1);
      newDueDate = addDays(newStartDate, duration - 1);
      break;
      
    case 'start_to_start':
      // Current task starts when predecessor starts
      newStartDate = predecessorStart;
      newDueDate = addDays(newStartDate, duration - 1);
      break;
      
    case 'finish_to_finish':
      // Current task finishes when predecessor finishes
      newDueDate = predecessorEnd;
      newStartDate = addDays(newDueDate, -(duration - 1));
      break;
      
    default:
      return null;
  }
  
  return { startDate: newStartDate, dueDate: newDueDate };
};

const calculateDatesFromSuccessor = (
  successor: { startDate?: Date; dueDate?: Date },
  dependencyType: DependencyType,
  duration: number
): { startDate: Date; dueDate: Date } | null => {
  if (!successor.startDate || !successor.dueDate) {
    return null;
  }

  const successorStart = successor.startDate;
  const successorEnd = successor.dueDate;
  
  let newStartDate: Date;
  let newDueDate: Date;
  
  switch (dependencyType) {
    case 'finish_to_start':
      // Current task finishes before successor starts
      newDueDate = addDays(successorStart, -1);
      newStartDate = addDays(newDueDate, -(duration - 1));
      break;
      
    case 'start_to_start':
      // Current task starts when successor starts
      newStartDate = successorStart;
      newDueDate = addDays(newStartDate, duration - 1);
      break;
      
    case 'finish_to_finish':
      // Current task finishes when successor finishes
      newDueDate = successorEnd;
      newStartDate = addDays(newDueDate, -(duration - 1));
      break;
      
    default:
      return null;
  }
  
  return { startDate: newStartDate, dueDate: newDueDate };
};

const NodeDialog: React.FC<NodeDialogProps> = ({
  isOpen,
  mode,
  nodeType,
  project,
  node,
  initialPosition,
  initialPhaseId,
  currentPredecessorId,
  currentPredecessorType,
  currentSuccessorId,
  currentSuccessorType,
  onClose,
  onSubmit,
}) => {
  const [taskState, setTaskState] = useState<TaskFormState>(() =>
    buildDefaultTaskState(
      project,
      nodeType,
      node,
      initialPhaseId,
      currentPredecessorId,
      currentPredecessorType,
      currentSuccessorId,
      currentSuccessorType
    )
  );
  const [personState, setPersonState] = useState<PersonFormState>(() =>
    buildDefaultPersonState(node)
  );

  useEffect(() => {
    if (isOpen) {
      setTaskState(
        buildDefaultTaskState(
          project,
          nodeType,
          node,
          initialPhaseId,
          currentPredecessorId,
          currentPredecessorType,
          currentSuccessorId,
          currentSuccessorType
        )
      );
      setPersonState(buildDefaultPersonState(node));
    }
  }, [
    isOpen,
    project,
    nodeType,
    node,
    initialPhaseId,
    currentPredecessorId,
    currentPredecessorType,
    currentSuccessorId,
    currentSuccessorType,
  ]);

  const dialogTitle = useMemo(() => {
    const verb = mode === 'create' ? 'Create' : 'Edit';
    const labelMap: Record<NodeType, string> = {
      task: 'task',
      milestone: 'milestone',
      deliverable: 'deliverable',
      person: 'person',
    };
    return `${verb} ${labelMap[nodeType]}`;
  }, [mode, nodeType]);

  const dependencyCandidates = useMemo(() => {
    return project.nodes
      .filter(candidate => {
        if (node && candidate.id === node.id) return false;
        return candidate.type !== 'person';
      })
      .map(candidate => ({
        id: candidate.id,
        title: candidate.title,
        type: candidate.type,
        startDate: candidate.data.startDate,
        dueDate: candidate.data.dueDate,
      }));
  }, [project.nodes, node]);
  const availablePredecessors = dependencyCandidates;
  const availableSuccessors = dependencyCandidates;

  if (!isOpen) {
    return null;
  }

  const handleStartDateChange = (value: string) => {
    setTaskState(prev => {
      const start = parseInputDate(value);
      if (start) {
        const newDue = addDays(start, prev.duration);
        return {
          ...prev,
          startDate: value,
          dueDate: toDateInputValue(newDue),
        };
      }
      return { ...prev, startDate: value };
    });
  };

  const handleDurationChange = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    const duration = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
    setTaskState(prev => {
      const start = parseInputDate(prev.startDate);
      if (start) {
        const newDue = addDays(start, duration);
        return {
          ...prev,
          duration,
          dueDate: toDateInputValue(newDue),
        };
      }
      return { ...prev, duration };
    });
  };

  const handleDueDateChange = (value: string) => {
    setTaskState(prev => {
      const start = parseInputDate(prev.startDate);
      const due = parseInputDate(value);
      if (start && due) {
        if (due.getTime() < start.getTime()) {
          return {
            ...prev,
            dueDate: toDateInputValue(start),
            duration: 0,
          };
        }
        const duration = Math.max(0, differenceInCalendarDays(due, start));
        return { ...prev, dueDate: value, duration };
      }
      return { ...prev, dueDate: value };
    });
  };

  const handlePredecessorChange = (value: string) => {
    setTaskState(prev => {
      const newState = {
        ...prev,
        predecessorId: value === '' ? null : value,
      };
      
      // Auto-adjust dates based on predecessor
      if (value && prev.predecessorType) {
        const predecessor = availablePredecessors.find(p => p.id === value);
        if (predecessor && predecessor.dueDate) {
          const adjustedDates = calculateDatesFromPredecessor(
            predecessor,
            prev.predecessorType,
            prev.duration
          );
          if (adjustedDates) {
            newState.startDate = toDateInputValue(adjustedDates.startDate);
            newState.dueDate = toDateInputValue(adjustedDates.dueDate);
          }
        }
      }
      
      return newState;
    });
  };

  const handlePredecessorTypeChange = (value: DependencyType) => {
    setTaskState(prev => {
      const newState = {
        ...prev,
        predecessorType: value,
      };
      
      // Auto-adjust dates based on predecessor type change
      if (prev.predecessorId) {
        const predecessor = availablePredecessors.find(p => p.id === prev.predecessorId);
        if (predecessor && predecessor.dueDate) {
          const adjustedDates = calculateDatesFromPredecessor(
            predecessor,
            value,
            prev.duration
          );
          if (adjustedDates) {
            newState.startDate = toDateInputValue(adjustedDates.startDate);
            newState.dueDate = toDateInputValue(adjustedDates.dueDate);
          }
        }
      }
      
      return newState;
    });
  };

  const handleSuccessorChange = (value: string) => {
    setTaskState(prev => {
      const newState = {
        ...prev,
        successorId: value === '' ? null : value,
      };
      
      // Auto-adjust dates based on successor
      if (value && prev.successorType) {
        const successor = availableSuccessors.find(s => s.id === value);
        if (successor && successor.startDate) {
          const adjustedDates = calculateDatesFromSuccessor(
            successor,
            prev.successorType,
            prev.duration
          );
          if (adjustedDates) {
            newState.startDate = toDateInputValue(adjustedDates.startDate);
            newState.dueDate = toDateInputValue(adjustedDates.dueDate);
          }
        }
      }
      
      return newState;
    });
  };

  const handleSuccessorTypeChange = (value: DependencyType) => {
    setTaskState(prev => {
      const newState = {
        ...prev,
        successorType: value,
      };
      
      // Auto-adjust dates based on successor type change
      if (prev.successorId) {
        const successor = availableSuccessors.find(s => s.id === prev.successorId);
        if (successor && successor.startDate) {
          const adjustedDates = calculateDatesFromSuccessor(
            successor,
            value,
            prev.duration
          );
          if (adjustedDates) {
            newState.startDate = toDateInputValue(adjustedDates.startDate);
            newState.dueDate = toDateInputValue(adjustedDates.dueDate);
          }
        }
      }
      
      return newState;
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (nodeType === 'person') {
      if (!personState.title.trim()) {
        return;
      }

      const id = node?.id ?? `node-${Date.now()}`;
      const initials = personState.initials.trim() || deriveInitials(personState.title);

      const updatedNode: Node = {
        id,
        type: 'person',
        title: personState.title.trim(),
        position: node?.position ?? initialPosition ?? { x: 100, y: 100 },
        width: node?.width ?? 120,
        height: node?.height ?? 120,
        data: {
          ...node?.data,
          id,
          title: personState.title.trim(),
          type: 'person',
          tags: node?.data.tags ?? [],
          initials,
          notes: personState.role.trim(),
        },
      };

      onSubmit({
        node: updatedNode,
        selectedPhaseId: null,
        predecessor: null,
        successor: null,
      });
      return;
    }

    if (!taskState.title.trim()) {
      return;
    }

    const id = node?.id ?? `node-${Date.now()}`;
    const startDate = parseInputDate(taskState.startDate);
    const dueDate = parseInputDate(taskState.dueDate);

    const nodeData = {
      ...node?.data,
      id,
      title: taskState.title.trim(),
      type: nodeType,
      startDate,
      dueDate,
      durationDays: taskState.duration,
      status: taskState.status,
      percentComplete: clampNumber(taskState.progress, 0, 100),
      priority: taskState.priority,
      discipline: taskState.discipline || undefined,
      notes: taskState.notes || undefined,
      tags: node?.data.tags ?? [],
    };

    const updatedNode: Node = {
      id,
      type: nodeType,
      title: taskState.title.trim(),
      position: node?.position ?? initialPosition ?? { x: 150, y: 150 },
      width: node?.width ?? (nodeType === 'milestone' ? 80 : 140),
      height: node?.height ?? (nodeType === 'milestone' ? 80 : 80),
      data: nodeData,
    };

    onSubmit({
      node: updatedNode,
      selectedPhaseId: taskState.phaseId,
      predecessor: taskState.predecessorId
        ? { nodeId: taskState.predecessorId, type: taskState.predecessorType }
        : null,
      successor: taskState.successorId
        ? { nodeId: taskState.successorId, type: taskState.successorType }
        : null,
    });
  };

  const renderTaskFields = () => (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
        <input
          type="text"
          value={taskState.title}
          onChange={(e) => setTaskState(prev => ({ ...prev, title: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={`Enter ${nodeType} name`}
          required
        />
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Predecessor (Optional)
          </label>
          <select
            value={taskState.predecessorId ?? ''}
            onChange={(e) => handlePredecessorChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No predecessor</option>
            {availablePredecessors.map(predecessor => (
              <option key={predecessor.id} value={predecessor.id}>
                {predecessor.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Predecessor Link Type
          </label>
          <select
            value={taskState.predecessorType}
            onChange={(e) => handlePredecessorTypeChange(e.target.value as DependencyType)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
            disabled={!taskState.predecessorId}
          >
            {DEPENDENCY_TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Successor (Optional)
          </label>
          <select
            value={taskState.successorId ?? ''}
            onChange={(e) => handleSuccessorChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No successor</option>
            {availableSuccessors.map(successor => (
              <option key={successor.id} value={successor.id}>
                {successor.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Successor Link Type
          </label>
          <select
            value={taskState.successorType}
            onChange={(e) => handleSuccessorTypeChange(e.target.value as DependencyType)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
            disabled={!taskState.successorId}
          >
            {DEPENDENCY_TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
          <input
            type="date"
            value={taskState.startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Duration (days)</label>
          <input
            type="number"
            min={0}
            value={taskState.duration}
            onChange={(e) => handleDurationChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
        <input
          type="date"
          value={taskState.dueDate}
          onChange={(e) => handleDueDateChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {taskState.startDate && taskState.dueDate && (
          <p className="text-xs text-slate-500 mt-1">
            Duration: {taskState.duration} day{taskState.duration !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {nodeType !== 'milestone' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={taskState.status}
              onChange={(e) =>
                setTaskState(prev => ({ ...prev, status: e.target.value as TaskStatus }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Progress (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={taskState.progress}
              onChange={(e) =>
                setTaskState(prev => ({
                  ...prev,
                  progress: clampNumber(Number.parseInt(e.target.value, 10) || 0, 0, 100),
                }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
          <select
            value={taskState.priority}
            onChange={(e) =>
              setTaskState(prev => ({ ...prev, priority: e.target.value as Priority }))
            }
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="med">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Discipline</label>
          <input
            type="text"
            value={taskState.discipline}
            onChange={(e) => setTaskState(prev => ({ ...prev, discipline: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Civil"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
        <textarea
          value={taskState.notes}
          onChange={(e) => setTaskState(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Additional notes..."
        />
      </div>
    </>
  );

  const renderPersonFields = () => (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
        <input
          type="text"
          value={personState.title}
          onChange={(e) => setPersonState(prev => ({ ...prev, title: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter person name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
        <input
          type="text"
          value={personState.role}
          onChange={(e) => setPersonState(prev => ({ ...prev, role: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Project Manager"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Initials</label>
        <input
          type="text"
          value={personState.initials}
          onChange={(e) =>
            setPersonState(prev => ({
              ...prev,
              initials: e.target.value.toUpperCase().slice(0, 3),
            }))
          }
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. PM"
          maxLength={3}
        />
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 capitalize">{dialogTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {nodeType === 'person' ? renderPersonFields() : renderTaskFields()}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {mode === 'create' ? 'Create' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NodeDialog;
