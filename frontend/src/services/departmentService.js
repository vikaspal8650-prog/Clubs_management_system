import api from './api.js';

export const departmentService = {
  async getDepartments() {
    return api.get('/departments');
  },

  async saveDepartment(department) {
    return department.id ? api.put(`/departments/${department.id}`, department) : api.post('/departments', department);
  },

  async deleteDepartment(id) { return api.delete(`/departments/${id}`); },
};
