import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarCheck2, CheckCircle2, Clock3, FileWarning, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { eventService } from '../../services/eventService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import './AttendanceMark.css';

const initialForm = { studentName: '', rollNumber: '', department: '' };

export const AttendanceMark = () => {
  const [searchParams] = useSearchParams();
  const { user, isStudent, getHomeRouteForRole } = useAuth();
  const sessionId = searchParams.get('session');
  const [session, setSession] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState({ loading: true, error: '', confirm: false, submitting: false, success: null });

  useEffect(() => {
    let active = true;
    if (!sessionId) {
      setState((current) => ({ ...current, loading: false, error: 'No attendance QR session was supplied.' }));
      return () => { active = false; };
    }
    eventService.getAttendanceSession(sessionId)
      .then((value) => active && setSession(value))
      .catch((error) => active && setState((current) => ({ ...current, error: error.message })))
      .finally(() => active && setState((current) => ({ ...current, loading: false })));
    return () => { active = false; };
  }, [sessionId]);

  useEffect(() => {
    if (!isStudent || !user) return;
    setForm((current) => ({
      studentName: current.studentName || user.name || '',
      rollNumber: current.rollNumber || user.rollNumber || user.rollNo || '',
      department: current.department || user.department || user.branch || '',
    }));
  }, [isStudent, user]);

  const validate = () => {
    if (!form.studentName.trim() || !form.rollNumber.trim() || !form.department.trim()) {
      setState((current) => ({ ...current, error: 'Complete your name, roll number, and department before continuing.' }));
      return false;
    }
    setState((current) => ({ ...current, error: '', confirm: true }));
    return true;
  };

  const submit = async () => {
    setState((current) => ({ ...current, submitting: true, error: '' }));
    try {
      const result = await eventService.markAttendanceFromSession(sessionId, {
        ...form,
        studentId: isStudent ? user?.id : null,
      });
      setState((current) => ({ ...current, confirm: false, success: result.record }));
    } catch (error) {
      setState((current) => ({ ...current, confirm: false, error: error.message }));
    } finally {
      setState((current) => ({ ...current, submitting: false }));
    }
  };

  if (state.loading) return <main className="attendance-page"><Card className="attendance-card attendance-card--center"><Loader2 className="attendance-spin" /><p>Validating attendance QR…</p></Card></main>;
  if (state.error && !session) return <main className="attendance-page"><Card className="attendance-card attendance-card--center"><FileWarning size={38} /><h1>Attendance QR unavailable</h1><p>{state.error}</p><Link to={user ? getHomeRouteForRole() : '/login'}><Button variant="primary">Return to portal</Button></Link></Card></main>;

  return (
    <main className="attendance-page">
      <Card className="attendance-card" padding="lg">
        <div className="attendance-page__heading"><span><CalendarCheck2 size={25} /></span><div><p className="attendance-page__eyebrow">CCMS EVENT CHECK-IN</p><h1>Mark Attendance</h1><p>Confirm your event attendance securely.</p></div></div>
        {state.error && <div className="attendance-page__alert attendance-page__alert--error">{state.error}</div>}
        {state.success ? (
          <section className="attendance-result"><CheckCircle2 size={44} /><h2>Attendance marked successfully</h2><dl><div><dt>Student</dt><dd>{state.success.studentName}</dd></div><div><dt>Event</dt><dd>{state.success.eventTitle}</dd></div><div><dt>Club</dt><dd>{state.success.clubName}</dd></div><div><dt>Date</dt><dd>{new Date(state.success.markedAt).toLocaleString()}</dd></div><div><dt>Status</dt><dd className="attendance-result__present">PRESENT</dd></div></dl></section>
        ) : session && (
          <>
            <section className="attendance-event-summary"><ShieldCheck size={20} /><div><span>Club Name</span><strong>{session.club.name}</strong></div><div><span>Event Name</span><strong>{session.event.title}</strong></div><div className="attendance-event-summary__expiry"><Clock3 size={16} /> Valid until {new Date(session.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></section>
            {!state.confirm ? <form className="attendance-form" onSubmit={(event) => { event.preventDefault(); validate(); }}><label>Student Name<input value={form.studentName} onChange={(event) => setForm({ ...form, studentName: event.target.value })} required /></label><label>Roll Number<input value={form.rollNumber} onChange={(event) => setForm({ ...form, rollNumber: event.target.value })} required /></label><label>Department<input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} required /></label><label>Club Name<input value={session.club.name} readOnly /></label><label>Event Name<input value={session.event.title} readOnly /></label><Button type="submit" variant="primary" fullWidth>Review attendance details</Button></form> : <section className="attendance-confirm"><h2>Confirm attendance</h2><p>Please verify the details below before marking your attendance.</p><dl><div><dt>Student</dt><dd>{form.studentName}</dd></div><div><dt>Roll Number</dt><dd>{form.rollNumber}</dd></div><div><dt>Department</dt><dd>{form.department}</dd></div><div><dt>Club</dt><dd>{session.club.name}</dd></div><div><dt>Event</dt><dd>{session.event.title}</dd></div></dl><div className="attendance-confirm__actions"><Button variant="outline" onClick={() => setState((current) => ({ ...current, confirm: false }))}>Edit details</Button><Button variant="primary" isLoading={state.submitting} onClick={submit}>Confirm & Mark Attendance</Button></div></section>}
          </>
        )}
      </Card>
    </main>
  );
};
