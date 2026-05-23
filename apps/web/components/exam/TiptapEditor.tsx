'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Mathematics } from '@tiptap/extension-mathematics';
import { useEffect, useCallback, useState } from 'react';
import FormulaPalette from './FormulaPalette';

interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxWords?: number | null;
  mode?: 'full' | 'minimal';
}

export default function TiptapEditor({
  value,
  onChange,
  placeholder = 'Type here...',
  minHeight = 160,
  maxWords,
  mode = 'full',
}: TiptapEditorProps) {
  const [showPalette, setShowPalette] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: mode === 'full' ? { levels: [1, 2, 3] } : false,
        bulletList: mode === 'full' ? {} : false,
        orderedList: mode === 'full' ? {} : false,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: mode === 'full' ? ['left', 'center', 'right'] : ['left'],
      }),
      Mathematics,
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
        style: `min-height: ${minHeight}px`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();

      if (maxWords) {
        const text = html.replace(/<[^>]*>/g, ' ').trim();
        const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
        if (words > maxWords) {
          return;
        }
      }

      onChange(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const editorHtml = editor.getHTML();
    const normalizedValue = value || '';
    if (normalizedValue === editorHtml) return;
    const isBothEmpty = !normalizedValue.replace(/<[^>]*>/g, '').trim()
      && !editorHtml.replace(/<[^>]*>/g, '').trim();
    if (isBothEmpty) return;
    editor.commands.setContent(normalizedValue);
  }, [value, editor]);

  const execAction = useCallback(
    (action: string, attrs?: Record<string, string>) => {
      if (!editor) return;
      const chain = editor.chain().focus();

      switch (action) {
        case 'bold': chain.toggleBold().run(); break;
        case 'italic': chain.toggleItalic().run(); break;
        case 'underline': chain.toggleUnderline().run(); break;
        case 'bulletList': chain.toggleBulletList().run(); break;
        case 'orderedList': chain.toggleOrderedList().run(); break;
        case 'alignLeft': chain.setTextAlign('left').run(); break;
        case 'alignCenter': chain.setTextAlign('center').run(); break;
        case 'alignRight': chain.setTextAlign('right').run(); break;
      }
    },
    [editor],
  );

  if (!editor) return null;

  const ToolbarBtn = ({
    action,
    label,
    isActive,
    activeClass,
  }: {
    action: string;
    label: string;
    isActive?: boolean;
    activeClass?: string;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); execAction(action); }}
      className={`p-2 rounded-lg transition-all text-sm font-bold ${
        isActive
          ? (activeClass || 'bg-brand-green text-white')
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
      }`}
      title={label}
    >
      {label}
    </button>
  );

  const MathBtn = () => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); setShowPalette(!showPalette); }}
      className={`p-2 rounded-lg transition-all text-sm font-bold ${
        showPalette
          ? 'bg-purple-600 text-white ring-4 ring-purple-200'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
      }`}
      title="Insert Math Formula"
    >
      Σ
    </button>
  );

  const wordCount = editor
    ? editor.getText().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 p-3 bg-slate-50 border-2 border-b-0 border-slate-200 rounded-t-2xl flex-wrap">
        <ToolbarBtn action="bold" label="B" isActive={editor.isActive('bold')} />
        <ToolbarBtn action="italic" label="I" isActive={editor.isActive('italic')} />
        <ToolbarBtn action="underline" label="U" isActive={editor.isActive('underline')} />
        {mode === 'full' && (
          <>
            <div className="w-px h-6 bg-slate-300 mx-1" />
            <ToolbarBtn action="orderedList" label="1." isActive={editor.isActive('orderedList')} />
            <ToolbarBtn action="bulletList" label="•" isActive={editor.isActive('bulletList')} />
            <div className="w-px h-6 bg-slate-300 mx-1" />
            <ToolbarBtn action="alignLeft" label="⫷" />
            <ToolbarBtn action="alignCenter" label="⫿" />
            <ToolbarBtn action="alignRight" label="⫸" />
          </>
        )}
        <div className="w-px h-6 bg-slate-300 mx-1" />
        <MathBtn />
      </div>

      {showPalette && (
        <FormulaPalette editor={editor} onClose={() => setShowPalette(false)} />
      )}

      <EditorContent
        editor={editor}
        className="border-2 border-slate-200 rounded-b-2xl focus-within:border-brand-green focus-within:ring-4 focus-within:ring-green-100 transition-all bg-white"
        data-placeholder={placeholder}
      />

      {maxWords && (
        <div className={`mt-2 text-sm font-bold ${
          wordCount > maxWords * 0.9 ? 'text-red-600' : 'text-slate-500'
        }`}>
          Word count: {wordCount} / {maxWords}
        </div>
      )}
    </div>
  );
}
