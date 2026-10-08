import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Award,
  Users,
  Layers,
  ClipboardList,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserPlus,
  Trash2,
  Calendar,
  MapPin,
  Clock,
  BookOpen,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { EVENT_STATUS, EVENT_STATUS_LABELS, EVENT_STATUS_VARIANTS } from '../../constants/eventStatus';
import { clubService } from '../../services/clubService';
import { eventService } from '../../services/eventService';
import { userService } from '../../services/userService';
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
import { SupportingDocumentActions } from '../../components/common/SupportingDocumentActions';
import { StudentDirectoryView } from '../../components/common/StudentDirectoryView';
import { certificateService } from '../../services/certificateService';
import { CertificateView } from '../../components/common/CertificateView';
import './FacultyDashboard.css';

export const FacultyDashboard = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const validTabs = ['overview', 'clubs', 'coordinators', 'proposals', 'students', 'certificates', 'attendance', 'documents'];

  const userDepartment = user?.department || 'Computer Science';

  const [loading, setLoading] = useState(true);
  const [assignedClubs, setAssignedClubs] = useState([]);
  const [pendingProposals, setPendingProposals] = useState([]);
  const [allClubEvents, setAllClubEvents] = useState([]);
  const [deptStudents, setDeptStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [reviewingCert, setReviewingCert] = useState(null);
  const [rejectingCert, setRejectingCert] = useState(null);
  const [certRejectReason, setCertRejectReason] = useState('');
  const [attendanceQrOpen, setAttendanceQrOpen] = useState(false);
  const [attendanceQrEventId, setAttendanceQrEventId] = useState('');
  const [attendanceSession, setAttendanceSession] = useState(null);

  // Modals & Action states
  const [coordModalOpen, setCoordModalOpen] = useState(false);
  const [coordinatorToRemove, setCoordinatorToRemove] = useState(null);
  const [selectedClubForCoord, setSelectedClubForCoord] = useState('');
  const [selectedStudentForCoord, setSelectedStudentForCoord] = useState('');

  const [selectedProposal, setSelectedProposal] = useState(null);
  const [proposalModalMode, setProposalModalMode] = useState(''); // 'approve' | 'reject'
  const [rejectReason, setRejectReason] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [clubs, allEvents, deptStudents, attendance, certs] = await Promise.all([
        clubService.getClubsByFaculty(user.id),
        eventService.getEvents(),
        userService.getDepartmentStudents(user),
        eventService.getAttendance(),
        certificateService.getCertificates(),
      ]);

      const myClubs = clubs;
      const myClubIds = myClubs.map((c) => c.id);

      const proposals = allEvents.filter(
        (e) => e.status === EVENT_STATUS.PENDING_FACULTY && myClubIds.includes(e.clubId)
      );

      const clubEvents = allEvents.filter((e) => myClubIds.includes(e.clubId));
      const facultyCerts = certs.filter((c) => myClubIds.includes(c.clubId));

      setAssignedClubs(myClubs);
      setPendingProposals(proposals);
      setAllClubEvents(clubEvents);
      setDeptStudents(deptStudents);
      setAttendanceRecords(attendance);
      setCertificates(facultyCerts);
    } catch (err) {
      console.error('Failed to load Faculty data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  useEffect(() => {
    if (!validTabs.includes(activeTab)) setSearchParams({ tab: 'overview' }, { replace: true });
  }, [activeTab, setSearchParams]);

  const handleTabChange = (tabKey) => {
    setSearchParams({ tab: tabKey });
    setFeedbackMsg({ type: '', text: '' });
  };

  const handleGenerateAttendanceQr = async () => {
    if (!attendanceQrEventId) {
      setFeedbackMsg({ type: 'error', text: 'Select an approved event before generating its attendance QR.' });
      return;
    }
    setActionLoading(true);
    try {
      setAttendanceSession(await eventService.createAttendanceSession(attendanceQrEventId, user.id));
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Could not generate the attendance QR.' });
    } finally {
      setActionLoading(false);
    }
  };

  const openAttendanceQr = () => {
    setAttendanceQrEventId('');
    setAttendanceSession(null);
    setAttendanceQrOpen(true);
  };

  // Appoint Coordinator Handler
  const handleAppointCoordinator = async (e) => {
    e.preventDefault();
    if (!selectedClubForCoord || !selectedStudentForCoord) {
      setFeedbackMsg({ type: 'error', text: 'Please select both a club and a student.' });
      return;
    }

    setActionLoading(true);
    try {
      await clubService.appointCoordinator(selectedClubForCoord, selectedStudentForCoord);
      setCoordModalOpen(false);
      setSelectedClubForCoord('');
      setSelectedStudentForCoord('');
      setFeedbackMsg({ type: 'success', text: 'Student appointed as Club Coordinator successfully!' });
      loadData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to appoint coordinator.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Remove Coordinator Handler
  const handleRemoveCoordinator = async () => {
    if (!coordinatorToRemove) return;
    setActionLoading(true);
    try {
      await clubService.removeCoordinator(coordinatorToRemove.clubId, coordinatorToRemove.studentId);
      setCoordinatorToRemove(null);
      setFeedbackMsg({ type: 'success', text: `${coordinatorToRemove.studentName} removed from coordinator role.` });
      loadData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Failed to remove coordinator.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Event Proposal -> moves to PENDING_HOD
  const handleApproveProposal = async () => {
    if (!selectedProposal) return;
    setActionLoading(true);
    try {
      await eventService.facultyApproveEvent(selectedProposal.id, user.name);
      setProposalModalMode('');
      setSelectedProposal(null);
      setFeedbackMsg({
        type: 'success',
        text: `Proposal "${selectedProposal.title}" approved and forwarded to HOD for Stage 2 review!`,
      });
      loadData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Failed to approve proposal.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Event Proposal
  const handleRejectProposal = async (e) => {
    e.preventDefault();
    if (!selectedProposal) return;
    setActionLoading(true);
    try {
      await eventService.facultyRejectEvent(
        selectedProposal.id,
        rejectReason || 'Returned by Faculty Incharge for revisions'
      );
      setProposalModalMode('');
      setSelectedProposal(null);
      setRejectReason('');
      setFeedbackMsg({
        type: 'success',
        text: `Proposal "${selectedProposal.title}" returned to student proposal team.`,
      });
      loadData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Failed to return proposal.' });
    } finally {
      setActionLoading(false);
    }
  };

  const totalMembers = assignedClubs.reduce((acc, c) => acc + (c.memberCount || 0), 0);
  const totalCoordinators = assignedClubs.reduce(
    (acc, c) => acc + (c.coordinators?.length || 0),
    0
  );

  const handleDeleteStudent = async (studentId) => {
    try {
      await userService.deleteStudent(studentId, user);
      setDeptStudents((prev) => prev.filter((s) => s.id !== studentId));
      setFeedbackMsg({ type: 'success', text: 'Student deleted successfully.' });
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to delete student.' });
    }
  };

  return (
    <div className="dashboard-container">
      {/* Hero Banner */}
      <div className="dashboard-hero">
        <div>
          <div className="dashboard-hero__badge dashboard-hero__badge--info">
            <Award size={14} />
            <span>Club Governance & Mentorship</span>
          </div>
          <h1 className="dashboard-hero__title">Faculty Incharge Portal</h1>
          <p className="dashboard-hero__subtitle">
            Overseeing assigned clubs, appointing Student Coordinators, reviewing event proposals & attendance.
          </p>
        </div>

        <div className="dashboard-hero__actions">
          <Button
            variant="primary"
            icon={UserPlus}
            onClick={() => {
              if (assignedClubs.length > 0) {
                setSelectedClubForCoord(assignedClubs[0].id);
              }
              setCoordModalOpen(true);
            }}
          >
            Appoint Coordinator
          </Button>
        </div>
      </div>

      {feedbackMsg.text && (
        <div className={`dashboard-alert dashboard-alert--${feedbackMsg.type}`}>
          {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="metrics-grid">
        <Card className="metric-card" hoverable onClick={() => handleTabChange('clubs')}>
          <div className="metric-card__header">
            <span className="metric-card__label">Assigned Clubs</span>
            <div className="metric-card__icon metric-card__icon--blue">
              <Layers size={20} />
            </div>
          </div>
          <span className="metric-card__value">{assignedClubs.length}</span>
          <span className="metric-card__hint">Under your direct mentorship</span>
        </Card>

        <Card className="metric-card" hoverable onClick={() => handleTabChange('proposals')}>
          <div className="metric-card__header">
            <span className="metric-card__label">Pending Proposals</span>
            <div className="metric-card__icon metric-card__icon--amber">
              <Clock size={20} />
            </div>
          </div>
          <span className="metric-card__value">{pendingProposals.length}</span>
          <span className="metric-card__hint">Awaiting initial verification</span>
        </Card>

        <Card className="metric-card" hoverable onClick={() => handleTabChange('coordinators')}>
          <div className="metric-card__header">
            <span className="metric-card__label">Active Coordinators</span>
            <div className="metric-card__icon metric-card__icon--green">
              <Sparkles size={20} />
            </div>
          </div>
          <span className="metric-card__value">{totalCoordinators}</span>
          <span className="metric-card__hint">Appointed student leaders</span>
        </Card>

        <Card className="metric-card" hoverable onClick={() => handleTabChange('students')}>
          <div className="metric-card__header">
            <span className="metric-card__label">Student Directory</span>
            <div className="metric-card__icon metric-card__icon--purple">
              <Users size={20} />
            </div>
          </div>
          <span className="metric-card__value">{deptStudents.length}</span>
          <span className="metric-card__hint">Students in your department</span>
        </Card>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'overview' ? 'tab-btn--active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          Faculty Overview
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'clubs' ? 'tab-btn--active' : ''}`}
          onClick={() => handleTabChange('clubs')}
        >
          Assigned Clubs ({assignedClubs.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'coordinators' ? 'tab-btn--active' : ''}`}
          onClick={() => handleTabChange('coordinators')}
        >
          Student Coordinators ({totalCoordinators})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'proposals' ? 'tab-btn--active' : ''}`}
          onClick={() => handleTabChange('proposals')}
        >
          Event Proposals ({pendingProposals.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'students' ? 'tab-btn--active' : ''}`}
          onClick={() => handleTabChange('students')}
        >
          Student Directory ({deptStudents.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'attendance' ? 'tab-btn--active' : ''}`}
          onClick={() => handleTabChange('attendance')}
        >
          Attendance & Docs
        </button>
      </div>

      {loading ? (
        <div className="dashboard-loading">
          <Spinner size="lg" />
          <p>Loading faculty governance records...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div className="overview-layout">
              {/* Event Workflow Stage 1 Box */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Approval Stage: Stage 1 (Faculty Verification)</CardTitle>
                  <CardDescription>
                    You review event plans submitted by Student Coordinators before forwarding to the HOD.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="workflow-steps">
                    <div className="workflow-step workflow-step--completed">
                      <span className="workflow-step__num">1</span>
                      <div className="workflow-step__content">
                        <strong>Coordinator Draft</strong>
                        <span>Event details, budget & proposal submitted</span>
                      </div>
                    </div>

                    <div className="workflow-step workflow-step--active">
                      <span className="workflow-step__num">2</span>
                      <div className="workflow-step__content">
                        <strong>Faculty Verification (Current Stage)</strong>
                        <span>Safety, academic calendar & logistics check</span>
                      </div>
                    </div>

                    <div className="workflow-step">
                      <span className="workflow-step__num">3</span>
                      <div className="workflow-step__content">
                        <strong>HOD Approval</strong>
                        <span>Department head sanction</span>
                      </div>
                    </div>

                    <div className="workflow-step">
                      <span className="workflow-step__num">4</span>
                      <div className="workflow-step__content">
                        <strong>Published & Live</strong>
                        <span>DSW central audit & student registration</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Proposals Quick Table */}
              <Card>
                <CardHeader
                  action={
                    <Button variant="ghost" size="sm" onClick={() => handleTabChange('proposals')}>
                      View All ({pendingProposals.length})
                    </Button>
                  }
                >
                  <CardTitle>Pending Club Event Proposals</CardTitle>
                  <CardDescription>Proposals awaiting your verification</CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingProposals.length === 0 ? (
                    <EmptyState
                      title="No pending proposals"
                      description="All event proposals for your assigned clubs have been reviewed."
                      size="sm"
                    />
                  ) : (
                    <Table
                      columns={[
                        { key: 'title', header: 'Proposal Title' },
                        { key: 'clubName', header: 'Club' },
                        { key: 'submittedBy', header: 'Submitted By' },
                        {
                          key: 'actions',
                          header: 'Action',
                          align: 'right',
                          render: (_, row) => (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setSelectedProposal(row);
                                setProposalModalMode('approve');
                              }}
                            >
                              Review & Forward
                            </Button>
                          ),
                        },
                      ]}
                      data={pendingProposals}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'clubs' && (
            <div className="assigned-clubs-grid">
              {assignedClubs.map((club) => (
                <Card key={club.id} bordered className="assigned-club-card">
                  <div className="assigned-club-card__header">
                    <img src={club.logoUrl} alt={club.name} className="assigned-club-card__logo" />
                    <div>
                      <h3 className="assigned-club-card__title">{club.name}</h3>
                      <span className="assigned-club-card__dept">{club.department}</span>
                    </div>
                  </div>

                  <p className="assigned-club-card__desc">{club.description}</p>

                  <div className="assigned-club-card__coordinators">
                    <span className="text-xs font-semibold text-muted">Student Coordinators:</span>
                    {club.coordinators?.length > 0 ? (
                      <div className="coordinator-tags">
                        {club.coordinators.map((c) => (
                          <Badge key={c.id} variant="warning" size="sm" dot>
                            {c.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted">No student coordinator appointed yet.</p>
                    )}
                  </div>

                  <div className="assigned-club-card__footer">
                    <span className="text-xs text-muted">
                      <strong>{club.memberCount}</strong> Members Registered
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedClubForCoord(club.id);
                        setCoordModalOpen(true);
                      }}
                    >
                      + Appoint Coordinator
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'coordinators' && (
            <Card>
              <CardHeader
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    icon={UserPlus}
                    onClick={() => {
                      if (assignedClubs.length > 0) setSelectedClubForCoord(assignedClubs[0].id);
                      setCoordModalOpen(true);
                    }}
                  >
                    Appoint New Coordinator
                  </Button>
                }
              >
                <CardTitle>Student Club Coordinators</CardTitle>
                <CardDescription>
                  Students appointed by Faculty Incharge to submit event proposals and lead club operations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {totalCoordinators === 0 ? (
                  <EmptyState
                    title="No coordinators appointed"
                    description="You have not appointed any student club coordinators yet."
                    action={
                      <Button
                        variant="primary"
                        onClick={() => {
                          if (assignedClubs.length > 0) setSelectedClubForCoord(assignedClubs[0].id);
                          setCoordModalOpen(true);
                        }}
                      >
                        Appoint First Coordinator
                      </Button>
                    }
                  />
                ) : (
                  <div className="coordinators-list">
                    {assignedClubs.map((club) =>
                      club.coordinators?.map((c) => (
                        <div key={`${club.id}-${c.id}`} className="coordinator-row">
                          <div className="coordinator-row__info">
                            <Sparkles size={16} className="coordinator-row__icon" />
                            <div>
                              <span className="coordinator-row__name">{c.name}</span>
                              <span className="coordinator-row__email">{c.email}</span>
                            </div>
                          </div>

                          <div className="coordinator-row__club">
                            <Badge variant="primary" size="sm">
                              {club.name}
                            </Badge>
                          </div>

                          <Button
                            variant="danger"
                            size="sm"
                            icon={Trash2}
                            onClick={() => setCoordinatorToRemove({ clubId: club.id, studentId: c.id, studentName: c.name, clubName: club.name })}
                          >
                            Remove
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'proposals' && (
            <Card>
              <CardHeader>
                <CardTitle>Event Proposals Review</CardTitle>
                <CardDescription>
                  Review proposals before sanctioning them for Head of Department (HOD) review.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingProposals.length === 0 ? (
                  <EmptyState
                    title="No pending proposals"
                    description="All event proposals have been verified or none are awaiting review."
                  />
                ) : (
                  <div className="event-reviews-list">
                    {pendingProposals.map((proposal) => (
                      <Card key={proposal.id} bordered className="review-item-card">
                        <div className="review-item-card__body">
                          <div className="review-item-card__header">
                            <div>
                              <Badge variant="warning" size="sm" dot>
                                Pending Faculty Review
                              </Badge>
                              <h3 className="review-item-card__title">{proposal.title}</h3>
                              <span className="review-item-card__club">
                                {proposal.clubName} • Submitted by: {proposal.submittedBy}
                              </span>
                            </div>
                          </div>

                          <p className="review-item-card__desc">{proposal.description}</p>
                          {proposal.objective && <p className="text-sm text-muted"><strong>Objective:</strong> {proposal.objective}</p>}
                          {proposal.additionalDetails && <p className="text-sm text-muted"><strong>Additional details:</strong> {proposal.additionalDetails}</p>}
                          <SupportingDocumentActions event={proposal} />

                          <div className="review-item-card__details">
                            <div className="detail-pill">
                              <MapPin size={14} />
                              <span>{proposal.venue}</span>
                            </div>
                            <div className="detail-pill">
                              <Calendar size={14} />
                              <span>{new Date(proposal.startDate).toLocaleString()}</span>
                            </div>
                            <div className="detail-pill">
                              <Users size={14} />
                              <span>Capacity: {proposal.maxParticipants} Participants</span>
                            </div>
                          </div>
                        </div>

                        <div className="review-item-card__actions">
                          <Button
                            variant="primary"
                            icon={CheckCircle2}
                            onClick={() => {
                              setSelectedProposal(proposal);
                              setProposalModalMode('approve');
                            }}
                          >
                            Approve & Forward to HOD
                          </Button>
                          <Button
                            variant="outline"
                            icon={XCircle}
                            onClick={() => {
                              setSelectedProposal(proposal);
                              setProposalModalMode('reject');
                            }}
                          >
                            Return for Revision
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'students' && (
            <StudentDirectoryView
              students={deptStudents}
              departmentName={userDepartment}
              isLoading={loading}
              allowDelete={true}
              onDeleteStudent={handleDeleteStudent}
            />
          )}

          {activeTab === 'attendance' && (
            <Card>
              <CardHeader action={<Button variant="primary" size="sm" icon={QrCode} onClick={openAttendanceQr}>Generate Attendance QR</Button>}>
                <CardTitle>Attendance & Club Governance Documents</CardTitle>
                <CardDescription>
                  Manage event rosters, attendance records, and club sanction documents.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table
                  columns={[
                    { key: 'studentName', header: 'Student' },
                    { key: 'rollNumber', header: 'Roll Number' },
                    { key: 'department', header: 'Department' },
                    { key: 'eventTitle', header: 'Event' },
                    { key: 'clubName', header: 'Club' },
                    { key: 'markedAt', header: 'Marked On', render: (value) => new Date(value).toLocaleDateString() },
                    { key: 'status', header: 'Status', render: () => <Badge variant="success" size="sm" dot>Present</Badge> },
                  ]}
                  data={attendanceRecords
                    .filter((record) => allClubEvents.some((event) => event.id === record.eventId))
                    .map((record) => {
                      const event = allClubEvents.find((item) => item.id === record.eventId);
                      const student = deptStudents.find((item) => item.id === record.studentId);
                      return { ...record, studentName: record.studentName || student?.name || 'Student', rollNumber: record.rollNumber || student?.rollNumber || '—', department: record.department || student?.department || student?.branch || '—', eventTitle: record.eventTitle || event?.title || 'Event', clubName: record.clubName || event?.clubName || 'Club' };
                    })}
                  emptyState={<EmptyState title="No attendance recorded" description="Verified attendance will appear here after students check in." size="sm" />}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'documents' && (
            <PortalSection
              section="documents"
              metrics={[
                { label: 'Assigned Clubs', value: assignedClubs.length, hint: 'Governance records' },
                { label: 'Event Proposals', value: allClubEvents.length, hint: 'Supporting event documents' },
              ]}
            />
          )}

          {/* TAB: CERTIFICATE APPROVALS */}
          {activeTab === 'certificates' && (
            <div className="tab-pane">
              <PortalSection
                title="Certificate Approvals Desk"
                description="Review 3-student merit certificate batches submitted by your club coordinators."
              />

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Certificates Pending Faculty Sign-Off</CardTitle>
                  <CardDescription>Stage 1 verification of student names, event dates, and merit positions.</CardDescription>
                </CardHeader>
                <CardContent>
                  {certificates.filter((c) => c.status === 'PENDING_FACULTY_APPROVAL').length === 0 ? (
                    <EmptyState
                      icon={Award}
                      title="No Certificates Pending Review"
                      description="You're all caught up! Submitted certificate batches from your coordinators will appear here for review."
                    />
                  ) : (
                    <Table
                      columns={[
                        { key: 'studentName', header: 'Student Name' },
                        { key: 'position', header: 'Position', render: (val) => <Badge variant={val.includes('1st') ? 'warning' : val.includes('2nd') ? 'info' : 'purple'}>{val}</Badge> },
                        { key: 'eventName', header: 'Event' },
                        { key: 'clubName', header: 'Club' },
                        { key: 'submittedBy', header: 'Coordinator', render: (val) => val?.name || 'Student Coordinator' },
                        {
                          key: 'status',
                          header: 'Status',
                          render: () => <Badge variant="warning" dot>Pending Faculty</Badge>,
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
                              <Award size={14} /> Review & Approve
                            </Button>
                          ),
                        },
                      ]}
                      data={certificates.filter((c) => c.status === 'PENDING_FACULTY_APPROVAL')}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Certificate History */}
              <Card>
                <CardHeader>
                  <CardTitle>All Club Certificates History</CardTitle>
                  <CardDescription>Log of approved and processed certificates for assigned clubs.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table
                    columns={[
                      { key: 'studentName', header: 'Student Name' },
                      { key: 'position', header: 'Position', render: (val) => <Badge variant={val.includes('1st') ? 'warning' : val.includes('2nd') ? 'info' : 'purple'}>{val}</Badge> },
                      { key: 'eventName', header: 'Event' },
                      { key: 'clubName', header: 'Club' },
                      {
                        key: 'status',
                        header: 'Current Status',
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
                        header: 'View',
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
        </>
      )}

      {/* Certificate Viewer / Approver Modal */}
      {reviewingCert && (
        <CertificateView
          certificate={reviewingCert}
          onClose={() => setReviewingCert(null)}
          canApprove={reviewingCert.status === 'PENDING_FACULTY_APPROVAL'}
          currentUserRole="Faculty Incharge"
          onApprove={async (cert) => {
            await certificateService.approveCertificate(cert.id, user);
            setReviewingCert(null);
            loadData();
            setFeedbackMsg({ type: 'success', text: `Certificate for ${cert.studentName} approved and forwarded to HOD!` });
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
        description={`Return certificate for "${rejectingCert?.studentName}" (${rejectingCert?.position}) to Student Coordinator.`}
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
                setFeedbackMsg({ type: 'success', text: 'Certificate returned to coordinator with guidance.' });
              }}
            >
              Return Certificate
            </Button>
          </>
        }
      >
        <div className="modal-form">
          <Input
            label="Rejection / Revision Reason"
            placeholder="e.g. Please verify student full name spelling as per college register..."
            value={certRejectReason}
            onChange={(e) => setCertRejectReason(e.target.value)}
            required
          />
        </div>
      </Modal>

      <Modal
        isOpen={attendanceQrOpen}
        onClose={() => setAttendanceQrOpen(false)}
        title="Generate Event Attendance QR"
        description="Create a time-limited QR for an approved event. Students scan it on their phones to check in."
        footer={!attendanceSession ? <><Button variant="outline" onClick={() => setAttendanceQrOpen(false)}>Cancel</Button><Button variant="primary" icon={QrCode} onClick={handleGenerateAttendanceQr} isLoading={actionLoading}>Generate QR</Button></> : <Button variant="primary" onClick={() => setAttendanceQrOpen(false)}>Done</Button>}
      >
        {!attendanceSession ? (
          <div className="attendance-checkin-panel"><div className="form-group"><label className="form-label" htmlFor="faculty-attendance-event">Approved event</label><select id="faculty-attendance-event" className="input-control" value={attendanceQrEventId} onChange={(event) => setAttendanceQrEventId(event.target.value)}><option value="">Select an approved event</option>{allClubEvents.filter((event) => event.status === EVENT_STATUS.APPROVED).map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select></div></div>
        ) : (
          <div className="attendance-checkin-panel"><div className="attendance-qr-display"><QRCodeSVG value={`${window.location.origin}/attendance/mark?session=${encodeURIComponent(attendanceSession.id)}`} size={224} level="H" includeMargin bgColor="#ffffff" fgColor="#0f172a" /><strong>{allClubEvents.find((event) => event.id === attendanceSession.eventId)?.title}</strong><span>Valid until {new Date(attendanceSession.expiresAt).toLocaleString()}. Each student can check in once.</span><Button variant="outline" size="sm" onClick={() => window.location.assign(`/attendance/mark?session=${encodeURIComponent(attendanceSession.id)}`)}>Open attendance form</Button></div></div>
        )}
      </Modal>

      {/* Modal: Appoint Coordinator */}
      <Modal
        isOpen={coordModalOpen}
        onClose={() => setCoordModalOpen(false)}
        title="Appoint Student Club Coordinator"
        description="Select an enrolled student to grant coordinator responsibilities for your assigned club."
        footer={
          <>
            <Button variant="outline" onClick={() => setCoordModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAppointCoordinator}
              isLoading={actionLoading}
            >
              Appoint Coordinator
            </Button>
          </>
        }
      >
        <form onSubmit={handleAppointCoordinator} className="modal-form">
          <Select
            label="Assigned Club"
            value={selectedClubForCoord}
            onChange={(e) => setSelectedClubForCoord(e.target.value)}
            options={assignedClubs.map((c) => ({ value: c.id, label: c.name }))}
            required
          />

          <Select
            label="Select Student"
            value={selectedStudentForCoord}
            onChange={(e) => setSelectedStudentForCoord(e.target.value)}
            options={[
              { value: '', label: 'Select a registered student...' },
              ...deptStudents.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.email} - ${s.branch})`,
              })),
            ]}
            required
          />
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(coordinatorToRemove)}
        onClose={() => setCoordinatorToRemove(null)}
        title="Remove Club Coordinator?"
        description={`Remove ${coordinatorToRemove?.studentName || 'this student'} as coordinator for ${coordinatorToRemove?.clubName || 'this club'}?`}
        size="sm"
        footer={<><Button variant="outline" onClick={() => setCoordinatorToRemove(null)}>Cancel</Button><Button variant="danger" onClick={handleRemoveCoordinator} isLoading={actionLoading}>Remove Coordinator</Button></>}
      >
        <p className="text-sm text-muted">The student remains a club member but can no longer submit proposals as this club's coordinator.</p>
      </Modal>

      {/* Modal: Approve Proposal */}
      <Modal
        isOpen={proposalModalMode === 'approve'}
        onClose={() => setProposalModalMode('')}
        title="Verify & Forward to HOD"
        description={`Approve proposal "${selectedProposal?.title}" and forward it to Head of Department (HOD) for Stage 2 sanctioning.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setProposalModalMode('')}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleApproveProposal} isLoading={actionLoading}>
              Verify & Forward
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Your faculty verification certifies that event dates, speaker credentials, and initial safety clearances have been inspected.
        </p>
      </Modal>

      {/* Modal: Reject Proposal */}
      <Modal
        isOpen={proposalModalMode === 'reject'}
        onClose={() => setProposalModalMode('')}
        title="Return Event Proposal for Revision"
        description={`Return "${selectedProposal?.title}" to the student coordinator team for adjustments.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setProposalModalMode('')}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleRejectProposal} isLoading={actionLoading}>
              Return Proposal
            </Button>
          </>
        }
      >
        <form onSubmit={handleRejectProposal} className="modal-form">
          <Input
            label="Faculty Guidance / Return Reason"
            placeholder="e.g. Please update the workshop prerequisite requirements and adjust schedule"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
          />
        </form>
      </Modal>
    </div>
  );
};
