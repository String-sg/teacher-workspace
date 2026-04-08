import { cn } from '@flow/core';
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
  Link,
  List,
  ListChecks,
  ListOrdered,
  Quote,
  Strikethrough,
  Underline,
} from '@flow/icons';

interface RichTextToolbarProps {
  className?: string;
}

const btnClass =
  'h-7 w-7 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors';

function Divider() {
  return <div className="w-px h-4 bg-slate-200 mx-1" />;
}

function RichTextToolbar({ className }: RichTextToolbarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-0.5 border rounded-t-xl px-2 py-1.5 bg-slate-50',
        className,
      )}
    >
      {/* Text formatting */}
      <span className={btnClass}><Bold className="h-4 w-4" /></span>
      <span className={btnClass}><Italic className="h-4 w-4" /></span>
      <span className={btnClass}><Underline className="h-4 w-4" /></span>
      <span className={btnClass}><Strikethrough className="h-4 w-4" /></span>
      <span className={btnClass}><Code className="h-4 w-4" /></span>

      <Divider />

      {/* Headings */}
      <span className={btnClass}><Heading1 className="h-4 w-4" /></span>
      <span className={btnClass}><Heading2 className="h-4 w-4" /></span>
      <span className={btnClass}><Heading3 className="h-4 w-4" /></span>

      <Divider />

      {/* Alignment */}
      <span className={btnClass}><AlignLeft className="h-4 w-4" /></span>
      <span className={btnClass}><AlignCenter className="h-4 w-4" /></span>
      <span className={btnClass}><AlignRight className="h-4 w-4" /></span>

      <Divider />

      {/* Lists */}
      <span className={btnClass}><List className="h-4 w-4" /></span>
      <span className={btnClass}><ListOrdered className="h-4 w-4" /></span>
      <span className={btnClass}><ListChecks className="h-4 w-4" /></span>

      <Divider />

      {/* Block & inline */}
      <span className={btnClass}><Quote className="h-4 w-4" /></span>
      <span className={btnClass}><Link className="h-4 w-4" /></span>
      <span className={btnClass}><Highlighter className="h-4 w-4" /></span>
    </div>
  );
}

export { RichTextToolbar };
export type { RichTextToolbarProps };
