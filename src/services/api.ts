const STORAGE_KEY = 'planner_local_db_v1'
const SESSION_KEY = 'planner_local_session_v1'

const DEFAULT_PROJECT_DATA = {
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
}

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

const nowIso = (): string => new Date().toISOString()

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
}

const clone = <T>(value: T): T => {
  if (value === null || value === undefined) {
    return value
  }
  return JSON.parse(JSON.stringify(value))
}

interface StoredUser {
  id: string
  email: string
  emailLower: string
  username: string
  displayName: string
  password: string
  createdAt: string
  updatedAt: string
}

interface StoredProjectMember {
  userId: string
  role: string
  joinedAt: string
}

interface StoredProject {
  id: string
  name: string
  description: string
  ownerId: string
  createdAt: string
  updatedAt: string
  projectData: any
  members: StoredProjectMember[]
}

interface DatabaseState {
  users: Record<string, StoredUser>
  projects: Record<string, StoredProject>
}

interface SessionState {
  userId: string
  accessToken: string
}

const defaultState = (): DatabaseState => ({
  users: {},
  projects: {},
})

const loadState = (): DatabaseState => {
  const storage = getStorage()
  if (!storage) {
    return defaultState()
  }

  const raw = storage.getItem(STORAGE_KEY)
  if (!raw) {
    const initial = defaultState()
    storage.setItem(STORAGE_KEY, JSON.stringify(initial))
    return initial
  }

  try {
    const parsed = JSON.parse(raw) as DatabaseState
    return {
      users: parsed.users || {},
      projects: parsed.projects || {},
    }
  } catch {
    const reset = defaultState()
    storage.setItem(STORAGE_KEY, JSON.stringify(reset))
    return reset
  }
}

const loadSession = (): SessionState | null => {
  const storage = getStorage()
  if (!storage) {
    return null
  }

  const raw = storage.getItem(SESSION_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as SessionState
  } catch {
    storage.removeItem(SESSION_KEY)
    return null
  }
}

let dbState: DatabaseState = loadState()
let sessionState: SessionState | null = loadSession()
const persistState = () => {
  const storage = getStorage()
  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(dbState))
  }
}

const persistSession = () => {
  const storage = getStorage()
  if (storage) {
    if (sessionState) {
      storage.setItem(SESSION_KEY, JSON.stringify(sessionState))
    } else {
      storage.removeItem(SESSION_KEY)
    }
  }
}

const emitAuthChange = (isAuthenticated: boolean) => {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return
  }
  window.dispatchEvent(
    new CustomEvent('planner:auth-changed', {
      detail: { isAuthenticated },
    })
  )
}

const updateUserCache = (user: User, token: string) => {
  const storage = getStorage()
  if (!storage) return
  storage.setItem('authToken', token)
  storage.setItem('user', JSON.stringify(user))
  emitAuthChange(true)
}

const clearUserCache = () => {
  const storage = getStorage()
  if (!storage) return
  storage.removeItem('authToken')
  storage.removeItem('user')
  emitAuthChange(false)
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase()

const getUserByEmail = (email: string): StoredUser | undefined => {
  const normalized = normalizeEmail(email)
  return Object.values(dbState.users).find(user => user.emailLower === normalized)
}

const getUserById = (userId: string): StoredUser | undefined => dbState.users[userId]

const ensureProject = (projectId: string): StoredProject => {
  const project = dbState.projects[projectId]
  if (!project) {
    throw new Error('Project not found')
  }
  return project
}

const ensureOwnerMember = (project: StoredProject) => {
  const hasOwner = project.members.some(member => member.userId === project.ownerId)
  if (!hasOwner) {
    project.members.unshift({
      userId: project.ownerId,
      role: 'owner',
      joinedAt: project.createdAt,
    })
  }
}

const createSessionForUser = (user: StoredUser) => {
  const token = `local_${generateId()}`
  sessionState = {
    userId: user.id,
    accessToken: token,
  }
  persistSession()

  const publicSession = {
    access_token: token,
    token_type: 'bearer',
    expires_in: 0,
    expires_at: 0,
    refresh_token: token,
    user: {
      id: user.id,
      email: user.email,
    },
  }

  const publicUser: User = {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
  }

  updateUserCache(publicUser, token)

  return {
    session: publicSession,
    user: publicUser,
  }
}

const getCurrentUser = (): StoredUser | null => {
  if (!sessionState) return null
  const user = getUserById(sessionState.userId)
  if (!user) {
    sessionState = null
    persistSession()
    clearUserCache()
    return null
  }
  return user
}

const requireAuthenticatedUser = (): StoredUser => {
  const user = getCurrentUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  return user
}

const projectToProjectData = (project: StoredProject): ProjectData => {
  ensureOwnerMember(project)
  const owner = getUserById(project.ownerId)
  const members = project.members.map(member => ({
    userId: member.userId,
    role: member.role,
  }))

  return {
    id: project.id,
    name: project.name,
    description: project.description || undefined,
    ownerId: project.ownerId,
    ownerName: owner?.displayName || owner?.username || owner?.email || '',
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    projectData: clone(project.projectData),
    members,
  }
}

export interface LoginData {
  email: string
  password: string
}

export interface SignupData {
  email: string
  username: string
  password: string
  displayName?: string
}

export interface User {
  id: string
  email: string
  username: string
  displayName: string
}

export interface ProjectMember {
  userId: string
  role: string
}

export interface ProjectData {
  id: string
  name: string
  description?: string
  ownerId: string
  ownerName?: string
  createdAt?: string
  updatedAt?: string
  projectData?: any
  members?: ProjectMember[]
}

export const authAPI = {
  signup: async (data: SignupData) => {
    const emailLower = normalizeEmail(data.email)
    if (getUserByEmail(emailLower)) {
      throw new Error('Email already in use')
    }

    const id = generateId()
    const timestamp = nowIso()

    const storedUser: StoredUser = {
      id,
      email: data.email.trim(),
      emailLower,
      username: data.username.trim(),
      displayName: data.displayName?.trim() || data.username.trim(),
      password: data.password,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    dbState.users[id] = storedUser
    persistState()

    const { user, session } = createSessionForUser(storedUser)

    return {
      user,
      session,
    }
  },

  login: async (data: LoginData) => {
    const user = getUserByEmail(data.email)
    if (!user || user.password !== data.password) {
      throw new Error('Invalid email or password')
    }

    const { user: publicUser, session } = createSessionForUser(user)

    return {
      user: publicUser,
      session,
    }
  },

  getMe: async () => {
    const user = requireAuthenticatedUser()
    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
      },
    }
  },

  logout: async () => {
    sessionState = null
    persistSession()
    clearUserCache()
  },

  getSession: async () => {
    if (!sessionState) {
      return null
    }

    const user = getUserById(sessionState.userId)
    if (!user) {
      sessionState = null
      persistSession()
      clearUserCache()
      return null
    }

    return {
      access_token: sessionState.accessToken,
      token_type: 'bearer',
      expires_in: 0,
      expires_at: 0,
      refresh_token: sessionState.accessToken,
      user: {
        id: user.id,
        email: user.email,
      },
    }
  },
}

