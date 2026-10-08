import {
  getFromStorage,
  saveToStorage,
  simulateDelay,
  STORAGE_KEYS,
} from './api';
import { INITIAL_USERS } from '../data/mockUsers';

// Helper key for certificates if not in api.js exported object
const CERTIFICATES_KEY = STORAGE_KEYS.CERTIFICATES || 'ccms_certificates_v1';

export const CERTIFICATE_STATUS = {
  PENDING_FACULTY: 'PENDING_FACULTY_APPROVAL',
  PENDING_HOD: 'PENDING_HOD_APPROVAL',
  PENDING_DSW: 'PENDING_DSW_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

export const CERTIFICATE_POSITIONS = ['1st Prize', '2nd Prize', '3rd Prize'];

// Initial seed certificates for immediate demonstration
const INITIAL_CERTIFICATES = [
  {
    id: 'cert_seed_101',
    batchId: 'batch_seed_1',
    studentId: 'usr_student_vikas',
    studentName: 'Vikas Pal',
    studentEmail: 'student.vikas@college.edu',
    eventId: 'evt_hackathon_2026',
    eventName: 'CodeSprint 2026: 36-Hour National Hackathon',
    clubId: 'club_coding_ai',
    clubName: 'Turing Coding & AI Club',
    department: 'Computer Science',
    position: '1st Prize',
    eventDate: '2026-09-19',
    status: CERTIFICATE_STATUS.APPROVED,
    submittedBy: {
      id: 'usr_student_priya',
      name: 'Priya Verma',
      email: 'student.priya@college.edu',
    },
    submittedAt: '2026-09-20T10:00:00.000Z',
    coordinatorSignature: {
      name: 'Priya Verma',
      title: 'Student Coordinator',
      signedAt: '2026-09-20T10:00:00.000Z',
    },
    facultyApproval: {
      approvedBy: 'Prof. Vivek Sengupta',
      approvedById: 'usr_faculty_coding',
      title: 'Faculty Incharge',
      signedAt: '2026-09-20T14:30:00.000Z',
      status: 'APPROVED',
    },
    hodApproval: {
      approvedBy: 'Dr. Ramesh Sharma',
      approvedById: 'usr_hod_cs',
      title: 'Head of Department',
      signedAt: '2026-09-21T09:15:00.000Z',
      status: 'APPROVED',
    },
    dswApproval: {
      approvedBy: 'Dr. Saurabh Gupta',
      approvedById: 'usr_dsw_1',
      title: 'Dean Student Welfare',
      signedAt: '2026-09-21T16:00:00.000Z',
      status: 'APPROVED',
    },
    rejectionReason: null,
  },
  {
    id: 'cert_seed_102',
    batchId: 'batch_seed_1',
    studentId: 'usr_student_rahul',
    studentName: 'Rahul Sharma',
    studentEmail: 'student.rahul@college.edu',
    eventId: 'evt_hackathon_2026',
    eventName: 'CodeSprint 2026: 36-Hour National Hackathon',
    clubId: 'club_coding_ai',
    clubName: 'Turing Coding & AI Club',
    department: 'Computer Science',
    position: '2nd Prize',
    eventDate: '2026-09-19',
    status: CERTIFICATE_STATUS.PENDING_DSW,
    submittedBy: {
      id: 'usr_student_priya',
      name: 'Priya Verma',
      email: 'student.priya@college.edu',
    },
    submittedAt: '2026-09-20T10:00:00.000Z',
    coordinatorSignature: {
      name: 'Priya Verma',
      title: 'Student Coordinator',
      signedAt: '2026-09-20T10:00:00.000Z',
    },
    facultyApproval: {
      approvedBy: 'Prof. Vivek Sengupta',
      approvedById: 'usr_faculty_coding',
      title: 'Faculty Incharge',
      signedAt: '2026-09-20T14:30:00.000Z',
      status: 'APPROVED',
    },
    hodApproval: {
      approvedBy: 'Dr. Ramesh Sharma',
      approvedById: 'usr_hod_cs',
      title: 'Head of Department',
      signedAt: '2026-09-21T09:15:00.000Z',
      status: 'APPROVED',
    },
    dswApproval: null,
    rejectionReason: null,
  },
  {
    id: 'cert_seed_103',
    batchId: 'batch_seed_1',
    studentId: 'usr_student_ananya',
    studentName: 'Ananya Patel',
    studentEmail: 'student.ananya@college.edu',
    eventId: 'evt_hackathon_2026',
    eventName: 'CodeSprint 2026: 36-Hour National Hackathon',
    clubId: 'club_coding_ai',
    clubName: 'Turing Coding & AI Club',
    department: 'Computer Science',
    position: '3rd Prize',
    eventDate: '2026-09-19',
    status: CERTIFICATE_STATUS.PENDING_HOD,
    submittedBy: {
      id: 'usr_student_priya',
      name: 'Priya Verma',
      email: 'student.priya@college.edu',
    },
    submittedAt: '2026-09-20T10:00:00.000Z',
    coordinatorSignature: {
      name: 'Priya Verma',
      title: 'Student Coordinator',
      signedAt: '2026-09-20T10:00:00.000Z',
    },
    facultyApproval: {
      approvedBy: 'Prof. Vivek Sengupta',
      approvedById: 'usr_faculty_coding',
      title: 'Faculty Incharge',
      signedAt: '2026-09-20T14:30:00.000Z',
      status: 'APPROVED',
    },
    hodApproval: null,
    dswApproval: null,
    rejectionReason: null,
  },
];

export const certificateService = {
  /**
   * Initialize or fetch all certificates
   */
  async getCertificates() {
    await simulateDelay(150);
    let certs = getFromStorage(CERTIFICATES_KEY);
    if (!certs || !Array.isArray(certs) || certs.length === 0) {
      saveToStorage(CERTIFICATES_KEY, INITIAL_CERTIFICATES);
      return INITIAL_CERTIFICATES;
    }
    return certs;
  },

  /**
   * Get certificate by ID
   */
  async getCertificateById(certId) {
    const certs = await this.getCertificates();
    return certs.find((c) => c.id === certId) || null;
  },

  /**
   * Get certificates for a student by studentId or email
   */
  async getCertificatesByStudent(studentId, studentEmail) {
    const certs = await this.getCertificates();
    return certs.filter(
      (c) =>
        c.studentId === studentId ||
        (studentEmail && c.studentEmail?.toLowerCase() === studentEmail.toLowerCase())
    );
  },

  /**
   * Get certificates assigned to Faculty Incharge
   */
  async getCertificatesByFaculty(facultyClubIds = []) {
    const certs = await this.getCertificates();
    return certs.filter((c) => facultyClubIds.includes(c.clubId));
  },

  /**
   * Get certificates for HOD
   */
  async getCertificatesByHod(departmentName) {
    const certs = await this.getCertificates();
    return certs.filter(
      (c) => !departmentName || c.department === departmentName || c.department === 'Central / Interdisciplinary'
    );
  },

  /**
   * Create a 3-student certificate batch
   */
  async createCertificateBatch({
    event,
    club,
    submittedByUser,
    studentEntries, // Array of exactly 3 objects: { studentId, studentName, studentEmail, position }
  }) {
    await simulateDelay(250);
    if (!studentEntries || studentEntries.length !== 3) {
      throw new Error('Exactly 3 student certificate entries are required for submission.');
    }

    const certs = await this.getCertificates();

    // Check duplicate registrations for student + event + position
    for (const entry of studentEntries) {
      const isDuplicate = certs.some(
        (c) =>
          c.eventId === event.id &&
          c.studentId === entry.studentId &&
          c.position === entry.position &&
          c.status !== CERTIFICATE_STATUS.REJECTED
      );
      if (isDuplicate) {
        throw new Error(
          `Certificate for ${entry.studentName} (${entry.position}) in "${event.title || event.name}" already exists.`
        );
      }
    }

    const batchId = `batch_${Date.now()}`;
    const newCertificates = studentEntries.map((entry, index) => {
      const certId = `cert_${Date.now()}_${index + 1}`;
      return {
        id: certId,
        batchId,
        studentId: entry.studentId,
        studentName: entry.studentName,
        studentEmail: entry.studentEmail,
        eventId: event.id,
        eventName: event.title || event.name,
        clubId: club.id,
        clubName: club.name,
        department: club.department || 'Computer Science',
        position: entry.position, // '1st Prize', '2nd Prize', '3rd Prize'
        eventDate: event.startDate ? event.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
        status: CERTIFICATE_STATUS.PENDING_FACULTY,
        submittedBy: {
          id: submittedByUser.id,
          name: submittedByUser.name,
          email: submittedByUser.email,
        },
        submittedAt: new Date().toISOString(),
        coordinatorSignature: {
          name: submittedByUser.name,
          title: 'Student Coordinator',
          signedAt: new Date().toISOString(),
        },
        facultyApproval: null,
        hodApproval: null,
        dswApproval: null,
        rejectionReason: null,
      };
    });

    const updatedList = [...newCertificates, ...certs];
    saveToStorage(CERTIFICATES_KEY, updatedList);
    return newCertificates;
  },

  /**
   * Approve a certificate in the workflow:
   * Faculty Incharge -> HOD -> DSW -> APPROVED
   */
  async approveCertificate(certId, currentUser) {
    await simulateDelay(250);
    const certs = await this.getCertificates();
    const index = certs.findIndex((c) => c.id === certId);
    if (index === -1) throw new Error('Certificate record not found.');

    const cert = certs[index];
    const timestamp = new Date().toISOString();

    if (currentUser.role === 'FACULTY_INCHARGE') {
      if (cert.status !== CERTIFICATE_STATUS.PENDING_FACULTY && cert.status !== CERTIFICATE_STATUS.REJECTED) {
        throw new Error('Certificate is not currently pending Faculty approval.');
      }
      certs[index] = {
        ...cert,
        status: CERTIFICATE_STATUS.PENDING_HOD,
        rejectionReason: null,
        facultyApproval: {
          approvedBy: currentUser.name,
          approvedById: currentUser.id,
          title: 'Faculty Incharge',
          signedAt: timestamp,
          status: 'APPROVED',
        },
      };
    } else if (currentUser.role === 'HOD') {
      if (cert.status !== CERTIFICATE_STATUS.PENDING_HOD) {
        throw new Error('Certificate is not currently pending HOD approval.');
      }
      certs[index] = {
        ...cert,
        status: CERTIFICATE_STATUS.PENDING_DSW,
        rejectionReason: null,
        hodApproval: {
          approvedBy: currentUser.name,
          approvedById: currentUser.id,
          title: 'Head of Department',
          signedAt: timestamp,
          status: 'APPROVED',
        },
      };
    } else if (currentUser.role === 'DSW') {
      if (cert.status !== CERTIFICATE_STATUS.PENDING_DSW) {
        throw new Error('Certificate is not currently pending DSW approval.');
      }
      certs[index] = {
        ...cert,
        status: CERTIFICATE_STATUS.APPROVED,
        rejectionReason: null,
        dswApproval: {
          approvedBy: currentUser.name,
          approvedById: currentUser.id,
          title: 'Dean Student Welfare',
          signedAt: timestamp,
          status: 'APPROVED',
        },
      };
    } else {
      throw new Error('User role is not authorized to approve certificates.');
    }

    saveToStorage(CERTIFICATES_KEY, certs);
    return certs[index];
  },

  /**
   * Reject a certificate with reason
   */
  async rejectCertificate(certId, currentUser, reason = 'Returned for revision') {
    await simulateDelay(250);
    const certs = await this.getCertificates();
    const index = certs.findIndex((c) => c.id === certId);
    if (index === -1) throw new Error('Certificate record not found.');

    const cert = certs[index];
    const timestamp = new Date().toISOString();

    certs[index] = {
      ...cert,
      status: CERTIFICATE_STATUS.REJECTED,
      rejectionReason: reason,
      rejectedAtStage: currentUser.role,
      rejectedBy: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        rejectedAt: timestamp,
      },
    };

    saveToStorage(CERTIFICATES_KEY, certs);
    return certs[index];
  },

  /**
   * Resubmit a rejected certificate
   */
  async resubmitCertificate(certId, updatedFields = {}) {
    await simulateDelay(250);
    const certs = await this.getCertificates();
    const index = certs.findIndex((c) => c.id === certId);
    if (index === -1) throw new Error('Certificate record not found.');

    certs[index] = {
      ...certs[index],
      ...updatedFields,
      status: CERTIFICATE_STATUS.PENDING_FACULTY,
      rejectionReason: null,
      rejectedAtStage: null,
      facultyApproval: null,
      hodApproval: null,
      dswApproval: null,
      submittedAt: new Date().toISOString(),
    };

    saveToStorage(CERTIFICATES_KEY, certs);
    return certs[index];
  },
};
