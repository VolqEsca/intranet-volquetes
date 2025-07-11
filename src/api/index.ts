import axios from 'axios';

// La URL base de nuestra API. Axios la usará para todas las peticiones.
const API_URL = 'https://intranet.volquetesescalante.com/api';

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ¡Crucial! Envía las cookies de sesión en cada petición.
});

// Esto es un "interceptor". Revisa todas las respuestas de la API.
// Si alguna vez recibe un error 401 (No Autorizado), automáticamente
// redirigirá al usuario a la página de login.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Borramos cualquier dato de sesión viejo que pudiera haber
      // (Esto lo usaremos más adelante en el AuthProvider)
      localStorage.removeItem('user'); 
      // Redirigimos al login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;