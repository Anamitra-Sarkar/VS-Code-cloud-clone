import { auth } from './firebase';
import type { Workspace, FileNode } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7860';

function enc(value: string): string {
  return enc(value);
}

async function getToken(): Promise<string> {
  if (!auth) throw new Error('Firebase not initialized');
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || 'API request failed');
  }
  return res.json();
}

export const apiClient = {
  // Auth
  verifyAuth: async (token: string) =>
    fetch(`${BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }).then((r) => r.json()),

  // Workspaces
  listWorkspaces: () => request<Workspace[]>('/workspaces'),
  getWorkspace: (id: string) => request<Workspace>(`/workspaces/${enc(id)}`),
  createWorkspace: (data: { name: string; language: string; template: string }) =>
    request<Workspace>('/workspaces', { method: 'POST', body: JSON.stringify(data) }),
  deleteWorkspace: (id: string) =>
    request<void>(`/workspaces/${enc(id)}`, { method: 'DELETE' }),

  // Files
  getFileTree: (workspaceId: string) =>
    request<FileNode[]>(`/workspaces/${enc(workspaceId)}/files`),
  getFileContent: (workspaceId: string, path: string) =>
    request<{ content: string }>(
      `/workspaces/${enc(workspaceId)}/files/${enc(path)}`
    ),
  saveFile: (workspaceId: string, path: string, content: string) =>
    request<void>(
      `/workspaces/${enc(workspaceId)}/files/${enc(path)}`,
      { method: 'PUT', body: JSON.stringify({ content }) }
    ),
  createFile: (workspaceId: string, path: string, type: 'file' | 'directory') =>
    request<void>(`/workspaces/${enc(workspaceId)}/files`, {
      method: 'POST',
      body: JSON.stringify({ path, type }),
    }),
  deleteFile: (workspaceId: string, path: string) =>
    request<void>(
      `/workspaces/${enc(workspaceId)}/files/${enc(path)}`,
      { method: 'DELETE' }
    ),

  // AI / LLM
  sendMessage: async (
    workspaceId: string,
    message: string,
    context?: { file?: string; code?: string; language?: string }
  ) => {
    const token = await getToken();
    return fetch(`${BASE_URL}/llm/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ workspaceId, message, context }),
    });
  },

  executeAgent: async (
    workspaceId: string,
    action: string,
    context?: Record<string, unknown>
  ) => {
    const token = await getToken();
    return fetch(`${BASE_URL}/llm/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ workspaceId, action, context }),
    });
  },

  // Git
  getGitStatus: (workspaceId: string) =>
    request<{
      branch: string;
      staged: string[];
      modified: string[];
      untracked: string[];
      ahead: number;
      behind: number;
    }>(`/workspaces/${enc(workspaceId)}/git/status`),
  gitCommit: (workspaceId: string, message: string) =>
    request<void>(`/workspaces/${enc(workspaceId)}/git/commit`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  gitStage: (workspaceId: string, files: string[]) =>
    request<void>(`/workspaces/${enc(workspaceId)}/git/stage`, {
      method: 'POST',
      body: JSON.stringify({ files }),
    }),

  // Terminal WebSocket URL
  getTerminalWsUrl: (workspaceId: string) =>
    `${BASE_URL.replace(/^http/, 'ws')}/workspaces/${enc(workspaceId)}/terminal`,
};
