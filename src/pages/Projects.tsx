import React, { useState, useEffect } from 'react';
import { useNavigate } from '../lib/simpleRouter';
import { Plus, Settings, Trash2, LogOut, Users, Clock } from 'lucide-react';
import { projectsAPI, ProjectData } from '../services/api';

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

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getAll();
      setProjects(response.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      await projectsAPI.create(newProjectName, newProjectDescription);
      setNewProjectName('');
      setNewProjectDescription('');
      setShowNewProjectForm(false);
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    }
  };

  const handleOpenProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
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

  const handleShareProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !shareEmail.trim()) return;

    try {
      await projectsAPI.share(selectedProject.id, shareEmail);
      setShareEmail('');
      setShowShareModal(false);
      // Optionally reload projects
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share project');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
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
            <p className="text-sm text-gray-600 mt-1">Welcome, {user.displayName || user.username}</p>
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
            {error}
          </div>
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
                  {project.ownerId === user.id && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedProject(project);
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
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
                >
                  Share
                </button>
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
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









