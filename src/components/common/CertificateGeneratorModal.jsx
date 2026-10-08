import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
  Eye,
  X,
  Search,
} from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { Badge } from './Badge';
import { CertificateView } from './CertificateView';
import { certificateService } from '../../services/certificateService';
import { eventService } from '../../services/eventService';
import { clubService } from '../../services/clubService';
import { userService } from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';
import { getFromStorage, STORAGE_KEYS } from '../../services/api';
import './CertificateGeneratorModal.css';

export const CertificateGeneratorModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Form, 2: Preview 3 Certs

  // Master Data
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);

  // Selections
  const [selectedClubId, setSelectedClubId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eventDate, setEventDate] = useState('');

  // 3 Student Entries for 1st, 2nd, 3rd Prize
  const [studentSelections, setStudentSelections] = useState([
    { position: '1st Prize', studentId: '', studentName: '', studentEmail: '' },
    { position: '2nd Prize', studentId: '', studentName: '', studentEmail: '' },
    { position: '3rd Prize', studentId: '', studentName: '', studentEmail: '' },
  ]);

  // Name Search & Error States for 3 positions
  const [searchQueries, setSearchQueries] = useState(['', '', '']);
  const [positionErrors, setPositionErrors] = useState(['', '', '']);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(null);

  // Preview Certificate selection
  const [previewCertIndex, setPreviewCertIndex] = useState(null);

  // Helper to verify if a student registered/participated in the selected event
  const isStudentParticipant = (student, eventId) => {
    if (!student || !eventId) return false;

    // 1. Check student's registeredEventIds array
    if (Array.isArray(student.registeredEventIds) && student.registeredEventIds.includes(eventId)) {
      return true;
    }

    // 2. Check storage for updated user object
    const storedUsers = getFromStorage(STORAGE_KEYS.USERS) || [];
    const freshUser = storedUsers.find(
      (u) => u.id === student.id || (u.email && u.email.toLowerCase() === student.email?.toLowerCase())
    );
    if (freshUser && Array.isArray(freshUser.registeredEventIds) && freshUser.registeredEventIds.includes(eventId)) {
      return true;
    }

    // 3. Check attendance records in storage
    const attendanceRecords = getFromStorage(STORAGE_KEYS.ATTENDANCE) || [];
    const hasAttendance = attendanceRecords.some(
      (record) =>
        record.eventId === eventId &&
        (record.studentId === student.id || (record.studentEmail && record.studentEmail.toLowerCase() === student.email?.toLowerCase()))
    );
    if (hasAttendance) return true;

    return false;
  };

  // Load initial data for Coordinator
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const allClubs = await clubService.getClubs();
        const allEvents = await eventService.getEvents();
        const allUsers = await userService.getAllUsers();

        // Filter clubs where current user is a coordinator or assigned faculty
        const userClubs = allClubs.filter(
          (c) =>
            c.coordinators?.some((coord) => coord.id === user?.id || coord.email === user?.email) ||
            user?.coordinatorOfClubs?.includes(c.id) ||
            user?.role === 'FACULTY_INCHARGE'
        );

        const availableClubsList = userClubs.length > 0 ? userClubs : allClubs;
        setClubs(availableClubsList);

        if (availableClubsList.length > 0) {
          const firstClub = availableClubsList[0];
          setSelectedClubId(firstClub.id);

          // Filter events for this club
          const clubEvents = allEvents.filter((e) => e.clubId === firstClub.id);
          setEvents(clubEvents);

          if (clubEvents.length > 0) {
            setSelectedEventId(clubEvents[0].id);
            setEventDate(clubEvents[0].startDate ? clubEvents[0].startDate.split('T')[0] : '');
          }
        }

        // Students list
        const studentsList = allUsers.filter((u) => u.role === 'STUDENT' && u.status === 'ACTIVE');
        setAvailableStudents(studentsList);
      } catch (err) {
        console.error('Failed to load certificate form data:', err);
        setError('Failed to load events and students.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, user]);

  // When selected club changes, update available events
  const handleClubChange = (clubId) => {
    setSelectedClubId(clubId);
    eventService.getEventsByClub(clubId).then((clubEvents) => {
      setEvents(clubEvents);
      if (clubEvents.length > 0) {
        setSelectedEventId(clubEvents[0].id);
        setEventDate(clubEvents[0].startDate ? clubEvents[0].startDate.split('T')[0] : '');
      } else {
        setSelectedEventId('');
        setEventDate('');
      }
    });
  };

  // When event changes, update date & re-verify selected students
  const handleEventChange = (eventId) => {
    setSelectedEventId(eventId);
    const selectedEvt = events.find((e) => e.id === eventId);
    if (selectedEvt) {
      setEventDate(selectedEvt.startDate ? selectedEvt.startDate.split('T')[0] : '');
    }

    // Clear position errors and re-verify existing selections
    const nextErrors = ['', '', ''];
    studentSelections.forEach((sel, idx) => {
      if (sel.studentId) {
        const student = availableStudents.find((s) => s.id === sel.studentId);
        if (!isStudentParticipant(student, eventId)) {
          nextErrors[idx] = 'This student did not participate in this event.';
        }
      }
    });
    setPositionErrors(nextErrors);
  };

  // Name Search input change handler
  const handleNameSearchChange = (index, text) => {
    const nextQueries = [...searchQueries];
    nextQueries[index] = text;
    setSearchQueries(nextQueries);

    const nextErrors = [...positionErrors];
    nextErrors[index] = '';
    setPositionErrors(nextErrors);

    setActiveDropdownIndex(index);

    if (studentSelections[index].studentName && studentSelections[index].studentName !== text) {
      const updated = [...studentSelections];
      updated[index] = { ...updated[index], studentId: '', studentName: '', studentEmail: '' };
      setStudentSelections(updated);
    }
  };

  // Select student from matching search suggestions
  const handleSelectStudent = (index, student) => {
    setActiveDropdownIndex(null);

    // 1. Check duplicate selection across positions
    const isAlreadySelected = studentSelections.some((sel, idx) => idx !== index && sel.studentId === student.id);
    if (isAlreadySelected) {
      const nextErrors = [...positionErrors];
      nextErrors[index] = 'This student has already been selected for another prize position.';
      setPositionErrors(nextErrors);

      const updated = [...studentSelections];
      updated[index] = { ...updated[index], studentId: '', studentName: '', studentEmail: '' };
      setStudentSelections(updated);
      return;
    }

    // 2. Check event participation
    const participated = isStudentParticipant(student, selectedEventId);
    if (!participated) {
      const nextErrors = [...positionErrors];
      nextErrors[index] = 'This student did not participate in this event.';
      setPositionErrors(nextErrors);

      const updated = [...studentSelections];
      updated[index] = { ...updated[index], studentId: '', studentName: '', studentEmail: '' };
      setStudentSelections(updated);
      return;
    }

    // 3. Valid selection
    const nextErrors = [...positionErrors];
    nextErrors[index] = '';
    setPositionErrors(nextErrors);

    const updated = [...studentSelections];
    updated[index] = {
      ...updated[index],
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
    };
    setStudentSelections(updated);

    const nextQueries = [...searchQueries];
    nextQueries[index] = student.name;
    setSearchQueries(nextQueries);
  };

  // Clear student selection for a position
  const handleClearStudent = (index) => {
    const updated = [...studentSelections];
    updated[index] = { ...updated[index], studentId: '', studentName: '', studentEmail: '' };
    setStudentSelections(updated);

    const nextQueries = [...searchQueries];
    nextQueries[index] = '';
    setSearchQueries(nextQueries);

    const nextErrors = [...positionErrors];
    nextErrors[index] = '';
    setPositionErrors(nextErrors);
  };

  // Helper to filter matching students by NAME only
  const getMatchingStudents = (query) => {
    if (!query || !query.trim()) return [];
    const q = query.toLowerCase().trim();
    return availableStudents.filter((s) => s.name?.toLowerCase().includes(q));
  };

  // Step 1 Validation & Proceed to Step 2 (Review)
  const handleProceedToReview = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedClubId || !selectedEventId || !eventDate) {
      setError('Please select a Club, Event, and Event Date.');
      return;
    }

    // Check all 3 students selected
    const selectedIds = studentSelections.map((s) => s.studentId).filter(Boolean);
    if (selectedIds.length !== 3) {
      setError('Exactly 3 participating students must be selected (1st, 2nd, and 3rd Prize).');
      return;
    }

    // Check unique students
    const uniqueIds = new Set(selectedIds);
    if (uniqueIds.size !== 3) {
      setError('Each position (1st, 2nd, 3rd Prize) must be awarded to a distinct student.');
      return;
    }

    // Verify all 3 participated
    for (let i = 0; i < studentSelections.length; i++) {
      const student = availableStudents.find((s) => s.id === studentSelections[i].studentId);
      if (!isStudentParticipant(student, selectedEventId)) {
        setError(`Student for ${studentSelections[i].position} did not participate in this event.`);
        return;
      }
    }

    setStep(2);
  };

  // Final Batch Submission
  const handleSubmitBatch = async () => {
    setLoading(true);
    setError('');
    try {
      const selectedClub = clubs.find((c) => c.id === selectedClubId);
      const selectedEvt = events.find((e) => e.id === selectedEventId) || {
        id: selectedEventId,
        name: 'College Competition',
        startDate: eventDate,
      };

      await certificateService.createCertificateBatch({
        club: selectedClub,
        event: { ...selectedEvt, startDate: eventDate },
        submittedByUser: user,
        studentEntries: studentSelections,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to submit certificate batch:', err);
      setError(err.message || 'Failed to submit certificates.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentClub = clubs.find((c) => c.id === selectedClubId);
  const currentEvent = events.find((e) => e.id === selectedEventId);

  // If previewing a specific certificate modal
  if (previewCertIndex !== null) {
    const previewItem = studentSelections[previewCertIndex];
    const previewCertificateObj = {
      id: 'preview_id',
      studentName: previewItem.studentName || 'Student Name',
      position: previewItem.position,
      eventName: currentEvent?.title || currentEvent?.name || 'Event Title',
      clubName: currentClub?.name || 'Club Name',
      department: currentClub?.department || 'Computer Science',
      eventDate: eventDate || new Date().toISOString().split('T')[0],
      status: 'PENDING_FACULTY_APPROVAL',
      submittedBy: { name: user?.name || 'Student Coordinator' },
      coordinatorSignature: { name: user?.name || 'Student Coordinator' },
      facultyApproval: null,
      hodApproval: null,
      dswApproval: null,
    };

    return (
      <CertificateView
        certificate={previewCertificateObj}
        onClose={() => setPreviewCertIndex(null)}
        showActions={false}
      />
    );
  }

  return (
    <div className="cert-gen-backdrop" onClick={onClose}>
      <div className="cert-gen-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cert-gen-header">
          <div className="cert-gen-header__title-block">
            <Award className="cert-gen-icon" size={24} />
            <div>
              <h2>Generate Certificate Batch</h2>
              <span className="cert-gen-subtitle">
                Issue 3 Merit Certificates (1st, 2nd, 3rd Prize) for Event
              </span>
            </div>
          </div>
          <button type="button" className="cert-gen-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="cert-gen-steps">
          <div className={`cert-step-pill ${step === 1 ? 'cert-step-pill--active' : ''}`}>
            1. Select Event & Winners
          </div>
          <ArrowRight size={16} className="cert-step-arrow" />
          <div className={`cert-step-pill ${step === 2 ? 'cert-step-pill--active' : ''}`}>
            2. Review & Submit Batch
          </div>
        </div>

        {error && (
          <div className="cert-gen-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Selection Form */}
        {step === 1 && (
          <form onSubmit={handleProceedToReview} className="cert-gen-form">
            <div className="cert-form-row">
              <Select
                label="Select Club"
                value={selectedClubId}
                onChange={(e) => handleClubChange(e.target.value)}
                required
              >
                <option value="">-- Choose Club --</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.department})
                  </option>
                ))}
              </Select>

              <Select
                label="Select Event"
                value={selectedEventId}
                onChange={(e) => handleEventChange(e.target.value)}
                required
              >
                <option value="">-- Choose Event --</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title || e.name}
                  </option>
                ))}
              </Select>

              <Input
                label="Event Date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>

            <div className="cert-winners-section">
              <h4 className="cert-winners-heading">
                <Sparkles size={18} className="text-amber-500" /> Select Exactly 3 Winners (1st, 2nd, 3rd Prize)
              </h4>
              <p className="cert-winners-sub">
                Each position will create an individual certificate record routed for Faculty, HOD & DSW approvals.
              </p>

              <div className="cert-winners-grid">
                {studentSelections.map((item, index) => {
                  const matchingList = getMatchingStudents(searchQueries[index]);
                  return (
                    <div key={item.position} className="cert-winner-card">
                      <div className="cert-winner-card__header">
                        <Badge variant={index === 0 ? 'warning' : index === 1 ? 'info' : 'purple'}>
                          {item.position}
                        </Badge>
                        <span className="cert-position-rank">Rank #{index + 1}</span>
                      </div>

                      <div className="cert-student-search-box">
                        <Input
                          label="Search Student by Name"
                          placeholder="Type student name..."
                          icon={Search}
                          value={searchQueries[index]}
                          onChange={(e) => handleNameSearchChange(index, e.target.value)}
                          onFocus={() => setActiveDropdownIndex(index)}
                        />

                        {positionErrors[index] && (
                          <div className="cert-position-error">
                            <AlertCircle size={14} />
                            <span>{positionErrors[index]}</span>
                          </div>
                        )}

                        {activeDropdownIndex === index && searchQueries[index]?.trim().length > 0 && !item.studentId && (
                          <div className="cert-student-dropdown">
                            {matchingList.length === 0 ? (
                              <div className="cert-student-dropdown-empty">
                                No students found matching "{searchQueries[index]}"
                              </div>
                            ) : (
                              matchingList.map((s) => (
                                <div
                                  key={s.id}
                                  className="cert-student-option"
                                  onClick={() => handleSelectStudent(index, s)}
                                >
                                  <span className="cert-student-opt-name">{s.name}</span>
                                  <span className="cert-student-opt-dept">{s.department || s.branch || 'Student'}</span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      {item.studentName && (
                        <div className="cert-winner-preview-chip">
                          <CheckCircle2 size={14} color="#16a34a" />
                          <span>Winner: <strong>{item.studentName}</strong> (Verified Participant)</span>
                          <button
                            type="button"
                            className="cert-clear-student-btn"
                            onClick={() => handleClearStudent(index)}
                            title="Clear selection"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="cert-form-actions">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                Review 3 Certificates <ArrowRight size={16} />
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Review Batch before Submitting */}
        {step === 2 && (
          <div className="cert-review-container">
            <div className="cert-review-summary-box">
              <h3>Batch Submission Summary</h3>
              <div className="cert-summary-meta">
                <div><strong>Club:</strong> {currentClub?.name}</div>
                <div><strong>Event:</strong> {currentEvent?.title || currentEvent?.name}</div>
                <div><strong>Date:</strong> {eventDate}</div>
              </div>
            </div>

            <div className="cert-cards-list">
              {studentSelections.map((item, index) => (
                <div key={item.position} className="cert-review-item-card">
                  <div className="cert-review-item-left">
                    <Badge variant={index === 0 ? 'warning' : index === 1 ? 'info' : 'purple'}>
                      {item.position}
                    </Badge>
                    <div>
                      <h4 className="cert-student-name">{item.studentName}</h4>
                      <span className="cert-student-email">{item.studentEmail}</span>
                    </div>
                  </div>

                  <div className="cert-review-item-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewCertIndex(index)}
                    >
                      <Eye size={14} /> Preview Certificate
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cert-form-actions">
              <Button type="button" variant="secondary" onClick={() => setStep(1)} disabled={loading}>
                Edit Details
              </Button>
              <Button
                type="button"
                variant="success"
                onClick={handleSubmitBatch}
                disabled={loading}
              >
                {loading ? 'Submitting Batch...' : 'Submit 3 Certificates for Approval'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
