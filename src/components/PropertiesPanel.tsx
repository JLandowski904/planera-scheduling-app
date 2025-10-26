import React, { useState, useCallback, useMemo } from 'react';
import { Project, Node, Edge, NodeType, TaskStatus, Priority, DependencyType, Phase } from '../types';
import { format } from 'date-fns';
import { X, Save, FileText, AlertTriangle } from 'lucide-react';

interface PropertiesPanelProps {
  project: Project;
  onProjectChange: (project: Project) => void;
  selectedNodes: string[];
  selectedEdges: string[];
  editedPhase?: Phase | null;
  onPhaseUpdate?: (phase: Phase) => void;
  onClose: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  project,
  onProjectChange,
  selectedNodes,
  selectedEdges,
  editedPhase,
  onPhaseUpdate,
  onClose,
}) => {
  const [editedNode, setEditedNode] = useState<Node | null>(null);
  const [editedEdge, setEditedEdge] = useState<Edge | null>(null);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(editedPhase || null);

  // Get the primary selected item
  const primarySelected = useMemo(() => {
    if (selectedNodes.length > 0) {
      return project.nodes.find(n => n.id === selectedNodes[0]);
    }
    if (selectedEdges.length > 0) {
      return project.edges.find(e => e.id === selectedEdges[0]);
    }
    return null;
  }, [project.nodes, project.edges, selectedNodes, selectedEdges]);

  const handleNodeUpdate = useCallback((updatedNode: Node) => {
    onProjectChange({
      ...project,
      nodes: project.nodes.map(n => n.id === updatedNode.id ? updatedNode : n),
      updatedAt: new Date(),
    });
    setEditedNode(null);
  }, [project, onProjectChange]);

  const handleEdgeUpdate = useCallback((updatedEdge: Edge) => {
    onProjectChange({
      ...project,
      edges: project.edges.map(e => e.id === updatedEdge.id ? updatedEdge : e),
      updatedAt: new Date(),
    });
    setEditedEdge(null);
  }, [project, onProjectChange]);

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };

  const parseDate = (dateString: string) => {
    if (!dateString) return undefined;
    return new Date(dateString);
  };

  const renderNodeProperties = (node: Node) => {
    if (editedNode && editedNode.id === node.id) {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={editedNode.title}
              onChange={(e) => setEditedNode({ ...editedNode, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={editedNode.type}
              onChange={(e) => setEditedNode({ 
                ...editedNode, 
                type: e.target.value as NodeType,
                data: { ...editedNode.data, type: e.target.value as NodeType }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="milestone">Milestone</option>
              <option value="deliverable">Deliverable</option>
              <option value="task">Task</option>
              <option value="person">Person</option>
            </select>
          </div>

          {editedNode.type === 'person' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initials
              </label>
              <input
                type="text"
                value={editedNode.data.initials || ''}
                onChange={(e) => setEditedNode({ 
                  ...editedNode, 
                  data: { ...editedNode.data, initials: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={3}
              />
            </div>
          )}

          {(editedNode.type === 'task' || editedNode.type === 'milestone' || editedNode.type === 'deliverable') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formatDate(editedNode.data.startDate)}
                  onChange={(e) => setEditedNode({ 
                    ...editedNode, 
                    data: { ...editedNode.data, startDate: parseDate(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formatDate(editedNode.data.dueDate)}
                  onChange={(e) => setEditedNode({ 
                    ...editedNode, 
                    data: { ...editedNode.data, dueDate: parseDate(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {editedNode.type === 'task' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={editedNode.data.status || 'not_started'}
                  onChange={(e) => setEditedNode({ 
                    ...editedNode, 
                    data: { ...editedNode.data, status: e.target.value as TaskStatus }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={editedNode.data.priority || 'med'}
                  onChange={(e) => setEditedNode({ 
                    ...editedNode, 
                    data: { ...editedNode.data, priority: e.target.value as Priority }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="med">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Progress ({editedNode.data.percentComplete || 0}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editedNode.data.percentComplete || 0}
                  onChange={(e) => setEditedNode({ 
                    ...editedNode, 
                    data: { ...editedNode.data, percentComplete: parseInt(e.target.value) }
                  })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discipline
                </label>
                <input
                  type="text"
                  value={editedNode.data.discipline || ''}
                  onChange={(e) => setEditedNode({ 
                    ...editedNode, 
                    data: { ...editedNode.data, discipline: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Civil, Architecture, MEP"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              value={editedNode.data.tags?.join(', ') || ''}
              onChange={(e) => setEditedNode({ 
                ...editedNode, 
                data: { 
                  ...editedNode.data, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter tags separated by commas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={editedNode.data.notes || ''}
              onChange={(e) => setEditedNode({ 
                ...editedNode, 
                data: { ...editedNode.data, notes: e.target.value }
              })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add notes..."
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleNodeUpdate(editedNode)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={() => setEditedNode(null)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{node.title}</h3>
          <button
            onClick={() => setEditedNode(node)}
            className="text-blue-500 hover:text-blue-700 text-sm"
          >
            Edit
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-700">Type:</span>
            <span className="ml-2 text-sm text-gray-900 capitalize">{node.type}</span>
          </div>

          {node.data.startDate && (
            <div>
              <span className="text-sm font-medium text-gray-700">Start Date:</span>
              <span className="ml-2 text-sm text-gray-900">
                {format(node.data.startDate, 'MMM d, yyyy')}
              </span>
            </div>
          )}

          {node.data.dueDate && (
            <div>
              <span className="text-sm font-medium text-gray-700">Due Date:</span>
              <span className="ml-2 text-sm text-gray-900">
                {format(node.data.dueDate, 'MMM d, yyyy')}
              </span>
            </div>
          )}

          {node.data.status && (
            <div>
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <span className="ml-2 text-sm text-gray-900 capitalize">
                {node.data.status.replace('_', ' ')}
              </span>
            </div>
          )}

          {node.data.priority && (
            <div>
              <span className="text-sm font-medium text-gray-700">Priority:</span>
              <span className="ml-2 text-sm text-gray-900 capitalize">{node.data.priority}</span>
            </div>
          )}

          {node.data.discipline && (
            <div>
              <span className="text-sm font-medium text-gray-700">Discipline:</span>
              <span className="ml-2 text-sm text-gray-900">{node.data.discipline}</span>
            </div>
          )}

          {node.data.assignees && node.data.assignees.length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-700">Assignees:</span>
              <span className="ml-2 text-sm text-gray-900">
                {node.data.assignees.length} assigned
              </span>
            </div>
          )}

          {node.data.percentComplete !== undefined && (
            <div>
              <span className="text-sm font-medium text-gray-700">Progress:</span>
              <span className="ml-2 text-sm text-gray-900">{node.data.percentComplete}%</span>
            </div>
          )}

          {node.data.tags && node.data.tags.length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-700">Tags:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {node.data.tags.map((tag, index) => (
                  <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {node.data.notes && (
            <div>
              <span className="text-sm font-medium text-gray-700">Notes:</span>
              <p className="mt-1 text-sm text-gray-900">{node.data.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEdgeProperties = (edge: Edge) => {
    const sourceNode = project.nodes.find(n => n.id === edge.source);
    const targetNode = project.nodes.find(n => n.id === edge.target);

    if (editedEdge && editedEdge.id === edge.id) {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dependency Type
            </label>
            <select
              value={editedEdge.type}
              onChange={(e) => setEditedEdge({ ...editedEdge, type: e.target.value as DependencyType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="finish_to_start">Finish to Start</option>
              <option value="start_to_start">Start to Start</option>
              <option value="finish_to_finish">Finish to Finish</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label
            </label>
            <input
              type="text"
              value={editedEdge.label || ''}
              onChange={(e) => setEditedEdge({ ...editedEdge, label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional label"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleEdgeUpdate(editedEdge)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={() => setEditedEdge(null)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Dependency</h3>
          <button
            onClick={() => setEditedEdge(edge)}
            className="text-blue-500 hover:text-blue-700 text-sm"
          >
            Edit
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-700">From:</span>
            <span className="ml-2 text-sm text-gray-900">{sourceNode?.title}</span>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">To:</span>
            <span className="ml-2 text-sm text-gray-900">{targetNode?.title}</span>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">Type:</span>
            <span className="ml-2 text-sm text-gray-900">
              {edge.type.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {edge.label && (
            <div>
              <span className="text-sm font-medium text-gray-700">Label:</span>
              <span className="ml-2 text-sm text-gray-900">{edge.label}</span>
            </div>
          )}

          {edge.isBlocked && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Blocked</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMultiSelectProperties = () => {
    return (
      <div className="space-y-3 text-sm">
        <div>
          <span className="text-sm font-medium text-gray-700">Nodes:</span>
          <span className="ml-2 text-sm text-gray-900">{selectedNodes.length}</span>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-700">Edges:</span>
          <span className="ml-2 text-sm text-gray-900">{selectedEdges.length}</span>
        </div>
      </div>
    );
  };

  const renderPhaseProperties = (phase: Phase) => {
    if (!editingPhase || editingPhase.id !== phase.id) {
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <p className="text-sm text-gray-900">{phase.title}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nodes</label>
            <p className="text-sm text-gray-900">{phase.nodeIds.length} node{phase.nodeIds.length !== 1 ? 's' : ''}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded border border-gray-300"
                style={{ backgroundColor: phase.color }}
              />
              <span className="text-sm text-gray-600">{phase.color}</span>
            </div>
          </div>
          <button
            onClick={() => setEditingPhase(phase)}
            className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
          >
            Edit Phase
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={editingPhase.title}
            onChange={(e) => setEditingPhase({ ...editingPhase, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          <input
            type="color"
            value={editingPhase.color}
            onChange={(e) => setEditingPhase({ ...editingPhase, color: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Associated Nodes ({editingPhase.nodeIds.length})
          </label>
          <div className="text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto bg-gray-50 p-2 rounded">
            {editingPhase.nodeIds.length === 0 ? (
              <p>No nodes associated</p>
            ) : (
              editingPhase.nodeIds.map(nodeId => {
                const node = project.nodes.find(n => n.id === nodeId);
                return (
                  <div key={nodeId} className="flex items-center justify-between">
                    <span>{node?.title || nodeId}</span>
                    <button
                      onClick={() => setEditingPhase({
                        ...editingPhase,
                        nodeIds: editingPhase.nodeIds.filter(id => id !== nodeId)
                      })}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              onPhaseUpdate?.(editingPhase);
              setEditingPhase(null);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={() => setEditingPhase(null)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {editingPhase ? (
        renderPhaseProperties(editingPhase)
      ) : selectedNodes.length + selectedEdges.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Select a node or edge to view properties</p>
        </div>
      ) : selectedNodes.length + selectedEdges.length === 1 ? (
        primarySelected && 'source' in primarySelected ? 
          renderEdgeProperties(primarySelected as Edge) : 
          renderNodeProperties(primarySelected as Node)
      ) : (
        renderMultiSelectProperties()
      )}
    </div>
  );
};

export default PropertiesPanel;
