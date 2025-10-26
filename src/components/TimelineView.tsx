import React, { useMemo, useState } from 'react';
import { Project } from '../types';
import { format, addDays, differenceInDays, startOfWeek, endOfWeek } from 'date-fns';
import { Calendar, Clock, CheckCircle, User } from 'lucide-react';

interface TimelineViewProps {
  project: Project;
  onProjectChange: (project: Project) => void;
  selectedNodes: string[];
  selectedEdges: string[];
  onNodeSelect: (nodeId: string, multiSelect?: boolean) => void;
  onEdgeSelect: (edgeId: string, multiSelect?: boolean) => void;
  onCanvasClick: () => void;
  onContextMenu: (e: React.MouseEvent, targetId?: string, targetType?: 'node' | 'edge' | 'canvas') => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({
  project,
  onProjectChange,
  selectedNodes,
  selectedEdges,
  onNodeSelect,
  onEdgeSelect,
  onCanvasClick,
  onContextMenu,
}) => {
  const [filterPhase, setFilterPhase] = useState<string>('all');
  // Calculate timeline bounds
  const timelineBounds = useMemo(() => {
    const nodesWithDates = project.nodes.filter(node => 
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
      start: addDays(start, -7),
      end: addDays(end, 7),
    };
  }, [project.nodes]);

  // Generate timeline columns (weeks)
  const timelineColumns = useMemo(() => {
    const columns = [];
    const current = startOfWeek(timelineBounds.start);
    const end = endOfWeek(timelineBounds.end);

    while (current <= end) {
      columns.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }

    return columns;
  }, [timelineBounds]);

  // Calculate node positions and sizes for timeline
  const nodeTimelineData = useMemo(() => {
    return project.nodes.map(node => {
      if (!node.data.startDate && !node.data.dueDate) {
        return null;
      }

      // Apply phase filter
      if (filterPhase !== 'all') {
        const phase = project.phases.find(p => p.id === filterPhase);
        if (!phase || !phase.nodeIds.includes(node.id)) {
          return null;
        }
      }

      const startDate = node.data.startDate || node.data.dueDate!;
      const endDate = node.data.dueDate || node.data.startDate!;
      
      const startOffset = differenceInDays(startDate, timelineBounds.start);
      const duration = differenceInDays(endDate, startDate) + 1;
      
      const leftPercent = (startOffset / differenceInDays(timelineBounds.end, timelineBounds.start)) * 100;
      const widthPercent = (duration / differenceInDays(timelineBounds.end, timelineBounds.start)) * 100;

      return {
        node,
        startDate,
        endDate,
        leftPercent: Math.max(0, leftPercent),
        widthPercent: Math.min(100, widthPercent),
        duration,
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);
  }, [project.nodes, timelineBounds, filterPhase, project.phases]);

  // Removed unused handleNodeDrag to satisfy lint

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

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'milestone':
        return 'bg-construction-milestone';
      case 'deliverable':
        return 'bg-construction-deliverable';
      case 'task':
        return 'bg-construction-task';
      case 'person':
        return 'bg-construction-person';
      default:
        return 'bg-gray-500';
    }
  };

  const rowHeight = 60;
  const minRows = 5;
  const timelineContentHeight = Math.max(nodeTimelineData.length, minRows) * rowHeight;

  return (
    <div className="timeline-view h-full min-h-0 flex flex-col bg-slate-50">
      {/* Timeline filters */}
      <div className="bg-white border-b border-slate-200 p-4 no-print">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Phase:</label>
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
      </div>

      {/* Timeline header */}
      <div className="timeline-header bg-white border-b border-slate-200">
        <div className="flex">
          {/* Node name column */}
          <div className="w-64 p-4 border-r border-gray-200">
            <h3 className="font-semibold text-gray-900">Node</h3>
          </div>
          
          {/* Timeline columns */}
          <div className="flex-1 flex">
            {timelineColumns.map((weekStart, index) => (
              <div
                key={index}
                className="flex-1 p-2 border-r border-gray-200 text-center"
                style={{ minWidth: '120px' }}
              >
                <div className="text-sm font-medium text-gray-900">
                  {format(weekStart, 'MMM d')}
                </div>
                <div className="text-xs text-gray-500">
                  Week {Math.ceil((weekStart.getDate()) / 7)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline content */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="flex">
          {/* Node list */}
          <div
            className="w-64 border-r border-gray-200"
            style={{ minHeight: timelineContentHeight }}
          >
            {nodeTimelineData.map(({ node }) => (
              <div
                key={node.id}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                  selectedNodes.includes(node.id) ? 'bg-blue-50' : ''
                }`}
                onClick={() => onNodeSelect(node.id)}
                onContextMenu={(e) => onContextMenu(e, node.id, 'node')}
              >
                <div className="flex items-center gap-2">
                  {getNodeIcon(node.type)}
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {node.title}
                  </span>
                </div>
                {node.data.discipline && (
                  <div className="text-xs text-gray-500 mt-1">
                    {node.data.discipline}
                  </div>
                )}
                {node.data.assignees && node.data.assignees.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {node.data.assignees.length} assignee{node.data.assignees.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Timeline grid */}
          <div
            className="flex-1 relative"
            style={{ minHeight: timelineContentHeight }}
          >
            {/* Grid lines */}
            <div className="absolute inset-0" style={{ minHeight: timelineContentHeight }}>
              {timelineColumns.map((_, index) => (
                <div
                  key={index}
                  className="absolute top-0 bottom-0 border-r border-gray-200"
                  style={{ left: `${(index / timelineColumns.length) * 100}%` }}
                />
              ))}
            </div>

            {/* Node bars */}
            {nodeTimelineData.map(({ node, leftPercent, widthPercent, startDate, endDate }, index) => (
              <div
                key={node.id}
                className="absolute top-0 h-12 flex items-center"
                style={{
                  top: `${index * rowHeight}px`,
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                }}
              >
                <div
                  className={`gantt-bar ${getNodeColor(node.type)} text-white px-2 py-1 rounded-sm cursor-move flex items-center gap-1 ${
                    selectedNodes.includes(node.id) ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => onNodeSelect(node.id)}
                  onContextMenu={(e) => onContextMenu(e, node.id, 'node')}
                  style={{ minWidth: '60px' }}
                >
                  {getNodeIcon(node.type)}
                  <span className="text-xs font-medium truncate">
                    {node.title}
                  </span>
                  {node.data.percentComplete !== undefined && (
                    <div className="ml-auto text-xs">
                      {node.data.percentComplete}%
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Dependencies */}
            {project.edges.map(edge => {
              const sourceData = nodeTimelineData.find(d => d?.node.id === edge.source);
              const targetData = nodeTimelineData.find(d => d?.node.id === edge.target);
              
              if (!sourceData || !targetData) return null;

              const sourceIndex = nodeTimelineData.findIndex(d => d?.node.id === edge.source);
              const targetIndex = nodeTimelineData.findIndex(d => d?.node.id === edge.target);

              const sourceX = sourceData.leftPercent + sourceData.widthPercent;
              const sourceY = sourceIndex * rowHeight + 24; // Center of source bar
              const targetX = targetData.leftPercent;
              const targetY = targetIndex * rowHeight + 24; // Center of target bar

              return (
                <svg
                  key={edge.id}
                  className="absolute inset-0 pointer-events-none"
                  style={{ zIndex: 1 }}
                >
                  <defs>
                    <marker
                      id={`arrow-${edge.id}`}
                      markerWidth="10"
                      markerHeight="10"
                      refX="9"
                      refY="3"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M0,0 L0,6 L9,3 z" fill={edge.isBlocked ? '#ef4444' : '#6b7280'} />
                    </marker>
                  </defs>
                  <path
                    d={`M ${sourceX}% ${sourceY} L ${targetX}% ${targetY}`}
                    stroke={edge.isBlocked ? '#ef4444' : '#6b7280'}
                    strokeWidth="2"
                    fill="none"
                    markerEnd={`url(#arrow-${edge.id})`}
                    className="pointer-events-stroke"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdgeSelect(edge.id);
                    }}
                    onContextMenu={(e) => onContextMenu(e, edge.id, 'edge')}
                  />
                </svg>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timeline footer with date range */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="text-sm text-gray-600">
          Timeline: {format(timelineBounds.start, 'MMM d, yyyy')} - {format(timelineBounds.end, 'MMM d, yyyy')}
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
