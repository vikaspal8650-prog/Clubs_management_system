import api from './api.js';

export const clubService = {
  /**
   * Save or update a club in PostgreSQL
   */
  async saveClub(clubData) {
    if (!clubData.name?.trim() || !clubData.department) {
      throw new Error('Club name and department are required.');
    }

    if (clubData.id) {
      return api.put(`/clubs/${clubData.id}`, clubData);
    } else {
      return api.post('/clubs', clubData);
    }
  },

  /**
   * Delete a club from PostgreSQL
   */
  async deleteClub(clubId) {
    return api.delete(`/clubs/${clubId}`);
  },

  /**
   * Get all registered clubs from PostgreSQL
   */
  async getClubs() {
    return api.get('/clubs');
  },

  /**
   * Get a club by ID from PostgreSQL
   */
  async getClubById(clubId) {
    return api.get(`/clubs/${clubId}`);
  },

  /**
   * Get clubs assigned to a specific faculty member
   */
  async getClubsByFaculty(facultyId) {
    const clubs = await this.getClubs();
    return clubs.filter((c) => c.facultyInchargeId === facultyId);
  },

  /**
   * Get clubs associated with a department
   */
  async getClubsByDepartment(departmentName) {
    const clubs = await this.getClubs();
    return clubs.filter(
      (c) => c.department === departmentName || (c.department && c.department.includes(departmentName))
    );
  },

  /**
   * Appoint a Student as Club Coordinator in PostgreSQL
   */
  async appointCoordinator(clubId, studentId) {
    return api.post(`/clubs/${clubId}/appoint-coordinator`, { studentId });
  },

  async joinClub(_userId, clubId) {
    return api.post(`/clubs/${clubId}/join`);
  },

  async removeCoordinator(clubId, studentId) {
    return api.delete(`/clubs/${clubId}/coordinators/${studentId}`);
  },
};
