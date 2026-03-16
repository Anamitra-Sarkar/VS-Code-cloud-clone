export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  language: string;
  template: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  status: 'running' | 'stopped' | 'creating' | 'error';
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
}

export interface EditorTab {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
  isDirty: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  codeBlocks?: CodeBlock[];
}

export interface CodeBlock {
  language: string;
  code: string;
  filename?: string;
}

export interface GitStatus {
  branch: string;
  staged: string[];
  modified: string[];
  untracked: string[];
  ahead: number;
  behind: number;
}

export interface TerminalSession {
  id: string;
  name: string;
  workspaceId: string;
}

export interface AIContext {
  currentFile?: string;
  selectedCode?: string;
  language?: string;
  errors?: string[];
}

export type SidebarView = 'files' | 'git' | 'extensions' | 'ai';

export type QuickAction = 'fix-error' | 'complete' | 'explain' | 'refactor' | 'write-tests';
