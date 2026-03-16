import { useCallback } from 'react';
import { announceToScreenReader } from '../utils/accessibility';

export interface UseAnnounceOptions {
  defaultPriority?: 'polite' | 'assertive';
}

export function useAnnounce(options: UseAnnounceOptions = {}) {
  const { defaultPriority = 'polite' } = options;

  const announce = useCallback(
    (message: string, priority?: 'polite' | 'assertive') => {
      announceToScreenReader(message, priority ?? defaultPriority);
    },
    [defaultPriority]
  );

  const announcePolite = useCallback(
    (message: string) => {
      announce(message, 'polite');
    },
    [announce]
  );

  const announceAssertive = useCallback(
    (message: string) => {
      announce(message, 'assertive');
    },
    [announce]
  );

  return {
    announce,
    announcePolite,
    announceAssertive,
  };
}
