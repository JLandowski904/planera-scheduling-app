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

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
}

export interface ProjectAccess {
  role: 'owner' | 'editor' | 'viewer';
  status: 'active' | 'invited' | string;
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

export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerName?: string;
  createdAt?: string;
  updatedAt?: string;
  projectData?: any;
  access?: ProjectAccess;
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

export interface ProjectActivityItem {
  id: string;
  projectId: string;
  userId: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  timestamp: string;
  actor: {
    displayName: string;
    username: string;
  };
}

export interface ProjectComment {
  id: string;
  projectId: string;
  nodeId?: string | null;
  authorId: string;
  body: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  author: {
    displayName: string;
    username: string;
  };
}

type Json = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

const AUTH_TOKEN_KEY = 'authToken';
const USER_STORAGE_KEY = 'user';
const DEFAULT_API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const API_BASE_URL = DEFAULT_API_BASE.replace(/\/$/, '');

const emitAuthChange = (isAuthenticated: boolean) => {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return;
  }
  window.dispatchEvent(
    new CustomEvent('planner:auth-changed', {
      detail: { isAuthenticated },
    })
  );
};

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const getAuthToken = (): string | null => {
  const storage = getStorage();
  return storage?.getItem(AUTH_TOKEN_KEY) ?? null;
};

const setAuthToken = (token: string) => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(AUTH_TOKEN_KEY, token);
  emitAuthChange(true);
};

const clearAuthToken = () => {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(AUTH_TOKEN_KEY);
  emitAuthChange(false);
};

const cacheUser = (user: User) => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

const getCachedUser = (): User | null => {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    storage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

const clearCachedUser = () => {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(USER_STORAGE_KEY);
};

const parseResponse = async (response: Response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

interface RequestOptions {
  method?: string;
  body?: Json | FormData;
  headers?: Record<string, string>;
  auth?: boolean;
}

const apiFetch = async <T = any>(
  path: string,
  { method = 'GET', body, headers = {}, auth = true }: RequestOptions = {}
): Promise<T> => {
  const requestHeaders = new Headers(headers);
  const config: RequestInit = {
    method,
    headers: requestHeaders,
  };

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (body !== undefined) {
    if (!isFormData && typeof body !== 'string') {
      requestHeaders.set('Content-Type', 'application/json');
      config.body = JSON.stringify(body);
    } else {
      config.body = body as BodyInit;
    }
  }

  if (auth) {
    const token = getAuthToken();
    if (!token) {
      throw new Error('You must be signed in to continue.');
    }
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, config);

  const payload = await parseResponse(response);
  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'error' in payload && payload.error) ||
      (payload && typeof payload === 'object' && 'message' in payload && payload.message) ||
      response.statusText ||
      'Request failed';
    throw new Error(String(message));
  }

  return payload as T;
};

const buildSession = (token: string, user: User) => ({
  access_token: token,
  token_type: 'bearer',
  user: {
    id: user.id,
    email: user.email,
  },
});

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const authAPIImpl = {
  async signup(data: SignupData) {
    const payload = await apiFetch<{ user: User; token: string }>('/api/auth/signup', {
      method: 'POST',
      body: {
        email: normalizeEmail(data.email),
        username: data.username.trim(),
        password: data.password,
        displayName: data.displayName?.trim(),
      },
      auth: false,
    });

    setAuthToken(payload.token);
    cacheUser(payload.user);

    return {
      user: payload.user,
      session: buildSession(payload.token, payload.user),
    };
  },

  async login(data: LoginData) {
    const payload = await apiFetch<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: {
        email: normalizeEmail(data.email),
        password: data.password,
      },
      auth: false,
    });

    setAuthToken(payload.token);
    cacheUser(payload.user);

    return {
      user: payload.user,
      session: buildSession(payload.token, payload.user),
    };
  },

  async getMe() {
    const payload = await apiFetch<{ user: User }>('/api/auth/me');
    cacheUser(payload.user);
    return payload;
  },

  async logout() {
    clearAuthToken();
    clearCachedUser();
    return Promise.resolve();
  },

  async getSession() {
    const token = getAuthToken();
    const user = getCachedUser();
    if (!token || !user) {
      return null;
    }
    return buildSession(token, user);
  },
};

