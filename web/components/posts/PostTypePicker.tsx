export type PostKind = 'post' | 'post-with-response';

interface PostTypePickerProps {
  onSelect: (type: PostKind) => void;
}

function PostTypePicker({ onSelect }: PostTypePickerProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <h1 className="text-2xl font-semibold tracking-tight">What would you like to create?</h1>
      <p className="mt-1 text-sm text-muted-foreground">Choose a type to get started.</p>

      <div className="mt-8 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          className="cursor-pointer rounded-xl border p-6 text-left transition-colors hover:border-blue-6 hover:bg-blue-2/50"
          onClick={() => onSelect('post')}
        >
          <div className="h-[100px] space-y-2.5">
            <div className="h-2 w-3/4 rounded bg-accent" />
            <div className="h-2 w-full rounded bg-accent" />
            <div className="h-2 w-5/6 rounded bg-accent" />
            <div className="h-2 w-2/3 rounded bg-accent" />
          </div>

          <p className="mt-4 font-medium">Post</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Send a post to parents. They can read it on Parents Gateway.
          </p>
        </button>

        <button
          type="button"
          className="cursor-pointer rounded-xl border p-6 text-left transition-colors hover:border-blue-6 hover:bg-blue-2/50"
          onClick={() => onSelect('post-with-response')}
        >
          <div className="h-[100px] space-y-2.5">
            <div className="h-2 w-3/4 rounded bg-accent" />
            <div className="h-2 w-full rounded bg-accent" />
            <div className="mt-3 h-2.5 w-1/2 rounded bg-blue-6" />
            <div className="h-2 w-2/3 rounded bg-accent" />
          </div>

          <p className="mt-4 font-medium">Post with Response</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Send a post and collect responses from parents.
          </p>
        </button>
      </div>
    </div>
  );
}

export { PostTypePicker };
export type { PostTypePickerProps };
