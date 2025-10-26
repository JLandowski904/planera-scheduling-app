import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '../lib/simpleRouter';
import { Plus, Trash2, LogOut, Users, Clock, MailPlus, Check, XCircle, Loader2, Copy } from 'lucide-react';
import { authAPI, projectsAPI, ProjectData, ProjectInvitation } from '../services/api';

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'viewer' | 'editor'>('viewer');
  const [shareFeedback, setShareFeedback] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [invitationActionId, setInvitationActionId] = useState<string | null>(null);

  const [currentUserName, setCurrentUserName] = useState<string>('');

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      const response = await projectsAPI.getAll();
      setProjects(response.projects);
      setInvitations(response.invitations || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load projects';
      setError(errorMessage);
      
      // If it's an authentication error, clear token and redirect to login
      if (errorMessage.includes('signed in') || errorMessage.includes('token') || errorMessage.includes('401') || errorMessage.includes('Invalid token')) {
        // Clear invalid token and user data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const init = async () => {
      try {
        const me = await authAPI.getMe();
        const name = me?.user?.displayName || me?.user?.username || me?.user?.email || '';
        setCurrentUserName(name);
      } catch {}
      await authAPI.getSession();
      loadProjects();
    };
    init();
  }, [loadProjects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      setError(''); // Clear any previous errors
      await projectsAPI.create(newProjectName, newProjectDescription);
      setNewProjectName('');
      setNewProjectDescription('');
      setShowNewProjectForm(false);
      await loadProjects();
    } catch (err) {
      console.error('Failed to create project:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      setError(errorMessage);
      
      // If it's an authentication error, clear token and redirect to login
      if (errorMessage.includes('signed in') || errorMessage.includes('token') || errorMessage.includes('401') || errorMessage.includes('Invalid token')) {
        // Clear invalid token and user data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    }
  };

  const handleOpenProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setSelectedProject(null);
    setShareEmail('');
    setShareFeedback('');
    setShareRole('viewer');
    setShareLoading(false);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      await projectsAPI.delete(projectId);
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const handleDuplicateProject = async (project: ProjectData) => {
    try {
      const newName = `${project.name} (Copy)`;
      const { project: created } = await projectsAPI.create(newName, project.description || undefined);
      if (project.projectData) {
        await projectsAPI.update(created.id, project.projectData, { name: newName, description: project.description });
      }
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate project');
    }
  };

  const handleShareProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !shareEmail.trim()) return;

    try {
      setShareLoading(true);
      setShareFeedback('');
      const response = await projectsAPI.share(selectedProject.id, shareEmail, shareRole);
      if (response.member) {
        setShareFeedback(`Shared with ${response.member.displayName || response.member.email}`);
        await loadProjects();
      } else if (response.invitation) {
        setShareFeedback(`Invitation sent to ${response.invitation.email}`);
      } else {
        setShareFeedback(response.message || 'Share updated');
      }
      setShareEmail('');
    } catch (err) {
      setShareFeedback(err instanceof Error ? err.message : 'Failed to share project');
    } finally {
      setShareLoading(false);
    }
  };

  const handleInvitationAction = async (token: string, action: 'accept' | 'decline') => {
    try {
      setInvitationActionId(`${token}:${action}`);
      await projectsAPI.respondToInvitation(token, action);
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update invitation');
    } finally {
      setInvitationActionId(null);
    }
  };

  const handleLogout = async () => {
    await authAPI.logout();
    navigate('/');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Projects</h1>
            <p className="text-sm text-gray-600 mt-1">Welcome{currentUserName ? `, ${currentUserName}` : ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <div className="flex items-center justify-between">
              <div>
                <span>{error}</span>
                {(error.includes('Failed to fetch') || error.includes('Invalid token')) && (
                  <div className="text-sm text-red-600 mt-1">
                    This usually means you need to log in again. Please try logging out and back in.
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={loadProjects}
                  className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded text-sm font-medium transition"
                >
                  Retry
                </button>
                {(error.includes('Invalid token') || error.includes('token')) && (
                  <button
                    onClick={() => {
                      localStorage.removeItem('authToken');
                      localStorage.removeItem('user');
                      navigate('/');
                    }}
                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-sm font-medium transition"
                  >
                    Clear Session & Login
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {invitations.length > 0 && (
          <section className="mb-6 bg-white border border-blue-100 rounded-lg shadow-sm">
            <div className="px-4 py-3 border-b border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-700">
                <MailPlus className="w-5 h-5" />
                <span className="font-medium text-sm">Pending invitations</span>
              </div>
              <span className="text-xs font-semibold text-blue-600 px-2 py-1 bg-blue-50 rounded-full">
                {invitations.length}
              </span>
            </div>
            <ul className="divide-y divide-blue-50">
              {invitations.map(invitation => {
                const actionKeyAccept = `${invitation.token}:accept`;
                const actionKeyDecline = `${invitation.token}:decline`;
                const isAccepting = invitationActionId === actionKeyAccept;
                const isDeclining = invitationActionId === actionKeyDecline;
                return (
                  <li key={invitation.id} className="px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{invitation.name}</div>
                      <div className="text-xs text-gray-500">Owner: {invitation.ownerName}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Role: {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)} • Invited {new Date(invitation.invitedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleInvitationAction(invitation.token, 'decline')}
                        disabled={isAccepting || isDeclining}
                        className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {isDeclining ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Decline
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInvitationAction(invitation.token, 'accept')}
                        disabled={isAccepting || isDeclining}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isAccepting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Accept
                          </>
                        )}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* New Project Button */}
        {!showNewProjectForm && (
          <button
            onClick={() => setShowNewProjectForm(true)}
            className="mb-6 flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        )}

        {/* New Project Form */}
        {showNewProjectForm && (
          <div className="mb-6 p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
                >
                  Create Project
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewProjectForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500 mb-2">No projects yet</p>
            <p className="text-sm text-gray-400">Create a new project to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <div key={project.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                <div className="p-6 cursor-pointer" onClick={() => handleOpenProject(project.id)}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                  )}
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Owner: {project.ownerName}
                    </div>
                    {project.access?.role && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Your role: {project.access.role.charAt(0).toUpperCase() + project.access.role.slice(1)}
                      </div>
                    )}
                    {project.updatedAt && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Updated: {formatDate(project.updatedAt)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-200 p-4 flex gap-2">
                  <button
                    onClick={() => handleOpenProject(project.id)}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm font-medium"
                  >
                    Open
                  </button>
                  {project.access && project.access.role === 'owner' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setShareEmail('');
                          setShareRole('viewer');
                          setShareFeedback('');
                          setShareLoading(false);
                          setShowShareModal(true);
                        }}
                        className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition text-sm"
                        title="Share project"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="px-3 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50 transition text-sm"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDuplicateProject(project)}
                    className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition text-sm"
                    title="Duplicate project"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Share Modal */}
      {showShareModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Share Project: {selectedProject.name}</h3>
            <form onSubmit={handleShareProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="colleague@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Level
                </label>
                <select
                  value={shareRole}
                  onChange={(e) => setShareRole(e.target.value as 'viewer' | 'editor')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="viewer">Viewer - can review schedule</option>
                  <option value="editor">Editor - can update schedule</option>
                </select>
              </div>
              {shareFeedback && (
                <div className="text-sm text-blue-600 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
                  {shareFeedback}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={shareLoading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {shareLoading ? (
                    <span className="inline-flex items-center gap-2 justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sharing...
                    </span>
                  ) : (
                    'Share'
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeShareModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;





