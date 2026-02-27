import api from './api';

export interface ProfileViewStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  recentViews: {
    id: string;
    clientId: string;
    professionalId: string;
    viewedAt: string;
  }[];
}

const profileViewService = {
  /**
   * Track a profile view (called when client views professional profile)
   */
  trackView: async (professionalId: string): Promise<void> => {
    try {
      await api.post('/profile-views', { professionalId });
    } catch (error: any) {
      console.error('Error tracking profile view:', error);
      // Don't throw - view tracking shouldn't block user experience
    }
  },

  /**
   * Get profile view statistics for the logged-in professional
   */
  getMyViews: async (): Promise<ProfileViewStats> => {
    const response = await api.get('/profile-views/my-views');
    return response.data;
  },
};

export default profileViewService;
