import React, { forwardRef } from 'react';
import './Input.css';

export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      required = false,
      icon: Icon,
      rightElement,
      id,
      className = '',
      type = 'text',
      disabled = false,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className={`form-group ${error ? 'form-group--error' : ''} ${className}`}>
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
            {required && <span className="form-label__required" aria-hidden="true">*</span>}
          </label>
        )}

        <div className={`input-wrapper ${disabled ? 'input-wrapper--disabled' : ''}`}>
          {Icon && (
            <span className="input-icon input-icon--prefix">
              {React.isValidElement(Icon) ? Icon : <Icon size={18} />}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={`input-control ${Icon ? 'input-control--has-prefix' : ''} ${
              rightElement ? 'input-control--has-suffix' : ''
            }`}
            {...props}
          />

          {rightElement && <div className="input-suffix">{rightElement}</div>}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="form-feedback form-feedback--error" role="alert">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={`${inputId}-helper`} className="form-feedback form-feedback--helper">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
