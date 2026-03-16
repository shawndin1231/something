import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  header?: ReactNode;
  footer?: ReactNode;
  hoverable?: boolean;
  clickable?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: `
    bg-white dark:bg-gray-900
    border border-gray-200 dark:border-gray-700
    shadow-sm
  `,
  elevated: `
    bg-white dark:bg-gray-900
    shadow-lg dark:shadow-xl
  `,
  outlined: `
    bg-transparent
    border-2 border-gray-300 dark:border-gray-600
  `,
  filled: `
    bg-gray-50 dark:bg-gray-800
  `,
};

const paddingStyles: Record<'none' | 'sm' | 'md' | 'lg', string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      header,
      footer,
      hoverable = false,
      clickable = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const Component = clickable ? 'button' : 'div';

    return (
      <Component
        ref={ref as any}
        className={`
          rounded-xl
          overflow-hidden
          transition-all duration-200 ease-in-out
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${hoverable ? 'hover:shadow-md dark:hover:shadow-lg hover:-translate-y-0.5' : ''}
          ${clickable ? 'cursor-pointer text-left w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950' : ''}
          ${className}
        `.replace(/\s+/g, ' ').trim()}
        {...(props as any)}
      >
        {header && (
          <div className={`border-b border-gray-200 dark:border-gray-700 ${padding !== 'none' ? '-mx-4 -mt-4 px-4 pt-4 mb-4' : ''}`}>
            {header}
          </div>
        )}
        {children}
        {footer && (
          <div className={`border-t border-gray-200 dark:border-gray-700 ${padding !== 'none' ? '-mx-4 -mb-4 px-4 pb-4 mt-4' : ''}`}>
            {footer}
          </div>
        )}
      </Component>
    );
  }
);

Card.displayName = 'Card';

// Card sub-components for better composition
export const CardHeader: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${className}`}>
    {children}
  </div>
);

export const CardTitle: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <h3 className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${className}`}>
    {children}
  </h3>
);

export const CardDescription: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <p className={`text-sm text-gray-500 dark:text-gray-400 mt-1 ${className}`}>
    {children}
  </p>
);

export const CardContent: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={className}>{children}</div>;

export const CardFooter: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`flex items-center justify-end gap-2 ${className}`}>
    {children}
  </div>
);

export default Card;
