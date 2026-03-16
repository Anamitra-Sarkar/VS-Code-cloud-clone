'use client';

import { useRef, useEffect, useCallback } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import type { EditorTab } from '@/lib/types';

interface Props {
  tab: EditorTab;
  onChange: (content: string) => void;
  onCursorChange: (line: number, col: number) => void;
  onSelectionChange: (selection: string) => void;
}

export default function MonacoEditorWrapper({
  tab,
  onChange,
  onCursorChange,
  onSelectionChange,
}: Props) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleMount: OnMount = useCallback(
    (editorInstance) => {
      editorRef.current = editorInstance;

      editorInstance.onDidChangeCursorPosition((e) => {
        onCursorChange(e.position.lineNumber, e.position.column);
      });

      editorInstance.onDidChangeCursorSelection(() => {
        const selection = editorInstance.getModel()?.getValueInRange(editorInstance.getSelection()!);
        onSelectionChange(selection || '');
      });

      // Ctrl+S save
      editorInstance.addCommand(
        // eslint-disable-next-line no-bitwise
        2048 | 49, // KeyMod.CtrlCmd | KeyCode.KeyS
        () => {
          // Save handled by parent
        }
      );

      editorInstance.focus();
    },
    [onCursorChange, onSelectionChange]
  );

  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model && model.getValue() !== tab.content) {
        model.setValue(tab.content);
      }
    }
  }, [tab.path, tab.content]);

  return (
    <Editor
      height="100%"
      language={tab.language}
      value={tab.content}
      theme="vs-dark"
      onChange={(value) => onChange(value || '')}
      onMount={handleMount}
      options={{
        fontSize: 14,
        fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
        fontLigatures: true,
        minimap: { enabled: true, maxColumn: 80 },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        renderWhitespace: 'selection',
        bracketPairColorization: { enabled: true },
        guides: {
          bracketPairs: true,
          indentation: true,
        },
        padding: { top: 8, bottom: 8 },
        wordWrap: 'off',
        automaticLayout: true,
        tabSize: 2,
        suggest: {
          preview: true,
          showMethods: true,
          showFunctions: true,
          showClasses: true,
          showKeywords: true,
        },
      }}
    />
  );
}
