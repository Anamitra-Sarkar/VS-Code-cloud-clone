'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import TopBar from '@/components/Layout/TopBar';
import Sidebar from '@/components/Layout/Sidebar';
import StatusBar from '@/components/Layout/StatusBar';
import FileTree from '@/components/FileTree/FileTree';
import MonacoEditorWrapper from '@/components/Editor/MonacoEditor';
import EditorTabs from '@/components/Editor/EditorTabs';
import TerminalPanel from '@/components/Terminal/Terminal';
import AISidebar from '@/components/AI/AISidebar';
import GitPanel from '@/components/Git/GitPanel';
import type { EditorTab, FileNode, SidebarView } from '@/lib/types';
import { getLanguageFromExt, generateId } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const DEMO_FILES: FileNode[] = [
  {
    name: 'src',
    path: 'src',
    type: 'directory',
    children: [
      {
        name: 'index.ts',
        path: 'src/index.ts',
        type: 'file',
        content:
          'import express from "express";\n\nconst app = express();\nconst PORT = 3000;\n\napp.get("/", (req, res) => {\n  res.json({ message: "Hello from Codespace-OP!" });\n});\n\napp.listen(PORT, () => {\n  console.log(`Server running on port ${PORT}`);\n});\n',
      },
      {
        name: 'utils.ts',
        path: 'src/utils.ts',
        type: 'file',
        content:
          'export function formatDate(date: Date): string {\n  return date.toISOString();\n}\n\nexport function generateId(): string {\n  return Math.random().toString(36).substring(2, 15);\n}\n',
      },
      {
        name: 'components',
        path: 'src/components',
        type: 'directory',
        children: [
          {
            name: 'App.tsx',
            path: 'src/components/App.tsx',
            type: 'file',
            content:
              'import React from "react";\n\nexport default function App() {\n  return (\n    <div className="app">\n      <h1>Hello World</h1>\n    </div>\n  );\n}\n',
          },
        ],
      },
    ],
  },
  {
    name: 'package.json',
    path: 'package.json',
    type: 'file',
    content:
      '{\n  "name": "my-project",\n  "version": "1.0.0",\n  "main": "src/index.ts",\n  "scripts": {\n    "dev": "ts-node src/index.ts",\n    "build": "tsc"\n  }\n}\n',
  },
  {
    name: 'README.md',
    path: 'README.md',
    type: 'file',
    content: '# My Project\n\nWelcome to your Codespace-OP workspace!\n',
  },
  {
    name: '.gitignore',
    path: '.gitignore',
    type: 'file',
    content: 'node_modules/\ndist/\n.env\n',
  },
];

