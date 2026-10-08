import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { openEventNotice, downloadEventNotice } from '../../services/eventNoticeService';
import {
  GraduationCap,
  Layers,
  Calendar,
  BookOpen,
  Sparkles,
  QrCode,
  CheckCircle2,
  MapPin,
  Clock,
  UserCheck,
  Award,
  ArrowRight,
  PlusCircle,
  ExternalLink,
  User,
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
import { Spinner } from '../../components/common/Loading';
import { EmptyState } from '../../components/common/EmptyState';
import { PortalSection } from '../../components/common/PortalSection';
import { certificateService, CERTIFICATE_STATUS } from '../../services/certificateService';
import { CertificateView } from '../../components/common/CertificateView';
import { CertificateGeneratorModal } from '../../components/common/CertificateGeneratorModal';
import { StudentProfileView } from '../../components/student/StudentProfileView';
import './StudentDashboard.css';

export const StudentDashboard = () => {
  const { user, isCoordinator } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const validTabs = ['overview', 'clubs', 'events', 'registrations', 'attendance', 'documents', 'coordinator', 'certificates', 'profile'];

  const [loading, setLoading] = useState(true);
  const [allClubs, setAllClubs] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [joinedClubIds, setJoinedClubIds] = useState(user?.joinedClubs || user?.clubIds || []);
  const [registeredEventIds, setRegisteredEventIds] = useState(user?.registeredEventIds || []);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceEventId, setAttendanceEventId] = useState('');
  const [proposalForm, setProposalForm] = useState({ title: '', description: '', objective: '', proposedDate: '', startTime: '', endTime: '', venue: '', maxParticipants: '', additionalDetails: '', supportingDocument: null });

  // Certificate States
  const [studentCertificates, setStudentCertificates] = useState([]);
  const [submittedCertificates, setSubmittedCertificates] = useState([]);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [viewingCert, setViewingCert] = useState(null);

  // Modal states
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [clubs, events, users, attendance, certs] = await Promise.all([
        clubService.getClubs(),
        eventService.getEvents(),
        userService.getAllUsers(),
        eventService.getAttendance(user?.id),
        certificateService.getCertificates(),
      ]);
      setAllClubs(clubs);
      setAllEvents(events);
      setAttendanceRecords(attendance);
      setStudentCertificates(
        certs.filter(
          (c) =>
            c.studentId === user?.id ||
            (c.studentEmail && c.studentEmail.toLowerCase() === user?.email?.toLowerCase())
        )
      );
      setSubmittedCertificates(
        certs.filter((c) => c.submittedBy?.id === user?.id || c.submittedBy?.email === user?.email)
      );

      const latestUser = users.find((candidate) => candidate.id === user?.id);
      if (latestUser) {
        setJoinedClubIds(latestUser.joinedClubs || latestUser.clubIds || []);
        setRegisteredEventIds(latestUser.registeredEventIds || []);
      }
    } catch (err) {
      console.error('Failed to load student portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  useEffect(() => {
    if (!validTabs.includes(activeTab)) setSearchParams({ tab: 'overview' }, { replace: true });
  }, [activeTab, setSearchParams]);

  const handleTabChange = (tabKey) => {
    setSearchParams({ tab: tabKey });
    setFeedbackMsg({ type: '', text: '' });
  };

  const handleJoinClub = async (clubId, clubName) => {
    try {
      await clubService.joinClub(user.id, clubId);
      setJoinedClubIds((prev) => Array.from(new Set([...prev, clubId])));
      setFeedbackMsg({ type: 'success', text: `You have successfully joined ${clubName}!` });
      loadData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Could not join club at this time.' });
    }
  };

  const handleRegisterEvent = async (eventId, eventTitle) => {
    try {
      await eventService.registerForEvent(eventId, user.id);
      setRegisteredEventIds((prev) => Array.from(new Set([...prev, eventId])));
      setFeedbackMsg({ type: 'success', text: `Registration confirmed for "${eventTitle}". See you there!` });
      loadData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Could not register for this event.' });
    }
  };

  const handleSubmitProposal = async () => {
    const coordinatorClubIds = user?.coordinatorOfClubs || [];
    const club = allClubs.find((candidate) => coordinatorClubIds.includes(candidate.id));
    try {
      await eventService.createEventProposal({ ...proposalForm, club, submittedBy: `${user.name} (Coordinator)`, submittedById: user.id });
      setProposalForm({ title: '', description: '', objective: '', proposedDate: '', startTime: '', endTime: '', venue: '', maxParticipants: '', additionalDetails: '', supportingDocument: null });
      setProposalModalOpen(false);
      setFeedbackMsg({ type: 'success', text: 'Event proposal submitted to Faculty Incharge for review!' });
      loadData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Could not submit the proposal.' });
    }
  };

  const handleMarkAttendance = async () => {
    try {
      await eventService.markAttendance(attendanceEventId, user.id);
      setAttendanceEventId('');
      setQrModalOpen(false);
      setFeedbackMsg({ type: 'success', text: 'Attendance recorded successfully.' });
      loadData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Could not record attendance.' });
    }
  };

  const myClubs = allClubs.filter((c) => joinedClubIds.includes(c.id));
  const publishedEvents = allEvents.filter((e) => e.status === EVENT_STATUS.APPROVED && joinedClubIds.includes(e.clubId));
  const coordinatorProposals = allEvents.filter((event) => event.submittedById === user?.id);
  const handleDocumentChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['application/pdf', 'image/png', 'image/jpeg'].includes(file.type) || file.size > 2 * 1024 * 1024) { setFeedbackMsg({ type: 'error', text: 'Upload a PDF, PNG, or JPG file smaller than 2 MB.' }); event.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => setProposalForm((form) => ({ ...form, supportingDocument: { name: file.name, type: file.type, size: file.size, dataUrl: reader.result } }));
    reader.readAsDataURL(file);
  };
  const attendanceRate = registeredEventIds.length ? Math.round((attendanceRecords.length / registeredEventIds.length) * 100) : 0;
  const selectedAttendanceEvent = allEvents.find((event) => event.id === attendanceEventId);
  const attendanceQrValue = selectedAttendanceEvent ? JSON.stringify({
    type: 'CCMS_ATTENDANCE', eventId: selectedAttendanceEvent.id, eventName: selectedAttendanceEvent.title,
    studentId: user?.id, issuedAt: new Date().toISOString(), token: `ccms-${selectedAttendanceEvent.id}-${user?.id}`,
  }) : '';

  return (
    <div className="dashboard-container">
      {/* Student Profile Hero */}
      <div className="dashboard-hero student-hero">
        <div className="student-hero__left">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'Student')}`}
            alt={user?.name}
            className="student-hero__avatar"
          />
          <div>
            <div className="student-hero__badges">
              <Badge variant="primary" size="md">
                Student Member
              </Badge>
              {isCoordinator && (
                <Badge variant="warning" size="md" dot>
                  Appointed Club Coordinator
                </Badge>
              )}
            </div>
            <h1 className="dashboard-hero__title">{user?.name}</h1>
            <p className="student-hero__details">
              <span>{user?.email}</span> •{' '}
              <span>{user?.branch || 'Computer Science'}</span> •{' '}
              <span>{user?.year || '1st Year'} ({user?.semester || 'Semester 1'})</span>
            </p>
          </div>
        </div>

        <div className="dashboard-hero__actions">
          <Button
            variant="outline"
            icon={User}
            onClick={() => handleTabChange('profile')}
          >
            My Profile
          </Button>
          <Button
            variant="outline"
            icon={QrCode}
            onClick={() => setQrModalOpen(true)}
          >
            Scan Attendance QR
          </Button>
          {isCoordinator && (
            <Button
              variant="primary"
              icon={Sparkles}
              onClick={() => handleTabChange('coordinator')}
            >
              Coordinator Desk
            </Button>
          )}
        </div>
      </div>

      {feedbackMsg.text && (
        <div className={`dashboard-alert dashboard-alert--${feedbackMsg.type}`}>
          <CheckCircle2 size={18} />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="metrics-grid">
        <Card className="metric-card" hoverable onClick={() => handleTabChange('clubs')}>
          <div className="metric-card__header">
            <span className="metric-card__label">My Joined Clubs</span>
            <div className="metric-card__icon metric-card__icon--blue">
              <Layers size={20} />
            </div>
          </div>
          <span className="metric-card__value">{myClubs.length}</span>
          <span className="metric-card__hint">Active club memberships</span>
        </Card>

        <Card className="metric-card" hoverable onClick={() => handleTabChange('events')}>
          <div className="metric-card__header">
            <span className="metric-card__label">Registered Events</span>
            <div className="metric-card__icon metric-card__icon--green">
              <Calendar size={20} />
            </div>
          </div>
          <span className="metric-card__value">{registeredEventIds.length}</span>
          <span className="metric-card__hint">Upcoming campus activities</span>
        </Card>

        <Card className="metric-card" hoverable onClick={() => handleTabChange('attendance')}>
          <div className="metric-card__header">
            <span className="metric-card__label">Attendance Rate</span>
            <div className="metric-card__icon metric-card__icon--purple">
              <BookOpen size={20} />
            </div>
          </div>
          <span className="metric-card__value">{attendanceRate}%</span>
          <span className="metric-card__hint">{attendanceRecords.length} of {registeredEventIds.length} registered events verified</span>
        </Card>

        <Card className="metric-card" hoverable onClick={() => handleTabChange('clubs')}>
          <div className="metric-card__header">
            <span className="metric-card__label">Available Clubs</span>
            <div className="metric-card__icon metric-card__icon--amber">
              <Award size={20} />
            </div>
          </div>
          <span className="metric-card__value">{allClubs.length}</span>
          <span className="metric-card__hint">College-wide societies</span>
        </Card>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'overview' ? 'tab-btn--active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          My Dashboard
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'clubs' ? 'tab-btn--active' : ''}`}
          onClick={() => handleTabChange('clubs')}
        >
          Explore Clubs ({allClubs.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'events' ? 'tab-btn--active' : ''}`}
          onClick={() => handleTabChange('events')}
        >
          Campus Events ({publishedEvents.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'attendance' ? 'tab-btn--active' : ''}`}
          onClick={() => handleTabChange('attendance')}
        >
          Attendance Record
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'profile' ? 'tab-btn--active' : ''}`}
          onClick={() => handleTabChange('profile')}
        >
          My Profile
        </button>
        {isCoordinator && (
          <button
            type="button"
            className={`tab-btn tab-btn--coordinator ${activeTab === 'coordinator' ? 'tab-btn--active' : ''}`}
            onClick={() => handleTabChange('coordinator')}
          >
            Coordinator Desk ✨
          </button>
        )}
      </div>

      {loading ? (
        <div className="dashboard-loading">
          <Spinner size="lg" />
          <p>Loading student portal...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div className="overview-layout">
              {/* Coordinator notice banner if student is a coordinator */}
              {isCoordinator && (
                <div className="coordinator-hero-card">
                  <div className="coordinator-hero-card__icon">
                    <Sparkles size={28} />
                  </div>
                  <div className="coordinator-hero-card__text">
                    <h3>Appointed Club Coordinator Authority Active</h3>
                    <p>
                      You have been appointed by your Faculty Incharge to draft event proposals and coordinate student engagement for your club.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleTabChange('coordinator')}
                  >
                    Open Coordinator Desk
                  </Button>
                </div>
              )}

              {/* My Clubs section */}
              <Card>
                <CardHeader
                  action={
                    <Button variant="ghost" size="sm" onClick={() => handleTabChange('clubs')}>
                      Explore More Clubs
                    </Button>
                  }
                >
                  <CardTitle>My Clubs & Societies</CardTitle>
                  <CardDescription>Clubs where you are an active member</CardDescription>
                </CardHeader>
                <CardContent>
                  {myClubs.length === 0 ? (
                    <EmptyState
                      title="No clubs joined yet"
                      description="Explore the college directory and join your favorite technical or cultural clubs."
                      action={
                        <Button variant="primary" onClick={() => handleTabChange('clubs')}>
                          Browse Clubs Directory
                        </Button>
                      }
                    />
                  ) : (
                    <div className="clubs-grid">
                      {myClubs.map((club) => (
                        <Card key={club.id} bordered className="club-card">
                          <div className="club-card__header">
                            <img src={club.logoUrl} alt={club.name} className="club-card__logo" />
                            <div>
                              <h4 className="club-card__name">{club.name}</h4>
                              <span className="club-card__dept">{club.department}</span>
                            </div>
                          </div>
                          <p className="club-card__desc">{club.description}</p>
                          <div className="club-card__meta">
                            <Badge variant="success" size="sm" dot>
                              Active Member
                            </Badge>
                            <span className="text-xs text-muted">{club.memberCount} members</span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Events Preview */}
              <Card>
                <CardHeader
                  action={
                    <Button variant="ghost" size="sm" onClick={() => handleTabChange('events')}>
                      View All Events
                    </Button>
                  }
                >
                  <CardTitle>Featured Campus Events</CardTitle>
                  <CardDescription>Published and approved by HOD & Faculty</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table
                    columns={[
                      { key: 'title', header: 'Event Title' },
                      { key: 'clubName', header: 'Host Club' },
                      { key: 'venue', header: 'Venue' },
                      {
                        key: 'startDate',
                        header: 'Date',
                        render: (val) => new Date(val).toLocaleDateString(),
                      },
                      {
                        key: 'id',
                        header: 'Action',
                        align: 'right',
                        render: (id, row) =>
                          registeredEventIds.includes(id) ? (
                            <Badge variant="success" size="sm" dot>
                              Registered
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRegisterEvent(id, row.title)}
                            >
                              Register
                            </Button>
                          ),
                      },
                    ]}
                    data={publishedEvents.slice(0, 3)}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'clubs' && (
            <Card>
              <CardHeader>
                <CardTitle>College Club Directory</CardTitle>
                <CardDescription>
                  Discover and join technical, cultural, sports, and social student organizations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="clubs-grid">
                  {allClubs.map((club) => {
                    const isJoined = joinedClubIds.includes(club.id);
                    return (
                      <Card key={club.id} bordered className="club-card">
                        <div className="club-card__header">
                          <img src={club.logoUrl} alt={club.name} className="club-card__logo" />
                          <div>
                            <h4 className="club-card__name">{club.name}</h4>
                            <span className="club-card__dept">{club.department}</span>
                          </div>
                        </div>
                        <p className="club-card__desc">{club.description}</p>
                        <div className="club-card__meta">
                          <div className="club-card__meta-item">
                            <span className="text-muted text-xs">Faculty Incharge:</span>
                            <span className="font-semibold text-sm">{club.facultyInchargeName}</span>
                          </div>
                          <div className="club-card__meta-item">
                            <span className="text-muted text-xs">Members:</span>
                            <span className="font-semibold text-sm">{club.memberCount}</span>
                          </div>
                        </div>
                        <div className="club-card__footer">
                          {isJoined ? (
                            <Badge variant="success" size="md" dot>
                              Joined Member
                            </Badge>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              fullWidth
                              onClick={() => handleJoinClub(club.id, club.name)}
                            >
                              Join Club
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'events' && (
            <Card>
              <CardHeader>
                <CardTitle>Campus Events & Workshops</CardTitle>
                <CardDescription>
                  Sanctioned college events. Register and earn verified attendance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {publishedEvents.length === 0 ? (
                  <EmptyState
                    title="No upcoming events"
                    description="Check back soon for new club hackathons and workshops."
                  />
                ) : (
                  <div className="event-reviews-list">
                    {publishedEvents.map((event) => {
                      const isRegistered = registeredEventIds.includes(event.id);
                      return (
                        <Card key={event.id} bordered className="review-item-card">
                          <div className="review-item-card__body">
                            <div className="review-item-card__header">
                              <div>
                                <Badge variant="success" size="sm" dot>
                                  Officially Declared
                                </Badge>
                                <h3 className="review-item-card__title">{event.title}</h3>
                                <span className="review-item-card__club">
                                  {event.clubName} • Department of {event.department}
                                </span>
                              </div>
                            </div>

                            <p className="review-item-card__desc">{event.description}</p>

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
                                <Clock size={14} />
                                <span>
                                  Reg Deadline: {new Date(event.registrationDeadline).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="review-item-card__actions">
                            <Button variant="ghost" size="sm" onClick={() => openEventNotice(event)}>View Event PDF</Button>
                            <Button variant="outline" size="sm" onClick={() => downloadEventNotice(event)}>Download PDF</Button>
                            {isRegistered ? (
                              <Badge variant="success" size="lg" dot>
                                Registered Participant
                              </Badge>
                            ) : (
                              <Button
                                variant="primary"
                                onClick={() => handleRegisterEvent(event.id, event.title)}
                              >
                                Register for Event
                              </Button>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'attendance' && (
            <Card>
              <CardHeader
                action={
                  <Button variant="outline" size="sm" icon={QrCode} onClick={() => setQrModalOpen(true)}>
                    Scan QR Code
                  </Button>
                }
              >
                <CardTitle>My Attendance Records</CardTitle>
                <CardDescription>Verified participation in campus club activities</CardDescription>
              </CardHeader>
              <CardContent>
                <Table
                  columns={[
                    { key: 'title', header: 'Event' },
                    { key: 'clubName', header: 'Club' },
                    {
                      key: 'markedAt',
                      header: 'Date Attended',
                      render: (val) => new Date(val).toLocaleDateString(),
                    },
                    {
                      key: 'id',
                      header: 'Verification',
                      render: () => (
                        <Badge variant="success" size="sm" dot>
                          QR Verified
                        </Badge>
                      ),
                    },
                  ]}
                  data={attendanceRecords.map((record) => ({ ...allEvents.find((event) => event.id === record.eventId), markedAt: record.markedAt }))}
                  emptyState={
                    <EmptyState
                      title="No attendance records yet"
                      description="Scan QR codes at events you attend to record your presence."
                      size="sm"
                    />
                  }
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'registrations' && (
            <PortalSection
              section="reports"
              metrics={[
                { label: 'Registered Events', value: registeredEventIds.length, hint: 'Upcoming activities' },
                { label: 'Verified Attendance', value: attendanceRecords.length, hint: 'Completed check-ins' },
              ]}
            >
              <Table
                columns={[
                  { key: 'title', header: 'Event' },
                  { key: 'clubName', header: 'Club' },
                  { key: 'venue', header: 'Venue' },
                  { key: 'notice', header: 'Event Notice', render: (_, event) => <div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => openEventNotice(event)}>View PDF</Button><Button variant="outline" size="sm" onClick={() => downloadEventNotice(event)}>Download PDF</Button></div> },
                ]}
                data={publishedEvents.filter((event) => registeredEventIds.includes(event.id))}
                emptyState={<EmptyState title="No event registrations" description="Register for an approved event to see it here." size="sm" />}
              />
            </PortalSection>
          )}

          {activeTab === 'documents' && <PortalSection section="documents" />}

          {activeTab === 'coordinator' && isCoordinator && (
            <div className="overview-layout">
              <Card>
                <CardHeader
                  action={
                    <Button
                      variant="primary"
                      size="sm"
                      icon={PlusCircle}
                      onClick={() => setProposalModalOpen(true)}
                    >
                      Draft New Event Proposal
                    </Button>
                  }
                >
                  <CardTitle>Coordinator Desk: Club Operations</CardTitle>
                  <CardDescription>
                    As an appointed Student Club Coordinator, you draft event proposals and submit them for Faculty Incharge review.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rules-notice-grid">
                    <div className="rule-item rule-item--allowed">
                      <Sparkles size={20} className="rule-item__icon" />
                      <div>
                        <strong>Draft Event Proposals</strong>
                        <p>Submit proposed dates, descriptions, venues, and participant limits.</p>
                      </div>
                    </div>

                    <div className="rule-item rule-item--allowed">
                      <UserCheck size={20} className="rule-item__icon" />
                      <div>
                        <strong>Faculty Incharge Review</strong>
                        <p>Your proposals go directly to your Faculty Incharge for Stage 1 sign-off.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Proposals Table */}
              <Card>
                <CardHeader>
                  <CardTitle>My Submitted Club Proposals</CardTitle>
                  <CardDescription>Track status through Faculty Incharge and HOD stages</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table
                    columns={[
                      { key: 'title', header: 'Event Title' },
                      { key: 'clubName', header: 'Club' },
                      {
                        key: 'status',
                        header: 'Current Workflow Stage',
                        render: (val) => (
                          <Badge variant={EVENT_STATUS_VARIANTS[val] || 'neutral'} size="sm" dot>
                            {EVENT_STATUS_LABELS[val] || val}
                          </Badge>
                        ),
                      },
                      { key: 'venue', header: 'Venue' },
                      { key: 'submittedAt', header: 'Submitted', render: (value) => value ? new Date(value).toLocaleDateString() : '—' },
                      { key: 'facultyDecision', header: 'Faculty', render: (value, event) => value || (event.status === EVENT_STATUS.PENDING_FACULTY ? 'Pending' : '—') },
                      { key: 'hodDecision', header: 'HOD', render: (value, event) => value || (event.status === EVENT_STATUS.PENDING_HOD ? 'Pending' : '—') },
                      { key: 'rejectionReason', header: 'Rejection Reason', render: (value) => value || '—' },
                    ]}
                    data={coordinatorProposals}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 7: CERTIFICATES */}
          {activeTab === 'certificates' && (
            <div className="tab-pane">
              <PortalSection
                title="Certificates of Merit"
                description="View, verify, print, and download official event certificates."
                action={
                  (isCoordinator || (user?.coordinatorOfClubs && user.coordinatorOfClubs.length > 0)) && (
                    <Button variant="primary" onClick={() => setCertModalOpen(true)}>
                      <Award size={18} /> Generate 3-Student Certificate Batch
                    </Button>
                  )
                }
              />

              {/* Coordinator Submitted Certificates Tracker if Coordinator */}
              {(isCoordinator || (user?.coordinatorOfClubs && user.coordinatorOfClubs.length > 0)) && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Coordinator Desk: Submitted Certificate Batches</CardTitle>
                    <CardDescription>
                      Track 4-tier approval progress (Coordinator → Faculty Incharge → HOD → DSW) for event merit certificates.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {submittedCertificates.length === 0 ? (
                      <EmptyState
                        icon={Award}
                        title="No Certificate Batches Submitted"
                        description="As a Student Coordinator, you can generate 3-student merit certificate batches for your club events."
                        action={
                          <Button variant="primary" onClick={() => setCertModalOpen(true)}>
                            Generate First Certificate Batch
                          </Button>
                        }
                      />
                    ) : (
                      <Table
                        columns={[
                          { key: 'studentName', header: 'Student Name' },
                          { key: 'position', header: 'Position', render: (val) => <Badge variant={val.includes('1st') ? 'warning' : val.includes('2nd') ? 'info' : 'purple'}>{val}</Badge> },
                          { key: 'eventName', header: 'Event' },
                          { key: 'clubName', header: 'Club' },
                          {
                            key: 'status',
                            header: 'Approval Workflow Status',
                            render: (val) => {
                              if (val === 'APPROVED') return <Badge variant="success" dot>Approved & Signed</Badge>;
                              if (val === 'PENDING_FACULTY_APPROVAL') return <Badge variant="warning">Pending Faculty</Badge>;
                              if (val === 'PENDING_HOD_APPROVAL') return <Badge variant="purple">Pending HOD</Badge>;
                              if (val === 'PENDING_DSW_APPROVAL') return <Badge variant="info">Pending DSW</Badge>;
                              if (val === 'REJECTED') return <Badge variant="danger">Returned / Rejected</Badge>;
                              return <Badge variant="neutral">{val}</Badge>;
                            },
                          },
                          {
                            key: 'actions',
                            header: 'Action',
                            render: (_, cert) => (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button variant="outline" size="sm" onClick={() => setViewingCert(cert)}>
                                  View / Signatures
                                </Button>
                                {cert.status === 'REJECTED' && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={async () => {
                                      await certificateService.resubmitCertificate(cert.id);
                                      loadData();
                                      setFeedbackMsg({ type: 'success', text: 'Certificate resubmitted for Faculty approval.' });
                                    }}
                                  >
                                    Resubmit
                                  </Button>
                                )}
                              </div>
                            ),
                          },
                        ]}
                        data={submittedCertificates}
                      />
                    )}
                  </CardContent>
                </Card>
              )}

              {/* My Earned Certificates */}
              <Card>
                <CardHeader>
                  <CardTitle>My Earned Certificates</CardTitle>
                  <CardDescription>Official institutional certificates awarded for event performances</CardDescription>
                </CardHeader>
                <CardContent>
                  {studentCertificates.length === 0 ? (
                    <EmptyState
                      icon={Award}
                      title="No Certificates Awarded Yet"
                      description="Certificates awarded for your event merit positions will appear here once approved by Faculty, HOD, and DSW."
                    />
                  ) : (
                    <Table
                      columns={[
                        { key: 'eventName', header: 'Event Name' },
                        { key: 'clubName', header: 'Organizing Club' },
                        { key: 'position', header: 'Position', render: (val) => <Badge variant={val.includes('1st') ? 'warning' : val.includes('2nd') ? 'info' : 'purple'}>{val}</Badge> },
                        { key: 'eventDate', header: 'Date', render: (val) => val ? new Date(val).toLocaleDateString() : '—' },
                        {
                          key: 'status',
                          header: 'Approval Status',
                          render: (val) => {
                            if (val === 'APPROVED') return <Badge variant="success" dot>Approved (Final)</Badge>;
                            if (val === 'PENDING_FACULTY_APPROVAL') return <Badge variant="warning">Pending Faculty</Badge>;
                            if (val === 'PENDING_HOD_APPROVAL') return <Badge variant="purple">Pending HOD</Badge>;
                            if (val === 'PENDING_DSW_APPROVAL') return <Badge variant="info">Pending DSW</Badge>;
                            return <Badge variant="danger">{val}</Badge>;
                          },
                        },
                        {
                          key: 'actions',
                          header: 'Actions',
                          render: (_, cert) => (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setViewingCert(cert)}
                            >
                              <Award size={14} /> View / Print / PDF
                            </Button>
                          ),
                        },
                      ]}
                      data={studentCertificates}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'profile' && <StudentProfileView />}
        </>
      )}

      {/* Certificate Viewer Modal */}
      {viewingCert && (
        <CertificateView
          certificate={viewingCert}
          onClose={() => setViewingCert(null)}
        />
      )}

      {/* Certificate Generator Modal for Coordinators */}
      {certModalOpen && (
        <CertificateGeneratorModal
          isOpen={certModalOpen}
          onClose={() => setCertModalOpen(false)}
          onSuccess={() => {
            loadData();
            setFeedbackMsg({ type: 'success', text: '3-Student Certificate Batch submitted for Faculty Incharge approval!' });
          }}
        />
      )}

      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="Event Attendance QR Scanner"
        description="Choose a registered event to record your verified attendance."
        footer={
          <>
            <Button variant="outline" onClick={() => setQrModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleMarkAttendance} disabled={!attendanceEventId}>Record Attendance</Button>
          </>
        }
      >
        <div className="attendance-checkin-panel">
          <div className="form-group">
            <label className="form-label" htmlFor="attendance-event">Registered event</label>
            <select id="attendance-event" className="input-control" value={attendanceEventId} onChange={(event) => setAttendanceEventId(event.target.value)}>
              <option value="">Select an event</option>
              {publishedEvents.filter((event) => registeredEventIds.includes(event.id) && !attendanceRecords.some((record) => record.eventId === event.id)).map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
            </select>
          </div>
          {selectedAttendanceEvent ? (
            <div className="attendance-qr-display" aria-label={`Scannable attendance QR for ${selectedAttendanceEvent.title}`}>
              <QRCodeSVG value={attendanceQrValue} size={224} level="H" includeMargin bgColor="#ffffff" fgColor="#0f172a" />
              <strong>{selectedAttendanceEvent.title}</strong>
              <span>Present this unique QR to the event attendance desk.</span>
            </div>
          ) : <div className="attendance-qr-placeholder"><QrCode size={44} /><span>Select a registered event to generate its attendance QR.</span></div>}
        </div>
      </Modal>

      {/* Modal: Draft Event Proposal */}
      <Modal
        isOpen={proposalModalOpen}
        onClose={() => setProposalModalOpen(false)}
        title="Draft Event Proposal"
        description="Submit a new event proposal to your Faculty Incharge for review."
        footer={
          <>
            <Button variant="outline" onClick={() => setProposalModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmitProposal}>
              Submit Proposal
            </Button>
          </>
        }
      >
        <div className="modal-form">
          <p className="text-xs text-muted">Your proposal will enter the Faculty Incharge review queue immediately.</p>
          <div className="form-group">
            <label className="form-label">Proposed Event Title</label>
            <input
              type="text"
              className="input-control"
              placeholder="e.g. AI Prompt Engineering Bootcamp"
              value={proposalForm.title}
              onChange={(event) => setProposalForm((form) => ({ ...form, title: event.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Target Venue</label>
            <input
              type="text"
              className="input-control"
              placeholder="e.g. Computing Lab 4"
              value={proposalForm.venue}
              onChange={(event) => setProposalForm((form) => ({ ...form, venue: event.target.value }))}
            />
          </div>
          <div className="form-group"><label className="form-label">Event Description</label><textarea className="input-control" value={proposalForm.description} onChange={(event) => setProposalForm((form) => ({ ...form, description: event.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Event Objective</label><textarea className="input-control" value={proposalForm.objective} onChange={(event) => setProposalForm((form) => ({ ...form, objective: event.target.value }))} /></div>
          <Input label="Proposed Date" type="date" value={proposalForm.proposedDate} onChange={(event) => setProposalForm((form) => ({ ...form, proposedDate: event.target.value }))} required />
          <Input label="Start Time" type="time" value={proposalForm.startTime} onChange={(event) => setProposalForm((form) => ({ ...form, startTime: event.target.value }))} required />
          <Input label="End Time" type="time" value={proposalForm.endTime} onChange={(event) => setProposalForm((form) => ({ ...form, endTime: event.target.value }))} required />
          <Input label="Expected Participants" type="number" min="1" value={proposalForm.maxParticipants} onChange={(event) => setProposalForm((form) => ({ ...form, maxParticipants: event.target.value }))} required />
          <div className="form-group"><label className="form-label">Additional Instructions / Details</label><textarea className="input-control" value={proposalForm.additionalDetails} onChange={(event) => setProposalForm((form) => ({ ...form, additionalDetails: event.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Supporting Document (PDF, PNG, JPG; max 2 MB)</label><input type="file" accept="application/pdf,image/png,image/jpeg" className="input-control" onChange={handleDocumentChange} />{proposalForm.supportingDocument && <span className="text-xs text-muted">Attached: {proposalForm.supportingDocument.name}</span>}</div>
        </div>
      </Modal>
    </div>
  );
};
