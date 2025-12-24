import { supabase, type Database } from './supabase';
type ProfilesRow = Database['public']['Tables']['profiles']['Row'];
type ProjectsRow = Database['public']['Tables']['projects']['Row'];
type ProjectsInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectsUpdate = Database['public']['Tables']['projects']['Update'];
type ProjectInvitationRow = Database['public']['Tables']['project_invitations']['Row'];

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
        username:
          profile?.username ||
          (user.user_metadata && (user.user_metadata as any).username) ||
          user.email ||
          '',
        displayName:
          profile?.display_name ||
          (user.user_metadata && (user.user_metadata as any).display_name) ||
          profile?.username ||
          (user.user_metadata && (user.user_metadata as any).username) ||
          user.email ||
          '',
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

  async updateTheme(theme: 'light' | 'dark') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('profiles')
      .update({ theme })
      .eq('id', user.id);

    if (error) throw error;

    return { message: 'Theme updated successfully' };
  },
};

// Projects API using Supabase
export const projectsAPI = {
  async getAll(): Promise<{ projects: ProjectData[]; invitations: ProjectInvitation[] }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Owned projects
    const { data: ownedProjectsData, error: ownedError } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false });
    if (ownedError) throw ownedError;
    const ownedProjects = (ownedProjectsData ?? []) as ProjectsRow[];

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle<ProfilesRow>();

    let ownerDisplayName = user.user_metadata?.display_name || user.email || user.user_metadata?.username || 'Owner';
    if (profile) ownerDisplayName = profile.display_name || profile.username || ownerDisplayName;

    const projects: ProjectData[] = (ownedProjects ?? []).map(project => ({
      id: project.id,
      name: project.name,
      description: project.description ?? undefined,
      ownerId: project.owner_id,
      ownerName: ownerDisplayName,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      projectData: project.project_data,
      access: { role: 'owner', status: 'active' },
    }));

    // Member projects
    const { data: memberRows } = await supabase
      .from('project_members')
      .select('project_id, role')
      .eq('user_id', user.id);
    const memberProjectIds = Array.from(new Set((memberRows ?? []).map(r => r.project_id)));
    for (const projectId of memberProjectIds) {
      if (projects.some(p => p.id === projectId)) continue;
      const { data: p } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle<ProjectsRow>();
      if (!p) continue;

      let ownerDisplayName2 = '';
      const { data: ownerProfile2 } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', p.owner_id)
        .maybeSingle<ProfilesRow>();
      ownerDisplayName2 = ownerProfile2?.display_name || ownerProfile2?.username || ownerDisplayName2;

      const memberRole = (memberRows ?? []).find(r => r.project_id === projectId)?.role as 'viewer' | 'editor' | undefined;
      projects.push({
        id: p.id,
        name: p.name,
        description: p.description ?? undefined,
        ownerId: p.owner_id,
        ownerName: ownerDisplayName2,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        projectData: p.project_data,
        access: { role: (memberRole as any) || 'viewer', status: 'active' },
      });
    }

    // Invitations for current user
    const { data: invitesData, error: invitesError } = await supabase
      .from('project_invitations')
      .select('*')
      .eq('status', 'pending')
      .eq('email', (user.email || '').toLowerCase());
    if (invitesError) throw invitesError;
    const invitations: ProjectInvitation[] = [];
    const invitesTyped = (invitesData ?? []) as ProjectInvitationRow[];
    for (const inv of invitesTyped) {
      let name = '';
      let description: string | undefined = undefined;
      let ownerName = '';
      const { data: p } = await supabase
        .from('projects')
        .select('*')
        .eq('id', inv.project_id)
        .maybeSingle<ProjectsRow>();
      if (p) {
        name = p.name;
        description = p.description ?? undefined;
        const { data: ownerProf } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', p.owner_id)
          .maybeSingle<ProfilesRow>();
        ownerName = ownerProf?.display_name || ownerProf?.username || '';
      }
      invitations.push({
        id: inv.id,
        projectId: inv.project_id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        invitedAt: inv.invited_at,
        token: inv.token,
        name,
        description,
        ownerName,
      });
    }

    return { projects, invitations };
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

    // Determine access role: owner or membership role
    let accessRole: 'owner' | 'editor' | 'viewer' = project.owner_id === user.id ? 'owner' : 'viewer';
    if (project.owner_id !== user.id) {
      const { data: memberRow } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', project.id)
        .eq('user_id', user.id)
        .maybeSingle();
      accessRole = (memberRow?.role as any) || 'viewer';
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
          role: accessRole,
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

    // Rely on RLS to authorize owners and editors; don't force owner_id match here
    const { error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId);

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Basic validation
    const email = userEmail.trim().toLowerCase();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new Error('Please enter a valid email address');
    }

    // Load project for metadata
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle<ProjectsRow>();
    if (!project) throw new Error('Project not found');

    // Create invitation in Supabase
    const token = `inv_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    const { data: newInvite, error: inviteError } = await supabase
      .from('project_invitations')
      .insert({
        project_id: projectId,
        email,
        role,
        status: 'pending',
        token,
        inviter_id: user.id,
      })
      .select('*')
      .maybeSingle();
    if (inviteError) throw inviteError;

    const newInviteRow = newInvite as ProjectInvitationRow;
    const invitation: ProjectInvitation = {
      id: newInviteRow.id,
      projectId: projectId,
      email,
      role,
      status: 'pending',
      invitedAt: newInviteRow.invited_at,
      token,
      name: project.name,
      description: project.description ?? undefined,
      ownerName: user.user_metadata?.display_name || user.email || user.user_metadata?.username || 'Owner',
    };

    return { message: 'Invitation sent', member: null as any, invitation };
  },

  async getMembers(projectId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Fetch project to determine owner
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle<ProjectsRow>();
    if (!project) throw new Error('Project not found');

    // Owner profile
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', project.owner_id)
      .maybeSingle<ProfilesRow>();
    const owner: ProjectMember | null = {
      id: project.owner_id,
      username: ownerProfile?.username || '',
      displayName: ownerProfile?.display_name || ownerProfile?.username || 'Owner',
      email: '',
      role: 'owner',
      status: 'active',
      joinedAt: project.created_at,
    };

    // Members from Supabase
    const { data: memberRows, error: membersError } = await supabase
      .from('project_members')
      .select('user_id, role, joined_at')
      .eq('project_id', projectId);
    if (membersError) throw membersError;

    const members: ProjectMember[] = [];
    for (const m of memberRows ?? []) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', m.user_id)
        .maybeSingle<ProfilesRow>();
      members.push({
        id: m.user_id,
        username: prof?.username || '',
        displayName: prof?.display_name || prof?.username || '',
        email: '',
        role: m.role,
        status: 'active',
        joinedAt: m.joined_at,
      });
    }

    return { owner, members };
  },

  async updateMember(projectId: string, memberId: string, updates: Partial<Pick<ProjectMember, 'role' | 'status'>>) {
    const { role } = updates;
    if (!role) return { message: 'No changes' };
    const { error } = await supabase
      .from('project_members')
      .update({ role })
      .eq('project_id', projectId)
      .eq('user_id', memberId);
    if (error) throw error;
    return { message: 'Member updated' };
  },

  async removeMember(projectId: string, memberId: string) {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', memberId);
    if (error) throw error;
    return { message: 'Member removed' };
  },

  async listInvitations() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('project_invitations')
      .select('*')
      .eq('status', 'pending')
      .eq('email', (user.email || '').toLowerCase());
    if (error) throw error;
    const invitations: ProjectInvitation[] = [];
    const dataTyped = (data ?? []) as ProjectInvitationRow[];
    for (const inv of dataTyped) {
      let name = '';
      let description: string | undefined = undefined;
      let ownerName = '';
      const { data: p } = await supabase
        .from('projects')
        .select('*')
        .eq('id', inv.project_id)
        .maybeSingle<ProjectsRow>();
      if (p) {
        name = p.name;
        description = p.description ?? undefined;
        const { data: ownerProf } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', p.owner_id)
          .maybeSingle<ProfilesRow>();
        ownerName = ownerProf?.display_name || ownerProf?.username || '';
      }
      invitations.push({
        id: inv.id,
        projectId: inv.project_id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        invitedAt: inv.invited_at,
        token: inv.token,
        name,
        description,
        ownerName,
      });
    }
    return { invitations };
  },

  async respondToInvitation(token: string, action: 'accept' | 'decline') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: inv, error } = await supabase
      .from('project_invitations')
      .select('*')
      .eq('token', token)
      .maybeSingle();
    if (error) throw error;
    if (!inv) throw new Error('Invitation not found');
    const invRow = inv as ProjectInvitationRow;

    if (action === 'decline') {
      const { error: updErr } = await supabase
        .from('project_invitations')
        .update({ status: 'declined' })
        .eq('id', invRow.id);
      if (updErr) throw updErr;
      return { message: 'Invitation declined' };
    }

    // Accept: add member and mark accepted
    const { error: memberErr } = await supabase
      .from('project_members')
      .insert({ project_id: invRow.project_id, user_id: user.id, role: invRow.role || 'viewer' });
    if (memberErr && !String(memberErr.message).includes('duplicate')) throw memberErr;

    const { error: updErr } = await supabase
      .from('project_invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invRow.id);
    if (updErr) throw updErr;
    return { message: 'Invitation accepted' };
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
