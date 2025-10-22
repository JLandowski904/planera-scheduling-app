import React, { useState, useMemo } from 'react';
import { Project, NodeType, TaskStatus, Priority } from '../types';
import {
  Search,
  Filter,
  Users,
  Calendar,
  Tag,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  project: Project;
  onProjectChange: (project: Project) => void;
  selectedNodes: string[];
  selectedEdges: string[];
  onNodeSelect: (nodeId: string, multiSelect?: boolean) => void;
  onEdgeSelect: (edgeId: string, multiSelect?: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  project,
  onProjectChange,
  selectedNodes,
  selectedEdges,
  onNodeSelect,
  onEdgeSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    filters: true,
    nodes: true,
    edges: true,
  });

  const { filters } = project;

  // Filter nodes based on search and filters
  const filteredNodes = useMemo(() => {
    let filtered = project.nodes;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(node =>
        node.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.data.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Type filter
    if (filters.types.length > 0) {
      filtered = filtered.filter(node => filters.types.includes(node.type));
    }

    // Status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(node => 
        node.data.status && filters.statuses.includes(node.data.status)
      );
    }

    // Assignee filter
    if (filters.assignees.length > 0) {
      filtered = filtered.filter(node =>
        node.data.assignees?.some(assignee => filters.assignees.includes(assignee))
      );
    }

    // Discipline filter
    if (filters.disciplines.length > 0) {
      filtered = filtered.filter(node =>
        node.data.discipline && filters.disciplines.includes(node.data.discipline)
      );
    }

    // Tag filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(node =>
        node.data.tags?.some(tag => filters.tags.includes(tag))
      );
    }

    // Blocked only filter
    if (filters.blockedOnly) {
      filtered = filtered.filter(node => node.data.status === 'blocked');
    }

    return filtered;
  }, [project.nodes, searchTerm, filters]);

  // Group nodes by type
  const nodesByType = useMemo(() => {
    const groups: { [key in NodeType]: typeof project.nodes } = {
      milestone: [],
      deliverable: [],
      task: [],
      person: [],
    };

    filteredNodes.forEach(node => {
      groups[node.type].push(node);
    });

    return groups;
  }, [filteredNodes]);

  // Get unique values for filter options
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    project.nodes.forEach(node => {
      node.data.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [project.nodes]);

  const allDisciplines = useMemo(() => {
    const disciplines = new Set<string>();
    project.nodes.forEach(node => {
      if (node.data.discipline) {
        disciplines.add(node.data.discipline);
      }
    });
    return Array.from(disciplines).sort();
  }, [project.nodes]);

  const allAssignees = useMemo(() => {
    const assignees = new Set<string>();
    project.nodes.forEach(node => {
      node.data.assignees?.forEach(assignee => assignees.add(assignee));
    });
    return Array.from(assignees).sort();
  }, [project.nodes]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    onProjectChange({
      ...project,
      filters: {
        ...filters,
        ...newFilters,
      },
    });
  };

  const toggleFilter = (type: keyof typeof filters, value: string) => {
    const currentValues = filters[type] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    updateFilters({ [type]: newValues });
  };

  const clearAllFilters = () => {
    updateFilters({
      types: [],
      statuses: [],
      assignees: [],
      disciplines: [],
      tags: [],
      blockedOnly: false,
    });
  };

  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case 'milestone':
        return <Calendar className="w-4 h-4" />;
      case 'deliverable':
        return <CheckCircle className="w-4 h-4" />;
      case 'task':
        return <Clock className="w-4 h-4" />;
      case 'person':
        return <Users className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status?: TaskStatus) => {
    if (!status) return null;
    
    switch (status) {
      case 'blocked':
        return <AlertTriangle className="w-3 h-3 text-red-500" />;
      case 'done':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const renderFilterSection = () => (
    <div className="sidebar-section">
      <div className="flex items-center justify-between">
        <h3 className="sidebar-title">Filters</h3>
        <button
          onClick={() => toggleSection('filters')}
          className="p-1 hover:bg-gray-100 rounded"
        >
          {expandedSections.filters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
      
      {expandedSections.filters && (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Node types */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Types</label>
            <div className="flex flex-wrap gap-1">
              {(['milestone', 'deliverable', 'task', 'person'] as NodeType[]).map(type => (
                <button
                  key={type}
                  onClick={() => toggleFilter('types', type)}
                  className={`filter-chip ${filters.types.includes(type) ? 'active' : ''}`}
                >
                  {getNodeIcon(type)}
                  <span className="ml-1 capitalize">{type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Statuses */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Status</label>
            <div className="flex flex-wrap gap-1">
              {(['not_started', 'in_progress', 'blocked', 'done'] as TaskStatus[]).map(status => (
                <button
                  key={status}
                  onClick={() => toggleFilter('statuses', status)}
                  className={`filter-chip ${filters.statuses.includes(status) ? 'active' : ''}`}
                >
                  {getStatusIcon(status)}
                  <span className="ml-1 capitalize">{status.replace('_', ' ')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Disciplines */}
          {allDisciplines.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Disciplines</label>
              <div className="flex flex-wrap gap-1">
                {allDisciplines.map(discipline => (
                  <button
                    key={discipline}
                    onClick={() => toggleFilter('disciplines', discipline)}
                    className={`filter-chip ${filters.disciplines.includes(discipline) ? 'active' : ''}`}
                  >
                    {discipline}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {allTags.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Tags</label>
              <div className="flex flex-wrap gap-1">
                {allTags.slice(0, 10).map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleFilter('tags', tag)}
                    className={`filter-chip ${filters.tags.includes(tag) ? 'active' : ''}`}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </button>
                ))}
                {allTags.length > 10 && (
                  <span className="text-xs text-gray-500">+{allTags.length - 10} more</span>
                )}
              </div>
            </div>
          )}

          {/* Blocked only */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="blocked-only"
              checked={filters.blockedOnly}
              onChange={(e) => updateFilters({ blockedOnly: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="blocked-only" className="text-sm text-gray-700">
              Blocked only
            </label>
          </div>

          {/* Clear filters */}
          {(filters.types.length > 0 || filters.statuses.length > 0 || filters.assignees.length > 0 || 
            filters.disciplines.length > 0 || filters.tags.length > 0 || filters.blockedOnly) && (
            <button
              onClick={clearAllFilters}
              className="w-full text-sm text-gray-500 hover:text-gray-700 py-1"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );

  const renderNodeGroup = (type: NodeType, nodes: typeof project.nodes) => (
    <div key={type} className="mb-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700 capitalize flex items-center gap-1">
          {getNodeIcon(type)}
          {type}s ({nodes.length})
        </h4>
      </div>
      
      <div className="space-y-1">
        {nodes.map(node => (
          <div
            key={node.id}
            onClick={() => onNodeSelect(node.id)}
            className={`p-2 rounded cursor-pointer text-sm border ${
              selectedNodes.includes(node.id)
                ? 'bg-blue-50 border-blue-300 text-blue-900'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="truncate">{node.title}</span>
              {getStatusIcon(node.data.status)}
            </div>
            {node.data.discipline && (
              <div className="text-xs text-gray-500 mt-1">{node.data.discipline}</div>
            )}
            {node.data.tags && node.data.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {node.data.tags.slice(0, 2).map((tag, index) => (
                  <span key={index} className="text-xs bg-gray-100 px-1 rounded">
                    {tag}
                  </span>
                ))}
                {node.data.tags.length > 2 && (
                  <span className="text-xs text-gray-500">+{node.data.tags.length - 2}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderNodesSection = () => (
    <div className="sidebar-section">
      <div className="flex items-center justify-between">
        <h3 className="sidebar-title">Nodes ({filteredNodes.length})</h3>
        <button
          onClick={() => toggleSection('nodes')}
          className="p-1 hover:bg-gray-100 rounded"
        >
          {expandedSections.nodes ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
      
      {expandedSections.nodes && (
        <div className="max-h-96 overflow-y-auto">
          {Object.entries(nodesByType).map(([type, nodes]) => 
            nodes.length > 0 ? renderNodeGroup(type as NodeType, nodes) : null
          )}
        </div>
      )}
    </div>
  );

  const renderEdgesSection = () => (
    <div className="sidebar-section">
      <div className="flex items-center justify-between">
        <h3 className="sidebar-title">Dependencies ({project.edges.length})</h3>
        <button
          onClick={() => toggleSection('edges')}
          className="p-1 hover:bg-gray-100 rounded"
        >
          {expandedSections.edges ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
      
      {expandedSections.edges && (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {project.edges.map(edge => {
            const sourceNode = project.nodes.find(n => n.id === edge.source);
            const targetNode = project.nodes.find(n => n.id === edge.target);
            
            if (!sourceNode || !targetNode) return null;
            
            return (
              <div
                key={edge.id}
                onClick={() => onEdgeSelect(edge.id)}
                className={`p-2 rounded cursor-pointer text-sm border ${
                  selectedEdges.includes(edge.id)
                    ? 'bg-blue-50 border-blue-300 text-blue-900'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs">
                    {sourceNode.title} → {targetNode.title}
                  </span>
                  {edge.isBlocked && <AlertTriangle className="w-3 h-3 text-red-500" />}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {edge.type.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-80 bg-white border-l border-slate-200 p-4 overflow-y-auto">
      {renderFilterSection()}
      {renderNodesSection()}
      {renderEdgesSection()}
    </div>
  );
};

export default Sidebar;


