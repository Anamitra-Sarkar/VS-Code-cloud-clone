'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import FileIcon from '@/components/FileTree/FileIcon';
import type { EditorTab } from '@/lib/types';

interface Props {
  tabs: EditorTab[];
  activeTabId: string | null;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
}

export default function EditorTabs({ tabs, activeTabId, onTabSelect, onTabClose }: Props) {
  if (tabs.length === 0) return null;

  return (
    <div className="flex bg-vscode-tab-inactive border-b border-vscode-border overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onTabSelect(tab.id)}
          className={cn(
            'group flex items-center gap-2 px-4 py-2 text-sm cursor-pointer border-r border-vscode-border min-w-0 shrink-0 transition-colors',
            tab.id === activeTabId
              ? 'bg-vscode-tab-active text-white border-t-2 border-t-vscode-accent'
              : 'text-vscode-text-muted hover:bg-vscode-tab-active/50 border-t-2 border-t-transparent'
          )}
        >
          <FileIcon filename={tab.name} className="w-4 h-4 shrink-0" />
          <span className="truncate max-w-[120px]">{tab.name}</span>
          {tab.isDirty && (
            <div className="w-2 h-2 rounded-full bg-white/60 shrink-0" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.id);
            }}
            className="ml-1 p-0.5 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
