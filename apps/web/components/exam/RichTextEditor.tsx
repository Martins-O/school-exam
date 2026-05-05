'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  maxWordCount?: number | null;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  maxWordCount,
  placeholder = 'Type your answer here...',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [wordCount, setWordCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const countWords = useCallback((html: string): number => {
    const text = html.replace(/<[^>]*>/g, ' ').trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  }, []);

  useEffect(() => {
    if (editorRef.current && value && !isInitialized) {
      editorRef.current.innerHTML = value;
      setWordCount(countWords(value));
      setIsInitialized(true);
    }
  }, [value, isInitialized, countWords]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const words = countWords(html);
      setWordCount(words);

      if (maxWordCount && words > maxWordCount) {
        return;
      }

      onChange(html);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (maxWordCount && wordCount >= maxWordCount) {
      if (!['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key)) {
        e.preventDefault();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const ToolbarButton = ({ command, icon, label, active = false }: { command: string; icon: string; label: string; active?: boolean }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        execCommand(command);
      }}
      className={`p-2 rounded-lg transition-all text-sm font-bold ${
        active
          ? 'bg-brand-green text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
      }`}
      title={label}
    >
      {icon}
    </button>
  );

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 p-3 bg-slate-50 border-2 border-b-0 border-slate-200 rounded-t-2xl flex-wrap">
        <ToolbarButton command="bold" icon="B" label="Bold" />
        <ToolbarButton command="italic" icon="I" label="Italic" />
        <ToolbarButton command="underline" icon="U" label="Underline" />
        <div className="w-px h-6 bg-slate-300 mx-1"></div>
        <ToolbarButton command="insertOrderedList" icon="1." label="Numbered List" />
        <ToolbarButton command="insertUnorderedList" icon="•" label="Bullet List" />
        <div className="w-px h-6 bg-slate-300 mx-1"></div>
        <ToolbarButton command="justifyLeft" icon="⫷" label="Align Left" />
        <ToolbarButton command="justifyCenter" icon="⫿" label="Align Center" />
        <ToolbarButton command="justifyRight" icon="⫸" label="Align Right" />
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className="min-h-[200px] max-h-[400px] overflow-y-auto p-6 border-2 border-slate-200 rounded-b-2xl focus:border-brand-green focus:ring-4 focus:ring-green-100 outline-none text-lg leading-relaxed bg-white"
        style={{ wordBreak: 'break-word' }}
        data-placeholder={placeholder}
      />

      {maxWordCount && (
        <div className={`mt-2 text-sm font-bold ${
          wordCount > maxWordCount * 0.9 ? 'text-red-600' : 'text-slate-500'
        }`}>
          Word count: {wordCount} / {maxWordCount}
        </div>
      )}
    </div>
  );
}
