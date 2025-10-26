import React, { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { io, Socket } from 'socket.io-client';
import {
  projectsAPI,
  ProjectActivityItem,
  ProjectComment,
  ProjectMember,
  socketBaseUrl,
} from '../services/api';
import {
  List,
  MessageSquare,
  Users,
  X,
  Loader2,
  Send,
  UserPlus,
  Trash2,
} from 'lucide-react';

interface ProjectCollaborationPanelProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  currentRole: 'owner' | 'editor' | 'viewer';
  currentUserId: string | null;
  initialTab?: CollaborationTab;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  editor: 'Editor',
  viewer: 'Viewer',
};

const TAB_CONFIG = [
  { id: 'activity' as const, label: 'Activity', icon: List },
  { id: 'comments' as const, label: 'Comments', icon: MessageSquare },
  { id: 'members' as const, label: 'Members', icon: Users },
];

type CollaborationTab = (typeof TAB_CONFIG)[number]['id'];

type LoadingState = {
  loading: boolean;
  error: string;
};

const ProjectCollaborationPanel: React.FC<ProjectCollaborationPanelProps> = ({
  projectId,
  projectName,
  isOpen,
  onClose,
  currentRole,
  currentUserId,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<CollaborationTab>(initialTab ?? 'activity');
  const [activity, setActivity] = useState<ProjectActivityItem[]>([]);
  const [activityState, setActivityState] = useState<LoadingState>({ loading: false, error: '' });
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [commentsState, setCommentsState] = useState<LoadingState>({ loading: false, error: '' });
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [owner, setOwner] = useState<ProjectMember | null>(null);
  const [membersState, setMembersState] = useState<LoadingState>({ loading: false, error: '' });

  const [commentDraft, setCommentDraft] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'viewer' | 'editor'>('viewer');
  const [shareMessage, setShareMessage] = useState('');
  const [shareLoading, setShareLoading] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const isOwner = currentRole === 'owner';

  const handleError = (error: unknown) =>
    error instanceof Error ? error.message : 'Something went wrong';

  const loadActivity = useCallback(async () => {
    setActivityState({ loading: true, error: '' });
    try {
      const { activity: items } = await projectsAPI.getActivity(projectId);
      setActivity(items);
      setActivityState({ loading: false, error: '' });
    } catch (err) {
      setActivityState({ loading: false, error: handleError(err) });
    }
  }, [projectId]);

  const loadComments = useCallback(async () => {
    setCommentsState({ loading: true, error: '' });
    try {
      const { comments: items } = await projectsAPI.getComments(projectId);
      setComments(items);
      setCommentsState({ loading: false, error: '' });
    } catch (err) {
      setCommentsState({ loading: false, error: handleError(err) });
    }
  }, [projectId]);

  const loadMembers = useCallback(async () => {
    setMembersState({ loading: true, error: '' });
    try {
      const { owner: ownerRecord, members: memberRecords } = await projectsAPI.getMembers(projectId);
      setOwner(ownerRecord);
      setMembers(memberRecords);
      setMembersState({ loading: false, error: '' });
    } catch (err) {
      setMembersState({ loading: false, error: handleError(err) });
    }
  }, [projectId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    loadActivity();
    loadComments();
    loadMembers();
  }, [isOpen, loadActivity, loadComments, loadMembers]);

  useEffect(() => {
    if (!isOpen || !socketBaseUrl) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Establish socket connection
    const socket = io(socketBaseUrl, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    // Subscribe to project room
    socket.emit('joinProject', { projectId });

    socket.on('project:activity', (item: ProjectActivityItem) => {
      setActivity(prev => [item, ...prev].slice(0, 100));
    });

    socket.on('project:comment', (comment: ProjectComment) => {
      setComments(prev => [comment, ...prev]);
    });

    socket.on('project:member:updated', () => {
      loadMembers();
    });

    return () => {
      socket.emit('leaveProject', { projectId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isOpen, projectId, loadMembers]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentDraft.trim()) return;

    try {
      setSubmittingComment(true);
      const { comment } = await projectsAPI.addComment(projectId, { body: commentDraft.trim() });
      setComments(prev => [comment, ...prev]);
      setCommentDraft('');
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(errorMessage(err));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;

    try {
      setShareLoading(true);
      setShareMessage('');
      const res = await projectsAPI.share(projectId, shareEmail.trim(), shareRole);
      if (res.member) {
        setShareMessage(`Shared with ${res.member.displayName || res.member.username}`);
      } else if (res.invitation) {
        setShareMessage(`Invitation sent to ${res.invitation.email}`);
      } else {
        setShareMessage('Share updated');
      }
      setShareEmail('');
      await loadMembers();
    } catch (err) {
      setShareMessage(errorMessage(err));
    } finally {
      setShareLoading(false);
    }
  };

  const errorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong');

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await projectsAPI.removeMember(projectId, memberId);
      await loadMembers();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(errorMessage(err));
    }
  };

  if (!isOpen) {
    return null;
  }

  const renderActivity = () => (
    <div className='p-4 space-y-3'>
      {activityState.loading ? (
        <div className='text-sm text-gray-500'>Loading activity...</div>
      ) : activityState.error ? (
        <div className='text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2'>
          {activityState.error}
        </div>
      ) : activity.length === 0 ? (
        <div className='text-sm text-gray-500'>No recent activity.</div>
      ) : (
        <ul className='space-y-3'>
          {activity.map(item => (
            <li key={item.id} className='bg-white border border-gray-200 rounded-lg p-3'>
              <div className='flex items-center justify-between'>
                <div className='font-medium text-sm text-gray-800'>
                  {item.actor.displayName || item.actor.username}
                </div>
                <div className='text-xs text-gray-400'>
                  {new Date(item.timestamp).toLocaleString()}
                </div>
              </div>
              <div className='text-sm text-gray-700 mt-1'>
                {item.action}
                {item.entityType && (
                  <span className='text-gray-500'>
                    {' '}
                    on {item.entityType} {item.entityId}
                  </span>
                )}
              </div>
              {item.details && (
                <pre className='mt-2 text-xs bg-gray-50 rounded p-2 overflow-auto'>
                  {JSON.stringify(item.details, null, 2)}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const renderComments = () => (
    <div className='h-full flex flex-col'>
      <div className='flex-1 overflow-y-auto p-4 space-y-3'>
        {commentsState.loading ? (
          <div className='text-sm text-gray-500'>Loading comments...</div>
        ) : commentsState.error ? (
          <div className='text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2'>
            {commentsState.error}
          </div>
        ) : comments.length === 0 ? (
          <div className='text-sm text-gray-500'>No comments yet.</div>
        ) : (
          <ul className='space-y-3'>
            {comments.map(comment => (
              <li key={comment.id} className='bg-white border border-gray-200 rounded-lg p-3'>
                <div className='flex items-center justify-between'>
                  <div className='font-medium text-sm text-gray-800'>
                    {comment.author.displayName || comment.author.username}
                  </div>
                  <div className='text-xs text-gray-400'>
                    {new Date(comment.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className='text-sm text-gray-700 mt-1 whitespace-pre-wrap'>
                  {comment.body}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleCommentSubmit} className='border-t border-gray-200 p-3'>
        <div className='flex items-center gap-2'>
          <input
            type='text'
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            placeholder='Add a comment...'
            className='flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          <button
            type='submit'
            disabled={submittingComment}
            className='inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {submittingComment ? <Loader2 className='w-4 h-4 animate-spin' /> : <Send className='w-4 h-4' />}
            Send
          </button>
        </div>
      </form>
    </div>
  );

  const renderMembers = () => (
    <div className='h-full overflow-y-auto'>
      <div className='p-4'>
        <div className='font-medium text-gray-700'>Owner</div>
        <div className='mt-2 bg-white border border-gray-200 rounded-lg p-3'>
          {owner ? (
            <div>
              <div className='font-medium text-sm text-gray-800'>
                {owner.displayName || owner.username}
              </div>
              <div className='text-xs text-gray-400'>{owner.email}</div>
              <div className='text-xs text-gray-500 mt-1'>Owner</div>
            </div>
          ) : (
            <div className='text-sm text-gray-500'>Loading owner...</div>
          )}
        </div>

        <div className='mt-6'>
          <div className='font-medium text-gray-700'>Members</div>
          {membersState.loading ? (
            <div className='text-sm text-gray-500 mt-2'>Loading members...</div>
          ) : membersState.error ? (
            <div className='text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mt-2'>
              {membersState.error}
            </div>
          ) : members.length === 0 ? (
            <div className='text-sm text-gray-500 mt-2'>No collaborators yet.</div>
          ) : (
            <ul className='mt-2 space-y-3'>
              {members.map(member => (
                <li key={member.id} className='flex items-center justify-between'>
                  <div>
                    <div className='font-medium text-sm text-gray-800'>
                      {member.displayName || member.username}
                    </div>
                    <div className='text-xs text-gray-400'>{member.email}</div>
                    <div className='text-xs text-gray-500 mt-1'>
                      {ROLE_LABELS[member.role] || member.role}
                      {member.status !== 'active' && ` - ${member.status}`}
                    </div>
                  </div>
                  {isOwner && (
                    <button
                      type='button'
                      onClick={() => handleRemoveMember(member.id)}
                      className='text-gray-400 hover:text-red-500'
                      title='Remove member'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {isOwner && (
        <form onSubmit={handleShareSubmit} className='p-4 space-y-3 border-b border-gray-200'>
          <h3 className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
            <UserPlus className='w-4 h-4' />
            Invite collaborator
          </h3>
          <input
            type='email'
            value={shareEmail}
            onChange={(event) => setShareEmail(event.target.value)}
            placeholder='colleague@example.com'
            className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
          <select
            value={shareRole}
            onChange={(event) => setShareRole(event.target.value as 'viewer' | 'editor')}
            className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value='viewer'>Viewer - can review plans</option>
            <option value='editor'>Editor - can modify schedules</option>
          </select>
          <button
            type='submit'
            disabled={shareLoading}
            className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {shareLoading ? <Loader2 className='w-4 h-4 animate-spin' /> : <Send className='w-4 h-4' />}
            Send invite
          </button>
          {shareMessage && (
            <div className='text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-md px-3 py-2'>
              {shareMessage}
            </div>
          )}
        </form>
      )}
    </div>
  );

  return (
    <>
      <div
        className='fixed inset-0 bg-slate-900 bg-opacity-50 z-40'
        onClick={onClose}
        role='presentation'
      />
      <div className='fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col'>
        <div className='px-4 py-3 border-b border-gray-200 flex items-center justify-between'>
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>Collaboration</h2>
            <p className='text-xs text-gray-500'>{projectName}</p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='p-2 rounded-full hover:bg-gray-100 text-gray-500'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='flex border-b border-gray-200'>
          {TAB_CONFIG.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <tab.icon className='w-4 h-4' />
              {tab.label}
            </button>
          ))}
        </div>

        <div className='flex-1 overflow-hidden'>
          {activeTab === 'activity' && <div className='h-full overflow-y-auto'>{renderActivity()}</div>}
          {activeTab === 'comments' && renderComments()}
          {activeTab === 'members' && renderMembers()}
        </div>
      </div>
    </>
  );
};

export default ProjectCollaborationPanel;
