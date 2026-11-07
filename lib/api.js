import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const healthAPI = {
  check: async () => {
    try {
      const response = await apiClient.get('/api/health');
      return response.data;
    } catch (err) {
      return {
        status: 'unreachable',
        error: err.message,
        activeSockets: 0,
        activeRooms: 0,
      };
    }
  },
};

export const roomsAPI = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/api/rooms', { params });
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/api/rooms/stats');
    return response.data;
  },

  getById: async (roomId) => {
    const response = await apiClient.get(`/api/rooms/${roomId}`);
    return response.data;
  },

  create: async (roomData) => {
    const response = await apiClient.post('/api/rooms', roomData);
    return response.data;
  },

  delete: async (roomId) => {
    const response = await apiClient.delete(`/api/rooms/${roomId}`);
    return response.data;
  },

  getPresence: async (roomId) => {
    const response = await apiClient.get(`/api/rooms/${roomId}/presence`);
    return response.data;
  },
};

export const documentAPI = {
  get: async (roomId) => {
    const response = await apiClient.get(`/api/rooms/${roomId}/document`);
    return response.data;
  },

  update: async (roomId, content, changeType = 'edit', author = 'Anonymous') => {
    const response = await apiClient.put(`/api/rooms/${roomId}/document`, {
      content,
      changeType,
      author,
    });
    return response.data;
  },

  getHistory: async (roomId) => {
    const response = await apiClient.get(`/api/rooms/${roomId}/document/history`);
    return response.data;
  },
};

export const messagesAPI = {
  get: async (roomId, params = {}) => {
    const response = await apiClient.get(`/api/rooms/${roomId}/messages`, { params });
    return response.data;
  },

  send: async (roomId, { sender, content, messageType = 'text' }) => {
    const response = await apiClient.post(`/api/rooms/${roomId}/messages`, {
      sender,
      content,
      messageType,
    });
    return response.data;
  },
};

export default apiClient;
