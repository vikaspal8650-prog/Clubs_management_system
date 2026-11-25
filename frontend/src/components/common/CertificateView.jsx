import React, { useRef } from 'react';
import { Award, CheckCircle2, Clock, Download, Printer, ShieldAlert, Sparkles } from 'lucide-react';
import { Badge } from './Badge';
import { Button } from './Button';
import './CertificateView.css';

export const CertificateView = ({
  certificate,
  onClose,
  showActions = true,
  onApprove,
  onReject,
  canApprove = false,
  currentUserRole = null,
}) => {
  const printRef = useRef(null);

  if (!certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  // Format position nicely: '1st Prize' -> '1st prize'
  const formattedPosition = certificate.position
    ? certificate.position.toLowerCase()
    : 'merit position';

  // Format date nicely
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approved / Final Certificate</Badge>;
      case 'PENDING_FACULTY_APPROVAL':
        return <Badge variant="warning">Pending Faculty Approval</Badge>;
      case 'PENDING_HOD_APPROVAL':
        return <Badge variant="purple">Pending HOD Approval</Badge>;
      case 'PENDING_DSW_APPROVAL':
        return <Badge variant="info">Pending DSW Approval</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Returned / Rejected</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="cert-modal-backdrop" onClick={onClose}>
      <div className="cert-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Top Control Bar */}
        <div className="cert-modal-header no-print">
          <div className="cert-modal-header__info">
            <h3 className="cert-modal-header__title">Official Institutional Certificate</h3>
            {getStatusBadge(certificate.status)}
          </div>
          <div className="cert-modal-header__actions">
            {showActions && (
              <>
                <Button variant="secondary" size="sm" onClick={handlePrint}>
                  <Printer size={16} /> Print / Save PDF
                </Button>
              </>
            )}
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>

        {/* Rejection Alert if rejected */}
        {certificate.status === 'REJECTED' && certificate.rejectionReason && (
          <div className="cert-rejection-banner no-print">
            <ShieldAlert size={20} className="cert-rejection-icon" />
            <div>
              <strong>Returned by {certificate.rejectedAtStage || 'Reviewer'}:</strong>{' '}
              {certificate.rejectionReason}
            </div>
          </div>
        )}

        {/* Certificate Container to Print */}
        <div className="cert-paper-wrapper" ref={printRef}>
          <div className="cert-paper">
            {/* Outer Decorative Dual Border Frame */}
            <div className="cert-border-outer">
              <div className="cert-border-inner">
                {/* Corner Ornaments */}
                <div className="cert-corner cert-corner--tl" />
                <div className="cert-corner cert-corner--tr" />
                <div className="cert-corner cert-corner--bl" />
                <div className="cert-corner cert-corner--br" />

                {/* Left Club Badge Element */}
                <div className="cert-club-emblem">
                  <div className="cert-emblem-circle">
                    <Sparkles size={24} color="#1e3a8a" />
                  </div>
                  <span className="cert-emblem-label">{certificate.clubName || 'College Club'}</span>
                </div>

                {/* Right Gold Medal / Seal Element */}
                <div className="cert-gold-seal">
                  <div className="cert-seal-outer">
                    <Award size={36} color="#d97706" />
                    <span className="cert-seal-text">OFFICIAL MERIT</span>
                  </div>
                </div>

                {/* Header Section */}
                <div className="cert-header">
                  <div className="cert-institution-logo">
                    <div className="srms-logo-circle">
                      <span className="srms-logo-letters">SRMS</span>
                    </div>
                  </div>
                  <h1 className="cert-college-title">
                    SHRI RAM MURTI SMARAK COLLEGE OF ENGINEERING & TECHNOLOGY
                  </h1>
                  <p className="cert-college-location">BAREILLY (U.P.) INDIA</p>
                  <p className="cert-department-tag">
                    ({certificate.department ? (certificate.department.startsWith('Department') ? certificate.department : `Department of ${certificate.department}`) : 'Department of Computer Science & Engineering'})
                  </p>
                </div>

                {/* Title Section */}
                <div className="cert-title-block">
                  <h2 className="cert-main-title">CERTIFICATE</h2>
                  <div className="cert-subtitle">Of Merit</div>
                </div>

                {/* Certificate Body Text */}
                <div className="cert-body">
                  <p className="cert-text">
                    This certificate is presented to <span className="cert-student-name">{certificate.studentName}</span>
                    <br />
                    for winning the <span className="cert-highlight">{certificate.position || '1st Prize'}</span> in{' '}
                    <span className="cert-highlight">{certificate.eventName}</span>
                    <br />
                    organized by <span className="cert-highlight">{certificate.clubName}</span> of
                    <br />
                    Shri Ram Murti Smarak College of Engineering & Technology,
                    <br />
                    Bareilly (U.P.) India on <span className="cert-highlight">{formatDate(certificate.eventDate)}</span>
                  </p>
                </div>

                {/* Signatures Section (4 Signatures) */}
                <div className="cert-signatures-grid">
                  {/* 1. Student Coordinator */}
                  <div className="cert-sig-box">
                    <div className="cert-sig-space">
                      {certificate.coordinatorSignature ? (
                        <div className="cert-sig-stamped">
                          <span className="cert-sig-script">
                            {certificate.coordinatorSignature.name || 'Coordinator'}
                          </span>
                          <CheckCircle2 size={16} className="cert-sig-check" />
                        </div>
                      ) : (
                        <span className="cert-sig-pending">Pending</span>
                      )}
                    </div>
                    <div className="cert-sig-line" />
                    <div className="cert-sig-name">
                      {certificate.coordinatorSignature?.name || certificate.submittedBy?.name || 'Student Coordinator'}
                    </div>
                    <div className="cert-sig-title">Student Coordinator</div>
                  </div>

                  {/* 2. Faculty Incharge */}
                  <div className="cert-sig-box">
                    <div className="cert-sig-space">
                      {certificate.facultyApproval?.status === 'APPROVED' ? (
                        <div className="cert-sig-stamped">
                          <span className="cert-sig-script">
                            {certificate.facultyApproval.approvedBy}
                          </span>
                          <CheckCircle2 size={16} className="cert-sig-check" />
                        </div>
                      ) : (
                        <div className="cert-sig-pending-badge">
                          <Clock size={12} /> Pending Faculty
                        </div>
                      )}
                    </div>
                    <div className="cert-sig-line" />
                    <div className="cert-sig-name">
                      {certificate.facultyApproval?.approvedBy || 'Faculty Incharge'}
                    </div>
                    <div className="cert-sig-title">Faculty Incharge</div>
                  </div>

                  {/* 3. Head of Department */}
                  <div className="cert-sig-box">
                    <div className="cert-sig-space">
                      {certificate.hodApproval?.status === 'APPROVED' ? (
                        <div className="cert-sig-stamped">
                          <span className="cert-sig-script">
                            {certificate.hodApproval.approvedBy}
                          </span>
                          <CheckCircle2 size={16} className="cert-sig-check" />
                        </div>
                      ) : (
                        <div className="cert-sig-pending-badge">
                          <Clock size={12} /> Pending HOD
                        </div>
                      )}
                    </div>
                    <div className="cert-sig-line" />
                    <div className="cert-sig-name">
                      {certificate.hodApproval?.approvedBy || 'Dr. Ramesh Sharma'}
                    </div>
                    <div className="cert-sig-title">Head of Department</div>
                  </div>

                  {/* 4. Dean Student Welfare (DSW) */}
                  <div className="cert-sig-box">
                    <div className="cert-sig-space">
                      {certificate.dswApproval?.status === 'APPROVED' ? (
                        <div className="cert-sig-stamped">
                          <span className="cert-sig-script">
                            {certificate.dswApproval.approvedBy}
                          </span>
                          <CheckCircle2 size={16} className="cert-sig-check" />
                        </div>
                      ) : (
                        <div className="cert-sig-pending-badge">
                          <Clock size={12} /> Pending DSW
                        </div>
                      )}
                    </div>
                    <div className="cert-sig-line" />
                    <div className="cert-sig-name">
                      {certificate.dswApproval?.approvedBy || 'Dr. Saurabh Gupta'}
                    </div>
                    <div className="cert-sig-title">Dean Student Welfare</div>
                  </div>
                </div>

                {/* Footer Curved Accent Design */}
                <div className="cert-footer-wave">
                  <div className="cert-wave-bar" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Review Action Buttons if user can approve */}
        {canApprove && (
          <div className="cert-review-footer no-print">
            <div className="cert-review-instruction">
              Reviewing as <strong>{currentUserRole}</strong>. Verify student name, event, and position details.
            </div>
            <div className="cert-review-buttons">
              <Button variant="danger" onClick={() => onReject(certificate)}>
                Reject & Return
              </Button>
              <Button variant="success" onClick={() => onApprove(certificate)}>
                Approve Certificate Signature
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
