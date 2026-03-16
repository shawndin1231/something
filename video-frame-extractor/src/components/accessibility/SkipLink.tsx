import { useState, useCallback } from 'react';

export interface SkipLinkProps {
  targetId: string;
  label?: string;
}

export function SkipLink({ targetId, label = '跳转到主要内容' }: SkipLinkProps) {
  const [isVisible, setIsVisible] = useState(false);

  const handleFocus = useCallback(() => {
    setIsVisible(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus();
        target.removeAttribute('tabindex');
      }
    },
    [targetId]
  );

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={`
        fixed top-0 left-0 z-[9999]
        px-4 py-2
        bg-primary-500 text-white
        rounded-br-lg
        font-medium
        transform transition-transform duration-200
        focus:outline-none focus:ring-2 focus:ring-primary-300
        ${isVisible ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {label}
    </a>
  );
}

export default SkipLink;
