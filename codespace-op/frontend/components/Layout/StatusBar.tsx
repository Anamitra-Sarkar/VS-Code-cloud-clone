'use client';

import {
  GitBranch,
  Bell,
  Check,
  Terminal,
  Wifi,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  branch: string;
  language: string;
  line: number;
  col: number;
  showTerminal: boolean;
  onToggleTerminal: () => void;
}

export default function StatusBar({
  branch,
  language,
  line,
  col,
  showTerminal,
  onToggleTerminal,
}: Props) {
  return (
    <div className="h-6 bg-vscode-status-bar flex items-center justify-between px-3 text-white text-xs select-none">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          <GitBranch className="w-3 h-3" />
          <span>{branch}</span>
        </div>
        <div className="flex items-center gap-1.5 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          <Check className="w-3 h-3" />
          <span>0 problems</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <span className="hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          Ln {line}, Col {col}
        </span>
        <span className="hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          Spaces: 2
        </span>
        <span className="hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          UTF-8
        </span>
        <span className="hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors capitalize">
          {language}
        </span>
        <button
          onClick={onToggleTerminal}
          className={cn(
            'flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors',
            showTerminal && 'bg-white/10'
          )}
        >
          <Terminal className="w-3 h-3" />
        </button>
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3 h-3" />
        </div>
        <button className="hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors">
          <Bell className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
