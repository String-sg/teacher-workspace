import { useEffect, useRef, useState } from 'react';

/**
 * A hook to track if an element is within the viewport.
 *
 * @param ref - The ref to the element to check if it is within the viewport.
 * @returns `true` if the element is within the viewport, `false` otherwise.
 */
export function useIsWithinViewport<T extends HTMLElement | null>(ref: React.RefObject<T>) {
  const [isWithinViewport, setIsWithinViewport] = useState(false);
  const observerRef = useRef<IntersectionObserver>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    observerRef.current = new IntersectionObserver(([entry]) => {
      setIsWithinViewport(entry.isIntersecting);
    });

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [ref]);

  return isWithinViewport;
}
