import React, { useMemo, useState, useCallback } from 'react';
import { Project, TaskStatus, Priority } from '../types';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  User, 
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Search,
} from 'lucide-react';

interface TableViewProps {
  project: Project;
  onProjectChange: (project: Project) => void;
  selectedNodes: string[];
  onNodeSelect: (nodeId: string, multiSelect?: boolean) => void;
}

type SortField = 'title' | 'type' | 'phase' | 'status' | 'priority' | 'startDate' | 'dueDate' | 'discipline' | 'assignees';
type SortDirection = 'asc' | 'desc';

const TableView: React.FC<TableViewProps> = ({
  project,
  onProjectChange,
  selectedNodes,
  onNodeSelect,
}) => {
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPhase, setFilterPhase] = useState<string>('all');

  const nodePhaseTitles = useMemo(() => {
    const map = new Map<string, string[]>();

    project.nodes.forEach(node => {
      map.set(node.id, []);
    });

    project.phases.forEach(phase => {
      phase.nodeIds.forEach(nodeId => {
        const entry = map.get(nodeId);
        if (entry) {
          entry.push(phase.title);
        } else {
          map.set(nodeId, [phase.title]);
        }
      });
    });

    return map;
  }, [project.nodes, project.phases]);

  // Filter and sort nodes
  const filteredAndSortedNodes = useMemo(() => {
    let filtered = project.nodes;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(node =>
        node.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.data.discipline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.data.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(node => node.data.status === filterStatus);
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(node => node.type === filterType);
    }

    // Phase filter
    if (filterPhase !== 'all') {
      filtered = filtered.filter(node => {
        const phase = project.phases.find(p => p.id === filterPhase);
        return phase && phase.nodeIds.includes(node.id);
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'phase': {
          const aPhases = (nodePhaseTitles.get(a.id) ?? []).slice().sort();
          const bPhases = (nodePhaseTitles.get(b.id) ?? []).slice().sort();
          aValue = aPhases.join(' | ');
          bValue = bPhases.join(' | ');
          break;
        }
        case 'status':
          aValue = a.data.status || 'not_started';
          bValue = b.data.status || 'not_started';
          break;
        case 'priority':
          aValue = a.data.priority || 'med';
          bValue = b.data.priority || 'med';
          break;
        case 'startDate':
          aValue = a.data.startDate?.getTime() || 0;
          bValue = b.data.startDate?.getTime() || 0;
          break;
        case 'dueDate':
          aValue = a.data.dueDate?.getTime() || 0;
          bValue = b.data.dueDate?.getTime() || 0;
          break;
        case 'discipline':
          aValue = a.data.discipline || '';
          bValue = b.data.discipline || '';
          break;
        case 'assignees':
          aValue = a.data.assignees?.length || 0;
          bValue = b.data.assignees?.length || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [project.nodes, searchTerm, filterStatus, filterType, sortField, sortDirection, filterPhase, project.phases, nodePhaseTitles]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'milestone':
        return <Calendar className="w-4 h-4" />;
      case 'deliverable':
        return <CheckCircle className="w-4 h-4" />;
      case 'task':
        return <Clock className="w-4 h-4" />;
      case 'person':
        return <User className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status?: TaskStatus) => {
    if (!status) return null;
    
    const statusClasses = {
      not_started: 'status-not-started',
      in_progress: 'status-in-progress',
      blocked: 'status-blocked',
      done: 'status-done',
    };

    return (
      <span className={`status-badge ${statusClasses[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority?: Priority) => {
    if (!priority) return null;
    
    const priorityClasses = {
      low: 'priority-low',
      med: 'priority-med',
      high: 'priority-high',
    };

    return (
      <span className={`priority-badge ${priorityClasses[priority]}`}>
        {priority}
      </span>
    );
  };

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return format(date, 'MMM d, yyyy');
  };

  const getUniqueValues = (field: 'status' | 'type') => {
    const values = new Set<string>();
    project.nodes.forEach(node => {
      if (field === 'status' && node.data.status) {
        values.add(node.data.status);
      } else if (field === 'type') {
        values.add(node.type);
      }
    });
    return Array.from(values);
  };

  return (
    <div className="table-view h-full min-h-0 flex flex-col bg-slate-50">
      {/* Table header with filters */}
      <div className="border-b border-slate-200 p-6 bg-white no-print">
        <div className="flex items-center gap-4 mb-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            {getUniqueValues('status').map(status => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            {getUniqueValues('type').map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {/* Phase filter */}
          <select
            value={filterPhase}
            onChange={(e) => setFilterPhase(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Phases</option>
            {project.phases.map(phase => (
              <option key={phase.id} value={phase.id}>
                {phase.title}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-600">
          Showing {filteredAndSortedNodes.length} of {project.nodes.length} nodes
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="table-header w-8">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  onChange={(e) => {
                    // Handle select all
                  }}
                />
              </th>
              <th 
                className="table-header cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-1">
                  Node
                  {getSortIcon('title')}
                </div>
              </th>
              <th 
                className="table-header cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center gap-1">
                  Type
                  {getSortIcon('type')}
                </div>
              </th>
              <th 
                className="table-header cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('phase')}
              >
                <div className="flex items-center gap-1">
                  Phase
                  {getSortIcon('phase')}
                </div>
              </th>
              <th 
                className="table-header cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  {getSortIcon('status')}
                </div>
              </th>
              <th 
                className="table-header cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center gap-1">
                  Priority
                  {getSortIcon('priority')}
                </div>
              </th>
              <th 
                className="table-header cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('startDate')}
              >
                <div className="flex items-center gap-1">
                  Start Date
                  {getSortIcon('startDate')}
                </div>
              </th>
              <th 
                className="table-header cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('dueDate')}
              >
                <div className="flex items-center gap-1">
                  Due Date
                  {getSortIcon('dueDate')}
                </div>
              </th>
              <th 
                className="table-header cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('discipline')}
              >
                <div className="flex items-center gap-1">
                  Discipline
                  {getSortIcon('discipline')}
                </div>
              </th>
              <th 
                className="table-header cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('assignees')}
              >
                <div className="flex items-center gap-1">
                  Assignees
                  {getSortIcon('assignees')}
                </div>
              </th>
              <th className="table-header">Progress</th>
              <th className="table-header">Tags</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedNodes.map((node) => (
              <tr
                key={node.id}
                className={`timeline-row cursor-pointer ${
                  selectedNodes.includes(node.id) ? 'bg-blue-50' : ''
                } ${
                  node.data.status === 'done' ? 'opacity-60 bg-gray-50' : ''
                }`}
                onClick={() => onNodeSelect(node.id)}
              >
                <td className="table-cell">
                  <input
                    type="checkbox"
                    checked={selectedNodes.includes(node.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      onNodeSelect(node.id, true);
                    }}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    {getNodeIcon(node.type)}
                    <span className="font-medium">{node.title}</span>
                    {node.data.status === 'blocked' && (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </td>
                <td className="table-cell">
                  <span className="capitalize">{node.type}</span>
                </td>
                <td className="table-cell">
                  {(() => {
                    const phases = nodePhaseTitles.get(node.id) ?? [];
                    if (phases.length === 0) return '-';
                    if (phases.length === 1) return phases[0];
                    return `${phases[0]} +${phases.length - 1}`;
                  })()}
                </td>
                <td className="table-cell">
                  {getStatusBadge(node.data.status)}
                </td>
                <td className="table-cell">
                  {getPriorityBadge(node.data.priority)}
                </td>
                <td className="table-cell">
                  {formatDate(node.data.startDate)}
                </td>
                <td className="table-cell">
                  {formatDate(node.data.dueDate)}
                </td>
                <td className="table-cell">
                  {node.data.discipline || '-'}
                </td>
                <td className="table-cell">
                  {node.data.assignees?.length || 0}
                </td>
                <td className="table-cell">
                  {node.data.percentComplete !== undefined ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${node.data.percentComplete}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {node.data.percentComplete}%
                      </span>
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="table-cell">
                  {node.data.tags && node.data.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {node.data.tags.slice(0, 2).map((tag, index) => (
                        <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                      {node.data.tags.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{node.data.tags.length - 2}
                        </span>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableView;
