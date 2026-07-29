import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Nécessaire pour envoyer/recevoir le cookie httpOnly de refresh token
  withCredentials: true,
});

// Intercepteur : injecte automatiquement l'access token dans chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('construction_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Déconnexion locale + redirection vers la page de connexion
function forceLogout() {
  localStorage.removeItem('construction_token');
  localStorage.removeItem('construction_user');
  if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
    window.location.href = '/login';
  }
}

// Intercepteur de réponse : sur 401, tente un renouvellement via le refresh token (cookie httpOnly),
// puis rejoue la requête d'origine une seule fois. En cas d'échec, déconnexion forcée.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url: string = original?.url || '';

    // Ne pas boucler sur les routes d'auth elles-mêmes
    const isAuthRoute = url.includes('/auth/refresh') || url.includes('/auth/login');

    if (status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        const { data } = await api.post('/auth/refresh');
        if (data?.token) {
          localStorage.setItem('construction_token', data.token);
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${data.token}`;
          return api(original);
        }
      } catch {
        // le refresh a échoué : on tombe en déconnexion ci-dessous
      }
      forceLogout();
    } else if (status === 401 && !isAuthRoute) {
      forceLogout();
    }

    return Promise.reject(error);
  }
);

export default api;
