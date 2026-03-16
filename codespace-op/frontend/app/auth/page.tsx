'use client';

import AuthForm from '@/components/Auth/AuthForm';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
  return (
    <main className="animated-gradient min-h-screen flex items-center justify-center relative px-4">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-vscode-accent/10 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-vscode-green/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-vscode-text-muted hover:text-white transition-colors mb-8 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome to <span className="gradient-text">Codespace-OP</span>
            </h1>
            <p className="text-vscode-text-muted">
              Sign in to access your cloud workspaces
            </p>
          </div>

          <AuthForm />
        </motion.div>
      </div>
    </main>
  );
}
