import React from 'react';
import { Inbox } from 'lucide-react';
import './EmptyState.css';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are currently no items available to display in this section.',
  action,
  size = 'md',
  className = '',
}) => {
  return (
    <div className={`empty-state empty-state--${size} ${className}`}>
      <div className="empty-state__icon-wrapper">
        {React.isValidElement(Icon)
          ? Icon
          : <Icon size={size === 'sm' ? 24 : size === 'lg' ? 44 : 32} className="empty-state__icon" />}
      </div>
      <h4 className="empty-state__title">{title}</h4>
      {description && <p className="empty-state__description">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
};