export default function WorkspacePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;

  const [sidebarView, setSidebarView] = useState<SidebarView>('files');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(250);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [aiWidth, setAiWidth] = useState(380);
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [files] = useState<FileNode[]>(DEMO_FILES);
  const [selectedCode, setSelectedCode] = useState('');
  const [currentLine, setCurrentLine] = useState(1);
  const [currentCol, setCurrentCol] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  const activeTab = tabs.find((t) => t.id === activeTabId) || null;

  const openFile = useCallback(
    (node: FileNode) => {
      if (node.type !== 'file') return;

      const existing = tabs.find((t) => t.path === node.path);
      if (existing) {
        setActiveTabId(existing.id);
        return;
      }

      const newTab: EditorTab = {
        id: generateId(),
        name: node.name,
        path: node.path,
        language: getLanguageFromExt(node.name),
        content: node.content || '',
        isDirty: false,
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTab.id);
    },
    [tabs]
  );

  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === tabId);
        const next = prev.filter((t) => t.id !== tabId);
        if (activeTabId === tabId && next.length > 0) {
          const newIdx = Math.min(idx, next.length - 1);
          setActiveTabId(next[newIdx].id);
        } else if (next.length === 0) {
          setActiveTabId(null);
        }
        return next;
      });
    },
    [activeTabId]
  );

  const updateTabContent = useCallback((tabId: string, content: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, content, isDirty: true } : t))
    );
  }, []);

  const handleSidebarViewChange = (view: SidebarView) => {
    if (view === 'ai') {
      setShowAI(!showAI);
      return;
    }
    if (sidebarView === view && showSidebar) {
      setShowSidebar(false);
    } else {
      setSidebarView(view);
      setShowSidebar(true);
    }
  };

  // Resizer handlers
  const handleTerminalResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startY = e.clientY;
      const startH = terminalHeight;
      const onMove = (ev: MouseEvent) => {
        const delta = startY - ev.clientY;
        setTerminalHeight(Math.max(100, Math.min(600, startH + delta)));
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [terminalHeight]
  );

  const handleSidebarResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = sidebarWidth;
      const onMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX;
        setSidebarWidth(Math.max(180, Math.min(500, startW + delta)));
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [sidebarWidth]
  );

  const handleAIResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = aiWidth;
      const onMove = (ev: MouseEvent) => {
        const delta = startX - ev.clientX;
        setAiWidth(Math.max(280, Math.min(600, startW + delta)));
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [aiWidth]
  );

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-vscode-bg">
        <Loader2 className="w-8 h-8 animate-spin text-vscode-accent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen w-screen flex flex-col bg-vscode-bg overflow-hidden select-none">
      {/* Top Bar */}
      <TopBar workspaceName={workspaceId} />

      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <Sidebar
          activeView={sidebarView}
          onViewChange={handleSidebarViewChange}
          showAI={showAI}
        />

        {/* File Explorer / Git Panel */}
        {showSidebar && (
          <>
            <div
              className="bg-vscode-sidebar border-r border-vscode-border overflow-hidden flex flex-col"
              style={{ width: sidebarWidth }}
            >
              <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-vscode-text-muted border-b border-vscode-border">
                {sidebarView === 'files'
                  ? 'Explorer'
                  : sidebarView === 'git'
                  ? 'Source Control'
                  : 'Extensions'}
              </div>
              <div className="flex-1 overflow-y-auto">
                {sidebarView === 'files' && (
                  <FileTree files={files} onFileSelect={openFile} />
                )}
                {sidebarView === 'git' && (
                  <GitPanel workspaceId={workspaceId} />
                )}
                {sidebarView === 'extensions' && (
                  <div className="p-4 text-sm text-vscode-text-muted">
                    Extensions marketplace coming soon...
                  </div>
                )}
              </div>
            </div>
            {/* Sidebar Resizer */}
            <div
              className="w-1 cursor-col-resize resizer hover:bg-vscode-accent/50 transition-colors"
              onMouseDown={handleSidebarResize}
            />
          </>
        )}

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor Tabs */}
          <EditorTabs
            tabs={tabs}
            activeTabId={activeTabId}
            onTabSelect={setActiveTabId}
            onTabClose={closeTab}
          />

          {/* Editor + Terminal */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Monaco Editor */}
            <div className="flex-1 overflow-hidden">
              {activeTab ? (
                <MonacoEditorWrapper
                  tab={activeTab}
                  onChange={(content) => updateTabContent(activeTab.id, content)}
                  onCursorChange={(line, col) => {
                    setCurrentLine(line);
                    setCurrentCol(col);
                  }}
                  onSelectionChange={setSelectedCode}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-vscode-text-muted">
                  <div className="text-center">
                    <div className="text-6xl mb-4 opacity-20">{'{ }'}</div>
                    <p className="text-lg">Open a file to start editing</p>
                    <p className="text-sm mt-2 opacity-60">
                      Select a file from the explorer or use Ctrl+P
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Terminal Resizer */}
            {showTerminal && (
              <div
                className="h-1 cursor-row-resize resizer hover:bg-vscode-accent/50 transition-colors"
                onMouseDown={handleTerminalResize}
              />
            )}

            {/* Terminal Panel */}
            {showTerminal && (
              <div style={{ height: terminalHeight }} className="overflow-hidden">
                <TerminalPanel
                  workspaceId={workspaceId}
                  onClose={() => setShowTerminal(false)}
                />
              </div>
            )}
          </div>
        </div>

        {/* AI Sidebar */}
        {showAI && (
          <>
            <div
              className="w-1 cursor-col-resize resizer hover:bg-vscode-accent/50 transition-colors"
              onMouseDown={handleAIResize}
            />
            <div style={{ width: aiWidth }} className="overflow-hidden">
              <AISidebar
                workspaceId={workspaceId}
                currentFile={activeTab?.path}
                selectedCode={selectedCode}
                language={activeTab?.language}
                onClose={() => setShowAI(false)}
                onApplyCode={(code) => {
                  if (activeTab) {
                    updateTabContent(activeTab.id, code);
                  }
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Status Bar */}
      <StatusBar
        branch="main"
        language={activeTab?.language || 'plaintext'}
        line={currentLine}
        col={currentCol}
        showTerminal={showTerminal}
        onToggleTerminal={() => setShowTerminal(!showTerminal)}
      />
    </div>
  );
}
