'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Hero() {
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-vscode-accent/20 blur-[100px]"
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-vscode-green/15 blur-[120px]"
          animate={{ x: [0, -40, 0], y: [0, 60, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-vscode-purple/15 blur-[100px]"
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 text-sm text-vscode-text-muted"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Sparkles className="w-4 h-4 text-vscode-accent" />
            AI-Powered Cloud Development Environment
          </motion.div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-6">
            <span className="gradient-text">Codespace</span>
            <span className="text-white">-OP</span>
          </h1>

          <p className="text-xl md:text-2xl text-vscode-text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Your Cloud IDE, Powered by AI. Code from anywhere with a full VS Code
            experience, intelligent assistance, and seamless collaboration.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              onClick={() => router.push('/auth')}
              className="group relative px-8 py-4 bg-vscode-accent hover:bg-vscode-accent-hover text-white font-semibold text-lg rounded-xl transition-all duration-300 flex items-center gap-3 animate-pulse-glow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Build Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 glass hover:bg-white/10 text-white font-medium text-lg rounded-xl transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              View on GitHub
            </motion.a>
          </div>
        </motion.div>

        {/* Floating IDE Preview */}
        <motion.div
          className="mt-20 relative"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <div className="glass rounded-xl overflow-hidden shadow-2xl">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-vscode-sidebar/80 border-b border-vscode-border">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-vscode-red" />
                <div className="w-3 h-3 rounded-full bg-vscode-yellow" />
                <div className="w-3 h-3 rounded-full bg-vscode-green" />
              </div>
              <span className="text-xs text-vscode-text-muted ml-2">
                Codespace-OP — workspace
              </span>
            </div>
            {/* Editor mock */}
            <div className="p-6 font-mono text-sm text-left">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <span className="text-vscode-purple">import</span>{' '}
                <span className="text-vscode-yellow">{'{ AI }'}</span>{' '}
                <span className="text-vscode-purple">from</span>{' '}
                <span className="text-vscode-orange">&apos;codespace-op&apos;</span>;
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3, duration: 0.5 }}
              >
                <br />
                <span className="text-vscode-blue">const</span>{' '}
                <span className="text-vscode-yellow">workspace</span>{' '}
                <span className="text-white">=</span>{' '}
                <span className="text-vscode-blue">await</span>{' '}
                <span className="text-vscode-yellow">AI</span>
                <span className="text-white">.</span>
                <span className="text-vscode-yellow">createWorkspace</span>
                <span className="text-white">(</span>
                <span className="text-vscode-orange">&apos;my-app&apos;</span>
                <span className="text-white">);</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6, duration: 0.5 }}
              >
                <span className="text-vscode-blue">await</span>{' '}
                <span className="text-vscode-yellow">workspace</span>
                <span className="text-white">.</span>
                <span className="text-vscode-yellow">deploy</span>
                <span className="text-white">();</span>{' '}
                <span className="text-vscode-green">{'// 🚀 Ship it!'}</span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