export const projectsAPI = {
  getAll: async () => {
    const projects = Object.values(dbState.projects)
      .sort((a, b) => {
        if (!a.updatedAt && !b.updatedAt) return 0
        if (!a.updatedAt) return 1
        if (!b.updatedAt) return -1
        return b.updatedAt.localeCompare(a.updatedAt)
      })
      .map(project => projectToProjectData(project))

    return { projects }
  },

  getById: async (projectId: string) => {
    const project = ensureProject(projectId)
    return {
      project: projectToProjectData(project),
    }
  },

  create: async (name: string, description?: string) => {
    const user = requireAuthenticatedUser()
    const id = generateId()
    const timestamp = nowIso()

    const storedProject: StoredProject = {
      id,
      name: name.trim(),
      description: description?.trim() || '',
      ownerId: user.id,
      createdAt: timestamp,
      updatedAt: timestamp,
      projectData: clone(DEFAULT_PROJECT_DATA),
      members: [
        {
          userId: user.id,
          role: 'owner',
          joinedAt: timestamp,
        },
      ],
    }

    dbState.projects[id] = storedProject
    persistState()

    return {
      project: projectToProjectData(storedProject),
    }
  },

  update: async (projectId: string, projectData: any) => {
    const user = requireAuthenticatedUser()
    const project = ensureProject(projectId)

    if (project.ownerId !== user.id) {
      throw new Error('Only the owner can update this project')
    }

    project.projectData = clone(projectData)
    project.updatedAt = nowIso()

    persistState()

    return { success: true }
  },

  delete: async (projectId: string) => {
    const user = requireAuthenticatedUser()
    const project = ensureProject(projectId)

    if (project.ownerId !== user.id) {
      throw new Error('Only the owner can delete this project')
    }

    delete dbState.projects[projectId]
    persistState()

    return { success: true }
  },

  share: async (projectId: string, userEmail: string, role: string = 'viewer') => {
    const owner = requireAuthenticatedUser()
    const project = ensureProject(projectId)

    if (project.ownerId !== owner.id) {
      throw new Error('Only the owner can share this project')
    }

    const targetUser = getUserByEmail(userEmail)
    if (!targetUser) {
      throw new Error('User not found')
    }

    if (targetUser.id === owner.id) {
      return { success: true }
    }

    const existing = project.members.find(member => member.userId === targetUser.id)
    const joinedAt = nowIso()

    if (existing) {
      existing.role = role
      existing.joinedAt = existing.joinedAt || joinedAt
    } else {
      project.members.push({
        userId: targetUser.id,
        role,
        joinedAt,
      })
    }

    project.updatedAt = nowIso()
    persistState()

    return { success: true }
  },

  getMembers: async (projectId: string) => {
    const project = ensureProject(projectId)
    ensureOwnerMember(project)

    const members = project.members.map(member => {
      const user = getUserById(member.userId)
      return {
        id: member.userId,
        username: user?.username || '',
        displayName: user?.displayName || user?.username || user?.email || '',
        role: member.role,
        joinedAt: member.joinedAt,
      }
    })

    return { members }
  },

  removeMember: async (projectId: string, memberId: string) => {
    const owner = requireAuthenticatedUser()
    const project = ensureProject(projectId)

    if (project.ownerId !== owner.id) {
      throw new Error('Only the owner can modify members')
    }

    if (memberId === owner.id) {
      throw new Error('The owner cannot be removed from the project')
    }

    project.members = project.members.filter(member => member.userId !== memberId)
    project.updatedAt = nowIso()
    persistState()

    return { success: true }
  },
}
