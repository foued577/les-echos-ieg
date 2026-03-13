import axios from 'axios';

// Séparation des URLs pour API et fichiers
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Force le bon domaine en production (patch temporaire)
export const APP_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '') || 
  (window.location.hostname.includes('les-echos-ieg.onrender.com') 
    ? 'https://les-echos-ieg-api.onrender.com' 
    : 'http://localhost:5000');

// Helper pour construire les URLs de fichiers
export const buildFileUrl = (filePath) => {
  if (!filePath) return '';
  if (filePath.startsWith('http')) return filePath;
  return `${APP_BASE_URL}${filePath.startsWith('/') ? filePath : `/${filePath}`}`;
};

// Créer une instance axios avec configuration de base
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs 401 (token expiré)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('currentUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentification
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

// Utilisateurs
export const usersAPI = {
  getAll: async () => {
    const response = await api.get('/test/users');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  create: async (userData) => {
    const response = await api.post('/test/users', userData);
    return response.data;
  },
  
  update: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};

// Normalisation des réponses API pour gérer différents formats
export const normalizeTeam = (data) => data?.team ?? data; // support {team: {...}} ou {...}

// Équipes
export const teamsAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/teams');
      console.log('🔍 Teams API raw response:', response.data);
      
      // Backend renvoie {success: true, data: [...]}
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data.map(normalizeTeam);
      }
      
      // Support si backend renvoie {teams:[...]} ou [...]
      const arr = response.data?.teams ?? response.data;
      return Array.isArray(arr) ? arr.map(normalizeTeam) : [];
    } catch (error) {
      throw error;
    }
  },
  
  getWithCounts: async () => {
    try {
      const response = await api.get('/test/test-summary');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getTeamMembers: async (teamId) => {
    try {
      const response = await api.get(`/test/${teamId}/members`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  addTeamMember: async (teamId, userId, role = 'member') => {
    try {
      const response = await api.post(`/test/${teamId}/members`, {
        user_id: userId,
        role: role
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  removeTeamMember: async (teamId, memberId) => {
    try {
      const response = await api.delete(`/test/${teamId}/members/${memberId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getUsers: async () => {
    try {
      const response = await api.get('/test/users');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      console.log('🔍=== API CALL DEBUG ===');
      console.log('🔍 teamsAPI.getById called with ID:', id);
      console.log('🔍 ID type:', typeof id);
      console.log('🔍 ID is null/undefined:', id === null || id === undefined);
      console.log('🔍 Full URL will be:', `/teams/${id}`);
      
      // 🔥 GUARD STRICT - interdire l'appel si ID falsy
      if (!id) {
        console.error('🚫 CRITICAL: teamsAPI.getById called with falsy ID!');
        console.error('🚫 This would cause GET /api 404 error!');
        throw new Error('Team ID is required for getById');
      }
      
      const response = await api.get(`/teams/${id}`);
      return normalizeTeam(response.data);
    } catch (error) {
      console.error('🔥 teamsAPI.getById error:', error);
      throw error;
    }
  },
  
  getTeamContents: async (teamId, params = {}) => {
    const response = await api.get(`/teams/${teamId}/contents`, { params });
    return response.data;
  },
  
  create: async (teamData) => {
    const response = await api.post('/teams', teamData);
    return response.data;
  },
  
  update: async (id, teamData) => {
    const response = await api.put(`/teams/${id}`, teamData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/teams/${id}`);
    return response.data;
  }
};

// Rubriques
export const rubriquesAPI = {
  getAll: async () => {
    const response = await api.get('/rubriques');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/rubriques/${id}`);
    return response.data;
  },
  
  create: async (rubriqueData) => {
    const response = await api.post('/rubriques', rubriqueData);
    return response.data;
  },
  
  update: async (id, rubriqueData) => {
    const response = await api.put(`/rubriques/${id}`, rubriqueData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/rubriques/${id}`);
    return response.data;
  }
};

// Contenus
export const contentsAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/contents?${params}`);
    return response.data;
  },
  
  getMy: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/contents/mine?${params}`);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/contents/${id}`);
    return response.data;
  },
  
  create: async (contentData) => {
    const response = await api.post('/contents', contentData);
    return response.data;
  },
  
  createWithFile: async (formData) => {
    const response = await api.post('/contents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  update: async (id, contentData) => {
    const response = await api.put(`/contents/${id}`, contentData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/contents/${id}`);
    return response.data;
  }
};

export default api;
