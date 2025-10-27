import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from '../lib/simpleRouter';
import { ArrowLeft, Share2, Printer, Users } from 'lucide-react';
import Canvas from '../components/Canvas';
import TimelineView from '../components/TimelineView';
import TableView from '../components/TableView';
import CalendarView from '../components/CalendarView';
import AppLayout from '../components/Layout/AppLayout';
import PropertiesPanel from '../components/PropertiesPanel';
import NodeDialog from '../components/NodeDialog';
import PhaseDialog from '../components/PhaseDialog';
import { projectsAPI, ProjectData, ProjectAccess } from '../services/api';
import ProjectCollaborationPanel from '../components/ProjectCollaborationPanel';
import { Project, ViewType, Node, NodeType, Phase, Edge, DependencyType } from '../types';
import { createDefaultProject } from '../utils/projectUtils';
import { DEFAULT_PHASE_COLOR, getNodesBoundingBox, getNodesInPhase, removeNodeIdsFromPhases } from '../utils/phaseUtils';
import { getDependencyConflicts } from '../utils/schedulingUtils';

const applyEdgeConflictState = (project: Project): Project => {
  const dependencyConflicts = getDependencyConflicts(project.nodes, project.edges);
  const blockedEdgeIds = new Set(
    dependencyConflicts.map(conflict => conflict.edgeId).filter((edgeId): edgeId is string => Boolean(edgeId))
  );

  return {
    ...project,
    edges: project.edges.map(edge => ({
      ...edge,
      isBlocked: blockedEdgeIds.has(edge.id),
    })),
  };
};

const coerceOptionalDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
};

const normalizeDateRange = (range?: { start: unknown; end: unknown } | null) => {
  if (!range) return undefined;
  const start = coerceOptionalDate(range.start);
  const end = coerceOptionalDate(range.end);
  if (start && end) {
    return { start, end };
  }
  return undefined;
};

const normalizeProjectResponse = (data: ProjectData): Project => {
  const base = createDefaultProject();
  const storedProject = data.projectData && typeof data.projectData === 'object'
    ? (data.projectData as Partial<Project>)
    : null;

  const merged: Project = {
    ...base,
    ...(storedProject ?? {}),
    viewSettings: {
      ...base.viewSettings,
      ...(storedProject?.viewSettings ?? {}),
    },
    filters: {
      ...base.filters,
      ...(storedProject?.filters ?? {}),
    },
  };

  const normalizedNodes = merged.nodes.map(node => ({
    ...node,
    position: { ...node.position },
    data: {
      ...node.data,
      startDate: coerceOptionalDate(node.data.startDate),
      dueDate: coerceOptionalDate(node.data.dueDate),
    },
  }));

  const normalizedPhases = merged.phases.map(phase => ({
    ...phase,
    position: { ...phase.position },
    size: { ...phase.size },
  }));

  const normalizedEdges = merged.edges.map(edge => ({ ...edge }));

  const normalizedFilters = {
    ...merged.filters,
    types: [...merged.filters.types],
    statuses: [...merged.filters.statuses],
    assignees: [...merged.filters.assignees],
    disciplines: [...merged.filters.disciplines],
    tags: [...merged.filters.tags],
    phases: [...merged.filters.phases],
    customPresets: merged.filters.customPresets.map(preset => ({
      ...preset,
      filters: {
        ...preset.filters,
        dateRange: normalizeDateRange(
          preset.filters?.dateRange
            ? {
                start: preset.filters.dateRange.start,
                end: preset.filters.dateRange.end,
              }
            : undefined,
        ),
      },
    })),
    dateRange: normalizeDateRange(
      merged.filters.dateRange
        ? {
            start: merged.filters.dateRange.start,
            end: merged.filters.dateRange.end,
          }
        : undefined,
    ),
  };

  const normalizedProject: Project = {
    ...merged,
    nodes: normalizedNodes,
    phases: normalizedPhases,
    edges: normalizedEdges,
    filters: normalizedFilters,
    viewSettings: {
      ...merged.viewSettings,
      pan: { ...merged.viewSettings.pan },
    },
    createdAt: coerceOptionalDate(merged.createdAt) ?? new Date(),
    updatedAt: coerceOptionalDate(merged.updatedAt) ?? new Date(),
  };

  return {
    ...normalizedProject,
    id: data.id ?? normalizedProject.id,
    name: data.name ?? normalizedProject.name,
    description: data.description ?? normalizedProject.description,
    createdAt: coerceOptionalDate(data.createdAt) ?? normalizedProject.createdAt,
    updatedAt: coerceOptionalDate(data.updatedAt) ?? normalizedProject.updatedAt,
  };
};

