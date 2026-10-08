import api, { saveToStorage, STORAGE_KEYS } from './api.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_SEMESTERS_BY_YEAR = {
  '1st Year': ['Semester 1', 'Semester 2'],
  '2nd Year': ['Semester 3', 'Semester 4'],
  '3rd Year': ['Semester 5', 'Semester 6'],
  '4th Year': ['Semester 7', 'Semester 8'],
};

export const authService = {
  /**
   * Authenticate user via backend REST API -> PostgreSQL
   */
  async login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail) throw new Error('Please enter your college email address.');
    if (!cleanPassword) throw new Error('Please enter your password.');
    if (!EMAIL_REGEX.test(cleanEmail)) throw new Error('Please enter a valid email address.');

    const res = await api.post('/auth/login', { email: cleanEmail, password: cleanPassword });
    if (res.token) {
      saveToStorage('ccms_token_v1', res.token);
    }
    if (res.user) {
      saveToStorage(STORAGE_KEYS.CURRENT_USER, res.user);
    }
    return res.user;
  },

  /**
   * Student Registration via backend REST API -> PostgreSQL
   */
  async registerStudent(studentData) {
    const {
      name,
      email,
      rollNumber,
      branch,
      year,
      semester,
      password,
      confirmPassword,
    } = studentData;

    if (!name || !name.trim()) throw new Error('Full Name is required.');
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) throw new Error('College Email is required.');
    if (!EMAIL_REGEX.test(cleanEmail)) throw new Error('Please provide a valid college email address.');

    const cleanRollNumber = (rollNumber || '').trim();
    if (!cleanRollNumber) throw new Error('Roll Number is required.');
    if (!/^\d{10,15}$/.test(cleanRollNumber)) {
      throw new Error('Roll number must consist of 10 to 15 digits only.');
    }

    if (!branch || !branch.trim()) throw new Error('Please select your academic branch.');
    if (!year || !year.trim()) throw new Error('Please select your academic year.');
    if (!semester || !semester.trim()) throw new Error('Please select your current semester.');

    const validSems = VALID_SEMESTERS_BY_YEAR[year.trim()];
    if (validSems && !validSems.includes(semester.trim())) {
      throw new Error(`Invalid semester (${semester}) selected for ${year}.`);
    }

    if (!password) throw new Error('Password is required.');
    if (password.length < 8) throw new Error('Password must be at least 8 characters long.');
    if (!/[a-z]/.test(password)) throw new Error('Password must contain at least one lowercase letter.');
    if (!/[0-9]/.test(password)) throw new Error('Password must contain at least one number.');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new Error('Password must contain at least one special symbol (e.g. @, #, $, !).');
    }
    if (password !== confirmPassword) throw new Error('Password and confirmation password do not match.');

    const res = await api.post('/auth/register', {
      name: name.trim(),
      email: cleanEmail,
      rollNumber: cleanRollNumber,
      branch: branch.trim(),
      year: year.trim(),
      semester: semester.trim(),
      password,
    });

    if (res.token) {
      saveToStorage('ccms_token_v1', res.token);
    }
    if (res.user) {
      saveToStorage(STORAGE_KEYS.CURRENT_USER, res.user);
    }
    return res.user;
  },

  /**
   * Get current authenticated user session
   */
  async fetchCurrentUser() {
    try {
      const user = await api.get('/auth/me');
      if (user) {
        saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
        return user;
      }
    } catch (err) {
      // A cached profile must never grant access when the server session is invalid.
      return null;
    }
  },

  getCurrentUser() {
    return null;
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      await api.post('/auth/logout', {});
    } catch (e) {
      // Ignore network errors on logout
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem('ccms_token_v1');
    }
  },

  /**
   * Demo role switcher via backend API -> PostgreSQL
   */
  async switchRoleDemo(role) {
    const res = await api.post('/auth/switch-role', { role });
    if (res.token) {
      saveToStorage('ccms_token_v1', res.token);
    }
    if (res.user) {
      saveToStorage(STORAGE_KEYS.CURRENT_USER, res.user);
    }
    return res.user;
  },
};
