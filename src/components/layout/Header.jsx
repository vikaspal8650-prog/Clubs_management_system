import React, { useState } from 'react';
import { Menu, Bell, Shield, UserCheck, ChevronDown, LogOut, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES, ROLE_LABELS } from '../../constants/roles';
import { Badge } from '../common/Badge';
import './Header.css';

export const Header = ({ onToggleSidebar }) => {
  const { user, switchRoleDemo, logout } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleRoleSelect = async (role) => {
    setShowRoleMenu(false);
    await switchRoleDemo(role);
  };

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
        {/* Quick Demo Role Switcher for Phase 2 Evaluation */}
        <div className="demo-role-switcher">
          <button
            type="button"
            className="demo-role-switcher__btn"
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowUserMenu(false);
            }}
            title="Switch demo persona for testing"
          >
            <Shield size={14} className="demo-role-switcher__icon" />
            <span className="demo-role-switcher__label">Demo Persona:</span>
            <span className="demo-role-switcher__current">
              {user?.role || 'Guest'}
            </span>
            <ChevronDown size={14} />
          </button>

          {showRoleMenu && (
            <div className="demo-role-dropdown" onClick={(e) => e.stopPropagation()}>
              <div className="demo-role-dropdown__header">
                <span className="demo-role-dropdown__title">Switch Role Persona</span>
                <span className="demo-role-dropdown__hint">Phase 2 Testing</span>
              </div>
              <div className="demo-role-dropdown__list">
                <button
                  type="button"
                  className={`demo-role-item ${user?.role === ROLES.DSW ? 'demo-role-item--active' : ''}`}
                  onClick={() => handleRoleSelect(ROLES.DSW)}
                >
                  <div className="demo-role-item__info">
                    <span className="demo-role-item__name">DSW (Dr. Saurabh Gupta)</span>
                    <span className="demo-role-item__desc">Central administration & HOD/Faculty control</span>
                  </div>
                  {user?.role === ROLES.DSW && <Check size={16} className="demo-role-item__check" />}
                </button>

                <button
                  type="button"
                  className={`demo-role-item ${user?.role === ROLES.HOD ? 'demo-role-item--active' : ''}`}
                  onClick={() => handleRoleSelect(ROLES.HOD)}
                >
                  <div className="demo-role-item__info">
                    <span className="demo-role-item__name">HOD (Dr. Ramesh Sharma)</span>
                    <span className="demo-role-item__desc">Computer Science Department</span>
                  </div>
                  {user?.role === ROLES.HOD && <Check size={16} className="demo-role-item__check" />}
                </button>

                <button
                  type="button"
                  className={`demo-role-item ${user?.role === ROLES.FACULTY_INCHARGE ? 'demo-role-item--active' : ''}`}
                  onClick={() => handleRoleSelect(ROLES.FACULTY_INCHARGE)}
                >
                  <div className="demo-role-item__info">
                    <span className="demo-role-item__name">Faculty Incharge (Prof. Vivek Sengupta)</span>
                    <span className="demo-role-item__desc">Coding & AI Club Mentor</span>
                  </div>
                  {user?.role === ROLES.FACULTY_INCHARGE && <Check size={16} className="demo-role-item__check" />}
                </button>

                <button
                  type="button"
                  className={`demo-role-item ${user?.role === ROLES.STUDENT ? 'demo-role-item--active' : ''}`}
                  onClick={() => handleRoleSelect(ROLES.STUDENT)}
                >
                  <div className="demo-role-item__info">
                    <span className="demo-role-item__name">Student (Vikas Pal)</span>
                    <span className="demo-role-item__desc">Self-registered student member</span>
                  </div>
                  {user?.role === ROLES.STUDENT && (
                    <Check size={16} className="demo-role-item__check" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

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
