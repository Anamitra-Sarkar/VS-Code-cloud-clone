'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import FileIcon from './FileIcon';
import { cn } from '@/lib/utils';
import type { FileNode } from '@/lib/types';

interface Props {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  depth?: number;
}

export default function FileTree({ files, onFileSelect, depth = 0 }: Props) {
  return (
    <div className="text-sm">
      {files
        .sort((a, b) => {
          if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
          return a.name.localeCompare(b.name);
        })
        .map((node) => (
          <FileTreeNode
            key={node.path}
            node={node}
            depth={depth}
            onFileSelect={onFileSelect}
          />
        ))}
    </div>
  );
}

function FileTreeNode({
  node,
  depth,
  onFileSelect,
}: {
  node: FileNode;
  depth: number;
  onFileSelect: (file: FileNode) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);

  const isDir = node.type === 'directory';

  const handleClick = () => {
    if (isDir) {
      setExpanded(!expanded);
    } else {
      onFileSelect(node);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          'w-full flex items-center gap-1.5 py-1 px-2 hover:bg-vscode-menu-hover/40 text-left transition-colors text-vscode-text',
          'focus:outline-none focus:bg-vscode-selection/30'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isDir ? (
          expanded ? (
            <ChevronDown className="w-4 h-4 shrink-0 text-vscode-text-muted" />
          ) : (
            <ChevronRight className="w-4 h-4 shrink-0 text-vscode-text-muted" />
          )
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <FileIcon
          filename={node.name}
          isDirectory={isDir}
          isExpanded={expanded}
          className="w-4 h-4 shrink-0"
        />
        <span className="truncate">{node.name}</span>
      </button>
      {isDir && expanded && node.children && (
        <FileTree
          files={node.children}
          onFileSelect={onFileSelect}
          depth={depth + 1}
        />
      )}
    </div>
  );
}
