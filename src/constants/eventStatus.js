/**
 * Event Lifecycle & Approval Status Constants
 * 
 * Workflow concept:
 * Club Coordinator (Student) -> Faculty Incharge -> HOD -> Approved
 * Rejections loop back for revision.
 * DSW has override authority to reject/override even after HOD approval.
 */

export const EVENT_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_FACULTY: 'PENDING_FACULTY',
  PENDING_HOD: 'PENDING_HOD',
  APPROVED: 'APPROVED',
  REJECTED_BY_FACULTY: 'REJECTED_BY_FACULTY',
  REJECTED_BY_HOD: 'REJECTED_BY_HOD',
  OVERRIDDEN_BY_DSW: 'OVERRIDDEN_BY_DSW',
};

export const EVENT_STATUS_LABELS = {
  [EVENT_STATUS.DRAFT]: 'Draft Proposal',
  [EVENT_STATUS.PENDING_FACULTY]: 'Pending Faculty Approval',
  [EVENT_STATUS.PENDING_HOD]: 'Pending HOD Approval',
  [EVENT_STATUS.APPROVED]: 'Approved & Published',
  [EVENT_STATUS.REJECTED_BY_FACULTY]: 'Returned by Faculty',
  [EVENT_STATUS.REJECTED_BY_HOD]: 'Returned by HOD',
  [EVENT_STATUS.OVERRIDDEN_BY_DSW]: 'Overridden / Rejected by DSW',
};

export const EVENT_STATUS_VARIANTS = {
  [EVENT_STATUS.DRAFT]: 'neutral',
  [EVENT_STATUS.PENDING_FACULTY]: 'warning',
  [EVENT_STATUS.PENDING_HOD]: 'info',
  [EVENT_STATUS.APPROVED]: 'success',
  [EVENT_STATUS.REJECTED_BY_FACULTY]: 'danger',
  [EVENT_STATUS.REJECTED_BY_HOD]: 'danger',
  [EVENT_STATUS.OVERRIDDEN_BY_DSW]: 'danger',
};