const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
  const [selectedPhases, setSelectedPhases] = useState<string[]>([]);
  const [projectAccess, setProjectAccess] = useState<ProjectAccess | null>(null);
  const [collaborationOpen, setCollaborationOpen] = useState(false);
  const [collaborationInitialTab, setCollaborationInitialTab] = useState<'activity' | 'comments' | 'members'>('activity');
  const [nodeDialogState, setNodeDialogState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    nodeType: NodeType;
    node: Node | null;
    initialPosition?: { x: number; y: number };
    initialPhaseId?: string | null;
    predecessorId?: string | null;
    predecessorEdgeId?: string | null;
    predecessorType?: DependencyType | null;
    successorId?: string | null;
    successorEdgeId?: string | null;
    successorType?: DependencyType | null;
  }>({
    isOpen: false,
    mode: 'create',
    nodeType: 'task',
    node: null,
    initialPhaseId: null,
    predecessorId: null,
    predecessorEdgeId: null,
    predecessorType: null,
    successorId: null,
    successorEdgeId: null,
    successorType: null,
  });
  const [phaseDialogState, setPhaseDialogState] = useState<{
    isOpen: boolean;
    phase: Phase | null;
  }>({
    isOpen: false,
    phase: null,
  });

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch (err) {
      console.warn('Failed to parse current user from storage', err);
      return null;
    }
  }, []);
  const currentUserId = currentUser?.id ?? null;
  const collaborationRole = useMemo(() => {
    const role = projectAccess?.role;
    return role === 'owner' || role === 'editor' || role === 'viewer' ? role : 'viewer';
  }, [projectAccess]);

  // Duplicate/Delete actions moved to Projects page

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getById(projectId!);
      const normalizedProject = normalizeProjectResponse(response.project);
      setProject(applyEdgeConflictState(normalizedProject));
      setProjectAccess(response.project.access ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
      console.error('Load project error:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const handleProjectChange = useCallback(async (updatedProject: Project) => {
    const projectWithConflicts = applyEdgeConflictState(updatedProject);
    setProject(projectWithConflicts);
    // Save to server asynchronously
    try {
      await projectsAPI.update(projectId!, projectWithConflicts);
    } catch (err) {
      console.error('Failed to save project:', err);
    }
  }, [projectId]);

  const openNodeDialogForCreate = useCallback((type: NodeType) => {
    if (!project) {
      return;
    }

    const suggestedPhaseId = selectedPhases.length > 0 ? selectedPhases[0] : null;
    const suggestedPredecessor =
      selectedNodes.length === 1 ? selectedNodes[0] : null;

    const position = {
      x: project.viewSettings.pan.x + 150,
      y: project.viewSettings.pan.y + 150,
    };

    setNodeDialogState({
      isOpen: true,
      mode: 'create',
      nodeType: type,
      node: null,
      initialPosition: position,
      initialPhaseId: suggestedPhaseId,
      predecessorId: suggestedPredecessor,
      predecessorEdgeId: null,
      predecessorType: suggestedPredecessor ? 'finish_to_start' : null,
      successorId: null,
      successorEdgeId: null,
      successorType: null,
    });
  }, [project, selectedPhases, selectedNodes]);

  const openNodeDialogForEdit = useCallback((nodeId: string) => {
    if (!project) {
      return;
    }

    const nodeToEdit = project.nodes.find(item => item.id === nodeId);
    if (!nodeToEdit) {
      return;
    }

    const containingPhase = project.phases.find(phase => phase.nodeIds.includes(nodeId));
    const existingPredecessorEdge = project.edges.find(edge => edge.target === nodeId);
    const existingSuccessorEdge = project.edges.find(edge => edge.source === nodeId);

    setNodeDialogState({
      isOpen: true,
      mode: 'edit',
      nodeType: nodeToEdit.type,
      node: nodeToEdit,
      initialPosition: nodeToEdit.position,
      initialPhaseId: containingPhase?.id ?? null,
      predecessorId: existingPredecessorEdge?.source ?? null,
      predecessorEdgeId: existingPredecessorEdge?.id ?? null,
      predecessorType: existingPredecessorEdge?.type ?? null,
      successorId: existingSuccessorEdge?.target ?? null,
      successorEdgeId: existingSuccessorEdge?.id ?? null,
      successorType: existingSuccessorEdge?.type ?? null,
    });
  }, [project]);

  const handleCreateNode = useCallback((type: NodeType) => {
    openNodeDialogForCreate(type);
  }, [openNodeDialogForCreate]);

  const handleCreatePhase = useCallback(() => {
    if (!project) {
      return;
    }

    const phaseId = `phase-${Date.now()}`;
    const padding = 24;
    const defaultSize = { width: 320, height: 200 };

    const selectedNodeEntities = project.nodes.filter(node =>
      selectedNodes.includes(node.id)
    );

    let position = {
      x: project.viewSettings.pan.x + 80,
      y: project.viewSettings.pan.y + 80,
    };
    let size = defaultSize;
    let nodeIds: string[] = [];

    const bounds = getNodesBoundingBox(selectedNodeEntities);
    if (bounds) {
      position = {
        x: bounds.x - padding,
        y: bounds.y - padding,
      };
      size = {
        width: bounds.width + padding * 2,
        height: bounds.height + padding * 2,
      };
      nodeIds = selectedNodeEntities.map(node => node.id);
    }

    const initialPhase: Phase = {
      id: phaseId,
      title: 'New Phase',
      position,
      size,
      color: DEFAULT_PHASE_COLOR,
      nodeIds,
    };

    const autoDetectedNodeIds = getNodesInPhase(initialPhase, project.nodes);
    const combinedNodeIds = Array.from(new Set([...nodeIds, ...autoDetectedNodeIds]));

    const newPhase: Phase = {
      ...initialPhase,
      nodeIds: combinedNodeIds,
    };

    const updatedProject: Project = {
      ...project,
      phases: [...project.phases, newPhase],
      updatedAt: new Date(),
    };

    handleProjectChange(updatedProject);
    setSelectedPhases([phaseId]);
    setSelectedNodes([]);
    setSelectedEdges([]);
  }, [project, selectedNodes, handleProjectChange]);

  const handleEditNode = useCallback((nodeId: string) => {
    openNodeDialogForEdit(nodeId);
  }, [openNodeDialogForEdit]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    if (!project) {
      return;
    }

    const remainingNodes = project.nodes.filter(node => node.id !== nodeId);
    const remainingEdges = project.edges.filter(
      edge => edge.source !== nodeId && edge.target !== nodeId
    );

    const removedNodeIds = new Set([nodeId]);
    const remainingPhases = removeNodeIdsFromPhases(project.phases, removedNodeIds);

    const updatedProject: Project = {
      ...project,
      nodes: remainingNodes,
      edges: remainingEdges,
      phases: remainingPhases,
      updatedAt: new Date(),
    };

    handleProjectChange(updatedProject);

    setSelectedNodes(prev => prev.filter(id => id !== nodeId));
    setSelectedEdges(prev =>
      prev.filter(edgeId => {
        const edge = project.edges.find(item => item.id === edgeId);
        if (!edge) return false;
        return edge.source !== nodeId && edge.target !== nodeId;
      })
    );
    setSelectedPhases(prev => prev.filter(phaseId => remainingPhases.some(p => p.id === phaseId)));
  }, [project, handleProjectChange]);

  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    if (!project) {
      return;
    }

    const updatedProject: Project = {
      ...project,
      edges: project.edges.filter(edge => edge.id !== edgeId),
      updatedAt: new Date(),
    };

    handleProjectChange(updatedProject);
    setSelectedEdges(prev => prev.filter(id => id !== edgeId));
  }, [project, handleProjectChange]);

  const handleEditEdge = useCallback((edgeId: string) => {
    // Select the edge and open the properties panel for full editing
    setSelectedEdges([edgeId]);
    setSelectedNodes([]);
    setSelectedPhases([]);
    setIsPropertiesOpen(true);
  }, []);

  const handlePhaseUpdate = useCallback((phase: Phase) => {
    if (!project) return;
    const updatedProject: Project = {
      ...project,
      phases: project.phases.map(p => (p.id === phase.id ? phase : p)),
      updatedAt: new Date(),
    };
    handleProjectChange(updatedProject);
  }, [project, handleProjectChange]);

  const handleEditPhase = useCallback((phaseId: string) => {
    if (!project) {
      return;
    }

    const matchedPhase = project.phases.find(phase => phase.id === phaseId);
    if (!matchedPhase) {
      return;
    }

    setPhaseDialogState({
      isOpen: true,
      phase: matchedPhase,
    });
    setSelectedPhases([phaseId]);
  }, [project]);

  const handleDeletePhase = useCallback((phaseId: string) => {
    if (!project) {
      return;
    }

    const confirmed = window.confirm('Delete this phase? Nodes will remain on the canvas.');
    if (!confirmed) {
      return;
    }

    const remainingPhases = project.phases.filter(phase => phase.id !== phaseId);
    const updatedProject: Project = {
      ...project,
      phases: remainingPhases,
      updatedAt: new Date(),
    };

    handleProjectChange(updatedProject);
    setSelectedPhases(prev => prev.filter(id => id !== phaseId));
  }, [project, handleProjectChange]);

  const handleViewChange = useCallback((view: ViewType) => {
    if (project) {
      handleProjectChange({
        ...project,
        viewSettings: { ...project.viewSettings, currentView: view }
      });
    }
  }, [project, handleProjectChange]);

  const handlePrint = useCallback(() => {
    if (!project) {
      return;
    }

    const view = project.viewSettings.currentView;
    const body = document.body;
    const previousValue = body.getAttribute('data-print-view') ?? null;
    let cleanedUp = false;

    const cleanup = () => {
      if (cleanedUp) {
        return;
      }
      cleanedUp = true;
      if (previousValue) {
        body.setAttribute('data-print-view', previousValue);
      } else {
        body.removeAttribute('data-print-view');
      }
      window.removeEventListener('afterprint', cleanup);
    };

    body.setAttribute('data-print-view', view);
    window.addEventListener('afterprint', cleanup);
    window.print();
    cleanup();
  }, [project]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <p className="text-red-600 mb-4 text-lg font-medium">{error || 'Project not found'}</p>
        <button
          onClick={() => navigate('/projects')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  const showNodeDialog = Boolean(nodeDialogState.isOpen && project);

  return (
    <>
    <AppLayout 
      currentView={project.viewSettings.currentView} 
      onViewChange={handleViewChange}
    >
      <div className="h-full min-h-0 flex flex-col">
        {/* Project Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/projects')}
              className="p-2 hover:bg-gray-100 rounded-lg transition no-print"
              title="Back to Projects"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-gray-500 mt-1">{project.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Duplicate/Delete moved to Projects page */}
            <button
              onClick={() => {
                setCollaborationInitialTab('activity');
                setCollaborationOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium no-print"
              title="Open collaboration tools"
            >
              <Users className="w-4 h-4" />
              Collaborate
            </button>
            <button 
              onClick={() => {
                setCollaborationInitialTab('members');
                setCollaborationOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium no-print"
              title="Share this project with others"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium no-print"
              title="Print the current view"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 flex overflow-hidden print-surface">
          <div className="flex-1 min-h-0 overflow-auto">
          {project.viewSettings.currentView === 'whiteboard' && (
            <div className="h-full min-h-0 flex flex-col print-area print-area--whiteboard">
              <Canvas
                project={project}
                onProjectChange={handleProjectChange}
                selectedNodes={selectedNodes}
                selectedEdges={selectedEdges}
                selectedPhases={selectedPhases}
                onNodeSelect={(nodeId, multiSelect) => {
                  if (multiSelect) {
                    setSelectedNodes(prev => 
                      prev.includes(nodeId) 
                        ? prev.filter(id => id !== nodeId)
                        : [...prev, nodeId]
                    );
                  } else {
                    setSelectedNodes([nodeId]);
                    setSelectedEdges([]);
                    setSelectedPhases([]);
                  }
                }}
                onEdgeSelect={(edgeId, multiSelect) => {
                  if (multiSelect) {
                    setSelectedEdges(prev => 
                      prev.includes(edgeId) 
                        ? prev.filter(id => id !== edgeId)
                        : [...prev, edgeId]
                    );
                  } else {
                    setSelectedEdges([edgeId]);
                    setSelectedNodes([]);
                    setSelectedPhases([]);
                    setIsPropertiesOpen(true);
                  }
                }}
                onPhaseSelect={(phaseId, multiSelect) => {
                  if (multiSelect) {
                    setSelectedPhases(prev =>
                      prev.includes(phaseId)
                        ? prev.filter(id => id !== phaseId)
                        : [...prev, phaseId]
                    );
                  } else {
                    setSelectedPhases([phaseId]);
                    setSelectedNodes([]);
                    setSelectedEdges([]);
                  }
                }}
                onCanvasClick={() => {
                  setSelectedNodes([]);
                  setSelectedEdges([]);
                  setSelectedPhases([]);
                }}
                onContextMenu={() => {}}
                linkMode={false}
                linkSource={null}
                onLinkSourceChange={() => {}}
                onEdgeDelete={handleDeleteEdge}
                onEditEdge={handleEditEdge}
                onNewNode={handleCreateNode}
                onNewPhase={handleCreatePhase}
                onUndo={() => {}}
                onRedo={() => {}}
                canUndo={false}
                canRedo={false}
                onEditNode={handleEditNode}
                onDeleteNode={handleDeleteNode}
                onEditPhase={handleEditPhase}
                onDeletePhase={handleDeletePhase}
              />
            </div>
          )}
          {project.viewSettings.currentView === 'timeline' && (
            <div className="h-full min-h-0 flex flex-col print-area print-area--timeline">
              <TimelineView
                project={project}
                onProjectChange={handleProjectChange}
                selectedNodes={selectedNodes}
                selectedEdges={selectedEdges}
                onNodeSelect={(nodeId) => setSelectedNodes([nodeId])}
                onEdgeSelect={(edgeId) => setSelectedEdges([edgeId])}
                onCanvasClick={() => {}}
                onContextMenu={() => {}}
              />
            </div>
          )}
          {project.viewSettings.currentView === 'table' && (
            <div className="h-full min-h-0 flex flex-col print-area print-area--table">
              <TableView
                project={project}
                onProjectChange={handleProjectChange}
                selectedNodes={selectedNodes}
                onNodeSelect={(nodeId) => setSelectedNodes([nodeId])}
              />
            </div>
          )}
          {project.viewSettings.currentView === 'calendar' && (
            <div className="h-full min-h-0 flex flex-col print-area print-area--calendar">
              <CalendarView
                project={project}
                selectedNodes={selectedNodes}
                onNodeSelect={(nodeId) => {
                  setSelectedNodes([nodeId]);
                  setSelectedEdges([]);
                  setSelectedPhases([]);
                }}
              />
            </div>
          )}
          </div>

          {isPropertiesOpen && (
            <PropertiesPanel
              project={project}
              onProjectChange={handleProjectChange}
              selectedNodes={selectedNodes}
              selectedEdges={selectedEdges}
              onPhaseUpdate={handlePhaseUpdate}
              onClose={() => setIsPropertiesOpen(false)}
            />
          )}
        </div>
      </div>
    </AppLayout>

    {project && (
      <ProjectCollaborationPanel
        projectId={project.id}
        projectName={project.name}
        isOpen={collaborationOpen}
        onClose={() => setCollaborationOpen(false)}
        currentRole={collaborationRole}
        currentUserId={currentUserId}
        initialTab={collaborationInitialTab}
      />
    )}

      {showNodeDialog && project && (
        <NodeDialog
          isOpen={nodeDialogState.isOpen}
          mode={nodeDialogState.mode}
          nodeType={nodeDialogState.nodeType}
          project={project as Project}
          node={nodeDialogState.node}
          initialPosition={nodeDialogState.initialPosition}
          initialPhaseId={nodeDialogState.initialPhaseId ?? undefined}
          currentPredecessorId={nodeDialogState.predecessorId ?? undefined}
          currentPredecessorType={nodeDialogState.predecessorType ?? undefined}
          currentSuccessorId={nodeDialogState.successorId ?? undefined}
          currentSuccessorType={nodeDialogState.successorType ?? undefined}
          onClose={() =>
            setNodeDialogState(prev => ({
              ...prev,
              isOpen: false,
            }))
          }
          onSubmit={({ node: submittedNode, selectedPhaseId, predecessor, successor }) => {
            if (!project) {
              return;
            }

            const requestedPredecessorId = predecessor?.nodeId ?? null;
            const requestedPredecessorType = predecessor?.type ?? null;
            const requestedSuccessorId = successor?.nodeId ?? null;
            const requestedSuccessorType = successor?.type ?? null;

            let updatedNodes: Node[];
            if (nodeDialogState.mode === 'edit' && nodeDialogState.node) {
              updatedNodes = project.nodes.map(existing =>
                existing.id === submittedNode.id ? submittedNode : existing
              );
            } else {
              updatedNodes = [...project.nodes, submittedNode];
            }

            let updatedPhases: Phase[] = project.phases.map(phase => ({
              ...phase,
              nodeIds: getNodesInPhase(phase, updatedNodes),
            }));

            if (selectedPhaseId) {
              updatedPhases = updatedPhases.map(phase => {
                if (phase.id === selectedPhaseId && !phase.nodeIds.includes(submittedNode.id)) {
                  return { ...phase, nodeIds: [...phase.nodeIds, submittedNode.id] };
                }
                return phase;
              });
            }

            let updatedEdges: Edge[] = [...project.edges];
            const currentPredecessorEdgeId = nodeDialogState.predecessorEdgeId;
            const currentPredecessorId = nodeDialogState.predecessorId;
            const currentSuccessorEdgeId = nodeDialogState.successorEdgeId;
            const currentSuccessorId = nodeDialogState.successorId;

            const edgeSelections: string[] = [];
            const generateEdgeId = () => `edge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

            if (nodeDialogState.mode === 'edit' && currentPredecessorEdgeId) {
              if (!requestedPredecessorId || requestedPredecessorId !== currentPredecessorId) {
                updatedEdges = updatedEdges.filter(edge => edge.id !== currentPredecessorEdgeId);
              }
            }

            const desiredPredecessorType: DependencyType = requestedPredecessorType ?? 'finish_to_start';

            if (requestedPredecessorId) {
              const existingEdge = updatedEdges.find(
                edge => edge.source === requestedPredecessorId && edge.target === submittedNode.id
              );

              if (existingEdge) {
                if (existingEdge.type !== desiredPredecessorType) {
                  updatedEdges = updatedEdges.map(edge =>
                    edge.id === existingEdge.id ? { ...edge, type: desiredPredecessorType } : edge
                  );
                }
                edgeSelections.push(existingEdge.id);
              } else {
                const newEdge: Edge = {
                  id: generateEdgeId(),
                  source: requestedPredecessorId,
                  target: submittedNode.id,
                  type: desiredPredecessorType,
                };
                updatedEdges = [...updatedEdges, newEdge];
                edgeSelections.push(newEdge.id);
              }
            }

            if (nodeDialogState.mode === 'edit' && currentSuccessorEdgeId) {
              if (!requestedSuccessorId || requestedSuccessorId !== currentSuccessorId) {
                updatedEdges = updatedEdges.filter(edge => edge.id !== currentSuccessorEdgeId);
              }
            }

            const desiredSuccessorType: DependencyType = requestedSuccessorType ?? 'finish_to_start';

            if (requestedSuccessorId) {
              const existingEdge = updatedEdges.find(
                edge => edge.source === submittedNode.id && edge.target === requestedSuccessorId
              );

              if (existingEdge) {
                if (existingEdge.type !== desiredSuccessorType) {
                  updatedEdges = updatedEdges.map(edge =>
                    edge.id === existingEdge.id ? { ...edge, type: desiredSuccessorType } : edge
                  );
                }
                edgeSelections.push(existingEdge.id);
              } else {
                const newEdge: Edge = {
                  id: generateEdgeId(),
                  source: submittedNode.id,
                  target: requestedSuccessorId,
                  type: desiredSuccessorType,
                };
                updatedEdges = [...updatedEdges, newEdge];
                edgeSelections.push(newEdge.id);
              }
            }

            const dependencyMap = new Map<string, string[]>();
            updatedEdges.forEach(edge => {
              if (!dependencyMap.has(edge.target)) {
                dependencyMap.set(edge.target, []);
              }
              dependencyMap.get(edge.target)!.push(edge.id);
            });

            updatedNodes = updatedNodes.map(existing => {
              const dependencies = dependencyMap.get(existing.id);
              const nextData = { ...existing.data };

              if (dependencies && dependencies.length > 0) {
                nextData.dependencies = dependencies;
              } else {
                delete nextData.dependencies;
              }

              return {
                ...existing,
                data: nextData,
              };
            });

            const selectedEdgeIds = Array.from(new Set(edgeSelections));

            const updatedProject: Project = {
              ...project,
              nodes: updatedNodes,
              edges: updatedEdges,
              phases: updatedPhases,
              updatedAt: new Date(),
            };

            handleProjectChange(updatedProject);
            setSelectedNodes([submittedNode.id]);
            setSelectedEdges(selectedEdgeIds);
            const containingPhaseIds = updatedPhases
              .filter(phase => phase.nodeIds.includes(submittedNode.id))
              .map(phase => phase.id);
            setSelectedPhases(containingPhaseIds);

            setNodeDialogState(prev => ({
              ...prev,
              isOpen: false,
            }));
          }}
        />
      )}

      {phaseDialogState.isOpen && phaseDialogState.phase && project && (
        <PhaseDialog
          isOpen={phaseDialogState.isOpen}
          phase={phaseDialogState.phase}
          onClose={() =>
            setPhaseDialogState({
              isOpen: false,
              phase: null,
            })
          }
          onSubmit={(updatedPhase) => {
            if (!project) return;

            const updatedPhases = project.phases.map(phase =>
              phase.id === updatedPhase.id ? updatedPhase : phase
            );

            const updatedProject: Project = {
              ...project,
              phases: updatedPhases,
              updatedAt: new Date(),
            };

            handleProjectChange(updatedProject);
            setPhaseDialogState({
              isOpen: false,
              phase: null,
            });
            setSelectedPhases([updatedPhase.id]);
          }}
        />
      )}
    </>
  );
};

export default ProjectView;








