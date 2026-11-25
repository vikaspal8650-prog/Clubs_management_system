import api from './api.js';

export const CERTIFICATE_STATUS = {
  PENDING_FACULTY: 'PENDING_FACULTY_APPROVAL',
  PENDING_HOD: 'PENDING_HOD_APPROVAL',
  PENDING_DSW: 'PENDING_DSW_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

export const CERTIFICATE_POSITIONS = ['1st Prize', '2nd Prize', '3rd Prize'];

export const certificateService = {
  async getCertificates() {
    return api.get('/certificates');
  },

  async getCertificateById(certId) {
    const certs = await this.getCertificates();
    return certs.find((cert) => cert.id === certId) || null;
  },

  async getCertificatesByStudent(studentId, studentEmail) {
    const certs = await this.getCertificates();
    return certs.filter((cert) => cert.studentId === studentId || (studentEmail && cert.studentEmail?.toLowerCase() === studentEmail.toLowerCase()));
  },

  async getCertificatesByFaculty(clubIds = []) {
    const certs = await this.getCertificates();
    return certs.filter((cert) => clubIds.includes(cert.clubId));
  },

  async getCertificatesByHod(departmentName) {
    const certs = await this.getCertificates();
    return certs.filter((cert) => !departmentName || cert.department === departmentName || cert.department === 'Central / Interdisciplinary');
  },

  async createCertificateBatch({ event, club, studentEntries }) {
    if (!studentEntries || studentEntries.length !== 3) throw new Error('Exactly 3 student certificate entries are required for submission.');
    return api.post('/certificates/batches', {
      eventId: event.id,
      clubId: club.id,
      studentEntries: studentEntries.map(({ studentId, position }) => ({ studentId, position })),
    });
  },

  async approveCertificate(certId) {
    return api.request(`/certificates/${encodeURIComponent(certId)}`, { method: 'PATCH', body: JSON.stringify({ action: 'APPROVE' }) });
  },

  async rejectCertificate(certId, _currentUser, reason = 'Returned for revision') {
    return api.request(`/certificates/${encodeURIComponent(certId)}`, { method: 'PATCH', body: JSON.stringify({ action: 'REJECT', reason }) });
  },

  async resubmitCertificate(certId) {
    return api.request(`/certificates/${encodeURIComponent(certId)}`, { method: 'PATCH', body: JSON.stringify({ action: 'RESUBMIT' }) });
  },
};
