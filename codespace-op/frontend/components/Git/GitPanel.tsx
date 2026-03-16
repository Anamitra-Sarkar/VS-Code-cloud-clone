'use client';

import { useState } from 'react';
import {
  GitBranch,
  Check,
  Plus,
  Minus,
  FileQuestion,
  RotateCcw,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  workspaceId: string;
}

interface MockFile {
  name: string;
  status: 'modified' | 'staged' | 'untracked';
}

export default function GitPanel({ workspaceId: _workspaceId }: Props) {
  const [commitMessage, setCommitMessage] = useState('');
  const [files] = useState<MockFile[]>([
    { name: 'src/index.ts', status: 'modified' },
    { name: 'src/utils.ts', status: 'staged' },
    { name: 'README.md', status: 'modified' },
    { name: 'src/new-file.ts', status: 'untracked' },
  ]);

  const staged = files.filter((f) => f.status === 'staged');
  const changes = files.filter((f) => f.status !== 'staged');

  const statusIcon = (status: string) => {
    switch (status) {
      case 'modified':
        return <span className="text-vscode-orange text-xs font-bold">M</span>;
      case 'staged':
        return <Check className="w-3 h-3 text-vscode-green" />;
      case 'untracked':
        return <span className="text-vscode-green text-xs font-bold">U</span>;
      default:
        return <FileQuestion className="w-3 h-3" />;
    }
  };

  return (
    <div className="flex flex-col h-full text-sm">
      {/* Branch */}
      <div className="flex items-center gap-2 px-4 py-2 text-vscode-text-muted">
        <GitBranch className="w-4 h-4" />
        <span>main</span>
        <span className="text-xs opacity-60">↑0 ↓0</span>
      </div>

      {/* Commit input */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Message (Ctrl+Enter to commit)"
            className="flex-1 bg-vscode-input-bg border border-vscode-border rounded px-3 py-1.5 text-xs text-white placeholder-vscode-text-muted"
          />
          <button
            disabled={!commitMessage.trim()}
            className="p-1.5 rounded bg-vscode-accent/20 text-vscode-accent hover:bg-vscode-accent/30 disabled:opacity-30 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Staged Changes */}
      {staged.length > 0 && (
        <div>
          <div className="flex items-center justify-between px-4 py-1.5 text-xs text-vscode-text-muted uppercase tracking-wider">
            <span>Staged Changes ({staged.length})</span>
            <button className="hover:text-white transition-colors">
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>
          {staged.map((file) => (
            <div
              key={file.name}
              className="flex items-center justify-between px-4 py-1 hover:bg-vscode-menu-hover/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                {statusIcon(file.status)}
                <span className="truncate text-vscode-text">{file.name}</span>
              </div>
              <button className="opacity-0 hover:opacity-100 text-vscode-text-muted hover:text-white transition-all">
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Changes */}
      {changes.length > 0 && (
        <div>
          <div className="flex items-center justify-between px-4 py-1.5 text-xs text-vscode-text-muted uppercase tracking-wider">
            <span>Changes ({changes.length})</span>
            <button className="hover:text-white transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          {changes.map((file) => (
            <div
              key={file.name}
              className={cn(
                'flex items-center justify-between px-4 py-1 hover:bg-vscode-menu-hover/30 transition-colors cursor-pointer group'
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                {statusIcon(file.status)}
                <span className="truncate text-vscode-text">{file.name}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button className="text-vscode-text-muted hover:text-white">
                  <Plus className="w-3 h-3" />
                </button>
                <button className="text-vscode-text-muted hover:text-white">
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
