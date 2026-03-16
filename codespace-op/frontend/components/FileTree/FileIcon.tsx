'use client';

import {
  FileJson,
  FileText,
  FileCode,
  FileType,
  Folder,
  FolderOpen,
  File,
  FileImage,
  Settings,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  filename: string;
  isDirectory?: boolean;
  isExpanded?: boolean;
  className?: string;
}

const iconMap: Record<string, { icon: React.ElementType; color: string }> = {
  ts: { icon: FileCode, color: 'text-blue-400' },
  tsx: { icon: FileCode, color: 'text-blue-400' },
  js: { icon: FileCode, color: 'text-yellow-400' },
  jsx: { icon: FileCode, color: 'text-yellow-400' },
  json: { icon: FileJson, color: 'text-yellow-300' },
  md: { icon: FileText, color: 'text-blue-300' },
  py: { icon: FileCode, color: 'text-green-400' },
  go: { icon: FileCode, color: 'text-cyan-400' },
  rs: { icon: FileCode, color: 'text-orange-400' },
  html: { icon: FileType, color: 'text-orange-500' },
  css: { icon: FileType, color: 'text-blue-500' },
  scss: { icon: FileType, color: 'text-pink-400' },
  svg: { icon: FileImage, color: 'text-yellow-500' },
  png: { icon: FileImage, color: 'text-green-500' },
  jpg: { icon: FileImage, color: 'text-green-500' },
  env: { icon: Settings, color: 'text-yellow-600' },
  gitignore: { icon: Settings, color: 'text-gray-400' },
  sql: { icon: Database, color: 'text-blue-400' },
  yml: { icon: Settings, color: 'text-purple-400' },
  yaml: { icon: Settings, color: 'text-purple-400' },
};

export default function FileIcon({ filename, isDirectory, isExpanded, className }: Props) {
  if (isDirectory) {
    const Icon = isExpanded ? FolderOpen : Folder;
    return <Icon className={cn('text-vscode-accent', className)} />;
  }

  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const baseName = filename.startsWith('.') ? filename.substring(1) : '';
  const match = iconMap[ext] || iconMap[baseName];

  if (match) {
    const Icon = match.icon;
    return <Icon className={cn(match.color, className)} />;
  }

  return <File className={cn('text-vscode-text-muted', className)} />;
}
