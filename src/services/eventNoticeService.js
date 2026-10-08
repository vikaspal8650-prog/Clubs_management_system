import { jsPDF } from 'jspdf';

export const generateEventNoticePdf = (event) => {
  const pdf = new jsPDF();
  const lines = [
    'CENTRALIZED CLUB MANAGEMENT SYSTEM',
    event.department || 'College Department',
    '', 'OFFICIAL EVENT NOTICE', '',
    `Event: ${event.title}`, `Club: ${event.clubName}`, `Status: OFFICIALLY DECLARED`,
    `Date: ${new Date(event.startDate || event.date).toLocaleDateString()}`,
    `Time: ${event.startTime || 'TBA'} - ${event.endTime || 'TBA'}`,
    `Venue: ${event.venue}`, `Expected participants: ${event.maxParticipants || event.capacity || 'TBA'}`,
    '', 'Description:', event.description || '—', '', 'Objective:', event.objective || '—',
    '', `Student Coordinator: ${event.submittedBy || '—'}`,
    `Faculty Incharge: ${event.approvedByFaculty || event.facultyInchargeName || '—'}`,
    `HOD Approval: ${event.approvedByHod || '—'}`,
    `Approved on: ${event.hodApprovedAt ? new Date(event.hodApprovedAt).toLocaleString() : '—'}`,
    '', `Generated: ${new Date().toLocaleString()}`,
  ];
  pdf.setFontSize(16); pdf.text(lines[0], 105, 20, { align: 'center' });
  pdf.setFontSize(12); pdf.text(lines[1], 105, 28, { align: 'center' });
  pdf.setLineWidth(0.5); pdf.line(20, 34, 190, 34);
  pdf.setFontSize(14); pdf.text('OFFICIAL EVENT NOTICE', 105, 44, { align: 'center' });
  pdf.setFontSize(10); const body = pdf.splitTextToSize(lines.slice(5).join('\n'), 165); pdf.text(body, 22, 56);
  return pdf;
};

export const downloadEventNotice = (event) => generateEventNoticePdf(event).save(`${event.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-notice.pdf`);
export const openEventNotice = (event) => window.open(generateEventNoticePdf(event).output('bloburl'), '_blank', 'noopener,noreferrer');
