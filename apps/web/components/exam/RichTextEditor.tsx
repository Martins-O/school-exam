'use client';

import TiptapEditor from './TiptapEditor';

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
  return (
    <TiptapEditor
      value={value}
      onChange={onChange}
      maxWords={maxWordCount ?? undefined}
      placeholder={placeholder}
      mode="full"
    />
  );
}
