import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import './Select.css';

export const Select = forwardRef(
  (
    {
      label,
      error,
      helperText,
      required = false,
      options = [],
      placeholder = 'Select an option...',
      id,
      className = '',
      disabled = false,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className={`form-group ${error ? 'form-group--error' : ''} ${className}`}>
        {label && (
          <label htmlFor={selectId} className="form-label">
            {label}
            {required && <span className="form-label__required" aria-hidden="true">*</span>}
          </label>
        )}

        <div className={`select-wrapper ${disabled ? 'select-wrapper--disabled' : ''}`}>
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
            className="select-control"
            {...props}
          >
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {children
              ? children
              : options.map((opt) => {
                  const val = typeof opt === 'object' ? opt.value : opt;
                  const lbl = typeof opt === 'object' ? opt.label : opt;
                  return (
                    <option key={val} value={val}>
                      {lbl}
                    </option>
                  );
                })}
          </select>
          <ChevronDown className="select-arrow" size={18} />
        </div>

        {error && (
          <p id={`${selectId}-error`} className="form-feedback form-feedback--error" role="alert">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={`${selectId}-helper`} className="form-feedback form-feedback--helper">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
