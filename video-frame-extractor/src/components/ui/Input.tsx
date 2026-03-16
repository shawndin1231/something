import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'filled';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  variant?: InputVariant;
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const sizeStyles: Record<InputSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-3 text-lg',
};

const variantStyles: Record<InputVariant, string> = {
  default: `
    bg-white dark:bg-gray-900
    border border-gray-300 dark:border-gray-600
    hover:border-gray-400 dark:hover:border-gray-500
    focus:border-primary-500 dark:focus:border-primary-400
  `,
  filled: `
    bg-gray-100 dark:bg-gray-800
    border border-transparent
    hover:bg-gray-200 dark:hover:bg-gray-700
    focus:bg-white dark:focus:bg-gray-900 focus:border-primary-500 dark:focus:border-primary-400
  `,
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      variant = 'default',
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={`
              block rounded-lg
              text-gray-900 dark:text-gray-100
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-primary-500/20
              disabled:bg-gray-100 disabled:dark:bg-gray-800
              disabled:cursor-not-allowed disabled:text-gray-500 disabled:dark:text-gray-400
              ${variantStyles[variant]}
              ${sizeStyles[size]}
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${hasError ? 'border-red-500 dark:border-red-400 focus:ring-red-500/20' : ''}
              ${fullWidth ? 'w-full' : ''}
            `.replace(/\s+/g, ' ').trim()}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {rightIcon}
            </div>
          )}
        </div>
        {hasError && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-red-500 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
        {!hasError && hint && (
          <p
            id={`${inputId}-hint`}
            className="mt-1.5 text-sm text-gray-500 dark:text-gray-400"
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
