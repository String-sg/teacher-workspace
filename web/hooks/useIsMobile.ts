import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 640;

/**
 * A hook to check if the viewport is mobile.
 *
 * @returns `true` if the viewport is mobile, `false` otherwise.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
