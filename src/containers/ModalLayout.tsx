import { Button } from '@flow/core';
import { X } from '@flow/icons';
import React from 'react';
import { Outlet, useNavigate } from 'react-router';

import { PageHeader } from '~/components/PageHeader';

const ModalLayout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-svh flex-1 flex-col bg-slate-1">
      <PageHeader
        rightActions={
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full border border-slate-6 bg-slate-2 p-xs hover:bg-slate-3"
            onClick={() => navigate('/')}
          >
            <X size="16" />
          </Button>
        }
      />
      <Outlet />
    </div>
  );
};

export default ModalLayout;
