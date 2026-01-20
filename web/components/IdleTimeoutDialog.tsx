import { Dialog, DialogContent, DialogOverlay, Typography } from '@flow/core';
import React from 'react';

import Button from '~/components/Button';

const IdleTimeoutDialog: React.FC<{ isOpen?: boolean }> = ({ isOpen = false }) => {
  return (
    <Dialog open={isOpen}>
      <DialogOverlay className="bg-slate-alpha-11" />
      <DialogContent
        className="flex max-w-128 flex-col gap-md rounded-3xl p-lg"
        showCloseButton={false}
      >
        <div className="flex flex-col gap-xs">
          <Typography variant="title-lg">Taking a break?</Typography>
          <Typography variant="body-md">
            We&apos;ll sign you out in 5 minutes to keep your account secure.
          </Typography>
        </div>
        <div className="flex gap-xs self-end">
          <Button variant="outline">Sign out</Button>
          <Button
            variant="ghost"
            className="bg-blue-9 text-white hover:bg-blue-10 active:bg-blue-9"
          >
            I&apos;m still here
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IdleTimeoutDialog;
