import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  FileCheck2,
  Layers,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Users,
  Award,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { EVENT_STATUS, EVENT_STATUS_LABELS, EVENT_STATUS_VARIANTS } from '../../constants/eventStatus';
import { clubService } from '../../services/clubService';
import { eventService } from '../../services/eventService';
import { userService } from '../../services/userService';
import { certificateService } from '../../services/certificateService';
import { CertificateView } from '../../components/common/CertificateView';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Spinner } from '../../components/common/Loading';
import { EmptyState } from '../../components/common/EmptyState';
import { PortalSection } from '../../components/common/PortalSection';
import { SupportingDocumentActions } from '../../components/common/SupportingDocumentActions';
import { StudentDirectoryView } from '../../components/common/StudentDirectoryView';
import './HodDashboard.css';

export const HodDashboard = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const validTabs = ['overview', 'reviews', 'clubs', 'activities', 'students', 'reports', 'documents', 'analytics', 'certificates'];

  const userDepartment = user?.department || 'Computer Science';

  const [loading, setLoading] = useState(true);
  const [deptClubs, setDeptClubs] = useState([]);
  const [deptEvents, setDeptEvents] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [deptStudents, setDeptStudents] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [reviewingCert, setReviewingCert] = useState(null);
  const [rejectingCert, setRejectingCert] = useState(null);
  const [certRejectReason, setCertRejectReason] = useState('');

  // Modals & Action states
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [reviewModalMode, setReviewModalMode] = useState(''); // 'approve' | 'reject'
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [clubs, allEvents, attendance, students, certs] = await Promise.all([
        clubService.getClubsByDepartment(userDepartment),
        eventService.getEvents(),
        eventService.getAttendance(),
        userService.getDepartmentStudents(user),
        certificateService.getCertificatesByHod(userDepartment),
      ]);

      const filteredEvents = allEvents.filter(
        (e) => e.department === userDepartment || userDepartment.includes(e.department)
      );

      const pending = filteredEvents.filter((e) => e.status === EVENT_STATUS.PENDING_HOD);

      setDeptClubs(clubs);
      setDeptEvents(filteredEvents);
      setPendingReviews(pending);
      setAttendanceRecords(attendance);
      setDeptStudents(students);
      setCertificates(certs);
    } catch (err) {
      console.error('Failed to load HOD data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userDepartment]);

  useEffect(() => {
    if (!validTabs.includes(activeTab)) setSearchParams({ tab: 'overview' }, { replace: true });
  }, [activeTab, setSearchParams]);

  const handleTabChange = (tabKey) => {
    setSearchParams({ tab: tabKey });
    setFeedbackMsg({ type: '', text: '' });
  };

  const handleApproveEvent = async () => {
    if (!selectedEvent) return;
    setActionLoading(true);
    try {
      await eventService.hodApproveEvent(selectedEvent.id, user.name);
      setReviewModalMode('');
      setSelectedEvent(null);
      setFeedbackMsg({
        type: 'success',
        text: `Event "${selectedEvent.title}" approved and published successfully!`,
      });
      loadData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Failed to approve event.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectEvent = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setActionLoading(true);
    try {
      await eventService.hodRejectEvent(
        selectedEvent.id,
        rejectReason || 'Returned by HOD for revisions'
      );
      setReviewModalMode('');
      setSelectedEvent(null);
      setRejectReason('');
      setFeedbackMsg({
        type: 'success',
        text: `Event proposal "${selectedEvent.title}" returned for revision.`,
      });
      loadData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Failed to return event proposal.' });
    } finally {
      setActionLoading(false);
    }
  };

  const approvedCount = deptEvents.filter((e) => e.status === EVENT_STATUS.APPROVED).length;

  return (
    <div className="dashboard-container">
      {/* Hero Banner */}
      <div className="dashboard-hero">
        <div>
          <div className="dashboard-hero__badge dashboard-hero__badge--purple">
            <Building2 size={14} />
            <span>Departmental Leadership</span>
          </div>
          <h1 className="dashboard-hero__title">Head of Department (HOD) Portal</h1>
          <p className="dashboard-hero__subtitle">
            Department of {userDepartment} • Event approval workflow, branch club activities & academic oversight.
          </p>
        </div>

        <div className="dashboard-hero__actions">
          <Button
            variant="primary"
            icon={FileCheck2}
            onClick={() => handleTabChange('reviews')}
          >
            Review Pending Events ({pendingReviews.length})
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
        <Card className="metric-card" hoverable onClick={() => handleTabChange('reviews')}>
          <div className="metric-card__header">
            <span className="metric-card__label">Pending Reviews</span>
            <div className="metric-card__icon metric-card__icon--amber">
              <Clock size={20} />
            </div>
          </div>
          <span className="metric-card__value">{pendingReviews.length}</span>
          <span className="metric-card__hint">Forwarded by Faculty Incharge</span>
        </Card>

        <Card className="metric-card" hoverable onClick={() => handleTabChange('clubs')}>
          <div className="metric-card__header">
            <span className="metric-card__label">Department Clubs</span>
            <div className="metric-card__icon metric-card__icon--blue">
              <Layers size={20} />
            </div>
          </div>
          <span className="metric-card__value">{deptClubs.length}</span>
          <span className="metric-card__hint">Affiliated with {user?.deptCode || 'Dept'}</span>
        </Card>

        <Card className="metric-card" hoverable onClick={() => handleTabChange('activities')}>
          <div className="metric-card__header">
            <span className="metric-card__label">Approved Events</span>
            <div className="metric-card__icon metric-card__icon--green">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <span className="metric-card__value">{approvedCount}</span>
          <span className="metric-card__hint">Published on college calendar</span>
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
          Department Overview
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'reviews' ? 'tab-btn--active' : ''}`}
          onClick={() => handleTabChange('reviews')}
        >
          Event Review Queue ({pendingReviews.length})
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
          className={`tab-btn ${activeTab === 'clubs' ? 'tab-btn--active' : ''}`}
          onClick={() => handleTabChange('clubs')}
        >
          Department Clubs ({deptClubs.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'activities' ? 'tab-btn--active' : ''}`}
          onClick={() => handleTabChange('activities')}
        >
          Department Activities
        </button>
      </div>

      {loading ? (
        <div className="dashboard-loading">
          <Spinner size="lg" />
          <p>Loading department records...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div className="overview-layout">
              {/* Event Workflow Information Box */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Approval Stage: Stage 2 (HOD Review)</CardTitle>
                  <CardDescription>Hierarchical event authorization protocol</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="workflow-steps">
                    <div className="workflow-step workflow-step--completed">
                      <span className="workflow-step__num">1</span>
                      <div className="workflow-step__content">
                        <strong>Club Proposal</strong>
                        <span>Submitted by Student Coordinator / Faculty</span>
                      </div>
                    </div>

                    <div className="workflow-step workflow-step--completed">
                      <span className="workflow-step__num">2</span>
                      <div className="workflow-step__content">
                        <strong>Faculty Incharge Verification</strong>
                        <span>Academic & safety review</span>
                      </div>
                    </div>

                    <div className="workflow-step workflow-step--active">
                      <span className="workflow-step__num">3</span>
                      <div className="workflow-step__content">
                        <strong>HOD Approval (Current Stage)</strong>
                        <span>Department sanction & calendar slotting</span>
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

              {/* Pending Reviews Table */}
              <Card>
                <CardHeader
                  action={
                    <Button variant="ghost" size="sm" onClick={() => handleTabChange('reviews')}>
                      View Queue
                    </Button>
                  }
                >
                  <CardTitle>Events Requiring Your Decision</CardTitle>
                  <CardDescription>Verified by Faculty Incharge and awaiting HOD approval</CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingReviews.length === 0 ? (
                    <EmptyState
                      title="Review queue is clear"
                      description="No events are currently awaiting HOD department approval."
                      size="sm"
                    />
                  ) : (
                    <Table
                      columns={[
                        { key: 'title', header: 'Event Title' },
                        { key: 'clubName', header: 'Organizing Club' },
                        { key: 'approvedByFaculty', header: 'Faculty Verified By' },
                        {
                          key: 'actions',
                          header: 'Action',
                          align: 'right',
                          render: (_, row) => (
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => {
                                  setSelectedEvent(row);
                                  setReviewModalMode('approve');
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedEvent(row);
                                  setReviewModalMode('reject');
                                }}
                              >
                                Reject
                              </Button>
                            </div>
                          ),
                        },
                      ]}
                      data={pendingReviews}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'reviews' && (
            <Card>
              <CardHeader>
                <CardTitle>Event Review & Approval Queue</CardTitle>
                <CardDescription>
                  Review event safety, logistics, dates, and budget before publishing to the campus.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingReviews.length === 0 ? (
                  <EmptyState
                    title="All caught up!"
                    description="There are no pending events requiring HOD review at this time."
                  />
                ) : (
                  <div className="event-reviews-list">
                    {pendingReviews.map((event) => (
                      <Card key={event.id} bordered className="review-item-card">
                        <div className="review-item-card__body">
                          <div className="review-item-card__header">
                            <div>
                              <Badge variant="warning" size="sm" dot>
                                Pending HOD Review
                              </Badge>
                              <h3 className="review-item-card__title">{event.title}</h3>
                              <span className="review-item-card__club">
                                {event.clubName} • Department of {event.department}
                              </span>
                            </div>
                          </div>

                          <p className="review-item-card__desc">{event.description}</p>
                          {event.objective && <p className="text-sm text-muted"><strong>Objective:</strong> {event.objective}</p>}
                          {event.additionalDetails && <p className="text-sm text-muted"><strong>Additional details:</strong> {event.additionalDetails}</p>}
                          <SupportingDocumentActions event={event} />

                          <div className="review-item-card__details">
                            <div className="detail-pill">
                              <MapPin size={14} />
                              <span>{event.venue}</span>
                            </div>
                            <div className="detail-pill">
                              <Calendar size={14} />
                              <span>{new Date(event.startDate).toLocaleString()}</span>
                            </div>
                            <div className="detail-pill">
                              <Users size={14} />
                              <span>Max {event.maxParticipants} Attendees</span>
                            </div>
                            <div className="detail-pill detail-pill--highlight">
                              <CheckCircle2 size={14} />
                              <span>Approved by: {event.approvedByFaculty}</span>
                            </div>
                          </div>
                        </div>

                        <div className="review-item-card__actions">
                          <Button
                            variant="success"
                            icon={CheckCircle2}
                            onClick={() => {
                              setSelectedEvent(event);
                              setReviewModalMode('approve');
                            }}
                          >
                            Approve & Sanction
                          </Button>
                          <Button
                            variant="danger"
                            icon={XCircle}
                            onClick={() => {
                              setSelectedEvent(event);
                              setReviewModalMode('reject');
                            }}
                          >
                            Reject & Return
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
            />
          )}

          {activeTab === 'clubs' && (
            <Card>
              <CardHeader>
                <CardTitle>Department Affiliated Clubs</CardTitle>
                <CardDescription>
                  Clubs operating under {userDepartment} guidance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="clubs-grid">
                  {deptClubs.map((club) => (
                    <Card key={club.id} bordered className="club-card">
                      <div className="club-card__header">
                        <img src={club.logoUrl} alt={club.name} className="club-card__logo" />
                        <div>
                          <h4 className="club-card__name">{club.name}</h4>
                          <span className="club-card__dept">{club.category}</span>
                        </div>
                      </div>
                      <p className="club-card__desc">{club.description}</p>
                      <div className="club-card__meta">
                        <div className="club-card__meta-item">
                          <span className="text-muted text-xs">Faculty Incharge:</span>
                          <span className="font-semibold text-sm">{club.facultyInchargeName}</span>
                        </div>
                        <div className="club-card__meta-item">
                          <span className="text-muted text-xs">Registered Members:</span>
                          <span className="font-semibold text-sm">{club.memberCount}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'activities' && (
            <Card>
              <CardHeader>
                <CardTitle>Department Activity Calendar</CardTitle>
                <CardDescription>All sanctioned and past events for {userDepartment}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table
                  columns={[
                    { key: 'title', header: 'Event Title' },
                    { key: 'clubName', header: 'Club' },
                    { key: 'venue', header: 'Venue' },
                    {
                      key: 'startDate',
                      header: 'Date',
                      render: (val) => new Date(val).toLocaleDateString(),
                    },
                    {
                      key: 'status',
                      header: 'Status',
                      render: (val) => (
                        <Badge variant={EVENT_STATUS_VARIANTS[val] || 'neutral'} size="sm" dot>
                          {EVENT_STATUS_LABELS[val] || val}
                        </Badge>
                      ),
                    },
                  ]}
                  data={deptEvents}
                />
              </CardContent>
            </Card>
          )}

          {/* TAB: CERTIFICATES */}
          {activeTab === 'certificates' && (
            <div className="tab-pane">
              <PortalSection
                title="HOD Certificate Sanctioning Desk"
                description="Stage 2 departmental review of 3-student merit certificate batches."
              />

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Certificates Pending HOD Approval</CardTitle>
                  <CardDescription>Faculty-approved certificates awaiting HOD signature for {userDepartment}.</CardDescription>
                </CardHeader>
                <CardContent>
                  {certificates.filter((c) => c.status === 'PENDING_HOD_APPROVAL').length === 0 ? (
                    <EmptyState
                      icon={Award}
                      title="No Certificates Pending HOD Approval"
                      description="All faculty-signed certificate requests for your department have been processed."
                    />
                  ) : (
                    <Table
                      columns={[
                        { key: 'studentName', header: 'Student Name' },
                        { key: 'position', header: 'Position', render: (val) => <Badge variant={val.includes('1st') ? 'warning' : val.includes('2nd') ? 'info' : 'purple'}>{val}</Badge> },
                        { key: 'eventName', header: 'Event' },
                        { key: 'clubName', header: 'Club' },
                        { key: 'facultyApproval', header: 'Faculty Signature', render: (val) => val?.approvedBy ? `Signed by ${val.approvedBy}` : 'Approved' },
                        {
                          key: 'status',
                          header: 'Workflow Stage',
                          render: () => <Badge variant="purple" dot>Pending HOD Signature</Badge>,
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
                              <Award size={14} /> Review & Sign
                            </Button>
                          ),
                        },
                      ]}
                      data={certificates.filter((c) => c.status === 'PENDING_HOD_APPROVAL')}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Department Certificate History */}
              <Card>
                <CardHeader>
                  <CardTitle>Department Certificates History</CardTitle>
                  <CardDescription>All merit certificates issued for department clubs and events.</CardDescription>
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

          {['reports', 'documents', 'analytics'].includes(activeTab) && (
            <>
              <PortalSection
                section={activeTab}
                metrics={
                  activeTab === 'documents'
                    ? []
                    : [
                        { label: 'Department Clubs', value: deptClubs.length, hint: userDepartment },
                        { label: 'Approved Events', value: approvedCount, hint: 'Published activities' },
                        { label: 'Pending Reviews', value: pendingReviews.length, hint: 'Awaiting HOD action' },
                      ]
                }
              />
              {activeTab === 'reports' && (
                <Card>
                  <CardHeader><CardTitle>Department Attendance</CardTitle><CardDescription>QR-confirmed student attendance for department events.</CardDescription></CardHeader>
                  <CardContent>
                    <Table
                      columns={[
                        { key: 'studentName', header: 'Student' },
                        { key: 'rollNumber', header: 'Roll Number' },
                        { key: 'department', header: 'Department' },
                        { key: 'eventTitle', header: 'Event' },
                        { key: 'clubName', header: 'Club' },
                        { key: 'markedAt', header: 'Marked On', render: (value) => new Date(value).toLocaleString() },
                        { key: 'status', header: 'Status', render: () => <Badge variant="success" size="sm" dot>Present</Badge> },
                      ]}
                      data={attendanceRecords.filter((record) => deptEvents.some((event) => event.id === record.eventId)).map((record) => {
                        const student = deptStudents.find((candidate) => candidate.id === record.studentId);
                        const event = deptEvents.find((candidate) => candidate.id === record.eventId);
                        return { ...record, studentName: record.studentName || student?.name || 'Student', rollNumber: record.rollNumber || student?.rollNumber || '—', department: record.department || student?.department || student?.branch || '—', eventTitle: record.eventTitle || event?.title || 'Event', clubName: record.clubName || event?.clubName || 'Club' };
                      })}
                      emptyState={<EmptyState title="No attendance recorded" description="Student QR check-ins will appear here." size="sm" />}
                    />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}

      {/* Modal: Approve Confirmation */}
      <Modal
        isOpen={reviewModalMode === 'approve'}
        onClose={() => setReviewModalMode('')}
        title="Sanction & Approve Event"
        description={`Are you sure you want to approve "${selectedEvent?.title}" for college-wide publication?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setReviewModalMode('')}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleApproveEvent} isLoading={actionLoading}>
              Confirm Approval
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Once approved by HOD, this event will be published on the college student calendar and open for participant registration.
        </p>
      </Modal>

      {/* Modal: Reject / Return Event */}
      <Modal
        isOpen={reviewModalMode === 'reject'}
        onClose={() => setReviewModalMode('')}
        title="Return Event Proposal for Revision"
        description={`Return "${selectedEvent?.title}" to Faculty Incharge and Student Coordinator for amendments.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setReviewModalMode('')}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleRejectEvent} isLoading={actionLoading}>
              Return Proposal
            </Button>
          </>
        }
      >
        <form onSubmit={handleRejectEvent} className="modal-form">
          <Input
            label="Feedback & Rejection Reason"
            placeholder="e.g. Please revise budget and ensure safety clearance for outdoor venue"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
          />
        </form>
      </Modal>

      {/* Certificate Viewer / Approver Modal */}
      {reviewingCert && (
        <CertificateView
          certificate={reviewingCert}
          onClose={() => setReviewingCert(null)}
          canApprove={reviewingCert.status === 'PENDING_HOD_APPROVAL'}
          currentUserRole="Head of Department"
          onApprove={async (cert) => {
            await certificateService.approveCertificate(cert.id, user);
            setReviewingCert(null);
            loadData();
            setFeedbackMsg({ type: 'success', text: `Certificate for ${cert.studentName} approved and forwarded to DSW!` });
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
        description={`Return certificate for "${rejectingCert?.studentName}" (${rejectingCert?.position}) to Faculty & Coordinator.`}
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
            label="HOD Return / Revision Reason"
            placeholder="e.g. Please verify event date matches approved proposal schedule..."
            value={certRejectReason}
            onChange={(e) => setCertRejectReason(e.target.value)}
            required
          />
        </div>
      </Modal>
    </div>
  );
};
