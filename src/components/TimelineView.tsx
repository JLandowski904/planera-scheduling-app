import React, { useMemo, useRef, useState } from 'react';
import { Project, Node, Phase } from '../types';
import { format } from 'date-fns';
import { Calendar, Clock, CheckCircle, User, ZoomIn, ZoomOut, Maximize2, Filter } from 'lucide-react';
import { 
  TimelineScale, 
  getTimeBuckets, 
  calculateVisibleDateRange,
  getXPositionForDate,
  getWidthForDateRange 
} from '../utils/schedulingUtils';
import { getPhaseDateRange } from '../utils/phaseUtils';
import { useTheme } from '../context/ThemeContext';

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

interface PhaseGroup {
  phase: Phase | null; // null for ungrouped items
  nodes: Node[];
  startDate?: Date;
  endDate?: Date;
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
  const { theme } = useTheme();
  const [scale, setScale] = useState<TimelineScale>('week');
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]); // Changed from disciplineFilter
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false); // Changed from showDisciplineDropdown
  const timelineBodyRef = useRef<HTMLDivElement>(null);

  // Calculate visible date range
  const visibleDateRange = useMemo(() => {
    return calculateVisibleDateRange(project.nodes, scale === 'month' ? 30 : scale === 'week' ? 7 : 3);
  }, [project.nodes, scale]);

  // Generate time buckets based on scale
  const timeBuckets = useMemo(() => {
    return getTimeBuckets(visibleDateRange.start, visibleDateRange.end, scale);
  }, [visibleDateRange, scale]);

  // Get all unique assignees
  const allAssignees = useMemo(() => {
    const assignees = new Set<string>();
    project.nodes.forEach(node => {
      if (node.data.assignees) {
        node.data.assignees.forEach(assignee => assignees.add(assignee));
      }
    });
    return Array.from(assignees).sort();
  }, [project.nodes]);

  // Group nodes by phase and filter by assignee
  const phaseGroups = useMemo((): PhaseGroup[] => {
    const groups: PhaseGroup[] = [];
    const assignedNodeIds = new Set<string>();

    // Filter nodes by assignee first
    const filteredNodes = project.nodes.filter(node => {
      if (node.type === 'person') return false;
      if (!node.data.startDate && !node.data.dueDate) return false;
      if (assigneeFilter.length > 0) {
        // Node must have at least one assignee that's in the filter
        if (!node.data.assignees || node.data.assignees.length === 0) {
          return false;
        }
        const hasMatchingAssignee = node.data.assignees.some(assignee => 
          assigneeFilter.includes(assignee)
        );
        if (!hasMatchingAssignee) {
          return false;
        }
      }
      return true;
    });

    // Group by phases
    project.phases.forEach(phase => {
      const phaseNodes = filteredNodes.filter(node => phase.nodeIds.includes(node.id));
      if (phaseNodes.length > 0) {
        // Sort by start date
        phaseNodes.sort((a, b) => {
          const aDate = a.data.startDate || a.data.dueDate || new Date(0);
          const bDate = b.data.startDate || b.data.dueDate || new Date(0);
          return aDate.getTime() - bDate.getTime();
        });

        const dateRange = getPhaseDateRange(phase, project.nodes);
        groups.push({
          phase,
          nodes: phaseNodes,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });

        phaseNodes.forEach(node => assignedNodeIds.add(node.id));
      }
    });

    // Ungrouped nodes
    const ungroupedNodes = filteredNodes.filter(node => !assignedNodeIds.has(node.id));
    if (ungroupedNodes.length > 0) {
      ungroupedNodes.sort((a, b) => {
        const aDate = a.data.startDate || a.data.dueDate || new Date(0);
        const bDate = b.data.startDate || b.data.dueDate || new Date(0);
        return aDate.getTime() - bDate.getTime();
      });

      groups.push({
        phase: null,
        nodes: ungroupedNodes,
      });
    }

    return groups;
  }, [project.phases, project.nodes, assigneeFilter]); // Changed from disciplineFilter

  // Calculate row positions for dependency arrows
  const nodeRowPositions = useMemo(() => {
    const positions = new Map<string, number>();
    let currentRow = 0;

    phaseGroups.forEach(group => {
      currentRow++; // Phase header row
      group.nodes.forEach(node => {
        positions.set(node.id, currentRow);
        currentRow++;
      });
    });

    return positions;
  }, [phaseGroups]);

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
    if (theme === 'dark') {
      switch (type) {
        case 'milestone':
          return 'bg-purple-700';
        case 'deliverable':
          return 'bg-green-700';
        case 'task':
          return 'bg-blue-700';
        default:
          return 'bg-gray-700';
      }
    } else {
      switch (type) {
        case 'milestone':
          return 'bg-purple-500';
        case 'deliverable':
          return 'bg-green-500';
        case 'task':
          return 'bg-blue-500';
        default:
          return 'bg-gray-500';
      }
    }
  };

  const getAssigneeColor = (assignee?: string) => { // Changed from getDisciplineColor
    if (!assignee) return 'bg-gray-400';
    
    const colors = [
      'bg-red-400',
      'bg-orange-400',
      'bg-amber-400',
      'bg-yellow-400',
      'bg-lime-400',
      'bg-green-400',
      'bg-emerald-400',
      'bg-teal-400',
      'bg-cyan-400',
      'bg-sky-400',
      'bg-blue-400',
      'bg-indigo-400',
      'bg-violet-400',
      'bg-purple-400',
      'bg-fuchsia-400',
      'bg-pink-400',
    ];
    
    const hash = assignee.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const toggleAssignee = (assignee: string) => { // Changed from toggleDiscipline
    setAssigneeFilter(prev => 
      prev.includes(assignee)
        ? prev.filter(d => d !== assignee)
        : [...prev, assignee]
    );
  };

  const rowHeight = 48;
  const phaseRowHeight = 56;
  const hasGroupedDayHeader = scale === 'day' && timeBuckets.some(bucket => bucket.groupLabel);
  const headerHeight = hasGroupedDayHeader ? 52 : 32; // height of left-side task header row (and row offset)
  const leftColumnsWidth = 256 + 128 + 112 + 112; // widths (px) of the meta columns (w-64, w-32, w-28, w-28)
  const bucketWidth = scale === 'day' ? 80 : scale === 'week' ? 120 : 160; // widen buckets for large screens
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1400;
  const timelineWidth = Math.max(timeBuckets.length * bucketWidth, viewportWidth - leftColumnsWidth - 120);

  const totalRows = phaseGroups.reduce((acc, group) => acc + 1 + group.nodes.length, 0);
  const timelineContentHeight = Math.max(totalRows * rowHeight, 400);

  // Calculate bar positions
  const getBarPosition = (node: Node) => {
    const startDate = node.data.startDate || node.data.dueDate;
    const endDate = node.data.dueDate || node.data.startDate;
    
    if (!startDate || !endDate) return null;

    const leftPx = getXPositionForDate(startDate, visibleDateRange.start, visibleDateRange.end, timelineWidth);
    const widthPx = getWidthForDateRange(startDate, endDate, visibleDateRange.start, visibleDateRange.end, timelineWidth);

    return {
      left: Math.max(0, Math.min(timelineWidth, leftPx)),
      width: Math.max(1, Math.min(timelineWidth - leftPx, widthPx)),
      startDate,
      endDate,
    };
  };

  // No extra scroll sync needed when header lives inside the scrollable rail

  return (
    <div className="timeline-view h-full min-h-0 flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 no-print">
        <div className="flex items-center justify-between gap-4">
          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Zoom:</label>
            <div className="flex items-center gap-1 border border-gray-300 dark:border-slate-600 rounded-md">
              <button
                onClick={() => setScale('month')}
                className={`px-3 py-1.5 text-sm ${scale === 'month' ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'} transition`}
                title="Month view"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setScale('week')}
                className={`px-3 py-1.5 text-sm border-x border-gray-300 dark:border-slate-600 ${scale === 'week' ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'} transition`}
                title="Week view"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setScale('day')}
                className={`px-3 py-1.5 text-sm ${scale === 'day' ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'} transition`}
                title="Day view"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-gray-500 dark:text-slate-400 ml-2">
              {scale === 'month' ? 'Monthly' : scale === 'week' ? 'Weekly' : 'Daily'}
            </span>
          </div>

          {/* Assignee filter */}
          <div className="relative">
            <button
              onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600 transition"
            >
              <Filter className="w-4 h-4" />
              <span>Assignees</span>
              {assigneeFilter.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {assigneeFilter.length}
                </span>
              )}
            </button>

            {showAssigneeDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg z-10">
                <div className="p-2 border-b border-gray-200 dark:border-slate-700 flex justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-slate-100">Filter by Assignee</span>
                  <button
                    onClick={() => setAssigneeFilter([])}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Clear All
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {allAssignees.length === 0 ? (
                    <div className="text-sm text-gray-500 p-2">No assignees found</div>
                  ) : (
                    allAssignees.map(assignee => (
                      <label key={assignee} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={assigneeFilter.includes(assignee)}
                          onChange={() => toggleAssignee(assignee)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-900 dark:text-slate-200">{assignee}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline content */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="flex w-full min-h-0">
          {/* Left columns */}
          <div
            className="flex shrink-0 border-r border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 sticky left-0 z-30"
            style={{ minHeight: timelineContentHeight, height: '100%' }}
          >
            <div className="w-64 border-r border-gray-200">
              {/* Left header: Description */}
              <div
                className="px-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center sticky top-0 z-40"
                style={{ height: `${headerHeight}px` }}
              >
                <span className="text-xs font-medium text-gray-900 dark:text-slate-100">
                  Description
                </span>
              </div>
              {phaseGroups.map((group, groupIndex) => (
                <React.Fragment key={group.phase?.id || 'ungrouped'}>
                  {/* Phase header row */}
                  <div
                    className="px-4 py-3 border-b border-gray-200 font-semibold text-white"
                    style={{ 
                      height: `${phaseRowHeight}px`,
                      backgroundColor: group.phase?.color || '#6b7280'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm truncate">
                        {group.phase?.title || 'Ungrouped'}
                      </span>
                      <span className="text-xs opacity-80">
                        ({group.nodes.length})
                      </span>
                    </div>
                  </div>

                  {/* Node rows */}
                  {group.nodes.map(node => (
                    <div
                      key={node.id}
                      className={`px-4 py-3 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer ${
                        selectedNodes.includes(node.id) ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                      }`}
                      style={{ height: `${rowHeight}px` }}
                      onClick={() => onNodeSelect(node.id)}
                      onContextMenu={(e) => onContextMenu(e, node.id, 'node')}
                    >
                      <div className="flex items-center gap-2">
                        {getNodeIcon(node.type)}
                        <span className="text-sm text-gray-900 dark:text-slate-100 truncate">
                          {node.title}
                        </span>
                      </div>
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>

            {/* Assignee column */}
            <div className="w-32 border-r border-gray-200">
              {/* Left header: Assignee */}
              <div
                className="px-3 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center sticky top-0 z-40"
                style={{ height: `${headerHeight}px` }}
              >
                <span className="text-xs font-medium text-gray-900 dark:text-slate-100">
                  Assignee
                </span>
              </div>
              {phaseGroups.map((group, groupIndex) => (
                <React.Fragment key={`assignee-${group.phase?.id || 'ungrouped'}`}>
                  <div
                    className="px-3 py-3 border-b border-gray-200"
                    style={{ height: `${phaseRowHeight}px` }}
                  />
                  {group.nodes.map(node => (
                    <div
                      key={`assignee-${node.id}`}
                      className="px-3 py-3 border-b border-gray-100 dark:border-slate-700"
                      style={{ height: `${rowHeight}px` }}
                    >
                      {node.data.assignees && node.data.assignees.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {node.data.assignees.slice(0, 2).map((assignee, idx) => (
                            <span 
                              key={idx}
                              className={`inline-block px-2 py-1 rounded text-xs text-white ${getAssigneeColor(assignee)}`}
                            >
                              {assignee}
                            </span>
                          ))}
                          {node.data.assignees.length > 2 && (
                            <span className="inline-block px-2 py-1 text-xs text-gray-600 dark:text-slate-400">
                              +{node.data.assignees.length - 2}
                            </span>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>

            {/* Start date column */}
            <div className="w-28 border-r border-gray-200">
              {/* Left header: Start Date */}
              <div
                className="px-3 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center sticky top-0 z-40"
                style={{ height: `${headerHeight}px` }}
              >
                <span className="text-xs font-medium text-gray-900 dark:text-slate-100">
                  Start Date
                </span>
              </div>
              {phaseGroups.map((group, groupIndex) => (
                <React.Fragment key={`start-${group.phase?.id || 'ungrouped'}`}>
                  <div
                    className="px-3 py-3 border-b border-gray-200 text-xs text-white"
                    style={{ height: `${phaseRowHeight}px` }}
                  >
                    {group.startDate && format(group.startDate, 'MMM d')}
                  </div>
                  {group.nodes.map(node => (
                    <div
                      key={`start-${node.id}`}
                      className="px-3 py-3 border-b border-gray-100 dark:border-slate-700 text-xs text-gray-600 dark:text-slate-300"
                      style={{ height: `${rowHeight}px` }}
                    >
                      {node.data.startDate && format(node.data.startDate, 'MMM d, yy')}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>

            {/* End date column */}
            <div className="w-28">
              {/* Left header: Finish Date */}
              <div
                className="px-3 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center sticky top-0 z-40"
                style={{ height: `${headerHeight}px` }}
              >
                <span className="text-xs font-medium text-gray-900 dark:text-slate-100">
                  Finish Date
                </span>
              </div>
              {phaseGroups.map((group, groupIndex) => (
                <React.Fragment key={`end-${group.phase?.id || 'ungrouped'}`}>
                  <div
                    className="px-3 py-3 border-b border-gray-200 text-xs text-white"
                    style={{ height: `${phaseRowHeight}px` }}
                  >
                    {group.endDate && format(group.endDate, 'MMM d')}
                  </div>
                  {group.nodes.map(node => (
                    <div
                      key={`end-${node.id}`}
                      className="px-3 py-3 border-b border-gray-100 dark:border-slate-700 text-xs text-gray-600 dark:text-slate-300"
                      style={{ height: `${rowHeight}px` }}
                    >
                      {node.data.dueDate && format(node.data.dueDate, 'MMM d, yy')}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Timeline grid and bars */}
          <div
            className="flex-1 min-w-0 relative bg-white overflow-x-auto"
            style={{ minHeight: timelineContentHeight }}
            ref={timelineBodyRef}
          >
            <div
              className="relative"
              style={{ width: `${timelineWidth}px`, minHeight: timelineContentHeight }}
            >
              {/* Sticky timeline headers inside the scrollable rail */}
              <div className="sticky top-0 z-20 bg-white dark:bg-slate-800">
                {scale === 'day' && timeBuckets.some(b => b.groupLabel) && (
                  <div className="flex border-b border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-700">
                    {timeBuckets.map((bucket, index) => {
                      if (!bucket.groupLabel) return null;
                      
                      let span = 1;
                      for (let i = index + 1; i < timeBuckets.length; i++) {
                        if (timeBuckets[i].groupLabel) break;
                        span++;
                      }
                      
                      return (
                        <div
                          key={`group-${index}`}
                          className="text-xs font-medium text-gray-700 dark:text-slate-200 text-center border-r border-gray-300 dark:border-slate-600"
                          style={{ 
                            minWidth: span * bucketWidth,
                            flex: `0 0 ${span * bucketWidth}px`
                          }}
                        >
                          {bucket.groupLabel}
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex w-full border-b border-gray-200 dark:border-slate-700">
                  {timeBuckets.map((bucket, index) => (
                    <div
                      key={index}
                      className="p-2 border-r border-gray-200 dark:border-slate-700 text-center bg-white dark:bg-slate-800"
                      style={{ width: bucketWidth, flex: `0 0 ${bucketWidth}px` }}
                    >
                      <div className="text-xs font-medium text-gray-900 dark:text-slate-100">
                        {bucket.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid lines */}
              <div className="absolute inset-0">
                {timeBuckets.map((_, index) => (
                  <div
                    key={`grid-${index}`}
                    className="absolute top-0 bottom-0 border-r border-gray-200 dark:border-slate-700"
                    style={{ left: `${index * bucketWidth}px` }}
                  />
                ))}
                <div
                  className="absolute top-0 bottom-0 border-r border-gray-200 dark:border-slate-700"
                  style={{ left: `${timeBuckets.length * bucketWidth}px` }}
                />
              </div>

              {/* Phase bars and node bars */}
              {phaseGroups.map((group, groupIndex) => {
                let currentY = phaseGroups.slice(0, groupIndex).reduce((acc, g) => acc + phaseRowHeight + g.nodes.length * rowHeight, 0);

                return (
                  <React.Fragment key={`bars-${group.phase?.id || 'ungrouped'}`}>
                    {/* Phase bar */}
                    {group.phase && group.startDate && group.endDate && (
                      <div
                        className="absolute"
                        style={{
                          top: `${headerHeight + currentY + 8}px`,
                          left: `${getXPositionForDate(group.startDate, visibleDateRange.start, visibleDateRange.end, timelineWidth)}px`,
                          width: `${getWidthForDateRange(group.startDate, group.endDate, visibleDateRange.start, visibleDateRange.end, timelineWidth)}px`,
                          height: `${phaseRowHeight - 16}px`,
                        }}
                      >
                        <div
                          className="h-full rounded opacity-30"
                          style={{ backgroundColor: group.phase.color }}
                        />
                      </div>
                    )}

                    {/* Node bars */}
                    {group.nodes.map((node, nodeIndex) => {
                      const barPos = getBarPosition(node);
                      if (!barPos) return null;

                      const nodeY = currentY + phaseRowHeight + nodeIndex * rowHeight;

                      return (
                        <div
                          key={`bar-${node.id}`}
                          className="absolute"
                          style={{
                            top: `${headerHeight + nodeY + 8}px`,
                            left: `${barPos.left}px`,
                            width: `${barPos.width}px`,
                            height: `${rowHeight - 16}px`,
                          }}
                        >
                          <div
                            className={`h-full ${getNodeColor(node.type)} text-white px-2 rounded flex items-center gap-1 cursor-pointer hover:opacity-90 transition ${
                              selectedNodes.includes(node.id) ? 'ring-2 ring-blue-600' : ''
                            }`}
                            onClick={() => onNodeSelect(node.id)}
                            onContextMenu={(e) => onContextMenu(e, node.id, 'node')}
                          >
                            {getNodeIcon(node.type)}
                            <span className="text-xs font-medium truncate flex-1">
                              {node.title}
                            </span>
                            {node.data.percentComplete !== undefined && (
                              <span className="text-xs">{node.data.percentComplete}%</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {/* Dependency arrows */}
              <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                <defs>
                  {project.edges.map(edge => (
                    <marker
                      key={`marker-${edge.id}`}
                      id={`arrow-${edge.id}`}
                      markerWidth="8"
                      markerHeight="8"
                      refX="7"
                      refY="4"
                      orient="auto"
                    >
                      <path d="M0,0 L0,8 L8,4 z" fill={edge.isBlocked ? '#ef4444' : '#6b7280'} />
                    </marker>
                  ))}
                </defs>
                {project.edges.map(edge => {
                  const sourceRow = nodeRowPositions.get(edge.source);
                  const targetRow = nodeRowPositions.get(edge.target);
                  
                  if (sourceRow === undefined || targetRow === undefined) return null;

                  // Find source and target nodes
                  let sourceNode: Node | undefined;
                  let targetNode: Node | undefined;
                  phaseGroups.forEach(group => {
                    group.nodes.forEach(node => {
                      if (node.id === edge.source) sourceNode = node;
                      if (node.id === edge.target) targetNode = node;
                    });
                  });

                  if (!sourceNode || !targetNode) return null;

                  const sourceBar = getBarPosition(sourceNode);
                  const targetBar = getBarPosition(targetNode);

                  if (!sourceBar || !targetBar) return null;

                  const sourceX = sourceBar.left + sourceBar.width;
                  const targetX = targetBar.left;

                  // Calculate proper Y positions based on phase groups
                  let actualSourceY = 0;
                  let actualTargetY = 0;
                  let cumulativeY = 0;

                  phaseGroups.forEach(group => {
                    cumulativeY += phaseRowHeight;
                    group.nodes.forEach(node => {
                      if (node.id === edge.source) {
                        actualSourceY = headerHeight + cumulativeY + rowHeight / 2;
                      }
                      if (node.id === edge.target) {
                        actualTargetY = headerHeight + cumulativeY + rowHeight / 2;
                      }
                      cumulativeY += rowHeight;
                    });
                  });

                  // Create elbow path
                  const midX = (sourceX + targetX) / 2;
                  const path = `M ${sourceX} ${actualSourceY} L ${midX} ${actualSourceY} L ${midX} ${actualTargetY} L ${targetX} ${actualTargetY}`;

                  return (
                    <path
                      key={edge.id}
                      d={path}
                      stroke={edge.isBlocked ? '#ef4444' : '#6b7280'}
                      strokeWidth="2"
                      fill="none"
                      markerEnd={`url(#arrow-${edge.id})`}
                      className="pointer-events-auto cursor-pointer hover:stroke-blue-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdgeSelect(edge.id);
                      }}
                      onContextMenu={(e) => onContextMenu(e, edge.id, 'edge')}
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline footer */}
      <div className="border-t border-gray-200 dark:border-slate-700 p-3 bg-gray-50 dark:bg-slate-800">
        <div className="text-xs text-gray-600 dark:text-slate-400 flex items-center justify-between">
          <span>
            Timeline: {format(visibleDateRange.start, 'MMM d, yyyy')} - {format(visibleDateRange.end, 'MMM d, yyyy')}
          </span>
          <span>
            {phaseGroups.reduce((acc, g) => acc + g.nodes.length, 0)} items across {phaseGroups.length} {phaseGroups.length === 1 ? 'group' : 'groups'}
          </span>
        </div>
      </div>

      {/* Click outside to close assignee dropdown */}
      {showAssigneeDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowAssigneeDropdown(false)}
        />
      )}
    </div>
  );
};

export default TimelineView;
