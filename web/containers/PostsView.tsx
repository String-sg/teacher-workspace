import { Typography } from '@flow/core';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
} from '~/components/ui';
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
import { Link, useNavigate } from 'react-router';

import { ReadRate } from '~/components/comms/ReadRate';
import { StatusBadge } from '~/components/comms/StatusBadge';
import {
  mockPGAnnouncements,
  requiresResponse,
} from '~/data/mock-pg-announcements';
import { formatDate, getRelevantDate, isLowReadRate } from '~/helpers/dateTime';

type PostTab = 'view-only' | 'with-responses';


const PostsView: React.FC = () => {
  const navigate = useNavigate();
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
          <Button variant="default" size="sm" asChild>
            <Link to="/posts/new">
              <Plus className="h-4 w-4" />
              Create
            </Link>
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
        <div className="max-w-full overflow-x-auto bg-white">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              {searchQuery ? (
                <>
                  <Typography variant="body-md" className="text-foreground">
                    No posts match your search.
                  </Typography>
                  <Typography
                    variant="body-sm"
                    className="mt-1 text-muted-foreground"
                  >
                    Try adjusting your search terms.
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="body-md" className="text-foreground">
                    No posts yet.
                  </Typography>
                  <Typography
                    variant="body-sm"
                    className="mt-1 text-muted-foreground"
                  >
                    Create your first post to get started.
                  </Typography>
                  <Button variant="default" size="sm" className="mt-4" asChild>
                    <Link to="/posts/new">
                      <Plus className="h-4 w-4" />
                      Create
                    </Link>
                  </Button>
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader className="border-b bg-white">
                <TableRow>
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

                  return (
                    <TableRow
                      key={announcement.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/posts/${announcement.id}`)}
                    >
                      {/* Title */}
                      <TableCell className="overflow-hidden pl-6 whitespace-normal">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-medium">
                              {announcement.title}
                            </span>
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
                        <StatusBadge status={announcement.status} />
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
                            <ReadRate
                              readCount={responseCount}
                              totalCount={totalCount}
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
                          <ReadRate
                            readCount={readCount}
                            totalCount={totalCount}
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
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              aria-label="More actions"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/posts/new');
                              }}
                            >
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
