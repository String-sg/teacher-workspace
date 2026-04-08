import { Typography } from '@flow/core';
import { Paperclip } from '@flow/icons';

import { Button } from '~/components/ui';

function AttachmentSection() {
  return (
    <div className="space-y-4">
      <p className="font-medium">Attachments</p>

      {/* Files */}
      <div className="space-y-1.5">
        <Typography variant="body-sm" className="font-medium">
          Files 0/3
        </Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          Add up to 3 files, less than 5 MB each.
        </Typography>
        <Button variant="outline" size="sm" disabled>
          <Paperclip className="h-4 w-4 mr-1.5" />
          Add files
        </Button>
      </div>

      {/* Photos */}
      <div className="space-y-1.5">
        <Typography variant="body-sm" className="font-medium">
          Photos 0/12
        </Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          Add up to 12 photos, less than 5 MB each.
        </Typography>
      </div>
    </div>
  );
}

export { AttachmentSection };
