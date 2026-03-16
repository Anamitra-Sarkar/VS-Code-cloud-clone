'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Plus, Terminal as TerminalIcon } from 'lucide-react';

interface Props {
  workspaceId: string;
  onClose: () => void;
}

export default function TerminalPanel({ workspaceId, onClose }: Props) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);
  const xtermRef = useRef<{ terminal: unknown; fitAddon: unknown } | null>(null);

  useEffect(() => {
    if (!terminalRef.current || initialized) return;

    let mounted = true;

    const initTerminal = async () => {
      try {
        const { Terminal } = await import('@xterm/xterm');
        const { FitAddon } = await import('@xterm/addon-fit');

        if (!mounted || !terminalRef.current) return;

        const fitAddon = new FitAddon();
        const terminal = new Terminal({
          theme: {
            background: '#1e1e1e',
            foreground: '#cccccc',
            cursor: '#ffffff',
            cursorAccent: '#1e1e1e',
            selectionBackground: '#264f78',
            black: '#000000',
            red: '#cd3131',
            green: '#0dbc79',
            yellow: '#e5e510',
            blue: '#2472c8',
            magenta: '#bc3fbc',
            cyan: '#11a8cd',
            white: '#e5e5e5',
            brightBlack: '#666666',
            brightRed: '#f14c4c',
            brightGreen: '#23d18b',
            brightYellow: '#f5f543',
            brightBlue: '#3b8eea',
            brightMagenta: '#d670d6',
            brightCyan: '#29b8db',
            brightWhite: '#e5e5e5',
          },
          fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
          fontSize: 13,
          lineHeight: 1.4,
          cursorBlink: true,
          cursorStyle: 'bar',
          scrollback: 1000,
        });

        terminal.loadAddon(fitAddon);
        terminal.open(terminalRef.current);

        setTimeout(() => {
          if (mounted) fitAddon.fit();
        }, 100);

        xtermRef.current = { terminal, fitAddon };

        // Welcome message
        terminal.writeln('\x1b[1;34m  Codespace-OP Terminal\x1b[0m');
        terminal.writeln(`\x1b[90m  Workspace: ${workspaceId}\x1b[0m`);
        terminal.writeln('');
        terminal.write('\x1b[32m❯\x1b[0m ');

        // Simple echo for demo
        let currentLine = '';
        terminal.onData((data) => {
          if (data === '\r') {
            terminal.writeln('');
            if (currentLine.trim() === 'clear') {
              terminal.clear();
            } else if (currentLine.trim() === 'help') {
              terminal.writeln('\x1b[33m  Available commands:\x1b[0m');
              terminal.writeln('  help    - Show this message');
              terminal.writeln('  clear   - Clear terminal');
              terminal.writeln('  whoami  - Show current user');
              terminal.writeln('');
            } else if (currentLine.trim() === 'whoami') {
              terminal.writeln('  codespace-user');
              terminal.writeln('');
            } else if (currentLine.trim()) {
              terminal.writeln(`\x1b[90m  → ${currentLine}\x1b[0m`);
              terminal.writeln('');
            }
            currentLine = '';
            terminal.write('\x1b[32m❯\x1b[0m ');
          } else if (data === '\x7f') {
            if (currentLine.length > 0) {
              currentLine = currentLine.slice(0, -1);
              terminal.write('\b \b');
            }
          } else if (data >= ' ') {
            currentLine += data;
            terminal.write(data);
          }
        });

        // Resize observer
        const resizeObserver = new ResizeObserver(() => {
          if (mounted) fitAddon.fit();
        });
        resizeObserver.observe(terminalRef.current);

        setInitialized(true);

        return () => {
          resizeObserver.disconnect();
          terminal.dispose();
        };
      } catch {
        // Terminal initialization failed silently
      }
    };

    initTerminal();

    return () => {
      mounted = false;
    };
  }, [initialized, workspaceId]);

  return (
    <div className="h-full flex flex-col bg-vscode-terminal">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-vscode-sidebar border-b border-vscode-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-white">
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Terminal</span>
          </div>
          <button className="text-vscode-text-muted hover:text-white transition-colors p-0.5">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          onClick={onClose}
          className="text-vscode-text-muted hover:text-white transition-colors p-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Terminal content */}
      <div ref={terminalRef} className="flex-1 overflow-hidden" />
    </div>
  );
}
