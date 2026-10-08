import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  User,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { DEPARTMENTS, ACADEMIC_YEARS, SEMESTERS_BY_YEAR } from '../../constants/departments';
import { departmentService } from '../../services/departmentService';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import './RegisterStudent.css';

export const RegisterStudent = () => {
  const navigate = useNavigate();
  const { registerStudent, isAuthenticated, user, getHomeRouteForRole } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNumber: '',
    branch: '',
    year: '1st Year',
    semester: 'Semester 1',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState(DEPARTMENTS);

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getHomeRouteForRole(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate, getHomeRouteForRole]);

  useEffect(() => {
    departmentService.getDepartments().then(setDepartments).catch(() => setDepartments(DEPARTMENTS));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'year') {
      const availableSemesters = SEMESTERS_BY_YEAR[value] || ['Semester 1'];
      setFormData((prev) => ({
        ...prev,
        year: value,
        semester: availableSemesters[0],
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.name || !formData.name.trim()) {
      setError('Full Name is required.');
      return;
    }

    if (!formData.email || !formData.email.trim()) {
      setError('College Email is required.');
      return;
    }

    const cleanRoll = (formData.rollNumber || '').trim();
    if (!cleanRoll) {
      setError('Roll Number is required.');
      return;
    }

    if (!/^\d{10,15}$/.test(cleanRoll)) {
      setError('Roll number must consist of 10 to 15 digits only (e.g. 2400014010013).');
      return;
    }

    if (!formData.branch || !formData.branch.trim()) {
      setError('Please select your academic branch.');
      return;
    }

    if (!formData.year || !formData.year.trim()) {
      setError('Please select your academic year.');
      return;
    }

    if (!formData.semester || !formData.semester.trim()) {
      setError('Please select your current semester.');
      return;
    }

    if (!formData.password) {
      setError('Password is required.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!/[a-z]/.test(formData.password)) {
      setError('Password must contain at least one lowercase letter.');
      return;
    }

    if (!/[0-9]/.test(formData.password)) {
      setError('Password must contain at least one number.');
      return;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
      setError('Password must contain at least one special symbol (e.g. @, #, $, !).');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password and confirmation password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerStudent({
        name: formData.name,
        email: formData.email,
        rollNumber: cleanRoll,
        branch: formData.branch,
        year: formData.year,
        semester: formData.semester,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      setSuccessMsg('Registration successful. Please login to continue.');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableSemesterOptions = (SEMESTERS_BY_YEAR[formData.year] || ['Semester 1', 'Semester 2']).map((sem) => ({
    value: sem,
    label: sem,
  }));

  return (
    <div className="auth-container">
      <div className="auth-content auth-content--wide">
        {/* Brand Header */}
        <div className="auth-brand">
          <div className="auth-brand__crest">
            <GraduationCap size={32} />
          </div>
          <h1 className="auth-brand__title">Student Self-Registration</h1>
          <p className="auth-brand__subtitle">
            Centralized Club Management System • College Portal
          </p>
        </div>

        <Card className="auth-card" bordered={true} padding="lg">
          <div className="auth-card__header">
            <h2 className="auth-card__title">Create Student Profile</h2>
            <p className="auth-card__desc">
              Complete your student registration to join college clubs and participate in campus activities.
            </p>
          </div>

          {error && (
            <div className="auth-alert auth-alert--error" role="alert">
              <AlertCircle size={18} className="auth-alert__icon" />
              <span>{error}</span>
            </div>
          )}

          {successMsg ? (
            <div className="registration-success-box">
              <div className="registration-success-icon">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="registration-success-title">Registration Successful!</h3>
              <p className="registration-success-text">{successMsg}</p>
              <div className="registration-success-actions">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={ArrowRight}
                  onClick={() => navigate('/login')}
                >
                  Proceed to Login
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="register-form" noValidate>
              <div className="form-row">
                <Input
                  label="Full Name *"
                  name="name"
                  placeholder="e.g. Vikas Pal"
                  icon={User}
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />

                <Input
                  label="College Email *"
                  name="email"
                  type="email"
                  placeholder="e.g. vikas.pal@college.edu"
                  icon={Mail}
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-row">
                <Input
                  label="Roll Number * (10-15 digits)"
                  name="rollNumber"
                  placeholder="e.g. 2400014010013"
                  icon={GraduationCap}
                  value={formData.rollNumber}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />

                <Select
                  label="Academic Branch / Department *"
                  name="branch"
                  placeholder="Select Branch..."
                  value={formData.branch}
                  onChange={handleChange}
                  options={departments.filter((department) => department.status !== 'INACTIVE').map((d) => ({ value: d.name, label: d.name }))}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-row">
                <Select
                  label="Academic Year *"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  options={ACADEMIC_YEARS}
                  required
                  disabled={isSubmitting}
                />

                <Select
                  label="Current Semester *"
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  options={availableSemesterOptions}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-row">
                <Input
                  label="Password *"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 chars (e.g. Vikas@123)"
                  icon={Lock}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  rightElement={
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />

                <Input
                  label="Confirm Password *"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  icon={Lock}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="register-rules-note">
                <ShieldCheck size={16} className="register-rules-note__icon" />
                <span>
                  Password requires: <strong>min 8 characters</strong>, at least <strong>1 lowercase letter</strong>, <strong>1 number</strong>, and <strong>1 special character</strong> (e.g. @, #, $). Uppercase is optional.
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
                rightIcon={ArrowRight}
              >
                Register Account
              </Button>
            </form>
          )}

          <div className="auth-card__footer">
            <span className="auth-card__footer-text">Already have a registered account?</span>
            <Link to="/login" className="auth-card__footer-link">
              Sign In Here
            </Link>
          </div>
        </Card>

        <p className="auth-footer-note">
          Dean of Student Welfare • College Central Club Governance Portal
        </p>
      </div>
    </div>
  );
};
