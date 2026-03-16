import { useEffect, useRef } from 'react';
import { trapFocus, focusFirstElement } from '../utils/accessibility';

export interface UseFocusTrapOptions {
  isActive?: boolean;
  autoFocus?: boolean;
  restoreFocus?: boolean;
}

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  options: UseFocusTrapOptions = {}
) {
  const { isActive = true, autoFocus = true, restoreFocus = true } = options;
  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    previousActiveElement.current = document.activeElement as HTMLElement;

    if (autoFocus) {
      setTimeout(() => {
        if (containerRef.current) {
          focusFirstElement(containerRef.current);
        }
      }, 0);
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (containerRef.current) {
        trapFocus(containerRef.current, event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, autoFocus, restoreFocus]);

  return containerRef;
}
