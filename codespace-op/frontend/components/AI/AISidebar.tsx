'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  Send,
  X,
  Code2,
  Bug,
  Wand2,
  FileSearch,
  TestTube,
  Zap,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn, generateId } from '@/lib/utils';
import type { ChatMessage, QuickAction } from '@/lib/types';

interface Props {
  workspaceId: string;
  currentFile?: string;
  selectedCode?: string;
  language?: string;
  onClose: () => void;
  onApplyCode: (code: string) => void;
}

const quickActions: { action: QuickAction; label: string; icon: React.ElementType }[] = [
  { action: 'fix-error', label: 'Fix Error', icon: Bug },
  { action: 'complete', label: 'Complete', icon: Code2 },
  { action: 'explain', label: 'Explain', icon: FileSearch },
  { action: 'refactor', label: 'Refactor', icon: Wand2 },
  { action: 'write-tests', label: 'Tests', icon: TestTube },
];

export default function AISidebar({
  currentFile,
  selectedCode,
  language,
  onClose,
  onApplyCode,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "👋 Hi! I'm your AI coding assistant. I can help you write, fix, explain, and refactor code. Select some code or ask me anything!",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const simulateResponse = useCallback(
    (userMessage: string): string => {
      const lower = userMessage.toLowerCase();
      if (lower.includes('fix') || lower.includes('error')) {
        return `I'll analyze the ${
          currentFile ? `code in \`${currentFile}\`` : 'code'
        } for errors.\n\n**Issues found:**\n1. Consider adding error handling for edge cases\n2. Type checking could be improved\n\n\`\`\`${
          language || 'typescript'
        }\ntry {\n  // Your existing code with error handling\n  const result = await processData(input);\n  return result;\n} catch (error) {\n  console.error('Processing failed:', error);\n  throw new AppError('Data processing failed', { cause: error });\n}\n\`\`\`\n\nWould you like me to apply this fix?`;
      }
      if (lower.includes('explain')) {
        return `## Code Explanation\n\n${
          selectedCode
            ? `The selected code:\n\`\`\`${language || 'typescript'}\n${selectedCode}\n\`\`\`\n\n`
            : ''
        }This code follows a common pattern in modern ${
          language || 'TypeScript'
        } development:\n\n1. **Structure**: Uses modular architecture with clear separation of concerns\n2. **Data Flow**: Follows unidirectional data flow patterns\n3. **Error Handling**: Implements proper try/catch blocks\n\nLet me know if you'd like more details about any specific part!`;
      }
      if (lower.includes('refactor')) {
        return `Here's a refactored version with improved readability and performance:\n\n\`\`\`${
          language || 'typescript'
        }\n// Refactored with improved patterns\nconst processItems = (items: Item[]) => {\n  return items\n    .filter(item => item.isActive)\n    .map(item => ({\n      ...item,\n      processed: true,\n      timestamp: Date.now(),\n    }));\n};\n\`\`\`\n\n**Improvements:**\n- ✅ Functional approach\n- ✅ Immutable data\n- ✅ Better readability`;
      }
      if (lower.includes('test')) {
        return `Here are tests for your code:\n\n\`\`\`${
          language || 'typescript'
        }\nimport { describe, it, expect } from 'vitest';\n\ndescribe('Component', () => {\n  it('should render correctly', () => {\n    const result = render(<Component />);\n    expect(result).toBeDefined();\n  });\n\n  it('should handle user input', () => {\n    const { getByRole } = render(<Component />);\n    const input = getByRole('textbox');\n    fireEvent.change(input, { target: { value: 'test' } });\n    expect(input.value).toBe('test');\n  });\n\n  it('should handle errors gracefully', () => {\n    expect(() => processInvalid(null)).toThrow();\n  });\n});\n\`\`\``;
      }
      return `I understand you're asking about: "${userMessage}"\n\n${
        currentFile ? `Looking at \`${currentFile}\`, ` : ''
      }Here's my suggestion:\n\n\`\`\`${
        language || 'typescript'
      }\n// AI-generated suggestion\nconst solution = {\n  approach: 'modern',\n  optimized: true,\n};\n\`\`\`\n\n${
        agentMode
          ? '🤖 **Agent Mode**: I can also execute commands and watch for errors. Want me to run any commands?'
          : 'Feel free to ask for more specific help!'
      }`;
    },
    [currentFile, selectedCode, language, agentMode]
  );

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Simulate streaming response
    setTimeout(() => {
      const response = simulateResponse(userMsg.content);
      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);
    }, 1000 + Math.random() * 1000);
  }, [input, isLoading, simulateResponse]);

  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      const actionMessages: Record<QuickAction, string> = {
        'fix-error': `Fix any errors in ${currentFile || 'the current code'}`,
        complete: `Complete the code ${selectedCode ? 'from the selection' : `in ${currentFile || 'the editor'}`}`,
        explain: `Explain ${selectedCode ? 'the selected code' : `the code in ${currentFile || 'the editor'}`}`,
        refactor: `Refactor ${selectedCode ? 'the selected code' : `the code in ${currentFile || 'the editor'}`} for better quality`,
        'write-tests': `Write tests for ${currentFile || 'the current code'}`,
      };
      setInput(actionMessages[action]);
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    [currentFile, selectedCode]
  );

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-vscode-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-vscode-border">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-vscode-accent" />
          <span className="text-sm font-medium text-white">AI Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAgentMode(!agentMode)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors',
              agentMode
                ? 'bg-vscode-accent/20 text-vscode-accent'
                : 'text-vscode-text-muted hover:text-white'
            )}
          >
            <Zap className="w-3 h-3" />
            Agent
          </button>
          <button
            onClick={onClose}
            className="text-vscode-text-muted hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-1.5 p-3 border-b border-vscode-border">
        {quickActions.map(({ action, label, icon: Icon }) => (
          <button
            key={action}
            onClick={() => handleQuickAction(action)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-vscode-bg/50 text-xs text-vscode-text-muted hover:text-white hover:bg-vscode-accent/20 transition-colors"
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Context indicator */}
      {(currentFile || selectedCode) && (
        <div className="px-3 py-2 border-b border-vscode-border text-xs text-vscode-text-muted">
          {currentFile && (
            <span className="inline-flex items-center gap-1">
              📄 {currentFile}
            </span>
          )}
          {selectedCode && (
            <span className="ml-2 inline-flex items-center gap-1">
              ✂️ {selectedCode.length} chars selected
            </span>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'ai-message',
              msg.role === 'user' ? 'flex justify-end' : ''
            )}
          >
            <div
              className={cn(
                'rounded-lg text-sm leading-relaxed max-w-full',
                msg.role === 'user'
                  ? 'bg-vscode-accent/20 text-white px-4 py-2.5 max-w-[85%]'
                  : 'text-vscode-text'
              )}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-invert prose-sm max-w-none code-block">
                  <ReactMarkdown
                    components={{
                      code({ className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeStr = String(children).replace(/\n$/, '');
                        const isInline = !match;

                        if (isInline) {
                          return (
                            <code className="bg-vscode-bg/80 px-1.5 py-0.5 rounded text-vscode-orange text-xs" {...props}>
                              {children}
                            </code>
                          );
                        }

                        const blockId = `${msg.id}-${codeStr.substring(0, 20)}`;
                        return (
                          <div className="relative group my-3">
                            <div className="flex items-center justify-between px-3 py-1.5 bg-vscode-bg rounded-t border border-b-0 border-vscode-border">
                              <span className="text-xs text-vscode-text-muted">
                                {match[1]}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => copyToClipboard(codeStr, blockId)}
                                  className="flex items-center gap-1 text-xs text-vscode-text-muted hover:text-white transition-colors"
                                >
                                  {copiedId === blockId ? (
                                    <Check className="w-3 h-3 text-vscode-green" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                                <button
                                  onClick={() => onApplyCode(codeStr)}
                                  className="flex items-center gap-1 text-xs text-vscode-accent hover:text-vscode-accent-hover transition-colors"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                            <pre className="!mt-0 !rounded-t-none">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          </div>
                        );
                      },
                      p({ children }) {
                        return <p className="mb-2 last:mb-0">{children}</p>;
                      },
                      ul({ children }) {
                        return <ul className="list-disc ml-4 mb-2">{children}</ul>;
                      },
                      ol({ children }) {
                        return <ol className="list-decimal ml-4 mb-2">{children}</ol>;
                      },
                      h2({ children }) {
                        return (
                          <h2 className="text-base font-semibold text-white mt-3 mb-1.5">
                            {children}
                          </h2>
                        );
                      },
                      strong({ children }) {
                        return <strong className="text-white font-semibold">{children}</strong>;
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-vscode-text-muted text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-vscode-border">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            rows={1}
            className="flex-1 bg-vscode-input-bg border border-vscode-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-vscode-text-muted resize-none focus:border-vscode-accent transition-colors max-h-32"
            style={{ minHeight: '40px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-vscode-accent hover:bg-vscode-accent-hover text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
