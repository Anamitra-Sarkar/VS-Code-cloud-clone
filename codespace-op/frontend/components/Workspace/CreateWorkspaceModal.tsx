'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; language: string; template: string }) => Promise<void>;
}

const templates = [
  { id: 'blank', name: 'Blank', language: 'typescript', description: 'Start from scratch' },
  { id: 'nextjs', name: 'Next.js', language: 'typescript', description: 'React framework' },
  { id: 'express', name: 'Express', language: 'typescript', description: 'Node.js API' },
  { id: 'python', name: 'Python', language: 'python', description: 'Python project' },
  { id: 'go', name: 'Go', language: 'go', description: 'Go project' },
  { id: 'rust', name: 'Rust', language: 'rust', description: 'Rust project' },
];

export default function CreateWorkspaceModal({ isOpen, onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const template = templates.find((t) => t.id === selectedTemplate)!;
    try {
      await onCreate({
        name: name.trim(),
        language: template.language,
        template: template.id,
      });
      setName('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-lg bg-vscode-sidebar border border-vscode-border rounded-xl shadow-2xl p-6"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Create Workspace</h2>
              <button
                onClick={onClose}
                className="text-vscode-text-muted hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-vscode-text-muted mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="my-awesome-project"
                  className="w-full bg-vscode-input-bg border border-vscode-border rounded-lg px-3 py-2.5 text-white placeholder-vscode-text-muted text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-vscode-text-muted mb-1.5">
                  Template
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedTemplate === template.id
                          ? 'border-vscode-accent bg-vscode-accent/10'
                          : 'border-vscode-border hover:border-vscode-accent/50'
                      }`}
                    >
                      <p className="text-sm font-medium text-white">{template.name}</p>
                      <p className="text-xs text-vscode-text-muted mt-0.5">
                        {template.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={!name.trim() || loading}
                className="w-full py-3 bg-vscode-accent hover:bg-vscode-accent-hover text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Create Workspace'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
