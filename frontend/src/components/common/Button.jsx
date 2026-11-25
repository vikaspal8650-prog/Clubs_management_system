import React from 'react';
import { Loader2 } from 'lucide-react';
import './Button.css';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  rightIcon: RightIcon,
  fullWidth = false,
  className = '',
  onClick,
  ...props
}) => {
  const isDisabled = disabled || isLoading;
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
  const IconRenderer = ({ component: IconComponent }) =>
    IconComponent ? <IconComponent size={iconSize} /> : null;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`btn btn--${variant} btn--${size} ${fullWidth ? 'btn--full' : ''} ${
        isLoading ? 'btn--loading' : ''
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="btn__spinner" size={iconSize} />
      ) : Icon ? (
        <span className="btn__icon"><IconRenderer component={Icon} /></span>
      ) : null}

      <span className="btn__text">{children}</span>

      {!isLoading && RightIcon ? (
        <span className="btn__icon btn__icon--right">
          <IconRenderer component={RightIcon} />
        </span>
      ) : null}
    </button>
  );
};
