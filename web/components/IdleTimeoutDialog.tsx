import { Dialog, DialogContent, DialogOverlay, Typography } from '@flow/core';
import React from 'react';

import Button from '~/components/Button';

interface IdleTimeoutDialogProps {
  isOpen?: boolean;
  onSignOut?: () => void;
  onClose?: () => void;
}

const IdleTimeoutDialog: React.FC<IdleTimeoutDialogProps> = ({
  isOpen = false,
  onSignOut,
  onClose,
}) => {
  return (
    <Dialog open={isOpen}>
      <DialogOverlay className="z-100000 bg-slate-alpha-11" />
      <DialogContent
        className="z-100001 flex max-w-128 flex-col gap-md rounded-3xl p-lg"
        showCloseButton={false}
      >
        <div className="flex flex-col gap-xs">
          <Typography variant="title-lg">Taking a break?</Typography>
          <Typography variant="body-md">
            We&apos;ll sign you out in 5 minutes to keep your account secure.
          </Typography>
        </div>
        <div className="flex gap-xs self-end">
          <Button variant="outline" onClick={onSignOut}>
            Sign out
          </Button>
          <Button
            variant="ghost"
            className="bg-blue-9 text-white hover:bg-blue-10 active:bg-blue-9"
            onClick={onClose}
          >
            I&apos;m still here
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IdleTimeoutDialog;
