import React, { useMemo } from 'react';
import { Project, ConflictWarning } from '../types';
import { X, AlertTriangle, Clock, Users, Calendar, CheckCircle } from 'lucide-react';
import { detectCircularDependencies } from '../utils/projectUtils';

interface ConflictPanelProps {
  project: Project;
  onClose: () => void;
}

const ConflictPanel: React.FC<ConflictPanelProps> = ({ project, onClose }) => {
  // Detect conflicts
  const conflicts = useMemo(() => {
    const warnings: ConflictWarning[] = [];

    // Detect circular dependencies
    const circularDeps = detectCircularDependencies(project.edges);
    circularDeps.forEach((cycle, index) => {
      warnings.push({
        id: `circular-${index}`,
        type: 'circular_dependency',
        message: `Circular dependency detected: ${cycle.join(' → ')}`,
        nodeIds: cycle,
        severity: 'error',
      });
    });

    // Detect over-allocated people
    const personWorkloads = new Map<string, { tasks: string[]; totalHours: number }>();
    
    project.nodes.forEach(node => {
      if (node.type === 'task' && node.data.assignees) {
        const duration = node.data.durationDays || 1;
        node.data.assignees.forEach(assigneeId => {
          if (!personWorkloads.has(assigneeId)) {
            personWorkloads.set(assigneeId, { tasks: [], totalHours: 0 });
          }
          const workload = personWorkloads.get(assigneeId)!;
          workload.tasks.push(node.id);
          workload.totalHours += duration * 8; // Assume 8 hours per day
        });
      }
    });

    personWorkloads.forEach((workload, personId) => {
      if (workload.totalHours > 40) { // More than 40 hours per week
        const personNode = project.nodes.find(n => n.id === personId);
        warnings.push({
          id: `overallocated-${personId}`,
          type: 'over_allocation',
          message: `${personNode?.title || 'Person'} is over-allocated with ${workload.totalHours} hours`,
          nodeIds: [personId, ...workload.tasks],
          severity: 'warning',
        });
      }
    });

    // Detect deliverable conflicts (deliverable due before all child tasks done)
    project.nodes.forEach(node => {
      if (node.type === 'deliverable' && node.data.dueDate) {
        const childTasks = project.nodes.filter(n => 
          n.type === 'task' && n.data.parentId === node.id
        );
        
        const incompleteTasks = childTasks.filter(task => 
          task.data.status !== 'done' && 
          task.data.dueDate && 
          task.data.dueDate > node.data.dueDate!
        );

        if (incompleteTasks.length > 0) {
          warnings.push({
            id: `deliverable-conflict-${node.id}`,
            type: 'deliverable_conflict',
            message: `${node.title} is due before ${incompleteTasks.length} child task(s) are complete`,
            nodeIds: [node.id, ...incompleteTasks.map(t => t.id)],
            severity: 'warning',
          });
        }
      }
    });

    // Detect date conflicts (predecessor ends after successor starts)
    project.edges.forEach(edge => {
      const sourceNode = project.nodes.find(n => n.id === edge.source);
      const targetNode = project.nodes.find(n => n.id === edge.target);
      
      if (sourceNode?.data.dueDate && targetNode?.data.startDate) {
        if (sourceNode.data.dueDate > targetNode.data.startDate) {
          warnings.push({
            id: `date-conflict-${edge.id}`,
            type: 'date_conflict',
            message: `${sourceNode.title} ends after ${targetNode.title} starts`,
            nodeIds: [edge.source, edge.target],
            severity: 'error',
          });
        }
      }
    });

    return warnings;
  }, [project]);

  const getConflictIcon = (type: ConflictWarning['type']) => {
    switch (type) {
      case 'circular_dependency':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'over_allocation':
        return <Users className="w-5 h-5 text-yellow-500" />;
      case 'deliverable_conflict':
        return <Calendar className="w-5 h-5 text-orange-500" />;
      case 'date_conflict':
        return <Clock className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getConflictSeverityColor = (severity: ConflictWarning['severity']) => {
    switch (severity) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getConflictTypeLabel = (type: ConflictWarning['type']) => {
    switch (type) {
      case 'circular_dependency':
        return 'Circular Dependency';
      case 'over_allocation':
        return 'Over Allocation';
      case 'deliverable_conflict':
        return 'Deliverable Conflict';
      case 'date_conflict':
        return 'Date Conflict';
      default:
        return 'Unknown';
    }
  };

  const errorConflicts = conflicts.filter(c => c.severity === 'error');
  const warningConflicts = conflicts.filter(c => c.severity === 'warning');

  return (
    <div className="w-96 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Conflicts & Warnings</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {conflicts.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <p className="text-lg font-medium text-gray-900 mb-2">No conflicts detected</p>
          <p className="text-sm text-gray-600">Your project schedule looks good!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Issues:</span>
              <span className="font-medium">{conflicts.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-red-600">Errors:</span>
              <span className="font-medium text-red-600">{errorConflicts.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-yellow-600">Warnings:</span>
              <span className="font-medium text-yellow-600">{warningConflicts.length}</span>
            </div>
          </div>

          {/* Error conflicts */}
          {errorConflicts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Errors ({errorConflicts.length})
              </h3>
              <div className="space-y-2">
                {errorConflicts.map(conflict => (
                  <div
                    key={conflict.id}
                    className={`conflict-warning ${getConflictSeverityColor(conflict.severity)}`}
                  >
                    <div className="flex items-start gap-2">
                      {getConflictIcon(conflict.type)}
                      <div className="flex-1">
                        <div className="conflict-warning-title">
                          {getConflictTypeLabel(conflict.type)}
                        </div>
                        <div className="conflict-warning-message">
                          {conflict.message}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning conflicts */}
          {warningConflicts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-yellow-600 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Warnings ({warningConflicts.length})
              </h3>
              <div className="space-y-2">
                {warningConflicts.map(conflict => (
                  <div
                    key={conflict.id}
                    className={`conflict-warning ${getConflictSeverityColor(conflict.severity)}`}
                  >
                    <div className="flex items-start gap-2">
                      {getConflictIcon(conflict.type)}
                      <div className="flex-1">
                        <div className="conflict-warning-title">
                          {getConflictTypeLabel(conflict.type)}
                        </div>
                        <div className="conflict-warning-message">
                          {conflict.message}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Help text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-1">How to resolve conflicts:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• <strong>Circular Dependencies:</strong> Remove or change dependency relationships</li>
              <li>• <strong>Date Conflicts:</strong> Adjust start/end dates or dependency types</li>
              <li>• <strong>Over Allocation:</strong> Reassign tasks or extend timelines</li>
              <li>• <strong>Deliverable Conflicts:</strong> Adjust deliverable due dates or task schedules</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConflictPanel;

