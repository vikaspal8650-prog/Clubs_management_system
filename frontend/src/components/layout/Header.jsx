import React, { useState } from 'react';
import { Menu, Bell, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_LABELS } from '../../constants/roles';
import { Badge } from '../common/Badge';
import './Header.css';

export const Header = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="app-header">
      <div className="app-header__left">
        <button
          type="button"
          className="header-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="header-breadcrumbs">
          <span className="header-breadcrumbs__system">Centralized Club Management</span>
          <span className="header-breadcrumbs__separator">/</span>
          <span className="header-breadcrumbs__role">
            {user ? ROLE_LABELS[user.role] || user.role : 'Portal'}
          </span>
        </div>
      </div>

      <div className="app-header__right">
        {/* Notifications Icon */}
        <button
          type="button"
          className="header-icon-btn"
          aria-label="View notifications"
          title="Notifications"
        >
          <Bell size={18} />
          <span className="header-icon-badge" />
        </button>

        {/* Profile Dropdown */}
        {user && (
          <div className="header-profile">
            <button
              type="button"
              className="header-profile__btn"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowRoleMenu(false);
              }}
            >
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                alt={user.name}
                className="header-profile__avatar"
              />
              <span className="header-profile__name">{user.name.split(' ')[0]}</span>
              <ChevronDown size={14} className="header-profile__chevron" />
            </button>

            {showUserMenu && (
              <div className="header-profile-dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="header-profile-dropdown__user">
                  <span className="header-profile-dropdown__name">{user.name}</span>
                  <span className="header-profile-dropdown__email">{user.email}</span>
                  <div className="header-profile-dropdown__tag">
                    <Badge variant="primary" size="sm">
                      {user.role}
                    </Badge>
                  </div>
                </div>

                <div className="header-profile-dropdown__divider" />

                <button
                  type="button"
                  className="header-profile-dropdown__item header-profile-dropdown__item--danger"
                  onClick={logout}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
