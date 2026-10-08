import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, GraduationCap, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './Card';
import { Table } from './Table';
import { Badge } from './Badge';
import { Input } from './Input';
import { Button } from './Button';
import { Modal } from './Modal';
import { EmptyState } from './EmptyState';
import './StudentDirectoryView.css';

export const StudentDirectoryView = ({
  students = [],
  departmentName = 'Department',
  isLoading = false,
  allowDelete = false,
  onDeleteStudent = null,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedYears, setCollapsedYears] = useState({});
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleYearCollapse = (yearKey) => {
    setCollapsedYears((prev) => ({
      ...prev,
      [yearKey]: !prev[yearKey],
    }));
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete || !onDeleteStudent) return;
    setIsDeleting(true);
    try {
      await onDeleteStudent(studentToDelete.id);
      setStudentToDelete(null);
    } catch (err) {
      console.error('Failed to delete student:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Department-wide search filter across visible department students
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const query = searchQuery.toLowerCase().trim();
    return students.filter((student) => {
      const name = (student.name || '').toLowerCase();
      const email = (student.email || '').toLowerCase();
      const rollNumber = (student.rollNumber || student.rollNo || '').toLowerCase();
      return name.includes(query) || email.includes(query) || rollNumber.includes(query);
    });
  }, [students, searchQuery]);

  // Group students by academic year (1st Year, 2nd Year, 3rd Year, 4th Year)
  const yearGroups = useMemo(() => {
    const groups = {
      '1st Year': [],
      '2nd Year': [],
      '3rd Year': [],
      '4th Year': [],
    };

    const unassigned = [];

    filteredStudents.forEach((student) => {
      const yr = (student.year || '').toString().trim().toLowerCase();
      const sem = (student.semester || '').toString().trim().toLowerCase();

      if (yr.includes('1') || yr.includes('1st') || sem.includes('1') || sem.includes('2')) {
        groups['1st Year'].push(student);
      } else if (yr.includes('2') || yr.includes('2nd') || sem.includes('3') || sem.includes('4')) {
        groups['2nd Year'].push(student);
      } else if (yr.includes('3') || yr.includes('3rd') || sem.includes('5') || sem.includes('6')) {
        groups['3rd Year'].push(student);
      } else if (yr.includes('4') || yr.includes('4th') || sem.includes('7') || sem.includes('8')) {
        groups['4th Year'].push(student);
      } else {
        unassigned.push(student);
      }
    });

    if (unassigned.length > 0) {
      groups['Other / Unassigned'] = unassigned;
    }

    return groups;
  }, [filteredStudents]);

  const yearKeys = Object.keys(yearGroups);

  const columns = [
    {
      key: 'name',
      header: 'Student Name',
      render: (_, row) => (
        <div className="user-cell">
          <div className="user-cell__avatar-placeholder">
            {row.name ? row.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <span className="user-cell__name">{row.name}</span>
            <span className="user-cell__email">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'rollNumber',
      header: 'Roll Number',
      render: (val, row) => val || row.rollNo || 'N/A',
    },
    {
      key: 'email',
      header: 'College Email',
    },
    {
      key: 'department',
      header: 'Department / Branch',
      render: (val, row) => val || row.branch || departmentName,
    },
    {
      key: 'year',
      header: 'Year',
      render: (val) => val || '—',
    },
    {
      key: 'semester',
      header: 'Semester',
      render: (val) => val || '—',
    },
  ];

  if (allowDelete) {
    columns.push({
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (_, row) => (
        <Button
          variant="danger"
          size="sm"
          icon={Trash2}
          onClick={(e) => {
            e.stopPropagation();
            setStudentToDelete(row);
          }}
        >
          Delete
        </Button>
      ),
    });
  }

  return (
    <div className="student-directory">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <CardTitle>Student Directory — {departmentName}</CardTitle>
              <CardDescription>
                Enrolled students in {departmentName} categorized by academic year.
              </CardDescription>
            </div>
            <Badge variant="purple" size="lg">
              Total Students: {filteredStudents.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="student-directory__search mb-4">
            <Input
              placeholder="Search student by name, roll number or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>

          {filteredStudents.length === 0 ? (
            <EmptyState
              title="No students found"
              description={`No students found in ${departmentName}${searchQuery ? ' matching your search query' : '.'}`}
            />
          ) : (
            <div className="student-directory__years">
              {yearKeys.map((yearKey) => {
                const groupList = yearGroups[yearKey];
                const isCollapsed = Boolean(collapsedYears[yearKey]);

                return (
                  <Card key={yearKey} bordered className="student-directory__year-card">
                    <div
                      className="student-directory__year-header"
                      onClick={() => toggleYearCollapse(yearKey)}
                    >
                      <div className="flex items-center gap-2">
                        {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                        <GraduationCap size={18} className="text-primary-600" />
                        <h3 className="student-directory__year-title">{yearKey}</h3>
                      </div>
                      <Badge variant={groupList.length > 0 ? 'info' : 'neutral'} size="sm">
                        {groupList.length} {groupList.length === 1 ? 'Student' : 'Students'}
                      </Badge>
                    </div>

                    {!isCollapsed && (
                      <div className="student-directory__year-content">
                        {groupList.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted">
                            No students registered in {yearKey}.
                          </div>
                        ) : (
                          <Table
                            columns={columns}
                            data={groupList}
                            isLoading={isLoading}
                          />
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Delete Student Confirmation */}
      <Modal
        isOpen={Boolean(studentToDelete)}
        onClose={() => setStudentToDelete(null)}
        title="Delete Student?"
        description="Verify student details before confirming permanent deletion."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setStudentToDelete(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} isLoading={isDeleting}>
              Delete Student
            </Button>
          </>
        }
      >
        {studentToDelete && (
          <div className="modal-form" style={{ gap: 'var(--space-3)' }}>
            <div className="p-3 bg-slate-50 rounded-md border text-sm space-y-1">
              <div><strong>Student Name:</strong> {studentToDelete.name}</div>
              <div><strong>Roll Number:</strong> {studentToDelete.rollNumber || studentToDelete.rollNo || 'N/A'}</div>
              <div><strong>Email:</strong> {studentToDelete.email}</div>
              <div><strong>Department:</strong> {studentToDelete.department || studentToDelete.branch || departmentName}</div>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
              <strong>Warning:</strong> This action will permanently remove this student account and associated student data. This action cannot be undone.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
