import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui';
import { RESPONSE_TYPE_META, type ResponseType } from '~/data/mock-pg-announcements';

interface SendConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  recipientCount: number;
  responseType: ResponseType;
  onConfirm: () => void;
}

function SendConfirmationDialog({
  open,
  onOpenChange,
  title,
  recipientCount,
  responseType,
  onConfirm,
}: SendConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Post</DialogTitle>
          <DialogDescription>
            Are you sure you want to send this post? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">Title</p>
            <p className="max-w-[240px] truncate text-right text-sm font-medium">
              {title || 'Untitled'}
            </p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">Recipients</p>
            <p className="text-sm font-medium">{recipientCount} students</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">Response Type</p>
            <p className="text-sm font-medium">{RESPONSE_TYPE_META[responseType].label}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="default" onClick={onConfirm}>
            Send Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { SendConfirmationDialog };
export type { SendConfirmationDialogProps };
