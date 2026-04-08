import { Check, X } from '@flow/icons';

import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui';
import { formatDate } from '~/helpers/dateTime';

import type { PGRecipient, ResponseType } from '~/data/mock-pg-announcements';

interface RecipientReadTableProps {
  recipients: PGRecipient[];
  responseType: ResponseType;
}

export function RecipientReadTable({ recipients, responseType }: RecipientReadTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Index No.</TableHead>
            <TableHead>Read Status</TableHead>
            <TableHead>Read At</TableHead>
            <TableHead>Parent</TableHead>
            {responseType === 'acknowledge' && (
              <>
                <TableHead>Acknowledged</TableHead>
                <TableHead>Acknowledged At</TableHead>
              </>
            )}
            {responseType === 'yes-no' && (
              <>
                <TableHead>Response</TableHead>
                <TableHead>Responded At</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {recipients.map((recipient) => (
            <TableRow key={recipient.studentId}>
              <TableCell className="font-medium">
                {recipient.studentName}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {recipient.classLabel}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {recipient.indexNo}
              </TableCell>
              <TableCell>
                {recipient.readStatus === 'read' ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {recipient.readStatus === 'read'
                  ? formatDate(recipient.respondedAt)
                  : '\u2014'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {recipient.parentName}
              </TableCell>
              {responseType === 'acknowledge' && (
                <>
                  <TableCell>
                    {recipient.acknowledgedAt ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(recipient.acknowledgedAt)}
                  </TableCell>
                </>
              )}
              {responseType === 'yes-no' && (
                <>
                  <TableCell>
                    {recipient.formResponse === 'yes' ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Yes
                      </Badge>
                    ) : recipient.formResponse === 'no' ? (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                        No
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">{'\u2014'}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(recipient.respondedAt)}
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
