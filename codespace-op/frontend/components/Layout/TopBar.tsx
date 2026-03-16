'use client';

import { useRouter } from 'next/navigation';
import {
  Cloud,
  Share2,
  Play,
  ChevronDown,
  LogOut,
  User,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

interface Props {
  workspaceName: string;
}

export default function TopBar({ workspaceName }: Props) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="h-10 bg-vscode-sidebar flex items-center justify-between px-4 border-b border-vscode-border select-none">
      {/* Left - Logo & workspace */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-vscode-accent">
          <Cloud className="w-4 h-4" />
          <span className="text-sm font-semibold text-white">Codespace-OP</span>
        </div>
        <div className="h-4 w-px bg-vscode-border" />
        <div className="flex items-center gap-1.5 text-sm text-vscode-text-muted">
          <span className="text-white">{workspaceName}</span>
          <ChevronDown className="w-3 h-3" />
        </div>
      </div>

      {/* Center - Run */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1 rounded bg-vscode-green/20 text-vscode-green hover:bg-vscode-green/30 transition-colors text-xs font-medium">
          <Play className="w-3 h-3" fill="currentColor" />
          Run
        </button>
      </div>

      {/* Right - Share & User */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1.5 px-3 py-1 rounded text-vscode-text-muted hover:text-white hover:bg-white/5 transition-colors text-xs">
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 rounded transition-colors"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="w-6 h-6 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-vscode-accent flex items-center justify-center text-xs text-white font-medium">
                {user?.displayName?.[0] || user?.email?.[0] || 'U'}
              </div>
            )}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-vscode-menu-bg border border-vscode-border rounded-lg shadow-xl py-1 z-50 animate-slide-down">
              <div className="px-3 py-2 border-b border-vscode-border">
                <p className="text-sm text-white font-medium truncate">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs text-vscode-text-muted truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  router.push('/');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-vscode-text hover:bg-vscode-menu-hover transition-colors"
              >
                <User className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-vscode-red hover:bg-vscode-menu-hover transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
