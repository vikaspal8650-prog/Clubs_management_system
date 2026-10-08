import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  UserCheck,
  Award,
  AlertCircle,
  Eye,
  EyeOff,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import './Login.css';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user, getHomeRouteForRole } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [selectedAccount, setSelectedAccount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // A protected-page redirect is only valid when it belongs to the role that
  // has just authenticated. This prevents a previous user's saved route from
  // sending a newly signed-in role to an unauthorized page after sign-out.
  const getDestination = (role) => {
    const homeRoute = getHomeRouteForRole(role);
    const intendedRoute = location.state?.from;

    if (intendedRoute?.pathname === homeRoute) {
      return `${homeRoute}${intendedRoute.search || ''}${intendedRoute.hash || ''}`;
    }

    return homeRoute;
  };

  // If already authenticated, redirect to role dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getDestination(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate, getHomeRouteForRole, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const nextErrors = { email: '', password: '' };

    if (!email || !email.trim()) {
      nextErrors.email = 'College email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid college email address.';
    }
    if (!password) {
      nextErrors.password = 'Password is required.';
    }
    setFieldErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) {
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await login(email.trim(), password);
      navigate(getDestination(loggedUser.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick fill helper for testing
  const handleQuickFill = (demoEmail, demoPassword = 'password123') => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setFieldErrors({ email: '', password: '' });
    setSelectedAccount(demoEmail);
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        {/* College Header Brand */}
        <div className="auth-brand">
          <div className="auth-brand__crest">
            <GraduationCap size={32} />
          </div>
          <h1 className="auth-brand__title">Centralized Club Management</h1>
          <p className="auth-brand__subtitle">
            Official College Governance, Events & Student Activity Portal
          </p>
        </div>

        <Card className="auth-card" bordered={true} padding="lg">
          <div className="auth-card__header">
            <h2 className="auth-card__title">Sign In to Your Account</h2>
            <p className="auth-card__desc">
              Enter your college credentials to access your administrative or student portal.
            </p>
          </div>

          {error && (
            <div className="auth-alert auth-alert--error" role="alert">
              <AlertCircle size={18} className="auth-alert__icon" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <Input
              label="College Email"
              type="email"
              placeholder="e.g. saurabhsrmscet123@gmail.com or student.vikas@college.edu"
              icon={Mail}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
                setFieldErrors((errors) => ({ ...errors, email: '' }));
                setSelectedAccount('');
              }}
              error={fieldErrors.email}
              required
              disabled={isSubmitting}
              autoComplete="email"
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
                setFieldErrors((errors) => ({ ...errors, password: '' }));
              }}
              error={fieldErrors.password}
              required
              disabled={isSubmitting}
              autoComplete="current-password"
              rightElement={
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              rightIcon={ArrowRight}
            >
              {isSubmitting ? 'Signing you in...' : 'Sign In'}
            </Button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="demo-personas-box">
            <div className="demo-personas-divider">
              <span>Testing Accounts (Click to Fill)</span>
            </div>

            <div className="demo-personas-grid">
              <button
                type="button"
                className={`demo-persona-btn demo-persona-btn--dsw ${selectedAccount === 'saurabhsrmscet123@gmail.com' ? 'demo-persona-btn--selected' : ''}`}
                onClick={() => handleQuickFill('saurabhsrmscet123@gmail.com', 'saurabh@123')}
                disabled={isSubmitting}
                aria-pressed={selectedAccount === 'saurabhsrmscet123@gmail.com'}
              >
                <Shield size={16} />
                <div className="demo-persona-btn__text">
                  <span className="demo-persona-btn__role">DSW</span>
                  <span className="demo-persona-btn__desc">saurabhsrmscet123@gmail.com</span>
                </div>
                {selectedAccount === 'saurabhsrmscet123@gmail.com' && <CheckCircle2 className="demo-persona-btn__selected-icon" size={16} />}
              </button>

              <button
                type="button"
                className={`demo-persona-btn demo-persona-btn--hod ${selectedAccount === 'hod.cs@college.edu' ? 'demo-persona-btn--selected' : ''}`}
                onClick={() => handleQuickFill('hod.cs@college.edu')}
                disabled={isSubmitting}
                aria-pressed={selectedAccount === 'hod.cs@college.edu'}
              >
                <UserCheck size={16} />
                <div className="demo-persona-btn__text">
                  <span className="demo-persona-btn__role">HOD (CS)</span>
                  <span className="demo-persona-btn__desc">hod.cs@college.edu</span>
                </div>
                {selectedAccount === 'hod.cs@college.edu' && <CheckCircle2 className="demo-persona-btn__selected-icon" size={16} />}
              </button>

              <button
                type="button"
                className={`demo-persona-btn demo-persona-btn--faculty ${selectedAccount === 'faculty.coding@college.edu' ? 'demo-persona-btn--selected' : ''}`}
                onClick={() => handleQuickFill('faculty.coding@college.edu')}
                disabled={isSubmitting}
                aria-pressed={selectedAccount === 'faculty.coding@college.edu'}
              >
                <Award size={16} />
                <div className="demo-persona-btn__text">
                  <span className="demo-persona-btn__role">Faculty Incharge</span>
                  <span className="demo-persona-btn__desc">faculty.coding@college.edu</span>
                </div>
                {selectedAccount === 'faculty.coding@college.edu' && <CheckCircle2 className="demo-persona-btn__selected-icon" size={16} />}
              </button>

              <button
                type="button"
                className={`demo-persona-btn demo-persona-btn--student ${selectedAccount === 'student.vikas@college.edu' ? 'demo-persona-btn--selected' : ''}`}
                onClick={() => handleQuickFill('student.vikas@college.edu')}
                disabled={isSubmitting}
                aria-pressed={selectedAccount === 'student.vikas@college.edu'}
              >
                <GraduationCap size={16} />
                <div className="demo-persona-btn__text">
                  <span className="demo-persona-btn__role">Student</span>
                  <span className="demo-persona-btn__desc">student.vikas@college.edu</span>
                </div>
                {selectedAccount === 'student.vikas@college.edu' && <CheckCircle2 className="demo-persona-btn__selected-icon" size={16} />}
              </button>

              <button
                type="button"
                className={`demo-persona-btn demo-persona-btn--inactive ${selectedAccount === 'inactive.student@college.edu' ? 'demo-persona-btn--selected' : ''}`}
                onClick={() => handleQuickFill('inactive.student@college.edu')}
                disabled={isSubmitting}
                title="Test inactive account status validation"
                aria-pressed={selectedAccount === 'inactive.student@college.edu'}
              >
                <Info size={16} />
                <div className="demo-persona-btn__text">
                  <span className="demo-persona-btn__role">Inactive Account</span>
                  <span className="demo-persona-btn__desc">inactive.student@college.edu</span>
                </div>
                {selectedAccount === 'inactive.student@college.edu' && <CheckCircle2 className="demo-persona-btn__selected-icon" size={16} />}
              </button>
            </div>
          </div>

          <div className="auth-card__footer">
            <span className="auth-card__footer-text">New college student?</span>
            <Link to="/register" className="auth-card__footer-link">
              Register Student Account
            </Link>
          </div>
        </Card>

        <p className="auth-footer-note">
          Centralized Club Management System • Phase 2 Authentication
        </p>
      </div>
    </div>
  );
};
