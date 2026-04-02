import {
  Badge,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Progress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
  Typography,
} from '@flow/core';
import {
  AlertTriangle,
  Copy,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Users,
} from '@flow/icons';
import React, { useMemo, useState } from 'react';

import {
  mockPGAnnouncements,
  type PGAnnouncement,
  type PGStatus,
  type ResponseTypeWithResponse,
  requiresResponse,
} from '~/data/mock-pg-announcements';

type PostTab = 'view-only' | 'with-responses';

const STATUS_CONFIG: Record<PGStatus, { label: string; className: string }> = {
  posted: {
    label: 'Posted',
    className: 'bg-green-50 text-green-700 border-green-200',
  },
  scheduled: {
    label: 'Scheduled',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  draft: {
    label: 'Draft',
    className: 'bg-slate-3 text-slate-11 border-slate-6',
  },
};

const RESPONSE_TYPE_CONFIG: Record<
  ResponseTypeWithResponse,
  { label: string; className: string }
> = {
  acknowledge: {
    label: 'Acknowledge',
    className: 'bg-blue-50 text-blue-600 ring-blue-200',
  },
  'yes-no': {
    label: 'Yes/No',
    className: 'bg-violet-50 text-violet-600 ring-violet-200',
  },
};

const DATE_FORMATTER = new Intl.DateTimeFormat('en-SG', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Singapore',
});

function formatDate(iso: string | undefined): string {
  if (!iso) return '\u2014';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '\u2014';
  return DATE_FORMATTER.format(date);
}

function isLowReadRate(
  postedAt: string | undefined,
  readCount: number,
  total: number,
): boolean {
  if (!postedAt || total === 0) return false;
  const hoursElapsed =
    (Date.now() - new Date(postedAt).getTime()) / 3_600_000;
  return hoursElapsed >= 48 && readCount / total < 0.5;
}

function getRelevantDate(announcement: PGAnnouncement): string | undefined {
  if (announcement.status === 'posted') return announcement.postedAt;
  if (announcement.status === 'scheduled') return announcement.scheduledAt;
  return announcement.createdAt;
}

function CountWithProgress({
  count,
  total,
}: {
  count: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {count}/{total}
      </span>
      <Progress
        value={total > 0 ? (count / total) * 100 : 0}
        className="h-1.5 w-16"
      />
    </div>
  );
}


const PostsView: React.FC = () => {
  const [tab, setTab] = useState<PostTab>('view-only');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return mockPGAnnouncements
      .filter((a) => {
        if (tab === 'view-only' && requiresResponse(a.responseType))
          return false;
        if (tab === 'with-responses' && !requiresResponse(a.responseType))
          return false;

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            a.title.toLowerCase().includes(q) ||
            a.description.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = getRelevantDate(a) ?? '';
        const dateB = getRelevantDate(b) ?? '';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
  }, [tab, searchQuery]);

  return (
    <div className="flex flex-col">
      {/* Page header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <Typography variant="title-lg" asChild>
            <h1>Posts</h1>
          </Typography>
          <Button variant="default" size="sm" disabled>
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </div>
        <Typography
          variant="body-sm"
          className="mt-1 hidden text-muted-foreground md:block"
          asChild
        >
          <p>
            Send posts to parents via Parents Gateway. Send a view-only post or
            collect responses.
          </p>
        </Typography>
      </div>

      {/* Toolbar: tabs + search */}
      <div className="mt-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6">
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as PostTab)}
          >
            <TabsList>
              <TabsTrigger value="view-only">Posts</TabsTrigger>
              <TabsTrigger value="with-responses">
                Posts with responses
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-w-[180px] max-w-[240px] pl-9"
              aria-label="Search posts"
            />
          </div>
        </div>

        {/* Table */}
        <div className="max-w-full overflow-x-auto bg-card">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Typography variant="body-md" className="text-muted-foreground">
                No posts match your search.
              </Typography>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead className="w-[500px] pl-6">Title</TableHead>
                  <TableHead className="w-[110px]">Date</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[90px]">Owner</TableHead>
                  <TableHead className="w-[150px]">
                    Read / Response
                  </TableHead>
                  <TableHead className="w-[48px] pr-2">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((announcement) => {
                  const {
                    totalCount,
                    readCount,
                    responseCount,
                    yesCount,
                    noCount,
                  } = announcement.stats;
                  const hasResponseType = requiresResponse(
                    announcement.responseType,
                  );
                  const showLowRead = isLowReadRate(
                    announcement.postedAt,
                    readCount,
                    totalCount,
                  );
                  const relevantDate = getRelevantDate(announcement);
                  const isShared = announcement.ownership === 'shared';
                  const statusConfig = STATUS_CONFIG[announcement.status];
                  const responseTypeConfig = requiresResponse(
                    announcement.responseType,
                  )
                    ? RESPONSE_TYPE_CONFIG[announcement.responseType]
                    : undefined;

                  return (
                    <TableRow key={announcement.id}>
                      {/* Title */}
                      <TableCell className="overflow-hidden pl-6 whitespace-normal">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-medium">
                              {announcement.title}
                            </span>
                            {responseTypeConfig && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[10px]',
                                  responseTypeConfig.className,
                                )}
                              >
                                {responseTypeConfig.label}
                              </Badge>
                            )}
                            {showLowRead && (
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                            )}
                          </div>
                          <div className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                            {announcement.description}
                          </div>
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-sm text-muted-foreground">
                        <span
                          className={
                            announcement.status === 'scheduled'
                              ? 'text-amber-600'
                              : undefined
                          }
                        >
                          {formatDate(relevantDate)}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusConfig.className}
                        >
                          {statusConfig.label}
                        </Badge>
                      </TableCell>

                      {/* Owner */}
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          {isShared ? (
                            <>
                              <Users className="h-3.5 w-3.5 shrink-0" />
                              <span>Shared</span>
                            </>
                          ) : (
                            <span>Mine</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Read / Response */}
                      <TableCell className="pr-6">
                        {announcement.status !== 'posted' ? (
                          <span className="text-sm text-muted-foreground">
                            {'\u2014'}
                          </span>
                        ) : hasResponseType ? (
                          <div className="space-y-0.5">
                            <CountWithProgress
                              count={responseCount}
                              total={totalCount}
                            />
                            {announcement.responseType === 'yes-no' &&
                              totalCount > 0 && (
                                <Typography
                                  variant="label-xs"
                                  className="text-muted-foreground"
                                  asChild
                                >
                                  <p>
                                    {yesCount} yes &middot; {noCount} no
                                  </p>
                                </Typography>
                              )}
                            {announcement.responseType === 'acknowledge' &&
                              responseCount > 0 && (
                                <Typography
                                  variant="label-xs"
                                  className="text-muted-foreground"
                                  asChild
                                >
                                  <p>{responseCount} acknowledged</p>
                                </Typography>
                              )}
                          </div>
                        ) : (
                          <CountWithProgress
                            count={readCount}
                            total={totalCount}
                          />
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="w-[48px] pr-2 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="More actions"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export { PostsView as Component };
