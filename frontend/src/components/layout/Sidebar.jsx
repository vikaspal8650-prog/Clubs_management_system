import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Calendar,
  Layers,
  Award,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Sparkles,
  LogOut,
  X,
  FileCheck2,
  FileText,
  BarChart3,
  History,
  FolderOpen,
  User,
  Building,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES, ROLE_LABELS } from '../../constants/roles';
import { Badge } from '../common/Badge';
import './Sidebar.css';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, isDSW, isHOD, isFaculty, isStudent, logout } = useAuth();
  const location = useLocation();

  // Define navigation items per role based on system specifications
  const getNavItems = () => {
    if (isDSW) {
      return [
        { label: 'Overview', to: '/dsw', icon: LayoutDashboard },
        { label: 'User Management', to: '/dsw?tab=users', icon: Users },
        { label: 'Department Management', to: '/dsw?tab=departments', icon: Building },
        { label: 'Club Management', to: '/dsw?tab=clubs', icon: Layers },
        { label: 'Event Oversight', to: '/dsw?tab=events', icon: ShieldCheck },
        { label: 'Certificate Approvals', to: '/dsw?tab=certificates', icon: Award },
        { label: 'Reports & Attendance', to: '/dsw?tab=reports', icon: BookOpen },
        { label: 'Document Repository', to: '/dsw?tab=documents', icon: FolderOpen },
        { label: 'Analytics', to: '/dsw?tab=analytics', icon: BarChart3 },
        { label: 'Activity Log', to: '/dsw?tab=activity', icon: History },
      ];
    }
    if (isHOD) {
      return [
        { label: 'Overview', to: '/hod', icon: LayoutDashboard },
        { label: 'Club Management', to: '/hod?tab=clubs', icon: Layers },
        { label: 'Event Oversight', to: '/hod?tab=reviews', icon: FileCheck2 },
        { label: 'Certificate Approvals', to: '/hod?tab=certificates', icon: Award },
        { label: 'Reports & Attendance', to: '/hod?tab=reports', icon: BookOpen },
        { label: 'Document Repository', to: '/hod?tab=documents', icon: FolderOpen },
        { label: 'Analytics', to: '/hod?tab=analytics', icon: BarChart3 },
      ];
    }
    if (isFaculty) {
      return [
        { label: 'Overview', to: '/faculty', icon: LayoutDashboard },
        { label: 'My Clubs', to: '/faculty?tab=clubs', icon: Layers },
        { label: 'Club Coordinators', to: '/faculty?tab=coordinators', icon: Award },
        { label: 'Event Management', to: '/faculty?tab=proposals', icon: ClipboardList },
        { label: 'Certificate Approvals', to: '/faculty?tab=certificates', icon: Award },
        { label: 'Reports & Attendance', to: '/faculty?tab=attendance', icon: BookOpen },
        { label: 'Documents', to: '/faculty?tab=documents', icon: FileText },
      ];
    }
    if (isStudent) {
      return [
        { label: 'Overview', to: '/student', icon: LayoutDashboard },
        { label: 'My Clubs', to: '/student?tab=clubs', icon: Layers },
        { label: 'Events', to: '/student?tab=events', icon: Calendar },
        { label: 'My Registrations', to: '/student?tab=registrations', icon: ClipboardList },
        { label: 'My Attendance', to: '/student?tab=attendance', icon: BookOpen },
        { label: 'Certificates', to: '/student?tab=certificates', icon: Award },
        { label: 'Documents', to: '/student?tab=documents', icon: FileText },
        { label: 'My Profile', to: '/student?tab=profile', icon: User },
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  const getRoleBadgeVariant = () => {
    if (isDSW) return 'danger';
    if (isHOD) return 'purple';
    if (isFaculty) return 'info';
    return 'primary';
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`sidebar-backdrop ${isOpen ? 'sidebar-backdrop--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`app-sidebar ${isOpen ? 'app-sidebar--open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="sidebar-brand__logo">
            <GraduationCap size={24} />
          </div>
          <div className="sidebar-brand__text">
            <h2 className="sidebar-brand__title">UniClubs</h2>
            <span className="sidebar-brand__subtitle">Central Portal</span>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        {user && (
          <div className="sidebar-user">
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
              alt={user.name}
              className="sidebar-user__avatar"
            />
            <div className="sidebar-user__info">
              <span className="sidebar-user__name">{user.name}</span>
              <div className="sidebar-user__badges">
                <Badge variant={getRoleBadgeVariant()} size="sm">
                  {user.role}
                </Badge>
                {user.status && (
                  <Badge variant={user.status === 'ACTIVE' ? 'success' : 'danger'} size="sm" dot>
                    {user.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation List */}
        <nav className="sidebar-nav">
          <span className="sidebar-nav__heading">Main Navigation</span>
          <ul className="sidebar-nav__list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const [targetPathname, targetSearch = ''] = item.to.split('?');
              const isCurrent =
                location.pathname === targetPathname &&
                location.search === (targetSearch ? `?${targetSearch}` : '');
              return (
                <li key={item.label} className="sidebar-nav__item">
                  <NavLink
                    to={item.to}
                    onClick={onClose}
                    className={`sidebar-nav__link ${isCurrent ? 'sidebar-nav__link--active' : ''}`}
                  >
                    <Icon size={18} className="sidebar-nav__icon" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button type="button" className="sidebar-logout-btn" onClick={logout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
