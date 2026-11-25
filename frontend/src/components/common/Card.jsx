import React from 'react';
import './Card.css';

export const Card = ({
  children,
  className = '',
  hoverable = false,
  bordered = true,
  padding = 'default', // 'none' | 'sm' | 'default' | 'lg'
  onClick,
  onKeyDown,
  role,
  tabIndex,
  ...props
}) => {
  const isClickable = Boolean(onClick) || hoverable;

  const handleKeyDown = (e) => {
    if (onKeyDown) {
      onKeyDown(e);
    } else if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={isClickable ? handleKeyDown : onKeyDown}
      role={role || (isClickable ? 'button' : undefined)}
      tabIndex={tabIndex !== undefined ? tabIndex : isClickable ? 0 : undefined}
      className={`card ${bordered ? 'card--bordered' : ''} ${
        isClickable ? 'card--hoverable' : ''
      } card--pad-${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', action, ...props }) => (
  <div className={`card__header ${className}`} {...props}>
    <div className="card__header-text">{children}</div>
    {action && <div className="card__header-action">{action}</div>}
  </div>
);

export const CardTitle = ({ children, className = '', as: Tag = 'h3', ...props }) => (
  <Tag className={`card__title ${className}`} {...props}>
    {children}
  </Tag>
);

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`card__description ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={`card__content ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`card__footer ${className}`} {...props}>
    {children}
  </div>
);
