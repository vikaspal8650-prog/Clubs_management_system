import api from './api.js';

export const eventService = {
  /**
   * Get all university events from PostgreSQL
   */
  async getEvents() {
    return api.get('/events');
  },

  /**
   * Get events filtered by club
   */
  async getEventsByClub(clubId) {
    return api.get(`/events?clubId=${encodeURIComponent(clubId)}`);
  },

  async getAttendance() {
    return api.get('/events/me/attendance');
  },

  /**
   * Get events pending approval for Faculty Incharge
   */
  async getPendingFacultyEvents(facultyClubIds = []) {
    const events = await api.get('/events?status=PENDING_FACULTY');
    if (facultyClubIds.length > 0) {
      return events.filter((e) => facultyClubIds.includes(e.clubId));
    }
    return events;
  },

  /**
   * Get events pending approval for HOD
   */
  async getPendingHodEvents(departmentName) {
    const events = await api.get('/events?status=PENDING_HOD');
    if (departmentName) {
      return events.filter((e) => e.department === departmentName || (e.club && e.club.department === departmentName));
    }
    return events;
  },

  /**
   * Student registers for an event in PostgreSQL
   */
  async registerForEvent(eventId) {
    return api.post(`/events/${eventId}/register`);
  },

  /**
   * Create an event proposal in PostgreSQL
   */
  async createEventProposal(proposal) {
    const { title, venue, club, description, objective, proposedDate, startTime, endTime, maxParticipants, additionalDetails } = proposal;
    if (!title?.trim() || !description?.trim() || !objective?.trim() || !venue?.trim() || !club || !proposedDate || !startTime || !endTime || !maxParticipants) {
      throw new Error('Complete all required event proposal fields.');
    }

    return api.post('/events', {
      title: title.trim(),
      description: description.trim(),
      objective: objective.trim(),
      additionalDetails: additionalDetails ? additionalDetails.trim() : '',
      date: proposedDate,
      startTime,
      endTime,
      venue: venue.trim(),
      capacity: Number(maxParticipants),
      clubId: club.id,
    });
  },

  /**
   * Faculty approves event in PostgreSQL
   */
  async facultyApproveEvent(eventId) {
    return api.post(`/events/${eventId}/approval`, { action: 'APPROVE' });
  },

  /**
   * Faculty rejects event in PostgreSQL
   */
  async facultyRejectEvent(eventId, reason = 'Returned for revision') {
    return api.post(`/events/${eventId}/approval`, { action: 'REJECT', reason });
  },

  /**
   * HOD approves event in PostgreSQL
   */
  async hodApproveEvent(eventId) {
    return api.post(`/events/${eventId}/approval`, { action: 'APPROVE' });
  },

  /**
   * HOD rejects event in PostgreSQL
   */
  async hodRejectEvent(eventId, reason = 'Returned by HOD') {
    return api.post(`/events/${eventId}/approval`, { action: 'REJECT', reason });
  },

  /**
   * DSW overrides/cancels event in PostgreSQL
   */
  async dswOverrideEvent(eventId, reason = 'Administrative cancellation by DSW') {
    return api.post(`/events/${eventId}/approval`, { action: 'REJECT', reason });
  },

  async markAttendance(eventId) { return api.post(`/events/${eventId}/attendance`); },
};
