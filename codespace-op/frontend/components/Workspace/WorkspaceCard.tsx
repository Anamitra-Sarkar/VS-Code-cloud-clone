'use client';

import { Cloud, MoreVertical, Play, StopCircle } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import type { Workspace } from '@/lib/types';

interface Props {
  workspace: Workspace;
  onOpen: (id: string) => void;
}

export default function WorkspaceCard({ workspace, onOpen }: Props) {
  const isRunning = workspace.status === 'running';

  return (
    <div
      className="glass rounded-xl p-5 hover:bg-white/5 transition-all duration-200 cursor-pointer group"
      onClick={() => onOpen(workspace.id)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-vscode-accent/20 flex items-center justify-center">
            <Cloud className="w-5 h-5 text-vscode-accent" />
          </div>
          <div>
            <h3 className="font-medium text-white">{workspace.name}</h3>
            <p className="text-xs text-vscode-text-muted">{workspace.language}</p>
          </div>
        </div>
        <button className="opacity-0 group-hover:opacity-100 text-vscode-text-muted hover:text-white transition-all p-1">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              isRunning ? 'bg-vscode-green' : 'bg-vscode-text-muted'
            )}
          />
          <span className="text-xs text-vscode-text-muted capitalize">
            {workspace.status}
          </span>
        </div>
        <span className="text-xs text-vscode-text-muted">
          {formatDate(workspace.updatedAt)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors',
            isRunning
              ? 'bg-vscode-red/20 text-vscode-red hover:bg-vscode-red/30'
              : 'bg-vscode-green/20 text-vscode-green hover:bg-vscode-green/30'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {isRunning ? (
            <>
              <StopCircle className="w-3 h-3" /> Stop
            </>
          ) : (
            <>
              <Play className="w-3 h-3" fill="currentColor" /> Start
            </>
          )}
        </button>
      </div>
    </div>
  );
}
