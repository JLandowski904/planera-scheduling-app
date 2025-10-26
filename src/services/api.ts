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

// (All local fetch-based helpers removed; Supabase API is used instead)

// Removed unused local authAPIImpl (Supabase API is used)

// Removed unused local projectsAPIImpl (Supabase API is used)

// Use Supabase API instead of Express backend
export { authAPI, projectsAPI } from './supabaseApi';

// Optional: socket server base URL for realtime via socket.io (not Supabase)
// Leave empty in Vercel/Supabase-only deployments to disable socket.io.
export const socketBaseUrl = process.env.REACT_APP_SOCKET_URL || '';
