import React, { useState, useEffect } from 'react';
import { User, Mail, GraduationCap, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { departmentService } from '../../services/departmentService';
import { DEPARTMENTS, ACADEMIC_YEARS, SEMESTERS_BY_YEAR } from '../../constants/departments';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../common/Card';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import './StudentProfileView.css';

export const StudentProfileView = () => {
  const { user, updateUserProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    rollNumber: user?.rollNumber || user?.rollNo || '',
    department: user?.department || user?.branch || 'Computer Science & Engineering',
    year: user?.year || '1st Year',
    semester: user?.semester || 'Semester 1',
  });

  const [departments, setDepartments] = useState(DEPARTMENTS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    departmentService
      .getDepartments()
      .then(setDepartments)
      .catch(() => setDepartments(DEPARTMENTS));
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        rollNumber: user.rollNumber || user.rollNo || '',
        department: user.department || user.branch || 'Computer Science & Engineering',
        year: user.year || '1st Year',
        semester: user.semester || 'Semester 1',
      });
    }
  }, [user]);

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
      setError('Roll number must consist of 10 to 15 digits only.');
      return;
    }

    if (!formData.department || !formData.department.trim()) {
      setError('Please select your academic branch / department.');
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

    setIsSubmitting(true);
    try {
      const updatedStudent = await userService.updateStudentProfile(
        {
          name: formData.name.trim(),
          email: formData.email.trim(),
          rollNumber: cleanRoll,
          department: formData.department,
          branch: formData.department,
          year: formData.year,
          semester: formData.semester,
        },
        user
      );

      updateUserProfile(updatedStudent);
      setSuccessMsg('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableSemesterOptions = (SEMESTERS_BY_YEAR[formData.year] || ['Semester 1', 'Semester 2']).map((sem) => ({
    value: sem,
    label: sem,
  }));

  return (
    <div className="student-profile-view">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>
            Manage your personal and academic information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="dashboard-alert dashboard-alert--error mb-4" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="dashboard-alert dashboard-alert--success mb-4" role="alert">
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="student-profile-form" noValidate>
            <div className="form-row">
              <Input
                label="Full Name"
                name="name"
                placeholder="e.g. Vikas Pal"
                icon={User}
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />

              <Input
                label="College Email"
                name="email"
                type="email"
                placeholder="e.g. vikas@example.com"
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
                label="Academic Branch / Department"
                name="department"
                placeholder="Select Branch / Department..."
                value={formData.department}
                onChange={handleChange}
                options={departments
                  .filter((d) => d.status !== 'INACTIVE')
                  .map((d) => ({ value: d.name, label: d.name }))}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-row">
              <Select
                label="Academic Year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                options={ACADEMIC_YEARS}
                required
                disabled={isSubmitting}
              />

              <Select
                label="Current Semester"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                options={availableSemesterOptions}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="profile-form-actions">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                icon={Save}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
