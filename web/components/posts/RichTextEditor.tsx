import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef } from 'react';

import { RichTextToolbar } from '~/components/posts/RichTextToolbar';
import { cn } from '~/lib/utils';

export interface RichTextEditorProps {
  /**
   * Initial document as Tiptap JSON. Only read on mount — the editor owns the
   * document from then on. Callers should not expect changes to this prop to
   * propagate back into the editor mid-session.
   */
  initialContent?: Record<string, unknown> | null;
  /**
   * Fires on every edit, debounced ~150ms so we don't thrash the parent
   * reducer on every keystroke (which causes cursor-jump bugs).
   */
  onChange?: (doc: Record<string, unknown>, text: string) => void;
  maxLength?: number;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  ariaLabelledBy?: string;
}

export function RichTextEditor({
  initialContent,
  onChange,
  maxLength,
  placeholder,
  editable = true,
  className,
  ariaLabelledBy,
}: RichTextEditorProps) {
  // Latest callback kept in a ref so the update listener is subscribed once
  // and never re-bound — avoids tearing down the debounce on every render.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ['http', 'https', 'mailto'],
      }),
      Highlight,
      ...(maxLength != null ? [CharacterCount.configure({ limit: maxLength })] : []),
    ],
    content: initialContent ?? undefined,
    editable,
    editorProps: {
      attributes: {
        class:
          'min-h-[160px] w-full rounded-b-xl border border-t-0 bg-background px-3 py-2 text-sm outline-none prose prose-sm max-w-none focus-visible:ring-1 focus-visible:ring-ring',
        ...(ariaLabelledBy ? { 'aria-labelledby': ariaLabelledBy } : {}),
        ...(placeholder ? { 'data-placeholder': placeholder } : {}),
      },
    },
  });

  useEffect(() => {
    if (!editor) return;

    let timer: number | null = null;
    function fire() {
      if (!editor || !onChangeRef.current) return;
      onChangeRef.current(editor.getJSON(), editor.getText());
    }
    function handleUpdate() {
      if (timer != null) clearTimeout(timer);
      timer = window.setTimeout(fire, 150);
    }
    editor.on('update', handleUpdate);
    return () => {
      if (timer != null) clearTimeout(timer);
      editor.off('update', handleUpdate);
    };
  }, [editor]);

  return (
    <div className={cn('relative', className)}>
      <RichTextToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
