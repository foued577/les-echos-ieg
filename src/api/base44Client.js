import localDb from '@/services/localDb';

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV;

// Export the appropriate client based on environment
export const base44 = isDevelopment ? localDb : {
  // In production, return empty object to force API usage
  // Components should use the real API services instead
  teams: { getAll: () => Promise.resolve([]) },
  contents: { getAll: () => Promise.resolve([]) },
  rubriques: { getAll: () => Promise.resolve([]) },
  auth: { 
    me: () => Promise.reject(new Error('Auth should use real API in production'))
  },
  integrations: {
    Core: {
      UploadFile: () => Promise.reject(new Error('Upload should use real API in production'))
    }
  }
};