const projectsAPIImpl = {
  async getAll(): Promise<{ projects: ProjectData[]; invitations: ProjectInvitation[] }> {
    const payload = await apiFetch<{ projects: ProjectData[]; invitations?: ProjectInvitation[] }>(
      '/api/projects'
    );
    return {
      projects: payload.projects ?? [],
      invitations: payload.invitations ?? [],
    };
  },

  async getById(projectId: string): Promise<{ project: ProjectData }> {
    return apiFetch<{ project: ProjectData }>(`/api/projects/${projectId}`);
  },

  async create(name: string, description?: string) {
    return apiFetch<{ project: ProjectData; message: string }>('/api/projects', {
      method: 'POST',
      body: { name, description },
    });
  },

  async update(projectId: string, projectData: any, metadata?: { name?: string; description?: string }) {
    return apiFetch<{ message: string }>(`/api/projects/${projectId}`, {
      method: 'PUT',
      body: {
        projectData,
        name: metadata?.name,
        description: metadata?.description,
      },
    });
  },

  async delete(projectId: string) {
    return apiFetch<{ message: string }>(`/api/projects/${projectId}`, {
      method: 'DELETE',
    });
  },

  async share(projectId: string, userEmail: string, role: string = 'viewer') {
    return apiFetch<{ message: string; member?: ProjectMember; invitation?: ProjectInvitation }>(
      `/api/projects/${projectId}/share`,
      {
        method: 'POST',
        body: { userEmail, role },
      }
    );
  },

  async getMembers(projectId: string) {
    return apiFetch<{ owner: ProjectMember | null; members: ProjectMember[] }>(
      `/api/projects/${projectId}/members`
    );
  },

  async updateMember(projectId: string, memberId: string, updates: Partial<Pick<ProjectMember, 'role' | 'status'>>) {
    return apiFetch<{ message: string }>(`/api/projects/${projectId}/members/${memberId}`, {
      method: 'PATCH',
      body: updates,
    });
  },

  async removeMember(projectId: string, memberId: string) {
    return apiFetch<{ message: string }>(`/api/projects/${projectId}/members/${memberId}`, {
      method: 'DELETE',
    });
  },

  async listInvitations() {
    return apiFetch<{ invitations: ProjectInvitation[] }>('/api/projects/invitations');
  },

  async respondToInvitation(token: string, action: 'accept' | 'decline') {
    return apiFetch<{ message: string }>(`/api/projects/invitations/${token}/${action}`, {
      method: 'POST',
    });
  },

  async getActivity(projectId: string) {
    return apiFetch<{ activity: ProjectActivityItem[] }>(`/api/projects/${projectId}/activity`);
  },

  async getComments(projectId: string) {
    return apiFetch<{ comments: ProjectComment[] }>(`/api/projects/${projectId}/comments`);
  },

  async addComment(projectId: string, input: { body: string; nodeId?: string; type?: string }) {
    return apiFetch<{ message: string; comment: ProjectComment }>(`/api/projects/${projectId}/comments`, {
      method: 'POST',
      body: input,
    });
  },

  async updateComment(projectId: string, commentId: string, body: string) {
    return apiFetch<{ message: string }>(`/api/projects/${projectId}/comments/${commentId}`, {
      method: 'PUT',
      body: { body },
    });
  },

  async deleteComment(projectId: string, commentId: string) {
    return apiFetch<{ message: string }>(`/api/projects/${projectId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  },
};

// Use Supabase API instead of Express backend
export { authAPI, projectsAPI } from './supabaseApi';
export const apiBaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
