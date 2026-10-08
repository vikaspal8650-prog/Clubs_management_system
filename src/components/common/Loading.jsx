import React from 'react';
import { Loader2, GraduationCap } from 'lucide-react';
import './Loading.css';

export const Spinner = ({ size = 'md', className = '' }) => {
  const pixelSize = size === 'sm' ? 16 : size === 'lg' ? 32 : size === 'xl' ? 48 : 24;
  return (
    <div className={`spinner-wrapper spinner--${size} ${className}`} role="status">
      <Loader2 size={pixelSize} className="spinner-icon" />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export const Skeleton = ({
  width = '100%',
  height = '20px',
  radius = 'var(--radius-sm)',
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`skeleton-box ${className}`}
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

export const PageLoader = ({ message = 'Loading college records...' }) => {
  return (
    <div className="page-loader" role="alert" aria-busy="true">
      <div className="page-loader__card">
        <div className="page-loader__icon-box">
          <GraduationCap size={36} className="page-loader__crest" />
        </div>
        <Spinner size="md" />
        <p className="page-loader__text">{message}</p>
      </div>
    </div>
  );
};
