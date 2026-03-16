'use client';

import { Github, Twitter, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-vscode-border py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 text-vscode-text-muted">
          <span className="font-semibold text-white">Codespace-OP</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            Built with <Heart className="w-4 h-4 text-vscode-red" /> by the community
          </span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="#"
            className="text-vscode-text-muted hover:text-white transition-colors text-sm"
          >
            Documentation
          </a>
          <a
            href="#"
            className="text-vscode-text-muted hover:text-white transition-colors text-sm"
          >
            API Reference
          </a>
          <a
            href="#"
            className="text-vscode-text-muted hover:text-white transition-colors text-sm"
          >
            Status
          </a>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-vscode-text-muted hover:text-white transition-colors"
            aria-label="GitHub"
          >
            <Github className="w-5 h-5" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-vscode-text-muted hover:text-white transition-colors"
            aria-label="Twitter"
          >
            <Twitter className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
