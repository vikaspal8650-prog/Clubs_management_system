import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Layers,
  Calendar,
  Search,
  Trash2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Building,
  UserPlus,
  Filter,
  Eye,
  Pencil,
  Info,
  Award,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES, ROLE_LABELS } from '../../constants/roles';
import { EVENT_STATUS, EVENT_STATUS_LABELS, EVENT_STATUS_VARIANTS } from '../../constants/eventStatus';
import { departmentService } from '../../services/departmentService';
import { userService } from '../../services/userService';
import { clubService } from '../../services/clubService';
import { eventService } from '../../services/eventService';
import { certificateService } from '../../services/certificateService';
import { openEventNotice, downloadEventNotice } from '../../services/eventNoticeService';
import { CertificateView } from '../../components/common/CertificateView';
import { SupportingDocumentActions } from '../../components/common/SupportingDocumentActions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Spinner } from '../../components/common/Loading';
import { EmptyState } from '../../components/common/EmptyState';
import { PortalSection } from '../../components/common/PortalSection';
import './DswDashboard.css';

export const DswDashboard = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const validTabs = ['overview', 'users', 'staff', 'departments', 'clubs', 'events', 'reports', 'documents', 'analytics', 'activity', 'certificates'];

  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState([]);
  const [clubsList, setClubsList] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [reviewingCert, setReviewingCert] = useState(null);
  const [rejectingCert, setRejectingCert] = useState(null);
  const [certRejectReason, setCertRejectReason] = useState('');
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [departmentForm, setDepartmentForm] = useState({ name: '', code: '', hodName: '', hodEmail: '', description: '', status: 'ACTIVE' });
  const [userStats, setUserStats] = useState({
    totalHods: 0,
    totalFaculty: 0,
    totalStudents: 0,
    totalUsers: 0,
  });

  // Search & Filters for User Management
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [clubSearch, setClubSearch] = useState('');
  const [clubDepartment, setClubDepartment] = useState('ALL');
  const [clubCategory, setClubCategory] = useState('ALL');
  const [clubStatus, setClubStatus] = useState('ALL');
  const [selectedClubIds, setSelectedClubIds] = useState([]);
  const [clubModalOpen, setClubModalOpen] = useState(false);
  const [clubToDelete, setClubToDelete] = useState(null);
  const [clubForm, setClubForm] = useState({ name: '', department: '', category: 'Technical', description: '', facultyInchargeId: '', facultyInchargeName: 'Unassigned', coordinators: [], status: 'ACTIVE' });

  // Modals state
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [accountType, setAccountType] = useState('HOD'); // 'HOD' | 'FACULTY_INCHARGE'
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    assignedClubId: '',
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [staff, clubs, events, stats, departments, certs] = await Promise.all([
        userService.getStaffAccounts(),
        clubService.getClubs(),
        eventService.getEvents(),
        userService.getUserStats(),
        departmentService.getDepartments(),
        certificateService.getCertificates(),
      ]);
      setStaffList(staff);
      setClubsList(clubs);
      setEventsList(events);
      setUserStats(stats);
      setDepartmentsList(departments);
      setCertificates(certs);
    } catch (err) {
      console.error('Failed to load DSW dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!validTabs.includes(activeTab)) setSearchParams({ tab: 'overview' }, { replace: true });
  }, [activeTab, setSearchParams]);

  const handleTabChange = (tabKey) => {
    setSearchParams({ tab: tabKey });
    setFeedbackMsg({ type: '', text: '' });
  };

  // Filtered staff list
  const filteredStaffList = useMemo(() => {
    return staffList.filter((item) => {
      // Role filter
      if (roleFilter !== 'ALL' && item.role !== roleFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = item.name?.toLowerCase().includes(query);
        const matchesEmail = item.email?.toLowerCase().includes(query);
        const matchesDept = item.department?.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesDept) {
          return false;
        }
      }
      return true;
    });
  }, [staffList, roleFilter, statusFilter, searchTerm]);

  const filteredClubs = useMemo(() => clubsList.filter((club) => {
    const query = clubSearch.trim().toLowerCase();
    return (!query || [club.name, club.department, club.category, club.facultyInchargeName].some((value) => value?.toLowerCase().includes(query))) &&
      (clubDepartment === 'ALL' || club.department === clubDepartment) &&
      (clubCategory === 'ALL' || club.category === clubCategory) &&
      (clubStatus === 'ALL' || (club.status || 'ACTIVE') === clubStatus);
  }), [clubsList, clubSearch, clubDepartment, clubCategory, clubStatus]);
  const departmentOptions = departmentsList.map((department) => ({ value: department.name, label: department.name }));
  const filteredDepartments = useMemo(() => departmentsList.filter((department) => {
    const query = departmentSearch.trim().toLowerCase();
    return !query || [department.name, department.code, department.hodName, department.hodEmail].some((value) => value?.toLowerCase().includes(query));
  }), [departmentsList, departmentSearch]);

  const openDepartmentModal = (department = null) => {
    setModalError('');
    setDepartmentForm(department ? { ...department } : { name: '', code: '', hodName: '', hodEmail: '', description: '', status: 'ACTIVE' });
    setDepartmentModalOpen(true);
  };
  const handleSaveDepartment = async (event) => {
    event?.preventDefault(); setActionLoading(true); setModalError('');
    try { await departmentService.saveDepartment(departmentForm); setDepartmentModalOpen(false); setFeedbackMsg({ type: 'success', text: `Department "${departmentForm.name}" saved successfully.` }); loadData(); }
    catch (err) { setModalError(err.message || 'Unable to save department.'); }
    finally { setActionLoading(false); }
  };
  const handleDeleteDepartment = async () => {
    if (!departmentToDelete) return; setActionLoading(true);
    try { await departmentService.deleteDepartment(departmentToDelete.id); setDepartmentToDelete(null); setFeedbackMsg({ type: 'success', text: `Department "${departmentToDelete.name}" removed successfully.` }); loadData(); }
    catch (err) { setFeedbackMsg({ type: 'error', text: err.message || 'Unable to delete department.' }); }
    finally { setActionLoading(false); }
  };

  const openClubModal = (club = null) => {
    setModalError('');
    setClubForm(club ? { ...club, status: club.status || 'ACTIVE' } : { name: '', department: departmentOptions[0]?.value || '', category: 'Technical', description: '', facultyInchargeId: '', facultyInchargeName: 'Unassigned', coordinators: [], status: 'ACTIVE' });
    setClubModalOpen(true);
  };
  const handleSaveClub = async (event) => {
    event?.preventDefault(); setActionLoading(true); setModalError('');
    try { await clubService.saveClub(clubForm); setClubModalOpen(false); setFeedbackMsg({ type: 'success', text: `Club "${clubForm.name}" saved successfully.` }); loadData(); }
    catch (err) { setModalError(err.message || 'Unable to save club.'); }
    finally { setActionLoading(false); }
  };
  const handleDeleteClub = async () => {
    if (!clubToDelete) return; setActionLoading(true);
    try { await clubService.deleteClub(clubToDelete.id); setClubToDelete(null); setSelectedClubIds((ids) => ids.filter((id) => id !== clubToDelete.id)); setFeedbackMsg({ type: 'success', text: `Club "${clubToDelete.name}" removed successfully.` }); loadData(); }
    catch (err) { setFeedbackMsg({ type: 'error', text: err.message || 'Unable to delete club.' }); }
    finally { setActionLoading(false); }
  };

  // Open Add User Modal
  const handleOpenAddUser = (initialType = 'HOD') => {
    setAccountType(initialType);
    setUserForm({
      name: '',
      email: '',
      password: '',
      department: departmentOptions[0]?.value || '',
      assignedClubId: '',
    });
    setModalError('');
    setAddUserModalOpen(true);
  };

  // Submit Add User (HOD or Faculty Incharge)
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!userForm.name || !userForm.name.trim()) {
      setModalError('Full Name is required.');
      return;
    }
    if (!userForm.email || !userForm.email.trim()) {
      setModalError('College Email is required.');
      return;
    }
    if (!userForm.password || userForm.password.length < 6) {
      setModalError('Password must be at least 6 characters.');
      return;
    }
    if (!userForm.department) {
      setModalError('Department is required.');
      return;
    }

    setActionLoading(true);
    try {
      if (accountType === 'HOD') {
        await userService.createHodAccount({
          name: userForm.name,
          email: userForm.email,
          password: userForm.password,
          department: userForm.department,
        });
        setFeedbackMsg({
          type: 'success',
          text: `HOD account for "${userForm.name}" created successfully.`,
        });
      } else {
        await userService.createFacultyAccount({
          name: userForm.name,
          email: userForm.email,
          password: userForm.password,
          department: userForm.department,
          clubIds: userForm.assignedClubId ? [userForm.assignedClubId] : [],
        });
        setFeedbackMsg({
          type: 'success',
          text: `Faculty Incharge account for "${userForm.name}" created successfully.`,
        });
      }
      setAddUserModalOpen(false);
      loadData();
    } catch (err) {
      setModalError(err.message || 'Failed to create account.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDelete = (staffMember) => {
    setUserToDelete(staffMember);
    setDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setActionLoading(true);
    try {
      await userService.deleteUser(userToDelete.id);
      setDeleteModalOpen(false);
      setFeedbackMsg({
        type: 'success',
        text: `Account for "${userToDelete.name}" (${userToDelete.role}) deleted successfully.`,
      });
      setUserToDelete(null);
      loadData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to delete user.' });
    } finally {
      setActionLoading(false);
    }
  };

  // DSW Override handler
  const handleDswOverride = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setActionLoading(true);
    try {
      await eventService.dswOverrideEvent(selectedEvent.id, overrideReason || 'Overridden by DSW');
      setOverrideModalOpen(false);
      setSelectedEvent(null);
      setOverrideReason('');
      setFeedbackMsg({ type: 'success', text: `Event "${selectedEvent.title}" overridden/rejected by DSW.` });
      loadData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Failed to override event.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to get assigned club name
  const getAssignedClubNames = (clubIds = []) => {
    if (!clubIds || clubIds.length === 0) return 'None';
    return clubIds
      .map((id) => clubsList.find((c) => c.id === id)?.name || id)
      .join(', ');
  };

  return (
    <div className="dashboard-container">
      {/* Welcome Hero Banner */}
      <div className="dashboard-hero">
        <div>
          <div className="dashboard-hero__badge">
            <ShieldAlert size={14} />
            <span>DSW Administration</span>
          </div>
          <h1 className="dashboard-hero__title">Dean of Student Welfare (DSW)</h1>
          <p className="dashboard-hero__subtitle">
            Centralized administration, HOD & Faculty Incharge user management, club oversight, and event audit.
          </p>
        </div>

        <div className="dashboard-hero__actions">
          <Button
            variant="primary"
            icon={UserPlus}
            onClick={() => handleOpenAddUser('HOD')}
          >
            + Add User
          </Button>
        </div>
      </div>

      {feedbackMsg.text && (
        <div className={`dashboard-alert dashboard-alert--${feedbackMsg.type}`}>
          {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Dynamic Statistics Metrics Row */}
      <div className="metrics-grid">
        <Card
          className="metric-card"
          hoverable
          onClick={() => {
            handleTabChange('users');
            setRoleFilter(ROLES.HOD);
          }}
          title="Click to view HOD Accounts list"
        >
          <div className="metric-card__header">
            <span className="metric-card__label">Total HODs</span>
            <div className="metric-card__icon metric-card__icon--purple">
              <Building size={20} />
            </div>
          </div>
          <span className="metric-card__value">{userStats.totalHods}</span>
          <span className="metric-card__hint">Department leadership (Click to view)</span>
        </Card>

        <Card
          className="metric-card"
          hoverable
          onClick={() => {
            handleTabChange('users');
            setRoleFilter(ROLES.FACULTY_INCHARGE);
          }}
          title="Click to view Faculty Incharge Accounts list"
        >
          <div className="metric-card__header">
            <span className="metric-card__label">Total Faculty Incharges</span>
            <div className="metric-card__icon metric-card__icon--amber">
              <Users size={20} />
            </div>
          </div>
          <span className="metric-card__value">{userStats.totalFaculty}</span>
          <span className="metric-card__hint">Club mentors (Click to view)</span>
        </Card>

        <Card
          className="metric-card"
          hoverable
          onClick={() => {
            handleTabChange('users');
            setRoleFilter(ROLES.STUDENT);
          }}
          title="Click to view Registered Students list"
        >
          <div className="metric-card__header">
            <span className="metric-card__label">Total Students</span>
            <div className="metric-card__icon metric-card__icon--blue">
              <Users size={20} />
            </div>
          </div>
          <span className="metric-card__value">{userStats.totalStudents}</span>
          <span className="metric-card__hint">Registered students (Click to view)</span>
        </Card>

        <Card
          className="metric-card"
          hoverable
          onClick={() => handleTabChange('clubs')}
          title="Click to view College Clubs list"
        >
          <div className="metric-card__header">
            <span className="metric-card__label">College Clubs</span>
            <div className="metric-card__icon metric-card__icon--green">
              <Layers size={20} />
            </div>
          </div>
          <span className="metric-card__value">{clubsList.length}</span>
          <span className="metric-card__hint">Institutional societies (Click to view)</span>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="dashboard-tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'overview' ? 'tab-btn--active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          Overview & Policy
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'users' || activeTab === 'staff' ? 'tab-btn--active' : ''}`}
          onClick={() => handleTabChange('users')}
        >
          User Management ({staffList.length})
        </button>
        <button type="button" className={`tab-btn ${activeTab === 'departments' ? 'tab-btn--active' : ''}`} onClick={() => handleTabChange('departments')}>
          Departments ({departmentsList.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'clubs' ? 'tab-btn--active' : ''}`}
          onClick={() => handleTabChange('clubs')}
        >
          College Clubs ({clubsList.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'events' ? 'tab-btn--active' : ''}`}
          onClick={() => handleTabChange('events')}
        >
          Event Oversight ({eventsList.length})
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="dashboard-loading">
          <Spinner size="lg" />
          <p>Loading administrative dataset...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div className="overview-layout">
              <Card>
                <CardHeader>
                  <CardTitle>DSW User Management & Governance Boundaries</CardTitle>
                  <CardDescription>Authentication and administrative scope in Phase 2</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rules-notice-grid">
                    <div className="rule-item rule-item--allowed">
                      <CheckCircle2 size={20} className="rule-item__icon" />
                      <div>
                        <strong>Create & Delete HOD Accounts</strong>
                        <p>DSW creates and deletes Head of Department accounts with automatic role and status assignment.</p>
                      </div>
                    </div>

                    <div className="rule-item rule-item--allowed">
                      <CheckCircle2 size={20} className="rule-item__icon" />
                      <div>
                        <strong>Create & Delete Faculty Incharge Accounts</strong>
                        <p>DSW creates and deletes Faculty Incharge accounts with department and club assignments.</p>
                      </div>
                    </div>

                    <div className="rule-item rule-item--restricted">
                      <XCircle size={20} className="rule-item__icon" />
                      <div>
                        <strong>Student Account Self-Registration</strong>
                        <p>DSW cannot create or delete Student accounts. Students self-register through the public portal.</p>
                      </div>
                    </div>

                    <div className="rule-item rule-item--allowed">
                      <CheckCircle2 size={20} className="rule-item__icon" />
                      <div>
                        <strong>Club Directory Management</strong>
                        <p>DSW can create, edit, and delete clubs while preserving event records for audit.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Staff Preview */}
              <Card>
                <CardHeader
                  action={
                    <Button variant="ghost" size="sm" onClick={() => handleTabChange('users')}>
                      Manage Users
                    </Button>
                  }
                >
                  <CardTitle>Recent Staff Accounts</CardTitle>
                  <CardDescription>Active HOD and Faculty Incharge administrators</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table
                    columns={[
                      {
                        key: 'name',
                        header: 'Staff Member',
                        render: (_, row) => (
                          <div className="user-cell">
                            <img
                              src={row.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.name)}`}
                              alt={row.name}
                              className="user-cell__avatar"
                            />
                            <div>
                              <span className="user-cell__name">{row.name}</span>
                              <span className="user-cell__email">{row.email}</span>
                            </div>
                          </div>
                        ),
                      },
                      {
                        key: 'role',
                        header: 'Role',
                        render: (val) => (
                          <Badge variant={val === ROLES.HOD ? 'purple' : 'info'} size="sm">
                            {val === ROLES.HOD ? 'HOD' : 'Faculty Incharge'}
                          </Badge>
                        ),
                      },
                      { key: 'department', header: 'Department' },
                      {
                        key: 'status',
                        header: 'Status',
                        render: (val) => (
                          <Badge variant={val === 'ACTIVE' ? 'success' : 'danger'} size="sm" dot>
                            {val}
                          </Badge>
                        ),
                      },
                    ]}
                    data={staffList.slice(0, 4)}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {(activeTab === 'users' || activeTab === 'staff') && (
            <Card>
              <CardHeader
                action={
                  <Button variant="primary" size="sm" icon={UserPlus} onClick={() => handleOpenAddUser('HOD')}>
                    + Add User
                  </Button>
                }
              >
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Create and manage HOD and Faculty Incharge accounts with search and role filters
                </CardDescription>
              </CardHeader>

              <CardContent>
                {/* Search & Filter Toolbar */}
                <div className="user-mgmt-toolbar">
                  <div className="user-mgmt-search">
                    <Input
                      placeholder="Search by name, email, or department..."
                      icon={Search}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="user-mgmt-filters">
                    <div className="filter-group">
                      <label className="filter-label">Role:</label>
                      <select
                        className="filter-select"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                      >
                        <option value="ALL">All Roles</option>
                        <option value={ROLES.HOD}>HOD</option>
                        <option value={ROLES.FACULTY_INCHARGE}>Faculty Incharge</option>
                      </select>
                    </div>

                    <div className="filter-group">
                      <label className="filter-label">Status:</label>
                      <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="ALL">All Status</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* User Table */}
                <Table
                  columns={[
                    {
                      key: 'name',
                      header: 'Name',
                      render: (_, row) => (
                        <div className="user-cell">
                          <img
                            src={row.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.name)}`}
                            alt={row.name}
                            className="user-cell__avatar"
                          />
                          <div>
                            <span className="user-cell__name">{row.name}</span>
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: 'email',
                      header: 'Email',
                      render: (val) => <span className="font-mono text-sm">{val}</span>,
                    },
                    {
                      key: 'role',
                      header: 'Role',
                      render: (val) => (
                        <Badge variant={val === ROLES.HOD ? 'purple' : 'info'} size="sm">
                          {val === ROLES.HOD ? 'HOD' : 'Faculty Incharge'}
                        </Badge>
                      ),
                    },
                    { key: 'department', header: 'Department' },
                    {
                      key: 'clubIds',
                      header: 'Assigned Club(s)',
                      render: (val, row) =>
                        row.role === ROLES.FACULTY_INCHARGE ? (
                          <span className="text-sm">{getAssignedClubNames(val)}</span>
                        ) : (
                          <span className="text-muted text-xs">N/A (HOD)</span>
                        ),
                    },
                    {
                      key: 'status',
                      header: 'Status',
                      render: (val) => (
                        <Badge variant={val === 'ACTIVE' ? 'success' : 'danger'} size="sm" dot>
                          {val}
                        </Badge>
                      ),
                    },
                    {
                      key: 'actions',
                      header: 'Actions',
                      align: 'right',
                      render: (_, row) => (
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleOpenDelete(row)}
                          title={`Delete ${row.role === ROLES.HOD ? 'HOD' : 'Faculty Incharge'}`}
                        >
                          Delete
                        </Button>
                      ),
                    },
                  ]}
                  data={filteredStaffList}
                  emptyState={
                    <EmptyState
                      title="No matching staff accounts"
                      description="No HOD or Faculty Incharge users match your search criteria."
                      size="sm"
                    />
                  }
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'departments' && (
            <Card>
              <CardHeader action={<Button variant="primary" size="sm" icon={Building} onClick={() => openDepartmentModal()}>Add Department</Button>}>
                <CardTitle>Department Management</CardTitle>
                <CardDescription>Create, maintain, and assign academic department leadership.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="metrics-grid" style={{ marginBottom: 'var(--space-5)' }}>
                  <Card className="metric-card"><span className="metric-card__label">Total Departments</span><span className="metric-card__value">{departmentsList.length}</span></Card>
                  <Card className="metric-card"><span className="metric-card__label">Active Departments</span><span className="metric-card__value">{departmentsList.filter((item) => item.status === 'ACTIVE').length}</span></Card>
                  <Card className="metric-card"><span className="metric-card__label">Departments with HOD</span><span className="metric-card__value">{departmentsList.filter((item) => item.hodName && item.hodEmail).length}</span></Card>
                </div>
                <div className="user-mgmt-toolbar"><div className="user-mgmt-search"><Input icon={Search} placeholder="Search department, code, HOD, or email..." value={departmentSearch} onChange={(event) => setDepartmentSearch(event.target.value)} /></div><Button variant="ghost" size="sm" onClick={() => setDepartmentSearch('')}>Reset</Button></div>
                <Table columns={[
                  { key: 'name', header: 'Department' }, { key: 'code', header: 'Code' },
                  { key: 'hodName', header: 'HOD', render: (value) => value || 'Unassigned' },
                  { key: 'hodEmail', header: 'HOD Email', render: (value) => value || '—' },
                  { key: 'description', header: 'Description', render: (value) => value || '—' },
                  { key: 'status', header: 'Status', render: (value) => <Badge variant={value === 'ACTIVE' ? 'success' : 'neutral'} size="sm" dot>{value}</Badge> },
                  { key: 'actions', header: 'Actions', align: 'right', render: (_, row) => <div className="flex gap-2"><Button variant="ghost" size="sm" icon={Pencil} onClick={() => openDepartmentModal(row)}>Edit</Button><Button variant="danger" size="sm" icon={Trash2} onClick={() => setDepartmentToDelete(row)}>Delete</Button></div> },
                ]} data={filteredDepartments} emptyState={<EmptyState title="No departments found" description="Adjust the search or add a department." size="sm" />} />
              </CardContent>
            </Card>
          )}

          {activeTab === 'clubs' && (
            <Card>
              <CardHeader action={<Button variant="primary" size="sm" icon={UserPlus} onClick={() => openClubModal()}>Add Club</Button>}>
                <CardTitle>Club Management</CardTitle>
                <CardDescription>
                  Create and manage departmental clubs, leadership assignments, and operating status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="metrics-grid" style={{ marginBottom: 'var(--space-5)' }}>
                  <Card className="metric-card"><span className="metric-card__label">Total Clubs</span><span className="metric-card__value">{clubsList.length}</span></Card>
                  <Card className="metric-card"><span className="metric-card__label">Active Clubs</span><span className="metric-card__value">{clubsList.filter((club) => (club.status || 'ACTIVE') === 'ACTIVE').length}</span></Card>
                  <Card className="metric-card"><span className="metric-card__label">Total Members</span><span className="metric-card__value">{clubsList.reduce((sum, club) => sum + (club.memberCount || 0), 0)}</span></Card>
                </div>
                <div className="user-mgmt-toolbar">
                  <div className="user-mgmt-search"><Input icon={Search} placeholder="Search clubs, departments, or faculty..." value={clubSearch} onChange={(event) => setClubSearch(event.target.value)} /></div>
                  <div className="user-mgmt-filters">
                    <Select value={clubDepartment} onChange={(event) => setClubDepartment(event.target.value)} options={[{ value: 'ALL', label: 'All departments' }, ...Array.from(new Set(clubsList.map((club) => club.department))).map((value) => ({ value, label: value }))]} />
                    <Select value={clubCategory} onChange={(event) => setClubCategory(event.target.value)} options={[{ value: 'ALL', label: 'All categories' }, ...Array.from(new Set(clubsList.map((club) => club.category))).map((value) => ({ value, label: value }))]} />
                    <Select value={clubStatus} onChange={(event) => setClubStatus(event.target.value)} options={[{ value: 'ALL', label: 'All statuses' }, { value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]} />
                    <Button variant="ghost" size="sm" onClick={() => { setClubSearch(''); setClubDepartment('ALL'); setClubCategory('ALL'); setClubStatus('ALL'); }}>Reset</Button>
                  </div>
                </div>
                <Table columns={[
                  { key: 'select', header: <input type="checkbox" aria-label="Select all clubs" checked={filteredClubs.length > 0 && filteredClubs.every((club) => selectedClubIds.includes(club.id))} onChange={(event) => setSelectedClubIds(event.target.checked ? filteredClubs.map((club) => club.id) : [])} />, width: '42px', render: (_, row) => <input type="checkbox" aria-label={`Select ${row.name}`} checked={selectedClubIds.includes(row.id)} onChange={(event) => { event.stopPropagation(); setSelectedClubIds((ids) => event.target.checked ? [...ids, row.id] : ids.filter((id) => id !== row.id)); }} /> },
                  { key: 'name', header: 'Club Name', render: (_, row) => <div className="user-cell"><img src={row.logoUrl} alt="" className="user-cell__avatar" /><div><span className="user-cell__name">{row.name}</span><span className="user-cell__email">{row.description}</span></div></div> },
                  { key: 'department', header: 'Department' }, { key: 'category', header: 'Category' }, { key: 'facultyInchargeName', header: 'Faculty Incharge' },
                  { key: 'coordinators', header: 'Student Coordinator', render: (value) => value?.map((item) => item.name).join(', ') || 'Unassigned' },
                  { key: 'memberCount', header: 'Members' }, { key: 'activeEventsCount', header: 'Events' },
                  { key: 'status', header: 'Status', render: (value) => <Badge variant={(value || 'ACTIVE') === 'ACTIVE' ? 'success' : 'neutral'} size="sm" dot>{value || 'ACTIVE'}</Badge> },
                  { key: 'actions', header: 'Actions', align: 'right', render: (_, row) => <div className="flex gap-2"><Button variant="ghost" size="sm" icon={Eye} onClick={() => openClubModal(row)}>View / Edit</Button><Button variant="danger" size="sm" icon={Trash2} onClick={() => setClubToDelete(row)}>Delete</Button></div> },
                ]} data={filteredClubs} emptyState={<EmptyState title="No matching clubs" description="Adjust your filters or add a new club." size="sm" />} />
              </CardContent>
            </Card>
          )}

          {activeTab === 'events' && (
            <Card>
              <CardHeader>
                <CardTitle>Event Oversight & High-Level Audit</CardTitle>
                <CardDescription>
                  DSW can review and exercise apex override authority on any college event.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table
                  columns={[
                    { key: 'title', header: 'Event' },
                    { key: 'clubName', header: 'Organizing Club' },
                    { key: 'venue', header: 'Venue' },
                    {
                      key: 'startDate',
                      header: 'Date & Time',
                      render: (val) => new Date(val).toLocaleDateString(),
                    },
                    {
                      key: 'status',
                      header: 'Workflow Stage',
                      render: (val, row) => {
                        const isApproved = val === EVENT_STATUS.APPROVED;
                        return (
                          <Badge
                            variant={EVENT_STATUS_VARIANTS[val] || 'neutral'}
                            size="sm"
                            dot
                            className={isApproved ? 'badge--clickable' : ''}
                            title={isApproved ? 'Click to view complete published event details' : undefined}
                            onClick={() => {
                              if (isApproved) {
                                setViewingEvent(row);
                              }
                            }}
                          >
                            {EVENT_STATUS_LABELS[val] || val}
                          </Badge>
                        );
                      },
                    },
                    {
                      key: 'actions',
                      header: 'DSW Action',
                      align: 'right',
                      render: (_, row) =>
                        row.status !== EVENT_STATUS.OVERRIDDEN_BY_DSW ? (
                          <Button
                            variant="danger"
                            size="sm"
                            icon={ShieldAlert}
                            onClick={() => {
                              setSelectedEvent(row);
                              setOverrideModalOpen(true);
                            }}
                          >
                            Override / Reject
                          </Button>
                        ) : (
                          <span className="text-xs text-muted">Overridden</span>
                        ),
                    },
                  ]}
                  data={eventsList}
                />
              </CardContent>
            </Card>
          )}

          {/* TAB: CERTIFICATE APPROVALS */}
          {activeTab === 'certificates' && (
            <div className="tab-pane">
              <PortalSection
                title="DSW Certificate Audit & Final Authorization"
                description="Final College Sign-off for 3-Student Merit Certificate Batches across all departments and clubs."
              />

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Certificates Awaiting DSW Final Signature</CardTitle>
                  <CardDescription>HOD-approved merit certificates pending final Dean Student Welfare authorization.</CardDescription>
                </CardHeader>
                <CardContent>
                  {certificates.filter((c) => c.status === 'PENDING_DSW_APPROVAL').length === 0 ? (
                    <EmptyState
                      icon={Award}
                      title="No Certificates Pending DSW Sign-Off"
                      description="All HOD-signed certificates have been audited and signed."
                    />
                  ) : (
                    <Table
                      columns={[
                        { key: 'studentName', header: 'Student Name' },
                        { key: 'position', header: 'Position', render: (val) => <Badge variant={val.includes('1st') ? 'warning' : val.includes('2nd') ? 'info' : 'purple'}>{val}</Badge> },
                        { key: 'eventName', header: 'Event' },
                        { key: 'clubName', header: 'Club' },
                        { key: 'department', header: 'Department' },
                        { key: 'hodApproval', header: 'HOD Signature', render: (val) => val?.approvedBy ? `Signed by ${val.approvedBy}` : 'Signed' },
                        {
                          key: 'status',
                          header: 'Workflow Stage',
                          render: () => <Badge variant="info" dot>Pending DSW Final Authorization</Badge>,
                        },
                        {
                          key: 'actions',
                          header: 'Action',
                          render: (_, cert) => (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setReviewingCert(cert)}
                            >
                              <Award size={14} /> Review & Give Final Approval
                            </Button>
                          ),
                        },
                      ]}
                      data={certificates.filter((c) => c.status === 'PENDING_DSW_APPROVAL')}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Institutional Certificate Registry */}
              <Card>
                <CardHeader>
                  <CardTitle>Institutional Certificate Registry</CardTitle>
                  <CardDescription>Master audit log of all issued and in-progress merit certificates.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table
                    columns={[
                      { key: 'studentName', header: 'Student Name' },
                      { key: 'position', header: 'Position', render: (val) => <Badge variant={val.includes('1st') ? 'warning' : val.includes('2nd') ? 'info' : 'purple'}>{val}</Badge> },
                      { key: 'eventName', header: 'Event' },
                      { key: 'clubName', header: 'Club' },
                      { key: 'department', header: 'Department' },
                      {
                        key: 'status',
                        header: 'Status',
                        render: (val) => {
                          if (val === 'APPROVED') return <Badge variant="success" dot>Approved (Final)</Badge>;
                          if (val === 'PENDING_FACULTY_APPROVAL') return <Badge variant="warning">Pending Faculty</Badge>;
                          if (val === 'PENDING_HOD_APPROVAL') return <Badge variant="purple">Pending HOD</Badge>;
                          if (val === 'PENDING_DSW_APPROVAL') return <Badge variant="info">Pending DSW</Badge>;
                          return <Badge variant="danger">Returned / Rejected</Badge>;
                        },
                      },
                      {
                        key: 'actions',
                        header: 'View Certificate',
                        render: (_, cert) => (
                          <Button variant="outline" size="sm" onClick={() => setReviewingCert(cert)}>
                            View Certificate
                          </Button>
                        ),
                      },
                    ]}
                    data={certificates}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {['reports', 'documents', 'analytics', 'activity'].includes(activeTab) && (
            <PortalSection
              section={activeTab}
              metrics={
                activeTab === 'documents'
                  ? []
                  : [
                      { label: 'College Clubs', value: clubsList.length, hint: 'Active institutional societies' },
                      { label: 'Events Tracked', value: eventsList.length, hint: 'Across all workflow stages' },
                      { label: 'Registered Students', value: userStats.totalStudents, hint: 'Portal participants' },
                    ]
              }
            />
          )}
        </>
      )}

      {/* Modal: Add User (HOD or Faculty Incharge) */}
      <Modal
        isOpen={clubModalOpen}
        onClose={() => setClubModalOpen(false)}
        title={clubForm.id ? 'Edit Club' : 'Create Club'}
        description="Manage the club profile, leadership assignment, and operating status."
        size="lg"
        footer={<><Button variant="outline" onClick={() => setClubModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleSaveClub} isLoading={actionLoading}>{clubForm.id ? 'Save Changes' : 'Create Club'}</Button></>}
      >
        {modalError && <div className="auth-alert auth-alert--error"><AlertTriangle size={16} /><span>{modalError}</span></div>}
        <form onSubmit={handleSaveClub} className="modal-form" noValidate>
          <Input label="Club Name" required value={clubForm.name} onChange={(event) => setClubForm({ ...clubForm, name: event.target.value })} />
          <Select label="Department" required value={clubForm.department} onChange={(event) => setClubForm({ ...clubForm, department: event.target.value })} options={departmentOptions} />
          <Select label="Club Category" required value={clubForm.category} onChange={(event) => setClubForm({ ...clubForm, category: event.target.value })} options={['Technical', 'Cultural', 'Sports', 'Literary', 'Social Service'].map((value) => ({ value, label: value }))} />
          <Input label="Description" required value={clubForm.description} onChange={(event) => setClubForm({ ...clubForm, description: event.target.value })} />
          <Select label="Faculty Incharge" value={clubForm.facultyInchargeId || ''} onChange={(event) => { const faculty = staffList.find((item) => item.id === event.target.value); setClubForm({ ...clubForm, facultyInchargeId: faculty?.id || '', facultyInchargeName: faculty?.name || 'Unassigned' }); }} options={[{ value: '', label: 'Unassigned' }, ...staffList.filter((item) => item.role === ROLES.FACULTY_INCHARGE).map((item) => ({ value: item.id, label: item.name }))]} />
          <Select label="Club Status" value={clubForm.status} onChange={(event) => setClubForm({ ...clubForm, status: event.target.value })} options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]} />
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(clubToDelete)}
        onClose={() => setClubToDelete(null)}
        title="Delete Club?"
        description={`Delete "${clubToDelete?.name || ''}" from the system? This will remove the club directory record.`}
        size="sm"
        footer={<><Button variant="outline" onClick={() => setClubToDelete(null)}>Cancel</Button><Button variant="danger" onClick={handleDeleteClub} isLoading={actionLoading}>Delete Club</Button></>}
      >
        <p className="text-sm text-muted">This action cannot be undone. Existing event records are retained for audit purposes.</p>
      </Modal>

      {/* Modal: Add User (HOD or Faculty Incharge) */}
      <Modal
        isOpen={addUserModalOpen}
        onClose={() => setAddUserModalOpen(false)}
        title={accountType === 'HOD' ? 'Create HOD Account' : 'Create Faculty Incharge Account'}
        description={`Provision a new ${accountType === 'HOD' ? 'Head of Department' : 'Faculty Incharge'} with automatic active status.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setAddUserModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddUserSubmit} isLoading={actionLoading}>
              Create {accountType === 'HOD' ? 'HOD' : 'Faculty Incharge'}
            </Button>
          </>
        }
      >
        <div className="modal-account-type-tabs">
          <button
            type="button"
            className={`account-type-tab ${accountType === 'HOD' ? 'account-type-tab--active' : ''}`}
            onClick={() => setAccountType('HOD')}
          >
            HOD Account
          </button>
          <button
            type="button"
            className={`account-type-tab ${accountType === 'FACULTY_INCHARGE' ? 'account-type-tab--active' : ''}`}
            onClick={() => setAccountType('FACULTY_INCHARGE')}
          >
            Faculty Incharge Account
          </button>
        </div>

        {modalError && (
          <div className="auth-alert auth-alert--error" style={{ marginBottom: 'var(--space-4)' }}>
            <AlertCircle size={16} />
            <span>{modalError}</span>
          </div>
        )}

        <form onSubmit={handleAddUserSubmit} className="modal-form" noValidate>
          <Input
            label="Full Name"
            placeholder={accountType === 'HOD' ? 'e.g. Dr. Ramesh Sharma' : 'e.g. Prof. Vivek Sengupta'}
            value={userForm.name}
            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
            required
          />

          <Input
            label="College Email"
            type="email"
            placeholder={accountType === 'HOD' ? 'e.g. hod.cs@college.edu' : 'e.g. faculty.coding@college.edu'}
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="Minimum 6 characters"
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
            required
          />

          <Select
            label="Department"
            value={userForm.department}
            onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
            options={departmentOptions}
            required
          />

          {accountType === 'FACULTY_INCHARGE' && (
            <Select
              label="Assigned Club (Optional)"
              value={userForm.assignedClubId}
              onChange={(e) => setUserForm({ ...userForm, assignedClubId: e.target.value })}
              options={[
                { value: '', label: 'None (Assign later)' },
                ...clubsList.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          )}

          <div className="form-auto-badge-note">
            <Info size={14} />
            <span>
              Role will automatically be set to <strong>{accountType}</strong> and status to <strong>ACTIVE</strong>.
            </span>
          </div>
        </form>
      </Modal>

      <Modal isOpen={departmentModalOpen} onClose={() => setDepartmentModalOpen(false)} title={departmentForm.id ? 'Edit Department' : 'Add Department'} description="Maintain the department directory and HOD contact information." footer={<><Button variant="outline" onClick={() => setDepartmentModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleSaveDepartment} isLoading={actionLoading}>{departmentForm.id ? 'Save Changes' : 'Add Department'}</Button></>}>
        {modalError && <div className="auth-alert auth-alert--error"><AlertTriangle size={16} /><span>{modalError}</span></div>}
        <form onSubmit={handleSaveDepartment} className="modal-form" noValidate>
          <Input label="Department Name" required value={departmentForm.name} onChange={(event) => setDepartmentForm({ ...departmentForm, name: event.target.value })} />
          <Input label="Department Code" required placeholder="e.g. CSE" value={departmentForm.code} onChange={(event) => setDepartmentForm({ ...departmentForm, code: event.target.value.toUpperCase() })} />
          <Input label="HOD Name (optional)" value={departmentForm.hodName} onChange={(event) => setDepartmentForm({ ...departmentForm, hodName: event.target.value })} />
          <Input label="HOD Email (optional)" type="email" value={departmentForm.hodEmail} onChange={(event) => setDepartmentForm({ ...departmentForm, hodEmail: event.target.value })} />
          <Input label="Description (optional)" value={departmentForm.description} onChange={(event) => setDepartmentForm({ ...departmentForm, description: event.target.value })} />
        </form>
      </Modal>
      <Modal isOpen={Boolean(departmentToDelete)} onClose={() => setDepartmentToDelete(null)} title="Delete Department?" description={`Delete "${departmentToDelete?.name || ''}" from the department directory?`} size="sm" footer={<><Button variant="outline" onClick={() => setDepartmentToDelete(null)}>Cancel</Button><Button variant="danger" onClick={handleDeleteDepartment} isLoading={actionLoading}>Delete Department</Button></>}><p className="text-sm text-muted">This action removes only the directory entry. Existing club, user, and event records are retained.</p></Modal>

      {/* Modal: Delete Confirmation (Reusable Modal Component, NO window.confirm) */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={`Delete ${userToDelete?.role === ROLES.HOD ? 'HOD' : 'Faculty Incharge'}?`}
        description="Are you sure you want to delete this account? This action cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} isLoading={actionLoading}>
              Delete
            </Button>
          </>
        }
      >
        {userToDelete && (
          <div className="delete-user-preview">
            <div className="delete-user-preview__avatar">
              <img
                src={userToDelete.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userToDelete.name)}`}
                alt={userToDelete.name}
              />
            </div>
            <div>
              <h4 className="delete-user-preview__name">{userToDelete.name}</h4>
              <p className="delete-user-preview__email">{userToDelete.email}</p>
              <div className="flex gap-2" style={{ marginTop: 'var(--space-2)' }}>
                <Badge variant={userToDelete.role === ROLES.HOD ? 'purple' : 'info'} size="sm">
                  {userToDelete.role === ROLES.HOD ? 'HOD' : 'Faculty Incharge'}
                </Badge>
                <Badge variant="neutral" size="sm">
                  {userToDelete.department}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Published Event Details & Oversight Review */}
      <Modal
        isOpen={Boolean(viewingEvent)}
        onClose={() => setViewingEvent(null)}
        title="Published Event Details"
        description="Comprehensive audit record & published event details"
        size="lg"
        footer={
          <div className="flex justify-between items-center w-full flex-wrap gap-2">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEventNotice(viewingEvent)}
              >
                View Notice PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadEventNotice(viewingEvent)}
              >
                Download PDF
              </Button>
            </div>
            <div className="flex gap-2">
              {viewingEvent?.status !== EVENT_STATUS.OVERRIDDEN_BY_DSW && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={ShieldAlert}
                  onClick={() => {
                    setSelectedEvent(viewingEvent);
                    setViewingEvent(null);
                    setOverrideModalOpen(true);
                  }}
                >
                  Override / Reject
                </Button>
              )}
              <Button variant="outline" onClick={() => setViewingEvent(null)}>
                Close
              </Button>
            </div>
          </div>
        }
      >
        {viewingEvent && (
          <div className="modal-form" style={{ gap: 'var(--space-4)' }}>
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3" style={{ borderBottom: '1px solid var(--slate-200)' }}>
              <div>
                <span className="text-xs text-muted block">Organizing Club</span>
                <span className="font-semibold text-sm">{viewingEvent.clubName || 'College Club'}</span>
                {viewingEvent.department && (
                  <span className="text-xs text-muted ml-2">• Department of {viewingEvent.department}</span>
                )}
              </div>
              <Badge variant={EVENT_STATUS_VARIANTS[viewingEvent.status] || 'success'} size="sm" dot>
                {EVENT_STATUS_LABELS[viewingEvent.status] || 'Approved & Published'}
              </Badge>
            </div>

            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--slate-900)' }}>{viewingEvent.title}</h3>
            </div>

            {viewingEvent.description && (
              <div>
                <span className="text-xs font-semibold text-muted block uppercase tracking-wider mb-1">Description</span>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-md border">{viewingEvent.description}</p>
              </div>
            )}

            {viewingEvent.objective && (
              <div>
                <span className="text-xs font-semibold text-muted block uppercase tracking-wider mb-1">Objective</span>
                <p className="text-sm text-slate-700">{viewingEvent.objective}</p>
              </div>
            )}

            {viewingEvent.additionalDetails && (
              <div>
                <span className="text-xs font-semibold text-muted block uppercase tracking-wider mb-1">Additional Details</span>
                <p className="text-sm text-slate-700">{viewingEvent.additionalDetails}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-md border">
                <span className="text-xs text-muted block">Venue</span>
                <span className="font-medium">{viewingEvent.venue || 'Campus Venue'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-md border">
                <span className="text-xs text-muted block">Date & Time</span>
                <span className="font-medium">
                  {viewingEvent.startDate ? new Date(viewingEvent.startDate).toLocaleString() : 'TBA'}
                  {viewingEvent.endDate ? ` — ${new Date(viewingEvent.endDate).toLocaleTimeString()}` : ''}
                </span>
              </div>

              {viewingEvent.registrationDeadline && (
                <div className="p-3 bg-slate-50 rounded-md border">
                  <span className="text-xs text-muted block">Registration Deadline</span>
                  <span className="font-medium">{new Date(viewingEvent.registrationDeadline).toLocaleDateString()}</span>
                </div>
              )}

              {viewingEvent.maxParticipants && (
                <div className="p-3 bg-slate-50 rounded-md border">
                  <span className="text-xs text-muted block">Max Capacity</span>
                  <span className="font-medium">{viewingEvent.maxParticipants} Attendees</span>
                </div>
              )}
            </div>

            <div className="p-3 rounded-md border space-y-2" style={{ backgroundColor: 'var(--success-50)', borderColor: 'var(--success-100)' }}>
              <span className="text-xs font-semibold block uppercase tracking-wider" style={{ color: 'var(--success-700)' }}>
                Workflow Approvals & Publication Audit
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span><strong>Faculty Incharge:</strong> {viewingEvent.approvedByFaculty || 'Prof. Vivek Sengupta (Verified)'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span><strong>HOD Approval:</strong> {viewingEvent.approvedByHod || 'Dr. Ramesh Sharma (Sanctioned)'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span><strong>Publication Status:</strong> Published & Active</span>
                </div>
              </div>
            </div>

            <SupportingDocumentActions event={viewingEvent} />
          </div>
        )}
      </Modal>

      {/* Modal: DSW Override */}
      <Modal
        isOpen={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        title="DSW Event Override / Rejection"
        description={`Execute administrative veto for "${selectedEvent?.title}". This will revoke approval status.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setOverrideModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDswOverride} isLoading={actionLoading}>
              Confirm Override
            </Button>
          </>
        }
      >
        <form onSubmit={handleDswOverride} className="modal-form">
          <Input
            label="Administrative Reason for Override"
            placeholder="e.g. Venue scheduling conflict with college convocation"
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            required
          />
        </form>
      </Modal>

      {/* Certificate Viewer / Approver Modal */}
      {reviewingCert && (
        <CertificateView
          certificate={reviewingCert}
          onClose={() => setReviewingCert(null)}
          canApprove={reviewingCert.status === 'PENDING_DSW_APPROVAL'}
          currentUserRole="Dean Student Welfare (DSW)"
          onApprove={async (cert) => {
            await certificateService.approveCertificate(cert.id, user);
            setReviewingCert(null);
            loadData();
            setFeedbackMsg({ type: 'success', text: `Certificate for ${cert.studentName} received DSW Final Authorization!` });
          }}
          onReject={(cert) => {
            setRejectingCert(cert);
            setReviewingCert(null);
          }}
        />
      )}

      {/* Certificate Rejection Modal */}
      <Modal
        isOpen={Boolean(rejectingCert)}
        onClose={() => setRejectingCert(null)}
        title="Return Certificate for Revision"
        description={`Return certificate for "${rejectingCert?.studentName}" (${rejectingCert?.position}) to HOD & Faculty.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectingCert(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!certRejectReason) return;
                await certificateService.rejectCertificate(rejectingCert.id, user, certRejectReason);
                setRejectingCert(null);
                setCertRejectReason('');
                loadData();
                setFeedbackMsg({ type: 'success', text: 'Certificate returned for correction.' });
              }}
            >
              Return Certificate
            </Button>
          </>
        }
      >
        <div className="modal-form">
          <Input
            label="DSW Audit Return Reason"
            placeholder="e.g. Please verify student name spelling and event date alignment..."
            value={certRejectReason}
            onChange={(e) => setCertRejectReason(e.target.value)}
            required
          />
        </div>
      </Modal>
    </div>
  );
};
