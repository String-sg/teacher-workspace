import { CalendarClock, ChevronDown, Send } from 'lucide-react';
import { useState } from 'react';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui';

interface SplitPostButtonProps {
  disabled?: boolean;
  onPost: () => void;
  onSchedule?: () => void;
}

type SplitAction = 'post' | 'schedule';

function SplitPostButton({ disabled, onPost, onSchedule }: SplitPostButtonProps) {
  const [action, setAction] = useState<SplitAction>('post');

  function handleMainClick() {
    if (action === 'schedule' && onSchedule) {
      onSchedule();
    } else {
      onPost();
    }
  }

  return (
    <div className="flex overflow-hidden rounded-full">
      <Button
        variant="default"
        size="sm"
        disabled={disabled}
        onClick={handleMainClick}
        className="rounded-r-none"
      >
        {action === 'schedule' ? (
          <CalendarClock className="mr-1.5 h-4 w-4" />
        ) : (
          <Send className="mr-1.5 h-4 w-4" />
        )}
        {action === 'schedule' ? 'Schedule' : 'Post'}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="default"
              size="sm"
              disabled={disabled}
              className="rounded-l-none border-l border-white/20 px-2"
            />
          }
        >
          <ChevronDown className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setAction('post')}>
            <Send className="mr-2 h-4 w-4" />
            Post now
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAction('schedule')}>
            <CalendarClock className="mr-2 h-4 w-4" />
            Schedule for later
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { SplitPostButton };
export type { SplitPostButtonProps };
