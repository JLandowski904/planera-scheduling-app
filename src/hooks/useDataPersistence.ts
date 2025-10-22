import { useCallback } from 'react';
import { Project, ApiResponse, ProjectSummary } from '../types';

interface UseDataPersistenceReturn {
  saveProject: (project: Project) => void;
  loadProject: () => Project | null;
  exportProject: (project: Project) => void;
  importProject: (file: File) => Promise<Project>;
  getProjectList: () => ProjectSummary[];
  deleteProject: (projectId: string) => void;
}

export const useDataPersistence = (): UseDataPersistenceReturn => {
  const saveProject = useCallback((project: Project) => {
    try {
      localStorage.setItem(`project_${project.id}`, JSON.stringify(project));
      
      // Update project list
      const projectList = getProjectList();
      const existingIndex = projectList.findIndex(p => p.id === project.id);
      const projectSummary: ProjectSummary = {
        id: project.id,
        name: project.name,
        description: project.description,
        nodeCount: project.nodes.length,
        edgeCount: project.edges.length,
        lastModified: project.updatedAt,
      };
      
      if (existingIndex >= 0) {
        projectList[existingIndex] = projectSummary;
      } else {
        projectList.push(projectSummary);
      }
      
      localStorage.setItem('project_list', JSON.stringify(projectList));
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  }, []);

  const loadProject = useCallback((): Project | null => {
    try {
      const projectList = getProjectList();
      if (projectList.length === 0) return null;
      
      // Load the most recently modified project
      const latestProject = projectList.sort((a, b) => 
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      )[0];
      
      const projectData = localStorage.getItem(`project_${latestProject.id}`);
      if (projectData) {
        const project = JSON.parse(projectData);
        // Convert date strings back to Date objects
        project.createdAt = new Date(project.createdAt);
        project.updatedAt = new Date(project.updatedAt);
        project.nodes.forEach((node: any) => {
          if (node.data.startDate) node.data.startDate = new Date(node.data.startDate);
          if (node.data.dueDate) node.data.dueDate = new Date(node.data.dueDate);
        });
        if (!project.phases) {
          project.phases = [];
        }
        return project;
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    }
    return null;
  }, []);

  const exportProject = useCallback((project: Project) => {
    try {
      const dataStr = JSON.stringify(project, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export project:', error);
    }
  }, []);

  const importProject = useCallback(async (file: File): Promise<Project> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const project = JSON.parse(e.target?.result as string);
          // Convert date strings back to Date objects
          project.createdAt = new Date(project.createdAt);
          project.updatedAt = new Date(project.updatedAt);
          project.nodes.forEach((node: any) => {
            if (node.data.startDate) node.data.startDate = new Date(node.data.startDate);
            if (node.data.dueDate) node.data.dueDate = new Date(node.data.dueDate);
          });
          if (!project.phases) {
            project.phases = [];
          }
          resolve(project);
        } catch (error) {
          reject(new Error('Invalid project file format'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  const getProjectList = useCallback((): ProjectSummary[] => {
    try {
      const projectListData = localStorage.getItem('project_list');
      if (projectListData) {
        const projectList = JSON.parse(projectListData);
        return projectList.map((p: any) => ({
          ...p,
          lastModified: new Date(p.lastModified),
        }));
      }
    } catch (error) {
      console.error('Failed to get project list:', error);
    }
    return [];
  }, []);

  const deleteProject = useCallback((projectId: string) => {
    try {
      localStorage.removeItem(`project_${projectId}`);
      
      const projectList = getProjectList();
      const filteredList = projectList.filter(p => p.id !== projectId);
      localStorage.setItem('project_list', JSON.stringify(filteredList));
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  }, []);

  return {
    saveProject,
    loadProject,
    exportProject,
    importProject,
    getProjectList,
    deleteProject,
  };
};

// Mock API functions for future REST API integration
export const mockApi = {
  async getProjects(): Promise<ApiResponse<ProjectSummary[]>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      success: true,
      data: [],
    };
  },

  async getProject(projectId: string): Promise<ApiResponse<Project>> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      success: true,
      data: null as any, // Would be actual project data
    };
  },

  async saveProject(project: Project): Promise<ApiResponse<Project>> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      success: true,
      data: project,
    };
  },

  async deleteProject(projectId: string): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      success: true,
    };
  },
};


