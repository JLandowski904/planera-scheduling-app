import { supabase, type Database } from './supabase';
type ProfilesRow = Database['public']['Tables']['profiles']['Row'];
type ProjectsRow = Database['public']['Tables']['projects']['Row'];
type ProjectsInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectsUpdate = Database['public']['Tables']['projects']['Update'];

export interface SignupData {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerName?: string;
  createdAt?: string;
  updatedAt?: string;
  projectData?: any;
  access?: {
    role: 'owner' | 'editor' | 'viewer';
    status: 'active' | 'invited' | string;
  };
}

export interface ProjectMember {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: string;
  status: string;
  joinedAt?: string;
  invitedAt?: string | null;
  acceptedAt?: string | null;
}

export interface ProjectInvitation {
  id: string;
  projectId: string;
  email: string;
  role: string;
  status: string;
  invitedAt: string;
  token: string;
  name: string;
  description?: string;
  ownerName?: string;
}

// Auth API using Supabase
export const authAPI = {
  async signup(data: SignupData) {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username,
          display_name: data.displayName || data.username,
        },
      },
    });

    if (error) throw error;

    return {
      user: {
        id: authData.user?.id || '',
        email: authData.user?.email || '',
        username: data.username,
        displayName: data.displayName || data.username,
      },
      session: authData.session,
    };
  },

  async login(data: LoginData) {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) throw error;

    const userId = authData.user?.id;
    if (!userId) {
      throw new Error('Unable to load user profile');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle<ProfilesRow>();

    if (profileError) throw profileError;

    return {
      user: {
        id: userId,
        email: authData.user?.email || '',
        username: profile?.username || '',
        displayName: profile?.display_name || '',
      },
      session: authData.session,
    };
  },

  async getMe() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) throw new Error('No user found');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle<ProfilesRow>();

    if (profileError) throw profileError;

    return {
      user: {
        id: user.id,
        email: user.email || '',
        username: profile?.username || '',
        displayName: profile?.display_name || '',
      },
    };
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },
};

// Projects API using Supabase
export const projectsAPI = {
  async getAll(): Promise<{ projects: ProjectData[]; invitations: ProjectInvitation[] }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: ownedProjectsData, error: ownedError } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false });

    if (ownedError) throw ownedError;

    const ownedProjects = (ownedProjectsData ?? []) as ProjectsRow[];

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle<ProfilesRow>();

    if (profileError) throw profileError;

    let ownerDisplayName =
      user.user_metadata?.display_name || user.email || user.user_metadata?.username || 'Owner';

    if (profile) {
      ownerDisplayName = profile.display_name || profile.username || ownerDisplayName;
    }

    const projects: ProjectData[] =
      ownedProjects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description ?? undefined,
        ownerId: project.owner_id,
        ownerName: ownerDisplayName,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        projectData: project.project_data,
        access: {
          role: 'owner',
          status: 'active',
        },
      })) ?? [];

    return {
      projects,
      invitations: [], // TODO: Implement invitations
    };
  },

  async getById(projectId: string): Promise<{ project: ProjectData }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle<ProjectsRow>();

    if (error) throw error;
    if (!project) throw new Error('Project not found');

    let ownerName =
      project.owner_id === user.id
        ? user.user_metadata?.display_name || user.email || user.user_metadata?.username || ''
        : '';

    if (!ownerName) {
      const { data: ownerProfile, error: ownerProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', project.owner_id)
        .maybeSingle<ProfilesRow>();

      if (ownerProfileError) throw ownerProfileError;
      ownerName = ownerProfile?.display_name || ownerProfile?.username || ownerName;
    }

    return {
      project: {
        id: project.id,
        name: project.name,
        description: project.description ?? undefined,
        ownerId: project.owner_id,
        ownerName,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        projectData: project.project_data,
        access: {
          role: project.owner_id === user.id ? 'owner' : 'viewer',
          status: 'active',
        },
      },
    };
  },

  async create(name: string, description?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const newProject: ProjectsInsert = {
      name,
      description: description ?? null,
      owner_id: user.id,
      project_data: {
        nodes: [],
        edges: [],
        phases: [],
        viewSettings: {
          currentView: 'whiteboard',
          zoom: 1,
          pan: { x: 0, y: 0 },
          snapToGrid: true,
          gridSize: 20,
          showGrid: true,
        },
        filters: {
          types: [],
          statuses: [],
          assignees: [],
          disciplines: [],
          tags: [],
          phases: [],
          blockedOnly: false,
          customPresets: [],
        },
      },
    };

    const { data: project, error } = await supabase
      .from('projects')
      .insert(newProject)
      .select()
      .single<ProjectsRow>();

    if (error) throw error;
    if (!project) throw new Error('Failed to create project');

    return {
      message: 'Project created successfully',
      project: {
        id: project.id,
        name: project.name,
        description: project.description ?? undefined,
        ownerId: project.owner_id,
        projectData: project.project_data,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        access: {
          role: 'owner',
          status: 'active',
        },
      },
    };
  },

  async update(projectId: string, projectData: any, metadata?: { name?: string; description?: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const updateData: ProjectsUpdate = {
      project_data: projectData,
      updated_at: new Date().toISOString(),
    };

    if (metadata?.name !== undefined) {
      updateData.name = metadata.name;
    }
    if (metadata?.description !== undefined) {
      updateData.description = metadata.description ?? null;
    }

    const { error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .eq('owner_id', user.id);

    if (error) throw error;

    return { message: 'Project updated successfully' };
  },

  async delete(projectId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('owner_id', user.id);

    if (error) throw error;

    return { message: 'Project deleted successfully' };
  },

  async share(projectId: string, userEmail: string, role: string = 'viewer') {
    // TODO: Implement project sharing
    return {
      message: 'Project sharing not yet implemented',
      member: null as any,
      invitation: null as any,
    };
  },

  async getMembers(projectId: string) {
    // TODO: Implement get members
    return {
      owner: null,
      members: [],
    };
  },

  async updateMember(projectId: string, memberId: string, updates: Partial<Pick<ProjectMember, 'role' | 'status'>>) {
    // TODO: Implement update member
    return { message: 'Update member not yet implemented' };
  },

  async removeMember(projectId: string, memberId: string) {
    // TODO: Implement remove member
    return { message: 'Remove member not yet implemented' };
  },

  async listInvitations() {
    // TODO: Implement list invitations
    return { invitations: [] };
  },

  async respondToInvitation(token: string, action: 'accept' | 'decline') {
    // TODO: Implement respond to invitation
    return { message: 'Respond to invitation not yet implemented' };
  },

  async getActivity(projectId: string) {
    // TODO: Implement get activity
    return { activity: [] };
  },

  async getComments(projectId: string) {
    // TODO: Implement get comments
    return { comments: [] };
  },

  async addComment(projectId: string, input: { body: string; nodeId?: string; type?: string }) {
    // TODO: Implement add comment
    return { message: 'Add comment not yet implemented', comment: null as any };
  },

  async updateComment(projectId: string, commentId: string, body: string) {
    // TODO: Implement update comment
    return { message: 'Update comment not yet implemented' };
  },

  async deleteComment(projectId: string, commentId: string) {
    // TODO: Implement delete comment
    return { message: 'Delete comment not yet implemented' };
  },
};
