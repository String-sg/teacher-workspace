import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';

import { cn } from '~/lib/utils';

function TooltipProvider({
  delay = 600,
  closeDelay = 0,
  ...props
}: TooltipPrimitive.Provider.Props & { delayDuration?: number }) {
  return <TooltipPrimitive.Provider delay={delay} closeDelay={closeDelay} {...props} />;
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  side = 'top',
  sideOffset = 4,
  align = 'center',
  alignOffset = 0,
  showArrow = false,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<TooltipPrimitive.Positioner.Props, 'side' | 'sideOffset' | 'align' | 'alignOffset'> & {
    showArrow?: boolean;
  }) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            'z-50 w-fit origin-(--transform-origin) rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-md outline-hidden',
            'data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
            'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1',
            className,
          )}
          {...props}
        >
          {children}
          {showArrow && <TooltipPrimitive.Arrow className="fill-foreground" />}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
