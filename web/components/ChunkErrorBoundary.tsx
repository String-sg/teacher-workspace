import { Typography } from '@flow/core';
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
          <Typography variant="title-md">Something went wrong</Typography>
          <Typography variant="body-sm" className="text-muted-foreground">
            The page failed to load. This can happen due to a network issue.
          </Typography>
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

  return (
    <ChunkErrorBoundaryInner onRetry={() => navigate(0)}>
      {children}
    </ChunkErrorBoundaryInner>
  );
}

export { ChunkErrorBoundary };
