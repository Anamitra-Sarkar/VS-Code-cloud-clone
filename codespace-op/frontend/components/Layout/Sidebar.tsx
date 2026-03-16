'use client';

import {
  Files,
  GitBranch,
  Blocks,
  Bot,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SidebarView } from '@/lib/types';

interface Props {
  activeView: SidebarView;
  onViewChange: (view: SidebarView) => void;
  showAI: boolean;
}

const sidebarItems: { view: SidebarView; icon: React.ElementType; label: string }[] = [
  { view: 'files', icon: Files, label: 'Explorer' },
  { view: 'git', icon: GitBranch, label: 'Source Control' },
  { view: 'extensions', icon: Blocks, label: 'Extensions' },
  { view: 'ai', icon: Bot, label: 'AI Assistant' },
];

export default function Sidebar({ activeView, onViewChange, showAI }: Props) {
  return (
    <div className="w-12 bg-vscode-activity-bar flex flex-col items-center py-2 border-r border-vscode-border">
      <div className="flex flex-col items-center gap-1 flex-1">
        {sidebarItems.map(({ view, icon: Icon, label }) => {
          const isActive =
            view === 'ai' ? showAI : activeView === view;
          return (
            <button
              key={view}
              onClick={() => onViewChange(view)}
              className={cn(
                'relative w-12 h-12 flex items-center justify-center transition-colors group',
                isActive
                  ? 'text-white border-l-2 border-l-white'
                  : 'text-vscode-text-muted hover:text-white border-l-2 border-l-transparent'
              )}
              title={label}
            >
              <Icon className="w-5 h-5" />
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-vscode-menu-bg border border-vscode-border rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom icon */}
      <button
        className="w-12 h-12 flex items-center justify-center text-vscode-text-muted hover:text-white transition-colors"
        title="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>
    </div>
  );
}
