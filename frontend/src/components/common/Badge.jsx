import React from 'react';
import './Badge.css';

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  return (
    <span className={`badge badge--${variant} badge--${size} ${className}`} {...props}>
      {dot && <span className="badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
};
