import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className = '',
}) => {
  const handleKeyDown = useCallback(
    (e) => {
      if (closeOnEsc && e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    },
    [closeOnEsc, isOpen, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={closeOnOverlayClick ? onClose : undefined}>
      <div
        className={`modal-container modal-container--${size} ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        <div className="modal-header">
          <div>
            {title && (
              <h3 id="modal-title" className="modal-title">
                {title}
              </h3>
            )}
            {description && <p className="modal-description">{description}</p>}
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};
