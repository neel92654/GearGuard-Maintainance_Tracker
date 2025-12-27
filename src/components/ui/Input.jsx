/**
 * GearGuard - Input Component
 * 
 * Reusable input field with label, error state, and icons.
 */

import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  containerClassName = '',
  required = false,
  ...props
}, ref) => {
  const hasError = !!error;

  return (
    <div className={`${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className={`w-5 h-5 ${hasError ? 'text-red-400' : 'text-gray-400'}`} />
          </div>
        )}
        <input
          ref={ref}
          className={`
            block w-full rounded-lg border
            ${Icon && iconPosition === 'left' ? 'pl-10' : 'pl-4'}
            ${Icon && iconPosition === 'right' ? 'pr-10' : 'pr-4'}
            py-2.5 text-gray-900
            placeholder:text-gray-400
            transition-colors duration-200
            ${hasError 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {Icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Icon className={`w-5 h-5 ${hasError ? 'text-red-400' : 'text-gray-400'}`} />
          </div>
        )}
      </div>
      {(error || helperText) && (
        <p className={`mt-1 text-sm ${hasError ? 'text-red-500' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
