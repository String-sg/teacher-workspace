import { Typography } from '@flow/core';

interface PostTypePickerProps {
  onSelect: (type: 'post' | 'post-with-response') => void;
}

function PostTypePicker({ onSelect }: PostTypePickerProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Typography variant="title-lg" asChild>
        <h1>What would you like to create?</h1>
      </Typography>
      <Typography variant="body-sm" className="text-muted-foreground mt-1">
        Choose a type to get started.
      </Typography>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mt-8">
        {/* Post card */}
        <button
          type="button"
          className="border rounded-xl p-6 cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-colors text-left"
          onClick={() => onSelect('post')}
        >
          {/* Mockup area */}
          <div className="h-[100px] space-y-2.5">
            <div className="bg-slate-200 rounded h-2 w-3/4" />
            <div className="bg-slate-200 rounded h-2 w-full" />
            <div className="bg-slate-200 rounded h-2 w-5/6" />
            <div className="bg-slate-200 rounded h-2 w-2/3" />
          </div>

          <p className="font-medium mt-4">Post</p>
          <p className="text-sm text-muted-foreground mt-1">
            Send a post to parents. They can read it on Parents Gateway.
          </p>
        </button>

        {/* Post with Response card */}
        <button
          type="button"
          className="border rounded-xl p-6 cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-colors text-left"
          onClick={() => onSelect('post-with-response')}
        >
          {/* Mockup area with blue bar */}
          <div className="h-[100px] space-y-2.5">
            <div className="bg-slate-200 rounded h-2 w-3/4" />
            <div className="bg-slate-200 rounded h-2 w-full" />
            <div className="bg-blue-300 rounded h-2.5 w-1/2 mt-3" />
            <div className="bg-slate-200 rounded h-2 w-2/3" />
          </div>

          <p className="font-medium mt-4">Post with Response</p>
          <p className="text-sm text-muted-foreground mt-1">
            Send a post and collect responses from parents.
          </p>
        </button>
      </div>
    </div>
  );
}

export { PostTypePicker };
export type { PostTypePickerProps };
