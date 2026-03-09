import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// (optionnel) token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token"); // ← Corrigé : 'auth_token' au lieu de 'token'
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
