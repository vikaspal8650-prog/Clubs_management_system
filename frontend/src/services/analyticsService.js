import api from './api';

export const analyticsService = {
  async getEventParticipation() {
    const response = await api.get('/analytics/event-participation');
    return Array.isArray(response?.data)
      ? response.data.map((event) => ({ id: event.id, name: event.name, count: Number(event.registered) || 0 }))
      : [];
  },
  async getClubMembership() {
    const response = await api.get('/analytics/club-membership');
    return Array.isArray(response?.data)
      ? response.data.map((club) => ({ id: club.id, name: club.name, count: Number(club.count) || 0 }))
      : [];
  },
};
