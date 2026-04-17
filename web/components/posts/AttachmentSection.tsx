import { Paperclip } from 'lucide-react';

import { Button } from '~/components/ui';

function AttachmentSection() {
  return (
    <div className="space-y-4">
      <p className="font-medium">Attachments</p>

      <div className="space-y-1.5">
        <p className="text-sm font-medium">Files 0/3</p>
        <p className="text-sm text-muted-foreground">Add up to 3 files, less than 5 MB each.</p>
        <Button variant="outline" size="sm" disabled>
          <Paperclip className="h-4 w-4" />
          Add files
        </Button>
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-medium">Photos 0/12</p>
        <p className="text-sm text-muted-foreground">Add up to 12 photos, less than 5 MB each.</p>
      </div>
    </div>
  );
}

export { AttachmentSection };
