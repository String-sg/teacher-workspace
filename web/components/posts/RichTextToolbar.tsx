import type { Editor } from '@tiptap/react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  Underline as UnderlineIcon,
} from 'lucide-react';

import { cn } from '~/lib/utils';

interface RichTextToolbarProps {
  editor: Editor | null;
  className?: string;
}

interface ButtonProps {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const btnClass =
  'h-7 w-7 flex items-center justify-center rounded text-slate-11 hover:bg-slate-3 hover:text-slate-12 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
const activeClass = 'bg-slate-4 text-slate-12';

function ToolbarButton({ label, icon, active, disabled, onClick }: ButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(btnClass, active && activeClass)}
    >
      {icon}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-4 w-px bg-slate-4" />;
}

function RichTextToolbar({ editor, className }: RichTextToolbarProps) {
  // The toolbar renders before the editor finishes mounting; a null editor
  // means "not ready yet", so leave buttons visually disabled rather than
  // hiding the bar (avoids a layout shift when the editor attaches).
  const disabled = !editor;

  function toggle(name: string) {
    if (!editor) return;
    // `editor.chain().focus().toggleX().run()` is the canonical Tiptap pattern;
    // focus() keeps the selection where the user expected it.
    switch (name) {
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'underline':
        editor.chain().focus().toggleUnderline().run();
        break;
      case 'strike':
        editor.chain().focus().toggleStrike().run();
        break;
      case 'code':
        editor.chain().focus().toggleCode().run();
        break;
      case 'h1':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'h2':
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case 'h3':
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;
      case 'alignLeft':
        editor.chain().focus().setTextAlign('left').run();
        break;
      case 'alignCenter':
        editor.chain().focus().setTextAlign('center').run();
        break;
      case 'alignRight':
        editor.chain().focus().setTextAlign('right').run();
        break;
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'blockquote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'highlight':
        editor.chain().focus().toggleHighlight().run();
        break;
    }
  }

  function handleLink() {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter URL (leave empty to remove link)', previous ?? '');
    if (url === null) return; // user cancelled
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-0.5 rounded-t-xl border bg-slate-2 px-2 py-1.5',
        className,
      )}
    >
      <ToolbarButton
        label="Bold"
        icon={<Bold className="h-4 w-4" />}
        active={editor?.isActive('bold')}
        disabled={disabled}
        onClick={() => toggle('bold')}
      />
      <ToolbarButton
        label="Italic"
        icon={<Italic className="h-4 w-4" />}
        active={editor?.isActive('italic')}
        disabled={disabled}
        onClick={() => toggle('italic')}
      />
      <ToolbarButton
        label="Underline"
        icon={<UnderlineIcon className="h-4 w-4" />}
        active={editor?.isActive('underline')}
        disabled={disabled}
        onClick={() => toggle('underline')}
      />
      <ToolbarButton
        label="Strikethrough"
        icon={<Strikethrough className="h-4 w-4" />}
        active={editor?.isActive('strike')}
        disabled={disabled}
        onClick={() => toggle('strike')}
      />
      <ToolbarButton
        label="Inline code"
        icon={<Code className="h-4 w-4" />}
        active={editor?.isActive('code')}
        disabled={disabled}
        onClick={() => toggle('code')}
      />

      <Divider />

      <ToolbarButton
        label="Heading 1"
        icon={<Heading1 className="h-4 w-4" />}
        active={editor?.isActive('heading', { level: 1 })}
        disabled={disabled}
        onClick={() => toggle('h1')}
      />
      <ToolbarButton
        label="Heading 2"
        icon={<Heading2 className="h-4 w-4" />}
        active={editor?.isActive('heading', { level: 2 })}
        disabled={disabled}
        onClick={() => toggle('h2')}
      />
      <ToolbarButton
        label="Heading 3"
        icon={<Heading3 className="h-4 w-4" />}
        active={editor?.isActive('heading', { level: 3 })}
        disabled={disabled}
        onClick={() => toggle('h3')}
      />

      <Divider />

      <ToolbarButton
        label="Align left"
        icon={<AlignLeft className="h-4 w-4" />}
        active={editor?.isActive({ textAlign: 'left' })}
        disabled={disabled}
        onClick={() => toggle('alignLeft')}
      />
      <ToolbarButton
        label="Align center"
        icon={<AlignCenter className="h-4 w-4" />}
        active={editor?.isActive({ textAlign: 'center' })}
        disabled={disabled}
        onClick={() => toggle('alignCenter')}
      />
      <ToolbarButton
        label="Align right"
        icon={<AlignRight className="h-4 w-4" />}
        active={editor?.isActive({ textAlign: 'right' })}
        disabled={disabled}
        onClick={() => toggle('alignRight')}
      />

      <Divider />

      <ToolbarButton
        label="Bullet list"
        icon={<List className="h-4 w-4" />}
        active={editor?.isActive('bulletList')}
        disabled={disabled}
        onClick={() => toggle('bulletList')}
      />
      <ToolbarButton
        label="Numbered list"
        icon={<ListOrdered className="h-4 w-4" />}
        active={editor?.isActive('orderedList')}
        disabled={disabled}
        onClick={() => toggle('orderedList')}
      />

      <Divider />

      <ToolbarButton
        label="Quote"
        icon={<Quote className="h-4 w-4" />}
        active={editor?.isActive('blockquote')}
        disabled={disabled}
        onClick={() => toggle('blockquote')}
      />
      <ToolbarButton
        label="Link"
        icon={<LinkIcon className="h-4 w-4" />}
        active={editor?.isActive('link')}
        disabled={disabled}
        onClick={handleLink}
      />
      <ToolbarButton
        label="Highlight"
        icon={<Highlighter className="h-4 w-4" />}
        active={editor?.isActive('highlight')}
        disabled={disabled}
        onClick={() => toggle('highlight')}
      />
    </div>
  );
}

export { RichTextToolbar };
export type { RichTextToolbarProps };
