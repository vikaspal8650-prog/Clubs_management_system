import api, { saveToStorage, STORAGE_KEYS } from './api.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const userService = {
  /**
   * Get all registered users from PostgreSQL backend
   */
  async getAllUsers() {
    return api.get('/users');
  },

  async getUsers() {
    return this.getAllUsers();
  },

  /**
   * Get staff accounts (HOD & Faculty) from PostgreSQL
   */
  async getStaffAccounts() {
    return api.get('/users/staff');
  },

  /**
   * Get dynamic user statistics from PostgreSQL
   */
  async getUserStats() {
    return api.get('/users/stats');
  },

  /**
   * Create an HOD Account (By DSW) in PostgreSQL
   */
  async createHodAccount(hodData) {
    const { name, email, password, department } = hodData;
    if (!name || !name.trim()) throw new Error('Full Name is required.');
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) throw new Error('College Email is required.');
    if (!EMAIL_REGEX.test(cleanEmail)) throw new Error('Please enter a valid email address.');
    if (!department || !department.trim()) throw new Error('Department is required.');
    if (!password) throw new Error('Password is required.');
    if (password.length < 6) throw new Error('Password must be at least 6 characters long.');

    return api.post('/users/hod', {
      name: name.trim(),
      email: cleanEmail,
      password,
      department: department.trim(),
    });
  },

  /**
   * Create a Faculty Incharge Account (By DSW) in PostgreSQL
   */
  async createFacultyAccount(facultyData) {
    const { name, email, password, department, clubIds } = facultyData;
    if (!name || !name.trim()) throw new Error('Full Name is required.');
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) throw new Error('College Email is required.');
    if (!EMAIL_REGEX.test(cleanEmail)) throw new Error('Please enter a valid email address.');
    if (!department || !department.trim()) throw new Error('Department is required.');
    if (!password) throw new Error('Password is required.');
    if (password.length < 6) throw new Error('Password must be at least 6 characters long.');

    return api.post('/users/faculty', {
      name: name.trim(),
      email: cleanEmail,
      password,
      department: department.trim(),
      clubIds,
    });
  },

  /**
   * Delete Staff Account (HOD or Faculty Incharge) from PostgreSQL
   */
  async deleteUser(userId) {
    return api.delete(`/users/${userId}`);
  },

  async deleteHodAccount(userId) {
    return this.deleteUser(userId);
  },

  async deleteFacultyAccount(userId) {
    return this.deleteUser(userId);
  },

  /**
   * Get all registered students from PostgreSQL
   */
  async getStudents() {
    const users = await this.getAllUsers();
    return users.filter((u) => u.role === 'STUDENT');
  },

  /**
   * Get department students from PostgreSQL
   */
  async getDepartmentStudents() {
    return api.get('/users/department-students');
  },

  /**
   * Delete student account from PostgreSQL
   */
  async deleteStudent(studentId) {
    return api.delete(`/users/students/${studentId}`);
  },

  /**
   * Update student profile in PostgreSQL
   */
  async updateStudentProfile(profileData, authenticatedUser) {
    const { name, email, rollNumber, department, branch, year, semester } = profileData;

    if (!name || !name.trim()) throw new Error('Full Name is required.');
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) throw new Error('College Email is required.');
    if (!EMAIL_REGEX.test(cleanEmail)) throw new Error('Please enter a valid email address.');

    const cleanRollNumber = (rollNumber || '').trim();
    if (!cleanRollNumber) throw new Error('Roll Number is required.');

    const cleanDept = (department || branch || '').trim();
    if (!cleanDept) throw new Error('Academic Department / Branch is required.');

    const result = await api.put('/users/profile', {
      name: name.trim(),
      email: cleanEmail,
      rollNumber: cleanRollNumber,
      department: cleanDept,
      branch: cleanDept,
      year: year ? year.trim() : undefined,
      semester: semester ? semester.trim() : undefined,
    });

    if (result && result.user && authenticatedUser) {
      saveToStorage(STORAGE_KEYS.CURRENT_USER, { ...authenticatedUser, ...result.user });
    }

    return result.user || result;
  },
};
