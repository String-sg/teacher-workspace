import React from 'react';
import { useNavigate } from 'react-router';

import { Button } from '~/components/ui';

interface State {
  hasError: boolean;
}

class ChunkErrorBoundaryInner extends React.Component<
  { children: React.ReactNode; onRetry: () => void },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-16">
          <h2 className="text-xl font-semibold tracking-tight">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            The page failed to load. This can happen due to a network issue.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onRetry();
            }}
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

function ChunkErrorBoundary({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return <ChunkErrorBoundaryInner onRetry={() => navigate(0)}>{children}</ChunkErrorBoundaryInner>;
}

export { ChunkErrorBoundary };
