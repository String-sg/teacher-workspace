import { LogIn } from 'lucide-react';
import React from 'react';

import { Button } from '~/components/ui';

const SessionExpiredView: React.FC = () => {
  function handleReauth() {
    // Hard reload to `/` so the server-side auth chain re-runs and issues a
    // fresh session cookie. Once the dedicated /session/login flow lands this
    // can route there directly.
    window.location.href = '/';
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Session expired</h1>
      <p className="text-muted-foreground">
        Your session has ended or is no longer valid. Sign in again to continue.
      </p>
      <Button onClick={handleReauth}>
        <LogIn className="mr-2 h-4 w-4" />
        Sign in again
      </Button>
    </div>
  );
};

export { SessionExpiredView as Component };
