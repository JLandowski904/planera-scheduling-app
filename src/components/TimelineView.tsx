import React, { useMemo, useState } from 'react';
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
  const [disciplineFilter, setDisciplineFilter] = useState<string[]>([]);
  const [showDisciplineDropdown, setShowDisciplineDropdown] = useState(false);

  // Calculate visible date range
  const visibleDateRange = useMemo(() => {
    return calculateVisibleDateRange(project.nodes, scale === 'month' ? 30 : scale === 'week' ? 7 : 3);
  }, [project.nodes, scale]);

  // Generate time buckets based on scale
  const timeBuckets = useMemo(() => {
    return getTimeBuckets(visibleDateRange.start, visibleDateRange.end, scale);
  }, [visibleDateRange, scale]);

  // Get all unique disciplines
  const allDisciplines = useMemo(() => {
    const disciplines = new Set<string>();
    project.nodes.forEach(node => {
      if (node.data.discipline) {
        disciplines.add(node.data.discipline);
      }
    });
    return Array.from(disciplines).sort();
  }, [project.nodes]);

  // Group nodes by phase and filter by discipline
  const phaseGroups = useMemo((): PhaseGroup[] => {
    const groups: PhaseGroup[] = [];
    const assignedNodeIds = new Set<string>();

    // Filter nodes by discipline first
    const filteredNodes = project.nodes.filter(node => {
      if (node.type === 'person') return false;
      if (!node.data.startDate && !node.data.dueDate) return false;
      if (disciplineFilter.length > 0 && node.data.discipline && !disciplineFilter.includes(node.data.discipline)) {
        return false;
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
  }, [project.phases, project.nodes, disciplineFilter]);

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

  const getDisciplineColor = (discipline?: string) => {
    if (!discipline) return 'bg-gray-400';
    
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
    
    const hash = discipline.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const toggleDiscipline = (discipline: string) => {
    setDisciplineFilter(prev => 
      prev.includes(discipline)
        ? prev.filter(d => d !== discipline)
        : [...prev, discipline]
    );
  };

  const rowHeight = 48;
  const phaseRowHeight = 56;

  const totalRows = phaseGroups.reduce((acc, group) => acc + 1 + group.nodes.length, 0);
  const timelineContentHeight = Math.max(totalRows * rowHeight, 400);

  // Calculate bar positions
  const getBarPosition = (node: Node) => {
    const startDate = node.data.startDate || node.data.dueDate;
    const endDate = node.data.dueDate || node.data.startDate;
    
    if (!startDate || !endDate) return null;

    const leftPercent = (getXPositionForDate(startDate, visibleDateRange.start, visibleDateRange.end, 100));
    const widthPercent = (getWidthForDateRange(startDate, endDate, visibleDateRange.start, visibleDateRange.end, 100));

    return {
      leftPercent: Math.max(0, Math.min(100, leftPercent)),
      widthPercent: Math.max(1, Math.min(100 - leftPercent, widthPercent)),
      startDate,
      endDate,
    };
  };

  return (
    <div className="timeline-view h-full min-h-0 flex flex-col bg-slate-50 dark:bg-slate-900">
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

          {/* Discipline filter */}
          <div className="relative">
            <button
              onClick={() => setShowDisciplineDropdown(!showDisciplineDropdown)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600 transition"
            >
              <Filter className="w-4 h-4" />
              <span>Disciplines</span>
              {disciplineFilter.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {disciplineFilter.length}
                </span>
              )}
            </button>

            {showDisciplineDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg z-10">
                <div className="p-2 border-b border-gray-200 dark:border-slate-700 flex justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-slate-100">Filter by Discipline</span>
                  <button
                    onClick={() => setDisciplineFilter([])}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Clear All
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {allDisciplines.length === 0 ? (
                    <div className="text-sm text-gray-500 p-2">No disciplines found</div>
                  ) : (
                    allDisciplines.map(discipline => (
                      <label key={discipline} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={disciplineFilter.includes(discipline)}
                          onChange={() => toggleDiscipline(discipline)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-900 dark:text-slate-200">{discipline}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline header */}
      <div className="timeline-header bg-white dark:bg-slate-800 border-b border-slate-300 dark:border-slate-600 sticky top-0 z-20">
        <div className="flex">
          {/* Left columns */}
          <div className="flex border-r border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700">
            <div className="w-64 p-3 border-r border-gray-200 dark:border-slate-600">
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-sm">Task / Deliverable / Milestone</h3>
            </div>
            <div className="w-32 p-3 border-r border-gray-200 dark:border-slate-600">
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-sm">Discipline</h3>
            </div>
            <div className="w-28 p-3 border-r border-gray-200 dark:border-slate-600">
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-sm">Start Date</h3>
            </div>
            <div className="w-28 p-3">
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-sm">End Date</h3>
            </div>
          </div>
          
          {/* Timeline columns */}
          <div className="flex-1 flex overflow-x-auto">
            {scale === 'day' && timeBuckets.some(b => b.groupLabel) && (
              <div className="absolute top-0 left-0 right-0 h-6 flex border-b border-gray-200 bg-gray-100">
                {timeBuckets.map((bucket, index) => {
                  if (!bucket.groupLabel) return null;
                  
                  // Count consecutive days in this month
                  let span = 1;
                  for (let i = index + 1; i < timeBuckets.length; i++) {
                    if (timeBuckets[i].groupLabel) break;
                    span++;
                  }
                  
                  return (
                    <div
                      key={`group-${index}`}
                      className="text-xs font-medium text-gray-700 text-center border-r border-gray-300"
                      style={{ 
                        minWidth: `${(100 / timeBuckets.length) * span}%`,
                        flex: `0 0 ${(100 / timeBuckets.length) * span}%`
                      }}
                    >
                      {bucket.groupLabel}
                    </div>
                  );
                })}
              </div>
            )}
            <div className={`flex w-full ${scale === 'day' && timeBuckets.some(b => b.groupLabel) ? 'mt-6' : ''}`}>
              {timeBuckets.map((bucket, index) => (
                <div
                  key={index}
                  className="flex-1 p-2 border-r border-gray-200 dark:border-slate-700 text-center bg-white dark:bg-slate-800"
                  style={{ minWidth: scale === 'day' ? '60px' : '100px' }}
                >
                  <div className="text-xs font-medium text-gray-900 dark:text-slate-100">
                    {bucket.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline content */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="flex">
          {/* Left columns */}
          <div className="flex border-r border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800" style={{ minHeight: timelineContentHeight }}>
            <div className="w-64 border-r border-gray-200">
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

            {/* Discipline column */}
            <div className="w-32 border-r border-gray-200">
              {phaseGroups.map((group, groupIndex) => (
                <React.Fragment key={`disc-${group.phase?.id || 'ungrouped'}`}>
                  <div
                    className="px-3 py-3 border-b border-gray-200"
                    style={{ height: `${phaseRowHeight}px` }}
                  />
                  {group.nodes.map(node => (
                    <div
                      key={`disc-${node.id}`}
                      className="px-3 py-3 border-b border-gray-100 dark:border-slate-700"
                      style={{ height: `${rowHeight}px` }}
                    >
                      {node.data.discipline && (
                        <span className={`inline-block px-2 py-1 rounded text-xs text-white ${getDisciplineColor(node.data.discipline)}`}>
                          {node.data.discipline}
                        </span>
                      )}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>

            {/* Start date column */}
            <div className="w-28 border-r border-gray-200">
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
            className="flex-1 relative bg-white"
            style={{ minHeight: timelineContentHeight }}
          >
            {/* Grid lines */}
            <div className="absolute inset-0">
              {timeBuckets.map((_, index) => (
                <div
                  key={`grid-${index}`}
                  className="absolute top-0 bottom-0 border-r border-gray-200 dark:border-slate-700"
                  style={{ left: `${(index / timeBuckets.length) * 100}%` }}
                />
              ))}
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
                        top: `${currentY + 8}px`,
                        left: `${getXPositionForDate(group.startDate, visibleDateRange.start, visibleDateRange.end, 100)}%`,
                        width: `${getWidthForDateRange(group.startDate, group.endDate, visibleDateRange.start, visibleDateRange.end, 100)}%`,
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
                          top: `${nodeY + 8}px`,
                          left: `${barPos.leftPercent}%`,
                          width: `${barPos.widthPercent}%`,
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

                const sourceX = sourceBar.leftPercent + sourceBar.widthPercent;
                const targetX = targetBar.leftPercent;

                // Calculate proper Y positions based on phase groups
                let actualSourceY = 0;
                let actualTargetY = 0;
                let cumulativeY = 0;

                phaseGroups.forEach(group => {
                  cumulativeY += phaseRowHeight;
                  group.nodes.forEach(node => {
                    if (node.id === edge.source) {
                      actualSourceY = cumulativeY + rowHeight / 2;
                    }
                    if (node.id === edge.target) {
                      actualTargetY = cumulativeY + rowHeight / 2;
                    }
                    cumulativeY += rowHeight;
                  });
                });

                // Create elbow path
                const midX = (sourceX + targetX) / 2;
                const path = `M ${sourceX}% ${actualSourceY} L ${midX}% ${actualSourceY} L ${midX}% ${actualTargetY} L ${targetX}% ${actualTargetY}`;

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

      {/* Click outside to close discipline dropdown */}
      {showDisciplineDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDisciplineDropdown(false)}
        />
      )}
    </div>
  );
};

export default TimelineView;
