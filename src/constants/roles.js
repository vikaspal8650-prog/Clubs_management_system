/**
 * Application Authentication Roles
 * 
 * Core Roles:
 * - DSW: Dean Student Welfare (Highest administrative level)
 * - HOD: Head of Department (Department level approvals)
 * - FACULTY_INCHARGE: Faculty member managing specific clubs
 * - STUDENT: Registered university student
 * 
 * Note: 'Club Coordinator' is a STUDENT with assigned coordinator permissions for a specific club,
 * NOT a separate authentication role.
 */

export const ROLES = {
  DSW: 'DSW',
  HOD: 'HOD',
  FACULTY_INCHARGE: 'FACULTY_INCHARGE',
  STUDENT: 'STUDENT',
};

export const ROLE_LABELS = {
  [ROLES.DSW]: 'Dean Student Welfare (DSW)',
  [ROLES.HOD]: 'Head of Department (HOD)',
  [ROLES.FACULTY_INCHARGE]: 'Faculty Incharge',
  [ROLES.STUDENT]: 'Student',
};

export const ROLE_ROUTES = {
  [ROLES.DSW]: '/dsw',
  [ROLES.HOD]: '/hod',
  [ROLES.FACULTY_INCHARGE]: '/faculty',
  [ROLES.STUDENT]: '/student',
};

export const ROLE_DESCRIPTIONS = {
  [ROLES.DSW]: 'Central administrative oversight, faculty/HOD management & event audit',
  [ROLES.HOD]: 'Departmental approval, club event reviews & branch coordination',
  [ROLES.FACULTY_INCHARGE]: 'Club governance, student coordinator appointments & event proposals',
  [ROLES.STUDENT]: 'Self-registration, club participation, event registration & attendance',
};
